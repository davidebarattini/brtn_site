// Ordine delle foto per la colonna singola su mobile, condiviso da
// project-gallery-render.js (progetti) e gallery-render.js (Action/People/Places).
// Va caricato prima di quegli script.

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
