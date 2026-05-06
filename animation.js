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
  ];

  let currentIndex = 0;

  function createHeroImageDiv(src) {
    const div = document.createElement("div");
    div.classList.add("hero-slide-layer");
    div.style.cssText =
      "background-size:cover;background-position:center;position:absolute;top:0;left:0;width:100%;height:100%;transition:opacity 1s ease;opacity:0;transform:translate3d(0,0,0) scale(1)";
    div.style.backgroundImage = `url(${src})`;
    return div;
  }

  const heroDivs = images.map((src, index) => {
    const div = createHeroImageDiv(src);
    div.classList.add(`hero-img-${index}`);
    heroImagesContainer.appendChild(div);
    return div;
  });

  heroDivs[currentIndex].style.opacity = "1";

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

    sliderIntervalId = window.setInterval(() => {
      const prevIndex = currentIndex;
      currentIndex = (currentIndex + 1) % images.length;

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
  window.addEventListener("load", () => {
    const splash = document.getElementById("splash-screen");
    const loadingBar = document.querySelector(".loading-bar");

    if (!splash) {
      startImageSlider();
      return;
    }

    if (sessionStorage.getItem("splashShown")) {
      splash.style.display = "none";
      startImageSlider();
      return;
    }

    splash.style.display = "flex";

    const domImages = Array.from(document.querySelectorAll("img"));
    const allImageUrls = [
      ...domImages.map((img) => img.src),
      ...images.map((url) => new URL(url, window.location.href).href),
    ];

    const totalImages = allImageUrls.length;
    let loadedImages = 0;

    function hideSplash() {
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.remove();
        sessionStorage.setItem("splashShown", "true");
        startImageSlider();
      }, 500);
    }

    if (totalImages === 0) {
      hideSplash();
      return;
    }

    function imageLoaded() {
      loadedImages++;
      const progress = (loadedImages / totalImages) * 100;
      if (loadingBar) {
        loadingBar.style.width = `${progress}%`;
      }
      if (loadedImages === totalImages) {
        setTimeout(hideSplash, 300);
      }
    }

    allImageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = imageLoaded;
      img.onerror = imageLoaded;
    });
  });
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
