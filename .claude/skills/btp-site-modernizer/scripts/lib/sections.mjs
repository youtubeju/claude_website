// Segmentation heuristique d'une page en sections sémantiques (hero/services/à propos/etc.)
// Stratégie : repérer les landmarks DOM (header/main/section/footer), puis classer chaque bloc
// par mots-clés français dans son titre/texte. Fallback : blocs de texte brut non classés.

const SECTION_KEYWORDS = {
  services: [
    "service", "prestation", "notre expertise", "nos métiers", "ce que nous faisons",
    "domaines d'intervention", "spécialités",
  ],
  "a-propos": [
    "à propos", "qui sommes-nous", "notre histoire", "notre entreprise", "présentation",
    "notre équipe", "qui nous sommes",
  ],
  realisations: [
    "réalisation", "chantier", "portfolio", "nos travaux", "projets", "galerie",
  ],
  avis: [
    "avis", "témoignage", "ce que disent nos clients", "satisfaction client", "nos clients parlent",
  ],
  contact: [
    "contact", "nous contacter", "devis", "demande de devis", "nous trouver", "coordonnées",
  ],
};

function classify(headingText = "", bodyText = "") {
  const haystack = `${headingText} ${bodyText}`.toLowerCase();
  for (const [id, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some((kw) => haystack.includes(kw))) return id;
  }
  return "other";
}

export async function extractSections(page, pageUrl, isFirstPage) {
  const blocks = await page.evaluate(() => {
    function textOf(el) {
      return (el?.innerText || "").trim().replace(/\s+/g, " ");
    }

    const landmarks = Array.from(
      document.querySelectorAll("section, main > div, header, footer, [class*='section'], [id*='section']")
    );

    // Dédoublonne les landmarks imbriqués (ne garder que les plus externes visibles)
    const top = landmarks.filter((el) => !landmarks.some((other) => other !== el && other.contains(el)));

    return top.slice(0, 40).map((el) => {
      const heading = el.querySelector("h1, h2, h3");
      const paragraphs = Array.from(el.querySelectorAll("p")).map((p) => textOf(p)).filter(Boolean);
      // Les <li> d'un <header>/<nav> sont quasi toujours des liens de menu, pas du contenu — les
      // compter comme "items" fait passer un menu de navigation pour une liste de services.
      const isNavLike = el.tagName === "HEADER" || !!el.querySelector(":scope > nav, :scope nav");
      const listItems = isNavLike
        ? []
        : Array.from(el.querySelectorAll("li")).map((li) => textOf(li)).filter(Boolean);
      const images = Array.from(el.querySelectorAll("img"))
        .map((img) => img.currentSrc || img.src)
        .filter(Boolean);
      const rect = el.getBoundingClientRect();
      const isHeroCandidate = el.tagName === "HEADER" || rect.top < 200;

      return {
        tagOrClass: el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : ""),
        headline: heading ? textOf(heading) : null,
        body: paragraphs.slice(0, 20),
        listItems: listItems.slice(0, 30),
        images: [...new Set(images)].slice(0, 20),
        isHeroCandidate,
      };
    });
  });

  const sections = [];
  let heroAssigned = false;

  for (const block of blocks) {
    const bodyText = block.body.join(" ");
    let id = classify(block.headline, bodyText + " " + block.listItems.join(" "));

    if (id === "other" && isFirstPage && block.isHeroCandidate && !heroAssigned) {
      id = "hero";
    }
    if (id === "hero") heroAssigned = true;

    if (id === "other" && !block.headline && block.body.length === 0 && block.listItems.length === 0) {
      continue; // bloc vide, probablement un wrapper de mise en page sans contenu propre
    }

    sections.push({
      id,
      sourcePage: pageUrl,
      domSelector: block.tagOrClass || null,
      screenshot: null,
      headline: block.headline,
      body: block.body,
      items: block.listItems.map((text) => ({ title: text, description: null, images: [] })),
      images: block.images,
      rawTextBlocks: id === "other" ? block.body : [],
    });
  }

  return sections;
}
