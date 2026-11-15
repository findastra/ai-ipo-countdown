// The company this app counts down to. The Anthropic edition is the same folder with this file, its galaxy and its
// page text changed (ADDING-A-COMPANY.md).
export const EDITION = Object.freeze({
  app: 'openai-ipo-countdown',
  company: 'OpenAI',
  // The galaxy's name in public/official-galaxy-data-20261030.js.
  galaxy: 'openai',
  // Read on 2026-11-15: OpenAI has not set a date, an exchange or a ticker. Its finance chief told staff on
  // 2026-08-19, and CNBC on 2026-11-06, that it is targeting a listing in 2027. Until there is a date, the count runs to
  // the first trading day of 2027 (Astra, 2026-11-15: "just use... whatever they're saying, even though it's not
  // official"), and the card says "2027 target" in place of a date.
  ticker: '',
  exchange: '',
  dateLabel: '2027 target',
  // 9:30am in New York (the opening bell), Monday 4 January 2027 = 14:30 UTC.
  targetAt: 1799073000,
  pricingAt: null,
  // This app's control page, on this PC only.
  port: 38768,
  // Card art: Astra's approved blue six-arm galaxy (2026-10-30), the same GIF OpenAI Discord Presence shows,
  // loaded from findastra/ai-discord-presence, whose rules keep that address fixed.
  galaxyUrl: 'https://raw.githubusercontent.com/findastra/ai-discord-presence/main/openai-discord-presence/public/galaxy-card.gif?v=10',
  // The count pictures (scripts/make-countdown-art-20261115.mjs): the most days drawn, and the lettering's colours.
  maxDays: 60,
  countColours: { number: '#e9f1ff', unit: '#b8cff7' },
});
