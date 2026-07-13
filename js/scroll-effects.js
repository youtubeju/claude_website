function splitIntoChars(el, className) {
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.textContent = "";
  [...text].forEach((char, i) => {
    const span = document.createElement("span");
    span.className = className;
    span.style.setProperty("--i", i);
    span.textContent = char === " " ? " " : char;
    el.appendChild(span);
  });
}

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

// Étoiles d'avis : juste le découpage en spans, l'animation (rotation 3D)
// se déclenche via .reveal.is-visible sur l'ancêtre commun — voir reviews.css.
function initStarsFlip() {
  const stars = document.querySelector(".reviews__stars");
  if (!stars) return;
  splitIntoChars(stars, "flip-char");
}

// Titre "chiffres clés" : mots qui se dévoilent avec un flou au scroll,
// même mécanique que le titre du hero (voir js/hero-intro.js) mais
// déclenchée par IntersectionObserver puisque la section est sous la ligne
// de flottaison.
function initWordBlurReveal() {
  const targets = document.querySelectorAll(".word-blur-reveal");
  if (!targets.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  targets.forEach(splitIntoWords);

  if (reducedMotion) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

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
  targets.forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  initStarsFlip();
  initWordBlurReveal();
});
