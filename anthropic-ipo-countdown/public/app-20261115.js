const $ = id => document.getElementById(id);
const hosted = document.body.hasAttribute('data-hosted') || location.protocol === 'file:';
let state;
let ended = false;
// What the public page shows: the expected first trade, Thursday 19 November 2026, 9:30am in New York.
const EXAMPLE = { title: 'Anthropic IPO', details: 'Nasdaq: ANT · Thu, Nov 19', targetAt: 1795098600,
  bell: 'until ANT opens on Nasdaq', trading: 'ANT is trading', since: 'on Nasdaq since the opening bell' };

async function request(path, body) {
  const response = await fetch(path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not update the app.');
  return data;
}

const clock = (seconds, days = true) => {
  const d = Math.floor(seconds / 86400), h = Math.floor(seconds / 3600) % (days ? 24 : Infinity);
  const m = String(Math.floor(seconds / 60) % 60).padStart(2, '0'), s = String(seconds % 60).padStart(2, '0');
  return (days && d ? `${d}d ` : '') + `${days && d ? String(h).padStart(2, '0') : h}:${m}:${s}`;
};

// Discord writes its timers as 5:12:33 left before the bell and 1:02:09 elapsed after it, in green beside a
// controller. Far from the bell the card has no timer, as on Discord.
function drawTimer() {
  const now = Math.floor(Date.now() / 1000);
  const line = $('timer').parentElement;
  line.classList.remove('running');
  const card = state?.card;
  if (hosted) drawCount();
  if (ended) $('timer').textContent = 'App closed. You can close this tab.';
  else if (!hosted && state && !state.config.clientId) $('timer').textContent = 'Add a Discord Application ID (README)';
  else if (!hosted && state?.mode !== 'manual') $('timer').textContent = 'Ready when you are';
  else if (card?.timestamps?.end) {
    $('timer').textContent = clock(Math.max(0, card.timestamps.end - now), false) + ' left';
    line.classList.add('running');
  } else if (card?.timestamps?.start) {
    $('timer').textContent = clock(Math.max(0, now - card.timestamps.start), false) + ' elapsed';
    line.classList.add('running');
  } else $('timer').textContent = '';
  // The big count over the galaxy: days, hours, minutes and seconds to the opening bell, then that it is trading.
  const config = state?.config || EXAMPLE;
  const left = config.targetAt - now;
  document.querySelector('.bell').classList.toggle('live', left <= 0);
  $('big-count').textContent = left > 0 ? clock(left) : hosted ? EXAMPLE.trading : (state.config.ticker ? `${state.config.ticker} is trading` : 'Trading');
  $('big-label').textContent = hosted ? (left > 0 ? EXAMPLE.bell : EXAMPLE.since) : state?.bell || '';
}

// The count over the card's galaxy, as Discord shows it: only days, else hours, else minutes, else seconds.
function countNow(targetAt) {
  const left = targetAt - Math.floor(Date.now() / 1000);
  if (left <= 0) return null;
  const [value, unit] = left >= 86400 ? [Math.floor(left / 86400), 'DAY'] : left >= 3600 ? [Math.floor(left / 3600), 'HOUR']
    : left >= 60 ? [Math.floor(left / 60), 'MINUTE'] : [left, 'SECOND'];
  return { number: String(value), unit: value === 1 ? unit : unit + 'S' };
}
function drawCount() {
  const count = hosted ? countNow(EXAMPLE.targetAt) : state?.count;
  $('card-count').hidden = !count;
  if (!count) return;
  $('count-number').textContent = count.number;
  $('count-unit').textContent = count.unit;
}

function drawCard(card, config) {
  drawCount();
  $('title-preview').textContent = card?.name || config.title;
  $('event-preview').textContent = card?.details || config.details || '';
  $('state-preview').textContent = card?.state || 'First trading day is over';
}

async function refresh() {
  if (ended || hosted) return;
  try {
    state = await request('/api/status');
    drawCard(state.card, state.config);
    $('date').textContent = state.config.showDate ? 'Hide Date' : 'Show Date';
    $('date').setAttribute('aria-pressed', String(state.config.showDate === true));
    // Start and Stop are one choice: only the current mode is lit.
    for (const mode of ['manual', 'off']) $(mode).setAttribute('aria-pressed', String(state.mode === mode));
    drawTimer();
  } catch {
    state = null;
    drawTimer();
  }
}

$('date').addEventListener('click', async () => {
  if (hosted) {
    const on = $('date').getAttribute('aria-pressed') !== 'true';
    $('date').setAttribute('aria-pressed', String(on));
    $('date').textContent = on ? 'Hide Date' : 'Show Date';
    $('event-preview').textContent = on ? EXAMPLE.details : EXAMPLE.details.split(' · ')[0];
    return;
  }
  if (!state) return;
  $('date').disabled = true;
  try { await request('/api/config', { showDate: !state.config.showDate }); await refresh(); }
  catch {}
  finally { $('date').disabled = false; }
});

for (const mode of ['manual', 'off']) {
  $(mode).addEventListener('click', async () => {
    if (hosted) {
      for (const other of ['manual', 'off']) $(other).setAttribute('aria-pressed', String(other === mode));
      return;
    }
    $(mode).disabled = true;
    try { await request('/api/mode', { mode }); await refresh(); }
    catch {}
    finally { $(mode).disabled = false; }
  });
}
// Quit closes the whole app, so a stray click only asks: a second click within 3 seconds quits.
let quitAsk;
$('quit').addEventListener('click', async () => {
  if (!quitAsk) {
    $('quit').textContent = 'Click again to quit';
    quitAsk = setTimeout(() => { quitAsk = null; $('quit').textContent = 'Quit'; }, 3000);
    return;
  }
  clearTimeout(quitAsk);
  try {
    await request('/api/quit', {});
    ended = true;
    state = null;
    drawTimer();
    document.querySelectorAll('button').forEach(button => { button.disabled = true; });
  } catch {}
});
if (hosted) {
  // The public page: the example card, counting the days to the expected bell.
  document.body.classList.add('hosted');
  $('download').hidden = false;
  $('quit').hidden = true;
  // The example card counts as the app does: "4d 5h 12m", with Discord's live timer to the bell.
  const left = Math.max(0, EXAMPLE.targetAt - Math.floor(Date.now() / 1000));
  const words = left <= 0 ? "It's here!" : left < 60 ? 'Under a minute' : [[Math.floor(left / 86400), 'd'], [Math.floor(left / 3600) % 24, 'h'], [Math.floor(left / 60) % 60, 'm']]
    .filter(([n], i, all) => n || all.slice(0, i).some(([m]) => m) || i === 2).map(([n, u]) => n + u).join(' ');
  state = { config: EXAMPLE, card: { name: EXAMPLE.title, details: EXAMPLE.details, state: words, timestamps: left > 0 ? { end: EXAMPLE.targetAt } : undefined } };
  drawCard(state.card, EXAMPLE);
  $('manual').setAttribute('aria-pressed', 'true');
  $('off').setAttribute('aria-pressed', 'false');
} else void refresh();
drawTimer();
setInterval(refresh, 2000);
setInterval(drawTimer, 1000);
