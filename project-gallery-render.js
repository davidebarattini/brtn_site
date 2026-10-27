// Colonne bilanciate come nelle pagine Action/People/Places: ogni foto tiene il
// suo formato reale. Le due colonne di destra partono sotto il blocco info, che
// resta in alto a destra.
const GAP_DESKTOP = 12;
const GAP_MOBILE = 8;

// Altezza relativa per unità di larghezza colonna (deve combaciare con i ratio in CSS):
// landscape 3:2 → 2/3, portrait 2:3 → 3/2, auto 4:5 → 5/4
const HEIGHT_RATIO = {
  landscape: 2 / 3,
  portrait: 3 / 2,
  auto: 5 / 4,
};

function isCompact() {
  return window.matchMedia("(max-width: 992px)").matches;
}

function getColumnCount() {
  // Mobile: una sola colonna
  if (window.matchMedia("(max-width: 576px)").matches) return 1;
  return isCompact() ? 2 : 4;
}

// Generatore pseudo-casuale con seme: l'ordine mescolato resta lo stesso a ogni visita
function seededRandom(seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Ordine per la colonna singola su mobile (attivo con data-mobile-mix): foto
// mescolate, mai due verticali di seguito. Ogni verticale va in uno spazio
// diverso tra le orizzontali, quindi si alternano o restano due orizzontali e
// una verticale. Se le verticali sono troppe per evitarlo, l'ordine non cambia.
function mixForMobile(images, seedText) {
  const random = seededRandom(seedText);
  const portraits = shuffle(images.filter((img) => img.orientation === "portrait"), random);
  const others = shuffle(images.filter((img) => img.orientation !== "portrait"), random);
  if (portraits.length > others.length + 1) return images;

  // Spazi disponibili: prima, tra e dopo le orizzontali
  const slots = shuffle(
    Array.from({ length: others.length + 1 }, (_, i) => i),
    random
  ).slice(0, portraits.length);
  const withPortrait = new Set(slots);

  const out = [];
  let p = 0;
  for (let i = 0; i <= others.length; i += 1) {
    if (withPortrait.has(i)) out.push(portraits[p++]);
    if (i < others.length) out.push(others[i]);
  }
  return out;
}

async function loadGallery(key) {
  const res = await fetch(`galleries/${encodeURIComponent(key)}.json`, { cache: "no-store" });
  if (!res.ok) return null;
  return await res.json();
}

function createItem(item, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "gallery-item";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.src = item.src;
  img.alt = item.alt || "";
  img.dataset.index = String(index);

  const orientation = item.orientation || "auto";
  img.dataset.orientation = orientation;
  wrapper.dataset.orientation = orientation;

  // Se non specificato, lo capiamo dopo il load senza cambiare misure/layout
  img.addEventListener(
    "load",
    () => {
      if (img.dataset.orientation !== "auto") return;
      const o = img.naturalWidth >= img.naturalHeight ? "landscape" : "portrait";
      img.dataset.orientation = o;
      wrapper.dataset.orientation = o;
    },
    { once: true }
  );

  wrapper.appendChild(img);
  return wrapper;
}

function buildGallery(container, images) {
  const existing = container.querySelector(".gallery-columns");
  if (existing) existing.remove();
  if (images.length === 0) return;

  const columnCount = getColumnCount();
  const gap = isCompact() ? GAP_MOBILE : GAP_DESKTOP;

  const columns = document.createElement("div");
  columns.className = "gallery-columns";

  const cols = [];
  for (let i = 0; i < columnCount; i += 1) {
    const col = document.createElement("div");
    col.className = "gallery-col";
    columns.appendChild(col);
    cols.push(col);
  }
  container.appendChild(columns);

  const colHeights = new Array(columnCount).fill(0);

  // Da desktop le ultime due colonne partono sotto il blocco info: le misure
  // vanno prese a colonne già nel DOM, altrimenti la larghezza non è nota.
  const info = container.querySelector(".project-info");
  if (info && columnCount === 4) {
    const colWidth = cols[0].getBoundingClientRect().width;
    const offset = info.getBoundingClientRect().height + gap;
    if (colWidth > 0 && offset > gap) {
      cols[2].style.paddingTop = `${offset}px`;
      cols[3].style.paddingTop = `${offset}px`;
      // Le altezze sono in unità di larghezza colonna, come HEIGHT_RATIO
      colHeights[2] = offset / colWidth;
      colHeights[3] = colHeights[2];
    }
  }

  const ordered =
    columnCount === 1 && container.hasAttribute("data-mobile-mix")
      ? mixForMobile(images, container.getAttribute("data-project-gallery") || "")
      : images;

  ordered.forEach((item, idx) => {
    const wrapper = createItem(item, idx);

    // Masonry: scegli la colonna attualmente più corta (tie → la più a sinistra)
    let targetIdx = 0;
    for (let c = 1; c < colHeights.length; c += 1) {
      if (colHeights[c] < colHeights[targetIdx]) targetIdx = c;
    }
    cols[targetIdx].appendChild(wrapper);
    colHeights[targetIdx] += HEIGHT_RATIO[item.orientation] ?? HEIGHT_RATIO.auto;
  });
}

async function renderProjectGalleries() {
  const containers = Array.from(document.querySelectorAll("[data-project-gallery]"));
  if (containers.length === 0) return;

  const byKey = new Map();
  const rendered = [];

  for (const el of containers) {
    const key = el.getAttribute("data-project-gallery");
    if (!key) continue;

    if (!byKey.has(key)) {
      try {
        byKey.set(key, await loadGallery(key));
      } catch {
        byKey.set(key, null);
      }
    }

    const data = byKey.get(key);
    const images = Array.isArray(data?.images) ? data.images : [];

    buildGallery(el, images);
    rendered.push({ el, images });
  }

  const rebuildAll = () => {
    rendered.forEach(({ el, images }) => buildGallery(el, images));
    document.dispatchEvent(new CustomEvent("gallery:rendered", { detail: { type: "project" } }));
  };

  document.dispatchEvent(new CustomEvent("gallery:rendered", { detail: { type: "project" } }));

  // Il font può cambiare l'altezza del blocco info: rimisura una volta pronto
  if (document.fonts?.ready) document.fonts.ready.then(rebuildAll);

  let columnCount = getColumnCount();
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      // Ricostruisci al cambio di colonne, e su desktop anche al cambio di
      // larghezza: il distacco delle due colonne di destra dipende dalle misure.
      const next = getColumnCount();
      const widthChanged = next === 4;
      if (next === columnCount && !widthChanged) return;
      columnCount = next;
      rebuildAll();
    }, 150);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  renderProjectGalleries();
});
