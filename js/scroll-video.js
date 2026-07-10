function initChapters(section) {
  const chapters = Array.from(section.querySelectorAll(".scrollvid__chapter"));
  if (!chapters.length) return null;
  const parsed = chapters
    .map((el) => ({ el, from: Number(el.dataset.from) }))
    .sort((a, b) => a.from - b.from);
  let activeEl = null;
  return function updateChapters(progress) {
    // Le dernier chapitre dont le seuil "from" est franchi reste actif
    // jusqu'au suivant — pas de borne haute qui le ferait disparaître
    // en fin de scroll.
    let match = null;
    for (const c of parsed) {
      if (progress >= c.from) match = c;
      else break;
    }
    const nextEl = match ? match.el : null;
    if (nextEl === activeEl) return;
    if (activeEl) activeEl.classList.remove("is-active");
    if (nextEl) nextEl.classList.add("is-active");
    activeEl = nextEl;
  };
}

// Fenêtre de bitmaps décodés conservés en mémoire autour de la frame
// courante — évite de garder les 80 images d'une section entièrement
// décodées en RAM en permanence.
const BITMAP_WINDOW = 30;

function initScrollVideo(section, priority) {
  const canvas = section.querySelector(".scrollvid__canvas");
  const video = section.querySelector(".scrollvid__video");
  if (!canvas || !video) return;

  const frameCount = Number(section.dataset.frameCount);
  const framePrefix = section.dataset.framePrefix;
  const frameExt = section.dataset.frameExt || "webp";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;

  // Mobile / reduced-motion : vidéo native jouée en boucle, pas de scrub par canvas.
  // preload="none" dans le HTML : le fetch ne démarre qu'ici, jamais sur desktop.
  if (isSmallScreen || prefersReducedMotion) {
    canvas.remove();
    video.preload = "auto";
    video.play().catch(() => {});
    const updateChapters = initChapters(section);
    if (updateChapters) updateChapters(0.12);
    return;
  }

  video.remove();
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const updateChapters = initChapters(section);

  // rawImages : simples <img> pour récupérer les octets (léger, mis en cache HTTP).
  // bitmaps : ImageBitmap décodés de façon asynchrone hors thread principal,
  // uniquement pour une fenêtre de frames proches de la position courante.
  const rawImages = new Array(frameCount);
  const bitmaps = new Map();
  const bitmapOrder = [];
  let pendingDecodes = new Set();

  function framePath(i) {
    return `${framePrefix}${String(i).padStart(3, "0")}.${frameExt}`;
  }

  let lastDrawn = -1;

  function drawBitmap(bitmap) {
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = bitmap.width / bitmap.height;
    let sx, sy, sw, sh;
    if (imgRatio > canvasRatio) {
      sh = bitmap.height;
      sw = sh * canvasRatio;
      sy = 0;
      sx = (bitmap.width - sw) / 2;
    } else {
      sw = bitmap.width;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (bitmap.height - sh) / 2;
    }
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }

  function evictFarBitmaps(centerIndex) {
    while (bitmapOrder.length > BITMAP_WINDOW) {
      // Retire le bitmap le plus éloigné de la position actuelle plutôt
      // qu'un simple FIFO, pour garder ceux utiles si l'utilisateur remonte.
      let worst = -1;
      let worstDist = -1;
      for (let k = 0; k < bitmapOrder.length; k++) {
        const dist = Math.abs(bitmapOrder[k] - centerIndex);
        if (dist > worstDist) {
          worstDist = dist;
          worst = k;
        }
      }
      const idx = bitmapOrder.splice(worst, 1)[0];
      const bmp = bitmaps.get(idx);
      if (bmp) bmp.close();
      bitmaps.delete(idx);
    }
  }

  function decodeFrame(i) {
    if (bitmaps.has(i) || pendingDecodes.has(i)) return;
    const img = rawImages[i];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    pendingDecodes.add(i);
    createImageBitmap(img)
      .then((bitmap) => {
        pendingDecodes.delete(i);
        bitmaps.set(i, bitmap);
        bitmapOrder.push(i);
        evictFarBitmaps(currentFrame);
        if (i === currentFrame) draw(i);
      })
      .catch(() => {
        pendingDecodes.delete(i);
      });
  }

  function draw(index) {
    if (index === lastDrawn && bitmaps.has(index)) return;
    const bitmap = bitmaps.get(index);
    if (bitmap) {
      drawBitmap(bitmap);
      lastDrawn = index;
      return;
    }
    // Pas encore décodée : on la demande en priorité et on garde
    // affichée la dernière frame valide en attendant (pas de flash noir).
    decodeFrame(index);
  }

  function resizeCanvas() {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    lastDrawn = -1;
  }

  function scrollProgress() {
    const rect = section.getBoundingClientRect();
    const scrollableDistance = section.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    return Math.min(Math.max(scrolled / scrollableDistance, 0), 1);
  }

  function frameForProgress(progress) {
    return Math.min(frameCount - 1, Math.floor(progress * frameCount));
  }

  let ticking = false;
  let currentFrame = 0;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const progress = scrollProgress();
      currentFrame = frameForProgress(progress);
      draw(currentFrame);
      // Décode par avance les prochaines frames dans le sens du scroll,
      // pour qu'elles soient déjà prêtes quand on les atteint.
      for (let k = 1; k <= 4; k++) {
        decodeFrame(Math.min(frameCount - 1, currentFrame + k));
      }
      if (updateChapters) updateChapters(progress);
      ticking = false;
    });
  }

  function fetchFrame(i) {
    if (rawImages[i]) return;
    const img = new Image();
    img.decoding = "async";
    if ("fetchPriority" in img) img.fetchPriority = priority;
    img.src = framePath(i + 1);
    rawImages[i] = img;
    img.onload = () => {
      if (Math.abs(i - currentFrame) <= 6) decodeFrame(i);
    };
  }

  function fetchAllFrames() {
    let next = 0;
    function loadChunk(deadline) {
      while (next < frameCount && (!deadline || deadline.timeRemaining() > 0)) {
        fetchFrame(next);
        next++;
      }
      if (next < frameCount) {
        window.requestIdleCallback
          ? requestIdleCallback(loadChunk)
          : setTimeout(() => loadChunk(), 50);
      }
    }
    // Les premières frames sont prioritaires et chargées sans attendre l'idle.
    const head = Math.min(10, frameCount);
    for (let i = 0; i < head; i++) fetchFrame(i);
    window.requestIdleCallback
      ? requestIdleCallback(loadChunk)
      : setTimeout(() => loadChunk(), 50);
  }

  resizeCanvas();
  fetchAllFrames();
  decodeFrame(0);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    resizeCanvas();
    lastDrawn = -1;
    draw(currentFrame);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".scrollvid");
  sections.forEach((section, i) => {
    // La première section (hero) charge en priorité haute ; les suivantes
    // en priorité basse pour ne jamais lui voler de bande passante.
    initScrollVideo(section, i === 0 ? "high" : "low");
  });
});
