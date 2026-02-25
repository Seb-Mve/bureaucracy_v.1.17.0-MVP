# Quickstart d'implémentation : Rééquilibrage des administrations

**Branch**: `003-admin-rebalance` | **Date**: 2026-02-25
**Référence**: [spec.md](./spec.md) | [data-model.md](./data-model.md) | [research.md](./research.md)

## Ordre d'implémentation

Les tâches doivent être réalisées dans cet ordre (dépendances ascendantes) :

```
1. types/game.ts           ← base typologique, tout dépend de ça
2. data/conformiteLogic.ts ← formule pure, indépendant
3. data/gameData.ts        ← dépend du type Agent mis à jour
4. context/GameStateContext.tsx  ← dépend de gameData (getEscalatedAgentCost)
5. utils/stateMigration.ts ← dépend du nouveau gameData (pour la migration)
6. components/AgentItem.tsx ← dépend du nouveau contexte (getAgentCurrentCost)
```

---

## Étape 1 : `types/game.ts`

**Ajouter `maxOwned?: number` dans l'interface `Agent`**, après `owned: number`.

```typescript
owned: number;
maxOwned?: number;  // undefined = illimité
```

---

## Étape 2 : `data/conformiteLogic.ts`

**Modifier `getFormulairesRequiredForNextPercent`** :
- Changer `Math.floor(currentPercent / 10)` → `Math.floor(currentPercent / 5)`
- Changer `1000` → `10000`

> `calculateConformitePercentageNew` appelle cette fonction → se met à jour automatiquement.

---

## Étape 3 : `data/gameData.ts`

Trois changements :

**A) Exporter `getEscalatedAgentCost`** (nouvelle fonction pure, ajouter avant `administrations`) :
```typescript
export function getEscalatedAgentCost(agent: Agent): Partial<Resources> {
  const multiplier = Math.pow(1.09, Math.floor(agent.owned / 10));
  const result: Partial<Resources> = {};
  for (const [resource, amount] of Object.entries(agent.cost)) {
    result[resource as keyof Resources] = Math.ceil((amount ?? 0) * multiplier);
  }
  return result;
}
```

**B) Mettre à jour toutes les définitions des 5 administrations** selon le tableau du `data-model.md` :
- Corriger les `unlockCost`
- Corriger tous les coûts et productions des agents
- Ajouter `maxOwned` aux agents plafonnés

**C) Changer `initialGameState.version` de `5` à `6`**.

---

## Étape 4 : `context/GameStateContext.tsx`

### 4a — Import de `getEscalatedAgentCost`
```typescript
import { ..., getEscalatedAgentCost } from '@/data/gameData';
```

### 4b — `calculateProduction` : refacto scoping local

Remplacer l'algorithme actuel par l'algorithme à 2 passes documenté dans `data-model.md`.
Points clés :
- Les bonus locaux s'appliquent sur la production de **l'administration en cours uniquement**
- `isGlobal: false, target: 'all'` est traité comme un multiplicateur local de toute la production de l'admin
- Les multiplicateurs globaux (`isGlobal: true`) sont accumulés et appliqués en fin

### 4c — `purchaseAgent` : escalade + cap

```typescript
// Avant de déduire les ressources:
if (agent.maxOwned !== undefined && agent.owned >= agent.maxOwned) return false;
const escalatedCost = getEscalatedAgentCost(agent);
if (!canAfford(escalatedCost)) return false;
// Déduire escalatedCost (pas agent.cost)
```

### 4d — `canPurchaseAgent` : escalade + cap

```typescript
if (agent.maxOwned !== undefined && agent.owned >= agent.maxOwned) return false;
const escalatedCost = getEscalatedAgentCost(agent);
return canAfford(escalatedCost);
```

### 4e — `applyPendingUpdates` : delta stocké pour conformité

```typescript
// Remplacer la ligne accumulatedFormulaires:
const actualFormulairesStored = newFormulaires - prev.resources.formulaires;
const newAccumulated = prev.conformite.isActivated
  ? prev.conformite.accumulatedFormulaires + actualFormulairesStored
  : prev.conformite.accumulatedFormulaires;
```

### 4f — `getAgentCurrentCost` : nouvelle méthode exposée

```typescript
const getAgentCurrentCost = useCallback((administrationId: string, agentId: string): Partial<Resources> => {
  const admin = gameState.administrations.find(a => a.id === administrationId);
  const agent = admin?.agents.find(a => a.id === agentId);
  if (!agent) return {};
  return getEscalatedAgentCost(agent);
}, [gameState.administrations]);
```

Ajouter `getAgentCurrentCost` dans `GameContextType`, la valeur de retour du provider, et le hook `useGameState`.

---

## Étape 5 : `utils/stateMigration.ts`

**Ajouter la migration V5→V6** (avant le bloc `version >= 5`) :

```typescript
if (version === 5) {
  console.log('[Migration] v5→v6: Refresh static agent/admin data');
  const savedAdmins = s.administrations as Array<Record<string, unknown>>;
  const freshAdmins = administrations.map(freshAdmin => {
    const savedAdmin = savedAdmins?.find((a) => a.id === freshAdmin.id) as Record<string, unknown> | undefined;
    const savedAgents = savedAdmin?.agents as Array<Record<string, unknown>> | undefined;
    return {
      ...freshAdmin,
      isUnlocked: (savedAdmin?.isUnlocked as boolean | undefined) ?? freshAdmin.isUnlocked,
      agents: freshAdmin.agents.map(freshAgent => {
        const savedAgent = savedAgents?.find((a) => a.id === freshAgent.id);
        return { ...freshAgent, owned: (savedAgent?.owned as number | undefined) ?? 0 };
      }),
    };
  });
  return { ...s, version: 6, administrations: freshAdmins } as unknown as GameState;
}
```

**Modifier le guard** : `if (version >= 5)` → `if (version >= 6)` (ou `version === 6`).

---

## Étape 6 : `components/AgentItem.tsx`

**Remplacer la lecture directe de `agent.cost`** par `getAgentCurrentCost` :

```typescript
// Destructuring:
const { canPurchaseAgent, purchaseAgent, formatNumber, getAgentCurrentCost } = useGameState();
const currentCost = getAgentCurrentCost(administrationId, agent.id);

// getCostDisplay() — utiliser currentCost au lieu de agent.cost:
const [resource, amount] = Object.entries(currentCost)[0] ?? ['dossiers', 0];

// getAccessibilityLabel() — idem pour le coût
```

---

## Tests manuels recommandés

1. **Nouvelle partie** → vérifier que seul le Bureau des Documents Obsolètes est disponible avec les bons coûts.
2. **Escalade** → acheter 10 unités d'un agent, vérifier que le coût à la 11ème = `ceil(base × 1,09)`.
3. **Plafond** → acheter jusqu'au maximum, vérifier que le bouton se désactive.
4. **Déverrouillage** → avec les nouveaux seuils (1 000 tampons pour Service-Tampons, etc.), vérifier qu'il faut exactement ce montant.
5. **Conformité** → activer, accumuler 10 000 formulaires stockés → vérifier 1%.
6. **Stockage plein** → remplir le stockage, observer que la conformité n'augmente plus.
7. **Bonus local-all** → acheter un Directeur de pôle, observer que la production de l'admin augmente.
8. **Save migration** → charger un save v5, vérifier qu'il passe en v6 avec les nouveaux coûts.
