#!/usr/bin/env node
// Extraction structurée d'un vieux site BTP en dossier.json — voir
// references/extraction-schema.md (dans le skill) pour la documentation du schéma produit,
// et README.md (ce dossier) pour l'usage en ligne de commande.

import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

import { dismissCookieConsent, discoverInternalPages, collectAllHrefs, collectAllImageUrls, gotoWithRetry } from "./lib/crawl.mjs";
import { extractSections } from "./lib/sections.mjs";
import { detectLogoCandidates, pickBestLogo } from "./lib/logo.mjs";
import { extractPaletteFromLogo, extractPaletteFromScreenshot, extractComputedCssColors, mergePalette } from "./lib/palette.mjs";
import { extractTestimonials } from "./lib/testimonials.mjs";
import { downloadAndDedupeImages, buildSectionsByImageUrlMap } from "./lib/images.mjs";
import { extractJsonLd, buildCompanyInfo } from "./lib/contact.mjs";
import { extractKeyFigures, pickYearsExperience } from "./lib/counters.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_VERSION = "1.0.0";

const METIER_KEYWORDS = {
  "maçonnerie / gros-œuvre": ["maçon", "gros œuvre", "gros-œuvre", "fondation", "béton"],
  "couverture / charpente": ["couvreur", "couverture", "charpent", "toiture", "zinguerie"],
  "plomberie / chauffage": ["plomb", "chauffagiste", "chauffage", "sanitaire", "climatisation"],
  électricité: ["électric", "électricien"],
  "rénovation globale": ["rénovation", "second œuvre", "second-œuvre"],
  "paysagiste / VRD": ["paysagiste", "espace vert", "VRD", "terrassement", "aménagement extérieur"],
  menuiserie: ["menuiserie", "menuisier", "agencement"],
  "peinture / ravalement": ["peintre", "peinture", "ravalement", "façade"],
  piscine: ["piscine", "piscinier"],
  "serrurerie / métallerie": ["serrur", "métallerie", "ferronnerie"],
};

function parseArgs(argv) {
  const [url, ...rest] = argv;
  if (!url) {
    console.error("Usage: node extract-site.mjs <url> [--out <dir>] [--max-pages 6] [--screenshot] [--lang fr] [--timeout 45000] [--cookie-consent-selector <css>]");
    process.exit(1);
  }
  const opts = {
    url,
    out: null,
    maxPages: 6,
    screenshot: true,
    lang: "fr",
    timeout: 45000,
    cookieConsentSelector: null,
  };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--out") opts.out = rest[++i];
    else if (arg === "--max-pages") opts.maxPages = Number(rest[++i]);
    else if (arg === "--screenshot") opts.screenshot = true;
    else if (arg === "--no-screenshot") opts.screenshot = false;
    else if (arg === "--lang") opts.lang = rest[++i];
    else if (arg === "--timeout") opts.timeout = Number(rest[++i]);
    else if (arg === "--cookie-consent-selector") opts.cookieConsentSelector = rest[++i];
  }
  if (!opts.out) {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const date = new Date().toISOString().slice(0, 10);
    opts.out = `./extraction-${domain}-${date}`;
  }
  return opts;
}

function guessMetiers(allText) {
  const lower = allText.toLowerCase();
  const found = [];
  for (const [metier, keywords] of Object.entries(METIER_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) found.push(metier);
  }
  return found;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const warnings = [];
  const outDir = path.resolve(opts.out);
  const imagesDir = path.join(outDir, "images");
  const screenshotsDir = path.join(outDir, "screenshots");
  const logoDir = path.join(outDir, "logo");

  await mkdir(outDir, { recursive: true });
  await mkdir(screenshotsDir, { recursive: true });
  await mkdir(logoDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const pagesCrawled = [];
  const allSections = [];
  const allTestimonials = [];
  const allHrefs = [];
  const allJsonLd = [];
  const allImageUrls = [];
  const allKeyFigures = [];
  let allText = "";
  let logoCandidates = [];
  let favicon = null;
  let heroScreenshotPath = null;
  let logoLocalPath = null;
  let pageTitle = null;

  try {
    await gotoWithRetry(page, opts.url, opts.timeout);
  } catch (err) {
    console.error(`Impossible de charger ${opts.url}: ${err.message}`);
    warnings.push(`Échec du chargement initial de la page — extraction manuelle nécessaire (${err.message})`);
    await writeDossierAndExit({ opts, warnings, pagesCrawled, allSections, allTestimonials, allHrefs, allJsonLd, allImageUrls: [], allText: "", logoCandidates: [], favicon: null, outDir, imagesDir, page: null, browser });
    return;
  }

  await dismissCookieConsent(page, opts.cookieConsentSelector);

  const pagesToVisit = await discoverInternalPages(page, opts.url, opts.maxPages);

  for (let i = 0; i < pagesToVisit.length; i += 1) {
    const url = pagesToVisit[i];
    const isFirstPage = i === 0;
    try {
      if (!isFirstPage) {
        await gotoWithRetry(page, url, opts.timeout);
        await dismissCookieConsent(page, opts.cookieConsentSelector);
      }
      pagesCrawled.push(url);

      const [sections, testimonials, hrefs, jsonLdNodes, imageUrls, bodyText, keyFigures] = await Promise.all([
        extractSections(page, url, isFirstPage),
        extractTestimonials(page, url),
        collectAllHrefs(page),
        extractJsonLd(page),
        collectAllImageUrls(page),
        page.evaluate(() => document.body.innerText || ""),
        extractKeyFigures(page),
      ]);

      allSections.push(...sections);
      allTestimonials.push(...testimonials);
      allHrefs.push(...hrefs);
      allJsonLd.push(...jsonLdNodes);
      allImageUrls.push(...imageUrls);
      allKeyFigures.push(...keyFigures);
      allText += " " + bodyText;

      if (isFirstPage) {
        pageTitle = await page.title();
        const logoResult = await detectLogoCandidates(page, opts.url);
        logoCandidates = logoResult.candidates;
        favicon = logoResult.favicon;

        if (opts.screenshot) {
          heroScreenshotPath = path.join(screenshotsDir, "hero.png");
          await page.screenshot({ path: heroScreenshotPath, clip: { x: 0, y: 0, width: 1440, height: 900 } }).catch(() => {
            warnings.push("Capture d'écran du hero impossible");
          });
        }
      }

      if (opts.screenshot) {
        const slug = url.replace(/[^a-z0-9]/gi, "-").slice(0, 60);
        await page.screenshot({ path: path.join(screenshotsDir, `page-${slug}.png`), fullPage: true }).catch(() => {});
      }
    } catch (err) {
      warnings.push(`Échec de l'extraction de la page ${url}: ${err.message}`);
    }
  }

  const bestLogoUrl = pickBestLogo(logoCandidates);
  if (!bestLogoUrl) warnings.push("Aucun logo fiable détecté — demander le fichier logo au client");
  if (allTestimonials.length === 0) warnings.push("Aucun avis client détecté — demander au client s'il en a ailleurs (Google, Facebook)");

  if (bestLogoUrl) {
    try {
      const response = await page.request.get(bestLogoUrl, { timeout: 15000 });
      if (response.ok()) {
        const ext = bestLogoUrl.split(".").pop().split("?")[0] || "png";
        logoLocalPath = path.join(logoDir, `logo.${ext}`);
        await writeFile(logoLocalPath, await response.body());
      }
    } catch {
      warnings.push("Échec du téléchargement du logo détecté");
    }
  }

  const metierGuess = guessMetiers(allText);
  if (metierGuess.length === 0) warnings.push("Corps de métier non déterminé automatiquement — à clarifier avec le client");

  const [paletteFromLogo, paletteFromScreenshot, paletteFromCss] = await Promise.all([
    extractPaletteFromLogo(logoLocalPath),
    extractPaletteFromScreenshot(heroScreenshotPath),
    extractComputedCssColors(page),
  ]);
  const palette = mergePalette({ fromLogo: paletteFromLogo, fromScreenshot: paletteFromScreenshot, fromCss: paletteFromCss });
  if (palette.swatches.length === 0) warnings.push("Palette de couleurs vide — vérifier manuellement les couleurs de marque");

  const typography = await page.evaluate(() => {
    const families = new Set();
    document.querySelectorAll("h1, h2, h3, p, body").forEach((el) => {
      families.add(getComputedStyle(el).fontFamily);
    });
    return { detectedFontFamilies: [...families] };
  });

  const sectionsByImageUrl = buildSectionsByImageUrlMap(allSections);
  const imageManifest = await downloadAndDedupeImages({
    page,
    urls: allImageUrls,
    outDir: imagesDir,
    sectionsByImageUrl,
  });

  const companyInfo = buildCompanyInfo({ jsonLdNodes: allJsonLd, pageText: allText, pageTitle, hrefs: allHrefs, metierGuess });
  if (!companyInfo.name) {
    warnings.push("Nom de l'entreprise non détecté automatiquement — à confirmer avec le client");
  } else if (companyInfo._nameNeedsConfirmation) {
    warnings.push(`Nom de l'entreprise déduit heuristiquement ("${companyInfo.name}") — à confirmer avec le client, pas issu de données structurées fiables`);
  }
  if (companyInfo._nameAmbiguousCandidates) {
    warnings.push(
      `Plusieurs raisons sociales trouvées sur le site (${companyInfo._nameAmbiguousCandidates.join(" / ")}) — probablement une entité fondatrice vs. une entité actuelle après reprise/transmission. À trancher avec le client, aucune n'a été retenue par défaut.`
    );
  }
  if (!companyInfo.contact.address) {
    warnings.push("Adresse non détectée automatiquement — à demander au client");
  } else if (companyInfo._addressNeedsConfirmation) {
    warnings.push(`Adresse déduite heuristiquement ("${companyInfo.contact.address}") — à confirmer avec le client, pas issue de données structurées fiables`);
  }
  delete companyInfo._nameNeedsConfirmation;
  delete companyInfo._nameAmbiguousCandidates;
  delete companyInfo._addressNeedsConfirmation;

  const dedupedKeyFigures = [];
  const seenFigureKeys = new Set();
  for (const fig of allKeyFigures) {
    const key = `${fig.label}::${fig.value}`;
    if (seenFigureKeys.has(key)) continue;
    seenFigureKeys.add(key);
    dedupedKeyFigures.push(fig);
  }
  companyInfo.keyFigures = dedupedKeyFigures;
  const yearsFromCounter = pickYearsExperience(dedupedKeyFigures);
  if (yearsFromCounter && !companyInfo.yearsExperience) {
    companyInfo.yearsExperience = yearsFromCounter;
  }
  if (dedupedKeyFigures.length === 0) {
    warnings.push("Aucun chiffre clé (années d'expérience, chantiers réalisés...) détecté — à demander au client si le site en affichait");
  }

  await browser.close();

  const dossier = {
    meta: {
      sourceUrl: opts.url,
      domain: new URL(opts.url).hostname,
      extractedAt: new Date().toISOString(),
      pagesCrawled,
      toolVersion: TOOL_VERSION,
      warnings,
    },
    brand: {
      logo: {
        candidates: logoCandidates,
        best: bestLogoUrl && logoLocalPath ? path.relative(outDir, logoLocalPath) : null,
        favicon,
      },
      palette,
      typography: {
        detectedFontFamilies: typography.detectedFontFamilies,
        headingFontStack: typography.detectedFontFamilies[0] || null,
        bodyFontStack: typography.detectedFontFamilies[1] || typography.detectedFontFamilies[0] || null,
      },
    },
    company: companyInfo,
    sections: allSections,
    testimonials: allTestimonials,
    images: { manifest: imageManifest },
  };

  await validateAndWrite(dossier, outDir);
}

async function validateAndWrite(dossier, outDir) {
  const schema = JSON.parse(await readFile(path.join(__dirname, "schema.json"), "utf-8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(dossier);

  if (!valid) {
    dossier.meta.warnings.push(
      `Validation du schéma incomplète (${validate.errors.length} écart(s)) — dossier partiel mais exploitable`
    );
    console.warn("Avertissements de validation:", JSON.stringify(validate.errors, null, 2));
  }

  await writeFile(path.join(outDir, "dossier.json"), JSON.stringify(dossier, null, 2));
  await writeFile(path.join(outDir, "extraction-report.md"), buildReport(dossier));

  console.log(`Extraction terminée: ${outDir}`);
  console.log(`Pages visitées: ${dossier.meta.pagesCrawled.length}`);
  console.log(`Sections détectées: ${dossier.sections.length}`);
  console.log(`Avis trouvés: ${dossier.testimonials.length}`);
  console.log(`Images téléchargées: ${dossier.images.manifest.length}`);
  if (dossier.meta.warnings.length) {
    console.log(`\nAvertissements (${dossier.meta.warnings.length}):`);
    dossier.meta.warnings.forEach((w) => console.log(`  - ${w}`));
  }
}

async function writeDossierAndExit({ opts, warnings, pagesCrawled, allSections, allTestimonials, outDir, browser }) {
  const dossier = {
    meta: {
      sourceUrl: opts.url,
      domain: new URL(opts.url).hostname,
      extractedAt: new Date().toISOString(),
      pagesCrawled,
      toolVersion: TOOL_VERSION,
      warnings,
    },
    brand: { logo: { candidates: [], best: null, favicon: null }, palette: { method: "mixed", swatches: [] }, typography: { detectedFontFamilies: [], headingFontStack: null, bodyFontStack: null } },
    company: { name: null, tagline: null, metier: [], yearsExperience: null, certifications: [], serviceArea: null, keyFigures: [], contact: { phone: [], email: [], address: null, siret: null, socialLinks: [] } },
    sections: allSections,
    testimonials: allTestimonials,
    images: { manifest: [] },
  };
  await validateAndWrite(dossier, outDir);
  if (browser) await browser.close();
}

function buildReport(dossier) {
  const lines = [];
  lines.push(`# Rapport d'extraction — ${dossier.meta.domain}`);
  lines.push("");
  lines.push(`Extrait le ${dossier.meta.extractedAt} depuis ${dossier.meta.sourceUrl}.`);
  lines.push(`Pages visitées: ${dossier.meta.pagesCrawled.length}`);
  lines.push("");
  lines.push(`## Entreprise`);
  lines.push(`- Nom: ${dossier.company.name || "_non détecté_"}`);
  lines.push(`- Métier(s) détecté(s): ${dossier.company.metier.join(", ") || "_non déterminé_"}`);
  lines.push(`- Certifications trouvées: ${dossier.company.certifications.join(", ") || "_aucune_"}`);
  lines.push(`- Années d'expérience: ${dossier.company.yearsExperience || "_non détecté_"}`);
  lines.push(
    `- Chiffres clés: ${dossier.company.keyFigures.map((f) => `${f.label || "?"} = ${f.value}`).join(", ") || "_aucun_"}`
  );
  lines.push("");
  lines.push(`## Marque`);
  lines.push(`- Logo: ${dossier.brand.logo.best ? dossier.brand.logo.best : "_non trouvé avec confiance suffisante_"}`);
  lines.push(`- Couleurs (${dossier.brand.palette.method}): ${dossier.brand.palette.swatches.map((s) => s.hex).join(", ") || "_aucune_"}`);
  lines.push("");
  lines.push(`## Contenu`);
  lines.push(`- Sections détectées: ${dossier.sections.length} (${dossier.sections.map((s) => s.id).join(", ")})`);
  lines.push(`- Avis clients: ${dossier.testimonials.length}`);
  lines.push(`- Images téléchargées: ${dossier.images.manifest.length}`);
  lines.push("");
  if (dossier.meta.warnings.length) {
    lines.push(`## Avertissements — à traiter en Phase A`);
    dossier.meta.warnings.forEach((w) => lines.push(`- ${w}`));
  } else {
    lines.push(`## Avertissements`);
    lines.push(`Aucun.`);
  }
  return lines.join("\n") + "\n";
}

main().catch((err) => {
  console.error("Erreur fatale pendant l'extraction:", err);
  process.exit(1);
});
