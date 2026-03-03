import shortcuts from "./shortcuts.js";

export const matchShortcut = (e, definition) => {
  const key = e.key.toLowerCase();

  const required = definition.keys.map(k => k.toLowerCase());

  const ctrl = required.includes("ctrl");
  const shift = required.includes("shift");
  const alt = required.includes("alt");

  const mainKey = required.find(
    k => !["ctrl", "shift", "alt"].includes(k)
  );

  return (
    e.ctrlKey === ctrl &&
    e.shiftKey === shift &&
    e.altKey === alt &&
    key === mainKey
  );
};

const keyDisplayMap = {
  arrow_left: "←",
  arrow_right: "→",
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  delete: "Delete",
  home: "Home",
  end: "End",
  space: "Space",
};

export const formatShortcut = (definition) => {
  if (!definition?.keys) return "";

  return definition.keys
    .map(k => {
      const key = k.toLowerCase();
      return keyDisplayMap[key] || k.toUpperCase();
    })
    .join(" + ");
};


export const applyShortcutTooltips = () => {
  document.querySelectorAll("[data-shortcut]").forEach((el) => {
    const id = el.dataset.shortcut;
    const def = shortcuts[id];
    if (!def) return;

    const formatted = formatShortcut(def);

    el.title = `${id.replace("_", " ")} (${formatted})`;
  });
};

