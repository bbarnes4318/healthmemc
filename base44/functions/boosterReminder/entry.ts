import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all immunization logs that have a booster date and haven't had a reminder sent
    const allImmunizations = await base44.asServiceRole.entities.ImmunizationLog.filter({
      booster_reminder_sent: false,
    });

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const dueBoosters = allImmunizations.filter((imm) => {
      if (!imm.next_booster_date) return false;
      const dueDate = new Date(imm.next_booster_date);
      return dueDate <= thirtyDaysFromNow;
    });

    const results = [];

    for (const booster of dueBoosters) {
      try {
        if (!booster.created_by_id || booster.created_by_id.startsWith("service_")) continue;
        // Get the user who owns this record
        const users = await base44.asServiceRole.entities.User.filter({ id: booster.created_by_id });
        const user = users[0];
        if (!user || !user.email) {
          results.push({ id: booster.id, status: "no_email", vaccine: booster.vaccine_name });
          continue;
        }

        const dueDate = new Date(booster.next_booster_date);
        const isOverdue = dueDate < today;
        const daysDiff = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

        const subject = isOverdue
          ? `Vaccine Booster Overdue: ${booster.vaccine_name}`
          : `Vaccine Booster Due Soon: ${booster.vaccine_name}`;

        const body = isOverdue
          ? `Hello ${user.full_name || ""},\n\nThis is a reminder that your booster for ${booster.vaccine_name} was due on ${booster.next_booster_date} (${Math.abs(daysDiff)} days ago).\n\nPlease schedule your booster vaccination at your earliest convenience.\n\nLast administered: ${booster.date_administered}\n${booster.administered_by ? `Administered by: ${booster.administered_by}\n` : ""}\nStay healthy,\nHealth Me Medical Center`
          : `Hello ${user.full_name || ""},\n\nThis is a reminder that your booster for ${booster.vaccine_name} is due on ${booster.next_booster_date} (in ${daysDiff} days).\n\nPlease schedule your booster vaccination soon.\n\nLast administered: ${booster.date_administered}\n${booster.administered_by ? `Administered by: ${booster.administered_by}\n` : ""}\nStay healthy,\nHealth Me Medical Center`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: subject,
          body: body,
        });

        // Mark reminder as sent
        await base44.asServiceRole.entities.ImmunizationLog.update(booster.id, {
          booster_reminder_sent: true,
        });

        results.push({
          id: booster.id,
          status: "sent",
          vaccine: booster.vaccine_name,
          email: user.email,
          overdue: isOverdue,
        });
      } catch (err) {
        results.push({ id: booster.id, status: "error", error: err.message, vaccine: booster.vaccine_name });
      }
    }

    return Response.json({
      checked: allImmunizations.length,
      due: dueBoosters.length,
      sent: results.filter((r) => r.status === "sent").length,
      results,
    });
  } catch (error) {
    console.error("Booster reminder error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});