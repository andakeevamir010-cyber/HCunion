/* HCunion mod menu (Right Shift) and status HUD. Plain DOM, no dependencies. */
(function (root) {
  "use strict";

  var CSS = [
    ".hcu-hud{position:fixed;top:6px;left:6px;z-index:2147483000;font:14px/1.2 'Minecraft','Courier New',monospace;color:#fff;text-shadow:1px 1px 0 #3f3f3f;background:rgba(0,0,0,.35);padding:3px 6px;pointer-events:none;white-space:nowrap}",
    ".hcu-on{color:#55ff55}.hcu-off{color:#ff5555}",
    ".hcu-overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;font:14px/1.3 'Minecraft','Courier New',monospace;color:#fff;text-shadow:1px 1px 0 #3f3f3f}",
    ".hcu-panel{width:min(420px,94vw);max-height:92vh;overflow:auto;background:#2b2b2b;border:2px solid #000;box-shadow:inset 2px 2px 0 #5a5a5a,inset -2px -2px 0 #1a1a1a;padding:12px}",
    ".hcu-title{text-align:center;margin:0 0 8px;font-size:16px}",
    ".hcu-tabs{display:flex;gap:4px;margin-bottom:10px}",
    ".hcu-btn{font:inherit;color:#fff;text-shadow:1px 1px 0 #3f3f3f;background:#6f6f6f;border:2px solid #000;box-shadow:inset 2px 2px 0 #a8a8a8,inset -2px -2px 0 #3d3d3d;padding:6px 8px;cursor:pointer;text-align:center}",
    ".hcu-btn:hover{background:#7d86b8;color:#ffffa0}",
    ".hcu-btn.hcu-active{background:#4b4b4b;box-shadow:inset 2px 2px 0 #2a2a2a,inset -2px -2px 0 #6a6a6a}",
    ".hcu-tabs .hcu-btn{flex:1}",
    ".hcu-row{margin:8px 0}",
    ".hcu-row label{display:block;margin-bottom:3px}",
    ".hcu-row .hcu-btn,.hcu-row select{width:100%;box-sizing:border-box}",
    ".hcu-row select{font:inherit;padding:5px;background:#6f6f6f;color:#fff;border:2px solid #000}",
    ".hcu-row input[type=range]{width:100%;accent-color:#7d86b8}",
    ".hcu-note{color:#bbb;font-size:13px;margin:6px 0}",
    ".hcu-foot{display:flex;gap:6px;margin-top:12px}.hcu-foot .hcu-btn{flex:1}",
    ".hcu-tip{position:fixed;z-index:2147483002;max-width:260px;background:#100010;border:2px solid #2d0a63;color:#fff;padding:5px 7px;font:13px/1.3 'Minecraft','Courier New',monospace;pointer-events:none;display:none}"
  ].join("\n");

  function keyLabel(code) {
    return String(code).replace(/^Key/, "").replace(/^Digit/, "").replace(/^Arrow/, "");
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function createMenu(opts) {
    var store = opts.store, cfg = opts.config;
    var doc = document, win = window;
    var open = false, tab = "clicker", rebinding = false;

    var style = el("style"); style.textContent = CSS; doc.head.appendChild(style);
    var hud = el("div", "hcu-hud"); doc.body.appendChild(hud);
    var tip = el("div", "hcu-tip"); doc.body.appendChild(tip);
    var overlay = el("div", "hcu-overlay"); doc.body.appendChild(overlay);
    var panel = el("div", "hcu-panel"); overlay.appendChild(panel);

    function withTip(node, text) {
      node.setAttribute("data-tip", text);
      node.addEventListener("mouseenter", function () { tip.textContent = text; tip.style.display = "block"; });
      node.addEventListener("mousemove", function (e) {
        tip.style.left = Math.min(e.clientX + 14, win.innerWidth - 270) + "px";
        tip.style.top = (e.clientY + 14) + "px";
      });
      node.addEventListener("mouseleave", function () { tip.style.display = "none"; });
      return node;
    }

    function toggleRow(label, key, tipText) {
      var row = el("div", "hcu-row");
      var b = el("button", "hcu-btn");
      b.type = "button";
      function paint() { b.textContent = label + ": " + (store.get().clicker[key] ? "ON" : "OFF"); }
      b.addEventListener("click", function () { var p = {}; p[key] = !store.get().clicker[key]; store.setClicker(p); });
      paint(); b._paint = paint;
      row.appendChild(withTip(b, tipText));
      return row;
    }

    function sliderRow(label, key, tipText, unit) {
      var row = el("div", "hcu-row");
      var l = el("label"), s = el("input");
      s.type = "range"; s.min = cfg.LIMITS[key][0]; s.max = cfg.LIMITS[key][1]; s.step = 1;
      function paint() { var v = store.get().clicker[key]; s.value = v; l.textContent = label + ": " + v + (unit || ""); }
      s.addEventListener("input", function () { var p = {}; p[key] = Number(s.value); store.setClicker(p); });
      paint(); row._paint = paint;
      row.appendChild(l); row.appendChild(s);
      withTip(row, tipText);
      return row;
    }

    function selectRow(label, key, options, tipText) {
      var row = el("div", "hcu-row");
      var l = el("label", null, label), s = el("select");
      options.forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; s.appendChild(op); });
      s.addEventListener("change", function () { var p = {}; p[key] = s.value; store.setClicker(p); });
      row._paint = function () { s.value = store.get().clicker[key]; };
      row._paint();
      row.appendChild(l); row.appendChild(s);
      withTip(row, tipText);
      return row;
    }

    function keybindRow(label, key, tipText) {
      var row = el("div", "hcu-row");
      var b = el("button", "hcu-btn"); b.type = "button";
      function paint() { b.textContent = label + ": [" + (rebinding ? "press a key..." : keyLabel(store.get().clicker[key])) + "]"; }
      b.addEventListener("click", function () {
        rebinding = true; paint();
        function onKey(e) {
          e.preventDefault(); e.stopPropagation();
          rebinding = false;
          win.removeEventListener("keydown", onKey, true);
          if (e.code !== "Escape" && e.code !== "ShiftRight") { var p = {}; p[key] = e.code; store.setClicker(p); }
          paint();
        }
        win.addEventListener("keydown", onKey, true);
      });
      paint(); row._paint = paint;
      row.appendChild(withTip(b, tipText));
      return row;
    }

    var painters = [];
    function add(parent, row) { parent.appendChild(row); if (row._paint) painters.push(row._paint); else { var b = row.querySelector("button"); if (b && b._paint) painters.push(b._paint); } }

    function build() {
      panel.textContent = ""; painters = [];
      panel.appendChild(el("h2", "hcu-title", "HCunion Mod Menu"));

      var tabs = el("div", "hcu-tabs");
      [["clicker", "Auto Clicker", "Click timing settings."], ["aim", "Aim Assist", "Status of the aim assist module."]].forEach(function (t) {
        var b = el("button", "hcu-btn" + (tab === t[0] ? " hcu-active" : ""), t[1]); b.type = "button";
        b.addEventListener("click", function () { tab = t[0]; build(); });
        tabs.appendChild(withTip(b, t[2]));
      });
      panel.appendChild(tabs);

      if (tab === "clicker") {
        add(panel, toggleRow("Auto Clicker", "enabled", "Master switch. While ON, holding the mouse button repeats clicks at the CPS below."));
        add(panel, keybindRow("Toggle key", "toggleKey", "Click, then press a key to rebind the on/off hotkey. Esc cancels."));
        add(panel, sliderRow("Min CPS", "minCps", "Lowest clicks per second. Cannot exceed Max CPS.", ""));
        add(panel, sliderRow("Max CPS", "maxCps", "Highest clicks per second. Cannot go below Min CPS.", ""));
        add(panel, sliderRow("Randomization", "randomization", "0 = constant CPS at the midpoint of min and max. 100 = timing varies across the full min to max range.", "%"));
        add(panel, selectRow("Timing distribution", "distribution", [["uniform", "Uniform"], ["smooth", "Smooth (clustered near midpoint)"]], "Uniform picks any CPS in range equally. Smooth favors values near the midpoint. Only matters when Randomization is above 0."));
        add(panel, toggleRow("Left click", "left", "Repeat left clicks while you hold the left mouse button."));
        add(panel, toggleRow("Right click", "right", "Repeat right clicks while you hold the right mouse button."));
        panel.appendChild(el("p", "hcu-note", "Works only while you hold the button. It cannot see targets or held items."));
      } else {
        panel.appendChild(el("p", "hcu-note", "Not available. The EaglercraftX WASM-GC package does not expose player, entity or camera data to the page, so aim assist and target lock-on cannot be implemented from this launcher. They need changes to the client's Java source and a rebuilt package."));
      }

      var foot = el("div", "hcu-foot");
      var reset = el("button", "hcu-btn", "Reset settings"); reset.type = "button";
      reset.addEventListener("click", function () { store.reset(); });
      var done = el("button", "hcu-btn", "Done"); done.type = "button";
      done.addEventListener("click", function () { setOpen(false); });
      foot.appendChild(withTip(reset, "Restore all settings to defaults and clear the saved copy."));
      foot.appendChild(done);
      panel.appendChild(foot);
      if (!store.persistenceOk()) panel.appendChild(el("p", "hcu-note", "Warning: browser storage is unavailable, settings will not persist."));
    }

    function repaint() {
      var s = store.get().clicker;
      var parts = s.left && s.right ? "L+R" : s.right ? "R" : s.left ? "L" : "none";
      hud.textContent = "";
      var span = el("span", s.enabled ? "hcu-on" : "hcu-off", s.enabled ? "ON" : "OFF");
      hud.appendChild(doc.createTextNode("AutoClicker: ")); hud.appendChild(span);
      hud.appendChild(doc.createTextNode(" " + s.minCps + "-" + s.maxCps + " CPS [" + parts + "] (" + keyLabel(s.toggleKey) + ")"));
      painters.forEach(function (p) { p(); });
    }

    function setOpen(v) {
      open = v;
      overlay.style.display = v ? "flex" : "none";
      tip.style.display = "none";
      if (v) { build(); repaint(); if (doc.exitPointerLock) doc.exitPointerLock(); }
    }

    // Right Shift toggles the menu; while it is open, keys must not reach the game.
    win.addEventListener("keydown", function (e) {
      if (!e.isTrusted) return;
      if (e.code === "ShiftRight" && !e.repeat && !rebinding) { e.preventDefault(); e.stopImmediatePropagation(); setOpen(!open); return; }
      if (open && !rebinding) { e.stopImmediatePropagation(); if (e.code === "Escape") setOpen(false); }
    }, true);
    win.addEventListener("keyup", function (e) { if (open && e.isTrusted) e.stopImmediatePropagation(); }, true);
    overlay.addEventListener("mousedown", function (e) { e.stopPropagation(); if (e.target === overlay) setOpen(false); });

    store.subscribe(repaint);
    repaint();
    return { isOpen: function () { return open; }, setOpen: setOpen, repaint: repaint };
  }

  var api = { createMenu: createMenu, keyLabel: keyLabel };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.HCunion = root.HCunion || {}; root.HCunion.menu = api; }
})(typeof window !== "undefined" ? window : this);
