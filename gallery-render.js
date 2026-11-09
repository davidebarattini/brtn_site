// Numero di colonne: 3 su desktop, 2 su tablet, 1 su mobile
// (combacia con i breakpoint delle media query nei CSS delle gallerie).
// Con data-mobile-columns="2" sul contenitore restano 2 anche su mobile.
function getColumnCount(container) {
  if (window.matchMedia("(max-width: 576px)").matches) {
    return container?.dataset.mobileColumns === "2" ? 2 : 1;
  }
  return window.matchMedia("(max-width: 992px)").matches ? 2 : 3;
}

// Pagine di consegna (data-download-base sul contenitore): su ogni foto
// un'icona di download in alto a destra. Dove porta, in ordine di priorità:
// 1. data-download-map (file JSON { "DSC06303.jpg": "<id Google Drive>", … }):
//    scarica l'originale di quella foto da Google Drive;
// 2. data-download-folder: apre la cartella Google Drive degli originali;
// 3. data-download-base: cartella online con gli originali (stesso nome file);
// 4. altrimenti scarica l'anteprima stessa.
const DOWNLOAD_ICON =
  '<svg class="bi" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
  '<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>' +
  '<path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>' +
  "</svg>";

function createDownloadButton(item, container, downloadMap) {
  const fileName = item.src.split("/").pop();
  const driveId = downloadMap?.[fileName];
  const folder = container.dataset.downloadFolder || "";
  const base = container.dataset.downloadBase || "";
  const link = document.createElement("a");
  link.className = "download-btn";
  if (driveId) {
    link.href = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
  } else if (folder) {
    link.href = folder;
    link.target = "_blank";
    link.rel = "noopener";
  } else {
    link.href = base ? base + encodeURIComponent(fileName) : item.src;
  }
  if (!folder || driveId) link.setAttribute("download", fileName);
  link.setAttribute("aria-label", `Scarica ${fileName}`);
  link.title = "Scarica";
  link.innerHTML = DOWNLOAD_ICON;
  return link;
}

// Altezza relativa per unità di larghezza colonna (deve combaciare con i ratio in CSS):
// landscape 3:2 → 2/3, portrait 2:3 → 3/2, auto 4:5 → 5/4
const HEIGHT_RATIO = {
  landscape: 2 / 3,
  portrait: 3 / 2,
  auto: 5 / 4,
};

function buildGallery(container, images, columnCount, downloadMap) {
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

  const isDelivery = container.hasAttribute("data-download-base");

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

    // In consegna l'icona di download sta sopra la foto, in alto a destra
    if (isDelivery) wrapper.appendChild(createDownloadButton(item, container, downloadMap));

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

  // Elenco nome file → id Google Drive degli originali (pagine di consegna)
  let downloadMap = null;
  const mapUrl = container.dataset.downloadMap;
  if (mapUrl) {
    try {
      const res = await fetch(mapUrl, { cache: "no-store" });
      if (res.ok) downloadMap = await res.json();
    } catch {
      downloadMap = null;
    }
  }

  let columnCount = getColumnCount(container);
  buildGallery(container, images, columnCount, downloadMap);
  document.dispatchEvent(new CustomEvent("gallery:rendered", { detail: { key } }));

  // Ricostruisci solo quando cambia davvero il numero di colonne
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const next = getColumnCount(container);
      if (next === columnCount) return;
      columnCount = next;
      buildGallery(container, images, columnCount, downloadMap);
      document.dispatchEvent(new CustomEvent("gallery:rendered", { detail: { key } }));
    }, 150);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  renderGalleryFromJson();
});
