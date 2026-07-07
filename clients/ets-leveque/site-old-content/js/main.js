/* ============================================================
   ETS Lévêque — comportements globaux
   Lenis (smooth scroll) + GSAP ScrollTrigger (reveals, compteurs,
   frise chronologique), navigation, formulaire de contact.
   ============================================================ */
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.remove("no-js");

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (REDUCED) html.classList.add("reduced-motion");
  if (hasGsap && !REDUCED) {
    html.classList.add("js-anim");
  } else {
    html.classList.add("no-gsap");
  }

  /* ---------- Navigation ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector(".nav-burger");
  var links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Lien actif ---------- */
  var current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    if (a.getAttribute("href") === current) a.classList.add("active");
  });

  /* ---------- Année footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Formulaire contact (mailto, site statique) ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var sujet = "Demande de devis — site ets-leveque.fr";
      var corps = "Nom : " + (d.get("nom") || "") +
        "\nTéléphone : " + (d.get("tel") || "") +
        "\nEmail : " + (d.get("email") || "") +
        "\n\nMessage :\n" + (d.get("message") || "");
      location.href = "mailto:contact@ets-leveque.fr?subject=" +
        encodeURIComponent(sujet) + "&body=" + encodeURIComponent(corps);
    });
  }

  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis (smooth scroll) ---------- */
  if (!REDUCED && typeof window.Lenis !== "undefined") {
    var lenis = new Lenis({ lerp: 0.12 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Compteurs (chiffres clés réels) ---------- */
  document.querySelectorAll("[data-counter]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-counter"), 10);
    if (REDUCED) {
      el.textContent = target.toLocaleString("fr-FR");
      return;
    }
    var obj = { v: 0 };
    el.textContent = "0";
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate: function () {
        el.textContent = Math.round(obj.v).toLocaleString("fr-FR");
      }
    });
  });

  if (REDUCED) return;

  /* ---------- Reveals au scroll ---------- */
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.08,
        overwrite: true,
        clearProps: "transform"
      });
    }
  });
  // Sécurité : tout élément déjà au-dessus du viewport devient visible
  ScrollTrigger.addEventListener("refreshInit", function () {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (el.getBoundingClientRect().top < 0) {
        gsap.set(el, { opacity: 1, y: 0 });
      }
    });
  });

  /* ---------- Entrée du hero (accueil et pages intérieures) ---------- */
  var heroBits = document.querySelectorAll(
    ".hero-content > *, .page-hero .hero-eyebrow, .page-hero h1, .page-hero .hero-sub"
  );
  if (heroBits.length) {
    gsap.from(heroBits, {
      opacity: 0,
      y: 34,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.12,
      delay: 0.15,
      clearProps: "transform"
    });
  }

  /* ---------- Barre de progression de lecture (liseré corail) ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  gsap.to(bar, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
  });

  /* ---------- Boutons magnétiques (CTA) ---------- */
  if (window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".btn-primary, .btn-light").forEach(function (btn) {
      var strength = 8;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        gsap.to(btn, { x: dx * strength, y: dy * strength, duration: 0.3, ease: "power2.out" });
      });
      btn.addEventListener("mouseleave", function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.45, ease: "elastic.out(1, 0.5)" });
      });
    });
  }

  /* ---------- Frise chronologique (signature — Notre histoire) ---------- */
  var progress = document.querySelector(".timeline-progress");
  if (progress) {
    gsap.to(progress, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".timeline",
        start: "top 75%",
        end: "bottom 60%",
        scrub: 0.6
      }
    });
  }
})();
