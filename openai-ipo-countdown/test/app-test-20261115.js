import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { activity, validateConfig, Presence, shortDate, bellLabel, EDITION, GALAXY_URL } from '../src/card-20261115.js';
import { LABELS, ART_BASE, ART_VERSION } from '../src/countdown-art-20261115.js';
import { setStartup, startupEnabled, LAUNCHER_NAME } from '../src/windows-startup-20261115.js';
import { launch } from '../src/launch-20261115.js';
import { SOURCE_IDENTITY } from '../src/source-identity-20261115.js';

const at = (...parts) => Date.UTC(...parts) / 1000;
// The tests read times in New York (UTC−5 in winter) so they pass in any time zone.
const NY = 5 * 60;
const config = validateConfig({});
const BELL = at(2027, 0, 4, 14, 30);

test('the edition is OpenAI, counting to its 2027 target: the first trading day of 2027, at the opening bell', () => {
  assert.deepEqual([EDITION.company, EDITION.ticker, EDITION.exchange, EDITION.dateLabel], ['OpenAI', '', '', '2027 target']);
  assert.equal(EDITION.targetAt, BELL);
  assert.equal(shortDate(BELL, NY), 'Mon, Jan 4');
  assert.equal(EDITION.pricingAt, null);
  assert.equal(config.title, 'OpenAI IPO');
});

test('the card says the ticker is not announced, the 2027 target, the time left and Discord\'s live timer', () => {
  const now = activity(config, at(2026, 10, 15, 17), NY);
  assert.equal(now.name, 'OpenAI IPO');
  assert.equal(now.details, 'Ticker TBA · 2027 target');
  assert.equal(now.state, '49d 21h 30m');
  assert.deepEqual(now.timestamps, { end: BELL });
  assert.equal(now.assets.large_text, 'OpenAI IPO · 2027 target · 50 days to go');
  // Once OpenAI announces them, the ticker, exchange and date take their places.
  const set = validateConfig({ ticker: 'OAI', exchange: 'Nasdaq', dateLabel: '' });
  assert.equal(activity(set, at(2026, 10, 15, 17), NY).details, 'Nasdaq: OAI · Mon, Jan 4');
  assert.equal(bellLabel(config, false), "until OpenAI's 2027 target");
  assert.equal(bellLabel(set, false), 'until OAI opens on Nasdaq');
});

test('the blue galaxy in the middle of the card shows one kind of time, days drawn up to 60', () => {
  const art = s => activity(config, BELL - s, NY).assets.large_image;
  assert.equal(art(49 * 86400 + 5), `${ART_BASE}days-49.gif?v=${ART_VERSION}`);
  assert.equal(ART_BASE, 'https://raw.githubusercontent.com/findastra/ai-ipo-countdown/main/openai-ipo-countdown/public/countdown-20261115/');
  assert.equal(art(61 * 86400), GALAXY_URL);
  assert.equal(art(3599), `${ART_BASE}minutes-59.gif?v=${ART_VERSION}`);
  assert.match(GALAXY_URL, /openai-discord-presence\/public\/galaxy-card\.gif/);
  const live = activity(config, BELL + 60, NY);
  assert.deepEqual([live.details, live.state, live.assets.large_image], ['OpenAI is trading', "It's here!", GALAXY_URL]);
});

test('every count picture the card can ask for is in the repo, a GIF Discord accepts', () => {
  const dir = new URL('../public/countdown-20261115/', import.meta.url);
  const files = [...LABELS.map(l => `${l.unit}-${l.value}.gif`), 'seconds.gif'];
  for (const file of files) {
    const gif = readFileSync(new URL(file, dir));
    assert.equal(gif.subarray(0, 6).toString(), 'GIF89a', file);
    assert.ok(gif.length < 10 * 1024 * 1024, file);
  }
  assert.equal(readdirSync(dir).length, files.length);
});

test('Start and Stop are the only modes', () => {
  const presence = new Presence();
  assert.equal(presence.mode, 'off');
  presence.setMode('manual');
  assert.equal(presence.mode, 'manual');
  assert.throws(() => presence.setMode('auto'), /Start or Stop/);
});

test('the Windows startup file points at this copy and can be removed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'anthropic-ipo-'));
  const opts = { io: fs, appRoot: join(dir, 'app'), platform: 'win32', appdata: join(dir, 'appdata'), execPath: 'C:\\node\\node.exe' };
  assert.equal(setStartup(true, opts).automaticOnStart, true);
  const vbs = join(dir, 'appdata', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', LAUNCHER_NAME);
  assert.equal(LAUNCHER_NAME, 'openai-ipo-countdown-20261115.vbs');
  assert.match(readFileSync(vbs, 'utf8'), /launch-20261115\.js"" --background/);
  assert.equal(startupEnabled(opts), true);
  setStartup(false, opts);
  assert.equal(existsSync(vbs), false);
  assert.equal(JSON.parse(readFileSync(join(dir, 'app', '.local', 'config.json'), 'utf8')).automaticOnStart, false);
});

test('the blue galaxy is the OpenAI presence app\'s approved art, and every file the page asks for is served', () => {
  const root = new URL('../', import.meta.url);
  const gif = readFileSync(new URL('public/galaxy-card.gif', root));
  assert.equal(gif.subarray(0, 6).toString(), 'GIF89a');
  // Discord shows no picture for a GIF of 10 MB or more.
  assert.ok(gif.length < 10 * 1024 * 1024);
  assert.match(readFileSync(new URL('public/official-galaxy-data-20261030.js', root), 'utf8'), /officialGalaxyData\.openai=/);
  const html = readFileSync(new URL('public/index-20261115.html', root), 'utf8');
  assert.match(html, /data-official-galaxy="openai"/);
  const server = readFileSync(new URL('src/server-20261115.js', root), 'utf8');
  for (const [, file] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) assert.ok(server.includes(`'/${file}'`), file);
  for (const dir of ['src', 'public', 'scripts']) for (const name of readdirSync(new URL(dir + '/', root))) {
    if (!/\.(?:m?js|html|css)$/.test(name) || name.startsWith('official-galaxy')) continue;
    // Comments may credit the Ableton app; code may not carry its names or port.
    const code = readFileSync(new URL(`${dir}/${name}`, root), 'utf8').split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
    assert.doesNotMatch(code, /ableton|apc64|38765|hourglass/i, `${dir}/${name}`);
  }
});

test('Discord Damsel\'s Start & open (--automatic) switches a running app that is stopped back to sharing', async () => {
  const posts = [];
  const fetcher = async (url, options = {}) => {
    if (options.method === 'POST') { posts.push({ url, body: JSON.parse(options.body), origin: options.headers.Origin }); return { ok: true, json: async () => ({ ok: true }) }; }
    return { ok: true, json: async () => ({ app: 'openai-ipo-countdown', identity: SOURCE_IDENTITY, mode: 'off' }) };
  };
  await launch({ fetcher, spawnProcess: () => { throw new Error('nothing new is started'); }, background: true, automatic: true });
  assert.equal(posts.length, 1);
  assert.match(posts[0].url, /\/api\/mode$/);
  assert.deepEqual(posts[0].body, { mode: 'manual' });
  // Without --automatic, a stopped app is left as it is.
  posts.length = 0;
  await launch({ fetcher, spawnProcess: () => { throw new Error('nothing new is started'); }, background: true, automatic: false });
  assert.equal(posts.length, 0);
});
