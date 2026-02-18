# Storage Logic Contract

**Date**: 2025-01-24  
**Type**: TypeScript Pure Functions API  
**Location**: `data/storageLogic.ts`

Ce fichier définit le contrat des fonctions pures de logique métier pour la gestion des limites de stockage.

---

## Function: `isStorageBlocked`

**Description**: Détermine si le stock de formulaires a atteint ou dépassé le plafond actuel.

**Signature**:
```typescript
function isStorageBlocked(state: GameState): boolean
```

**Paramètres**:
- `state: GameState` — État complet du jeu

**Retourne**:
- `true` si `state.resources.formulaires >= state.currentStorageCap` (et `currentStorageCap !== null`)
- `false` si stock sous le plafond ou si plafond illimité (`currentStorageCap === null`)

**Exemples**:
```typescript
isStorageBlocked({ resources: { formulaires: 983 }, currentStorageCap: 983 }) 
// → true (exactement au plafond)

isStorageBlocked({ resources: { formulaires: 982 }, currentStorageCap: 983 }) 
// → false (1 formulaire en dessous)

isStorageBlocked({ resources: { formulaires: 5000 }, currentStorageCap: null }) 
// → false (plafond illimité)
```

**Effets de bord**: Aucun (fonction pure)

**Invariants**:
- DOIT retourner un booléen
- NE DOIT PAS modifier `state`
- DOIT gérer `currentStorageCap === null` (illimité)

---

## Function: `canPurchaseStorageUpgrade`

**Description**: Vérifie si le joueur peut acheter un upgrade de stockage spécifique (séquence + coût).

**Signature**:
```typescript
function canPurchaseStorageUpgrade(
  state: GameState, 
  upgradeId: string
): boolean
```

**Paramètres**:
- `state: GameState` — État complet du jeu
- `upgradeId: string` — ID de l'upgrade (ex: `'storage_upgrade_1'`)

**Retourne**:
- `true` si toutes les conditions sont remplies :
  1. L'upgrade existe et est de type `'storage'`
  2. L'upgrade précédent dans la séquence est acheté (si applicable)
  3. Le joueur a suffisamment de formulaires (`resources.formulaires >= upgrade.cost.formulaires`)
- `false` sinon

**Exemples**:
```typescript
// Cas 1 : Upgrade 1, joueur a 983 formulaires, aucun prérequis
canPurchaseStorageUpgrade(state, 'storage_upgrade_1') 
// → true

// Cas 2 : Upgrade 2, joueur a 1983 formulaires, mais Upgrade 1 pas acheté
canPurchaseStorageUpgrade(state, 'storage_upgrade_2') 
// → false (séquence non respectée)

// Cas 3 : Upgrade 2, Upgrade 1 acheté, mais joueur a seulement 1000 formulaires
canPurchaseStorageUpgrade(state, 'storage_upgrade_2') 
// → false (coût insuffisant)

// Cas 4 : Upgrade 2, Upgrade 1 acheté, joueur a 1983 formulaires
canPurchaseStorageUpgrade(state, 'storage_upgrade_2') 
// → true
```

**Effets de bord**: Aucun (fonction pure)

**Invariants**:
- DOIT retourner `false` si `upgradeId` inconnu ou non-storage
- DOIT vérifier `requiredUpgradeId` si présent dans `storageConfig`
- NE DOIT PAS modifier `state`

---

## Function: `getNextStorageCap`

**Description**: Retourne le plafond du prochain upgrade de stockage non acheté.

**Signature**:
```typescript
function getNextStorageCap(state: GameState): number | null
```

**Paramètres**:
- `state: GameState` — État complet du jeu

**Retourne**:
- `number` — Plafond du prochain upgrade (ex: `1983`, `4583`, `11025`)
- `null` — Si tous les upgrades sont achetés OU prochain upgrade donne illimité

**Exemples**:
```typescript
// Aucun upgrade acheté → prochain = Upgrade 1 (1983)
getNextStorageCap(state) // → 1983

// Upgrade 1 acheté → prochain = Upgrade 2 (4583)
getNextStorageCap(state) // → 4583

// Upgrade 3 acheté → prochain = Upgrade 4 (null = illimité)
getNextStorageCap(state) // → null

// Tous upgrades achetés
getNextStorageCap(state) // → null
```

**Effets de bord**: Aucun (fonction pure)

**Invariants**:
- DOIT respecter l'ordre `sequenceIndex` pour déterminer le prochain
- DOIT ignorer les upgrades déjà achetés (`isPurchased === true`)
- NE DOIT PAS modifier `state`

---

## Function: `applyStorageCap`

**Description**: Applique le plafond de stockage au stock actuel (capping).

**Signature**:
```typescript
function applyStorageCap(
  currentStock: number, 
  cap: number | null
): number
```

**Paramètres**:
- `currentStock: number` — Stock actuel de formulaires
- `cap: number | null` — Plafond actuel (`null` = illimité)

**Retourne**:
- `Math.min(currentStock, cap)` si `cap !== null`
- `currentStock` si `cap === null` (illimité)

**Exemples**:
```typescript
applyStorageCap(1000, 983) // → 983 (capped)
applyStorageCap(500, 983)  // → 500 (sous le plafond)
applyStorageCap(10000, null) // → 10000 (illimité)
```

**Effets de bord**: Aucun (fonction pure)

**Invariants**:
- DOIT retourner un nombre ≥ 0
- DOIT retourner `currentStock` si `cap === null`
- NE DOIT JAMAIS retourner un nombre > `cap` (sauf si `cap === null`)

**Usage** : Appelé dans le game loop après calcul de la production automatique.

---

## Function: `getVisibleStorageUpgrades`

**Description**: Retourne les upgrades de stockage visibles (seulement si bloqué).

**Signature**:
```typescript
function getVisibleStorageUpgrades(state: GameState): Upgrade[]
```

**Paramètres**:
- `state: GameState` — État complet du jeu

**Retourne**:
- `Upgrade[]` — Liste des upgrades de type `'storage'` visibles
  - Si `isStorageBlocked(state) === true` → tous les storage upgrades
  - Sinon → tableau vide `[]`

**Exemples**:
```typescript
// Stock = 983, cap = 983 → bloqué
getVisibleStorageUpgrades(state) 
// → [storage_upgrade_1, storage_upgrade_2, storage_upgrade_3, storage_upgrade_4]

// Stock = 500, cap = 983 → pas bloqué
getVisibleStorageUpgrades(state) 
// → []
```

**Effets de bord**: Aucun (fonction pure)

**Invariants**:
- DOIT retourner un tableau (vide ou avec upgrades)
- DOIT filtrer uniquement les upgrades avec `type === 'storage'`
- DOIT respecter la règle de visibilité conditionnelle (FR-005)

---

## Function: `calculateProductionWithCap`

**Description**: Calcule la production automatique en appliquant le plafond.

**Signature**:
```typescript
function calculateProductionWithCap(
  state: GameState, 
  deltaMs: number
): number
```

**Paramètres**:
- `state: GameState` — État complet du jeu
- `deltaMs: number` — Temps écoulé depuis le dernier tick (millisecondes)

**Retourne**:
- `number` — Nouveaux formulaires ajoutés (peut être 0 si cap atteint)

**Logique**:
```typescript
const rawProduction = calculateAutoProduction(state, deltaMs); // fonction existante
const newTotal = state.resources.formulaires + rawProduction;
const cappedTotal = applyStorageCap(newTotal, state.currentStorageCap);
return cappedTotal - state.resources.formulaires; // delta réel ajouté
```

**Exemples**:
```typescript
// Stock = 980, production = 10, cap = 983
calculateProductionWithCap(state, 100) // → 3 (seulement 3 ajoutés, 7 perdus)

// Stock = 983, production = 10, cap = 983
calculateProductionWithCap(state, 100) // → 0 (tout perdu)

// Stock = 980, production = 10, cap = null
calculateProductionWithCap(state, 100) // → 10 (illimité)
```

**Effets de bord**: Aucun (fonction pure)

**Invariants**:
- DOIT retourner un nombre ≥ 0
- DOIT respecter le plafond (jamais > `cap - currentStock`)
- NE DOIT PAS modifier `state`

**Usage** : Appelé dans le game loop à chaque tick (100ms).

---

## Contrat TypeScript

```typescript
// data/storageLogic.ts
import { GameState, Upgrade } from '@/types/game';

/**
 * Détermine si le stock de formulaires a atteint le plafond.
 */
export function isStorageBlocked(state: GameState): boolean;

/**
 * Vérifie si un upgrade de stockage peut être acheté (séquence + coût).
 */
export function canPurchaseStorageUpgrade(
  state: GameState, 
  upgradeId: string
): boolean;

/**
 * Retourne le plafond du prochain upgrade non acheté.
 */
export function getNextStorageCap(state: GameState): number | null;

/**
 * Applique le plafond au stock actuel (capping).
 */
export function applyStorageCap(
  currentStock: number, 
  cap: number | null
): number;

/**
 * Retourne les upgrades de stockage visibles (seulement si bloqué).
 */
export function getVisibleStorageUpgrades(state: GameState): Upgrade[];

/**
 * Calcule la production automatique en respectant le plafond.
 */
export function calculateProductionWithCap(
  state: GameState, 
  deltaMs: number
): number;
```

---

## Tests de Validation (Manuel)

### Test 1 : Blocage Initial
```typescript
const state = { resources: { formulaires: 983 }, currentStorageCap: 983 };
assert(isStorageBlocked(state) === true);
```

### Test 2 : Séquence Stricte
```typescript
const state = { 
  resources: { formulaires: 1983 },
  upgrades: [
    { id: 'storage_upgrade_1', isPurchased: false },
    { id: 'storage_upgrade_2', isPurchased: false }
  ]
};
assert(canPurchaseStorageUpgrade(state, 'storage_upgrade_2') === false);
```

### Test 3 : Plafond Illimité
```typescript
const state = { resources: { formulaires: 100000 }, currentStorageCap: null };
assert(isStorageBlocked(state) === false);
assert(applyStorageCap(100000, null) === 100000);
```

### Test 4 : Production Capped
```typescript
const state = { 
  resources: { formulaires: 980 }, 
  currentStorageCap: 983,
  agents: [/* production = 10/tick */]
};
const added = calculateProductionWithCap(state, 100);
assert(added === 3); // seulement 3 formulaires ajoutés
```

---

**Conformité Constitution** :
- ✅ Principe II : Fonctions pures, pas de React, testables indépendamment
- ✅ Principe V : Séparation stricte logique (`/data`) vs présentation (`/components`)
- ✅ TypeScript strict : Pas de `any`, signatures explicites
