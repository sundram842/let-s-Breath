/**
 * Human-readable duration, e.g. 5 → "5 sec", 120 → "2 min",
 * 90 → "1 min 30 sec". Used beside each slider.
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s} sec`;

  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} sec`;
}
