import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    // Fetch all dental visit logs
    const allVisits = await base44.asServiceRole.entities.DentalVisitLog.list("-visit_date", 500);

    // Group by user (created_by_id) and find latest visit per user
    const userLatestVisit = {};
    for (const visit of allVisits) {
      const userId = visit.created_by_id;
      if (!userId) continue;
      if (!userLatestVisit[userId]) {
        userLatestVisit[userId] = visit;
      }
    }

    const reminded = [];
    const errors = [];

    for (const [userId, latestVisit] of Object.entries(userLatestVisit)) {
      const visitDate = new Date(latestVisit.visit_date);

      // Skip if last visit was within 6 months
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

      // Check if we already sent a reminder (look for existing pending dental checkup appointment)
      const existingAppts = await base44.asServiceRole.entities.Appointment.filter({});
      const alreadyReminded = existingAppts.some(
        (a) => a.created_by_id === userId &&
               a.title === "6-Month Dental Checkup Reminder" &&
               a.status === "pending"
      );

      if (alreadyReminded) continue;

      const monthsSince = Math.floor((now - visitDate) / (30 * 24 * 60 * 60 * 1000));

      try {
        // Send email reminder
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: userEmail,
          subject: "Time to Schedule Your 6-Month Dental Checkup",
          body: `Hello ${userName},

This is a friendly reminder that it has been approximately ${monthsSince} months since your last dental visit on ${visitDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} with ${latestVisit.dentist_name || "your dentist"}.

Regular dental checkups every 6 months are essential for maintaining good oral health. They help catch issues early — cavities, gum disease, oral cancer screenings, and more — before they become serious and costly.

We recommend scheduling your next checkup and cleaning at your earliest convenience.

Stay healthy,
Health Me Medical Center`,
        });

        // Create a pending appointment as a reminder marker to prevent duplicate emails
        await base44.asServiceRole.entities.Appointment.create({
          title: "6-Month Dental Checkup Reminder",
          date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: "checkup",
          status: "pending",
          notes: `Automated reminder: Last dental visit was on ${latestVisit.visit_date} with ${latestVisit.dentist_name || "your dentist"}. Please schedule your 6-month checkup.`,
          reminder_sent: true,
        });

        reminded.push({ userId, email: userEmail, monthsSince });
      } catch (sendErr) {
        console.error(`Failed to send dental reminder to ${userEmail}:`, sendErr.message);
        errors.push({ userId, error: sendErr.message });
      }
    }

    return Response.json({
      checked: Object.keys(userLatestVisit).length,
      reminded: reminded.length,
      reminded,
      errors,
    });
  } catch (error) {
    console.error("Dental checkup reminder error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});