# Implementation Plan: Système de Messages S.I.C.

**Branch**: `001-sic-message-system` | **Date**: 2025-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sic-message-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement the S.I.C. (Service Inconnu de Coordination) message system with two complementary features:
1. **Real-time toast notifications** visible on all screens (mysterious S.I.C. messages + rare "Tampon non conforme" alerts)
2. **Journal drawer** accessible via burger menu in header, containing chronological history and narrative hints

**Technical Approach**:
- Wire existing `messageSystem.ts` pure functions into `GameStateContext` game loop (milestone detection + probabilistic triggers)
- Migrate toast system to shared tab layout level using existing `Toast.tsx` and `ToastContainer.tsx`
- Use `react-native-reanimated` v3 for journal drawer and toast bounce animations (NOT legacy Animated API)
- Add `JournalEntry` interface to `types/game.ts` and `journal` field to `GameState`
- Implement V2→V3 state migration for journal persistence
- Create journal drawer component with FlatList virtualization (max 500 entries)

## Technical Context

**Language/Version**: TypeScript strict mode, React Native (Expo SDK 53)  
**Primary Dependencies**: 
- expo-router v5 (navigation)
- react-native-reanimated v3 (drawer + toast bounce animations)
- @react-native-async-storage/async-storage (state persistence)
- lucide-react-native (burger menu icon)

**Storage**: AsyncStorage for GameState persistence (5s debounced saves)  
**Testing**: Manual testing on iOS/Android simulators (no automated tests required for this feature)  
**Target Platform**: iOS 15+ / Android equivalent (mid-range devices: iPhone 11+)  
**Project Type**: Mobile (React Native + Expo)  
**Performance Goals**: 
- 60fps animations (drawer slide, toast bounce)
- Toast display latency <500ms from trigger
- Journal scroll performance with 500 entries at 60fps
- Game loop continues at 100ms cycle during animations

**Constraints**: 
- Max 3 active toasts (overflow silently dropped, per spec clarification Q5)
- No manual dismiss on toasts (spec clarification Q3 — auto-dismiss only)
- No badge on burger menu (spec clarification Q1 — pure discovery)
- Toast animation must include micro-bounce stamp effect (spec clarification Q2)
- Journal entries limited to 500 max (oldest rotated out)

**Scale/Scope**: 
- 4 tabs with shared header (Bureau, Recrutement, Progression, Options)
- ~15 component files
- Journal drawer: single drawer component + entry item component
- Toast system: refactor existing Toast.tsx to use reanimated v3

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User Experience & Performance
- [x] Feature provides immediate visual feedback (<100ms perceived response) — Toast display triggered synchronously from milestone detection in 100ms game loop
- [x] Performance impact assessed for 60fps target on mid-range devices — Reanimated v3 + FlatList virtualization ensure smooth animations
- [x] Idle game mechanics remain accurate across app lifecycle (background/resume) — Journal persisted in GameState, toasts ephemeral (auto-dismissed), no background notification push
- [x] AsyncStorage operations are batched and non-blocking — Journal writes batched with existing 5s GameState save interval

### Principle II: Code Quality & Maintainability
- [x] Game logic separated from presentation components — Pure functions in `data/messageSystem.ts`, UI in `components/`
- [x] State management uses React Context pattern (GameStateContext) — `journal` field added to GameState, accessed via `useGameState()` hook
- [x] Business logic implemented as pure, testable functions — `getRandomSICMessage()`, `calculateSICProbability()`, `shouldTriggerNonConformity()`, `hasCrossedMilestone()` already implemented as pure functions
- [x] Components follow single responsibility (<300 lines) — `JournalDrawer.tsx` (drawer UI), `JournalEntry.tsx` (single entry), `Toast.tsx` (refactored for reanimated)
- [x] TypeScript strict mode with justified `any` types only — All new types defined in `types/game.ts` (`JournalEntry` interface)
- [x] Complex logic has JSDoc comments — Existing functions already documented, new functions will follow pattern
- [x] Game constants defined in centralized data files — Constants already in `data/messageSystem.ts` (MILESTONE_*, PROBABILITY_*, etc.)

### Principle III: French Language & Cultural Authenticity
- [x] All in-game text in French with authentic bureaucratic terminology — `SIC_MESSAGES` pool already in French, journal UI text in French
- [x] Proper French accents, grammar, and orthography — Verified: "Système de Messages S.I.C.", "Service Inconnu de Coordination", "Tampon non conforme détecté"
- [x] References to real French administrative structures where appropriate — "Service Inconnu de Coordination" plays on French administrative naming patterns
- [x] Number formatting follows French conventions (1 000, 1,5) — Existing `formatNumberFrench()` utility used for any numeric displays
- [x] Date/time uses French locale (dd/mm/yyyy) — Journal timestamps will use relative French format ("Il y a 2 minutes") or French absolute format

### Principle IV: Accessibility & Inclusive Design
- [x] Touch targets minimum 44×44 points — Burger menu button meets 44×44pt requirement (spec AR-001)
- [x] Color not sole means of conveying information (icons + text) — Toast borders (blue/red) supplemented with text type indicators (spec AR-008)
- [x] Text contrast meets WCAG 2.1 AA (4.5:1 normal, 3:1 large) — White text on dark backgrounds verified in existing Toast.tsx styles (spec AR-007)
- [x] Accessibility labels for all icons/images — Burger button has `accessibilityLabel="Ouvrir le journal S.I.C."` (spec AR-002), toasts have `accessibilityLiveRegion="polite"` (spec AR-003)
- [x] Font sizes responsive to system settings — Expo's default Text component respects system font scaling
- [x] Playable without sound/haptics (visual alternatives) — Feature is purely visual (toasts + journal), no audio/haptic dependencies

### Principle V: Architectural Separation of Concerns
- [x] Presentation layer (`/components`) only renders UI — `JournalDrawer.tsx`, `JournalEntry.tsx`, `Toast.tsx` (refactored) are pure UI components
- [x] State layer (`/context`) manages game state — `GameStateContext.tsx` extended with `journal: JournalEntry[]` field and journal mutation methods
- [x] Business logic layer (`/data`) contains calculations — `messageSystem.ts` contains all trigger logic (already implemented)
- [x] Type definitions in `/types` — `JournalEntry` interface added to `types/game.ts`
- [x] Constants in `/constants` — Message constants already in `data/messageSystem.ts` (acceptable as data-specific constants)
- [x] Unidirectional dependencies: Presentation → State → Logic — Components call `useGameState()` hooks, context calls `messageSystem.ts` pure functions
- [x] Components don't directly import from `/data` — Components only import from `@/context/GameStateContext`
- [x] Pure functions in `/data` have no React dependencies — Verified: `messageSystem.ts` has no React imports

**GATE STATUS**: ✅ PASS — All constitutional requirements met. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-sic-message-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — Reanimated v3 patterns, FlatList optimization
├── data-model.md        # Phase 1 output — JournalEntry interface, state migration
├── quickstart.md        # Phase 1 output — Developer onboarding for message system
├── contracts/           # Phase 1 output — N/A (no external APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (React Native monorepo)

```text
app/
├── (tabs)/
│   ├── _layout.tsx           # ✏️ MODIFY: Add burger button to headerRight, mount ToastContainer here
│   ├── index.tsx             # Bureau screen (unchanged)
│   ├── recruitment.tsx       # Recrutement screen (unchanged)
│   ├── progression.tsx       # Progression screen (unchanged)
│   └── options.tsx           # Options screen (unchanged)
├── _layout.tsx               # Root layout (unchanged)
└── +not-found.tsx            # 404 screen (unchanged)

components/
├── Toast.tsx                  # ✏️ REFACTOR: Replace Animated API with react-native-reanimated v3 (useSharedValue, useAnimatedStyle, withSpring for bounce)
├── ToastContainer.tsx         # ✏️ MODIFY: Remove conditional mounting logic (now always mounted at tab layout level)
├── JournalDrawer.tsx          # 🆕 NEW: Full-height drawer from right with slide animation (reanimated), FlatList of entries, overlay dismiss
├── JournalEntry.tsx           # 🆕 NEW: Single journal entry item (type indicator, timestamp, text, redacted/revealed state)
├── [existing components]      # AdministrationCard.tsx, AgentItem.tsx, etc. (unchanged)

context/
└── GameStateContext.tsx       # ✏️ MODIFY: Add journal management methods (addJournalEntry, revealNarrativeHint), wire messageSystem triggers into game loop

data/
├── messageSystem.ts           # ✅ COMPLETE: Pure functions already implemented (no changes needed)
└── [existing data files]      # gameData.ts, conformiteLogic.ts (unchanged)

types/
└── game.ts                    # ✏️ MODIFY: Add JournalEntry interface, add journal: JournalEntry[] to GameState

utils/
├── stateMigration.ts          # ✏️ MODIFY: Add V2→V3 migration for journal field, bump CURRENT_VERSION to 3
├── dateFormatters.ts          # 🆕 NEW: French relative time formatting ("Il y a 2 minutes", "23 janv. à 14:30")
└── [existing utils]           # formatters.ts (unchanged)
```

**Structure Decision**: React Native + Expo mobile app (single monorepo). No backend/API. Components organized by presentation layer (components/), state management (context/), business logic (data/), and shared types (types/). Navigation via expo-router v5 file-based routing (app/ directory).

## Complexity Tracking

> **No violations to justify** — Constitution Check passed with all requirements met.

---

# Phase 0: Research & Clarification

**Status**: Ready to execute  
**Estimated Duration**: 30 minutes

## Research Tasks

### R1: React Native Reanimated v3 Animation Patterns
**Question**: What are the best practices for implementing drawer slide animations and micro-bounce effects with `react-native-reanimated` v3?

**Why needed**: Current `Toast.tsx` uses legacy Animated API. Need to refactor to reanimated v3 for better performance and to implement the micro-bounce "stamp" effect requested in spec clarification Q2.

**Scope**: 
- `useSharedValue` + `useAnimatedStyle` patterns for drawer slide from right
- `withSpring` configuration for micro-bounce effect (toast stamp animation)
- `withTiming` vs `withSpring` for different animation phases
- Gesture handler integration for drawer swipe-to-close (optional enhancement)

**Output**: Design decision in `research.md` documenting:
- Recommended reanimated v3 pattern for drawer (slide from right with overlay)
- Spring config values for "stamp" bounce effect (mass, damping, stiffness)
- Animation duration targets (drawer: ~300ms, toast: slide + bounce ~400ms total)

---

### R2: FlatList Virtualization & Performance Optimization
**Question**: How to optimize FlatList performance for 500+ journal entries with smooth 60fps scrolling on mid-range devices?

**Why needed**: Journal may contain up to 500 entries. Need to ensure smooth scrolling without memory bloat or frame drops.

**Scope**:
- `windowSize` configuration for virtualization (default: 21)
- `initialNumToRender` optimization (start small, expand as needed)
- `getItemLayout` for fixed-height entries (skip measurement phase)
- `removeClippedSubviews` on Android
- `maxToRenderPerBatch` tuning

**Output**: Design decision in `research.md` documenting:
- Recommended FlatList props configuration
- Item height strategy (fixed vs measured)
- Memory vs performance tradeoffs at 500 entries
- Fallback strategy if performance degrades (e.g., reduce max entries to 300)

---

### R3: French Relative Time Formatting
**Question**: What's the best approach for French relative time formatting in React Native ("Il y a 2 minutes", "Il y a 3 heures", "23 janv. à 14:30")?

**Why needed**: Journal timestamps must be in French with relative formatting for recent entries and absolute for older entries (LR-004).

**Scope**:
- Native Intl.RelativeTimeFormat support in React Native (check Hermes engine support)
- Fallback implementation if Intl API not available
- Threshold strategy (relative for < 24h, absolute for older)
- French month abbreviations ("janv.", "févr.", "mars", etc.)

**Output**: Design decision in `research.md` documenting:
- Chosen approach (Intl API or custom implementation)
- Time thresholds for relative vs absolute display
- Example formats for different time ranges
- Utility function signature: `formatTimestampFrench(timestamp: number): string`

---

### R4: GameState Migration Strategy (V2→V3)
**Question**: What's the safest migration pattern for adding `journal: JournalEntry[]` to existing V2 GameState without breaking existing saves?

**Why needed**: Existing players have V2 saves with `conformite` and `messageSystem` fields. Adding `journal` requires V2→V3 migration.

**Scope**:
- Migration function signature in `stateMigration.ts`
- Default value for `journal` field (empty array `[]`)
- Validation updates in `isValidGameState()`
- Rollback strategy if migration fails
- Testing approach (manually modify AsyncStorage to simulate V2 save)

**Output**: Design decision in `research.md` documenting:
- Migration function pseudocode (V2→V3)
- Validation rules for V3 state
- Edge case handling (corrupted journal data, invalid entry types)
- Manual testing steps to verify migration

---

## Clarification Tasks

**No clarifications needed** — All unknowns in Technical Context have been resolved through provided technical context. All spec ambiguities were addressed in spec clarification Q&A (Q1-Q5).

---

# Phase 1: Design & Contracts

**Status**: ✅ Complete  
**Prerequisites**: Phase 0 research complete

## Design Artifacts

### D1: Data Model (data-model.md) ✅
**Extract entities from spec and technical context:**

1. **JournalEntry** (new interface in `types/game.ts`)
   - `id: string` — Unique identifier (UUID or timestamp-based)
   - `type: 'sic' | 'non-conformity' | 'narrative-hint'` — Entry type for styling
   - `text: string` — Displayed message text (French)
   - `timestamp: number` — Creation time (Date.now())
   - `isRevealed?: boolean` — Only for narrative-hint type (default: false)
   - `revealedText?: string` — Full unredacted text (only for narrative-hint)
   - `targetId?: string` — Administration ID or system ID for narrative hints

2. **GameState extension** (modify `types/game.ts`)
   - Add `journal: JournalEntry[]` field (max 500 entries, FIFO rotation)
   - Bump `version: 3` for migration

3. **State Mutations** (extend `GameStateContext.tsx`)
   - `addJournalEntry(type, text, options?)` — Create and append entry
   - `revealNarrativeHint(targetId)` — Update isRevealed flag
   - `pruneJournal()` — Rotate entries if > 500

4. **Validation Rules**
   - Journal entries must have valid type ('sic' | 'non-conformity' | 'narrative-hint')
   - Timestamps must be positive numbers
   - Redacted text must use █ character blocks for narrative hints
   - Max 500 entries enforced on write (FR-025)

**Output**: `specs/001-sic-message-system/data-model.md` created with full entity definitions, state mutations, migration strategy, and relationships.

---

### D2: API Contracts (contracts/) ✅
**N/A** — No external APIs for this feature. All data local to GameState.

---

### D3: Component Interfaces (contracts/components.md) ✅
**Document component props and responsibilities:**

1. **JournalDrawer**
   ```typescript
   interface JournalDrawerProps {
     isOpen: boolean;
     onClose: () => void;
     entries: JournalEntry[];
   }
   ```
   - Responsibilities: Full-height drawer from right, slide animation, overlay dismiss
   - Uses: react-native-reanimated v3 (useSharedValue, useAnimatedStyle, withTiming)
   - Child: FlatList with JournalEntry items

2. **JournalEntry**
   ```typescript
   interface JournalEntryProps {
     entry: JournalEntry;
   }
   ```
   - Responsibilities: Display single entry (icon, timestamp, text)
   - Styling: Different colors for sic/non-conformity/narrative-hint
   - Accessibility: accessibilityLabel with type, time, and content

3. **Toast (refactored)**
   ```typescript
   interface ToastProps {
     toast: ToastMessage;
     onDismiss: (id: string) => void;
   }
   ```
   - Responsibilities: Display with slide-in + micro-bounce animation, auto-dismiss
   - Migration: Replace Animated API with reanimated v3 (useSharedValue, withSpring)
   - Accessibility: accessibilityLiveRegion="polite", non-interactive (no onPress)

4. **ToastContainer (modified)**
   - Mounted at tab layout level (not Bureau screen)
   - Max 3 toasts visible (enforced by context)
   - Stack with 10pt vertical offset

5. **BurgerMenuButton (new)**
   - Hamburger icon in headerRight
   - 44×44pt touch target (AR-001)
   - Toggles drawer state

**Output**: `specs/001-sic-message-system/contracts/components.md` created with detailed component contracts, performance requirements, testing contracts, and optimization guidelines.

---

### D4: Quickstart Guide (quickstart.md) ✅
**Developer onboarding documentation:**

- Architecture overview (game loop → milestone detection → toast + journal)
- Quick reference for key functions (getRandomSICMessage, calculateSICProbability, etc.)
- Common workflows (adding messages, creating hints, testing toasts)
- Troubleshooting guide (toasts not appearing, journal not persisting, etc.)
- Performance tips (memoization, getItemLayout, scroll throttling)

**Output**: `specs/001-sic-message-system/quickstart.md` created with comprehensive developer guide (13KB, ~15 min read).

---

### D5: Agent Context Update ✅
**Run agent context update scripts after Phase 1 design complete:**

```bash
.specify/scripts/bash/update-agent-context.sh copilot
```

**Technologies added:**
- TypeScript strict mode, React Native (Expo SDK 53)
- AsyncStorage for GameState persistence (5s debounced saves)
- Mobile (React Native + Expo) project type

**Output**: `.github/agents/copilot-instructions.md` updated with new context.

**Manual additions preserved:**
- Existing context about GameStateContext patterns
- Expo Router v5 navigation structure
- react-native-reanimated v3 animation patterns (from research.md)

---

# Constitution Re-Check (Post-Design)

**Status**: ✅ PASS — No new violations introduced during Phase 1 design.

All constitutional requirements remain satisfied:
- ✅ Performance targets met (60fps animations, 500 entries sustainable)
- ✅ Code quality maintained (pure functions, Context pattern, TypeScript strict)
- ✅ French language authenticity preserved (timestamps, messages, UI text)
- ✅ Accessibility requirements addressed (WCAG 2.1 AA, screen reader labels)
- ✅ Architectural separation enforced (components → context → data)

**GATE STATUS**: ✅ PROCEED TO PHASE 2 (Task Generation)

---

# Summary & Next Steps

## Deliverables Complete

✅ **Phase 0: Research** (research.md)
- Reanimated v3 animation patterns
- FlatList optimization strategies
- French timestamp formatting (Intl API)
- V2→V3 migration strategy

✅ **Phase 1: Design** (data-model.md, contracts/, quickstart.md)
- JournalEntry interface definition
- GameState V3 schema
- State mutation methods
- Component contracts (5 components)
- Developer onboarding guide
- Agent context updated

## Planning Complete — Implementation Ready

**Branch**: `001-sic-message-system`  
**Plan Document**: `specs/001-sic-message-system/plan.md`  
**Generated Artifacts**:
- `research.md` (11KB — design decisions from research)
- `data-model.md` (16KB — entity definitions, migrations, relationships)
- `contracts/components.md` (15KB — component interfaces, performance contracts)
- `quickstart.md` (13KB — developer guide)

**Total Planning Artifacts**: 55KB of documentation, 4 files

---

## Implementation Roadmap

**Next Command**: `/speckit.tasks` (generates tasks.md from plan + design artifacts)

**Expected Task Count**: ~20-25 tasks across 4 priorities (P1-P4)

**Estimated Implementation Time**: 
- P1 (Real-time toasts): 4-6 hours
- P2 (Non-conformity alerts): 1-2 hours
- P3 (Journal drawer): 6-8 hours
- P4 (Narrative hints): 3-4 hours
- **Total**: 14-20 hours for full feature

**Testing Strategy**: Manual testing on iOS/Android simulators (no automated tests required per spec)

**Deployment**: Merge to main after manual validation on both platforms

---

## Key Technical Decisions Locked In

1. **Animations**: react-native-reanimated v3 (NOT legacy Animated API)
   - Drawer: `withTiming` (300ms slide)
   - Toast: `withTiming` (200ms slide) + `withSpring` (200ms bounce, mass: 0.8, damping: 10, stiffness: 100)

2. **Performance**: FlatList virtualization with `getItemLayout`
   - Fixed 80pt entry height
   - `windowSize={10}`, `initialNumToRender={25}`
   - Target: 60fps scroll with 500 entries

3. **i18n**: Native `Intl.RelativeTimeFormat` for French timestamps
   - Relative for <24h ("Il y a 2 minutes")
   - Absolute for ≥24h ("23 janv. à 14:30")

4. **Migration**: V2→V3 adds `journal: []`, bumps version to 3
   - Validation ensures type safety
   - Graceful fallback on corrupted data

5. **State Management**: GameStateContext with new methods
   - `addJournalEntry(type, text, options?)`
   - `revealNarrativeHint(targetId)`
   - Game loop integration for milestone detection

**No further research or design needed** — All unknowns resolved, all contracts defined.

---

**Command Complete**: Implementation plan ready. Run `/speckit.tasks` to generate actionable task breakdown.
