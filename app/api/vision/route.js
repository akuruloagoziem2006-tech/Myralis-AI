export const maxDuration = 30;

export async function POST(request) {
  try {
    const { image, summary } = await request.json();
    const key = process.env.VISION_API_KEY || process.env.GEMINI_API_KEY;

    if (!key) {
      return Response.json({
        reply: localFallback(summary)
      });
    }

    if (!image || !image.startsWith("data:image")) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const mime = image.substring(5, image.indexOf(";")) || "image/jpeg";
    const data = image.split(",")[1];

    const prompt = `You are Myralis Vision, a Jarvis-style visual analyst.
Detected objects (on-device): ${summary || "none"}.

Describe what you see clearly:
1) Overall scene (e.g. street, room, desk, city view)
2) Important objects and people
3) Notable activity or context
4) One useful insight if relevant

Be concise, confident, and practical. Do not invent details that are not visible.`;

    const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash-lite"];
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
              contents: [
                {
                  role: "user",
                  parts: [
                    { inline_data: { mime_type: mime, data } },
                    { text: prompt }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 512
              }
            }),
            signal: AbortSignal.timeout(20000)
          }
        );
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
        if (res.ok && text) {
          reply = text;
          break;
        }
        lastError = json?.error?.message || `HTTP ${res.status}`;
      } catch (e) {
        lastError = e.message || "Vision request failed";
      }
    }

    if (!reply) {
      return Response.json({
        reply: localFallback(summary) + (lastError ? `\n\n_(Cloud vision unavailable: ${lastError})_` : "")
      });
    }

    return Response.json({ reply });
  } catch {
    return Response.json({ error: "Vision server error" }, { status: 500 });
  }
}

function localFallback(summary) {
  if (!summary || summary === "no clear objects") {
    return "I can't clearly identify objects in this frame yet. Try better lighting or point at a clearer subject.";
  }
  return `From on-device vision, I can see: **${summary}**.\n\nCloud scene analysis isn't available right now, so this is the local detection summary only.`;
}
