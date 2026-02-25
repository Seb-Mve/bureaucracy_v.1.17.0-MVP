# Implementation Plan: Affichage du plafond d'achat des agents

**Branch**: `001-agent-cap-display` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-agent-cap-display/spec.md`

## Summary

Modifier `components/AgentItem.tsx` pour afficher `x{owned}/{maxOwned}` (avec le dénominateur atténué en `Colors.textLight`) sur les cartes des agents plafonnés, et enrichir l'`accessibilityLabel` avec « Possédé : N sur M ». Aucune autre couche (context, data, types) n'est impactée.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React Native, Expo ~53.0.0, `lucide-react-native`, `react-native-reanimated`
**Storage**: N/A (changement purement présentatiel, aucune persistance)
**Testing**: Validation manuelle sur simulateur iOS/Android
**Target Platform**: iOS 15+ / Android (Expo managed workflow)
**Project Type**: Mobile (React Native / Expo Router)
**Performance Goals**: Rendu synchrone, aucun appel async — impact nul sur les 60 fps
**Constraints**: `agent.maxOwned` est statique (défini dans `gameData.ts`), jamais `undefined` pour les 9 agents plafonnés
**Scale/Scope**: 1 fichier, ~15 lignes ajoutées/modifiées

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User Experience & Performance
- [x] Feature provides immediate visual feedback (<100ms perceived response) — rendu synchrone, pas de side-effect
- [x] Performance impact assessed for 60fps target — aucun calcul additionnel, juste un `agent.maxOwned !== undefined`
- [x] Idle game mechanics remain accurate across app lifecycle — non impacté
- [x] AsyncStorage operations are batched and non-blocking — non impacté

### Principle II: Code Quality & Maintainability
- [x] Game logic separated from presentation components — aucune logique métier dans le composant
- [x] State management uses React Context pattern — non impacté
- [x] Business logic implemented as pure, testable functions — non impacté
- [x] Components follow single responsibility (<300 lines) — AgentItem reste <250 lignes après modification
- [x] TypeScript strict mode with justified `any` types only — aucun `any` introduit
- [x] Complex logic has JSDoc comments — logique triviale (condition `!== undefined`)
- [x] Game constants defined in centralized data files — `maxOwned` défini dans `gameData.ts`

### Principle III: French Language & Cultural Authenticity
- [x] All in-game text in French with authentic bureaucratic terminology — accessibilityLabel mis à jour en français
- [x] Proper French accents, grammar, and orthography — « Possédé : N sur M » grammaticalement correct
- [x] References to real French administrative structures — non impacté
- [x] Number formatting follows French conventions — entiers, pas de formatage particulier requis
- [x] Date/time uses French locale — non impacté

### Principle IV: Accessibility & Inclusive Design
- [x] Touch targets minimum 44×44 points — non impacté (header non interactif)
- [x] Color not sole means of conveying information — le chiffre et la barre oblique portent l'information, la couleur est accessoire
- [x] Text contrast meets WCAG 2.1 AA — `Colors.textLight` (`#666666`) sur fond blanc → ratio ~5.74:1 ✅
- [x] Accessibility labels for all icons/images — accessibilityLabel enrichi (AR-006)
- [x] Font sizes responsive to system settings — styles hérités, non impacté
- [x] Playable without sound/haptics — non impacté

### Principle V: Architectural Separation of Concerns
- [x] Presentation layer (`/components`) only renders UI — changement 100% présentatiel
- [x] State layer (`/context`) manages game state — non impacté
- [x] Business logic layer (`/data`) contains calculations — non impacté
- [x] Type definitions in `/types` — non impacté (`maxOwned` déjà dans `types/game.ts`)
- [x] Constants in `/constants` — `Colors.textLight` depuis `/constants/Colors`
- [x] Unidirectional dependencies: Presentation → State → Logic — respecté
- [x] Components don't directly import from `/data` — aucun import `/data` ajouté
- [x] Pure functions in `/data` have no React dependencies — non impacté

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-cap-display/
├── plan.md              ← Ce fichier
├── research.md          ← Phase 0 ✅
├── data-model.md        ← Phase 1 ✅
├── quickstart.md        ← Phase 1 ✅
└── tasks.md             ← Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
components/
└── AgentItem.tsx    ← SEUL fichier modifié
```

**Structure Decision**: Mobile single-project (Option 3 simplifié). Un seul composant de présentation à modifier — aucune nouvelle couche architecturale.
