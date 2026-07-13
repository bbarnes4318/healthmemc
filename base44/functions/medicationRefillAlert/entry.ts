import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled function — no user context, use service role.

    const today = new Date().toISOString().slice(0, 10);

    // Fetch all active medications with a supply quantity set
    const medications = await base44.asServiceRole.entities.Medication.filter({
      active: true,
    });

    // Fetch all "taken" medication logs to calculate actual remaining supply
    const logs = await base44.asServiceRole.entities.MedicationLog.filter({
      status: "taken",
    });

    function parseDosesPerDay(frequency, timeOfDay) {
      if (timeOfDay && timeOfDay.length > 0) return timeOfDay.length;
      if (!frequency) return 1;
      const f = frequency.toLowerCase();
      if (f.includes("as needed") || f.includes("prn")) return 0;
      if (f.includes("four") || f.includes("4x") || f.includes("qid")) return 4;
      if (f.includes("three") || f.includes("3x") || f.includes("tid")) return 3;
      if (f.includes("twice") || f.includes("2x") || f.includes("bid")) return 2;
      if (f.includes("once") || f.includes("1x") || f.includes("daily") || f.includes("qd")) return 1;
      const match = f.match(/every\s+(\d+)\s*hours?/);
      if (match) return Math.floor(24 / parseInt(match[1]));
      return 1;
    }

    // Group low-supply meds by user
    const usersToNotify = {};

    for (const med of medications) {
      if (med.supply_quantity == null || med.supply_quantity <= 0) continue;

      // Skip if already alerted today
      if (med.last_refill_alert_date === today) continue;

      // Skip if a refill has already been requested
      if (med.refill_requested) continue;

      const dosesPerDay = parseDosesPerDay(med.frequency, med.time_of_day);
      if (dosesPerDay === 0) continue;

      const refDate = med.refill_date ? new Date(med.refill_date) : (med.start_date ? new Date(med.start_date) : null);
      const takenCount = logs.filter((l) => {
        if (l.medication_name !== med.name) return false;
        if (refDate) {
          const logDate = new Date(l.scheduled_date || l.taken_at || l.created_date);
          if (logDate < refDate) return false;
        }
        return true;
      }).length;

      const remaining = Math.max(0, med.supply_quantity - takenCount);
      const daysRemaining = Math.floor(remaining / dosesPerDay);

      // Alert threshold: 7 days or less
      if (daysRemaining > 7) continue;

      const ownerId = med.created_by_id;
      if (!ownerId) continue;

      if (!usersToNotify[ownerId]) {
        usersToNotify[ownerId] = { items: [] };
      }

      usersToNotify[ownerId].items.push({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        remaining,
        dosesPerDay,
        daysRemaining,
        prescribing_provider: med.prescribing_provider || null,
      });
    }

    const emailsSent = [];
    const alertsMarked = [];

    for (const userId of Object.keys(usersToNotify)) {
      if (userId.startsWith("service_")) continue;
      const items = usersToNotify[userId].items;

      // Sort by days remaining (most urgent first)
      items.sort((a, b) => a.daysRemaining - b.daysRemaining);

      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        const user = users[0];
        if (!user || !user.email) continue;

        const emailBody = buildEmailBody(items, user);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `💊 Medication Refill Alert: ${items.length} medication${items.length !== 1 ? 's' : ''} running low`,
          body: emailBody,
        });

        emailsSent.push({ user: user.email, count: items.length });

        // Mark each medication as alerted today
        for (const item of items) {
          await base44.asServiceRole.entities.Medication.update(item.id, {
            last_refill_alert_date: today,
          });
          alertsMarked.push(item.id);
        }
      } catch (err) {
        console.error(`Failed to notify user ${userId}:`, err.message);
      }
    }

    return Response.json({
      checked: medications.length,
      low_supply_count: emailsSent.reduce((s, e) => s + e.count, 0),
      emails_sent: emailsSent,
      alerts_marked: alertsMarked.length,
      date: today,
    });
  } catch (error) {
    console.error('medicationRefillAlert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildEmailBody(meds, user) {
  const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';
  let body = `Hello ${firstName},\n\n`;
  body += `This is an automated alert from Health Me Medical Center. The following medication(s) are running low based on your remaining supply and dosage schedule:\n\n`;

  for (const med of meds) {
    const urgency = med.daysRemaining <= 2 ? "URGENT" : "Action needed";
    body += `  ${med.name} (${med.dosage})\n`;
    body += `    Remaining: ${med.remaining} doses (${med.daysRemaining} ${med.daysRemaining === 1 ? "day" : "days"} until empty)\n`;
    body += `    Schedule: ${med.dosesPerDay}x per day\n`;
    if (med.prescribing_provider) {
      body += `    Prescribing provider: ${med.prescribing_provider}\n`;
    }
    body += `    Status: ${urgency}\n\n`;
  }

  body += `Please contact your prescribing provider or pharmacy to request a refill before you run out.\n\n`;
  body += `You can also request a refill directly from the Pharmacy section of your Health Me Medical Center app.\n\n`;
  body += `Stay healthy,\nHealth Me Medical Center`;

  return body;
}