# Data Model & Component Design: Modale de Réaffectation Différée

**Feature**: `004-reaffectation-modal`
**Date**: 2026-02-25

---

## Changements d'état — `ConformiteState`

Aucun nouveau champ. Champs existants modifiés après refus :

| Champ | Avant refus | Après refus |
|---|---|---|
| `percentage` | 100 | Entier aléatoire ∈ [23, 65] |
| `accumulatedFormulaires` | Valeur accumulée depuis activation | Somme coûts [0, newPct − 1] |
| `isActivated` | true | true (inchangé) |
| `isUnlocked` | true | true (inchangé) |

---

## Nouvelles fonctions pures — `data/conformiteLogic.ts`

### `getReaffectationResetPercentage(): number`
```
Retourne : Math.floor(Math.random() * 43) + 23
Plage : [23, 65] uniforme
```

### `getAccumulatedFormulairesForPercentage(targetPct: number): number`
```
Retourne : Σ getFormulairesRequiredForNextPercent(p) pour p ∈ [0, targetPct − 1]
Cas targetPct = 0 : retourne 0
```

---

## Nouvelle action contexte — `GameStateContext.tsx`

### `refuseReaffectation(): number`

```
1. newPct = getReaffectationResetPercentage()
2. newAccumulated = getAccumulatedFormulairesForPercentage(newPct)
3. setGameState(prev => {
     conformite: { ...prev.conformite, percentage: newPct, accumulatedFormulaires: newAccumulated }
   })
4. return newPct
```

Ajout dans `GameContextType` :
```typescript
refuseReaffectation: () => number;
```

---

## Nouveau composant — `components/ReaffectationModal.tsx`

### Props
```typescript
interface ReaffectationModalProps {
  visible: boolean;
  onAccept: () => void;
  onRefuse: () => void;
}
```

### État interne
```typescript
const [showComingSoon, setShowComingSoon] = useState(false);
```
Réinitialisé à `false` quand `visible` repasse à `false` (via `useEffect`).

### Flux
```
visible=true
  └─ showComingSoon=false → Vue principale (alerte + 2 boutons)
       ├─ [ACCEPTER] → setShowComingSoon(true) → Vue "Coming soon"
       │    └─ [Fermer] → onAccept() → (parent set visible=false)
       └─ [REFUSER] → onRefuse() → (parent set visible=false + animation)
```

### Textes figés
```
Titre alerte : « Alerte »
Corps : « Le volume de dossiers locaux a atteint le seuil de compression
          critique. L'espace de stockage physique est saturé. Pour continuer
          à exister administrativement, votre dossier personnel doit être
          délocalisé vers l'échelon Départemental. »
Bouton 1 : « ACCEPTER LA MIGRATION »
Sous-titre 1 : « Transférer mon matricule et mes dossiers. »
Bouton 2 : « REFUSER »
Sous-titre 2 : « Rester ici (Attention : l'excès de dossiers sera pilonné
                pour libérer de l'espace). »
Coming soon : « Fonctionnalité à venir. »
Bouton fermer : « Fermer »
```

### Propriétés Modal
```
transparent={true}
animationType="fade"
onRequestClose={() => {}}   ← non-dismissible Android
statusBarTranslucent={true}
```

---

## Modifications — `components/ConformiteDisplay.tsx`

### Imports ajoutés
```typescript
import { Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import ReaffectationModal from './ReaffectationModal';
```

### Nouveaux hooks / refs
```typescript
const [modalVisible, setModalVisible] = useState(false);
const animatedBarWidth = useRef(new Animated.Value(0)).current;
const isAnimatingRef = useRef(false);
```

### Sync game-tick → barre (useEffect)
```typescript
useEffect(() => {
  if (!isAnimatingRef.current) {
    animatedBarWidth.setValue(conformiteDisplayPercentage);
  }
}, [conformiteDisplayPercentage]);
```

### Handler refus
```typescript
const handleRefuse = () => {
  setModalVisible(false);
  const newPct = refuseReaffectation();
  isAnimatingRef.current = true;
  animatedBarWidth.setValue(100);
  Animated.timing(animatedBarWidth, {
    toValue: newPct,
    duration: 300,
    useNativeDriver: false,
  }).start(() => { isAnimatingRef.current = false; });
};
```

### Handler acceptation
```typescript
const handleAccept = () => {
  setModalVisible(false);
};
```

### CTA modifié
```typescript
// Avant :
onPress={() => { /* Réaffectation différée — not yet implemented */ }}
// Après :
onPress={() => setModalVisible(true)}
```

### Barre de progression modifiée
```typescript
// Avant :
<View style={[styles.progressBarFill, { width: `${conformiteDisplayPercentage}%` }]} />
// Après :
<Animated.View
  style={[
    styles.progressBarFill,
    { width: animatedBarWidth.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
      })
    }
  ]}
/>
```

### Ajout modale dans JSX
```tsx
<ReaffectationModal
  visible={modalVisible}
  onAccept={handleAccept}
  onRefuse={handleRefuse}
/>
```

---

## Aucun changement requis dans

| Fichier | Raison |
|---|---|
| `types/game.ts` | `ConformiteState` inchangé structurellement |
| `data/gameData.ts` | Aucune donnée statique ajoutée |
| `utils/stateMigration.ts` | Aucun nouveau champ persisté |
| Autres composants | Feature isolée à ConformiteDisplay + ReaffectationModal |
