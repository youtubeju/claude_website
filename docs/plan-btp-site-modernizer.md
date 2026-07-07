# Skill + Agent : Modernisation de sites BTP

## Contexte

L'utilisateur dirige une activité de refonte de sites web pour des entreprises du BTP (maçonnerie, couverture, plomberie, électricité, rénovation, paysagiste, etc.). Ces sites sont vieux, statiques, sans mouvement ni 3D. La difficulté principale (contrairement à un site créé de zéro) : il faut extraire et comprendre l'ADN de marque existant (logo, couleurs, services réels, avis clients réels, copywriting) puis le "remettre au goût du jour" avec du motion design et de la 3D — sans jamais inventer de contenu.

Le but de cette tâche : construire un **Skill** (base de connaissance réutilisable) + un **Agent** (orchestrateur du pipeline complet), installés globalement (`~/.claude/skills/` et `~/.claude/agents/`), réutilisables pour chaque futur client BTP. Toutes les décisions structurantes ci-dessous ont été validées avec l'utilisateur via questions/réponses.

## Décisions produit validées

- **Format** : Skill (connaissance : ADN BTP, catalogue motion/3D, règles de fidélité de marque, anti-clichés IA) + Agent (orchestrateur du pipeline en 6 phases avec validation humaine à chaque étape).
- **Emplacement** : global, réutilisable sur n'importe quel projet client.
- **Stack** : décidée au cas par cas — HTML/CSS/JS statique + GSAP + Lenis + Three.js léger par défaut ; bascule vers Next.js/React + Framer Motion + React Three Fiber seulement si le projet a besoin de vraie interactivité (devis en ligne, espace client).
- **Extraction** : nouveau script dédié (pas de réutilisation de l'ancien scraper) qui sort un JSON structuré par section avec couleurs dominantes, toutes les images, le logo, les avis clients, et tout le copywriting.
- **Process** : étapes avec validation à chaque phase (fidèle à la vidéo de référence) — pas d'exécution autonome de bout en bout.
- **Métiers BTP** : framework générique + doc de référence listant des pistes esthétiques par corps de métier.
- **Fidélité de marque** : garder l'ADN (couleurs/valeurs/services/avis réels), autoriser une refonte poussée du logo/palette si nécessaire — jamais de contenu inventé.
- **Pas de checklist notée** formelle — l'auto-critique reste qualitative/conversationnelle.
- **Absorption** : les concepts utiles de `frontend-design` (officiel Anthropic) et `ui-ux-pro-max-skill` (communautaire) sont absorbés directement dans le nouveau skill, en autonomie — pas de dépendance externe à installer.
- **Structure du site** : one-page scrolling par défaut, multi-page seulement si le volume de contenu l'exige.
- **Génération d'assets** : guidage inclus pour prompts d'images ET de vidéos IA avancés (génération externe, hors Claude Code) pour combler les photos manquantes.
- **Déploiement** : hors périmètre — le skill/agent s'arrête à un projet fini prêt à déployer.

## Architecture

```
~/.claude/skills/btp-site-modernizer/
├── SKILL.md
├── references/
│   ├── metiers-btp.md
│   ├── anti-cliches-ia.md
│   ├── styles-palettes-fonts.md
│   ├── motion-3d-techniques.md
│   ├── marque-et-contenu.md
│   ├── generation-assets.md
│   ├── stack-and-scaffolding.md
│   └── extraction-schema.md
└── scripts/
    ├── extract-site.mjs        (CLI)
    ├── package.json
    ├── schema.json             (JSON Schema draft-07)
    ├── README.md
    └── lib/
        ├── crawl.mjs           (Playwright, gestion bandeaux cookies)
        ├── sections.mjs        (segmentation hero/services/à propos/réalisations/avis/contact/footer)
        ├── logo.mjs
        ├── palette.mjs         (node-vibrant sur logo + captures hero, + CSS calculé)
        ├── testimonials.mjs    (détection avis, flag OCR si besoin)
        ├── images.mjs          (téléchargement, dédup par hash sha1, filtre icônes)
        └── contact.mjs         (JSON-LD LocalBusiness en priorité, fallback regex FR)

~/.claude/agents/btp-modernization-orchestrator.md
```

**Pourquoi Node + Playwright** : les vieux sites BTP sont souvent en WordPress/Elementor/Divi/Wix/Jimdo avec JS lourd (carrousels, lazy-load, bandeaux cookie) — un simple fetch HTTP ne suffit pas. Playwright (multi-moteur) + `node-vibrant` (palette depuis captures) + `sharp` (dédup/redimension) restent dans le même langage que le site final (GSAP/Three.js/Lenis sont npm-natifs).

## SKILL.md — plan de contenu (~350-450 lignes)

1. **Framing** — persona d'un studio spécialisé BTP ; la tension centrale (motion moderne audacieux vs. fidélité stricte à la marque).
2. **Contrat non-négociable** (court) — jamais inventer service/avis/certif/stat ; détail complet renvoyé à `marque-et-contenu.md`.
3. **Carte du pipeline** — les 6 phases, chacune reliée aux fichiers de référence à consulter et au checkpoint qui la clôture.
4. **Phase A — Extraction & dossier** : lancer `extract-site.mjs`, lire `dossier.json`, produire un dossier de marque/contenu résumé, poser des questions de clarification, proposer 2-3 directions de design (via `metiers-btp.md` + `styles-palettes-fonts.md`).
5. **Phase B — Décision de stack & build** : heuristique compacte inline, renvoi vers `stack-and-scaffolding.md` ; méthode token color/type/layout/signature (absorbée de frontend-design, reformulée) + `anti-cliches-ia.md`.
6. **Phase C — Auto-critique** : qualitative, informelle (pas de rubrique notée) — captures d'écran si possible, principe de sobriété ("retirer un accessoire").
7. **Phase D — Polish motion/3D** : règle "une touche subtile par section", renvoi vers `motion-3d-techniques.md`.
8. **Phase E — Passe mobile dédiée** : gardée inline (~15-20 lignes) — nav simplifiée, budget motion réduit, CTA accessible au pouce, tap targets.
9. **Phase F — Validation finale** : récap des changements, confirmation qu'aucun contenu n'a été inventé.
10. **Cas limites** : pas de logo détecté, pas d'avis trouvés (demander, ne pas inventer), site source cassé/illisible (fallback WebFetch/screenshots manuels), déclencheurs multi-page.
11. **Index des références** — tableau fichier → usage → quand le lire. Rappel explicite : le déploiement est hors périmètre.

## references/*.md — contenu clé

- **metiers-btp.md** : vocabulaire par corps de métier (maçonnerie/gros-œuvre, couverture/charpente, plomberie/chauffage, électricité, rénovation globale, paysagiste/VRD, menuiserie, peinture/ravalement, terrassement, piscine, serrurerie) — couleurs/matières/pistes de motion par métier, présenté comme inspiration et non comme template obligatoire.
- **anti-cliches-ia.md** : les 3 clichés IA génériques (crème+serif+terracotta ; noir+accent néon ; hairlines broadsheet) + clichés spécifiques BTP (photo stock casque/plan, "partenaire de confiance depuis X ans", cartes 01/02/03 sans vraie séquence, orange/jaune sécurité systématique, pairing Poppins+Montserrat partout) ; boucle brainstorm→critique→build→critique ; principe de sobriété.
- **styles-palettes-fonts.md** : shortlist de directions stylistiques pertinentes (minimalisme suisse, éditorial/magazine, biophilique pour paysagistes, hyperréalisme dimensionnel pour sites photo-chantier, autorité/confiance, brut/anti-poli, dark mode premium pour rénovation haut de gamme) + palettes/polices d'ancrage (à vérifier/rafraîchir depuis des sources réelles au moment de l'implémentation) — toujours confrontées à la palette réellement extraite du client.
- **motion-3d-techniques.md** : catalogue de recettes GSAP+Lenis+Three.js par palier (subtil/standard/complexe) avec durées/easing/limites de performance (respecter `prefers-reduced-motion`, limiter les pins ScrollTrigger simultanés, jamais de parallax sur le texte) ; catalogue BTP "une touche par section" (particules/braises, halo suivant le curseur, CTA magnétique, slider avant/après pour réalisations, compteurs, tilt au survol) ; règles d'escalade vers la 3D (uniquement si ça apporte une vraie valeur : logo 3D, showcase de matériaux, plan de site interactif).
- **marque-et-contenu.md** : contrat de fidélité de marque complet — chaque service/avis/stat/certif doit provenir du dossier d'extraction ou d'une confirmation explicite du client ; logo/palette modernisables en exécution mais identité centrale préservée sauf refonte complète demandée ; avis clients copiés verbatim (jamais composés à partir de plusieurs avis) ; mentions légales/assurance décennale/certifications reportées telles quelles.
- **generation-assets.md** : techniques de prompt avancées pour combler les photos manquantes — prompts image (réalisme chantier, bons outils/matériaux/EPI par métier, cohérence de direction artistique) et prompts vidéo (boucles hero de 6-10s sans coupure visible, clips scroll-scrubbed) ; jamais présenter un visage IA comme un vrai employé (viole le contrat de fidélité) ; convention de placement des fichiers (`assets/generated/images|video/`) + manifeste distinguant assets réels vs générés.
- **stack-and-scaffolding.md** : table de décision statique vs. React (déclencheurs : devis calculateur, login client, édition CMS non-technique, formulaires conditionnels) ; arborescence de départ pour chaque stack ; liste de dépendances de base (gsap, lenis, three, vite, next, framer-motion, @react-three/fiber) avec rappel de vérifier les versions actuelles au moment du build plutôt que de figer des numéros.
- **extraction-schema.md** : explication humaine du `schema.json` du script, avec exemples de fragments par section.

## Script d'extraction — schéma `dossier.json`

Sortie organisée par : `meta` (url, pages crawlées, warnings), `brand.logo` (candidats + confiance), `brand.palette` (swatches avec rôle dominant/primaire/secondaire/accent/fond/texte + méthode), `brand.typography`, `company` (nom, tagline, métier, années d'expérience, certifications, zone d'intervention, contact/JSON-LD en priorité), `sections[]` (id, page source, headline, body, items, images, texte brut), `testimonials[]` (auteur, plateforme, note, citation verbatim, méthode d'extraction, flag OCR si besoin), `images.manifest[]` (fichier, url d'origine, dimensions, hash, sections d'usage, alt text).

CLI : `node scripts/extract-site.mjs <url> --out <dir> --max-pages 6 --screenshot --lang fr --timeout 45000`.

Sortie sur disque : `dossier.json`, `extraction-report.md` (résumé lisible + warnings), `images/`, `screenshots/`, `logo/`.

## Agent `btp-modernization-orchestrator.md`

Frontmatter : `name: btp-modernization-orchestrator`, `description` en prose expliquant quand l'invoquer (URL d'un vieux site BTP à moderniser ; utilisateur décrivant un site client comme "dépassé"), `model: inherit`, `color: green`, `tools` omis (accès complet nécessaire : Bash pour le script d'extraction/serveur de dev, Read/Write/Edit pour le build, AskUserQuestion pour les checkpoints, TodoWrite pour le suivi des phases, WebFetch, et Claude-in-Chrome en complément pour la QA visuelle).

Corps du prompt système :
1. Persona d'orchestrateur qui consulte activement le skill `btp-site-modernizer` (SKILL.md + références) à chaque phase plutôt que de re-dériver la connaissance.
2. "When to invoke" avec scénarios concrets.
3. Le contrat de fidélité de marque reformulé explicitement dans l'agent (pas seulement un renvoi au skill), car c'est l'agent qui écrit réellement les fichiers.
4. Heuristique de décision de stack, justifiée à l'utilisateur au checkpoint de la Phase B (pas de choix silencieux).
5. **Les 6 phases avec checkpoints explicites** — chaque phase se termine par une instruction d'arrêt explicite ("stop, utilise AskUserQuestion, attends une validation avant de continuer — ne pas enchaîner automatiquement"). C'est l'élément le plus important : le pipeline ne doit jamais tourner de bout en bout sans validation.
6. Utilisation du `dossier.json` : croiser les warnings d'`extraction-report.md`, poser des questions de clarification sur le contenu manquant plutôt que de l'omettre ou l'inventer silencieusement.
7. Format de sortie à chaque checkpoint (ex: Phase A → résumé du dossier + 2-3 directions nommées avec rationale + questions ouvertes ; Phase D → liste section par section des sections "plates" avec une touche de motion proposée chacune, en attente de go/no-go).
8. Cas limites : site source cassé/impossible à scraper (fallback WebFetch/Read/captures manuelles), logo ambigu/absent, volume de portfolio forçant le multi-page.

## Vérification

1. **Test du script d'extraction** sur 2-3 vrais sites BTP français publics (un WordPress-era, un Wix/Jimdo-era) : `dossier.json` valide contre `schema.json`, au moins un candidat logo trouvé, palette non vide, sections hero/services/contact détectées, images téléchargées et dédupliquées, warnings corrects si avis/logo absents.
2. **Test cas limite** : site sans JSON-LD, sans avis, logo textuel uniquement → le script doit dégrader proprement (warnings peuplés, pas de crash, pas de champs inventés).
3. **Test à blanc de l'agent** dans un dossier scratch : jouer le rôle utilisateur sur la Phase A uniquement, vérifier que l'agent résume fidèlement le dossier, propose des directions concrètes et différenciées ancrées dans la palette/métier réels (pas les défauts génériques bannis), et s'arrête explicitement sans commencer le build.
4. **Vérification des checkpoints** : confirmer que l'agent n'enchaîne pas les phases A→F en un seul tour — approuver la Phase A, vérifier qu'il s'arrête à nouveau après la Phase B plutôt que de continuer automatiquement.
5. **Contrôle du contenu du polish motion (Phase D)** : vérifier "une touche subtile par section" (pas d'empilement, pas d'effets gadgets bannis dans `motion-3d-techniques.md`).
6. **Contrôle de fidélité de marque** : comparer le site final au `dossier.json` verbatim pour confirmer qu'aucun contenu n'a été inventé au-delà de ce qu'autorise le contrat.
7. **Contrôle de la passe mobile (Phase E)** : émulation mobile, vérifier que la nav/le budget motion ont été délibérément simplifiés (pas juste un reflow CSS).

## Fichiers critiques

- `~/.claude/skills/btp-site-modernizer/SKILL.md`
- `~/.claude/skills/btp-site-modernizer/scripts/extract-site.mjs`
- `~/.claude/skills/btp-site-modernizer/scripts/schema.json`
- `~/.claude/skills/btp-site-modernizer/references/marque-et-contenu.md`
- `~/.claude/agents/btp-modernization-orchestrator.md`
