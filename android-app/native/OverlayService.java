package com.myralis.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

public class OverlayService extends Service {
  static volatile String pendingAction = "";
  private static final int NOTE_ID = 88;
  private WindowManager wm;
  private TextView bubble;
  private WindowManager.LayoutParams lp;
  private final Handler handler = new Handler(Looper.getMainLooper());
  private final Runnable watchdog = new Runnable() {
    @Override
    public void run() {
      if (bubble != null && !bubble.isAttachedToWindow()) {
        try { wm.addView(bubble, lp); } catch (Exception e) { }
      }
      if (bubble != null) handler.postDelayed(this, 2000);
    }
  };

  @Override
  public IBinder onBind(Intent intent) { return null; }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    startAsForeground();
    if (bubble != null) return START_STICKY;
    wm = (WindowManager) getSystemService(WINDOW_SERVICE);
    bubble = new TextView(this);
    bubble.setText("✧");
    bubble.setTextSize(22);
    bubble.setTextColor(0xFFFFFFFF);
    bubble.setGravity(Gravity.CENTER);
    GradientDrawable g = new GradientDrawable();
    g.setShape(GradientDrawable.OVAL);
    g.setColor(0xFF7C3AED);
    bubble.setBackground(g);

    int size = (int) (56 * getResources().getDisplayMetrics().density);
    int type = Build.VERSION.SDK_INT >= 26
        ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        : WindowManager.LayoutParams.TYPE_PHONE;
    lp = new WindowManager.LayoutParams(size, size, type,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
    lp.gravity = Gravity.TOP | Gravity.START;
    lp.x = 20;
    lp.y = 300;

    bubble.setOnTouchListener(new View.OnTouchListener() {
      int startX, startY;
      float touchX, touchY;
      boolean moved, longPressed;
      final Runnable longPress = new Runnable() {
        @Override
        public void run() {
          longPressed = true;
          pendingAction = "call";
          openMyralis();
        }
      };

      @Override
      public boolean onTouch(View v, MotionEvent e) {
        switch (e.getAction()) {
          case MotionEvent.ACTION_DOWN:
            startX = lp.x; startY = lp.y;
            touchX = e.getRawX(); touchY = e.getRawY();
            moved = false; longPressed = false;
            handler.postDelayed(longPress, 500);
            return true;
          case MotionEvent.ACTION_MOVE:
            float dx = e.getRawX() - touchX;
            float dy = e.getRawY() - touchY;
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
              moved = true;
              handler.removeCallbacks(longPress);
            }
            if (moved) {
              lp.x = startX + (int) dx;
              lp.y = startY + (int) dy;
              wm.updateViewLayout(bubble, lp);
            }
            return true;
          case MotionEvent.ACTION_UP:
            handler.removeCallbacks(longPress);
            if (!moved && !longPressed) {
              pendingAction = "";
              openAssistant();
            }
            return true;
          case MotionEvent.ACTION_CANCEL:
            handler.removeCallbacks(longPress);
            return true;
        }
        return false;
      }
    });

    wm.addView(bubble, lp);
    handler.postDelayed(watchdog, 2000);
    return START_STICKY;
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
        .setContentText("Tap the bubble to open. Long-press to start a call.")
        .setSmallIcon(android.R.drawable.ic_menu_view)
        .setOngoing(true)
        .build();
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
    } else {
      startForeground(NOTE_ID, n);
    }
  }

  private void openAssistant() {
    Intent i = new Intent(this, AssistantActivity.class);
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_MULTIPLE_TASK);
    startActivity(i);
  }

  private void openMyralis() {
    Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
    if (i != null) {
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
      startActivity(i);
    }
  }

  @Override
  public void onDestroy() {
    handler.removeCallbacksAndMessages(null);
    if (bubble != null) {
      try { wm.removeView(bubble); } catch (Exception e) { }
      bubble = null;
    }
    stopForeground(true);
    super.onDestroy();
  }
}
