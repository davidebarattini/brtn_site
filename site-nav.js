(function () {
  function initSiteNav(options) {
    options = options || {};
    const galleryDropdown = !!options.galleryDropdown;

    const navbar = document.querySelector(".custom-navbar");
    const portfolioDropdown = document.querySelector(".nav-item.dropdown");
    const scrollIndicator = document.querySelector(".scroll-indicator");

    const dropdownMenus = galleryDropdown
      ? document.querySelectorAll(".dropdown-menu")
      : [];

    let navbarScrolled = null;
    let indicatorHidden = null;

    function updateDropdownBackground() {
      if (!galleryDropdown || !navbar) return;
      const scrolled = navbar.classList.contains("scrolled");
      const bg = scrolled ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.4)";
      dropdownMenus.forEach((menu) => {
        menu.style.backgroundColor = bg;
      });
    }

    let hoverTimeout;

    function setupDropdown() {
      if (!portfolioDropdown) return;
      const dropdownMenu = portfolioDropdown.querySelector(".dropdown-menu");
      const portfolioLink = portfolioDropdown.querySelector("#portfolioDropdown");
      if (!dropdownMenu || !portfolioLink) return;

      if (galleryDropdown) {
        dropdownMenu.style.marginTop = "16px";
      }

      portfolioLink.addEventListener("click", (e) => e.preventDefault());

      function showDropdown() {
        dropdownMenu.style.display = "block";
        dropdownMenu.style.opacity = "1";
        dropdownMenu.style.visibility = "visible";
        if (galleryDropdown) {
          dropdownMenu.style.backdropFilter = "blur(6px)";
          dropdownMenu.style.webkitBackdropFilter = "blur(6px)";
        }
      }

      function hideDropdown() {
        dropdownMenu.style.display = "none";
        dropdownMenu.style.opacity = "0";
        dropdownMenu.style.visibility = "hidden";
      }

      portfolioDropdown.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimeout);
        showDropdown();
      });
      portfolioDropdown.addEventListener("mouseleave", () => {
        hoverTimeout = setTimeout(hideDropdown, 150);
      });
    }

    function setupMobileMenu() {
      const toggler = document.querySelector(".custom-toggler");
      const mobileMenu = document.querySelector(".mobile-menu");
      const closeBtn = document.querySelector(".mobile-menu .close-menu");
      if (!toggler || !mobileMenu || !closeBtn) return;

      toggler.addEventListener("click", () => {
        mobileMenu.classList.toggle("active");
        toggler.classList.toggle("active");
      });
      closeBtn.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        toggler.classList.remove("active");
      });
      mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          mobileMenu.classList.remove("active");
          toggler.classList.remove("active");
        });
      });
    }

    let scrollScheduled = false;
    function handleScrollFrame() {
      const scrollY = window.scrollY;

      if (navbar) {
        const shouldScrolled = scrollY > 50;
        if (navbarScrolled !== shouldScrolled) {
          navbarScrolled = shouldScrolled;
          navbar.classList.toggle("scrolled", shouldScrolled);
          if (galleryDropdown) updateDropdownBackground();
        }
      }

      if (scrollIndicator) {
        const hide = scrollY > 100;
        if (indicatorHidden !== hide) {
          indicatorHidden = hide;
          scrollIndicator.style.opacity = hide ? "0" : "1";
          scrollIndicator.style.pointerEvents = hide ? "none" : "auto";
        }
      }
    }

    window.addEventListener(
      "scroll",
      () => {
        if (scrollScheduled) return;
        scrollScheduled = true;
        requestAnimationFrame(() => {
          scrollScheduled = false;
          handleScrollFrame();
        });
      },
      { passive: true }
    );

    setupDropdown();
    setupMobileMenu();

    if (galleryDropdown && navbar) {
      updateDropdownBackground();
    }
  }

  window.initSiteNav = initSiteNav;

  document.addEventListener("DOMContentLoaded", function () {
    initSiteNav({
      galleryDropdown: document.body.classList.contains("gallery-page"),
    });
  });
})();
