import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const WHO_WEIGHT_3RD_PCT = {
  0: 2.5, 1: 3.4, 2: 4.4, 3: 5.0, 4: 5.6, 5: 6.0, 6: 6.4,
  9: 7.1, 12: 7.7, 18: 8.8, 24: 9.7,
};

function getExpectedWeight(ageMonths) {
  const keys = Object.keys(WHO_WEIGHT_3RD_PCT).map(Number).sort((a, b) => a - b);
  let lower = 0, upper = keys[keys.length - 1];
  for (const k of keys) {
    if (k <= ageMonths) lower = k;
    if (k >= ageMonths) { upper = k; break; }
  }
  if (lower === upper) return WHO_WEIGHT_3RD_PCT[lower];
  const t = (ageMonths - lower) / (upper - lower);
  return WHO_WEIGHT_3RD_PCT[lower] + t * (WHO_WEIGHT_3RD_PCT[upper] - WHO_WEIGHT_3RD_PCT[lower]);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled function — use service role
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [milestones, growthLogs] = await Promise.all([
      base44.asServiceRole.entities.BabyMilestone.list("-created_date", 200),
      base44.asServiceRole.entities.BabyGrowthLog.list("-created_date", 200),
    ]);

    // New milestones created in last 24h — notify owners
    const newMilestones = milestones.filter(m => m.created_date >= yesterday);
    const growthConcerns = [];

    // Check growth logs for concerning measurements
    for (const g of growthLogs) {
      if (g.age_months != null && g.weight_kg != null) {
        const expected = getExpectedWeight(g.age_months);
        if (g.weight_kg < expected) {
          growthConcerns.push(g);
        }
      }
    }

    // Group by owner
    const usersToNotify = {};
    for (const m of newMilestones) {
      const ownerId = m.created_by_id;
      if (!ownerId || ownerId.startsWith("service_")) continue;
      if (!usersToNotify[ownerId]) usersToNotify[ownerId] = { milestones: [], growth: [] };
      usersToNotify[ownerId].milestones.push(m);
    }
    for (const g of growthConcerns) {
      const ownerId = g.created_by_id;
      if (!ownerId || ownerId.startsWith("service_")) continue;
      if (!usersToNotify[ownerId]) usersToNotify[ownerId] = { milestones: [], growth: [] };
      // Only add once per user
      if (usersToNotify[ownerId].growth.length === 0) {
        usersToNotify[ownerId].growth.push(g);
      }
    }

    const emailsSent = [];

    for (const userId of Object.keys(usersToNotify)) {
      const data = usersToNotify[userId];
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        const user = users[0];
        if (!user || !user.email) continue;

        let body = `Hello ${user.full_name ? user.full_name.split(' ')[0] : 'there'},\n\n`;
        body += `Here is your newborn care update from Health Me Medical Center:\n\n`;

        if (data.milestones.length > 0) {
          body += `🎉 NEW MILESTONES LOGGED:\n`;
          for (const m of data.milestones) {
            body += `  • ${m.milestone_date} — ${m.title || m.milestone_type}${m.baby_age_weeks ? ` (${m.baby_age_weeks} weeks old)` : ""}\n`;
          }
          body += `\n`;
        }

        if (data.growth.length > 0) {
          const g = data.growth[0];
          const expected = g.age_months != null ? getExpectedWeight(g.age_months) : null;
          body += `⚠️ GROWTH ATTENTION NEEDED:\n`;
          body += `  Your baby's weight (${g.weight_kg}kg at ${g.age_months} months) is below the `;
          body += `3rd percentile threshold${expected ? ` (expected minimum: ${expected}kg)` : ""}.\n`;
          body += `  Please discuss this with your pediatrician at your next visit.\n\n`;
        }

        body += `You can view full details and generate a monthly report in the Newborn Care section of your app.\n\n`;
        body += `Stay healthy,\nHealth Me Medical Center`;

        const subjectParts = [];
        if (data.milestones.length > 0) subjectParts.push(`${data.milestones.length} new milestone${data.milestones.length !== 1 ? 's' : ''}`);
        if (data.growth.length > 0) subjectParts.push("growth update");
        const subject = `👶 Newborn Care Alert: ${subjectParts.join(" + ")}`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject,
          body,
        });

        emailsSent.push({ user: user.email, milestones: data.milestones.length, growthAlerts: data.growth.length });
      } catch (err) {
        console.error(`Failed to notify user ${userId}:`, err.message);
      }
    }

    return Response.json({
      date: today,
      new_milestones: newMilestones.length,
      growth_concerns: growthConcerns.length,
      emails_sent: emailsSent.length,
      details: emailsSent,
    });
  } catch (error) {
    console.error('newbornMilestoneAlert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});