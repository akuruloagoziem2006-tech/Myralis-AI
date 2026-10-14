const BLOCKED_EXT = /\.(js|jsx|ts|tsx|py|md|txt|json|css|html?|png|jpe?g|gif|webp|svg|pdf|zip|apk|exe|csv|xml|ya?ml|env|lock)$/i;

export function extractUrls(text) {
  const src = String(text || "");
  const found = new Set();
  (src.match(/https?:\/\/[^\s<>"'`)\]]+/gi) || []).forEach((u) => found.add(u.replace(/[.,;:!?]+$/, "")));
  (src.match(/(?<![\/\w@.-])((?:[a-z0-9-]+\.)+[a-z]{2,})(\/[^\s<>"'`)\]]*)?/gi) || []).forEach((b) => {
    if (BLOCKED_EXT.test(b.split("/")[0])) return;
    found.add("https://" + b.replace(/[.,;:!?]+$/, ""));
  });
  return [...found].slice(0, 2);
}

function blockedHost(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h.includes(":")) {
    return h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80") || h.startsWith("::ffff:");
  }
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = +m[1], b = +m[2];
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article|header|footer)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

function pickTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim().slice(0, 200) : "";
}

export async function fetchPageText(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { return { url: rawUrl, error: "not a valid address" }; }
  if (!/^https?:$/.test(u.protocol)) return { url: rawUrl, error: "only http and https pages can be opened" };
  if (blockedHost(u.hostname)) return { url: u.toString(), error: "that address is not allowed" };
  try {
    const res = await fetch(u.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android) MyralisBrowse/1.0",
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.5"
      }
    });
    if (!res.ok) return { url: u.toString(), error: "the page returned HTTP " + res.status };
    const final = new URL(res.url || u.toString());
    if (blockedHost(final.hostname)) return { url: u.toString(), error: "it redirected to an address that is not allowed" };
    const type = res.headers.get("content-type") || "";
    if (!/text\/(html|plain)/i.test(type)) {
      return { url: u.toString(), error: "it is not a readable web page (" + (type.split(";")[0] || "unknown type") + ")" };
    }
    const html = (await res.text()).slice(0, 2000000);
    const text = htmlToText(html).slice(0, 12000);
    if (!text) return { url: u.toString(), error: "the page had no readable text" };
    return { url: u.toString(), title: pickTitle(html), text };
  } catch (e) {
    return { url: u.toString(), error: e && e.name === "TimeoutError" ? "the page took too long to load" : "the page could not be loaded" };
  }
}
