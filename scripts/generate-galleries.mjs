import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();

const GALLERIES = [
  { key: "action", title: "Action", dir: "img/Action" },
  { key: "people", title: "People", dir: "img/People" },
  { key: "places", title: "Places", dir: "img/Places" },
  { key: "morzine", title: "Morzine", dir: "img/Morzine" },
  { key: "madesimo", title: "Madesimo", dir: "img/Madesimo" },
  { key: "ironman_cervia", title: "Ironman 70.3 - Cervia", dir: "img/Ironman_Cervia" },
  { key: "wrc_sardegna", title: "WRC Alghero - Sardinia", dir: "img/WRC_Sardegna" },
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

async function listImages(relativeDir) {
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
    names.map(async (name) => ({
      src: `${relativeDir}/${name}`.replaceAll("\\", "/"),
      alt: "",
      orientation: await getOrientation(path.join(absDir, name)),
    }))
  );
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
