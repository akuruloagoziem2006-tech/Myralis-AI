package com.myralis.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.view.WindowManager;
import java.io.ByteArrayOutputStream;

public class ScreenService extends Service {
  static volatile byte[] latest;
  private MediaProjection projection;
  private VirtualDisplay display;
  private ImageReader reader;

  @Override
  public IBinder onBind(Intent intent) { return null; }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (Build.VERSION.SDK_INT >= 26) {
      NotificationChannel ch = new NotificationChannel("myralis_screen", "Live screen", NotificationManager.IMPORTANCE_LOW);
      getSystemService(NotificationManager.class).createNotificationChannel(ch);
    }
    Notification.Builder nb = Build.VERSION.SDK_INT >= 26
        ? new Notification.Builder(this, "myralis_screen") : new Notification.Builder(this);
    Notification n = nb.setContentTitle("Myralis is viewing your screen")
        .setSmallIcon(android.R.drawable.ic_menu_view).build();
    if (Build.VERSION.SDK_INT >= 29) {
      startForeground(77, n, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
    } else {
      startForeground(77, n);
    }

    int code = intent.getIntExtra("code", 0);
    Intent data = intent.getParcelableExtra("data");
    if (data == null) { stopSelf(); return START_NOT_STICKY; }

    MediaProjectionManager mpm = (MediaProjectionManager) getSystemService(MEDIA_PROJECTION_SERVICE);
    projection = mpm.getMediaProjection(code, data);
    projection.registerCallback(new MediaProjection.Callback() {
      @Override public void onStop() { stopSelf(); }
    }, null);

    DisplayMetrics dm = new DisplayMetrics();
    ((WindowManager) getSystemService(WINDOW_SERVICE)).getDefaultDisplay().getRealMetrics(dm);
    final int w = dm.widthPixels / 2;
    final int h = dm.heightPixels / 2;
    reader = ImageReader.newInstance(w, h, PixelFormat.RGBA_8888, 2);
    reader.setOnImageAvailableListener(r -> {
      Image img = null;
      try {
        img = r.acquireLatestImage();
        if (img == null) return;
        Image.Plane p = img.getPlanes()[0];
        int pw = p.getRowStride() / p.getPixelStride();
        Bitmap full = Bitmap.createBitmap(pw, h, Bitmap.Config.ARGB_8888);
        full.copyPixelsFromBuffer(p.getBuffer());
        Bitmap crop = Bitmap.createBitmap(full, 0, 0, w, h);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        crop.compress(Bitmap.CompressFormat.JPEG, 60, out);
        latest = out.toByteArray();
        full.recycle();
        crop.recycle();
      } catch (Exception e) {
        // skip this frame
      } finally {
        if (img != null) img.close();
      }
    }, null);

    display = projection.createVirtualDisplay("MyralisScreen", w, h, dm.densityDpi,
        DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader.getSurface(), null, null);
    return START_NOT_STICKY;
  }

  @Override
  public void onDestroy() {
    latest = null;
    if (display != null) display.release();
    if (reader != null) reader.close();
    if (projection != null) projection.stop();
    super.onDestroy();
  }
}
