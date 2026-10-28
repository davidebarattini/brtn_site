import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const SITE_URL = "https://brtnvisuals.com";

// alt: descrizione per Google Immagini e screen reader, ogni foto riceve
// "<alt> – photo N". page: pagina che mostra la galleria (per la sitemap).
const GALLERIES = [
  {
    key: "action",
    title: "Action",
    dir: "img/Action",
    page: "action.html",
    alt: "Action sports photography by Davide Barattini (brtn.visuals)",
  },
  {
    key: "people",
    title: "People",
    dir: "img/People",
    page: "People.html",
    alt: "People and portrait photography by Davide Barattini (brtn.visuals)",
  },
  {
    key: "places",
    title: "Places",
    dir: "img/Places",
    page: "Places.html",
    alt: "Landscape, architecture and interior photography by Davide Barattini (brtn.visuals)",
  },
  {
    key: "morzine",
    title: "Morzine",
    dir: "img/Morzine",
    page: "Project1.html",
    alt: "Garpez Racing mountain biking at Avoriaz Bike Park, photographed by Davide Barattini",
  },
  {
    key: "madesimo",
    title: "Madesimo",
    dir: "img/Madesimo",
    page: "Project2.html",
    alt: "Garpez Racing mountain biking at Madesimo Bike Park, photographed by Davide Barattini",
  },
  {
    key: "studio_photography",
    title: "Studio Photography",
    dir: "img/Studio_Photography",
    page: "Project3.html",
    alt: "Studio photography in Milan by Davide Barattini",
  },
  {
    key: "trofeo",
    title: "Trofeo Villa d'Este ACI Como 2025",
    dir: "img/Trofeo_Villa_d'Este",
    page: "Project4.html",
    alt: "Classic cars at Trofeo Villa d'Este ACI Como 2025, photographed by Davide Barattini",
  },
  {
    key: "ironman_cervia",
    title: "Ironman 70.3 - Cervia",
    dir: "img/Ironman_Cervia",
    page: "Project6.html",
    alt: "Ironman 70.3 Cervia triathlon by Davide Barattini",
  },
  {
    key: "wrc_sardegna",
    title: "WRC Alghero - Sardinia",
    dir: "img/WRC_Sardegna",
    page: "Project7.html",
    alt: "WRC Rally Italia Sardegna, photographed by Davide Barattini",
  },
  { key: "quater", title: "Quater", dir: "img/Quater", alt: "Photography by Davide Barattini" },
];

// Pagine della sitemap, nell'ordine in cui compaiono
const SITEMAP_PAGES = [
  "index.html",
  "About.html",
  "action.html",
  "People.html",
  "Places.html",
  "Project1.html",
  "Project2.html",
  "Project3.html",
  "Project4.html",
  "Project6.html",
  "Project7.html",
  "privacy.html",
  "cookie.html",
];

const OUTPUT_DIR = "galleries";
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function getNumericPrefix(filename) {
  // Match prefissi tipo "01_", "1-", "002." ecc.
  const m = filename.match(/^(\d{1,6})(?=[_.\-\s])/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function compareFilenamesForGallery(a, b) {
  const na = getNumericPrefix(a);
  const nb = getNumericPrefix(b);

  if (na !== null && nb !== null && na !== nb) return na - nb;
  if (na !== null && nb === null) return -1;
  if (na === null && nb !== null) return 1;

  return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
}

/** La copertina del progetto sta nella stessa cartella ma non fa parte della galleria. */
function isCover(filename) {
  return /^copertina\b/i.test(path.basename(filename, path.extname(filename)));
}

/** Dimensioni reali da JPEG (marker SOF) e PNG (IHDR). Niente dipendenze esterne. */
function readImageSize(buf) {
  // PNG: firma + IHDR con width/height a offset 16 e 20
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: scorre i segmenti fino al SOF, che contiene altezza e larghezza
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      // SOF0-SOF3, SOF5-SOF7, SOF9-SOF11, SOF13-SOF15: tutti portano le dimensioni
      const isSOF =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isSOF) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }

  return null;
}

async function getOrientation(absPath) {
  try {
    // Il SOF può stare ben oltre i primi KB (EXIF e profili colore sono grossi),
    // quindi si legge tutto il file: gira solo in fase di build.
    const buf = await fs.readFile(absPath);
    const size = readImageSize(buf);
    if (!size || !size.width || !size.height) return "auto";
    return size.width >= size.height ? "landscape" : "portrait";
  } catch {
    return "auto"; // il browser lo capisce dopo il load
  }
}

async function listImages(relativeDir, altText) {
  const absDir = path.join(PROJECT_ROOT, relativeDir);
  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const names = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => IMAGE_EXTS.has(path.extname(name).toLowerCase()))
    .filter((name) => !name.startsWith(".")) // ignora .DS_Store e simili
    .filter((name) => !isCover(name)) // la copertina non va in galleria
    .sort(compareFilenamesForGallery);

  return Promise.all(
    names.map(async (name, i) => ({
      src: `${relativeDir}/${name}`.replaceAll("\\", "/"),
      alt: `${altText} – photo ${i + 1}`,
      orientation: await getOrientation(path.join(absDir, name)),
    }))
  );
}

/** URL assoluto di un file del sito (l'apostrofo di Trofeo_Villa_d'Este va codificato). */
function siteUrl(relativePath) {
  return `${SITE_URL}/${encodeURI(relativePath).replaceAll("'", "%27")}`;
}

function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * Data dell'ultimo commit che ha toccato questi percorsi (AAAA-MM-GG), per il
 * <lastmod> della sitemap. Nella GitHub Action serve il checkout con tutta la
 * storia (fetch-depth: 0); se git non c'è, la data viene semplicemente omessa.
 */
function lastCommitDate(paths) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...paths], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

/** Sitemap con le date reali di modifica e le foto delle gallerie (Google Immagini). */
async function writeSitemap(imagesByPage) {
  const entries = SITEMAP_PAGES.map((page) => {
    const gallery = GALLERIES.find((g) => g.page === page);
    const loc = page === "index.html" ? `${SITE_URL}/` : siteUrl(page);
    const lastmod = lastCommitDate(gallery ? [page, gallery.dir] : [page]);
    const images = imagesByPage.get(page) || [];

    const lines = ["  <url>", `    <loc>${escapeXml(loc)}</loc>`];
    if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
    images.forEach((img) => {
      lines.push(
        "    <image:image>",
        `      <image:loc>${escapeXml(siteUrl(img.src))}</image:loc>`,
        "    </image:image>"
      );
    });
    lines.push("  </url>");
    return lines.join("\n");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");

  await fs.writeFile(path.join(PROJECT_ROOT, "sitemap.xml"), xml, "utf8");
  process.stdout.write(`Generated sitemap.xml (${entries.length} pages)\n`);
}

async function main() {
  const absOutDir = path.join(PROJECT_ROOT, OUTPUT_DIR);
  await fs.mkdir(absOutDir, { recursive: true });

  const imagesByPage = new Map();

  for (const g of GALLERIES) {
    const images = await listImages(g.dir, g.alt);
    const payload = {
      title: g.title,
      generatedAt: new Date().toISOString(),
      images,
    };

    const outPath = path.join(absOutDir, `${g.key}.json`);
    await fs.writeFile(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    process.stdout.write(`Generated ${OUTPUT_DIR}/${g.key}.json (${images.length} images)\n`);

    if (g.page) imagesByPage.set(g.page, images);
  }

  await writeSitemap(imagesByPage);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
