# Research: Modale de Réaffectation Différée

**Feature**: `004-reaffectation-modal`
**Date**: 2026-02-25

## Finding 1 — Patron Modal existant : `PrestigeShopModal`

**Decision**: Utiliser `Modal` de React Native avec `transparent={true}` et `animationType="fade"`, style dialogue centré (overlay sombre).

**Rationale**: `PrestigeShopModal` utilise déjà `Modal` de RN — c'est le patron établi. Différence : `PrestigeShopModal` utilise `presentationStyle="pageSheet"` (plein écran), mais la réaffectation est une **décision binaire bloquante** qui appelle un style dialogue centré (overlay semi-transparent + card). `onRequestClose={() => {}}` rend la modale non-dismissible sur Android (bouton retour inactif). `transparent={true}` + overlay sombre permet le style dialogue.

**Alternatives considered**: `presentationStyle="pageSheet"` (même pattern que PrestigeShopModal) — rejeté, trop imposant pour un choix binaire. Layer custom sans `Modal` — rejeté, `Modal` natif gère les edge cases Android/iOS (geste retour, accessibilité).

---

## Finding 2 — Animation de la barre : `Animated` core RN avec `useNativeDriver: false`

**Decision**: `Animated.Value` de `react-native` (non `react-native-reanimated`) + `useNativeDriver: false` pour animer `width`. Guard `isAnimatingRef` pour bloquer les mises à jour du game tick pendant les 300 ms de l'animation.

**Rationale**: `width` est une propriété de layout — elle ne peut pas utiliser `useNativeDriver: true`. `StampButton` utilise déjà `Animated` de RN pour les transforms. Pour la barre de conformité, `Animated.timing` avec `useNativeDriver: false` est la solution minimale et sans nouvelle dépendance. Les composants plus complexes (`JournalDrawer`, `MenuBottomSheet`) utilisent `react-native-reanimated` pour des animations multi-propriétés — inutile ici pour une seule valeur de largeur.

Le guard `isAnimatingRef` (ref booléen, non état React) empêche les appels `setValue()` du `useEffect` de game-tick d'interrompre l'animation de 300 ms. Après `.start()`, le flag est réinitialisé et le game tick reprend la synchronisation normale.

**Alternatives considered**: `react-native-reanimated` avec `useSharedValue` + `withTiming` — valide mais over-engineered pour une seule animation de 300 ms sur un seul composant. `LayoutAnimation.configureNext()` — plus simple mais anime toutes les vues du rendu suivant (risque d'effets visuels non souhaités sur la fermeture de modale).

---

## Finding 3 — Composant séparé `ReaffectationModal.tsx`

**Decision**: Nouveau fichier `components/ReaffectationModal.tsx`, props `{ visible, onAccept, onRefuse }`, état interne `showComingSoon: boolean`.

**Rationale**: `ConformiteDisplay.tsx` est actuellement à ~215 lignes (après les modifications récentes). Inliner la modale le porterait à ~300+ lignes — à la limite Constitution Principle II. La modale a une responsabilité distincte (afficher un choix binaire). Patron cohérent avec `PrestigeShopModal` qui est aussi un composant autonome importé par son parent.

**Alternatives considered**: Inliner dans `ConformiteDisplay.tsx` — rejeté, surcharge le composant et réduit la testabilité.

---

## Finding 4 — Logique pure dans `conformiteLogic.ts`

**Decision**: Deux nouvelles fonctions exportées :
- `getReaffectationResetPercentage(): number` → `Math.floor(Math.random() * 43) + 23` → [23, 65]
- `getAccumulatedFormulairesForPercentage(targetPct: number): number` → somme des coûts de 0 à targetPct−1

**Rationale**: Constitution Principle V — la génération du seuil aléatoire et le recalcul de `accumulatedFormulaires` sont de la logique métier, pas de la logique d'état ni de la présentation. Ces fonctions doivent vivre dans `/data`. `getReaffectationResetPercentage` encapsule la règle métier [23, 65]. `getAccumulatedFormulairesForPercentage` réutilise `getFormulairesRequiredForNextPercent` existante.

**Alternatives considered**: Inliner `Math.random()` dans le context — rejeté, non testable et non conforme Principle V. Stocker le seuil dans `GameState` — rejeté, information éphémère non persistée.

---

## Finding 5 — Action contexte `refuseReaffectation(): number`

**Decision**: Ajouter `refuseReaffectation(): number` dans `GameContextType` et `GameStateProvider`. L'action génère le seuil, recalcule `accumulatedFormulaires`, met à jour l'état, et **retourne le nouveau pourcentage** pour permettre au composant de déclencher l'animation.

**Rationale**: Constitution Principle V — les mutations d'état passent par le contexte, jamais par les composants. Retourner le nouveau pourcentage permet au composant de connaître la valeur cible de l'animation sans avoir à lire `gameState` de façon asynchrone (la mise à jour d'état React est asynchrone).

**Alternatives considered**: `refuseReaffectation()` sans valeur de retour + lecture de `conformiteDisplayPercentage` dans un `useEffect` — rejeté, race condition entre l'animation et la mise à jour d'état. Passer le pourcentage cible comme paramètre depuis le composant — rejeté, viole Principle V (la logique métier resterait dans le composant).
