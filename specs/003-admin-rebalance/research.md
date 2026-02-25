# Research: Rééquilibrage des administrations et de la conformité aléatoire

**Branch**: `003-admin-rebalance` | **Date**: 2026-02-25
**Phase**: 0 — Résolution des inconnues techniques

---

## FR-001..005 — Coûts de déverrouillage actuels vs spec

**Finding**: Les `unlockCost` dans `data/gameData.ts` ne correspondent pas à la spec.

| Administration | Actuel | Spec |
|---|---|---|
| service-tampons | 500 tampons | 1 000 tampons |
| cellule-verification | 1 000 tampons | 15 000 tampons |
| division-archivage | 1 000 formulaires | 5 000 formulaires |
| agence-redondance | 5 000 formulaires | 10 000 formulaires |

**Decision**: Mettre à jour les `unlockCost` dans `data/gameData.ts`.
**Rationale**: Modification purement déclarative, aucun changement de structure.

---

## FR-006/FR-009 — Champ `maxOwned` manquant dans le type `Agent`

**Finding**: L'interface `Agent` dans `types/game.ts` n'a pas de champ `maxOwned`. Les agents plafonnés (Superviseur de section, Directeur de pôle, etc.) ne peuvent pas encoder leur maximum.

**Decision**: Ajouter `maxOwned?: number` à l'interface `Agent`. Champ optionnel : `undefined` = illimité.
**Rationale**: Champ optionnel = zéro breaking change pour le code existant. Aucun autre type ne doit changer.
**Alternative rejetée**: Stocker les plafonds dans une Map séparée dans `gameData.ts` — données éparpillées, moins lisible.

---

## FR-010 — Escalade de prix : `incrementThreshold/incrementValue` non utilisés

**Finding**: L'interface `Agent` contient trois champs `incrementThreshold`, `incrementValue`, `incrementIsPercentage`. Aucun n'est utilisé dans `purchaseAgent` ni `canPurchaseAgent` dans `GameStateContext.tsx`. Ils sont présents dans les données mais n'ont aucun effet.

**Decision**: Ignorer ces champs legacy. Implémenter la nouvelle formule `ceil(coût_base × 1,09^floor(owned / 10))` directement dans `purchaseAgent` et `canPurchaseAgent`. Exposer une nouvelle fonction pure `getEscalatedAgentCost(agent: Agent): Partial<Resources>` dans `data/gameData.ts` pour le calcul partagé.
**Rationale**: Supprimer `incrementThreshold` etc. nécessiterait un changement de type et une migration — hors scope. Les conserver ne nuit pas.
**Alternative rejetée**: Stocker le coût escaladé dans l'état (`agent.cost` mis à jour à chaque achat) — multiplication des `setGameState` inutiles, état derivé ne doit pas être stocké.

---

## FR-007 — `calculateProduction` ignore silencieusement `isGlobal: false, target: 'all'`

**Finding**: Dans `context/GameStateContext.tsx` (ligne 150) :
```typescript
} else if (target !== 'all') {
```
Cette condition exclut `target === 'all'` de la branche locale, mais le cas n'est pas traité par la branche globale non plus. Le Directeur de pôle (`isGlobal: false, target: 'all'`) ne produit aucun effet.

**Problème secondaire**: La branche locale actuelle applique les bonus locaux sur `newProduction[target]` **global** (somme de toutes les admins déjà traitées), pas uniquement sur la production de l'administration en cours.

**Decision**: Réécrire `calculateProduction` avec un algorithme en 2 passes :
1. Par administration : calculer la production de base + appliquer les bonus locaux (target-specific et target-all) → production nette de l'admin.
2. Accumuler les totaux + accumuler les multiplicateurs globaux.
3. Appliquer les multiplicateurs globaux au total.

**Rationale**: Seule restructuration garantissant le scoping local correct pour tous les cas.
**Alternative rejetée**: Patch minimal (ajouter un `else if (target === 'all' && !isGlobal)`) — ne corrige pas le problème de scoping inter-admin pour les bonus locaux par ressource.

---

## FR-015 — `applyPendingUpdates` accumule les formulaires bruts, pas les formulaires stockés

**Finding**: Dans `applyPendingUpdates`, le delta utilisé pour `accumulatedFormulaires` est `_formulairesGainedDelta` (production brute). Mais quand le stockage est plein, la production brute dépasse le plafond — `applyStorageCap` la tronque dans `resources.formulaires`, mais l'accumulation de conformité reste basée sur le chiffre brut.

**Decision**: Dans `applyPendingUpdates`, calculer `actualFormulairesStored = newFormulaires - prev.resources.formulaires` et utiliser cette valeur pour `accumulatedFormulaires`.
**Rationale**: `newFormulaires` est déjà le résultat de `applyStorageCap(prev + delta)`, donc la différence reflète exactement ce qui a été stocké.

---

## FR-016 — Formule conformité : bracket 10% → 5%, base 1 000 → 10 000

**Finding**: `getFormulairesRequiredForNextPercent(currentPercent)` dans `data/conformiteLogic.ts` utilise `bracket = Math.floor(% / 10)` et `base = 1000`. La spec demande `bracket = Math.floor(% / 5)` et `base = 10 000`.

`calculateConformitePercentageNew` appelle `getFormulairesRequiredForNextPercent`, donc seule cette fonction doit changer pour mettre à jour toute la chaîne.

**Decision**: Mettre à jour uniquement `getFormulairesRequiredForNextPercent`.
**Rationale**: Changement à un seul endroit, impact propagé automatiquement.

---

## Migration V5→V6 — Refresh des données statiques des agents

**Finding**: Le `GameState.administrations` est sérialisé en entier dans AsyncStorage. Les propriétés statiques des agents (cost, baseProduction, productionBonus, maxOwned) sont stockées dans le save. Si `gameData.ts` change, les saves existants conservent les anciennes valeurs.

**Decision**: Ajouter une migration V5→V6 dans `stateMigration.ts` qui :
- Pour chaque administration dans le nouveau `gameData.administrations`, trouve l'admin correspondante dans le save (par `id`)
- Écrase toutes les propriétés statiques (name, unlockCost, agents[].cost, agents[].baseProduction, agents[].productionBonus, agents[].maxOwned, etc.) avec les nouvelles valeurs
- Préserve `isUnlocked` et `agents[].owned` depuis le save

**Rationale**: Garantit que tous les joueurs existants reçoivent les nouveaux coûts, productions et plafonds sans perdre leur progression.
**Assumption confirmée** (spec): Les agents en surplus de leur nouveau plafond restent fonctionnels (owned non modifié), seul l'achat est bloqué.

---

## Affichage du coût escaladé dans `AgentItem.tsx`

**Finding**: `AgentItem.tsx` lit `agent.cost` directement pour afficher le coût dans `getCostDisplay()` et `getAccessibilityLabel()`. Avec l'escalade, le coût affiché doit être le coût réel (escaladé), non le coût de base.

**Decision**: Ajouter `getAgentCurrentCost(administrationId, agentId): Partial<Resources>` au contexte. `AgentItem` appelera ce hook au lieu de lire `agent.cost` directement.
**Rationale**: Business logic hors composant (Principe V). Le composant reçoit une valeur, ne calcule pas.
**Alternative rejetée**: Passer le coût escaladé via prop depuis le parent — le parent lit déjà le gameState, ce serait du prop-drilling inutile.

---

## Résumé des fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `types/game.ts` | Ajout `maxOwned?: number` à `Agent` |
| `data/gameData.ts` | Nouvelles données des 25 agents + admins + export `getEscalatedAgentCost` + version 6 |
| `data/conformiteLogic.ts` | `getFormulairesRequiredForNextPercent` : bracket 5%, base 10 000 |
| `context/GameStateContext.tsx` | `calculateProduction` refacto (scoping local), `purchaseAgent/canPurchaseAgent` (escalade + maxOwned), `applyPendingUpdates` (delta stocké), + `getAgentCurrentCost` |
| `utils/stateMigration.ts` | Migration V5→V6, mise à jour `isValidGameState` |
| `components/AgentItem.tsx` | Utiliser `getAgentCurrentCost` pour affichage du coût |
