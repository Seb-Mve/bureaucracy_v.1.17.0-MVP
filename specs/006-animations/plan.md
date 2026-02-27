# Implementation Plan: 006-animations

**Branch**: `006-animations` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-animations/spec.md`

---

## Summary

Ajouter 5 animations pour donner de la vie au jeu : (A) floating +N sur tap bouton, (B) effet tampon translateY + particules d'encre, (C) illustration panoramique + respiration de la carte active, (D) pulse icônes ressources sur production, (E) fade-in nameRow au changement de carte.

Approche technique : Reanimated v3 pour toutes les animations UI (breathing, pan, press, floating numbers, pulse icônes). RN Animated core uniquement pour les particules (5 Animated.Value pré-alloués). Wrappers View imbriqués dans AdministrationCard pour séparer RN Animated (shake existant) et Reanimated (breathing + pan).

---

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: React Native Reanimated v3 (déjà installé), React Native Animated core (pré-existant), expo-haptics
**Storage**: N/A — aucune donnée animatoire persistée
**Testing**: Manuel — simulateurs iOS/Android + web fallback
**Target Platform**: iOS + Android (portrait only), dégradé web
**Project Type**: Mobile React Native / Expo 53
**Performance Goals**: 60fps maintenu pendant toutes les animations; game loop 100ms non affecté
**Constraints**: `useNativeDriver: true` ou Reanimated UI thread obligatoire (PR-001); max 5 floats simultanés (PR-003); throttle icônes 1/s via `useRef` timestamp (PR-004)
**Scale/Scope**: 5 composants modifiés (GameStateContext, index.tsx, ResourceBar, AdministrationCard, StampButton)

---

## Constitution Check

### Principe I — User Experience & Performance ✅

- [x] Feedback immédiat sur tap (<100ms perçu) : translateY 80ms + particles simultanées
- [x] 60fps : toutes les animations sur Reanimated UI thread ou RN Animated avec `useNativeDriver: true`
- [x] Game loop 100ms non affecté : aucune animation via `setState` dans le loop (PR-002)
- [x] AppState listener pour relancer les animations breathing/pan au retour foreground
- [x] AsyncStorage non impacté : aucune donnée animatoire persistée

### Principe II — Code Quality & Maintainability ✅

- [x] Logique de jeu inchangée — `incrementResource`, `getClickMultiplier` restent dans leurs couches
- [x] `dossierClickMultiplier` exposé en lecture seule depuis context (useMemo)
- [x] FloatingNumber : composant local dans StampButton (pas de fichier supplémentaire pour ≤300 lignes)
- [x] Composants restent ≤ 300 lignes : StampButton ~150 lignes, AdministrationCard ~250 lignes (à vérifier au commit)
- [x] Throttle via `useRef` timestamp — pas de `setTimeout`/`debounce` externe (PR-004)

### Principe III — French Language & Cultural Authenticity ✅

- [x] Floating number : `+{formatNumberFrench(value)}` — LR-001 respecté
- [x] Aucun texte nouveau ajouté (animations purement visuelles)

### Principe IV — Accessibility & Inclusive Design ✅

- [x] Bouton Tamponner reste ≥ 44×44pt pendant et après animation translateY (AR-001)
- [x] Particules et floating numbers : `pointerEvents="none"` — ne bloquent pas les taps (AR-001)
- [x] Particules/floats purement décoratifs — pas d'`accessibilityLabel` requis (AR-002)
- [x] Amplitudes subtiles : pan ±8px, breathing ±0.8% (AR-003)

### Principe V — Architectural Separation of Concerns ✅

- [x] Composants (animation UI) → Context (`incrementResource`, `dossierClickMultiplier`) → Data (`getClickMultiplier`)
- [x] `dossierClickMultiplier` = lecture via useMemo depuis `data/prestigeLogic.ts` — pas d'import direct depuis composant
- [x] `FloatingNumber` : composant interne à StampButton — pas de nouvelle couche architecturale
- [x] Pont StampButton → ResourceBar : via signal `dossierTapSignal` dans index.tsx (parent commun)

---

## Project Structure

### Documentation (cette feature)

```text
specs/006-animations/
├── plan.md          ← ce fichier
├── spec.md          ← spécification validée
├── research.md      ← findings techniques (6 findings)
├── data-model.md    ← design composants + patterns
└── quickstart.md    ← guide étape par étape
```

### Fichiers modifiés

```text
context/
└── GameStateContext.tsx      ← useMemo dossierClickMultiplier + exposition

app/(tabs)/
└── index.tsx                 ← dossierTapSignal + handleStampTap

components/
├── ResourceBar.tsx            ← pulse icônes (Reanimated), prop dossierTapSignal
├── AdministrationCard.tsx     ← breathing + pan + nameRow fade-in (Reanimated)
└── StampButton.tsx            ← translateY + particules + floating numbers
```

Aucun nouveau fichier dans `data/`, `types/`, `constants/`. Aucune migration de schéma.

---

## Complexity Tracking

> Pas de violation constitutionnelle. Une seule justification de complexité :

| Décision | Justification | Alternative rejetée |
|---|---|---|
| Wrappers imbriqués dans AdministrationCard (4 niveaux) | RN Animated et Reanimated ne peuvent pas coexister sur le même composant — le shake existant (RN Animated) est hors scope de cette feature | Migrer le shake vers Reanimated : scope élargi, risque de régression |
| Signal `dossierTapSignal` dans index.tsx | Pont léger entre StampButton et ResourceBar sans couplage direct | Exposer un callback dans GameStateContext : mélange logique UI dans la couche state |
| `FloatingNumber` composant local (pas de fichier séparé) | StampButton reste sous 300 lignes avec FloatingNumber inclus | Fichier séparé : sur-architecture pour un composant de 20 lignes à usage unique |
