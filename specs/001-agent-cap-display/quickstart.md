# Quickstart — Affichage du plafond d'achat

**Feature**: `001-agent-cap-display`
**Fichier unique à modifier** : `components/AgentItem.tsx`

---

## Étape 1 — Modifier le rendu du compteur (header)

Localiser dans le JSX :

```tsx
<Text style={styles.ownedText}>x{agent.owned}</Text>
```

Remplacer par le bloc conditionnel :

```tsx
{agent.maxOwned !== undefined ? (
  <View style={styles.ownedRow}>
    <Text style={styles.ownedText}>x{agent.owned}</Text>
    <Text style={styles.ownedCap}>/{agent.maxOwned}</Text>
  </View>
) : (
  <Text style={styles.ownedText}>x{agent.owned}</Text>
)}
```

---

## Étape 2 — Mettre à jour `getAccessibilityLabel()`

Localiser la ligne de retour :

```ts
return `${agent.name}. ${agent.description}. ${production}. Coût: ${formatNumber(amount || 0)} ${resourceLabel}. Possédé: ${agent.owned}`;
```

Remplacer par :

```ts
const ownedLabel = agent.maxOwned !== undefined
  ? `Possédé : ${agent.owned} sur ${agent.maxOwned}`
  : `Possédé: ${agent.owned}`;
return `${agent.name}. ${agent.description}. ${production}. Coût: ${formatNumber(amount || 0)} ${resourceLabel}. ${ownedLabel}`;
```

---

## Étape 3 — Ajouter les styles dans `StyleSheet.create({...})`

Ajouter après `ownedText: { ... }` :

```ts
ownedRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
ownedCap: {
  fontFamily: 'Inter-Bold',
  fontSize: 14,
  color: Colors.textLight,
},
```

---

## Étape 4 — Lint

```bash
npm run lint
```

Aucune nouvelle erreur attendue.

---

## Validation manuelle

1. Ouvrir l'onglet **Recrutement** sur le **Bureau des Documents Obsolètes**
2. Le **Directeur de pôle** (maxOwned = 10) affiche `x0/10`, le `/10` en gris clair
3. Le **Stagiaire administratif** (sans plafond) affiche `x0` — aucun changement
4. Acheter 3 Directeurs de pôle → le compteur affiche `x3/10`
5. Atteindre 10/10 → `x10/10`, bouton désactivé
6. Activer VoiceOver → l'agent annonce « Possédé : 3 sur 10 » pour les agents plafonnés
