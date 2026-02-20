# Tasks: Système de Prestige "Réforme Administrative"

**Input**: Design documents from `/specs/001-prestige-reform/`
**Prerequisites**: plan.md, spec.md (user stories), research.md, data-model.md, contracts/prestige-api.ts, quickstart.md

**Tests**: Tests are NOT explicitly requested in the feature specification. Only manual testing is planned (see quickstart.md test cases).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- **[i18n]**: French language task (formatting, terminology)
- **[a11y]**: Accessibility task (WCAG compliance, screen readers, touch targets)
- **[perf]**: Performance optimization task (60fps, response times)
- Include exact file paths in descriptions

## Path Conventions

This is a React Native Expo project with the following structure:
- **Types**: `types/` (type definitions)
- **Data logic**: `data/` (pure functions, game data)
- **Context**: `context/` (React Context API for state)
- **Components**: `components/` (UI components)
- **Screens**: `app/(tabs)/` (Expo Router screens)
- **Utils**: `utils/` (formatters, migrations, helpers)

---

## Phase 0: Pre-flight Validation (CRITICAL BLOCKER)

**Purpose**: Verify schema v4 assumptions before proceeding

**⚠️ CRITICAL**: This phase MUST complete successfully before ANY other work begins. Blocks all implementation if schema is unexpected.

- [ ] T000 [BLOCKER] Verify AsyncStorage schema is v4 by reading `types/game.ts` and `utils/stateMigration.ts` - Confirm fields `currentStorageCap`, `conformite`, `messageSystem`, `journal` are present in GameState interface. If schema version is NOT v4 or expected fields are missing, STOP and report blocking issue to team lead.

**Checkpoint**: Schema v4 confirmed - safe to proceed with implementation

---

## Phase 1: Setup (Project Configuration)

**Purpose**: Update project configuration for prestige system

- [ ] T001 [P] Update types in types/game.ts to add Tier, PrestigeUpgrade, PrestigeTransaction types
- [ ] T002 [P] Update GameState interface in types/game.ts to add paperclips, totalAdministrativeValue, currentTier, prestigeUpgrades, prestigeInProgress fields
- [ ] T003 [P] Add prestige upgrades catalog in data/gameData.ts (5 upgrades with French names, costs, effects)
- [ ] T004 Update initial game state in data/gameData.ts to include default prestige fields

**Checkpoint**: Type definitions and data catalog complete - business logic can now be implemented

---

## Phase 2: Foundational (Core Infrastructure)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create data/prestigeLogic.ts with pure calculation functions (calculatePrestigePaperclips, getTierCoefficient, getMinVATForPrestige)
- [ ] T006 [P] Add applyPrestigeMultipliers function in data/prestigeLogic.ts (production modifiers)
- [ ] T007 [P] Add applyPrestigeStorageBonus function in data/prestigeLogic.ts (storage capacity modifiers)
- [ ] T008 [P] Add getClickMultiplier function in data/prestigeLogic.ts (click bonus calculation)
- [ ] T009 [P] Add getPrestigePotential function in data/prestigeLogic.ts (complete prestige potential data)
- [ ] T010 [P] Add canPurchasePrestigeUpgrade validation function in data/prestigeLogic.ts
- [ ] T011 [P] Add TIER_COEFFICIENTS constant in data/prestigeLogic.ts (1000, 5000, 25000)
- [ ] T012 [P] Add JSDoc comments to all prestige logic functions with examples and formulas
- [ ] T013 Update utils/stateMigration.ts to add v4→v5 migration logic (add paperclips, totalAdministrativeValue, currentTier, prestigeUpgrades, prestigeInProgress fields)
- [ ] T014 Update utils/stateMigration.ts to add validation for v5 schema fields in isValidGameState function

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Visualiser le Potentiel de Réforme (Priority: P1) 🎯 MVP

**Goal**: Le joueur peut voir en temps réel combien de Trombones il peut obtenir avant de déclencher une Réforme Administrative

**Independent Test**: Accumuler différentes quantités de ressources et vérifier que la jauge calcule correctement le nombre de Trombones selon la formule trans-phasique (sqrt(VAT/coefficient)). Délivre la valeur de transparence sur la progression.

### Implementation for User Story 1

- [ ] T015 [US1] Extend GameStateContext.tsx to add getPrestigePotentialLive function (reactive calculation hook)
- [ ] T016 [US1] Update GameStateContext.tsx updateGameLoop to track totalAdministrativeValue increment (VAT tracking for all resource production)
- [ ] T017 [US1] Update GameStateContext.tsx manual click handler to increment totalAdministrativeValue for manual production (TAMPONNER button)
- [ ] T018 [P] [US1] Create components/PrestigeGauge.tsx component (displays real-time prestige potential with Trombone count)
- [ ] T019 [P] [US1] [i18n] Add French text in components/PrestigeGauge.tsx ("Réforme Administrative disponible : X Trombones" or warning if insufficient VAT)
- [ ] T020 [US1] Update app/(tabs)/options.tsx to add PrestigeGauge component above reset button
- [ ] T021 [P] [US1] [a11y] Add accessibility label to PrestigeGauge component ("Potentiel de Réforme : X Trombones disponibles")
- [ ] T022 [P] [US1] [perf] Add throttling to PrestigeGauge updates (max 500ms refresh rate to avoid excessive renders)

**Checkpoint**: At this point, User Story 1 should be fully functional - player can see real-time prestige potential and understand Trombone calculation

---

## Phase 4: User Story 2 - Effectuer une Réforme Administrative (Priority: P1) 🎯 MVP

**Goal**: Le joueur peut déclencher le prestige pour reset sa progression et gagner des Trombones permanents

**Independent Test**: Déclencher manuellement le prestige et vérifier que : (1) Trombones crédités correctement, (2) ressources remises à zéro, (3) infrastructures réinitialisées, (4) améliorations de prestige désactivées. Délivre la valeur de reset avec récompense.

### Implementation for User Story 2

- [ ] T023 [US2] Add performPrestige function to GameStateContext.tsx with two-phase commit logic (transaction log, reset, credit paperclips, commit)
- [ ] T024 [US2] Implement prestige transaction logging in performPrestige (write prestige_transaction to AsyncStorage before reset)
- [ ] T025 [US2] Implement resource and infrastructure reset logic in performPrestige (resources to 0, agents to 0, administrations locked except centrale, upgrades disabled, VAT to 0)
- [ ] T026 [US2] Add transaction commit and cleanup in performPrestige (save to AsyncStorage, clear transaction log)
- [ ] T027 [P] [US2] Add recoverPrestigeTransaction function in GameStateContext.tsx for crash recovery (check transaction age, complete or rollback)
- [ ] T028 [P] [US2] Add checkForIncompletePrestige function in GameStateContext.tsx initialization (detect prestigeInProgress flag on app startup)
- [ ] T029 [US2] Rename "Réinitialiser le jeu" button to "Réforme Administrative" in app/(tabs)/options.tsx
- [ ] T030 [US2] Add confirmation dialog in app/(tabs)/options.tsx for prestige action (displays Trombones gain, warns about reset)
- [ ] T031 [P] [US2] [i18n] Add French confirmation dialog text in app/(tabs)/options.tsx ("Confirmer la Réforme Administrative ? Vous gagnerez X Trombones. Toutes vos ressources et infrastructures seront réinitialisées.")
- [ ] T032 [US2] Disable prestige button in app/(tabs)/options.tsx when gain would be 0 Trombones (show error message with minimum VAT required)
- [ ] T033 [P] [US2] [a11y] Ensure prestige confirmation dialog is navigable with screen readers (focus on Confirmer/Annuler buttons)
- [ ] T034 [P] [US2] [perf] Ensure prestige operation completes in under 200ms perceived response time (debounce save to AsyncStorage)

**Checkpoint**: At this point, User Story 2 should be fully functional - player can perform prestige safely with transaction integrity and proper reset

---

## Phase 5: User Story 3 - Acheter des Améliorations de Prestige (Priority: P2)

**Goal**: Le joueur peut dépenser des Trombones pour acheter des améliorations temporaires qui boostent le run courant

**Independent Test**: Créditer manuellement des Trombones, accéder à la boutique, vérifier que les achats fonctionnent, coûts déduits, effets appliqués. Délivre la valeur d'amélioration du run.

### Implementation for User Story 3

- [ ] T035 [P] [US3] Create components/PrestigeUpgradeCard.tsx component (individual upgrade card with name, description, cost, buy button, active status)
- [ ] T036 [P] [US3] Create components/PrestigeShopModal.tsx component (full-screen modal listing all 5 prestige upgrades with Trombone balance display)
- [ ] T037 [US3] Add buyPrestigeUpgrade function to GameStateContext.tsx (validate cost, deduct Trombones, activate upgrade, show toast)
- [ ] T038 [US3] Add hasPrestigeUpgrade function to GameStateContext.tsx (check if upgrade is active in current run)
- [ ] T039 [US3] Add getActivePrestigeUpgrades function to GameStateContext.tsx (return array of active upgrade IDs)
- [ ] T040 [US3] Add "Boutique de Prestige" menu item to app/(tabs)/_layout.tsx burger menu (same level as journal S.I.C., no badge, icon: Paperclip from lucide-react-native)
- [ ] T041 [US3] Connect PrestigeShopModal to menu item in app/(tabs)/_layout.tsx (open modal on menu press)
- [ ] T042 [P] [US3] [i18n] Add French text for all prestige upgrades in components/PrestigeShopModal.tsx and PrestigeUpgradeCard.tsx (names, descriptions from data-model.md)
- [ ] T043 [P] [US3] [i18n] Add French toast notification in buyPrestigeUpgrade ("Amélioration achetée : [Nom]")
- [ ] T044 [P] [US3] [i18n] Format Trombone balance with formatNumberFrench in components/PrestigeShopModal.tsx (French thousand separators)
- [ ] T045 [P] [US3] [a11y] Add accessibility labels to PrestigeUpgradeCard buttons ("[Nom] - Coût : X Trombones - Actif/Disponible/Bloqué")
- [ ] T046 [P] [US3] [a11y] Ensure all upgrade buttons have minimum 44×44pt touch targets
- [ ] T047 [P] [US3] [a11y] Ensure "ACTIF" status uses icon + text, not color alone (Principle IV compliance)
- [ ] T048 [P] [US3] Style active upgrades in PrestigeUpgradeCard.tsx (grayed out, "ACTIF" badge, disabled button)
- [ ] T049 [P] [US3] Style unavailable upgrades in PrestigeUpgradeCard.tsx (insufficient Trombones error state)

**Checkpoint**: At this point, User Story 3 should be fully functional - player can browse and purchase prestige upgrades with proper UI feedback

---

## Phase 6: User Story 4 - Observer les Effets des Améliorations (Priority: P3)

**Goal**: Les améliorations de prestige appliquent correctement leurs effets au gameplay (production, stockage, clics)

**Independent Test**: Activer manuellement une amélioration et mesurer les productions avant/après pour vérifier l'application correcte des multiplicateurs. Délivre la valeur de feedback sur l'efficacité de l'investissement.

### Implementation for User Story 4

- [ ] T050 [US4] Integrate applyPrestigeMultipliers into GameStateContext.tsx calculateProduction function (apply production bonuses after agent multipliers)
- [ ] T051 [US4] Integrate applyPrestigeStorageBonus into GameStateContext.tsx storage capacity calculation (increase Formulaires cap if prestige_04 active)
- [ ] T052 [US4] Integrate getClickMultiplier into manual click handler in GameStateContext.tsx or relevant component (TAMPONNER button generates 2 dossiers if prestige_01 active)
- [ ] T053 [P] [US4] Create components/FloatingText.tsx component for visual feedback ("+2" animation when prestige_01 active)
- [ ] T054 [US4] Add FloatingText spawn logic to TAMPONNER button click handler (show "+2" or "+1" based on clickMultiplier)
- [ ] T055 [P] [US4] [perf] Optimize FloatingText component with Reanimated for smooth 60fps animation (1s fade + translate up)
- [ ] T056 [P] [US4] [i18n] Use French number formatting in FloatingText component ("+2" not "+2.0")

**Checkpoint**: At this point, User Story 4 should be fully functional - all prestige upgrade effects apply correctly to production, storage, and clicks with visual feedback

---

## Phase 7: User Story 5 - Progresser entre les Strates (Priority: P3)

**Goal**: La progression entre strates (Locale → Nationale → Mondiale) persiste après prestige et augmente la difficulté de génération de Trombones

**Independent Test**: Changer manuellement la strate, vérifier que : (1) strate persiste après prestige, (2) coefficient change correctement, (3) calculs de Trombones reflètent nouveau coefficient. Délivre la valeur de progression long-terme.

### Implementation for User Story 5

- [ ] T057 [US5] Verify currentTier persistence in performPrestige function (ensure currentTier is NOT reset during prestige)
- [ ] T058 [US5] Verify getTierCoefficient is correctly used in calculatePrestigePaperclips (correct coefficient for each tier: 1000, 5000, 25000)
- [ ] T059 [P] [US5] Add tier display in components/PrestigeGauge.tsx (show current tier: "Strate Locale/Nationale/Mondiale")
- [ ] T060 [P] [US5] [i18n] Add French tier names in components/PrestigeGauge.tsx ("Strate Locale", "Strate Nationale", "Strate Mondiale")

**Note**: Tier unlocking mechanism is OUT OF SCOPE for this feature (future work). All players default to 'local' tier.

**Checkpoint**: At this point, User Story 5 should be functional - tier system infrastructure is in place and tier persistence is validated

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T061 [P] [perf] Validate 60fps performance on iPhone 11 equivalent during prestige operation (measure with React DevTools Profiler)
- [ ] T062 [P] [perf] Validate prestige calculation completes in under 200ms on mid-range Android device
- [ ] T063 [P] [a11y] Run React Native Accessibility Inspector audit on PrestigeShopModal and PrestigeGauge
- [ ] T064 [P] [a11y] Verify WCAG 2.1 AA contrast ratios for all prestige UI text (minimum 4.5:1 for normal text, 3:1 for large text)
- [ ] T065 [P] [i18n] Review all French text for authentic bureaucratic terminology and correct accents/grammar
- [ ] T066 [P] [i18n] Verify French number formatting in all prestige contexts (spaces as thousand separators, no decimals for Trombones)
- [ ] T067 Test migration from v4 to v5 with existing save data (verify no data loss, default values applied correctly)
- [ ] T068 Execute all manual test cases from quickstart.md (Fresh Install, VAT Accumulation, First Prestige, Purchase Upgrade, Upgrade Effect, Prestige Resets Upgrades, Migration)
- [ ] T069 [P] Update .specify/memory/copilot-instructions.md with prestige system context (agents should know about Trombones, upgrades, prestige mechanics)
- [ ] T070 [P] Add console.log for prestige operations in development mode only (log VAT before prestige, Trombones calculated, reset confirmation, AsyncStorage save success)
- [ ] T071 Verify edge cases: (1) prestige with 0 gain blocked, (2) overflow handling for large VAT values, (3) rapid upgrade purchase prevention, (4) crash recovery during prestige, (5) floor calculation accuracy
- [ ] T072 Code cleanup: Remove any placeholder code, ensure consistent naming conventions, verify TypeScript strict mode compliance
- [ ] T073 Final validation: Run the app on iOS AND Android simulators, trigger all 5 user stories end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - Can start independently
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - Can start independently (integrates with US1 for gauge display)
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - Can start independently
- **User Story 4 (Phase 6)**: Depends on User Story 3 (upgrades must be purchasable before effects can be tested)
- **User Story 5 (Phase 7)**: Depends on User Story 1 and 2 (tier coefficient affects prestige calculation)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - DELIVERS: Real-time prestige gauge
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 gauge but independently testable - DELIVERS: Prestige reset mechanism
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories - DELIVERS: Prestige shop and upgrade purchases
- **User Story 4 (P3)**: REQUIRES User Story 3 completion (must be able to buy upgrades before testing effects) - DELIVERS: Upgrade effects application
- **User Story 5 (P3)**: Can start after US1 and US2 (tier coefficient affects prestige calculation) - DELIVERS: Tier system infrastructure

### Within Each User Story

- Tasks within a story should generally follow this order:
  1. Context/state functions (GameStateContext.tsx extensions)
  2. UI components (create new components)
  3. Integration (connect components to context)
  4. Localization (French text, number formatting)
  5. Accessibility (labels, touch targets, contrast)
  6. Performance (optimization, throttling)

### Parallel Opportunities

- **Phase 1 (Setup)**: All 4 tasks can run in parallel (T001-T004, different files)
- **Phase 2 (Foundational)**: Most tasks can run in parallel (T006-T012 all in prestigeLogic.ts but different functions, T013-T014 in stateMigration.ts)
- **Phase 3 (US1)**: T018-T022 can run in parallel (components, i18n, a11y, perf - different concerns)
- **Phase 4 (US2)**: T027-T028 can run in parallel (recovery functions), T031-T034 can run in parallel (i18n, a11y, perf)
- **Phase 5 (US3)**: T035-T036 can run in parallel (two components), T042-T049 can run in parallel (i18n, a11y, styling - different concerns)
- **Phase 6 (US4)**: T053-T056 can run in parallel (FloatingText component + optimization + i18n)
- **Phase 7 (US5)**: T059-T060 can run in parallel (tier display + i18n)
- **Phase 8 (Polish)**: T061-T066 can run in parallel (perf, a11y, i18n audits), T069-T070 can run in parallel (documentation, logging)

---

## Parallel Example: User Story 3 (Prestige Shop)

```bash
# Launch component creation in parallel:
Task T035: "Create components/PrestigeUpgradeCard.tsx component"
Task T036: "Create components/PrestigeShopModal.tsx component"

# After components exist, launch all polish tasks in parallel:
Task T042: "Add French text for all prestige upgrades"
Task T043: "Add French toast notification in buyPrestigeUpgrade"
Task T044: "Format Trombone balance with formatNumberFrench"
Task T045: "Add accessibility labels to PrestigeUpgradeCard buttons"
Task T046: "Ensure all upgrade buttons have minimum 44×44pt touch targets"
Task T047: "Ensure ACTIF status uses icon + text, not color alone"
Task T048: "Style active upgrades in PrestigeUpgradeCard.tsx"
Task T049: "Style unavailable upgrades in PrestigeUpgradeCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

**Recommended for fastest time-to-value**:

1. Complete Phase 1: Setup (4 tasks, ~30 minutes)
2. Complete Phase 2: Foundational (10 tasks, ~2 hours)
3. Complete Phase 3: User Story 1 (8 tasks, ~1.5 hours)
4. Complete Phase 4: User Story 2 (12 tasks, ~2 hours)
5. **STOP and VALIDATE**: Test prestige flow end-to-end (accumulate VAT → see gauge → perform prestige → verify reset)
6. Deploy/demo MVP with prestige reset functionality

**MVP delivers**: Core prestige loop (reset with Trombone reward) without shop or upgrades yet.

### Incremental Delivery (Add Features Progressively)

1. Complete Setup + Foundational → Foundation ready (14 tasks, ~2.5 hours)
2. Add User Story 1 → Test independently → **Demo 1**: Prestige gauge visible (8 tasks, ~1.5 hours)
3. Add User Story 2 → Test independently → **Demo 2**: Prestige reset working (12 tasks, ~2 hours)
4. Add User Story 3 → Test independently → **Demo 3**: Prestige shop and upgrades (15 tasks, ~3 hours)
5. Add User Story 4 → Test independently → **Demo 4**: Upgrade effects active (7 tasks, ~1.5 hours)
6. Add User Story 5 → Test independently → **Demo 5**: Tier system infrastructure (4 tasks, ~1 hour)
7. Complete Phase 8: Polish → **Final Release** (13 tasks, ~2 hours)

**Total estimated time**: 13-15 hours of focused development

### Parallel Team Strategy

With 3 developers:

1. **Week 1**: All team members complete Setup + Foundational together (ensure shared understanding)
2. **Week 2**: Once Foundational is done:
   - **Developer A**: User Story 1 (Prestige Gauge) + User Story 2 (Prestige Reset) → MVP core
   - **Developer B**: User Story 3 (Prestige Shop) → Shop infrastructure
   - **Developer C**: User Story 5 (Tier System) → Tier infrastructure
3. **Week 3**: Integration
   - **Developer A**: User Story 4 (Upgrade Effects) → Integrate shop with gameplay
   - **Developer B**: Phase 8 (Polish) → Accessibility and i18n audit
   - **Developer C**: Phase 8 (Testing) → Execute all manual test cases

---

## Notes

- **[P] marker**: Tasks can run in parallel because they touch different files or independent concerns (e.g., i18n, a11y, perf)
- **[Story] label**: Maps task to specific user story for traceability and independent testing
- **[i18n] marker**: French language, formatting, terminology (Constitutional Principle III)
- **[a11y] marker**: Accessibility compliance (Constitutional Principle IV)
- **[perf] marker**: Performance optimization (Constitutional Principle I)
- **Each user story delivers independent value**: Can be tested and demoed separately
- **Tests NOT included**: Manual testing only (as specified in quickstart.md)
- **Commit strategy**: Commit after completing each user story phase (logical checkpoints)
- **Validation**: Stop at each checkpoint to validate story independently before proceeding

---

## Total Task Count

- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 10 tasks
- **Phase 3 (User Story 1)**: 8 tasks
- **Phase 4 (User Story 2)**: 12 tasks
- **Phase 5 (User Story 3)**: 15 tasks
- **Phase 6 (User Story 4)**: 7 tasks
- **Phase 7 (User Story 5)**: 4 tasks
- **Phase 8 (Polish)**: 13 tasks

**Total**: 73 tasks

---

## Task Count per User Story

- **User Story 1** (Visualiser le Potentiel): 8 tasks
- **User Story 2** (Effectuer une Réforme): 12 tasks
- **User Story 3** (Acheter des Améliorations): 15 tasks
- **User Story 4** (Observer les Effets): 7 tasks
- **User Story 5** (Progresser entre Strates): 4 tasks

---

## Parallel Opportunities Identified

- **Setup phase**: 4 tasks can run fully in parallel (different files)
- **Foundational phase**: 8 tasks can run in parallel (pure functions in prestigeLogic.ts, migration in stateMigration.ts)
- **Per user story**: Average 4-6 tasks can run in parallel (components + i18n + a11y + perf)
- **Cross-story**: User Stories 1, 2, 3, 5 can start in parallel after Foundational (only US4 depends on US3)
- **Polish phase**: 9 tasks can run in parallel (audits, documentation, logging)

**Estimated parallelization**: With 3 developers, project can be completed in ~40% of sequential time.

---

## Independent Test Criteria (per User Story)

- **US1**: Accumulate resources → check gauge displays correct Trombone count via formula
- **US2**: Trigger prestige → verify Trombones credited, resources reset, infrastructure reset, upgrades disabled
- **US3**: Credit Trombones → buy upgrade → verify cost deducted, upgrade activated, button state changes
- **US4**: Activate upgrade → measure production/click → verify multipliers applied correctly
- **US5**: Change tier → trigger prestige → verify tier persists, coefficient changes, Trombone calculation updates

---

## Suggested MVP Scope

**MVP = User Stories 1 + 2** (Core prestige loop):
- Player can see prestige potential in real-time (US1)
- Player can perform prestige reset and gain Trombones (US2)
- **Excludes**: Prestige shop, upgrades, tier progression
- **Estimated time**: ~6 hours (14 setup + 20 user story tasks)
- **Value delivered**: Complete prestige reset mechanism with transaction safety

**Full Feature = All User Stories**:
- Add prestige shop and upgrades (US3) → ~3 hours
- Add upgrade effects (US4) → ~1.5 hours
- Add tier infrastructure (US5) → ~1 hour
- Polish and validation → ~2 hours
- **Total estimated time**: ~13-15 hours

---

## Format Validation

✅ **ALL tasks follow checklist format**:
- Checkbox: `- [ ]`
- Task ID: Sequential (T001-T073)
- [P] marker: Present when parallelizable
- [Story] label: Present for all user story tasks (US1-US5)
- Description: Includes exact file paths and clear actions
- Special markers: [i18n], [a11y], [perf] used where applicable

✅ **Task organization**:
- Phase 1: Setup (no story labels)
- Phase 2: Foundational (no story labels)
- Phases 3-7: User Story phases (ALL tasks have [US1]-[US5] labels)
- Phase 8: Polish (no story labels)

✅ **Dependencies documented**:
- Phase dependency tree defined
- User story dependency graph defined
- Parallel opportunities identified
- Execution order specified

✅ **Immediately executable**:
- Each task has specific file path
- Each task has clear action (Create, Update, Add, Verify, etc.)
- No vague descriptions or ambiguous actions
- LLM can complete without additional context
