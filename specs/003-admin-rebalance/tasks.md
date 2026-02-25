# Tasks: Rééquilibrage des administrations et de la conformité aléatoire

**Input**: Design documents from `/specs/003-admin-rebalance/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: Aucune suite de tests dans le projet — validation manuelle via `quickstart.md`.

**Organisation**: Tâches groupées par user story. Chaque story est indépendamment testable après sa phase.

## Format: `[ID] [P?] [Story] [label?] Description`

- **[P]**: Parallélisable (fichiers différents, pas de dépendance sur une tâche incomplète)
- **[US1..US4]**: User story d'appartenance
- **[a11y]**: Accessibilité
- **[perf]**: Performance
- **[i18n]**: Langue française / formatage numérique

---

## Phase 1 : Setup — Types (Bloquant pour tout)

**Purpose**: Ajouter le champ `maxOwned` au type `Agent` — prérequis pour les phases 2 et 5.

- [ ] T001 Ajouter `maxOwned?: number` (champ optionnel, `undefined` = illimité) à l'interface `Agent` après `owned: number` dans `types/game.ts`

---

## Phase 2 : Foundational — Données statiques & Migration (Bloquant pour toutes les US)

**Purpose**: Réécrire les définitions d'agents/admins et ajouter la migration save. Aucune US ne peut être testée sans ces deux tâches.

**⚠️ CRITIQUE**: T003 dépend de T002 (la migration importe `administrations` depuis `gameData.ts`).

- [ ] T002 Dans `data/gameData.ts` : (1) exporter la fonction pure `getEscalatedAgentCost(agent: Agent): Partial<Resources>` avec la formule `ceil(coût_base × 1,09^floor(owned/10))` — voir data-model.md §getEscalatedAgentCost ; (2) réécrire les 5 objets dans le tableau `administrations[]` avec les coûts, productions, bonus et `maxOwned` exacts du data-model.md §Tableau complet des agents ; (3) corriger les 4 `unlockCost` (service-tampons: 1000 tampons, cellule-verification: 15000 tampons, division-archivage: 5000 formulaires, agence-redondance: 10000 formulaires) ; (4) changer `version: 5` → `version: 6` dans `initialGameState`

- [ ] T003 Dans `utils/stateMigration.ts` : (1) importer `administrations` depuis `@/data/gameData` (déjà importé ou à ajouter) ; (2) ajouter le bloc `if (version === 5)` AVANT le bloc `if (version >= 5)` (qui devient `if (version >= 6)`) — la migration mappe chaque admin du nouveau `gameData.administrations` en préservant `isUnlocked` et `agents[].owned` du save chargé via `s.administrations` ; (3) chaîner avec un appel récursif `return migrateGameState({ ...s, version: 6, administrations: freshAdmins })` ; voir data-model.md §Migration V5→V6 pour le code complet

**Checkpoint Phase 2**: Nouvelle partie → Bureau des Documents Obsolètes avec agents corrects. Save existant migré → version 6 avec nouveaux coûts.

---

## Phase 3 : US1 — Progression fluide à travers les 5 administrations (P1) 🎯 MVP

**Goal**: Les 25 agents ont les bons coûts/productions/bonus. Les bonus locaux n'affectent que leur propre administration. Les coûts de déverrouillage sont corrects.

**Independent Test**: Nouvelle partie → acheter Directeur de pôle (x1, 100 formulaires) → observer que la production de tout le Bureau des Documents Obsolètes augmente de 5% et que les autres admins ne sont pas affectées. Débloquer Service-Tampons avec exactement 1 000 tampons.

- [ ] T004 [US1] [perf] Dans `context/GameStateContext.tsx`, réécrire la fonction `calculateProduction` avec l'algorithme 2 passes documenté dans `data-model.md §calculateProduction` : pour chaque admin déverrouillée, (1) calculer `adminBase` (somme des `baseProduction × owned`), (2) appliquer les bonus locaux sur `adminBase` uniquement (`isGlobal: false, target: 'all'` → `localAllMultiplier`, `isGlobal: false, target: X` → `adminBase[X] *=`), (3) accumuler les bonus globaux dans `globalMultipliers`, (4) additionner `adminBase` au total global, puis (5) appliquer `globalMultipliers` (dossiers/tampons/formulaires puis all) et `applyPrestigeMultipliers` — l'import de `getEscalatedAgentCost` depuis `@/data/gameData` peut être ajouté ici pour les prochaines phases

**Checkpoint US1**: Les 5 admins se débloquent aux bons seuils. Le Directeur de pôle booste uniquement son admin. Le Coordinateur qualité (+10% global) booste toutes les admins.

---

## Phase 4 : US4 — Activation et progression de la conformité aléatoire (P1)

**Goal**: Après activation, la conformité progresse selon la nouvelle formule (brackets de 5%, base 10 000). Seuls les formulaires effectivement stockés (pas la production brute dépassant le plafond) comptent.

**Independent Test**: Activer la conformité → remplir le stockage à 100% → observer que le `percentage` n'augmente plus. Vider le stockage → produire 10 000 formulaires → observer `percentage = 1%`.

- [ ] T005 [P] [US4] Dans `data/conformiteLogic.ts`, modifier `getFormulairesRequiredForNextPercent` : changer `Math.floor(currentPercent / 10)` → `Math.floor(currentPercent / 5)` et `1000` → `10000` — mettre à jour le JSDoc (exemples : 0% → 10 000, 5% → 11 000, 50% → ~25 937, total 100% → ~2 863 745)

- [ ] T006 [P] [US4] Dans `context/GameStateContext.tsx`, dans la fonction `applyPendingUpdates`, remplacer l'usage de `formulairesGainedDelta` pour `newAccumulated` par `actualFormulairesStored` calculé ainsi : `const actualFormulairesStored = newFormulaires - prev.resources.formulaires` (où `newFormulaires` est déjà le résultat de `applyStorageCap(prev.formulaires + delta.formulaires, effectiveStorageCap)`) — cette valeur est toujours ∈ [0, delta.formulaires] et reflète exactement ce qui a été stocké ; l'ancienne variable `formulairesGainedDelta` reste utilisée uniquement pour `lifetimeFormulaires`

**Checkpoint US4**: Débloquer la 5ème admin → widget conformité visible. Activer avec 40k tampons + 10k formulaires → progression démarre. Avec stockage plein → progression stoppe.

---

## Phase 5 : US2 — Plafonds d'achat (P2)

**Goal**: Les agents avec `maxOwned` défini ne peuvent plus être achetés une fois le maximum atteint — bouton désactivé.

**Independent Test**: Acheter 10 Superviseurs de section (maxOwned = 10) → au 10ème achat, le bouton se désactive immédiatement. Tenter un 11ème achat → retourne `false`.

- [ ] T007 [US2] Dans `context/GameStateContext.tsx`, dans `canPurchaseAgent` : ajouter AVANT `return canAfford(agent.cost)` la garde `if (agent.maxOwned !== undefined && agent.owned >= agent.maxOwned) return false` ; dans `purchaseAgent` : ajouter AVANT `if (!canAfford(agent.cost)) return false` la même garde `if (agent.maxOwned !== undefined && agent.owned >= agent.maxOwned) return false`

**Checkpoint US2**: Acheter un agent plafonné jusqu'au maximum → bouton `disabled` et `accessibilityState={{ disabled: true }}` (déjà géré par `canPurchaseAgent` dans `AgentItem`).

---

## Phase 6 : US3 — Escalade de prix par tranches de 10 achats (P2)

**Goal**: Le coût réel augmente de 9% tous les 10 achats. Le bouton affiche le coût escaladé, pas le coût de base.

**Independent Test**: Acheter 10 Stagiaires administratifs (base 50 dossiers) → le coût affiché passe à 55 dossiers (ceil(50 × 1,09)). `canPurchaseAgent` retourne `false` si ressources insuffisantes pour le coût escaladé.

- [ ] T008 [US3] Dans `context/GameStateContext.tsx` : (1) s'assurer que `getEscalatedAgentCost` est importé depuis `@/data/gameData` (déjà fait si ajouté en T004 sinon l'ajouter maintenant) ; (2) dans `canPurchaseAgent`, remplacer `return canAfford(agent.cost)` par `const escalatedCost = getEscalatedAgentCost(agent); return canAfford(escalatedCost)` (la garde maxOwned de T007 reste avant) ; (3) dans `purchaseAgent`, remplacer `if (!canAfford(agent.cost)) return false` par `const escalatedCost = getEscalatedAgentCost(agent); if (!canAfford(escalatedCost)) return false` ET remplacer la boucle de déduction des ressources pour utiliser `escalatedCost` au lieu de `agent.cost`

- [ ] T009 [US3] Dans `context/GameStateContext.tsx` : (1) ajouter `getAgentCurrentCost: (administrationId: string, agentId: string) => Partial<Resources>` à l'interface `GameContextType` ; (2) implémenter avec `useCallback` : trouver l'admin et l'agent dans `gameState.administrations`, retourner `getEscalatedAgentCost(agent)` ou `{}` si non trouvé, deps: `[gameState.administrations]` ; (3) ajouter `getAgentCurrentCost` dans la valeur du `GameContext.Provider`

- [ ] T010 [P] [US3] [a11y] Dans `components/AgentItem.tsx` : (1) ajouter `getAgentCurrentCost` au destructuring de `useGameState()` ; (2) calculer `const currentCost = getAgentCurrentCost(administrationId, agent.id)` en haut du composant (après les autres hooks) ; (3) dans `getCostDisplay()`, remplacer `Object.entries(agent.cost)[0]` par `Object.entries(currentCost)[0] ?? ['dossiers', 0]` ; (4) dans `getAccessibilityLabel()`, remplacer de même `Object.entries(agent.cost)[0]` par `Object.entries(currentCost)[0] ?? ['dossiers', 0]`

**Checkpoint US3**: Acheter 10 unités d'un agent → le coût affiché dans le bouton augmente. `canPurchaseAgent` reflète le coût réel.

---

## Phase 7 : Polish & Validation transversale

**Purpose**: Lint, vérification qualité, et validation manuelle des 8 scénarios de `quickstart.md`.

- [ ] T011 [i18n] Exécuter `npm run lint` depuis la racine du repo et corriger toutes les erreurs TypeScript et ESLint introduites par T001–T010 ; vérifier visuellement dans `data/gameData.ts` que tous les accents français sont corrects dans les noms et descriptions des 25 agents (è, é, ê, à, â, î, ô, û, ç, œ)

---

## Dependencies & Execution Order

### Dépendances entre phases

```
T001 (types)
  └─→ T002 (gameData — utilise le type Agent mis à jour)
        └─→ T003 (migration — importe administrations depuis gameData)
              └─→ T004 [US1] (calculateProduction — modifie GameStateContext)
                    ├─→ T005 [P] [US4] (conformiteLogic — fichier différent)
                    └─→ T006 [P] [US4] (applyPendingUpdates — même fichier, après T004)
                          └─→ T007 [US2] (purchaseAgent cap — même fichier)
                                └─→ T008 [US3] (purchaseAgent escalade — même fichier)
                                      └─→ T009 [US3] (getAgentCurrentCost — même fichier)
                                            └─→ T010 [P] [US3] (AgentItem — fichier différent)
                                                  └─→ T011 (lint + validation)
```

### Dépendances par user story

- **US1 (P1)**: Dépend de Phase 2 (T001→T002→T003). Aucune dépendance inter-US.
- **US4 (P1)**: Dépend de Phase 3 (T004). T005 et T006 peuvent être parallèles entre eux.
- **US2 (P2)**: Dépend de Phase 3 + Phase 4. S'ajoute à la même fonction que US3.
- **US3 (P2)**: Dépend de Phase 5. T010 (AgentItem) parallélisable dès T009 terminé.

### Parallélisme disponible

- **T005 ‖ T006** : `conformiteLogic.ts` vs `GameStateContext.tsx` — lancables simultanément après T004
- **T010 ‖ T011** : `AgentItem.tsx` peut être travaillé en parallèle du lint après T009

---

## Exemple de parallélisme : Phase 4 (US4)

```bash
# Une fois T004 mergé, lancer en parallèle :
Task A: T005 — modifier data/conformiteLogic.ts (nouvelle formule)
Task B: T006 — modifier context/GameStateContext.tsx (delta stocké)
# Les deux tâches touchent des fichiers différents, sans conflit
```

---

## Implementation Strategy

### MVP (US1 + US4 uniquement — les deux P1)

1. Phase 1 : T001 (types)
2. Phase 2 : T002, T003 (data + migration)
3. Phase 3 : T004 (calculateProduction)
4. **VALIDER US1** — 5 admins, bons agents, bonus locaux corrects
5. Phase 4 : T005, T006 (conformité)
6. **VALIDER US4** — formule brackets 5%, accumulation stockée seulement
7. Livrer MVP

### Livraison complète (toutes les US)

Après MVP :
1. Phase 5 : T007 (plafonds)
2. Phase 6 : T008, T009, T010 (escalade + UI)
3. Phase 7 : T011 (lint + validation)

### Stratégie agent solo (séquentiel)

Exécuter T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011
Chaque tâche dépend de la précédente sauf T005 (peut aller après T004 ou en parallèle avec T006).

---

## Notes

- Les tâches T004, T006, T007, T008, T009 modifient toutes `context/GameStateContext.tsx` — les exécuter strictement dans cet ordre pour éviter les conflits.
- T002 est la tâche la plus volumineuse (25 agents à réécrire) — prévoir de la lire complètement avant d'éditer.
- T003 (migration) : ne pas oublier de changer le guard `if (version >= 5)` → `if (version >= 6)`.
- `performPrestige` dans `GameStateContext.tsx` réinitialise `administrations` depuis le `administrations` importé de `gameData.ts` — la migration v6 garantit que les saves existants reçoivent les nouvelles données sans attendre un prestige.
