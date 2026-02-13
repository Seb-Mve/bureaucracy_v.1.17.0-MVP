# API Contract - GameStateContext Extensions

**Feature**: Conformité Aléatoire System  
**Interface**: GameStateContext (React Context API)  
**Created**: 2025-01-21

---

## Overview

This document defines the new methods and state properties added to the existing `GameStateContext` to support the Conformité Aléatoire System and narrative message features.

---

## Extended Context Interface

```typescript
interface GameContextType {
  // ═══════════════════════════════════════════════════════════
  // EXISTING METHODS (unchanged)
  // ═══════════════════════════════════════════════════════════
  gameState: GameState;
  incrementResource: (resource: ResourceType, amount: number) => void;
  purchaseAgent: (administrationId: string, agentId: string) => boolean;
  unlockAdministration: (administrationId: string) => boolean;
  setActiveAdministration: (administrationId: string) => void;
  formatNumber: (value: number) => string;
  canPurchaseAgent: (administrationId: string, agentId: string) => boolean;
  canUnlockAdministration: (administrationId: string) => boolean;

  // ═══════════════════════════════════════════════════════════
  // NEW METHODS - Conformité System
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Performs a manual conformité test (costs 150 formulaires, grants +3%).
   * 
   * @returns true if test was performed successfully, false if insufficient resources or debounce active
   * 
   * @example
   * const handleTestClick = () => {
   *   const success = performConformiteTest();
   *   if (!success) {
   *     // Show error toast: "Formulaires insuffisants"
   *   }
   * };
   */
  performConformiteTest: () => boolean;

  /**
   * Checks if the conformité system should be visible in UI.
   * 
   * @returns true if player has reached 1000 tampons + 100 formulaires thresholds
   * 
   * @example
   * {isConformiteUnlocked() && <ConformiteDisplay />}
   */
  isConformiteUnlocked: () => boolean;

  /**
   * Checks if the Phase 2 transition button should be active.
   * 
   * @returns true if conformité percentage >= 100
   * 
   * @example
   * <Button 
   *   disabled={!isPhase2ButtonActive()} 
   *   onPress={handlePhase2Transition}
   * />
   */
  isPhase2ButtonActive: () => boolean;

  // ═══════════════════════════════════════════════════════════
  // NEW METHODS - Message System
  // ═══════════════════════════════════════════════════════════

  /**
   * Displays a toast notification to the player.
   * 
   * @param message - Message text to display
   * @param type - Message type for styling ('sic' | 'non-conformity' | 'phase2' | 'system')
   * @param duration - Auto-dismiss duration in ms (default: 4000)
   * 
   * @example
   * showToast("Ce dossier a été transféré au S.I.C.", "sic");
   * 
   * @example
   * showToast("Tampon non conforme détecté – Niveau 0", "non-conformity", 5000);
   */
  showToast: (
    message: string, 
    type: 'sic' | 'non-conformity' | 'phase2' | 'system',
    duration?: number
  ) => void;

  /**
   * Manually dismisses a toast message by ID.
   * 
   * @param toastId - Unique ID of the toast to dismiss
   * 
   * @example
   * dismissToast(message.id);
   */
  dismissToast: (toastId: string) => void;

  /**
   * Returns the current toast queue for rendering.
   * 
   * @returns Array of active toast messages (max 3)
   * 
   * @example
   * const toasts = getActiveToasts();
   * return <ToastContainer toasts={toasts} />;
   */
  getActiveToasts: () => ToastMessage[];
}
```

---

## Method Specifications

### performConformiteTest()

**Purpose**: Execute a manual conformité test, deducting resources and increasing percentage.

**Preconditions**:
- Conformité system must be unlocked (`gameState.conformite.isUnlocked === true`)
- Player must have >= 150 formulaires
- At least 500ms since last test (debounce)

**Postconditions**:
- 150 formulaires deducted from `gameState.resources.formulaires`
- +3% added to `gameState.conformite.percentage` (capped at 100)
- `gameState.conformite.lastTestTimestamp` updated to `Date.now()`
- State persisted to AsyncStorage (via existing 5s debounce)

**Return Value**:
- `true`: Test performed successfully
- `false`: Validation failed (insufficient resources, debounce, or locked)

**Error Handling**:
- Does NOT throw exceptions
- Returns `false` on any validation failure
- Caller responsible for showing error feedback to user

**Performance**:
- Target: <100ms execution time
- Uses optimistic update pattern (immediate UI response)

**Example Implementation**:
```typescript
const performConformiteTest = useCallback((): boolean => {
  // Validation
  if (!gameState.conformite?.isUnlocked) return false;
  if (gameState.resources.formulaires < 150) return false;
  
  const now = Date.now();
  const lastTest = gameState.conformite.lastTestTimestamp;
  if (lastTest && (now - lastTest) < 500) return false;
  
  // State update (atomic)
  setGameState(prevState => {
    const newPercentage = Math.min(
      (prevState.conformite?.percentage || 0) + 3,
      100
    );
    
    return {
      ...prevState,
      resources: {
        ...prevState.resources,
        formulaires: prevState.resources.formulaires - 150
      },
      conformite: {
        ...prevState.conformite!,
        percentage: newPercentage,
        lastTestTimestamp: now
      }
    };
  });
  
  return true;
}, [gameState]);
```

---

### isConformiteUnlocked()

**Purpose**: Check if conformité system should be visible to player.

**Logic**:
```typescript
return (
  gameState.conformite?.isUnlocked === true ||
  (
    gameState.conformite?.highestEverTampons >= 1000 &&
    gameState.conformite?.highestEverFormulaires >= 100
  )
);
```

**Caching**: Memoized with `useMemo` to prevent unnecessary recalculations.

**Usage**: Guards rendering of conformité UI elements.

---

### isPhase2ButtonActive()

**Purpose**: Check if "Réaffectation différée" button should be clickable.

**Logic**:
```typescript
return (
  gameState.conformite?.isUnlocked === true &&
  gameState.conformite.percentage >= 100
);
```

**Usage**: Controls button disabled state and styling.

---

### showToast(message, type, duration?)

**Purpose**: Display a narrative or system notification to the player.

**Parameters**:
- `message`: French text string (support accents, proper punctuation)
- `type`: Visual styling category
  - `'sic'`: S.I.C. messages (subtle, mysterious)
  - `'non-conformity'`: "Tampon non conforme" (warning style)
  - `'phase2'`: Phase 2 transition notification (prominent)
  - `'system'`: Generic system messages (neutral)
- `duration`: Auto-dismiss timeout (default: 4000ms)

**Implementation**:
```typescript
const showToast = useCallback((
  message: string,
  type: ToastType,
  duration: number = 4000
) => {
  const newToast: ToastMessage = {
    id: `${Date.now()}_${Math.random()}`,
    text: message,
    type,
    duration,
    timestamp: Date.now()
  };
  
  setToastQueue(prev => {
    // Limit to 3 toasts max
    const updated = [...prev, newToast];
    return updated.slice(-3);
  });
  
  // Auto-dismiss after duration
  setTimeout(() => {
    dismissToast(newToast.id);
  }, duration);
}, []);
```

**Queue Management**:
- Max 3 concurrent toasts
- FIFO eviction when queue full
- Auto-dismiss via setTimeout

---

### dismissToast(toastId)

**Purpose**: Remove a toast from the active queue (triggered by auto-dismiss or manual swipe).

**Implementation**:
```typescript
const dismissToast = useCallback((toastId: string) => {
  setToastQueue(prev => prev.filter(toast => toast.id !== toastId));
}, []);
```

**Usage**: Called automatically after toast duration expires, or by user interaction (swipe to dismiss).

---

### getActiveToasts()

**Purpose**: Return current toast queue for rendering in UI.

**Return Type**: `ToastMessage[]`

**Usage**:
```typescript
// In main game screen component
const { getActiveToasts } = useGameState();
const toasts = getActiveToasts();

return (
  <View>
    {/* Game UI */}
    <ToastContainer toasts={toasts} />
  </View>
);
```

---

## State Update Patterns

### Atomic Updates
All methods use React's functional state update pattern to prevent race conditions:
```typescript
setGameState(prevState => {
  // Compute new state from prevState
  return { ...prevState, /* updates */ };
});
```

### Optimistic Updates
User interactions (button clicks) immediately update UI before AsyncStorage save completes.

### Persistence
All state changes automatically trigger the existing 5-second debounced save to AsyncStorage. No additional save logic needed.

---

## Integration with Existing Game Loop

The conformité system integrates into the existing 100ms game loop (GameStateContext lines 163-197):

```typescript
// EXISTING: Production update
const updateGameState = () => {
  // ... existing production calculations ...
  
  // NEW: Update lifetime formulaires counter
  const formulairesGained = 
    currentProduction.formulaires * deltaTime;
  
  if (gameState.conformite) {
    const newLifetime = 
      gameState.conformite.lifetimeFormulaires + formulairesGained;
    
    // NEW: Passive conformité progression
    const newPercentage = Math.min(
      Math.floor(newLifetime / 150),
      100
    );
    
    pendingUpdatesRef.current.conformite = {
      ...gameState.conformite,
      lifetimeFormulaires: newLifetime,
      percentage: newPercentage
    };
  }
  
  // NEW: Check for production milestone triggers
  checkProductionMilestones(gameState, newResources);
  
  applyPendingUpdates();
};
```

### Milestone Trigger Integration
```typescript
function checkProductionMilestones(
  state: GameState, 
  newResources: Resources
) {
  const milestones = state.messageSystem?.lastProductionMilestone;
  if (!milestones) return;
  
  // Dossiers: every 100
  if (Math.floor(newResources.dossiers / 100) > 
      Math.floor(milestones.dossiers / 100)) {
    attemptSICMessageTrigger(state);
  }
  
  // Tampons: every 50
  if (Math.floor(newResources.tampons / 50) > 
      Math.floor(milestones.tampons / 50)) {
    attemptSICMessageTrigger(state);
    attemptNonConformityTrigger(state); // 0.2% chance
  }
  
  // Update milestone tracking
  pendingUpdatesRef.current.messageSystem = {
    ...state.messageSystem,
    lastProductionMilestone: { ...newResources }
  };
}
```

---

## Error Handling

### Invalid State
All methods defensively check for missing optional properties:
```typescript
if (!gameState.conformite) return false; // Graceful fallback
```

### Resource Validation
Formulaires cost checked before deduction (prevent negative balances):
```typescript
if (gameState.resources.formulaires < 150) return false;
```

### Concurrent Updates
Uses React's functional update pattern to prevent lost updates in rapid-fire interactions.

---

## Performance Considerations

### Memoization
```typescript
const isConformiteUnlocked = useMemo(() => {
  return gameState.conformite?.isUnlocked || /* unlock check */;
}, [gameState.conformite?.highestEverTampons, 
    gameState.conformite?.highestEverFormulaires]);
```

### Debouncing
- Button clicks debounced at 500ms (prevent spam)
- AsyncStorage saves debounced at 5s (existing pattern)

### Re-render Optimization
- Context consumers only re-render when relevant state slices change
- Toast queue managed separately from main game state

---

## Testing Contract

### Unit Tests (if implemented)
```typescript
describe('performConformiteTest', () => {
  it('deducts 150 formulaires when successful', () => {
    const { result } = renderHook(() => useGameState());
    // Set up state: 200 formulaires, unlocked conformité
    const success = result.current.performConformiteTest();
    expect(success).toBe(true);
    expect(result.current.gameState.resources.formulaires).toBe(50);
  });
  
  it('returns false when formulaires < 150', () => {
    // Test insufficient resources
  });
  
  it('increases percentage by +3%', () => {
    // Test conformité increment
  });
});
```

### Integration Tests
1. **End-to-end**: Click test button, verify formulaires deducted and percentage increased
2. **Persistence**: Perform test, close app, reopen, verify percentage restored
3. **Unlock**: Reach thresholds, verify conformité UI appears

---

## Accessibility Contract

All Context methods support accessible UI:

### Screen Reader Support
```typescript
// Button must have descriptive label
<Pressable
  accessibilityLabel="Réaliser un test de conformité. Coûte cent cinquante formulaires."
  accessibilityHint={
    !isConformiteUnlocked() 
      ? "Ce système sera débloqué après avoir atteint mille tampons et cent formulaires."
      : undefined
  }
  onPress={performConformiteTest}
/>
```

### State Announcements
```typescript
// Toast container announces new messages
<View accessibilityLiveRegion="polite">
  {toasts.map(toast => (
    <Text key={toast.id} accessibilityLabel={toast.text}>
      {toast.text}
    </Text>
  ))}
</View>
```

---

## Version History

- **v1.0** (2025-01-21): Initial contract for conformité system
- Compatible with GameState version 2+
- Backward compatible with version 1 via migration

---

## See Also
- [Data Model](./data-model.md) - Entity definitions
- [Research Document](./research.md) - Technical decisions
- [Feature Specification](./spec.md) - Requirements
