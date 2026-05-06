import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();

const GALLERIES = [
  { key: "action", title: "Action", dir: "img/Action" },
  { key: "people", title: "People", dir: "img/People" },
  { key: "places", title: "Places", dir: "img/Places" },
  { key: "morzine", title: "Morzine", dir: "img/Morzine" },
  { key: "madesimo", title: "Madesimo", dir: "img/Madesimo" },
  { key: "quater", title: "Quater", dir: "img/Quater" },
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

function inferOrientationFromFilename(filename) {
  const base = filename.toLowerCase().replace(/\.[^.]+$/, "");
  // Convenzione semplice: *_v / *-v / *.v => portrait, *_h / *-h / *.h => landscape
  if (/(^|[_\-.])v$/.test(base)) return "portrait";
  if (/(^|[_\-.])h$/.test(base)) return "landscape";
  return "auto";
}

async function listImages(relativeDir) {
  const absDir = path.join(PROJECT_ROOT, relativeDir);
  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => IMAGE_EXTS.has(path.extname(name).toLowerCase()))
    .filter((name) => !name.startsWith(".")) // ignora .DS_Store e simili
    .sort(compareFilenamesForGallery)
    .map((name) => ({
      src: `${relativeDir}/${name}`.replaceAll("\\", "/"),
      alt: "",
      orientation: inferOrientationFromFilename(name),
    }));
}

async function main() {
  const absOutDir = path.join(PROJECT_ROOT, OUTPUT_DIR);
  await fs.mkdir(absOutDir, { recursive: true });

  for (const g of GALLERIES) {
    const images = await listImages(g.dir);
    const payload = {
      title: g.title,
      generatedAt: new Date().toISOString(),
      images,
    };

    const outPath = path.join(absOutDir, `${g.key}.json`);
    await fs.writeFile(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    process.stdout.write(`Generated ${OUTPUT_DIR}/${g.key}.json (${images.length} images)\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
