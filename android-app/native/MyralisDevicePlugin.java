package com.myralis.app;

import android.Manifest;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.ContactsContract;
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
}
