export const maxDuration = 60;
const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const apiFor = (m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

function buildContents(messages) {
  const recent = (messages || []).slice(-12);
  const contents = [];
  recent.forEach((msg, i) => {
    const parts = [];
    const isLast = i === recent.length - 1;
    if (isLast && msg.image && msg.image.startsWith("data:image")) {
      const mime = msg.image.substring(5, msg.image.indexOf(";")) || "image/jpeg";
      parts.push({ inline_data: { mime_type: mime, data: msg.image.split(",")[1] } });
    }
    if (msg.content && msg.content.trim() !== "") parts.push({ text: msg.content });
    if (parts.length) {
      contents.push({ role: msg.role === "assistant" ? "model" : "user", parts });
    }
  });
  while (contents.length && contents[0].role !== "user") contents.shift();
  return contents;
}

async function callGeminiRaw(model, body) {
  const response = await fetch(apiFor(model), {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  return { response, data };
}

async function callGemini(model, body) {
  try {
    return await callGeminiRaw(model, body);
  } catch (e) {
    return { response: { ok: false, status: 504 }, data: { error: { message: "Timeout or network error on " + model } } };
  }
}

export async function POST(request) {
  try {
    const { messages, memory } = await request.json();
    const now = new Date().toUTCString();

    const systemPrompt = `You are Myralis, a highly capable personal AI assistant.

Today's date and time (UTC): ${now}

Identity:
- Your name is Myralis
- You help with learning, writing, planning, coding, analysis, and everyday questions
- Online you use Gemini; the user also has a local offline version of you
- Personality: loyal, calm, competent, warm, lightly witty when appropriate
- Inspired by a trusted personal assistant (like Jarvis), but natural and human-friendly

Only introduce yourself when asked who you are. Then mention memory, vision, voice, and offline local mode briefly. Never repeat your introduction otherwise.

How to answer:
- Be accurate first. If unsure, say so
- For news, recent events, prices, or anything that may have changed, use Google Search and give dated, specific facts
- Prefer clear structure: short paragraphs, bullets, or steps when useful
- Match depth to the question: short for simple asks, deeper for complex ones
- Be practical and specific; answer the actual question directly
- Use the user's memory to personalize only when it helps
- Treat conversations as private

Current memory about the user:
${memory || "No information saved yet."}

Memory updates:
- If the user shares important lasting facts (name, preferences, goals), update memory
- When updating memory, end your reply with:
[[MEMORY]]concise updated memory[[/MEMORY]]
- Keep memory short and useful

Vision requests:
- If the user message is about a camera frame or detected objects, describe what is visible clearly and usefully

Style:
- Clear international English
- No unnecessary fluff
- No fake claims about actions you cannot perform`;

    const contents = buildContents(messages);
    if (!contents.length) {
      return Response.json({ error: "Empty message" }, { status: 400 });
    }

    const base = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096, topP: 0.95 }
    };

    let r;
    const tried = [];
    let usedModel = "";
    for (const model of MODELS) {
      tried.push(model); usedModel = model;
      r = await callGemini(model, { ...base, tools: [{ google_search: {} }] });
      if (!r.response.ok && [400, 429].includes(r.response.status)) r = await callGemini(model, base);
      if (r.response.ok) break;
      if (![404, 429, 500, 503, 504].includes(r.response.status)) break;
    }
    if (!r.response.ok) {
      return Response.json(
        { error: (r.data.error?.message || "API Error") + " [tried: " + tried.join(", ") + "]" },
        { status: 500 }
      );
    }

    const cand = r.data.candidates?.[0];
    let reply = (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
    if (!reply) {
      reply = cand?.finishReason === "SAFETY"
        ? "I can't help with that one."
        : "I couldn't generate a response. Please try again.";
    }

    let updatedMemory = null;
    const memoryMatch = reply.match(/\[\[MEMORY\]\]([\s\S]*?)\[\[\/MEMORY\]\]/);
    if (memoryMatch) {
      updatedMemory = memoryMatch[1].trim();
      reply = reply.replace(/\[\[MEMORY\]\][\s\S]*?\[\[\/MEMORY\]\]/, "").trim();
    }

    const chunks = cand?.groundingMetadata?.groundingChunks || [];
    const links = chunks
      .filter((c) => c.web?.uri)
      .slice(0, 3)
      .map((c) => `- [${c.web.title || c.web.uri}](${c.web.uri})`);
    if (links.length) reply += "\n\nSources:\n" + links.join("\n");

    return Response.json({ reply, updatedMemory, model: usedModel });
  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
