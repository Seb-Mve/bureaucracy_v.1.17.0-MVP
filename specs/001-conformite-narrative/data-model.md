# Data Model - Conformité Aléatoire System

**Feature**: Conformité Aléatoire System and Hidden Narrative Layer  
**Created**: 2025-01-21  
**Phase**: Phase 1 - Design

---

## Entity Definitions

### 1. ConformiteState

Represents the player's progress in the mysterious "conformité aléatoire" system.

**Properties**:
```typescript
interface ConformiteState {
  /** Current conformité percentage (0-100, integer or float) */
  percentage: number;
  
  /** Whether the conformité system has been unlocked for display */
  isUnlocked: boolean;
  
  /** Total formulaires produced across lifetime (for passive progression tracking) */
  lifetimeFormulaires: number;
  
  /** Timestamp of last manual conformité test (for button debouncing) */
  lastTestTimestamp: number | null;
  
  /** Highest ever achieved tampons count (for unlock persistence) */
  highestEverTampons: number;
  
  /** Highest ever achieved formulaires count (for unlock persistence) */
  highestEverFormulaires: number;
}
```

**Initial State** (for new players):
```typescript
{
  percentage: 0,
  isUnlocked: false,
  lifetimeFormulaires: 0,
  lastTestTimestamp: null,
  highestEverTampons: 0,
  highestEverFormulaires: 0
}
```

**Relationships**:
- Unlocked by: `highestEverTampons >= 1000 AND highestEverFormulaires >= 100`
- Increased by: Manual test (costs 150 formulaires, grants +3%) OR passive progression (+1% per 150 lifetime formulaires)
- Caps at: 100% (hard limit)
- Enables: Phase 2 transition button when `percentage === 100`

**Validation Rules**:
- `percentage` must be in range [0, 100]
- `lifetimeFormulaires` must be >= 0 and monotonically increasing
- `isUnlocked` becomes true when thresholds met, never reverts to false
- `lastTestTimestamp` used for 500ms debounce on test button

**State Transitions**:
```
[NEW PLAYER] → percentage=0, isUnlocked=false
              ↓ (reach 1000 tampons + 100 formulaires)
[UNLOCKED]   → percentage=0, isUnlocked=true, UI visible
              ↓ (click test button OR passive progression)
[PROGRESSING] → percentage=1-99, isUnlocked=true
              ↓ (reach 15,000 lifetime formulaires)
[COMPLETE]   → percentage=100, Phase 2 button activates
```

**Persistence**: Stored in AsyncStorage as part of GameState.conformite, saved every 5 seconds with existing debounce.

---

### 2. MessageSystemState

Tracks cooldowns and timing for narrative message triggers (S.I.C. and non-conformity messages).

**Properties**:
```typescript
interface MessageSystemState {
  /** Timestamp of last S.I.C. message display (for cooldown calculation) */
  sicLastTriggerTime: number | null;
  
  /** Timestamp of last "Tampon non conforme" notification (for rate limiting) */
  nonConformityLastTriggerTime: number | null;
  
  /** Production milestone tracking (to detect threshold crossings) */
  lastProductionMilestone: {
    dossiers: number;
    tampons: number;
    formulaires: number;
  };
}
```

**Initial State**:
```typescript
{
  sicLastTriggerTime: null,
  nonConformityLastTriggerTime: null,
  lastProductionMilestone: { dossiers: 0, tampons: 0, formulaires: 0 }
}
```

**Relationships**:
- Triggered by: Production milestone crossings (every 100 dossiers, 50 tampons, 25 formulaires)
- Affects: S.I.C. message probability (reduced to 2% if within 5 minutes, increased to 20% if 30+ minutes)
- Rate limits: Non-conformity notifications to max 1 per 10 minutes

**Validation Rules**:
- Timestamps must be valid Date.now() values or null
- `lastProductionMilestone` values must be <= current lifetime production totals
- Cooldowns enforced by comparing (Date.now() - lastTriggerTime) / 1000

**State Transitions**:
```
[NO MESSAGES] → sicLastTriggerTime=null
                ↓ (production milestone hit + probability check passes)
[COOLDOWN]    → sicLastTriggerTime=now, probability reduced to 2%
                ↓ (5 minutes pass)
[READY]       → Base probability 12.5%
                ↓ (30+ minutes pass)
[BOOSTED]     → Increased probability 20% (encourages message appearance)
```

**Persistence**: Stored in AsyncStorage as part of GameState.messageSystem. Only timestamps persist, not active message queue.

---

### 3. ToastMessage

Ephemeral UI entity representing a displayed notification. NOT persisted to storage.

**Properties**:
```typescript
interface ToastMessage {
  /** Unique identifier for this message instance */
  id: string;
  
  /** Message text to display (French bureaucratic language) */
  text: string;
  
  /** Message type for styling/categorization */
  type: 'sic' | 'non-conformity' | 'phase2' | 'system';
  
  /** Auto-dismiss duration in milliseconds (default: 4000) */
  duration: number;
  
  /** Timestamp when message was created */
  timestamp: number;
}
```

**Lifecycle**:
1. Created when trigger conditions met (milestone + probability check)
2. Added to toast queue in Context
3. Displayed via Toast component (slide-in animation)
4. Auto-dismissed after `duration` ms (fade-out animation)
5. Removed from queue, no persistence

**Message Pool** (S.I.C. variants):
```typescript
const SIC_MESSAGES = [
  "Ce dossier a été transféré au S.I.C. pour traitement ultérieur.",
  "Le S.I.C. a validé cette procédure conformément au protocole.",
  "Notification S.I.C. : Vérification de conformité en cours.",
  "Le Service Inconnu de Coordination requiert une inspection supplémentaire.",
  "S.I.C. - Classification du document : Niveau de routine.",
  "Autorisation S.I.C. obtenue. Procédure standard applicable."
];
```

**Validation Rules**:
- `id` must be unique (use `Date.now() + Math.random()`)
- `text` must be non-empty string
- `duration` must be >= 1000ms
- Queue size capped at 3 messages max (prevent screen clutter)

---

### 4. Phase2TransitionButton

Virtual entity representing the state of the "Réaffectation différée" button. Not a separate state object, but derived properties.

**Derived Properties**:
```typescript
interface Phase2ButtonState {
  /** Button is visible (always true once conformité unlocked) */
  isVisible: boolean; // = conformite.isUnlocked
  
  /** Button is active/clickable (requires 100% conformité) */
  isActive: boolean; // = conformite.percentage >= 100
  
  /** Notification text to show on click */
  notificationText: string; // = "Votre niveau de conformité..."
}
```

**State Logic**:
- **Hidden**: When `conformite.isUnlocked === false` (before 1000 tampons + 100 formulaires)
- **Visible but Grayed Out**: When `conformite.isUnlocked === true && conformite.percentage < 100`
- **Active**: When `conformite.percentage >= 100`

**Interactions**:
- Click when grayed out → No action (or show tooltip "Conformité requise : 100%")
- Click when active → Display Phase 2 notification toast
- No resource cost, no state mutation (future Phase 2 implementation will handle actual transition)

**Validation Rules**:
- Button enabled state MUST match percentage exactly (no premature activation)
- Button must have minimum 44×44pt touch target (accessibility requirement AR-002)
- Grayed out state must maintain 3:1 contrast ratio (accessibility requirement AR-003)

---

## Extended GameState Interface

**Modified Type Definition** (types/game.ts):
```typescript
export interface GameState {
  /** Schema version for migration support */
  version: number; // NEW: Start at 2 for this feature
  
  // Existing properties (unchanged)
  resources: Resources;
  production: Production;
  administrations: Administration[];
  activeAdministrationId: string;
  lastTimestamp: number | null;
  
  // NEW: Conformité system state
  conformite?: ConformiteState; // Optional for backward compatibility
  
  // NEW: Message system state
  messageSystem?: MessageSystemState; // Optional for backward compatibility
}
```

**Migration Strategy**:
```typescript
// When loading from AsyncStorage, detect version and migrate
function loadGameState(storedJSON: string): GameState {
  const parsed = JSON.parse(storedJSON);
  const version = parsed.version || 1;
  
  if (version === 1) {
    // Migrate v1 → v2: Add conformité and message systems
    return {
      ...parsed,
      version: 2,
      conformite: {
        percentage: 0,
        isUnlocked: false,
        lifetimeFormulaires: parsed.resources?.formulaires || 0,
        lastTestTimestamp: null,
        highestEverTampons: parsed.resources?.tampons || 0,
        highestEverFormulaires: parsed.resources?.formulaires || 0
      },
      messageSystem: {
        sicLastTriggerTime: null,
        nonConformityLastTriggerTime: null,
        lastProductionMilestone: { dossiers: 0, tampons: 0, formulaires: 0 }
      }
    };
  }
  
  return parsed; // Already at version 2+
}
```

---

## Calculation Formulas

### Conformité Percentage Calculation
```typescript
function calculateConformitePercentage(lifetimeFormulaires: number): number {
  // +1% per 150 formulaires produced
  const percentage = Math.floor(lifetimeFormulaires / 150);
  
  // Cap at 100%
  return Math.min(percentage, 100);
}
```

### Conformité Unlock Check
```typescript
function shouldUnlockConformite(state: GameState): boolean {
  if (state.conformite?.isUnlocked) {
    return true; // Already unlocked, stay unlocked
  }
  
  // Check unlock thresholds
  return (
    state.conformite.highestEverTampons >= 1000 &&
    state.conformite.highestEverFormulaires >= 100
  );
}
```

### S.I.C. Message Probability
```typescript
function calculateSICProbability(state: GameState): number {
  const now = Date.now();
  const lastTrigger = state.messageSystem?.sicLastTriggerTime;
  
  if (!lastTrigger) {
    return 0.125; // Base 12.5% for first message
  }
  
  const timeSinceLastSeconds = (now - lastTrigger) / 1000;
  
  if (timeSinceLastSeconds < 300) {
    return 0.02; // 2% if within 5 minutes
  } else if (timeSinceLastSeconds > 1800) {
    return 0.20; // 20% if 30+ minutes
  } else {
    return 0.125; // Base 12.5%
  }
}
```

### Non-Conformity Trigger Check
```typescript
function shouldTriggerNonConformity(state: GameState): boolean {
  const now = Date.now();
  const lastTrigger = state.messageSystem?.nonConformityLastTriggerTime;
  
  // Rate limit: Max 1 per 10 minutes
  if (lastTrigger && (now - lastTrigger) < 600000) {
    return false;
  }
  
  // 0.2% probability (1 in 500)
  return Math.random() < 0.002;
}
```

### Manual Conformité Test Validation
```typescript
function canPerformConformiteTest(state: GameState): boolean {
  // Must be unlocked
  if (!state.conformite?.isUnlocked) {
    return false;
  }
  
  // Must have enough formulaires
  if (state.resources.formulaires < 150) {
    return false;
  }
  
  // Debounce: 500ms since last test
  const lastTest = state.conformite.lastTestTimestamp;
  if (lastTest && (Date.now() - lastTest) < 500) {
    return false;
  }
  
  // Already at 100%? (Optional: allow clicking anyway for flavor)
  // if (state.conformite.percentage >= 100) return false;
  
  return true;
}
```

---

## Data Flow Diagram

```
USER ACTION: Click "Réaliser un test de conformité"
       ↓
[Validation] canPerformConformiteTest() → Check formulaires ≥ 150, debounce
       ↓
[State Update] GameStateContext.performConformiteTest()
       ├─ Deduct 150 formulaires from resources
       ├─ Add +3% to conformite.percentage (cap at 100)
       ├─ Update conformite.lastTestTimestamp = Date.now()
       └─ Trigger AsyncStorage save (debounced)
       ↓
[UI Update] React re-renders conformité display with new percentage
       ↓
[Check Phase 2] If percentage === 100 → Activate "Réaffectation différée" button

═══════════════════════════════════════════════════════════════

GAME LOOP: Every 100ms (existing cycle)
       ↓
[Production Update] Calculate resources produced this tick
       ├─ Update resources.formulaires += production.formulaires * deltaTime
       └─ Update conformite.lifetimeFormulaires += formulaires_gained
       ↓
[Passive Conformité] Calculate percentage from lifetimeFormulaires
       └─ conformite.percentage = min(floor(lifetimeFormulaires / 150), 100)
       ↓
[Milestone Check] Has any resource crossed a milestone threshold?
       ├─ Dossiers: floor(total / 100) > floor(lastMilestone / 100)?
       ├─ Tampons: floor(total / 50) > floor(lastMilestone / 50)?
       └─ Formulaires: floor(total / 25) > floor(lastMilestone / 25)?
       ↓ (If yes to any)
[Trigger Check] calculateSICProbability() → Roll dice
       ↓ (If triggered)
[Create Message] Generate ToastMessage with random S.I.C. text
       ├─ Add to toast queue in Context
       ├─ Update messageSystem.sicLastTriggerTime = Date.now()
       └─ Toast component displays message (slide-in animation)
       ↓ (After 4 seconds)
[Dismiss] Remove from queue (fade-out animation)

═══════════════════════════════════════════════════════════════

SPECIAL TRIGGER: Tampon production event
       ↓
[Random Check] Roll 0.2% probability (1 in 500)
       ↓ (If triggered)
[Rate Limit Check] Last non-conformity > 10 minutes ago?
       ↓ (If yes)
[Create Notification] "Tampon non conforme détecté – Niveau 0"
       └─ Update messageSystem.nonConformityLastTriggerTime = Date.now()
```

---

## Component Hierarchy

```
App Root
└─ GameStateProvider (Context)
    ├─ [Game State]: conformite, messageSystem, resources, etc.
    ├─ [Toast Queue]: Array<ToastMessage>
    └─ [Methods]: performConformiteTest(), showToast(), dismissToast()
         ↓
    Main Game Screen
    ├─ ResourceBar (existing)
    ├─ ConformiteDisplay (NEW)
    │   ├─ Shows "Conformité aléatoire: X%" when unlocked
    │   └─ Button: "Réaliser un test de conformité" (costs 150 formulaires)
    ├─ Phase2TransitionButton (NEW)
    │   └─ "Réaffectation différée" (grayed until 100%)
    ├─ AdministrationList (existing)
    └─ ToastContainer (NEW)
        └─ Toast components (slide-in from top, auto-dismiss)
```

---

## Accessibility Considerations

Per Constitutional Principle IV, all entities must support accessible interactions:

### ConformiteState
- Percentage display: `accessibilityLabel="Conformité aléatoire : ${percentage} pourcent"`
- Button: `accessibilityLabel="Réaliser un test de conformité. Coûte cent cinquante formulaires."`
- Touch target: Minimum 44×44pt for button

### ToastMessage
- Screen reader support: `accessibilityLiveRegion="polite"` (announces new messages)
- S.I.C. messages: `accessibilityLabel="Notification S.I.C. : ${text}"`
- Non-conformity: `accessibilityLabel="Tampon non conforme détecté. Niveau zéro. Notification informative uniquement."`
- Dismissible by tap (not just auto-dismiss)

### Phase2TransitionButton
- Active state: `accessibilityLabel="Réaffectation différée. Conformité complète. Appuyez pour continuer."`
- Grayed state: `accessibilityLabel="Réaffectation différée. Conformité requise : cent pourcent. Actuellement à ${percentage} pourcent."`
- `accessibilityHint="Ce bouton deviendra actif lorsque vous atteindrez cent pourcent de conformité."`

---

## Localization Requirements

Per Constitutional Principle III, all text must be authentic French:

### Conformité Display
- "Conformité aléatoire : 45%" (space before colon, space before %)
- "Réaliser un test de conformité" (infinitive form, formal register)

### Button States
- Grayed tooltip: "Conformité requise : 100%"
- Active tooltip: "Cliquez pour envisager une réaffectation"

### Notifications
- S.I.C. messages: See research.md for 6 variants
- Phase 2: "Votre niveau de conformité a été jugé satisfaisant..."
- Non-conformity: "Tampon non conforme détecté – Niveau 0"

### Number Formatting
- Percentage: No space before % symbol (French convention)
- Large numbers: Use French formatting via existing `formatNumberFrench()` utility

---

## Testing Scenarios

### Entity State Tests
1. **ConformiteState initialization**: Verify default values correct for new player
2. **ConformiteState unlock**: Verify `isUnlocked` becomes true at exactly 1000 tampons + 100 formulaires
3. **ConformiteState progression**: Verify percentage increments correctly at 150 formulaires intervals
4. **ConformiteState cap**: Verify percentage never exceeds 100%
5. **MessageSystemState cooldown**: Verify S.I.C. probability reduces to 2% within 5 minutes
6. **MessageSystemState boost**: Verify S.I.C. probability increases to 20% after 30 minutes

### Calculation Tests
1. **Passive conformité**: lifetimeFormulaires=450 → percentage=3%
2. **Active test**: 150 formulaires deducted, percentage increases by exactly +3%
3. **Milestone detection**: Production crossing 100 dossiers threshold triggers check
4. **Probability roll**: Verify S.I.C. message appears ~12.5% of milestone crossings over 1000 trials

### Integration Tests
1. **Migration**: Load v1 save file, verify conformité initialized with correct defaults
2. **Persistence**: Reach 50% conformité, close app, reopen → verify 50% restored
3. **UI state**: Reach 100% conformité, verify Phase 2 button activates within 1 second

---

## Summary

This data model defines 4 core entities:
1. **ConformiteState**: Tracks player's mysterious compliance percentage
2. **MessageSystemState**: Manages narrative message timing and cooldowns
3. **ToastMessage**: Ephemeral UI notifications (not persisted)
4. **Phase2TransitionButton**: Derived state for Phase 2 gate

All entities integrate into existing GameState via optional properties (backward compatible). Calculations are pure functions, state updates follow existing patterns, and accessibility/localization requirements are embedded in design.

Ready for Phase 2: Implementation planning.
