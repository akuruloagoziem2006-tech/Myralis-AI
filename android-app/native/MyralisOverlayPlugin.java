package com.myralis.app;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MyralisOverlay")
public class MyralisOverlayPlugin extends Plugin {

  @PluginMethod
  public void start(PluginCall call) {
    if (!Settings.canDrawOverlays(getContext())) {
      Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:" + getContext().getPackageName()));
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(i);
      call.reject("Turn on 'Display over other apps' for Myralis, then tap Floating bubble again");
      return;
    }
    getContext().startService(new Intent(getContext(), OverlayService.class));
    JSObject r = new JSObject();
    r.put("ok", true);
    call.resolve(r);
  }

  @PluginMethod
  public void stop(PluginCall call) {
    getContext().stopService(new Intent(getContext(), OverlayService.class));
    call.resolve();
  }
}
