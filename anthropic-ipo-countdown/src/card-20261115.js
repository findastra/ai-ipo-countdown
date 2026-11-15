// What the Discord card says, and the settings that shape it.

import { EDITION } from './edition-20261115.js';
export { EDITION };

// The project's own Discord application. Not registered yet: until Astra registers one (a non-brand name, such as
// "IPO Countdown", which can serve every edition) and its ID is written here, the page asks for an Application ID once.
export const BUILT_IN_CLIENT_ID = '';

export const GALAXY_URL = EDITION.galaxyUrl;

import { countLabel, countArtUrl, countdownWords } from './countdown-art-20261115.js';

const DAY = 86400;
const HOUR = 3600;

export function clean(value, max = 110) {
  return String(value ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Whole calendar days in the PC's own time zone, so the night before reads "Tomorrow", never "0 days to go".
export function daysLeft(targetAt, now, timeZoneOffsetMinutes = new Date(now * 1000).getTimezoneOffset()) {
  const local = seconds => Math.floor((seconds - timeZoneOffsetMinutes * 60) / DAY);
  return local(targetAt) - local(now);
}

// "Thu, Nov 19" in English, in the PC's own time zone.
export function shortDate(seconds, offset = new Date(seconds * 1000).getTimezoneOffset()) {
  const d = new Date((seconds - offset * 60) * 1000);
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
  return `${day}, ${month} ${d.getUTCDate()}`;
}

// Where the countdown stands: counting, trading (the first celebrateHours after the bell) or over.
export function phase(config, now) {
  if (!Number.isInteger(config.targetAt)) return 'unset';
  if (now < config.targetAt) return 'counting';
  return now < config.targetAt + config.celebrateHours * HOUR ? 'trading' : 'over';
}

// How far off it is in words, with the pricing day on the way: shown when you hover the picture.
export function countdownLine(config, now, offset) {
  const days = daysLeft(config.targetAt, now, offset);
  const pricing = Number.isInteger(config.pricingAt) && config.pricingAt < config.targetAt ? config.pricingAt : null;
  if (days <= 0) return 'Opening bell today';
  if (pricing !== null && daysLeft(pricing, now, offset) === 0) return now < pricing ? 'Pricing today' : 'Priced · trading tomorrow';
  if (days === 1) return 'Trading tomorrow';
  if (days < 7 * 8) return `${days} days to go`;
  return `${Math.floor(days / 7)} weeks to go`;
}

// "Nasdaq: ANT", or what is known so far when the exchange or ticker is not announced.
export function listing(config) {
  if (config.exchange && config.ticker) return `${config.exchange}: ${config.ticker}`;
  if (config.exchange) return `${config.exchange} · ticker TBA`;
  return config.ticker ? `Ticker ${config.ticker}` : 'Ticker TBA';
}
// The date as words: "Thu, Nov 19", or the label for a target that is not a date yet ("2027 target").
export function dateWords(config, offset) {
  return config.dateLabel || shortDate(config.targetAt, offset);
}
// The words under the big count on the page.
export function bellLabel(config, trading) {
  const where = config.ticker && config.exchange ? `${config.ticker} opens on ${config.exchange}` : `${EDITION.company}'s ${config.dateLabel || 'first trade'}`;
  if (trading) return config.exchange ? `on ${config.exchange} since the opening bell` : 'since the opening bell';
  return `until ${where}`;
}

export class Presence {
  mode = 'off';
  setMode(mode) {
    if (!['off', 'manual'].includes(mode)) throw new Error('Choose Start or Stop.');
    this.mode = mode;
  }
}

// The card Discord shows (Astra, 2026-11-15: "just show me the timer on the card").
// - Counting: "Anthropic IPO" / "Nasdaq: ANT · Thu, Nov 19" / "4d 5h 12m", with Discord's own live timer to the bell
//   (timestamps.end) and, in the middle of the galaxy, one kind of time: "4 DAYS", then hours, minutes and seconds
//   (src/countdown-art-20261115.js). The words change once a minute, well within what Discord accepts.
// - Trading: "Now trading on Nasdaq: ANT" / "It's here!", with Discord's elapsed timer counting from the opening bell.
export function activity(config, now = Math.floor(Date.now() / 1000), offset) {
  const where = phase(config, now);
  if (where === 'unset' || where === 'over') return null;
  const listed = listing(config);
  const date = dateWords(config, offset);
  const card = {
    type: 0,
    // Card title. Discord shows this instead of the registered app name.
    name: config.title,
    assets: { large_image: config.image, large_text: `${config.title} · ${date}` },
  };
  const left = config.targetAt - now;
  // The built-in galaxy carries the count; a picture of your own stays as it is.
  if (where === 'counting' && config.image === GALAXY_URL) card.assets.large_image = countArtUrl(countLabel(left)) ?? GALAXY_URL;
  if (where === 'trading') {
    card.details = config.exchange || config.ticker ? `Now trading on ${listed}` : `${EDITION.company} is trading`;
    card.state = "It's here!";
    card.timestamps = { start: config.targetAt };
    return card;
  }
  card.details = config.showDate ? `${listed} · ${date}` : listed;
  card.state = countdownWords(left);
  card.assets.large_text = `${config.showDate ? `${config.title} · ${date}` : config.title} · ${countdownLine(config, now, offset)}`;
  card.timestamps = { end: config.targetAt };
  return card;
}

const isTime = value => Number.isInteger(value) && value >= 946684800 && value <= 7258118400;
function time(value, fallback, message) {
  if (value === undefined) return fallback;
  if (value === null) return null;
  const number = Number(value);
  if (!isTime(number)) throw new Error(message);
  return number;
}

export function validateConfig(input = {}) {
  const clientId = String(input.clientId || BUILT_IN_CLIENT_ID).trim();
  if (clientId && !/^\d{17,20}$/.test(clientId)) throw new Error('Paste the 17–20 digit Discord Application ID. No token needed.');
  const savedImage = String(input.image || GALAXY_URL).trim();
  // Refresh only the built-in galaxy; keep custom image URLs and asset keys.
  const image = savedImage.split('?')[0] === GALAXY_URL.split('?')[0] ? GALAXY_URL : savedImage;
  if (!/^[a-z0-9_-]{1,128}$/.test(image) && !/^https:\/\/[^\s"<>]{1,240}$/.test(image)) throw new Error('Use an uploaded asset key or an https image link.');
  // The first trade is required; only the pricing date can be left empty.
  const targetAt = time(input.targetAt === null ? 'none' : input.targetAt, EDITION.targetAt, 'Choose the date and time of the first trade.');
  const pricingAt = time(input.pricingAt, EDITION.pricingAt, 'Choose the pricing date and time, or leave it empty.');
  const title = clean(input.title ?? `${EDITION.company} IPO`, 64);
  if (title.length < 2) throw new Error('Give the card a title of at least 2 letters.');
  // The ticker and exchange can be empty until they are announced.
  const ticker = clean(input.ticker ?? EDITION.ticker, 10).toUpperCase();
  if (ticker && !/^[A-Z][A-Z0-9.]{0,9}$/.test(ticker)) throw new Error('Use a ticker of letters and numbers, such as ANT.');
  const exchange = clean(input.exchange ?? EDITION.exchange, 24);
  if (exchange.length === 1) throw new Error('Name the exchange, such as Nasdaq.');
  const dateLabel = clean(input.dateLabel ?? EDITION.dateLabel ?? '', 24) || null;
  const celebrateHours = input.celebrateHours === undefined ? 24 : Number(input.celebrateHours);
  if (!Number.isInteger(celebrateHours) || celebrateHours < 0 || celebrateHours > 168) throw new Error('Celebrate for 0 to 168 hours.');
  return { clientId, image, title, ticker, exchange, dateLabel, targetAt, pricingAt, showDate: input.showDate !== false,
    celebrateHours, automaticOnStart: input.automaticOnStart !== false };
}
