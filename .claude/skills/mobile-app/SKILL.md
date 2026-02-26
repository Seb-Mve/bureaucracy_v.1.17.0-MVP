---
name: mobile-app
description: Référence pour les contraintes et bonnes pratiques spécifiques aux apps mobiles iOS/Android avec Expo/React Native. Lifecycle, orientation, safe areas, keyboard, deep links, stockage local.
---

# Mobile App — Contraintes et patterns

## Tailles d'écran et layout

```typescript
import { Dimensions, Platform } from 'react-native';
const { width, height } = Dimensions.get('window');

// Portrait only (ce projet) — pas besoin de gérer la rotation
// Safe area OBLIGATOIRE sur tous les écrans :
import { SafeAreaView } from 'react-native-safe-area-context';

// Hauteurs de barre de navigation (ce projet) :
const tabBarHeight = Platform.OS === 'ios' ? 90 : 65;
const tabBarPaddingBottom = Platform.OS === 'ios' ? 30 : 10;
```

## Lifecycle app (background/foreground)

```typescript
import { AppState } from 'react-native';

// Détecter le retour au premier plan (important pour les idle games)
useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      // Recalculer la production offline depuis le dernier timestamp
    }
  });
  return () => sub.remove();
}, []);
```

## Stockage local (AsyncStorage)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ce projet : clé 'bureaucracy_game_state', auto-save toutes les 5s
// Pattern : debounce dans useRef, JAMAIS await bloquant dans le game loop
// Sauvegarder en JSON.stringify(gameState)
// Toujours valider/migrer au chargement via isValidGameState() + migrateGameState()
```

## Clavier et inputs

```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  {/* Contenu avec inputs */}
</KeyboardAvoidingView>
```

## Fonts Expo

```typescript
// Fonts chargées dans _layout.tsx via useFonts()
// Disponibles : 'Inter-Regular', 'Inter-SemiBold', 'Inter-Bold', 'ArchivoBlack-Regular'
// Splash screen masqué une fois les fonts chargées (SplashScreen.hideAsync())
// Toujours vérifier fontsLoaded avant de rendre les écrans
```

## Navigation (expo-router)

```
app/(tabs)/          → onglets principaux
app/_layout.tsx      → layout racine, fonts, splash
app/(tabs)/_layout.tsx → config des tabs (icônes, badges, titres)
```

- Routes basées sur les fichiers — ajouter/supprimer un fichier = ajouter/supprimer une route
- Supprimer un onglet : 1) retirer `<Tabs.Screen>` du layout, 2) supprimer le fichier
- Modaux : utiliser `Modal` de react-native ou une route `app/modal.tsx`

## Performance mobile

- Éviter les `console.log` en production (impact mesurable sur JS thread)
- `InteractionManager.runAfterInteractions` pour les tâches lourdes post-navigation
- Préférer `setInterval` (comme ce projet, 100ms) à `requestAnimationFrame` pour la logique de jeu
- Images : `resizeMode: 'cover'` + dimensions explicites pour éviter le layout thrash
- Éviter les re-renders inutiles : `React.memo` + `useCallback` + `useMemo`

## iOS vs Android — différences clés

| Sujet | iOS | Android |
|---|---|---|
| Ombres | `shadow*` props | `elevation` |
| Safe area | Notch/Dynamic Island | Status bar variable |
| Haptics | Natif (expo-haptics) | Moteur vibration |
| Font rendering | Sub-pixel smooth | Légèrement différent |
| ScrollView momentum | Plus prononcé | Plus abrupt |

## Débogage mobile

```bash
npm run dev        # Expo Go / simulateur
# i = iOS simulator, a = Android emulator, w = browser (web fallback)
# Shake device / Cmd+D (iOS sim) → Expo Dev Menu
# Cmd+I (iOS sim) → React DevTools
```
