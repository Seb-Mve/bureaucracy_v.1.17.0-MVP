# Feature 006-animations — Quickstart (Guide d'implémentation)

**Date**: 2026-02-28
**Branche** : `006-animations`

---

## Ordre d'implémentation recommandé

1. **GameStateContext** — exposer `dossierClickMultiplier` (1 modification, non-bloquante)
2. **index.tsx** — ajouter le pont `dossierTapSignal` + `handleStampTap`
3. **ResourceBar** — pulse icônes + prop `dossierTapSignal`
4. **AdministrationCard** — breathing + pan + nameRow fade-in
5. **StampButton** — translateY + particules + floating numbers

---

## Étape 1 — GameStateContext : exposer `dossierClickMultiplier`

**Fichier** : `context/GameStateContext.tsx`

**Trouver l'interface `GameContextType`** et ajouter :
```typescript
dossierClickMultiplier: number;
```

**Trouver les déclarations des callbacks** (autour de ligne 590, après `incrementResource`) et ajouter :
```typescript
const dossierClickMultiplier = useMemo(
  () => getClickMultiplier(gameState.prestigeUpgrades, prestigeUpgrades),
  [gameState.prestigeUpgrades]
);
```

**Dans le return provider** — ajouter `dossierClickMultiplier` à la liste des valeurs exposées.

---

## Étape 2 — index.tsx : pont tap signal

**Fichier** : `app/(tabs)/index.tsx`

Ajouter `useState`, `useCallback` si pas déjà importés. Ajouter après les imports context :

```tsx
const [dossierTapSignal, setDossierTapSignal] = useState(0);

const handleStampTap = useCallback(() => {
  setDossierTapSignal(s => s + 1);
}, []);
```

Modifier la zone JSX `buttonContainer` et `ResourceBar` :
```tsx
<ResourceBar dossierTapSignal={dossierTapSignal} />
// ...
<StampButton onTap={handleStampTap} />
```

---

## Étape 3 — ResourceBar : pulse icônes

**Fichier** : `components/ResourceBar.tsx`

### 3a — Ajouter `withSequence`, `withSpring` aux imports Reanimated

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,  // ← nouveau
  withSpring,    // ← nouveau
} from 'react-native-reanimated';
```

Ajouter `useRef`, `useEffect` aux imports React.

### 3b — Ajouter les props

```typescript
interface ResourceBarProps {
  dossierTapSignal?: number;
}

export default function ResourceBar({ dossierTapSignal }: ResourceBarProps) {
```

### 3c — Déclarer les shared values et refs (après `opacity`)

```typescript
const dossierScale = useSharedValue(1);
const tamponsScale = useSharedValue(1);
const formulairesScale = useSharedValue(1);

const prevDossiers = useRef<number | null>(null);
const prevTampons = useRef<number | null>(null);
const prevFormulaires = useRef<number | null>(null);
const lastPulseRef = useRef({ dossiers: 0, tampons: 0, formulaires: 0 });
```

### 3d — Fonction triggerPulse

```typescript
const triggerPulse = useCallback(
  (r: 'dossiers' | 'tampons' | 'formulaires', throttle: boolean) => {
    if (r === 'formulaires' && isStorageBlocked) return;
    if (throttle) {
      const now = Date.now();
      if (now - lastPulseRef.current[r] < 1000) return;
      lastPulseRef.current[r] = now;
    }
    const sv = r === 'dossiers' ? dossierScale : r === 'tampons' ? tamponsScale : formulairesScale;
    sv.value = withSequence(
      withSpring(1.25, { damping: 10, stiffness: 200 }),
      withSpring(1.0, { damping: 12, stiffness: 200 })
    );
  },
  [isStorageBlocked, dossierScale, tamponsScale, formulairesScale]
);
```

### 3e — useEffect détection production auto

```typescript
useEffect(() => {
  if (!gameState?.resources) return;
  const curr = gameState.resources;

  if (prevDossiers.current !== null && curr.dossiers > prevDossiers.current) {
    triggerPulse('dossiers', true);
  }
  if (prevTampons.current !== null && curr.tampons > prevTampons.current) {
    triggerPulse('tampons', true);
  }
  if (prevFormulaires.current !== null && curr.formulaires > prevFormulaires.current) {
    triggerPulse('formulaires', true);
  }

  prevDossiers.current = curr.dossiers;
  prevTampons.current = curr.tampons;
  prevFormulaires.current = curr.formulaires;
}, [gameState?.resources, triggerPulse]);
```

### 3f — useEffect pulse sur tap

```typescript
useEffect(() => {
  if (dossierTapSignal !== undefined && dossierTapSignal > 0) {
    triggerPulse('dossiers', false);  // non-throttlé
  }
}, [dossierTapSignal, triggerPulse]);
```

### 3g — Animated styles icônes

```typescript
const dossierIconStyle = useAnimatedStyle(() => ({
  transform: [{ scale: dossierScale.value }],
}));
const tamponsIconStyle = useAnimatedStyle(() => ({
  transform: [{ scale: tamponsScale.value }],
}));
const formulairesIconStyle = useAnimatedStyle(() => ({
  transform: [{ scale: formulairesScale.value }],
}));
```

### 3h — Modifier le JSX : wrapper `<Animated.View>` autour de chaque icône

```tsx
{/* Dossiers */}
<View style={styles.resourceItem}>
  <Animated.View style={dossierIconStyle}>
    <File color={Colors.resourceDossiers} size={18} />
  </Animated.View>
  {/* resourceValues inchangé */}
</View>

{/* Tampons */}
<View style={styles.resourceItem}>
  <Animated.View style={tamponsIconStyle}>
    <Stamp color={Colors.resourceTampons} size={18} />
  </Animated.View>
  {/* resourceValues inchangé */}
</View>

{/* Formulaires */}
<View style={styles.resourceItem}>
  <Animated.View style={formulairesIconStyle}>
    <ClipboardList
      color={isStorageBlocked ? Colors.storageCapped : Colors.resourceFormulaires}
      size={18}
    />
  </Animated.View>
  {/* Animated.View resourceValues + blink INCHANGÉ */}
</View>
```

---

## Étape 4 — AdministrationCard : breathing + pan + nameRow fade-in

**Fichier** : `components/AdministrationCard.tsx`

### 4a — Ajouter imports

```typescript
import Animated as RNAnimated from 'react-native';  // ATTENTION : renommer l'import Animated existant
```

Attendre — le fichier utilise `Animated` de `react-native` pour le shake. Il faut nommer l'import Reanimated différemment pour éviter le conflit :

```typescript
// Imports existants (react-native) — garder Animated tel quel
import { View, StyleSheet, Image, TouchableOpacity, Text, Animated } from 'react-native';

// Nouveau — importer Reanimated sous un alias
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

// Ajouter AppState aux imports react-native
import { View, StyleSheet, Image, TouchableOpacity, Text, Animated, AppState } from 'react-native';
```

### 4b — Shared values (après `shakeAnim`)

```typescript
const breathAnim = useSharedValue(1);
const panAnim = useSharedValue(0);
const nameOpacity = useSharedValue(isActive ? 1 : 0);
const nameTranslateY = useSharedValue(0);
```

### 4c — useEffect breathing

```typescript
useEffect(() => {
  if (isActive) {
    breathAnim.value = withRepeat(withTiming(1.008, { duration: 1250 }), -1, true);
  } else {
    cancelAnimation(breathAnim);
    breathAnim.value = withTiming(1.0, { duration: 200 });
  }
}, [isActive]);
```

### 4d — useEffect pan

```typescript
useEffect(() => {
  if (isActive && administration.isUnlocked) {
    panAnim.value = withRepeat(withTiming(-8, { duration: 3500 }), -1, true);
  } else {
    cancelAnimation(panAnim);
    panAnim.value = withTiming(0, { duration: 300 });
  }
}, [isActive, administration.isUnlocked]);
```

### 4e — useEffect nameRow fade-in

```typescript
useEffect(() => {
  if (isActive) {
    nameOpacity.value = 0;
    nameTranslateY.value = 6;
    nameOpacity.value = withTiming(1, { duration: 180 });
    nameTranslateY.value = withTiming(0, { duration: 180 });
  }
}, [isActive]);
```

### 4f — useEffect AppState (retour foreground)

```typescript
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

### 4g — Animated styles

```typescript
const breathStyle = useAnimatedStyle(() => ({
  transform: [{ scale: breathAnim.value }],
}));

const panStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: panAnim.value }],
}));

const nameAnimStyle = useAnimatedStyle(() => ({
  opacity: nameOpacity.value,
  transform: [{ translateY: nameTranslateY.value }],
}));
```

### 4h — Restructurer le JSX

**Remplacer** le retour actuel :

```tsx
return (
  // Breathing wrapper — Reanimated
  <Reanimated.View style={breathStyle}>
    {/* Shake wrapper — RN Animated (existant) */}
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <TouchableOpacity
        style={[styles.container, isActive && styles.activeContainer]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={...}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive, disabled: false }}
      >
        {/* Pan image wrapper */}
        <Reanimated.View style={[styles.imageWrapper, panStyle]}>
          <Image source={administration.imagePath} style={styles.image} />
        </Reanimated.View>

        {/* NameRow avec fade-in */}
        <View style={styles.nameRow}>
          <Reanimated.View style={nameAnimStyle}>
            <Text style={styles.nameText} numberOfLines={1}>{administration.name}</Text>
          </Reanimated.View>
        </View>

        {/* Overlay verrouillé — INCHANGÉ */}
        {!administration.isUnlocked && (
          <View style={styles.lockedOverlay}>
            {/* ... contenu inchangé ... */}
          </View>
        )}

        {/* Badge débloquable — INCHANGÉ */}
        {isUnlockable && !administration.isUnlocked && (
          <View style={styles.unlockableBadge} accessibilityLabel="Débloquable">
            <Text style={styles.unlockableBadgeText}>!</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  </Reanimated.View>
);
```

### 4i — Styles à ajouter dans `StyleSheet.create`

```typescript
imageWrapper: {
  width: '115%',
  alignSelf: 'center',
  // Pas de overflow:hidden ici — le parent TouchableOpacity a overflow:'hidden'
},
// styles.image : height reste 200, width: '100%' (relatif au wrapper 115%)
```

---

## Étape 5 — StampButton : translateY + particules + floating numbers

**Fichier** : `components/StampButton.tsx`

### 5a — Nouveaux imports

```typescript
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Platform, View } from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { formatNumberFrench } from '@/utils/formatters';
```

### 5b — Props

```typescript
interface StampButtonProps {
  onTap?: () => void;
}

export default function StampButton({ onTap }: StampButtonProps) {
  const { incrementResource, dossierClickMultiplier } = useGameState();
```

### 5c — Supprimer `scale` existant, ajouter `pressAnim`

```typescript
// SUPPRIMER : const [scale] = useState(new Animated.Value(1));

// Remplacer par :
const pressAnim = useSharedValue(0);  // translateY pixels
```

### 5d — Particules

```typescript
const PARTICLE_ANGLES = [0, 72, 144, 216, 288].map(d => (d * Math.PI) / 180);

const particles = useRef(
  PARTICLE_ANGLES.map(() => ({
    tx: new Animated.Value(0),
    ty: new Animated.Value(0),
    op: new Animated.Value(0),
  }))
).current;

const fireParticles = useCallback(() => {
  particles.forEach((p, i) => {
    const dist = 40 + Math.random() * 30;
    const angle = PARTICLE_ANGLES[i];
    p.tx.setValue(0);
    p.ty.setValue(0);
    p.op.setValue(1);
    Animated.parallel([
      Animated.timing(p.tx, { toValue: Math.cos(angle) * dist, duration: 450, useNativeDriver: true }),
      Animated.timing(p.ty, { toValue: Math.sin(angle) * dist, duration: 450, useNativeDriver: true }),
      Animated.timing(p.op, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  });
}, []);
```

### 5e — Floating numbers

```typescript
type FloatEntry = { key: number; value: number };
const [activeFloats, setActiveFloats] = useState<FloatEntry[]>([]);
const floatKeyRef = useRef(0);

const addFloat = useCallback((value: number) => {
  setActiveFloats(prev => {
    if (prev.length >= 5) return prev;
    return [...prev, { key: floatKeyRef.current++, value }];
  });
}, []);

const removeFloat = useCallback((key: number) => {
  setActiveFloats(prev => prev.filter(f => f.key !== key));
}, []);
```

### 5f — Animated style bouton (remplace scale)

```typescript
const animatedButtonStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: pressAnim.value }],
}));
```

### 5g — handlePress

```typescript
const handlePress = useCallback(() => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  // Animation bouton (translateY)
  pressAnim.value = withSequence(
    withTiming(4, { duration: 80 }),
    withSpring(0, { damping: 6, stiffness: 200 })
  );
  // Particules
  fireParticles();
  // Floating number
  addFloat(dossierClickMultiplier);
  // Ressource
  incrementResource('dossiers', 1);
  // Signal pulse icône
  onTap?.();
}, [pressAnim, fireParticles, addFloat, dossierClickMultiplier, incrementResource, onTap]);
```

### 5h — JSX complet

```tsx
return (
  <View style={styles.container}>
    {/* Particules */}
    {particles.map((p, i) => (
      <Animated.View
        key={i}
        pointerEvents="none"
        style={[
          styles.particle,
          {
            transform: [{ translateX: p.tx }, { translateY: p.ty }],
            opacity: p.op,
          },
        ]}
      />
    ))}

    {/* Floating numbers */}
    {activeFloats.map(f => (
      <FloatingNumber
        key={f.key}
        value={f.value}
        onDone={() => removeFloat(f.key)}
      />
    ))}

    {/* Bouton 3 couches */}
    <View style={styles.bottomShadow}>
      <View style={styles.middleShadow}>
        <Reanimated.View style={[styles.buttonContainer, animatedButtonStyle]}>
          <TouchableOpacity
            style={styles.button}
            onPress={handlePress}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Tamponner un dossier"
            accessibilityHint="Appuyez pour tamponner un dossier et gagner une ressource"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>TAMPONNER</Text>
          </TouchableOpacity>
        </Reanimated.View>
      </View>
    </View>
  </View>
);
```

### 5i — Composant FloatingNumber (en bas du fichier, avant styles)

```tsx
interface FloatingNumberProps {
  value: number;
  onDone: () => void;
}

function FloatingNumber({ value, onDone }: FloatingNumberProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const xOffset = useRef(Math.random() * 30 - 15).current;

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
    <Reanimated.Text style={[styles.floatText, style]}>
      +{formatNumberFrench(value)}
    </Reanimated.Text>
  );
}
```

### 5j — Nouveaux styles (à ajouter dans StyleSheet.create)

```typescript
particle: {
  position: 'absolute',
  alignSelf: 'center',
  width: 7,
  height: 7,
  borderRadius: 3.5,
  backgroundColor: Colors.resourceDossiers,
},
floatText: {
  position: 'absolute',
  alignSelf: 'center',
  fontFamily: 'Inter-Bold',
  fontSize: 18,
  color: Colors.resourceDossiers,
  pointerEvents: 'none',
},
```

---

## Checklist de validation finale

- [ ] `npm run lint` → 0 nouvelle erreur
- [ ] Tap Tamponner → translateY descend + rebond spring visible
- [ ] Tap Tamponner → 5 particules orange éclatent radialement < 500ms
- [ ] Tap Tamponner → floating "+N" monte ~60px puis disparaît < 700ms
- [ ] Tap rapide 5× → pas plus de 5 floats simultanés
- [ ] Au 6e float → ignoré (pas de crash)
- [ ] Carte active → breathing 1.008 visible après 2s
- [ ] Carte voisine → statique (pas de breathing)
- [ ] Carte active → pan image visible après 3s (très subtil)
- [ ] Carte verrouillée active → breathing oui, pan non
- [ ] Swipe vers nouvelle carte → animations migrent sur la nouvelle carte
- [ ] Retour foreground → animations reprennent proprement
- [ ] Agents actifs → icônes pulsent max 1×/s
- [ ] Tap → icône dossier pulse sans throttle
- [ ] Storage bloqué → icône formulaires clignote SANS pulse supplémentaire
- [ ] `Reanimated.Text` visible sur iOS et Android (pas de bug de rendu natif)
