# Feature Specification: Animations — Vie et feedback

**Feature Branch**: `006-animations`
**Created**: 2026-02-26
**Status**: Draft
**Input**: "Le jeu est un peu terne, il faudrait le rendre un peu plus vivant. Les illustrations qui peuvent s'animer (pour montrer le chaos de la bureaucratie), le bouton tamponner, les ressources qui s'animent un peu lorsqu'elles montent. Je veux un peu de vie tout en respectant les codes des jeux mobiles. Fais tout."

Animations retenues après analyse (5 propositions validées) :
- A — Floating +N sur les ressources (ResourceBar)
- B — StampButton : effet de tampon qui s'enfonce + éclaboussure d'encre
- C — Illustration : pan panoramique + respiration de la carte active (AdministrationCard)
- D — Resource icon pulse sur production (ResourceBar)
- E — Fade-in du nom au snap (AdministrationCard nameRow)

---

## User Scenarios & Testing

### User Story 1 — Feedback immédiat sur le tap (Priority: P1)

Quand le joueur tape "Tamponner", il ressent physiquement l'impact du tampon et voit ses ressources réagir. L'animation renforce la satisfaction du tap et incite à continuer.

**Why this priority** : Le tap est l'action centrale du jeu. C'est là que le joueur passe le plus de temps. Un mauvais feedback ici nuit directement à la rétention.

**Independent Test** : Tapper "Tamponner" → le bouton descend/remonte avec rebond + micro-particules d'encre + "+1" s'envole au-dessus de l'icône dossiers.

**Acceptance Scenarios** :

1. **Étant donné** que le joueur voit le bouton Tamponner, **quand** il tape dessus, **alors** le bouton traduit vers le bas (~4px) puis revient avec un spring, donnant l'impression d'un tampon qui s'enfonce.
2. **Étant donné** que le joueur tape Tamponner, **quand** l'animation se déclenche, **alors** 4 à 6 petites particules circulaires oranges éclatent radialement depuis le bouton et disparaissent en moins de 500ms.
3. **Étant donné** que le joueur tape Tamponner, **quand** le dossier est ajouté, **alors** un texte "+1" (couleur dossiers) apparaît au-dessus de l'icône 📄 dans la ResourceBar et monte en disparaissant en 600ms.

---

### User Story 2 — Vie continue des illustrations (Priority: P1)

Les illustrations d'administration ne sont plus des images statiques. La carte active "respire" et son image panoramique lentement, évoquant le chaos bureaucratique en cours. Le joueur sent que quelque chose se passe même sans interagir.

**Why this priority** : C'est l'animation la plus visible et la plus thématique. Les illustrations sont le cœur visuel du jeu — les animer change radicalement la perception de "vie" du jeu.

**Independent Test** : Observer la carte active sans toucher l'écran pendant 3 secondes → l'image se déplace doucement (pan gauche/droite) et la carte fait une légère respiration (scale).

**Acceptance Scenarios** :

1. **Étant donné** qu'une administration est active (carte centrée), **quand** le joueur observe sans interagir, **alors** l'image de la carte se déplace lentement de gauche à droite en boucle (amplitude ≤ 10px, période ≥ 6s) — imperceptible au premier coup d'œil mais visible après 2s.
2. **Étant donné** qu'une administration est active, **quand** le joueur observe la carte, **alors** la carte entière fait une légère respiration (scale 1.0 ↔ 1.008, période ~2.5s) distinguant visuellement la carte active des cartes voisines.
3. **Étant donné** que le joueur swipe vers une nouvelle carte, **quand** le snap se termine, **alors** les animations (pan + respiration) s'appliquent à la nouvelle carte active et s'arrêtent sur l'ancienne.
4. **Étant donné** que la carte active affiche un nom dans le nameRow, **quand** l'administration active change, **alors** le nom fait un fade-in depuis le bas (opacité 0→1 + translateY 6→0, 180ms).

---

### User Story 3 — Feedback continu de la production automatique (Priority: P2)

Même sans tapper, le joueur voit ses ressources "vivre". Les icônes pulsent doucement au rythme de la production des agents, signalant que le jeu tourne en fond.

**Why this priority** : Un idle game doit montrer visuellement que la production tourne. Les nombres qui changent ne suffisent pas — les icônes qui pulsent donnent un rythme organique au jeu.

**Independent Test** : Avoir au moins un agent actif et observer la ResourceBar 3 secondes sans tapper → les icônes des ressources produites font un micro-bounce périodique (max 1x/s par icône).

**Acceptance Scenarios** :

1. **Étant donné** qu'un ou plusieurs agents produisent des ressources, **quand** la production incrémente une ressource, **alors** l'icône correspondante (📄, 🪪 ou 📋) fait un scale bounce (1.0 → 1.25 → 1.0, 300ms) — throttlé à 1 fois par seconde maximum par icône.
2. **Étant donné** que le joueur tape Tamponner, **quand** les dossiers sont incrémentés, **alors** l'icône dossiers pulse également (non-throttlée sur les taps, car le joueur contrôle le rythme).
3. **Étant donné** que le storage est bloqué (clignotement existant sur formulaires), **quand** l'icône formulaires clignote, **alors** le pulse de production NE s'ajoute PAS au clignotement — les deux animations ne s'empilent pas.

---

### Edge Cases

- **Taps très rapides** : les particules d'encre et floating +N s'accumulent si le joueur tape vite. Maximum 5 floating numbers simultanés — les suivants ignorés jusqu'à libération de slots.
- **Production très rapide** (beaucoup d'agents) : le pulse production est throttlé à 1x/s par icône — jamais plus, quelle que soit la vitesse de production.
- **App en arrière-plan puis retour** : les animations en loop (pan, respiration) doivent reprendre proprement au retour foreground. Utiliser `useFocusEffect` ou listener AppState si nécessaire.
- **Carte verrouillée active** : la respiration s'applique à la carte verrouillée (l'overlay est au-dessus mais la carte entière peut respirer). Le pan panoramique NE s'applique PAS aux cartes verrouillées (overlay opaque, animation invisible et ressources inutiles).
- **Accessibilité réduite (prefersReducedMotion)** : React Native n'expose pas encore cette préférence OS — toutes les animations sont maintenues mais leurs amplitudes sont suffisamment subtiles pour ne pas gêner.
- **Performance** : toutes les animations utilisent `useNativeDriver: true` ou Reanimated v3 (UI thread) — aucune animation sur le JS thread sauf si inévitable (interpolation de layout).

---

## Requirements

### Functional Requirements

- **FR-001** : À chaque tap sur le bouton Tamponner, le bouton DOIT animer une descente verticale (~4px) suivie d'un rebond spring vers la position initiale.
- **FR-002** : À chaque tap sur le bouton Tamponner, 4 à 6 particules circulaires DOIVENT éclater radialement depuis le centre du bouton, avec une couleur `Colors.resourceDossiers`, et disparaître en ≤ 500ms.
- **FR-003** : À chaque tap sur le bouton Tamponner, deux feedbacks visuels DOIVENT se déclencher simultanément :
  - Un texte "+[valeur]" surgit depuis le bouton Tamponner, monte sur ~60px et disparaît progressivement (fade out) avant d'atteindre le haut de l'écran — durée totale ≤ 700ms.
  - L'icône 📄 dans la ResourceBar fait un pulse (scale 1.0 → 1.25 → 1.0, 300ms) — non-throttlé sur les taps utilisateur.
  - La valeur affichée est la valeur réellement ajoutée (1 × click multiplier prestige).
- **FR-004** : La carte d'administration active DOIT avoir une animation de respiration continue (scale 1.0 ↔ 1.008, période ~2.5s, `withRepeat` infini). Les cartes non-actives DOIVENT rester statiques.
- **FR-005** : L'image à l'intérieur de la carte active DOIT effectuer un pan panoramique continu (translateX ±8px, période ~7s, `withRepeat` infini reverse). L'image DOIT être légèrement plus large que son conteneur (`width: 115%`) pour éviter les bords visibles lors du pan. Si la carte est verrouillée, aucun pan ne s'applique.
- **FR-006** : Quand l'administration active change (snap ou tap), le texte du nameRow DOIT faire un fade-in depuis le bas (opacity 0→1 + translateY 6→0, durée 180ms).
- **FR-007** : Quand une ressource est incrémentée par la production automatique, l'icône correspondante dans la ResourceBar DOIT faire un pulse (scale 1.0 → 1.25 → 1.0, 300ms). Ce pulse est throttlé à 1 déclenchement par seconde par icône.
- **FR-008** : Le pulse de l'icône dossiers SE DÉCLENCHE aussi sur chaque tap Tamponner (non-throttlé sur les taps utilisateur). Il NE doit PAS s'empiler visuellement avec le clignotement formulaires bloqués.

### Performance Requirements (Constitutional — Principe I)

- **PR-001** : Toutes les animations de transform (translateX, translateY, scale) DOIVENT utiliser `useNativeDriver: true` (Animated core) ou Reanimated v3 (UI thread).
- **PR-002** : Le game loop à 100ms NE DOIT PAS être affecté — aucune animation ne passe par `setState` dans le loop.
- **PR-003** : Maximum 5 floating numbers simultanés dans la ResourceBar — les slots supplémentaires sont ignorés.
- **PR-004** : Le throttle des pulses icônes est implémenté via `useRef` timestamp, pas via `setTimeout` ni `debounce` externe.

### Accessibility Requirements (Constitutional — Principe IV)

- **AR-001** : Les animations ne réduisent pas les cibles tactiles — le bouton Tamponner reste ≥ 44×44pt pendant et après l'animation.
- **AR-002** : Les particules et floating numbers sont purement décoratifs — pas de `accessibilityLabel` requis (ils ne transmettent pas d'information absente ailleurs).
- **AR-003** : Les amplitudes d'animation (pan ±8px, respiration ±0.8%) sont suffisamment subtiles pour ne pas déclencher de gêne vestibulaire.

### Localization Requirements (Constitutional — Principe III)

- **LR-001** : Le floating number affiche la valeur formatée via `formatNumberFrench()` — pas de `.toLocaleString()`.

---

## Clarifications

### Session 2026-02-28

- **Q1 : Position du floating "+N"** → Option C : deux feedbacks simultanés — le "+N" surgit depuis le bouton Tamponner et monte ~60px en fading (n'atteint pas la ResourceBar) ET l'icône 📄 pulse dans la ResourceBar.
- **Q2 : Floating numbers sur production automatique** → Non. Le pulse icône suffit pour la production auto. Les floating numbers sont réservés aux taps utilisateur.
- **Q3 : Pan sur cartes verrouillées** → Non. Overlay opaque = animation invisible + ressources inutiles. La respiration (scale) s'applique quand même.

---

## Success Criteria

- **SC-001** : Après un tap Tamponner, l'animation complète (descente + rebond + particules + floating number) est visible et fluide — 60fps maintenu.
- **SC-002** : Après 3 secondes d'observation de la carte active sans interaction, le pan et la respiration sont perceptibles.
- **SC-003** : Avec des agents actifs, les icônes de ressources pulsent visiblement sans dépasser 1x/s par icône.
- **SC-004** : Aucune régression de performance sur le game loop (production reste correcte et auto-save non perturbé).
- **SC-005** : `npm run lint` → 0 nouvelle erreur.
