# HCunion runtime integration notes

## Required target

- Minecraft Java 1.8.8 only
- Browser-hosted client
- WASM-GC target requested by the project owner
- GitHub Pages deployment
- Keyboard and mouse support; touch/iPad testing is a later compatibility check

## Current status

The repository currently contains the HCunion client shell and browser-side preferences. It is not yet a playable Minecraft client. No Minecraft game engine, protocol implementation, game assets, or WASM-GC runtime is bundled here.

## Runtime acceptance checklist

Before adding a runtime, verify all of the following from the upstream project and its exact release/commit:

1. The implementation genuinely supports Minecraft 1.8.8, not merely a version selector that includes 1.8.
2. Its source and required assets have clear licenses and redistribution terms that permit the intended GitHub Pages hosting.
3. It can be built and served as static files, or document any required backend/proxy. GitHub Pages cannot run a Node server.
4. Its WASM-GC requirement and browser support are documented and tested.
5. It supports the intended server protocol and keyboard/mouse input.
6. The upstream notices and license files are preserved.

## Feature integration boundary

The settings shell currently provides UI/preferences and manual practice helpers. Game-connected modules should only be integrated after the actual runtime and its supported extension hooks are identified. Do not pretend a UI toggle is an operational game mod.

For fair-play compatibility, keep combat automation out. Safe integrations include display-only target information, practice counters, manual combo guidance, and non-combat text shortcuts.

## GitHub Pages

The workflow at .github/workflows/pages.yml validates the static shell and deploys the repository root. In repository Settings > Pages, select GitHub Actions as the deployment source if it is not already selected.
