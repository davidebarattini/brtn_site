// Navbar / menu / scroll indicator: site-nav.js

// ---------------- Pulsante More Projects ----------------
const moreBtn = document.getElementById("more-projects-btn");
if (moreBtn) {
  moreBtn.addEventListener("click", function () {
    const hiddenProjects = document.querySelectorAll(".hidden-project");

    if (moreBtn.textContent === "Show Less") {
      hiddenProjects.forEach((project) => project.classList.add("d-none"));
      moreBtn.textContent = "More Projects";

      const projectsSection = document.querySelector(".projects-section");
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      hiddenProjects.forEach((project) => project.classList.remove("d-none"));
      moreBtn.textContent = "Show Less";

      if (hiddenProjects.length > 0) {
        hiddenProjects[0].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  });
}

// ---------------- Hero Image: Zoom lento e cambio immagine ----------------
const hero = document.querySelector(".hero-image");
let sliderIntervalId = null;
let zoomRafId = null;
let heroSliderStopped = false;

if (hero) {
  const heroImagesContainer = document.createElement("div");
  heroImagesContainer.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;z-index:0";
  hero.appendChild(heroImagesContainer);

  const images = [
    "img/Hero_image/hero_image_low.jpg",
    "img/Hero_image/hero_image8_low.jpg",
    "img/Hero_image/hero_image2_low.jpg",
    "img/Hero_image/hero_image3_low.jpg",
    "img/Hero_image/hero_image10_low.jpg",
    "img/Hero_image/hero_image11_low.jpg",
    "img/Hero_image/hero_image6_low.jpg",
    "img/Hero_image/DSC03793.jpg",
  ];

  let currentIndex = 0;

  // Lo sfondo non viene messo subito: ogni slide si scarica solo quando serve
  // (vedi loadSlide), così la home non scarica tutte le foto dell'hero insieme
  function createHeroImageDiv() {
    const div = document.createElement("div");
    div.classList.add("hero-slide-layer");
    div.style.cssText =
      "background-size:cover;background-position:center;position:absolute;top:0;left:0;width:100%;height:100%;transition:opacity 1s ease;opacity:0;transform:translate3d(0,0,0) scale(1)";
    return div;
  }

  const heroDivs = images.map((src, index) => {
    const div = createHeroImageDiv();
    div.classList.add(`hero-img-${index}`);
    heroImagesContainer.appendChild(div);
    return div;
  });

  // Scarica la foto della slide e la mette come sfondo solo a download finito
  // (niente immagini a metà). Una sola richiesta per slide.
  const slideLoads = [];
  const slideReady = images.map(() => false);
  function loadSlide(index) {
    if (!slideLoads[index]) {
      slideLoads[index] = new Promise((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          heroDivs[index].style.backgroundImage = `url(${images[index]})`;
          slideReady[index] = true;
          resolve();
        };
        img.src = images[index];
      });
    }
    return slideLoads[index];
  }

  heroDivs[currentIndex].style.opacity = "1";
  const firstSlideLoaded = loadSlide(currentIndex);

  function startImageSlider() {
    let scale = 1;
    /** Incremento scala per ms (~equiv. a +0.00015/frame a 60 Hz): fluido su 60/120 Hz */
    const zoomSpeedPerMs = 0.000009;
    let lastTs = null;

    function animateZoom(ts) {
      if (heroSliderStopped) return;
      let dt = 0;
      if (lastTs !== null) {
        dt = Math.min(ts - lastTs, 34);
      }
      lastTs = ts;

      const active = heroDivs[currentIndex];
      if (active && dt > 0) {
        scale += zoomSpeedPerMs * dt;
        active.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
      }
      zoomRafId = requestAnimationFrame(animateZoom);
    }

    requestAnimationFrame(animateZoom);

    // La prossima slide si scarica mentre si guarda quella attuale
    loadSlide((currentIndex + 1) % images.length);

    sliderIntervalId = window.setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      // Connessione lenta: se la prossima foto non è pronta resta quella attuale
      if (!slideReady[nextIndex]) return;

      const prevIndex = currentIndex;
      currentIndex = nextIndex;
      loadSlide((currentIndex + 1) % images.length);

      scale = 1;
      heroDivs[currentIndex].style.opacity = "1";
      heroDivs[currentIndex].style.transform = "translate3d(0, 0, 0) scale(1)";

      heroDivs[prevIndex].style.opacity = "0";
    }, 4000);
  }

  window.addEventListener("pagehide", () => {
    heroSliderStopped = true;
    if (sliderIntervalId !== null) clearInterval(sliderIntervalId);
    if (zoomRafId !== null) cancelAnimationFrame(zoomRafId);
  });

  // ---------------- Splash screen ----------------
  // Parte subito (lo script è in fondo al body, il DOM è pronto) e si chiude
  // appena è pronta la prima foto dell'hero: non aspetta più tutte le immagini
  // della pagina. Su connessioni lente si chiude comunque dopo SPLASH_MAX_MS.
  const SPLASH_MAX_MS = 2500;

  (function runSplash() {
    const splash = document.getElementById("splash-screen");

    if (!splash) {
      startImageSlider();
      return;
    }

    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem("splashShown") === "true";
    } catch {
      alreadyShown = false;
    }

    if (alreadyShown) {
      splash.style.display = "none";
      startImageSlider();
      return;
    }

    splash.style.display = "flex";

    let hidden = false;
    function hideSplash() {
      if (hidden) return;
      hidden = true;
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.remove();
        try {
          sessionStorage.setItem("splashShown", "true");
        } catch {
          // Navigazione privata: lo splash ricomparirà, nessun problema
        }
        startImageSlider();
      }, 650);
    }

    firstSlideLoaded.then(() => setTimeout(hideSplash, 300));
    setTimeout(hideSplash, SPLASH_MAX_MS);
  })();
}

document.addEventListener("DOMContentLoaded", () => {
  const scrollIndicator = document.querySelector(".scroll-indicator");
  const targetSection =
    document.querySelector(".projects-section") || document.querySelector("#about");

  if (scrollIndicator && targetSection) {
    scrollIndicator.addEventListener("click", () => {
      targetSection.scrollIntoView({ behavior: "smooth" });
    });
  }
});
