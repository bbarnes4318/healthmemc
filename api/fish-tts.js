export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-fish-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers["authorization"] || req.headers["x-fish-key"] || "";
    const apiKey = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!apiKey) {
      return res.status(400).json({ error: "Missing Fish Audio API Key" });
    }

    const { text, reference_id, format = "mp3" } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: "Missing text parameter" });
    }

    const payload = {
      text: text.slice(0, 2000),
      format: format || "mp3",
      normalize: true,
    };

    if (reference_id && typeof reference_id === "string" && reference_id.length > 5) {
      payload.reference_id = reference_id;
    }

    // Server-to-server request to Fish Audio (Node.js has NO CORS restrictions)
    const fishResponse = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!fishResponse.ok) {
      const errText = await fishResponse.text().catch(() => "");
      return res.status(fishResponse.status).json({ error: `Fish Audio API error ${fishResponse.status}`, details: errText });
    }

    const arrayBuffer = await fishResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Vercel Fish Audio proxy error:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
}
