# OpenAI IPO Countdown, and a storefront for each app (2026-11-15)

Astra, 2026-11-15: "make an OpenAI one, separate repo too... I think they maybe announced when they're doing their IPO,
but it's not for sure... just use... whatever they're saying, even though it's not official." And: "push this to GitHub
and make a README that looks just like the Anthropic ones."

- `openai-ipo-countdown/`: the same app with OpenAI's blue six-arm galaxy, blue lettering, port 38768 and 143 count
  pictures (days up to 60). OpenAI has set no date, exchange or ticker; it is targeting 2027 (its finance chief, to staff
  on 2026-08-19 and to CNBC on 2026-11-06), so the count runs to the first trading day of 2027, Monday 4 January, and
  the card says "Ticker TBA · 2027 target".
- The company details moved to each app's `src/edition-20261115.js`; an empty ticker or exchange and a date label such as
  "2027 target" are now allowed.
- `scripts/record-card-20261115.mjs` records an app's card as the animation on its storefront page.
- Storefront repos, like Anthropic and OpenAI Discord Presence's: `findastra/anthropic-ipo-countdown` and
  `findastra/openai-ipo-countdown` (the code stays here).

Claude Opus 5.5 (`claude-opus-5-5`).
