export const maxDuration = 30;

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.7-flash", "gemini-3.8-flash"];

function clip(s, n) {
  return String(s || "").slice(0, n);
}

function parseList(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  try {
    const j = JSON.parse(clean);
    const arr = Array.isArray(j) ? j : j.suggestions || j.questions || [];
    return arr.map((x) => String(x).trim()).filter(Boolean);
  } catch {}
  return clean
    .split("\n")
    .map((l) => l.replace(/^[\s\-*\d.)"]+|["\s,]+$/g, ""))
    .filter((l) => l.length > 3);
}

export async function POST(request) {
  try {
    const { mode, messages, question } = await request.json();
    const key = process.env.SENSE_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) return Response.json({ error: "Missing SENSE_API_KEY" }, { status: 500 });

    const convo = (Array.isArray(messages) ? messages : [])
      .slice(-6)
      .map((m) => `${m.role === "assistant" ? "Myralis" : "User"}: ${clip(m.content, 600)}`)
      .join("\n");

    const prompt =
      mode === "typing"
        ? `You are Myralis's Spider-Sense. The user is typing a question and has not finished.
Recent conversation:
${convo || "(none)"}

Draft so far: "${clip(question, 300)}"

Write exactly 3 sharper, complete versions of the question they most likely mean, phrased as the user would type it (max 14 words each). Do not answer the question. If the draft is already clear, offer 3 useful variations (more specific, broader, a different angle). Same language as the draft. Return only a JSON array of 3 strings.`
        : `You are Myralis's Spider-Sense: you anticipate what the user will want to ask next.
Conversation so far:
${convo}

Write exactly 3 follow-up questions the user is most likely to ask next, phrased as the user would type them to the assistant. Make them different: one that goes deeper, one practical or actionable, one adjacent or surprising. Max 9 words each. Same language as the user. Return only a JSON array of 3 strings.`;

    const started = Date.now();
    for (const model of MODELS) {
      const budget = Math.min(9000, 25000 - (Date.now() - started));
      if (budget < 3000) break;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 1024,
                responseMimeType: "application/json"
              }
            }),
            signal: AbortSignal.timeout(budget)
          }
        );
        let json = {};
        try { json = await res.json(); } catch {}
        const text = (json?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
        if (res.ok && text) {
          const list = [...new Set(parseList(text))].map((s) => clip(s, 120)).slice(0, 3);
          if (list.length) return Response.json({ suggestions: list });
        }
      } catch {}
    }
    return Response.json({ error: "Spider-Sense unavailable" }, { status: 502 });
  } catch {
    return Response.json({ error: "Sense server error" }, { status: 500 });
  }
}
