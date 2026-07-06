/**
 * Returns the active color palette based on the user's saved theme preference
 * (Light / Dark) from Settings — applied consistently across the whole app.
 *
 * Imports the provider hook directly (not the feature barrel) to avoid an
 * import cycle with the themed components that also consume this hook.
 */
import { Colors } from '@/constants/theme';
import { useBreathingSettings } from '@/features/settings/context/SettingsProvider';
import { breathingColors, type BreathingColors } from '@/theme/colors';

export function useTheme() {
  const { themePreference } = useBreathingSettings();
  return Colors[themePreference];
}

/**
 * The breathing (Home) palette for the active Light/Dark preference. Kept
 * separate from `useTheme()` because the breathing screen is a full-bleed
 * gradient with its own tokens (ring, gradient, translucent controls) rather
 * than the flat background/text tokens the rest of the app uses.
 */
export function useBreathingColors(): BreathingColors {
  const { themePreference } = useBreathingSettings();
  return breathingColors[themePreference];
}
