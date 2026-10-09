package com.myralis.app;

import android.content.Intent;
import android.provider.AlarmClock;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MyralisDevice")
public class MyralisDevicePlugin extends Plugin {

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
    launch(i, call, "Alarm set for " + String.format("%02d:%02d", hour, minute));
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
    launch(i, call, "Timer set for " + seconds + " seconds");
  }

  private void launch(Intent i, PluginCall call, String message) {
    try {
      getActivity().startActivity(i);
      JSObject r = new JSObject();
      r.put("ok", true);
      r.put("message", message);
      call.resolve(r);
    } catch (Exception e) {
      call.reject("No clock app found on this phone");
    }
  }
}
