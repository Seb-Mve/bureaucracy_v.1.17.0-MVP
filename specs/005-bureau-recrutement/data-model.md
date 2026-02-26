# Data Model & Component Design: Fusion Bureau + Recrutement

**Feature**: `005-bureau-recrutement`
**Date**: 2026-02-26

---

## Aucun changement d'état persisté

Aucun nouveau champ dans `GameState`. Aucune migration de schema requise. Les champs existants suffisent :

| Champ | Utilisé par | Rôle |
|---|---|---|
| `administrations[].isUnlocked` | AdministrationCard, AdminContentSection | Affichage verrouillé/déverrouillé |
| `activeAdministrationId` | index.tsx, AdminContentSection | Admin actuellement active |
| `administrations[].agents[].owned` | AgentItem | Compteur d'agents |
| Upgrades de stockage | GameStateContext | Via `purchaseStorageUpgrade` existant |

---

## Nouvelle méthode contexte — `GameStateContext.tsx`

### `getAdminStorageUpgrades(adminId: string): (Upgrade & { canPurchase: boolean })[]`

Remplace les imports directs `/data` dans l'ancien `recruitment.tsx`. Respecte Principe V.

```typescript
// Interface
getAdminStorageUpgrades: (adminId: string) => (Upgrade & { canPurchase: boolean })[];

// Implémentation (useCallback)
const getAdminStorageUpgrades = useCallback((adminId: string) => {
  const adminIndex = gameState.administrations.findIndex(a => a.id === adminId);
  const visible = getVisibleStorageUpgrades(gameState, storageUpgrades);
  return visible
    .filter(u => u.administrationId === adminIndex + 1)
    .map(u => ({ ...u, canPurchase: canPurchaseStorageUpgrade(gameState, storageUpgrades, u.id) }));
}, [gameState]);
```

Ajout dans `provider value` : `getAdminStorageUpgrades,`

---

## Nouveau composant — `components/AdminContentSection.tsx`

### Rôle

Contenu vertical sous les cartes d'illustration dans `index.tsx`. Remplace `renderAgentInfo()`.

### Props

Aucune prop — le composant appelle `useGameState()` lui-même.

### État interne

Aucun état local.

### Logique de rendu

```
activeAdministration = administrations.find(id === activeAdministrationId)

Si !activeAdministration → null

Si !activeAdministration.isUnlocked :
  → Vue "Administration verrouillée"
       Message d'explication
       Bouton "Débloquer" (si canUnlockAdministration → appelle unlockAdministration)
       Coût de déverrouillage (texte)

Sinon :
  → upgrades = getAdminStorageUpgrades(activeAdministration.id)
     Si upgrades.length > 0 :
       Section "Déblocages de Stockage"
       UpgradeCard × N (via inline JSX ou sous-composant)

     Section agents :
       AgentItem × N (activeAdministration.agents.map)
```

### Dépendances contexte

```typescript
const {
  gameState,
  canUnlockAdministration,
  unlockAdministration,
  formatNumber,
  purchaseStorageUpgrade,
  getAdminStorageUpgrades,
} = useGameState();
```

---

## Modifications — `components/AdministrationCard.tsx`

### Nouvelles props

Aucune prop supplémentaire. `administration.name` est déjà disponible via la prop `administration`.

### Nouveau state / ref

```typescript
const shakeAnim = useRef(new Animated.Value(0)).current;
```

### Fonctions ajoutées

```typescript
const triggerShake = () => {
  Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
  ]).start();
};

const handlePress = () => {
  onPress(); // toujours : scroll + setActiveAdministration dans le parent
  if (!administration.isUnlocked) {
    if (isUnlockable) handleUnlock();
    else triggerShake();
  }
};
```

### Structure JSX modifiée

```
Animated.View (translateX: shakeAnim) ← remplace TouchableOpacity racine
  TouchableOpacity (onPress: handlePress, toujours actif)
    Image (height: 200 explicit)
    View nameRow (height: 44, paddingHorizontal: 12, justifyContent: center)
      Text administration.name
    Si !isUnlocked:
      View lockedOverlay (absoluteFill)
        Lock icon
        Coût + bouton Débloquer
    Si isUnlockable && !isUnlocked:
      View unlockableBadge (absolu, top-right)
        Text "!"
```

### Styles ajoutés

| Style | Valeur |
|---|---|
| `nameRow` | `height: 44, paddingHorizontal: 12, justifyContent: center, backgroundColor: Colors.background` |
| `nameText` | `fontFamily: Inter-Bold, fontSize: 14, color: Colors.title` |
| `unlockableBadge` | `position: absolute, top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.success, alignItems: center, justifyContent: center` |
| `unlockableBadgeText` | `color: white, fontFamily: Inter-Bold, fontSize: 14` |

### Hauteur carte

Avant : `height: 200` (image seule)
Après : Image `height: 200` + nameRow `height: 44` = `244` total

**Impact sur snapToInterval** : Le snap est horizontal (largeur), pas vertical → `snapToInterval = 320` inchangé. ✅

---

## Modifications — `app/(tabs)/index.tsx`

### Imports supprimés

```typescript
// Supprimer :
import { Administration } from '@/types/game'; // plus utilisé
import { File, Stamp, ClipboardList, Battery } from 'lucide-react-native'; // renderAgentInfo supprimé
```

### Imports ajoutés

```typescript
import AdminContentSection from '@/components/AdminContentSection';
```

### Handler ajouté

```typescript
const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
  const x = event.nativeEvent.contentOffset.x;
  const index = Math.round(x / (300 + 20));
  const admin = administrations[index];
  if (admin) setActiveAdministration(admin.id);
};
```

### JSX : suppressions

- Bloc `<View style={styles.header}>` (titre + séparateur) → supprimé
- `renderAgentInfo` function → supprimée
- `getResourceIcon`, `getResourceColor` functions → supprimées
- `activeAdministration` local variable (pour renderAgentInfo) → supprimée

### JSX : modifications

```tsx
// ScrollView horizontal : ajouter onMomentumScrollEnd
<ScrollView
  ref={scrollViewRef}
  horizontal
  ...
  onMomentumScrollEnd={handleMomentumScrollEnd}
>

// additionalContent : remplacer renderAgentInfo par AdminContentSection
<View style={styles.additionalContent}>
  <AdminContentSection />
</View>
```

---

## Modifications — `app/(tabs)/_layout.tsx`

### Badge Bureau

```typescript
// Avant :
<NotificationBadge count={unlockableCount} />

// Après :
<NotificationBadge count={purchasableAgentsCount} />
```

### Suppression onglet Recrutement

```tsx
// Supprimer entièrement :
<Tabs.Screen
  name="recruitment"
  options={{ ... }}
/>
```

`unlockableCount` reste calculé (utilisé potentiellement pour debug) mais peut aussi être retiré si inutilisé après.

---

## Fichier supprimé

`app/(tabs)/recruitment.tsx` → supprimé (fonctionnalité intégrée dans `index.tsx` + `AdminContentSection.tsx`).

---

## Résumé des fichiers

| Fichier | Action | Lignes avant | Lignes après |
|---|---|---|---|
| `data/conformiteLogic.ts` | — | — | — |
| `context/GameStateContext.tsx` | MODIFY | ~1190 | ~1215 (+25) |
| `components/AdministrationCard.tsx` | MODIFY | 155 | ~210 |
| `components/AdminContentSection.tsx` | CREATE | — | ~170 |
| `app/(tabs)/index.tsx` | MODIFY | 225 | ~165 |
| `app/(tabs)/_layout.tsx` | MODIFY | 189 | ~175 |
| `app/(tabs)/recruitment.tsx` | DELETE | 343 | — |

**Bilan** : -343 lignes (suppression) + ~195 lignes (nouveau code) = **-148 lignes nettes**. Toutes les composantes restent sous 300 lignes. ✅
