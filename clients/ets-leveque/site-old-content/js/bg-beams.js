/* ============================================================
   Beams Background — portage vanilla JS
   Adapté de "Beams Background" (@dorianbaffier, kokonutui.com, MIT)
   Recoloré au branding ETS Lévêque : faisceaux turquoise/sarcelle
   montant lentement — évocation des flux de chaleur et d'énergie.
   Utilisé sur les bandeaux d'en-tête sombres des pages intérieures.

   Adaptations vs. original :
   - React/Framer Motion retiré — canvas 2D pur.
   - Teintes hue 180-202 (turquoise du logo) au lieu de 190-260.
   - Blur déplacé en CSS (GPU) au lieu de ctx.filter par frame.
   - Nombre de faisceaux réduit sur mobile (budget perf).
   - prefers-reduced-motion : une seule frame statique, pas de rAF.
   - IntersectionObserver + visibilitychange : pause hors écran.
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var HUE_BASE = 180;
  var HUE_RANGE = 22;
  var SATURATION = "62%";
  var LIGHTNESS = "58%";

  function createBeam(w, h) {
    return {
      x: Math.random() * w * 1.5 - w * 0.25,
      y: Math.random() * h * 2.5 - h * 0.75,
      width: 70 + Math.random() * 120,
      length: h * 3,
      angle: -35 + Math.random() * 10,
      speed: 0.35 + Math.random() * 0.7,
      opacity: 0.24 + Math.random() * 0.18,
      hue: HUE_BASE + Math.random() * HUE_RANGE,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03
    };
  }

  function initBeams(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var container = canvas.parentElement;
    var beams = [];
    var rafId = 0;
    var running = false;
    var isMobile = window.matchMedia("(max-width: 768px)").matches;
    var beamCount = isMobile ? 7 : 14;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 0;
    var h = 0;

    function resize() {
      w = container.offsetWidth;
      h = container.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      beams = [];
      for (var i = 0; i < beamCount; i++) beams.push(createBeam(w, h));
    }

    function resetBeam(beam, index) {
      var column = index % 3;
      var spacing = w / 3;
      beam.y = h + 120;
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
      beam.width = 130 + Math.random() * 150;
      beam.speed = 0.3 + Math.random() * 0.45;
      beam.hue = HUE_BASE + (index * HUE_RANGE) / beamCount;
      beam.opacity = 0.28 + Math.random() * 0.14;
    }

    function drawBeam(beam) {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      var pulsing = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2);
      var g = ctx.createLinearGradient(0, 0, 0, beam.length);
      var hsl = beam.hue + ", " + SATURATION + ", " + LIGHTNESS;
      g.addColorStop(0, "hsla(" + hsl + ", 0)");
      g.addColorStop(0.1, "hsla(" + hsl + ", " + pulsing * 0.5 + ")");
      g.addColorStop(0.4, "hsla(" + hsl + ", " + pulsing + ")");
      g.addColorStop(0.6, "hsla(" + hsl + ", " + pulsing + ")");
      g.addColorStop(0.9, "hsla(" + hsl + ", " + pulsing * 0.5 + ")");
      g.addColorStop(1, "hsla(" + hsl + ", 0)");

      ctx.fillStyle = g;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    }

    function drawFrame(advance) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < beams.length; i++) {
        var beam = beams[i];
        if (advance) {
          beam.y -= beam.speed;
          beam.pulse += beam.pulseSpeed;
          if (beam.y + beam.length < -120) resetBeam(beam, i);
        }
        drawBeam(beam);
      }
    }

    function loop() {
      if (!running) return;
      drawFrame(true);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running || REDUCED) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    resize();
    drawFrame(false); // frame statique immédiate (et unique si reduced-motion)

    if (!REDUCED) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start();
          else stop();
        });
      }, { threshold: 0 });
      io.observe(container);

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop();
        else if (container.getBoundingClientRect().bottom > 0) start();
      });
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        drawFrame(false);
      }, 150);
    });
  }

  window.ETSLeveque = window.ETSLeveque || {};
  window.ETSLeveque.initBeams = initBeams;

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("canvas.bg-beams").forEach(initBeams);
  });
})();
