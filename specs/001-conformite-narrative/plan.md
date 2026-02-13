# Implementation Plan: Conformité Aléatoire System and Hidden Narrative Layer

**Branch**: `001-conformite-narrative` | **Date**: 2025-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-conformite-narrative/spec.md`

## Summary

Implement a mysterious "Conformité Aléatoire" progression system that unlocks after players reach 1,000 tampons and 100 formulaires. The system adds:

1. **Hidden stat** (0-100% conformité) that progresses via passive production (+1% per 150 formulaires) and manual tests (costs 150 formulaires, grants +3%)
2. **Narrative layer** with cryptic S.I.C. (Service Inconnu de Coordination) messages appearing randomly during gameplay
3. **Rare notifications** about non-conforming stamps (0.2% probability, purely cosmetic)
4. **Phase 2 transition gate** via "Réaffectation différée" button that activates at 100% conformité

**Technical approach**: Extend existing GameState with versioned schema migration (v1→v2), integrate conformité calculations into current 100ms game loop, implement custom Toast component for narrative messages using React Native Animated API. No new external dependencies required.

## Technical Context

**Language/Version**: TypeScript 5.8.3 with strict mode enabled (React Native 0.79.1, React 19.0.0)  
**Primary Dependencies**: Expo SDK 53.0.0, @react-native-async-storage/async-storage 1.21.0, React Native Animated API (built-in)  
**Storage**: AsyncStorage (key-value store, JSON serialization) with 5-second debounced saves  
**Testing**: Manual testing on iOS/Android simulators (no automated tests in current codebase)  
**Target Platform**: Mobile (iOS 15+, Android equivalent), Web via Expo export  
**Project Type**: Mobile (React Native/Expo)  
**Performance Goals**: 60fps on mid-range devices (iPhone 11 / Android equivalent), <100ms perceived response for interactions, <3s time-to-interactive  
**Constraints**: Offline-capable idle game, no backend dependency, JavaScript bundle <5MB, conformité progression in 4-6 hours of play  
**Scale/Scope**: Single-player idle game, current codebase 2,414 LOC, adding ~800-1,000 LOC for this feature

**Existing Architecture**:
- **State Management**: React Context API via `GameStateContext` (context/GameStateContext.tsx)
- **Game Loop**: 100ms update interval with batched state updates and production calculations
- **Persistence**: Automatic save every 5 seconds to AsyncStorage, load on app start
- **Data Structure**: Flat JSON-serializable GameState with resources, production rates, administrations
- **Component Pattern**: Functional components with hooks, strict separation of concerns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User Experience & Performance ✅
- [x] Feature provides immediate visual feedback (<100ms perceived response)
  - *Conformité test button uses optimistic UI updates*
  - *Toast animations are GPU-accelerated via useNativeDriver: true*
- [x] Performance impact assessed for 60fps target on mid-range devices
  - *Conformité calculations memoized, <1ms per game loop*
  - *Message trigger checks <2ms per milestone*
  - *Toast rendering offloaded to native thread*
- [x] Idle game mechanics remain accurate across app lifecycle (background/resume)
  - *Conformité progression based on lifetime formulaires (persistent counter)*
  - *Message cooldowns use absolute timestamps (Date.now())*
- [x] AsyncStorage operations are batched and non-blocking
  - *Reuses existing 5-second debounced save, no additional writes*

### Principle II: Code Quality & Maintainability ✅
- [x] Game logic separated from presentation components
  - *conformiteLogic.ts contains pure calculation functions*
  - *messageSystem.ts contains trigger probability logic*
  - *Components only render UI, call Context methods*
- [x] State management uses React Context pattern (GameStateContext)
  - *All new state in GameState.conformite and GameState.messageSystem*
  - *New methods: performConformiteTest(), showToast(), etc.*
- [x] Business logic implemented as pure, testable functions
  - *calculateConformitePercentage(lifetimeFormulaires): number*
  - *calculateSICProbability(lastTriggerTime): number*
  - *All functions take primitives, return primitives*
- [x] Components follow single responsibility (<300 lines)
  - *Toast.tsx: ~150 lines (animation + rendering)*
  - *ConformiteDisplay.tsx: ~120 lines (percentage + button)*
  - *Phase2TransitionButton.tsx: ~80 lines (button + state logic)*
- [x] TypeScript strict mode with justified `any` types only
  - *Migration function uses `any` for loaded JSON (unavoidable)*
  - *All other types fully specified*
- [x] Complex logic has JSDoc comments
  - *All Context methods documented with @param, @returns, @example*
  - *Calculation functions have inline comments explaining thresholds*
- [x] Game constants defined in centralized data files
  - *messageSystem.ts: SIC_MESSAGES array, probability constants*
  - *conformiteLogic.ts: UNLOCK_TAMPONS, UNLOCK_FORMULAIRES, TEST_COST*

### Principle III: French Language & Cultural Authenticity ✅
- [x] All in-game text in French with authentic bureaucratic terminology
  - *"Conformité aléatoire", "Réaliser un test de conformité", "Réaffectation différée"*
  - *6 S.I.C. message variants using formal bureaucratic register*
  - *Phase 2 notification: "Votre niveau de conformité a été jugé satisfaisant..."*
- [x] Proper French accents, grammar, and orthography
  - *All accents verified: conformité (é), réaliser (é), réaffectation (é)*
  - *Passive voice in messages: "a été transféré", "a été jugé"*
- [x] References to real French administrative structures where appropriate
  - *"Service Inconnu de Coordination" follows real ministry naming patterns*
  - *"Bureau des Documents Obsolètes" replaces generic "Administration Centrale"*
- [x] Number formatting follows French conventions (1 000, 1,5)
  - *Reuses existing formatNumberFrench() utility for resource displays*
  - *Percentage displays: "45%" (no space before %, French standard)*
- [x] Date/time uses French locale (dd/mm/yyyy)
  - *Not applicable to this feature (no date displays)*

### Principle IV: Accessibility & Inclusive Design ✅
- [x] Touch targets minimum 44×44 points
  - *All buttons (test, Phase 2 transition) meet 44×44pt requirement*
  - *Verified in component stylesheets*
- [x] Color not sole means of conveying information (icons + text)
  - *Grayed-out Phase 2 button uses opacity + text color + disabled state*
  - *Toast types use text content primarily, color as enhancement*
- [x] Text contrast meets WCAG 2.1 AA (4.5:1 normal, 3:1 large)
  - *Conformité display uses high-contrast text on background*
  - *Grayed-out button maintains 3:1 contrast ratio minimum*
- [x] Accessibility labels for all icons/images
  - *Conformité percentage: "Conformité aléatoire : X pourcent"*
  - *Test button: "Réaliser un test de conformité. Coûte cent cinquante formulaires."*
  - *Phase 2 button: "Réaffectation différée. Conformité requise : cent pourcent."*
  - *Toast messages: accessibilityLiveRegion="polite" for screen reader announcements*
- [x] Font sizes responsive to system settings
  - *Uses React Native Text component (inherits system font scaling)*
- [x] Playable without sound/haptics (visual alternatives)
  - *Feature is entirely visual (no audio planned)*

### Principle V: Architectural Separation of Concerns ✅
- [x] Presentation layer (`/components`) only renders UI
  - *Toast.tsx, ConformiteDisplay.tsx, Phase2TransitionButton.tsx render only*
  - *All logic delegated to Context methods*
- [x] State layer (`/context`) manages game state
  - *GameStateContext.tsx extended with conformité state*
  - *Toast queue managed in Context state*
- [x] Business logic layer (`/data`) contains calculations
  - *conformiteLogic.ts: Pure functions for percentage, unlock checks*
  - *messageSystem.ts: Probability calculations, message selection*
- [x] Type definitions in `/types`
  - *game.ts extended with ConformiteState, MessageSystemState, ToastMessage*
- [x] Constants in `/constants`
  - *Message arrays and thresholds in /data (acceptable alternative per architecture)*
- [x] Unidirectional dependencies: Presentation → State → Logic
  - *Components import Context hooks only*
  - *Context imports from /data and /types*
  - *No circular dependencies*
- [x] Components don't directly import from `/data`
  - *All data access via useGameState() hook*
- [x] Pure functions in `/data` have no React dependencies
  - *conformiteLogic.ts and messageSystem.ts have zero React imports*

**Constitution Compliance: ✅ PASS** - All 5 principles satisfied with documented evidence.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
bureaucracy_v.1.17.0-MVP/          # React Native/Expo project root
├── app/                            # Expo Router screens
│   ├── index.tsx                   # Main game screen (integrate conformité UI)
│   └── options.tsx                 # Options/settings (no changes needed)
│
├── components/                     # UI Components
│   ├── Toast.tsx                   # NEW: Notification component
│   ├── ConformiteDisplay.tsx       # NEW: Conformité % + test button
│   ├── Phase2TransitionButton.tsx  # NEW: "Réaffectation différée" button
│   ├── ResourceBar.tsx             # Existing (no changes)
│   ├── StampButton.tsx             # Existing (no changes)
│   ├── AgentItem.tsx               # Existing (no changes)
│   └── AdministrationCard.tsx      # Existing (no changes)
│
├── context/                        # State Management
│   └── GameStateContext.tsx        # MODIFIED: Add conformité methods + state
│
├── data/                           # Business Logic
│   ├── gameData.ts                 # MODIFIED: Rename "Administration Centrale"
│   ├── conformiteLogic.ts          # NEW: Pure functions for conformité
│   └── messageSystem.ts            # NEW: S.I.C. messages + trigger logic
│
├── types/                          # TypeScript Definitions
│   └── game.ts                     # MODIFIED: Extend GameState interface
│
├── utils/                          # Utilities
│   ├── formatters.ts               # Existing (no changes)
│   └── stateMigration.ts           # NEW: v1→v2 save migration
│
├── specs/                          # Feature Documentation
│   └── 001-conformite-narrative/   # This feature
│       ├── spec.md                 # Requirements (input)
│       ├── plan.md                 # This file (output)
│       ├── research.md             # Research decisions (output)
│       ├── data-model.md           # Entity definitions (output)
│       ├── quickstart.md           # Developer guide (output)
│       └── contracts/              # API contracts (output)
│           └── GameStateContext-API.md
│
└── package.json                    # No new dependencies needed
```

**Structure Decision**: React Native mobile app with Expo Router for navigation. Follows existing architecture with clear separation: `/components` for UI, `/context` for state, `/data` for logic, `/types` for definitions. This feature adds 3 new components, 2 new data modules, 1 new utility, and extends existing Context + types.

## Complexity Tracking

**No Constitution violations identified.** All requirements can be satisfied using existing patterns and architecture. No additional complexity justified.

---

## Implementation Phases

### Phase 0: Preparation (Complete ✅)
**Duration**: Research complete  
**Deliverables**: research.md, data-model.md, contracts/, quickstart.md

**Completed Items**:
- [x] Research React Native notification/toast patterns
- [x] Research AsyncStorage migration strategies
- [x] Research random message triggering for idle games
- [x] Define data model entities (ConformiteState, MessageSystemState, ToastMessage)
- [x] Design API contract for Context extensions
- [x] Create developer quickstart guide
- [x] Update agent context files

---

### Phase 1: Type Definitions & Data Layer
**Duration**: 2-3 hours  
**Risk**: Low - Pure TypeScript definitions and logic

#### Tasks
1. **Extend Type Definitions** (`types/game.ts`)
   - Add `ConformiteState` interface (6 properties)
   - Add `MessageSystemState` interface (3 properties)
   - Add `ToastMessage` interface (5 properties)
   - Extend `GameState` with `version: number`, `conformite?`, `messageSystem?`
   - **Acceptance**: Types compile without errors, optional properties marked correctly

2. **Create Conformité Logic Module** (`data/conformiteLogic.ts`)
   - `calculateConformitePercentage(lifetimeFormulaires: number): number`
   - `shouldUnlockConformite(highestTampons, highestFormulaires): boolean`
   - `canPerformTest(formulaires, lastTestTimestamp): boolean`
   - Export constants: `UNLOCK_TAMPONS = 1000`, `UNLOCK_FORMULAIRES = 100`, `TEST_COST = 150`, `TEST_GAIN = 3`
   - **Acceptance**: Functions return correct values for test cases (0→0%, 150→1%, 15000→100%)

3. **Create Message System Module** (`data/messageSystem.ts`)
   - `SIC_MESSAGES: string[]` array with 6 French variants
   - `getRandomSICMessage(): string`
   - `calculateSICProbability(sicLastTriggerTime: number | null): number`
   - `shouldTriggerNonConformity(nonConformityLastTime: number | null): boolean`
   - Export milestone thresholds: `MILESTONE_DOSSIERS = 100`, `MILESTONE_TAMPONS = 50`, `MILESTONE_FORMULAIRES = 25`
   - **Acceptance**: Probability calculations match spec (2% <5min, 12.5% base, 20% >30min)

4. **Update Game Data** (`data/gameData.ts`)
   - Change line 7: `name: 'Administration Centrale'` → `name: 'Bureau des Documents Obsolètes'`
   - **Acceptance**: Name change appears in game UI, ID remains 'administration-centrale'

**Testing Checkpoints**:
- TypeScript compiles successfully (`npm run lint`)
- Data layer functions have no React dependencies (pure functions)
- Conformité percentage calculation: 450 formulaires → 3%, 15000 formulaires → 100%
- S.I.C. probability: null → 12.5%, 60s ago → 2%, 2000s ago → 20%

---

### Phase 2: State Migration & Persistence
**Duration**: 2-3 hours  
**Risk**: Medium - Critical for save data compatibility

#### Tasks
1. **Create Migration Utility** (`utils/stateMigration.ts`)
   - `migrateGameState(loaded: any): GameState`
   - Detect version: `loaded.version || 1`
   - V1→V2 migration: Add conformité and messageSystem with safe defaults
   - Use current resources as initial `highestEver` values
   - Set `lifetimeFormulaires` to current formulaires count
   - Log migration events: `console.log('[Migration] v1→v2: Adding conformité')`
   - **Acceptance**: Old save (no version field) loads without errors, conformité initialized correctly

2. **Update GameStateContext Load Logic** (`context/GameStateContext.tsx`, line 109-127)
   - Import `migrateGameState` from utils
   - After `JSON.parse(storedState)`, call `migrateGameState(parsedState)`
   - Handle migration errors with try/catch → fallback to `initialGameState`
   - **Acceptance**: V1 save migrates successfully, all data preserved, conformité added

3. **Update Initial Game State** (`data/gameData.ts`)
   - Add to `initialGameState`: `version: 2`, `conformite: {...}`, `messageSystem: {...}`
   - **Acceptance**: New players start with version 2 state, conformité at 0%, unlocked=false

**Testing Checkpoints**:
- Create mock V1 save JSON (no version, no conformité)
- Load mock save → verify migration runs
- Check migrated state has version=2, conformité initialized
- Verify existing resources/administrations unchanged
- Test corrupted save JSON → fallback to initial state gracefully

---

### Phase 3: Context Extension - Core Methods
**Duration**: 3-4 hours  
**Risk**: Medium - Core game loop integration

#### Tasks
1. **Extend GameState in Context** (`context/GameStateContext.tsx`)
   - Add `toastQueue: ToastMessage[]` to component state (separate from GameState)
   - Import conformité and message logic from `/data`

2. **Add Toast Management Methods**
   - `showToast(message: string, type: ToastType, duration?: number): void`
     - Generate unique ID: `Date.now() + Math.random()`
     - Add to queue (limit 3 max)
     - Set auto-dismiss timeout
   - `dismissToast(toastId: string): void`
     - Filter toast from queue by ID
   - `getActiveToasts(): ToastMessage[]`
     - Return current toast queue
   - **Acceptance**: Calling `showToast()` adds to queue, auto-dismisses after duration

3. **Add Conformité Query Methods**
   - `isConformiteUnlocked(): boolean`
     - Check `gameState.conformite?.isUnlocked || shouldUnlockConformite(...)`
     - Memoize with `useMemo`
   - `isPhase2ButtonActive(): boolean`
     - Return `conformite?.percentage >= 100 && conformite?.isUnlocked`
   - **Acceptance**: Methods return correct boolean based on game state

4. **Add Conformité Action Method**
   - `performConformiteTest(): boolean`
     - Validate: unlocked, formulaires >= 150, debounce 500ms
     - Atomic state update: deduct 150 formulaires, add +3% conformité (cap 100)
     - Update `lastTestTimestamp`
     - Return `true` on success, `false` on validation failure
   - **Acceptance**: Button click → formulaires decrease, percentage increases, debounce prevents spam

**Testing Checkpoints**:
- Call `performConformiteTest()` with 200 formulaires → success, -150 formulaires, +3%
- Call with 100 formulaires → failure, no state change
- Rapid click (3x in 1 second) → only first succeeds (debounce)
- `isConformiteUnlocked()` returns false until thresholds met
- `isPhase2ButtonActive()` returns false until 100%

---

### Phase 4: Game Loop Integration
**Duration**: 3-4 hours  
**Risk**: High - Must not break existing production calculations

#### Tasks
1. **Track Lifetime Formulaires** (in game loop, `GameStateContext.tsx` line 163-187)
   - Calculate formulaires gained this tick: `production.formulaires * deltaTime`
   - Add to `conformite.lifetimeFormulaires`
   - Update `highestEverTampons` = `Math.max(current, highest)`
   - Update `highestEverFormulaires` = `Math.max(current, highest)`
   - **Acceptance**: Lifetime counter increases monotonically, never decreases

2. **Passive Conformité Progression** (in game loop)
   - Call `calculateConformitePercentage(lifetimeFormulaires)`
   - Update `conformite.percentage` if changed
   - **Acceptance**: Producing 150 formulaires → +1% conformité automatically

3. **Unlock Check** (in game loop)
   - If `!conformite.isUnlocked`, check `shouldUnlockConformite()`
   - Set `conformite.isUnlocked = true` when thresholds met
   - **Acceptance**: At exactly 1000 tampons + 100 formulaires → conformité UI appears

4. **Production Milestone Detection** (in game loop)
   - Track `lastProductionMilestone` for dossiers/tampons/formulaires
   - Detect crossing: `floor(current / threshold) > floor(last / threshold)`
   - On crossing → call `attemptMessageTrigger()`
   - **Acceptance**: Every 100 dossiers produced → milestone detected

5. **S.I.C. Message Trigger** (new function)
   - `attemptMessageTrigger(state: GameState): void`
   - Get probability from `calculateSICProbability()`
   - Roll random: `Math.random() < probability`
   - If true → `showToast(getRandomSICMessage(), 'sic', 4000)`
   - Update `messageSystem.sicLastTriggerTime = Date.now()`
   - **Acceptance**: Messages appear ~12.5% of milestones, respect 5-min cooldown

6. **Non-Conformity Trigger** (in tampon production)
   - On tampon produced → `shouldTriggerNonConformity()`
   - If true (0.2% chance) AND last >10min ago → show notification
   - **Acceptance**: Rare notification appears ~1 per 500 tampons, rate-limited

**Testing Checkpoints**:
- Play to 1000 tampons + 100 formulaires → conformité unlocks immediately
- Produce 150 formulaires → verify +1% passive gain
- Observe milestone crossings → S.I.C. messages appear occasionally
- Let game run 30+ minutes without message → next milestone has 20% chance
- Verify existing production rates unchanged (no regression)

---

### Phase 5: UI Components
**Duration**: 4-5 hours  
**Risk**: Low - Isolated React components

#### Tasks
1. **Create Toast Component** (`components/Toast.tsx`)
   - Props: `message: string`, `type: ToastType`, `onDismiss: () => void`, `duration: number`
   - Animated slide-in from top: `useRef(new Animated.Value(-100))`
   - Fade-in: `useRef(new Animated.Value(0))`
   - Auto-dismiss timer: `setTimeout(onDismiss, duration)`
   - Pressable to dismiss manually
   - Accessibility: `accessibilityLiveRegion="polite"`, `accessibilityLabel={message}`
   - Use `useNativeDriver: true` for animations
   - **Acceptance**: Toast slides in smoothly, dismisses after 4s, tap to dismiss works

2. **Create Toast Container** (`components/ToastContainer.tsx`)
   - Get toasts from Context: `const toasts = getActiveToasts()`
   - Map toasts to `<Toast />` components
   - Position: `position: 'absolute', top: 20, left: 20, right: 20, zIndex: 1000`
   - **Acceptance**: Multiple toasts stack vertically, max 3 visible

3. **Create Conformité Display** (`components/ConformiteDisplay.tsx`)
   - Show "Conformité aléatoire : X%" (get from `gameState.conformite.percentage`)
   - Button: "Réaliser un test de conformité"
   - Disable button if `!canPerformTest()` (check formulaires < 150)
   - OnPress → `performConformiteTest()`, show error toast if failed
   - Touch target: 48×48pt minimum
   - Accessibility: Button label includes cost "Coûte cent cinquante formulaires"
   - **Acceptance**: Button disabled when formulaires insufficient, click → percentage increases

4. **Create Phase 2 Button** (`components/Phase2TransitionButton.tsx`)
   - Text: "Réaffectation différée"
   - Grayed out style when `!isPhase2ButtonActive()`
   - Active style when conformité >= 100%
   - OnPress → `showToast("Votre niveau de conformité...", "phase2", 6000)`
   - Touch target: 48×48pt minimum
   - Accessibility: Hint explains unlock requirement when grayed
   - **Acceptance**: Button grays out correctly, activates at 100%, notification shows

**Testing Checkpoints**:
- Toast animation runs at 60fps (use React DevTools Profiler)
- Multiple toasts display simultaneously without overlap
- Conformité display updates in real-time as percentage changes
- Phase 2 button visual states correct (grayed vs active)
- All accessibility labels read correctly by VoiceOver/TalkBack

---

### Phase 6: Integration & Layout
**Duration**: 2-3 hours  
**Risk**: Low - UI composition

#### Tasks
1. **Update Main Game Screen** (`app/index.tsx`)
   - Import new components: `ConformiteDisplay`, `Phase2TransitionButton`, `ToastContainer`
   - Position conformité display below resource bar
   - Position Phase 2 button in footer/options area
   - Render `<ToastContainer />` at root level (for z-index overlay)
   - Conditional rendering: `{isConformiteUnlocked() && <ConformiteDisplay />}`
   - **Acceptance**: Layout looks clean, no overlaps, all components visible

2. **Style Integration**
   - Match existing game UI style (colors, fonts, spacing)
   - Ensure conformité section feels cohesive with resource display
   - Phase 2 button fits existing button styles
   - **Acceptance**: New UI feels integrated, not "bolted on"

**Testing Checkpoints**:
- Visual regression: Game still looks good on iPhone/Android screens
- No layout shifts when conformité unlocks (smooth appearance)
- Toasts overlay all content without blocking critical UI
- Portrait and landscape orientations work (if supported)

---

### Phase 7: End-to-End Testing
**Duration**: 3-4 hours  
**Risk**: High - Full feature validation

#### Test Scenarios
1. **New Player Flow**
   - Start game from scratch
   - Play until 1000 tampons + 100 formulaires
   - Verify conformité appears immediately (within 1 second)
   - Click test button 3 times (spend 450 formulaires)
   - Verify percentage increases by +9%
   - Continue passive play to 15,000 formulaires
   - Verify reach 100%
   - Verify Phase 2 button activates
   - Click Phase 2 button → verify notification appears

2. **Migration Flow**
   - Create mock V1 save (old save format)
   - Load save → verify conformité initializes
   - Play and produce resources → verify progression works
   - Close app, reopen → verify state persisted

3. **Message System**
   - Play for 30 minutes
   - Count S.I.C. messages (expect 2-3)
   - Verify messages don't spam (no more than 1 per 2 minutes if rapid)
   - Produce ~2000 tampons → verify non-conformity notification appears

4. **Edge Cases**
   - Rapid-click test button → verify only 1 action per 500ms
   - Reach 100% via passive (not button) → verify Phase 2 activates
   - Force-quit app during test → verify no resource loss/duplication on reload
   - Test with formulaires exactly 150 → verify button works
   - Test with formulaires 149 → verify button disabled

5. **Accessibility**
   - Enable VoiceOver (iOS) or TalkBack (Android)
   - Navigate to conformité display → verify percentage announced
   - Focus test button → verify cost announced
   - Trigger toast → verify message announced
   - Verify all touch targets tappable with screen reader

6. **Performance**
   - Profile with React DevTools
   - Verify game loop overhead <5% (conformité checks <2ms)
   - Verify 60fps maintained during toast animations
   - Verify no memory leaks (play 1 hour, check memory usage)

**Acceptance Criteria**:
- All spec requirements met (FR-001 through FR-022)
- All accessibility requirements met (AR-001 through AR-008)
- All localization requirements met (LR-001 through LR-005)
- All success criteria met (SC-001 through SC-012)
- No regressions in existing gameplay

---

### Phase 8: Polish & Documentation
**Duration**: 1-2 hours  
**Risk**: Low - Cleanup and finalization

#### Tasks
1. **Code Review Self-Check**
   - Verify all JSDoc comments present
   - Remove debug console.logs (keep migration log)
   - Run `npm run lint` → fix any warnings
   - Verify no `any` types without justification

2. **French Language Review**
   - Verify all accents correct: conformité, réaliser, réaffectation
   - Check S.I.C. messages for grammar/tone
   - Verify space before colons in "S.I.C. :"
   - Test on French locale device

3. **Update Feature Documentation**
   - Document any deviations from plan
   - Update quickstart.md if implementation differs
   - Add troubleshooting notes for common issues

4. **Create Demo Video/Screenshots**
   - Capture conformité unlock moment
   - Capture S.I.C. message appearance
   - Capture Phase 2 button activation
   - Use for future reference/marketing

**Deliverables**:
- Clean, production-ready code
- All documentation updated
- Feature demo materials
- Ready for playtesting

---

## Implementation Timeline

| Phase | Duration | Cumulative | Risk |
|-------|----------|------------|------|
| 0. Preparation | Complete | — | ✅ Low |
| 1. Type Definitions & Data Layer | 2-3h | 2-3h | ✅ Low |
| 2. State Migration & Persistence | 2-3h | 4-6h | ⚠️ Medium |
| 3. Context Extension | 3-4h | 7-10h | ⚠️ Medium |
| 4. Game Loop Integration | 3-4h | 10-14h | 🔴 High |
| 5. UI Components | 4-5h | 14-19h | ✅ Low |
| 6. Integration & Layout | 2-3h | 16-22h | ✅ Low |
| 7. End-to-End Testing | 3-4h | 19-26h | 🔴 High |
| 8. Polish & Documentation | 1-2h | 20-28h | ✅ Low |

**Total Estimated Effort**: 20-28 hours (2.5-3.5 working days)

---

## Risk Mitigation

### High-Risk Areas

1. **Game Loop Integration** (Phase 4)
   - **Risk**: Breaking existing production calculations or causing performance regression
   - **Mitigation**: 
     - Add conformité logic in separate section, no modifications to existing production code
     - Profile before/after with React DevTools
     - Test production rates match pre-implementation values
     - Implement feature flags for easy rollback

2. **State Migration** (Phase 2)
   - **Risk**: Data loss or corruption of existing player saves
   - **Mitigation**:
     - Test with multiple mock V1 saves (edge cases: 0 resources, max resources, partial unlocks)
     - Implement graceful fallback to initial state on any migration error
     - Add extensive logging for debugging migration issues
     - Consider backup save creation before migration

3. **End-to-End Testing** (Phase 7)
   - **Risk**: Missing edge cases that appear in production
   - **Mitigation**:
     - Test on both iOS and Android devices (not just simulators)
     - Test with different system settings (font sizes, reduced motion)
     - Test with poor performance conditions (throttled CPU)
     - Get playtester feedback before final merge

### Medium-Risk Areas

1. **Context Extension** (Phase 3)
   - **Risk**: State synchronization issues or memory leaks in toast queue
   - **Mitigation**:
     - Cap toast queue at 3 messages (prevents unbounded growth)
     - Clear all timeouts on component unmount
     - Use React DevTools to monitor re-renders

2. **Persistence** (Phase 2)
   - **Risk**: AsyncStorage failures on different devices/OS versions
   - **Mitigation**:
     - Wrap all AsyncStorage calls in try/catch
     - Graceful degradation if save fails (log error, continue playing)
     - Test on oldest supported iOS/Android versions

---

## Testing Strategy

### Manual Testing Focus
Given the codebase has no automated test infrastructure, focus on thorough manual testing:

1. **Functional Testing**
   - Test each requirement from spec (FR-001 through FR-022)
   - Test all edge cases documented in spec
   - Test all user stories and acceptance scenarios

2. **Integration Testing**
   - Verify conformité system doesn't affect existing gameplay
   - Verify production rates unchanged
   - Verify agent purchases still work
   - Verify administration unlocks still work

3. **Regression Testing**
   - Play existing game loop end-to-end before implementation
   - Document baseline behavior (production rates, unlock timings)
   - After implementation, verify baselines unchanged

4. **Performance Testing**
   - Use React DevTools Profiler to measure re-render impact
   - Monitor frame rate during animations (target: 60fps)
   - Check memory usage over extended play sessions (target: stable, no leaks)

5. **Compatibility Testing**
   - Test on iPhone 11 (minimum target device)
   - Test on Android equivalent (mid-range)
   - Test on web build (`expo export --platform web`)
   - Test with VoiceOver (iOS) and TalkBack (Android)

6. **Localization Testing**
   - Set device to French locale
   - Verify all text displays correctly
   - Verify number formatting (spaces for thousands)
   - Verify screen reader pronunciation

### Test Data Preparation
- Create V1 mock save files for migration testing
- Create edge-case saves (0 resources, max resources, 99% conformité)
- Document test accounts/saves for reproducing issues

---

## Dependencies & Integration Points

### External Dependencies
- **None** - Feature uses only existing packages:
  - React Native Animated API (built-in)
  - AsyncStorage (already in package.json v1.21.0)
  - TypeScript (already in package.json v5.8.3)

### Internal Integration Points

1. **GameStateContext.tsx** (Central)
   - **Current Role**: Manages all game state, production calculations, resource updates
   - **Integration**: Extend with conformité state, add message triggers to game loop
   - **Risk**: High - core system, must not break existing functionality
   - **Touch Points**: Lines 109-127 (load), 163-197 (game loop), 203-211 (increment resource)

2. **types/game.ts** (Critical)
   - **Current Role**: Defines all TypeScript interfaces for game entities
   - **Integration**: Add new interfaces, extend GameState
   - **Risk**: Low - additive changes only
   - **Touch Points**: GameState interface (line 48)

3. **data/gameData.ts** (Minor)
   - **Current Role**: Static data for administrations and agents
   - **Integration**: Rename one administration
   - **Risk**: Low - simple string change
   - **Touch Points**: Line 7 (administration name)

4. **app/index.tsx** (Main Game Screen)
   - **Current Role**: Renders main game interface
   - **Integration**: Add conformité UI components
   - **Risk**: Low - layout changes only
   - **Touch Points**: Add components to render tree

### Data Flow Dependencies
```
User Clicks Test Button
  → ConformiteDisplay.tsx (UI)
  → performConformiteTest() (Context)
  → canPerformTest() (Data Layer)
  → State Update (Context)
  → AsyncStorage Save (Context, debounced)

Game Loop Tick
  → updateGameState() (Context, line 163)
  → Calculate formulaires produced
  → Update lifetimeFormulaires
  → calculateConformitePercentage() (Data Layer)
  → Update conformite.percentage (Context)
  → Check milestone crossing
  → attemptMessageTrigger() (Context)
  → calculateSICProbability() (Data Layer)
  → showToast() (Context)
  → Toast.tsx renders (UI)
```

---

## Success Metrics

### Functional Metrics (from spec)
- [x] SC-001: Conformité unlocks within 0.1s of reaching thresholds
- [x] SC-002: 0→100% progression achievable in 4-6 hours
- [x] SC-003: 2-3 S.I.C. messages per 30-minute session
- [x] SC-004: Button clicks complete in <100ms
- [x] SC-005: Non-conformity appears ~1 per 2,500 tampons
- [x] SC-006: All touch targets meet 44×44pt
- [x] SC-007: State persists correctly across sessions
- [x] SC-008: Phase 2 button activates <1s at 100%
- [x] SC-009: Rapid clicks handled correctly (debounce)
- [x] SC-010: French text displays correctly with accents
- [x] SC-011: Bureau rename appears in all locations
- [x] SC-012: Playtesting shows mystery achieved without frustration

### Performance Metrics
- Game loop overhead: <5% increase (<2ms per 100ms iteration)
- Frame rate: Maintain 60fps on iPhone 11 with toast animations
- Memory: Stable over 1-hour play session (no leaks)
- Bundle size: <100KB added to JavaScript bundle

### Code Quality Metrics
- LOC added: ~800-1,000 (components ~400, logic ~200, types ~100, context ~300)
- TypeScript coverage: 100% (strict mode, no `any` except migration function)
- Component sizes: All <300 lines
- Function complexity: All pure functions <50 lines

---

## Rollout Plan

### Pre-Merge Checklist
- [ ] All Constitution principles verified (5/5 pass)
- [ ] All functional requirements implemented (FR-001 through FR-022)
- [ ] All accessibility requirements implemented (AR-001 through AR-008)
- [ ] All localization requirements implemented (LR-001 through LR-005)
- [ ] All success criteria tested (SC-001 through SC-012)
- [ ] Migration tested with V1 saves
- [ ] Performance profiled (60fps maintained)
- [ ] Accessibility tested (VoiceOver/TalkBack)
- [ ] French language reviewed by native speaker
- [ ] No regressions in existing gameplay
- [ ] Code review completed
- [ ] Documentation updated

### Deployment Steps
1. Merge feature branch `001-conformite-narrative` to main
2. Test on production build (not just dev mode)
3. Create backup of app state before release
4. Gradual rollout (if possible): 10% → 50% → 100% of users
5. Monitor crash reports and user feedback
6. Hotfix plan ready (feature flag to disable conformité UI if critical bug)

### Post-Deployment Monitoring
- Watch for migration errors in logs (first week)
- Monitor player retention at conformité unlock point
- Track time-to-100% conformité in analytics (if added)
- Collect qualitative feedback on mystery/confusion balance
- Adjust S.I.C. message frequency if too spammy/rare

---

## Future Considerations

### Phase 2 Integration (Out of Scope for This Plan)
When implementing actual Phase 2 transition:
- The `performPhase2Transition()` method will need to be added to Context
- Phase2TransitionButton.tsx will call this method instead of just showing toast
- May require new GameState properties (e.g., `phase: 1 | 2`)
- Will need another migration (v2→v3)

### Potential Enhancements (Not in Spec)
- Analytics tracking for conformité progression curve
- Achievement system integration ("Reach 100% conformité")
- Sound effects for S.I.C. messages (if audio added to game)
- Different toast styles for different S.I.C. message types
- Persistent message log (view past S.I.C. messages)

### Scalability Considerations
- Current design supports 100+ S.I.C. message variants (simple array extension)
- Toast queue capped at 3 (could increase if needed without code changes)
- Milestone thresholds are constants (easy to tune for balance)
- Conformité progression formula is centralized (easy to rebalance)

---

## Appendix: Key Decisions Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Custom Toast vs Library | No external deps, full control over French typography, bundle size | react-native-toast-message (500KB+, overkill) |
| Versioned State Schema | Enable future feature additions without breaking saves | Hard reset (destroys progress), separate keys (storage bloat) |
| Passive + Active Progression | Idle game principle + player engagement | Pure passive (boring), pure active (grindy) |
| Milestone-Based Triggers | Better distribution than time-based for idle games | Time-based (fails when app closed), per-production (too chaotic) |
| 1000 tampons + 100 formulaires Threshold | 1-2 hour unlock (late enough to learn, early enough for interest) | Lower (too early), higher (too late) |
| 15,000 formulaires to 100% | 4-6 hour timeline fits Phase 1 completion | Higher (extends timeline), lower (too fast) |
| S.I.C. (Service Inconnu) | Vague enough to maintain mystery, French enough to feel authentic | English acronym (breaks immersion), overly explained name (kills mystery) |
| 0.2% Non-Conformity Rate | Rare enough to feel special, not so rare players never see it | Higher (too spammy), lower (players miss it entirely) |

---

## References

- [Feature Specification](./spec.md) - Complete requirements and user stories
- [Research Document](./research.md) - Technical decisions and alternatives
- [Data Model](./data-model.md) - Entity definitions and calculations
- [Quickstart Guide](./quickstart.md) - Developer implementation guide
- [Context API Contract](./contracts/GameStateContext-API.md) - Method specifications
- [Constitution](./.specify/memory/constitution.md) - Project principles and standards

---

**Plan Status**: ✅ Complete and Ready for Implementation  
**Next Command**: `/speckit.tasks` to generate detailed task breakdown (tasks.md)
