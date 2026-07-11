import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { alert_type, family_member_name, details } = await req.json();
    // alert_type: "emergency" | "missed_medication"
    // family_member_name: string
    // details: string (e.g., medication name, emergency description)

    const contacts = await base44.asServiceRole.entities.TrustedContact.filter({ status: "active" });

    const alertField = alert_type === "emergency" ? "alert_emergencies" : "alert_missed_medications";
    const recipients = contacts.filter((c) => c[alertField]);

    if (recipients.length === 0) {
      return Response.json({ sent: 0, message: "No contacts subscribed to this alert type" });
    }

    const subject = alert_type === "emergency"
      ? `URGENT: Emergency Alert for ${family_member_name}`
      : `Medication Reminder: ${family_member_name} missed a dose`;

    const body = alert_type === "emergency"
      ? `Hello,\n\nThis is an automated emergency alert from Health Me Medical Center.\n\n${family_member_name} has logged an emergency event.\n\nDetails: ${details || "No additional details provided."}\n\nPlease reach out to ${family_member_name} or their care team as soon as possible.\n\nThis alert was sent because you are listed as a trusted contact with emergency alerts enabled.`
      : `Hello,\n\nThis is an automated medication alert from Health Me Medical Center.\n\n${family_member_name} has missed a scheduled medication dose.\n\nDetails: ${details || "No additional details provided."}\n\nPlease follow up with ${family_member_name} to ensure they take their medication.\n\nThis alert was sent because you are listed as a trusted contact with missed medication alerts enabled.`;

    const sent = [];
    for (const contact of recipients) {
      if (contact.email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: contact.email,
            subject,
            body,
          });
          sent.push(contact.email);
        } catch (e) {
          console.error(`Failed to send alert to ${contact.email}:`, e.message);
        }
      }
    }

    return Response.json({ sent: sent.length, recipients: sent });
  } catch (error) {
    console.error("Caregiver alert error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});