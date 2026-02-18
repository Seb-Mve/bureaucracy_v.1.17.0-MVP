---

description: "Task list for feature 002-formulaires-storage-cap implementation"
---

# Tasks: Limite de Stockage des Formulaires

**Input**: Design documents from `/specs/002-formulaires-storage-cap/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/storage-logic-api.md ✅, research.md ✅, quickstart.md ✅

**Tests**: No tests requested in specification - tasks focus on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- **[i18n]**: Internationalization/localization task (French language, formatting)
- **[a11y]**: Accessibility task (WCAG compliance, screen readers, touch targets)
- **[perf]**: Performance optimization task (60fps, bundle size, rendering)
- Include exact file paths in descriptions

## Path Conventions

React Native / Expo project structure:
- Types: `types/`
- Constants: `constants/`
- Data layer: `data/`
- Context: `context/`
- Utils: `utils/`
- Components: `components/`
- App screens: `app/(tabs)/`

---

## Phase 1: Setup (Type Definitions & Constants)

**Purpose**: Define types and constants needed for storage cap feature

- [X] T001 [P] Add currentStorageCap field to GameState interface in types/game.ts
- [X] T002 [P] Extend Upgrade type with 'storage' option and storageConfig in types/game.ts
- [X] T003 [P] Add RED_BLOCKED constant (#FF0000) to constants/Colors.ts

**Checkpoint**: Type definitions ready - data layer can now be implemented

---

## Phase 2: Foundational (Data Layer & Migration)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create storageLogic.ts with 6 pure functions per contracts/storage-logic-api.md in data/storageLogic.ts
- [X] T005 Add 4 storage upgrades (storage_upgrade_1 through storage_upgrade_4) to upgrades array in data/gameData.ts
- [X] T006 Set initialGameState.currentStorageCap to 983 in data/gameData.ts
- [X] T007 Create migrateV3toV4 function with currentStorageCap fallback in utils/stateMigration.ts
- [X] T008 Update LATEST_VERSION to 4 in utils/stateMigration.ts
- [X] T009 Add migrateV3toV4 call to migration chain in utils/stateMigration.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Découverte du Blocage Initial (Priority: P1) 🎯 MVP

**Goal**: Joueur expérimente le blocage visuel (compteur rouge clignotant) au seuil de 983 formulaires

**Independent Test**: Produire 983 formulaires manuellement, vérifier que le compteur se bloque, devient rouge (#FF0000) et clignote à ~2Hz. Aucune production supplémentaire n'ajoute de formulaires.

### Implementation for User Story 1

- [X] T010 [US1] Add purchaseStorageUpgrade method to GameStateContext in context/GameStateContext.tsx
- [X] T011 [US1] Add applyStorageCap call in game loop to enforce cap in context/GameStateContext.tsx
- [X] T012 [US1] Export purchaseStorageUpgrade method in GameStateContext provider value in context/GameStateContext.tsx
- [X] T013 [P] [US1] Create shared opacity value with useSharedValue in components/ResourceCounter.tsx
- [X] T014 [P] [US1] Import and call isStorageBlocked from storageLogic in components/ResourceCounter.tsx
- [X] T015 [US1] Add useEffect with withRepeat animation for blinking when blocked in components/ResourceCounter.tsx
- [X] T016 [US1] Add conditional red color styling when isStorageBlocked is true in components/ResourceCounter.tsx
- [X] T017 [US1] Apply animatedStyle to counter text View in components/ResourceCounter.tsx
- [X] T018 [P] [US1] [a11y] Add accessibilityLabel with blocked state message in components/ResourceCounter.tsx
- [X] T019 [P] [US1] [perf] Verify animation runs at 60fps with worklets on UI thread in components/ResourceCounter.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - blocage visuel works, no production beyond 983

---

## Phase 4: User Story 2 - Premier Déblocage de Stockage (Priority: P2)

**Goal**: Joueur découvre et achète "Casier de Secours B-9" (Admin 2) pour débloquer la limite à 1 983 formulaires

**Independent Test**: Atteindre 983 formulaires, acheter "Casier de Secours B-9" dans Administration 2, vérifier stock → 0 et nouvelle limite 1 983. Clignotement s'arrête immédiatement.

### Implementation for User Story 2

- [X] T020 [US2] Import getVisibleStorageUpgrades from storageLogic in app/(tabs)/recruitment.tsx
- [X] T021 [US2] Filter storage upgrades with getVisibleStorageUpgrades in app/(tabs)/recruitment.tsx
- [X] T022 [US2] Filter normal upgrades excluding type 'storage' in app/(tabs)/recruitment.tsx
- [X] T023 [US2] Add conditional section for storage upgrades display in app/(tabs)/recruitment.tsx
- [X] T024 [US2] Map storage upgrades to UpgradeCard components with purchaseStorageUpgrade callback in app/(tabs)/recruitment.tsx
- [X] T025 [US2] Pass canPurchaseStorageUpgrade result to UpgradeCard for purchase validation in app/(tabs)/recruitment.tsx
- [X] T026 [P] [US2] [i18n] Verify French bureaucratic names and descriptions display correctly in app/(tabs)/recruitment.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - blocage + premier déblocage

---

## Phase 5: User Story 3 - Progression Séquentielle des Déblocages (Priority: P2)

**Goal**: Joueur découvre les 3 autres upgrades (Admin 3, 4, 5) et comprend qu'ils doivent être achetés dans l'ordre strict

**Independent Test**: Acheter storage_upgrade_1, vérifier que storage_upgrade_2 devient achetable. Tenter d'acheter storage_upgrade_3 sans storage_upgrade_2 → doit être grisé/non achetable. Acheter tous les upgrades jusqu'à storage_upgrade_4 → limite devient null (illimitée).

### Implementation for User Story 3

- [X] T027 [P] [US3] Add visual disabled state for storage upgrades when canPurchaseStorageUpgrade returns false in app/(tabs)/recruitment.tsx
- [X] T028 [P] [US3] Add tooltip or helper text indicating required upgrade prerequisite in app/(tabs)/recruitment.tsx
- [X] T029 [P] [US3] Verify storage_upgrade_4 sets currentStorageCap to null (unlimited) after purchase in context/GameStateContext.tsx
- [X] T030 [P] [US3] [i18n] Verify all 4 storage upgrade names follow French bureaucratic conventions in data/gameData.ts

**Checkpoint**: All user stories (1, 2, 3) should now be independently functional - full upgrade sequence works

---

## Phase 6: User Story 4 - Gestion du Surplus Automatique (Priority: P3)

**Goal**: Joueur avec production automatique observe que tout surplus au-delà de la limite est définitivement perdu

**Independent Test**: Configurer production automatique générant >10 formulaires/seconde, atteindre 980 formulaires avec limite 983, observer que compteur se fige à 983 et surplus est perdu silencieusement.

### Implementation for User Story 4

- [X] T031 [P] [US4] Import calculateProductionWithCap from storageLogic in context/GameStateContext.tsx
- [X] T032 [US4] Replace direct production calculation with calculateProductionWithCap in game loop in context/GameStateContext.tsx
- [X] T033 [P] [US4] Verify no notification appears when surplus formulaires are lost in context/GameStateContext.tsx
- [X] T034 [P] [US4] [perf] Verify game loop maintains 100ms interval with production capping logic in context/GameStateContext.tsx

**Checkpoint**: All user stories complete - full feature functional with automatic production handling

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T035 [P] Verify WCAG 2.1 AA contrast ratio (4.5:1) for red text #FF0000 on background
- [X] T036 [P] [perf] Performance audit with React DevTools Profiler for 60fps during blinking
- [X] T037 [P] [a11y] Test with React Native Accessibility Inspector for screen reader compatibility
- [X] T038 [P] [i18n] Verify number formatting uses French conventions (1 000, 1 983, 11 025) with Intl.NumberFormat
- [X] T039 [P] Code review storageLogic.ts for JSDoc comments on all exported functions
- [X] T040 [P] Verify migration V3→V4 handles edge cases (missing currentStorageCap, corrupt state)
- [ ] T041 Validate all acceptance scenarios from spec.md manually on iOS/Android simulators
- [ ] T042 Run quickstart.md validation checklist (7 steps completed successfully)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2 → P3)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P2)**: Can start after US2 complete - Extends upgrade sequence logic
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent validation of surplus handling

### Within Each User Story

- Context changes before component changes (GameStateContext.tsx → components/ResourceCounter.tsx)
- Core logic implementation before UI integration (storageLogic.ts → components)
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: All 3 tasks (T001, T002, T003) can run in parallel [P] - different files
- **Phase 2**: All foundational tasks are sequential (single file edits with dependencies)
- **Phase 3**: T013, T014, T018, T019 can run in parallel [P] - different concerns within component
- **Phase 4**: T026 can run in parallel [P] - verification task
- **Phase 5**: All tasks (T027-T030) can run in parallel [P] - different files/concerns
- **Phase 6**: T031, T033, T034 can run in parallel [P] - different concerns
- **Phase 7**: All polish tasks can run in parallel [P] - independent validation

---

## Parallel Example: User Story 1

```bash
# Launch these tasks together within User Story 1:
Task T013: "Create shared opacity value with useSharedValue in components/ResourceCounter.tsx"
Task T014: "Import and call isStorageBlocked from storageLogic in components/ResourceCounter.tsx"
Task T018: "Add accessibilityLabel with blocked state message in components/ResourceCounter.tsx"
Task T019: "Verify animation runs at 60fps with worklets on UI thread"

# These are different concerns within the same component that can be developed in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types & constants)
2. Complete Phase 2: Foundational (data layer, migration, pure functions)
3. Complete Phase 3: User Story 1 (blocage visuel)
4. **STOP and VALIDATE**: Test User Story 1 independently - compteur bloque à 983, clignote rouge
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (first deblocage works)
4. Add User Story 3 → Test independently → Deploy/Demo (full upgrade sequence)
5. Add User Story 4 → Test independently → Deploy/Demo (automatic production handling)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (compteur clignotant)
   - Developer B: User Story 2 (upgrade visibility)
   - Developer C: User Story 4 (automatic production)
3. Developer A then tackles User Story 3 (après US2 complete)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow existing patterns: storageLogic.ts mirrors conformiteLogic.ts pattern
- Atomic transaction critical for purchaseStorageUpgrade (setGameState once)
- Reanimated v3 worklets guarantee 60fps for blinking animation
- All French text already defined in data/gameData.ts (no additional i18n tasks)

---

## Summary

- **Total Tasks**: 42
- **User Story 1**: 10 tasks (blocage visuel + clignotement rouge)
- **User Story 2**: 7 tasks (premier déblocage visible + achetable)
- **User Story 3**: 4 tasks (progression séquentielle des 4 upgrades)
- **User Story 4**: 4 tasks (gestion surplus automatique)
- **Setup/Foundation**: 9 tasks (types, data, migration)
- **Polish**: 8 tasks (validation, accessibilité, performance)

**Parallel Opportunities Identified**:
- Phase 1: 3 parallel tasks (types & constants)
- Phase 3 (US1): 4 parallel tasks (component concerns)
- Phase 5 (US3): 4 parallel tasks (UI enhancements)
- Phase 6 (US4): 3 parallel tasks (production validation)
- Phase 7: 8 parallel tasks (all polish validations)

**MVP Scope (Recommended)**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only)
- **Estimated Time**: 1.5-2 hours (types → data → context → component)
- **Deliverable**: Joueur expérimente le blocage visuel à 983 formulaires (rouge clignotant)
- **Value**: Core mechanic demonstrable, frustration barrier active

**Full Feature Scope**: All phases (1-7)
- **Estimated Time**: 2-3 hours total (per quickstart.md)
- **Deliverable**: Complete storage cap system with 4 upgrades, sequential progression, automatic production handling
