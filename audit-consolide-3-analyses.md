# Audit consolidé — 3 analyses croisées
*Claude (moi) + 2 analyses Gemini, confrontées et vérifiées sur les frames réelles*

---

## 1. Consensus fort — les 3 analyses tombent d'accord (priorité absolue)

Quand Claude + Gemini modèle 1 + Gemini modèle 2 pointent la même chose indépendamment, c'est le signal le plus fiable que tu peux avoir. À faire en premier, sans débat :

| Sujet | Ce que dit le consensus |
|---|---|
| **Lisibilité texte sur vidéo** | Les 3 analyses le disent : il manque un voile sombre (overlay/scrim) systématique derrière tout texte posé sur une vidéo/photo. C'est le problème #1 identifié partout, unanimement. |
| **Animations d'apparition au scroll** | Rien ne doit être statique. Chaque titre/paragraphe/bouton doit apparaître en fade-up ou slide-in au moment où il entre dans le viewport, pas être déjà affiché. |
| **Chiffres clés animés (count-up)** | Les 3 modèles valident cette section comme le meilleur atout du site et recommandent (ou confirment) une animation de comptage 0→39, 0→641, etc. déclenchée au scroll. |
| **Effets hover sur boutons/photos** | Boutons : changement de couleur + ombre qui s'accentue au survol. Photos de réalisations : léger zoom (scale 1.05, transition 0.3s) au survol. |
| **Le texte du hero est trop factuel, pas assez "bénéfice"** | Les 3 s'accordent : "Votre chauffagiste à Notre Dame de Sanilhac" décrit un fait, mais ne vend pas un bénéfice. Voir section 4 pour les 3 propositions de reformulation. |

---

## 2. Ce que chaque modèle a vu que les autres ont raté

### Apporté par Gemini (modèle 1) — le plus précis section par section

- **Glass cards pour les blocs "Énergies renouvelables", "Électricité générale" etc.** : au lieu de faire flotter le texte directement sur la vidéo/photo (ce qui donne l'effet "aléatoire" repéré), mets-le dans une carte semi-transparente à fond flouté (`backdrop-filter: blur(12px)`, fond blanc/teal à 15-20% d'opacité, bords arrondis). Ça règle **en même temps** le problème de contraste et le problème de mise en page — excellente suggestion, je te la valide à 100%, c'est plus élégant qu'un simple overlay plat.
- **Le cadre rouge autour du menu déroulant fait daté** → remplace par un fond uni sombre + un trait qui se dessine sous le lien au survol (underline hover animé). Bon point, le cadre actuel casse le côté épuré du header transparent.
- **Bandeau défilant (ticker/marquee) pour les logos de certifications** (RGE, QualiPAC, etc.) plutôt qu'une grille statique un peu tassée — un classique "sites tech" qui fonctionnerait bien ici et ajoute du mouvement gratuit (pas de poids vidéo).
- **Section "Avis clients" pointée comme la plus faible visuellement** : fond photo des camionnettes trop clair/délavé, bouton rouge mal placé. Proposition : fond uni teal profond (comme le reste de la charte) + carousel/marquee horizontal des avis qui défile en continu au lieu d'une grille figée. Sur mes propres frames, cette section m'avait semblé correcte une fois stabilisée, mais il y a effectivement un moment de transition où c'est tassé/peu clair — à vérifier en live.

### Apporté par Gemini (modèle 2) — le plus utile sur le rythme et la retenue

- **"Trop de mouvement tue le mouvement"** : c'est le point le plus important que je n'avais pas assez insisté dans mon premier audit. Si tout bouge en même temps de façon appuyée, l'œil fatigue et la personne quitte le site. Consigne concrète : transitions lentes et douces, **0.6 à 0.8s en ease-out**, jamais plusieurs animations agressives simultanées à l'écran.
- **Smooth scroll explicite** : le défilement paraît un peu saccadé par endroits dans la vidéo. Une lib de smooth scroll (Lenis, ou natif avec `scroll-behavior` + easing custom) donnerait immédiatement une sensation plus "premium" — petit ajout technique, gros effet perçu.
- **Cinemagraphs courts (loops de 3s)** plutôt que vidéos complètes pour les sections secondaires (robinet qui coule, mains qui serrent un raccord) : garde le mouvement subtil sans le poids d'une vidéo Veo complète. Ça complète bien mon point sur la performance mobile — c'est probablement le meilleur compromis mouvement/poids pour tout ce qui n'est pas le hero.
- **Ombres portées douces et larges** pour détacher les cartes blanches et les textes du fond — donne un effet de profondeur que ni moi ni le modèle 1 n'avions mentionné explicitement.
- Proposition de copy hero orientée "héritage familial" (*"Le confort absolu pour votre habitat, de père en fils depuis 39 ans"*) — à prendre avec un peu de recul si Ets Lévêque n'est pas explicitement une histoire familiale multi-génération, sinon ça sonne faux. À valider avec le client avant utilisation.

### Apporté par mon analyse — pas repris par les deux Gemini

- **Poids des vidéos sur mobile / performance** : aucun des deux modèles Gemini n'aborde ce sujet, alors que pour une clientèle BTP rurale en Dordogne qui consulte souvent depuis un téléphone avec une connexion moyenne, c'est un point bloquant pour le SEO local (Core Web Vitals) et pour l'expérience réelle. Je maintiens que c'est à traiter **avant mise en prod**, pas en option.
- **Perte de densité technique du copy** (COP ≥ 3,9, prime CEE, mètres de cuivre déroulés) : les deux Gemini valorisent la section chiffres mais ne parlent pas du risque de perdre le contenu technique/SEO des fiches produits actuelles en simplifiant trop le copy au profit du visuel.
- **Discipline sur la couleur CTA unique** : mon point sur "une seule couleur d'action, jamais utilisée ailleurs" rejoint indirectement la remarque du modèle 1 sur la cohérence des couleurs, mais je vais plus loin en proposant une règle stricte d'usage.

---

## 3. Où les modèles se contredisent légèrement (arbitrage)

- **Section "Sanitaire — Plomberie"** : le modèle 1 la critique comme cassant le rythme immersif avec "des petites photos carrées dans une boîte blanche", et propose une grande photo à gauche + texte à droite. Sur les frames que j'ai inspectées, la version que j'ai vue montre déjà à peu près cette disposition (grande photo à gauche, texte à droite, bien aérée). Il est possible que le modèle 1 ait chopé un état intermédiaire de l'animation (avant que la photo n'ait fini de s'agrandir/se mettre en place). **Vérifie en live que cette section est bien stable dans sa forme finale et ne "clignote" pas entre un petit format et le grand format pendant le scroll.**
- **Nombre de polices** : le modèle 2 recommande "2 polices maximum". Ton système actuel (Archivo Expanded pour les titres, IBM Plex Sans pour le texte courant, IBM Plex Mono pour les chiffres/labels) reste cohérent avec cette règle dans l'esprit — Plex Sans et Plex Mono appartiennent à la même famille de polices pensée pour cohabiter. Ce n'est donc pas vraiment un désaccord, plutôt une confirmation à formuler différemment : garde ce trio, ne va pas au-delà.

---

## 4. Trois options de copy pour le hero (à trancher)

Les 3 analyses s'accordent : l'accroche actuelle est descriptive, pas assez vendeuse. Voici les pistes, à choisir selon le ton que tu veux donner à la marque :

1. **Version confiance/expertise** (Gemini 1) : *"Votre confort thermique, notre expertise."* + sous-titre *"Artisan chauffagiste & RGE à Notre Dame de Sanilhac"*
2. **Version héritage** (Gemini 2) : *"Le confort absolu pour votre habitat, de père en fils depuis 39 ans."* — ⚠️ à valider avec le client : ne l'utilise que si c'est vraiment une histoire familiale multigénérationnelle, sinon ça sonnera comme un mensonge marketing repérable.
3. **Version hybride que je te suggère** (garde le SEO local + ajoute le bénéfice) : *"Confort et sérénité, chez vous, depuis 39 ans."* + sous-titre inchangé *"Nous intervenons sur Périgueux et ses alentours — chauffage, plomberie, électricité, énergies renouvelables."* → garde la mention géographique locale dès le hero (bon pour le SEO "chauffagiste Notre Dame de Sanilhac" / "Périgueux"), gagne en bénéfice émotionnel sans t'inventer une histoire familiale non vérifiée.

---

## 5. Plan d'action final consolidé

**🔴 Priorité 1 — consensus des 3 analyses, à faire en premier**
1. Overlay/scrim sombre systématique derrière tout texte sur vidéo/photo
2. Glass cards pour les blocs de texte flottants sur les sections services (règle contraste + mise en page en un seul geste)
3. Scroll reveal (fade-up/slide-in) sur tous les blocs, avec easing lent (0.6-0.8s ease-out) — et ne pas surcharger, un élément à la fois
4. Count-up animé sur la section chiffres clés
5. Hover : boutons (couleur + ombre) et photos de réalisations (zoom scale 1.05)
6. Nouveau copy hero (choisir parmi les 3 options ci-dessus)

**🟠 Priorité 2 — améliore nettement la perception "premium"**
7. Remplacer le cadre rouge du menu déroulant par fond sombre + underline hover
8. Ticker/marquee horizontal pour les logos de certifications
9. Vérifier/refaire le fond de la section avis clients (uni teal profond + carousel défilant plutôt que grille figée)
10. Ombres portées douces sur les cartes blanches pour créer de la profondeur
11. Smooth scroll (Lenis ou équivalent)
12. Vérifier la couleur exacte du filtre teal sur la barre de stats sticky, surtout là où il se superpose à une photo aux tons chauds (risque de rendu terne/olive)

**🟡 Priorité 3 — structurel / cohérence long terme**
13. Cinemagraphs courts (loop 3s) pour les sections secondaires au lieu de vidéos complètes → allège le poids tout en gardant du mouvement
14. Fiches techniques produit condensées en puces avec icônes (ne pas perdre le contenu technique/SEO au profit du seul visuel)
15. Réintroduire une vraie photo d'équipe + avis Google authentiques plus tôt dans le parcours

**⚫ Non-négociable avant mise en prod**
16. Audit Lighthouse mobile — poids de page avec toutes les vidéos
17. Fallback image statique sur mobile pour le hero vidéo, lazy load sur tout le reste
18. `prefers-reduced-motion` géré
19. Une seule couleur CTA, utilisée exclusivement pour l'action, nulle part ailleurs

---

*Croisement de 3 analyses indépendantes (Claude, Gemini modèle 1, Gemini modèle 2) sur ton screen recording de 49,6s.*
