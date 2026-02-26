---
name: rn-frontend
description: Implémentation et revue de composants React Native / Expo pour BUREAUCRACY++. Conventions du projet, patterns de performance, animations, layout mobile.
argument-hint: [composant à créer ou réviser]
---

# React Native Frontend — BUREAUCRACY++

## Conventions obligatoires

### Composants
- `Pressable` uniquement — jamais `TouchableOpacity`, `TouchableHighlight` ou `Button`
- `SafeAreaView` de `react-native-safe-area-context` sur tous les écrans
- `StyleSheet.create` toujours — aucun style objet inline `style={{ ... }}`
- Composant ≤ 300 lignes — extraire si plus grand
- `React.memo` sur tout composant de liste

### Couleurs et typo
```typescript
import Colors from '@/constants/Colors';  // TOUJOURS — jamais de hex direct
// Polices disponibles :
// 'Inter-Regular' | 'Inter-SemiBold' | 'Inter-Bold' | 'ArchivoBlack-Regular'
```

### Nombres
```typescript
import { formatNumberFrench } from '@/utils/formatters';
// JAMAIS .toLocaleString() directement
```

### Ombres (iOS + Android obligatoires ensemble)
```typescript
shadowColor: Colors.shadow,
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 2,  // Android
```

## Animations

### Reanimated v3 (défaut pour animations UI)
```typescript
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
// useSharedValue + useAnimatedStyle
// Jamais setState pour animer
```

### Animated core (acceptable si useNativeDriver: true suffit)
```typescript
// OK pour : translateX, translateY, scale, opacity, rotate
// useNativeDriver: true OBLIGATOIRE si transform/opacity
// useNativeDriver: false si width/height/layout properties
```

## Performance

```typescript
// Listes > 10 items → FlatList
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <MyItem item={item} />}  // MyItem = React.memo
/>

// Props stables
const handlePress = useCallback(() => { ... }, [deps]);
const derivedValue = useMemo(() => compute(data), [data]);
```

## Haptics
```typescript
import * as Haptics from 'expo-haptics';
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);    // taps
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);   // achats
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // déblocages
```

## Accessibilité (obligatoire sur éléments interactifs)
```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Description pour lecteur d'écran"
  accessibilityHint="Ce qui se passe quand on appuie"
  accessibilityState={{ disabled: !canPress }}
  style={[styles.btn, !canPress && styles.btnDisabled]}
  onPress={handlePress}
>
```

## Pattern bouton standard
```typescript
// Actif/désactivé — toujours signalé visuellement (pas seulement par couleur)
<Pressable
  style={[styles.button, !canBuy && styles.buttonDisabled]}
  onPress={handleBuy}
  disabled={!canBuy}
>
  <Text style={[styles.buttonText, !canBuy && styles.buttonTextDisabled]}>
    {canBuy ? `Acheter` : `Insuffisant`}
  </Text>
</Pressable>
```

## Séparation des couches (Principe V)

```
Composant → useGameState() → data/
NE PAS importer depuis data/ directement dans les composants.
```

## Checklist avant commit

- [ ] Aucun import direct depuis `data/` dans le composant
- [ ] Aucun hex codé en dur dans les styles
- [ ] `StyleSheet.create` (pas d'inline)
- [ ] Taille composant ≤ 300 lignes
- [ ] Cibles tactiles ≥ 44×44 sur tous les éléments interactifs
- [ ] iOS shadows + Android elevation sur les cartes/boutons
- [ ] `formatNumberFrench()` pour tous les nombres affichés
- [ ] Texte français vérifié (accents, apostrophes JSX)
- [ ] `npm run lint` → 0 nouvelle erreur
