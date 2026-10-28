document.addEventListener("DOMContentLoaded", function () {
  const lightbox = document.getElementById("lightbox");
  const masonries = Array.from(document.querySelectorAll(".masonry"));
  if (!lightbox || masonries.length === 0) return;

  const lightboxImg = lightbox.querySelector(".lightbox-img");
  const closeBtn = lightbox.querySelector(".close");
  const prevBtn = lightbox.querySelector(".prev");
  const nextBtn = lightbox.querySelector(".next");
  if (!lightboxImg || !closeBtn || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  let activeMasonry = masonries[0];
  let hideTimer = null;

  function isOpen() {
    return lightbox.classList.contains("is-open");
  }

  // Apertura: prima la mostra, poi al frame dopo aggiunge .is-open così parte
  // la transizione (dissolvenza + zoom dell'immagine, in lightbox.css)
  function openLightbox() {
    window.clearTimeout(hideTimer);
    lightbox.style.display = "flex";
    void lightbox.offsetWidth;
    lightbox.classList.add("is-open");
  }

  // Chiusura: toglie .is-open e la nasconde a transizione finita
  // (subito se la pagina non ha transizioni, come nei progetti)
  function closeLightbox() {
    if (!isOpen()) return;
    lightbox.classList.remove("is-open");
    const duration = parseFloat(getComputedStyle(lightbox).transitionDuration) * 1000 || 0;
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      lightbox.style.display = "none";
      lightboxImg.src = "";
    }, duration);
  }

  function getImages() {
    return Array.from(activeMasonry.querySelectorAll("img"));
  }

  function showImage() {
    const images = getImages();
    if (images.length === 0) return;
    currentIndex = (currentIndex + images.length) % images.length;
    lightboxImg.src = images[currentIndex].src;
    lightboxImg.alt = images[currentIndex].alt;
  }

  masonries.forEach((masonry) => {
    masonry.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLImageElement)) return;

      activeMasonry = masonry;

      const images = getImages();
      const index = images.indexOf(target);
      if (index < 0) return;

      currentIndex = index;
      showImage();
      openLightbox();
    });
  });

  closeBtn.addEventListener("click", closeLightbox);

  nextBtn.addEventListener("click", () => {
    currentIndex += 1;
    showImage();
  });

  prevBtn.addEventListener("click", () => {
    currentIndex -= 1;
    showImage();
  });

  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") {
      currentIndex += 1;
      showImage();
    }
    if (e.key === "ArrowLeft") {
      currentIndex -= 1;
      showImage();
    }
  });

  let touchStartX = 0;
  lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });
  lightbox.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const swipeThreshold = 50;
    if (touchStartX - touchEndX > swipeThreshold) nextBtn.click();
    else if (touchEndX - touchStartX > swipeThreshold) prevBtn.click();
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
});
