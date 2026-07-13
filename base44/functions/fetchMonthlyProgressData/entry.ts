import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sr = base44.asServiceRole;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    // Fetch all relevant data for the current user
    const [exercises, surgicalLogs, medications, medicationLogs] = await Promise.all([
      sr.entities.ExerciseLog.filter({ date: { $gte: dateStr } }, "-date", 500),
      sr.entities.SurgicalRecovery.filter({ log_date: { $gte: dateStr } }, "-log_date", 200),
      sr.entities.Medication.filter({ active: true }),
      sr.entities.MedicationLog.filter({ scheduled_date: { $gte: dateStr } }),
    ]);

    return Response.json({
      exercises,
      surgicalLogs,
      medications,
      medicationLogs,
      memberName: user.full_name || user.email,
    });
  } catch (error) {
    console.error("Monthly progress report data fetch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});