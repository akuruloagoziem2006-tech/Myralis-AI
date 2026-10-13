package com.myralis.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.view.accessibility.AccessibilityEvent;

public class MyralisAccessibilityService extends AccessibilityService {

  @Override
  protected void onServiceConnected() {
    super.onServiceConnected();
    if (!Settings.canDrawOverlays(this)) return;
    Intent svc = new Intent(this, OverlayService.class);
    if (Build.VERSION.SDK_INT >= 26) startForegroundService(svc);
    else startService(svc);
  }

  @Override
  public void onAccessibilityEvent(AccessibilityEvent event) { }

  @Override
  public void onInterrupt() { }

  @Override
  public boolean onUnbind(Intent intent) {
    stopService(new Intent(this, OverlayService.class));
    return super.onUnbind(intent);
  }
}
