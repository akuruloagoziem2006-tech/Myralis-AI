package com.myralis.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.Window;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class AssistantActivity extends Activity {
  private static final String API = "https://myralis-ai.vercel.app/api/voice";
  private static final int REQ_MIC = 41;
  private final Handler ui = new Handler(Looper.getMainLooper());
  private final List<JSONObject> history = new ArrayList<>();
  private TextView replyView;
  private TextView statusView;
  private EditText input;
  private SpeechRecognizer recognizer;
  private TextToSpeech tts;
  private boolean busy;

  @Override
  protected void onCreate(Bundle saved) {
    super.onCreate(saved);
    Window w = getWindow();
    w.setBackgroundDrawable(new ColorDrawable(0x00000000));
    w.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

    FrameLayout root = new FrameLayout(this);
    root.setBackgroundColor(0x88000000);
    root.setOnClickListener(v -> finish());

    LinearLayout panel = new LinearLayout(this);
    panel.setOrientation(LinearLayout.VERTICAL);
    panel.setPadding(dp(18), dp(16), dp(18), dp(18));
    GradientDrawable bg = new GradientDrawable();
    bg.setColor(0xFF18181B);
    bg.setCornerRadii(new float[]{dp(22), dp(22), dp(22), dp(22), 0, 0, 0, 0});
    panel.setBackground(bg);
    panel.setClickable(true);

    TextView title = new TextView(this);
    title.setText("✧  Myralis");
    title.setTextColor(0xFFFFFFFF);
    title.setTextSize(17);
    title.setTypeface(null, android.graphics.Typeface.BOLD);
    panel.addView(title);

    statusView = new TextView(this);
    statusView.setTextColor(0xFF9CA3AF);
    statusView.setTextSize(13);
    statusView.setText("Ask anything, or tap Talk.");
    panel.addView(statusView);

    replyView = new TextView(this);
    replyView.setTextColor(0xFFF4F4F5);
    replyView.setTextSize(16);
    replyView.setLineSpacing(0, 1.2f);
    ScrollView scroll = new ScrollView(this);
    scroll.addView(replyView);
    LinearLayout.LayoutParams sl = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(230));
    sl.topMargin = dp(12);
    panel.addView(scroll, sl);

    LinearLayout row = new LinearLayout(this);
    row.setOrientation(LinearLayout.HORIZONTAL);
    row.setGravity(Gravity.CENTER_VERTICAL);
    input = new EditText(this);
    input.setHint("Ask Myralis...");
    input.setHintTextColor(0xFF71717A);
    input.setTextColor(0xFFFFFFFF);
    input.setSingleLine(true);
    input.setImeOptions(EditorInfo.IME_ACTION_SEND);
    input.setOnEditorActionListener((v, actionId, ev) -> {
      send(input.getText().toString());
      return true;
    });
    row.addView(input, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
    Button sendBtn = pill("Send", 0xFF8B5CF6);
    sendBtn.setOnClickListener(v -> send(input.getText().toString()));
    row.addView(sendBtn, new LinearLayout.LayoutParams(dp(76), dp(48)));
    LinearLayout.LayoutParams rl = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    rl.topMargin = dp(10);
    panel.addView(row, rl);

    LinearLayout bottom = new LinearLayout(this);
    bottom.setOrientation(LinearLayout.HORIZONTAL);
    Button talk = pill("🎙  Talk", 0xFF0E7490);
    talk.setOnClickListener(v -> startListening());
    bottom.addView(talk, new LinearLayout.LayoutParams(0, dp(46), 1f));
    Button open = pill("Open app", 0xFF27272A);
    open.setOnClickListener(v -> {
      Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
      if (i != null) startActivity(i);
      finish();
    });
    LinearLayout.LayoutParams ol = new LinearLayout.LayoutParams(0, dp(46), 1f);
    ol.leftMargin = dp(10);
    bottom.addView(open, ol);
    Button close = pill("Close", 0xFF27272A);
    close.setOnClickListener(v -> finish());
    LinearLayout.LayoutParams cl = new LinearLayout.LayoutParams(0, dp(46), 1f);
    cl.leftMargin = dp(10);
    bottom.addView(close, cl);
    LinearLayout.LayoutParams bl = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    bl.topMargin = dp(10);
    panel.addView(bottom, bl);

    FrameLayout.LayoutParams pl = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM);
    root.addView(panel, pl);
    setContentView(root);

    if (SpeechRecognizer.isRecognitionAvailable(this)) {
      recognizer = SpeechRecognizer.createSpeechRecognizer(this);
      recognizer.setRecognitionListener(listener);
    }
    tts = new TextToSpeech(this, status -> {
      if (status == TextToSpeech.SUCCESS && tts != null) tts.setLanguage(Locale.US);
    });
  }

  private final RecognitionListener listener = new RecognitionListener() {
    @Override public void onReadyForSpeech(Bundle p) { statusView.setText("Listening..."); }
    @Override public void onBeginningOfSpeech() { }
    @Override public void onRmsChanged(float f) { }
    @Override public void onBufferReceived(byte[] b) { }
    @Override public void onEndOfSpeech() { statusView.setText("Thinking..."); }
    @Override public void onError(int e) { statusView.setText("Didn't catch that. Tap Talk to try again."); }
    @Override public void onResults(Bundle r) {
      ArrayList<String> m = r.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
      if (m != null && !m.isEmpty()) send(m.get(0));
    }
    @Override public void onPartialResults(Bundle p) { }
    @Override public void onEvent(int t, Bundle p) { }
  };

  private void startListening() {
    if (recognizer == null) {
      statusView.setText("Voice isn't available on this phone. Type your question instead.");
      return;
    }
    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
      return;
    }
    Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
    statusView.setText("Listening...");
    recognizer.startListening(i);
  }

  @Override
  public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
    super.onRequestPermissionsResult(code, perms, res);
    if (code == REQ_MIC && res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) {
      startListening();
    } else {
      statusView.setText("Allow microphone access to talk to Myralis.");
    }
  }

  private void send(String raw) {
    final String text = raw == null ? "" : raw.trim();
    if (text.isEmpty() || busy) return;
    busy = true;
    input.setText("");
    statusView.setText("Thinking...");
    final JSONObject user = msg("user", text);
    final List<JSONObject> msgs = new ArrayList<>(history);
    msgs.add(user);
    new Thread(() -> {
      String reply = "";
      boolean ok = false;
      try {
        JSONArray arr = new JSONArray();
        for (int i = Math.max(0, msgs.size() - 10); i < msgs.size(); i++) arr.put(msgs.get(i));
        JSONObject body = new JSONObject().put("messages", arr).put("memory", "");
        HttpURLConnection c = (HttpURLConnection) new URL(API).openConnection();
        c.setRequestMethod("POST");
        c.setConnectTimeout(15000);
        c.setReadTimeout(60000);
        c.setDoOutput(true);
        c.setRequestProperty("Content-Type", "application/json");
        try (OutputStream os = c.getOutputStream()) {
          os.write(body.toString().getBytes("UTF-8"));
        }
        int code = c.getResponseCode();
        String resp = readAll(code < 400 ? c.getInputStream() : c.getErrorStream());
        JSONObject j = new JSONObject(resp);
        if (j.has("reply")) {
          reply = j.getString("reply");
          ok = true;
        } else {
          reply = j.optString("error", "No reply from Myralis.");
        }
      } catch (Exception e) {
        reply = "Couldn't reach Myralis: " + e.getMessage();
      }
      final String out = reply;
      final boolean good = ok;
      ui.post(() -> {
        busy = false;
        statusView.setText("");
        replyView.setText(out);
        if (good) {
          history.add(user);
          history.add(msg("assistant", out));
          while (history.size() > 10) history.remove(0);
          speak(out);
        }
      });
    }).start();
  }

  private void speak(String text) {
    if (tts != null) tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "myralis");
  }

  private static JSONObject msg(String role, String content) {
    try {
      return new JSONObject().put("role", role).put("content", content);
    } catch (Exception e) {
      return new JSONObject();
    }
  }

  private static String readAll(InputStream is) throws Exception {
    ByteArrayOutputStream bo = new ByteArrayOutputStream();
    byte[] buf = new byte[4096];
    int n;
    while ((n = is.read(buf)) > 0) bo.write(buf, 0, n);
    is.close();
    return bo.toString("UTF-8");
  }

  private Button pill(String label, int color) {
    Button b = new Button(this);
    b.setText(label);
    b.setAllCaps(false);
    b.setTextColor(0xFFFFFFFF);
    GradientDrawable d = new GradientDrawable();
    d.setColor(color);
    d.setCornerRadius(dp(24));
    b.setBackground(d);
    return b;
  }

  private int dp(int v) {
    return Math.round(v * getResources().getDisplayMetrics().density);
  }

  @Override
  protected void onDestroy() {
    if (recognizer != null) recognizer.destroy();
    if (tts != null) tts.shutdown();
    super.onDestroy();
  }
}
