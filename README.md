# HCunion Client

A browser-hosted client project targeting **Minecraft Java 1.8.8 only**.

## Current project status

The repository currently contains the client settings interface:
- `index.html` — client interface
- `style.css` — dark HCunion theme
- `app.js` — local settings and shortcut storage

**The playable Minecraft runtime is not included yet.** The interface is not a working Minecraft client until a compatible 1.8.8 WebAssembly-GC runtime and its required assets are integrated from a source whose license permits the intended use.

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
