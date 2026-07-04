/**
 * Returns the active color palette based on the user's saved theme preference
 * (Light / Dark) from Settings — applied consistently across the whole app.
 *
 * Imports the provider hook directly (not the feature barrel) to avoid an
 * import cycle with the themed components that also consume this hook.
 */
import { Colors } from '@/constants/theme';
import { useBreathingSettings } from '@/features/settings/context/SettingsProvider';

export function useTheme() {
  const { themePreference } = useBreathingSettings();
  return Colors[themePreference];
}
