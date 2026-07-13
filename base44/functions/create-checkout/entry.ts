Deno.serve(async (req) => {
  try {
    const origin = req.headers.get("origin") || "https://app.base44.com";

    const body = await req.json();
    const { item_name, price } = body;

    if (!item_name || !price) {
      return Response.json({ error: "Missing item_name or price" }, { status: 400 });
    }

    if (parseFloat(price) < 0.50) {
      return Response.json({ error: "Minimum charge amount is $0.50" }, { status: 400 });
    }

    const WIX_API_KEY = Deno.env.get("WIX_PAYMENTS_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_PAYMENTS_SITE_ID");

    if (!WIX_API_KEY || !WIX_SITE_ID) {
      console.error("Missing WIX_PAYMENTS_API_KEY or WIX_PAYMENTS_SITE_ID");
      return Response.json({ error: "Payment configuration missing" }, { status: 500 });
    }

    const response = await fetch(
      "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": WIX_API_KEY,
          "wix-site-id": WIX_SITE_ID,
        },
        body: JSON.stringify({
          cart: {
            items: [
              {
                name: item_name,
                quantity: 1,
                price: parseFloat(price),
              },
            ],
          },
          callbackUrls: {
            postFlowUrl: `${origin}/profile`,
            thankYouPageUrl: `${origin}/thank-you`,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Wix checkout error:", JSON.stringify(data));
      return Response.json(
        { error: data?.message || "Failed to create checkout session" },
        { status: response.status }
      );
    }

    return Response.json({ redirectUrl: data.checkoutSession.redirectUrl });
  } catch (error) {
    console.error("Checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});