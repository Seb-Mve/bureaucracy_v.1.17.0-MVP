# Implementation Plan: Fusion Bureau + Recrutement

**Branch**: `005-bureau-recrutement` | **Date**: 2026-02-26 | **Spec**: `specs/005-bureau-recrutement/spec.md`
**Input**: Feature specification from `/specs/005-bureau-recrutement/spec.md`

---

## Summary

Fusionner les onglets Bureau et Recrutement en une seule vue unifiée. L'onglet Recrutement disparaît de la navigation ; son contenu (agents, storage upgrades, déverrouillage d'admin) est intégré sous les cartes d'illustration dans l'onglet Bureau. Le nom de l'administration est déplacé à l'intérieur de la carte (synchronisé au swipe via `onMomentumScrollEnd`). L'approche retenue est **Option B** : scroll vertical unifié contenant le scroll horizontal snap existant — aucun nouveau niveau d'imbrication de scroll.

Artifacts de conception :
- `research.md` — 7 findings : architecture scroll, snap detection, card modifications, Principle V fix, extraction AdminContentSection, badges _layout, suppression recruitment.tsx
- `data-model.md` — design complet : nouveau composant AdminContentSection, méthode contexte `getAdminStorageUpgrades`, modifications AdministrationCard et index.tsx
- `quickstart.md` — guide d'implémentation en 7 étapes avec code complet

---

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: React Native (core Animated), Expo SDK ~53, expo-router, react-native-reanimated v3 (non utilisé dans cette feature — animations via RN Animated core)
**Storage**: N/A (aucun nouveau champ persisté — GameState schema v4 inchangé)
**Testing**: Manuel (iOS/Android simulateurs + browser via `npm run dev`)
**Target Platform**: iOS + Android (React Native / Expo), portrait only
**Project Type**: Mobile
**Performance Goals**: 60fps — animations avec `useNativeDriver: true` (translateX shake), `useNativeDriver: false` uniquement si interpolation de layout (non requis ici)
**Constraints**: Composants ≤ 300 lignes (Principe II) ; zéro import `/data` depuis les composants (Principe V)
**Scale/Scope**: 5 fichiers modifiés + 1 créé + 1 supprimé ; −148 lignes nettes

---

## Constitution Check

### Principle I: User Experience & Performance
- [x] Feature provides immediate visual feedback (<100ms perceived response) — `onMomentumScrollEnd` met à jour l'admin active en fin de geste natif ; shake animation ~240ms
- [x] Performance impact assessed for 60fps target — `useNativeDriver: true` pour le shake (translateX) ; Animated.Value stable (ref, pas state)
- [x] Idle game mechanics remain accurate across app lifecycle — aucun changement au game loop ni à l'auto-save
- [x] AsyncStorage operations are batched and non-blocking — aucune nouvelle opération AsyncStorage

### Principle II: Code Quality & Maintainability
- [x] Game logic separated from presentation components — `getAdminStorageUpgrades` encapsulée dans le contexte, pas dans les composants
- [x] State management uses React Context pattern — `AdminContentSection` appelle `useGameState()` directement
- [x] Business logic implemented as pure, testable functions — logique storage déléguée à `getVisibleStorageUpgrades` + `canPurchaseStorageUpgrade` existants
- [x] Components follow single responsibility (<300 lines) — `index.tsx` ~165 lignes, `AdminContentSection.tsx` ~170 lignes, `AdministrationCard.tsx` ~210 lignes
- [x] TypeScript strict mode with justified `any` types only — aucun `any` introduit
- [x] Complex logic has JSDoc comments — `onMomentumScrollEnd` et `getAdminStorageUpgrades` documentés
- [x] Game constants defined in centralized data files — `CARD_INTERVAL = 320` défini dans index.tsx (constante locale, pas de magic number inline)

### Principle III: French Language & Cultural Authenticity
- [x] All in-game text in French — tous les nouveaux textes (message admin verrouillée, labels) en français
- [x] Proper French accents, grammar, and orthography — vérifié dans quickstart.md
- [x] References to real French administrative structures — préservés (noms inchangés)
- [x] Number formatting follows French conventions — `formatNumber` (via contexte) utilisé pour coûts
- [x] Date/time uses French locale — N/A pour cette feature

### Principle IV: Accessibility & Inclusive Design
- [x] Touch targets minimum 44×44 points — `nameRow height: 44` + cartes width 300 (AR-001)
- [x] Color not sole means of conveying information — pastille "!" (texte + couleur, pas couleur seule) ; cadenas icône sur cartes verrouillées (AR-002)
- [x] Text contrast meets WCAG 2.1 AA — `Colors.title` sur `Colors.background` pour nameRow (AR-003)
- [x] Accessibility labels for all icons/images — labels existants préservés ; pastille avec `accessibilityLabel` (AR-004)
- [x] Font sizes responsive to system settings — Inter-Bold 14px via StyleSheet, pas de taille figée
- [x] Playable without sound/haptics — animations visuelles uniquement

### Principle V: Architectural Separation of Concerns
- [x] Presentation layer (`/components`) only renders UI — `AdminContentSection` et `AdministrationCard` ne contiennent que du JSX + styles
- [x] State layer (`/context`) manages game state — `getAdminStorageUpgrades` ajoutée au contexte
- [x] Business logic layer (`/data`) contains calculations — logique déléguée aux fonctions existantes dans `data/storageLogic.ts`
- [x] Type definitions in `/types` — interfaces existantes réutilisées, aucune nouvelle
- [x] Constants in `/constants` — `Colors` utilisé via `constants/Colors.ts`
- [x] Unidirectional dependencies: Presentation → State → Logic — respecté
- [x] Components don't directly import from `/data` — violation pre-existante dans `recruitment.tsx` corrigée via `getAdminStorageUpgrades` dans le contexte
- [x] Pure functions in `/data` have no React dependencies — inchangé

---

## Project Structure

### Documentation (this feature)

```text
specs/005-bureau-recrutement/
├── plan.md              # Ce fichier
├── spec.md              # Feature specification
├── research.md          # 7 findings architecture + décisions
├── data-model.md        # Design composants + méthode contexte
├── quickstart.md        # Guide d'implémentation 7 étapes
└── tasks.md             # Phase 2 — généré par /speckit.tasks
```

### Source Code (repository root)

```text
context/
└── GameStateContext.tsx         # MODIFY — +getAdminStorageUpgrades (~+25 lignes)

components/
├── AdministrationCard.tsx       # MODIFY — +nameRow, +shake, +pastille (~155→210 lignes)
└── AdminContentSection.tsx      # CREATE — contenu vertical (agents + upgrades + unlock) (~170 lignes)

app/(tabs)/
├── index.tsx                    # MODIFY — -renderAgentInfo, +onMomentumScrollEnd, +AdminContentSection (~225→165 lignes)
├── _layout.tsx                  # MODIFY — badge Bureau=purchasableAgentsCount, supprimer onglet Recrutement (~189→175 lignes)
└── recruitment.tsx              # DELETE — 343 lignes supprimées
```

**Structure Decision** : Mobile app Expo Router. Single project layout. Aucun nouveau répertoire. La feature supprime plus de lignes qu'elle n'en ajoute (−148 lignes nettes) et reste dans la topologie existante.

---

## Complexity Tracking

Aucune violation de la Constitution non résolue.

| Décision | Justification |
|---|---|
| `Animated` core RN (pas Reanimated) | La convention CLAUDE.md prescrit Reanimated pour les animations. Exception ici : `shakeAnim` utilise `translateX` avec `useNativeDriver: true` — équivalent de performances, et `Animated.sequence` est plus lisible pour une animation shake en 4 étapes. La CLAUDE.md sera mise à jour pour noter cette exception si le pattern est réutilisé. |
| `TouchableOpacity` conservé dans AdministrationCard | Pré-existant. La CLAUDE.md prescrit `Pressable`, mais changer le wrapper pressable sort du scope de cette feature (risque UX réel sur Android ripple). Noté pour future refactoring. |
