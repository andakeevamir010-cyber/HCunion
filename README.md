# HCunion Client

A browser-hosted Minecraft 1.8.8 client wrapper using a WASM-GC runtime.

## Launch

Open the GitHub Pages site and select **Singleplayer**, **Multiplayer**, or **Launch**:

https://andakeevamir010-cyber.github.io/HCunion/

## Repository layout

- `index.html` — landing page
- `style.css` — landing-page styles
- `runtime/1.8.8-wasm/index.html` — game runtime wrapper
- `runtime/1.8.8-wasm/bootstrap.js` — EPW loader/bootstrap
- `.github/workflows/pages.yml` — GitHub Pages build and deployment

## Runtime

This repository contains the client landing page and runtime wrapper. Custom mod-menu files and unfinished experimental Java mod source have been removed.

The game package is loaded from the external `yummyfiles/Minecraft-Launcher` repository at runtime. This project does not bundle or modify that external package.

## Verification

The Pages workflow checks that required launch files exist and deploys the repository. A successful deployment confirms hosting, not that the third-party runtime, multiplayer relays, or browser compatibility have been fully tested.

## Credits and licensing

Before bundling or redistributing third-party runtime code or game assets, verify the source license, attribution requirements, and redistribution permissions. HCunion is a community project and is not affiliated with Mojang or Microsoft.
