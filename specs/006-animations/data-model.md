# Feature 006-animations — Data Model & Component Design

**Date**: 2026-02-28

---

## Vue d'ensemble des modifications

| Fichier | Type | Changement |
|---|---|---|
| `context/GameStateContext.tsx` | Context | Ajout `dossierClickMultiplier` (useMemo) + exposition |
| `components/StampButton.tsx` | Composant | Animation translateY + particules + floating numbers |
| `components/ResourceBar.tsx` | Composant | Pulse icônes (Reanimated) + prop `onDossierTap` |
| `components/AdministrationCard.tsx` | Composant | Breathing + pan + nameRow fade-in (Reanimated) |
| `app/(tabs)/index.tsx` | Écran | Callback `triggerDossierPulse` passé aux composants |

Aucun nouveau fichier dans `data/`. Aucune modification de `types/game.ts` (pas de nouveaux champs persistés).

---

## 1. GameStateContext — ajout `dossierClickMultiplier`

### Modification minimale

```typescript
// Après la déclaration des callbacks existants (~ligne 590)
const dossierClickMultiplier = useMemo(
  () => getClickMultiplier(gameState.prestigeUpgrades, prestigeUpgrades),
  [gameState.prestigeUpgrades]
);
```

```typescript
// Dans le return du provider (ligne 1160+)
<GameContext.Provider value={{
  .../* existants */,
  dossierClickMultiplier,  // ← ajouter
}}>
```

```typescript
// Dans l'interface GameContextType (à trouver dans le fichier)
dossierClickMultiplier: number;
```

---

## 2. StampButton — animation complète

### Props

```typescript
interface StampButtonProps {
  onTap?: () => void;  // Appelé après chaque tap, pour déclencher le pulse dossier dans ResourceBar
}
```

### State & Refs

```typescript
// Animation principale bouton (Reanimated v3)
const pressAnim = useSharedValue(0);  // translateY en pixels

// Particules — pool de 5, RN Animated
const particles = useRef(
  Array.from({ length: 5 }, () => ({
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))
).current;
const ANGLES = [0, 72, 144, 216, 288].map(d => (d * Math.PI) / 180);

// Floating numbers
type FloatEntry = { key: number; value: number };
const [activeFloats, setActiveFloats] = useState<FloatEntry[]>([]);
const floatKeyRef = useRef(0);
```

### Animations

```typescript
// Pression bouton
const animatedButtonStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: pressAnim.value }],
}));

const animatePress = () => {
  pressAnim.value = withSequence(
    withTiming(4, { duration: 80 }),
    withSpring(0, { damping: 6, stiffness: 200 })
  );
};

// Particules
const fireParticles = () => {
  particles.forEach((p, i) => {
    const dist = 40 + Math.random() * 30;  // 40-70px
    const angle = ANGLES[i];
    p.translateX.setValue(0);
    p.translateY.setValue(0);
    p.opacity.setValue(1);
    Animated.parallel([
      Animated.timing(p.translateX, { toValue: Math.cos(angle) * dist, duration: 450, useNativeDriver: true }),
      Animated.timing(p.translateY, { toValue: Math.sin(angle) * dist, duration: 450, useNativeDriver: true }),
      Animated.timing(p.opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  });
};

// Floating number
const addFloat = (value: number) => {
  setActiveFloats(prev => {
    if (prev.length >= 5) return prev;  // PR-003: max 5
    return [...prev, { key: floatKeyRef.current++, value }];
  });
};

const removeFloat = (key: number) => {
  setActiveFloats(prev => prev.filter(f => f.key !== key));
};
```

### Handler tap

```typescript
const handlePress = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  animatePress();
  fireParticles();
  addFloat(dossierClickMultiplier);  // valeur réelle depuis context
  incrementResource('dossiers', 1);
  onTap?.();  // déclenche pulse icône dans ResourceBar
};
```

### Rendu JSX (structure clé)

```tsx
<View style={styles.container}>
  {/* Particules positionnées absolument */}
  {particles.map((p, i) => (
    <Animated.View
      key={i}
      pointerEvents="none"
      style={[
        styles.particle,
        {
          transform: [{ translateX: p.translateX }, { translateY: p.translateY }],
          opacity: p.opacity,
        },
      ]}
    />
  ))}

  {/* Floating numbers */}
  {activeFloats.map(f => (
    <FloatingNumber key={f.key} value={f.value} onDone={() => removeFloat(f.key)} />
  ))}

  {/* Bouton 3 couches */}
  <View style={styles.bottomShadow}>
    <View style={styles.middleShadow}>
      <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
        <Pressable ... onPress={handlePress}>
          <Text style={styles.buttonText}>TAMPONNER</Text>
        </Pressable>
      </Animated.View>
    </View>
  </View>
</View>
```

### Composant FloatingNumber (interne ou fichier séparé)

```tsx
// Composant local dans StampButton.tsx (ne dépasse pas 300 lignes)
interface FloatingNumberProps {
  value: number;
  onDone: () => void;
}

function FloatingNumber({ value, onDone }: FloatingNumberProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const xOffset = useRef(Math.random() * 30 - 15).current;  // ±15px

  useEffect(() => {
    translateY.value = withTiming(-60, { duration: 700 });
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 600 })
    );
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: xOffset }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.floatText, style]}>
      +{formatNumberFrench(value)}
    </Animated.Text>
  );
}
```

### Styles ajoutés

```typescript
particle: {
  position: 'absolute',
  width: 7,
  height: 7,
  borderRadius: 3.5,
  backgroundColor: Colors.resourceDossiers,
  // centré sur le bouton via alignSelf: 'center' du container
},
floatText: {
  position: 'absolute',
  fontFamily: 'Inter-Bold',
  fontSize: 18,
  color: Colors.resourceDossiers,
  pointerEvents: 'none',
  // centré via alignSelf, décalé par xOffset
},
```

---

## 3. ResourceBar — pulse icônes

### Props ajoutées

```typescript
interface ResourceBarProps {
  onDossierTap?: () => void;  // appelé par index.tsx au tap, non-throttlé
}
```

### State & Refs

```typescript
const dossierScale = useSharedValue(1);
const tamponsScale = useSharedValue(1);
const formulairesScale = useSharedValue(1);

const prevResources = useRef<Resources | null>(null);
const lastPulseRef = useRef({ dossiers: 0, tampons: 0, formulaires: 0 });
```

### Logique pulse

```typescript
// Détection production automatique
useEffect(() => {
  if (!gameState?.resources) return;
  const prev = prevResources.current;
  const curr = gameState.resources;

  if (prev) {
    (['dossiers', 'tampons', 'formulaires'] as const).forEach(r => {
      if (curr[r] > prev[r]) {
        triggerPulse(r, true);  // throttlé
      }
    });
  }
  prevResources.current = { ...curr };
}, [gameState?.resources]);

// Pulse sur tap Tamponner (non-throttlé)
useEffect(() => {
  if (onDossierTap) {
    // onDossierTap est un callback statique — ResourceBar l'expose via useImperativeHandle?
    // Non : on passe le callback dans onDossierTap prop; ResourceBar l'enregistre via useEffect
    // Solution: ResourceBar appelle triggerPulse('dossiers', false) quand onDossierTap change
    // MAIS onDossierTap ne change pas → il faut un signal. Solution: voir F-006 dans research.md
  }
}, []);

const triggerPulse = (r: 'dossiers' | 'tampons' | 'formulaires', throttle: boolean) => {
  if (r === 'formulaires' && isStorageBlocked) return;  // FR-008: pas d'empilement blink
  if (throttle) {
    const now = Date.now();
    if (now - lastPulseRef.current[r] < 1000) return;
    lastPulseRef.current[r] = now;
  }
  const sv = r === 'dossiers' ? dossierScale : r === 'tampons' ? tamponsScale : formulairesScale;
  sv.value = withSequence(withSpring(1.25, { damping: 10 }), withSpring(1, { damping: 12 }));
};
```

### Pont StampButton → ResourceBar (solution finale)

Dans **index.tsx** :
```tsx
const dossierTapCountRef = useRef(0);

const handleStampTap = useCallback(() => {
  dossierTapCountRef.current += 1;
}, []);

// Passer dossierTapCountRef.current comme prop à ResourceBar
// ResourceBar observe ce nombre et pulse si il change
```

Mais les refs ne déclenchent pas de re-render. Solution propre :
```tsx
// index.tsx
const [dossierTapSignal, setDossierTapSignal] = useState(0);  // incrémenté à chaque tap

const handleStampTap = useCallback(() => {
  setDossierTapSignal(s => s + 1);
}, []);
```
```tsx
// ResourceBar.tsx — props
interface ResourceBarProps {
  dossierTapSignal?: number;
}

useEffect(() => {
  if (dossierTapSignal && dossierTapSignal > 0) {
    triggerPulse('dossiers', false);  // non-throttlé
  }
}, [dossierTapSignal]);
```

**Note performance** : `setDossierTapSignal` déclenche un re-render de index.tsx et ResourceBar à chaque tap. Acceptable car ResourceBar est simple (pas de liste) et le re-render est causé de toute façon par `incrementResource` → `gameState.resources`. Les deux re-renders sont colocalisés.

### Rendu JSX (structure icônes wrappées)

```tsx
<View style={styles.resourceItem}>
  <Animated.View style={useAnimatedStyle(() => ({ transform: [{ scale: dossierScale.value }] }))}>
    <File color={Colors.resourceDossiers} size={18} />
  </Animated.View>
  <View style={styles.resourceValues}>
    <Text style={styles.resourceValue}>{formatNumber(resources.dossiers)}</Text>
    <Text style={styles.resourceProduction}>+{formatNumber(production.dossiers)}/s</Text>
  </View>
</View>
```

---

## 4. AdministrationCard — breathing + pan + nameRow fade-in

### Imports à ajouter

```typescript
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
```

Note : `Animated` de RN core (utilisé pour shake) reste importé depuis `react-native`. L'import Reanimated est distinct.

### Shared values

```typescript
const breathAnim = useSharedValue(1);     // scale breathing
const panAnim = useSharedValue(0);        // translateX pan image
const nameOpacity = useSharedValue(0);   // opacity nameRow
const nameTranslateY = useSharedValue(6); // translateY nameRow
```

### useEffects

```typescript
// Breathing — toutes cartes actives (locked ou pas)
useEffect(() => {
  if (isActive) {
    breathAnim.value = withRepeat(withTiming(1.008, { duration: 1250 }), -1, true);
  } else {
    cancelAnimation(breathAnim);
    breathAnim.value = withTiming(1.0, { duration: 200 });
  }
}, [isActive]);

// Pan — uniquement cartes actives ET débloquées
useEffect(() => {
  if (isActive && administration.isUnlocked) {
    panAnim.value = withRepeat(withTiming(-8, { duration: 3500 }), -1, true);
  } else {
    cancelAnimation(panAnim);
    panAnim.value = withTiming(0, { duration: 300 });
  }
}, [isActive, administration.isUnlocked]);

// NameRow fade-in sur changement de carte active
useEffect(() => {
  if (isActive) {
    nameOpacity.value = 0;
    nameTranslateY.value = 6;
    nameOpacity.value = withTiming(1, { duration: 180 });
    nameTranslateY.value = withTiming(0, { duration: 180 });
  }
}, [isActive]);

// AppState — relancer les animations au retour foreground
useEffect(() => {
  const sub = AppState.addEventListener('change', state => {
    if (state === 'active' && isActive) {
      if (administration.isUnlocked) {
        panAnim.value = withRepeat(withTiming(-8, { duration: 3500 }), -1, true);
      }
      breathAnim.value = withRepeat(withTiming(1.008, { duration: 1250 }), -1, true);
    }
  });
  return () => sub.remove();
}, [isActive, administration.isUnlocked]);
```

### Animated styles

```typescript
const breathStyle = useAnimatedStyle(() => ({
  transform: [{ scale: breathAnim.value }],
}));

const panStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: panAnim.value }],
}));

const nameStyle = useAnimatedStyle(() => ({
  opacity: nameOpacity.value,
  transform: [{ translateY: nameTranslateY.value }],
}));
```

### Structure JSX

```tsx
{/* Breathing wrapper (Reanimated) — le plus externe */}
<Animated.View style={breathStyle}>
  {/* Shake wrapper (RN Animated) — existant */}
  <RNAnimated.View style={{ transform: [{ translateX: shakeAnim }] }}>
    {/* TouchableOpacity avec overflow:hidden — existant */}
    <TouchableOpacity style={[styles.container, isActive && styles.activeContainer]} ...>

      {/* Pan image wrapper (Reanimated) */}
      <Animated.View style={[styles.imageWrapper, panStyle]}>
        <Image source={administration.imagePath} style={styles.image} />
      </Animated.View>

      {/* NameRow avec fade-in */}
      <View style={styles.nameRow}>
        <Animated.View style={nameStyle}>
          <Text style={styles.nameText} numberOfLines={1}>{administration.name}</Text>
        </Animated.View>
      </View>

      {/* Overlay verrouillé — inchangé */}
      {!administration.isUnlocked && ( ... )}
      {isUnlockable && !administration.isUnlocked && ( ... )}
    </TouchableOpacity>
  </RNAnimated.View>
</Animated.View>
```

### Styles modifiés/ajoutés

```typescript
// Existant à conserver tel quel (overflow: 'hidden' sur container)
container: {
  width: 300,
  marginHorizontal: 10,
  borderRadius: 12,
  backgroundColor: Colors.background,
  overflow: 'hidden',  // ← clip le pan image ✓
},

// Nouveau wrapper image
imageWrapper: {
  width: '115%',          // 115% de 300px = 345px → marge 22px chaque côté > pan 8px
  alignSelf: 'center',    // centré dans le container
},

// Image : garder width: '100%', height: 200
image: {
  width: '100%',
  height: 200,
  resizeMode: 'cover',
},

// nameRow : inchangé (le fade-in est appliqué sur un Animated.View interne)
```

---

## 5. index.tsx — pont tap signal

```tsx
const [dossierTapSignal, setDossierTapSignal] = useState(0);

const handleStampTap = useCallback(() => {
  setDossierTapSignal(s => s + 1);
}, []);

// Dans le JSX :
<ResourceBar dossierTapSignal={dossierTapSignal} />
// ...
<StampButton onTap={handleStampTap} />
```

---

## Résumé des nouveaux imports par fichier

| Fichier | Imports ajoutés |
|---|---|
| `StampButton.tsx` | `Animated` (RN core pour particules), `Reanimated` (pression + float), `useState`, `useRef`, `useEffect`, `formatNumberFrench`, `Colors` |
| `ResourceBar.tsx` | `withSequence`, `withSpring` (Reanimated), `useRef`, `useEffect` |
| `AdministrationCard.tsx` | `Animated` (Reanimated, comme `import Animated, {...} from 'react-native-reanimated'`), `AppState` (RN), `cancelAnimation` (Reanimated) |
| `index.tsx` | `useState`, `useCallback` (si pas déjà importés) |
| `GameStateContext.tsx` | Rien de nouveau — `getClickMultiplier` et `useMemo` sont déjà importés |
