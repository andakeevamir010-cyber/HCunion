/* HCunion settings: defaults, validation, localStorage persistence. */
(function (root) {
  "use strict";

  var STORAGE_KEY = "hcunion.settings.v1";

  var DEFAULTS = {
    clicker: {
      enabled: false,
      toggleKey: "KeyR",
      minCps: 8,
      maxCps: 12,
      randomization: 40,
      distribution: "uniform",
      left: true,
      right: false
    },
    aim: {
      enabled: false,
      lockKey: "KeyI",
      range: 6,
      fov: 90,
      sensitivity: 35,
      verticalStrength: 60,
      targetMode: "crosshair",
      aimPoint: "chest",
      onlyWhileAttacking: true,
      requireLineOfSight: true,
      ignoreInvisible: true,
      ignoreTeammates: true,
      showHud: true
    }
  };

  // Aim settings are mirrored here (base64 JSON) so the Java client can read them via
  // EagRuntime.getStorage("hcunion_aim"). Verify the real key prefix, see CLIENT_PATCH.md.
  var BRIDGE_KEY = "_eaglercraftX.hcunion_aim";

  var LIMITS = {
    minCps: [1, 30], maxCps: [1, 30], randomization: [0, 100],
    range: [2, 12], fov: [10, 360], sensitivity: [1, 100], verticalStrength: [0, 100]
  };
  var DISTRIBUTIONS = ["uniform", "smooth"];
  var TARGET_MODES = ["crosshair", "nearest", "health"];
  var AIM_POINTS = ["chest", "head"];
  var AIM_BOOLS = ["enabled", "onlyWhileAttacking", "requireLineOfSight", "ignoreInvisible", "ignoreTeammates", "showHud"];
  var AIM_NUMS = ["range", "fov", "sensitivity", "verticalStrength"];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  // Coerce any stored/untrusted object into a valid settings object.
  function sanitizeAim(a, d) {
    if (!a || typeof a !== "object") return;
    AIM_BOOLS.forEach(function (k) { if (typeof a[k] === "boolean") d[k] = a[k]; });
    AIM_NUMS.forEach(function (k) {
      var v = Number(a[k]);
      if (isFinite(v)) d[k] = clamp(Math.round(v), LIMITS[k][0], LIMITS[k][1]);
    });
    if (typeof a.lockKey === "string" && /^[A-Za-z0-9]{1,24}$/.test(a.lockKey)) d.lockKey = a.lockKey;
    if (TARGET_MODES.indexOf(a.targetMode) !== -1) d.targetMode = a.targetMode;
    if (AIM_POINTS.indexOf(a.aimPoint) !== -1) d.aimPoint = a.aimPoint;
  }

  function sanitize(input) {
    var out = clone(DEFAULTS);
    if (input && typeof input === "object") sanitizeAim(input.aim, out.aim);
    var c = input && typeof input === "object" ? input.clicker : null;
    if (!c || typeof c !== "object") return out;
    var d = out.clicker;
    if (typeof c.enabled === "boolean") d.enabled = c.enabled;
    if (typeof c.toggleKey === "string" && /^[A-Za-z0-9]{1,24}$/.test(c.toggleKey)) d.toggleKey = c.toggleKey;
    ["minCps", "maxCps", "randomization"].forEach(function (k) {
      var v = Number(c[k]);
      if (isFinite(v)) d[k] = clamp(Math.round(v), LIMITS[k][0], LIMITS[k][1]);
    });
    if (DISTRIBUTIONS.indexOf(c.distribution) !== -1) d.distribution = c.distribution;
    if (typeof c.left === "boolean") d.left = c.left;
    if (typeof c.right === "boolean") d.right = c.right;
    if (d.minCps > d.maxCps) d.minCps = d.maxCps;
    return out;
  }

  function createStore(storage) {
    var state = clone(DEFAULTS);
    var listeners = [];
    var ok = true;

    try {
      var raw = storage && storage.getItem(STORAGE_KEY);
      if (raw) state = sanitize(JSON.parse(raw));
    } catch (e) { ok = false; }

    function save() {
      try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); ok = true; } catch (e) { ok = false; }
    }
    function emit() { listeners.slice().forEach(function (fn) { try { fn(state); } catch (e) { /* ignore */ } }); }

    return {
      get: function () { return state; },
      // Merge a partial clicker patch, re-validate, persist, notify.
      setClicker: function (patch) {
        var next = clone(state);
        Object.keys(patch).forEach(function (k) { next.clicker[k] = patch[k]; });
        // Keep min <= max by moving whichever slider the user did not just touch.
        if (next.clicker.minCps > next.clicker.maxCps) {
          if ("minCps" in patch && !("maxCps" in patch)) next.clicker.maxCps = next.clicker.minCps;
          else next.clicker.minCps = next.clicker.maxCps;
        }
        state = sanitize(next);
        save(); emit();
      },
      // Merge a partial aim patch, re-validate, persist, notify.
      setAim: function (patch) {
        var next = clone(state);
        Object.keys(patch).forEach(function (k) { next.aim[k] = patch[k]; });
        state = sanitize(next);
        save(); emit();
      },
      set: function (section, patch) { return section === "aim" ? this.setAim(patch) : this.setClicker(patch); },
      reset: function () { state = clone(DEFAULTS); save(); emit(); },
      subscribe: function (fn) { listeners.push(fn); },
      persistenceOk: function () { return ok; }
    };
  }

  var api = { STORAGE_KEY: STORAGE_KEY, BRIDGE_KEY: BRIDGE_KEY, DEFAULTS: DEFAULTS, LIMITS: LIMITS, DISTRIBUTIONS: DISTRIBUTIONS, TARGET_MODES: TARGET_MODES, AIM_POINTS: AIM_POINTS, sanitize: sanitize, createStore: createStore };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.HCunion = root.HCunion || {}; root.HCunion.config = api; }
})(typeof window !== "undefined" ? window : this);
