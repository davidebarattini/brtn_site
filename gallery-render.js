// Numero di colonne: 3 su desktop, 2 su tablet, 1 su mobile
// (combacia con i breakpoint delle media query nei CSS delle gallerie)
function getColumnCount() {
  if (window.matchMedia("(max-width: 576px)").matches) return 1;
  return window.matchMedia("(max-width: 992px)").matches ? 2 : 3;
}

// Altezza relativa per unità di larghezza colonna (deve combaciare con i ratio in CSS):
// landscape 3:2 → 2/3, portrait 2:3 → 3/2, auto 4:5 → 5/4
const HEIGHT_RATIO = {
  landscape: 2 / 3,
  portrait: 3 / 2,
  auto: 5 / 4,
};

function buildGallery(container, images, columnCount) {
  container.innerHTML = "";

  // Colonne reali con bilanciamento dinamico in base all'altezza
  const columns = document.createElement("div");
  columns.className = "gallery-columns";

  const cols = [];
  const colHeights = [];
  for (let i = 0; i < columnCount; i += 1) {
    const col = document.createElement("div");
    col.className = "gallery-col";
    columns.appendChild(col);
    cols.push(col);
    colHeights.push(0);
  }
  container.appendChild(columns);

  // Su mobile, colonna singola: stesso ordine di desktop ma verticali e
  // orizzontali alternate (alternateKeepingOrder sta in gallery-order.js)
  const ordered = columnCount === 1 ? alternateKeepingOrder(images) : images;

  ordered.forEach((item, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "gallery-item";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = item.src;
    img.alt = item.alt || "";
    img.dataset.index = String(idx);

    const orientation = item.orientation || "auto";
    img.dataset.orientation = orientation;
    wrapper.dataset.orientation = orientation;

    // Classe di supporto (utile anche se aggiungi regole via .img-small/.img-large)
    if (orientation === "portrait") img.classList.add("img-large");
    else if (orientation === "landscape") img.classList.add("img-small");

    // Se non specificato, lo capiamo dopo il load senza cambiare misure/layout
    img.addEventListener(
      "load",
      () => {
        if (img.dataset.orientation !== "auto") return;
        const o = img.naturalWidth >= img.naturalHeight ? "landscape" : "portrait";
        img.dataset.orientation = o;
        img.classList.toggle("img-large", o === "portrait");
        img.classList.toggle("img-small", o === "landscape");
        wrapper.dataset.orientation = o;
      },
      { once: true }
    );

    wrapper.appendChild(img);

    // Masonry: scegli la colonna attualmente più corta (tie → la più a sinistra)
    let targetIdx = 0;
    for (let i = 1; i < colHeights.length; i += 1) {
      if (colHeights[i] < colHeights[targetIdx]) targetIdx = i;
    }
    cols[targetIdx].appendChild(wrapper);
    colHeights[targetIdx] += HEIGHT_RATIO[orientation] ?? HEIGHT_RATIO.auto;
  });
}

async function renderGalleryFromJson() {
  const container = document.querySelector(".masonry[data-gallery]");
  if (!container) return;

  const key = container.getAttribute("data-gallery");
  if (!key) return;

  let data;
  try {
    const res = await fetch(`galleries/${encodeURIComponent(key)}.json`, { cache: "no-store" });
    if (!res.ok) return;
    data = await res.json();
  } catch {
    return;
  }

  const images = Array.isArray(data?.images) ? data.images : [];

  let columnCount = getColumnCount();
  buildGallery(container, images, columnCount);
  document.dispatchEvent(new CustomEvent("gallery:rendered", { detail: { key } }));

  // Ricostruisci solo quando cambia davvero il numero di colonne
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const next = getColumnCount();
      if (next === columnCount) return;
      columnCount = next;
      buildGallery(container, images, columnCount);
      document.dispatchEvent(new CustomEvent("gallery:rendered", { detail: { key } }));
    }, 150);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  renderGalleryFromJson();
});
