# Schéma du dossier d'extraction (`dossier.json`)

Explication humaine du schéma produit par `scripts/extract-site.mjs` (validé formellement contre
`scripts/schema.json`, JSON Schema draft-07). Une validation qui échoue produit un warning, pas un
échec bloquant — un dossier partiel reste exploitable.

## `meta`

Informations sur l'extraction elle-même : `sourceUrl`, `domain`, `extractedAt` (ISO 8601),
`pagesCrawled` (liste des URLs réellement visitées), `toolVersion`, et surtout `warnings[]` — la
liste de tout ce que le script n'a pas réussi à extraire avec confiance (pas de logo net, pas
d'avis trouvés, section non détectée, etc.). **Toujours lire `warnings[]` avant de commencer la
Phase A** — chaque warning devient potentiellement une question à poser au client.

```json
"meta": {
  "sourceUrl": "https://exemple-macon.fr",
  "domain": "exemple-macon.fr",
  "extractedAt": "2026-07-07T10:00:00Z",
  "pagesCrawled": ["https://exemple-macon.fr", "https://exemple-macon.fr/contact"],
  "toolVersion": "1.0.0",
  "warnings": ["Aucun avis client détecté", "Logo trouvé mais résolution basse (120x40px)"]
}
```

## `brand.logo`

`candidates[]` liste tous les logos potentiels trouvés (header, footer, favicon) avec un score de
confiance et leurs dimensions ; `best` pointe vers le fichier jugé le plus fiable. Si `best` est
`null`, c'est un warning à traiter en Phase A (demander le fichier logo au client).

## `brand.palette`

`swatches[]` : chaque couleur a un `hex`, un `role` (dominant/primary/secondary/accent/background/
text), une `source` (logo, capture hero, ou CSS calculé) et une `population` (proportion relative).
Le `method` global indique comment la palette a été obtenue en priorité.

## `brand.typography`

`detectedFontFamilies[]` — toutes les familles de police trouvées dans le CSS calculé du site
source, avec une tentative de séparation `headingFontStack` / `bodyFontStack`. Purement indicatif —
la police du nouveau site n'a pas à copier celle de l'ancien site (voir `styles-palettes-fonts.md`),
mais ça aide à juger si l'ancien choix mérite d'être conservé ou clairement modernisé.

## `company`

Informations d'identité et de contact — `name`, `tagline`, `metier[]` (peut contenir plusieurs
métiers), `yearsExperience`, `certifications[]`, `serviceArea`, et `contact` (téléphones, emails,
adresse, SIRET si trouvé, liens sociaux). Priorité systématique aux données `schema.org`/JSON-LD
`LocalBusiness` quand elles existent — bien plus fiables qu'une extraction heuristique du texte.

## `company.keyFigures[]`

Les "chiffres clés" affichés en compteurs animés (années d'expérience, chantiers réalisés, mètres
posés, etc.). Beaucoup de thèmes animent ces compteurs avec un effet de rouleau qui rend le texte
affiché à l'instant T illisible ("0123456789...") — le script lit directement la valeur cible dans
le DOM (attribut `data-digit` par position, ou un attribut direct type `data-to`/`data-value`)
plutôt que de deviner. Chaque entrée a un `label` (légende trouvée à proximité, peut être `null` si
non détectée), une `value` numérique fiable, et une `source` (`digit-reel` ou `data-attribute`).
Si `company.yearsExperience` est vide, le script tente de le déduire automatiquement d'un chiffre
clé dont le label contient "ans"/"année"/"expérience".

## `sections[]`

Le contenu proprement dit, segmenté par type (`hero`, `services`, `a-propos`, `realisations`,
`avis`, `contact`, `footer`, `other`). Chaque section a un `headline`, un `body[]` (paragraphes),
des `items[]` (ex: liste de services avec titre/description/images), ses propres `images[]`, et
`rawTextBlocks[]` en filet de sécurité si la segmentation heuristique n'a pas su structurer plus
finement. `domSelector` et `screenshot` permettent de retrouver visuellement d'où vient chaque
section sur le site d'origine.

```json
{
  "id": "services",
  "sourcePage": "https://exemple-macon.fr",
  "headline": "Nos prestations",
  "body": [],
  "items": [
    { "title": "Maçonnerie générale", "description": "Fondations, élévation de murs, dalles béton.", "images": ["images/service-1.jpg"] }
  ],
  "images": ["images/service-1.jpg"],
  "rawTextBlocks": []
}
```

## `testimonials[]`

Chaque avis a `author`, `sourcePlatform` (google/site-native/facebook/unknown), `rating`, `quote`
(texte **verbatim**, jamais reformulé), `date` si disponible, et `extractionMethod` — `dom-text` si
extrait directement du texte de la page, ou `ocr-flagged-for-review` si l'avis est capturé en image
(ex: capture d'écran d'un avis Google intégrée visuellement) et nécessite une vérification humaine
avant d'être repris tel quel.

## `images.manifest[]`

Toutes les images téléchargées, dédupliquées par hash (`sha1`), avec leur URL d'origine,
dimensions, les sections où elles sont utilisées, et leur texte alternatif d'origine s'il existe.
Sert à retrouver rapidement quelle image vient d'où lors de la construction du nouveau site.
