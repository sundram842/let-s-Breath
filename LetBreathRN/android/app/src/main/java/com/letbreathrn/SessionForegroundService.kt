package com.letbreathrn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager

/**
 * Keeps a breathing session alive while the app is backgrounded and — crucially —
 * while the screen is off. A foreground service stops the OS from freezing the
 * process, and a PARTIAL_WAKE_LOCK keeps the CPU running so the pre-scheduled
 * vibration timeline and audio cues continue after the power button is pressed.
 *
 * Started/stopped from JS via SessionServiceModule (start() while the app is still
 * foreground, so the Android 12+ background-start restriction doesn't apply).
 */
class SessionForegroundService : Service() {
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startAsForeground()
    acquireWakeLock()
    // If the OS kills us, try to restart so the session can keep going.
    return START_STICKY
  }

  private fun startAsForeground() {
    val channelId = "letbreath_session"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel =
        NotificationChannel(channelId, "Breathing session", NotificationManager.IMPORTANCE_LOW)
      channel.setShowBadge(false)
      val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      nm.createNotificationChannel(channel)
    }

    val notification: Notification =
      Notification.Builder(this, channelId)
        .setContentTitle("Let Breath")
        .setContentText("Breathing session in progress")
        .setSmallIcon(applicationInfo.icon)
        .setOngoing(true)
        .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      @Suppress("DEPRECATION")
      startForeground(NOTIF_ID, notification)
    }
  }

  private fun acquireWakeLock() {
    if (wakeLock == null) {
      val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
      wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LetBreath:SessionWakeLock")
    }
    wakeLock?.let { if (!it.isHeld) it.acquire(WAKE_LOCK_TIMEOUT_MS) }
  }

  private fun releaseWakeLock() {
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
  }

  override fun onDestroy() {
    releaseWakeLock()
    super.onDestroy()
  }

  companion object {
    private const val NOTIF_ID = 4242
    // Safety cap so a leaked lock can't drain the battery indefinitely.
    private const val WAKE_LOCK_TIMEOUT_MS = 60L * 60L * 1000L // 1 hour
  }
}
