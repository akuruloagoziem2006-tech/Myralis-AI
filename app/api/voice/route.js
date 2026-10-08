export const maxDuration = 30;

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.7-flash"];
const NEEDS_SEARCH = /\b(news|latest|today|tonight|current|currently|recent|recently|right now|price|stock|score|weather|released?|202[4-9])\b/i;

export async function POST(request) {
  try {
    const { messages, memory } = await request.json();
    const key = process.env.VOICE_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) return Response.json({ error: "Missing VOICE_API_KEY" }, { status: 500 });

    const list = Array.isArray(messages) ? messages : [];
    const contents = list
      .slice(-12)
      .filter((m) => m && String(m.content || "").trim())
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content).slice(0, 1500) }]
      }));
    while (contents.length && contents[0].role !== "user") contents.shift();
    if (!contents.length) return Response.json({ error: "Empty message" }, { status: 400 });

    const system = `You are Myralis on a live voice call with the user.
Today's date and time (UTC): ${new Date().toUTCString()}
Speak naturally, like a calm, warm, quick-witted assistant. Keep answers to 1 to 3 short sentences (under 60 words) unless the user asks for detail.
No markdown, no lists, no emojis, no URLs, no code blocks. Say numbers and symbols the way a person would say them aloud.
If you are unsure, say so briefly. Do not repeat your introduction.
If it helps, end with one short follow-up question.
What you know about the user: ${String(memory || "nothing yet").slice(0, 1500)}`;

    const lastUser = [...list].reverse().find((m) => m && m.role === "user");
    const useSearch = NEEDS_SEARCH.test(String(lastUser?.content || ""));
    const started = Date.now();

    const attempts = [];
    for (let i = 0; i < MODELS.length; i++) {
      const budget = Math.min(i === 0 && useSearch ? 14000 : 9000, 26000 - (Date.now() - started));
      if (budget < 3000) break;
      const body = {
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      };
      if (useSearch && i === 0) body.tools = [{ google_search: {} }];
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODELS[i]}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(budget)
          }
        );
        let json = {};
        try { json = await res.json(); } catch {}
        const text = (json?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
        attempts.push(MODELS[i] + ":" + res.status + (res.ok && !text ? ":empty" : ""));
        if (res.ok && text) {
          const reply = text
            .replace(/\[\[MEMORY\]\][\s\S]*?\[\[\/MEMORY\]\]/g, "")
            .replace(/[*#`]/g, "")
            .replace(/\s+/g, " ")
            .trim();
          return Response.json({ reply, model: MODELS[i] });
        }
      } catch {
        attempts.push(MODELS[i] + ":timeout");
      }
    }
    return Response.json({ error: "Voice is busy right now [" + attempts.join(", ") + "]" }, { status: 502 });
  } catch {
    return Response.json({ error: "Voice server error" }, { status: 500 });
  }
}
