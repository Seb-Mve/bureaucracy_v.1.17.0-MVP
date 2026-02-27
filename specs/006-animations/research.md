# Feature 006-animations — Research

**Date**: 2026-02-28
**Fichiers analysés** : `StampButton.tsx`, `ResourceBar.tsx`, `AdministrationCard.tsx`, `GameStateContext.tsx`, `index.tsx`, `types/game.ts`, `constants/Colors.ts`

---

## F-001 : StampButton — animation existante et contraintes particules

**Fichier** : `components/StampButton.tsx` (113 lignes)

**Système actuel** : `Animated.Value scale` (RN Animated core). Séquence : `timing(0.92, 100ms) → spring(1)` sur `Animated.View` wrappant le button.

**Changements requis (FR-001 translateY)** :
- Supprimer le `scale` existant.
- Remplacer par `useSharedValue(0)` Reanimated — animation `translateY` vers `+4` (descente) puis `withSpring(0)`.
- Le composant passe de RN Animated → Reanimated v3 (plus propre, déjà utilisé dans ResourceBar).

**Particules (FR-002)** :
- Container StampButton (`styles.container`) n'a **pas** d'`overflow: hidden` → les particules peuvent s'étendre librement dans le `buttonContainer` de index.tsx.
- `buttonContainer` (index.tsx) : `width: '100%'`, pas d'overflow non plus → OK.
- Patron : pool pré-alloué de 5 particules, chacune = 3 `Animated.Value` (translateX, translateY, opacity).
- Rendu en `position: 'absolute'` centré sur le bouton.
- Angles en étoile : `[0°, 72°, 144°, 216°, 288°]` → 5 particules couvrant 360°.
- Distance : random 40–70px. Durée : 450ms. `useNativeDriver: true`.

**Floating numbers (FR-003)** :
- Composant `FloatingNumber` séparé auto-destructif (monté/démonté, gère sa propre animation).
- Rendu en `position: 'absolute'` au-dessus du bouton, légère variation X aléatoire (±15px).
- Max 5 simultanés (PR-003) : tableau `useState<FloatEntry[]>` — si `length >= 5`, tap ignoré.
- Valeur affichée : `+[dossierClickMultiplier × 1]` → voir F-004.
- Couleur : `Colors.resourceDossiers` (`#e67e22`).

**Hex hardcodés** : `#c27c43`, `#d68d54`, `#ecb376` dans styles — pré-existants, ne pas modifier.

---

## F-002 : ResourceBar — Reanimated déjà présent, icônes à wrapper

**Fichier** : `components/ResourceBar.tsx` (135 lignes)

**Imports Reanimated actuels** : `useSharedValue`, `useAnimatedStyle`, `withRepeat`, `withTiming` → ajouter `withSequence`, `withSpring`.

**Icônes actuelles** : `<File>`, `<Stamp>`, `<ClipboardList>` (lucide-react-native) — composants SVG, non-animables directement. Chaque icône doit être wrappée dans `<Animated.View>` (Reanimated) pour recevoir le scale pulse.

**Pattern pulse (FR-007 + FR-008)** :
```typescript
const dossierScale = useSharedValue(1);
const tamponsScale = useSharedValue(1);
const formulairesScale = useSharedValue(1);

// Throttle auto-production (1/s max)
const lastPulseRef = useRef<Record<'dossiers' | 'tampons' | 'formulaires', number>>({
  dossiers: 0, tampons: 0, formulaires: 0,
});

const triggerPulse = (resource: ResourceType, throttle: boolean) => {
  if (throttle) {
    const now = Date.now();
    if (now - lastPulseRef.current[resource] < 1000) return;
    lastPulseRef.current[resource] = now;
  }
  const sv = { dossiers: dossierScale, tampons: tamponsScale, formulaires: formulairesScale }[resource];
  sv.value = withSequence(withSpring(1.25, { damping: 10 }), withSpring(1));
};
```

**Détection production** : `useEffect` sur `resources.dossiers`, `resources.tampons`, `resources.formulaires` via `usePrevious` (useRef) — si `current > prev`, trigger pulse throttlé.

**Conflit blink formulaires (FR-008)** :
- Blink existant : sur `<Animated.View style={[styles.resourceValues, animatedFormulairesStyle]}>` (enveloppe les **nombres**, pas l'icône).
- Pulse : wrapper `<Animated.View>` autour de `<ClipboardList>` (l'**icône**).
- Les deux wrappers sont **distincts** → aucun conflit.
- Mais condition : si `isStorageBlocked`, ne pas trigger le pulse formulaires. Ça évite l'accumulation visuelle.

**Tap dossiers (FR-008)** : ResourceBar ne connaît pas les taps de StampButton. Solution : callback `onDossierTap` passé depuis index.tsx OU utiliser un ref partagé OU passer via context. Solution retenue : exposer `triggerDossierIconPulse: () => void` dans GameStateContext, appelé par StampButton au moment du tap.

---

## F-003 : AdministrationCard — architecture wrappers imbriqués

**Fichier** : `components/AdministrationCard.tsx` (217 lignes)

**Structure actuelle** :
```
<Animated.View translateX={shakeAnim}>         ← RN Animated (shake)
  <TouchableOpacity overflow="hidden">         ← clip boundary
    <Image width="100%" height={200} />
    <View nameRow> ... </View>
    <View lockedOverlay /> (conditionnel)
  </TouchableOpacity>
</Animated.View>
```

**Contrainte RN Animated + Reanimated** : les deux systèmes **ne peuvent pas** être combinés sur le même composant (leurs transforms se marchent dessus). Il faut des wrappers View séparés.

**Structure cible** :
```
<Reanimated.View scale={breathAnim}>           ← Reanimated (breathing, FR-004)
  <Animated.View translateX={shakeAnim}>       ← RN Animated (shake, existant)
    <TouchableOpacity overflow="hidden">       ← clip boundary pour pan image
      <Reanimated.View translateX={panAnim} width="115%">  ← pan image (FR-005)
        <Image width="100%" height={200} />
      </Reanimated.View>
      <View nameRow>
        <Reanimated.View opacity+translateY>   ← nameRow fade-in (FR-006)
          <Text name />
        </Reanimated.View>
      </View>
      <View lockedOverlay /> (conditionnel)
    </TouchableOpacity>
  </Animated.View>
</Reanimated.View>
```

**Breathing (FR-004)** :
- `scale` : 1.0 → 1.008, période 2.5s, `withRepeat(withTiming(1.008, {duration: 1250}), -1, true)`.
- Démarrer avec `useEffect([isActive])` : si `isActive` → lance l'animation, sinon `cancelAnimation(breathAnim); breathAnim.value = withTiming(1, {duration: 200})`.
- S'applique aux cartes verrouillées aussi (overlay au-dessus).

**Pan (FR-005)** :
- `translateX` : 0 → -8 → 0 → 8 → 0, réalisé via `withRepeat(withTiming(-8, {duration: 3500}), -1, true)`.
- Image wrapper : `width: '115%'` (card = 300px → wrapper = 345px → marge 22px/côté > 8px pan).
- Uniquement si `administration.isUnlocked` (pas de pan sur locked).
- Démarrer/arrêter avec `useEffect([isActive, isUnlocked])`.

**overflow:hidden** : sur `TouchableOpacity` (`styles.container` ligne 135) → clip le pan automatiquement. ✓

**NameRow fade-in (FR-006)** :
- `nameOpacity = useSharedValue(0)`, `nameTranslateY = useSharedValue(6)`.
- `useEffect([isActive])` : si `isActive` → `withTiming(1, 180ms)` + `withTiming(0, 180ms)`. Reset à `0/6` au départ.
- S'applique à toutes les cartes (locked/unlocked) car le nom est toujours visible.

---

## F-004 : getClickMultiplier — exposition depuis le contexte

**Problème** : `getClickMultiplier` est appliqué en interne dans `incrementResource` (ligne 593-597 de `GameStateContext.tsx`). StampButton appelle `incrementResource('dossiers', 1)` — la valeur réelle incrémentée est `1 × multiplier` mais ce multiplier est opaque pour le composant.

**Solution** : Ajouter un `useMemo` dans `GameStateContext.tsx` :
```typescript
const dossierClickMultiplier = useMemo(
  () => getClickMultiplier(gameState.prestigeUpgrades, prestigeUpgrades),
  [gameState.prestigeUpgrades]
);
```
Exposer dans le provider value. StampButton affiche `+[dossierClickMultiplier]` dans le floating number.

**Solution alternative rejetée** : Modifier `incrementResource` pour renvoyer la valeur finale — imposerait de changer la signature partout et brise la séparation des couches.

---

## F-005 : Gestion de l'activation/désactivation des animations en loop

**Problème** : Les animations `withRepeat` infini (breathing, pan) consomment du thread UI même sur les cartes non-actives. Il faut les démarrer/arrêter proprement.

**Pattern** :
```typescript
useEffect(() => {
  if (isActive && !isLocked) {
    panAnim.value = withRepeat(withTiming(-8, { duration: 3500 }), -1, true);
  } else {
    cancelAnimation(panAnim);
    panAnim.value = withTiming(0, { duration: 300 });
  }
}, [isActive, administration.isUnlocked]);

useEffect(() => {
  if (isActive) {
    breathAnim.value = withRepeat(withTiming(1.008, { duration: 1250 }), -1, true);
  } else {
    cancelAnimation(breathAnim);
    breathAnim.value = withTiming(1.0, { duration: 200 });
  }
}, [isActive]);
```

**AppState (edge case spec)** : `useFocusEffect` ou `AppState` listener pour relancer les animations au retour foreground. À implémenter dans AdministrationCard via `AppState.addEventListener`.

---

## F-006 : triggerDossierIconPulse — pont StampButton → ResourceBar

**Problème** : ResourceBar doit pulser l'icône dossiers à chaque tap Tamponner (FR-008), mais ResourceBar et StampButton ne sont pas en relation parent-enfant directe.

**Options évaluées** :
1. ❌ Prop drilling depuis index.tsx : fragile, couplage fort.
2. ❌ Contexte React (nouveau) : over-engineering pour un signal unidirectionnel.
3. ✅ Callback via GameStateContext : `triggerDossierIconPulse: () => void` exposé. StampButton l'appelle au tap. ResourceBar s'y abonne via `useEffect`. Mais GameStateContext ne doit pas avoir de logique UI...
4. ✅ **Ref partagé** : un `useRef<() => void>` passé de ResourceBar vers index.tsx via callback `onRegisterPulse`, puis passé à StampButton. Trop complexe.
5. ✅ **Simple** : index.tsx est le parent commun. Utiliser `useCallback triggerDossierPulse` dans index.tsx, passer comme prop à StampButton et comme prop `externalTrigger` à ResourceBar.

**Solution retenue** : Passer un callback `onTap?: () => void` à StampButton depuis index.tsx. index.tsx crée `useCallback triggerDossierPulse` et le passe aux deux composants via props. ResourceBar expose `triggerDossierPulse` comme prop `onDossierTap?: () => void` (non-throttlé).

**Impact sur les types** : Ajouter `onTap?: () => void` à StampButton props, `onDossierTap?: () => void` à ResourceBar props.
