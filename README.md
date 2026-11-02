# HCunion Client

A browser-hosted client project targeting **Minecraft Java 1.8.8 only**.

## Current project status

The repository contains the HCunion settings interface and a runtime launch page:
- `index.html` — client interface
- `style.css` — dark HCunion theme
- `app.js` — local settings and shortcut storage
- `runtime/1.8.8-wasm/index.html` — HCunion launch wrapper for the 1.8.8 WASM-GC client
- `runtime/1.8.8-wasm/bootstrap.js` — upstream bootstrap loader

**Runtime integration is in progress.** The launch page loads the WASM-GC bootstrap locally and fetches the large EPW game asset from the upstream Minecraft-Launcher repository. The upstream owner has reportedly granted permission to use the project files. The launch flow still needs browser testing before it can be called fully working.

## Requested feature scope

Keep the client limited to these requested modules:
1. **Aim Assist** — settings and configurable activation-key UI (default key: `I`). The current interface does not perform automated aiming.
2. **Auto Clicker** — configurable CPS preference and practice counter UI; no automatic gameplay clicks.
3. **Auto Rod** — configurable manual rod-to-sword combo reminder.
4. **Custom Macros** — user-defined non-combat text shortcuts saved locally and copied to the clipboard.

Do not add unrelated HUD or gameplay modules such as FPS, Keystrokes, Compass, or FreeLook.

## Hosting

Designed for GitHub Pages. Enable Pages for the repository's `main` branch and root folder after the runtime is ready.

## Credits and licensing

No Minecraft game code, assets, or third-party runtime are bundled in this repository at this stage. Before adding a runtime, verify its source, license, attribution requirements, and redistribution permissions.
