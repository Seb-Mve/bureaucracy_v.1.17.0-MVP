# Data Model: Rééquilibrage des administrations et de la conformité aléatoire

**Branch**: `003-admin-rebalance` | **Date**: 2026-02-25

---

## Changements de types (`types/game.ts`)

### `Agent` — Ajout de `maxOwned`

```typescript
export interface Agent {
  id: string;
  name: string;
  description: string;
  cost: Partial<Resources>;
  baseProduction: Partial<Production>;
  productionBonus?: {
    target: 'dossiers' | 'tampons' | 'formulaires' | 'all';
    value: number;
    isPercentage: boolean;
    isGlobal: boolean;
  };
  owned: number;
  maxOwned?: number;         // NEW — undefined = illimité
  // (champs legacy incrementThreshold/Value/IsPercentage conservés mais ignorés)
}
```

**Impact**: Zéro breaking change — champ optionnel.

---

## Version du GameState : 5 → 6

Bump déclenché par la migration V5→V6 qui rafraîchit les données statiques des agents.

```typescript
// initialGameState.version dans data/gameData.ts
version: 6,
```

---

## Nouvelle fonction pure : `getEscalatedAgentCost` (`data/gameData.ts`)

```typescript
/**
 * Calcule le coût réel d'un agent en fonction du nombre possédé.
 * Formule : ceil(coût_base × 1,09^floor(owned / 10))
 *
 * @param agent - L'agent dont on veut le coût actuel
 * @returns Coût escaladé (en Partial<Resources>)
 */
export function getEscalatedAgentCost(agent: Agent): Partial<Resources> {
  const multiplier = Math.pow(1.09, Math.floor(agent.owned / 10));
  const result: Partial<Resources> = {};
  for (const [resource, amount] of Object.entries(agent.cost)) {
    result[resource as keyof Resources] = Math.ceil((amount ?? 0) * multiplier);
  }
  return result;
}
```

---

## `getFormulairesRequiredForNextPercent` mis à jour (`data/conformiteLogic.ts`)

```typescript
// AVANT: bracket = Math.floor(% / 10), base = 1 000
// APRÈS:
export function getFormulairesRequiredForNextPercent(currentPercent: number): number {
  const bracket = Math.floor(currentPercent / 5);   // brackets de 5%
  return Math.round(10000 * Math.pow(1.1, bracket)); // base 10 000
}
```

**Tableau des coûts résultants** (identique au spec FR-016) :

| Bracket | Tranche | Coût par 1% |
|---|---|---|
| 0 | 0–4 % | 10 000 |
| 1 | 5–9 % | 11 000 |
| 2 | 10–14 % | 12 100 |
| 19 | 95–99 % | 61 159 |
| Total 0→100% | — | ~2 863 745 formulaires |

---

## Nouvelles méthodes du contexte (`context/GameStateContext.tsx`)

### Interface `GameContextType` — ajout

```typescript
// Retourne le coût escaladé actuel d'un agent (pour affichage UI)
getAgentCurrentCost: (administrationId: string, agentId: string) => Partial<Resources>;
```

### `calculateProduction` — algorithme restructuré

```
POUR CHAQUE admin déverrouillée:
  1. production_admin = somme des baseProduction de tous les agents (pondérée par owned)
  2. POUR CHAQUE agent avec bonus LOCAL:
       - si target = 'all':  localAllMultiplier += (value/100) * owned
       - si target = X:      production_admin[X] *= (1 + (value/100) * owned)
  3. production_admin *= localAllMultiplier (pour chaque ressource)
  4. total += production_admin
  5. POUR CHAQUE agent avec bonus GLOBAL: accumule dans globalMultipliers[target]

APPLIQUER globalMultipliers[dossiers/tampons/formulaires] sur total
APPLIQUER globalMultipliers[all] sur total (si > 1)
APPLIQUER prestige multipliers
```

### `purchaseAgent` — logique escalade + cap

```
1. Trouver agent
2. Vérifier maxOwned: si agent.owned >= agent.maxOwned → retourner false
3. Calculer coût escaladé: getEscalatedAgentCost(agent)
4. Vérifier canAfford(coût_escaladé)
5. Déduire coût_escaladé (non agent.cost)
6. Incrémenter owned
```

### `canPurchaseAgent` — logique escalade + cap

```
1. Trouver agent
2. Vérifier maxOwned: si agent.owned >= agent.maxOwned → retourner false
3. Calculer coût escaladé: getEscalatedAgentCost(agent)
4. Retourner canAfford(coût_escaladé)
```

### `applyPendingUpdates` — delta stocké pour conformité

```
// AVANT: accumulatedFormulaires += _formulairesGainedDelta (production brute)
// APRÈS:
const actualFormulairesStored = newFormulaires - prev.resources.formulaires;
// newFormulaires = applyStorageCap(prev.formulaires + delta.formulaires)
// donc actualFormulairesStored ∈ [0, delta.formulaires]
newAccumulated = prev.conformite.accumulatedFormulaires + actualFormulairesStored;
```

---

## Migration V5→V6 (`utils/stateMigration.ts`)

```typescript
if (version === 5) {
  // Refresh static agent/admin data — preserve owned & isUnlocked
  const freshAdmins = administrations.map(freshAdmin => {
    const savedAdmin = (s.administrations as Admin[]).find(a => a.id === freshAdmin.id);
    return {
      ...freshAdmin,
      isUnlocked: savedAdmin?.isUnlocked ?? freshAdmin.isUnlocked,
      agents: freshAdmin.agents.map(freshAgent => {
        const savedAgent = savedAdmin?.agents.find(a => a.id === freshAgent.id);
        return { ...freshAgent, owned: savedAgent?.owned ?? 0 };
      }),
    };
  });
  return migrateGameState({ ...s, version: 6, administrations: freshAdmins });
}
```

**Garde** : `isValidGameState` accepte `version >= 5` → aucun changement de validation nécessaire (la version 6 est un superset de la version 5, aucun nouveau champ obligatoire dans GameState).

---

## Agent de recrutement UI (`components/AgentItem.tsx`)

```typescript
// AVANT:
const { canPurchaseAgent, purchaseAgent, formatNumber } = useGameState();
// getCostDisplay: Object.entries(agent.cost)[0] → (resource, amount)

// APRÈS:
const { canPurchaseAgent, purchaseAgent, formatNumber, getAgentCurrentCost } = useGameState();
const currentCost = getAgentCurrentCost(administrationId, agent.id);
// getCostDisplay: Object.entries(currentCost)[0] → (resource, escalatedAmount)
```

---

## Tableau complet des agents (référence implémentation)

### Bureau des Documents Obsolètes (`administration-centrale`)

| id | Coût | Effet | maxOwned |
|---|---|---|---|
| `stagiaire-administratif` | 50 dossiers | +0,5 dossiers/s | — |
| `assistant-administratif` | 250 dossiers | +0,2 tampons/s | — |
| `superviseur-section` | 200 tampons | bonus: +10% dossiers, local | 10 |
| `chef-validation` | 500 tampons | +0,1 formulaires/s | — |
| `directeur-pole` | 100 formulaires | bonus: +5% all, local | 10 |

### Service des Tampons Tamponnés (`service-tampons`) — unlockCost: 1 000 tampons

| id | Coût | Effet | maxOwned |
|---|---|---|---|
| `tamponneur-debutant` | 300 dossiers | +0,4 tampons/s | — |
| `tamponneur-experimente` | 800 dossiers | +1 tampon/s | — |
| `chef-tamponnage` | 300 tampons | bonus: +5% tampons, local | 10 |
| `controleur-conformite` | 1 500 tampons | +0,3 formulaires/s | — |
| `coordinateur-tamponnage` | 200 formulaires | bonus: +3% all, global | 10 |

### Cellule de Double Vérification (`cellule-verification`) — unlockCost: 15 000 tampons

| id | Coût | Effet | maxOwned |
|---|---|---|---|
| `verificateur-auxiliaire` | 200 dossiers | +0,5 tampons/s | — |
| `analyste-conformite` | 500 dossiers | +0,6 tampons/s | — |
| `controleur-chef` | 300 tampons | bonus: +10% tampons, local | 5 |
| `archiviste-certifie` | 200 tampons | +1 tampon/s | — |
| `coordinateur-qualite` | 300 formulaires | bonus: +10% all, global | 5 |

### Division de l'Archivage Physique (`division-archivage`) — unlockCost: 5 000 formulaires

| id | Coût | Effet | maxOwned |
|---|---|---|---|
| `agent-rangement` | 500 tampons | +0,3 formulaires/s | — |
| `archiviste-methodique` | 1 000 tampons | +0,5 formulaires/s | — |
| `responsable-etageres` | 350 formulaires | bonus: +15% formulaires, local | 5 |
| `inspecteur-normes` | 500 tampons | +1 formulaire/s | — |
| `chef-archivage` | 400 formulaires | bonus: +20% all, global | 5 |

### Agence de Redondance Non Justifiée (`agence-redondance`) — unlockCost: 10 000 formulaires

| id | Coût | Effet | maxOwned |
|---|---|---|---|
| `assistant-duplication` | 500 dossiers | +5 dossiers/s | — |
| `repetiteur-administratif` | 1 200 dossiers | +8 dossiers/s | — |
| `chef-copie-colle` | 350 tampons | bonus: +10% tampons, local | 5 |
| `responsable-survalidation` | 250 formulaires | +1 formulaire/s | — |
| `redondant-supreme` | 500 formulaires | bonus: +15% all, global | 3 |
