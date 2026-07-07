import { Alert, NativeModules, PermissionsAndroid, Platform } from 'react-native';

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

  /**
   * Called when the user turns on Haptic Guidance. Explains — in plain terms —
   * why Android needs a battery-optimization exemption for vibrations to keep
   * working with the screen off, then, if the user agrees, requests exactly those
   * permissions. Stays silent if the app is already exempt (nothing to ask for)
   * so we never nag. No-op on iOS.
   */
  async promptBackgroundHaptics() {
    if (Platform.OS !== 'android') return;

    let exempt = true;
    try {
      exempt = (await SessionService?.isIgnoringBatteryOptimizations()) ?? true;
    } catch {
      exempt = true;
    }

    // Already exempt: just make sure the notification permission is in place for
    // the foreground-service notice, without popping an explanatory dialog.
    if (exempt) {
      void this.ensureBackgroundPermissions();
      return;
    }

    Alert.alert(
      'Keep haptics working with the screen off',
      'For the vibration guidance to stay in sync when your screen is off or the ' +
        'phone is in your pocket, Android needs to exclude this app from battery ' +
        'optimisation. Otherwise the system may pause vibrations once the display ' +
        'turns off.\n\n' +
        'On some phones (e.g. Xiaomi / Redmi), also turn on “Autostart” for this ' +
        'app in Settings.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Allow',
          onPress: () => {
            void SessionKeepAlive.ensureBackgroundPermissions();
          },
        },
      ],
    );
  },
};
