// Le plan filmé (piscine, terrasse, panneaux) doit rester seul à l'écran
// un instant avant que le texte n'arrive — sinon la carte apparaît instantanément
// et mange le plan qu'on vient de mettre en avant. Voir feedback du 2026-07-13.
const HERO_REVEAL_DELAY_MS = 2200;

function splitIntoWords(el) {
  const text = el.textContent.trim().replace(/\s+/g, " ");
  el.setAttribute("aria-label", text);
  el.textContent = "";
  let i = 0;
  text.split(" ").forEach((word, wi, words) => {
    const span = document.createElement("span");
    span.className = "word";
    span.style.setProperty("--i", i++);
    span.textContent = word;
    el.appendChild(span);
    if (wi < words.length - 1) {
      el.appendChild(document.createTextNode(" "));
    }
  });
}

function initHeroIntro() {
  const panel = document.querySelector(".hero__panel");
  const actions = document.querySelector(".hero__actions");
  const wordTargets = document.querySelectorAll(".hero__title, .hero__subtitle");
  if (!panel && !actions && !wordTargets.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  wordTargets.forEach(splitIntoWords);

  const reveal = () => {
    if (panel) panel.classList.add("is-visible");
    if (actions) actions.classList.add("is-visible");
    wordTargets.forEach((el) => el.classList.add("is-visible"));
  };

  if (reducedMotion) {
    reveal();
    return;
  }

  setTimeout(reveal, HERO_REVEAL_DELAY_MS);
}

// Machine à écrire sur l'eyebrow (police mono déjà en place pour cet
// élément). La largeur cible est mesurée en pixels plutôt que
// déduite du nombre de caractères car les polices ne sont pas monospace à
// l'octet près pour tous les caractères (ex. « · »). Le nombre d'étapes de
// l'animation "steps()" est injecté en dur dans l'attribut style plutôt que
// via une custom property CSS : le support de var() comme argument de
// steps() est trop inconsistant selon les navigateurs pour s'y fier ici.
// Démarre au même instant que le reste (voir HERO_REVEAL_DELAY_MS) : la
// mesure de largeur peut se faire tout de suite, opacity:0 n'affecte pas
// la mise en page.
function initEyebrowTypewriter() {
  const el = document.querySelector(".hero__eyebrow");
  if (!el) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Sur mobile, le texte complet ("Chauffage · Plomberie · Électricité ·
  // Énergies renouvelables") ne tient de toute façon pas sur une seule
  // ligne à une largeur d'écran étroite — l'effet machine à écrire impose
  // white-space:nowrap + overflow:hidden, ce qui coupait le texte en plein
  // milieu plutôt que de le laisser passer sur 2 lignes. Sur mobile on
  // affiche donc le texte normal (multi-lignes), sans l'effet.
  const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
  if (reducedMotion || isSmallScreen) return;

  const text = el.textContent.trim();
  const steps = [...text].length;
  const fullWidth = el.getBoundingClientRect().width;

  el.style.setProperty("--eyebrow-final-width", `${fullWidth}px`);
  el.classList.add("hero__eyebrow--typewriter");

  setTimeout(() => {
    el.style.animation = `hero-eyebrow-type 1.6s steps(${steps}, end) forwards`;
  }, HERO_REVEAL_DELAY_MS);
}

document.addEventListener("DOMContentLoaded", () => {
  initHeroIntro();
  initEyebrowTypewriter();
});
