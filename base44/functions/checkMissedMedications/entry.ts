import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all missed medication logs that haven't had an alert sent yet
    const missedLogs = await base44.asServiceRole.entities.MedicationLog.filter({
      status: "missed"
    });

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const pendingAlerts = missedLogs.filter((log) => {
      if (log.alert_sent) return false;
      // Use updated_date as the timestamp for when it was marked as missed
      const logTime = new Date(log.updated_date || log.created_date);
      return logTime < twoHoursAgo;
    });

    if (pendingAlerts.length === 0) {
      return Response.json({ checked: missedLogs.length, alerted: 0, message: "No missed medications pending alerts" });
    }

    // Group missed logs by user (created_by_id)
    const byUser = {};
    for (const log of pendingAlerts) {
      const userId = log.created_by_id;
      if (!byUser[userId]) byUser[userId] = [];
      byUser[userId].push(log);
    }

    let totalAlertsSent = 0;
    const alertedLogIds = [];

    for (const userId of Object.keys(byUser)) {
      const userLogs = byUser[userId];

      // Get user info
      let user;
      try {
        user = await base44.asServiceRole.entities.User.get(userId);
      } catch (e) {
        console.error(`Failed to get user ${userId}:`, e.message);
        continue;
      }

      if (!user) continue;

      // Get trusted contacts for this user with missed medication alerts enabled
      const contacts = await base44.asServiceRole.entities.TrustedContact.filter({
        created_by_id: userId,
        status: "active",
        alert_missed_medications: true
      });

      if (contacts.length === 0) {
        // Still mark logs as alert_sent to avoid re-checking
        for (const log of userLogs) alertedLogIds.push(log.id);
        continue;
      }

      // Get medication details for this user's medications
      const medications = await base44.asServiceRole.entities.Medication.filter({
        created_by_id: userId,
        active: true
      });

      // Build medication lookup by name
      const medLookup = {};
      for (const med of medications) {
        medLookup[med.name.toLowerCase()] = med;
      }

      // Build missed medications detail list
      const missedDetails = userLogs.map((log) => {
        const med = medLookup[log.medication_name?.toLowerCase()];
        return {
          name: log.medication_name,
          dosage: med?.dosage || "N/A",
          frequency: med?.frequency || "N/A",
          time_of_day: med?.time_of_day || [],
          scheduled_date: log.scheduled_date,
          prescribing_provider: med?.prescribing_provider || "N/A",
          notes: log.notes || ""
        };
      });

      // Get all active medications for "medications needed" section
      const allMeds = medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        time_of_day: m.time_of_day || [],
        supply_quantity: m.supply_quantity,
        refill_date: m.refill_date
      }));

      const patientName = user.full_name || "Patient";
      const missedCount = missedDetails.length;

      // Build email body
      const medListText = missedDetails.map((m, i) => {
        const times = m.time_of_day.length > 0 ? ` [${m.time_of_day.join(", ")}]` : "";
        return `  ${i + 1}. ${m.name} — ${m.dosage}, ${m.frequency}${times}\n     Scheduled: ${m.scheduled_date}\n     Prescribed by: ${m.prescribing_provider}${m.notes ? `\n     Notes: ${m.notes}` : ""}`;
      }).join("\n\n");

      const allMedsText = allMeds.length > 0
        ? allMeds.map((m, i) => {
            const times = m.time_of_day.length > 0 ? ` [${m.time_of_day.join(", ")}]` : "";
            const refill = m.refill_date ? ` | Refill: ${m.refill_date}` : "";
            const supply = m.supply_quantity != null ? ` | Supply: ${m.supply_quantity}` : "";
            return `  ${i + 1}. ${m.name} — ${m.dosage}, ${m.frequency}${times}${refill}${supply}`;
          }).join("\n")
        : "  No active medications on file.";

      const subject = `Medication Alert: ${patientName} missed ${missedCount} dose${missedCount !== 1 ? "s" : ""}`;

      const body = `Hello,

This is an automated medication adherence alert from Health Me Medical Center.

${patientName} has missed ${missedCount} scheduled medication dose${missedCount !== 1 ? "s" : ""} that were not taken for more than 2 hours past their scheduled time.

MISSED MEDICATIONS & SCHEDULE:
${medListText}

CURRENT MEDICATIONS NEEDED:
${allMedsText}

Please follow up with ${patientName} to ensure they take their missed medications and stay on track with their treatment plan.

This alert was sent because you are listed as a trusted contact with missed medication alerts enabled. You can manage your alert preferences by contacting the patient.

— Health Me Medical Center
Automated Caregiver Alert System`;

      // Send email to each contact
      for (const contact of contacts) {
        if (contact.email) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: contact.email,
              subject,
              body,
            });
            totalAlertsSent++;
          } catch (e) {
            console.error(`Failed to send alert to ${contact.email}:`, e.message);
          }
        }
      }

      // Mark logs as alert_sent
      for (const log of userLogs) alertedLogIds.push(log.id);
    }

    // Batch update all alerted logs
    if (alertedLogIds.length > 0) {
      await base44.asServiceRole.entities.MedicationLog.bulkUpdate(
        alertedLogIds.map((id) => ({ id, alert_sent: true }))
      );
    }

    return Response.json({
      checked: missedLogs.length,
      pending: pendingAlerts.length,
      alerted: totalAlertsSent,
      logsMarked: alertedLogIds.length
    });
  } catch (error) {
    console.error("checkMissedMedications error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});