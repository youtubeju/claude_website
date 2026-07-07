/* ============================================================
   Background Paths — portage vanilla JS
   Adapté de "Background Paths" (@dorianbaffier, kokonutui.com, MIT)
   Recoloré au branding ETS Lévêque : lignes fluides en dégradé
   turquoise → corail — évocation des flux d'eau, de chaleur et
   d'électricité. Utilisé sur la bande CTA "Demandez votre devis".

   Adaptations vs. original :
   - React/Framer Motion retiré — SVG généré en DOM pur.
   - Gradient violet/rose/bleu remplacé par turquoise → corail (logo).
   - 18 tracés au lieu de 37 (12 sur mobile) — budget perf.
   - Dérive verticale via animation CSS (GPU), désactivée par
     prefers-reduced-motion (le SVG reste alors statique).
   ============================================================ */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  function generatePath(index, type) {
    var baseAmplitude = type === "a" ? 150 : type === "b" ? 100 : 60;
    var segments = type === "a" ? 10 : type === "b" ? 8 : 6;
    var phase = index * 0.2;

    var startX = 2400, startY = 800;
    var endX = -2400, endY = -800 + index * 25;

    var points = [];
    for (var i = 0; i <= segments; i++) {
      var progress = i / segments;
      var eased = 1 - Math.pow(1 - progress, 2);
      var baseX = startX + (endX - startX) * eased;
      var baseY = startY + (endY - startY) * eased;
      var amp = 1 - eased * 0.3;
      var wave1 = Math.sin(progress * Math.PI * 3 + phase) * baseAmplitude * 0.7 * amp;
      var wave2 = Math.cos(progress * Math.PI * 4 + phase) * baseAmplitude * 0.3 * amp;
      var wave3 = Math.sin(progress * Math.PI * 2 + phase) * baseAmplitude * 0.2 * amp;
      points.push({ x: baseX, y: baseY + wave1 + wave2 + wave3 });
    }

    var d = "";
    for (var j = 0; j < points.length; j++) {
      var p = points[j];
      if (j === 0) {
        d += "M " + p.x.toFixed(1) + " " + p.y.toFixed(1);
      } else {
        var prev = points[j - 1];
        var t = 0.4;
        var cp1x = prev.x + (p.x - prev.x) * t;
        var cp2x = prev.x + (p.x - prev.x) * (1 - t);
        d += " C " + cp1x.toFixed(1) + " " + prev.y.toFixed(1) +
             ", " + cp2x.toFixed(1) + " " + p.y.toFixed(1) +
             ", " + p.x.toFixed(1) + " " + p.y.toFixed(1);
      }
    }
    return d;
  }

  function makeGroup(svg, type, count, cls, groupOpacity) {
    var g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", cls);
    if (groupOpacity) g.setAttribute("opacity", groupOpacity);
    for (var i = 0; i < count; i++) {
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", generatePath(i, type));
      path.setAttribute("stroke", "url(#ets-paths-gradient)");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("fill", "none");
      var w = type === "a" ? 5 + i * 0.35 : type === "b" ? 3.5 + i * 0.3 : 2.5 + i * 0.25;
      var o = type === "a" ? 0.3 + i * 0.03 : type === "b" ? 0.24 + i * 0.02 : 0.18 + i * 0.04;
      path.setAttribute("stroke-width", w.toFixed(2));
      path.setAttribute("opacity", Math.min(o, 0.7).toFixed(3));
      g.appendChild(path);
    }
    svg.appendChild(g);
  }

  function initPaths(container) {
    var isMobile = window.matchMedia("(max-width: 768px)").matches;

    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "-2400 -800 4800 1600");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");

    var defs = document.createElementNS(SVG_NS, "defs");
    var grad = document.createElementNS(SVG_NS, "linearGradient");
    grad.setAttribute("id", "ets-paths-gradient");
    grad.setAttribute("x1", "0%");
    grad.setAttribute("x2", "100%");
    grad.setAttribute("y1", "0%");
    grad.setAttribute("y2", "0%");
    // Dégradé de marque : turquoise -> turquoise clair -> corail
    [["0%", "rgba(28, 168, 187, 0.9)"],
     ["55%", "rgba(142, 216, 226, 0.8)"],
     ["100%", "rgba(250, 120, 110, 0.75)"]].forEach(function (s) {
      var stop = document.createElementNS(SVG_NS, "stop");
      stop.setAttribute("offset", s[0]);
      stop.setAttribute("stop-color", s[1]);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    if (isMobile) {
      makeGroup(svg, "a", 5, "paths-a", null);
      makeGroup(svg, "b", 4, "paths-b", "0.8");
      makeGroup(svg, "c", 3, "paths-c", "0.6");
    } else {
      makeGroup(svg, "a", 7, "paths-a", null);
      makeGroup(svg, "b", 6, "paths-b", "0.8");
      makeGroup(svg, "c", 5, "paths-c", "0.6");
    }

    container.appendChild(svg);
  }

  window.ETSLeveque = window.ETSLeveque || {};
  window.ETSLeveque.initPaths = initPaths;

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".bg-paths").forEach(initPaths);
  });
})();
