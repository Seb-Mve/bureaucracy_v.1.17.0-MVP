# Implementation Plan: Rééquilibrage des administrations et de la conformité aléatoire

**Branch**: `003-admin-rebalance` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-admin-rebalance/spec.md`

## Summary

Réécriture complète des données des 25 agents dans 5 administrations (coûts, productions, bonus, plafonds d'achat), correction des coûts de déverrouillage des 4 administrations verrouillées, implémentation de l'escalade de prix à 9% par tranche de 10 achats, et mise à jour de la formule de progression de conformité (brackets de 5% avec base 10 000). Les modifications touchent 6 fichiers : types, données statiques, logique conformité, moteur de jeu (GameStateContext), migration de save, et composant UI AgentItem. Aucune nouvelle dépendance externe requise.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict mode) / React Native 0.76 / Expo SDK 53
**Primary Dependencies**: React Context (state), AsyncStorage (persistence), react-native-reanimated v3 (animations), expo-haptics (retours haptiques)
**Storage**: AsyncStorage, clé `'bureaucracy_game_state'`, JSON, schéma versionné → migration v5→v6
**Testing**: Aucun (pas de suite de tests dans le projet — validation manuelle)
**Target Platform**: iOS 15+ / Android (Expo managed workflow), web secondaire
**Project Type**: Mobile React Native
**Performance Goals**: `calculateProduction` en O(N agents) — appelé toutes les 100ms ; `purchaseAgent` synchrone <5ms
**Constraints**: Pas de nouveau `setInterval`. Pas de calcul asynchrone dans le game loop. `calculateProduction` doit rester pure (pas d'effets de bord).
**Scale/Scope**: 5 administrations, 25 agents, 1 save par device

---

## Constitution Check

### Principle I: User Experience & Performance
- [x] Feature provides immediate visual feedback (<100ms) — `purchaseAgent` synchrone, désactivation immédiate du bouton à cap
- [x] Performance impact assessed — `calculateProduction` reste O(N agents), une passe locale + une passe globale ; overhead négligeable
- [x] Idle game mechanics remain accurate across app lifecycle — logique inchangée pour background/resume
- [x] AsyncStorage operations are batched and non-blocking — migration se fait au chargement, déjà géré

### Principle II: Code Quality & Maintainability
- [x] Game logic separated from presentation — `getEscalatedAgentCost` dans `/data`, logique cap/escalade dans context
- [x] State management uses React Context pattern — aucune déviation
- [x] Business logic implemented as pure, testable functions — `getEscalatedAgentCost`, `getFormulairesRequiredForNextPercent`
- [x] Components follow single responsibility (<300 lines) — `AgentItem.tsx` : changement mineur
- [x] TypeScript strict mode with justified `any` types only — aucun `any` introduit
- [x] Complex logic has JSDoc comments — `getEscalatedAgentCost`, `getAgentCurrentCost` documentées
- [x] Game constants defined in centralized data files — formule escalade dans `data/gameData.ts`, brackets conformité dans `data/conformiteLogic.ts`

### Principle III: French Language & Cultural Authenticity
- [x] All in-game text in French — tous les noms d'agents et descriptions en français
- [x] Proper French accents, grammar, and orthography — validé dans la spec
- [x] Number formatting follows French conventions — `formatNumberFrench` appelé dans AgentItem

### Principle IV: Accessibility & Inclusive Design
- [x] Touch targets minimum 44×44 points — boutons agent inchangés
- [x] Color not sole means of conveying information — état désactivé (cap) via `accessibilityState.disabled` déjà présent dans AgentItem
- [x] Accessibility labels for all icons/images — `getAccessibilityLabel()` mis à jour pour utiliser le coût escaladé
- [x] Font sizes responsive to system settings — inchangé

### Principle V: Architectural Separation of Concerns
- [x] Presentation layer only renders UI — `AgentItem` reçoit un coût via hook, ne calcule pas
- [x] State layer manages game state — escalade + cap dans GameStateContext
- [x] Business logic layer contains calculations — `getEscalatedAgentCost` dans `/data/gameData.ts`
- [x] Type definitions in `/types` — `maxOwned` ajouté à `/types/game.ts`
- [x] Unidirectional dependencies: Presentation → State → Logic — respecté
- [x] Components don't directly import from `/data` — AgentItem utilise le hook contexte

**Résultat**: Aucune violation. Aucun Complexity Tracking nécessaire.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-admin-rebalance/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — résolution des 7 inconnues techniques
├── data-model.md        # Phase 1 — modèle de données et algorithmes
├── quickstart.md        # Phase 1 — guide d'implémentation pas-à-pas
├── contracts/
│   └── context-contracts.ts  # Signatures des méthodes modifiées/ajoutées
└── tasks.md             # Phase 2 — créé par /speckit.tasks
```

### Source Code (fichiers modifiés)

```text
types/
└── game.ts              # + maxOwned?: number dans Agent

data/
├── gameData.ts          # + getEscalatedAgentCost(), réécriture administrations[], version 6
└── conformiteLogic.ts   # getFormulairesRequiredForNextPercent() : bracket 5%, base 10 000

context/
└── GameStateContext.tsx # calculateProduction refacto, purchaseAgent/canPurchaseAgent,
                         # getAgentCurrentCost, applyPendingUpdates (delta stocké)

utils/
└── stateMigration.ts    # Migration v5→v6 (refresh données statiques agents)

components/
└── AgentItem.tsx        # getCostDisplay + accessibilityLabel → getAgentCurrentCost()
```

**Structure Decision**: Projet mobile React Native existant, pas de restructuration de dossiers. Tous les changements modifient des fichiers existants. Aucun nouveau fichier source créé.

---

## Complexity Tracking

*Aucune violation de la Constitution — section vide.*

---

## Phase 0 — Research

Complétée. Voir [research.md](./research.md) pour les 7 findings détaillés.

**Inconnues résolues** :
1. Coûts de déverrouillage admin : delta identifié, mise à jour déclarative
2. `maxOwned` manquant dans `Agent` : champ optionnel ajouté
3. `incrementThreshold/Value/IsPercentage` legacy inutilisés : conservés, nouvelle formule ajoutée
4. `calculateProduction` : bug `isGlobal: false, target: 'all'` + scoping inter-admin → refacto 2 passes
5. `applyPendingUpdates` : delta brut vs stocké pour conformité → correction
6. Formule conformité : bracket 10%/base 1000 → bracket 5%/base 10 000
7. Migration v5→v6 : refresh données statiques agents en préservant owned/isUnlocked

---

## Phase 1 — Design & Contracts

Complétée. Voir [data-model.md](./data-model.md) et [contracts/context-contracts.ts](./contracts/context-contracts.ts).

### Entités modifiées

| Entité | Fichier | Changement |
|---|---|---|
| `Agent` | `types/game.ts` | `+ maxOwned?: number` |
| `GameState` | `data/gameData.ts` | `version: 5 → 6` |
| `getEscalatedAgentCost` | `data/gameData.ts` | Nouvelle fonction pure exportée |
| `getFormulairesRequiredForNextPercent` | `data/conformiteLogic.ts` | Bracket 5%, base 10 000 |
| `calculateProduction` | `context/GameStateContext.tsx` | Algorithme 2 passes (scoping local) |
| `purchaseAgent` | `context/GameStateContext.tsx` | Escalade + cap |
| `canPurchaseAgent` | `context/GameStateContext.tsx` | Escalade + cap |
| `getAgentCurrentCost` | `context/GameStateContext.tsx` | Nouvelle méthode exposée |
| `applyPendingUpdates` | `context/GameStateContext.tsx` | Delta stocké pour conformité |
| Migration V5→V6 | `utils/stateMigration.ts` | Refresh données statiques |
| `AgentItem` | `components/AgentItem.tsx` | Affichage coût escaladé |

### Transitions d'état

```
purchaseAgent:
  [agent.owned < maxOwned] + [canAfford(escalatedCost)]
    → owned += 1
    → resources -= escalatedCost
    → canPurchaseAgent retourne false si owned === maxOwned après achat

conformité (applyPendingUpdates):
  [isActivated] + [formulaires produits ≤ cap restant]
    → accumulatedFormulaires += actualFormulairesStored (pas delta brut)
    → percentage = calculateConformitePercentageNew(0, newAccumulated)
```

### Constitution Check post-design

Tous les critères de la pré-design restent satisfaits. Aucune nouvelle violation identifiée lors du design.

---

## Prochaine étape

`/speckit.tasks` — Découpage en tâches d'implémentation atomiques avec dépendances, étiquettes `[perf]` / `[a11y]` / `[i18n]`, et critères d'acceptation par tâche.
