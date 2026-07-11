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

// Toutes les frames décodées sont conservées en mémoire pour la durée de
// la page, sans éviction — c'est la configuration confirmée fluide par
// l'utilisateur. Ne pas réintroduire de fenêtre bornée ici sans qu'il le
// redemande explicitement : ça avait été essayé et ça n'a rien résolu.
// Rayon de priorité autour de la position de scroll courante : au-delà du
// chargement progressif en arrière-plan, on force le fetch+decode immédiat
// des frames proches (symétrique avant/arrière) pour absorber un scroll
// rapide dans n'importe quel sens, y compris en arrière.
const PRIORITY_RADIUS = 12;

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
  // Plafonné à 1 : dessiner en résolution native de l'écran (x2 sur retina)
  // double ou quadruple le coût de chaque drawImage, ce qui fait décrocher
  // le scroll sur les machines modestes.
  const dpr = 1;
  const updateChapters = initChapters(section);
  const chaptersEl = section.querySelector(".scrollvid__chapters");

  // Le texte du dernier chapitre s'efface avant la fin du scroll, pour ne
  // jamais être coupé net par la section suivante qui remonte par-dessus.
  const CHAPTER_FADE_OUT_START = Number(section.dataset.fadeOutStart) || 0.82;
  const CHAPTER_FADE_OUT_END = Number(section.dataset.fadeOutEnd) || 0.88;
  function updateChaptersFadeOut(progress) {
    if (!chaptersEl) return;
    const fade =
      progress <= CHAPTER_FADE_OUT_START
        ? 1
        : Math.max(
            0,
            1 - (progress - CHAPTER_FADE_OUT_START) / (CHAPTER_FADE_OUT_END - CHAPTER_FADE_OUT_START)
          );
    chaptersEl.style.opacity = fade;
  }

  // rawImages : simples <img> pour récupérer les octets (léger, mis en cache HTTP).
  // bitmaps : ImageBitmap décodés de façon asynchrone hors thread principal,
  // conservés pour toute la durée de la page une fois décodés.
  const rawImages = new Array(frameCount);
  const bitmaps = new Map();
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

  function decodeFrame(i) {
    if (bitmaps.has(i) || pendingDecodes.has(i)) return;
    const img = rawImages[i];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    pendingDecodes.add(i);
    createImageBitmap(img)
      .then((bitmap) => {
        pendingDecodes.delete(i);
        bitmaps.set(i, bitmap);
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

  function frameForProgress(progress) {
    return Math.min(frameCount - 1, Math.floor(progress * frameCount));
  }

  let ticking = false;
  let currentFrame = 0;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      // Cette section est loin de l'écran (l'autre vidéo est en cours de
      // scroll) : on saute tout le travail coûteux (décodage, dessin sur
      // canvas). Les deux sections vidéo ont chacune leur propre listener
      // de scroll ; sans cette garde, les deux tournent à plein régime en
      // permanence, ce qui double le travail pour rien.
      if (rect.bottom < -window.innerHeight || rect.top > window.innerHeight * 2) {
        ticking = false;
        return;
      }
      const scrollableDistance = section.offsetHeight - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / scrollableDistance, 0), 1);
      currentFrame = frameForProgress(progress);
      draw(currentFrame);
      // Priorité symétrique autour de la position courante — avant ET
      // arrière — pour que le scroll soit tout aussi fluide qu'on avance
      // ou qu'on revienne en arrière. Force le fetch (pas seulement le
      // decode) au cas où le chargement progressif en arrière-plan n'ait
      // pas encore atteint ces frames (ex: scroll rapide vers la fin).
      for (let k = 1; k <= PRIORITY_RADIUS; k++) {
        const fwd = currentFrame + k;
        const bwd = currentFrame - k;
        if (fwd <= frameCount - 1) {
          fetchFrame(fwd);
          decodeFrame(fwd);
        }
        if (bwd >= 0) {
          fetchFrame(bwd);
          decodeFrame(bwd);
        }
      }
      if (updateChapters) updateChapters(progress);
      updateChaptersFadeOut(progress);
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
    img.onload = () => decodeFrame(i);
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
    // Seule la section prioritaire (le hero) charge ses premières frames
    // sans attendre l'idle. Les sections en priorité basse (drone) passent
    // TOUTES par l'idle callback dès la frame 0 : sinon leur propre lot de
    // fetches démarre en même temps que celui du hero au chargement de la
    // page et lui vole de la bande passante au pire moment.
    const head = priority === "high" ? Math.min(20, frameCount) : 0;
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
    // en priorité basse pour ne jamais lui voler de bande passante au
    // chargement initial de la page.
    initScrollVideo(section, i === 0 ? "high" : "low");
  });
});
