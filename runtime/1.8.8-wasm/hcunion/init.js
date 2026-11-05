/* HCunion entry point. Failures here must never stop the game from launching. */
(function () {
  "use strict";
  function boot() {
    try {
      var H = window.HCunion;
      var storage = null;
      try { storage = window.localStorage; } catch (e) { /* storage blocked */ }
      var store = H.config.createStore(storage);
      var menu = H.menu.createMenu({ store: store, config: H.config });
      var engine = H.clicker.createEngine({
        window: window, document: document, store: store,
        isMenuOpen: menu.isOpen, onChange: menu.repaint
      });
      engine.start();
      window.HCunion.store = store;

      // Mirror aim settings for the Java client (see CLIENT_PATCH.md).
      function publishAim() {
        try {
          var json = JSON.stringify(store.get().aim);
          window.HCunion.aimJson = json;
          if (storage) storage.setItem(H.config.BRIDGE_KEY, btoa(json));
        } catch (e) { /* bridge is best-effort */ }
      }
      store.subscribe(publishAim);
      publishAim();
    } catch (err) {
      console.error("HCunion: failed to initialise mod menu (game unaffected)", err);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
