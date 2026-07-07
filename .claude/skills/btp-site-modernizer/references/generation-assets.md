# Génération d'assets manquants — techniques de prompt

Les générateurs d'images/vidéos IA (ChatGPT images, Midjourney, Google Veo, Runway, etc.) sont
externes à Claude Code — ce document donne les techniques de prompt à transmettre à l'utilisateur
pour qu'il génère les visuels manquants ailleurs, puis les dépose dans le projet. Ce n'est pas du
code exécutable ici, c'est du conseil de prompt-crafting.

## Quand générer plutôt qu'utiliser les photos existantes

Toujours préférer les vraies photos du client (dossier d'extraction). Ne proposer de la génération
que si : le stock existant est insuffisant en nombre, la qualité est trop dégradée pour un usage
hero/pleine largeur, ou une section a besoin d'un visuel d'ambiance qui n'a jamais été photographié
(ex: une texture, un détail de matériau).

Rappel du contrat de fidélité (`marque-et-contenu.md`) : un visuel généré ne doit jamais être
présenté comme une photo réelle d'un chantier ou d'un employé du client.

## Technique de prompt — images

Structurer le prompt en couches, dans cet ordre :
1. **Sujet précis** : le métier + l'action exacte (ex: "artisan couvreur posant des tuiles
   d'ardoise sur une toiture en pente, vu de trois-quarts").
2. **Matériaux et outils réels du métier** : cite les bons outils/matériaux/EPI (équipement de
   protection individuelle) pour éviter l'incohérence qui trahit une image générée au hasard.
3. **Lumière et ambiance** cohérentes avec la direction de design retenue (golden hour pour un
   registre chaleureux, lumière neutre et nette pour un registre technique/premium).
4. **Cadrage et composition** : préciser le ratio cible (portrait/paysage/carré) selon
   l'emplacement prévu sur le site (hero plein écran vs vignette de carte service).
5. **Cohérence de série** : si plusieurs images sont nécessaires pour une même section/galerie,
   répéter les mêmes mots-clés de lumière/palette/grain d'une image à l'autre pour éviter un
   patchwork visuel incohérent.
6. **Anti-clichés** : exclure explicitement l'esthétique "photo de stock" (pose figée, sourire
   caméra, arrière-plan flou générique) — demander un cadrage documentaire/reportage plutôt que
   publicitaire si le positionnement du client est artisanal/authentique.

## Technique de prompt — vidéo

1. **Boucle sans coupure visible** : préciser explicitement un mouvement cyclique (ex: poussière en
   suspension, légère vibration de caméra, flux d'eau continu) sur une durée courte (6-10s) pensée
   pour boucler proprement en fond de hero.
2. **Mouvement de caméra minimal** : un léger travelling ou zoom lent plutôt qu'un mouvement
   complexe — les mouvements de caméra ambitieux ont plus de chances de produire des artefacts
   visibles en boucle.
3. **Clips scroll-scrubbed** : si la vidéo doit être pilotée par le scroll (avancer/reculer selon
   la position de l'utilisateur sur la page), générer un plan à mouvement linéaire et continu
   (ex: travelling avant constant) pour que le scrubbing reste cohérent visuellement à n'importe
   quel point d'arrêt.
4. **Jamais de visage présenté comme un employé réel** — pour toute vidéo impliquant des personnes,
   rester sur des plans de mains/outils/matériaux en action plutôt que des visages, sauf si le
   client fournit ses propres images de ses propres employés.

## Où placer les fichiers obtenus

```
assets/generated/images/<section>-<description>.jpg
assets/generated/video/<section>-<description>.mp4
assets/generated/manifest.json   # liste distinguant assets réels (dossier d'extraction) vs générés
```

Le manifeste sert à la transparence avec le client final : il doit savoir quels visuels sont réels
et lesquels sont générés, ne serait-ce que pour pouvoir les remplacer plus tard par de vraies
photos de chantier.
