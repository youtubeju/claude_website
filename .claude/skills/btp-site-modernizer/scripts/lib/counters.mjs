// Extraction des "chiffres clés" (années d'expérience, chantiers réalisés, etc.). Beaucoup de
// thèmes WordPress (ex: Be Theme / bt_bb_counter) animent ces compteurs avec un effet "rouleau de
// machine à sous" : chaque position de chiffre affiche les 10 chiffres 0-9 empilés et un CSS
// transform ne révèle que le bon — le texte visible/innerText à un instant T est donc n'importe
// quoi ("0123456789..."), mais la vraie valeur cible est présente dans le DOM via un attribut
// data-digit par position. On la reconstruit directement depuis le DOM plutôt que depuis le texte
// affiché, pour ne jamais avoir à deviner un chiffre.
//
// Autres thèmes/plugins (Elementor, Divi, WPBakery...) exposent directement la valeur cible via un
// attribut data-* simple (data-to, data-value, data-count, data-target, data-end, data-num) sans
// effet de rouleau — on couvre aussi ce cas, plus simple.

const DIRECT_VALUE_ATTRS = ["data-to", "data-value", "data-count", "data-target", "data-end", "data-num"];

export async function extractKeyFigures(page) {
  return page.evaluate((directAttrs) => {
    function tokenize(str) {
      return String(str || "")
        .toLowerCase()
        .split(/[^a-z0-9À-ÿ]+/)
        .filter(Boolean);
    }

    function findLabel(el) {
      // Cherche un texte de légende à proximité qui n'est pas lui-même un chiffre — ex: "ANNÉES
      // D'EXPÉRIENCE" à côté du compteur. Le premier ancêtre dont la classe contient "counter"
      // est souvent TROP étroit (juste le rouleau de chiffres lui-même) : la légende vit
      // généralement 2-3 niveaux plus haut, dans un conteneur "icon"/"item" englobant le
      // compteur ET son texte. On remonte donc plusieurs niveaux plutôt que de s'arrêter au
      // premier match de classe.
      let container = el;
      for (let i = 0; i < 5 && container.parentElement; i += 1) container = container.parentElement;
      const candidates = Array.from(container.querySelectorAll("*")).filter(
        (n) => n !== el && !el.contains(n) && !n.contains(el)
      );
      for (const c of candidates) {
        const text = (c.innerText || c.textContent || "").trim();
        if (text && !/^[\d\s]+$/.test(text) && text.length < 80) return text;
      }
      return null;
    }

    const results = [];
    const seenContainers = new Set();

    // Cas 1 : rouleau de chiffres (data-digit par position, groupés dans un conteneur parent)
    const counterContainers = new Set();
    document.querySelectorAll("[data-digit]").forEach((el) => {
      const container = el.closest("[class*='counter']") || el.parentElement;
      if (container) counterContainers.add(container);
    });

    for (const container of counterContainers) {
      if (seenContainers.has(container)) continue;
      seenContainers.add(container);

      const digitEls = Array.from(container.querySelectorAll("[data-digit]"));
      if (!digitEls.length) continue;

      // Position déduite de la classe pN (p1 = unité, p2 = dizaine, ...) — trie décroissant pour
      // reconstruire le nombre de gauche à droite.
      const withPosition = digitEls
        .map((el) => {
          const posMatch = (el.className.match(/\bp(\d+)\b/) || [])[1];
          return { digit: el.getAttribute("data-digit"), position: posMatch ? Number(posMatch) : null };
        })
        .filter((d) => d.digit !== null && d.position !== null);

      if (!withPosition.length) continue;
      withPosition.sort((a, b) => b.position - a.position);
      const value = withPosition.map((d) => d.digit).join("");
      if (!/^\d+$/.test(value)) continue;

      const label = findLabel(digitEls[0]);
      results.push({ label, value: Number(value), source: "digit-reel" });
    }

    // Cas 2 : attribut direct avec la valeur cible. On exclut les attributs trouvés à l'intérieur
    // d'un widget d'avis (carrousel de témoignages, etc.) — ce sont presque toujours des réglages
    // du widget (nombre de slides visibles...) plutôt qu'un vrai chiffre clé de l'entreprise.
    for (const attr of directAttrs) {
      document.querySelectorAll(`[${attr}]`).forEach((el) => {
        const raw = el.getAttribute(attr);
        if (!raw || !/^\d+$/.test(raw.trim())) return;
        if (el.closest("[class*='review'], [class*='avis'], [class*='testimonial']")) return;
        const label = findLabel(el);
        if (label && /avis|review|testimonial/i.test(label)) return;
        results.push({ label, value: Number(raw.trim()), source: "data-attribute" });
      });
    }

    return results;
  }, DIRECT_VALUE_ATTRS);
}

const EXPERIENCE_KEYWORDS = ["ann", "experience", "expérience"]; // "ann" couvre années/ans

export function pickYearsExperience(keyFigures) {
  const hit = keyFigures.find((f) => {
    const tokens = tokenize(f.label);
    return tokens.some((t) => EXPERIENCE_KEYWORDS.some((kw) => t.includes(kw)));
  });
  return hit ? String(hit.value) : null;

  function tokenize(str) {
    return String(str || "")
      .toLowerCase()
      .split(/[^a-z0-9À-ÿ]+/)
      .filter(Boolean);
  }
}
