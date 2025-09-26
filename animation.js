// ---------------- Navbar che cambia colore quando si scrolla ----------------
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".custom-navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
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
  dropdownMenu.style.backdropFilter = 'blur(6px)';
  dropdownMenu.style.webkitBackdropFilter = 'blur(6px)'; //safari
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

// Imposta margine del dropdown (16px dalla navbar)
dropdownMenu.style.marginTop = '16px';

// Aggiorna colore dropdown in base allo scroll
const dropdownMenus = document.querySelectorAll('.dropdown-menu');
const navbar = document.querySelector('.custom-navbar');

function updateDropdownBackground() {
  dropdownMenus.forEach(menu => {
    if(navbar.classList.contains('scrolled')) {
      menu.style.backgroundColor = 'rgba(0,0,0,0.8)'; // navbar scura
    } else {
      menu.style.backgroundColor = 'rgba(0,0,0,0.4)'; // navbar trasparente
    }
  });
}

// Chiama la funzione all'inizio
updateDropdownBackground();

// Aggiorna al scroll
window.addEventListener('scroll', () => {
  updateDropdownBackground();
});


// ---------------- Pulsante More Projects ----------------
const moreBtn = document.getElementById("more-projects-btn");
const projectsRow = document.querySelector(".projects-section .row");

// Dati del nuovo progetto
const newProjectData = {
  img: "img/project5.png",
  title: "Nuovo Progetto - Example",
  desc: "Questa è la descrizione del nuovo progetto che appare cliccando More Projects."
};

// Funzione per creare una card progetto
function createProjectCard(data) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6";

  const card = document.createElement("div");
  card.className = "project-card";

  const img = document.createElement("img");
  img.src = data.img;
  img.alt = data.title;
  img.className = "img-fluid rounded-2";
  img.style.height = "387px";
  img.style.objectFit = "cover";

  const title = document.createElement("h3");
  title.className = "project-title mt-3";
  title.textContent = data.title;

  const desc = document.createElement("p");
  desc.className = "project-desc";
  desc.textContent = data.desc;

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(desc);
  col.appendChild(card);

  return col;
}

// Evento click sul pulsante
moreBtn.addEventListener("click", function () {
  const newCard = createProjectCard(newProjectData);
  projectsRow.appendChild(newCard);
  newCard.scrollIntoView({ behavior: "smooth" });
  moreBtn.disabled = true;
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
  'img/hero_image_low.jpg',
  'img/hero_image2_low.jpg',
  'img/hero_image3_low.jpg',
  'img/hero_image4_low.jpg',
  'img/hero_image6_low.jpg'
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
const zoomSpeed = 0.00010;

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
}, 7000);


// ---------------- Splash screen ----------------
window.addEventListener('load', () => {
  const splash = document.getElementById('splash-screen');

  // Controlla se lo splash è già stato visto in questa sessione
  if (!sessionStorage.getItem('splashShown')) {
    // Mostra splash
    splash.style.display = 'flex';

    setTimeout(() => {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.remove();
      }, 500);
    }, 1000);

    // Segna come visto
    sessionStorage.setItem('splashShown', 'true');
  } else {
    // Nascondi subito senza animazione
    splash.style.display = 'none';
  }
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

  // nasconde la freccia dopo scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      scrollIndicator.style.opacity = "0";
      scrollIndicator.style.pointerEvents = "none";
    } else {
      scrollIndicator.style.opacity = "1";
      scrollIndicator.style.pointerEvents = "auto";
    }
  });
});






