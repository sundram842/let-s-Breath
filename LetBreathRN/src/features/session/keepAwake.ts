import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

type SessionServiceModule = {
  start: () => void;
  stop: () => void;
  isIgnoringBatteryOptimizations: () => Promise<boolean>;
  requestIgnoreBatteryOptimizations: () => void;
};

const SessionService = NativeModules.SessionService as SessionServiceModule | undefined;

/**
 * Keeps a backgrounded breathing session alive with the screen off, via an Android
 * foreground service that holds a partial wake lock (see SessionForegroundService.kt).
 * Without it, pressing the power button lets the CPU sleep and the haptic/audio
 * timeline stops. No-op on iOS (background haptics aren't possible there anyway).
 *
 * Start it while the app is still foreground (Android 12+ forbids starting a
 * foreground service from the background).
 */
export const SessionKeepAlive = {
  start() {
    if (Platform.OS === 'android') SessionService?.start();
  },
  stop() {
    if (Platform.OS === 'android') SessionService?.stop();
  },
  /**
   * Ask — once, and only when the user opts into background sessions — for the two
   * things background execution needs on Android: notification permission (for the
   * foreground-service notice on 13+) and a battery-optimization exemption so the
   * OS doesn't freeze us with the screen off. No-op / already-granted paths are silent.
   */
  async ensureBackgroundPermissions() {
    if (Platform.OS !== 'android') return;
    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch {
        // ignore — the session still runs, just without a visible notification
      }
    }
    try {
      const exempt = await SessionService?.isIgnoringBatteryOptimizations();
      if (exempt === false) SessionService?.requestIgnoreBatteryOptimizations();
    } catch {
      // ignore — feature still works where the OS is lenient
    }
  },
};
