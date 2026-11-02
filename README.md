# HCunion Client

A browser-hosted Minecraft 1.8.8 client wrapper using a WASM-GC runtime.

## Launch

Open the GitHub Pages site and select **Launch Minecraft 1.8.8**:

https://andakeevamir010-cyber.github.io/HCunion/

## Repository layout

- `index.html` — landing page
- `style.css` — landing-page styles
- `runtime/1.8.8-wasm/index.html` — game runtime wrapper and client menu
- `runtime/1.8.8-wasm/bootstrap.js` — EPW loader/bootstrap
- `.github/workflows/pages.yml` — GitHub Pages build and deployment

## Client menu

Press **Right Shift** in the game page to open or close the HCunion menu. Press **Escape** or the close button to close it.

The sidebar currently contains:
- **Mods** — four visual demo cards: Auto Clicker, Aim Assist, Auto Rod, and Macro
- **Cosmetics** — cosmetic style selectors and local menu previews

The four mod cards are intentionally non-functional previews. Their controls are disabled; they do not aim, click, swap items, run macros, or modify gameplay. Cosmetics are also menu-only previews and are not rendered on the Minecraft player or shared with other players.

There are no Home, Settings, or Profiles tabs in the current menu.

## Current verification status

The Pages workflow checks that the required launch files exist and deploys the repository. A successful Pages deployment confirms hosting, not that the third-party game runtime, multiplayer relays, browser compatibility, or in-game controls have been fully tested. Test the live page in the target browser before treating the client as production-ready.

The runtime loads the EPW asset from the external `yummyfiles/Minecraft-Launcher` GitHub repository. If that asset moves, becomes unavailable, or changes format, the game launch can fail.

## Credits and licensing

Before bundling or redistributing third-party runtime code or game assets, verify the source license, attribution requirements, and redistribution permissions. HCunion is a community project and is not affiliated with Mojang or Microsoft.
