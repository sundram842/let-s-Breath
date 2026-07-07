package com.letbreathrn

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** JS bridge to start/stop the session foreground service. Never throws into JS. */
class SessionServiceModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun start() {
    try {
      val ctx = reactApplicationContext
      val intent = Intent(ctx, SessionForegroundService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ctx.startForegroundService(intent)
      } else {
        ctx.startService(intent)
      }
    } catch (_: Exception) {
      // If the OS refuses the service, degrade silently — the app must not crash.
    }
  }

  @ReactMethod
  fun stop() {
    try {
      val ctx = reactApplicationContext
      ctx.stopService(Intent(ctx, SessionForegroundService::class.java))
    } catch (_: Exception) {
    }
  }

  /** Whether this app is already exempt from battery optimization (Doze). */
  @ReactMethod
  fun isIgnoringBatteryOptimizations(promise: Promise) {
    try {
      val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
      promise.resolve(pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName))
    } catch (_: Exception) {
      promise.resolve(true) // if we can't tell, don't nag the user
    }
  }

  /**
   * Show the system "allow background / ignore battery optimization" dialog. Called
   * only when the user opts into background sessions, so we ask for exactly what
   * that feature needs, when they ask for it. Falls back to the app-details screen.
   */
  @ReactMethod
  fun requestIgnoreBatteryOptimizations() {
    val pkg = reactApplicationContext.packageName
    try {
      val intent =
        Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
          data = Uri.parse("package:$pkg")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
      (reactApplicationContext.currentActivity ?: reactApplicationContext).startActivity(intent)
    } catch (_: Exception) {
      try {
        val fallback =
          Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:$pkg")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        reactApplicationContext.startActivity(fallback)
      } catch (_: Exception) {}
    }
  }

  // NativeEventEmitter compatibility (unused, but keeps RN from warning).
  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Int) {}

  companion object {
    const val NAME = "SessionService"
  }
}
