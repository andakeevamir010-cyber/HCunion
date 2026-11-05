/*
 * HCunion auto clicker (browser-side).
 *
 * LIMITATION: the EaglercraftX WASM-GC package exposes no game state to the page,
 * so this cannot know about targets or held items. It repeats clicks only while
 * YOU physically hold the mouse button (left and/or right, per settings).
 * Clicks are synthetic MouseEvents dispatched at the game's pointer-lock element.
 */
(function (root) {
  "use strict";

  // Delay in ms until the next click. Pure function; rnd is injectable for tests.
  function pickInterval(s, rnd) {
    rnd = rnd || Math.random;
    var lo = Math.min(s.minCps, s.maxCps), hi = Math.max(s.minCps, s.maxCps);
    var center = (lo + hi) / 2, span = hi - lo, r = s.randomization / 100;
    var u = s.distribution === "smooth" ? (rnd() + rnd() + rnd()) / 3 : rnd();
    var cps = center + (u - 0.5) * span * r;
    cps = Math.min(hi, Math.max(lo, cps));
    return 1000 / cps;
  }

  function createEngine(opts) {
    var win = opts.window, doc = opts.document, store = opts.store;
    var onChange = opts.onChange || function () {};
    var menuOpen = opts.isMenuOpen || function () { return false; };
    var timers = { 0: null, 2: null };
    var started = false;

    function target() {
      return doc.pointerLockElement || (doc.querySelector && doc.querySelector("#game_frame canvas")) || null;
    }

    function fire(type, button) {
      var t = target();
      if (!t) return false;
      t.dispatchEvent(new win.MouseEvent(type, {
        bubbles: true, cancelable: true, view: win,
        button: button, buttons: type === "mouseup" ? 0 : (button === 0 ? 1 : 2)
      }));
      return true;
    }

    function clickOnce(button) {
      if (!fire("mousedown", button)) return;
      win.setTimeout(function () { fire("mouseup", button); }, 8 + Math.floor(Math.random() * 12));
    }

    function schedule(button) {
      var s = store.get().clicker;
      timers[button] = win.setTimeout(function () {
        var cur = store.get().clicker;
        var allowed = button === 0 ? cur.left : cur.right;
        if (!cur.enabled || !allowed || menuOpen()) { timers[button] = null; return; }
        clickOnce(button);
        schedule(button);
      }, pickInterval(s));
    }

    function stop(button) {
      if (timers[button] !== null) { win.clearTimeout(timers[button]); timers[button] = null; }
    }
    function stopAll() { stop(0); stop(2); }

    function onMouseDown(e) {
      if (!e.isTrusted || (e.button !== 0 && e.button !== 2)) return;
      var s = store.get().clicker;
      var allowed = e.button === 0 ? s.left : s.right;
      if (!s.enabled || !allowed || menuOpen()) return;
      stop(e.button);
      schedule(e.button);
    }
    function onMouseUp(e) {
      if (!e.isTrusted) return;
      if (e.button === 0 || e.button === 2) stop(e.button);
    }
    function onKeyDown(e) {
      if (!e.isTrusted || e.repeat || menuOpen()) return;
      var tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.code === store.get().clicker.toggleKey) {
        store.setClicker({ enabled: !store.get().clicker.enabled });
        onChange();
      }
    }

    return {
      start: function () {
        if (started) return;
        started = true;
        win.addEventListener("mousedown", onMouseDown, true);
        win.addEventListener("mouseup", onMouseUp, true);
        win.addEventListener("keydown", onKeyDown, true);
        win.addEventListener("blur", stopAll);
        doc.addEventListener("pointerlockchange", function () { if (!doc.pointerLockElement) stopAll(); });
        store.subscribe(function (s) { if (!s.clicker.enabled) stopAll(); });
      },
      stopAll: stopAll,
      _clickOnce: clickOnce
    };
  }

  var api = { pickInterval: pickInterval, createEngine: createEngine };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.HCunion = root.HCunion || {}; root.HCunion.clicker = api; }
})(typeof window !== "undefined" ? window : this);
