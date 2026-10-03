export const maxDuration = 60;

// Simple best-effort rate limit (per serverless instance)
const hits = globalThis.__myralisHits || (globalThis.__myralisHits = new Map());
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_MAX = 40; // max requests per IP per hour

function clientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitCheck(request) {
  const ip = clientIp(request);
  const now = Date.now();
  const row = hits.get(ip) || { count: 0, start: now };
  if (now - row.start > RATE_WINDOW_MS) {
    row.count = 0;
    row.start = now;
  }
  row.count += 1;
  hits.set(ip, row);
  if (row.count > RATE_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((RATE_WINDOW_MS - (now - row.start)) / 1000) };
  }
  return { ok: true };
}



const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const apiFor = (m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
const NEEDS_SEARCH = /\b(news|latest|today|tonight|current|currently|recent|recently|right now|price|stock|score|weather|released?|202[4-9])\b/i;

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

async function callGemini(model, body, timeoutMs) {
  try {
    const response = await fetch(apiFor(model), {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(body)
    });
    let data = {};
    try { data = await response.json(); } catch {}
    return { ok: response.ok, status: response.status, data };
  } catch (e) {
    return { ok: false, status: 504, data: { error: { message: "Timeout or network error" } } };
  }
}

function extract(data) {
  const cand = data?.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
  return { cand, text };
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

Special modes:
- Learning: explain simply, use examples, then offer a quick check question
- Writing: improve clarity and structure while keeping the user's voice
- Planning: give realistic steps, priorities, and time estimates when useful
- Vision: describe what matters first, then useful details, concise and practical

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

    const lastUser = [...(messages || [])].reverse().find((m) => m.role === "user");
    const useSearch = NEEDS_SEARCH.test(lastUser?.content || "");

    const started = Date.now();
    const left = () => 50000 - (Date.now() - started);
    const attempts = [];
    let result = null;
    let fatal = null;

    for (const model of MODELS) {
      const plans = useSearch ? [true, false] : [false];
      for (const withSearch of plans) {
        const budget = Math.min(withSearch ? 20000 : 15000, left());
        if (budget < 3000) break;
        const body = withSearch ? { ...base, tools: [{ google_search: {} }] } : base;
        const r = await callGemini(model, body, budget);
        const { cand, text } = extract(r.data);
        attempts.push(`${model}${withSearch ? "+search" : ""}:${r.status}${r.ok && !text ? ":empty" : ""}`);
        if (r.ok && text) { result = { model, cand, text }; break; }
        if (!r.ok && ![400, 404, 429, 500, 503, 504].includes(r.status)) { fatal = r; break; }
      }
      if (result || fatal) break;
    }

    if (!result) {
      const msg = fatal?.data?.error?.message || "Myralis is busy right now. Please try again in a moment.";
      return Response.json({ error: `${msg} [${attempts.join(", ")}]` }, { status: 502 });
    }

    let reply = result.text;
    let updatedMemory = null;
    const memoryMatch = reply.match(/\[\[MEMORY\]\]([\s\S]*?)\[\[\/MEMORY\]\]/);
    if (memoryMatch) {
      updatedMemory = memoryMatch[1].trim();
      reply = reply.replace(/\[\[MEMORY\]\][\s\S]*?\[\[\/MEMORY\]\]/, "").trim();
    }

    const chunks = result.cand?.groundingMetadata?.groundingChunks || [];
    const links = chunks
      .filter((c) => c.web?.uri)
      .slice(0, 3)
      .map((c) => `- [${c.web.title || c.web.uri}](${c.web.uri})`);
    if (links.length) reply += "\n\nSources:\n" + links.join("\n");

    return Response.json({ reply, updatedMemory, model: result.model, attempts });
  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
