# Research: Limite de Stockage des Formulaires

**Date**: 2025-01-24  
**Branch**: `002-formulaires-storage-cap`

## Recherche 1 : Animation Clignotement avec react-native-reanimated v3

### Contexte
Besoin d'un clignotement rouge infini (opacity 0↔1, fréquence 2Hz) sur le compteur de ressources, avec arrêt conditionnel immédiat lorsque `isStorageBlocked` passe à `false`.

### Question de recherche
Quelle API reanimated v3 permet un loop infini avec contrôle conditionnel externe ?

### Décision
Utiliser le pattern suivant :
```typescript
const opacity = useSharedValue(1);

useEffect(() => {
  if (isStorageBlocked) {
    opacity.value = withRepeat(
      withTiming(0, { duration: 250 }), // 250ms = 2Hz (aller-retour 500ms)
      -1, // infinite loop
      true  // reverse
    );
  } else {
    opacity.value = withTiming(1, { duration: 0 }); // arrêt immédiat
  }
}, [isStorageBlocked]);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value
}));
```

### Rationale
- **`withRepeat(-1, true)`** : Loop infini avec inversion automatique (0→1→0)
- **`duration: 250ms`** : 250ms aller + 250ms retour = 500ms total = 2Hz (conforme WCAG <3Hz)
- **Arrêt instantané** : `withTiming(1, { duration: 0 })` reset immédiat sans transition
- **Contrôle externe** : `useEffect` surveille `isStorageBlocked` du GameStateContext

### Alternatives considérées
1. **Animated.loop (React Native Animated API)** : Plus ancien, moins performant que reanimated v3
2. **setInterval JavaScript** : Pas de synchronisation UI thread, risque de lag
3. **CSS animation via style** : Non supporté en React Native

### Source
- Documentation officielle react-native-reanimated v3 : `withRepeat` + `useSharedValue`
- Pattern déjà utilisé dans le codebase pour d'autres animations (à vérifier)

---

## Recherche 2 : Impact Performance Clignotement + Game Loop

### Contexte
Le jeu a un game loop existant à 100ms (`setInterval` dans GameStateContext). Le clignotement ajoute une animation continue. Risque de conflit ou de drop de frames ?

### Question de recherche
`withRepeat` en loop infini interfère-t-il avec le game loop à 100ms ? Performance 60fps garantie ?

### Décision
**Pas de conflit attendu** : reanimated v3 utilise le UI thread natif via `worklets`, complètement découplé du JS thread où tourne le game loop.

### Rationale
- **Worklets** : Les animations reanimated v3 s'exécutent sur le UI thread natif, pas sur le JS thread
- **Game loop** : `setInterval` dans GameStateContext s'exécute sur le JS thread
- **Isolation** : Les deux threads sont indépendants, pas de contention
- **Benchmark** : Animations reanimated conçues pour 60fps même avec calculs lourds en JS

### Test de validation
Durant l'implémentation, vérifier avec React DevTools Profiler que :
- Le clignotement ne cause pas de re-renders du composant parent (utiliser `React.memo`)
- Le compteur FPS reste stable à ~60 pendant le clignotement
- Le game loop continue à s'exécuter à 100ms (vérifier logs de production)

### Alternatives considérées
1. **Throttle l'animation** : Inutile, worklets déjà optimisés
2. **Désactiver le clignotement si FPS <30** : Over-engineering, pas nécessaire

### Source
- react-native-reanimated v3 documentation (worklets architecture)
- Retour d'expérience communauté React Native (animations continues)

---

## Recherche 3 : Atomicité Transaction Achat Upgrade

### Contexte
Lors de l'achat d'un upgrade de stockage, le stock doit passer à 0 **puis** la nouvelle limite s'applique. Si la production automatique génère des formulaires pendant cette transaction, ils ne doivent pas être perdus.

### Question de recherche
Comment garantir l'atomicité de l'opération `stock = 0 → cap = nouvelle_valeur` avec production automatique active ?

### Décision
**Transaction synchrone dans GameStateContext** :
```typescript
const purchaseStorageUpgrade = useCallback((upgradeId: string) => {
  setGameState(prev => {
    // 1. Vérification pré-conditions (synchrone)
    const upgrade = findUpgrade(upgradeId);
    if (!canPurchase(prev, upgrade)) return prev;
    
    // 2. Transaction atomique (objet retourné en une seule fois)
    return {
      ...prev,
      resources: {
        ...prev.resources,
        formulaires: 0 // reset immédiat
      },
      currentStorageCap: upgrade.newCap, // nouvelle limite
      purchasedUpgrades: [...prev.purchasedUpgrades, upgradeId]
    };
  });
}, []);
```

### Rationale
- **`setGameState` atomique** : React garantit que la fonction de mise à jour est exécutée de manière atomique
- **Objet retourné en une fois** : Pas d'état intermédiaire où stock=0 mais cap=ancienne_valeur
- **Game loop suivant** : Le prochain tick (100ms) verra déjà la nouvelle limite et ajoutera la production normalement

### Gestion de la production automatique
Le game loop (100ms) :
```typescript
setInterval(() => {
  setGameState(prev => {
    const production = calculateAutoProduction(prev);
    const newStock = Math.min(
      prev.resources.formulaires + production,
      prev.currentStorageCap ?? Infinity
    );
    return { ...prev, resources: { ...prev.resources, formulaires: newStock } };
  });
}, 100);
```

**Séquence temporelle** :
1. T=0ms : Joueur clique "Acheter upgrade" → `purchaseStorageUpgrade()` appelé
2. T=0ms : Transaction atomique → stock=0, cap=1983
3. T=100ms : Game loop tick → production=5 → stock=min(0+5, 1983)=5 ✅
4. Aucun formulaire perdu

### Alternatives considérées
1. **Double dispatch (reset puis update cap)** : Risque d'état intermédiaire invalide
2. **Lock mutex pendant transaction** : Inutile, React déjà thread-safe pour setState
3. **Queue d'événements** : Over-engineering, synchrone suffit

### Source
- React documentation : `setState` with updater function (atomic guarantees)
- Pattern existant dans GameStateContext (achat agents/upgrades similaire)

---

## Recherche 4 : Best Practices Formatage Nombres Français

### Contexte
Les nombres de formulaires doivent s'afficher avec espaces pour les milliers (1 000, 1 983, 11 025).

### Question de recherche
Quelle méthode pour formater les nombres en français dans React Native ?

### Décision
Utiliser `Intl.NumberFormat` avec locale française :
```typescript
const formatNumber = (n: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
};

// Exemples :
formatNumber(983);    // "983"
formatNumber(1983);   // "1 983" (espace fine insécable U+202F)
formatNumber(11025);  // "11 025"
```

### Rationale
- **Standard ECMA-402** : Support natif dans tous les navigateurs et React Native
- **Espace fine insécable** : `Intl` utilise automatiquement U+202F (correct en typographie française)
- **Pas de dépendance externe** : Intégré au runtime JavaScript

### Pattern existant
Vérifier si une fonction `formatNumber()` existe déjà dans `utils/` ou `helpers/`. Si oui, la réutiliser. Sinon, créer dans `utils/formatters.ts`.

### Alternatives considérées
1. **Regex replacement** : `n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')` → Moins fiable, pas d'espace fine
2. **Librairie numeral.js** : Dépendance inutile pour un cas simple
3. **Formatage manuel** : Pas de support locale automatique

### Source
- MDN Web Docs : `Intl.NumberFormat`
- React Native compatibility (supporté depuis JSC moderne)

---

## Résumé des Décisions Techniques

| Problématique | Solution Retenue | Raison Principale |
|--------------|------------------|-------------------|
| Animation clignotement | `withRepeat(-1, true)` avec `useSharedValue` | Loop infini + arrêt conditionnel simple |
| Performance 60fps | Worklets reanimated v3 (UI thread natif) | Isolation du game loop (JS thread) |
| Atomicité achat | Transaction synchrone `setGameState` atomique | React garantit atomicité setState |
| Formatage nombres | `Intl.NumberFormat('fr-FR')` | Standard natif, espace fine correcte |

**Toutes les clarifications sont résolues. Passage Phase 1 autorisé.**
