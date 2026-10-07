export const maxDuration = 30;

export async function POST(request) {
  try {
    const { image } = await request.json();
    const key = process.env.VISION_API_KEY || process.env.GEMINI_API_KEY;

    if (!image || !String(image).startsWith("data:image")) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    if (!key) {
      return Response.json({
        error: "Vision API key missing. Add VISION_API_KEY or GEMINI_API_KEY in Vercel."
      }, { status: 500 });
    }

    const mime = image.substring(5, image.indexOf(";")) || "image/jpeg";
    const data = image.split(",")[1];

    // Important: ask Gemini to describe the IMAGE, not detection labels
    const prompt = `You are Myralis Vision.

Look carefully at the attached image and describe what you actually see.

Rules:
- Base your answer only on the image pixels
- Do NOT rely on any external object-label list
- Be specific: scene type, main subjects, colors, layout, activity, notable details
- Use first person as Myralis ("I can see...")
- Keep it clear and concise (about 4-8 sentences max)
- If something is unclear, say so honestly`;

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
                temperature: 0.4,
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
      return Response.json({
        error: lastError || "Vision model unavailable"
      }, { status: 502 });
    }

    return Response.json({ reply });
  } catch {
    return Response.json({ error: "Vision server error" }, { status: 500 });
  }
}
