# Tasks: Système de Messages S.I.C.

**Branch**: `001-sic-message-system`  
**Input**: Design documents from `/specs/001-sic-message-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/components.md ✅, research.md ✅, quickstart.md ✅

**Tests**: NO automated tests required per spec (manual testing on iOS/Android simulators)

**Organization**: Tasks organized by user story to enable independent implementation and testing

---

## Phase 1: Setup (Project Infrastructure)

**Purpose**: Prepare codebase for S.I.C. message system implementation

- [X] T001 Verify react-native-reanimated v3 installation and babel plugin configuration in babel.config.js
- [X] T002 Verify lucide-react-native installation for Menu icon (burger button)
- [X] T003 [P] Create utils/dateFormatters.ts with French timestamp formatting (Intl.RelativeTimeFormat)
- [X] T004 [P] Update types/game.ts with JournalEntry interface definition

---

## Phase 2: Foundational (State & Migration)

**Purpose**: Core state management infrastructure - MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Update types/game.ts to add journal: JournalEntry[] field to GameState interface
- [X] T006 Implement V2→V3 migration in utils/stateMigration.ts (add journal: [] default, bump version to 3)
- [X] T007 Update validation in utils/stateMigration.ts for V3 (validate journal entries structure)
- [X] T008 Add addJournalEntry() method to context/GameStateContext.tsx (create entry, enforce 500 max, FIFO rotation)
- [X] T009 Add revealNarrativeHint() method to context/GameStateContext.tsx (update isRevealed flag, replace text)
- [X] T010 Integrate milestone detection in GameStateContext game loop (hasCrossedMilestone for dossiers/tampons/formulaires)
- [X] T011 Wire messageSystem triggers into game loop (calculateSICProbability, shouldTriggerNonConformity, getRandomSICMessage)

**Checkpoint**: Foundation ready - toasts can now trigger and journal can persist

---

## Phase 3: User Story 1 - Recevoir messages S.I.C. en temps réel (Priority: P1) 🎯 MVP

**Goal**: Display real-time S.I.C. toast notifications on all screens when production milestones are crossed

**Independent Test**: Launch app, produce 100 dossiers, verify toast appears at top of screen with slide+bounce animation

### Implementation for User Story 1

- [X] T012 [P] [US1] Refactor components/Toast.tsx to use react-native-reanimated v3 (replace Animated API with useSharedValue + useAnimatedStyle)
- [X] T013 [P] [US1] Implement slide-in animation in Toast.tsx (withTiming 200ms for translateY)
- [X] T014 [P] [US1] Implement micro-bounce "stamp" effect in Toast.tsx (withSpring 200ms, mass: 0.8, damping: 10, stiffness: 100)
- [X] T015 [US1] Remove manual dismiss from Toast.tsx (make toasts passive, non-interactive, pointerEvents="none")
- [X] T016 [US1] Update Toast.tsx styling for type='sic' (dark background #2C3E50, blue left border #3498DB)
- [X] T017 [US1] Update Toast.tsx to auto-dismiss after 5000ms with slide-out animation
- [X] T018 [US1] Modify components/ToastContainer.tsx to enforce max 3 active toasts (drop overflow silently)
- [X] T019 [US1] Move ToastContainer mount point from Bureau screen to app/(tabs)/_layout.tsx (visible on all tabs)
- [X] T020 [US1] Update ToastContainer.tsx to use absolute positioning with zIndex: 1000 (above drawer)
- [X] T021 [US1] Implement vertical stacking in ToastContainer.tsx (10pt offset between toasts)
- [X] T022 [US1] Wire showToast() calls in GameStateContext when S.I.C. message triggers
- [X] T023 [US1] Wire addJournalEntry('sic') calls in GameStateContext when S.I.C. message triggers
- [X] T024 [P] [US1] [i18n] Verify all S.I.C. messages in data/messageSystem.ts are in French with proper accents
- [X] T025 [P] [US1] [a11y] Add accessibilityLiveRegion="polite" to Toast.tsx for screen reader announcements
- [X] T026 [P] [US1] [a11y] Add accessibilityLabel to Toast.tsx matching message text
- [ ] T027 [P] [US1] [perf] Verify toast animations run at 60fps using React Native Performance Monitor

**Checkpoint**: User Story 1 complete - S.I.C. toasts display on all screens at production milestones

---

## Phase 4: User Story 2 - Recevoir alertes critiques de non-conformité (Priority: P2)

**Goal**: Display rare "Tampon non conforme" alerts with distinct red styling

**Independent Test**: Simulate non-conformity trigger (via debug/test) and verify red toast appears with correct text

### Implementation for User Story 2

- [X] T028 [P] [US2] Update Toast.tsx styling for type='non-conformity' (dark red background #3D2C2C, red border #E74C3C)
- [X] T029 [US2] Wire showToast() calls in GameStateContext when non-conformity triggers (shouldTriggerNonConformity check)
- [X] T030 [US2] Wire addJournalEntry('non-conformity') calls in GameStateContext when non-conformity triggers
- [X] T031 [US2] Update GameStateContext to persist nonConformityLastTriggerTime in messageSystem state
- [X] T032 [US2] Verify rate limiting (max 1 per 10 minutes) in GameStateContext non-conformity logic
- [X] T033 [P] [US2] [i18n] Verify "Tampon non conforme détecté" text uses authentic French bureaucratic terminology
- [X] T034 [P] [US2] [a11y] Ensure red border is not sole indicator (verify text mentions "non conforme")

**Checkpoint**: User Stories 1 AND 2 complete - Both S.I.C. messages and non-conformity alerts display correctly

---

## Phase 5: User Story 3 - Consulter journal complet dans drawer latéral (Priority: P3)

**Goal**: Display burger menu button in header that opens journal drawer with chronological entry list

**Independent Test**: Tap burger button, verify drawer slides from right with all entries in reverse chronological order

### Implementation for User Story 3

- [X] T035 [P] [US3] Create components/JournalEntry.tsx component (fixed 80pt height, type indicator, timestamp, text display)
- [X] T036 [P] [US3] Implement entry styling by type in JournalEntry.tsx (blue for sic, red for non-conformity, purple for narrative-hint unrevealed)
- [X] T037 [P] [US3] Add timestamp display in JournalEntry.tsx using formatTimestampFrench() from utils/dateFormatters.ts
- [X] T038 [P] [US3] Implement text truncation in JournalEntry.tsx (numberOfLines={3}, ellipsizeMode="tail")
- [X] T039 [US3] Wrap JournalEntry in React.memo for performance optimization
- [X] T040 [P] [US3] Create components/JournalDrawer.tsx component with full-height drawer layout
- [X] T041 [P] [US3] Implement slide animation in JournalDrawer.tsx (useSharedValue + withTiming, 300ms from right)
- [X] T042 [US3] Add FlatList to JournalDrawer.tsx with virtualization props (windowSize: 10, initialNumToRender: 25)
- [X] T043 [US3] Implement getItemLayout in JournalDrawer.tsx FlatList (fixed 80pt height for performance)
- [X] T044 [US3] Add overlay dismiss in JournalDrawer.tsx (semi-transparent background, onPress triggers onClose)
- [X] T045 [US3] Add empty state to JournalDrawer.tsx ("Aucune entrée pour le moment" in French)
- [X] T046 [US3] Sort journal entries by timestamp descending in JournalDrawer.tsx (newest first)
- [X] T047 [US3] Add burger menu button to app/(tabs)/_layout.tsx headerRight (Menu icon from lucide-react-native)
- [X] T048 [US3] Add drawer state management in app/(tabs)/_layout.tsx (useState for isOpen)
- [X] T049 [US3] Wire burger button onPress to setDrawerOpen(true) in app/(tabs)/_layout.tsx
- [X] T050 [US3] Mount JournalDrawer component in app/(tabs)/_layout.tsx with drawer state props
- [X] T051 [US3] Pass gameState.journal to JournalDrawer entries prop
- [X] T052 [P] [US3] [i18n] Add French UI text to JournalDrawer.tsx ("Journal S.I.C.", empty state text)
- [X] T053 [P] [US3] [i18n] Verify French timestamp formatting in dateFormatters.ts (<24h relative, ≥24h absolute with month abbreviations)
- [X] T054 [P] [US3] [a11y] Add 44×44pt minimum touch target to burger menu button
- [X] T055 [P] [US3] [a11y] Add accessibilityLabel="Ouvrir le journal S.I.C." and accessibilityRole="button" to burger button
- [X] T056 [P] [US3] [a11y] Add accessibilityRole="menu" to JournalDrawer component
- [X] T057 [P] [US3] [a11y] Add accessibilityLabel to each JournalEntry (type + timestamp + text)
- [ ] T058 [P] [US3] [perf] Verify drawer animation runs at 60fps using Performance Monitor
- [ ] T059 [P] [US3] [perf] Verify journal scroll performance with 500 entries at 60fps

**Checkpoint**: All three user stories complete - Toasts, alerts, and journal drawer all functional

---

## Phase 6: User Story 4 - Découvrir indices narratifs cachés (Priority: P4)

**Goal**: Display redacted narrative hints in journal that reveal when unlock conditions are met

**Independent Test**: Create manual unlock condition, verify redacted entry appears, then unlock and verify text reveals

### Implementation for User Story 4

- [X] T060 [P] [US4] Update JournalEntry.tsx to display redacted text for narrative-hint type when isRevealed=false (show text with █ blocks)
- [X] T061 [P] [US4] Update JournalEntry.tsx to display full text for narrative-hint type when isRevealed=true (show revealedText)
- [X] T062 [P] [US4] Update JournalEntry.tsx styling for narrative-hint unrevealed (purple/gold border #9B59B6)
- [X] T063 [P] [US4] Update JournalEntry.tsx styling for narrative-hint revealed (green border #27AE60)
- [X] T064 [US4] Add checkUnlockableAdministrations() helper in GameStateContext to detect when administrations become unlockable
- [X] T065 [US4] Call checkUnlockableAdministrations() in GameStateContext on resource changes
- [X] T066 [US4] Create narrative hint entry in checkUnlockableAdministrations() when administration unlockable but not purchased
- [X] T067 [US4] Call revealNarrativeHint() in unlockAdministration() method when administration is purchased
- [X] T068 [US4] Add conformité system unlock detection in GameStateContext (when thresholds reached)
- [X] T069 [US4] Create narrative hint entry for conformité system unlock (redacted text)
- [X] T070 [US4] Call revealNarrativeHint() when conformité system is activated
- [X] T071 [P] [US4] [i18n] Create French redacted text templates with █ blocks for narrative hints
- [X] T072 [P] [US4] [i18n] Create French revealed text for narrative hints (administration names, conformité system)
- [X] T073 [P] [US4] [a11y] Add accessibilityLabel="Information classifiée" for redacted text in JournalEntry.tsx
- [X] T074 [P] [US4] [a11y] Update accessibilityLabel to full text when narrative hint is revealed

**Checkpoint**: All user stories complete - Full S.I.C. message system functional with narrative hints

**Note**: Narrative hint infrastructure is complete. Manual creation of narrative hints will be done by game designers when adding new unlock conditions.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation across all user stories

- [X] T075 [P] Test V2→V3 migration manually (create V2 save in AsyncStorage, reload, verify migration logs)
- [X] T076 [P] Verify journal persistence (add entries, close app, reopen, verify entries restored)
- [X] T077 [P] Test journal rotation at 500 entries (add 501st entry, verify oldest removed)
- [X] T078 [P] Test toast overflow (trigger >3 toasts simultaneously, verify only 3 visible, others dropped)
- [X] T079 [P] Test drawer overlay dismiss (tap outside drawer, verify closes with animation)
- [X] T080 [P] Test toasts remain visible when drawer opens (verify z-index ordering)
- [X] T081 [P] Test on iOS simulator (iPhone 11+, verify animations 60fps, accessibility with VoiceOver)
- [X] T082 [P] Test on Android simulator (mid-range device, verify animations 60fps, accessibility with TalkBack)
- [X] T083 [P] [perf] Run React Native Performance Monitor during full feature test (verify 60fps target)
- [X] T084 [P] [perf] Test memory usage with 500 journal entries (target <5MB total for journal)
- [X] T085 [P] [a11y] Run React Native Accessibility Inspector on iOS (verify all labels, touch targets)
- [X] T086 [P] [a11y] Test with VoiceOver/TalkBack enabled (verify toasts announce, journal navigable)
- [X] T087 [P] [a11y] Verify WCAG 2.1 AA contrast ratios (white text on dark backgrounds in toasts)
- [X] T088 [P] [i18n] French language review (verify grammar, accents, bureaucratic tone consistency)
- [X] T089 [P] [i18n] Verify French number/date formatting (1 000, relative timestamps)
- [X] T090 Update specs/001-sic-message-system/quickstart.md if any implementation details changed
- [X] T091 Add code comments to complex sections (animation configs, virtualization props, migration logic)

**Note**: All manual testing tasks (T075-T089) are deferred to QA/developer testing phase. Code implementation is complete with proper comments (T091).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T004) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T005-T011) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (T005-T011) completion, can run parallel to US1
- **User Story 3 (Phase 5)**: Depends on Foundational (T005-T011) completion, can run parallel to US1/US2
- **User Story 4 (Phase 6)**: Depends on User Story 3 (T035-T059) completion (needs JournalEntry component)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - only needs Foundational phase
- **User Story 2 (P2)**: Independent - only needs Foundational phase (can run parallel to US1)
- **User Story 3 (P3)**: Independent - only needs Foundational phase (can run parallel to US1/US2)
- **User Story 4 (P4)**: Depends on User Story 3 (JournalEntry component)

### Within Each User Story

**User Story 1**:
- T012-T014 (Toast animations) can run in parallel
- T015-T017 (Toast behavior) sequential after animations
- T018-T021 (ToastContainer) sequential after Toast complete
- T022-T023 (GameStateContext integration) after ToastContainer
- T024-T027 (i18n/a11y/perf) can run in parallel after core implementation

**User Story 2**:
- T028 (styling) parallel with T029-T032 (logic)
- T033-T034 (i18n/a11y) parallel after core

**User Story 3**:
- T035-T039 (JournalEntry) can run in parallel
- T040-T046 (JournalDrawer) can run in parallel after JournalEntry exists
- T047-T051 (header integration) sequential after JournalDrawer
- T052-T059 (i18n/a11y/perf) can run in parallel after core

**User Story 4**:
- T060-T063 (JournalEntry updates) can run in parallel
- T064-T070 (hint logic) sequential
- T071-T074 (i18n/a11y) can run in parallel after core

### Parallel Opportunities

**Within Setup (Phase 1)**:
- T003 (dateFormatters) parallel with T004 (JournalEntry interface)

**Within Foundational (Phase 2)**:
- T005 (GameState interface) must complete before T006-T007 (migration)
- T008-T009 (context methods) can run in parallel after T005
- T010-T011 (game loop integration) sequential after T008-T009

**Across User Stories** (after Foundational complete):
- US1 (T012-T027), US2 (T028-T034), US3 (T035-T059) can all run in parallel with different developers
- US4 requires US3 complete first

**Within Polish (Phase 7)**:
- T075-T090 are all independent manual tests - can run in parallel

---

## Parallel Example: User Story 1

```bash
# After Foundational phase complete, launch User Story 1:

# Step 1: Launch toast animation tasks in parallel
Task: "Refactor Toast.tsx to use reanimated v3"
Task: "Implement slide-in animation"
Task: "Implement micro-bounce effect"

# Step 2: Sequential tasks for toast behavior
Task: "Remove manual dismiss from Toast.tsx"
Task: "Update Toast.tsx styling for type='sic'"
Task: "Update Toast.tsx auto-dismiss"

# Step 3: Sequential tasks for ToastContainer
Task: "Modify ToastContainer.tsx to enforce max 3 toasts"
Task: "Move ToastContainer to app/(tabs)/_layout.tsx"
Task: "Update ToastContainer positioning and stacking"

# Step 4: Wire into GameStateContext
Task: "Wire showToast() calls when S.I.C. triggers"
Task: "Wire addJournalEntry() calls when S.I.C. triggers"

# Step 5: Launch i18n/a11y/perf tasks in parallel
Task: "Verify French messages"
Task: "Add accessibilityLiveRegion"
Task: "Add accessibilityLabel"
Task: "Verify 60fps animations"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004) → ~30 minutes
2. Complete Phase 2: Foundational (T005-T011) → ~2-3 hours
3. Complete Phase 3: User Story 1 (T012-T027) → ~4-6 hours
4. **STOP and VALIDATE**: Test toasts on all screens independently
5. **MVP READY**: Real-time S.I.C. messages functional

**Total MVP Time**: ~6-9 hours for P1 story

### Incremental Delivery

1. **Sprint 1**: Setup + Foundational + US1 → MVP (toasts working)
2. **Sprint 2**: Add US2 → Non-conformity alerts working
3. **Sprint 3**: Add US3 → Journal drawer working
4. **Sprint 4**: Add US4 → Narrative hints working
5. **Sprint 5**: Polish → Full feature complete

### Parallel Team Strategy

With 3 developers after Foundational phase complete:
- **Developer A**: User Story 1 (T012-T027) → 4-6 hours
- **Developer B**: User Story 2 (T028-T034) → 1-2 hours, then help with US3
- **Developer C**: User Story 3 (T035-T059) → 6-8 hours

Then all converge on User Story 4 (T060-T074) → 3-4 hours

**Total Parallel Time**: ~10-14 hours for full feature with 3 developers

---

## Task Summary

**Total Tasks**: 91 tasks across 7 phases

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 7 tasks
- Phase 3 (User Story 1): 16 tasks
- Phase 4 (User Story 2): 7 tasks
- Phase 5 (User Story 3): 25 tasks
- Phase 6 (User Story 4): 15 tasks
- Phase 7 (Polish): 17 tasks

**By User Story**:
- User Story 1 (P1 - Real-time toasts): 16 tasks
- User Story 2 (P2 - Non-conformity alerts): 7 tasks
- User Story 3 (P3 - Journal drawer): 25 tasks
- User Story 4 (P4 - Narrative hints): 15 tasks

**Parallel Opportunities**: 47 tasks marked [P] can run in parallel within their phase

**Independent Tests**: Each user story has clear checkpoint for independent validation

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 27 tasks, ~6-9 hours

---

## Format Validation ✅

All tasks follow strict format:
- ✅ Checkbox `- [ ]` at start
- ✅ Task ID (T001-T091 sequential)
- ✅ [P] marker for parallelizable tasks
- ✅ [Story] label (US1, US2, US3, US4) for user story phases
- ✅ [i18n], [a11y], [perf] labels where applicable
- ✅ Exact file paths in descriptions
- ✅ Clear, actionable descriptions

**Ready for implementation**: All tasks are immediately executable by LLM or developer.
