import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();

const GALLERIES = [
  { key: "action", dir: "img/Action" },
  { key: "people", dir: "img/People" },
  { key: "places", dir: "img/Places" },
  { key: "morzine", dir: "img/Morzine" },
  { key: "madesimo", dir: "img/Madesimo" },
  { key: "quater", dir: "img/Quater" },
];

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function stripLeadingNumericPrefix(filename) {
  // Rimuove prefissi tipo "01_", "1-", "002 " ecc. per evitare "01_02_nome.jpg"
  return filename.replace(/^\d{1,6}([_.\-\s]+)/, "");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function compareFilenamesForCurrentOrder(a, b) {
  // Ordine "naturale" che spesso corrisponde a quello attuale in pagina:
  // numerico-aware + case-insensitive.
  return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
}

const PREFERRED_ORDER_BY_KEY = {
  // Project1 (Morzine): prima le 4 immagini del blocco sopra, poi le restanti.
  morzine: ["Action1", "Action7", "Action3", "Action4", "Action2", "Action9"],
  // Project2 (Madesimo): prima md_7..md_10 (blocco sopra), poi md_1..md_6 (masonry),
  // e alla fine eventuali extra.
  madesimo: ["md_7", "md_8", "md_9", "md_10", "md_1", "md_2", "md_3", "md_4", "md_5", "md_6"],
};

function getBaseNoExt(filename) {
  return path.basename(filename, path.extname(filename));
}

function orderFiles(files, galleryKey) {
  const preferred = PREFERRED_ORDER_BY_KEY[galleryKey];
  if (!preferred) return files;

  const cleanToOriginal = new Map();
  for (const f of files) {
    const ext = path.extname(f);
    const cleaned = stripLeadingNumericPrefix(path.basename(f, ext));
    cleanToOriginal.set(cleaned, f);
  }

  const ordered = [];
  for (const base of preferred) {
    const found = cleanToOriginal.get(base);
    if (found) ordered.push(found);
  }

  const preferredSet = new Set(ordered);
  const rest = files.filter((f) => !preferredSet.has(f));
  return [...ordered, ...rest];
}

async function listImages(relativeDir) {
  const absDir = path.join(PROJECT_ROOT, relativeDir);
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => IMAGE_EXTS.has(path.extname(name).toLowerCase()))
    .filter((name) => !name.startsWith("."))
    .sort(compareFilenamesForCurrentOrder);
}

async function renameInDir(relativeDir, galleryKey) {
  const absDir = path.join(PROJECT_ROOT, relativeDir);
  const filesUnordered = await listImages(relativeDir);
  const files = orderFiles(filesUnordered, galleryKey);
  if (files.length === 0) return { renamed: 0 };

  const width = Math.max(2, String(files.length).length);
  const pad = (n) => String(n).padStart(width, "0");

  // Passo 1: rinomina tutto in nomi temporanei univoci (evita collisioni)
  const tempMap = new Map(); // original -> temp
  for (const name of files) {
    const ext = path.extname(name);
    const base = path.basename(name, ext);
    const tempName = `__tmp__${Date.now()}__${base}${ext}`;
    await fs.rename(path.join(absDir, name), path.join(absDir, tempName));
    tempMap.set(name, tempName);
  }

  // Passo 2: rinomina in modo definitivo con prefisso numerico
  let i = 1;
  for (const originalName of files) {
    const tempName = tempMap.get(originalName);
    const ext = path.extname(originalName);
    const cleaned = stripLeadingNumericPrefix(path.basename(originalName, ext));
    const finalName = `${pad(i)}_${cleaned}${ext}`;
    await fs.rename(path.join(absDir, tempName), path.join(absDir, finalName));
    i += 1;
  }

  return { renamed: files.length };
}

async function main() {
  for (const g of GALLERIES) {
    const { renamed } = await renameInDir(g.dir, g.key);
    process.stdout.write(`Renamed ${renamed} images in ${g.dir}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

