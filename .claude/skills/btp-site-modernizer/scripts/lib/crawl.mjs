// Navigation Playwright + gestion des bandeaux de consentement cookies (fréquents sur les
// vieux sites BTP et qui masquent le contenu tant qu'ils ne sont pas fermés).

const CONSENT_BUTTON_TEXTS = [
  "Accepter", "Accepter tout", "Accepter et fermer", "J'accepte", "Tout accepter",
  "Continuer sans accepter", "OK", "Accept", "Accept all", "Agree",
];

export async function dismissCookieConsent(page, customSelector) {
  if (customSelector) {
    try {
      await page.click(customSelector, { timeout: 3000 });
      return true;
    } catch {
      // sélecteur personnalisé introuvable — on retente les heuristiques par défaut
    }
  }

  for (const text of CONSENT_BUTTON_TEXTS) {
    try {
      const button = page.getByRole("button", { name: text, exact: false }).first();
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click({ timeout: 3000 });
        return true;
      }
    } catch {
      // ce texte de bouton n'est pas présent sur cette page — on continue la liste
    }
  }
  return false;
}

export async function discoverInternalPages(page, baseUrl, maxPages) {
  const origin = new URL(baseUrl).origin;
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]")).map((a) => a.href)
  );

  const internal = [...new Set(hrefs)]
    .filter((href) => {
      try {
        const url = new URL(href);
        return (
          url.origin === origin &&
          !/\.(pdf|jpg|jpeg|png|zip|docx?|xlsx?)$/i.test(url.pathname) &&
          !url.hash
        );
      } catch {
        return false;
      }
    })
    .slice(0, Math.max(0, maxPages - 1));

  return [baseUrl, ...internal];
}

export async function collectAllHrefs(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll("a[href]")).map((a) => a.href));
}

export async function collectAllImageUrls(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .map((img) => img.currentSrc || img.src)
      .filter(Boolean)
  );
}

export async function gotoWithRetry(page, url, timeout) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout });
  } catch {
    // networkidle jamais atteint (site avec polling/analytics permanent) — on retente en mode
    // plus permissif plutôt que d'échouer toute l'extraction pour cette page
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
  }
}
