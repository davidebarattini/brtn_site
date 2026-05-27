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
  container.innerHTML = "";

  // Due colonne reali con bilanciamento dinamico in base all'altezza
  const columns = document.createElement("div");
  columns.className = "gallery-columns";
  const colLeft = document.createElement("div");
  colLeft.className = "gallery-col";
  const colRight = document.createElement("div");
  colRight.className = "gallery-col";
  columns.appendChild(colLeft);
  columns.appendChild(colRight);
  container.appendChild(columns);

  // Altezza relativa per unità di larghezza colonna (deve combaciare con i ratio in CSS):
  // landscape 3:2 → 2/3, portrait 2:3 → 3/2, auto 4:5 → 5/4
  const HEIGHT_RATIO = {
    landscape: 2 / 3,
    portrait: 3 / 2,
    auto: 5 / 4,
  };

  const cols = [colLeft, colRight];
  const colHeights = [0, 0];

  images.forEach((item, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "gallery-item";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = item.src;
    img.alt = item.alt || "";
    img.className = "rounded-2";
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

    // Masonry: scegli la colonna attualmente più corta (tie → sinistra)
    const targetIdx = colHeights[0] <= colHeights[1] ? 0 : 1;
    cols[targetIdx].appendChild(wrapper);
    colHeights[targetIdx] += HEIGHT_RATIO[orientation] ?? HEIGHT_RATIO.auto;
  });

  document.dispatchEvent(new CustomEvent("gallery:rendered", { detail: { key } }));
}

window.addEventListener("DOMContentLoaded", () => {
  renderGalleryFromJson();
});

