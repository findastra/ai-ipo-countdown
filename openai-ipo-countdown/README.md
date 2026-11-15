# OpenAI IPO Countdown

*By Astra.*

A free Windows companion that counts down to OpenAI's IPO on Discord, with the blue galaxy, the time left, Discord's
live timer and, once it lists, the time since the opening bell.

**[Download for Windows](https://github.com/findastra/ai-ipo-countdown/raw/main/downloads/openai-ipo-countdown.zip)**

## Start it

The card shows the official blue six-arm galaxy from OpenAI Discord Presence, approved by Astra on October 30, 2026,
with the count over its white core. The app's page draws it live, star by star, with the countdown under it. The
device's reduced-motion preference is respected.

1. Install [Node.js 24 or later](https://nodejs.org/en/download) if needed. No npm install is required.
2. Extract the download and double-click **Start OpenAI IPO Countdown.cmd**.
3. Keep Discord desktop open with activity sharing enabled, and click **Start**.
4. Optional: double-click **Enable Automatic Startup.cmd** to start it with Windows. Keep the extracted folder in place.

The page's buttons: **Start**, **Stop**, **Hide Date** and **Quit** (click twice). See
[the main README](https://github.com/findastra/ai-ipo-countdown#buttons--instructions).

**Until the built-in Discord application is registered**, add an Application ID once: create an application in the
[Discord Developer Portal](https://discord.com/developers/applications), click **Quit**, put its Application ID in
`clientId` in `.local/config.json` in the app folder, then start the app again. It is public, not a secret; no token
is needed. The card's line under the timer says so until it is set.

## What Discord shows

| When | In the galaxy | The words |
| --- | --- | --- |
| Up to 60 days before | **50 DAYS** | **OpenAI IPO** · Ticker TBA · 2027 target · 49d 21h 30m · Discord's live timer |
| Further away | the plain galaxy | the same words and timer |
| The last day | **23 HOURS** … **1 HOUR** | 5h 12m, and the timer |
| The last hour | **59 MINUTES** … **1 MINUTE** | 12m, and the timer |
| The last minute | **60 SECONDS** counting down once | Under a minute, and the timer |
| After the opening bell | the plain galaxy | OpenAI is trading · It's here!, with Discord counting up from the bell |

## The date

**OpenAI has not set a date.** As of November 15, 2026, its finance chief has said OpenAI is targeting a listing in
2027 (to staff on August 19, and to CNBC on November 6), with no exchange or ticker announced. Until there is a date,
the count runs to the first trading day of 2027, Monday, January 4, at the 9:30am opening bell in New York, and the
card says **2027 target** in place of a date.

When OpenAI announces it: click **Quit**, set `targetAt` (the first trade, as seconds since 1970), `ticker`,
`exchange`, and `dateLabel` to `""` in `.local/config.json`, then start the app again. The card then reads like
Anthropic's: **Nasdaq: OAI · Mon, Jan 4**.

## Updating and startup

Before starting an updated or relocated copy, click **Quit** (twice) on the old copy's page. The launcher checks the
running installation and source build; it reports a conflict instead of silently opening an older copy. If the folder
moved, enable startup from the new copy again. To disable startup, run `node scripts/startup-20261115.js --remove`.

## Privacy

The app reads nothing on your PC. The control server binds only to `127.0.0.1`, checks Host and Origin for changes,
and sends no telemetry. Discord receives the card's text, a timestamp and the galaxy's image address. Settings remain
in the Git-ignored `.local/config.json`.

## Development

```sh
node --test
node src/server-20261115.js
```
