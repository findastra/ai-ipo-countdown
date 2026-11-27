# Remember sharing and coordinate display turns

By Astra. Implemented with OpenAI Codex, 2026-11-27.

Both countdowns persist Start/Stop across restart and support expiring display turns. Their storage explicitly allows only off/manual: a rejected auto request cannot corrupt the next launch. Expired countdowns and apps without a client ID do not consume display turns. Both downloads rebuilt. Full tests: 32 passed.

Read-only checker reviewed the behavior and found no remaining blockers. The three enabled apps (OpenAI, Anthropic and Ableton) each reported a card accepted by Discord during a 40-second branch test; all retained Automatic. This verifies sequential publishing, not simultaneous profile visibility. No UI redesign. Main integration and canonical installation update await owner approval.
