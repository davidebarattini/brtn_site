// Colonne bilanciate come nelle pagine Action/People/Places: ogni foto tiene il
// suo formato reale. Su desktop e tablet due colonne: quella di destra parte
// sotto il blocco info, che resta in alto a destra.
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
  // Mobile: una sola colonna; desktop e tablet: due
  return window.matchMedia("(max-width: 576px)").matches ? 1 : 2;
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

  // Su desktop e tablet la colonna di destra parte sotto il blocco info: le
  // misure vanno prese a colonne già nel DOM, altrimenti la larghezza non è nota.
  const info = container.querySelector(".project-info");
  if (info && columnCount === 2) {
    const colWidth = cols[0].getBoundingClientRect().width;
    const offset = info.getBoundingClientRect().height + gap;
    if (colWidth > 0 && offset > gap) {
      cols[1].style.paddingTop = `${offset}px`;
      // Le altezze sono in unità di larghezza colonna, come HEIGHT_RATIO
      colHeights[1] = offset / colWidth;
    }
  }

  const ordered =
    columnCount !== 1
      ? images
      : container.hasAttribute("data-mobile-keep-order")
        ? alternateKeepingOrder(images)
        : mixForMobile(images, container.getAttribute("data-project-gallery") || "");

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
      // Ricostruisci al cambio di colonne, e su desktop e tablet anche al cambio
      // di larghezza: il distacco della colonna di destra dipende dalle misure.
      const next = getColumnCount();
      const widthChanged = next === 2;
      if (next === columnCount && !widthChanged) return;
      columnCount = next;
      rebuildAll();
    }, 150);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  renderProjectGalleries();
});
