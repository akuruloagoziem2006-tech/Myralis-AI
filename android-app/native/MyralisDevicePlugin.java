package com.myralis.app;

import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import java.util.List;

import android.Manifest;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.ContactsContract;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.Calendar;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import java.util.Locale;

@CapacitorPlugin(
    name = "MyralisDevice",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_CALENDAR }, alias = "calendar"),
        @Permission(strings = { Manifest.permission.READ_CONTACTS }, alias = "contacts")
    }
)
public class MyralisDevicePlugin extends Plugin {

  private void done(PluginCall call, String message) {
    JSObject r = new JSObject();
    r.put("ok", true);
    r.put("message", message);
    call.resolve(r);
  }

  @PluginMethod
  public void setAlarm(PluginCall call) {
    Integer hour = call.getInt("hour");
    Integer minute = call.getInt("minute");
    String label = call.getString("label", "Myralis alarm");
    if (hour == null || minute == null || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      call.reject("hour (0-23) and minute (0-59) are required");
      return;
    }
    Intent i = new Intent(AlarmClock.ACTION_SET_ALARM)
        .putExtra(AlarmClock.EXTRA_HOUR, hour)
        .putExtra(AlarmClock.EXTRA_MINUTES, minute)
        .putExtra(AlarmClock.EXTRA_MESSAGE, label)
        .putExtra(AlarmClock.EXTRA_SKIP_UI, true);
    try {
      getActivity().startActivity(i);
      done(call, "Alarm set");
    } catch (Exception e) {
      call.reject("No clock app found on this phone");
    }
  }

  @PluginMethod
  public void setTimer(PluginCall call) {
    Integer seconds = call.getInt("seconds");
    String label = call.getString("label", "Myralis timer");
    if (seconds == null || seconds <= 0) {
      call.reject("seconds must be greater than 0");
      return;
    }
    Intent i = new Intent(AlarmClock.ACTION_SET_TIMER)
        .putExtra(AlarmClock.EXTRA_LENGTH, seconds)
        .putExtra(AlarmClock.EXTRA_MESSAGE, label)
        .putExtra(AlarmClock.EXTRA_SKIP_UI, true);
    try {
      getActivity().startActivity(i);
      done(call, "Timer set");
    } catch (Exception e) {
      call.reject("No clock app found on this phone");
    }
  }

  @PluginMethod
  public void battery(PluginCall call) {
    Intent b = getContext().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
    if (b == null) {
      call.reject("Battery info unavailable");
      return;
    }
    int level = b.getIntExtra("level", -1);
    int scale = b.getIntExtra("scale", 100);
    int status = b.getIntExtra("status", -1);
    JSObject r = new JSObject();
    r.put("percent", Math.round(level * 100f / scale));
    r.put("charging", status == 2 || status == 5);
    call.resolve(r);
  }

  @PluginMethod
  public void share(PluginCall call) {
    String text = call.getString("text", "");
    Intent s = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text);
    getActivity().startActivity(Intent.createChooser(s, "Share with"));
    done(call, "Share sheet opened");
  }

  @PluginMethod
  public void dial(PluginCall call) {
    String number = call.getString("number", "");
    if (number.isEmpty()) {
      call.reject("number is required");
      return;
    }
    getActivity().startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + Uri.encode(number))));
    done(call, "Dialer opened");
  }

  @PluginMethod
  public void openApp(PluginCall call) {
    String pkg = call.getString("package", "");
    Intent i = getContext().getPackageManager().getLaunchIntentForPackage(pkg);
    if (i == null) {
      call.reject("App not installed: " + pkg);
      return;
    }
    getActivity().startActivity(i);
    done(call, "Opened " + pkg);
  }

  @PluginMethod
  public void addEvent(PluginCall call) {
    String title = call.getString("title", "Myralis event");
    long begin = call.getData().optLong("begin", -1);
    long end = call.getData().optLong("end", -1);
    if (begin < 0) {
      call.reject("begin time is required");
      return;
    }
    if (end < 0) end = begin + 3600000L;
    Intent i = new Intent(Intent.ACTION_INSERT)
        .setData(CalendarContract.Events.CONTENT_URI)
        .putExtra(CalendarContract.Events.TITLE, title)
        .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, begin)
        .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, end);
    getActivity().startActivity(i);
    done(call, "Opened your calendar to confirm the event");
  }

  @PluginMethod
  public void todayEvents(PluginCall call) {
    if (getPermissionState("calendar") != PermissionState.GRANTED) {
      requestPermissionForAlias("calendar", call, "calendarPerm");
      return;
    }
    readToday(call);
  }

  @PermissionCallback
  private void calendarPerm(PluginCall call) {
    if (getPermissionState("calendar") == PermissionState.GRANTED) readToday(call);
    else call.reject("Calendar permission was denied");
  }

  private void readToday(PluginCall call) {
    Calendar c = Calendar.getInstance();
    c.set(Calendar.HOUR_OF_DAY, 0);
    c.set(Calendar.MINUTE, 0);
    c.set(Calendar.SECOND, 0);
    c.set(Calendar.MILLISECOND, 0);
    long start = c.getTimeInMillis();
    long end = start + 86400000L;
    String[] proj = { CalendarContract.Instances.TITLE, CalendarContract.Instances.BEGIN };
    JSArray out = new JSArray();
    try (Cursor cur = CalendarContract.Instances.query(getContext().getContentResolver(), proj, start, end)) {
      if (cur != null) {
        while (cur.moveToNext() && out.length() < 15) {
          JSObject ev = new JSObject();
          ev.put("title", cur.getString(0));
          ev.put("begin", cur.getLong(1));
          out.put(ev);
        }
      }
    } catch (Exception e) {
      call.reject("Could not read calendar: " + e.getMessage());
      return;
    }
    JSObject r = new JSObject();
    r.put("events", out);
    call.resolve(r);
  }

  @PluginMethod
  public void findContact(PluginCall call) {
    if (getPermissionState("contacts") != PermissionState.GRANTED) {
      requestPermissionForAlias("contacts", call, "contactsPerm");
      return;
    }
    lookupContact(call);
  }

  @PermissionCallback
  private void contactsPerm(PluginCall call) {
    if (getPermissionState("contacts") == PermissionState.GRANTED) lookupContact(call);
    else call.reject("Contacts permission was denied");
  }

  private void lookupContact(PluginCall call) {
    String name = call.getString("name", "").trim();
    if (name.isEmpty()) {
      call.reject("name is required");
      return;
    }
    String[] proj = { ContactsContract.Contacts._ID, ContactsContract.Contacts.DISPLAY_NAME };
    try (Cursor cur = getContext().getContentResolver().query(
        ContactsContract.Contacts.CONTENT_URI, proj,
        ContactsContract.Contacts.DISPLAY_NAME + " LIKE ?",
        new String[] { "%" + name + "%" }, null)) {
      if (cur == null || !cur.moveToFirst()) {
        call.reject("No contact matching " + name);
        return;
      }
      String id = cur.getString(0);
      String display = cur.getString(1);
      try (Cursor ph = getContext().getContentResolver().query(
          ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
          new String[] { ContactsContract.CommonDataKinds.Phone.NUMBER },
          ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?",
          new String[] { id }, null)) {
        if (ph == null || !ph.moveToFirst()) {
          call.reject(display + " has no phone number");
          return;
        }
        JSObject r = new JSObject();
        r.put("name", display);
        r.put("number", ph.getString(0));
        call.resolve(r);
      }
    } catch (Exception e) {
      call.reject("Contacts error: " + e.getMessage());
    }
  }

  @PluginMethod
  public void openByName(PluginCall call) {
    String name = call.getString("name", "").trim().toLowerCase();
    if (name.isEmpty()) {
      call.reject("name is required");
      return;
    }
    PackageManager pm = getContext().getPackageManager();
    Intent main = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
    List<ResolveInfo> apps = pm.queryIntentActivities(main, 0);
    String bestLabel = null;
    String bestPkg = null;
    int bestScore = 0;
    for (ResolveInfo ri : apps) {
      String label = String.valueOf(ri.loadLabel(pm));
      String l = label.toLowerCase();
      int score = 0;
      if (l.equals(name)) score = 100;
      else if (l.startsWith(name)) score = 80;
      else if (l.contains(name)) score = 60;
      else if (name.contains(l) && l.length() > 3) score = 40;
      if (score > bestScore) {
        bestScore = score;
        bestLabel = label;
        bestPkg = ri.activityInfo.packageName;
      }
    }
    if (bestPkg == null) {
      call.reject("No installed app matches " + name);
      return;
    }
    Intent launch = pm.getLaunchIntentForPackage(bestPkg);
    if (launch == null) {
      call.reject(bestLabel + " cannot be launched");
      return;
    }
    getActivity().startActivity(launch);
    JSObject r = new JSObject();
    r.put("ok", true);
    r.put("message", "Opened " + bestLabel);
    call.resolve(r);
  }

  @PluginMethod
  public void localChat(PluginCall call) {
    final String msg = call.getString("message", "");
    new Thread(() -> {
      try {
        java.net.HttpURLConnection c = (java.net.HttpURLConnection) new java.net.URL("http://127.0.0.1:8766/chat").openConnection();
        c.setRequestMethod("POST");
        c.setConnectTimeout(5000);
        c.setReadTimeout(15000);
        c.setDoOutput(true);
        c.setRequestProperty("Content-Type", "application/json");
        byte[] body = ("{\"message\":" + org.json.JSONObject.quote(msg) + "}").getBytes("UTF-8");
        try (java.io.OutputStream os = c.getOutputStream()) { os.write(body); }
        java.io.InputStream is = c.getResponseCode() < 400 ? c.getInputStream() : c.getErrorStream();
        java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = is.read(buf)) > 0) bo.write(buf, 0, n);
        is.close();
        org.json.JSONObject jo = new org.json.JSONObject(bo.toString("UTF-8"));
        JSObject r = new JSObject();
        r.put("reply", jo.optString("reply", ""));
        call.resolve(r);
      } catch (Exception e) {
        call.reject("Local server unreachable: " + e.getMessage());
      }
    }).start();
  }

  @PluginMethod
  public void localStatus(PluginCall call) {
    new Thread(() -> {
      boolean up = false;
      try {
        java.net.HttpURLConnection c = (java.net.HttpURLConnection) new java.net.URL("http://127.0.0.1:8766/status").openConnection();
        c.setConnectTimeout(1500);
        c.setReadTimeout(1500);
        up = c.getResponseCode() == 200;
      } catch (Exception e) {
        up = false;
      }
      JSObject r = new JSObject();
      r.put("up", up);
      call.resolve(r);
    }).start();
  }

  private TextToSpeech tts;
  private boolean ttsReady;
  private String ttsVoiceName = "";
  private String ttsPending;
  private float ttsPendingRate = 1.0f;
  private float ttsPendingPitch = 1.0f;
  private PluginCall speakCall;

  @Override
  public void load() {
    tts = new TextToSpeech(getContext(), status -> {
      ttsReady = status == TextToSpeech.SUCCESS;
      if (ttsReady) {
        tts.setLanguage(Locale.US);
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
          @Override public void onStart(String id) { }
          @Override public void onDone(String id) { finishSpeak(); }
          @Override public void onError(String id) { finishSpeak(); }
        });
        if (ttsPending != null) {
          String t = ttsPending;
          ttsPending = null;
          doSpeak(t, ttsPendingRate, ttsPendingPitch);
        }
      }
    });
  }

  private void finishSpeak() {
    PluginCall c = speakCall;
    speakCall = null;
    if (c != null) c.resolve();
  }

  private void doSpeak(String text, float rate, float pitch) {
    tts.setSpeechRate(rate);
    tts.setPitch(pitch);
    applyVoice(ttsVoiceName);
    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "myralis");
  }

  @PluginMethod
  public void speak(PluginCall call) {
    String text = call.getString("text", "");
    if (text == null || text.trim().isEmpty()) {
      call.resolve();
      return;
    }
    float rate = call.getFloat("rate", 1.0f);
    float pitch = call.getFloat("pitch", 1.0f);
    ttsVoiceName = call.getString("voice", "");
    finishSpeak();
    speakCall = call;
    if (ttsReady) {
      doSpeak(text, rate, pitch);
    } else {
      ttsPending = text;
      ttsPendingRate = rate;
      ttsPendingPitch = pitch;
    }
  }

  @PluginMethod
  public void stop(PluginCall call) {
    ttsPending = null;
    if (tts != null) tts.stop();
    finishSpeak();
    call.resolve();
  }

  @Override
  protected void handleOnDestroy() {
    if (tts != null) {
      tts.stop();
      tts.shutdown();
    }
    super.handleOnDestroy();
  }

  private boolean usable(android.speech.tts.Voice v) {
    java.util.Set<String> f = v.getFeatures();
    return f == null || !f.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED);
  }

  private void applyVoice(String name) {
    if (tts == null || name == null || name.isEmpty()) return;
    for (android.speech.tts.Voice v : tts.getVoices()) {
      if (v.getName().equals(name) && usable(v)) {
        if (tts.setVoice(v) != TextToSpeech.SUCCESS) tts.setLanguage(Locale.US);
        return;
      }
    }
    tts.setLanguage(Locale.US);
  }

  @PluginMethod
  public void listVoices(PluginCall call) {
    JSArray out = new JSArray();
    if (ttsReady && tts != null) {
      for (android.speech.tts.Voice v : tts.getVoices()) {
        if (v.getLocale() != null && "en".equals(v.getLocale().getLanguage()) && usable(v)) out.put(v.getName());
      }
    }
    JSObject r = new JSObject();
    r.put("voices", out);
    call.resolve(r);
  }
}
