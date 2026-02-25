# Tasks: Modale de Réaffectation Différée

**Input**: Design documents from `/specs/004-reaffectation-modal/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Non demandés — validation manuelle via quickstart.md.

**Organisation**: 3 user stories → 3 phases d'implémentation. US2 et US3 dépendent de US1 (modale de base), mais sont indépendantes l'une de l'autre.

## Format: `[ID] [P?] [Story] [label?] Description`

- **[P]**: Parallélisable (fichiers différents, sans dépendance sur tâche incomplète)
- **[US1/2/3]**: User story associée
- **[i18n]**: Textes français / formatage
- **[a11y]**: Accessibilité WCAG

---

## Phase 2: Fondation (Prérequis bloquants)

**Purpose**: Logique métier et action contexte requises avant US3. Aucune UI produite ici — les tâches sont parallélisables entre elles.

**⚠️ CRITIQUE**: T002 doit être terminé avant l'implémentation US3.

- [ ] T001 [P] Ajouter `getReaffectationResetPercentage()` et `getAccumulatedFormulairesForPercentage()` dans `data/conformiteLogic.ts` (voir quickstart.md étape 1)
- [ ] T002 [P] Ajouter `refuseReaffectation(): number` dans `context/GameStateContext.tsx` — import des 2 nouvelles fonctions, interface `GameContextType`, `useCallback`, provider value (voir quickstart.md étape 2)

**Checkpoint**: Les fonctions pures sont exportées et l'action contexte est disponible via `useGameState()`.

---

## Phase 3: User Story 1 — Affichage de la modale à 100 % (Priority: P1) 🎯 MVP

**Goal**: Le joueur peut taper « Réaffectation différée » à 100 % et voir la modale bloquante avec les deux boutons. Les handlers sont des no-ops pour l'instant.

**Independent Test**: Forcer `conformite.percentage = 100`, taper le CTA → modale s'ouvre ; tenter de fermer sans choisir → modale reste ouverte.

- [ ] T003 [US1] [i18n] [a11y] Créer `components/ReaffectationModal.tsx` : `Modal` transparent/fade/non-dismissible, vue principale avec message d'alerte, boutons [ACCEPTER LA MIGRATION] et [REFUSER] (textes FR exacts), styles, `accessibilityLabel` sur chaque bouton et `accessibilityViewIsModal`, `minHeight: 44` sur tous les boutons (voir quickstart.md étape 3)
- [ ] T004 [US1] Modifier `components/ConformiteDisplay.tsx` : import `useState` + `ReaffectationModal`, ajout `modalVisible` state, remplacement du handler no-op du CTA par `setModalVisible(true)`, ajout `<ReaffectationModal visible={modalVisible} onAccept={() => setModalVisible(false)} onRefuse={() => setModalVisible(false)} />` dans le JSX (voir quickstart.md étape 4a, 4b, 4f partiel)

**Checkpoint**: La modale s'ouvre et se ferme (via boutons pour l'instant). Non-dismissible vérifié. Constitue le MVP livrable.

---

## Phase 4: User Story 2 — Parcours « Accepter la migration » (Priority: P2)

**Goal**: Taper [ACCEPTER LA MIGRATION] affiche la vue « Fonctionnalité à venir » + bouton Fermer. Fermer ramène à l'écran de progression, conformité inchangée.

**Independent Test**: Depuis la modale ouverte, taper [ACCEPTER] → vue Coming soon ; taper Fermer → modale fermée, conformité toujours à 100 %, CTA visible.

- [ ] T005 [P] [US2] Ajouter `showComingSoon` state + `useEffect` de reset + vue « Fonctionnalité à venir » + bouton Fermer dans `components/ReaffectationModal.tsx` (voir quickstart.md étape 3 — section flux handleAccept → showComingSoon)
- [ ] T006 [P] [US2] Mettre à jour `onAccept` dans `components/ConformiteDisplay.tsx` : extraire `handleAccept` dédié qui appelle `setModalVisible(false)`, passer `onAccept={handleAccept}` à `<ReaffectationModal>` (voir quickstart.md étape 4c handler handleAccept, 4f)

**Checkpoint**: Le parcours acceptation est complet et testable indépendamment du refus.

---

## Phase 5: User Story 3 — Parcours « Refuser » + animation (Priority: P2)

**Goal**: Taper [REFUSER] ferme la modale, anime la barre de conformité de 100 % vers un seuil aléatoire [23, 65] en ~300 ms, et la progression reprend. Cycle illimité.

**Independent Test**: Depuis la modale, taper [REFUSER] → modale fermée, barre descend visiblement ~300 ms, `conformite.percentage` ∈ [23, 65], progression passive continue.

- [ ] T007 [US3] Modifier `components/ConformiteDisplay.tsx` : import `useRef` + `Animated`, créer `animatedBarWidth` (`useRef(new Animated.Value(0)).current`) + `isAnimatingRef` + `useEffect` de sync game-tick (voir quickstart.md étape 4c — section refs/hooks)
- [ ] T008 [US3] Implémenter `handleRefuse` dans `components/ConformiteDisplay.tsx` : `setModalVisible(false)`, appel `refuseReaffectation()`, `animatedBarWidth.setValue(100)`, `Animated.timing` 300 ms + callback reset `isAnimatingRef` (voir quickstart.md étape 4c — section handleRefuse)
- [ ] T009 [US3] Remplacer `<View>` par `<Animated.View>` pour la barre de progression dans `components/ConformiteDisplay.tsx` + passer `onRefuse={handleRefuse}` à `<ReaffectationModal>` (voir quickstart.md étape 4d, 4e partiel)

**Checkpoint**: Les trois user stories sont fonctionnelles. Le cycle refus → progression → 100 % → modale peut se répéter indéfiniment.

---

## Phase Finale: Polish

**Purpose**: Validation qualité globale.

- [ ] T010 Lint `npm run lint` — vérifier 0 nouvelle erreur

---

## Dependencies & Execution Order

### Phase Dependencies

- **Fondation (Phase 2)**: T001 et T002 parallélisables — aucun prérequis
- **US1 (Phase 3)**: T003 puis T004 (T004 importe ReaffectationModal) — dépend de Fondation uniquement pour T004 si `refuseReaffectation` est passé en prop dès le départ (non requis pour US1)
- **US2 (Phase 4)**: T005 et T006 parallélisables — dépendent tous deux de US1
- **US3 (Phase 5)**: T007 → T008 → T009, séquentiels dans ConformiteDisplay — dépendent de Fondation (T002) et US1 (T004)
- **Polish (Phase Finale)**: après toutes les phases

### User Story Dependencies

- **US1 (P1)**: Peut démarrer après Fondation — aucune dépendance sur US2/US3
- **US2 (P2)**: Peut démarrer après US1 — indépendante de US3
- **US3 (P2)**: Peut démarrer après Fondation + US1 — indépendante de US2

### Parallel Opportunities

- T001 ‖ T002 (Phase 2 — fichiers différents)
- T005 ‖ T006 (Phase 4 — fichiers différents)
- T007 → T008 → T009 séquentiels (même fichier)

---

## Implementation Strategy

### MVP First (User Story 1)

1. Compléter Phase 2 (Fondation) — T001, T002
2. Compléter Phase 3 (US1) — T003, T004
3. **STOP et VALIDER** : la modale s'ouvre, est non-dismissible, les boutons ferment
4. Livrable : CTA fonctionnel, modale affichée

### Delivery Incrémental

1. Fondation + US1 → MVP ✅
2. + US2 → parcours acceptation opérationnel ✅
3. + US3 → cycle complet avec animation ✅
4. Polish → lint propre ✅

---

## Notes

- Tous les textes des boutons et du message sont **figés** — copier mot pour mot depuis quickstart.md
- `useNativeDriver: false` est obligatoire pour `Animated.timing` sur `width`
- Le guard `isAnimatingRef` empêche les game-ticks (100 ms) d'interrompre l'animation de 300 ms
- Committer après chaque phase ou groupe logique
