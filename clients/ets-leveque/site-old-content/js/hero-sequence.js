/* ============================================================
   Hero accueil — séquence de 120 frames (plan drone : équipe et
   camionnettes devant le bâtiment ETS Lévêque) dessinée dans un
   <canvas>, pilotée par GSAP ScrollTrigger (pin + scrub).
   - Fallback sans JS : dégradé + logo (géré en CSS, html.no-js).
   - prefers-reduced-motion : frame finale statique, pas de pin.
   - Frames en WebP 800px (~45 Ko) ; chargement "clairsemé
     d'abord" (1/8 puis 1/4, 1/2, tout) avec concurrence limitée :
     la séquence est scrubbable de bout en bout en ~1 s même sur
     réseau lent, et s'affine ensuite — nearestLoaded comble les
     trous en attendant.
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 768px)").matches;

  var FRAME_COUNT = 120;
  var FRAME_W = 800;
  // Recadrage source : letterbox noir haut/bas (proportions de l'export 800x450)
  var SRC_Y = 12;
  var SRC_H = 450 - 12 - 13;

  function framePath(i) {
    var n = String(i + 1);
    while (n.length < 4) n = "0" + n;
    return "assets/hero-frames/frame-" + n + ".webp";
  }

  var images = new Array(FRAME_COUNT);
  var loaded = new Array(FRAME_COUNT);
  var state = { frame: 0 };
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    var w = canvas.offsetWidth;
    var h = canvas.offsetHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function nearestLoaded(target) {
    if (loaded[target]) return target;
    for (var d = 1; d < FRAME_COUNT; d++) {
      if (target - d >= 0 && loaded[target - d]) return target - d;
      if (target + d < FRAME_COUNT && loaded[target + d]) return target + d;
    }
    return -1;
  }

  function draw() {
    var idx = nearestLoaded(Math.round(state.frame));
    if (idx < 0) return;
    var img = images[idx];
    var cw = canvas.offsetWidth;
    var ch = canvas.offsetHeight;
    // Mode cover sur la zone utile (letterbox recadré)
    var scale = Math.max(cw / FRAME_W, ch / SRC_H);
    var dw = FRAME_W * scale;
    var dh = SRC_H * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, SRC_Y, FRAME_W, SRC_H, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  /* Chargement clairsemé d'abord, concurrence limitée à 6 :
     passe 1 = frames 0,8,16,... (couverture complète immédiate),
     passe 2 = 0,4,8,..., passe 3 = pas de 2, passe 4 = tout. */
  var queue = [];
  var seen = {};
  [8, 4, 2, 1].forEach(function (step) {
    for (var i = 0; i < FRAME_COUNT; i += step) {
      if (!seen[i]) { seen[i] = true; queue.push(i); }
    }
  });

  var inFlight = 0;
  var MAX_CONCURRENT = 6;

  function pump() {
    while (inFlight < MAX_CONCURRENT && queue.length) {
      (function (idx) {
        inFlight++;
        var img = new Image();
        img.decoding = "async";
        img.onload = img.onerror = function () {
          loaded[idx] = img.complete && img.naturalWidth > 0;
          inFlight--;
          // Redessine si la frame chargée améliore la position courante
          if (Math.abs(idx - Math.round(state.frame)) < 9) draw();
          pump();
        };
        img.src = framePath(idx);
        images[idx] = img;
      })(queue.shift());
    }
  }

  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (REDUCED || !hasGsap) {
    // Statique : frame finale (l'équipe au complet), pas de pin
    state.frame = FRAME_COUNT - 1;
    queue = [FRAME_COUNT - 1];
    seen = {};
    pump();
    var check = setInterval(function () {
      if (loaded[FRAME_COUNT - 1]) { clearInterval(check); resize(); }
    }, 100);
    window.addEventListener("resize", resize);
    return;
  }

  resize(); // dimensionne le bitmap AVANT le premier dessin (sinon canvas 300x150 par défaut)
  pump();
  window.addEventListener("resize", resize);

  gsap.registerPlugin(ScrollTrigger);
  // Pas de pin GSAP : c'est le position:sticky CSS de .hero-sticky qui tient
  // l'écran, le ScrollTrigger ne fait que lire la progression dans .hero (215vh).
  // Insensible aux sauts de scroll (touche Début, ancres, rechargement).
  gsap.to(state, {
    frame: FRAME_COUNT - 1,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4
    },
    onUpdate: draw
  });

  // Le texte du hero s'efface doucement pendant la lecture de la séquence
  gsap.to(".hero-content", {
    opacity: 0,
    y: -40,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "70% bottom",
      scrub: true
    }
  });
})();
