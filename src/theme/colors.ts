/**
 * App color tokens. Keep raw hex/rgba values ONLY here so screens never
 * hardcode colors and re-theming stays a one-file change.
 */
export const colors = {
  breathing: {
    /** Background gradient (top-left → bottom-right), matching the design. */
    gradientFrom: '#4C93EA',
    gradientTo: '#2E6FD6',
    /** Solid white progress ring. */
    ring: '#FFFFFF',
    /** Semi-transparent white inner disc — the frosted-glass effect. */
    innerFill: 'rgba(255, 255, 255, 0.15)',
    /** Center text. */
    title: '#FFFFFF',
    subtitle: 'rgba(255, 255, 255, 0.75)',
  },
} as const;

export type AppColors = typeof colors;
