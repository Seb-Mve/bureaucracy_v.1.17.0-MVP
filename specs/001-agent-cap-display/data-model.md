# Data Model & Component Design: Affichage du plafond d'achat

**Feature**: `001-agent-cap-display`
**Date**: 2026-02-25

## Périmètre

Changement purement présentatiel. Aucun changement de type, de contexte ou de logique métier.

**Seul fichier modifié** : `components/AgentItem.tsx`

---

## Rendu du compteur `ownedText`

### Avant (actuel)

```tsx
<Text style={styles.ownedText}>x{agent.owned}</Text>
```

Style actuel :
```ts
ownedText: {
  fontFamily: 'Inter-Bold',
  fontSize: 14,
  color: Colors.title,
}
```

### Après (agents non plafonnés — inchangé)

```tsx
<Text style={styles.ownedText}>x{agent.owned}</Text>
```

### Après (agents plafonnés — `agent.maxOwned !== undefined`)

```tsx
<View style={styles.ownedRow}>
  <Text style={styles.ownedText}>x{agent.owned}</Text>
  <Text style={styles.ownedCap}>/{agent.maxOwned}</Text>
</View>
```

Nouveaux styles :
```ts
ownedRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
ownedCap: {
  fontFamily: 'Inter-Bold',
  fontSize: 14,
  color: Colors.textLight,   // '#666666' — dénominateur atténué
},
```

> `ownedText` garde exactement son style actuel (couleur `Colors.title`, taille 14, Inter-Bold).

---

## `getAccessibilityLabel()` — fragment `Possédé`

### Avant

```ts
return `${agent.name}. ${agent.description}. ${production}. Coût: ${formatNumber(amount || 0)} ${resourceLabel}. Possédé: ${agent.owned}`;
```

### Après

```ts
const ownedLabel = agent.maxOwned !== undefined
  ? `Possédé : ${agent.owned} sur ${agent.maxOwned}`
  : `Possédé: ${agent.owned}`;

return `${agent.name}. ${agent.description}. ${production}. Coût: ${formatNumber(amount || 0)} ${resourceLabel}. ${ownedLabel}`;
```

---

## Localisation du changement dans `AgentItem.tsx`

```
components/AgentItem.tsx
├── return JSX
│   └── <View style={styles.header}>
│       ├── <Text style={styles.name}>{agent.name}</Text>
│       └── [CHANGE] Conditionnel : View+2×Text (plafonné) | Text (non plafonné)
├── getAccessibilityLabel()
│   └── [CHANGE] Fragment `Possédé` conditionnel
└── StyleSheet
    └── [CHANGE] Ajouter styles.ownedRow et styles.ownedCap
```

---

## Aucun changement requis dans

| Fichier | Raison |
|---|---|
| `types/game.ts` | `maxOwned?: number` déjà présent |
| `context/GameStateContext.tsx` | Aucune nouvelle méthode nécessaire |
| `data/gameData.ts` | Données statiques inchangées |
| `utils/stateMigration.ts` | Aucun champ d'état modifié |
| Tout autre composant | Feature isolée à AgentItem |
