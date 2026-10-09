package com.myralis.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MyralisScreen")
public class MyralisScreenPlugin extends Plugin {

  @PluginMethod
  public void start(PluginCall call) {
    MediaProjectionManager mpm = (MediaProjectionManager) getContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);
    startActivityForResult(call, mpm.createScreenCaptureIntent(), "projectionResult");
  }

  @ActivityCallback
  private void projectionResult(PluginCall call, ActivityResult result) {
    if (call == null) return;
    if (result.getResultCode() != Activity.RESULT_OK) {
      call.reject("Screen sharing was not allowed");
      return;
    }
    Intent svc = new Intent(getContext(), ScreenService.class);
    svc.putExtra("code", result.getResultCode());
    svc.putExtra("data", result.getData());
    if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(svc);
    else getContext().startService(svc);
    JSObject r = new JSObject();
    r.put("ok", true);
    call.resolve(r);
  }

  @PluginMethod
  public void frame(PluginCall call) {
    byte[] b = ScreenService.latest;
    JSObject r = new JSObject();
    r.put("image", b == null ? "" : "data:image/jpeg;base64," + Base64.encodeToString(b, Base64.NO_WRAP));
    call.resolve(r);
  }

  @PluginMethod
  public void stop(PluginCall call) {
    getContext().stopService(new Intent(getContext(), ScreenService.class));
    call.resolve();
  }
}
