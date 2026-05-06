function parsePattern(patternRaw) {
  const raw = (patternRaw || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function loadGallery(key) {
  const res = await fetch(`galleries/${encodeURIComponent(key)}.json`, { cache: "no-store" });
  if (!res.ok) return null;
  return await res.json();
}

function renderImagesInto(container, images, { offset, limit, pattern, baseClass }) {
  const start = Math.max(0, offset);
  const end = limit > 0 ? start + limit : images.length;
  const slice = images.slice(start, end);

  container.innerHTML = "";

  slice.forEach((item, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "gallery-item";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = item.src;
    img.alt = item.alt || "";

    const classes = [];
    if (baseClass) classes.push(baseClass);

    if (pattern.length > 0) {
      const cls = pattern[i % pattern.length];
      if (cls) classes.push(cls);
    }

    img.className = classes.join(" ").trim();

    // Placeholder iniziale: se la classe indica "large" → portrait (2:3),
    // se indica "small" → landscape (3:2). Poi correggiamo SEMPRE dopo il load
    // usando le dimensioni reali (naturalWidth/naturalHeight).
    const c = ` ${img.className} `;
    let o = "auto";
    if (c.includes(" img-large ") || c.includes(" img-large1 ")) o = "portrait";
    else if (c.includes(" img-small ") || c.includes(" img-small1 ")) o = "landscape";

    wrapper.dataset.orientation = o;

    img.addEventListener(
      "load",
      () => {
        const orientation = img.naturalWidth >= img.naturalHeight ? "landscape" : "portrait";
        wrapper.dataset.orientation = orientation;
      },
      { once: true }
    );

    wrapper.appendChild(img);
    container.appendChild(wrapper);
  });
}

async function renderProjectGalleries() {
  const containers = Array.from(document.querySelectorAll("[data-project-gallery]"));
  if (containers.length === 0) return;

  const byKey = new Map();

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

    const offset = Number.parseInt(el.getAttribute("data-offset") || "0", 10) || 0;
    const limit = Number.parseInt(el.getAttribute("data-limit") || "0", 10) || 0;
    const pattern = parsePattern(el.getAttribute("data-pattern"));
    const baseClass = el.getAttribute("data-base-class") || "";

    renderImagesInto(el, images, { offset, limit, pattern, baseClass });
  }

  document.dispatchEvent(new CustomEvent("gallery:rendered", { detail: { type: "project" } }));
}

window.addEventListener("DOMContentLoaded", () => {
  renderProjectGalleries();
});

