# Data Model: Limite de Stockage des Formulaires

**Date**: 2025-01-24  
**Branch**: `002-formulaires-storage-cap`

## Vue d'ensemble

Ce modèle de données étend le `GameState` existant pour supporter :
1. La limite de stockage actuelle (`currentStorageCap`)
2. Les 4 upgrades de stockage (intégrés dans `Upgrade[]` existant)
3. L'état de blocage (calculé, pas stocké)

Toutes les entités suivent les conventions TypeScript strict du projet.

---

## Entités Principales

### 1. StorageUpgrade (Extension de `Upgrade`)

**Location**: `types/game.ts` (extension du type `Upgrade` existant)

**Description**: Représente une amélioration de capacité de stockage achetable dans une administration spécifique.

**Structure TypeScript**:
```typescript
// Extension du type Upgrade existant avec propriétés spécifiques storage
interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: Resources;
  effect: string;
  type: 'agent' | 'production' | 'storage'; // 'storage' ajouté
  isPurchased: boolean;
  administrationId?: number; // 2-5 pour storage upgrades
  
  // Propriétés spécifiques au type 'storage'
  storageConfig?: {
    newCap: number | null;      // null = illimité (Upgrade 4)
    requiredUpgradeId?: string; // Upgrade précédent (séquence)
    sequenceIndex: number;      // 0-3 pour ordre strict
  };
}
```

**Instances des 4 Upgrades** (à ajouter dans `data/gameData.ts`) :
```typescript
{
  id: 'storage_upgrade_1',
  name: 'Casier de Secours B-9',
  description: 'Un espace de rangement supplémentaire découvert lors d\'un audit oublié.',
  cost: { formulaires: 983 },
  effect: 'Augmente la capacité de stockage à 1 983 formulaires',
  type: 'storage',
  isPurchased: false,
  administrationId: 2,
  storageConfig: {
    newCap: 1983,
    sequenceIndex: 0
    // pas de requiredUpgradeId (premier de la série)
  }
},
{
  id: 'storage_upgrade_2',
  name: 'Rayonnage Vertical Optimisé',
  description: 'Une réorganisation spatiale permettant d\'exploiter la hauteur sous plafond.',
  cost: { formulaires: 1983 },
  effect: 'Augmente la capacité de stockage à 4 583 formulaires',
  type: 'storage',
  isPurchased: false,
  administrationId: 3,
  storageConfig: {
    newCap: 4583,
    requiredUpgradeId: 'storage_upgrade_1',
    sequenceIndex: 1
  }
},
{
  id: 'storage_upgrade_3',
  name: 'Compression d\'Archives A-1',
  description: 'Une technique bureaucratique avancée de pliage conforme aux normes ISO 17025.',
  cost: { formulaires: 4583 },
  effect: 'Augmente la capacité de stockage à 11 025 formulaires',
  type: 'storage',
  isPurchased: false,
  administrationId: 4,
  storageConfig: {
    newCap: 11025,
    requiredUpgradeId: 'storage_upgrade_2',
    sequenceIndex: 2
  }
},
{
  id: 'storage_upgrade_4',
  name: 'Vide Juridique de Stockage',
  description: 'L\'exploitation d\'une faille réglementaire permettant un stockage théoriquement infini.',
  cost: { formulaires: 11025 },
  effect: 'Supprime toute limite de stockage (capacité illimitée)',
  type: 'storage',
  isPurchased: false,
  administrationId: 5,
  storageConfig: {
    newCap: null, // illimité
    requiredUpgradeId: 'storage_upgrade_3',
    sequenceIndex: 3
  }
}
```

**Validation**:
- `storageConfig` DOIT être présent si `type === 'storage'`
- `sequenceIndex` DOIT être unique parmi les storage upgrades
- `newCap` DOIT être > plafond précédent (ou null)
- `requiredUpgradeId` DOIT référencer l'upgrade avec `sequenceIndex - 1`

---

### 2. GameState Extension

**Location**: `types/game.ts` (modification du type `GameState` existant)

**Nouveau champ ajouté**:
```typescript
interface GameState {
  // ... champs existants (resources, agents, administrations, etc.)
  
  currentStorageCap: number | null; // Plafond actuel (983 initial, null = illimité)
}
```

**Valeurs possibles**:
- `983` : Valeur initiale (hardcoded dans `data/gameData.ts`)
- `1983` : Après achat Upgrade 1
- `4583` : Après achat Upgrade 2
- `11025` : Après achat Upgrade 3
- `null` : Après achat Upgrade 4 (illimité)

**Initialisation** (dans `data/gameData.ts`) :
```typescript
export const initialGameState: GameState = {
  // ... champs existants
  currentStorageCap: 983, // valeur initiale hardcoded
};
```

**Migration** (dans `utils/stateMigration.ts`) :
```typescript
// Ajout migration V3 → V4
function migrateV3toV4(state: any): GameState {
  return {
    ...state,
    currentStorageCap: state.currentStorageCap ?? 983, // fallback si undefined
    version: 4
  };
}
```

---

### 3. Entités Calculées (Non Stockées)

Ces entités sont dérivées du `GameState` via des fonctions pures dans `data/storageLogic.ts`.

#### 3.1 `isStorageBlocked`
**Type**: `boolean`  
**Calcul**: `formulaires >= currentStorageCap`  
**Usage**: Détermine si le compteur doit être rouge + clignotant

```typescript
export function isStorageBlocked(state: GameState): boolean {
  if (state.currentStorageCap === null) return false; // illimité
  return state.resources.formulaires >= state.currentStorageCap;
}
```

#### 3.2 `canPurchaseStorageUpgrade`
**Type**: `(state: GameState, upgradeId: string) => boolean`  
**Calcul**: Vérifie séquence + coût suffisant

```typescript
export function canPurchaseStorageUpgrade(
  state: GameState, 
  upgradeId: string
): boolean {
  const upgrade = findUpgrade(upgradeId);
  if (!upgrade || upgrade.type !== 'storage') return false;
  
  // Vérifier séquence (upgrade précédent acheté)
  if (upgrade.storageConfig?.requiredUpgradeId) {
    const required = findUpgrade(upgrade.storageConfig.requiredUpgradeId);
    if (!required?.isPurchased) return false;
  }
  
  // Vérifier coût (formulaires suffisants)
  return state.resources.formulaires >= upgrade.cost.formulaires;
}
```

#### 3.3 `getNextStorageCap`
**Type**: `(state: GameState) => number | null`  
**Calcul**: Retourne le plafond du prochain upgrade non acheté

```typescript
export function getNextStorageCap(state: GameState): number | null {
  const storageUpgrades = getAllUpgrades()
    .filter(u => u.type === 'storage')
    .sort((a, b) => 
      (a.storageConfig?.sequenceIndex ?? 0) - (b.storageConfig?.sequenceIndex ?? 0)
    );
  
  const nextUpgrade = storageUpgrades.find(u => !u.isPurchased);
  return nextUpgrade?.storageConfig?.newCap ?? null;
}
```

---

## Relations et Dépendances

### Diagramme de Relations

```
GameState
  ├── resources.formulaires ──┐
  ├── currentStorageCap ──────┤─→ isStorageBlocked() 
  └── upgrades[] ─────────────┘    (logique pure)
       └── StorageUpgrade (type='storage')
            ├── storageConfig.newCap
            ├── storageConfig.requiredUpgradeId ─→ Séquence stricte
            └── storageConfig.sequenceIndex
```

### Flux de Données

1. **Initialisation** : `currentStorageCap = 983` dans `initialGameState`
2. **Production** : Game loop ajoute formulaires → `Math.min(stock + production, currentStorageCap ?? Infinity)`
3. **Blocage** : `isStorageBlocked()` calculé → UI affiche rouge + clignotement
4. **Visibilité Upgrade** : Si `isStorageBlocked === true` → upgrades storage apparaissent dans menus Admin
5. **Achat Upgrade** : Transaction atomique → `stock = 0`, `currentStorageCap = upgrade.newCap`
6. **Déblocage** : `isStorageBlocked()` retourne `false` → clignotement s'arrête

---

## Règles de Validation

### Invariants du Modèle

1. **Plafond Strictement Croissant** :
   - `storage_upgrade_1.newCap (1983) > initialCap (983)`
   - `storage_upgrade_2.newCap (4583) > storage_upgrade_1.newCap (1983)`
   - `storage_upgrade_3.newCap (11025) > storage_upgrade_2.newCap (4583)`
   - `storage_upgrade_4.newCap (null)` = illimité

2. **Séquence Ininterrompue** :
   - `sequenceIndex` DOIT être [0, 1, 2, 3] sans gaps
   - `requiredUpgradeId` DOIT pointer vers `sequenceIndex - 1`

3. **Stock Jamais > Plafond** :
   - `state.resources.formulaires <= state.currentStorageCap` (sauf si `null`)
   - Appliqué dans le game loop avec `Math.min()`

4. **Achat Réinitialise Stock** :
   - Après `purchaseStorageUpgrade()` → `resources.formulaires === 0` TOUJOURS

### Cas Limites

| Cas | Comportement Attendu |
|-----|----------------------|
| Production auto génère 100 formulaires, plafond 983 | Stock se fige à 983, 17 formulaires perdus |
| Joueur a exactement 983, achète Upgrade 1 | Achat possible, stock → 0, cap → 1983 |
| Joueur tente d'acheter Upgrade 3 sans Upgrade 2 | `canPurchaseStorageUpgrade()` retourne `false` |
| Joueur achète Upgrade 4 | `currentStorageCap === null`, plus jamais de blocage |
| App redémarre avec stock > ancien plafond | Migration applique ancien plafond, surplus perdu au prochain tick |

---

## Impact sur le Schéma Persistant

### Avant (V3)
```json
{
  "version": 3,
  "resources": { "formulaires": 150 },
  "upgrades": [...]
}
```

### Après (V4)
```json
{
  "version": 4,
  "resources": { "formulaires": 150 },
  "currentStorageCap": 983,
  "upgrades": [
    {
      "id": "storage_upgrade_1",
      "type": "storage",
      "isPurchased": false,
      "storageConfig": { "newCap": 1983, "sequenceIndex": 0 }
    }
  ]
}
```

**Changements** :
- Ajout champ `currentStorageCap: number | null`
- Ajout type `'storage'` dans les upgrades
- Ajout structure `storageConfig` pour upgrades storage

**Migration** : `utils/stateMigration.ts` gère automatiquement V3→V4 au chargement.

---

## État Transitoire (Transaction Atomique)

Lors de l'achat d'un upgrade, la transaction DOIT être atomique pour éviter les états intermédiaires invalides :

**État Invalide à Éviter** :
```typescript
// ❌ MAL : Deux setState séparés
setGameState(prev => ({ ...prev, resources: { ...prev.resources, formulaires: 0 } }));
setGameState(prev => ({ ...prev, currentStorageCap: 1983 })); // stock=0 mais cap=983 pendant 1 frame
```

**État Valide** :
```typescript
// ✅ BIEN : Transaction atomique
setGameState(prev => ({
  ...prev,
  resources: { ...prev.resources, formulaires: 0 },
  currentStorageCap: upgrade.storageConfig!.newCap,
  upgrades: prev.upgrades.map(u => 
    u.id === upgradeId ? { ...u, isPurchased: true } : u
  )
}));
```

**Garantie** : React garantit que la fonction de mise à jour dans `setGameState` s'exécute de manière atomique. Aucun état intermédiaire n'est observable par les composants enfants.

---

## Résumé des Modifications

| Fichier | Type | Changements |
|---------|------|-------------|
| `types/game.ts` | MODIFIÉ | Ajout `currentStorageCap` dans `GameState`, ajout type `'storage'` et `storageConfig?` dans `Upgrade` |
| `data/gameData.ts` | MODIFIÉ | Ajout 4 storage upgrades, `currentStorageCap: 983` dans `initialGameState` |
| `data/storageLogic.ts` | NOUVEAU | Fonctions pures : `isStorageBlocked()`, `canPurchaseStorageUpgrade()`, `getNextStorageCap()` |
| `utils/stateMigration.ts` | MODIFIÉ | Ajout migration V3→V4 pour `currentStorageCap` |
| `context/GameStateContext.tsx` | MODIFIÉ | Ajout méthode `purchaseStorageUpgrade(upgradeId: string)` |

**Aucune donnée sensible. Tout est client-side.**
