(() => {
  "use strict";
  const root = document.getElementById("hcunion-overlay-root");
  if (!root) return;
  const storageKey = "hcunion_mods_config";
  const htmlUrl = new URL("../../Mods-menu.html", document.currentScript.src).href;
  const descriptions = {
    "ac-enabled":"Controls this setting's saved on/off state. It does not activate game automation.",
    "ac-cps-slider":"Adjust the displayed clicks-per-second value.",
    "ac-cps-val":"Enter a clicks-per-second value between 1 and 20.",
    "ac-click-type":"Choose which mouse button this setting represents.",
    "ac-burst":"Toggle the saved burst-mode preference.",
    "ac-burst-clicks":"Set the number of clicks shown for a burst.",
    "ac-burst-duration":"Set the displayed burst duration in milliseconds.",
    "aim-enabled":"Controls this setting's saved on/off state; no player targeting is performed.",
    "aim-range":"Adjust the displayed range preference in blocks.",
    "aim-keybind":"Click to assign a key for this menu setting. Escape clears it.",
    "aim-mode":"Choose how the preference is displayed.",
    "aim-smoothness":"Adjust the displayed smoothness preference.",
    "rod-enabled":"Controls this setting's saved on/off state; no item swapping is performed.",
    "rod-keybind":"Click to assign a key for this menu setting. Escape clears it.",
    "rod-action":"Choose the saved rod action preference.",
    "rod-speed":"Adjust the displayed timing preference in milliseconds.",
    "rod-sword-toggle":"Save whether the sword-after-rod preference is enabled.",
    "rod-sword-slot":"Choose the saved hotbar slot preference.",
    "macro-enabled":"Controls this setting's saved on/off state; no macro is executed.",
    "macro-keybind":"Click to assign a key for this menu setting. Escape clears it.",
    "macro-type":"Choose a macro category label; this UI does not execute actions.",
    "macro-delay":"Adjust the displayed delay preference in milliseconds.",
    "macro-sequence":"Store notes or a sequence draft locally. Nothing here is executed."
  };

  fetch(htmlUrl).then(r => {
    if (!r.ok) throw new Error("Could not load the HCunion settings markup (" + r.status + ").");
    return r.text();
  }).then(markup => {
    root.innerHTML = markup;
    initialize();
  }).catch(err => console.error("[HCunion UI]", err));

  function initialize() {
    const menu = root.querySelector(".hcunion-menu");
    if (!menu) return;
    root.setAttribute("aria-hidden", "true");
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-label", "HCunion settings");
    menu.querySelectorAll(".nav-item").forEach((item, index) => {
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-selected", item.classList.contains("active") ? "true" : "false");
      const activate = () => {
        menu.querySelectorAll(".nav-item").forEach(n => {
          const active = n === item;
          n.classList.toggle("active", active);
          n.setAttribute("aria-selected", String(active));
        });
        menu.querySelectorAll(".mod-panel").forEach(p => p.classList.toggle("active", p.id === item.dataset.target));
      };
      item.addEventListener("click", activate);
      item.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const items = [...menu.querySelectorAll(".nav-item")];
          items[(index + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus();
        }
      });
    });

    const tracked = [...menu.querySelectorAll("input[id],select[id],textarea[id]")];
    const byId = id => menu.querySelector("#" + CSS.escape(id));
    tracked.forEach(el => {
      if (descriptions[el.id]) el.setAttribute("data-tooltip", descriptions[el.id]);
      if (el.type === "checkbox") return;
      const label = el.closest(".setting-row")?.querySelector(":scope > span:first-child");
      if (label && descriptions[el.id]) label.setAttribute("data-tooltip", descriptions[el.id]);
    });

    const sliders = [
      ["aim-range","aim-range-val"],["aim-smoothness","aim-smoothness-val"],
      ["rod-speed","rod-speed-val"],["macro-delay","macro-delay-val"]
    ];
    function syncDisplays() {
      sliders.forEach(([sid,did]) => { const s=byId(sid),d=byId(did); if(s&&d)d.textContent=s.value; });
      const range=byId("ac-cps-slider"), number=byId("ac-cps-val");
      if(range&&number) number.value=range.value;
    }
    function save() {
      const config = {};
      tracked.forEach(el => config[el.id] = el.type === "checkbox" ? el.checked : el.value);
      try { localStorage.setItem(storageKey, JSON.stringify(config)); }
      catch (e) { console.warn("[HCunion UI] Settings could not be saved.", e); }
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      tracked.forEach(el => {
        if (!(el.id in saved)) return;
        if (el.type === "checkbox") el.checked = Boolean(saved[el.id]);
        else if (el.type === "range" || el.type === "number") {
          const value = Number(saved[el.id]);
          if (Number.isFinite(value)) el.value = String(Math.min(Number(el.max || Infinity), Math.max(Number(el.min || -Infinity), value)));
        } else el.value = String(saved[el.id]);
      });
    } catch (e) { console.warn("[HCunion UI] Saved settings were invalid.", e); }
    syncDisplays();

    byId("ac-cps-slider")?.addEventListener("input", () => { syncDisplays(); save(); });
    byId("ac-cps-val")?.addEventListener("input", e => {
      const n=Number(e.target.value);
      if(Number.isFinite(n)) byId("ac-cps-slider").value=String(Math.min(20,Math.max(1,n)));
      syncDisplays(); save();
    });
    sliders.forEach(([sid]) => byId(sid)?.addEventListener("input", () => { syncDisplays(); save(); }));
    tracked.forEach(el => {
      if (el.id === "ac-cps-slider" || el.id === "ac-cps-val" || sliders.some(x=>x[0]===el.id)) return;
      el.addEventListener("change", save);
      if (el.tagName === "TEXTAREA") el.addEventListener("input", save);
    });

    let recording = null;
    menu.querySelectorAll(".keybind-field").forEach(field => field.addEventListener("click", () => {
      if (recording) { recording.classList.remove("recording"); recording.value = recording.dataset.previous || "NONE"; }
      recording = field;
      field.dataset.previous = field.value;
      field.value = "PRESS A KEY";
      field.classList.add("recording");
    }));

    function setOpen(open) {
      root.classList.toggle("is-open", open);
      root.setAttribute("aria-hidden", String(!open));
      if (open) menu.querySelector(".nav-item.active")?.focus();
    }
    window.addEventListener("keydown", e => {
      if (recording) {
        if (e.code === "Escape") {
          e.preventDefault(); recording.value = "NONE"; recording.classList.remove("recording"); recording = null; save(); return;
        }
        if (e.code === "ShiftRight") return;
        e.preventDefault();
        recording.value = e.code === "Space" ? "SPACE" : e.key.toUpperCase();
        recording.classList.remove("recording"); recording = null; save(); return;
      }
      if (e.code === "ShiftRight" && !e.repeat) {
        e.preventDefault(); e.stopPropagation();
        setOpen(!root.classList.contains("is-open"));
      }
      if (root.classList.contains("is-open") && e.code === "Escape") {
        e.preventDefault(); setOpen(false);
      }
    }, true);
    root.addEventListener("mousedown", e => { if (e.target === root) setOpen(false); });
    root.addEventListener("click", e => {
      const target=e.target.closest("input,select,textarea,button,.nav-item");
      if(target) e.stopPropagation();
    });
  }
})();