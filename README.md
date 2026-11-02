# HCunion Client

A browser-hosted client project targeting **Minecraft Java 1.8.8 only**.

## Current repository contents

- `index.html` — HCunion settings interface
- `style.css` — dark purple HCunion theme
- `app.js` — local settings, key display preference, and manual practice guide
- `runtime/1.8.8-wasm/` — runtime launch wrapper and bootstrap files

## Current status

The repository is **not yet a finished playable client**. The settings page is implemented, but the WASM-GC launch flow still needs browser testing and the actual runtime integration is incomplete.

## Included interface modules

1. **Aim Assist** — display-only configuration preview. It does not lock onto players or move the player's aim.
2. **Auto Clicker** — practice CPS preference only; it does not generate gameplay clicks.
3. **Auto Rod** — manual rod-to-sword practice guide; it does not switch slots or send game inputs.
4. **Bow Agro Trainer** — visual metronome with a 1–6 beats/second tempo setting, start/stop controls, and locally saved tempo. It does not aim, draw, release, swap items, or attack.

The Macro feature has been removed from the interface and settings storage. No unrelated HUD modules are included.

## Hosting

Designed for GitHub Pages. Enable Pages for the repository's `main` branch and root folder after the runtime is ready.

## Credits and licensing

Before bundling or redistributing any third-party runtime or game assets, verify the source license, attribution requirements, and redistribution permissions.