import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is called by a scheduled workflow — no user context.
    // Use service role for all operations.
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in22Hours = new Date(now.getTime() + 22 * 60 * 60 * 1000);

    // Find all appointments that might need reminders
    const appointments = await base44.asServiceRole.entities.Appointment.filter({});

    // Filter to appointments in the 22-24 hour window that haven't had reminders sent
    // Include both "scheduled" and "confirmed" statuses
    const upcoming = appointments.filter((a) => {
      const aptDate = new Date(a.date);
      return (a.status === "confirmed" || a.status === "scheduled")
        && !a.reminder_sent
        && aptDate >= in22Hours
        && aptDate <= in24Hours;
    });

    const sent = [];
    const errors = [];

    for (const apt of upcoming) {
      const aptDate = new Date(apt.date);
      const formattedDate = aptDate.toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit"
      });

      try {
        // Look up the user who created this appointment
        let userEmail = null;
        let userName = "Patient";

        if (apt.created_by_id) {
          try {
            const users = await base44.asServiceRole.entities.User.filter({ id: apt.created_by_id });
            if (users.length > 0) {
              userEmail = users[0].email;
              userName = users[0].full_name || "Patient";
            }
          } catch (userErr) {
            console.error(`Failed to look up user for appointment ${apt.id}:`, userErr.message);
          }
        }

        if (!userEmail) {
          console.error(`No email found for appointment ${apt.id} (created_by_id: ${apt.created_by_id})`);
          errors.push({ id: apt.id, error: "No user email found" });
          continue;
        }

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: userEmail,
          subject: `Appointment Reminder: ${apt.title} — Tomorrow at ${aptDate.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}`,
          body: `Hello ${userName},

This is a friendly reminder for your upcoming appointment:

  Appointment: ${apt.title}
  Date & Time: ${formattedDate}
  ${apt.provider ? `Provider: ${apt.provider}\n` : ""}${apt.notes ? `Notes: ${apt.notes}\n` : ""}
Please arrive 15 minutes early. If you need to reschedule, please contact your provider as soon as possible.

Stay healthy,
Health Me Medical Center`,
        });

        // Mark reminder as sent to prevent duplicates
        await base44.asServiceRole.entities.Appointment.update(apt.id, { reminder_sent: true });
        sent.push(apt.id);
      } catch (emailErr) {
        console.error(`Failed to send reminder for appointment ${apt.id}:`, emailErr.message);
        errors.push({ id: apt.id, error: emailErr.message });
      }
    }

    return Response.json({
      checked: appointments.length,
      found: upcoming.length,
      reminded: sent.length,
      sent,
      errors
    });
  } catch (error) {
    console.error("Appointment reminder error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});