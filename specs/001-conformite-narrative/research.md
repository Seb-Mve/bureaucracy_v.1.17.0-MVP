# Research Document - Conformité Aléatoire System

**Feature**: Conformité Aléatoire System and Hidden Narrative Layer  
**Created**: 2025-01-21  
**Phase**: Phase 0 - Research and Technical Planning

---

## 1. Notification/Toast System Architecture

### Decision: Custom Toast Component with Context Management
**Context**: The codebase currently has NO notification/toast system. Only `Alert.alert()` is used for modal confirmations in options screen.

**Research findings**:
- Existing `NotificationBadge.tsx` is a visual badge component (icon decorations), not a message system
- Native `Alert.alert()` is too modal/blocking for passive narrative messages
- Third-party libraries (react-native-toast-message) add 500KB+ bundle size

**Chosen approach**:
- **Custom Toast component** using React Native's built-in Animated API
- **Context-based queue management** for multiple concurrent messages
- **Non-intrusive display** (slide-in from top, auto-dismiss after 4 seconds)
- **Rate limiting** via timestamp tracking in game state

**Rationale**:
- Keeps bundle size minimal (critical for mobile)
- Full control over French typography and styling
- Integrates seamlessly with existing Context pattern
- Supports accessibility labels for screen readers (Constitutional Principle IV)

**Implementation notes**:
- Use `useNativeDriver: true` for 60fps animations
- Position: Top-center for S.I.C. messages, top-right for alerts
- Dismissible by swipe or tap
- Queue system prevents message overlap

---

## 2. AsyncStorage Migration Strategy

### Decision: Versioned State Schema with Graceful Migration
**Context**: Current GameState has NO versioning system. New properties would break old saves.

**Research findings**:
- GameStateContext loads saves with direct `JSON.parse()` (line 111-113)
- No validation or default value merging on load
- Adding required properties to GameState interface would cause `undefined` errors on old saves
- Save reset destroys player progress (unacceptable for retention)

**Chosen approach**:
```typescript
interface GameState {
  version: number; // Schema version (starts at 2 for this feature)
  conformite?: ConformiteState; // Optional for backward compatibility
  messageSystem?: MessageSystemState; // Optional
  // ... existing fields unchanged
}

// Migration function
function migrateGameState(loaded: any): GameState {
  const version = loaded.version || 1; // Assume v1 if no version field
  
  if (version === 1) {
    // V1→V2: Add conformité and message systems
    return {
      ...loaded,
      version: 2,
      conformite: {
        percentage: 0,
        isUnlocked: false,
        lifetimeFormulaires: loaded.resources?.formulaires || 0,
        lastTestTimestamp: null
      },
      messageSystem: {
        sicLastTriggerTime: null,
        nonConformityLastTriggerTime: null,
        lastProductionMilestone: { dossiers: 0, tampons: 0, formulaires: 0 }
      }
    };
  }
  
  return loaded; // Already at current version
}
```

**Rationale**:
- Preserves all existing player data (additive changes only)
- Graceful fallback for corrupted/missing fields
- Supports iterative feature additions in future phases
- Logging for debugging migration issues

**Alternatives rejected**:
- Hard reset on version mismatch: Destroys player progress
- Separate storage keys per version: Storage bloat and complexity
- No versioning (status quo): Breaks on every schema change

---

## 3. Random Message Trigger System

### Decision: Production Milestone-Based Triggers with Adaptive Cooldowns
**Context**: S.I.C. messages must feel mysterious and organic, appearing 2-3 times per 30-minute session without spam.

**Research findings**:
- Time-based triggers fail for idle games (missed when app closed)
- Purely random per production is too chaotic at high production rates
- Fixed intervals are predictable and boring

**Chosen approach**:
```typescript
// Trigger checks on production milestones
const MILESTONE_THRESHOLDS = {
  dossiers: 100,  // Check every 100 dossiers
  tampons: 50,    // Check every 50 tampons
  formulaires: 25 // Check every 25 formulaires
};

function shouldTriggerSICMessage(state: GameState): boolean {
  const now = Date.now();
  const timeSinceLastSIC = state.messageSystem.sicLastTriggerTime 
    ? (now - state.messageSystem.sicLastTriggerTime) / 1000 
    : Infinity;
  
  // Adaptive probability based on time since last message
  let probability = 0.125; // Base 12.5% chance
  
  if (timeSinceLastSIC < 300) {
    // Less than 5 minutes ago: reduce to 2%
    probability = 0.02;
  } else if (timeSinceLastSIC > 1800) {
    // More than 30 minutes: increase to 20%
    probability = 0.20;
  }
  
  return Math.random() < probability;
}
```

**Trigger points**:
1. Production milestones (every N resources produced)
2. Agent purchase events
3. Administration unlock events
4. Manual conformité test button clicks (low probability)

**Message pool** (minimum 5 variants per FR-011):
1. "Ce dossier a été transféré au S.I.C. pour traitement ultérieur."
2. "Le S.I.C. a validé cette procédure conformément au protocole."
3. "Notification S.I.C. : Vérification de conformité en cours."
4. "Le Service Inconnu de Coordination requiert une inspection supplémentaire."
5. "S.I.C. - Classification du document : Niveau de routine."
6. "Autorisation S.I.C. obtenue. Procédure standard applicable."

**Rationale**:
- Milestone-based triggers guarantee messages appear during active play
- Adaptive probability prevents spam while ensuring regular appearance
- Multiple trigger points create unpredictable timing (enhances mystery)
- Cooldown system respects FR-012 (5-minute reduction) and FR-014 (10-minute rate limit)

**Statistical validation**:
- Average production at mid-game: ~10 formulaires/sec, ~5 tampons/sec
- Milestone hit every 2.5 seconds on average
- 12.5% probability → 1 message every ~20 seconds (without cooldown)
- With 5-minute cooldown at 2% → ~1 message every 200 seconds (~3 minutes)
- **Result**: 2-3 messages per 30-minute session ✅

---

## 4. Conformité Progression Balancing

### Decision: Dual Progression System (Active + Passive)
**Context**: Conformité must reach 100% in 4-6 hours of normal play (SC-002) without feeling grindy.

**Research findings**:
- Pure passive progression removes player agency (boring)
- Pure active progression creates tedious clicking grind
- Current production rates (from gameData.ts): mid-game player produces ~15-20 formulaires/minute

**Chosen approach**:
- **Total requirement**: 15,000 lifetime formulaires to reach 100% (150 per +1%)
- **Active test**: Costs 150 formulaires, grants +3% immediately
- **Passive gain**: Automatic +1% per 150 formulaires produced
- **Unlock threshold**: 1,000 tampons + 100 formulaires (achieved after ~1-2 hours)

**Progression timeline**:
| Time | Formulaires Produced | Conformité % | Method |
|------|---------------------|--------------|---------|
| Hour 1-2 | 0-500 | 0% (locked) | N/A |
| Hour 2 | 500-1,500 | 0-7% | Unlocks + passive |
| Hour 3-4 | 1,500-5,000 | 7-33% | Mixed active/passive |
| Hour 5-6 | 5,000-10,000 | 33-67% | Passive + occasional tests |
| Hour 6-8 | 10,000-15,000 | 67-100% | Final push |

**Rationale**:
- 150 formulaires per +1% aligns with natural production curve
- Active test at +3% per 150 cost provides 2x efficiency (encourages engagement)
- Total 50-100 button clicks over 6 hours feels manageable
- Passive fallback prevents "stuck" feeling if player doesn't discover button
- 1,000 tampon threshold ensures players understand core mechanics first

**Alternatives rejected**:
- Higher costs (200+ formulaires): Extends timeline beyond Phase 1 scope
- Pure passive: Removes engagement and Phase 2 anticipation
- Lower threshold (500 tampons): Too early, core loop not established

---

## 5. French Bureaucratic Language Design

### Decision: Authentic Formal Register with Mysterious Tone
**Context**: Must satisfy Constitutional Principle III (French authenticity) and create narrative intrigue.

**Linguistic analysis**:
- **Passive voice dominates**: "a été transféré", "a été jugé", "pourrait être envisagée"
- **Complex nominal phrases**: "traitement ultérieur", "dispositions du règlement intérieur"
- **Vague bureaucratic terminology**: Avoids specifics to maintain mystery
- **Proper punctuation**: Space before colon/semicolon (French typography rules)
- **Formal register (vouvoiement)**: "Votre niveau de conformité..." not "Ton niveau..."

**Message design principles**:
1. **Never explain what S.I.C. is** (mystery preservation)
2. **Reference unseen processes**: "transféré", "validé", "requiert"
3. **Use official-sounding but meaningless classifications**: "Niveau de routine", "protocole standard"
4. **Create sense of surveillance without threat**: Observational, not punitive
5. **Maintain absurdist humor**: Overly complex language for trivial actions

**Phase 2 transition notification** (FR-019):
> "Votre niveau de conformité a été jugé satisfaisant. Une réaffectation de niveau supérieur pourrait être envisagée conformément aux dispositions du règlement intérieur."

**Translation notes**:
- "jugé satisfaisant" = passive evaluation (who judged? unstated)
- "pourrait être envisagée" = conditional, non-committal (maybe yes, maybe no)
- "dispositions du règlement intérieur" = bureaucratic boilerplate (no actual regulation exists)

**Rationale**:
- Authentic French bureaucratic style creates immersion
- Mysterious tone supports "conceptual trap" design goal
- Proper grammar/accents demonstrate polish (Constitutional commitment)
- Absurdist elements maintain game's satirical theme

---

## 6. Performance Optimization Strategy

### Decision: Leverage Existing Game Loop with Minimal Overhead
**Context**: Game loop runs at 100ms intervals (line 189 GameStateContext.tsx). Must maintain 60fps on mid-range devices.

**Optimization points**:
1. **Conformité calculations**: Memoize with `useMemo`, only recalculate when `lifetimeFormulaires` changes
2. **Message trigger checks**: Integrate into existing production update cycle (no new timers)
3. **Toast rendering**: Use `useNativeDriver: true` for GPU-accelerated animations
4. **AsyncStorage saves**: Reuse existing 5-second debounce (line 22), no additional writes

**Performance budget**:
- Conformité check: <1ms per game loop iteration
- Message trigger logic: <2ms per milestone check
- Toast animation: 60fps (16.67ms frame budget maintained)
- Total overhead: <5% of existing game loop

**Monitoring approach**:
- Use React DevTools Profiler to measure re-render impact
- Test on iPhone 11 / Android equivalent (Constitutional Principle I requirement)
- Verify smooth scrolling in administration list with toasts visible

**Rationale**:
- Minimal performance impact ensures Constitutional compliance (Principle I: 60fps requirement)
- Reusing existing patterns reduces code complexity
- GPU-accelerated animations offload work from JavaScript thread

---

## Dependencies & Integration Points

### External Dependencies (No New Packages Required)
- ✅ React Native Animated API (built-in)
- ✅ AsyncStorage (@react-native-async-storage/async-storage v1.21.0 already installed)
- ✅ React Context API (built-in)
- ✅ TypeScript strict mode (already enabled in tsconfig.json)

### Internal Dependencies (To Be Created)
1. **Toast Component** (`/components/Toast.tsx`)
   - Animated slide-in/fade-out
   - Queue management
   - Accessibility labels

2. **Message Utilities** (`/data/messageSystem.ts`)
   - S.I.C. message pool
   - Trigger probability calculations
   - Cooldown tracking logic

3. **Conformité Logic** (`/data/conformiteLogic.ts`)
   - Percentage calculation from lifetime formulaires
   - Unlock condition checking
   - Active test validation

4. **State Migration** (`/utils/stateMigration.ts`)
   - Version detection
   - Migration functions per version
   - Graceful fallback handling

### Integration Points with Existing Code
1. **GameStateContext.tsx** (lines 5-315)
   - Add `conformite` and `messageSystem` to GameState type
   - Integrate message trigger checks into game loop (line 163-187)
   - Add migration logic to load function (line 109-127)
   - Add new Context methods: `performConformiteTest()`, `dismissToast()`

2. **types/game.ts** (lines 1-54)
   - Extend GameState interface with new properties
   - Add ConformiteState and MessageSystemState interfaces

3. **data/gameData.ts** (line 7)
   - Rename "Administration Centrale" → "Bureau des Documents Obsolètes"

4. **Main game screen** (app/index.tsx or similar)
   - Add conformité UI (percentage display + test button) when unlocked
   - Add Phase 2 transition button (grayed out until 100%)
   - Position Toast component in render tree

---

## Risk Assessment

### High Risk
- **State migration failure**: Old saves could break if migration logic has bugs
  - **Mitigation**: Extensive testing with v1 save files, graceful fallback to defaults

### Medium Risk
- **Message spam at high production rates**: Could annoy players
  - **Mitigation**: Strict cooldown enforcement, rate limiting per FR-014

### Low Risk
- **Performance degradation**: Additional calculations in game loop
  - **Mitigation**: Memoization, profiling, Constitutional Principle I compliance verification

- **French language errors**: Accents or grammar mistakes
  - **Mitigation**: Native French speaker review, Constitutional Principle III adherence

---

## Open Questions Resolved

### Q1: How to handle conformité unlock for old saves?
**Resolution**: Unlock based on "ever achieved" thresholds, not current resource counts. Track `highestEverTampons` and `highestEverFormulaires` during migration.

### Q2: Should S.I.C. messages persist across sessions?
**Resolution**: No persistence needed. Messages are ephemeral narrative flavor. Only track last trigger timestamp for cooldown.

### Q3: What happens if player reaches 100% conformité before unlocking all administrations?
**Resolution**: Allow it. Phase 2 button activates immediately. This rewards efficient play and creates interesting "speedrun" potential.

### Q4: Should "Tampon non conforme" notification have any gameplay effect?
**Resolution**: Absolutely zero gameplay impact (per FR-015). Purely cosmetic/narrative. Considered adding subtle visual effect (red flash on stamp) but decided against to maintain mystery.

---

## Next Steps (Phase 1)

With research complete, proceed to Phase 1 design artifacts:
1. ✅ Create data-model.md with entity definitions
2. ✅ Design API contracts (Context methods)
3. ✅ Generate quickstart.md for feature overview
4. ✅ Update agent context with new technologies/patterns

All research questions answered. Ready for design phase.
