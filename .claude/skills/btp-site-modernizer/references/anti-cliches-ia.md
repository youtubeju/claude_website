# Anti-clichés IA & méthode token

Adapté et reformulé pour le contexte BTP à partir des principes de design front-end génériques —
l'objectif est qu'un site généré ici ne se reconnaisse jamais comme "encore un site fait par une
IA", et encore moins comme "encore un site BTP qui se ressemble tous".

## Les 3 clichés IA génériques à éviter (sauf si le brief les demande explicitement)

1. Fond crème chaud (proche de `#F4F1EA`) + serif display à fort contraste + accent terracotta.
2. Fond quasi-noir + un seul accent vif (vert acide ou vermillon).
3. Mise en page façon "broadsheet" — filets fins, zéro arrondi, colonnes denses façon journal.

Ces trois looks sont légitimes pour certains briefs, mais ce sont des réflexes par défaut, pas des
choix. Si le dossier d'extraction ou le client pointe explicitement vers l'un d'eux, suis-le — sinon
ne dépense pas ta liberté créative dessus par défaut.

## Clichés spécifiques BTP à éviter

- **Photos de stock génériques** : casque de chantier posé sur des plans, poignée de main devant un
  bâtiment, ouvrier souriant regardant la caméra. Préfère les vraies photos de chantier du client ;
  à défaut, voir `generation-assets.md` pour générer des visuels crédibles et spécifiques.
- **Copywriting passe-partout** : "votre partenaire de confiance depuis X ans", "la qualité à votre
  service", "satisfaction garantie". Retravaille le texte réel du client pour qu'il sonne comme
  écrit par quelqu'un qui connaît vraiment le métier (mesures précises, vocabulaire technique
  réel, ton du métier) plutôt que du marketing générique.
- **Cartes numérotées 01 / 02 / 03** sans vraie séquence. N'utilise la numérotation que si le
  contenu est réellement un processus ordonné (ex: les étapes réelles d'un chantier).
- **Orange/jaune sécurité par réflexe** — n'ajoute ces couleurs que si elles font déjà partie de
  l'identité du client ou sont explicitement demandées ; sinon dérive la palette de la marque
  réelle, pas d'un stéréotype "BTP = orange".
- **Pairing typographique par défaut** (ex: Poppins + Montserrat partout, Inter en corps de texte
  sur tous les sites). Inter en particulier est reconnu instantanément comme "police IA par
  défaut" — évite-le pour le corps de texte, choisis une police adaptée au ton de la marque (voir
  `styles-palettes-fonts.md`).

## Méthode token : brainstorm → critique → build → critique

1. **Brainstorm** : avant d'écrire du code, pose un plan de design compact —
   - *Couleur* : 4 à 6 valeurs hex nommées (pas une palette arc-en-ciel).
   - *Typographie* : un rôle display (caractère, utilisé avec retenue) + un rôle body
     (lisibilité) + éventuellement un rôle utilitaire (légendes/data).
   - *Layout* : un concept en une phrase + un wireframe ASCII si utile pour comparer des options.
   - *Signature* : l'élément unique dont ce site se souviendra, qui incarne vraiment ce client
     précis (pas un gadget générique).
2. **Critique** : relis ce plan contre le brief et contre la liste de clichés ci-dessus. Si une
   partie ressemble à ce que tu produirais pour n'importe quel site BTP similaire, révise-la et
   note ce que tu as changé et pourquoi.
3. **Build** : code en suivant le plan révisé, pas avant.
4. **Critique à nouveau** : une fois construit, prends du recul (captures d'écran si possible).
   Applique le principe de sobriété — dépense ton audace à un seul endroit (le signature element),
   garde le reste discipliné, retire ce qui ne sert pas le brief.

## Point technique CSS

Attention aux sélecteurs qui s'annulent silencieusement (un sélecteur de type `.section` et un
sélecteur d'élément `.cta` qui se battent sur les mêmes propriétés) — c'est une source fréquente de
bugs d'espacement/marge entre sections lors de la construction.
