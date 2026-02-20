# Data Model: Système de Prestige "Réforme Administrative"

**Phase**: 1 (Design & Contracts)  
**Date**: 2025-01-21  
**Status**: Complete

## Overview

Ce document définit toutes les entités de données pour le système de prestige, leurs relations, et leurs règles de validation.

---

## Entity 1: Paperclip (Trombone)

**Description** : Monnaie de prestige permanente, gagnée lors d'une Réforme Administrative.

### Attributes

| Attribute | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `total` | `number` | Yes | `0` | `>= 0`, integer |

### Storage Location
- **GameState root** : `gameState.paperclips: number`
- **Persistence** : AsyncStorage (`bureaucracy_game_state`)
- **Lifetime** : Permanent (survit aux prestiges)

### Business Rules
- **BR-001** : Les Trombones ne peuvent jamais être négatifs
- **BR-002** : Les Trombones gagnés lors d'un prestige sont **cumulatifs** avec le solde existant
- **BR-003** : Acheter une amélioration déduit immédiatement le coût du solde
- **BR-004** : Pas de limite maximale (peut croître indéfiniment)

### Relationships
- **Used by** : `PrestigeUpgrade` (coût d'achat)
- **Calculated from** : `TotalAdministrativeValue` + `Tier` (formule trans-phasique)

---

## Entity 2: TotalAdministrativeValue (Valeur Administrative Totale)

**Description** : Métrique invisible accumulée en arrière-plan, représentant la somme de toutes les ressources produites depuis le dernier prestige.

### Attributes

| Attribute | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `value` | `number` | Yes | `0` | `>= 0` (peut être float, sera floor() pour calcul prestige) |

### Storage Location
- **GameState root** : `gameState.totalAdministrativeValue: number`
- **Persistence** : AsyncStorage
- **Lifetime** : Reset à 0 après chaque prestige

### Business Rules
- **BR-005** : VAT est incrémentée à chaque production (passive ou manuelle)
- **BR-006** : VAT inclut **toutes** les ressources : Dossiers + Tampons + Formulaires
- **BR-007** : Même si formulaires sont bloqués par storage cap, la production compte dans VAT
- **BR-008** : VAT est utilisée **uniquement** pour le calcul de prestige (jamais affichée directement au joueur)

### Calculation Formula

```typescript
// Incrémentation à chaque frame de production
totalAdministrativeValue += (dossiers_produced + tampons_produced + formulaires_produced) * deltaTime

// Exemple : 
// - Production = 10 dossiers/sec + 5 tampons/sec + 2 formulaires/sec
// - Delta = 0.1 sec
// → VAT += (10 + 5 + 2) * 0.1 = 1.7
```

### Relationships
- **Produces** : `Paperclip` (via formule trans-phasique)
- **Influenced by** : `Tier` (coefficient de phase)

---

## Entity 3: PrestigeUpgrade (Amélioration de Prestige)

**Description** : Bonus temporaire acheté avec des Trombones, actif uniquement durant le run courant.

### Attributes

| Attribute | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `id` | `string` | Yes | - | Pattern: `prestige_\d{2}` (ex: `prestige_01`) |
| `name` | `string` | Yes | - | Non-empty, français, accents corrects |
| `description` | `string` | Yes | - | Explication claire de l'effet |
| `cost` | `number` | Yes | - | `> 0`, integer |
| `effectType` | `'click_multiplier' \| 'production_multiplier' \| 'storage_capacity'` | Yes | - | Enum strict |
| `effectTarget` | `'dossiers' \| 'tampons' \| 'formulaires' \| 'all'` | Yes | - | Dépend de effectType |
| `effectValue` | `number` | Yes | - | `> 0` (pourcentage ou multiplicateur) |
| `isActive` | `boolean` | Yes | `false` | État durant le run courant |

### Static Data (Data/gameData.ts)

```typescript
export const prestigeUpgrades: PrestigeUpgrade[] = [
  {
    id: 'prestige_01',
    name: 'Tampon Double Flux',
    description: 'Le bouton TAMPONNER génère 2 dossiers au lieu de 1',
    cost: 10,
    effectType: 'click_multiplier',
    effectTarget: 'dossiers',
    effectValue: 2, // Multiplicateur de clic
    isActive: false
  },
  {
    id: 'prestige_02',
    name: 'Optimisation des Flux',
    description: 'Augmente la production de Dossiers de 10%',
    cost: 50,
    effectType: 'production_multiplier',
    effectTarget: 'dossiers',
    effectValue: 10, // Pourcentage
    isActive: false
  },
  {
    id: 'prestige_03',
    name: 'Encre Haute Densité',
    description: 'Augmente la production de Tampons de 5%',
    cost: 200,
    effectType: 'production_multiplier',
    effectTarget: 'tampons',
    effectValue: 5,
    isActive: false
  },
  {
    id: 'prestige_04',
    name: 'Extension des Classeurs',
    description: 'Augmente la capacité de stockage de Formulaires de 20%',
    cost: 500,
    effectType: 'storage_capacity',
    effectTarget: 'formulaires',
    effectValue: 20, // Pourcentage
    isActive: false
  },
  {
    id: 'prestige_05',
    name: 'Synergie Administrative',
    description: 'Augmente la production globale de 10%',
    cost: 1500,
    effectType: 'production_multiplier',
    effectTarget: 'all',
    effectValue: 10,
    isActive: false
  }
];
```

### Storage (GameState)

```typescript
// GameState.prestigeUpgrades: Record<string, boolean>
// Ex: { "prestige_01": true, "prestige_02": false, ... }
```

### Business Rules
- **BR-009** : Une amélioration ne peut être achetée qu'une fois par run (non cumulable)
- **BR-010** : Toutes les améliorations sont désactivées (`isActive = false`) après un prestige
- **BR-011** : Les améliorations peuvent être rachetées dans chaque nouveau run
- **BR-012** : Le coût d'une amélioration ne change jamais (pas d'inflation)

### Relationships
- **Costs** : `Paperclip` (déduction à l'achat)
- **Affects** : `Production`, `Resources`, `StorageCap` selon effectType

---

## Entity 4: Tier (Strate)

**Description** : Niveau de progression global du joueur, détermine la difficulté de génération de Trombones.

### Attributes

| Attribute | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `current` | `'local' \| 'national' \| 'global'` | Yes | `'local'` | Enum strict |
| `coefficient` | `number` | Yes (calculated) | `1000` | Déterminé par `current` |

### Storage Location
- **GameState root** : `gameState.currentTier: Tier`
- **Persistence** : AsyncStorage
- **Lifetime** : Permanent (survit aux prestiges)

### Tier Coefficients

| Tier | Coefficient | Difficulté Prestige | Unlock Condition (Out of Scope) |
|------|-------------|---------------------|----------------------------------|
| `'local'` | `1000` | Facile | Default (tous les joueurs) |
| `'national'` | `5000` | Moyenne | À définir (feature future) |
| `'global'` | `25000` | Difficile | À définir (feature future) |

### Business Rules
- **BR-013** : La progression entre strates est **unidirectionnelle** (pas de régression)
- **BR-014** : La strate actuelle persiste après prestige
- **BR-015** : Le coefficient de phase est utilisé dans la formule trans-phasique

### Relationships
- **Influences** : `Paperclip` calculation (diviseur dans formule)

---

## Entity 5: PrestigeTransaction (Transaction de Prestige)

**Description** : Journal de transaction temporaire pour garantir l'intégrité du prestige en cas de crash.

### Attributes

| Attribute | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `prestigeInProgress` | `boolean` | Yes | `false` | État de transaction |
| `timestampStart` | `number` | Conditional | `null` | Required if `prestigeInProgress = true` |
| `expectedGain` | `number` | Conditional | `null` | Paperclips à créditer |
| `prePrestigeSnapshot` | `{ paperclips: number, totalAdministrativeValue: number }` | Conditional | `null` | État pré-prestige pour rollback |

### Storage Location
- **Separate AsyncStorage key** : `prestige_transaction` (pas dans GameState principal)
- **Lifetime** : Éphémère (supprimé après commit ou rollback)

### Business Rules
- **BR-016** : Le flag `prestigeInProgress` est écrit **avant** toute modification de GameState
- **BR-017** : Si transaction > 30 secondes au redémarrage → rollback automatique
- **BR-018** : Si transaction < 30 secondes → tenter de finaliser le prestige
- **BR-019** : En cas de corruption du transaction log → ignorer (fallback à GameState principal)

### State Machine

```
[IDLE] → (Player confirms prestige) → [TRANSACTION_STARTED]
  ↓
[TRANSACTION_STARTED] → (Write transaction log) → [RESOURCES_RESET]
  ↓
[RESOURCES_RESET] → (Credit paperclips) → [PAPERCLIPS_CREDITED]
  ↓
[PAPERCLIPS_CREDITED] → (Save GameState) → [COMMITTED]
  ↓
[COMMITTED] → (Clear transaction log) → [IDLE]

// Recovery paths on crash
[TRANSACTION_STARTED/RESOURCES_RESET] → (App restart) → [RECOVERY_DETECTED]
  ↓
[RECOVERY_DETECTED] → (Check timestamp) → [COMPLETE] ou [ROLLBACK]
```

---

## Entity Relationships Diagram

```
┌─────────────────┐
│   Tier          │
│  (currentTier)  │◄────┐
└─────────────────┘     │
         │              │
         │ determines   │ persists
         │ coefficient  │
         ▼              │
┌──────────────────────────┐      ┌──────────────────┐
│  TotalAdministrativeValue│      │   Paperclip      │
│         (VAT)            │──────┤   (total)        │
└──────────────────────────┘      └──────────────────┘
         │                                  │
         │ produces                         │ costs
         │ (via formula)                    │
         │                                  ▼
         │                        ┌──────────────────┐
         └───────────────────────►│ PrestigeUpgrade  │
                                  │   (isActive)     │
                                  └──────────────────┘
                                           │
                                           │ affects
                                           ▼
                                  ┌──────────────────┐
                                  │   Production     │
                                  │   Resources      │
                                  │   StorageCap     │
                                  └──────────────────┘
```

---

## Validation Rules

### Cross-Entity Validation

1. **Paperclips Sufficiency** (Pre-Purchase)
   ```typescript
   function canBuyUpgrade(upgradeId: string, paperclips: number): boolean {
     const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
     return upgrade && paperclips >= upgrade.cost && !upgrade.isActive;
   }
   ```

2. **VAT Minimum for Prestige** (Pre-Prestige)
   ```typescript
   function canPerformPrestige(vat: number, tier: Tier): boolean {
     const coefficient = TIER_COEFFICIENTS[tier];
     const gain = Math.floor(Math.sqrt(vat / coefficient));
     return gain >= 1; // Minimum 1 Trombone requis
   }
   ```

3. **Transaction Age Validation** (Recovery)
   ```typescript
   function shouldCompleteTransaction(timestampStart: number): boolean {
     const age = Date.now() - timestampStart;
     return age < 30_000; // 30 secondes
   }
   ```

---

## State Transitions

### Prestige Flow

```
Initial State:
  paperclips = 50
  totalAdministrativeValue = 250_000
  currentTier = 'local' (coefficient = 1000)
  prestigeUpgrades = { prestige_01: true, prestige_02: false, ... }

↓ (Player clicks "Réforme Administrative")

Calculate Gain:
  gain = floor(sqrt(250_000 / 1000)) = floor(sqrt(250)) = floor(15.81) = 15

↓ (Player confirms)

Transaction Started:
  Write prestige_transaction = { prestigeInProgress: true, expectedGain: 15, ... }

↓

Reset Resources:
  resources = { dossiers: 0, tampons: 0, formulaires: 0 }
  administrations = reset to default (owned agents = 0, locked admins except 'centrale')
  totalAdministrativeValue = 0
  prestigeUpgrades = { prestige_01: false, prestige_02: false, ... } // All disabled

↓

Credit Paperclips:
  paperclips = 50 + 15 = 65

↓

Commit:
  Save GameState to AsyncStorage
  Clear prestige_transaction

↓

Final State:
  paperclips = 65
  totalAdministrativeValue = 0
  currentTier = 'local' (unchanged)
  prestigeUpgrades = all false
  resources = { dossiers: 0, tampons: 0, formulaires: 0 }
```

---

## Schema Version Migration (v4 → v5)

### New Fields Added

| Field | Type | Default (v4→v5) | Notes |
|-------|------|----------------|-------|
| `paperclips` | `number` | `0` | Pas de Trombones rétroactifs |
| `totalAdministrativeValue` | `number` | `0` | Reset (pas de calcul rétrospectif) |
| `currentTier` | `Tier` | `'local'` | Strate par défaut |
| `prestigeUpgrades` | `Record<string, boolean>` | `{}` | Aucun upgrade actif |
| `prestigeInProgress` | `boolean` | `false` | Pas de transaction en cours |

### Example Migration Code

```typescript
if (version === 4) {
  console.log('[Migration] v4→v5: Adding prestige system');
  return {
    ...state,
    version: 5,
    paperclips: 0,
    totalAdministrativeValue: 0,
    currentTier: state.currentTier ?? 'local',
    prestigeUpgrades: {},
    prestigeInProgress: false
  } as GameState;
}
```

---

## Next Steps (Contracts & Quickstart)

Data model complete. Proceed to:
1. **contracts/prestige-api.ts** : Define TypeScript interfaces for functions
2. **quickstart.md** : Developer integration guide
