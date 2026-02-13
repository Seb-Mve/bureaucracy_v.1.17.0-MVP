# Tasks: Conformité Aléatoire System and Hidden Narrative Layer

**Input**: Design documents from `/specs/001-conformite-narrative/`
**Prerequisites**: plan.md (8 phases), spec.md (5 user stories), research.md, data-model.md, contracts/GameStateContext-API.md

**Feature Summary**: Implement mysterious "Conformité Aléatoire" progression system with hidden narrative elements (S.I.C. messages, rare notifications) and Phase 2 transition UI for BUREAUCRACY++ idle game.

**Tech Stack**: React Native 0.79.1, Expo SDK 53, TypeScript 5.8.3, AsyncStorage 1.21.0
**Target Platforms**: iOS 15+, Android equivalent
**Estimated Total Effort**: 20-28 hours (2.5-3.5 working days)

**Tests**: Yes - Manual testing scenarios included per spec requirements

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4, US5) - only for story-specific tasks
- **[i18n]**: French localization task
- **[a11y]**: Accessibility task
- **[perf]**: Performance task

---

## Phase 1: Setup (Project Structure & Dependencies)

**Purpose**: Initialize type definitions and data layer modules
**Duration**: 2-3 hours
**Risk**: ✅ Low - Pure TypeScript definitions

### Type Definitions

- [ ] T001 [P] Add ConformiteState interface to types/game.ts (6 properties: percentage, isUnlocked, lifetimeFormulaires, lastTestTimestamp, highestEverTampons, highestEverFormulaires)
- [ ] T002 [P] Add MessageSystemState interface to types/game.ts (3 properties: sicLastTriggerTime, nonConformityLastTriggerTime, lastProductionMilestone)
- [ ] T003 [P] Add ToastMessage interface to types/game.ts (5 properties: id, text, type, duration, timestamp)
- [ ] T004 [P] Extend GameState interface in types/game.ts with version: number, conformite?: ConformiteState, messageSystem?: MessageSystemState

**Acceptance**: TypeScript compiles without errors, optional properties marked correctly with `?`

### Data Layer Modules

- [ ] T005 [P] Create data/conformiteLogic.ts with constants: UNLOCK_TAMPONS=1000, UNLOCK_FORMULAIRES=100, TEST_COST=150, TEST_GAIN=3
- [ ] T006 [P] Implement calculateConformitePercentage(lifetimeFormulaires: number): number in data/conformiteLogic.ts
- [ ] T007 [P] Implement shouldUnlockConformite(highestTampons, highestFormulaires): boolean in data/conformiteLogic.ts
- [ ] T008 [P] Implement canPerformTest(formulaires, lastTestTimestamp): boolean in data/conformiteLogic.ts with 500ms debounce check
- [ ] T009 [P] Create data/messageSystem.ts with SIC_MESSAGES array containing 6 French bureaucratic message variants
- [ ] T010 [P] Implement getRandomSICMessage(): string in data/messageSystem.ts
- [ ] T011 [P] Implement calculateSICProbability(sicLastTriggerTime: number | null): number in data/messageSystem.ts (2% <5min, 12.5% base, 20% >30min)
- [ ] T012 [P] Implement shouldTriggerNonConformity(nonConformityLastTime: number | null): boolean in data/messageSystem.ts (0.2% probability, 10min rate limit)
- [ ] T013 [P] Add milestone threshold constants to data/messageSystem.ts: MILESTONE_DOSSIERS=100, MILESTONE_TAMPONS=50, MILESTONE_FORMULAIRES=25

**Acceptance**: All pure functions return correct values (e.g., 150 formulaires→1%, 15000→100%, probability calculations match spec)

### Minor Data Fix

- [ ] T014 [US5] Update data/gameData.ts line 7: Change name from "Administration Centrale" to "Bureau des Documents Obsolètes" (keep ID unchanged)

**Acceptance**: Name change visible in game UI, save data compatibility maintained

**Checkpoint Phase 1**: All type definitions compile successfully, data layer functions have no React dependencies, test calculations manually (450 formulaires→3%, probability checks)

---

## Phase 2: Foundational (State Migration & Persistence)

**Purpose**: Core infrastructure for save data compatibility - BLOCKS all user story work
**Duration**: 2-3 hours
**Risk**: ⚠️ Medium - Critical for save data compatibility

### State Migration

- [ ] T015 Create utils/stateMigration.ts with migrateGameState(loaded: any): GameState function
- [ ] T016 Implement version detection logic in utils/stateMigration.ts: `loaded.version || 1`
- [ ] T017 Implement V1→V2 migration in utils/stateMigration.ts: Add conformite and messageSystem with safe defaults
- [ ] T018 Set lifetimeFormulaires to current formulaires count in migration logic
- [ ] T019 Set highestEverTampons/highestEverFormulaires to current resource counts in migration logic
- [ ] T020 Add console.log migration events in utils/stateMigration.ts: '[Migration] v1→v2: Adding conformité'
- [ ] T021 Add try/catch error handling in migration with fallback to initialGameState

**Acceptance**: Mock V1 save (no version field) loads without errors, conformité initialized correctly, all existing data preserved

### Context Integration

- [ ] T022 Import migrateGameState from utils/stateMigration.ts into context/GameStateContext.tsx
- [ ] T023 Update load logic in context/GameStateContext.tsx (line 109-127): Call migrateGameState after JSON.parse
- [ ] T024 Add error handling for corrupted saves in context/GameStateContext.tsx: fallback to initialGameState on migration failure
- [ ] T025 Update initialGameState in data/gameData.ts: Add version: 2, conformite: {...}, messageSystem: {...}

**Acceptance**: V1 saves migrate successfully with all data preserved, new players start with version 2 state, corrupted saves fallback gracefully

### Testing Checkpoint

- [ ] T026 [P] Create mock V1 save JSON (no version, no conformité fields) for testing
- [ ] T027 [P] Test migration: Load mock save, verify version=2, conformité initialized
- [ ] T028 [P] Test corrupted save: Invalid JSON should fallback to initial state without crash

**Checkpoint Phase 2**: Foundation ready - all migration tests pass, old saves load correctly, ready for user story implementation

---

## Phase 3: User Story 1 - Discovering the Conformité System (Priority: P1) 🎯 MVP

**Goal**: Implement core conformité progression mechanic (0-100% mysterious stat) with unlock threshold (1000 tampons + 100 formulaires), active testing (150 formulaires cost, +3% gain), and passive progression (+1% per 150 formulaires produced)

**Independent Test**: Play to 1000 tampons + 100 formulaires, observe conformité stat appear, click test button (costs 150 formulaires), verify passive progression (+1% per 150 formulaires). Delivers complete new progression system independent of narrative messages.

**Why P1**: Core mechanic that creates the "conceptual trap" and drives player curiosity. Foundation for Phase 2 transition.

### Context Methods (Core Conformité Logic)

- [ ] T029 [US1] Add toastQueue: ToastMessage[] state to context/GameStateContext.tsx (separate from GameState, using useState)
- [ ] T030 [US1] Implement isConformiteUnlocked(): boolean method in context/GameStateContext.tsx with useMemo optimization
- [ ] T031 [US1] Implement isPhase2ButtonActive(): boolean method in context/GameStateContext.tsx
- [ ] T032 [US1] Implement performConformiteTest(): boolean method in context/GameStateContext.tsx with validation (unlocked, formulaires≥150, 500ms debounce)
- [ ] T033 [US1] Add atomic state update in performConformiteTest: deduct 150 formulaires, add +3% conformité (cap at 100), update lastTestTimestamp

**Acceptance**: performConformiteTest with 200 formulaires succeeds (-150, +3%), with 100 fails (no change), rapid clicks debounced (only first succeeds)

### Game Loop Integration (Passive Progression)

- [ ] T034 [US1] Track lifetimeFormulaires in game loop (context/GameStateContext.tsx line 163-187): Add formulairesGained to conformite.lifetimeFormulaires
- [ ] T035 [US1] Update highestEverTampons in game loop: Math.max(current, highest)
- [ ] T036 [US1] Update highestEverFormulaires in game loop: Math.max(current, highest)
- [ ] T037 [US1] Implement passive conformité progression in game loop: Call calculateConformitePercentage(lifetimeFormulaires) and update state
- [ ] T038 [US1] Add unlock check in game loop: If !isUnlocked, check shouldUnlockConformite() and set to true when thresholds met
- [ ] T039 [US1] Ensure conformité updates are atomic using pendingUpdatesRef pattern (existing game loop pattern)

**Acceptance**: Lifetime counter increases monotonically, producing 150 formulaires auto-increments +1%, unlock triggers at exactly 1000T+100F

### UI Components (Conformité Display)

- [ ] T040 [P] [US1] Create components/ConformiteDisplay.tsx with percentage display: "Conformité aléatoire : X%"
- [ ] T041 [P] [US1] Add test button in components/ConformiteDisplay.tsx: "Réaliser un test de conformité"
- [ ] T042 [P] [US1] Implement button logic in components/ConformiteDisplay.tsx: Call performConformiteTest() onPress
- [ ] T043 [P] [US1] Add button disabled state when formulaires<150 or debounce active
- [ ] T044 [P] [US1] Style conformité display to match existing game UI (colors, fonts, spacing)
- [ ] T045 [P] [US1] [a11y] Set button touch target to minimum 44×44pt in components/ConformiteDisplay.tsx
- [ ] T046 [P] [US1] [a11y] Add accessibilityLabel for percentage display: "Conformité aléatoire : X pourcent"
- [ ] T047 [P] [US1] [a11y] Add accessibilityLabel for button: "Réaliser un test de conformité. Coûte cent cinquante formulaires."
- [ ] T048 [P] [US1] [i18n] Verify French text with proper accents: conformité (é), réaliser (é)
- [ ] T049 [P] [US1] [i18n] Verify percentage formatting: "45%" (no space before %, French standard)

**Acceptance**: Display shows percentage, button disabled when resources insufficient, click increases percentage, 44×44pt touch target, screen reader announces correctly

### Integration & Layout

- [ ] T050 [US1] Import ConformiteDisplay into app/index.tsx
- [ ] T051 [US1] Add conditional rendering in app/index.tsx: {isConformiteUnlocked() && <ConformiteDisplay />}
- [ ] T052 [US1] Position conformité display below resource bar in app/index.tsx layout
- [ ] T053 [US1] Verify no layout shifts when conformité unlocks (smooth appearance)

**Acceptance**: Conformité section integrates cleanly, appears at threshold, no visual glitches

### Manual Testing Scenarios

- [ ] T054 [P] [US1] Test new player: Start from 0, verify conformité hidden until 1000T+100F
- [ ] T055 [P] [US1] Test unlock: Reach 1000T+100F, verify conformité appears within 1 second
- [ ] T056 [P] [US1] Test active progression: Click test button 3×, verify -450F, +9%
- [ ] T057 [P] [US1] Test passive progression: Produce 450 formulaires, verify +3% automatic
- [ ] T058 [P] [US1] Test cap: Reach 99%, gain +2%, verify stops at 100% (no overflow)
- [ ] T059 [P] [US1] Test debounce: Rapid click 5× in 1 second, verify only 1-2 actions succeed
- [ ] T060 [P] [US1] Test persistence: Reach 50%, close app, reopen, verify 50% restored
- [ ] T061 [P] [US1] Test edge case: Exactly 150 formulaires, verify button works (boundary)

**Checkpoint User Story 1**: Complete, independently testable conformité system. Can deliver as MVP!

---

## Phase 4: User Story 4 - Phase 2 Transition Discovery (Priority: P1) 🎯 MVP

**Goal**: Implement "Réaffectation différée" button that appears grayed-out, activates at 100% conformité, displays bureaucratic notification when clicked

**Independent Test**: Set conformité to various percentages (0%, 50%, 99%, 100%) via dev tools or play, verify button states (grayed vs active) and notification behavior. Delivers goal-setting and achievement mechanic.

**Why P1**: Critical for player retention and Phase 2 transition. Must be implemented alongside conformité system (tightly coupled).

**Dependencies**: Requires User Story 1 (conformité system) to be complete

### Toast System (Notification Infrastructure)

- [ ] T062 [US4] Implement showToast(message: string, type: ToastType, duration?: number): void in context/GameStateContext.tsx
- [ ] T063 [US4] Generate unique toast IDs: `${Date.now()}_${Math.random()}` in showToast method
- [ ] T064 [US4] Add toast to queue in showToast: setToastQueue(prev => [...prev, newToast].slice(-3)) (max 3)
- [ ] T065 [US4] Implement auto-dismiss timeout in showToast: setTimeout(() => dismissToast(id), duration)
- [ ] T066 [US4] Implement dismissToast(toastId: string): void in context/GameStateContext.tsx
- [ ] T067 [US4] Implement getActiveToasts(): ToastMessage[] in context/GameStateContext.tsx

**Acceptance**: Calling showToast() adds to queue, auto-dismisses after duration, max 3 toasts enforced

### UI Components (Toast & Phase 2 Button)

- [ ] T068 [P] [US4] Create components/Toast.tsx with Animated.Value refs for slideY and opacity
- [ ] T069 [P] [US4] Implement slide-in animation in components/Toast.tsx: from -100 to 20 over 300ms
- [ ] T070 [P] [US4] Implement fade-in animation in components/Toast.tsx: from 0 to 1 opacity over 300ms
- [ ] T071 [P] [US4] Implement auto-dismiss animation in components/Toast.tsx: reverse animations after duration
- [ ] T072 [P] [US4] Add Pressable for manual dismiss in components/Toast.tsx
- [ ] T073 [P] [US4] Use useNativeDriver: true for all animations in components/Toast.tsx (60fps GPU acceleration)
- [ ] T074 [P] [US4] Style toast with dark background, white text, centered positioning
- [ ] T075 [P] [US4] [a11y] Add accessibilityLiveRegion="polite" to toast container in components/Toast.tsx
- [ ] T076 [P] [US4] [a11y] Add accessibilityLabel={message} to toast view

**Acceptance**: Toast slides in smoothly at 60fps, dismisses after 4s, tap to dismiss works, screen reader announces

- [ ] T077 [P] [US4] Create components/ToastContainer.tsx to map toasts from getActiveToasts()
- [ ] T078 [P] [US4] Position ToastContainer absolutely: top: 20, left: 20, right: 20, zIndex: 1000
- [ ] T079 [P] [US4] Stack multiple toasts vertically with proper spacing (gap: 10)

**Acceptance**: Multiple toasts display simultaneously without overlap, max 3 visible

- [ ] T080 [P] [US4] Create components/Phase2TransitionButton.tsx with text "Réaffectation différée"
- [ ] T081 [P] [US4] Implement grayed-out style when !isPhase2ButtonActive() (opacity, disabled state)
- [ ] T082 [P] [US4] Implement active style when conformité >= 100% (normal button appearance)
- [ ] T083 [P] [US4] Add onPress handler: showToast("Votre niveau de conformité a été jugé satisfaisant...", "phase2", 6000)
- [ ] T084 [P] [US4] Disable button interaction when conformité < 100% (ignore clicks or show tooltip)
- [ ] T085 [P] [US4] [a11y] Set button touch target to minimum 44×44pt in components/Phase2TransitionButton.tsx
- [ ] T086 [P] [US4] [a11y] Add active state label: "Réaffectation différée. Conformité complète. Appuyez pour continuer."
- [ ] T087 [P] [US4] [a11y] Add grayed state label: "Réaffectation différée. Conformité requise : cent pourcent. Actuellement à X pourcent."
- [ ] T088 [P] [US4] [a11y] Add hint when grayed: "Ce bouton deviendra actif lorsque vous atteindrez cent pourcent de conformité."
- [ ] T089 [P] [US4] [a11y] Verify grayed-out contrast maintains 3:1 minimum with background
- [ ] T090 [P] [US4] [i18n] Verify French text: Réaffectation (é with proper accent)
- [ ] T091 [P] [US4] [i18n] Verify notification uses passive voice: "a été jugé satisfaisant"

**Acceptance**: Button grays out correctly, activates at 100%, notification displays with proper French, 44×44pt touch target

### Integration & Layout

- [ ] T092 [US4] Import ToastContainer and Phase2TransitionButton into app/index.tsx
- [ ] T093 [US4] Render ToastContainer at root level in app/index.tsx (for z-index overlay)
- [ ] T094 [US4] Add conditional rendering: {isConformiteUnlocked() && <Phase2TransitionButton />}
- [ ] T095 [US4] Position Phase 2 button in footer/options area in app/index.tsx layout
- [ ] T096 [US4] Verify toasts overlay all content without blocking critical UI

**Acceptance**: Layout clean, button positioned well, toasts don't obscure gameplay elements

### Manual Testing Scenarios

- [ ] T097 [P] [US4] Test grayed state: Set conformité to 50%, verify button grayed and non-interactive
- [ ] T098 [P] [US4] Test activation: Reach 100%, verify button becomes active within 1 second
- [ ] T099 [P] [US4] Test notification: Click at 100%, verify French notification appears
- [ ] T100 [P] [US4] Test multiple toasts: Trigger 5 toasts rapidly, verify max 3 displayed
- [ ] T101 [P] [US4] Test toast auto-dismiss: Verify toasts disappear after 4-6 seconds
- [ ] T102 [P] [US4] Test manual dismiss: Tap toast, verify it disappears immediately
- [ ] T103 [P] [US4] Test screen reader: VoiceOver/TalkBack announces button states and toasts correctly

**Checkpoint User Story 4**: Phase 2 transition gate functional, notification system working. MVP feature set complete!

---

## Phase 5: User Story 2 - Encountering Hidden Narrative Messages (Priority: P2)

**Goal**: Implement S.I.C. (Service Inconnu de Coordination) messages that appear randomly (10-15% probability) during gameplay at production milestones, creating atmospheric mystery

**Independent Test**: Trigger various game events (production milestones, agent purchases), verify S.I.C. messages appear randomly with appropriate frequency (2-3 per 30 minutes), respect cooldowns. Delivers atmospheric storytelling independent of conformité mechanic.

**Why P2**: Enhances "conceptual trap" experience by creating questions in player's mind. Not critical for core gameplay.

**Dependencies**: Requires User Story 4 (toast system) to be complete

### Milestone Detection & Trigger Logic

- [ ] T104 [US2] Add checkProductionMilestones() function in context/GameStateContext.tsx
- [ ] T105 [US2] Detect dossiers milestone in checkProductionMilestones: floor(newDossiers / 100) > floor(lastMilestone.dossiers / 100)
- [ ] T106 [US2] Detect tampons milestone in checkProductionMilestones: floor(newTampons / 50) > floor(lastMilestone.tampons / 50)
- [ ] T107 [US2] Detect formulaires milestone in checkProductionMilestones: floor(newFormulaires / 25) > floor(lastMilestone.formulaires / 25)
- [ ] T108 [US2] Update messageSystem.lastProductionMilestone with new resource values after detection
- [ ] T109 [US2] Integrate checkProductionMilestones into game loop (after production calculations)

**Acceptance**: Milestones detected at correct thresholds (every 100 dossiers, 50 tampons, 25 formulaires)

- [ ] T110 [US2] Implement attemptSICMessageTrigger(state: GameState): void in context/GameStateContext.tsx
- [ ] T111 [US2] Get probability in attemptSICMessageTrigger: Call calculateSICProbability(sicLastTriggerTime)
- [ ] T112 [US2] Roll random in attemptSICMessageTrigger: Math.random() < probability
- [ ] T113 [US2] If triggered: showToast(getRandomSICMessage(), 'sic', 4000)
- [ ] T114 [US2] Update messageSystem.sicLastTriggerTime = Date.now() after trigger
- [ ] T115 [US2] Call attemptSICMessageTrigger from checkProductionMilestones when milestone crossed

**Acceptance**: S.I.C. messages appear ~12.5% of milestones, reduced to 2% within 5 minutes, boosted to 20% after 30+ minutes

### Message Content & Styling

- [ ] T116 [P] [US2] [i18n] Verify all 6 S.I.C. messages in data/messageSystem.ts use formal French register (passive voice, vouvoiement)
- [ ] T117 [P] [US2] [i18n] Verify S.I.C. messages use proper punctuation (space before colon: "S.I.C. :")
- [ ] T118 [P] [US2] [i18n] Verify messages never explain what S.I.C. is (mystery preservation)
- [ ] T119 [P] [US2] Style S.I.C. toasts with subtle appearance in components/Toast.tsx (type: 'sic')

**Acceptance**: Messages feel mysterious, French grammar correct, proper bureaucratic tone

### Manual Testing Scenarios

- [ ] T120 [P] [US2] Test frequency: Play 30 minutes, count S.I.C. messages (expect 2-3)
- [ ] T121 [P] [US2] Test cooldown: Trigger message, verify next milestone within 5min has low probability
- [ ] T122 [P] [US2] Test boost: Don't trigger for 30+ minutes, verify next milestone has higher probability
- [ ] T123 [P] [US2] Test variety: Observe 10+ messages, verify different variants appear (not always same)
- [ ] T124 [P] [US2] Test no spam: Produce resources rapidly, verify max ~1 message per 2-3 minutes
- [ ] T125 [P] [US2] Test independence: Verify S.I.C. messages don't affect conformité or resources

**Checkpoint User Story 2**: Narrative atmosphere layer functional, messages appear organically without disrupting gameplay

---

## Phase 6: User Story 3 - Rare Conformity Violation Notifications (Priority: P3)

**Goal**: Implement "Tampon non conforme détecté – Niveau 0" notification appearing rarely (0.2% per tampon) with no gameplay impact, adding surveillance/mystery atmosphere

**Independent Test**: Monitor production over extended play, verify notification appears at correct rarity (approximately 1 in 500 tampons), no gameplay consequences. Delivers pure narrative flavor.

**Why P3**: Atmospheric polish that reinforces surveillance theme. Zero gameplay impact, lowest priority.

**Dependencies**: Requires User Story 4 (toast system) to be complete

### Non-Conformity Trigger Logic

- [ ] T126 [US3] Implement attemptNonConformityTrigger(state: GameState): void in context/GameStateContext.tsx
- [ ] T127 [US3] Check rate limit in attemptNonConformityTrigger: (now - lastTime) >= 600000 (10 minutes)
- [ ] T128 [US3] Roll random in attemptNonConformityTrigger: Math.random() < 0.002 (0.2%)
- [ ] T129 [US3] If triggered: showToast("Tampon non conforme détecté – Niveau 0", "non-conformity", 5000)
- [ ] T130 [US3] Update messageSystem.nonConformityLastTriggerTime = Date.now() after trigger
- [ ] T131 [US3] Call attemptNonConformityTrigger from checkProductionMilestones when tampon milestone crossed

**Acceptance**: Notification appears ~1 per 500 tampons, rate-limited to max 1 per 10 minutes, no resource changes

### Notification Styling

- [ ] T132 [P] [US3] Style non-conformity toasts with warning appearance in components/Toast.tsx (type: 'non-conformity')
- [ ] T133 [P] [US3] [i18n] Verify notification text: "Tampon non conforme détecté – Niveau 0" (proper French, em dash)
- [ ] T134 [P] [US3] [a11y] Add accessibility label: "Tampon non conforme détecté. Niveau zéro. Notification informative uniquement."
- [ ] T135 [P] [US3] Add visual distinction from S.I.C. messages (different background color or icon)

**Acceptance**: Notification visually distinct, French correct, screen reader clarifies it's informative only

### Manual Testing Scenarios

- [ ] T136 [P] [US3] Test rarity: Produce 2500 tampons, count notifications (expect 4-6 over long average)
- [ ] T137 [P] [US3] Test rate limit: Trigger notification, produce 1000 more tampons in <10 min, verify max 1 appears
- [ ] T138 [P] [US3] Test high production: Set production to 10+/sec, verify notifications don't spam (rate limit enforced)
- [ ] T139 [P] [US3] Test no impact: Receive notification, verify tampons/formulaires unchanged (cosmetic only)
- [ ] T140 [P] [US3] Test mystery: Verify notification doesn't explain consequences (adds intrigue, not anxiety)

**Checkpoint User Story 3**: Rare notification system adds subtle atmospheric mystery without player confusion

---

## Phase 7: User Story 5 - Bureau Name Correction (Priority: P3)

**Goal**: Simple text change - rename "Administration Centrale" to "Bureau des Documents Obsolètes" for better thematic consistency

**Independent Test**: Check first administration's name displays correctly in all UI locations (cards, navigation). Delivers improved thematic consistency.

**Why P3**: Minor polish, zero gameplay impact, can be done in minutes

**Dependencies**: None - already completed in T014 during Phase 1

### Verification Only

- [ ] T141 [P] [US5] Verify data/gameData.ts shows "Bureau des Documents Obsolètes" (completed in T014)
- [ ] T142 [P] [US5] Check administration card displays new name in UI
- [ ] T143 [P] [US5] Check any navigation/header references show new name
- [ ] T144 [P] [US5] Verify old saves load correctly with new name (ID unchanged for compatibility)

**Acceptance**: All UI locations show "Bureau des Documents Obsolètes", save compatibility maintained

**Checkpoint User Story 5**: Thematic polish complete (minimal work, already done in setup)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, accessibility audit, French language review, final testing
**Duration**: 3-4 hours
**Risk**: 🔴 High - Full feature validation

### Performance Optimization

- [ ] T145 [P] [perf] Profile game loop with React DevTools: Verify conformité checks <2ms per iteration
- [ ] T146 [P] [perf] Profile toast animations: Verify 60fps maintained during slide-in/fade-out
- [ ] T147 [P] [perf] Memoize isConformiteUnlocked() with useMemo in context/GameStateContext.tsx
- [ ] T148 [P] [perf] Verify no additional AsyncStorage writes beyond existing 5s debounce
- [ ] T149 [P] [perf] Test memory usage: Play 1 hour, verify toast queue doesn't leak (max 3 retained)
- [ ] T150 [P] [perf] Test on mid-range device (iPhone 11 / Android equivalent): Verify 60fps during gameplay with toasts

**Acceptance**: <5% game loop overhead, 60fps animations, no memory leaks, responsive on target devices

### Accessibility Audit

- [ ] T151 [P] [a11y] Test VoiceOver (iOS): Verify all buttons announce correctly with costs/states
- [ ] T152 [P] [a11y] Test TalkBack (Android): Verify screen reader navigation works for all components
- [ ] T153 [P] [a11y] Verify all touch targets meet 44×44pt minimum (conformité button, Phase 2 button)
- [ ] T154 [P] [a11y] Verify grayed-out Phase 2 button maintains 3:1 contrast ratio with background
- [ ] T155 [P] [a11y] Verify toast accessibilityLiveRegion="polite" announces new messages
- [ ] T156 [P] [a11y] Test with increased font size: Verify layout doesn't break with system font scaling
- [ ] T157 [P] [a11y] Verify conformité percentage display has clear visual presentation for low vision

**Acceptance**: All WCAG 2.1 AA requirements met, screen readers work perfectly, accessible to players with disabilities

### French Language Review

- [ ] T158 [P] [i18n] Review all conformité text: "Conformité aléatoire", "Réaliser un test de conformité", "Réaffectation différée"
- [ ] T159 [P] [i18n] Verify all accents correct: conformité (é), réaliser (é), réaffectation (é), différée (é)
- [ ] T160 [P] [i18n] Review all 6 S.I.C. messages for grammar, passive voice, formal register
- [ ] T161 [P] [i18n] Verify Phase 2 notification uses proper bureaucratic language: "a été jugé satisfaisant"
- [ ] T162 [P] [i18n] Verify space before colon in "S.I.C. :" (French typography rule)
- [ ] T163 [P] [i18n] Verify percentage formatting: "45%" (no space before %, French standard)
- [ ] T164 [P] [i18n] Test on French locale device: Verify proper rendering of all accented characters
- [ ] T165 [P] [i18n] Native French speaker review for authenticity and tone

**Acceptance**: All French text authentic, proper accents, correct grammar, bureaucratic tone consistent

### End-to-End Testing (Full Feature Validation)

- [ ] T166 [P] Test new player flow: Start from 0, play to 1000T+100F, verify conformité appears
- [ ] T167 [P] Test unlock timing: Cross threshold, verify conformité visible within 1 second
- [ ] T168 [P] Test active progression: Click test button 10×, verify correct resource deduction and % gain
- [ ] T169 [P] Test passive progression: Produce 1500 formulaires, verify +10% passive gain
- [ ] T170 [P] Test cap behavior: Reach 100%, continue playing, verify stays at 100% (no overflow)
- [ ] T171 [P] Test Phase 2 activation: Reach 100% via passive (not button), verify button activates automatically
- [ ] T172 [P] Test Phase 2 notification: Click button at 100%, verify French notification displays
- [ ] T173 [P] Test S.I.C. frequency: Play 30 minutes, count messages (expect 2-3, verify not spammy)
- [ ] T174 [P] Test S.I.C. cooldown: Trigger message, verify reduced probability for 5 minutes
- [ ] T175 [P] Test non-conformity rarity: Produce 2500 tampons, verify ~5 notifications appear
- [ ] T176 [P] Test non-conformity rate limit: Verify max 1 per 10 minutes even with high production

**Acceptance**: All user stories work independently, integrated feature feels cohesive, no gameplay disruptions

### Save Data & Migration Testing

- [ ] T177 [P] Test V1 save migration: Load old save, verify conformité initializes with lifetime values
- [ ] T178 [P] Test persistence: Reach 50% conformité, close app, reopen, verify 50% restored
- [ ] T179 [P] Test force-quit during test: Close app mid-transaction, verify no resource duplication/loss
- [ ] T180 [P] Test corrupted save: Invalid JSON should fallback to initial state without crash
- [ ] T181 [P] Test new save format: Create new game, save, reload, verify version 2 format correct
- [ ] T182 [P] Test backward compatibility: Verify old saves maintain all progress (resources, administrations, agents)

**Acceptance**: All save scenarios work flawlessly, no data loss, graceful error handling

### Edge Cases & Stress Testing

- [ ] T183 [P] Test rapid clicking: Click test button 10× in 2 seconds, verify debounce (only ~2-3 succeed)
- [ ] T184 [P] Test exact threshold: 999T+100F (no unlock), 1000T+100F (unlock), 1000T+99F (no unlock)
- [ ] T185 [P] Test exact cost: 150F (button works), 149F (button disabled)
- [ ] T186 [P] Test percentage boundaries: 99%→100% transition, verify Phase 2 button activates
- [ ] T187 [P] Test toast queue overflow: Trigger 10 toasts rapidly, verify max 3 displayed, oldest evicted
- [ ] T188 [P] Test high production rates: 10+/sec production, verify milestones detect correctly, no missed messages
- [ ] T189 [P] Test app lifecycle: Background app for 1 hour, resume, verify conformité progression calculated correctly
- [ ] T190 [P] Test zero resources: Start new game, verify conformité hidden, no errors with zero values

**Acceptance**: All edge cases handled gracefully, no crashes, no unexpected behavior

### Code Quality & Documentation

- [ ] T191 [P] Remove debug console.logs (keep migration log only)
- [ ] T192 [P] Run npm run lint, fix any TypeScript warnings
- [ ] T193 [P] Verify all JSDoc comments present on Context methods
- [ ] T194 [P] Verify no unjustified `any` types (only migration function allowed)
- [ ] T195 [P] Update quickstart.md if implementation differs from plan
- [ ] T196 [P] Document any deviations from original spec in specs/001-conformite-narrative/notes.md
- [ ] T197 [P] Capture screenshots: conformité unlock, S.I.C. message, Phase 2 button active
- [ ] T198 [P] Capture demo video showing full progression 0%→100%→Phase 2 notification

**Acceptance**: Clean production-ready code, documentation current, demo materials for reference

**Checkpoint Phase 8**: Feature complete, tested, polished, ready for playtesting and deployment

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS all user stories
    ↓
Phase 3 (US1: Conformité Core) ← MVP foundation
    ↓
Phase 4 (US4: Phase 2 Button) ← Requires US1
    ↓ (Parallel opportunities begin here)
    ├─→ Phase 5 (US2: S.I.C. Messages) ← Requires US4 (toast system)
    ├─→ Phase 6 (US3: Non-conformity) ← Requires US4 (toast system)
    └─→ Phase 7 (US5: Bureau Rename) ← Independent (already done in Phase 1)
    ↓
Phase 8 (Polish & Testing) ← Requires all user stories complete
```

### Critical Path (Minimum for MVP)

1. Phase 1: Setup (T001-T014) - 2-3 hours
2. Phase 2: Foundational (T015-T028) - 2-3 hours
3. Phase 3: US1 (T029-T061) - 6-8 hours
4. Phase 4: US4 (T062-T103) - 4-5 hours
5. Phase 8: Testing subset (T166-T182) - 2-3 hours

**MVP Total**: 16-22 hours (US1 + US4 + core testing)

### Full Feature Path

All phases in order: 20-28 hours

### User Story Dependencies

- **US1 (P1)**: No dependencies after Phase 2 - Can start immediately
- **US4 (P1)**: Depends on US1 complete (requires conformité percentage)
- **US2 (P2)**: Depends on US4 complete (requires toast system)
- **US3 (P3)**: Depends on US4 complete (requires toast system)
- **US5 (P3)**: No dependencies (completed in Phase 1)

### Parallel Opportunities

**Within Phase 1 (Setup)**: All tasks T001-T013 marked [P] can run in parallel (different files)

**Within Phase 2 (Foundational)**: T026-T028 testing tasks can run in parallel

**Within US1**: T040-T049 (ConformiteDisplay component) and T054-T061 (testing) can run in parallel

**Within US4**: T068-T091 (all UI components) can run in parallel, T097-T103 (testing) can run in parallel

**After US4 Complete**: US2, US3, US5 can all be implemented in parallel by different developers

**Phase 8**: All tasks T145-T198 can run in parallel (testing, audits, reviews)

---

## Parallel Example: After Phase 2 Complete

```bash
# Team of 3 developers can work simultaneously:

# Developer A: User Story 1 (Conformité Core)
Tasks T029-T061 (6-8 hours)
  → Delivers MVP conformité system

# Developer B: Wait for A to reach T053, then start User Story 4 (Phase 2 Button)
Tasks T062-T103 (4-5 hours)
  → Delivers Phase 2 transition gate

# Developer C: After B completes toast system, start User Story 2 (S.I.C. Messages)
Tasks T104-T125 (3-4 hours)
  → Delivers narrative atmosphere

# Result: Faster delivery with parallel development
```

---

## Implementation Strategy

### Option 1: MVP First (Recommended)

```
Goal: Ship minimal viable feature for player feedback

1. Complete Phase 1 (Setup) - 2-3 hours
2. Complete Phase 2 (Foundational) - 2-3 hours
3. Complete Phase 3 (US1: Conformité) - 6-8 hours
4. Complete Phase 4 (US4: Phase 2 Button) - 4-5 hours
5. Run core tests (T166-T182) - 2-3 hours
6. STOP and VALIDATE: Test conformité 0%→100%→notification
7. Deploy/playtest

Total: 16-22 hours
Delivers: Complete conformité progression + Phase 2 gate
Missing: S.I.C. messages, rare notifications (nice-to-have atmosphere)
```

### Option 2: Incremental Delivery

```
Iteration 1: Setup + Foundational (4-6 hours)
  → Foundation ready

Iteration 2: Add US1 (6-8 hours)
  → Test independently
  → Deploy/demo: Players can discover conformité system

Iteration 3: Add US4 (4-5 hours)
  → Test independently
  → Deploy/demo: Players can reach Phase 2 gate

Iteration 4: Add US2 (3-4 hours)
  → Test independently
  → Deploy/demo: Narrative mystery layer added

Iteration 5: Add US3 + US5 (1-2 hours)
  → Test independently
  → Deploy/demo: Atmospheric polish complete

Iteration 6: Polish + final testing (3-4 hours)
  → Deploy/demo: Production-ready feature
```

### Option 3: Parallel Team (3+ developers)

```
Week 1, Day 1:
  All: Phase 1 + Phase 2 together (4-6 hours)
  
Week 1, Day 2-3:
  Dev A: US1 (Conformité) → 6-8 hours
  Dev B: Wait for A's toast infra, then US4 (Phase 2) → 4-5 hours
  Dev C: Prepare test cases, review code

Week 1, Day 4:
  Dev A: US2 (S.I.C. Messages) → 3-4 hours
  Dev B: US3 (Non-conformity) → 2-3 hours
  Dev C: US5 + start Phase 8 testing → 1-2 hours

Week 1, Day 5:
  All: Phase 8 polish + testing together → 3-4 hours
  
Total: 5 days, faster delivery
```

---

## Success Criteria Validation

After completing all phases, verify these success criteria from spec.md:

- [ ] **SC-001**: Players see conformité appear within 0.1 seconds of crossing 1000T+100F threshold
- [ ] **SC-002**: Progression 0%→100% takes approximately 4-6 hours of active play (15,000 formulaires total)
- [ ] **SC-003**: S.I.C. messages appear 2-3 times per 30-minute session (not spammy)
- [ ] **SC-004**: 95% of conformité button clicks complete within 100ms
- [ ] **SC-005**: Rare notifications appear ~1 per 2,500 tampons over long-term average
- [ ] **SC-006**: All conformité UI elements meet 44×44pt touch target size
- [ ] **SC-007**: Conformité persists correctly across app sessions (50% → close → reopen → 50%)
- [ ] **SC-008**: Phase 2 button activates within 1 second of reaching 100%
- [ ] **SC-009**: Rapid clicking handled correctly (only successful purchases deduct resources)
- [ ] **SC-010**: French text displays correctly with proper accents on all devices
- [ ] **SC-011**: "Bureau des Documents Obsolètes" appears in all UI locations (min 2)
- [ ] **SC-012**: Players report curiosity about conformité and S.I.C. in playtesting (qualitative)

**Final Acceptance**: All 12 success criteria pass, feature ready for production

---

## Time Estimates Summary

| Phase | Tasks | Duration | Risk |
|-------|-------|----------|------|
| 1: Setup | T001-T014 | 2-3h | ✅ Low |
| 2: Foundational | T015-T028 | 2-3h | ⚠️ Medium |
| 3: US1 (Conformité Core) | T029-T061 | 6-8h | ⚠️ Medium |
| 4: US4 (Phase 2 Button) | T062-T103 | 4-5h | ⚠️ Medium |
| 5: US2 (S.I.C. Messages) | T104-T125 | 3-4h | ✅ Low |
| 6: US3 (Non-conformity) | T126-T140 | 2-3h | ✅ Low |
| 7: US5 (Bureau Rename) | T141-T144 | 0.5h | ✅ Low |
| 8: Polish & Testing | T145-T198 | 3-4h | 🔴 High |
| **TOTAL** | **198 tasks** | **20-28h** | **Mixed** |

**MVP Subset** (US1+US4+core tests): 16-22 hours
**Full Feature**: 20-28 hours (2.5-3.5 working days)

---

## Notes

- [P] marker = Task can run in parallel with other [P] tasks in same phase (different files, no dependencies)
- [Story] label = Maps task to specific user story from spec.md (US1-US5)
- [i18n] = French language/localization task
- [a11y] = Accessibility task (WCAG compliance)
- [perf] = Performance optimization task
- Each user story is independently completable and testable
- Stop at any checkpoint to validate story independently
- US1 + US4 = MVP (conformité system + Phase 2 gate)
- US2 + US3 + US5 = Polish (narrative atmosphere + minor fixes)
- Commit frequently (after each task or logical group)
- Run npm run lint after each phase
- Test on both iOS and Android before considering phase complete
- Priority: P1 stories (US1, US4) must be complete for MVP
- Priority: P2/P3 stories (US2, US3, US5) are polish/enhancement

---

## Feature Complete Definition

✅ All 5 user stories implemented and tested independently
✅ All accessibility requirements met (AR-001 through AR-008)
✅ All localization requirements met (LR-001 through LR-005)
✅ All functional requirements met (FR-001 through FR-022)
✅ All success criteria validated (SC-001 through SC-012)
✅ Performance maintained (60fps, <100ms interactions)
✅ Save data migration working flawlessly
✅ No regressions in existing gameplay
✅ French language reviewed and approved
✅ Ready for playtesting and production deployment

**Total Task Count**: 198 tasks
**Critical Path**: T001→T028→T029→T061→T062→T103 (MVP)
**Parallel Opportunities**: 100+ tasks can run in parallel at various stages
**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US4) = 16-22 hours
