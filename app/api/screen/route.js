export const maxDuration = 30;

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.7-flash"];

export async function POST(request) {
  try {
    const { messages, memory, image } = await request.json();
    const key = process.env.SCREEN_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) return Response.json({ error: "Missing SCREEN_API_KEY" }, { status: 500 });

    const list = Array.isArray(messages) ? messages : [];
    const contents = list
      .slice(-10)
      .filter((m) => m && String(m.content || "").trim())
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content).slice(0, 1500) }] }));
    while (contents.length && contents[0].role !== "user") contents.shift();
    if (!contents.length) return Response.json({ error: "Empty message" }, { status: 400 });

    const hasImg = typeof image === "string" && image.startsWith("data:image/jpeg;base64,");
    if (hasImg) {
      contents[contents.length - 1].parts.unshift({ inline_data: { mime_type: "image/jpeg", data: image.split(",")[1] } });
    }

    const system = `You are Myralis on a live screen-share call with the user.
${hasImg ? "The image attached to the latest user message is a live capture of the user's phone screen." : "No screen image is available right now. If the user asks about the screen, say you can't see it yet and suggest they restart screen sharing."}
Answer about what is on screen directly and briefly: 1 to 3 short sentences, no markdown, no emojis, no URLs.
If the user asks you to do something on the phone, explain the steps instead of claiming you did it.
Do not identify people from their faces.
Today's date and time (UTC): ${new Date().toUTCString()}
What you know about the user: ${String(memory || "nothing yet").slice(0, 1500)}`;

    const attempts = [];
    const started = Date.now();
    for (const model of MODELS) {
      const budget = Math.min(12000, 26000 - (Date.now() - started));
      if (budget < 3000) break;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: system }] },
              contents,
              generationConfig: { temperature: 0.5, maxOutputTokens: 512 }
            }),
            signal: AbortSignal.timeout(budget)
          }
        );
        let json = {};
        try { json = await res.json(); } catch {}
        const text = (json?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
        attempts.push(model + ":" + res.status + (res.ok && !text ? ":empty" : ""));
        if (res.ok && text) {
          return Response.json({ reply: text.replace(/[*#`]/g, "").replace(/\s+/g, " ").trim(), model });
        }
      } catch {
        attempts.push(model + ":timeout");
      }
    }
    return Response.json({ error: "Screen view is busy right now [" + attempts.join(", ") + "]" }, { status: 502 });
  } catch {
    return Response.json({ error: "Screen server error" }, { status: 500 });
  }
}
