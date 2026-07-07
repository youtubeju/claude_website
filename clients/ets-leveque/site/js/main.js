/* ============================================================
   ETS Lévêque v3 — comportements globaux.
   Scroll NATIF (pas de smooth-scroll JS : fluidité d'abord).
   GSAP ScrollTrigger pour reveals, compteurs, frise.
   ============================================================ */
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.remove("no-js");

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (REDUCED) html.classList.add("reduced-motion");
  if (hasGsap && !REDUCED) html.classList.add("js-anim");
  else html.classList.add("no-gsap");

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

  var current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    if (a.getAttribute("href") === current) a.classList.add("active");
  });

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
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate: function () {
        el.textContent = Math.round(obj.v).toLocaleString("fr-FR");
      }
    });
  });

  if (REDUCED) return;

  /* ---------- Entrée du hero / page-hero ---------- */
  var heroBits = document.querySelectorAll(
    ".hero-content .eyebrow, .hero-content .hero-title, .hero-content .hero-sub, .hero-content .hero-actions, " +
    ".page-hero .breadcrumb, .page-hero .eyebrow, .page-hero h1, .page-hero .lead"
  );
  if (heroBits.length) {
    gsap.from(heroBits, {
      opacity: 0,
      y: 36,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.11,
      delay: 0.12,
      clearProps: "all"
    });
  }

  /* ---------- Barre de progression ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  gsap.to(bar, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
  });

  /* ---------- Reveals ---------- */
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: "power2.out",
        stagger: 0.09,
        overwrite: true,
        clearProps: "transform"
      });
    }
  });
  ScrollTrigger.addEventListener("refreshInit", function () {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (el.getBoundingClientRect().top < 0) gsap.set(el, { opacity: 1, y: 0 });
    });
  });

  /* ---------- Frise chronologique ---------- */
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

  /* ---------- Boutons magnétiques (desktop uniquement) ---------- */
  if (window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".btn-primary").forEach(function (btn) {
      var strength = 7;
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
})();
