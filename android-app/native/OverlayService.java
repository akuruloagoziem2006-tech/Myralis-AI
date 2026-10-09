package com.myralis.app;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

public class OverlayService extends Service {
  private WindowManager wm;
  private TextView bubble;
  private WindowManager.LayoutParams lp;

  @Override
  public IBinder onBind(Intent intent) { return null; }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
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
      boolean moved;

      @Override
      public boolean onTouch(View v, MotionEvent e) {
        switch (e.getAction()) {
          case MotionEvent.ACTION_DOWN:
            startX = lp.x; startY = lp.y;
            touchX = e.getRawX(); touchY = e.getRawY();
            moved = false;
            return true;
          case MotionEvent.ACTION_MOVE:
            float dx = e.getRawX() - touchX;
            float dy = e.getRawY() - touchY;
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
            lp.x = startX + (int) dx;
            lp.y = startY + (int) dy;
            wm.updateViewLayout(bubble, lp);
            return true;
          case MotionEvent.ACTION_UP:
            if (!moved) openMyralis();
            return true;
        }
        return false;
      }
    });

    wm.addView(bubble, lp);
    return START_STICKY;
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
    if (bubble != null) {
      try { wm.removeView(bubble); } catch (Exception e) { }
      bubble = null;
    }
    super.onDestroy();
  }
}
