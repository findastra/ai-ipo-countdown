// Makes the countdown pictures Discord shows in the middle of the galaxy: one for each number of days, hours and
// minutes left ("4 DAYS", "23 HOURS", "59 MINUTES"), and the last minute as one picture that counts the seconds down
// once. Each is the company's approved galaxy (public/galaxy-card.gif, from AI Discord Presence) with the count drawn
// over its white core: never a redrawn galaxy.
//
//   node scripts/make-countdown-art-20261115.mjs
//
// The pictures go to public/countdown-20261115/ and are loaded by Discord from GitHub; they are not in the download.
// The lettering is drawn by a browser, so this needs Playwright with Chromium (as AI Discord Presence's galaxy export
// does); the app itself needs nothing.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { decodeGif, encodeGif } from './gif-codec-20261115.js';
import { LABELS, labelText } from '../src/countdown-art-20261115.js';
import { EDITION } from '../src/edition-20261115.js';

const root = new URL('../', import.meta.url);
const out = new URL('public/countdown-20261115/', root);
const SIZE = 160;
const LOOP = 60;      // frames in each label's loop (about 8 seconds)
const BLEND = 12;     // its last frames fade into the frames before its first, so the loop has no jump

const galaxy = decodeGif(readFileSync(new URL('public/galaxy-card.gif', root)));
if (galaxy.width !== SIZE || galaxy.height !== SIZE) throw new Error('The galaxy card is expected at 160 pixels.');
const { palette, frames } = galaxy;

// The lettering for every label, drawn once in a browser as see-through white-on-nothing pictures.
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { throw new Error('This script needs Playwright with Chromium: npm install -g playwright, then npx playwright install chromium.'); }
const browser = await chromium.launch();
const page = await browser.newPage();
const masks = {};
const colours = EDITION.countColours;
const labels = [...LABELS, ...Array.from({ length: 61 }, (_, s) => ({ unit: 'seconds', value: s }))];
for (const label of labels) {
  const { number, unit } = labelText(label);
  masks[`${label.unit}-${label.value}`] = await page.evaluate(({ size, number, unit, colours }) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const c = canvas.getContext('2d');
    const font = '"Arial Black","Helvetica Neue",Arial,"Liberation Sans","DejaVu Sans",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    // A soft black glow, then a black edge, then the gold, so the count reads over the bright core.
    const draw = (text, px, y, weight, fill, spacing) => {
      c.font = `${weight} ${px}px ${font}`;
      if ('letterSpacing' in c) c.letterSpacing = spacing;
      c.shadowColor = 'rgba(0,0,0,0.95)'; c.shadowBlur = 10; c.fillStyle = '#000'; c.fillText(text, size / 2, y);
      c.shadowBlur = 0; c.lineJoin = 'round'; c.lineWidth = px / 7; c.strokeStyle = '#000'; c.strokeText(text, size / 2, y);
      c.fillStyle = fill; c.fillText(text, size / 2, y);
    };
    draw(number, number.length > 2 ? 46 : 62, 92, 900, colours.number, '0px');
    draw(unit, 15, 120, 700, colours.unit, '2px');
    return Array.from(c.getImageData(0, 0, size, size).data);
  }, { size: SIZE, number, unit, colours });
}
await browser.close();

// Each pixel of the lettering goes onto the galaxy and takes the nearest of the galaxy's own colours, so every picture
// keeps the card's exact palette.
const nearestCache = new Map();
function nearest(r, g, b) {
  const key = (r << 16) | (g << 8) | b;
  let best = nearestCache.get(key);
  if (best !== undefined) return best;
  let bestDistance = Infinity;
  palette.forEach(([pr, pg, pb], i) => {
    const d = (pr - r) ** 2 * 3 + (pg - g) ** 2 * 4 + (pb - b) ** 2 * 2;
    if (d < bestDistance) { bestDistance = d; best = i; }
  });
  nearestCache.set(key, best);
  return best;
}
function mix(a, b, t) {
  const frame = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) { frame[i] = a[i]; continue; }
    const [ar, ag, ab] = palette[a[i]], [br, bg, bb] = palette[b[i]];
    frame[i] = nearest(Math.round(ar + (br - ar) * t), Math.round(ag + (bg - ag) * t), Math.round(ab + (bb - ab) * t));
  }
  return frame;
}
function letter(frame, mask) {
  const result = Uint8Array.from(frame);
  for (let i = 0; i < frame.length; i++) {
    const alpha = mask[i * 4 + 3] / 255;
    if (alpha === 0) continue;
    const [r, g, b] = palette[frame[i]];
    result[i] = nearest(Math.round(r + (mask[i * 4] - r) * alpha), Math.round(g + (mask[i * 4 + 1] - g) * alpha), Math.round(b + (mask[i * 4 + 2] - b) * alpha));
  }
  return result;
}

// The loop: frames 0 to 59 of the galaxy, the last 12 fading into the frames just before frame 0, which in the
// galaxy's own seamless loop are its last ones.
const loop = Array.from({ length: LOOP }, (_, j) => {
  if (j < LOOP - BLEND) return frames[j];
  const t = (j - (LOOP - BLEND) + 1) / (BLEND + 1);
  return mix(frames[j], frames[(j - LOOP + frames.length) % frames.length], t);
});
mkdirSync(out, { recursive: true });
let bytes = 0;
for (const label of LABELS) {
  const mask = masks[`${label.unit}-${label.value}`];
  const gif = encodeGif(SIZE, SIZE, palette, loop.map(frame => letter(frame, mask)), loop.map(() => 13));
  writeFileSync(new URL(`${label.unit}-${label.value}.gif`, out), gif);
  bytes += gif.length;
}
// The last minute: 60 seconds counting down once at the galaxy's own pace (8 frames a second), stopping on 0.
const secondFrames = [], secondDelays = [];
for (let s = 60; s >= 1; s--) {
  for (let k = 0; k < 8; k++) {
    const i = (60 - s) * 8 + k;
    secondFrames.push(letter(frames[i % frames.length], masks[`seconds-${s}`]));
    secondDelays.push(k % 2 ? 13 : 12);
  }
}
secondFrames.push(letter(frames[480 % frames.length], masks['seconds-0']));
secondDelays.push(100);
const seconds = encodeGif(SIZE, SIZE, palette, secondFrames, secondDelays, { loop: false });
writeFileSync(new URL('seconds.gif', out), seconds);
bytes += seconds.length;
console.log(`public/countdown-20261115/: ${LABELS.length + 1} pictures, ${(bytes / 1048576).toFixed(1)} MB`);
