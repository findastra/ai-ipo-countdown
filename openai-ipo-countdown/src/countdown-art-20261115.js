// The count in the middle of the galaxy (Astra, 2026-11-15): only one kind of time at a time. Days while there are
// days left ("4 DAYS"), then hours ("23 HOURS"), then minutes ("59 MINUTES"), then the seconds of the last minute.
// Discord shows a picture from an address, so each count is its own picture, made by
// scripts/make-countdown-art-20261115.mjs and loaded from GitHub.

import { EDITION } from './edition-20261115.js';

export const MAX_DAYS = EDITION.maxDays;
export const LABELS = [
  ...Array.from({ length: MAX_DAYS }, (_, i) => ({ unit: 'days', value: i + 1 })),
  ...Array.from({ length: 23 }, (_, i) => ({ unit: 'hours', value: i + 1 })),
  ...Array.from({ length: 59 }, (_, i) => ({ unit: 'minutes', value: i + 1 })),
];

const WORDS = { days: ['DAY', 'DAYS'], hours: ['HOUR', 'HOURS'], minutes: ['MINUTE', 'MINUTES'], seconds: ['SECOND', 'SECONDS'] };
export function labelText({ unit, value }) {
  return { number: String(value), unit: WORDS[unit][value === 1 ? 0 : 1] };
}

// Which count shows with this many seconds left: whole days, else whole hours, else whole minutes, else the last
// minute's seconds. null at and after the bell.
export function countLabel(secondsLeft) {
  if (secondsLeft <= 0) return null;
  if (secondsLeft >= 86400) return { unit: 'days', value: Math.floor(secondsLeft / 86400) };
  if (secondsLeft >= 3600) return { unit: 'hours', value: Math.floor(secondsLeft / 3600) };
  if (secondsLeft >= 60) return { unit: 'minutes', value: Math.floor(secondsLeft / 60) };
  return { unit: 'seconds', value: Math.ceil(secondsLeft) };
}

// The picture for that count, on GitHub. More than MAX_DAYS days away there is no picture: the plain galaxy shows.
// Bump ?v= whenever the pictures change, so Discord fetches the new ones.
export const ART_BASE = `https://raw.githubusercontent.com/findastra/ai-ipo-countdown/main/${EDITION.app}/public/countdown-20261115/`;
export const ART_VERSION = 1;
export function countArtUrl(label) {
  if (!label || (label.unit === 'days' && label.value > MAX_DAYS)) return null;
  const file = label.unit === 'seconds' ? 'seconds.gif' : `${label.unit}-${label.value}.gif`;
  return `${ART_BASE}${file}?v=${ART_VERSION}`;
}

// The line under the ticker: "4d 5h 12m", "5h 12m", "12m", and "Under a minute" in the last one (Discord's own timer
// beside it counts the seconds).
export function countdownWords(secondsLeft) {
  const d = Math.floor(secondsLeft / 86400), h = Math.floor(secondsLeft / 3600) % 24, m = Math.floor(secondsLeft / 60) % 60;
  if (secondsLeft < 60) return 'Under a minute';
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}
