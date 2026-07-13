import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled workflow function — no user context, use service role directly

    // Fetch all claims that have a resolution status (approved, partially_paid, paid, denied)
    const allClaims = await base44.asServiceRole.entities.InsuranceClaim.list('-service_date', 500);

    // Find claims where status changed from a pending state to a resolved state
    // and the user hasn't been notified yet (last_notified_status != current status)
    const resolvedStatuses = ["approved", "partially_paid", "paid", "denied"];

    const changedClaims = allClaims.filter((claim) => {
      if (!resolvedStatuses.includes(claim.status)) return false;
      // Notify if last_notified_status is different from current status
      // (this covers both first-time resolution and subsequent status changes)
      return claim.last_notified_status !== claim.status;
    });

    if (changedClaims.length === 0) {
      return Response.json({ checked: allClaims.length, notified: 0, message: "No claim status changes detected" });
    }

    // Group by user
    const byUser = {};
    for (const claim of changedClaims) {
      const userId = claim.created_by_id;
      if (!userId) continue;
      if (!byUser[userId]) byUser[userId] = [];
      byUser[userId].push(claim);
    }

    const results = [];

    for (const userId of Object.keys(byUser)) {
      try {
        const user = await base44.asServiceRole.entities.User.get(userId);
        if (!user || !user.email) {
          // Still mark as notified to avoid re-checking
          for (const claim of byUser[userId]) {
            await base44.asServiceRole.entities.InsuranceClaim.update(claim.id, { last_notified_status: claim.status });
          }
          continue;
        }

        const userClaims = byUser[userId];
        const emailBody = buildEmailBody(user, userClaims);
        const hasDenied = userClaims.some((c) => c.status === "denied");
        const hasApproved = userClaims.some((c) => ["approved", "partially_paid", "paid"].includes(c.status));

        const subject = hasDenied
          ? `Insurance Claim Update: ${userClaims.length} claim${userClaims.length !== 1 ? "s" : ""} with status changes (includes denial)`
          : `Insurance Claim Approved: ${userClaims.length} claim${userClaims.length !== 1 ? "s" : ""} updated`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject,
          body: emailBody,
        });

        // Mark all as notified
        for (const claim of userClaims) {
          await base44.asServiceRole.entities.InsuranceClaim.update(claim.id, { last_notified_status: claim.status });
        }

        results.push({ user: user.email, count: userClaims.length });
      } catch (err) {
        console.error(`Failed to notify user ${userId}:`, err.message);
      }
    }

    return Response.json({
      checked: allClaims.length,
      changed: changedClaims.length,
      notified: results.length,
      results,
    });
  } catch (error) {
    console.error('checkClaimStatusChanges error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildEmailBody(user, claims) {
  const statusLabels = {
    approved: "✅ Approved",
    partially_paid: "🟣 Partially Paid",
    paid: "💚 Paid",
    denied: "❌ Denied",
  };

  let body = `<h2>Insurance Claim Status Update</h2>`;
  body += `<p>Hello ${user.full_name || 'there'},</p>`;
  body += `<p>This is an automated notification from Health Me Medical Center. The following insurance claim${claims.length !== 1 ? 's have' : ' has'} had a status change:</p>`;
  body += `<table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:14px;">`;
  body += `<tr style="background:#f0f9ff;"><th style="padding:8px;border:1px solid #ddd;text-align:left;">Service</th><th style="padding:8px;border:1px solid #ddd;text-align:left;">Date</th><th style="padding:8px;border:1px solid #ddd;text-align:left;">Provider</th><th style="padding:8px;border:1px solid #ddd;text-align:left;">Billed</th><th style="padding:8px;border:1px solid #ddd;text-align:left;">Your Cost</th><th style="padding:8px;border:1px solid #ddd;text-align:left;">New Status</th></tr>`;

  claims.forEach((claim) => {
    const statusLabel = statusLabels[claim.status] || claim.status;
    const statusColor = claim.status === "denied" ? "#ef4444" : claim.status === "paid" ? "#22c55e" : claim.status === "approved" ? "#22c55e" : "#a855f7";
    body += `<tr>`;
    body += `<td style="padding:8px;border:1px solid #ddd;">${claim.service_description || 'N/A'}</td>`;
    body += `<td style="padding:8px;border:1px solid #ddd;">${claim.service_date || 'N/A'}</td>`;
    body += `<td style="padding:8px;border:1px solid #ddd;">${claim.provider_name || 'N/A'}</td>`;
    body += `<td style="padding:8px;border:1px solid #ddd;">${claim.billed_amount != null ? '$' + claim.billed_amount.toFixed(2) : '—'}</td>`;
    body += `<td style="padding:8px;border:1px solid #ddd;">${claim.patient_responsibility != null ? '$' + claim.patient_responsibility.toFixed(2) : '—'}</td>`;
    body += `<td style="padding:8px;border:1px solid #ddd;color:${statusColor};font-weight:bold;">${statusLabel}</td>`;
    body += `</tr>`;
    if (claim.denial_reason) {
      body += `<tr><td colspan="6" style="padding:8px;border:1px solid #ddd;background:#fef2f2;color:#991b1b;font-size:12px;">Denial reason: ${claim.denial_reason}</td></tr>`;
    }
  });

  body += `</table>`;
  body += `<p style="margin-top:16px;">Open the <strong>Health Me Medical Center</strong> app → Insurance Tracker → Claims tab to view full details.</p>`;
  body += `<p style="color:#94a3b8;font-size:12px;margin-top:24px;">This notification was generated by Health Me Medical Center's automated insurance claim monitoring system.</p>`;

  return body;
}