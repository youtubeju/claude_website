# Ets Lévêque — Plan de refonte visuelle & prompt d'exécution

Objectif : garder la structure (ordre des sections), le contenu de confiance (avis, certifications RGE, partenaires) et l'ADN teal/orange — mais sortir du rendu "thème WordPress générique" pour un rendu premium et cohérent, ancré dans le métier réel (chauffage, plomberie, cuivre, énergie).

---

## 1. Diagnostic (rappel)

- Structure de conversion déjà bonne : hero → chiffres clés → activités → avis → partenaires → contact
- Palette teal/orange cohérente mais 2-3 nuances de bleu non unifiées
- Composants (cartes, boutons, titres) au rendu template par défaut, peu de hiérarchie typographique
- Peu/pas de micro-animations
- Contraste texte/image faible sur le hero actuel
- Vraie richesse de contenu sous-exploitée : "3990 mètres de cuivre déroulés en 2025", "641 communes visitées" — ce sont des données de métier concrètes, pas juste des stats génériques

---

## 2. Système de couleurs (réappropriation, pas remplacement)

On garde la famille teal + orange mais on la précise en 6 tons nommés, ancrés dans le métier (cuivre, ardoise) plutôt que des teintes plates génériques.

| Nom | Hex | Usage |
|---|---|---|
| **Teal Profond** | `#0D3B3E` | Fond header/footer, texte sur fond clair, base de marque |
| **Teal Actif** | `#17797D` | Liens, hover, accents secondaires, bordures actives |
| **Cuivre** | `#C4622A` | CTA principal ("Devis gratuit"), remplace l'orange plat actuel — clin d'œil direct au métier (cuivre = plomberie/chauffage) |
| **Cuivre Clair** | `#E08847` | Hover des CTA, accents chiffrés, icônes actives |
| **Ardoise** | `#1A2426` | Texte principal, titres sur fond clair (au lieu du noir pur) |
| **Brume** | `#F1F4F3` | Fond de section clair (remplace le blanc plat), légère teinte sauge/teal |

**Pourquoi ce changement et pas un simple nettoyage :** l'orange actuel est un orange "bouton par défaut". Le cuivre est le même signal visuel (chaud, actionnable) mais raconte quelque chose de vrai sur l'entreprise — ça se justifie directement avec leur propre statistique "mètres de cuivre déroulés".

---

## 3. Typographie

| Rôle | Police | Justification |
|---|---|---|
| **Display (titres, hero)** | Archivo Expanded, 700/800 | Lettrage large et carré, proche de la signalétique peinte sur les camions/enseignes du métier — cohérent avec leur propre identité visuelle terrain |
| **Corps de texte** | IBM Plex Sans, 400/500 | Lisible, légèrement technique, évite le générique "Inter partout" |
| **Chiffres/data (section "en chiffres")** | IBM Plex Mono, chiffres tabulaires | Effet "compteur d'installation" / relevé technique — voir signature ci-dessous |

Échelle type suggérée : 12 / 14 / 16 / 20 / 28 / 40 / 56px, line-height 1.1 sur les titres, 1.5 sur le corps.

---

## 4. Élément signature : le "compteur technique"

Plutôt qu'un simple compteur qui défile (générique), transforme la section "Notre entreprise en chiffres" en **jauges façon manomètre/compteur de chantier** :
- Cercle ou arc de progression en Cuivre qui se remplit au scroll
- Chiffre en IBM Plex Mono au centre, style afficheur
- Icône métier existante conservée (maison, ramonage, salle de bain...)
- Animation déclenchée une seule fois à l'entrée dans le viewport, pas en boucle

C'est le seul endroit où on prend un vrai risque visuel — le reste du site reste sobre autour.

---

## 5. Plan d'exécution par phase

**Phase 0 — Fondations**
- Créer les tokens CSS (`:root { --teal-deep: #0D3B3E; ... }`) ou variables Tailwind
- Importer Archivo Expanded, IBM Plex Sans, IBM Plex Mono
- Définir l'échelle d'espacement (base 8px) et de typographie

**Phase 1 — Hero**
- Intégrer la vidéo Veo (panneaux solaires → borne → poêle → salle de bain → PAC)
- Overlay dégradé Teal Profond à 40-55% d'opacité pour garantir le contraste du texte sur toutes les frames
- Titre en Archivo Expanded, CTA en Cuivre

**Phase 2 — Chiffres clés**
- Reconstruire en jauges/compteurs signature (voir section 4)

**Phase 3 — Nos activités (les 6 blocs)**
- Garder la grille 3x2 et les libellés
- Harmoniser les couleurs de fond sur seulement 2 tons (Teal Profond / Cuivre) en alternance au lieu de 3-4 teintes actuelles
- Ajouter un léger hover (translation + ombre) sur chaque carte

**Phase 4 — Avis clients**
- Garder contenu réel (Alexia G., Eric L., oliv P., 4.3/5, 114 avis)
- Cartes en fond Brume, bordure fine Teal Actif, étoiles en Cuivre

**Phase 5 — Partenaires**
- Garder tous les logos tels quels (ne jamais retoucher des logos de marques tierces)
- Fond Brume, espacement plus généreux entre logos

**Phase 6 — Contact/footer**
- Fond Teal Profond conservé
- Carte Google Maps encadrée avec une bordure Cuivre fine

**Phase 7 — Global**
- Animations scroll (fade + slide 20px, durée 400-600ms, easing ease-out)
- Focus clavier visible partout
- `prefers-reduced-motion` respecté (désactive les animations si demandé par le système)
- Test responsive mobile en priorité (le client final consulte majoritairement depuis mobile pour un devis urgent)

---

## 6. Prompt détaillé (à coller dans Claude Code)

```
Contexte : Je refais l'habillage visuel du site ets-leveque.fr (entreprise de chauffage/plomberie/électricité en Dordogne), sans changer la structure ni l'ordre des sections, ni le contenu réel (avis clients, certifications RGE, logos partenaires, textes de service).

Objectif : sortir d'un rendu "thème WordPress générique" vers un design premium et cohérent, ancré dans le métier (cuivre, chauffage, technique).

CONTRAINTES NON NÉGOCIABLES :
- Ne pas changer l'ordre des sections : hero → chiffres clés → nos activités → avis clients → partenaires → contact
- Ne pas modifier ni raccourcir le contenu réel : avis Google, certifications RGE (QualiPac, QualiSol, QualiBois, Qualibat, Chauffage+), logos partenaires (Viessmann, Mitsubishi Electric, Legrand, Hargassner, Hoben, BWT), coordonnées, texte des 6 activités
- Ne jamais retoucher ou recolorer les logos de marques tierces (partenaires)
- Le site doit rester un site de génération de devis local — chaque section garde son objectif de conversion

SYSTÈME DE COULEURS (tokens à créer, ne pas utiliser d'autres couleurs) :
--teal-deep: #0D3B3E     /* header, footer, fonds foncés, texte sur fond clair */
--teal-active: #17797D   /* liens, hover, accents secondaires */
--copper: #C4622A        /* CTA principal, remplace l'orange plat actuel */
--copper-light: #E08847  /* hover CTA, accents chiffrés */
--slate: #1A2426         /* texte principal (jamais noir pur) */
--mist: #F1F4F3          /* fond de section clair (jamais blanc pur) */

TYPOGRAPHIE :
- Titres/hero : Archivo Expanded, weight 700-800
- Corps de texte : IBM Plex Sans, weight 400-500
- Chiffres/données (section "en chiffres") : IBM Plex Mono, chiffres tabulaires
- Échelle : 12/14/16/20/28/40/56px — line-height 1.1 sur titres, 1.5 sur le corps
- Espacement : grille base 8px

TÂCHES PAR SECTION :

1. HERO
   - Remplacer l'image statique par [chemin de la vidéo Veo]
   - Ajouter un overlay dégradé --teal-deep de 40 à 55% d'opacité pour garantir la lisibilité du texte sur toute la durée de la vidéo
   - Titre en Archivo Expanded, CTA "Nous contacter" en --copper
   - Vérifier le contraste (ratio WCAG AA minimum) à plusieurs moments de la vidéo

2. CHIFFRES CLÉS ("Notre entreprise en chiffres")
   - Remplacer les compteurs plats par des jauges circulaires/arc de progression en --copper qui se remplissent au scroll (une seule fois, pas en boucle)
   - Chiffre au centre en IBM Plex Mono
   - Garder les 5 stats et icônes existantes (années d'expérience, communes visitées, ramonages/entretiens, salles de bain réalisées, mètres de cuivre déroulés)

3. NOS ACTIVITÉS (grille 6 blocs)
   - Garder la grille 3x2 et les libellés exacts
   - Alterner uniquement --teal-deep et --copper en fond (au lieu des 3-4 teintes actuelles)
   - Hover : translateY(-4px) + ombre douce, transition 250ms ease-out

4. AVIS CLIENTS
   - Garder les avis réels tels quels (auteur, texte, note, ancienneté)
   - Fond --mist, bordure fine --teal-active, étoiles en --copper
   - Léger fade-in + slide-up au scroll (une seule fois)

5. PARTENAIRES
   - Garder tous les logos inchangés, ne pas les recolorer
   - Fond --mist, espacement horizontal généreux (min 48px entre logos)

6. CONTACT/FOOTER
   - Fond --teal-deep conservé
   - Carte Google Maps avec bordure fine --copper
   - Liens/réseaux sociaux en --copper-light au hover

GLOBAL
- Toutes les animations scroll : fade + translateY(20px), durée 400-600ms, easing ease-out, déclenchées une seule fois par élément (IntersectionObserver)
- Respecter prefers-reduced-motion (désactiver les animations si l'utilisateur le demande)
- Focus clavier visible sur tous les éléments interactifs
- Responsive mobile-first, tester en priorité sur largeur 375px et 390px
- Ne pas casser le SEO existant (balises h1/h2, alt text, structure sémantique)

Livre le résultat section par section, avec un screenshot ou une description du rendu après chaque section, pour validation avant de passer à la suivante.
```

---

## Notes

- Le passage orange → cuivre est le seul vrai changement de couleur, et il reste dans la même famille chromatique (chaud, warm-orange) donc la reconnaissance de marque n'est pas perdue.
- Tout le reste est un raffinement de l'existant (typo, spacing, animations), pas une nouvelle identité.
- Si tu veux, étape suivante logique : appliquer ce prompt section par section avec Claude Code directement sur le thème/repo actuel, en validant visuellement après chaque section plutôt que tout d'un coup.
