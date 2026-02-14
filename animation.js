// ---------------- Gestione Scroll Unificata (Navbar + Dropdown + Freccia) ----------------
const navbar = document.querySelector(".custom-navbar");
const scrollIndicator = document.querySelector(".scroll-indicator");

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;

  // Navbar background
  if (scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }

  // Scroll indicator (nascondi freccia)
  if (scrollIndicator) {
    scrollIndicator.style.opacity = scrollY > 100 ? "0" : "1";
    scrollIndicator.style.pointerEvents = scrollY > 100 ? "none" : "auto";
  }
});

// ---------------- Dropdown Portfolio Desktop ----------------
const portfolioDropdown = document.querySelector('.nav-item.dropdown');
const dropdownMenu = portfolioDropdown.querySelector('.dropdown-menu');
const portfolioLink = portfolioDropdown.querySelector('#portfolioDropdown');

// Blocca click solo sul link principale Portfolio
portfolioLink.addEventListener('click', (e) => {
  e.preventDefault(); // impedisce il click sul link principale
});

// Funzioni mostra/nascondi dropdown
function showDropdown() {
  dropdownMenu.style.display = 'block';
  dropdownMenu.style.opacity = '1';
  dropdownMenu.style.visibility = 'visible';
}

function hideDropdown() {
  dropdownMenu.style.display = 'none';
  dropdownMenu.style.opacity = '0';
  dropdownMenu.style.visibility = 'hidden';
}

// Mantieni dropdown visibile quando hover sul li o sul menu
let hoverTimeout;

portfolioDropdown.addEventListener('mouseenter', () => {
  clearTimeout(hoverTimeout);
  showDropdown();
});

portfolioDropdown.addEventListener('mouseleave', () => {
  hoverTimeout = setTimeout(() => {
    hideDropdown();
  }, 150); // piccola tolleranza per passaggio mouse
});

// ---------------- Pulsante More Projects ----------------
const moreBtn = document.getElementById("more-projects-btn");

// Evento click sul pulsante
moreBtn.addEventListener("click", function () {
  const hiddenProjects = document.querySelectorAll(".hidden-project");
  
  if (moreBtn.textContent === "Show Less") {
    // Nascondi i progetti
    hiddenProjects.forEach(project => project.classList.add("d-none"));
    moreBtn.textContent = "More Projects";
    
    // Torna all'inizio della sezione progetti per non perdere il focus
    document.querySelector(".projects-section").scrollIntoView({ behavior: "smooth" });
  } else {
    // Mostra i progetti
    hiddenProjects.forEach(project => project.classList.remove("d-none"));
    moreBtn.textContent = "Show Less";
    
    // Scroll fluido verso il primo progetto sbloccato
    if (hiddenProjects.length > 0) {
      hiddenProjects[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
});


// ---------------- Hero Image: Zoom lento e cambio immagine ----------------
const hero = document.querySelector('.hero-image');

// Contenitore per le immagini
const heroImagesContainer = document.createElement('div');
heroImagesContainer.style.position = 'absolute';
heroImagesContainer.style.top = '0';
heroImagesContainer.style.left = '0';
heroImagesContainer.style.width = '100%';
heroImagesContainer.style.height = '100%';
heroImagesContainer.style.overflow = 'hidden';
heroImagesContainer.style.zIndex = '0'; // sotto titolo e pulsanti
hero.appendChild(heroImagesContainer);

// Lista immagini
const images = [
  'img/Hero_image/hero_image_low.jpg',
  'img/Hero_image/hero_image8_low.jpg',
  'img/Hero_image/hero_image2_low.jpg',
  'img/Hero_image/hero_image3_low.jpg',
  'img/Hero_image/hero_image10_low.jpg',
  'img/Hero_image/hero_image11_low.jpg',
  'img/Hero_image/hero_image6_low.jpg'
];

let currentIndex = 0;

// Crea div immagine
function createHeroImageDiv(src) {
  const div = document.createElement('div');
  div.style.backgroundImage = `url(${src})`;
  div.style.backgroundSize = 'cover';
  div.style.backgroundPosition = 'center';
  div.style.position = 'absolute';
  div.style.top = '0';
  div.style.left = '0';
  div.style.width = '100%';
  div.style.height = '100%';
  div.style.transition = 'opacity 1s ease';
  div.style.opacity = '0';
  div.style.transform = 'scale(1)';
  return div;
}

// Inizializza immagini
const heroDivs = images.map((src, index) => {
  const div = createHeroImageDiv(src);
  div.classList.add(`hero-img-${index}`); // aggiunge classe unica
  heroImagesContainer.appendChild(div);
  return div;
});


// Mostra prima immagine
heroDivs[currentIndex].style.opacity = '1';

// Zoom continuo
let scale = 1;
const zoomSpeed = 0.00015;

function animateZoom() {
  scale += zoomSpeed;
  heroDivs[currentIndex].style.transform = `scale(${scale})`;
  requestAnimationFrame(animateZoom);
}

animateZoom();

// Cambio immagine ogni 7 secondi
setInterval(() => {
  const prevIndex = currentIndex;
  currentIndex = (currentIndex + 1) % images.length;

  scale = 1;
  heroDivs[currentIndex].style.transform = 'scale(1)';
  heroDivs[currentIndex].style.opacity = '1';
  heroDivs[currentIndex].style.transform = `scale(${scale})`;

  heroDivs[prevIndex].style.opacity = '0';
}, 4000);


// ---------------- Splash screen ----------------
window.addEventListener('load', () => {
  const splash = document.getElementById('splash-screen');
  const loadingBar = document.querySelector('.loading-bar');

  if (sessionStorage.getItem('splashShown')) {
    splash.style.display = 'none';
    return;
  }

  splash.style.display = 'flex';

  // Tutte le immagini nel DOM
  const domImages = Array.from(document.querySelectorAll('img'));
  // Immagini dell'hero section definite in questo file
  const heroBackgroundImages = images; 

  const allImageUrls = [
    ...domImages.map(img => img.src),
    ...heroBackgroundImages.map(url => new URL(url, window.location.href).href)
  ];

  const totalImages = allImageUrls.length;
  let loadedImages = 0;

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
      // Breve attesa per mostrare il 100% prima di scomparire
      setTimeout(hideSplash, 300);
    }
  }

  function hideSplash() {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.remove();
      sessionStorage.setItem('splashShown', 'true');
    }, 500);
  }

  allImageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
    img.onload = imageLoaded;
    img.onerror = imageLoaded; // Conta anche le immagini non riuscite per non bloccare il caricamento
  });
});



// ---------------- Hamburger Mobile ----------------
const toggler = document.querySelector('.custom-toggler');
const mobileMenu = document.querySelector('.mobile-menu');
const closeBtn = document.querySelector('.mobile-menu .close-menu');

// Apri/chiudi menu
toggler.addEventListener('click', () => {
  mobileMenu.classList.toggle('active');
  toggler.classList.toggle('active');
});

// Chiudi menu cliccando sulla X
closeBtn.addEventListener('click', () => {
  mobileMenu.classList.remove('active');
  toggler.classList.remove('active');
});

// Chiudi menu cliccando su un link
document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    toggler.classList.remove('active');
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const scrollIndicator = document.querySelector(".scroll-indicator");
  const targetSection = document.querySelector("#about"); // sezione di destinazione

  // click sulla freccia -> scroll fluido
  scrollIndicator.addEventListener("click", () => {
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  });
});
