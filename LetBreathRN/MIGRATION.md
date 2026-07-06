# Let Breath — Expo → React Native CLI Migration

This project is the **bare React Native CLI** version of the Let Breath app
(previously an Expo managed app). It targets **React Native 0.86 + React 19.2**
with the New Architecture enabled by default.

## What was migrated

The entire `src/` tree was preserved — screens, components, theme, local storage,
state (Context providers), business logic and animations are unchanged. Only the
Expo-specific integration layer was replaced.

### Package replacements

| Expo package | Replaced with |
|---|---|
| `expo-router` | `@react-navigation/native` + `native-stack` + `bottom-tabs` (see `src/navigation/`) |
| `expo-linear-gradient` | `react-native-linear-gradient` |
| `expo-haptics` | `react-native-haptic-feedback` (iOS Taptic) + RN `Vibration` (Android waveforms) |
| `expo-audio` | `react-native-sound` |
| `expo-status-bar` | RN `StatusBar` |
| `expo-splash-screen` | native launch screen + JS `AnimatedSplashOverlay` |
| `@expo/vector-icons` | `react-native-vector-icons/Ionicons` |
| `expo-symbols` (SF Symbols) | `react-native-vector-icons/Ionicons` (nearest-equivalent glyphs) |
| `expo-image` | RN `Image` |
| `expo-web-browser` | RN `Linking` |
| `expo-constants`, `expo-linking`, `expo-updates`, `expo-glass-effect`, `@expo/ui`, `expo-font`, `expo-asset`, `expo-device`, `expo-system-ui` | removed (unused after migration) |

Kept as-is (already community, New-Arch compatible): `react-native-reanimated`,
`react-native-worklets`, `react-native-gesture-handler`, `react-native-screens`,
`react-native-safe-area-context`, `react-native-svg`,
`@react-native-async-storage/async-storage`, `@react-native-community/slider`.

### Navigation

Expo Router's file routes became a React Navigation tree (`src/navigation/RootNavigator.tsx`):

- Root **native stack**: `Tabs` → `Session` (breathing) → `Settings`
- **Bottom tabs**: `Home`, `Explore`
- Deep linking preserved via `src/navigation/linking.ts` (`letbreath://session`, etc.)
- Theme (Light/Dark) applied through `NavigationContainer` in `App.tsx`.

## Verified in this environment (Windows)

- `npm install` — clean
- `npx tsc --noEmit` — **0 errors**
- `npx react-native bundle --platform android` — **succeeds** (bundle + assets)

## NOT yet verified — requires proper build machines

Native builds could not be run here (Windows host, JDK 20). Do the following:

### Android (Android Studio / device)
1. **Install JDK 17** and point `JAVA_HOME`/Gradle at it (RN 0.86 requires 17; JDK 20 will fail Gradle).
2. `npm start` (Metro), then `npm run android` — or open `android/` in Android Studio.
3. Permissions already configured in `AndroidManifest.xml`: `VIBRATE`,
   `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`.
4. Ionicons font is bundled via `apply from: .../react-native-vector-icons/fonts.gradle`.
5. Release: generate a production keystore and replace the debug signing in
   `android/app/build.gradle` (`signingConfigs.release`).

### iOS (macOS + Xcode only)
1. `cd ios && bundle install && bundle exec pod install` (autolinks all native modules).
2. Add `node_modules/react-native-vector-icons/Fonts/Ionicons.ttf` to the Xcode
   target's *Copy Bundle Resources* (Info.plist `UIAppFonts` already lists it).
3. `Info.plist` already has: `UIBackgroundModes: audio` (background cues),
   `CFBundleURLTypes` (`letbreath://` deep links).
4. `npm run ios` or build in Xcode.

## Feature parity checklist (to verify on device)

Breathing animation · custom timers · preset practices · pause/resume ·
voice guidance (react-native-sound) · haptic guidance (Taptic + Android waveforms) ·
background waveform · theme switching · settings persistence (AsyncStorage) ·
session resume snapshot.
