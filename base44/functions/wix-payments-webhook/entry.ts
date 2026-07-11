import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import jwt from "npm:jsonwebtoken@9.0.2";

Deno.serve(async (req) => {
  try {
    const WEBHOOK_PUBLIC_KEY = Deno.env.get("WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
    if (!WEBHOOK_PUBLIC_KEY) {
      console.error("Missing WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
      return new Response("Unauthorized", { status: 500 });
    }

    const rawBody = await req.text();

    // Step 1: Verify JWT signature — fail closed if verification fails
    const rawPayload = jwt.verify(rawBody, WEBHOOK_PUBLIC_KEY, { algorithms: ["RS256"] });

    // Step 2: Parse double-nested JSON (WebhookEnvelope -> event data)
    const event = JSON.parse(rawPayload.data);
    const eventData = JSON.parse(event.data);

    if (event.eventType === "wix.ecom.v1.order_approved") {
      const order = eventData.actionEvent.body.order;
      const buyerEmail = order.buyerInfo?.email;
      const orderId = order.id;
      const total = order.priceSummary?.total?.amount;
      const currency = order.currency;

      console.log(`Order approved: ${orderId}, buyer: ${buyerEmail}, total: ${total} ${currency}`);

      // Send confirmation email to buyer
      if (buyerEmail) {
        try {
          const base44 = createClientFromRequest(req);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: buyerEmail,
            subject: "Physical ID Card Order Confirmed",
            body: `Thank you for your order!\n\nYour payment of $${total} ${currency} has been received.\n\nYour durable printed Medical ID Card will be mailed to your address within 5-7 business days.\n\nOrder ID: ${orderId}\n\nIf you have any questions, please contact support.`,
          });
          console.log(`Confirmation email sent to ${buyerEmail}`);
        } catch (emailErr) {
          console.error("Failed to send confirmation email:", emailErr.message);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response("Error", { status: 500 });
  }
});