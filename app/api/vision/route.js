export const maxDuration = 30;

export async function POST(request) {
  try {
    const { image, mode } = await request.json();
    const key = process.env.VISION_API_KEY || process.env.GEMINI_API_KEY;

    if (!image || !String(image).startsWith("data:image")) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }
    if (!key) {
      return Response.json({ error: "Missing VISION_API_KEY or GEMINI_API_KEY" }, { status: 500 });
    }

    const mime = image.substring(5, image.indexOf(";")) || "image/jpeg";
    const data = image.split(",")[1];
    const quick = mode === "live";

    const prompt = quick
      ? `You are Myralis Vision (Friday-style HUD).
Look at the image and give a very short live read (max 12 words).
Name the main thing/material/scene exactly (e.g. "sand on the ground", "close-up of a hand", "city street at dusk").
No preamble.`
      : `You are Myralis Vision, like Friday in Iron Man.

Analyze this image in depth using only what is visible:
- Overall scene
- Materials and surfaces (sand, water, metal, fabric, skin, concrete, etc.)
- Objects, people, body parts, text if readable
- Lighting, distance, notable details
- Anything unusual

Be specific. If it's sand, say sand (fine/coarse, dry/wet if clear). If it's a hand, describe the hand.
First person: "I can see..."
About 4-8 sentences. Do not invent details.`;

    const models = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-1.5-flash"
    ];

    let reply = null;
    let lastError = null;

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": key
            },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [
                  { inline_data: { mime_type: mime, data } },
                  { text: prompt }
                ]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: quick ? 60 : 800
              }
            }),
            signal: AbortSignal.timeout(quick ? 12000 : 25000)
          }
        );
        const json = await res.json();
        const text = (json?.candidates?.[0]?.content?.parts || [])
          .map((p) => p.text || "")
          .join("")
          .trim();
        if (res.ok && text) {
          reply = text;
          break;
        }
        lastError = json?.error?.message || `HTTP ${res.status}`;
      } catch (e) {
        lastError = e.message || "request failed";
      }
    }

    if (!reply) {
      return Response.json({ error: lastError || "Vision unavailable" }, { status: 502 });
    }
    return Response.json({ reply });
  } catch {
    return Response.json({ error: "Vision server error" }, { status: 500 });
  }
}
