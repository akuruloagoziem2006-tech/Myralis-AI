(function () {
  try {
    var C = window.Capacitor;
    if (!C || !(C.isNativePlatform && C.isNativePlatform())) return;
    var T = C.Plugins && C.Plugins.MyralisDevice;
    var STYLES = {
      warm: [0.95, 0.95],
      bright: [1.2, 1.35],
      deep: [0.85, 0.6],
      calm: [0.8, 1.05]
    };
    function prefs() {
      try {
        var v = JSON.parse(localStorage.getItem("myralis_voice") || "{}");
        var p = STYLES[v.style] || STYLES.warm;
        return { rate: p[0], pitch: p[1], voice: v.name || "" };
      } catch (e) {
        return { rate: 0.95, pitch: 0.95, voice: "" };
      }
    }
    function clean(t) {
      return String(t || "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/Sources:[\s\S]*$/, "").replace(/[*_#~>|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 3500);
    }
    window.SpeechSynthesisUtterance = function (text) {
      this.text = text; this.rate = 1; this.pitch = 1; this.volume = 1; this.lang = "en-US"; this.voice = null;
    };
    var shim = {
      speaking: false, pending: false, paused: false,
      getVoices: function () { return []; },
      cancel: function () { try { if (T) T.stop(); } catch (e) {} },
      speak: function (u) {
        if (!T) return;
        var t = clean(u && u.text);
        if (!t) return;
        var p = prefs();
        try { T.stop(); } catch (e) {}
        T.speak({ text: t, lang: "en-US", volume: 1.0, rate: p.rate, pitch: p.pitch, voice: p.voice })
          .catch(function (e) { alert("TTS error: " + ((e && e.message) || e)); });
      },
      addEventListener: function () {}, removeEventListener: function () {}
    };
    Object.defineProperty(window, "speechSynthesis", { value: shim, configurable: true });
  } catch (e) {}
})();
