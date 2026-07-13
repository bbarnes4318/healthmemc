import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled function — no user context. Use service role.
    // Timezone offset for America/New_York (EDT = -4, EST = -5)
    const now = new Date();
    const estOffset = -5;
    const edtOffset = -4;
    // Determine if DST is active (simplified: DST runs March-November)
    const month = now.getUTCMonth();
    const isDST = month >= 2 && month <= 10;
    const tzOffset = isDST ? edtOffset : estOffset;

    // Current time in user's timezone
    const localMs = now.getTime() + tzOffset * 60 * 60 * 1000;
    const localDate = new Date(localMs);
    const todayStr = localDate.toISOString().slice(0, 10);
    const currentHour = localDate.getHours();
    const currentMinute = localDate.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Fetch all active goals with reminders enabled
    const goals = await base44.asServiceRole.entities.CustomWellnessGoal.filter({
      is_active: true,
      reminder_enabled: true,
    });

    const sent = [];
    const errors = [];
    let checked = 0;

    for (const goal of goals) {
      checked++;

      // Skip if already reminded today
      if (goal.last_reminder_date === todayStr) continue;

      // Check if current time matches the reminder time (within same hour)
      if (!goal.reminder_time) continue;
      const [goalHour, goalMinute] = goal.reminder_time.split(':').map(Number);
      // Fire within the same hour window (current hour === goal hour)
      if (currentHour !== goalHour) continue;

      // Look up the user who created this goal
      let userEmail = null;
      let userName = "there";

      if (goal.created_by_id) {
        try {
          const users = await base44.asServiceRole.entities.User.filter({ id: goal.created_by_id });
          if (users.length > 0) {
            userEmail = users[0].email;
            userName = users[0].full_name || "there";
          }
        } catch (userErr) {
          console.error(`Failed to look up user for goal ${goal.id}:`, userErr.message);
        }
      }

      if (!userEmail) {
        errors.push({ id: goal.id, error: "No user email found" });
        continue;
      }

      // Fetch today's log to check if goal was already met
      const todayLogs = await base44.asServiceRole.entities.CustomWellnessLog.filter({
        goal_id: goal.id,
        date: todayStr,
      });

      const loggedValue = todayLogs.length > 0 ? todayLogs[0].value : 0;
      const goalMet = loggedValue >= goal.target_value;

      if (goalMet) {
        // Already met — skip reminder, mark as sent
        await base44.asServiceRole.entities.CustomWellnessGoal.update(goal.id, {
          last_reminder_date: todayStr,
        });
        sent.push({ id: goal.id, skipped: "already_met" });
        continue;
      }

      const categoryLabel = goal.category ? goal.category.replace(/_/g, ' ') : 'wellness';
      const remaining = Math.max(0, goal.target_value - loggedValue).toFixed(0);

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: userEmail,
          subject: `💧 Daily Reminder: ${goal.goal_name} — ${remaining} ${goal.unit} to go!`,
          body: `Hi ${userName},

This is your daily wellness goal reminder:

  Goal: ${goal.goal_name}
  Category: ${categoryLabel}
  Target: ${goal.target_value} ${goal.unit}
  Logged today: ${loggedValue} ${goal.unit}
  Remaining: ${remaining} ${goal.unit}

${loggedValue > 0 ? `Great start! You're ${Math.round((loggedValue / goal.target_value) * 100)}% of the way there.` : `You haven't logged any progress yet today — let's get started!`}

Keep up the consistency! Open Health Me Medical Center to log your progress.

Stay healthy,
Health Me Medical Center`,
        });

        await base44.asServiceRole.entities.CustomWellnessGoal.update(goal.id, {
          last_reminder_date: todayStr,
        });
        sent.push({ id: goal.id, goal_name: goal.goal_name });
      } catch (emailErr) {
        console.error(`Failed to send reminder for goal ${goal.id}:`, emailErr.message);
        errors.push({ id: goal.id, error: emailErr.message });
      }
    }

    return Response.json({
      checked,
      sent: sent.length,
      sent_details: sent,
      errors,
      local_time: currentTimeStr,
      date: todayStr,
    });
  } catch (error) {
    console.error("Wellness goal reminder error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});