# HCunion Client

A browser-hosted client project targeting **Minecraft Java 1.8.8**.

## Current repository contents

- `index.html` — simple client landing page with a launch link
- `style.css` — HCunion landing-page theme
- `runtime/1.8.8-wasm/index.html` — WASM-GC game launch wrapper
- `runtime/1.8.8-wasm/bootstrap.js` — runtime bootstrap loader

## Mods

All custom mods, module controls, overlays, trainers, and macro features have been removed from the client interface and launch wrapper. The game launch page now contains only the Minecraft runtime container.

## Current status

The repository is **not yet verified as a finished playable client**. The WASM-GC runtime still needs browser testing, and the external EPW asset must remain reachable. Multiplayer connectivity and in-game controls have not yet been verified.

## Hosting

Designed for GitHub Pages. The repository includes a Pages workflow on the `main` branch.

## Credits and licensing

Before bundling or redistributing third-party runtime or game assets, verify the source license, attribution requirements, and redistribution permissions.
