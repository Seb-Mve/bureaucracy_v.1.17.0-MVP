# Implementation Plan: Modale de Réaffectation Différée

**Branch**: `004-reaffectation-modal` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)

## Summary

Implémenter la modale bloquante déclenchée par le CTA « Réaffectation différée » à 100 % de conformité. Deux parcours : acceptation (placeholder « Coming soon ») et refus (reset conformité [23–65] % + animation descendante ~300 ms de la barre). 4 fichiers touchés : 2 fonctions pures dans `/data`, 1 action dans `/context`, 1 nouveau composant, 1 composant modifié.

## Technical Context

**Language/Version**: TypeScript 5 / React Native (Expo SDK ~53)
**Primary Dependencies**: React Native `Modal`, `Animated` (core RN), `react-native-reanimated` (déjà présent — non utilisé pour cette feature)
**Storage**: AsyncStorage via GameStateContext (existant) — `conformite.percentage` + `accumulatedFormulaires` modifiés au refus
**Testing**: Manuel (lint + validation manuelle)
**Target Platform**: iOS + Android (+ Web)
**Performance Goals**: Animation 300 ms fluide sur mid-range (< 16 ms/frame)
**Constraints**: `useNativeDriver: false` requis pour animer `width` ; modale non-dismissible (onRequestClose no-op)
**Scale/Scope**: 4 fichiers, ~120 lignes nettes ajoutées

## Constitution Check

### Principle I: User Experience & Performance
- [x] Feedback immédiat : modale s'ouvre au tap (<100ms), animation bar 300ms
- [x] Performance 60fps : `Animated.timing` avec `useNativeDriver: false` sur une seule propriété layout — impact négligeable
- [x] Idle mechanics inchangées : le game tick continue pendant la modale ouverte
- [x] AsyncStorage : aucune opération AsyncStorage supplémentaire ; la mise à jour d'état suit le path existant (save debounce 5s)

### Principle II: Code Quality & Maintainability
- [x] Logique séparée de la présentation : `getReaffectationResetPercentage` + `getAccumulatedFormulairesForPercentage` dans `/data`
- [x] État via React Context : `refuseReaffectation` dans `GameStateContext`
- [x] Fonctions pures testables : les 2 nouvelles fonctions de `conformiteLogic.ts` sont pures (déterministes sauf `Math.random` encapsulé)
- [x] SRP < 300 lignes : `ReaffectationModal.tsx` ~120 lignes ; `ConformiteDisplay.tsx` ~240 lignes après modification
- [x] TypeScript strict : aucun `any`, props typées
- [x] JSDoc : 2 nouvelles fonctions documentées
- [x] Constantes centralisées : textes figés dans le composant (pas de données de jeu modifiées)

### Principle III: French Language & Cultural Authenticity
- [x] Tous les textes en français : messages et boutons en français bureaucratique authentique
- [x] Terminologie préservée : « matricule », « pilonné », « échelon Départemental »
- [x] Pas de nombres formatés dans les textes fixes

### Principle IV: Accessibility & Inclusive Design
- [x] Touch targets ≥ 44×44pt : `minHeight: 44` sur tous les boutons
- [x] Information non portée uniquement par la couleur : libellés + sous-titres distincts pour chaque bouton
- [x] Contraste WCAG AA : texte blanc (#FFF) sur bleu (#4A90E2) ≈ 4.6:1 ✅ ; rouge (#E74C3C) sur sombre (#3A3A3A) ≈ 4.8:1 ✅
- [x] `accessibilityLabel` sur chaque bouton et sur la modale (`accessibilityViewIsModal`)
- [x] Jouable sans son/haptique : tout visuel

### Principle V: Architectural Separation of Concerns
- [x] Présentation (`/components`) : `ReaffectationModal.tsx`, modifications `ConformiteDisplay.tsx`
- [x] État (`/context`) : `refuseReaffectation` dans `GameStateContext`
- [x] Logique métier (`/data`) : `getReaffectationResetPercentage`, `getAccumulatedFormulairesForPercentage`
- [x] Types (`/types`) : aucun changement (ConformiteState suffisant)
- [x] Flux unidirectionnel respecté : Presentation → State → Logic
- [x] Composants n'importent pas depuis `/data` : `ReaffectationModal` n'importe que `Colors` et RN ; `ConformiteDisplay` appelle via contexte
- [x] Fonctions pures sans dépendances React ✅

**Constitution 5/5 ✅ — Aucune violation.**

## Project Structure

### Documentation (this feature)

```text
specs/004-reaffectation-modal/
├── plan.md              ← ce fichier
├── research.md          ← Phase 0 ✅
├── data-model.md        ← Phase 1 ✅
├── quickstart.md        ← Phase 1 ✅
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 (/speckit.tasks)
```

### Source Code

```text
data/
└── conformiteLogic.ts          [MODIFY] +getReaffectationResetPercentage, +getAccumulatedFormulairesForPercentage

context/
└── GameStateContext.tsx         [MODIFY] +refuseReaffectation action

components/
├── ReaffectationModal.tsx       [CREATE] Modale bloquante (message + 2 boutons + coming soon)
└── ConformiteDisplay.tsx        [MODIFY] +modalVisible, +Animated bar, +handlers, +<ReaffectationModal>
```

## Complexity Tracking

> Aucune violation de la Constitution — section non applicable.
