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
      lightbox.style.display = "flex";
    });
  });

  closeBtn.addEventListener("click", () => {
    lightbox.style.display = "none";
    lightboxImg.src = "";
  });

  nextBtn.addEventListener("click", () => {
    currentIndex += 1;
    showImage();
  });

  prevBtn.addEventListener("click", () => {
    currentIndex -= 1;
    showImage();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.style.display !== "flex") return;
    if (e.key === "Escape") lightbox.style.display = "none";
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
    if (e.target === lightbox) lightbox.style.display = "none";
  });
});
