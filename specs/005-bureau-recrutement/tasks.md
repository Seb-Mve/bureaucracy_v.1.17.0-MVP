# Tasks: Fusion Bureau + Recrutement

**Input**: Design documents from `/specs/005-bureau-recrutement/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · quickstart.md ✅

---

## Phase 1 : Fondationnel (bloquant)

**But** : Méthode contexte requise avant tout composant qui accède aux storage upgrades.

**⚠️ CRITIQUE** : T001 doit être terminé avant d'aborder US1 ou US3.

- [ ] T001 `getAdminStorageUpgrades` dans `context/GameStateContext.tsx` — ajouter la méthode au type `GameContextType`, implémenter avec `useCallback`, exposer dans `provider value`. Voir quickstart.md étape 1 pour le code exact.

**Checkpoint** : `useGameState().getAdminStorageUpgrades` appelable depuis n'importe quel composant.

---

## Phase 2 : US2 — Nom + illustration synchronisés (P1)

**But** : Lier le nom de l'administration à sa carte et détecter le snap manuel.

**Test partiel** : Swiper les cartes sans tapper → en fin de geste, la carte centrée est active (l'admin active est mise à jour). Tapper une carte → scroll + setActive. Le nom visible sur chaque carte correspond à l'administration.

**Test complet** (nécessite US1 terminé) : Après un swipe, les agents listés en dessous correspondent à la carte centrée.

- [ ] T002 [US2] `components/AdministrationCard.tsx` — ajouter `nameRow` sous l'image : `View` height 44, `Text` avec `administration.name`, styles `nameRow` + `nameText` (Inter-Bold 14, Colors.title). La hauteur totale de la carte passe à 244. `snapToInterval` inchangé (largeur).
- [ ] T003 [P][US2] `components/AdministrationCard.tsx` — refactoriser `onPress` : remplacer `onPress={administration.isUnlocked ? onPress : undefined}` par `handlePress` toujours actif. `handlePress` appelle toujours `onPress()` (scroll + setActive), puis gère l'unlock si nécessaire (si `isUnlockable` → `handleUnlock()`, sinon → rien pour l'instant — le shake arrive en US3).
- [ ] T004 [US2] `app/(tabs)/index.tsx` — ajouter `onMomentumScrollEnd` sur le `ScrollView` horizontal (`Math.round(x / (300 + 20))` → index → `setActiveAdministration`) + supprimer le `<View style={styles.header}>` (titre texte séparé + séparateur) + supprimer les imports devenus inutilisés (`Administration` type, icônes File/Stamp/ClipboardList/Battery).

**Checkpoint** : Swipe → nom sur carte + admin active synchronisés. Tap sur carte → scroll + setActive. Header titre séparé disparu.

---

## Phase 3 : US1 — Onglet unique (P1)

**But** : Les agents recrutables et la navigation fusionnée. L'onglet Recrutement disparaît.

**Test indépendant** : L'onglet Recrutement n'existe plus dans la barre de navigation. Depuis l'onglet Bureau, on peut acheter un agent (voir son coût, tapper le bouton d'achat, voir le compteur augmenter). La ResourceBar n'apparaît qu'une seule fois.

- [ ] T005 [US1] Créer `components/AdminContentSection.tsx` — composant sans props qui appelle `useGameState()`. Pour une admin active déverrouillée : afficher `AgentItem × N` (`activeAdministration.agents.map`). Pour l'instant, ignorer les admins verrouillées (US3) et les storage upgrades (US3). Voir quickstart.md étape 3 pour la structure complète.
- [ ] T006 [US1] `app/(tabs)/index.tsx` — remplacer le contenu de `<View style={styles.additionalContent}>` par `<AdminContentSection />` + supprimer les fonctions `renderAgentInfo`, `getResourceIcon`, `getResourceColor` + ajouter `import AdminContentSection`. Dépend T005.
- [ ] T007 [US1] `app/(tabs)/_layout.tsx` — supprimer entièrement le `<Tabs.Screen name="recruitment" .../>` + remplacer `<NotificationBadge count={unlockableCount} />` sur l'onglet Bureau par `<NotificationBadge count={purchasableAgentsCount} />`.
- [ ] T008 [US1] Supprimer `app/(tabs)/recruitment.tsx`. Dépend T007 (route supprimée du layout d'abord).

**Checkpoint** : Barre de navigation = Bureau · Progression · Options. Agents visibles + achetables depuis Bureau. ResourceBar une seule fois.

---

## Phase 4 : US3 — Admins verrouillées + upgrades stockage (P2)

**But** : Aucune fonctionnalité de l'ancien Recrutement n'est perdue. Dépend T001 et T005.

**Test indépendant** : Avoir une admin verrouillée → carte affiche cadenas + coût → tapper avec les ressources → admin déverrouillée. Admin verrouillée snappée → message + bouton dans le bas de page. Upgrade stockage disponible → visible au-dessus des agents.

- [ ] T009 [US3] `components/AdminContentSection.tsx` — ajouter la branche admin verrouillée : si `!activeAdministration.isUnlocked` → afficher message d'explication + coût de déverrouillage + bouton « Débloquer » (`canUnlockAdministration` → `unlockAdministration`). Dépend T005.
- [ ] T010 [US3] `components/AdminContentSection.tsx` — ajouter section storage upgrades : appeler `getAdminStorageUpgrades(activeAdministration.id)` → si `upgrades.length > 0` → section « Déblocages de Stockage » + `UpgradeCard × N` au-dessus des `AgentItem`. Dépend T009 et T001.
- [ ] T011 [P][US3] `components/AdministrationCard.tsx` — ajouter shake animation : `shakeAnim = useRef(new Animated.Value(0)).current`, `triggerShake()` (`Animated.sequence` 4 étapes sur translateX, `useNativeDriver: true`), appeler depuis `handlePress` quand `!isUnlocked && !isUnlockable`. Enrouler le `TouchableOpacity` racine dans un `Animated.View` avec `transform: [{ translateX: shakeAnim }]`.
- [ ] T012 [P][US3] `components/AdministrationCard.tsx` — ajouter pastille unlockable : `<View style={styles.unlockableBadge}>` positionné `absolute top:8 right:8`, visible uniquement si `isUnlockable && !isUnlocked`, contient `<Text>!</Text>` (couleur + texte — respect AR-002). Styles `unlockableBadge` + `unlockableBadgeText`.

**Checkpoint** : Toutes les fonctionnalités de l'ancien onglet Recrutement accessibles dans Bureau. Shake sur carte non-débloquable. Pastille "!" sur carte débloquable.

---

## Phase 5 : Polish

- [ ] T013 `npm run lint` → zéro erreur. Puis parcourir la checklist 11 points de `specs/005-bureau-recrutement/quickstart.md` (étape 7). Corriger tout écart.

---

## Dépendances & ordre d'exécution

```
T001 (fondationnel)
 ├─→ T005 (AdminContentSection base)
 │    ├─→ T006 (index.tsx: remplacer renderAgentInfo)
 │    ├─→ T009 (AdminContentSection: vue verrouillée)
 │    │    └─→ T010 (AdminContentSection: storage upgrades) ← dépend aussi T001
 │
T002 (AdministrationCard: nameRow)           [P avec T003]
T003 (AdministrationCard: handlePress)       [P avec T002]
T004 (index.tsx: onMomentumScrollEnd + header)
T007 (_layout.tsx: supprimer onglet + badge)
 └─→ T008 (supprimer recruitment.tsx)
T011 (AdministrationCard: shake)             [P avec T012]
T012 (AdministrationCard: pastille)          [P avec T011]
T013 (lint + checklist) ← dépend tout
```

### Opportunités parallèles

- **T002 + T003** : même fichier, sections distinctes — peuvent être dans le même commit
- **T007 + T008** : T007 d'abord (retirer du layout), puis T008 (supprimer le fichier)
- **T011 + T012** : même fichier `AdministrationCard.tsx`, sections distinctes — peuvent être dans le même commit
- **US2 (T002-T004)** et **Phase 1 (T001)** : fichiers entièrement distincts — peuvent démarrer en parallèle

### Stratégie recommandée (développeur seul)

1. T001 → fondation prête
2. T002 + T003 + T004 → US2 partielle testable (nom sur carte + snap)
3. T005 + T006 → US1 testable (agents dans Bureau)
4. T007 + T008 → navigation finale (onglet Recrutement supprimé)
5. T009 + T010 → US3 (verrouillées + storage upgrades)
6. T011 + T012 → polish UX (shake + pastille)
7. T013 → lint + validation

---

## Notes

- `[P]` = peut être commité en même temps qu'un autre `[P]` du même groupe (fichiers distincts ou sections non-conflictuelles)
- `[US1/2/3]` = tracabilité vers la user story du spec
- Pas de suite de tests automatisés — validation manuelle via simulateur iOS/Android ou browser (`npm run dev` → `w`)
- Committer après chaque tâche ou groupe logique (T007+T008 ensemble, T011+T012 ensemble)
- Quickstart.md est la référence d'implémentation — consulter pour chaque tâche
