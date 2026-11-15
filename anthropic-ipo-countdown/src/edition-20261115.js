// The company this app counts down to. The OpenAI edition is a copy of this folder with this file, its galaxy and its
// page text changed (ADDING-A-COMPANY.md).
export const EDITION = Object.freeze({
  app: 'anthropic-ipo-countdown',
  company: 'Anthropic',
  // The galaxy's name in public/official-galaxy-data-20261030.js.
  galaxy: 'anthropic',
  // Reported on 2026-11-15 (roadshow from 2026-11-10): ticker ANT on Nasdaq, priced on or about Wednesday
  // 18 November, first trade expected Thursday 19 November 2026. Not final: settings can change every one.
  ticker: 'ANT',
  exchange: 'Nasdaq',
  // Shown in place of the date when the date is only a target (OpenAI: "2027 target"); null shows the date.
  dateLabel: null,
  // 9:30am in New York (the opening bell), 19 November 2026 = 14:30 UTC.
  targetAt: 1795098600,
  // 5pm in New York, 18 November 2026 = 22:00 UTC: IPOs are usually priced after that day's close.
  pricingAt: 1795039200,
  // This app's control page, on this PC only.
  port: 38767,
  // Card art: Astra's approved gold five-arm galaxy (2026-10-30), the same GIF Anthropic Discord Presence shows,
  // loaded from findastra/ai-discord-presence, whose rules keep that address fixed.
  galaxyUrl: 'https://raw.githubusercontent.com/findastra/ai-discord-presence/main/anthropic-discord-presence/public/galaxy-card.gif?v=10',
  // The count pictures (scripts/make-countdown-art-20261115.mjs): the most days drawn, and the lettering's colours.
  maxDays: 14,
  countColours: { number: '#ffe3a3', unit: '#f3d48a' },
});
