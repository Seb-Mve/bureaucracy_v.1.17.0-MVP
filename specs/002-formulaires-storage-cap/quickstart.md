# Quickstart: Limite de Stockage des Formulaires

**Date**: 2025-01-24  
**Branch**: `002-formulaires-storage-cap`  
**Audience**: Développeurs rejoignant le projet ou implémentant cette feature

Ce document permet de démarrer rapidement l'implémentation de la feature en comprenant l'architecture et les points d'intégration.

---

## 🎯 Vue d'ensemble en 60 secondes

Cette feature introduit un **plafond de stockage** des formulaires avec 4 upgrades séquentiels pour le débloquer :

1. **Blocage visuel** : Compteur rouge clignotant quand `formulaires >= currentStorageCap`
2. **Déblocage payant** : Acheter un upgrade = sacrifier tout son stock pour augmenter la limite
3. **Ordre strict** : Admin 2 → Admin 3 → Admin 4 → Admin 5 (séquence forcée)
4. **Plafond strict** : Surplus automatique définitivement perdu

**Impact utilisateur** : Crée une barrière de progression intentionnelle forçant des choix stratégiques.

---

## 📁 Fichiers Modifiés / Créés

### ✅ Créer (nouveaux)

```
data/storageLogic.ts         # Logique pure (isStorageBlocked, canPurchaseStorageUpgrade, etc.)
```

### 🔧 Modifier (existants)

```
types/game.ts                # Ajout currentStorageCap + extension type Upgrade
data/gameData.ts             # 4 nouveaux upgrades storage + initialGameState.currentStorageCap
context/GameStateContext.tsx # Méthode purchaseStorageUpgrade() + application cap dans game loop
utils/stateMigration.ts      # Migration V3→V4 pour currentStorageCap
components/ResourceCounter.tsx # Animation clignotement rouge si isStorageBlocked
constants/Colors.ts          # Constante RED_BLOCKED = '#FF0000'
app/(tabs)/recruitment.tsx   # Filtrage visibilité upgrades storage (getVisibleStorageUpgrades)
```

---

## 🏗️ Architecture (Séparation des Couches)

```
┌─────────────────────────────────────────────────────┐
│ PRESENTATION (app/, components/)                    │
│ ├── app/(tabs)/index.tsx        → Affiche compteur │
│ ├── app/(tabs)/recruitment.tsx  → Affiche upgrades │
│ └── components/ResourceCounter   → Clignotement UI │
└────────────┬────────────────────────────────────────┘
             │ useGameState() hook
┌────────────▼────────────────────────────────────────┐
│ STATE (context/)                                    │
│ └── GameStateContext.tsx                            │
│     ├── currentStorageCap: number | null            │
│     ├── purchaseStorageUpgrade(id: string)          │
│     └── game loop avec applyStorageCap()            │
└────────────┬────────────────────────────────────────┘
             │ appelle fonctions pures
┌────────────▼────────────────────────────────────────┐
│ LOGIC (data/)                                       │
│ ├── storageLogic.ts (NOUVEAU)                       │
│ │   ├── isStorageBlocked(state)                     │
│ │   ├── canPurchaseStorageUpgrade(state, id)        │
│ │   ├── applyStorageCap(stock, cap)                 │
│ │   └── getVisibleStorageUpgrades(state)            │
│ └── gameData.ts                                     │
│     └── 4 storage upgrades (Admin 2-5)              │
└─────────────────────────────────────────────────────┘
```

**Règle d'or** : Les composants NE DOIVENT JAMAIS importer directement depuis `/data`. Toujours passer par le Context.

---

## 🚀 Étapes d'Implémentation

### Étape 1 : Types & Constantes (10 min)

**Fichier**: `types/game.ts`
```typescript
// Ajouter dans interface GameState
currentStorageCap: number | null; // 983 initial, null = illimité

// Modifier interface Upgrade
type: 'agent' | 'production' | 'storage'; // ajouter 'storage'
storageConfig?: {
  newCap: number | null;
  requiredUpgradeId?: string;
  sequenceIndex: number;
};
```

**Fichier**: `constants/Colors.ts`
```typescript
export const RED_BLOCKED = '#FF0000';
```

---

### Étape 2 : Données (15 min)

**Fichier**: `data/gameData.ts`

Ajouter dans `initialGameState` :
```typescript
currentStorageCap: 983,
```

Ajouter 4 upgrades dans la liste des upgrades existants (voir `data-model.md` pour structure complète) :
```typescript
{
  id: 'storage_upgrade_1',
  name: 'Casier de Secours B-9',
  description: 'Un espace de rangement supplémentaire découvert lors d\'un audit oublié.',
  cost: { formulaires: 983 },
  effect: 'Augmente la capacité de stockage à 1 983 formulaires',
  type: 'storage',
  isPurchased: false,
  administrationId: 2,
  storageConfig: { newCap: 1983, sequenceIndex: 0 }
},
// ... (répéter pour storage_upgrade_2, _3, _4)
```

---

### Étape 3 : Logique Pure (30 min)

**Fichier**: `data/storageLogic.ts` (CRÉER)

Implémenter les 6 fonctions définies dans `contracts/storage-logic-api.md` :

```typescript
import { GameState, Upgrade } from '@/types/game';
import { getAllUpgrades } from './gameData'; // helper existant

export function isStorageBlocked(state: GameState): boolean {
  if (state.currentStorageCap === null) return false;
  return state.resources.formulaires >= state.currentStorageCap;
}

export function canPurchaseStorageUpgrade(
  state: GameState, 
  upgradeId: string
): boolean {
  const upgrade = getAllUpgrades().find(u => u.id === upgradeId);
  if (!upgrade || upgrade.type !== 'storage') return false;
  
  // Vérifier séquence
  if (upgrade.storageConfig?.requiredUpgradeId) {
    const required = getAllUpgrades().find(
      u => u.id === upgrade.storageConfig!.requiredUpgradeId
    );
    if (!required?.isPurchased) return false;
  }
  
  // Vérifier coût
  return state.resources.formulaires >= (upgrade.cost.formulaires ?? 0);
}

// ... (implémenter les 4 autres fonctions, voir contracts/storage-logic-api.md)
```

**✅ Checkpoint** : Tester manuellement dans une console Node.js ou un fichier test temporaire.

---

### Étape 4 : Context (20 min)

**Fichier**: `context/GameStateContext.tsx`

**Modification 1** : Ajouter la méthode d'achat
```typescript
import { 
  canPurchaseStorageUpgrade, 
  applyStorageCap 
} from '@/data/storageLogic';

const purchaseStorageUpgrade = useCallback((upgradeId: string) => {
  setGameState(prev => {
    if (!canPurchaseStorageUpgrade(prev, upgradeId)) {
      console.warn('[StorageUpgrade] Cannot purchase:', upgradeId);
      return prev;
    }
    
    const upgrade = getAllUpgrades().find(u => u.id === upgradeId);
    if (!upgrade || !upgrade.storageConfig) return prev;
    
    // Transaction atomique
    return {
      ...prev,
      resources: {
        ...prev.resources,
        formulaires: 0 // reset immédiat
      },
      currentStorageCap: upgrade.storageConfig.newCap,
      upgrades: prev.upgrades.map(u => 
        u.id === upgradeId ? { ...u, isPurchased: true } : u
      )
    };
  });
}, []);
```

**Modification 2** : Appliquer le cap dans le game loop
```typescript
// Dans le useEffect du game loop (existant)
setInterval(() => {
  setGameState(prev => {
    const production = calculateAutoProduction(prev, deltaMs);
    const newStock = prev.resources.formulaires + production;
    const cappedStock = applyStorageCap(newStock, prev.currentStorageCap);
    
    return {
      ...prev,
      resources: {
        ...prev.resources,
        formulaires: cappedStock
      }
    };
  });
}, 100);
```

**Modification 3** : Exporter la méthode
```typescript
return (
  <GameStateContext.Provider value={{
    gameState,
    // ... autres méthodes existantes
    purchaseStorageUpgrade,
  }}>
    {children}
  </GameStateContext.Provider>
);
```

---

### Étape 5 : Migration (10 min)

**Fichier**: `utils/stateMigration.ts`

Ajouter la migration V3→V4 :
```typescript
function migrateV3toV4(state: any): GameState {
  return {
    ...state,
    currentStorageCap: state.currentStorageCap ?? 983, // fallback
    version: 4
  };
}

// Mettre à jour LATEST_VERSION
export const LATEST_VERSION = 4;

// Ajouter dans la chaîne de migrations
export function migrateGameState(state: any): GameState {
  let migrated = state;
  
  if (migrated.version < 2) migrated = migrateV1toV2(migrated);
  if (migrated.version < 3) migrated = migrateV2toV3(migrated);
  if (migrated.version < 4) migrated = migrateV3toV4(migrated); // NOUVEAU
  
  return migrated;
}
```

---

### Étape 6 : UI - Compteur (20 min)

**Fichier**: `components/ResourceCounter.tsx`

Ajouter animation clignotement :
```typescript
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming 
} from 'react-native-reanimated';
import { isStorageBlocked } from '@/data/storageLogic';
import { useGameState } from '@/context/GameStateContext';
import { RED_BLOCKED } from '@/constants/Colors';

export function ResourceCounter() {
  const { gameState } = useGameState();
  const opacity = useSharedValue(1);
  
  const blocked = isStorageBlocked(gameState);
  
  useEffect(() => {
    if (blocked) {
      opacity.value = withRepeat(
        withTiming(0, { duration: 250 }), // 2Hz (500ms total)
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1, { duration: 0 }); // arrêt immédiat
    }
  }, [blocked]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <Text style={{ 
        color: blocked ? RED_BLOCKED : 'black',
        fontSize: 18,
        fontWeight: 'bold'
      }}>
        {formatNumber(gameState.resources.formulaires)}
      </Text>
    </Animated.View>
  );
}
```

**Accessibilité** : Ajouter label pour lecteurs d'écran
```typescript
<Animated.View 
  style={animatedStyle}
  accessibilityLabel={
    blocked 
      ? `Stock de formulaires bloqué à ${gameState.currentStorageCap}, capacité maximale atteinte`
      : `${gameState.resources.formulaires} formulaires`
  }
>
```

---

### Étape 7 : UI - Upgrades (15 min)

**Fichier**: `app/(tabs)/recruitment.tsx`

Modifier le filtrage des upgrades affichés :
```typescript
import { getVisibleStorageUpgrades } from '@/data/storageLogic';
import { useGameState } from '@/context/GameStateContext';

export default function RecruitmentScreen() {
  const { gameState, purchaseStorageUpgrade } = useGameState();
  
  // Upgrades storage (visibles seulement si bloqué)
  const storageUpgrades = getVisibleStorageUpgrades(gameState);
  
  // Upgrades normaux (toujours visibles)
  const normalUpgrades = gameState.upgrades.filter(u => u.type !== 'storage');
  
  return (
    <ScrollView>
      {/* Section normale */}
      {normalUpgrades.map(upgrade => (
        <UpgradeCard key={upgrade.id} upgrade={upgrade} />
      ))}
      
      {/* Section storage (conditionnelle) */}
      {storageUpgrades.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Déblocages de Stockage</Text>
          {storageUpgrades.map(upgrade => (
            <UpgradeCard 
              key={upgrade.id} 
              upgrade={upgrade}
              onPurchase={() => purchaseStorageUpgrade(upgrade.id)}
              canPurchase={canPurchaseStorageUpgrade(gameState, upgrade.id)}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}
```

---

## 🧪 Tests de Validation Rapides

### Test 1 : Blocage Initial
1. Ouvrir l'app
2. Produire manuellement jusqu'à 983 formulaires
3. **Attendu** : Compteur devient rouge + clignote à ~2Hz

### Test 2 : Visibilité Upgrade
1. Avec compteur bloqué (983)
2. Ouvrir menu Administration 2
3. **Attendu** : "Casier de Secours B-9" visible et achetable

### Test 3 : Achat Atomique
1. Acheter "Casier de Secours B-9"
2. **Attendu** : Stock → 0 instantané, plafond → 1983, clignotement arrêté

### Test 4 : Séquence Stricte
1. Atteindre 1983 formulaires
2. Ouvrir Administration 3
3. **Attendu** : "Rayonnage Vertical Optimisé" visible et achetable
4. Ouvrir Administration 4 (sans acheter Admin 3)
5. **Attendu** : "Compression d'Archives A-1" visible mais **grisé/non achetable**

### Test 5 : Production Automatique Capped
1. Recruter plusieurs agents (production >10/sec)
2. Atteindre le plafond
3. **Attendu** : Stock reste figé au plafond exact, pas de dépassement

### Test 6 : Plafond Illimité
1. Acheter tous les upgrades jusqu'à "Vide Juridique de Stockage"
2. **Attendu** : Stock peut dépasser 11 025, jamais de clignotement rouge

---

## 🔍 Debugging Common Issues

### Problème : Clignotement ne s'arrête pas après achat
**Cause** : `isStorageBlocked()` retourne encore `true`  
**Solution** : Vérifier que `currentStorageCap` est bien mis à jour dans la transaction atomique

### Problème : Upgrade 2 achetable sans Upgrade 1
**Cause** : `canPurchaseStorageUpgrade()` ne vérifie pas `requiredUpgradeId`  
**Solution** : Vérifier la logique de séquence dans `storageLogic.ts`

### Problème : Stock dépasse le plafond
**Cause** : `applyStorageCap()` non appelé dans le game loop  
**Solution** : Vérifier que le game loop dans `GameStateContext.tsx` utilise bien `applyStorageCap()`

### Problème : Migration échoue au chargement
**Cause** : `LATEST_VERSION` pas incrémenté à 4  
**Solution** : Vérifier `utils/stateMigration.ts` et incrémenter la version

---

## 📚 Références

- **Spec complète** : `specs/002-formulaires-storage-cap/spec.md`
- **Modèle de données** : `specs/002-formulaires-storage-cap/data-model.md`
- **Contrats API** : `specs/002-formulaires-storage-cap/contracts/storage-logic-api.md`
- **Recherche technique** : `specs/002-formulaires-storage-cap/research.md`
- **Constitution projet** : `.specify/memory/constitution.md`

---

## 🎓 Patterns à Suivre

### Pattern 1 : Logique Pure
```typescript
// ✅ BIEN : Fonction pure dans data/
export function isStorageBlocked(state: GameState): boolean {
  if (state.currentStorageCap === null) return false;
  return state.resources.formulaires >= state.currentStorageCap;
}

// ❌ MAL : Logique dans le composant
function MyComponent() {
  const { gameState } = useGameState();
  const isBlocked = gameState.resources.formulaires >= gameState.currentStorageCap;
  // ... duplication de logique
}
```

### Pattern 2 : Transaction Atomique
```typescript
// ✅ BIEN : Un seul setState avec tout le delta
setGameState(prev => ({
  ...prev,
  resources: { ...prev.resources, formulaires: 0 },
  currentStorageCap: newCap,
  upgrades: updatedUpgrades
}));

// ❌ MAL : Plusieurs setState séquentiels
setGameState(prev => ({ ...prev, resources: { ...prev.resources, formulaires: 0 } }));
setGameState(prev => ({ ...prev, currentStorageCap: newCap }));
```

### Pattern 3 : Animation Conditionnelle
```typescript
// ✅ BIEN : useEffect surveille changement d'état
useEffect(() => {
  if (isBlocked) {
    opacity.value = withRepeat(withTiming(0, { duration: 250 }), -1, true);
  } else {
    opacity.value = withTiming(1, { duration: 0 });
  }
}, [isBlocked]);

// ❌ MAL : Animation inline dans render
<Animated.View style={{ opacity: isBlocked ? clignoter() : 1 }}>
```

---

**Temps estimé total** : 2-3 heures (développeur familier avec la codebase)

**Prêt pour l'implémentation** ✅
