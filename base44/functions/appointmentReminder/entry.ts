import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Find confirmed specialist appointments happening in the next 24 hours
    const appointments = await base44.asServiceRole.entities.Appointment.filter({});

    const upcoming = appointments.filter((a) => {
      const aptDate = new Date(a.date);
      return a.status === "confirmed" && aptDate >= in23Hours && aptDate <= in24Hours;
    });

    const sent = [];
    for (const apt of upcoming) {
      const aptDate = new Date(apt.date);
      const formattedDate = aptDate.toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit"
      });

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `Appointment Reminder: ${apt.title} — Tomorrow`,
          body: `Hello ${user.full_name || ""},\n\nThis is a reminder for your upcoming appointment:\n\n📋 ${apt.title}\n📅 ${formattedDate}${apt.provider ? `\n👨‍⚕️ Provider: ${apt.provider}` : ""}${apt.notes ? `\n📝 Notes: ${apt.notes}` : ""}\n\nPlease arrive 15 minutes early. If you need to reschedule, please contact your provider.\n\nStay healthy,\nHealth Me Medical Center`,
        });
        sent.push(apt.id);
      } catch (emailErr) {
        console.error(`Failed to send reminder for appointment ${apt.id}:`, emailErr.message);
      }
    }

    return Response.json({ checked: appointments.length, reminded: sent.length, sent });
  } catch (error) {
    console.error("Appointment reminder error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});