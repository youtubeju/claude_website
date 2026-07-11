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

function initStats() {
  const meters = document.querySelectorAll(".meter[data-target]");
  if (!meters.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const readouts = [];

  meters.forEach((meter, i) => {
    const readout = meter.querySelector(".meter__readout");
    const target = Number(meter.dataset.target);
    const unit = meter.dataset.unit;

    readout.append(target.toLocaleString("fr-FR"));
    readouts.push({ el: readout, speed: 10 + (i % 3) * 6 });

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
