# Research: Fusion des onglets Bureau et Recrutement

**Feature**: `005-bureau-recrutement`
**Date**: 2026-02-26

---

## Finding 1 — Architecture de scroll actuelle (Bureau)

**Fichier** : `app/(tabs)/index.tsx`

Structure de scroll actuelle :
```
SafeAreaView
  ResourceBar
  ConformiteDisplay
  View mainContent (flex: 1, column)
    View header         ← titre admin séparé (À SUPPRIMER)
    View scrollContainer (flex: 1)
      ScrollView vertical   ← prend tout l'espace disponible
        ScrollView horizontal snap (snapToInterval = 300 + 20 = 320)
          AdministrationCard × N
        View additionalContent
          renderAgentInfo()  ← icônes uniquement (À REMPLACER)
    View buttonContainer    ← StampButton HORS ScrollView (fixe en bas ✅)
```

**Décision** : Le `buttonContainer` est déjà hors du ScrollView vertical → FR-009 (Tamponner fixe) est nativement respecté. Aucun changement de structure nécessaire pour ce point.

**Décision** : Option B (scroll unifié) est cohérente avec la structure existante. Le scroll vertical ⊃ scroll horizontal existe déjà dans Bureau — remplacer `renderAgentInfo()` par `AdminContentSection` ne crée pas de nouveau niveau d'imbrication.

---

## Finding 2 — Détection du snap pour synchronisation nom/illustration

**Problème** : Actuellement, `handleAdministrationPress` (tap) appelle `setActiveAdministration`. Un swipe manuel sans tap ne met pas à jour l'admin active.

**Solution** : Ajouter `onMomentumScrollEnd` sur le `ScrollView` horizontal :
```typescript
const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
  const x = event.nativeEvent.contentOffset.x;
  const index = Math.round(x / (300 + 20)); // CARD_INTERVAL = 320
  const admin = administrations[index];
  if (admin) setActiveAdministration(admin.id);
};
```

**Note** : `scrollTo({animated: true})` (déclenché par tap) ne fire pas `onMomentumScrollEnd` en React Native — les appels programmatiques n'émettent pas d'événements de momentum. Pas de double appel.

---

## Finding 3 — AdministrationCard : état actuel et modifications nécessaires

**Fichier** : `components/AdministrationCard.tsx` (155 lignes)

État actuel :
- `width: 300, height: 200`, `overflow: 'hidden'`
- `snapToInterval = 300 + 20 = 320` (dans index.tsx)
- Overlay cadenas avec coût + bouton Débloquer si `isUnlockable`
- `onPress={administration.isUnlocked ? onPress : undefined}` → les cartes verrouillées n'ont aucun handler actuellement

**Modifications nécessaires** :
1. **Nom sous l'illustration** : nouvelle section `View nameRow` sous l'image → hauteur totale carte passe à `200 + 44 = 244`. L'image prend `height: 200` explicite. Le `snapToInterval` est sur la largeur (pas la hauteur) → reste 320, aucun impact.
2. **Shake animation** : `Animated.Value` (translateX), séquence gauche/droite ~300ms. Déclenché quand carte verrouillée + `!isUnlockable`.
3. **Pastille unlockable** : petit badge positionné en absolu (top-right) visible quand `isUnlockable && !isUnlocked`. Contient « ! » (pas juste une couleur — respect AR-002).
4. **onPress toujours appelé** : changer pour que le tap déclenche toujours `onPress()` (scroll + setActive), PUIS gère unlock/shake si verrouillée.

**Contrainte SRP** : AdministrationCard passe de ~155 à ~200-210 lignes — reste sous 300. ✅

---

## Finding 4 — Principe V : violation dans recruitment.tsx (pré-existante)

`recruitment.tsx` importe directement depuis `/data` :
```typescript
import { storageUpgrades } from '@/data/gameData';
import { getVisibleStorageUpgrades, canPurchaseStorageUpgrade } from '@/data/storageLogic';
```

Cette violation est pré-existante. Pour la corriger lors de la fusion (et éviter de la reproduire dans `index.tsx`), on ajoute une méthode contexte :

```typescript
// Dans GameContextType + provider
getAdminStorageUpgrades: (adminId: string) => (Upgrade & { canPurchase: boolean })[];
```

Implémentation dans le contexte :
```typescript
const getAdminStorageUpgrades = useCallback((adminId: string) => {
  const adminIndex = gameState.administrations.findIndex(a => a.id === adminId);
  const visible = getVisibleStorageUpgrades(gameState, storageUpgrades);
  return visible
    .filter(u => u.administrationId === adminIndex + 1)
    .map(u => ({ ...u, canPurchase: canPurchaseStorageUpgrade(gameState, storageUpgrades, u.id) }));
}, [gameState]);
```

---

## Finding 5 — Extraction du composant AdminContentSection

**Problème** : `index.tsx` atteint ~225 lignes. Ajouter le bloc storage upgrades (~50 lignes) + AgentItem list + unlock message le ferait dépasser 300 lignes → violation Principe II.

**Solution** : Créer `components/AdminContentSection.tsx` (nouveau composant) :
- Appelle `useGameState()` lui-même (pas de props nécessaires)
- Rend : si admin active verrouillée → message + bouton déblocage ; sinon → upgrades stockage + AgentItem
- ~160-180 lignes, bien sous 300

`index.tsx` après : ~160-180 lignes. ✅

---

## Finding 6 — _layout.tsx : badges de navigation

Calculs actuels (lignes 49-54) :
```typescript
const unlockableCount = gameState.administrations.filter(
  admin => !admin.isUnlocked && canUnlockAdministration(admin.id)
).length;
const purchasableAgentsCount = unlockedAdmins.reduce((count, admin) => {
  return count + admin.agents.filter(agent => canPurchaseAgent(admin.id, agent.id)).length;
}, 0);
```

**Décision (Q3)** : Badge Bureau = `purchasableAgentsCount`. `unlockableCount` reste calculé mais n'alimente plus le badge — il sera utilisé par AdministrationCard (pastille) indirectement via le contexte `canUnlockAdministration`.

---

## Finding 7 — Suppression de recruitment.tsx

En Expo Router, un fichier dans `(tabs)/` crée un tab uniquement si une `Tabs.Screen name=` correspondante existe OU si le fichier est automatiquement discovert. Pour supprimer le tab proprement :
1. Supprimer `<Tabs.Screen name="recruitment" .../>` dans `_layout.tsx`
2. Supprimer `app/(tabs)/recruitment.tsx`

Les deux actions sont requises pour une suppression propre (pas de route fantôme).

---

## Alternatives rejetées

| Alternative | Rejetée parce que |
|---|---|
| Garder les deux onglets, juste corriger le sync nom/illustration | Ne résout pas le problème UX de fond (navigation split) |
| Option A (cartes fixes en haut) | Option B plus naturelle (existant dans Bureau), pas de complexité supplémentaire |
| Tabs texte dans la vue fusionnée (style Recrutement) | Perd les illustrations — point clé de la feature |
| Inliner le contenu de Recrutement dans index.tsx | Violerait la limite 300 lignes (Principe II) |
| Laisser la violation Principe V de storageLogic | Occasion de corriger lors de la réécriture de index.tsx |
