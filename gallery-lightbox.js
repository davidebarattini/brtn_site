document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll(".masonry img");
  const lightbox = document.getElementById("lightbox");
  if (!lightbox || images.length === 0) return;

  const lightboxImg = lightbox.querySelector(".lightbox-img");
  const closeBtn = lightbox.querySelector(".close");
  const prevBtn = lightbox.querySelector(".prev");
  const nextBtn = lightbox.querySelector(".next");
  if (!lightboxImg || !closeBtn || !prevBtn || !nextBtn) return;

  let currentIndex = 0;

  function showImage() {
    lightboxImg.src = images[currentIndex].src;
    lightboxImg.alt = images[currentIndex].alt;
  }

  images.forEach((img, index) => {
    img.addEventListener("click", () => {
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
    currentIndex = (currentIndex + 1) % images.length;
    showImage();
  });

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.style.display !== "flex") return;
    if (e.key === "Escape") lightbox.style.display = "none";
    if (e.key === "ArrowRight") {
      currentIndex = (currentIndex + 1) % images.length;
      showImage();
    }
    if (e.key === "ArrowLeft") {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
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
