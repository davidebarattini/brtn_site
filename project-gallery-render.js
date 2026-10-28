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

// Ordine per la colonna singola su mobile: foto mescolate, verticali e
// orizzontali alternate il più possibile. Il formato più numeroso viene diviso
// in gruppi il più uniformi possibile, separati da una foto dell'altro formato:
// se le verticali non sono di più non ne finiscono mai due di seguito,
// altrimenti i doppioni sono il meno possibile e sparsi lungo la pagina.
function mixForMobile(images, seedText) {
  const random = seededRandom(seedText);
  const portraits = shuffle(images.filter((img) => img.orientation === "portrait"), random);
  const others = shuffle(images.filter((img) => img.orientation !== "portrait"), random);

  const [many, few] =
    portraits.length > others.length ? [portraits, others] : [others, portraits];
  if (few.length === 0) return many;

  // Gruppi: prima, tra e dopo le foto del formato meno numeroso
  const groupCount = few.length + 1;
  const sizes = new Array(groupCount).fill(Math.floor(many.length / groupCount));
  const extra = many.length % groupCount;
  // Con formati in pari numero un gruppo resta vuoto: solo a un estremo,
  // altrimenti due foto uguali finirebbero vicine
  const candidates =
    sizes[0] === 0
      ? shuffle([0, groupCount - 1], random).slice(0, 1)
      : shuffle(Array.from({ length: groupCount }, (_, i) => i), random).slice(0, extra);
  if (sizes[0] === 0) {
    sizes.fill(1);
    sizes[candidates[0]] = 0;
  } else {
    candidates.forEach((i) => {
      sizes[i] += 1;
    });
  }

  const out = [];
  let m = 0;
  sizes.forEach((size, i) => {
    out.push(...many.slice(m, m + size));
    m += size;
    if (i < few.length) out.push(few[i]);
  });
  return out;
}

// Come mixForMobile ma senza mescolare (attivo con data-mobile-keep-order):
// si segue l'ordine di desktop e una foto viene anticipata solo quando serve
// all'alternanza. Stessi limiti: verticali di seguito al massimo quante ne
// impone il loro numero, orizzontali al massimo due di seguito (o di più solo
// se sono molte più delle verticali).
function alternateKeepingOrder(images) {
  const isPortrait = (img) => img.orientation === "portrait";
  const portraits = images.filter(isPortrait);
  const others = images.filter((img) => !isPortrait(img));
  const P = portraits.length;
  const L = others.length;
  if (P === 0 || L === 0) return images;

  const maxPortraitRun = Math.max(1, Math.ceil(P / (L + 1)));
  const maxOtherRun = Math.max(2, Math.ceil(L / (P + 1)));
  const maxPortraitPairs = Math.max(0, P - (L + 1));
  const position = new Map(images.map((img, i) => [img, i]));

  // Ricerca in profondità: a ogni passo prova prima la foto che su desktop
  // viene prima; la prima sequenza valida trovata è la più vicina a desktop
  const failed = new Set();
  const out = [];
  const place = (pi, li, lastPortrait, run, pairs) => {
    if (pi === P && li === L) return true;
    const key = `${pi},${li},${lastPortrait},${run},${pairs}`;
    if (failed.has(key)) return false;

    const options = [];
    if (pi < P) options.push(true);
    if (li < L) options.push(false);
    options.sort(
      (a, b) =>
        position.get(a ? portraits[pi] : others[li]) - position.get(b ? portraits[pi] : others[li])
    );

    for (const portrait of options) {
      const sameAsLast = out.length > 0 && portrait === lastPortrait;
      const nextRun = sameAsLast ? run + 1 : 1;
      const nextPairs = pairs + (portrait && sameAsLast ? 1 : 0);
      if (portrait && (nextRun > maxPortraitRun || nextPairs > maxPortraitPairs)) continue;
      if (!portrait && nextRun > maxOtherRun) continue;

      out.push(portrait ? portraits[pi] : others[li]);
      if (place(pi + (portrait ? 1 : 0), li + (portrait ? 0 : 1), portrait, nextRun, nextPairs)) {
        return true;
      }
      out.pop();
    }

    failed.add(key);
    return false;
  };

  return place(0, 0, false, 0, 0) ? out : images;
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
