import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Fetch all enabled thresholds
    const thresholds = await sr.entities.VitalThreshold.filter({ enabled: true });

    if (thresholds.length === 0) {
      return Response.json({ status: "success", message: "No thresholds configured", alerts_sent: 0 });
    }

    const vitalLabels = {
      heart_rate: "Heart Rate",
      blood_pressure: "Blood Pressure",
      oxygen_saturation: "Oxygen Saturation",
      blood_glucose: "Blood Glucose",
      weight: "Weight",
      sleep_hours: "Sleep",
      temperature: "Temperature",
      activity_minutes: "Activity",
    };

    const vitalUnits = {
      heart_rate: "bpm",
      blood_pressure: "mmHg",
      oxygen_saturation: "%",
      blood_glucose: "mg/dL",
      weight: "kg",
      sleep_hours: "hrs",
      temperature: "°F",
      activity_minutes: "min",
    };

    // Group thresholds by user (created_by_id)
    const byUser = {};
    for (const t of thresholds) {
      const uid = t.created_by_id;
      if (!uid) continue;
      // Skip if already alerted today
      if (t.last_alert_date && t.last_alert_date.slice(0, 10) === todayStr) continue;
      if (!byUser[uid]) byUser[uid] = [];
      byUser[uid].push(t);
    }

    let alertsSent = 0;
    const alertDetails = [];

    for (const [userId, userThresholds] of Object.entries(byUser)) {
      try {
        const users = await sr.entities.User.filter({ id: userId });
        const user = users[0];
        if (!user || !user.email) continue;

        const triggeredAlerts = [];

        for (const threshold of userThresholds) {
          // Get latest vital record for this type and user
          const filter = { type: threshold.vital_type, created_by_id: userId };
          const vitals = await sr.entities.VitalRecord.filter(filter, "-recorded_at", 1);
          if (vitals.length === 0) continue;

          const vital = vitals[0];
          // Only check vitals logged in the last 24 hours
          const vitalDate = vital.recorded_at ? new Date(vital.recorded_at) : new Date(vital.created_date);
          const hoursAgo = (now - vitalDate) / (1000 * 60 * 60);
          if (hoursAgo > 24) continue;

          let breached = false;
          let breachDesc = "";

          if (threshold.vital_type === "blood_pressure") {
            const systolic = vital.value;
            const diastolic = vital.secondary_value;
            if (threshold.high_threshold != null && systolic > threshold.high_threshold) {
              breached = true;
              breachDesc = `HIGH: ${systolic}/${diastolic || "?"} mmHg (threshold: <${threshold.high_threshold})`;
            } else if (threshold.low_threshold != null && systolic < threshold.low_threshold) {
              breached = true;
              breachDesc = `LOW: ${systolic}/${diastolic || "?"} mmHg (threshold: >${threshold.low_threshold})`;
            }
          } else {
            if (threshold.high_threshold != null && vital.value > threshold.high_threshold) {
              breached = true;
              breachDesc = `HIGH: ${vital.value} ${vitalUnits[threshold.vital_type]} (threshold: <${threshold.high_threshold})`;
            } else if (threshold.low_threshold != null && vital.value < threshold.low_threshold) {
              breached = true;
              breachDesc = `LOW: ${vital.value} ${vitalUnits[threshold.vital_type]} (threshold: >${threshold.low_threshold})`;
            }
          }

          if (breached) {
            triggeredAlerts.push({
              label: vitalLabels[threshold.vital_type],
              desc: breachDesc,
              thresholdId: threshold.id,
              recordedAt: vitalDate.toISOString(),
            });
          }
        }

        if (triggeredAlerts.length === 0) continue;

        // Build and send email
        const firstName = user.full_name ? user.full_name.split(" ")[0] : "there";
        let body = `Hello ${firstName},\n\n`;
        body += `This is an automated health alert from Health Me Medical Center.\n\n`;
        body += `The following vital sign(s) have crossed your configured threshold(s):\n\n`;

        for (const a of triggeredAlerts) {
          body += `  ⚠️ ${a.label}: ${a.desc}\n`;
          body += `     Recorded: ${new Date(a.recordedAt).toLocaleString("en-US")}\n\n`;
        }

        body += `Please review these readings and consult your healthcare provider if you have concerns.\n`;
        body += `If this is a medical emergency, call 911 immediately.\n\n`;
        body += `Health Me Medical Center`;

        await sr.integrations.Core.SendEmail({
          to: user.email,
          subject: `🚨 Health Alert: ${triggeredAlerts.length} vital sign${triggeredAlerts.length !== 1 ? "s" : ""} need attention`,
          body: body,
        });

        // Mark thresholds as alerted today
        for (const a of triggeredAlerts) {
          await sr.entities.VitalThreshold.update(a.thresholdId, { last_alert_date: now.toISOString() });
        }

        alertsSent += triggeredAlerts.length;
        alertDetails.push({ user: user.email, count: triggeredAlerts.length });
      } catch (userErr) {
        console.error(`Error checking thresholds for user ${userId}:`, userErr.message);
      }
    }

    return Response.json({
      status: "success",
      thresholds_checked: thresholds.length,
      alerts_sent: alertsSent,
      details: alertDetails,
      date: todayStr,
    });
  } catch (error) {
    console.error("Vital threshold check error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});