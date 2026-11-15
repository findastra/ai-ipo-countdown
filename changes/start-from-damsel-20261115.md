# Discord Damsel's Start & open turns a stopped countdown back on (2026-11-15)

Found while doing Astra's "take care of all of those things": Damsel's Start & open left the OpenAI IPO card off. Her
presence controls run each app's launcher with `--automatic`, which the AI presence apps' launchers treat as "switch
sharing on"; these launchers ignored it, so an app already running with sharing off stayed off. Both launchers now
switch the running app to sharing (Start) on `--automatic`, as the AI ones do. A test in each app fails on the old
launcher and passes now.

Claude Opus 5.5 (`claude-opus-5-5`).
