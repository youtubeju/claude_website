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
    // La section (pas juste la vidéo) donne la géométrie fiable : elle fait
    // toujours exactement 100vh (voir .stove), donc son alignement en haut
    // du viewport correspond exactement au moment où elle remplit l'écran.
    const section = video.closest("section") || video.parentElement;
    // Le cadre (pas juste la vidéo) passe en position:fixed pendant le
    // verrouillage — voir stove.css .stove__frame.is-locked et la note
    // plus bas dans lockScroll()/unlockScroll().
    const frame = video.closest(".stove__frame") || section;

    let locked = false;
    let triggered = false;
    let lockedScrollY = 0;

    // preload reste "none" dans le HTML pour ne pas concurrencer le
    // téléchargement du hero au chargement initial — mais si le fetch ne
    // démarre qu'au moment exact du verrouillage (dans startSequence), le
    // premier affichage attend le temps de mise en mémoire tampon du
    // fichier entier, perçu comme "ça bloque avant de lancer la vidéo".
    // Idle callback : démarre le buffering en arrière-plan dès que le
    // thread principal est libre après le chargement initial, sans jamais
    // voler de bande passante au hero — par le temps où l'utilisateur
    // scrolle jusqu'à cette section, la vidéo a déjà eu une longueur
    // d'avance.
    const startBuffering = () => {
      video.preload = "auto";
    };
    if (window.requestIdleCallback) {
      requestIdleCallback(startBuffering);
    } else {
      setTimeout(startBuffering, 2000);
    }

    // overflow:hidden seul ne suffit pas : le momentum d'un trackpad (scroll
    // inertiel après relâchement du doigt) est parfois piloté par le
    // compositeur du navigateur plutôt que par des événements "wheel"
    // interceptables, et continue à faire dériver le scroll de quelques
    // dizaines de pixels après le verrouillage — d'où un cadrage "trop bas"
    // au moment du blocage. Passer le body en position:fixed retire
    // complètement la fenêtre de tout contexte scrollable pendant le
    // verrouillage, ce qui coupe court à ce résidu quelle que soit sa source.
    // Prend la position cible explicitement plutôt que de relire
    // window.scrollY au moment du verrouillage : sur un scroll rapide
    // (flick), l'inertie pilotée par le compositeur peut continuer à
    // faire dériver scrollY après le snap et avant ce point — se figer sur
    // une lecture "live" de scrollY risquait de figer une position déjà
    // décalée. La cible précise qu'on a nous-mêmes calculée reste valable
    // quoi qu'il arrive entre-temps.
    function lockScroll(targetScrollY) {
      locked = true;
      lockedScrollY = targetScrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      frame.classList.add("is-locked");
    }

    function unlockScroll() {
      if (!locked) return;
      locked = false;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      frame.classList.remove("is-locked");
      window.scrollTo({ top: lockedScrollY, behavior: "instant" });
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

    function startSequence() {
      triggered = true;
      window.removeEventListener("scroll", onScroll);

      // Aligne précisément la section en haut du viewport avant de
      // verrouiller : un scroll rapide (molette, flick trackpad) peut
      // dépasser le point exact où elle remplit l'écran avant que ce check
      // ne s'exécute, ce qui donnait un cadrage décalé une fois bloqué.
      // "instant" est nécessaire ici (pas "auto") car <html> a
      // scroll-behavior:smooth — "auto" hériterait ce comportement animé,
      // hors on veut un snap immédiat avant de verrouiller.
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "instant" });

      // Un scroll rapide (flick) a de l'inertie qui continue à défiler la
      // page sur une frame ou deux après ce scrollTo, pilotée par le
      // compositeur plutôt que par du JS interceptable — verrouiller dans
      // le même tick pouvait figer la page une frame trop tôt, avant que ce
      // snap n'ait fini de s'appliquer, laissant la marge suivante
      // brièvement visible. Un rAF laisse ce snap passer par un cycle de
      // peinture, puis on re-snap sur la même cible `top` juste avant de
      // verrouiller (pas une relecture de scrollY, qui pourrait avoir
      // continué à dériver entre-temps) pour être sûr d'être bien aligné.
      requestAnimationFrame(() => {
        window.scrollTo({ top, behavior: "instant" });
        lockScroll(top);
        video.preload = "auto";
        video.playbackRate = PLAYBACK_RATE;
        function onPlaySuccess() {
          if (revealTarget) revealTarget.classList.add("is-active");
        }
        video
          .play()
          .then(onPlaySuccess)
          .catch(() => {
            // iOS bloque parfois play() hors d'un vrai geste utilisateur
            // (mode Basse consommation, réglage Safari "Lecture
            // automatique") même sur une vidéo muted+playsinline — la
            // section est déjà verrouillée en scroll à ce stade (l'usager
            // vient de faire défiler la page, donc un geste a déjà eu
            // lieu), mais l'appel play() lui-même n'était pas dans le
            // handler de ce geste. On retente une fois au prochain
            // touchstart/click plutôt que de débloquer immédiatement :
            // ça laisse une chance réelle de lire la vidéo au lieu
            // d'abandonner sur un appareil où l'autoplay est simplement
            // restreint (pas cassé).
            const events = ["touchstart", "click"];
            function retry() {
              events.forEach((e) => document.removeEventListener(e, retry));
              video.play().then(onPlaySuccess).catch(unlockScroll);
            }
            events.forEach((e) =>
              document.addEventListener(e, retry, { once: true, passive: true })
            );
            // Filet de sécurité : si aucun geste ne vient dans un délai
            // raisonnable, ne pas laisser le scroll verrouillé indéfiniment.
            setTimeout(() => {
              if (video.paused) {
                events.forEach((e) => document.removeEventListener(e, retry));
                unlockScroll();
              }
            }, 4000);
          });
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
    }

    // Calcul direct sur les dimensions de la section plutôt qu'un
    // IntersectionObserver à seuil quasi-100% : la section fait exactement
    // 100vh, donc "remplir l'écran" est un point unique (scrollY précis),
    // qu'un scroll rapide pouvait sauter entre deux vérifications du seuil
    // et ne jamais déclencher le blocage. Une marge de tolérance ici couvre
    // ce cas, dans les deux sens de scroll — seule la première traversée
    // (marquée par `triggered`) déclenche le blocage ; on peut ensuite
    // remonter librement sans le redéclencher.
    const TOLERANCE = 60;
    function onScroll() {
      if (triggered) return;
      const rect = section.getBoundingClientRect();
      const fillsViewport =
        rect.top <= TOLERANCE && rect.bottom >= window.innerHeight - TOLERANCE;
      if (fillsViewport) startSequence();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  });
}

document.addEventListener("DOMContentLoaded", initInviewVideos);
