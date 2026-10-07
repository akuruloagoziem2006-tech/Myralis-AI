export const maxDuration = 30;

export async function POST(request) {
  try {
    const { image } = await request.json();
    const key = process.env.VISION_API_KEY || process.env.GEMINI_API_KEY;

    if (!image || !String(image).startsWith("data:image")) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }
    if (!key) {
      return Response.json({ error: "Missing VISION_API_KEY or GEMINI_API_KEY" }, { status: 500 });
    }

    const mime = image.substring(5, image.indexOf(";")) || "image/jpeg";
    const data = image.split(",")[1];

    const prompt = `You are Myralis Vision.

Analyze the attached photo carefully using only what is visible in the image.

Be precise:
- If it is a hand, say it is a hand (left/right if clear), count visible fingers, note open/closed, jewelry, skin tone, background
- If it is a face, person, object, room, or outdoor scene, describe that accurately
- Do NOT default to vague labels like only "person" when a body part or object is clearly shown
- Do NOT invent details
- Use first person: "I can see..."
- 3 to 6 clear sentences`;

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
                maxOutputTokens: 700
              }
            }),
            signal: AbortSignal.timeout(25000)
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
