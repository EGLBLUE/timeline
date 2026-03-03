import { formatShortcut } from "../core/shortcutEngine.js";
import shortcuts from "../core/shortcuts.js";

const content = document.getElementById("content");
const langSwitch = document.getElementById("langSwitch");
const title = document.getElementById("app-title");

let keyShortcuts = shortcuts;
let structure = null;
let labels = null;

const renderKeys = (def) => `<code class="kbd">${formatShortcut(def)}</code>`

const injectShortcuts = (text) => {
  return text.replace(/\{\{(.*?)\}\}/g, (_, id) => {
    const def = keyShortcuts[id];
    if (!def) return "";

    return renderKeys(def)
  });
};

const loadLanguage = async (lang) => {
  localStorage.language = lang;

  const [structRes, labelRes] = await Promise.all([
    fetch("./structure.json"),
    fetch(`./${lang}.json`)
  ]);
  
  structure = await structRes.json();
  labels = await labelRes.json();

  render();

  if (location.hash) {
    const el = document.querySelector(location.hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }
};

const render = () => {
  content.innerHTML = "";
  title.textContent = labels.title;

  structure.sections.forEach(({ id }) => {
    const section = labels.sections[id];
    if (!section) return;

    const h2 = document.createElement("h2");
    h2.textContent = section.title;
    h2.className = "sub-title"
    h2.id = id
    content.appendChild(h2);

    if (section.content) {
      section.content.forEach((p) => {
        const el = document.createElement("p");
        el.innerHTML = injectShortcuts(p);
        content.appendChild(el);
      });
    }

    if (section.shortcutIds) {
      const table = document.createElement("table");
      table.innerHTML = `<tr><th>Action</th><th>Key</th></tr>`;

      section.shortcutIds.forEach((sid) => {
        if (!keyShortcuts[sid]) return;
        const def = keyShortcuts[sid];
        const tr = document.createElement("tr");

        const main = renderKeys(def)
        const alt = def.alternative
          ? "<br><small>" + renderKeys(def.alternative) + "</small>"
          : "";

        tr.innerHTML = `
          <td>${labels.actions[sid]}</td>
          <td>${main}${alt}</td>
        `;

        table.appendChild(tr);
      });

      content.appendChild(table);
    }
  });
};

langSwitch.onchange = () => loadLanguage(langSwitch.value);

const savedLang = localStorage.language || "id";
langSwitch.value = savedLang;
loadLanguage(savedLang);

