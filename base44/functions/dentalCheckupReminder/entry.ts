import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    const allVisits = await base44.asServiceRole.entities.DentalVisitLog.list("-visit_date", 500);

    // Group by user (created_by_id) and find latest CLEANING visit per user
    const userLatestCleaning = {};
    for (const visit of allVisits) {
      const userId = visit.created_by_id;
      if (!userId) continue;
      // Only consider cleaning or examination visits (routine cleanings)
      if (visit.procedure_type !== "cleaning" && visit.procedure_type !== "examination") continue;
      if (!userLatestCleaning[userId]) {
        userLatestCleaning[userId] = visit;
      }
    }

    const reminded = [];
    const errors = [];

    // Fetch existing pending reminders once (outside loop for efficiency)
    const existingReminders = await base44.asServiceRole.entities.Appointment.filter({ status: "pending" });

    for (const [userId, latestCleaning] of Object.entries(userLatestCleaning)) {
      const visitDate = new Date(latestCleaning.visit_date);

      // Skip if last cleaning was within 6 months
      if (visitDate > sixMonthsAgo) continue;

      // Look up user email
      let userEmail = null;
      let userName = "Patient";
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (users.length > 0) {
          userEmail = users[0].email;
          userName = users[0].full_name || "Patient";
        }
      } catch (userErr) {
        console.error(`Failed to look up user ${userId}:`, userErr.message);
        errors.push({ userId, error: "User lookup failed" });
        continue;
      }

      if (!userEmail) {
        errors.push({ userId, error: "No email found" });
        continue;
      }

      // Check if we already sent a reminder — use [user:ID] marker in notes since
      // service-role-created appointments don't have the user's created_by_id
      const alreadyReminded = existingReminders.some(
        (a) => a.title === "6-Month Dental Cleaning Reminder" &&
               a.notes && a.notes.includes(`[user:${userId}]`)
      );

      if (alreadyReminded) continue;

      const monthsSince = Math.floor((now - visitDate) / (30 * 24 * 60 * 60 * 1000));
      const dueDate = new Date(visitDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

      try {
        // Send email reminder prompting to book
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: userEmail,
          subject: "Time to Schedule Your 6-Month Dental Cleaning",
          body: `Hello ${userName},

This is a friendly reminder that it has been approximately ${monthsSince} months since your last dental cleaning on ${visitDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} with ${latestCleaning.dentist_name || "your dentist"}.

Your next cleaning was due on ${dueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.

Regular dental cleanings every 6 months are essential for:
- Removing plaque and tartar buildup
- Preventing cavities and gum disease
- Early detection of oral health issues
- Maintaining fresh breath and a bright smile

We recommend scheduling your next cleaning appointment at your earliest convenience. A placeholder has been added to your appointment calendar to help you remember.

Stay healthy,
Health Me Medical Center`,
        });

        // Create a pending appointment as a calendar placeholder + reminder marker
        await base44.asServiceRole.entities.Appointment.create({
          title: "6-Month Dental Cleaning Reminder",
          date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: "checkup",
          status: "pending",
          notes: `[user:${userId}] Automated reminder: Last dental cleaning was on ${latestCleaning.visit_date} with ${latestCleaning.dentist_name || "your dentist"}. Your 6-month cleaning is overdue — please schedule your next appointment.`,
          reminder_sent: true,
        });

        reminded.push({ userId, email: userEmail, monthsSince, lastCleaningDate: latestCleaning.visit_date, dueDate: dueDate.toISOString() });
      } catch (sendErr) {
        console.error(`Failed to send dental cleaning reminder to ${userEmail}:`, sendErr.message);
        errors.push({ userId, error: sendErr.message });
      }
    }

    return Response.json({
      checked: Object.keys(userLatestCleaning).length,
      reminded: reminded.length,
      reminded,
      errors,
    });
  } catch (error) {
    console.error("Dental cleaning reminder error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});