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

  // Due colonne reali: ordine per riga (sx, dx, sx, dx...)
  const columns = document.createElement("div");
  columns.className = "gallery-columns";
  const colLeft = document.createElement("div");
  colLeft.className = "gallery-col";
  const colRight = document.createElement("div");
  colRight.className = "gallery-col";
  columns.appendChild(colLeft);
  columns.appendChild(colRight);
  container.appendChild(columns);

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
    const targetCol = idx % 2 === 0 ? colLeft : colRight;
    targetCol.appendChild(wrapper);
  });

  document.dispatchEvent(new CustomEvent("gallery:rendered", { detail: { key } }));
}

window.addEventListener("DOMContentLoaded", () => {
  renderGalleryFromJson();
});

