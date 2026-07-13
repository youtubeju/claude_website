function initMobileNav() {
  const burger = document.querySelector(".site-header__burger");
  const panel = document.querySelector(".mobile-nav");
  const closeBtn = document.querySelector(".mobile-nav__close");
  if (!burger || !panel) return;

  function closeMenu() {
    panel.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-nav-open");
  }

  function openMenu() {
    panel.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    document.body.classList.add("mobile-nav-open");
  }

  // Le panneau passe au-dessus du header une fois ouvert (voir header.css) :
  // le logo derrière se retrouvait visible en transparence, mélangé au
  // texte du 1er lien ("Nos services"). Un bouton de fermeture dédié, à
  // l'intérieur du panneau, évite d'avoir à garder le header (et son logo)
  // au-dessus.
  burger.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

document.addEventListener("DOMContentLoaded", initMobileNav);
