import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allCards = await base44.asServiceRole.entities.InsuranceCard.filter({
      expiry_reminder_sent: false,
    });

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringCards = allCards.filter((card) => {
      if (!card.termination_date) return false;
      const expiry = new Date(card.termination_date);
      return expiry <= thirtyDaysFromNow;
    });

    const results = [];

    for (const card of expiringCards) {
      try {
        const user = await base44.asServiceRole.entities.User.get(card.created_by_id);
        if (!user || !user.email) {
          results.push({ id: card.id, status: "no_email", provider: card.provider_name });
          continue;
        }

        const expiryDate = new Date(card.termination_date);
        const isExpired = expiryDate < today;
        const daysDiff = Math.round((expiryDate - today) / (1000 * 60 * 60 * 24));

        const subject = isExpired
          ? `Insurance Card Expired: ${card.provider_name}`
          : `Insurance Card Expiring Soon: ${card.provider_name}`;

        const body = isExpired
          ? `Hello ${user.full_name || ""},\n\nYour insurance card from ${card.provider_name} expired on ${card.termination_date} (${Math.abs(daysDiff)} days ago).\n\nPlease upload your updated insurance card details to keep your records current.\n\nPolicy Number: ${card.policy_number}\n${card.plan_name ? `Plan: ${card.plan_name}\n` : ""}\nStay healthy,\nHealth Me Medical Center`
          : `Hello ${user.full_name || ""},\n\nYour insurance card from ${card.provider_name} will expire on ${card.termination_date} (in ${daysDiff} days).\n\nPlease upload your updated insurance card details before it expires to avoid any disruptions.\n\nPolicy Number: ${card.policy_number}\n${card.plan_name ? `Plan: ${card.plan_name}\n` : ""}\nStay healthy,\nHealth Me Medical Center`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: subject,
          body: body,
        });

        await base44.asServiceRole.entities.InsuranceCard.update(card.id, {
          expiry_reminder_sent: true,
        });

        results.push({
          id: card.id,
          status: "sent",
          provider: card.provider_name,
          email: user.email,
          expired: isExpired,
        });
      } catch (err) {
        results.push({ id: card.id, status: "error", error: err.message, provider: card.provider_name });
      }
    }

    return Response.json({
      checked: allCards.length,
      expiring: expiringCards.length,
      sent: results.filter((r) => r.status === "sent").length,
      results,
    });
  } catch (error) {
    console.error("Insurance expiry reminder error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});