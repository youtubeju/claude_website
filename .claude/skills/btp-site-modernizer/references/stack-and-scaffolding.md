# Décision de stack & arborescences de départ

## Table de décision

| Signal dans le brief | Stack recommandée |
|---|---|
| Site vitrine simple, présentation + contact | Statique (HTML/CSS/JS + GSAP + Lenis + Three.js léger) |
| Portfolio de réalisations avec filtre par type de chantier | Statique — le filtre peut rester en JS vanilla |
| Calculateur de devis en ligne (logique conditionnelle, plusieurs étapes) | Next.js/React |
| Espace client / login (suivi de chantier, documents) | Next.js/React |
| Édition de contenu par le client sans toucher au code (CMS léger) | Next.js/React (+ CMS headless) |
| Formulaire multi-étapes avec branchements conditionnels complexes | Next.js/React |

Par défaut, partir du statique — n'escalader que si un signal ci-dessus est réellement présent
dans le brief, pas par anticipation d'un besoin hypothétique.

## Arborescence — stack statique (par défaut)

```
project/
├── index.html
├── vite.config.js        # Vite utilisé uniquement comme serveur de dev/bundler — sortie 100% statique
├── package.json
├── css/
│   └── main.css
├── js/
│   ├── lenis-init.js
│   ├── scroll-animations.js   # GSAP + ScrollTrigger
│   └── three-scene.js         # touches 3D, si utilisées
└── assets/
    ├── images/
    ├── video/
    └── fonts/
```

Dépendances de base : `gsap`, `lenis`, `three`, `vite` (dev only). Vérifier les versions actuelles
au moment du build plutôt que de se fier à des numéros figés dans ce document.

## Arborescence — stack React/Next (escalade)

```
project/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── (sections)/            # un composant par section de la page
├── components/
│   ├── Hero.tsx
│   ├── Services.tsx
│   ├── Realisations.tsx
│   ├── Avis.tsx
│   └── Contact.tsx
├── components/three/
│   └── Scene.tsx              # canvas React Three Fiber isolé, chargé en dynamique/lazy
├── public/
│   └── assets/
└── package.json
```

Dépendances de base : `next`, `framer-motion`, `@react-three/fiber`, `@react-three/drei`, `gsap` si
besoin de ScrollTrigger en complément. Isoler le canvas 3D dans un composant chargé dynamiquement
pour ne pas pénaliser le temps de chargement initial des pages qui n'en ont pas besoin.

## Principe général

Ne jamais forcer une architecture plus complexe (React, build step, dépendances serveur) sur un
projet qui n'en a pas besoin — un site statique bien exécuté avec GSAP/Lenis/Three.js atteint déjà
un niveau d'animation et de finition largement suffisant pour la quasi-totalité des sites vitrine
BTP, et reste trivial à héberger en mutualisé.
