// ---------------- Home: comparsa elementi allo scroll ----------------
// Gli elementi sotto la piega partono trasparenti e leggermente spostati in
// basso, poi salgono in dissolvenza quando entrano nel viewport. Gli elementi
// che arrivano insieme (es. card della stessa riga) escono a cascata.
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const SELECTORS = [
    ".section-title",
    ".project-card",
    ".category-card",
    "#more-projects-btn",
    ".footer-top",
    ".footer-bottom",
  ].join(",");

  const DURATION = 1100; // ms
  const STAGGER = 90; // ms tra un elemento e il successivo
  const MAX_DELAY = 450; // ms

  const style = document.createElement("style");
  style.textContent = `
    .reveal {
      opacity: 0;
      transform: translate3d(0, 48px, 0);
      transition:
        opacity ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1),
        transform ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1);
      transition-delay: var(--reveal-delay, 0ms);
      will-change: opacity, transform;
    }
    .reveal.is-visible {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  `;
  document.head.appendChild(style);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort(
          (a, b) =>
            a.boundingClientRect.top - b.boundingClientRect.top ||
            a.boundingClientRect.left - b.boundingClientRect.left
        );

      visible.forEach((entry, i) => {
        const el = entry.target;
        observer.unobserve(el);

        const delay = Math.min(i * STAGGER, MAX_DELAY);
        el.style.setProperty("--reveal-delay", `${delay}ms`);
        el.classList.add("is-visible");

        // A fine animazione l'elemento torna ai suoi stili (hover, transition…)
        window.setTimeout(() => {
          el.classList.remove("reveal", "is-visible");
          el.style.removeProperty("--reveal-delay");
        }, DURATION + delay + 100);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );

  document.addEventListener("DOMContentLoaded", () => {
    const viewportH = window.innerHeight;
    document.querySelectorAll(SELECTORS).forEach((el) => {
      const rect = el.getBoundingClientRect();
      const isHidden = rect.width === 0 && rect.height === 0;
      // Già visibile al caricamento (o sopra la piega): lo lasciamo com'è,
      // così non "lampeggia". I progetti nascosti (d-none) invece si animano.
      if (!isHidden && rect.top < viewportH) return;

      el.classList.add("reveal");
      observer.observe(el);
    });
  });
})();
