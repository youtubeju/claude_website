// Détection des avis clients / témoignages. Deux voies : texte DOM directement exploitable,
// ou image (capture d'avis Google/Facebook intégrée en visuel) flaggée pour vérification humaine
// avant réutilisation (pas d'OCR automatique — trop de risque de déformer une citation verbatim).
//
// Piège vécu en test réel : un matching par sous-chaîne naïf sur les classes CSS (ex: "review")
// matche aussi "preview" (bt_bb_fe_preview_toggle) et peut remonter jusqu'au <body> entier — qui
// contient alors TOUT le texte de la page, transformé en un faux "avis" géant. D'où : (1) un
// matching par token exact plutôt que par sous-chaîne, (2) l'exclusion explicite de <body>/<html>,
// (3) la préférence pour les éléments les plus imbriqués (les avis individuels) plutôt que le
// conteneur englobant, (4) un plafond de longueur en garde-fou final.

const REVIEW_KEYWORDS = ["review", "avis", "testimonial", "temoignage"];
const MAX_TESTIMONIAL_LENGTH = 1000; // au-delà, très probablement un faux positif de conteneur

// Beaucoup de widgets d'avis (Google/Trustindex/etc.) rendent auteur + date relative + citation
// dans le même bloc de texte sans séparation DOM propre — on les retrouve donc concaténés dans
// `innerText` (ex: "Didier C. 2 months ago Sérieux, professionnels..."). On retire cette entête
// de la citation pour ne garder que le texte de l'avis lui-même, jamais reformulé.
const RELATIVE_DATE_RE = /^\s*(?:\d+\s+(?:day|days|week|weeks|month|months|year|years)\s+ago|il y a\s+\d+\s+\S+)\s*/i;

function stripAuthorAndDatePrefix(text, author) {
  let quote = text;
  if (author && quote.startsWith(author)) {
    quote = quote.slice(author.length).trim();
  }
  return quote.replace(RELATIVE_DATE_RE, "").trim();
}

const PLATFORM_HINTS = [
  { platform: "google", markers: ["google", "g2crowd"] },
  { platform: "facebook", markers: ["facebook", "fb-review"] },
];

function guessPlatform(haystack) {
  const lower = haystack.toLowerCase();
  const hit = PLATFORM_HINTS.find(({ markers }) => markers.some((m) => lower.includes(m)));
  return hit ? hit.platform : "site-native";
}

export async function extractTestimonials(page, pageUrl) {
  const raw = await page.evaluate(
    ({ keywords, maxLen }) => {
      function tokenize(str) {
        return String(str || "")
          .toLowerCase()
          .split(/[^a-z0-9À-ÿ]+/)
          .filter(Boolean);
      }

      function matchesKeyword(el) {
        const tokens = [...tokenize(el.className), ...tokenize(el.id)];
        return tokens.some((t) => keywords.some((kw) => t === kw || t === kw + "s"));
      }

      const containers = new Set();
      for (const el of document.querySelectorAll("[class], [id]")) {
        if (el === document.body || el === document.documentElement) continue;
        if (matchesKeyword(el)) containers.add(el);
      }

      const list = Array.from(containers);
      // Préfère les éléments les plus imbriqués (avis individuels) : on retire tout élément qui
      // contient lui-même un autre élément candidat (c'est alors un conteneur englobant, pas un
      // avis unique).
      const leaves = list.filter((el) => !list.some((other) => other !== el && el.contains(other)));

      return leaves.slice(0, 30).map((el) => {
        const text = (el.innerText || "").trim().replace(/\s+/g, " ");
        const img = el.querySelector("img");
        const starEls = el.querySelectorAll("[class*='star'], [class*='rating']");
        const classAndId = `${el.className} ${el.id}`;
        const authorEl = el.querySelector("[class*='author'], [class*='name'], cite, strong");
        return {
          text: text.slice(0, maxLen + 1),
          textOverflowed: text.length > maxLen,
          classAndId,
          hasEmbeddedImageOnly: text.length < 5 && !!img,
          screenshotHint: img ? img.currentSrc || img.src : null,
          starCount: starEls.length,
          author: authorEl ? authorEl.innerText.trim() : null,
        };
      });
    },
    { keywords: REVIEW_KEYWORDS, maxLen: MAX_TESTIMONIAL_LENGTH }
  );

  return raw
    .filter((r) => !r.textOverflowed) // garde-fou : un "avis" plus long que la limite est presque
    // certainement un conteneur mal isolé — mieux vaut l'ignorer que produire une fausse citation
    .filter((r) => r.text.length > 10 || r.hasEmbeddedImageOnly)
    .map((r) => ({
      author: r.author,
      sourcePlatform: guessPlatform(r.classAndId + " " + pageUrl),
      rating: r.starCount > 0 ? r.starCount : null,
      quote: r.hasEmbeddedImageOnly ? "" : stripAuthorAndDatePrefix(r.text, r.author),
      date: null,
      extractionMethod: r.hasEmbeddedImageOnly ? "ocr-flagged-for-review" : "dom-text",
      screenshot: r.hasEmbeddedImageOnly ? r.screenshotHint : null,
    }))
    .filter((r) => r.quote.length > 0 || r.extractionMethod === "ocr-flagged-for-review");
}
