function initInviewVideos() {
  const videos = document.querySelectorAll(".video-inview");
  if (!videos.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  videos.forEach((video) => {
    // Avec les animations réduites, la vidéo ne se lance pas automatiquement
    // (elle reste sur le poster) : bloquer le scroll dans ce cas piégerait
    // l'utilisateur sans rien à attendre.
    if (prefersReducedMotion) return;

    // Légèrement plus rapide que le tempo natif — rend le passage un peu
    // plus dynamique sans que ce soit perceptible comme "accéléré".
    const PLAYBACK_RATE = 1.5;

    const revealTarget = video.parentElement.querySelector(
      ".video-inview-reveal"
    );

    let locked = false;

    function lockScroll() {
      locked = true;
      document.body.style.overflow = "hidden";
    }

    function unlockScroll() {
      if (!locked) return;
      locked = false;
      document.body.style.overflow = "";
    }

    function blockScrollKeys(e) {
      if (!locked) return;
      const keys = [
        "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Space", "End", "Home",
      ];
      if (keys.includes(e.code)) e.preventDefault();
    }

    function blockScrollEvent(e) {
      if (locked) e.preventDefault();
    }

    window.addEventListener("wheel", blockScrollEvent, { passive: false });
    window.addEventListener("touchmove", blockScrollEvent, { passive: false });
    window.addEventListener("keydown", blockScrollKeys);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(video);

          lockScroll();
          video.preload = "auto";
          video.playbackRate = PLAYBACK_RATE;
          video
            .play()
            .then(() => {
              if (revealTarget) revealTarget.classList.add("is-active");
            })
            .catch(() => {
              // Lecture bloquée par le navigateur : ne jamais piéger
              // l'utilisateur derrière une vidéo qui ne démarre pas.
              unlockScroll();
            });

          video.addEventListener("ended", unlockScroll, { once: true });
          // Filet de sécurité : si "ended" ne se déclenche jamais pour une
          // raison quelconque, on ne bloque pas le scroll indéfiniment.
          video.addEventListener(
            "loadedmetadata",
            () => {
              const fallbackMs =
                ((video.duration || 8) / PLAYBACK_RATE) * 1000 + 2000;
              setTimeout(unlockScroll, fallbackMs);
            },
            { once: true }
          );
        });
      },
      // Quasi 100% : on ne verrouille que quand la section remplit tout
      // l'écran (haut ET bas visibles, texte compris), pas pendant qu'elle
      // remonte encore depuis le bas de la fenêtre.
      { threshold: 0.98 }
    );
    observer.observe(video);
  });
}

document.addEventListener("DOMContentLoaded", initInviewVideos);
