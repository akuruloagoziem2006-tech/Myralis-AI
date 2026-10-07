export const maxDuration = 60;

const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.7-flash", "gemini-3.6-flash"];

const BASE = `You are Myralis Vision, a sharp, calm visual assistant. Use only what is visible in the image. If something is unclear, say so instead of guessing. Do not identify real people from their faces; describe them instead. Reply in plain text with short paragraphs or simple bullets, no markdown headings.`;

function promptFor(mode, question, detections) {
  const hint = detections ? `\nA lightweight on-device detector also saw: ${String(detections).slice(0, 200)}. Treat that as a hint, not as truth.` : "";
  switch (mode) {
    case "live":
      return `${BASE}\nGive a live read in at most 12 words. Name the main subject, material or scene exactly. No preamble.`;
    case "text":
      return `${BASE}\nRead all visible text exactly as written, keeping the order and line breaks. If there is no text, say so. Then add a one-line summary. If the text is not English, add an English translation.`;
    case "identify":
      return `${BASE}\nIdentify the main thing or things as specifically as possible (species, model, brand, type, landmark). Give a confidence level and the visible clues. Mention close alternatives if unsure. Add one useful fact.${hint}`;
    case "translate":
      return `${BASE}\nFind all visible text, give the original and a clear English translation, and name the language. If there is no text, say so.`;
    case "solve":
      return `${BASE}\nIf the image shows a problem (math, puzzle, question, code, error message), solve it step by step and give the final answer. Otherwise say what you see and ask what to solve.`;
    case "count":
      return `${BASE}\nCount the distinct objects, grouped by type, with numbers. Say if a count is approximate or partly hidden.${hint}`;
    case "ask":
      return `${BASE}\nAnswer this question about the image: "${String(question || "").slice(0, 500)}"${hint}`;
    default:
      return `${BASE}\nFirst decide what the image mainly shows (a scene, object, plant or animal, food, document or screen, product, math or code, a person, and so on) and respond in the way most useful for that. Cover the main subject, key details (materials, colors, condition, readable text), context, and anything unusual. If it is a document or screenshot, summarize the content. If it is a problem, solve it. If it is a plant, animal or object, identify it with a confidence level and say what it is for or how to care for it. Use 4 to 8 sentences unless the content needs more.${hint}`;
  }
}

export async function POST(request) {
  try {
    const { image, mode, question, detections } = await request.json();
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
    const prompt = promptFor(mode, question, detections);

    const started = Date.now();
    const left = () => 50000 - (Date.now() - started);
    const attempts = [];
    let reply = null;

    const ORDER = [...MODELS, ...MODELS];
    for (let i = 0; i < ORDER.length; i++) {
      const model = ORDER[i];
      if (i === MODELS.length) await new Promise((r) => setTimeout(r, 500));
      const budget = Math.min(quick ? 8000 : 14000, left());
      if (budget < 3000) break;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ inline_data: { mime_type: mime, data } }, { text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: quick ? 300 : 2048 }
            }),
            signal: AbortSignal.timeout(budget)
          }
        );
        let json = {};
        try { json = await res.json(); } catch {}
        const text = (json?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
        attempts.push(`${model}:${res.status}${res.ok && !text ? ":empty" : ""}`);
        if (res.ok && text) { reply = text; break; }
        if (!res.ok && ![400, 404, 429, 500, 503, 504].includes(res.status)) break;
      } catch (e) {
        attempts.push(`${model}:timeout`);
      }
    }

    if (!reply) {
      return Response.json({ error: `Vision is busy or out of quota [${attempts.join(", ")}]` }, { status: 502 });
    }
    return Response.json({ reply });
  } catch {
    return Response.json({ error: "Vision server error" }, { status: 500 });
  }
}
