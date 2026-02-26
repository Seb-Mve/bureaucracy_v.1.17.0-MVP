---
name: ux-review
description: Revue UX/UI d'un composant ou d'un écran React Native. Vérifie l'accessibilité, la hiérarchie visuelle, les animations, le texte français, la cohérence avec le design system du projet.
argument-hint: [nom du composant ou écran]
---

# UX Review — BUREAUCRACY++

Analyse le composant ou l'écran demandé et produis un rapport structuré.

## 1. Lire le fichier cible

Lis le composant ou l'écran fourni en argument. Si aucun argument, demande lequel analyser.

## 2. Accessibilité (Constitution Principe IV)

- [ ] Toutes les cibles tactiles ≥ 44×44 points (`minHeight: 44`, `minWidth: 44`)
- [ ] Les icônes seules ont un `accessibilityLabel` descriptif
- [ ] Le statut d'un élément n'est pas transmis uniquement par la couleur (icône + texte requis)
- [ ] Contraste texte WCAG 2.1 AA : vérifier que les couleurs viennent de `Colors.ts` et sont compatibles
- [ ] `accessibilityRole`, `accessibilityState`, `accessibilityHint` présents sur les éléments interactifs

## 3. Design system

- [ ] Toutes les couleurs viennent de `constants/Colors.ts` — aucune valeur hex codée en dur
- [ ] Polices : `Inter-Regular`, `Inter-SemiBold`, `Inter-Bold` uniquement (+ `ArchivoBlack-Regular` pour titres)
- [ ] `StyleSheet.create` utilisé — aucun style inline
- [ ] Espacements cohérents (multiples de 4 ou 8)
- [ ] Ombres iOS (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) ET Android (`elevation`) présentes sur les cartes/boutons

## 4. Texte français

- [ ] Orthographe et grammaire correctes
- [ ] Accents et caractères spéciaux présents (é, è, ê, à, ç, œ, «», …)
- [ ] Apostrophes typographiques ou échappées si nécessaire dans JSX
- [ ] Terminologie administrative cohérente avec le reste du jeu
- [ ] Nombres formatés avec `formatNumberFrench()` — jamais `.toLocaleString()` directement

## 5. Interactions et animations

- [ ] Feedback visuel immédiat sur les taps (< 100ms perçu)
- [ ] Animations via `react-native-reanimated` v3 (`useSharedValue` + `useAnimatedStyle`) — ou `Animated` core si `useNativeDriver: true` possible
- [ ] Aucune animation gérée via `setState`
- [ ] Les boutons désactivés sont visuellement distincts (couleur `Colors.buttonDisabled`)
- [ ] Haptics : `Light` pour taps, `Medium` pour achats, `Success` pour déblocages

## 6. Structure et performance

- [ ] Composant ≤ 300 lignes
- [ ] `FlatList` si la liste peut dépasser 10 items (pas `ScrollView`)
- [ ] `React.memo` sur les composants de liste
- [ ] `useCallback`/`useMemo` sur les props et valeurs dérivées passées à des listes
- [ ] `Pressable` uniquement — jamais `TouchableOpacity` ni `TouchableHighlight` dans le nouveau code

## 7. Rapport

Produis le rapport avec ce format :

```
## UX Review — [NomComposant]

### ✅ Points positifs
- ...

### ⚠️ Points à corriger
| Problème | Localisation | Correction suggérée |
|---|---|---|
| ... | ligne X | ... |

### 💡 Suggestions UX (non bloquantes)
- ...
```

Si tout est conforme, indique-le clairement. Propose les corrections directement si demandé.
