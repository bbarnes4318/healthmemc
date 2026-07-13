import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Find all medical records flagged as critical or urgent that haven't been reviewed
    const flaggedRecords = await sr.entities.MedicalRecord.filter({
      priority: { $in: ["critical", "urgent"] },
      review_status: { $in: ["pending", "flagged"] },
    });

    if (flaggedRecords.length === 0) {
      return Response.json({ status: "success", message: "No critical records found", alerts_sent: 0 });
    }

    // Group by user (created_by_id)
    const byUser = {};
    flaggedRecords.forEach((r) => {
      const uid = r.created_by_id;
      if (!byUser[uid]) byUser[uid] = [];
      byUser[uid].push(r);
    });

    let alertsSent = 0;
    for (const [userId, records] of Object.entries(byUser)) {
      try {
        // Get user info for email
        const users = await sr.entities.User.filter({ id: userId });
        const user = users[0];
        if (!user || !user.email) continue;

        const criticalCount = records.filter((r) => r.priority === "critical").length;
        const urgentCount = records.filter((r) => r.priority === "urgent").length;

        const recordList = records.map((r, i) =>
          `${i + 1}. ${r.title} (${r.category?.replace(/_/g, " ") || "general"})\n   Priority: ${r.priority.toUpperCase()}\n   Date: ${r.date || "N/A"}\n   Provider: ${r.provider || "N/A"}${r.flagged_reason ? `\n   Reason: ${r.flagged_reason}` : ""}`
        ).join("\n\n");

        const emailBody = `Dear ${user.full_name || "Patient"},\n\nThis is an automated alert from Health Me Medical Center.\n\nYou have ${records.length} medical record(s) that require immediate review:\n\n${recordList}\n\n${criticalCount > 0 ? `⚠️ ${criticalCount} record(s) are marked as CRITICAL.\n` : ""}${urgentCount > 0 ? `📋 ${urgentCount} record(s) are marked as URGENT.\n` : ""}Please log in to your Health Me Medical Center account and review these records promptly. If any record contains lab results or findings that concern you, please contact your healthcare provider immediately.\n\nThis is an automated notification. Do not reply to this email.\n\nHealth Me Medical Center`;

        await sr.integrations.Core.SendEmail({
          to: user.email,
          subject: `${criticalCount > 0 ? "🚨 CRITICAL" : "📋 URGENT"} — Medical Records Require Your Review`,
          body: emailBody,
        });

        // Mark records as flagged (alert sent)
        const recordIds = records.map((r) => r.id);
        for (const rid of recordIds) {
          await sr.entities.MedicalRecord.update(rid, { review_status: "flagged" });
        }

        alertsSent++;
      } catch (userErr) {
        console.error(`Error sending alert to user ${userId}:`, userErr);
      }
    }

    return Response.json({ status: "success", alerts_sent: alertsSent, total_records: flaggedRecords.length });
  } catch (error) {
    console.error("Critical records check error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});