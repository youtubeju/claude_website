const TYPE_MIN_MS = 28;
const TYPE_MAX_MS = 55;

function initTypewriter() {
  const titles = document.querySelectorAll(".type-write");
  if (!titles.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prepared = new Map();

  titles.forEach((title) => {
    const text = title.textContent;
    title.setAttribute("aria-label", text);
    title.textContent = "";

    const chars = [];
    text.split(" ").forEach((word, wi, words) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "word";
      [...word].forEach((char) => {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = char;
        wordSpan.appendChild(span);
        chars.push(span);
      });
      title.appendChild(wordSpan);
      if (wi < words.length - 1) {
        title.appendChild(document.createTextNode(" "));
      }
    });
    prepared.set(title, chars);
  });

  if (reducedMotion) {
    prepared.forEach((chars) => chars.forEach((c) => c.classList.add("is-visible")));
    return;
  }

  const typeTitle = (title) => {
    const chars = prepared.get(title);
    let i = 0;
    const step = () => {
      if (i >= chars.length) return;
      chars[i].classList.add("is-visible");
      i++;
      window.setTimeout(step, Math.random() * (TYPE_MAX_MS - TYPE_MIN_MS) + TYPE_MIN_MS);
    };
    step();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          typeTitle(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  titles.forEach((title) => observer.observe(title));
}

document.addEventListener("DOMContentLoaded", initTypewriter);
