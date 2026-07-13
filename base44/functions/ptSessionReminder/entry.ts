import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled workflow function — no user context, use service role directly

    const today = new Date().toISOString().split('T')[0];

    // Get all exercise logs and surgical recovery logs
    const [allExercises, allRecovery] = await Promise.all([
      base44.asServiceRole.entities.ExerciseLog.list('-date', 1000),
      base44.asServiceRole.entities.SurgicalRecovery.list('-log_date', 1000),
    ]);

    // Group exercise logs by user
    const usersWithPT = {};
    for (const log of allExercises) {
      const ownerId = log.created_by_id;
      if (!ownerId) continue;
      if (!usersWithPT[ownerId]) usersWithPT[ownerId] = { exercises: [], recovery: [] };
      usersWithPT[ownerId].exercises.push(log);
    }

    // Add recovery data to user groups
    for (const log of allRecovery) {
      const ownerId = log.created_by_id;
      if (!ownerId) continue;
      if (!usersWithPT[ownerId]) usersWithPT[ownerId] = { exercises: [], recovery: [] };
      usersWithPT[ownerId].recovery.push(log);
    }

    const emailsSent = [];

    for (const userId of Object.keys(usersWithPT)) {
      try {
        const ownerUser = await base44.asServiceRole.entities.User.get(userId);
        if (!ownerUser || !ownerUser.email) continue;

        const userData = usersWithPT[userId];
        const loggedToday = userData.exercises.some((l) => l.date === today) ||
                            userData.recovery.some((l) => l.log_date === today);

        if (loggedToday) continue;

        // Get context from recent logs
        const sortedExercises = [...userData.exercises].sort((a, b) => new Date(b.date) - new Date(a.date));
        const sortedRecovery = [...userData.recovery].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
        const latestExercise = sortedExercises[0];
        const latestRecovery = sortedRecovery[0];
        const bodyParts = [...new Set(userData.exercises.map((l) => l.body_part))];

        const emailBody = buildEmailBody(ownerUser, bodyParts, latestExercise, latestRecovery, today);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ownerUser.email,
          subject: `🏃 Daily PT Check-In — Log your exercises & pain scores`,
          body: emailBody,
        });

        emailsSent.push({ user: ownerUser.email, bodyParts: bodyParts.length });
      } catch (err) {
        console.error(`Failed to notify user ${userId}:`, err.message);
      }
    }

    return Response.json({
      checked: allExercises.length + allRecovery.length,
      users_notified: emailsSent.length,
      emails_sent: emailsSent,
    });
  } catch (error) {
    console.error('ptSessionReminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildEmailBody(user, bodyParts, latestExercise, latestRecovery, today) {
  let body = `<h2>🏃 Physical Therapy Daily Check-In</h2>`;
  body += `<p>Hello ${user.full_name || 'there'},</p>`;
  body += `<p>This is your daily reminder to log your physical therapy session for <strong>${today}</strong>.</p>`;
  body += `<p>Consistency is key to your recovery. Please log:</p>`;
  body += `<ul>`;
  body += `<li><strong>Exercises performed</strong> (name, sets, reps, duration)</li>`;
  body += `<li><strong>Range of motion</strong> (degrees for each joint)</li>`;
  body += `<li><strong>Pain scores</strong> (0–10 scale before & after)</li>`;
  body += `<li><strong>Recovery notes</strong> (how you felt, any concerns)</li>`;
  body += `</ul>`;

  if (bodyParts.length > 0) {
    body += `<div style="background:#fff7ed;border-left:4px solid #ea580c;padding:12px;margin:16px 0;border-radius:4px;">`;
    body += `<p style="margin:0;font-weight:bold;color:#9a3412;">Active Recovery Areas:</p>`;
    body += `<p style="margin:4px 0 0 0;color:#7c2d12;">${bodyParts.map(b => b.replace(/_/g, ' ')).join(', ')}</p>`;
    if (latestExercise) {
      const lastROM = latestExercise.rom_degrees != null ? `${latestExercise.rom_degrees}°` : '—';
      const lastPain = latestExercise.pain_level != null ? `${latestExercise.pain_level}/10` : '—';
      body += `<p style="margin:8px 0 0 0;font-size:13px;color:#78716c;">Last exercise: ${latestExercise.exercise_name || 'N/A'} · ROM: ${lastROM} · Pain: ${lastPain} · ${latestExercise.date || 'N/A'}</p>`;
    }
    if (latestRecovery) {
      const recPain = latestRecovery.pain_level != null ? `${latestRecovery.pain_level}/10` : '—';
      body += `<p style="margin:4px 0 0 0;font-size:13px;color:#78716c;">Last recovery log: ${latestRecovery.surgery_name || 'N/A'} · Pain: ${recPain} · ${latestRecovery.log_date || 'N/A'}</p>`;
    }
    body += `</div>`;
  }

  body += `<p style="margin-top:16px;">Open the <strong>Health Me Medical Center</strong> app → Physical Therapy → Tracker to record today's session.</p>`;
  body += `<p style="color:#94a3b8;font-size:12px;margin-top:24px;">This reminder was generated by Health Me Medical Center's automated PT tracking system. Stay consistent with your recovery goals!</p>`;

  return body;
}