/**
 * Typography tokens. Font sizes that must scale with the breathing circle
 * are derived from its size at render time (see breathing/constants.ts),
 * so here we only centralize weights and letter spacing.
 */
export const typography = {
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  letterSpacing: {
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

export type Typography = typeof typography;
