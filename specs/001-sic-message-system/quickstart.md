# Quickstart: Système de Messages S.I.C.

**Audience**: Developers onboarding to the S.I.C. message system codebase  
**Estimated Time**: 15 minutes  
**Prerequisites**: Familiarity with React Native, TypeScript, and Expo SDK 53

---

## Overview

The **S.I.C. (Service Inconnu de Coordination) message system** delivers atmospheric French bureaucratic notifications through two complementary features:

1. **Real-time toast notifications** — Ephemeral messages triggered by gameplay milestones (visible on all screens)
2. **Journal drawer** — Persistent chronological log accessible via burger menu (includes narrative hints)

**Key Files**:
- Business logic: `data/messageSystem.ts` (pure functions)
- State management: `context/GameStateContext.tsx` (React Context)
- UI components: `components/Toast.tsx`, `components/JournalDrawer.tsx`, `components/JournalEntry.tsx`
- Type definitions: `types/game.ts` (interfaces)
- Migration logic: `utils/stateMigration.ts` (V2→V3 schema upgrade)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Game Loop (100ms)                                  │
│  ↓                                                   │
│  Milestone Detection (hasCrossedMilestone)          │
│  ↓                                                   │
│  Probability Check (calculateSICProbability)        │
│  ↓                                                   │
│  Message Selection (getRandomSICMessage)            │
│  ↓                                                   │
│  ┌────────────────────┬─────────────────────────┐  │
│  │ Toast Display      │ Journal Entry           │  │
│  │ (ephemeral, 5s)    │ (persistent)            │  │
│  └────────────────────┴─────────────────────────┘  │
│                 ↓                                    │
│          AsyncStorage (5s debounce)                 │
└─────────────────────────────────────────────────────┘
```

**Data Flow**:
1. Production increases → milestone crossed (e.g., 100 dossiers)
2. Probability check → 12.5% base chance (modulated by cooldown/boost)
3. If triggered → toast shown + journal entry added
4. Journal persisted to AsyncStorage with GameState
5. User opens drawer → entries displayed in reverse chronological order

**Key Principle**: Business logic (`data/messageSystem.ts`) is **pure functions** with no React dependencies. UI components consume via `useGameState()` hook.

---

## Quick Reference: Key Functions

### `data/messageSystem.ts` (Pure Logic)

#### `getRandomSICMessage(): string`
Returns a random French bureaucratic message from the `SIC_MESSAGES` pool.

```typescript
const msg = getRandomSICMessage();
// → "Ce dossier a été transféré au S.I.C. pour traitement ultérieur."
```

---

#### `calculateSICProbability(sicLastTriggerTime: number | null): number`
Calculates trigger probability based on cooldown/boost logic:
- **Base**: 12.5% (no recent trigger)
- **Cooldown**: 2% (within 5 minutes)
- **Boost**: 20% (30+ minutes without trigger)

```typescript
const prob = calculateSICProbability(Date.now() - 60000); // 1 min ago
// → 0.02 (cooldown active)

const prob2 = calculateSICProbability(Date.now() - 2000000); // 33 min ago
// → 0.20 (boost active)
```

---

#### `shouldTriggerNonConformity(nonConformityLastTime: number | null): boolean`
Checks if rare "Tampon non conforme" alert should trigger:
- **Probability**: 0.2% (1 in 500)
- **Rate limit**: Max 1 per 10 minutes

```typescript
const shouldTrigger = shouldTriggerNonConformity(Date.now() - 700000); // 11 min ago
// → true/false (0.2% chance, rate limit passed)
```

---

#### `hasCrossedMilestone(currentValue, lastMilestone, threshold): boolean`
Detects if a production milestone has been crossed.

```typescript
hasCrossedMilestone(250, 150, 100); // → true (crossed 200 threshold)
hasCrossedMilestone(180, 150, 100); // → false (same bucket)
```

**Thresholds**:
- Dossiers: every **100** (`MILESTONE_DOSSIERS`)
- Tampons: every **50** (`MILESTONE_TAMPONS`)
- Formulaires: every **25** (`MILESTONE_FORMULAIRES`)

---

### `context/GameStateContext.tsx` (State Management)

#### `addJournalEntry(type, text, options?)`
Creates and persists a journal entry (max 500, FIFO rotation).

```typescript
const { addJournalEntry } = useGameState();

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

**Auto-rotation**: If journal exceeds 500 entries, oldest is removed.

---

#### `revealNarrativeHint(targetId)`
Updates a narrative hint entry to reveal its full text (called when unlock condition met).

```typescript
const { revealNarrativeHint } = useGameState();

// When player unlocks an administration
unlockAdministration('ministere-affaires-obscures');
revealNarrativeHint('ministere-affaires-obscares'); // Reveal corresponding hint
```

**Effect**: Updates `isRevealed: true` and replaces `text` with `revealedText`.

---

#### `showToast(message, type, duration?)`
Displays an ephemeral toast notification (max 3 active).

```typescript
const { showToast } = useGameState();

showToast('Ce dossier a été transféré au S.I.C. pour traitement ultérieur.', 'sic', 5000);
showToast('Tampon non conforme détecté. Analyse en cours.', 'non-conformity', 5000);
```

**Toast Types**:
- `'sic'` → Blue border, dark background
- `'non-conformity'` → Red border, dark reddish background
- `'phase2'` → Green border (future Phase 2 notifications)
- `'system'` → Gray border (generic system messages)

**Overflow**: If >3 toasts triggered simultaneously, extras are **silently dropped** (not queued).

---

### `utils/dateFormatters.ts` (French Time Formatting)

#### `formatTimestampFrench(timestamp: number): string`
Converts Unix timestamp to French relative/absolute format.

```typescript
const formatted = formatTimestampFrench(Date.now() - 120000); // 2 min ago
// → "Il y a 2 minutes"

const formatted2 = formatTimestampFrench(Date.now() - 86400000 * 2); // 2 days ago
// → "21 janv. à 14:30"
```

**Thresholds**:
- **< 60 seconds**: `"à l'instant"` or `"Il y a X secondes"`
- **< 60 minutes**: `"Il y a X minutes"`
- **< 24 hours**: `"Il y a X heures"`
- **≥ 24 hours**: `"DD mois. à HH:MM"` (absolute format)

**Implementation**: Uses native `Intl.RelativeTimeFormat` API (supported in Hermes).

---

## Common Workflows

### 1. Adding a New S.I.C. Message to the Pool

**File**: `data/messageSystem.ts`

```typescript
export const SIC_MESSAGES = [
  "Ce dossier a été transféré au S.I.C. pour traitement ultérieur.",
  "Le S.I.C. a validé cette procédure conformément au protocole.",
  // ... existing messages ...
  "VOTRE NEW MESSAGE HERE" // Add to end of array
];
```

**No other changes needed** — `getRandomSICMessage()` automatically includes it in random selection.

---

### 2. Creating a Narrative Hint on Administration Unlock

**File**: `context/GameStateContext.tsx` (in game loop or event handler)

```typescript
// Detect when administration becomes unlockable (resources sufficient)
const checkUnlockableAdministrations = () => {
  gameState.administrations.forEach(admin => {
    if (!admin.isUnlocked && canAfford(admin.unlockCost)) {
      // Check if hint already exists
      const hintExists = gameState.journal.some(
        entry => entry.type === 'narrative-hint' && entry.targetId === admin.id
      );
      
      if (!hintExists) {
        // Create redacted hint
        addJournalEntry('narrative-hint', `████ ████████ disponible : ${admin.name.replace(/./g, '█')}`, {
          revealedText: `Nouvelle administration disponible : ${admin.name}`,
          targetId: admin.id
        });
      }
    }
  });
};

// Call in game loop or on resource change
useEffect(() => {
  checkUnlockableAdministrations();
}, [gameState.resources]);
```

**Then**, when administration is actually purchased:

```typescript
const unlockAdministration = (administrationId: string): boolean => {
  // ... existing unlock logic ...
  
  // Reveal narrative hint
  revealNarrativeHint(administrationId);
  
  return true;
};
```

---

### 3. Testing Toast Display Manually

**Use React Native Debugger console:**

```javascript
// Access GameStateContext via component
// In browser console connected to app:

// Show S.I.C. toast
gameContext.showToast('Test message S.I.C.', 'sic', 5000);

// Show non-conformity toast
gameContext.showToast('Tampon non conforme détecté. Test.', 'non-conformity', 5000);

// Spam toasts to test max 3 limit
for (let i = 0; i < 10; i++) {
  gameContext.showToast(`Toast ${i}`, 'sic', 5000);
}
// → Only first 3 visible, rest dropped
```

---

### 4. Simulating V2→V3 Migration Locally

**Step 1**: Create a V2 save state manually

```javascript
// In React Native Debugger console
const v2State = {
  version: 2,
  resources: { dossiers: 1000, tampons: 500, formulaires: 200 },
  production: { dossiers: 10, tampons: 5, formulaires: 2 },
  administrations: [...], // Copy from current state
  activeAdministrationId: 'bureau',
  lastTimestamp: Date.now(),
  conformite: { /* ... */ },
  messageSystem: { /* ... */ }
  // Note: NO journal field
};

AsyncStorage.setItem('bureaucracy_game_state', JSON.stringify(v2State));
```

**Step 2**: Reload app → Check migration logs

```
[Migration] v2→v3: Adding journal system
```

**Step 3**: Verify migrated state

```javascript
// In console
const state = await AsyncStorage.getItem('bureaucracy_game_state');
const parsed = JSON.parse(state);
console.log(parsed.version); // → 3
console.log(parsed.journal);  // → []
```

---

### 5. Debugging Toast Animations

**File**: `components/Toast.tsx`

Adjust spring configuration for different bounce effects:

```typescript
// Subtle bounce (current)
scaleAnim.value = withSpring(1, {
  mass: 0.8,
  damping: 10,
  stiffness: 100
});

// More bouncy (playful)
scaleAnim.value = withSpring(1, {
  mass: 1.2,
  damping: 7,
  stiffness: 80
});

// No bounce (stiff)
scaleAnim.value = withSpring(1, {
  mass: 0.5,
  damping: 15,
  stiffness: 150
});
```

**Use React Native Performance Monitor** (Cmd+D on simulator → "Perf Monitor") to verify 60fps during animation.

---

## Troubleshooting

### Issue: Toasts not appearing

**Check**:
1. Is `ToastContainer` mounted at tab layout level? (`app/(tabs)/_layout.tsx`)
2. Is toast queue populated? (`console.log(gameContext.toastQueue)`)
3. Is `showToast()` being called? (Add console.log in `GameStateContext`)
4. Check z-index conflicts (ToastContainer should have `zIndex: 1000`)

**Common cause**: ToastContainer still mounted only on Bureau screen (old behavior) → Move to `_layout.tsx` as direct child.

---

### Issue: Journal entries not persisting

**Check**:
1. Is `journal` field present in `GameState` after V2→V3 migration? (`console.log(gameState.journal)`)
2. Is `addJournalEntry()` being called? (Add breakpoint in function)
3. Is AsyncStorage save debounce firing? (Check 5s save interval logs)
4. Is validation failing? (`isValidGameState()` may reject corrupted data)

**Common cause**: Migration didn't run (still V2 state) → Manually delete AsyncStorage and restart.

---

### Issue: Drawer not sliding smoothly

**Check**:
1. Is `react-native-reanimated` v3 installed? (`npx expo install react-native-reanimated`)
2. Is Reanimated babel plugin configured? (Check `babel.config.js`)
3. Are you using `useSharedValue` + `useAnimatedStyle`? (NOT legacy Animated API)
4. Check frame rate in Perf Monitor (should be 58-60fps)

**Common cause**: Legacy Animated API still in use → Refactor to reanimated v3 patterns.

---

### Issue: Journal shows wrong order (oldest first instead of newest)

**Check**: FlatList `data` prop should be sorted descending:

```typescript
<FlatList
  data={gameState.journal.sort((a, b) => b.timestamp - a.timestamp)} // Newest first
  ...
/>
```

**Don't mutate state directly** — copy array before sorting:

```typescript
data={[...gameState.journal].sort((a, b) => b.timestamp - a.timestamp)}
```

---

## Performance Tips

1. **Memoize JournalEntry component** to prevent unnecessary re-renders:
   ```typescript
   export const JournalEntry = React.memo(({ entry }) => { ... });
   ```

2. **Use `getItemLayout` for FlatList** (fixed 80pt height):
   ```typescript
   getItemLayout={(data, index) => ({
     length: 80,
     offset: 80 * index,
     index
   })}
   ```

3. **Debounce scroll events** if tracking scroll position:
   ```typescript
   scrollEventThrottle={16} // 60fps max
   ```

4. **Monitor memory usage** if journal approaches 500 entries:
   - Use React Native Debugger → Memory profiler
   - Check JS heap size (<50MB on iPhone 11 baseline)
   - If memory warnings, reduce max entries to 300

---

## Next Steps

- Read `data-model.md` for detailed entity definitions
- Review `research.md` for animation patterns and optimization strategies
- Explore existing components (`Toast.tsx`, `AgentItem.tsx`) for reanimated v3 examples
- Run app on simulator and test milestone triggers (cheat: manually increase resources in console)

---

**Questions?** Check the spec (`spec.md`) for functional requirements and user stories. For constitution compliance, see `.specify/memory/constitution.md`.
