function initStats() {
  const stats = document.querySelectorAll(".stat");
  if (!stats.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function animateStat(stat) {
    const target = Number(stat.dataset.target);
    const fill = stat.querySelector(".stat__gauge-fill");
    const valueEl = stat.querySelector(".stat__value");

    if (prefersReducedMotion) {
      fill.style.strokeDashoffset = "0";
      valueEl.textContent = target.toLocaleString("fr-FR");
      return;
    }

    fill.style.strokeDashoffset = "0";

    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      valueEl.textContent = Math.round(target * eased).toLocaleString("fr-FR");
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  stats.forEach((stat) => observer.observe(stat));
}

document.addEventListener("DOMContentLoaded", initStats);
