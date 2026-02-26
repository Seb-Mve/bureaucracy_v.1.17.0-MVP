# Quickstart — Fusion Bureau + Recrutement

**Feature**: `005-bureau-recrutement`
**Fichiers modifiés** : `context/GameStateContext.tsx`, `components/AdministrationCard.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/_layout.tsx`
**Fichier créé** : `components/AdminContentSection.tsx`
**Fichier supprimé** : `app/(tabs)/recruitment.tsx`

---

## Étape 1 — Ajouter `getAdminStorageUpgrades` dans `GameStateContext.tsx`

### 1a — Import (déjà présents, vérifier)

```typescript
// Déjà importés depuis @/data/storageLogic :
import { applyStorageCap, canPurchaseStorageUpgrade, getStorageCapAfterUpgrade, isStorageBlocked, getVisibleStorageUpgrades } from '@/data/storageLogic';
// Déjà importé depuis @/data/gameData :
import { ..., storageUpgrades, ... } from '@/data/gameData';
// Déjà importé depuis @/types/game :
import { ..., Upgrade, ... } from '@/types/game';
```

### 1b — Interface `GameContextType`

Ajouter dans la section `// Storage cap system methods` :

```typescript
/** Retourne les upgrades de stockage visibles pour l'administration donnée, avec flag canPurchase. */
getAdminStorageUpgrades: (adminId: string) => (Upgrade & { canPurchase: boolean })[];
```

### 1c — Implémentation (après `purchaseStorageUpgrade`)

```typescript
const getAdminStorageUpgrades = useCallback((adminId: string): (Upgrade & { canPurchase: boolean })[] => {
  const adminIndex = gameState.administrations.findIndex(a => a.id === adminId);
  const visible = getVisibleStorageUpgrades(gameState, storageUpgrades);
  return visible
    .filter(u => u.administrationId === adminIndex + 1)
    .map(u => ({ ...u, canPurchase: canPurchaseStorageUpgrade(gameState, storageUpgrades, u.id) }));
}, [gameState]);
```

### 1d — Provider value

Ajouter `getAdminStorageUpgrades,` dans l'objet passé à `GameContext.Provider`.

---

## Étape 2 — Modifier `components/AdministrationCard.tsx`

### 2a — Imports à ajouter

```typescript
import React, { useRef } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text, Animated } from 'react-native';
```

### 2b — Shake ref (juste avant le return)

```typescript
const shakeAnim = useRef(new Animated.Value(0)).current;

const triggerShake = () => {
  Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
  ]).start();
};

const handlePress = () => {
  onPress();
  if (!administration.isUnlocked) {
    if (isUnlockable) handleUnlock();
    else triggerShake();
  }
};
```

### 2c — JSX : wrapper Animated.View + nameRow + pastille

```tsx
// Avant (retour du composant) :
return (
  <TouchableOpacity
    style={[styles.container, isActive && styles.activeContainer]}
    onPress={administration.isUnlocked ? onPress : undefined}
    ...
  >
    <Image source={administration.imagePath} style={styles.image} />
    {!administration.isUnlocked && ( ... )}
  </TouchableOpacity>
);

// Après :
return (
  <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={
        administration.isUnlocked
          ? 'Appuyez pour sélectionner cette administration'
          : isUnlockable
          ? 'Appuyez pour débloquer cette administration'
          : 'Ressources insuffisantes pour débloquer'
      }
      accessibilityRole="button"
      accessibilityState={{ selected: isActive, disabled: false }}
    >
      <Image source={administration.imagePath} style={styles.image} />
      <View style={styles.nameRow}>
        <Text style={styles.nameText} numberOfLines={1}>{administration.name}</Text>
      </View>
      {!administration.isUnlocked && (
        <View style={styles.lockedOverlay}>
          {/* contenu inchangé */}
        </View>
      )}
      {isUnlockable && !administration.isUnlocked && (
        <View style={styles.unlockableBadge} accessibilityLabel="Débloquable">
          <Text style={styles.unlockableBadgeText}>!</Text>
        </View>
      )}
    </TouchableOpacity>
  </Animated.View>
);
```

### 2d — Styles à modifier / ajouter

```typescript
// Modifier :
container: {
  width: 300,
  // height: 200 → SUPPRIMER (la hauteur est maintenant auto : image 200 + nameRow 44)
  marginHorizontal: 10,
  borderRadius: 12,
  backgroundColor: Colors.background,
  overflow: 'hidden',
},
// Modifier image pour avoir une hauteur fixe :
image: {
  width: '100%',
  height: 200,          // ← explicite (était height: '100%')
  resizeMode: 'cover',
},

// Ajouter :
nameRow: {
  height: 44,
  paddingHorizontal: 12,
  justifyContent: 'center',
  backgroundColor: Colors.background,
},
nameText: {
  fontFamily: 'Inter-Bold',
  fontSize: 14,
  color: Colors.title,
},
unlockableBadge: {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: Colors.success,
  alignItems: 'center',
  justifyContent: 'center',
},
unlockableBadgeText: {
  color: 'white',
  fontFamily: 'Inter-Bold',
  fontSize: 14,
},
```

---

## Étape 3 — Créer `components/AdminContentSection.tsx`

Créer le fichier avec ce contenu :

```tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AgentItem from './AgentItem';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { Lock, Package } from 'lucide-react-native';

export default function AdminContentSection() {
  const {
    gameState,
    canUnlockAdministration,
    unlockAdministration,
    formatNumber,
    purchaseStorageUpgrade,
    getAdminStorageUpgrades,
  } = useGameState();

  const { administrations, activeAdministrationId } = gameState;
  const activeAdministration = administrations.find(a => a.id === activeAdministrationId);

  if (!activeAdministration) return null;

  // Administration verrouillée snappée au centre
  if (!activeAdministration.isUnlocked) {
    const canUnlock = canUnlockAdministration(activeAdministration.id);
    return (
      <View style={styles.lockedContent}>
        <Lock size={32} color={Colors.textLight} />
        <Text style={styles.lockedTitle}>Administration verrouillée</Text>
        <Text style={styles.lockedSubtitle}>
          {canUnlock
            ? 'Ressources disponibles pour débloquer cette administration.'
            : 'Ressources insuffisantes pour débloquer cette administration.'}
        </Text>
        {Object.entries(activeAdministration.unlockCost).map(([resource, amount]) => (
          <Text key={resource} style={[
            styles.lockedCost,
            { color: canUnlock ? Colors.success : Colors.error }
          ]}>
            {formatNumber(amount ?? 0)} {resource}
          </Text>
        ))}
        {canUnlock && (
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={() => unlockAdministration(activeAdministration.id)}
            accessibilityLabel={`Débloquer ${activeAdministration.name}`}
            accessibilityRole="button"
          >
            <Text style={styles.unlockButtonText}>Débloquer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Administration débloquée : upgrades + agents
  const upgrades = getAdminStorageUpgrades(activeAdministration.id);

  return (
    <View style={styles.container}>
      {upgrades.length > 0 && (
        <View style={styles.upgradesSection}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={Colors.storageCapped} />
            <Text style={styles.sectionTitle}>Déblocages de Stockage</Text>
          </View>
          {upgrades.map((upgrade) => (
            <View key={upgrade.id} style={[
              styles.upgradeCard,
              !upgrade.canPurchase && styles.upgradeCardDisabled
            ]}>
              <View style={styles.upgradeHeader}>
                <Text style={styles.upgradeName}>{upgrade.name}</Text>
                <Text style={[styles.upgradeCost, { color: upgrade.canPurchase ? Colors.success : Colors.error }]}>
                  {formatNumber(upgrade.cost.formulaires ?? 0)} formulaires
                </Text>
              </View>
              <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
              <Text style={styles.upgradeEffect}>{upgrade.effect}</Text>
              <TouchableOpacity
                style={[styles.purchaseButton, !upgrade.canPurchase && styles.purchaseButtonDisabled]}
                onPress={() => { if (upgrade.canPurchase) purchaseStorageUpgrade(upgrade.id); }}
                disabled={!upgrade.canPurchase}
                accessibilityLabel={
                  upgrade.canPurchase
                    ? `Acheter ${upgrade.name} pour ${formatNumber(upgrade.cost.formulaires ?? 0)} formulaires`
                    : `${upgrade.name} non disponible`
                }
                accessibilityRole="button"
              >
                <Text style={[styles.purchaseButtonText, !upgrade.canPurchase && styles.purchaseButtonTextDisabled]}>
                  {upgrade.canPurchase ? 'Acheter' : 'Verrouillé'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.agentsSection}>
        {activeAdministration.agents.map((agent) => (
          <AgentItem
            key={agent.id}
            agent={agent}
            administrationId={activeAdministration.id}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  lockedContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  lockedTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.text,
    marginTop: 8,
  },
  lockedSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedCost: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  unlockButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 25,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  upgradesSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.storageCapped },
  upgradeCard: { backgroundColor: 'white', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.storageCapped, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  upgradeCardDisabled: { borderColor: Colors.border, opacity: 0.6 },
  upgradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  upgradeName: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.text, flex: 1 },
  upgradeCost: { fontFamily: 'Inter-SemiBold', fontSize: 14, marginLeft: 8 },
  upgradeDescription: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.textLight, marginBottom: 6 },
  upgradeEffect: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.text, marginBottom: 10 },
  purchaseButton: { backgroundColor: Colors.buttonPrimary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', minHeight: 44 },
  purchaseButtonDisabled: { backgroundColor: Colors.buttonDisabled },
  purchaseButtonText: { fontFamily: 'Inter-Bold', fontSize: 14, color: 'white' },
  purchaseButtonTextDisabled: { color: Colors.textLight },
  agentsSection: {},
});
```

---

## Étape 4 — Modifier `app/(tabs)/index.tsx`

### 4a — Imports

```typescript
// Supprimer :
import { Administration } from '@/types/game';
import { File, Stamp, ClipboardList, Battery } from 'lucide-react-native';

// Ajouter :
import AdminContentSection from '@/components/AdminContentSection';
```

### 4b — Supprimer fonctions devenues inutiles

Supprimer entièrement : `getResourceIcon()`, `getResourceColor()`, `renderAgentInfo()`.

### 4c — Ajouter handler momentum scroll

```typescript
const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
  const x = event.nativeEvent.contentOffset.x;
  const index = Math.round(x / (300 + 20));
  const admin = administrations[index];
  if (admin) setActiveAdministration(admin.id);
};
```

### 4d — JSX : supprimer le header

```tsx
// Supprimer entièrement ce bloc :
<View style={styles.header}>
  <Text style={styles.activeAdministrationTitle}>
    {activeAdministration?.name || ''}
  </Text>
  <View style={styles.separator} />
</View>
```

### 4e — JSX : ajouter onMomentumScrollEnd au ScrollView horizontal

```tsx
<ScrollView
  ref={scrollViewRef}
  horizontal
  showsHorizontalScrollIndicator={false}
  snapToInterval={300 + 20}
  decelerationRate="fast"
  contentContainerStyle={styles.scrollViewContent}
  onMomentumScrollEnd={handleMomentumScrollEnd}  // ← ajouter
>
```

### 4f — JSX : remplacer additionalContent

```tsx
// Avant :
<View style={styles.additionalContent}>
  {activeAdministration && (
    <View style={styles.administrationSection}>
      {renderAgentInfo(activeAdministration)}
    </View>
  )}
</View>

// Après :
<View style={styles.additionalContent}>
  <AdminContentSection />
</View>
```

### 4g — Styles : supprimer les styles inutilisés

Supprimer : `header`, `activeAdministrationTitle`, `separator`, `administrationSection`, `agentRow`, `agentInfo`, `agentName`, `agentCount`, `productionInfo`.

---

## Étape 5 — Modifier `app/(tabs)/_layout.tsx`

### 5a — Badge Bureau : passer à purchasableAgentsCount

```tsx
// Avant :
<NotificationBadge count={unlockableCount} />

// Après :
<NotificationBadge count={purchasableAgentsCount} />
```

### 5b — Supprimer l'onglet Recrutement

```tsx
// Supprimer entièrement :
<Tabs.Screen
  name="recruitment"
  options={{
    title: 'Recrutement',
    tabBarIcon: ({ color, size }) => (
      <View>
        <Users size={size} color={color} />
        <NotificationBadge count={purchasableAgentsCount} />
      </View>
    ),
  }}
/>
```

### 5c — Nettoyer les imports inutilisés

```typescript
// Supprimer de l'import lucide :
Users  // plus utilisé si aucun autre endroit
```

---

## Étape 6 — Supprimer `app/(tabs)/recruitment.tsx`

```bash
git rm app/(tabs)/recruitment.tsx
```

---

## Étape 7 — Lint

```bash
npm run lint
```

Zéro nouvelle erreur attendue.

---

## Validation manuelle (checklist)

1. **Barre d'onglets** → « Bureau », « Progression », « Options » — pas de « Recrutement ».
2. **Swipe cartes** (doigt, pas de tap) → au snap, le nom sur la carte et les agents en dessous correspondent à la même administration.
3. **Tap carte unlocked** → scroll animé vers la carte + agents mis à jour.
4. **Tap carte locked** (ressources OK) → déverrouillage.
5. **Tap carte locked** (ressources insuffisantes) → animation tremblement, pas de toast.
6. **Carte locked snappée au centre** → liste = message + coût + bouton Débloquer (pas les agents).
7. **Acheter un agent** depuis l'onglet Bureau → compteur augmente.
8. **Upgrade de stockage disponible** → visible au dessus des agents pour l'admin concernée.
9. **Badge onglet Bureau** → reflète le nombre d'agents recrutables.
10. **Pastille "!"** sur carte débloquable → visible sur la carte dans le scroll.
11. **Bouton Tamponner** → accessible en haut et en bas de scroll.
