# Tasks: 006-animations — Vie et feedback

**Input**: `specs/006-animations/` (spec.md, plan.md, research.md, data-model.md, quickstart.md)
**Branch**: `006-animations`

---

## Phase 1 : Fondamental (bloquant toutes les US)

**Objectif** : Exposer le multiplicateur de clic depuis le context + câbler le signal tap dans index.tsx. Ces deux tâches débloquent les phases suivantes.

- [ ] T001 `context/GameStateContext.tsx` — ajouter `dossierClickMultiplier: number` : interface `GameContextType` + `useMemo(() => getClickMultiplier(gameState.prestigeUpgrades, prestigeUpgrades), [gameState.prestigeUpgrades])` + exposition dans le provider value
- [ ] T002 [P] `app/(tabs)/index.tsx` — ajouter `const [dossierTapSignal, setDossierTapSignal] = useState(0)` + `const handleStampTap = useCallback(() => setDossierTapSignal(s => s + 1), [])` + passer `dossierTapSignal` à `<ResourceBar>` et `onTap={handleStampTap}` à `<StampButton>`

**Checkpoint** : Foundation prête — les phases 2, 3, 4 peuvent démarrer.

---

## Phase 2 : User Story 1 — Feedback immédiat tap (Priorité : P1) 🎯

**Objectif** : Tap Tamponner → bouton descend + 5 particules oranges + floating "+N" + icône 📄 pulse.

**Test indépendant** : Tapper Tamponner → observer translateY + particules + float simultanément.

- [ ] T003 [US1] `components/StampButton.tsx` — remplacer animation scale (RN Animated) par `pressAnim = useSharedValue(0)` (Reanimated v3) + `animatedButtonStyle` (`translateY: pressAnim.value`) + appliquer `animatedButtonStyle` sur `<Reanimated.View>` wrappant le bouton. Supprimer `const [scale]` et toute référence.

- [ ] T004 [P] [US1] `components/StampButton.tsx` — ajouter pool de 5 particules RN Animated : `const PARTICLE_ANGLES = [0, 72, 144, 216, 288].map(d => d * Math.PI / 180)` + `const particles = useRef(PARTICLE_ANGLES.map(() => ({ tx: new Animated.Value(0), ty: new Animated.Value(0), op: new Animated.Value(0) }))).current` + fonction `fireParticles()` (reset + Animated.parallel translateX/Y/opacity, dist 40-70px, 450ms, `useNativeDriver: true`) + rendu JSX : 5 `<Animated.View>` `position:'absolute'` `alignSelf:'center'` rond 7×7px `Colors.resourceDossiers` avec transform+opacity

- [ ] T005 [P] [US1] `components/StampButton.tsx` — ajouter composant `FloatingNumber({ value, onDone })` (Reanimated : translateY 0→-60 700ms + opacity fade 100+600ms + xOffset ±15px + `setTimeout(onDone, 700)`) + `+{formatNumberFrench(value)}` + style `position:'absolute'` `Inter-Bold` 18px `Colors.resourceDossiers` + dans `StampButton` : `type FloatEntry = { key: number; value: number }` + `const [activeFloats, setActiveFloats] = useState<FloatEntry[]>([])` + `const floatKeyRef = useRef(0)` + `addFloat(value)` (ignore si ≥5) + `removeFloat(key)` + rendu JSX `{activeFloats.map(f => <FloatingNumber key={f.key} value={f.value} onDone={() => removeFloat(f.key)} />)}`

- [ ] T006 [US1] `components/StampButton.tsx` — mettre à jour `handlePress` : (1) haptics Medium, (2) `pressAnim.value = withSequence(withTiming(4, {duration:80}), withSpring(0, {damping:6, stiffness:200}))`, (3) `fireParticles()`, (4) `addFloat(dossierClickMultiplier)`, (5) `incrementResource('dossiers', 1)`, (6) `onTap?.()`. Ajouter prop `onTap?: () => void` à l'interface `StampButtonProps`.

- [ ] T007 [US1] `components/ResourceBar.tsx` — ajouter prop `dossierTapSignal?: number` + `const dossierTapScale = useSharedValue(1)` + `const dossierTapStyle = useAnimatedStyle(() => ({ transform: [{ scale: dossierTapScale.value }] }))` + `useEffect([dossierTapSignal])` : si `dossierTapSignal > 0` → `dossierTapScale.value = withSequence(withSpring(1.25, {damping:10}), withSpring(1))` (non-throttlé) + wraper `<File>` dans `<Animated.View style={dossierTapStyle}>`. Imports à ajouter : `withSequence`, `withSpring`.

**Checkpoint** : US1 complète et testable indépendamment.

---

## Phase 3 : User Story 2 — Vie continue des illustrations (Priorité : P1) 🎯

**Objectif** : Carte active = breathing scale (2.5s) + pan image (7s) + nameRow fade-in au snap.

**Test indépendant** : Observer la carte active 3s sans toucher → pan et breathing perceptibles.

- [ ] T008 [US2] `components/AdministrationCard.tsx` — ajouter imports Reanimated : `import Reanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated'` + ajouter `AppState` aux imports `react-native` + déclarer les 4 shared values après `shakeAnim` : `breathAnim = useSharedValue(1)`, `panAnim = useSharedValue(0)`, `nameOpacity = useSharedValue(isActive ? 1 : 0)`, `nameTranslateY = useSharedValue(0)` + déclarer les 3 animated styles (`breathStyle`, `panStyle`, `nameAnimStyle`)

- [ ] T009 [P] [US2] `components/AdministrationCard.tsx` — `useEffect([isActive])` breathing : si `isActive` → `withRepeat(withTiming(1.008, {duration:1250}), -1, true)`, sinon `cancelAnimation(breathAnim)` + `withTiming(1.0, {duration:200})`

- [ ] T010 [P] [US2] `components/AdministrationCard.tsx` — `useEffect([isActive, administration.isUnlocked])` pan : si `isActive && isUnlocked` → `withRepeat(withTiming(-8, {duration:3500}), -1, true)`, sinon `cancelAnimation(panAnim)` + `withTiming(0, {duration:300})`. Ajouter style `imageWrapper: { width: '115%', alignSelf: 'center' }` dans `StyleSheet.create`.

- [ ] T011 [P] [US2] `components/AdministrationCard.tsx` — `useEffect([isActive])` nameRow fade-in : si `isActive` → reset `nameOpacity.value = 0; nameTranslateY.value = 6;` puis `withTiming(1, {duration:180})` et `withTiming(0, {duration:180})`

- [ ] T012 [US2] `components/AdministrationCard.tsx` — `useEffect([isActive, administration.isUnlocked])` AppState listener : sur `'active'` et `isActive` → relancer `panAnim` (si unlocked) + `breathAnim` (toujours). Retourner `sub.remove()` dans le cleanup.

- [ ] T013 [US2] `components/AdministrationCard.tsx` — restructurer le JSX : remplacer `<Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>` par structure 4 niveaux : `<Reanimated.View style={breathStyle}>` → `<Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>` → `<TouchableOpacity ...>` → `<Reanimated.View style={[styles.imageWrapper, panStyle]}>` → `<Image>`. Entourer `<Text name>` dans le nameRow d'un `<Reanimated.View style={nameAnimStyle}>`. Tout le reste (overlay, badge) inchangé.

**Checkpoint** : US2 complète et testable indépendamment (US1 toujours fonctionnelle).

---

## Phase 4 : User Story 3 — Pulse production automatique (Priorité : P2)

**Objectif** : Icônes ressources pulsent max 1×/s quand la production automatique incrémente.

**Test indépendant** : Avoir ≥1 agent actif → observer les icônes de la ResourceBar pendant 3s → pulse périodique visible.

- [ ] T014 [US3] `components/ResourceBar.tsx` — ajouter shared values pour tampons et formulaires : `tamponsScale = useSharedValue(1)` + `formulairesScale = useSharedValue(1)` + `const lastPulseRef = useRef({ dossiers: 0, tampons: 0, formulaires: 0 })` + fonction `triggerPulse(r, throttle)` : si formulaires bloqué → skip ; si throttle && `Date.now() - lastPulse[r] < 1000` → skip ; sinon `sv.value = withSequence(withSpring(1.25, {damping:10}), withSpring(1))` + mettre à jour timestamp. Ajouter `tamponsStyle` et `formulairesStyle` via `useAnimatedStyle`. Wrapper `<Stamp>` dans `<Animated.View style={tamponsStyle}>` et `<ClipboardList>` dans `<Animated.View style={formulairesStyle}>` (séparé du wrapper blink existant sur `resourceValues`).

- [ ] T015 [US3] `components/ResourceBar.tsx` — `useEffect([gameState?.resources])` détection production : `const prevDossiers = useRef<number|null>(null)` + idem tampons + formulaires. Dans le useEffect : si `curr.dossiers > prev` → `triggerPulse('dossiers', true)`, idem tampons, idem formulaires (uniquement si non bloqué). Mettre à jour les 3 refs à la fin.

**Checkpoint** : US3 complète (US1 + US2 + US3 toutes fonctionnelles).

---

## Phase 5 : Polish

- [ ] T016 `npm run lint` → corriger toutes les nouvelles erreurs ESLint (variables inutilisées, types manquants, imports orphelins). Valider la checklist complète de `specs/006-animations/quickstart.md`.

---

## Dépendances et ordre d'exécution

### Dépendances entre phases

- **Phase 1** (T001, T002) : aucune dépendance — démarrage immédiat
- **Phase 2** (T003–T007) : dépend de T001 (dossierClickMultiplier pour T005/T006) et T002 (onTap prop pour T006/T007)
- **Phase 3** (T008–T013) : indépendante de Phase 2 — peut démarrer dès Phase 1 complète
- **Phase 4** (T014–T015) : T014 avant T015 ; indépendante de Phase 2 et 3
- **Phase 5** (T016) : dépend de toutes les phases

### Parallélisme dans Phase 2

- T003, T004, T005 touchent le même fichier mais des zones distinctes → implémentables séquentiellement sans bloquer la logique ; T006 les agrège.
- T007 (ResourceBar) peut démarrer dès T002 complète, en parallèle avec T003–T005.

### Parallélisme dans Phase 3

- T009, T010, T011 = 3 `useEffect` indépendants dans le même fichier → après T008, implémenter dans l'ordre mais aucune dépendance entre eux.
- T012 dépend de T008 mais pas de T009/T010/T011.
- T013 dépend de T008, T009, T010, T011 (JSX utilise tous les styles).

### Parallélisme Phase 3 vs Phase 4

- Phase 4 (ResourceBar) est totalement indépendante de Phase 3 (AdministrationCard) → peuvent être faites dans n'importe quel ordre après Phase 1.
