const PKG = {
  whatsapp: ["com.whatsapp", "com.whatsapp.w4b"],
  youtube: ["com.google.android.youtube"],
  chrome: ["com.android.chrome", "com.google.android.apps.chrome"],
  maps: ["com.google.android.apps.maps"],
  gmail: ["com.google.android.gm"],
  camera: ["com.android.camera", "com.android.camera2", "com.google.android.GoogleCamera"],
  settings: ["com.android.settings"]
};

const pad = (n) => String(n).padStart(2, "0");

function plugin() {
  try {
    const P = window.Capacitor?.Plugins?.MyralisDevice;
    if (window.Capacitor?.isNativePlatform?.() && P) return P;
  } catch {}
  return null;
}

export function parseAction(text) {
  const raw = String(text || "").trim();
  const t = raw.toLowerCase();
  let m;
  if ((m = t.match(/^(?:set (?:an? )?alarm|wake me)(?: up)? (?:for|at) (\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/))) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    if (m[3] === "pm" && h < 12) h += 12;
    if (m[3] === "am" && h === 12) h = 0;
    if (h > 23 || min > 59) return null;
    return { type: "alarm", hour: h, minute: min };
  }
  if ((m = t.match(/^(?:set )?(?:a )?timer (?:for )?(\d+)\s*(sec|second|min|minute|hour)s?$/))) {
    const mult = m[2].startsWith("h") ? 3600 : m[2].startsWith("m") ? 60 : 1;
    return { type: "timer", seconds: parseInt(m[1], 10) * mult };
  }
  if (/^(battery|battery level|how much battery)/.test(t)) return { type: "battery" };
  if (/^(what'?s on my calendar|my schedule|today'?s (events|schedule)|calendar today)/.test(t)) return { type: "calendar" };
  if ((m = t.match(/^(?:call|dial|phone) (.+)$/))) return { type: "call", name: m[1] };
  if ((m = t.match(/^share (.+)$/))) return { type: "share", text: raw.slice(6) };
  if ((m = t.match(/^open (.+)$/))) return { type: "open", app: m[1].trim() };
  return null;
}

export async function runAction(act) {
  const P = plugin();
  if (!P) {
    return { text: "That needs the Myralis Android app. Browsers can't reach alarms, calendar or contacts." };
  }
  try {
    if (act.type === "alarm") {
      const label = `${pad(act.hour)}:${pad(act.minute)}`;
      return {
        text: "",
        pending: {
          summary: `Set an alarm for ${label}?`,
          run: async () => { await P.setAlarm({ hour: act.hour, minute: act.minute }); return `Alarm set for ${label}.`; }
        }
      };
    }
    if (act.type === "timer") {
      const mins = Math.round(act.seconds / 60);
      return {
        text: "",
        pending: {
          summary: `Start a timer for ${act.seconds >= 60 ? mins + " min" : act.seconds + " sec"}?`,
          run: async () => { await P.setTimer({ seconds: act.seconds }); return "Timer started."; }
        }
      };
    }
    if (act.type === "battery") {
      const b = await P.battery();
      return { text: `Battery is at ${b.percent}%${b.charging ? " and charging" : ""}.` };
    }
    if (act.type === "calendar") {
      const r = await P.todayEvents();
      const ev = r.events || [];
      if (!ev.length) return { text: "Nothing on your calendar today." };
      const lines = ev.map((e) => `- ${new Date(e.begin).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${e.title}`);
      return { text: "Today's events:\n" + lines.join("\n") };
    }
    if (act.type === "share") {
      await P.share({ text: act.text });
      return { text: "Opened the share sheet. Pick an app and send it yourself." };
    }
    if (act.type === "open") {
      try {
        await P.openByName({ name: act.app });
        return { text: `Opened ${act.app}.` };
      } catch (e) {
        return { text: "I couldn't open that: " + (e?.message || e) };
      }
    }
    if (act.type === "call") {
      const c = await P.findContact({ name: act.name });
      return {
        text: `Found ${c.name}.`,
        pending: {
          summary: `Open the dialer for ${c.name} (${c.number})? You press call yourself.`,
          run: async () => { await P.dial({ number: c.number }); return `Dialer opened for ${c.name}.`; }
        }
      };
    }
  } catch (e) {
    return { text: "Couldn't do that: " + (e?.message || e) };
  }
  return { text: "" };
}
