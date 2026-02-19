# BUREAUCRACY++ 🗂️

[![Version](https://img.shields.io/badge/version-1.17.0--MVP-blue.svg)](package.json)
[![Expo SDK](https://img.shields.io/badge/Expo-53.0.0-000020.svg?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.79.1-61DAFB.svg?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![State Schema](https://img.shields.io/badge/GameState-v4-9b59b6.svg)](#persistance--migration)

> Jeu incrémental/idle satirique sur la bureaucratie française. Gérez des ressources administratives, recrutez des agents et déverrouillez des administrations pour automatiser votre production.

---

## Sommaire

1. [Description](#description)
2. [Installation & démarrage](#installation--démarrage)
3. [Commandes](#commandes)
4. [Architecture du projet](#architecture-du-projet)
5. [Stack technique](#stack-technique)
6. [Systèmes de jeu](#systèmes-de-jeu)
   - [Ressources](#ressources)
   - [Boucle principale](#boucle-principale)
   - [Agents & administrations](#agents--administrations)
   - [Système de bonus](#système-de-bonus)
   - [Stockage des formulaires](#stockage-des-formulaires)
   - [Conformité aléatoire](#conformité-aléatoire)
   - [Système S.I.C. / Journal](#système-sic--journal)
7. [State management (GameStateContext)](#state-management-gamestatectextx)
8. [Couche données (data/)](#couche-données-data)
9. [Composants UI](#composants-ui)
10. [Types TypeScript](#types-typescript)
11. [Formatage & utilitaires](#formatage--utilitaires)
12. [Persistance & migration](#persistance--migration)
13. [Palette de couleurs](#palette-de-couleurs)
14. [Constitution & règles du projet](#constitution--règles-du-projet)
15. [Workflow SpecKit](#workflow-speckit)
16. [Compatibilité](#compatibilité)

---

## Description

**BUREAUCRACY++** est un jeu mobile incrémental développé avec React Native et Expo. Le joueur incarne un fonctionnaire qui accumule trois ressources bureaucratiques en cliquant sur un tampon et en recrutant des agents qui produisent automatiquement.

### Ressources

| Icône | Ressource | Couleur |
|-------|-----------|---------|
| 📁 | **Dossiers** | Orange `#e67e22` |
| 🏷️ | **Tampons** | Bleu `#3498db` |
| 📋 | **Formulaires** | Violet `#9b59b6` |

Chaque ressource sert à la fois de **monnaie** (coût d'achat d'agents) et d'**objectif** (progression, déblocages).

---

## Installation & démarrage

### Prérequis

- Node.js 18+ (recommandé : 20.x LTS)
- npm
- iOS : Xcode 15+ (macOS uniquement)
- Android : Android Studio + JDK 17

```bash
git clone <repository-url>
cd bureaucracy_v.1.17.0-MVP
npm install
```

---

## Commandes

```bash
npm run dev          # Serveur Expo (i = iOS Simulator, a = Android, w = browser)
npm run build:web    # Export statique web (dist/)
npm run lint         # Expo lint (ESLint)
```

---

## Architecture du projet

```
bureaucracy_v.1.17.0-MVP/
│
├── app/                          # Expo Router — écrans & navigation
│   ├── (tabs)/
│   │   ├── index.tsx             # Bureau principal (tampon + carousel admins)
│   │   ├── recruitment.tsx       # Recrutement agents + déblocage admins + upgrades stockage
│   │   ├── progression.tsx       # Statistiques (ressources, production, agents)
│   │   └── options.tsx           # Paramètres (son, haptiques, reset)
│   └── _layout.tsx               # Layout racine + chargement fonts
│
├── components/
│   ├── ResourceBar.tsx           # Barre de ressources (header, toutes les tabs)
│   ├── StampButton.tsx           # Bouton TAMPONNER (production manuelle)
│   ├── AdministrationCard.tsx    # Carte carousel d'une administration
│   ├── AgentItem.tsx             # Ligne d'un agent dans la liste recrutement
│   ├── ConformiteDisplay.tsx     # Widget conformité aléatoire
│   ├── Toast.tsx                 # Notification éphémère S.I.C./non-conformité
│   ├── JournalDrawer.tsx         # Modale plein écran du journal S.I.C.
│   └── JournalEntry.tsx          # Ligne individuelle du journal
│
├── context/
│   └── GameStateContext.tsx      # Source de vérité unique — état + actions + boucle de jeu
│
├── data/
│   ├── gameData.ts               # Données statiques : administrations, agents, upgrades
│   ├── conformiteLogic.ts        # Formules et seuils du système conformité (pur)
│   ├── messageSystem.ts          # Pool S.I.C., probabilités, jalons (pur)
│   └── storageLogic.ts           # Règles du plafond de stockage formulaires (pur)
│
├── types/
│   └── game.ts                   # Toutes les interfaces TypeScript du jeu
│
├── utils/
│   ├── formatters.ts             # formatNumberFrench() — conventions FR
│   └── stateMigration.ts         # Migrations v1→v4, validation d'état
│
├── constants/
│   └── Colors.ts                 # Palette unique de couleurs
│
├── hooks/
│   └── useFrameworkReady.ts      # Chargement fonts (Inter, ArchivoBlack)
│
├── specs/                        # Spécifications de fonctionnalités (SpecKit)
├── .specify/                     # Infrastructure SpecKit (agents, templates, constitution)
│
├── app.json                      # Config Expo
├── package.json
└── tsconfig.json                 # TypeScript strict mode
```

### Flux de données

```
User tap
  └─► incrementResource()  ──────────────────────────────────────────┐
                                                                      │
setInterval 100ms                                                     ▼
  └─► calculateProduction(gameState)                        GameStateContext
         │                                                 (état central React)
         ├─► applyPendingUpdates()                                    │
         │      └─► setGameState(prev => ({ ...snapshot }))          │
         │                                                            │
         └─► showToast() / addJournalEntry()                         │
                                                              AsyncStorage
                                                          (debounce 5 000ms)
```

**Règle de dépendance** : Composants → Context → Data (jamais l'inverse). Les composants ne doivent pas importer directement depuis `data/`.

---

## Stack technique

| Catégorie | Technologie | Version |
|-----------|------------|---------|
| Framework | React Native | 0.79.1 |
| SDK | Expo | ~53.0.0 |
| Langage | TypeScript | 5.x strict |
| Navigation | Expo Router | v4 (file-based) |
| État | React Context + useState/useRef | — |
| Persistance | @react-native-async-storage | — |
| Animations | react-native-reanimated | v3 (UI thread) |
| Icônes | lucide-react-native + @lucide/lab | — |
| Fonts | Inter (400/600), ArchivoBlack (400) | @expo-google-fonts |
| Haptiques | expo-haptics | — |
| Gradients | expo-linear-gradient | — |
| Blur | expo-blur | — |

---

## Systèmes de jeu

### Ressources

Les trois ressources (`dossiers`, `tampons`, `formulaires`) sont définies dans `types/game.ts` :

```ts
interface Resources {
  dossiers: number;
  tampons: number;
  formulaires: number;
}
```

Toutes sont des `number` flottants. L'affichage utilise `formatNumberFrench()` pour arrondir/abréger. Les formulaires sont soumis au **plafond de stockage**.

### Boucle principale

Définie dans `GameStateContext.tsx` :

- **Intervalle** : 100 ms (`UPDATE_INTERVAL`)
- **Delta time** : `(Date.now() - lastUpdateTimeRef.current) / 1000` — temps réel écoulé, compensé si le rendu prend plus de 100 ms
- **Cache de production** : `productionCacheRef` — recalculé uniquement quand `administrations` change (invalidé via `useEffect([gameState.administrations])`)
- **Sauvegarde** : debounce 5 000 ms (`SAVE_INTERVAL`), clé AsyncStorage `bureaucracy_game_state`

> ⚠️ **Invariant critique** : dans `applyPendingUpdates`, les mises à jour en attente doivent être snapshotées **avant** d'être effacées. Le `setGameState(prev => ...)` de React est appelé de façon asynchrone ; si `pendingUpdatesRef.current` est vidé avant que React appelle l'updater, la mise à jour est un no-op.
>
> ```ts
> // ✅ Correct
> const snapshot = { ...pendingUpdatesRef.current };
> pendingUpdatesRef.current = {};
> setGameState(prev => ({ ...prev, ...snapshot }));
>
> // ❌ Bugué — ref vidée avant que React appelle l'updater
> setGameState(prev => ({ ...prev, ...pendingUpdatesRef.current }));
> pendingUpdatesRef.current = {};
> ```

### Agents & administrations

Définis dans `data/gameData.ts`.

#### 5 Administrations

| # | ID | Nom | Coût de déblocage |
|---|----|----|-------------------|
| 1 | `administration-centrale` | Bureau des Documents Obsolètes | — (déverrouillée par défaut) |
| 2 | `service-tampons` | Service des Tampons Tamponnés | 500 tampons |
| 3 | `cellule-verification` | Cellule de Vérification des Vérifications | *(voir gameData)* |
| 4 | `division-archivage` | Division de l'Archivage Physique | 1 000 formulaires |
| 5 | `agence-redondance` | Agence de Redondance Non Justifiée | 5 000 formulaires |

Chaque administration possède 5 agents.

#### Structure d'un agent (`Agent`)

```ts
interface Agent {
  id: string;
  name: string;
  description: string;
  cost: Partial<Resources>;         // coût d'achat (une seule ressource en pratique)
  baseProduction: Partial<Production>; // production automatique /s (peut être vide)
  productionBonus?: {               // bonus sans production directe
    target: 'dossiers' | 'tampons' | 'formulaires' | 'all';
    value: number;
    isPercentage: boolean;
    isGlobal: boolean;              // true = s'applique à toutes les admins
  };
  owned: number;
  incrementThreshold: number;       // seuil pour bonus d'incrément
  incrementValue: number;
  incrementIsPercentage: boolean;
}
```

**Ajouter un agent/administration** :
1. Ajouter la définition dans le tableau `administrations` de `data/gameData.ts`
2. `isUnlocked: false` par défaut sauf `administration-centrale`
3. Si l'agent n'a pas de production directe, `baseProduction: {}` + définir `productionBonus`
4. `incrementIsPercentage: true` = bonus en %, `false` = valeur fixe

### Système de bonus

`calculateProduction(state)` dans `GameStateContext.tsx` :

1. **Production de base** : `agent.baseProduction[ressource] × agent.owned` → additionné à `newProduction`
2. **Bonus locaux** (`isGlobal: false`) : appliqués uniquement à la production de l'administration courante, en pourcentage (`newProduction[target] *= (1 + value/100 × owned)`)
3. **Bonus globaux** (`isGlobal: true`) : accumulent un multiplicateur global `bonusMultipliers[target]` appliqué à la fin sur `newProduction`
4. **Multiplicateur `all`** : si `bonusMultipliers.all > 1`, toutes les ressources sont multipliées

### Stockage des formulaires

Les formulaires sont soumis à un **plafond de stockage** (`currentStorageCap` dans `GameState`).

| État initial | `currentStorageCap: 983` |
|---|---|

#### 4 upgrades de stockage (séquence stricte)

| ID | Nom | Coût | Nouveau plafond | Admin requise |
|----|-----|------|-----------------|---------------|
| `storage_upgrade_1` | Casier de Secours B-9 | 983 formulaires | 1 983 | 2 |
| `storage_upgrade_2` | Rayonnage Vertical Optimisé | 1 983 formulaires | 4 583 | 3 |
| `storage_upgrade_3` | Compression d'Archives A-1 | 4 583 formulaires | 11 025 | 4 |
| `storage_upgrade_4` | Vide Juridique de Stockage | 11 025 formulaires | illimité (`null`) | 5 |

**Visibilité** : les upgrades n'apparaissent dans l'onglet Recrutement que lorsque `resources.formulaires >= currentStorageCap` (stockage bloqué).

**Achat** : réinitialise les formulaires à 0 (coût = tout le stock), met à jour `currentStorageCap`.

**Indicateur visuel** : quand bloqué, l'icône formulaires dans `ResourceBar` passe en rouge et clignote (animation reanimated ~2 Hz).

Logique pure dans `data/storageLogic.ts` :
- `isStorageBlocked(state)` — détecte le blocage
- `applyStorageCap(stock, cap)` — plafonne le stock
- `canPurchaseStorageUpgrade(state, upgrades, id)` — valide séquence + coût
- `getVisibleStorageUpgrades(state, upgrades)` — filtre d'affichage

### Conformité aléatoire

Système de méta-progression visible après que la 5e administration est débloquée.

#### Déverrouillage (affichage)
Conditions (vérifiées en boucle de jeu) :
- `highestEverTampons >= 1 000` ET
- `highestEverFormulaires >= 100` ET
- Administration `agence-redondance` débloquée

#### Activation (one-time)
- Coût : **40 000 tampons** + **10 000 formulaires**
- Action irréversible — `conformite.isActivated = true`

#### Progression passive (post-activation)
Formule exponentielle par tranche de 10% :

```
Formulaires pour 1% = 1 000 × (1,1) ^ floor(pourcentage_actuel / 10)
```

| Tranche | Formulaires/% |
|---------|--------------|
| 0–9% | 1 000 |
| 10–19% | 1 100 |
| 50–59% | 1 611 |
| 90–99% | 2 358 |
| Total 0→100% | ~159 390 formulaires |

- `accumulatedFormulaires` : formulaires accumulés depuis l'activation
- `calculateConformitePercentageNew(0, accumulated)` recalcule le % à chaque tick

#### Bouton Réaffectation différée
Apparaît quand `conformite.percentage >= 100`. Mécanique prestige (Phase 2, non encore implémentée).

#### Seuils & constantes (`data/conformiteLogic.ts`)

```ts
UNLOCK_TAMPONS = 1_000
UNLOCK_FORMULAIRES = 100
ACTIVATION_COST_TAMPONS = 40_000
ACTIVATION_COST_FORMULAIRES = 10_000
MAX_PERCENTAGE = 100
TEST_COST = 150          // formulaires par test manuel
TEST_GAIN = 3            // % gagné par test
TEST_DEBOUNCE_MS = 500
```

### Système S.I.C. / Journal

**S.I.C.** = Service Inconnu de Coordination — messages bureaucratiques mystérieux.

#### Déclenchement (dans la boucle de jeu)
Un message est tenté à chaque franchissement de **jalons de production** :

| Ressource | Jalon |
|-----------|-------|
| Dossiers | tous les 100 |
| Tampons | tous les 50 |
| Formulaires | tous les 25 |

#### Probabilités S.I.C. (`data/messageSystem.ts`)

| Cooldown depuis dernier message | Probabilité |
|--------------------------------|-------------|
| Jamais déclenché | 12,5 % |
| < 5 min | 2 % |
| 5–30 min | 12,5 % |
| > 30 min | 20 % |

#### Alertes non-conformité
- Probabilité : **0,2 %** par jalon
- Rate-limit : max 1 toutes les **10 minutes**
- Message : `"Tampon non conforme détecté. Analyse en cours."`
- Priorité sur les messages S.I.C. (vérifié en premier)

#### Toast
Composant `Toast.tsx` : slide-in depuis le haut + micro-bounce (reanimated). Auto-dismiss selon `duration` ms. Max **3 toasts visibles** simultanément (overflow silencieusement ignoré).

Types : `'sic'` | `'non-conformity'` | `'phase2'` | `'system'`

#### Journal
`JournalDrawer.tsx` : modale plein écran (slide-up). Liste `FlatList` triée par timestamp décroissant. Max **500 entrées** (FIFO). 3 types d'entrées : `'sic'`, `'non-conformity'`, `'narrative-hint'`. Les `narrative-hint` ont un texte caché révélé par `revealNarrativeHint(targetId)`.

---

## State management (GameStateContext)

Fichier : `context/GameStateContext.tsx`

Consommé via le hook `useGameState()` — **ne jamais importer le Context directement**.

### GameState (v4)

```ts
interface GameState {
  version: number;                    // schema version (actuellement 4)
  resources: Resources;
  production: Production;
  administrations: Administration[];
  activeAdministrationId: string;
  lastTimestamp: number | null;
  currentStorageCap: number | null;   // null = illimité
  conformite?: ConformiteState;
  messageSystem?: MessageSystemState;
  journal: JournalEntry[];            // max 500, FIFO
}
```

### Actions exposées

| Action | Signature | Effet |
|--------|-----------|-------|
| `incrementResource` | `(resource, amount) => void` | +amount à une ressource (clic tampon) |
| `purchaseAgent` | `(adminId, agentId) => boolean` | Déduit le coût, incrémente `owned` |
| `unlockAdministration` | `(adminId) => boolean` | Déduit le coût, `isUnlocked = true` |
| `setActiveAdministration` | `(adminId) => void` | Change l'admin active |
| `purchaseStorageUpgrade` | `(upgradeId) => boolean` | Remet formulaires à 0, met à jour cap |
| `activateConformite` | `() => boolean` | Déduit coût, active le système |
| `performConformiteTest` | `() => boolean` | Déduit 150 formulaires, +3% |
| `showToast` | `(msg, type, duration?) => void` | Enfile un toast |
| `dismissToast` | `(toastId) => void` | Retire le toast |
| `addJournalEntry` | `(type, text, opts?) => void` | Ajoute une entrée journal |
| `revealNarrativeHint` | `(targetId) => void` | Révèle un narrative-hint |

### Valeurs calculées exposées

| Prop | Type | Description |
|------|------|-------------|
| `isStorageBlocked` | `boolean` | formulaires >= cap |
| `shouldShowConformite` | `boolean` | 5e admin débloquée |
| `canActivateConformite` | `boolean` | seuils tampons+formulaires atteints |
| `isConformiteUnlocked` | `() => boolean` | conformite.isUnlocked |
| `isPhase2ButtonActive` | `() => boolean` | conformite.percentage >= 100 |
| `toastQueue` | `ToastMessage[]` | file d'attente toasts |
| `formatNumber` | `(n) => string` | alias de formatNumberFrench |

### Refs internes (ne pas utiliser en dehors du Context)

| Ref | Rôle |
|-----|------|
| `lastUpdateTimeRef` | timestamp du dernier tick (delta time) |
| `productionCacheRef` | cache du calcul de production |
| `pendingUpdatesRef` | accumulation des mises à jour du tick courant |
| `gameLoopRef` | handle de l'intervalle |
| `saveTimeoutRef` | handle du debounce de sauvegarde |

---

## Couche données (data/)

**Règle** : toutes les fonctions sont pures (pas d'import React, pas de side effects).

### `data/gameData.ts`

- `administrations: Administration[]` — données statiques complètes
- `storageUpgrades: Upgrade[]` — 4 upgrades de stockage
- `initialGameState: GameState` — état initial du jeu (v4)

### `data/conformiteLogic.ts`

| Fonction | Signature | Description |
|----------|-----------|-------------|
| `calculateConformitePercentage` | `(lifetimeFormulaires) → number` | Ancienne formule linéaire (150 formulaires/%) |
| `calculateConformitePercentageNew` | `(startingPercent, formulairesProduced) → number` | Formule exponentielle actuelle |
| `getFormulairesRequiredForNextPercent` | `(currentPercent) → number` | Coût du prochain % |
| `shouldUnlockConformite` | `(tampons, formulaires, lastAdminUnlocked) → boolean` | Condition de déverrouillage |
| `canPerformTest` | `(formulaires, lastTimestamp, isUnlocked) → boolean` | Validation test manuel |
| `canActivateConformite` | `(tampons, formulaires) → boolean` | Validation activation |

### `data/messageSystem.ts`

| Fonction | Signature | Description |
|----------|-----------|-------------|
| `getRandomSICMessage` | `() → string` | Message aléatoire du pool |
| `calculateSICProbability` | `(lastTriggerTime) → number` | 0,02–0,20 selon cooldown |
| `shouldTriggerNonConformity` | `(lastTime) → boolean` | 0,2 % + rate-limit 10 min |
| `hasCrossedMilestone` | `(current, last, threshold) → boolean` | Détection franchissement jalon |

### `data/storageLogic.ts`

| Fonction | Signature | Description |
|----------|-----------|-------------|
| `isStorageBlocked` | `(state) → boolean` | formulaires >= cap |
| `applyStorageCap` | `(stock, cap) → number` | Plafonnement |
| `canPurchaseStorageUpgrade` | `(state, upgrades, id) → boolean` | Séquence + coût |
| `getStorageCapAfterUpgrade` | `(upgrades, id) → number\|null` | Nouveau cap |
| `getVisibleStorageUpgrades` | `(state, upgrades) → Upgrade[]` | Filtre affichage |
| `getNextStorageCap` | `(state, upgrades) → number\|null` | Prochain cap |

---

## Composants UI

Tous les composants importent l'état via `useGameState()`. Ils n'ont **aucune logique métier**.

| Composant | Ecran(s) | Description |
|-----------|---------|-------------|
| `ResourceBar` | Toutes tabs | Barre de ressources en haut. Clignote en rouge si stockage bloqué (reanimated). Accessible `accessibilityRole="summary"`. |
| `StampButton` | Bureau | Bouton TAMPONNER. Haptic Medium, animation scale (legacy Animated). `incrementResource('dossiers', 1)`. |
| `AdministrationCard` | Bureau | Carte 300×200 avec image. Overlay verrouillage + bouton Débloquer si déverrouillable. |
| `AgentItem` | Recrutement | Ligne agent : nom, description, production, bouton achat. Animation Zap/Battery au clic (reanimated). Accessible. |
| `ConformiteDisplay` | Bureau | Widget conformité (barre de progression, bouton Activer, bouton Réaffectation). Caché si 5e admin non débloquée. |
| `Toast` | Overlay global | Notification éphémère slide-in. Types : sic / non-conformity / phase2 / system. Max 3. |
| `JournalDrawer` | Overlay global | Modale plein écran journal. FlatList optimisée (`getItemLayout`, `removeClippedSubviews`). |
| `JournalEntry` | JournalDrawer | Ligne individuelle du journal. |

---

## Types TypeScript

Fichier unique : `types/game.ts`

```ts
type ResourceType = 'dossiers' | 'tampons' | 'formulaires'
interface Resources { dossiers, tampons, formulaires: number }
interface Production { dossiers, tampons, formulaires: number }
interface Agent { id, name, description, cost, baseProduction, productionBonus?, owned, ... }
interface Administration { id, name, unlockCost, agents, isUnlocked, imagePath }
interface ConformiteState { percentage, isUnlocked, isActivated, accumulatedFormulaires,
                            lifetimeFormulaires, lastTestTimestamp, highestEverTampons,
                            highestEverFormulaires }
interface MessageSystemState { sicLastTriggerTime, nonConformityLastTriggerTime,
                               lastProductionMilestone }
interface ToastMessage { id, text, type, duration, timestamp }
interface JournalEntry { id, type, text, timestamp, isRevealed?, revealedText?, targetId? }
interface Upgrade { id, name, description, cost, effect, type, isPurchased,
                    administrationId?, storageConfig? }
interface GameState { version, resources, production, administrations,
                      activeAdministrationId, lastTimestamp, currentStorageCap,
                      conformite?, messageSystem?, journal }
```

---

## Formatage & utilitaires

### `utils/formatters.ts`

`formatNumberFrench(value: number): string` — conventions françaises :

| Valeur | Résultat |
|--------|---------|
| 0,05 | `"0,05"` |
| 9,5 | `"9,50"` |
| 12,3 | `"12,3"` |
| 150 | `"150"` |
| 1 500 | `"1,5 k"` |
| 2 500 000 | `"2,5 M"` |

**Règle** : toujours utiliser `formatNumberFrench` (via `formatNumber` du context) pour afficher les nombres dans l'UI. Ne jamais appeler `.toString()` ou `.toFixed()` directement dans les composants.

---

## Persistance & migration

**Clé AsyncStorage** : `bureaucracy_game_state`  
**Schéma actuel** : v4  

### Historique des migrations

| Version | Ajout | Chemin de migration |
|---------|-------|---------------------|
| v1 | État de base | → v3 : ajoute conformite + messageSystem + journal |
| v2 | conformite (sans `isActivated`) | → v2 : patch `isActivated` + `accumulatedFormulaires`, puis → v3 |
| v3 | journal | → v4 : ajoute `currentStorageCap: 983` |
| **v4** | `currentStorageCap` | — (version courante) |

Les migrations sont chaînées dans `utils/stateMigration.ts` via des appels récursifs à `migrateGameState`.

**Ajouter une migration** :
1. Incrémenter `version` dans `initialGameState` (gameData.ts)
2. Ajouter un bloc `if (version === N)` **avant** le bloc `if (version >= N+1)` dans `migrateGameState`
3. Chaîner avec un appel récursif
4. Mettre à jour `isValidGameState` pour les nouveaux champs requis

---

## Palette de couleurs

`constants/Colors.ts` — toutes les couleurs de l'app. **Ne jamais utiliser de valeur hexadécimale directement dans les composants.**

| Token | Valeur | Usage |
|-------|--------|-------|
| `background` | `#f9edcd` | Fond général |
| `title` | `#4b6c8c` | Titres |
| `text` | `#333333` | Texte courant |
| `textLight` | `#666666` | Labels secondaires |
| `border` | `#e0d5b8` | Bordures |
| `buttonPrimary` | `#f0ab63` | Bouton principal |
| `buttonPrimaryPressed` | `#e59c54` | État pressé |
| `buttonDisabled` | `#cccccc` | Bouton désactivé |
| `resourceDossiers` | `#e67e22` | Icône/valeur dossiers |
| `resourceTampons` | `#3498db` | Icône/valeur tampons |
| `resourceFormulaires` | `#9b59b6` | Icône/valeur formulaires |
| `storageCapped` | `#FF0000` | Alerte stockage plein |
| `success` | `#2ecc71` | Validation, coût abordable |
| `warning` | `#f1c40f` | Avertissement |
| `error` | `#e74c3c` | Coût inabordable, erreur |
| `sicBackground` | `#2C3E50` | Toast S.I.C. |
| `nonConformityBackground` | `#3D2C2C` | Toast non-conformité |
| `journalBackground` | `#2C2C2C` | Fond journal |

---

## Constitution & règles du projet

La constitution complète est dans `.specify/memory/constitution.md`. Résumé des 5 principes :

### I — User Experience & Performance First

- Feedback visuel < 100 ms pour toute interaction
- 60 fps sur mobile mid-range (iPhone 11 / équivalent Android)
- Toutes les animations via `react-native-reanimated` v3 (UI thread) — **jamais** `setState` pour animer
- Haptiques : `expo-haptics`
  - `ImpactFeedbackStyle.Light` — tap simple (S.I.C.)
  - `ImpactFeedbackStyle.Medium` — tampon
  - `NotificationFeedbackType.Success` — déblocage admin, achat upgrade

### II — Code Quality & Maintainability

- **Pas de logique métier dans les composants** — tout calcul appartient à `data/` ou `context/`
- TypeScript strict — pas de `any` sans justification explicite
- `StyleSheet.create` obligatoire — **jamais d'objets style inline** (casse la mémoïsation)
- `Pressable` pour les éléments interactifs — **pas** `TouchableOpacity` (legacy)
- `React.memo` sur tous les composants de liste (`AgentItem`, `JournalEntry`)
- `useCallback` / `useMemo` sur toutes les fonctions passées en prop et valeurs dérivées
- `useRef` pour les valeurs lues par la boucle de jeu mais sans besoin de re-render
- Fichiers < 300 lignes — splitter si nécessaire
- JSDoc sur toutes les fonctions publiques

### III — Langue française & authenticité culturelle

- Tout le texte en jeu en **français correct avec accents**
- Terminologie administrative authentique
- Formatage numérique FR : `1 000` (espace milliers), `1,5` (virgule décimale)
- Référencer des structures administratives françaises réelles (ministères, préfectures…)

### IV — Accessibilité & design inclusif

- Touch targets minimum **44×44 pt** (iOS HIG / Material)
- La couleur n'est **jamais** le seul vecteur d'information — toujours accompagner d'une icône ou d'un label
- Contraste WCAG 2.1 AA (4,5:1 texte normal, 3:1 grand texte)
- `accessibilityLabel`, `accessibilityRole`, `accessibilityState` sur tous les éléments interactifs
- Live regions (`accessibilityLiveRegion="polite"`) pour les toasts

### V — Séparation des responsabilités

```
Présentation (/components)  →  État (/context)  →  Logique (/data)
```

- `/components` : rendu UI uniquement
- `/context` : état, actions, boucle de jeu
- `/data` : fonctions pures, formules, seuils — **zéro** import React
- `/types` : interfaces TypeScript partagées
- `/constants` : configuration statique, couleurs
- Les composants ne doivent **pas** importer depuis `/data` directement

### Règles de commit

Format Conventional Commits :
```
type(scope): description

feat(ui):     nouveau composant ou écran
fix(state):   correction logique état/boucle
perf(logic):  optimisation production/calcul
refactor(ui): restructuration sans changement comportemental
style(ui):    formatage, couleurs
docs:         documentation
chore:        dépendances, config
```

---

## Workflow SpecKit

Le projet utilise **SpecKit** pour les nouvelles fonctionnalités significatives :

```bash
# Créer une spécification
speckit.specify "Description de la fonctionnalité"

# Plan de design
speckit.plan

# Liste de tâches
speckit.tasks

# Implémentation
speckit.implement

# Analyse qualité
speckit.analyze
```

Les specs sont stockées dans `specs/<id>-<nom>/` avec : `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `quickstart.md`.

---

## Compatibilité

| Plateforme | Support |
|------------|---------|
| iOS | 13+ |
| Android | 6.0+ (API 23+) |
| Web | Chrome, Firefox, Safari, Edge (export statique via `npm run build:web`) |

> Pas de suite de tests automatisés. Les tests sont manuels sur simulateurs iOS et Android.

---

**Version** : 1.17.0-MVP · **Schéma état** : v4 · **Constitution** : v1.0.0

[Edit in StackBlitz ⚡️](https://stackblitz.com/~/github.com/Seb-Mve/bureaucracy_v.1.17.0-MVP)
