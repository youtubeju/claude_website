// Parallax léger : chaque chiffre dérive verticalement à sa propre vitesse
// pendant que la section traverse l'écran, en plus du fondu d'apparition.
function initParallax(readouts) {
  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    readouts.forEach(({ el, speed }) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const progress = Math.min(Math.max((center - vh / 2) / vh, -1), 1);
      el.style.translate = `0 ${(progress * speed).toFixed(1)}px`;
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

// Compteur : le chiffre défile de 0 jusqu'à sa valeur finale une fois la
// carte visible (pas au chargement), formaté en fr-FR à chaque palier pour
// garder les espaces de milliers pendant le défilement, pas seulement à
// l'arrivée.
function animateCount(node, target) {
  const speed = target / 35;
  let count = 0;

  const step = () => {
    count += speed;
    if (count < target) {
      node.textContent = Math.ceil(count).toLocaleString("fr-FR");
      setTimeout(step, 30);
    } else {
      node.textContent = target.toLocaleString("fr-FR");
    }
  };

  step();
}

function initStats() {
  const meters = document.querySelectorAll(".meter[data-target]");
  if (!meters.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const readouts = [];
  const counters = [];

  meters.forEach((meter, i) => {
    const readout = meter.querySelector(".meter__readout");
    const target = Number(meter.dataset.target);
    const unit = meter.dataset.unit;

    const numberNode = document.createTextNode(
      prefersReducedMotion ? target.toLocaleString("fr-FR") : "0"
    );
    readout.appendChild(numberNode);
    readouts.push({ el: readout, speed: 10 + (i % 3) * 6 });
    if (!prefersReducedMotion) counters.push({ meter, numberNode, target });

    if (unit) {
      const unitEl = document.createElement("span");
      unitEl.className = "meter__unit";
      unitEl.textContent = unit;
      readout.appendChild(unitEl);
    }

    if (prefersReducedMotion) meter.classList.add("is-visible");
  });

  if (prefersReducedMotion) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          const counter = counters.find((c) => c.meter === entry.target);
          if (counter) animateCount(counter.numberNode, counter.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  meters.forEach((meter) => observer.observe(meter));
  initParallax(readouts);
}

document.addEventListener("DOMContentLoaded", initStats);
