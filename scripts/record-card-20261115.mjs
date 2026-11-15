// Records an app's card preview as the animated picture on its storefront page (anthropic-ipo-countdown,
// openai-ipo-countdown), like the card animations on AI Discord Presence's storefronts: 648 pixels wide, about ten
// seconds, the galaxy turning and Discord's timer ticking.
//
//   node scripts/record-card-20261115.mjs <port> <out.gif>
//
// The app must be running on that port. Needs Playwright with Chromium; the apps themselves need nothing.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { encodeGif } from '../anthropic-ipo-countdown/scripts/gif-codec-20261115.js';

const [port, out] = process.argv.slice(2);
if (!port || !out) throw new Error('Usage: node scripts/record-card-20261115.mjs <port> <out.gif>');
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
// The card is 400 CSS pixels wide on a computer screen; 1.62 times that is the storefronts' 648.
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1.62 });
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForTimeout(3000);
// Only the card is recorded: the live galaxy above it is hidden so the screenshots keep pace.
await page.evaluate(() => { document.querySelector('.hero').style.display = 'none'; });
await page.waitForTimeout(500);
const card = await page.$('.preview');
const shots = [];
const start = Date.now();
while (Date.now() - start < 10000) {
  const t = Date.now();
  shots.push({ t, png: await card.screenshot({ type: 'png' }) });
  await page.waitForTimeout(Math.max(0, 120 - (Date.now() - t)));
}
// Decode the shots one at a time in a blank page (the app's own page allows no data: pictures), so no image package
// is needed, and keep each pixel as one 15-bit colour (5 bits a channel).
const blank = await browser.newPage();
let w = 0, h = 0;
const keys = [];
for (const shot of shots) {
  const frame = await blank.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, img.width, img.height).data, out = new Uint16Array(img.width * img.height);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) out[p] = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
    let bin = ''; const bytes = new Uint8Array(out.buffer);
    for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return { w: img.width, h: img.height, b64: btoa(bin) };
  }, shot.png.toString('base64'));
  w = frame.w; h = frame.h;
  const buf = Buffer.from(frame.b64, 'base64');
  keys.push(new Uint16Array(buf.buffer, buf.byteOffset, buf.length / 2));
}
await browser.close();
// One palette for the whole recording: the 256 most common colours, each pixel to the nearest.
const counts = new Map();
for (const f of keys) for (const k of f) counts.set(k, (counts.get(k) || 0) + 1);
const palette = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 256)
  .map(([k]) => [((k >> 10) & 31) * 8 + 4, ((k >> 5) & 31) * 8 + 4, (k & 31) * 8 + 4]);
const cache = new Map();
const nearest = key => {
  let best = cache.get(key);
  if (best !== undefined) return best;
  const r = ((key >> 10) & 31) * 8 + 4, g = ((key >> 5) & 31) * 8 + 4, b = (key & 31) * 8 + 4;
  let d = Infinity;
  palette.forEach(([pr, pg, pb], i) => { const e = (pr - r) ** 2 * 3 + (pg - g) ** 2 * 4 + (pb - b) ** 2 * 2; if (e < d) { d = e; best = i; } });
  cache.set(key, best);
  return best;
};
const indexed = keys.map(f => Uint8Array.from(f, nearest));
const delays = shots.map((s, i) => Math.max(2, Math.round(((shots[i + 1]?.t ?? s.t + 120) - s.t) / 10)));
const gif = encodeGif(w, h, palette, indexed, delays);
writeFileSync(out, gif);
console.log(`${out}: ${w}x${h}, ${keys.length} frames, ${(gif.length / 1048576).toFixed(1)} MB`);
