# Catalogue motion & 3D

Recettes concrètes pour GSAP (+ ScrollTrigger), Lenis (smooth scroll) et Three.js léger. Utilisé en
Phase D (polish) mais aussi en Phase B pour poser les fondations motion dès la construction.

## Règles générales de performance et de bon goût

- Respecte toujours `prefers-reduced-motion` — désactive ou réduis fortement les animations pour
  les utilisateurs qui le demandent.
- Jamais de parallax sur du texte de lecture (illisibilité au scroll) — réserve le parallax aux
  images/formes de fond.
- Limite le parallax à un delta `yPercent` de 5 à 15 — au-delà, ça devient nauséeux plutôt
  qu'élégant.
- Un maximum de 1 à 2 `ScrollTrigger` "pinned" simultanés sur desktop, un seul sur mobile.
- Toujours tuer/nettoyer les tweens en boucle si l'utilisateur quitte la section (`kill()` sur
  scroll-leave ou sur unmount) pour éviter les fuites de performance.
- Une touche par section (voir SKILL.md, Phase D) — ne jamais empiler plusieurs effets sur la même
  section.

## Palier subtil (à utiliser par défaut)

- **Reveal au scroll** : fade + léger décalage vertical (`y: 20-30px`) à l'entrée dans le viewport,
  stagger léger (0.05-0.1s) si plusieurs éléments d'une liste.
- **Micro-interaction au survol** : légère mise à l'échelle (`scale: 1.02-1.05`), changement
  d'ombre ou de teinte, transition 0.2-0.3s en easing doux (`power2.out`).
- **CTA magnétique** : le bouton se décale légèrement vers le curseur quand celui-ci passe à
  proximité (quelques pixels seulement) — donne une sensation de réactivité sans être un gadget.
- **Compteur animé** : chiffres clés (années d'expérience, chantiers réalisés — toujours des
  chiffres réels du dossier d'extraction) qui s'incrémentent à l'entrée dans le viewport.

## Palier standard

- **Smooth scroll global (Lenis)** : à activer par défaut sur les sites one-page pour donner une
  sensation de fluidité générale, avec un easing personnalisé cohérent avec le reste des
  animations.
- **Parallax de fond** : couches d'image/texture qui défilent à des vitesses différentes du
  contenu (respecter la limite de delta ci-dessus).
- **Titres qui se dévoilent mot à mot** : bon signature element pour une section clé (hero ou
  section "histoire/à propos").
- **Slider avant/après** : signature naturelle pour les réalisations de rénovation/toiture/façade
  — curseur ou glissement tactile qui révèle le "après" par-dessus l'"avant".
- **Tilt au survol** (cartes de service, cartes de réalisation) : légère rotation 3D en fonction de
  la position du curseur sur la carte (quelques degrés seulement).

## Palier complexe / 3D (à réserver aux cas où ça apporte une vraie valeur)

- **Logo ou élément signature en 3D** (Three.js/R3F) : rotation douce, réagit légèrement au
  curseur — pertinent si le client a un logo/symbole fort qui mérite cette mise en scène.
- **Showcase de matériaux** : plan/texture en volume (bois, pierre, carrelage) qu'on peut faire
  pivoter légèrement — pertinent pour menuiserie, piscine, façade.
- **Plan de chantier ou zone d'intervention interactif** : carte stylisée en légère 3D — pertinent
  pour le terrassement/VRD ou une entreprise qui veut mettre en avant sa zone de couverture.
- **Halo/particules qui suivent le curseur** (braises, poussière, lumière) : très efficace en
  section d'ambiance (ex: section "histoire") mais à toujours affiner vers plus de subtilité après
  un premier essai — ajouter un léger effet de traînée/retard plutôt qu'un suivi 1:1 instantané.

**Escalade vers la 3D uniquement si** : le client a un élément visuel fort qui mérite la mise en
volume, le budget de performance mobile le permet, et l'effet ne remplace pas un besoin de
lisibilité/simplicité. La 3D ajoutée par réflexe (sans rôle narratif) est un des marqueurs les plus
nets d'un site "généré par IA sans direction".
