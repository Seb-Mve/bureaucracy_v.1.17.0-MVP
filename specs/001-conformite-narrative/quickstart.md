# Quickstart Guide - Conformité Aléatoire System

**Feature**: Conformité Aléatoire System and Hidden Narrative Layer  
**For**: Developers implementing or maintaining this feature  
**Last Updated**: 2025-01-21

---

## Overview

The **Conformité Aléatoire System** is a mysterious progression mechanic that appears after players reach 1,000 tampons and 100 formulaires. It adds a hidden narrative layer with cryptic S.I.C. (Service Inconnu de Coordination) messages and gates access to Phase 2 content when players reach 100% conformité.

### Key Components
1. **Conformité Percentage**: Hidden stat (0-100%) that progresses passively and via manual tests
2. **S.I.C. Messages**: Random narrative notifications that reference a mysterious bureaucratic service
3. **Non-Conformity Alerts**: Rare (0.2%) messages about defective stamps (purely cosmetic)
4. **Phase 2 Gate**: Button that activates at 100% conformité to transition to next phase

---

## Quick Reference

### File Structure
```
/context/
  └─ GameStateContext.tsx          # Add conformité logic, message triggers
/types/
  └─ game.ts                        # Extend GameState interface
/data/
  ├─ gameData.ts                    # Rename "Administration Centrale"
  ├─ conformiteLogic.ts             # NEW: Conformité calculations
  └─ messageSystem.ts               # NEW: S.I.C. message pool & triggers
/components/
  ├─ ConformiteDisplay.tsx          # NEW: Shows percentage + test button
  ├─ Phase2TransitionButton.tsx     # NEW: "Réaffectation différée" button
  └─ Toast.tsx                      # NEW: Notification component
/utils/
  └─ stateMigration.ts              # NEW: V1→V2 save file migration
/app/
  └─ index.tsx                      # Integrate new UI components
```

### Key Constants
```typescript
// Unlock thresholds
const CONFORMITE_UNLOCK_TAMPONS = 1000;
const CONFORMITE_UNLOCK_FORMULAIRES = 100;

// Progression
const CONFORMITE_INCREMENT_PER_150_FORMULAIRES = 1; // +1% passive
const CONFORMITE_TEST_COST = 150;                   // Formulaires
const CONFORMITE_TEST_GAIN = 3;                     // +3% active

// Message timing
const SIC_BASE_PROBABILITY = 0.125;                 // 12.5%
const SIC_COOLDOWN_PROBABILITY = 0.02;              // 2% if < 5min ago
const SIC_BOOST_PROBABILITY = 0.20;                 // 20% if > 30min ago
const NONCONFORMITY_PROBABILITY = 0.002;            // 0.2% per tampon
const NONCONFORMITY_COOLDOWN_MS = 600000;           // 10 minutes
```

---

## Implementation Checklist

### Phase 1: Type Definitions
- [ ] Add `ConformiteState` interface to `/types/game.ts`
- [ ] Add `MessageSystemState` interface to `/types/game.ts`
- [ ] Add `ToastMessage` interface to `/types/game.ts`
- [ ] Extend `GameState` with `version`, `conformite?`, `messageSystem?` properties

### Phase 2: Data Layer
- [ ] Create `/data/conformiteLogic.ts`
  - [ ] `calculateConformitePercentage(lifetimeFormulaires: number): number`
  - [ ] `shouldUnlockConformite(state: GameState): boolean`
  - [ ] `canPerformTest(state: GameState): boolean`
- [ ] Create `/data/messageSystem.ts`
  - [ ] `SIC_MESSAGES` array (6 French variants)
  - [ ] `calculateSICProbability(state: GameState): number`
  - [ ] `shouldTriggerNonConformity(state: GameState): boolean`
  - [ ] `getRandomSICMessage(): string`
- [ ] Update `/data/gameData.ts`
  - [ ] Rename "Administration Centrale" → "Bureau des Documents Obsolètes"

### Phase 3: State Migration
- [ ] Create `/utils/stateMigration.ts`
  - [ ] `migrateGameState(loaded: any): GameState`
  - [ ] Handle v1 → v2 migration (add conformité & messageSystem)
- [ ] Update `GameStateContext.tsx` load logic
  - [ ] Call `migrateGameState()` after `JSON.parse()`
  - [ ] Log migration events for debugging

### Phase 4: Context Methods
- [ ] Extend `GameStateContext.tsx`
  - [ ] Add `performConformiteTest()` method
  - [ ] Add `isConformiteUnlocked()` method
  - [ ] Add `isPhase2ButtonActive()` method
  - [ ] Add `showToast()` method
  - [ ] Add `dismissToast()` method
  - [ ] Add `getActiveToasts()` method
  - [ ] Add toast queue state (`useState<ToastMessage[]>`)

### Phase 5: Game Loop Integration
- [ ] Update game loop in `GameStateContext.tsx`
  - [ ] Track `lifetimeFormulaires` counter
  - [ ] Auto-increment conformité percentage (passive progression)
  - [ ] Track `highestEverTampons` and `highestEverFormulaires`
  - [ ] Check for unlock conditions each tick
  - [ ] Detect production milestone crossings
  - [ ] Trigger S.I.C. message probability checks
  - [ ] Trigger non-conformity checks on tampon production

### Phase 6: UI Components
- [ ] Create `/components/Toast.tsx`
  - [ ] Animated slide-in/fade-out (React Native Animated)
  - [ ] Position: top-center, overlay
  - [ ] Auto-dismiss after 4 seconds
  - [ ] Swipe-to-dismiss support
  - [ ] Accessibility: `accessibilityLiveRegion="polite"`
- [ ] Create `/components/ConformiteDisplay.tsx`
  - [ ] Show "Conformité aléatoire : X%" when unlocked
  - [ ] Button: "Réaliser un test de conformité" (costs 150 formulaires)
  - [ ] Disable button if formulaires < 150 or debounce active
  - [ ] Show tooltip on disabled state
  - [ ] Accessibility: 44×44pt touch target, descriptive labels
- [ ] Create `/components/Phase2TransitionButton.tsx`
  - [ ] Text: "Réaffectation différée"
  - [ ] Grayed out when conformité < 100%
  - [ ] Active/clickable when conformité === 100%
  - [ ] OnPress: Show Phase 2 notification toast
  - [ ] Accessibility: State-dependent hints

### Phase 7: Integration
- [ ] Update main game screen (`/app/index.tsx`)
  - [ ] Render `<ConformiteDisplay />` conditionally (when unlocked)
  - [ ] Render `<Phase2TransitionButton />` conditionally (when unlocked)
  - [ ] Render `<ToastContainer />` (always, for message display)
  - [ ] Position conformité UI near resource display

### Phase 8: Testing
- [ ] Manual testing: Reach unlock thresholds (1000 tampons + 100 formulaires)
- [ ] Manual testing: Click test button, verify -150 formulaires and +3% conformité
- [ ] Manual testing: Produce formulaires, verify passive +1% per 150
- [ ] Manual testing: Observe S.I.C. messages appearing during play
- [ ] Manual testing: Reach 100%, verify Phase 2 button activates
- [ ] Persistence testing: Save at 50%, reload, verify restored
- [ ] Migration testing: Load old v1 save, verify conformité initializes correctly
- [ ] Accessibility testing: VoiceOver/TalkBack read all labels correctly
- [ ] French language testing: Verify proper accents, punctuation, grammar

---

## Code Snippets

### 1. Extend GameState Interface
```typescript
// /types/game.ts
export interface ConformiteState {
  percentage: number;
  isUnlocked: boolean;
  lifetimeFormulaires: number;
  lastTestTimestamp: number | null;
  highestEverTampons: number;
  highestEverFormulaires: number;
}

export interface MessageSystemState {
  sicLastTriggerTime: number | null;
  nonConformityLastTriggerTime: number | null;
  lastProductionMilestone: {
    dossiers: number;
    tampons: number;
    formulaires: number;
  };
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'sic' | 'non-conformity' | 'phase2' | 'system';
  duration: number;
  timestamp: number;
}

export interface GameState {
  version: number; // NEW
  resources: Resources;
  production: Production;
  administrations: Administration[];
  activeAdministrationId: string;
  lastTimestamp: number | null;
  conformite?: ConformiteState; // NEW
  messageSystem?: MessageSystemState; // NEW
}
```

### 2. S.I.C. Message Pool
```typescript
// /data/messageSystem.ts
export const SIC_MESSAGES = [
  "Ce dossier a été transféré au S.I.C. pour traitement ultérieur.",
  "Le S.I.C. a validé cette procédure conformément au protocole.",
  "Notification S.I.C. : Vérification de conformité en cours.",
  "Le Service Inconnu de Coordination requiert une inspection supplémentaire.",
  "S.I.C. - Classification du document : Niveau de routine.",
  "Autorisation S.I.C. obtenue. Procédure standard applicable."
];

export function getRandomSICMessage(): string {
  const index = Math.floor(Math.random() * SIC_MESSAGES.length);
  return SIC_MESSAGES[index];
}

export function calculateSICProbability(
  sicLastTriggerTime: number | null
): number {
  if (!sicLastTriggerTime) return 0.125;
  
  const timeSinceSeconds = (Date.now() - sicLastTriggerTime) / 1000;
  
  if (timeSinceSeconds < 300) return 0.02;     // < 5 min
  if (timeSinceSeconds > 1800) return 0.20;    // > 30 min
  return 0.125;                                 // Base
}
```

### 3. Conformité Calculation
```typescript
// /data/conformiteLogic.ts
export function calculateConformitePercentage(
  lifetimeFormulaires: number
): number {
  const percentage = Math.floor(lifetimeFormulaires / 150);
  return Math.min(percentage, 100);
}

export function shouldUnlockConformite(
  highestEverTampons: number,
  highestEverFormulaires: number
): boolean {
  return highestEverTampons >= 1000 && highestEverFormulaires >= 100;
}

export function canPerformTest(
  formulaires: number,
  lastTestTimestamp: number | null
): boolean {
  if (formulaires < 150) return false;
  
  if (lastTestTimestamp && (Date.now() - lastTestTimestamp) < 500) {
    return false; // Debounce: 500ms
  }
  
  return true;
}
```

### 4. State Migration
```typescript
// /utils/stateMigration.ts
export function migrateGameState(loaded: any): GameState {
  const version = loaded.version || 1;
  
  if (version === 1) {
    console.log('[Migration] Upgrading v1 → v2: Adding conformité system');
    
    return {
      ...loaded,
      version: 2,
      conformite: {
        percentage: 0,
        isUnlocked: false,
        lifetimeFormulaires: loaded.resources?.formulaires || 0,
        lastTestTimestamp: null,
        highestEverTampons: loaded.resources?.tampons || 0,
        highestEverFormulaires: loaded.resources?.formulaires || 0
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

### 5. Context Method - Perform Test
```typescript
// /context/GameStateContext.tsx
const performConformiteTest = useCallback((): boolean => {
  if (!gameState.conformite?.isUnlocked) return false;
  if (gameState.resources.formulaires < 150) return false;
  
  const now = Date.now();
  const lastTest = gameState.conformite.lastTestTimestamp;
  if (lastTest && (now - lastTest) < 500) return false;
  
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

### 6. Toast Component (Simplified)
```typescript
// /components/Toast.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Pressable } from 'react-native';

interface ToastProps {
  message: string;
  type: 'sic' | 'non-conformity' | 'phase2' | 'system';
  onDismiss: () => void;
  duration: number;
}

export default function Toast({ message, type, onDismiss, duration }: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Slide in + fade in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
    
    // Auto-dismiss
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => onDismiss());
    }, duration);
    
    return () => clearTimeout(timeout);
  }, []);
  
  return (
    <Pressable onPress={onDismiss}>
      <Animated.View
        style={[
          styles.toast,
          { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
        ]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={message}
      >
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 16,
    borderRadius: 8,
    zIndex: 1000
  },
  text: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center'
  }
});
```

---

## Common Pitfalls

### ❌ Don't: Hard-code unlock thresholds in components
```typescript
// BAD: Magic numbers in UI
if (tampons >= 1000 && formulaires >= 100) { /* show conformité */ }
```

### ✅ Do: Use Context methods
```typescript
// GOOD: Encapsulated logic
if (isConformiteUnlocked()) { /* show conformité */ }
```

---

### ❌ Don't: Forget to cap conformité at 100%
```typescript
// BAD: Can exceed 100%
const newPercentage = lifetimeFormulaires / 150;
```

### ✅ Do: Always use Math.min()
```typescript
// GOOD: Hard cap at 100
const newPercentage = Math.min(Math.floor(lifetimeFormulaires / 150), 100);
```

---

### ❌ Don't: Trigger S.I.C. messages on every production tick
```typescript
// BAD: Spam central
if (Math.random() < 0.125) { showToast(...); }
```

### ✅ Do: Use milestone-based triggers with cooldowns
```typescript
// GOOD: Controlled frequency
if (hasCrossedMilestone && Math.random() < probability) { showToast(...); }
```

---

### ❌ Don't: Block the UI thread with animations
```typescript
// BAD: JavaScript-driven animation
Animated.timing(anim, { useNativeDriver: false })
```

### ✅ Do: Use native driver for 60fps
```typescript
// GOOD: GPU-accelerated
Animated.timing(anim, { useNativeDriver: true })
```

---

## Debugging Tips

### Check conformité unlock state
```typescript
console.log('Conformité unlocked:', gameState.conformite?.isUnlocked);
console.log('Highest tampons:', gameState.conformite?.highestEverTampons);
console.log('Highest formulaires:', gameState.conformite?.highestEverFormulaires);
```

### Monitor S.I.C. message triggers
```typescript
console.log('S.I.C. last trigger:', 
  gameState.messageSystem?.sicLastTriggerTime 
    ? new Date(gameState.messageSystem.sicLastTriggerTime).toLocaleTimeString()
    : 'Never'
);
console.log('Time since last:', 
  (Date.now() - (gameState.messageSystem?.sicLastTriggerTime || 0)) / 1000, 
  'seconds'
);
```

### Verify passive progression
```typescript
console.log('Lifetime formulaires:', gameState.conformite?.lifetimeFormulaires);
console.log('Calculated %:', Math.floor((gameState.conformite?.lifetimeFormulaires || 0) / 150));
console.log('Actual %:', gameState.conformite?.percentage);
```

### Test migration
```typescript
// Create v1 mock save
const v1Save = JSON.stringify({
  resources: { dossiers: 500, tampons: 2000, formulaires: 300 },
  administrations: [...],
  // No version field, no conformite field
});

// Load and migrate
const migrated = migrateGameState(JSON.parse(v1Save));
console.log('Migrated to version:', migrated.version);
console.log('Conformité initialized:', migrated.conformite);
```

---

## Performance Checklist

- [ ] Conformité calculations memoized with `useMemo`
- [ ] Toast animations use `useNativeDriver: true`
- [ ] No additional AsyncStorage writes (reuse existing 5s debounce)
- [ ] Message trigger checks < 2ms per game loop iteration
- [ ] Toast queue capped at 3 messages (prevent memory leak)
- [ ] Milestone checks use integer division (no floating point overhead)

---

## Accessibility Checklist

- [ ] All buttons have 44×44pt minimum touch target
- [ ] Conformité percentage has descriptive `accessibilityLabel`
- [ ] Test button label includes cost: "Coûte cent cinquante formulaires"
- [ ] Phase 2 button has state-dependent hints (locked vs active)
- [ ] Toast messages use `accessibilityLiveRegion="polite"`
- [ ] Grayed-out button state maintains 3:1 contrast ratio
- [ ] All French text pronounced correctly by screen readers

---

## French Language Checklist

- [ ] "Conformité aléatoire" with proper accent (é)
- [ ] "Réaliser un test de conformité" with proper accent (é)
- [ ] "Réaffectation différée" with proper accents (é, é)
- [ ] Space before colon in "S.I.C. :" (French typography)
- [ ] Formal register (vouvoiement): "Votre niveau..." not "Ton niveau..."
- [ ] Passive voice in notifications: "a été transféré", "a été jugé"
- [ ] All 6 S.I.C. messages reviewed by native speaker
- [ ] Number formatting uses French conventions (space for thousands)

---

## Next Steps

After implementing this feature:
1. **Test unlock timing**: Play to 1000 tampons, verify conformité appears immediately
2. **Balance testing**: Verify 4-6 hour progression to 100% feels right
3. **Message frequency**: Observe 30-minute play session, count S.I.C. messages (target: 2-3)
4. **Playtesting**: Show to French-speaking players, validate language authenticity
5. **Performance profiling**: Use React DevTools, verify 60fps maintained
6. **Migration testing**: Load old saves from production, verify no data loss

---

## Resources

- [Full Specification](./spec.md)
- [Research Document](./research.md)
- [Data Model](./data-model.md)
- [Context API Contract](./contracts/GameStateContext-API.md)
- [BUREAUCRACY++ Constitution](./.specify/memory/constitution.md)

---

**Questions?** Check the spec.md assumptions section or open an issue on the feature branch.
