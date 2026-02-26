---
name: idle-game
description: Patterns et pièges spécifiques aux jeux idle/incrémentaux. Game loop, production offline, escalade des coûts, prestige, équilibrage, feedback joueur.
---

# Idle Game — Patterns et pièges

## Game loop (ce projet)

```typescript
// setInterval à 100ms dans GameStateContext.tsx
// Valeurs lues par le loop → useRef (jamais useState → évite les stale closures)
// Timestamps : lastUpdateTimeRef.current = Date.now()
// Delta time : (now - last) / 1000 → secondes écoulées → multiplier par production/s

// Pattern production offline :
// Au retour foreground (AppState 'active'), calculer le temps écoulé depuis
// la dernière sauvegarde et appliquer la production accumulée (cappée si nécessaire)
```

## Production cache

```typescript
// Ce projet : productionCacheRef invalide uniquement quand administrations change
// (pas à chaque tick → évite recalcul O(n²) constant)
// Recalculer si : agent acheté, admin débloquée, prestige appliqué
```

## Escalade des coûts (idle standard)

```typescript
// Ce projet : getEscalatedAgentCost(agent, owned) dans data/gameData.ts
// Formule typique : baseCost * scalingFactor^owned
// Afficher toujours le coût ACTUEL (après escalade), jamais le coût de base
// Badge d'achat : canPurchaseAgent() doit tenir compte du coût escaladé
```

## Pending updates pattern

```typescript
// React setState est async — dans le game loop, accumuler les changements dans une ref
// Snapshot AVANT de vider (sinon race condition) :
const pending = { ...pendingUpdatesRef.current };
pendingUpdatesRef.current = {};
// Puis appliquer pending dans setGameState()
```

## Feedback joueur (UX idle)

- **Nombre toujours lisible** : utiliser `formatNumberFrench()` — afficher `1,5M` pas `1500000`
- **Progrès visible** : progress bars, compteurs animés, toasts pour les milestones
- **Boutons d'achat** : afficher le coût dans le bouton lui-même (pas à côté), désactiver clairement si insuffisant
- **Production par seconde** : afficher le taux en temps réel, pas juste le stock
- **Animations d'achat** : feedback immédiat (scale/bounce sur l'icône de ressource), avant même la confirmation du state

## Équilibrage (règles générales)

- **Courbe exponentielle** : chaque achat doit prendre ~30-60% plus de ressources que le précédent
- **First purchase immediacy** : le premier agent doit être achetable dans les 30 premières secondes
- **Prestige seuil** : le prestige ne doit être accessible que quand le joueur a atteint un plateau visible
- **Storage cap** : bloquer doucement (icône rouge) avant de bloquer dur — prévenir avant de frustrer

## Conformité (système custom ce projet)

```
Débloque quand : 5e admin active + highestEverTampons >= 1000 + highestEverFormulaires >= 100
Activation : 40 000 tampons + 10 000 formulaires (one-time)
Progression : tranches de 10% via formule exponentielle
Seuils dans : data/conformiteLogic.ts
```

## Prestige (ce projet)

```typescript
// Gain : getPrestigePotentialLive() — toujours utiliser cette version live pour l'affichage
// Effets : 'click_multiplier' | 'production_bonus' | 'storage_bonus'
// Validation achat : canPurchasePrestigeUpgrade() dans data/prestigeLogic.ts
```

## Pièges courants idle game

| Piège | Symptôme | Solution |
|---|---|---|
| Stale closure dans setInterval | Production bloquée à 0 | useRef pour les valeurs lues dans le loop |
| Double-comptage production | Ressources ×2 inexpliqué | Vider pendingUpdates AVANT de setter |
| Re-render trop fréquent | Lag UI à chaque tick | Séparer state display / state loop |
| Coût escalade mal appliqué | Agents "gratuits" après N achats | Passer `owned` au moment de l'achat, pas avant |
| Save pendant le loop | Perte de données au crash | Debounce 5s, ne jamais sauvegarder dans le tick lui-même |
| Production offline infinie | Joueur déconnecté = richesse infinie | Capper le offline time (ex: 8h max) |

## Ressources ce projet

```
dossiers   (#e67e22 orange)  — ressource principale, produite par tap + agents
tampons    (#3498db bleu)    — ressource secondaire
formulaires (#9b59b6 violet) — stockage cappé jusqu'à Vide Juridique
```

## S.I.C. (système de messages)

- Milestones : tous les 100 dossiers / 50 tampons / 25 formulaires
- Non-conformité : 0,2% par milestone, max 1 par 10 minutes
- Journal : max 500 entrées FIFO
- Cooldown basé sur timestamp, pas sur compteur — résistant aux resets
