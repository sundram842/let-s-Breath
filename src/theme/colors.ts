/**
 * App color tokens. Keep raw hex/rgba values ONLY here so screens never
 * hardcode colors and re-theming stays a one-file change.
 *
 * The breathing (Home) palette has a Light and a Dark variant so the main
 * screen follows the user's Theme preference just like the rest of the app.
 * Resolve the active variant with `useBreathingColors()` (see
 * `@/hooks/use-theme`) — never import a fixed variant into a screen.
 */
export const breathingColors = {
  light: {
    /** Background gradient (top-left → bottom-right), matching the design. */
    gradientFrom: '#4C93EA',
    gradientTo: '#2E6FD6',
    /** Solid progress ring. */
    ring: '#FFFFFF',
    /** Semi-transparent inner disc — the frosted-glass effect. */
    innerFill: 'rgba(255, 255, 255, 0.15)',
    /** Center text. */
    title: '#FFFFFF',
    subtitle: 'rgba(255, 255, 255, 0.75)',
    /** Floating controls (pause / settings) background. */
    control: 'rgba(255, 255, 255, 0.18)',
  },
  dark: {
    /** Deep midnight gradient — same calming shape, dark-mode luminance. */
    gradientFrom: '#1B2A44',
    gradientTo: '#0B1220',
    ring: '#E8EEF7',
    innerFill: 'rgba(255, 255, 255, 0.08)',
    title: '#F4F7FB',
    subtitle: 'rgba(244, 247, 251, 0.70)',
    control: 'rgba(255, 255, 255, 0.12)',
  },
} as const;

/** The resolved breathing palette for one theme. */
export type BreathingColors = (typeof breathingColors)[keyof typeof breathingColors];
