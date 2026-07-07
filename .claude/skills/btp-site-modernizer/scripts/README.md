# extract-site — script d'extraction de sites BTP

Extrait un vieux site BTP en un dossier structuré (`dossier.json` + rapport + assets) utilisé en
Phase A du pipeline `btp-modernization-orchestrator`. Voir `../references/extraction-schema.md`
pour la documentation complète du schéma de sortie.

## Installation (une seule fois)

```bash
cd ~/.claude/skills/btp-site-modernizer/scripts
npm install
npx playwright install chromium
```

## Usage

```bash
node extract-site.mjs <url> \
  --out <dir>                       # défaut: ./extraction-<domaine>-<date>/
  --max-pages 6                     # nombre de pages internes explorées
  --screenshot                      # captures d'écran (activé par défaut)
  --lang fr
  --timeout 45000                   # ms, par navigation de page
  --cookie-consent-selector <css>   # override du sélecteur de bandeau cookie
```

Exemple :

```bash
node extract-site.mjs https://exemple-macon.fr --out ./extraction-exemple-macon
```

## Sortie

```
extraction-<domaine>-<date>/
├── dossier.json            # le dossier structuré (voir extraction-schema.md)
├── extraction-report.md    # résumé lisible + avertissements à traiter
├── images/                 # images téléchargées, dédupliquées
├── screenshots/             # captures pleine page + hero
└── logo/                   # logo téléchargé si détecté avec confiance suffisante
```

## Limites connues

- Pas d'OCR automatique sur les avis intégrés en image (capture d'écran d'avis Google collée en
  visuel) — ces avis sont flagués `ocr-flagged-for-review` et doivent être vérifiés/retranscrits
  manuellement avant réutilisation, pour ne jamais déformer une citation verbatim.
- La segmentation en sections est heuristique (mots-clés français + landmarks DOM) — elle peut
  classer une section en `other` sur un site à la structure inhabituelle ; dans ce cas
  `rawTextBlocks` conserve le texte brut pour traitement manuel.
- Les sites très protégés contre le scraping (Cloudflare challenge, JS obfuscation lourde) peuvent
  faire échouer l'extraction — dans ce cas, basculer sur l'extraction manuelle décrite dans
  `SKILL.md` (Phase A, cas limites).
