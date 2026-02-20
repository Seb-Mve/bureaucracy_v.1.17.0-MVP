# Research Document: Système de Prestige "Réforme Administrative"

**Phase**: 0 (Outline & Research)  
**Date**: 2025-01-21  
**Status**: Complete

## Purpose

Ce document résout toutes les questions "NEEDS CLARIFICATION" identifiées dans la phase de Technical Context et établit les décisions techniques fondamentales pour le système de prestige.

---

## Research Task 1: Two-Phase Commit pour AsyncStorage

### Decision
Implémentation d'un **pseudo two-phase commit simplifié** avec journal de transaction temporaire et récupération au redémarrage.

### Rationale
- **Problème** : En cas de crash pendant le prestige (après reset mais avant sauvegarde des Trombones), risque de perte de données
- **Solution** : Flag `prestigeInProgress` + snapshot pré-prestige dans AsyncStorage
- **Pattern existant** : Le code actuel n'a pas de two-phase commit, mais utilise des `setGameState` atomiques au niveau React
- **Inspiration** : Pattern du `storageLogic.ts` (validation stricte avant mise à jour)

### Implementation Pattern

```typescript
// Phase 1: Write transaction log
await AsyncStorage.setItem('prestige_transaction', JSON.stringify({
  timestampStart: Date.now(),
  prestigeInProgress: true,
  prePrestigeSnapshot: {
    paperclips: currentPaperclips,
    totalAdministrativeValue: currentVAT
  },
  expectedGain: calculatedPaperclips
}));

// Phase 2: Execute prestige (reset resources, credit paperclips)
setGameState(newState);

// Phase 3: Commit and clear transaction log
await AsyncStorage.multiSet([
  ['bureaucracy_game_state', JSON.stringify(newState)],
  ['prestige_transaction', ''] // Clear transaction
]);
```

**Recovery on crash** :
```typescript
// On app startup (GameStateContext.tsx)
const transaction = await AsyncStorage.getItem('prestige_transaction');
if (transaction && JSON.parse(transaction).prestigeInProgress) {
  // Complete or rollback based on timestamp age
  const { expectedGain, prePrestigeSnapshot } = JSON.parse(transaction);
  // If < 30s ago → complete prestige (credit paperclips)
  // If > 30s ago → rollback to snapshot
}
```

### Alternatives Considered
- **Full ACID transactions** : Trop complexe pour AsyncStorage (pas de support natif)
- **No transaction** : Risque élevé de perte de Trombones (inacceptable pour monnaie de prestige)
- **Optimistic lock** : Complexe à implémenter sans backend

---

## Research Task 2: Multiplicateurs de Prestige - Application Ordre

### Decision
**Multiplicateurs multiplicatifs** entre eux, appliqués dans l'ordre : spécifiques → globaux.

### Rationale
- **Cohérence** : Pattern utilisé pour les bonus d'agents existants (voir `calculateProduction` dans GameStateContext.tsx)
- **Évolutivité** : Permet d'ajouter facilement de nouveaux multiplicateurs sans casser l'équilibrage
- **Transparence** : Calcul prévisible pour le joueur

### Formula

**RÈGLE EXPLICITE** : Plusieurs bonus de la **même catégorie** sont **multiplicatifs entre eux** (pas additifs). Ce pattern est cohérent avec le système de bonus existant dans `calculateProduction`.

```typescript
// Exemple : Production de Dossiers avec 2 upgrades actifs
const baseDossiers = 100; // Production de base

// Étape 1 : Multiplicateurs spécifiques (Optimisation des Flux +10%)
const afterSpecific = baseDossiers * 1.1; // = 110

// Étape 2 : Multiplicateurs globaux (Synergie Administrative +10%)
const final = afterSpecific * 1.1; // = 121 dossiers/sec

// Formule générale :
// production_final = production_base * (1 + sum(bonus_spécifiques)) * (1 + sum(bonus_globaux))

// IMPORTANT : Si plusieurs bonus de même catégorie (ex: +10% dossiers ET +5% dossiers)
// Ils se multiplient : 100 × 1.10 × 1.05 = 115.5 (PAS 100 × 1.15 = 115)
```

### Test Cases
| Upgrades Actifs | Production Base | Calcul | Résultat |
|----------------|----------------|--------|----------|
| Aucun | 100 | 100 | 100 |
| Optimisation Flux (+10% dossiers) | 100 | 100 × 1.1 | 110 |
| Synergie (+10% global) | 100 | 100 × 1.1 | 110 |
| Optimisation + Synergie | 100 | 100 × 1.1 × 1.1 | 121 |

### Alternatives Considered
- **Additifs** : `100 × (1 + 0.1 + 0.1) = 120` → Moins intéressant stratégiquement
- **Ordre arbitraire** : Risque de comportement incohérent

---

## Research Task 3: Formatage des Grands Nombres en Français

### Decision
Réutilisation de la fonction existante `formatNumberFrench()` dans `utils/formatters.ts`.

### Implementation
```typescript
// Fonction existante (déjà implémentée)
export function formatNumberFrench(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.floor(value));
}

// Usage pour Trombones
<Text>{formatNumberFrench(gameState.paperclips)} Trombones</Text>
// Output : "1 234 567 Trombones"
```

### Verification
- ✅ Supporte les millions : `1234567` → `"1 234 567"`
- ✅ Espace insécable : `\u00A0` (conforme au français)
- ✅ Pas de décimales pour les Trombones (entiers uniquement)

### Alternatives Considered
- **Custom formatter** : Redondant, la fonction existante est complète
- **Bibliothèque externe** : Overhead inutile

---

## Research Task 4: Calcul de la Valeur Administrative Totale (VAT)

### Decision
**Tracking incrémental** : La VAT est incrémentée à chaque production de ressource, pas recalculée rétrospectivement.

### Rationale
- **Performance** : Évite les boucles coûteuses sur l'historique de production
- **Simplicité** : Un seul champ `totalAdministrativeValue` dans GameState
- **Précision** : Chaque production incrémente VAT immédiatement

### Implementation

```typescript
// Dans GameStateContext.tsx, updateGameLoop()
const newResources = { ...gameState.resources };
const vatDelta = { dossiers: 0, tampons: 0, formulaires: 0 };

// Production passive (agents)
Object.entries(productionCache).forEach(([resource, amount]) => {
  const produced = amount * deltaSeconds;
  newResources[resource] += produced;
  vatDelta[resource] += produced;
});

// Mise à jour VAT
const totalVATGain = vatDelta.dossiers + vatDelta.tampons + vatDelta.formulaires;
newGameState.totalAdministrativeValue += totalVATGain;
```

**Important** : La VAT est également incrémentée lors de **clics manuels** (bouton TAMPONNER).

### Edge Case Handling
- **Storage cap** : Si formulaires bloqués, la production continue mais les formulaires sont cappés → VAT compte quand même la production "perdue"
- **Reset après prestige** : VAT remise à 0 immédiatement

### Alternatives Considered
- **Recalcul rétrospectif** : Impossible (l'historique complet n'est pas stocké)
- **VAT séparée par ressource** : Inutile (la formule de prestige somme tout)

---

## Research Task 5: Système de Strates (Tier Progression)

### Decision
Les strates existent **déjà** dans le système v4, référencées dans `spec.md` comme "Dependency 1".

### Verification (Code Audit)
Recherche effectuée dans la codebase :
- **Résultat** : Aucune implémentation trouvée dans v4 actuel
- **Implication** : Les strates doivent être ajoutées dans cette feature

### Implementation Plan
```typescript
// types/game.ts
export type Tier = 'local' | 'national' | 'global';

export interface GameState {
  // ... existing fields
  currentTier: Tier; // Default: 'local'
}

// data/prestigeLogic.ts
export const TIER_COEFFICIENTS: Record<Tier, number> = {
  local: 1000,
  national: 5000,
  global: 25000
};
```

### Unlock Conditions (Out of Scope for this Feature)
La spec indique que les strates sont "débloquées" lors de la progression, mais les conditions précises ne sont pas spécifiées. Pour cette feature :
- **Default tier** : `'local'` pour tous les joueurs (nouveaux et existants)
- **Persistence** : `currentTier` persiste après prestige
- **Future work** : Un système de déblocage des strates sera ajouté dans une feature ultérieure

### Alternatives Considered
- **Tier par nombre de prestiges** : Ex: 5 prestiges → national. Rejeté (trop arbitraire sans équilibrage)
- **Tier par Trombones totaux** : Ex: 1000 Trombones → national. Rejeté (même raison)

---

## Research Task 6: Feedback Visuel "+2" pour Tampon Double Flux

### Decision
Réutilisation du système de **floating text** existant (si présent) ou création d'un composant `FloatingText.tsx` simple.

### Implementation Pattern

```typescript
// components/FloatingText.tsx (si pas déjà existant)
export function FloatingText({ value, x, y, onComplete }: Props) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(-50, { duration: 1000 });
    opacity.value = withTiming(0, { duration: 1000 }, () => {
      runOnJS(onComplete)();
    });
  }, []);

  return (
    <Animated.Text style={[styles.floatingText, { opacity, transform: [{ translateY }] }]}>
      +{value}
    </Animated.Text>
  );
}

// Usage dans le bouton TAMPONNER
const onTamponnerClick = () => {
  const gain = hasPrestigeUpgrade('prestige_01') ? 2 : 1;
  incrementResource('dossiers', gain);
  spawnFloatingText(gain); // "+2" ou "+1"
};
```

### Visual Behavior
- **Animation** : Fade + translate vers le haut (1 seconde)
- **Position** : Au-dessus du bouton TAMPONNER
- **Couleur** : Vert (#4ade80) pour gain positif
- **Multi-spawn** : Si le joueur clique rapidement, plusieurs "+2" peuvent apparaître simultanément

### Alternatives Considered
- **Toast notification** : Trop invasif pour un feedback de clic répété
- **Pas de feedback** : Viole le Principe I (feedback immédiat requis)

---

## Research Task 7: Migration AsyncStorage v4 → v5

### Decision
Suivre le pattern existant dans `utils/stateMigration.ts` (migration chaînée v1→v2→v3→v4).

### Migration Logic

```typescript
// Dans migrateGameState() (utils/stateMigration.ts)
export function migrateGameState(loaded: unknown): GameState {
  const s = loaded as Record<string, unknown>;
  const version = (s.version as number | undefined) || 1;

  // V4 → V5 Migration: Add prestige system
  if (version === 4) {
    console.log('[Migration] v4→v5: Adding prestige system');
    return {
      ...s,
      version: 5,
      paperclips: 0, // Default: no paperclips on first migration
      totalAdministrativeValue: 0, // Reset VAT (fresh start)
      currentTier: s.currentTier ?? 'local', // Default to local tier
      prestigeUpgrades: {}, // No upgrades active initially
      prestigeInProgress: false // No transaction in progress
    } as GameState;
  }

  // Already at v5 or newer
  if (version >= 5) {
    return s as unknown as GameState;
  }

  // Chain migration for older versions
  // ... (existing v1→v2→v3→v4 logic)
}
```

### Data Preservation Rules
- **Paperclips** : Toujours 0 pour joueurs existants (pas de Trombones rétroactifs)
- **Tier** : Préserver si existant, sinon `'local'`
- **VAT** : Toujours réinitialiser à 0 (pas de calcul rétroactif de VAT)
- **Upgrades** : Objet vide (aucun upgrade actif par défaut)

### Validation (Phase de Test)
```typescript
// Scénario de test manuel
1. Charger une sauvegarde v4 avec ressources élevées (ex: 10k dossiers)
2. Lancer l'app avec migration v5
3. Vérifier : paperclips = 0, totalAdministrativeValue = 0, currentTier = 'local'
4. Confirmer : aucune perte de resources/agents existants
```

### Alternatives Considered
- **Calcul rétroactif de VAT** : Impossible (historique de production non enregistré)
- **Migration "douce" v4.1** : Complexifie le versioning, rejeté

---

## Summary of Decisions

| Research Task | Decision | Key Takeaway |
|--------------|----------|--------------|
| Two-Phase Commit | Pseudo 2PC avec transaction log | Évite perte de Trombones sur crash |
| Multiplicateurs | Multiplicatifs, ordre spécifiques→globaux | Cohérent avec agents existants |
| Formatage nombres | Réutiliser `formatNumberFrench()` | Déjà implémenté, conforme français |
| VAT Tracking | Incrémental (pas rétrospectif) | Performance + simplicité |
| Strates | Ajout dans cette feature (non existant v4) | `currentTier: 'local'` par défaut |
| Feedback "+2" | Floating text component | Feedback immédiat, animation 1s |
| Migration v5 | Pattern chaîné existant | paperclips=0, VAT=0 par défaut |

---

## Next Steps (Phase 1)

Toutes les clarifications sont résolues. Phase 1 peut commencer :
1. **Data Model** : Définir les entités (Trombone, PrestigeUpgrade, PrestigeState)
2. **Contracts** : Créer les types TypeScript pour les opérations de prestige
3. **Quickstart** : Guide d'intégration pour les développeurs
