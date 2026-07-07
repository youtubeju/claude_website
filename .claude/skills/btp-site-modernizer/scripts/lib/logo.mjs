// Détection heuristique du logo : images dans le header/nav avec alt/class/id évoquant "logo",
// croisées avec la favicon comme repère complémentaire.
//
// Piège vécu en test réel : un bandeau de consentement cookies (CookieYes, Axeptio,
// Tarteaucitron, OneTrust, Cookiebot, Complianz, Borlabs...) affiche souvent son propre petit
// logo "powered by X" quelque part dans le DOM, avec un alt du type "Cookieyes logo" — cette
// image matchait notre heuristique aussi bien (voire mieux, injectée tôt dans le DOM) que le
// vrai logo du client, et gagnait le tie-break. Deux garde-fous ajoutés : (1) exclusion explicite
// des domaines/mots-clés de widgets de consentement connus, (2) net avantage aux images hébergées
// sur le même domaine que le site (un vrai logo de marque vit presque toujours en same-origin,
// contrairement au logo d'un plugin tiers chargé depuis un CDN externe).

const CONSENT_WIDGET_PATTERNS = [
  "cookieyes", "cdn-cookieyes", "axeptio", "tarteaucitron", "onetrust", "cookiebot",
  "complianz", "borlabs", "iubenda", "didomi", "quantcast", "cookie-consent", "cookieconsent",
];

export async function detectLogoCandidates(page, siteUrl) {
  const siteOrigin = new URL(siteUrl).origin;

  return page.evaluate(
    ({ siteOrigin, consentPatterns }) => {
      function isConsentWidgetAsset(img) {
        const haystack = `${img.src} ${img.alt} ${img.className} ${img.id}`.toLowerCase();
        return consentPatterns.some((p) => haystack.includes(p));
      }

      function isLikelyLogo(img) {
        const haystack = `${img.alt} ${img.className} ${img.id} ${img.src}`.toLowerCase();
        const inHeaderOrNav = !!img.closest("header, nav, [class*='header'], [class*='navbar']");
        const mentionsLogo = haystack.includes("logo");
        return inHeaderOrNav || mentionsLogo;
      }

      function isSameOrigin(src) {
        try {
          return new URL(src, document.baseURI).origin === siteOrigin;
        } catch {
          return false;
        }
      }

      const candidates = [];
      const seen = new Set();

      for (const img of document.querySelectorAll("img")) {
        if (isConsentWidgetAsset(img)) continue; // jamais un candidat, quel que soit le score
        if (!isLikelyLogo(img)) continue;
        const src = img.currentSrc || img.src;
        if (!src || seen.has(src)) continue;
        seen.add(src);

        const inHeader = !!img.closest("header, [class*='header'], nav, [class*='navbar']");
        const inFooter = !!img.closest("footer, [class*='footer']");
        const mentionsLogo = `${img.alt} ${img.className} ${img.id}`.toLowerCase().includes("logo");
        const sameOrigin = isSameOrigin(src);

        const altIsRawUrl = /^https?:\/\//i.test(img.alt || ""); // alt = l'URL elle-même = quasi jamais un vrai logo
        const isBroken = img.naturalWidth === 0 && img.naturalHeight === 0; // pas (encore) chargée/décodée

        let confidence = 0.2;
        if (inHeader) confidence += 0.25;
        if (mentionsLogo) confidence += 0.25;
        if (sameOrigin) confidence += 0.3; // signal le plus fiable : la marque héberge son propre logo
        if (img.naturalWidth > 0 && img.naturalWidth < 100) confidence -= 0.3; // trop petit pour un vrai logo de marque
        if (altIsRawUrl) confidence -= 0.2;
        if (isBroken) confidence -= 0.25;

        candidates.push({
          src,
          confidence: Math.max(0, Math.min(1, confidence)),
          location: inHeader ? "header" : inFooter ? "footer" : "other",
          width: img.naturalWidth || 0,
          height: img.naturalHeight || 0,
          altText: img.alt || null,
        });
      }

      const faviconLink = document.querySelector(
        "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
      );
      const favicon = faviconLink ? faviconLink.href : null;

      candidates.sort((a, b) => b.confidence - a.confidence);
      return { candidates, favicon };
    },
    { siteOrigin, consentPatterns: CONSENT_WIDGET_PATTERNS }
  );
}

export function pickBestLogo(candidates) {
  if (!candidates.length) return null;
  const best = candidates[0];
  return best.confidence >= 0.5 ? best.src : null;
}
