// Extraction des informations de contact / identité d'entreprise.
// Priorité au JSON-LD schema.org LocalBusiness (bien plus fiable), fallback regex FR sinon.

const PHONE_RE = /(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/g;
const SIRET_RE = /\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Beaucoup de sites BTP n'ont pas de JSON-LD LocalBusiness — l'adresse traîne alors en texte
// libre dans le pied de page. Ancré sur un mot-type de voie (rue/route/chemin/etc.) plutôt qu'un
// simple chiffre, pour éviter d'accrocher un numéro sans rapport ailleurs dans la page ; c'est une
// supposition à confirmer, jamais un fait acquis (même logique que le nom de société).
const ADDRESS_RE =
  /(\d{1,5}[^\n,]{0,40}?(?:ROUTE|RUE|AVENUE|CHEMIN|BOULEVARD|IMPASSE|LIEU-DIT|LIEU DIT|ZA|ZI)[^\n,]{0,90}?\d{5}\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ\-]{1,30})/i;

const SOCIAL_DOMAINS = {
  "facebook.com": "facebook",
  "instagram.com": "instagram",
  "linkedin.com": "linkedin",
  "youtube.com": "youtube",
  "tiktok.com": "tiktok",
};

const CERTIFICATION_KEYWORDS = [
  "RGE", "Qualibat", "Qualifelec", "Qualit'EnR", "Qualipac", "Handibat",
  "garantie décennale", "assurance décennale", "Eco Artisan", "Certibat",
];

export async function extractJsonLd(page) {
  return page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const results = [];
    for (const node of nodes) {
      try {
        const parsed = JSON.parse(node.textContent);
        results.push(...(Array.isArray(parsed) ? parsed : [parsed]));
      } catch {
        // JSON-LD malformé — ignoré silencieusement, le fallback regex prendra le relais
      }
    }
    return results;
  });
}

function findLocalBusiness(jsonLdNodes) {
  for (const node of jsonLdNodes) {
    const types = [].concat(node["@type"] || []);
    if (types.some((t) => /LocalBusiness|.*Contractor|HomeAndConstructionBusiness|Organization/i.test(t))) {
      return node;
    }
  }
  return null;
}

export function extractContactFromText(text) {
  const phones = [...new Set((text.match(PHONE_RE) || []).map((p) => p.trim()))];
  const emails = [...new Set(text.match(EMAIL_RE) || [])];
  const siretMatches = (text.match(SIRET_RE) || []).map((s) => s.replace(/\s/g, ""));
  const siret = siretMatches.find((s) => s.length === 14) || null;
  const certifications = CERTIFICATION_KEYWORDS.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase())
  );
  const addressMatch = text.match(ADDRESS_RE);
  const addressGuess = addressMatch ? addressMatch[1].trim().replace(/\s+/g, " ") : null;
  return { phones, emails, siret, certifications, addressGuess };
}

// Piège vécu en test réel : la classe [A-ZÀ-Ÿ] semble "majuscules accentuées" mais la plage de
// points de code À(U+00C0)-Ÿ(U+0178) contient aussi des minuscules accentuées (à, é, î...) — un
// mot comme "à" y matche donc à tort comme s'il commençait une nouvelle Majuscule, allongeant la
// capture au-delà du nom réel ("LÉVÊQUE à" au lieu de "LÉVÊQUE"). On énumère les majuscules
// accentuées explicitement plutôt que de s'appuyer sur une plage Unicode approximative.
const FR_UPPER = "A-ZÀÂÄÇÉÈÊËÏÎÔÖÙÛÜŸ";
const FR_LOWER = "a-zàâäçéèêëïîôöùûüÿ";
const LEGAL_ENTITY_RE = new RegExp(
  `\\b(?:SARL|SAS|SASU|EURL|SA|EI)\\s+((?:[${FR_UPPER}][${FR_LOWER}${FR_UPPER}'.\\-]*\\s*){1,5})`,
  "g"
);

// Renvoie TOUTES les raisons sociales candidates trouvées, pas seulement la première — une page
// "historique" mentionne souvent l'entité fondatrice ET l'entité actuelle après une transmission
// (ex: "SARL X" en 1987 puis "SAS X" après une reprise en 2024). Prendre la première occurrence
// à l'aveugle risquerait de figer un nom légal obsolète comme s'il était la vérité actuelle.
function guessCompanyNamesFromText(text) {
  const matches = [...text.matchAll(LEGAL_ENTITY_RE)].map((m) => m[1].trim().replace(/\s+/g, " "));
  return [...new Set(matches)];
}

function guessCompanyNameFromTitle(title) {
  if (!title) return null;
  // Les <title> de sites vitrine juxtaposent souvent nom + accroche marketing autour d'un
  // séparateur (–, |, -) : on garde le premier segment, le plus susceptible d'être le nom.
  const firstSegment = title.split(/[–|\-]/)[0].trim();
  return firstSegment.length > 2 ? firstSegment : null;
}

export function extractSocialLinks(hrefs) {
  const links = [];
  const seen = new Set();
  for (const href of hrefs) {
    try {
      const url = new URL(href);
      const domain = Object.keys(SOCIAL_DOMAINS).find((d) => url.hostname.includes(d));
      if (domain && !seen.has(url.hostname + url.pathname)) {
        seen.add(url.hostname + url.pathname);
        links.push({ platform: SOCIAL_DOMAINS[domain], url: href });
      }
    } catch {
      // href invalide, ignoré
    }
  }
  return links;
}

export function buildCompanyInfo({ jsonLdNodes, pageText, pageTitle, hrefs, metierGuess }) {
  const localBusiness = findLocalBusiness(jsonLdNodes);
  const fallback = extractContactFromText(pageText);

  const nameFromLd = localBusiness?.name || null;
  const legalEntityCandidates = guessCompanyNamesFromText(pageText);
  const nameFromTitle = guessCompanyNameFromTitle(pageTitle);
  // Ambiguïté = ne jamais choisir en silence. Si plusieurs raisons sociales distinctes sont
  // trouvées (ex: entité fondatrice vs. entité actuelle après transmission/reprise), on ne fige
  // aucune des deux comme LA vérité — on retombe sur le nom commercial du <title> (plus neutre)
  // et on liste les candidats en avertissement pour que le client tranche.
  const nameFromLegalEntity = legalEntityCandidates.length === 1 ? legalEntityCandidates[0] : null;
  const name = nameFromLd || nameFromLegalEntity || nameFromTitle || null;
  const _nameAmbiguousCandidates = legalEntityCandidates.length > 1 ? legalEntityCandidates : null;
  // JSON-LD est une source fiable ; le nom déduit du titre/des mentions légales est une
  // supposition raisonnable mais À CONFIRMER avec le client avant de le considérer acquis
  // (contrat de fidélité de marque : on ne fige jamais un fait non vérifié).
  const _nameNeedsConfirmation = !nameFromLd && !!name;

  const address = localBusiness?.address
    ? [
        localBusiness.address.streetAddress,
        localBusiness.address.postalCode,
        localBusiness.address.addressLocality,
      ]
        .filter(Boolean)
        .join(", ")
    : fallback.addressGuess;
  const _addressNeedsConfirmation = !localBusiness?.address && !!fallback.addressGuess;

  const phoneFromLd = localBusiness?.telephone ? [localBusiness.telephone] : [];
  const emailFromLd = localBusiness?.email ? [localBusiness.email] : [];

  return {
    name,
    _nameNeedsConfirmation,
    _nameAmbiguousCandidates,
    _addressNeedsConfirmation,
    tagline: localBusiness?.description || null,
    metier: metierGuess,
    yearsExperience: null,
    certifications: fallback.certifications,
    serviceArea: localBusiness?.areaServed
      ? [].concat(localBusiness.areaServed).map((a) => (typeof a === "string" ? a : a.name)).join(", ")
      : null,
    contact: {
      phone: [...new Set([...phoneFromLd, ...fallback.phones])],
      email: [...new Set([...emailFromLd, ...fallback.emails])],
      address,
      siret: localBusiness?.taxID || fallback.siret,
      socialLinks: extractSocialLinks(hrefs),
    },
  };
}
