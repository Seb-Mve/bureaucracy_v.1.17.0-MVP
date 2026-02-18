# Data Model: Système de Messages S.I.C.

**Phase**: Phase 1 Design  
**Date**: 2025-01-23  
**Status**: Complete  

---

## Entities

### 1. JournalEntry (new interface)

**Location**: `types/game.ts`

**Definition**:
```typescript
export interface JournalEntry {
  /** Unique identifier (timestamp-based: `${Date.now()}_${Math.random()}`) */
  id: string;
  
  /** Entry type for styling and categorization */
  type: 'sic' | 'non-conformity' | 'narrative-hint';
  
  /** Displayed message text (French bureaucratic language) */
  text: string;
  
  /** Creation timestamp (Date.now()) */
  timestamp: number;
  
  /** Whether narrative hint is revealed (only for type='narrative-hint') */
  isRevealed?: boolean;
  
  /** Full unredacted text (only for type='narrative-hint') */
  revealedText?: string;
  
  /** Target administration/system ID for narrative hints (e.g., 'ministere-affaires-obscures', 'conformite') */
  targetId?: string;
}
```

**Field Descriptions**:
- `id`: Unique identifier combining timestamp and random value to prevent collisions. Format: `"1706024400123_0.123456789"`
- `type`:
  - `'sic'`: Normal S.I.C. message triggered by milestone (blue border in UI)
  - `'non-conformity'`: Rare "Tampon non conforme détecté" alert (red border in UI)
  - `'narrative-hint'`: Unlockable hint about future content (gold/purple border in UI)
- `text`: The message displayed to the user. For `narrative-hint` type, this is the redacted version with `█` blocks (e.g., `"████ ████████ disponible : ███████ ███ ███████ ████████"`)
- `timestamp`: Unix timestamp in milliseconds. Used for sorting (newest first) and French relative time formatting
- `isRevealed`: Boolean flag indicating if a narrative hint has been unlocked. Default `false` on creation, set to `true` when unlock condition met (e.g., administration purchased). Only present when `type='narrative-hint'`
- `revealedText`: The full unredacted message text shown after unlock. Example: `"Nouvelle administration disponible : Ministère des Affaires Obscures"`. Only present when `type='narrative-hint'`
- `targetId`: References the unlock target. Examples: `'ministere-affaires-obscures'` (administration ID), `'conformite'` (system ID). Used to match unlock events to journal entries. Only present when `type='narrative-hint'`

**Validation Rules**:
- `id` must be unique within the journal array
- `type` must be one of the three allowed values
- `text` must be non-empty string (min 10 characters to prevent garbage data)
- `timestamp` must be positive number (> 0)
- For `type='narrative-hint'`:
  - `revealedText` must be present (even if not yet revealed to user)
  - `targetId` must be present and match an administration ID or system ID
  - `text` should contain `█` characters for redaction effect
- For `type='sic'` or `type='non-conformity'`:
  - `isRevealed`, `revealedText`, `targetId` should be undefined

**Storage Constraints**:
- Max 500 entries in `GameState.journal` array (enforced by FIFO rotation in `GameStateContext`)
- Oldest entries pruned when count exceeds 500 (see `pruneJournal()` method below)
- Persisted to AsyncStorage as part of GameState (debounced 5s save interval)

**Example Instances**:
```typescript
// S.I.C. message (triggered by 100 dossiers milestone)
{
  id: "1706024400123_0.456",
  type: "sic",
  text: "Ce dossier a été transféré au S.I.C. pour traitement ultérieur.",
  timestamp: 1706024400123
}

// Non-conformity alert (rare 0.2% trigger)
{
  id: "1706025000789_0.789",
  type: "non-conformity",
  text: "Tampon non conforme détecté. Analyse en cours.",
  timestamp: 1706025000789
}

// Narrative hint (unrevealed)
{
  id: "1706026000456_0.321",
  type: "narrative-hint",
  text: "████ ████████ disponible : ███████ ███ ███████ ████████",
  timestamp: 1706026000456,
  isRevealed: false,
  revealedText: "Nouvelle administration disponible : Ministère des Affaires Obscures",
  targetId: "ministere-affaires-obscures"
}

// Narrative hint (revealed)
{
  id: "1706026000456_0.321",
  type: "narrative-hint",
  text: "Nouvelle administration disponible : Ministère des Affaires Obscures", // Updated after reveal
  timestamp: 1706026000456,
  isRevealed: true,
  revealedText: "Nouvelle administration disponible : Ministère des Affaires Obscures",
  targetId: "ministere-affaires-obscures"
}
```

---

### 2. GameState Extension (modified interface)

**Location**: `types/game.ts`

**Change**: Add `journal` field and bump `version` to 3

```typescript
export interface GameState {
  /** Schema version (bumped to 3 for journal system) */
  version: number;  // Now: 3 (was: 2)
  
  resources: Resources;
  production: Production;
  administrations: Administration[];
  activeAdministrationId: string;
  lastTimestamp: number | null;
  
  /** Conformité system state (V2 addition) */
  conformite?: ConformiteState;
  
  /** Message system state (V2 addition) */
  messageSystem?: MessageSystemState;
  
  /** Journal entries (V3 addition - NEW) */
  journal: JournalEntry[];  // Max 500 entries, FIFO rotation
}
```

**Default Value**: `journal: []` (empty array) for new games and V2→V3 migration

**Migration Impact**: See `stateMigration.ts` changes below

---

## State Mutations (GameStateContext)

### New Methods

#### `addJournalEntry(type, text, options?)`

**Signature**:
```typescript
addJournalEntry: (
  type: JournalEntry['type'],
  text: string,
  options?: {
    revealedText?: string;
    targetId?: string;
  }
) => void
```

**Purpose**: Create and append a new journal entry, enforce 500-entry limit via rotation

**Implementation Pseudocode**:
```typescript
const addJournalEntry = useCallback((type, text, options = {}) => {
  const newEntry: JournalEntry = {
    id: `${Date.now()}_${Math.random()}`,
    type,
    text,
    timestamp: Date.now(),
    ...(type === 'narrative-hint' ? {
      isRevealed: false,
      revealedText: options.revealedText,
      targetId: options.targetId
    } : {})
  };
  
  setGameState(prevState => ({
    ...prevState,
    journal: [newEntry, ...prevState.journal].slice(0, 500) // Prepend, keep max 500
  }));
}, []);
```

**Usage Examples**:
```typescript
// Add S.I.C. message
addJournalEntry('sic', 'Ce dossier a été transféré au S.I.C. pour traitement ultérieur.');

// Add non-conformity alert
addJournalEntry('non-conformity', 'Tampon non conforme détecté. Analyse en cours.');

// Add unrevealed narrative hint
addJournalEntry('narrative-hint', '████ ████████ disponible : ███████ ███ ███████ ████████', {
  revealedText: 'Nouvelle administration disponible : Ministère des Affaires Obscures',
  targetId: 'ministere-affaires-obscures'
});
```

**Side Effects**:
- Triggers AsyncStorage save (debounced 5s interval)
- If journal exceeds 500 entries, oldest entry is silently removed (FIFO rotation)

**Validation**: None (internal method, called from trusted game loop code)

---

#### `revealNarrativeHint(targetId)`

**Signature**:
```typescript
revealNarrativeHint: (targetId: string) => void
```

**Purpose**: Find and reveal a narrative hint entry by its targetId (called when unlock condition met)

**Implementation Pseudocode**:
```typescript
const revealNarrativeHint = useCallback((targetId: string) => {
  setGameState(prevState => ({
    ...prevState,
    journal: prevState.journal.map(entry => {
      if (entry.type === 'narrative-hint' && entry.targetId === targetId && !entry.isRevealed) {
        return {
          ...entry,
          isRevealed: true,
          text: entry.revealedText || entry.text // Replace redacted text with revealed
        };
      }
      return entry;
    })
  }));
}, []);
```

**Usage Example**:
```typescript
// When player unlocks "Ministère des Affaires Obscures"
unlockAdministration('ministere-affaires-obscures');
revealNarrativeHint('ministere-affaires-obscures'); // Reveal corresponding hint
```

**Side Effects**:
- Updates journal entry in-place (mutation via map)
- Triggers AsyncStorage save (debounced 5s interval)

**Edge Cases**:
- If no entry found with matching `targetId` → no-op (silent)
- If entry already revealed → no-op (idempotent)
- If multiple entries match (shouldn't happen) → reveals all matches

---

### Modified Methods

#### Game Loop Integration (in `updateGameState` effect)

**Change**: Add milestone detection and trigger logic

**Pseudocode**:
```typescript
useEffect(() => {
  const updateGameState = () => {
    // ... existing production calculation ...
    
    // NEW: Check for milestone crossings
    if (gameState.messageSystem) {
      const { lastProductionMilestone } = gameState.messageSystem;
      
      // Check dossiers milestone (every 100)
      if (hasCrossedMilestone(newResources.dossiers, lastProductionMilestone.dossiers, MILESTONE_DOSSIERS)) {
        checkAndTriggerMessages(newResources);
        
        // Update last milestone
        pendingUpdatesRef.current.messageSystem = {
          ...gameState.messageSystem,
          lastProductionMilestone: {
            ...lastProductionMilestone,
            dossiers: newResources.dossiers
          }
        };
      }
      
      // Repeat for tampons (every 50) and formulaires (every 25)
      // ...
    }
    
    // ... rest of game loop ...
  };
}, [gameState]);

function checkAndTriggerMessages(resources: Resources) {
  // Check non-conformity first (rarer, higher priority)
  if (shouldTriggerNonConformity(gameState.messageSystem?.nonConformityLastTriggerTime || null)) {
    showToast('Tampon non conforme détecté. Analyse en cours.', 'non-conformity', 5000);
    addJournalEntry('non-conformity', 'Tampon non conforme détecté. Analyse en cours.');
    
    // Update last trigger time
    pendingUpdatesRef.current.messageSystem = {
      ...gameState.messageSystem,
      nonConformityLastTriggerTime: Date.now()
    };
    return; // Don't also trigger S.I.C. message
  }
  
  // Check S.I.C. message probability
  const probability = calculateSICProbability(gameState.messageSystem?.sicLastTriggerTime || null);
  if (Math.random() < probability) {
    const message = getRandomSICMessage();
    showToast(message, 'sic', 5000);
    addJournalEntry('sic', message);
    
    // Update last trigger time
    pendingUpdatesRef.current.messageSystem = {
      ...gameState.messageSystem,
      sicLastTriggerTime: Date.now()
    };
  }
}
```

**Integration Points**:
- Called inside existing game loop (100ms interval)
- Uses existing `hasCrossedMilestone()` from `data/messageSystem.ts`
- Uses existing `shouldTriggerNonConformity()` and `calculateSICProbability()` functions
- Triggers both toast (ephemeral) and journal entry (persistent)

---

## State Migration (V2→V3)

**Location**: `utils/stateMigration.ts`

**Changes**:

1. **Add V2→V3 migration case**:
```typescript
export function migrateGameState(loaded: unknown): GameState {
  const s = loaded as Record<string, unknown>;
  const version = (s.version as number | undefined) || 1;
  
  // V2 → V3 Migration: Add journal field
  if (version === 2) {
    console.log('[Migration] v2→v3: Adding journal system');
    return {
      ...s,
      version: 3,
      journal: [] // Empty journal for existing V2 saves
    } as GameState;
  }
  
  // V1 → V2 migration (existing logic)
  if (version === 1) {
    const migratedV2 = {
      ...s,
      version: 3, // Bump directly to V3
      conformite: { /* existing defaults */ },
      messageSystem: { /* existing defaults */ },
      journal: [] // Also add journal for V1→V3 direct migration
    };
    return migratedV2 as GameState;
  }
  
  // Already V3+
  if (version >= 3) {
    return s as GameState;
  }
  
  // Unknown version
  console.warn(`[Migration] Unknown version ${version}, attempting to load as-is`);
  return s as GameState;
}
```

2. **Update validation for V3**:
```typescript
export function isValidGameState(state: unknown): boolean {
  const s = state as Record<string, unknown>;
  
  // ... existing checks (version, resources, production, administrations) ...
  
  // V3-specific: Validate journal field
  if ((s.version as number) >= 3) {
    const journal = s.journal as unknown[];
    
    // Journal must be an array (can be empty)
    if (!Array.isArray(journal)) {
      console.error('[Validation] journal field is not an array');
      return false;
    }
    
    // Validate each entry
    for (const entry of journal) {
      const e = entry as Record<string, unknown>;
      
      // Required fields
      if (!e.id || !e.type || !e.text || typeof e.timestamp !== 'number') {
        console.error('[Validation] Invalid journal entry (missing required fields)');
        return false;
      }
      
      // Type must be valid
      if (!['sic', 'non-conformity', 'narrative-hint'].includes(e.type as string)) {
        console.error('[Validation] Invalid journal entry type:', e.type);
        return false;
      }
      
      // Narrative hints require additional fields
      if (e.type === 'narrative-hint') {
        if (typeof e.isRevealed !== 'boolean' || !e.revealedText || !e.targetId) {
          console.error('[Validation] Narrative hint missing required fields');
          return false;
        }
      }
    }
  }
  
  return true;
}
```

3. **Update `CURRENT_VERSION` constant**:
```typescript
const CURRENT_VERSION = 3; // Was: 2
```

**Edge Case Handling**:
- **Corrupted journal** (invalid entry structure) → Validation fails → Fallback to `initialGameState` (logged error)
- **Journal >500 entries on load** → Migration trims to newest 500: `journal: (s.journal as JournalEntry[]).slice(0, 500)`
- **V1→V3 direct migration** → Add all V2 fields (`conformite`, `messageSystem`) + V3 field (`journal`)

---

## Relationships

```
GameState (root)
  ├── journal: JournalEntry[]
  │   ├── [0] JournalEntry (newest)
  │   ├── [1] JournalEntry
  │   └── [499] JournalEntry (oldest, pruned when [500] added)
  │
  ├── messageSystem: MessageSystemState
  │   ├── sicLastTriggerTime (tracks cooldown for probability calculation)
  │   ├── nonConformityLastTriggerTime (tracks rate limiting)
  │   └── lastProductionMilestone (triggers milestone detection in game loop)
  │
  └── administrations: Administration[]
      ├── [0] Bureau (always unlocked)
      ├── [1] Ministère Affaires Obscures (targetId for narrative hint)
      └── [4] Agence Redondance (targetId for narrative hint)
```

**Data Flow**:
1. Game loop detects milestone crossing → `hasCrossedMilestone()`
2. Probability check passes → `calculateSICProbability()` or `shouldTriggerNonConformity()`
3. Message selected → `getRandomSICMessage()`
4. Toast displayed → `showToast(message, type, 5000)`
5. Journal entry created → `addJournalEntry(type, message)`
6. State persisted → AsyncStorage (5s debounce)
7. User opens drawer → Journal entries sorted by `timestamp` (newest first)
8. User unlocks administration → `revealNarrativeHint(targetId)` updates journal entry

---

## Constants

**Location**: `data/messageSystem.ts` (already defined)

```typescript
// Milestone thresholds
export const MILESTONE_DOSSIERS = 100;
export const MILESTONE_TAMPONS = 50;
export const MILESTONE_FORMULAIRES = 25;

// Probability constants
const BASE_PROBABILITY = 0.125;       // 12.5% base chance
const COOLDOWN_PROBABILITY = 0.02;    // 2% if within 5 minutes
const BOOSTED_PROBABILITY = 0.20;     // 20% if 30+ minutes
const COOLDOWN_THRESHOLD_SECONDS = 300;  // 5 minutes
const BOOST_THRESHOLD_SECONDS = 1800;    // 30 minutes

// Non-conformity constants
const NON_CONFORMITY_PROBABILITY = 0.002; // 0.2% (1 in 500)
const NON_CONFORMITY_RATE_LIMIT_MS = 600000; // 10 minutes
```

**Location**: `components/JournalDrawer.tsx` (new constants)

```typescript
// Journal UI constants
const JOURNAL_WIDTH = 320;           // Drawer width in pixels
const ENTRY_HEIGHT = 80;             // Fixed height per journal entry (for getItemLayout)
const MAX_JOURNAL_ENTRIES = 500;     // Max entries before rotation
const DRAWER_ANIMATION_DURATION = 300; // Slide animation duration (ms)
```

---

## Summary

**New Entities**: 1 (`JournalEntry`)  
**Modified Entities**: 1 (`GameState` — added `journal` field)  
**New State Mutations**: 2 (`addJournalEntry`, `revealNarrativeHint`)  
**Modified State Mutations**: 1 (game loop integration for milestone detection)  
**Migration**: V2→V3 (adds `journal: []`, bumps version to 3)  
**Storage Impact**: ~10KB per 100 journal entries (5KB at 50 entries typical)

**Proceed to**: Contracts (component interfaces), Quickstart documentation
