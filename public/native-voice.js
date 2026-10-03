(function () {
  try {
    var C = window.Capacitor;
    if (!C || !(C.isNativePlatform && C.isNativePlatform())) return;
    var T = C.Plugins && C.Plugins.TextToSpeech;
    function clean(t) {
      return String(t || "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/Sources:[\s\S]*$/, "")
        .replace(/[*_#~>|]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3500);
    }
    window.SpeechSynthesisUtterance = function (text) {
      this.text = text; this.rate = 1; this.pitch = 1; this.volume = 1; this.lang = "en-US"; this.voice = null;
    };
    var shim = {
      speaking: false, pending: false, paused: false,
      getVoices: function () { return []; },
      cancel: function () { try { if (T) T.stop(); } catch (e) {} },
      speak: function (u) {
        if (!T) { alert("Native TTS plugin missing. Plugins: " + Object.keys(C.Plugins || {}).join(", ")); return; }
        var t = clean(u && u.text);
        if (!t) return;
        try { T.stop(); } catch (e) {}
        T.speak({ text: t, lang: (u && u.lang) || "en-US", rate: (u && u.rate) || 1, pitch: (u && u.pitch) || 1, volume: (u && u.volume) || 1 })
          .catch(function (e) { alert("TTS error: " + ((e && e.message) || e)); });
      },
      addEventListener: function () {}, removeEventListener: function () {}
    };
    Object.defineProperty(window, "speechSynthesis", { value: shim, configurable: true });
  } catch (e) {}
})();
