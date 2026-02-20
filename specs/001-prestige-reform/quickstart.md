# Quickstart Guide: Système de Prestige "Réforme Administrative"

**Audience**: Développeurs implémentant le système de prestige  
**Prerequisites**: Connaissance de React Native, TypeScript, Context API  
**Estimated Time**: 30 minutes de lecture, 4-6 heures d'implémentation

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Checklist](#implementation-checklist)
3. [Core Integration Points](#core-integration-points)
4. [Testing Strategy](#testing-strategy)
5. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Layer Responsibilities

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer (components/)                           │
│  - PrestigeShopModal.tsx: Boutique prestige (UI)           │
│  - PrestigeGauge.tsx: Jauge temps réel (affichage)         │
│  - PrestigeUpgradeCard.tsx: Carte upgrade (visuel)         │
└───────────────────────────┬─────────────────────────────────┘
                            │ uses hooks
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  State Layer (context/)                                     │
│  - GameStateContext.tsx:                                    │
│    • performPrestige() → orchestrate prestige               │
│    • buyPrestigeUpgrade() → purchase upgrade                │
│    • getPrestigePotentialLive() → reactive calculation      │
└───────────────────────────┬─────────────────────────────────┘
                            │ calls pure functions
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Business Logic Layer (data/)                               │
│  - prestigeLogic.ts:                                        │
│    • calculatePrestigePaperclips() → sqrt formula           │
│    • applyPrestigeMultipliers() → production modifiers      │
│    • getTierCoefficient() → phase coefficients              │
│  - gameData.ts:                                             │
│    • prestigeUpgrades[] → static upgrade definitions        │
└───────────────────────────┬─────────────────────────────────┘
                            │ uses types
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Type Definitions (types/)                                  │
│  - game.ts:                                                 │
│    • PrestigeUpgrade interface                              │
│    • Tier type ('local' | 'national' | 'global')           │
│    • GameState extensions (paperclips, totalAdministrative) │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Types & Data (Estimated: 1 hour)

- [ ] **1.1** Add types to `types/game.ts`:
  ```typescript
  export type Tier = 'local' | 'national' | 'global';
  
  export interface PrestigeUpgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
    effectType: 'click_multiplier' | 'production_multiplier' | 'storage_capacity';
    effectTarget: 'dossiers' | 'tampons' | 'formulaires' | 'all';
    effectValue: number;
    isActive: boolean;
  }
  
  export interface GameState {
    // ... existing fields
    paperclips: number;
    totalAdministrativeValue: number;
    currentTier: Tier;
    prestigeUpgrades: Record<string, boolean>; // upgradeId → isActive
    prestigeInProgress: boolean;
  }
  ```

- [ ] **1.2** Add upgrade definitions to `data/gameData.ts`:
  ```typescript
  export const prestigeUpgrades: PrestigeUpgrade[] = [
    { id: 'prestige_01', name: 'Tampon Double Flux', ... },
    { id: 'prestige_02', name: 'Optimisation des Flux', ... },
    // ... (voir data-model.md pour catalogue complet)
  ];
  ```

- [ ] **1.3** Update `data/gameData.ts` initial state:
  ```typescript
  export const initialGameState: GameState = {
    // ... existing fields
    paperclips: 0,
    totalAdministrativeValue: 0,
    currentTier: 'local',
    prestigeUpgrades: {},
    prestigeInProgress: false
  };
  ```

### Phase 2: Business Logic (Estimated: 2 hours)

- [ ] **2.1** Create `data/prestigeLogic.ts` with pure functions:
  - `calculatePrestigePaperclips(vat, tier)` → sqrt formula
  - `getTierCoefficient(tier)` → return 1000/5000/25000
  - `applyPrestigeMultipliers(production, activeUpgrades, allUpgrades)`
  - `getClickMultiplier(activeUpgrades, allUpgrades)`
  - Voir `contracts/prestige-api.ts` pour signatures complètes

- [ ] **2.2** Add JSDoc comments for all functions (exemple):
  ```typescript
  /**
   * Calcule le nombre de Trombones gagnés via la formule trans-phasique.
   * @param vat - Valeur Administrative Totale accumulée
   * @param tier - Strate actuelle ('local', 'national', 'global')
   * @returns floor(sqrt(vat / coefficient))
   */
  export function calculatePrestigePaperclips(vat: number, tier: Tier): number {
    const coefficient = getTierCoefficient(tier);
    return Math.floor(Math.sqrt(vat / coefficient));
  }
  ```

### Phase 3: State Management (Estimated: 2 hours)

- [ ] **3.1** Extend `context/GameStateContext.tsx` interface:
  ```typescript
  interface GameContextType {
    // ... existing fields
    performPrestige: () => Promise<boolean>;
    buyPrestigeUpgrade: (upgradeId: string) => boolean;
    getPrestigePotentialLive: () => PrestigePotential;
    hasPrestigeUpgrade: (upgradeId: string) => boolean;
    getActivePrestigeUpgrades: () => string[];
  }
  ```

- [ ] **3.2** Implement VAT tracking in `updateGameLoop`:
  ```typescript
  // Dans la boucle de production (line ~150)
  const vatDelta = deltaProduction.dossiers + deltaProduction.tampons + deltaProduction.formulaires;
  newGameState.totalAdministrativeValue += vatDelta;
  ```

- [ ] **3.3** Implement `performPrestige()` with two-phase commit:
  ```typescript
  const performPrestige = useCallback(async (): Promise<boolean> => {
    const potential = getPrestigePotential(gameState);
    if (!potential.canPrestige) return false;
    
    // Phase 1: Write transaction log
    await AsyncStorage.setItem('prestige_transaction', JSON.stringify({
      prestigeInProgress: true,
      timestampStart: Date.now(),
      expectedGain: potential.paperclipsGain,
      prePrestigeSnapshot: {
        paperclips: gameState.paperclips,
        totalAdministrativeValue: gameState.totalAdministrativeValue
      }
    }));
    
    // Phase 2: Reset resources and infrastructure
    setGameState(prev => ({
      ...prev,
      resources: { dossiers: 0, tampons: 0, formulaires: 0 },
      totalAdministrativeValue: 0,
      paperclips: prev.paperclips + potential.paperclipsGain,
      prestigeUpgrades: {}, // Disable all upgrades
      administrations: resetAdministrations(prev.administrations),
      prestigeInProgress: false
    }));
    
    // Phase 3: Commit and clear transaction
    await AsyncStorage.multiRemove(['prestige_transaction']);
    return true;
  }, [gameState]);
  ```

- [ ] **3.4** Implement `buyPrestigeUpgrade()`:
  ```typescript
  const buyPrestigeUpgrade = useCallback((upgradeId: string): boolean => {
    const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    if (gameState.paperclips < upgrade.cost) return false;
    if (gameState.prestigeUpgrades[upgradeId]) return false;
    
    setGameState(prev => ({
      ...prev,
      paperclips: prev.paperclips - upgrade.cost,
      prestigeUpgrades: { ...prev.prestigeUpgrades, [upgradeId]: true }
    }));
    
    showToast(`Amélioration achetée : ${upgrade.name}`, 'system');
    return true;
  }, [gameState, showToast]);
  ```

### Phase 4: Migration (Estimated: 30 minutes)

- [ ] **4.1** Update `utils/stateMigration.ts`:
  ```typescript
  if (version === 4) {
    console.log('[Migration] v4→v5: Adding prestige system');
    return {
      ...s,
      version: 5,
      paperclips: 0,
      totalAdministrativeValue: 0,
      currentTier: s.currentTier ?? 'local',
      prestigeUpgrades: {},
      prestigeInProgress: false
    } as GameState;
  }
  ```

- [ ] **4.2** Update validation in `isValidGameState()`:
  ```typescript
  if ((s.version as number) >= 5) {
    if (typeof s.paperclips !== 'number') return false;
    if (typeof s.totalAdministrativeValue !== 'number') return false;
    if (!['local', 'national', 'global'].includes(s.currentTier as string)) return false;
  }
  ```

### Phase 5: UI Components (Estimated: 2 hours)

- [ ] **5.1** Create `components/PrestigeGauge.tsx` (affichage temps réel):
  - Hook: `const potential = useGameState().getPrestigePotentialLive()`
  - Afficher: `"Réforme Administrative disponible : ${potential.paperclipsGain} Trombones"`
  - Désactiver si `!potential.canPrestige`

- [ ] **5.2** Create `components/PrestigeShopModal.tsx` (boutique):
  - Liste de `prestigeUpgrades` depuis `data/gameData.ts`
  - Pour chaque upgrade: `PrestigeUpgradeCard` component
  - Afficher solde de Trombones en haut

- [ ] **5.3** Create `components/PrestigeUpgradeCard.tsx`:
  - Bouton achat avec état (disponible / actif / bloqué)
  - Accessibilité: label `"${name} - Coût : ${cost} Trombones - ${isActive ? 'Actif' : 'Disponible'}"`

- [ ] **5.4** Update `app/(tabs)/options.tsx`:
  - Renommer bouton "Réinitialiser le jeu" → "Réforme Administrative"
  - Ajouter `<PrestigeGauge />` au-dessus du bouton
  - Dialogue de confirmation avec texte: `"Confirmer la Réforme Administrative ? Vous gagnerez ${gain} Trombones."`

- [ ] **5.5** Update `app/(tabs)/_layout.tsx`:
  - Ajouter menu item "Boutique de Prestige" dans `menuItems[]`:
    ```typescript
    {
      id: 'prestige-shop',
      icon: <Paperclip size={20} color={Colors.resourceFormulaires} />,
      label: 'Boutique de Prestige',
      description: 'Améliorations permanentes avec Trombones',
      onPress: () => setPrestigeShopOpen(true)
    }
    ```
  - **Pas de badge** (découverte par exploration)

---

## Core Integration Points

### Integration Point 1: VAT Tracking

**Location**: `context/GameStateContext.tsx`, function `updateGameLoop` (ligne ~140)

**Before**:
```typescript
setGameState(prev => ({
  ...prev,
  resources: newResources,
  lastTimestamp: now
}));
```

**After**:
```typescript
const vatGain = (newResources.dossiers - prev.resources.dossiers) +
                (newResources.tampons - prev.resources.tampons) +
                (newResources.formulaires - prev.resources.formulaires);

setGameState(prev => ({
  ...prev,
  resources: newResources,
  totalAdministrativeValue: prev.totalAdministrativeValue + vatGain,
  lastTimestamp: now
}));
```

### Integration Point 2: Manual Click (TAMPONNER)

**Location**: `components/` (wherever TAMPONNER button is implemented)

**Before**:
```typescript
const handleTamponnerClick = () => {
  incrementResource('dossiers', 1);
};
```

**After**:
```typescript
const handleTamponnerClick = () => {
  const clickMultiplier = getClickMultiplier(
    getActivePrestigeUpgrades(),
    prestigeUpgrades
  );
  incrementResource('dossiers', clickMultiplier); // 1 ou 2
  
  // Afficher feedback visuel "+2" si prestige_01 actif
  if (clickMultiplier === 2) {
    spawnFloatingText('+2', buttonPosition);
  }
};
```

### Integration Point 3: Production Calculation

**Location**: `context/GameStateContext.tsx`, function `calculateProduction`

**After existing bonusMultipliers logic**:
```typescript
// Apply prestige multipliers APRÈS les multiplicateurs d'agents
const prestigeModifiers = applyPrestigeMultipliers(
  newProduction,
  getActivePrestigeUpgrades(),
  prestigeUpgrades
);

return prestigeModifiers;
```

### Integration Point 4: Storage Cap Calculation

**Location**: `context/GameStateContext.tsx`, storage cap logic

**Before**:
```typescript
const currentCap = gameState.currentStorageCap;
```

**After**:
```typescript
const baseCap = gameState.currentStorageCap;
const withPrestigeBonus = applyPrestigeStorageBonus(
  baseCap,
  getActivePrestigeUpgrades(),
  prestigeUpgrades
);
```

---

## Testing Strategy

### Manual Test Cases (Execute in Order)

#### Test 1: Fresh Install
1. **Action**: Installer l'app (clean install)
2. **Verify**: `paperclips = 0`, `currentTier = 'local'`, `totalAdministrativeValue = 0`
3. **Expected**: Pas d'erreur, UI affiche "0 Trombones"

#### Test 2: VAT Accumulation
1. **Setup**: Accumuler 100 dossiers + 50 tampons + 25 formulaires
2. **Action**: Consulter jauge prestige
3. **Verify**: Potentiel = `floor(sqrt((100+50+25) / 1000))` = `floor(sqrt(0.175))` = 0 Trombones
4. **Expected**: Message "Valeur Administrative insuffisante" ou jauge affiche 0

#### Test 3: First Prestige
1. **Setup**: Accumuler assez de ressources pour VAT = 1 000 000
2. **Action**: Cliquer "Réforme Administrative" → Confirmer
3. **Verify**: 
   - `paperclips = 31` (`floor(sqrt(1000000/1000))`)
   - `resources = {0, 0, 0}`
   - `totalAdministrativeValue = 0`
   - Agents reset, administrations locked
4. **Expected**: Pas de crash, toast de confirmation

#### Test 4: Purchase Upgrade
1. **Setup**: Avoir 10 Trombones
2. **Action**: Ouvrir boutique → Acheter "Tampon Double Flux" (10 Trombones)
3. **Verify**: 
   - `paperclips = 0`
   - `prestigeUpgrades['prestige_01'] = true`
   - Bouton affiche "ACTIF" et est grisé
4. **Expected**: Toast "Amélioration achetée : Tampon Double Flux"

#### Test 5: Upgrade Effect (Click Multiplier)
1. **Setup**: "Tampon Double Flux" actif
2. **Action**: Cliquer TAMPONNER 10 fois
3. **Verify**: Dossiers = 20 (10 clics × 2)
4. **Expected**: Feedback visuel "+2" à chaque clic

#### Test 6: Prestige Resets Upgrades
1. **Setup**: "Tampon Double Flux" actif
2. **Action**: Effectuer un nouveau prestige
3. **Verify**: `prestigeUpgrades['prestige_01'] = false`
4. **Expected**: Upgrade désactivée, peut être rachetée

#### Test 7: Migration v4→v5
1. **Setup**: Sauvegarde v4 avec ressources élevées
2. **Action**: Lancer app avec code v5
3. **Verify**: Migration réussie, pas de crash, `paperclips = 0`, `totalAdministrativeValue = 0`

---

## Troubleshooting

### Issue: "TypeError: Cannot read property 'paperclips'"

**Cause**: GameState n'a pas été migré correctement  
**Solution**: Vérifier que `migrateGameState()` ajoute bien `paperclips: 0` pour v4→v5

### Issue: VAT ne s'accumule pas

**Cause**: Oubli d'incrémenter VAT dans `updateGameLoop`  
**Solution**: Vérifier que `totalAdministrativeValue += vatGain` est présent ligne ~150

### Issue: Prestige button disabled même avec VAT suffisante

**Cause**: Calcul de `canPrestige` incorrect  
**Solution**: Vérifier formule `floor(sqrt(vat / coefficient)) >= 1`

### Issue: Crash pendant prestige

**Cause**: Transaction log non écrit avant reset  
**Solution**: S'assurer que `AsyncStorage.setItem('prestige_transaction', ...)` est await avant `setGameState`

### Issue: Upgrades persistent après prestige

**Cause**: Oubli de reset `prestigeUpgrades = {}` dans `performPrestige()`  
**Solution**: Vérifier ligne de reset dans setGameState

---

## Next Steps

Après implémentation complète :
1. Exécuter tous les test cases manuels
2. Tester sur iOS **et** Android (simulateurs)
3. Générer tasks.md via `/speckit.tasks` pour phase d'implémentation
4. Code review avec checklist Constitution (plan.md)

---

**Questions ?** Consulter :
- `spec.md` : Requirements fonctionnels
- `data-model.md` : Entités et relations
- `contracts/prestige-api.ts` : Signatures TypeScript
- `research.md` : Décisions techniques
