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








document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll(".masonry img");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.querySelector(".lightbox-img");
  const closeBtn = document.querySelector(".lightbox .close");
  const prevBtn = document.querySelector(".lightbox .prev");
  const nextBtn = document.querySelector(".lightbox .next");

  let currentIndex = 0;

  // Apri lightbox
  images.forEach((img, index) => {
    img.addEventListener("click", () => {
      currentIndex = index;
      showImage();
      lightbox.style.display = "flex";
    });
  });

  // Mostra immagine attuale
  function showImage() {
    lightboxImg.src = images[currentIndex].src;
    lightboxImg.alt = images[currentIndex].alt;
  }

  // Chiudi lightbox
  closeBtn.addEventListener("click", () => {
    lightbox.style.display = "none";
  });

  // Navigazione avanti/indietro
  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length;
    showImage();
  });

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage();
  });

  // Chiudi con ESC + naviga con frecce
  document.addEventListener("keydown", (e) => {
    if (lightbox.style.display === "flex") {
      if (e.key === "Escape") lightbox.style.display = "none";
      if (e.key === "ArrowRight") {
        currentIndex = (currentIndex + 1) % images.length;
        showImage();
      }
      if (e.key === "ArrowLeft") {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage();
      }
    }
  });
});

//disattivare animazione scrol Navbar
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    lightbox.style.display = "none";
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









