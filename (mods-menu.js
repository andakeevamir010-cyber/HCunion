document.addEventListener("DOMContentLoaded", () => {
    const storageKey = "hcunion_mods_config";

    // 1. Tab Switching Handler
    const navItems = document.querySelectorAll(".nav-item");
    const panels = document.querySelectorAll(".mod-panel");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(i => i.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));

            item.classList.add("active");
            const target = item.getAttribute("data-target");
            document.getElementById(target).classList.add("active");
        });
    });

    // 2. Dual Binding Element Linkage (CPS Range <-> CPS Box)
    const cpsSlider = document.getElementById("ac-cps-slider");
    const cpsNum = document.getElementById("ac-cps-val");

    cpsSlider.addEventListener("input", (e) => {
        cpsNum.value = e.target.value;
        saveAllSettings();
    });
    cpsNum.addEventListener("input", (e) => {
        cpsSlider.value = e.target.value;
        saveAllSettings();
    });

    // 3. Dynamic Text Display Updates for Standard Sliders
    const slidersWithDisplay = [
        { slider: "aim-range", display: "aim-range-val" },
        { slider: "aim-smoothness", display: "aim-smoothness-val" },
        { slider: "rod-speed", display: "rod-speed-val" },
        { slider: "macro-delay", display: "macro-delay-val" }
    ];

    slidersWithDisplay.forEach(item => {
        const sliderEl = document.getElementById(item.slider);
        const displayEl = document.getElementById(item.display);
        
        sliderEl.addEventListener("input", (e) => {
            displayEl.textContent = e.target.value;
            saveAllSettings();
        });
    });

    // 4. Interactive Keybind Assignment Listener
    const keybindFields = document.querySelectorAll(".keybind-field");
    let activeKeybindField = null;

    keybindFields.forEach(field => {
        field.addEventListener("click", () => {
            if (activeKeybindField) {
                activeKeybindField.classList.remove("recording");
                activeKeybindField.value = activeKeybindField.dataset.prevVal || "NONE";
            }
            activeKeybindField = field;
            field.dataset.prevVal = field.value;
            field.value = "...PRESS KEY...";
            field.classList.add("recording");
        });
    });

    window.addEventListener("keydown", (e) => {
        if (!activeKeybindField) return;
        
        e.preventDefault();
        let keyName = e.key.toUpperCase();
        if (keyName === " ") keyName = "SPACE";
        if (keyName === "ESCAPE") keyName = "NONE";

        activeKeybindField.value = keyName;
        activeKeybindField.classList.remove("recording");
        activeKeybindField.blur();
        activeKeybindField = null;
        
        saveAllSettings();
    });

    // 5. Config Preservation Methods (Save/Load)
    const inputsToTrack = [
        "ac-enabled", "ac-cps-slider", "ac-cps-val", "ac-click-type", "ac-burst", "ac-burst-clicks", "ac-burst-duration",
        "aim-enabled", "aim-range", "aim-keybind", "aim-mode", "aim-smoothness",
        "rod-enabled", "rod-keybind", "rod-action", "rod-speed", "rod-sword-toggle", "rod-sword-slot",
        "macro-enabled", "macro-keybind", "macro-type", "macro-delay", "macro-sequence"
    ];

    function saveAllSettings() {
        const config = {};
        inputsToTrack.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (el.type === "checkbox") {
                config[id] = el.checked;
            } else {
                config[id] = el.value;
            }
        });
        localStorage.setItem(storageKey, JSON.stringify(config));
    }

    function loadAllSettings() {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        try {
            const config = JSON.parse(raw);
            inputsToTrack.forEach(id => {
                const el = document.getElementById(id);
                if (!el || config[id] === undefined) return;
                if (el.type === "checkbox") {
                    el.checked = config[id];
                } else {
                    el.value = config[id];
                }
            });

            // Re-sync standard UI textual nodes manually on cold load
            slidersWithDisplay.forEach(item => {
                document.getElementById(item.display).textContent = document.getElementById(item.slider).value;
            });
        } catch (err) {
            console.error("Failed to load HCunion mod configs:", err);
        }
    }

    // Attach basic modification listeners on remaining fields
    inputsToTrack.forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.type === "range" || el.classList.contains("keybind-field") || id === "ac-cps-val") return;
        el.addEventListener("change", saveAllSettings);
        if (el.tagName === "TEXTAREA") el.addEventListener("input", saveAllSettings);
    });

    // Init configuration states
    loadAllSettings();
});
