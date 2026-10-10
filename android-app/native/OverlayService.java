package com.myralis.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
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

public class OverlayService extends Service {
  static volatile String pendingAction = "";
  private static final int NOTE_ID = 88;
  private static final String API = "https://myralis-ai.vercel.app/api/voice";

  private final Handler handler = new Handler(Looper.getMainLooper());
  private final List<JSONObject> history = new ArrayList<>();
  private WindowManager wm;
  private TextView bubble;
  private WindowManager.LayoutParams bubbleLp;
  private LinearLayout panel;
  private WindowManager.LayoutParams panelLp;
  private TextView replyView;
  private TextView statusView;
  private EditText input;
  private SpeechRecognizer recognizer;
  private TextToSpeech tts;
  private boolean panelOpen;
  private boolean busy;
  private int startX, startY;
  private float touchX, touchY;
  private boolean moved, longPressed;

  private final Runnable longPressRun = () -> {
    longPressed = true;
    pendingAction = "call";
    openMyralis();
  };

  private final Runnable watchdog = new Runnable() {
    @Override
    public void run() {
      if (bubble != null && !bubble.isAttachedToWindow()) {
        try { wm.addView(bubble, bubbleLp); } catch (Exception e) { }
      }
      if (bubble != null) handler.postDelayed(this, 2000);
    }
  };

  @Override
  public IBinder onBind(Intent intent) { return null; }

  @Override
  public void onCreate() {
    super.onCreate();
    wm = (WindowManager) getSystemService(WINDOW_SERVICE);
    if (SpeechRecognizer.isRecognitionAvailable(this)) {
      recognizer = SpeechRecognizer.createSpeechRecognizer(this);
      recognizer.setRecognitionListener(listener);
    }
    tts = new TextToSpeech(this, st -> {
      if (st == TextToSpeech.SUCCESS && tts != null) tts.setLanguage(Locale.US);
    });
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    startAsForeground();
    if (bubble != null) return START_STICKY;

    bubble = new TextView(this);
    bubble.setText("✧");
    bubble.setTextSize(22);
    bubble.setTextColor(0xFFFFFFFF);
    bubble.setGravity(Gravity.CENTER);
    GradientDrawable g = new GradientDrawable();
    g.setShape(GradientDrawable.OVAL);
    g.setColor(0xFF7C3AED);
    bubble.setBackground(g);

    int size = dp(56);
    bubbleLp = new WindowManager.LayoutParams(size, size, overlayType(),
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
    bubbleLp.gravity = Gravity.TOP | Gravity.START;
    bubbleLp.x = 20;
    bubbleLp.y = 300;

    bubble.setOnTouchListener((v, e) -> {
      switch (e.getAction()) {
        case MotionEvent.ACTION_DOWN: {
          startX = bubbleLp.x; startY = bubbleLp.y;
          touchX = e.getRawX(); touchY = e.getRawY();
          moved = false; longPressed = false;
          handler.postDelayed(longPressRun, 500);
          return true;
        }
        case MotionEvent.ACTION_MOVE: {
          float dx = e.getRawX() - touchX;
          float dy = e.getRawY() - touchY;
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            moved = true;
            handler.removeCallbacks(longPressRun);
          }
          if (moved) {
            bubbleLp.x = startX + (int) dx;
            bubbleLp.y = startY + (int) dy;
            wm.updateViewLayout(bubble, bubbleLp);
          }
          return true;
        }
        case MotionEvent.ACTION_UP: {
          handler.removeCallbacks(longPressRun);
          if (!moved && !longPressed) {
            pendingAction = "";
            togglePanel();
          }
          return true;
        }
        case MotionEvent.ACTION_CANCEL:
          handler.removeCallbacks(longPressRun);
          return true;
      }
      return false;
    });

    wm.addView(bubble, bubbleLp);
    handler.postDelayed(watchdog, 2000);
    return START_STICKY;
  }

  private int overlayType() {
    return Build.VERSION.SDK_INT >= 26
        ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        : WindowManager.LayoutParams.TYPE_PHONE;
  }

  private void togglePanel() {
    if (panelOpen) { closePanel(); return; }
    if (panel == null) buildPanel();
    panelLp = new WindowManager.LayoutParams(WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.WRAP_CONTENT, overlayType(),
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
    panelLp.gravity = Gravity.BOTTOM;
    panelLp.softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
    wm.addView(panel, panelLp);
    panelOpen = true;
    statusView.setText("Ask anything, or tap Talk.");
  }

  private void closePanel() {
    setPanelFocusable(false);
    if (panelOpen) {
      try { wm.removeView(panel); } catch (Exception e) { }
      panelOpen = false;
    }
  }

  private void setPanelFocusable(boolean on) {
    if (!panelOpen || panelLp == null) return;
    if (on) panelLp.flags &= ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
    else panelLp.flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
    try { wm.updateViewLayout(panel, panelLp); } catch (Exception e) { }
  }

  private void focusForTyping() {
    setPanelFocusable(true);
    handler.postDelayed(() -> {
      input.requestFocus();
      InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
      if (imm != null) imm.showSoftInput(input, InputMethodManager.SHOW_IMPLICIT);
    }, 200);
  }

  private void buildPanel() {
    panel = new LinearLayout(this);
    panel.setOrientation(LinearLayout.VERTICAL);
    panel.setPadding(dp(16), dp(14), dp(16), dp(14));
    GradientDrawable bg = new GradientDrawable();
    bg.setColor(0xFF18181B);
    bg.setCornerRadii(new float[]{dp(22), dp(22), dp(22), dp(22), 0, 0, 0, 0});
    panel.setBackground(bg);

    TextView title = new TextView(this);
    title.setText("✧  Myralis");
    title.setTextColor(0xFFFFFFFF);
    title.setTextSize(17);
    title.setTypeface(null, android.graphics.Typeface.BOLD);
    panel.addView(title);

    statusView = new TextView(this);
    statusView.setTextColor(0xFF9CA3AF);
    statusView.setTextSize(13);
    panel.addView(statusView);

    replyView = new TextView(this);
    replyView.setTextColor(0xFFF4F4F5);
    replyView.setTextSize(16);
    replyView.setLineSpacing(0, 1.2f);
    ScrollView scroll = new ScrollView(this);
    scroll.addView(replyView);
    LinearLayout.LayoutParams sl = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(240));
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
    input.setOnClickListener(v -> focusForTyping());
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
    open.setOnClickListener(v -> { closePanel(); openMyralis(); });
    LinearLayout.LayoutParams ol = new LinearLayout.LayoutParams(0, dp(46), 1f);
    ol.leftMargin = dp(10);
    bottom.addView(open, ol);
    Button close = pill("Close", 0xFF27272A);
    close.setOnClickListener(v -> closePanel());
    LinearLayout.LayoutParams cl = new LinearLayout.LayoutParams(0, dp(46), 1f);
    cl.leftMargin = dp(10);
    bottom.addView(close, cl);
    LinearLayout.LayoutParams bl = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    bl.topMargin = dp(10);
    panel.addView(bottom, bl);
  }

  private final RecognitionListener listener = new RecognitionListener() {
    @Override public void onReadyForSpeech(Bundle p) { if (statusView != null) statusView.setText("Listening..."); }
    @Override public void onBeginningOfSpeech() { }
    @Override public void onRmsChanged(float f) { }
    @Override public void onBufferReceived(byte[] b) { }
    @Override public void onEndOfSpeech() { if (statusView != null) statusView.setText("Thinking..."); }
    @Override public void onError(int e) { if (statusView != null) statusView.setText("Didn't catch that. Tap Talk to try again."); }
    @Override public void onResults(Bundle r) {
      ArrayList<String> m = r.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
      if (m != null && !m.isEmpty()) send(m.get(0));
    }
    @Override public void onPartialResults(Bundle p) { }
    @Override public void onEvent(int t, Bundle p) { }
  };

  private void startListening() {
    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      statusView.setText("Allow microphone for Myralis in Settings, Apps, Myralis, Permissions.");
      return;
    }
    if (recognizer == null) {
      statusView.setText("Voice isn't available on this phone. Type your question instead.");
      return;
    }
    Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
    statusView.setText("Listening...");
    recognizer.startListening(i);
  }

  private void send(String raw) {
    final String text = raw == null ? "" : raw.trim();
    if (text.isEmpty() || busy) return;
    String local = handleCommand(text);
    if (local != null) {
      input.setText("");
      statusView.setText("");
      replyView.setText(local);
      if (tts != null) tts.speak(local, TextToSpeech.QUEUE_FLUSH, null, "myralis");
      return;
    }
    busy = true;
    input.setText("");
    setPanelFocusable(false);
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
      handler.post(() -> {
        busy = false;
        statusView.setText("");
        replyView.setText(out);
        if (good) {
          history.add(user);
          history.add(msg("assistant", out));
          while (history.size() > 10) history.remove(0);
          if (tts != null) tts.speak(out, TextToSpeech.QUEUE_FLUSH, null, "myralis");
        }
      });
    }).start();
  }

  private String handleCommand(String raw) {
    try {
      String t = raw.trim().toLowerCase(Locale.US);
      java.util.regex.Matcher m;

      m = java.util.regex.Pattern.compile("^(?:set (?:an? )?alarm|wake me)(?: up)? (?:for|at) (\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?$").matcher(t);
      if (m.find()) {
        int h = Integer.parseInt(m.group(1));
        int min = m.group(2) == null ? 0 : Integer.parseInt(m.group(2));
        String ap = m.group(3);
        if ("pm".equals(ap) && h < 12) h += 12;
        if ("am".equals(ap) && h == 12) h = 0;
        if (h > 23 || min > 59) return "That time doesn't look right.";
        Intent i = new Intent(android.provider.AlarmClock.ACTION_SET_ALARM)
            .putExtra(android.provider.AlarmClock.EXTRA_HOUR, h)
            .putExtra(android.provider.AlarmClock.EXTRA_MINUTES, min)
            .putExtra(android.provider.AlarmClock.EXTRA_MESSAGE, "Myralis alarm")
            .putExtra(android.provider.AlarmClock.EXTRA_SKIP_UI, true)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(i);
        return String.format(Locale.US, "Alarm set for %02d:%02d.", h, min);
      }

      m = java.util.regex.Pattern.compile("^(?:set )?(?:a )?timer (?:for )?(\\d+)\\s*(sec|second|min|minute|hour)s?$").matcher(t);
      if (m.find()) {
        int n = Integer.parseInt(m.group(1));
        String unit = m.group(2);
        int secs = unit.startsWith("h") ? n * 3600 : unit.startsWith("m") ? n * 60 : n;
        Intent i = new Intent(android.provider.AlarmClock.ACTION_SET_TIMER)
            .putExtra(android.provider.AlarmClock.EXTRA_LENGTH, secs)
            .putExtra(android.provider.AlarmClock.EXTRA_MESSAGE, "Myralis timer")
            .putExtra(android.provider.AlarmClock.EXTRA_SKIP_UI, true)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(i);
        return "Timer started for " + secs + " seconds.";
      }

      if (t.startsWith("battery")) {
        Intent b = registerReceiver(null, new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (b == null) return "Battery info is unavailable.";
        int level = b.getIntExtra("level", -1);
        int scale = b.getIntExtra("scale", 100);
        int status = b.getIntExtra("status", -1);
        boolean charging = status == 2 || status == 5;
        return "Battery is at " + Math.round(level * 100f / scale) + "%" + (charging ? " and charging." : ".");
      }

      m = java.util.regex.Pattern.compile("^open (.+)$").matcher(t);
      if (m.find()) {
        String name = m.group(1).trim();
        String pkg = findPackage(name);
        if (pkg == null) return "No installed app matches " + name + ".";
        Intent launch = getPackageManager().getLaunchIntentForPackage(pkg);
        if (launch == null) return name + " can't be launched.";
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(launch);
        return "Opened " + name + ".";
      }

      if (t.startsWith("share ")) {
        String text = raw.trim().substring(6);
        Intent s = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text);
        startActivity(Intent.createChooser(s, "Share with").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        return "Opened the share sheet. Pick an app to send it.";
      }

      m = java.util.regex.Pattern.compile("^(?:call|dial|phone) (.+)$").matcher(t);
      if (m.find()) {
        String who = m.group(1).trim();
        if (checkSelfPermission(android.Manifest.permission.READ_CONTACTS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
          return "Allow contacts for Myralis in Settings, Apps, Myralis, Permissions, then try again.";
        }
        String[] found = findNumber(who);
        if (found == null) return "No contact matching " + who + ".";
        Intent d = new Intent(Intent.ACTION_DIAL, android.net.Uri.parse("tel:" + android.net.Uri.encode(found[1])))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(d);
        return "Dialer open for " + found[0] + ". Press call to ring them.";
      }
      return null;
    } catch (Exception e) {
      return "Couldn't do that: " + e.getMessage();
    }
  }

  private String findPackage(String name) {
    android.content.pm.PackageManager pm = getPackageManager();
    Intent main = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
    java.util.List<android.content.pm.ResolveInfo> apps = pm.queryIntentActivities(main, 0);
    String best = null;
    int bestScore = 0;
    for (android.content.pm.ResolveInfo ri : apps) {
      String l = String.valueOf(ri.loadLabel(pm)).toLowerCase(Locale.US);
      int score = 0;
      if (l.equals(name)) score = 100;
      else if (l.startsWith(name)) score = 80;
      else if (l.contains(name)) score = 60;
      else if (name.contains(l) && l.length() > 3) score = 40;
      if (score > bestScore) {
        bestScore = score;
        best = ri.activityInfo.packageName;
      }
    }
    return best;
  }

  private String[] findNumber(String name) {
    android.content.ContentResolver cr = getContentResolver();
    String id = null;
    String display = null;
    try (android.database.Cursor cur = cr.query(android.provider.ContactsContract.Contacts.CONTENT_URI,
        new String[]{android.provider.ContactsContract.Contacts._ID, android.provider.ContactsContract.Contacts.DISPLAY_NAME},
        android.provider.ContactsContract.Contacts.DISPLAY_NAME + " LIKE ?",
        new String[]{"%" + name + "%"}, null)) {
      if (cur == null || !cur.moveToFirst()) return null;
      id = cur.getString(0);
      display = cur.getString(1);
    }
    try (android.database.Cursor ph = cr.query(android.provider.ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
        new String[]{android.provider.ContactsContract.CommonDataKinds.Phone.NUMBER},
        android.provider.ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?",
        new String[]{id}, null)) {
      if (ph == null || !ph.moveToFirst()) return null;
      return new String[]{display, ph.getString(0)};
    }
  }

  private void startAsForeground() {
    Notification.Builder nb;
    if (Build.VERSION.SDK_INT >= 26) {
      NotificationChannel ch = new NotificationChannel("myralis_bubble", "Floating bubble", NotificationManager.IMPORTANCE_MIN);
      getSystemService(NotificationManager.class).createNotificationChannel(ch);
      nb = new Notification.Builder(this, "myralis_bubble");
    } else {
      nb = new Notification.Builder(this);
    }
    Notification n = nb.setContentTitle("Myralis bubble is on")
        .setContentText("Tap the bubble to ask. Long-press to start a call.")
        .setSmallIcon(android.R.drawable.ic_menu_view)
        .setOngoing(true)
        .build();
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
    } else {
      startForeground(NOTE_ID, n);
    }
  }

  private void openMyralis() {
    Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
    if (i != null) {
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
      startActivity(i);
    }
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
  public void onDestroy() {
    handler.removeCallbacksAndMessages(null);
    closePanel();
    if (bubble != null) {
      try { wm.removeView(bubble); } catch (Exception e) { }
      bubble = null;
    }
    if (recognizer != null) recognizer.destroy();
    if (tts != null) tts.shutdown();
    stopForeground(true);
    super.onDestroy();
  }
}
