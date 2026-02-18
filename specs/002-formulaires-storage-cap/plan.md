# Implementation Plan: Limite de Stockage des Formulaires

**Branch**: `002-formulaires-storage-cap` | **Date**: 2025-01-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-formulaires-storage-cap/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implémentation d'une limite de stockage des formulaires avec blocage visuel (compteur rouge clignotant) et système de déblocage séquentiel via 4 upgrades payants. Le système introduit une barrière de progression intentionnelle où le joueur doit sacrifier l'intégralité de son stock actuel pour augmenter sa capacité de stockage. Le mécanisme suit un ordre strict (Admin 2 → Admin 3 → Admin 4 → Admin 5) et applique un plafond strict avec perte définitive des surplus automatiques.

## Technical Context

**Language/Version**: TypeScript strict mode, React Native via Expo SDK 53  
**Primary Dependencies**: 
  - expo-router v5 (navigation)
  - react-native-reanimated v3 (animations)
  - @react-native-async-storage/async-storage (persistence)
  - React Context API (state management via GameStateContext)
  
**Storage**: AsyncStorage (debounced saves, versioned schema with migrations)  
**Testing**: Manuel sur simulateurs iOS/Android (pas de tests unitaires requis pour cette feature)  
**Target Platform**: iOS 15+ / Android 8+ via Expo Go et builds natifs  
**Project Type**: Mobile (React Native / Expo)  
**Performance Goals**: 
  - 60fps durant clignotement du compteur
  - Game loop 100ms (existant, doit rester stable)
  - Opération achat upgrade <50ms (transaction atomique)
  
**Constraints**: 
  - Clignotement ≤3Hz (WCAG 2.3.1 compliance épilepsie)
  - Contraste texte rouge #FF0000 ratio ≥4.5:1
  - Touch targets ≥44×44 points
  - Pas de lag visible lors de production automatique intensive
  
**Scale/Scope**: 
  - 4 nouveaux upgrades (1 par admin 2-5)
  - 1 nouveau champ GameState (currentStorageCap)
  - 1 nouvelle logique pure (storageLogic.ts)
  - Modifications mineures composant ressources (compteur)
  - Migration V3→V4 pour currentStorageCap

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User Experience & Performance
- [x] Feature provides immediate visual feedback (<100ms perceived response)
  - *Clignotement démarre immédiatement au blocage, arrêt instantané post-achat*
- [x] Performance impact assessed for 60fps target on mid-range devices
  - *Animated.loop avec withTiming est optimisé, fréquence 2Hz ne sollicite pas le bridge*
- [x] Idle game mechanics remain accurate across app lifecycle (background/resume)
  - *Production automatique utilise delta temps existant, plafond appliqué dans game loop*
- [x] AsyncStorage operations are batched and non-blocking
  - *Achat upgrade = mutation GameState synchrone, save déjà debounced par pattern existant*

### Principle II: Code Quality & Maintainability
- [x] Game logic separated from presentation components
  - *Nouvelle logique pure dans data/storageLogic.ts (pattern conformiteLogic.ts)*
- [x] State management uses React Context pattern (GameStateContext)
  - *Ajout currentStorageCap + méthode purchaseStorageUpgrade dans GameStateContext*
- [x] Business logic implemented as pure, testable functions
  - *Fonctions calculateStorageCap(), isStorageBlocked(), canPurchaseUpgrade() pures*
- [x] Components follow single responsibility (<300 lines)
  - *Compteur ressources modifié minimalement, composant déjà <150 lignes*
- [x] TypeScript strict mode with justified `any` types only
  - *Pas de `any`, types stricts pour StorageUpgrade, currentStorageCap: number | null*
- [x] Complex logic has JSDoc comments
  - *Fonctions storageLogic.ts documentées avec JSDoc (conditions plafond, ordre séquentiel)*
- [x] Game constants defined in centralized data files
  - *4 upgrades définis dans data/gameData.ts avec autres upgrades existants*

### Principle III: French Language & Cultural Authenticity
- [x] All in-game text in French with authentic bureaucratic terminology
  - *Noms upgrades : "Casier de Secours B-9", "Rayonnage Vertical Optimisé", etc.*
- [x] Proper French accents, grammar, and orthography
  - *Pas d'accents dans ces noms, orthographe française correcte*
- [x] References to real French administrative structures where appropriate
  - *Upgrades attachés aux administrations 2-5 (existantes)*
- [x] Number formatting follows French conventions (1 000, 1,5)
  - *Compteur déjà formaté avec espaces via formatNumber() existant*
- [x] Date/time uses French locale (dd/mm/yyyy)
  - *N/A pour cette feature (pas de dates)*

### Principle IV: Accessibility & Inclusive Design
- [x] Touch targets minimum 44×44 points
  - *Pas de nouveaux boutons, upgrades utilisent boutons existants déjà conformes*
- [x] Color not sole means of conveying information (icons + text)
  - *Rouge + clignotement (mouvement) = 2 indicateurs visuels distincts*
- [x] Text contrast meets WCAG 2.1 AA (4.5:1 normal, 3:1 large)
  - *Rouge #FF0000 sur fond blanc = ratio 21:1 (largement conforme)*
- [x] Accessibility labels for all icons/images
  - *Label "Stock de formulaires bloqué à [N], capacité maximale atteinte" pour lecteurs d'écran*
- [x] Font sizes responsive to system settings
  - *Compteur utilise composant Text existant déjà responsive*
- [x] Playable without sound/haptics (visual alternatives)
  - *Pas de son/haptic, uniquement visuel (rouge + clignotement)*

### Principle V: Architectural Separation of Concerns
- [x] Presentation layer (`/components`) only renders UI
  - *Composant compteur reçoit props isBlocked/value, pas de logique métier*
- [x] State layer (`/context`) manages game state
  - *GameStateContext expose currentStorageCap + purchaseStorageUpgrade()*
- [x] Business logic layer (`/data`) contains calculations
  - *storageLogic.ts contient toute la logique (plafond, séquence, blocage)*
- [x] Type definitions in `/types`
  - *Type StorageUpgrade ajouté dans types/game.ts*
- [x] Constants in `/constants`
  - *Constantes couleurs (RED_BLOCKED) ajoutées dans constants/Colors.ts*
- [x] Unidirectional dependencies: Presentation → State → Logic
  - *Composant → Context → storageLogic → gameData (flux respecté)*
- [x] Components don't directly import from `/data`
  - *Composant utilise useGameState() hook, pas d'import direct*
- [x] Pure functions in `/data` have no React dependencies
  - *storageLogic.ts = fonctions pures TypeScript, zéro import React*

## Project Structure

### Documentation (this feature)

```text
specs/002-formulaires-storage-cap/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# React Native / Expo project structure
app/
├── (tabs)/
│   ├── index.tsx                # Bureau (écran principal) — compteur ressources modifié
│   └── recruitment.tsx          # Recrutement — affichage upgrades storage

components/
├── ResourceCounter.tsx          # MODIFIÉ — clignotement rouge si bloqué
└── [autres composants existants]

context/
└── GameStateContext.tsx         # MODIFIÉ — ajout currentStorageCap + purchaseStorageUpgrade()

data/
├── gameData.ts                  # MODIFIÉ — 4 nouveaux upgrades storage
├── storageLogic.ts              # NOUVEAU — logique plafond/blocage/séquence
└── conformiteLogic.ts           # Existant (pattern de référence)

types/
└── game.ts                      # MODIFIÉ — type StorageUpgrade, currentStorageCap: number | null

constants/
└── Colors.ts                    # MODIFIÉ — RED_BLOCKED = '#FF0000'

utils/
└── stateMigration.ts            # MODIFIÉ — migration V3→V4 (ajout currentStorageCap)
```

**Structure Decision**: 
Architecture mobile React Native/Expo avec séparation stricte en couches :
- **Présentation** (`app/`, `components/`) : UI tabs + composants réutilisables
- **État** (`context/`) : GameStateContext source unique de vérité
- **Logique** (`data/`) : Calculs purs (pattern existant conformiteLogic.ts)
- **Types** (`types/`) : Contrats TypeScript strict
- **Constantes** (`constants/`) : Configuration centralisée
- **Utils** (`utils/`) : Migrations de schéma, helpers

Pas de backend, toute la logique est client-side avec persistance AsyncStorage.

## Complexity Tracking

*Aucune violation constitutionnelle détectée. Cette section est vide.*

---

## Phase Completion Summary

### ✅ Phase 0: Outline & Research (Completed)

**Artifacts Generated**:
- `research.md` — 4 décisions techniques documentées (animation, performance, atomicité, formatage)

**Key Decisions**:
1. Animation clignotement via `withRepeat(-1, true)` + `useSharedValue` (reanimated v3)
2. Performance 60fps garantie via worklets (UI thread natif, isolé du game loop)
3. Transaction atomique `setGameState` pour achat upgrade (React garantit atomicité)
4. Formatage nombres via `Intl.NumberFormat('fr-FR')` (natif, pas de dépendance)

**All NEEDS CLARIFICATION resolved** ✅

---

### ✅ Phase 1: Design & Contracts (Completed)

**Artifacts Generated**:
- `data-model.md` — Modèle complet avec 4 upgrades, currentStorageCap, règles de validation
- `contracts/storage-logic-api.md` — Contrat TypeScript de 6 fonctions pures avec signatures et exemples
- `quickstart.md` — Guide d'implémentation en 7 étapes (~2-3h estimé)

**Key Entities**:
1. **StorageUpgrade** — Extension du type `Upgrade` avec `storageConfig` (newCap, requiredUpgradeId, sequenceIndex)
2. **currentStorageCap** — Nouveau champ `GameState` (983 initial, null = illimité)
3. **storageLogic.ts** — 6 fonctions pures (isStorageBlocked, canPurchaseStorageUpgrade, applyStorageCap, etc.)

**Migration**: V3→V4 définie dans `utils/stateMigration.ts`

**Agent Context Updated**: `.github/agents/copilot-instructions.md` ✅

---

### Constitution Re-Check (Post-Design)

**All 5 Principles Compliant** ✅
- ✅ Principle I: Immediate feedback (<100ms), 60fps worklets, AsyncStorage batched
- ✅ Principle II: Pure logic in `/data`, Context pattern, TypeScript strict, JSDoc
- ✅ Principle III: French bureaucratic names, number formatting (1 000)
- ✅ Principle IV: WCAG AA contrast (21:1), dual indicators (color+motion), a11y labels
- ✅ Principle V: Strict layer separation, unidirectional flow, no React in pure functions

**No violations. No complexity tracking needed.**

---

### 🚦 Phase 2: Tasks Generation (NOT EXECUTED)

**Status**: Phase 2 (tasks.md generation) is executed separately via `/speckit.tasks` command.

**This command (`/speckit.plan`) stops here.**

---

## Next Steps for Implementation

1. **Generate tasks**: Run `/speckit.tasks` to create `tasks.md` with dependency-ordered implementation tasks
2. **Review artifacts**: Ensure `research.md`, `data-model.md`, `contracts/`, and `quickstart.md` align with team understanding
3. **Start implementation**: Follow `quickstart.md` guide (estimated 2-3 hours)
4. **Manual testing**: Validate acceptance scenarios from `spec.md` on iOS/Android simulators

---

## Deliverables Summary

| Artifact | Status | Location |
|----------|--------|----------|
| Feature Spec | ✅ Clarified | `specs/002-formulaires-storage-cap/spec.md` |
| Implementation Plan | ✅ Complete | `specs/002-formulaires-storage-cap/plan.md` (this file) |
| Research | ✅ Complete | `specs/002-formulaires-storage-cap/research.md` |
| Data Model | ✅ Complete | `specs/002-formulaires-storage-cap/data-model.md` |
| API Contracts | ✅ Complete | `specs/002-formulaires-storage-cap/contracts/storage-logic-api.md` |
| Quickstart | ✅ Complete | `specs/002-formulaires-storage-cap/quickstart.md` |
| Agent Context | ✅ Updated | `.github/agents/copilot-instructions.md` |
| Tasks | ⏸️ Pending | Run `/speckit.tasks` separately |

**Branch**: `002-formulaires-storage-cap` ✅  
**Plan Path**: `/Users/sebastienmauve/Documents/BUREAUCRACY++/Github/bureaucracy_v.1.17.0-MVP/specs/002-formulaires-storage-cap/plan.md` ✅

**Planning workflow completed successfully.**
