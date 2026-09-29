# Lisibilité et équilibrage de l'acte I — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la file d'attente abondante (le tap et les collègues restent toujours utiles), rendre les collègues cohérents (paliers d'ancienneté, ratios de prix), et guider le joueur (flux visible, ordre du jour, circulaires). Spec : `specs/008-lisibilite-equilibrage/spec.md`.

**Architecture:** Toute la logique est dans des fonctions pures de `data/` (testées avec `node:test`, sans React) : flux et saturation, ancienneté, ordre du jour, circulaires, normalisation de la sauvegarde. `GameStateContext` les expose, et les composants se contentent de les afficher. L'équilibrage final se fait avec `scripts/simulate-acte1.ts`, enrichi de nouvelles mesures.

**Tech Stack:** TypeScript strict, React Native / Expo 53, expo-router, Node 25 (exécution directe des `.ts` + `node:test`).

## Global Constraints

- Couches strictes : `components/` n'importe jamais `data/`. Tout passe par `useGameState()`, et les types sont réexportés par le contexte.
- Textes en jeu en français, apostrophes typographiques `’`.
- Couleurs uniquement depuis `constants/Colors.ts`. Texte d'alerte orange : `Colors.encreTexte`.
- `StyleSheet.create` toujours, jamais d'objet de style inline. `Pressable` uniquement.
- Prettier : guillemets simples, indentation de 2 espaces.
- Composants ≤ ~300 lignes.
- Pas de `any`.
- Commits au format Conventional Commits (`feat(logic): …`, `fix(logic): …`, `feat(ui): …`, `test: …`, `chore: …`), terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Cible de rythme : le bot à 2 taps/s termine l'acte en **60-75 min**.

## File Structure

| Fichier | Rôle | Statut |
|---|---|---|
| `scripts/resoudre-ts.ts` | Hook de résolution des imports sans extension (tests) | Créer |
| `scripts/tests/engine.test.ts` | Tests du moteur (file, flux, ancienneté, notes) | Créer |
| `scripts/tests/guidage.test.ts` | Tests de l'ordre du jour, des circulaires et de la sauvegarde | Créer |
| `package.json` | Script `test` | Modifier |
| `constants/balance.ts` | `demandeRate`, paliers, seuils de saturation, coûts des collègues | Modifier |
| `data/engine.ts` | Correctif de la file, `fluxEntrant`, `plafondDemande`, `saturation`, ancienneté, `gainAgent` | Modifier |
| `data/notes.ts` | Prime de rejet sur la note n° 2, agent d'accueil débloqué par la note n° 2, coûts et seuils recalés | Modifier |
| `data/ordreDuJour.ts` | `ordreDuJour(s, m)` | Créer |
| `data/circulaires.ts` | `CIRCULAIRES`, `circulaireAAfficher`, `circulairesDejaDeclenchees` | Créer |
| `data/save.ts` | `normaliserSauvegarde` | Modifier |
| `types/game.ts` | `circulairesVues` dans `GameState` | Modifier |
| `utils/formatters.ts` | `formatEntier` jamais négatif | Modifier |
| `context/GameStateContext.tsx` | Expose `flux`, `consigne`, `circulaire`, `marquerCirculaireVue`, agents enrichis | Modifier |
| `components/FileAttente.tsx` | Ligne de flux + alerte de saturation | Modifier |
| `app/(tabs)/recruitment.tsx` | Alerte de saturation, gain et palier sur chaque carte | Modifier |
| `components/OrdreDuJour.tsx` | Bandeau de consigne | Créer |
| `app/(tabs)/index.tsx` | Monte `OrdreDuJour` | Modifier |
| `components/Circulaire.tsx` | Fenêtre de circulaire | Créer |
| `app/(tabs)/_layout.tsx` | Monte `Circulaire` | Modifier |
| `scripts/simulate-acte1.ts` | Choix du bot avec paliers, nouvelles mesures | Modifier |
| `CLAUDE.md` | Commande `npm test`, boucle de l'acte I mise à jour | Modifier |

Toutes les commandes se lancent depuis la racine du dépôt : `Github/bureaucracy_v.1.17.0-MVP`.

---

### Task 1: Banc de tests + correctif de la file négative

**Files:**
- Create: `scripts/resoudre-ts.ts`
- Create: `scripts/tests/engine.test.ts`
- Modify: `package.json` (bloc `scripts`)
- Modify: `data/engine.ts` (fonction `traiter`, boucle `for (let p = 1; …)`)
- Modify: `utils/formatters.ts` (`formatEntier`)

**Interfaces:**
- Produces: la commande `npm test`. Les helpers de test `base()` et `avecNotes()` (dans `engine.test.ts`) sont réutilisés par les tâches suivantes, dans le même fichier.

- [ ] **Step 1: Créer le hook de résolution**

`scripts/resoudre-ts.ts` :

```ts
/**
 * Permet à Node d'exécuter les sources du jeu (imports relatifs sans extension).
 * Utilisé par `npm test` : node --import ./scripts/resoudre-ts.ts --test …
 */
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (e) {
      if (specifier.startsWith('.')) return next(`${specifier}.ts`, context);
      throw e;
    }
  },
});
```

- [ ] **Step 2: Ajouter le script `test`**

Dans `package.json`, bloc `scripts`, ajouter après `"lint": "expo lint"` (en ajoutant une virgule à la ligne précédente) :

```json
    "test": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test 'scripts/tests/*.test.ts'"
```

- [ ] **Step 3: Écrire les tests qui échouent**

`scripts/tests/engine.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import { formatEntier } from '../../utils/formatters';
import type { GameState, NoteId } from '../../types/game';

/** Partie neuve, Cerfa signé, budget et formulaires illimités. */
export function base(): GameState {
  return { ...E.signerCerfa(E.etatInitial(0), 'Test', 0), budget: 1e9, formulaires: 1e9 };
}

/** Marque des notes comme achetées et effectives depuis t = 0. */
export function avecNotes(s: GameState, ids: NoteId[]): GameState {
  const notes = { ...s.notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return { ...s, notes };
}

/** Avance de `secondes` par pas de 100 ms. */
export function avancer(s: GameState, secondes: number, depart = 0): GameState {
  let r = s;
  for (let i = 1; i <= secondes * 10; i++) r = E.tick(r, 0.1, depart + i * 100).s;
  return r;
}

test('la file ne devient jamais négative', () => {
  let s = avecNotes(base(), ['renfort', 'rejet', 'horaires']);
  s = { ...s, agents: { stagiaire: 10, accueil: 4, instructeur: 0, titulaire: 0 } };
  s = E.reglerTauxRejet(s, 0.5, 0);
  for (let i = 1; i <= 3000; i++) {
    s = E.tick(s, 0.1, i * 100).s;
    for (let p = 0; p < 4; p++) assert.ok(s.file[p] >= 0, `file[${p}] = ${s.file[p]} au pas ${i}`);
  }
});

test('formatEntier n’affiche jamais de valeur négative', () => {
  assert.equal(formatEntier(-1e-15), '0');
  assert.equal(formatEntier(-3), '0');
  assert.equal(formatEntier(12.7), '12');
});
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL. `formatEntier(-1e-15)` renvoie `'-1'`. Le test de la file peut échouer sur une valeur de l'ordre de `-1e-15`.

- [ ] **Step 5: Corriger `traiter` et `formatEntier`**

Dans `data/engine.ts`, fonction `traiter`, remplacer :

```ts
    file[p] -= part;
```

par :

```ts
    file[p] = Math.max(0, file[p] - part);
```

Dans `utils/formatters.ts`, remplacer le corps de `formatEntier` :

```ts
export function formatEntier(value: number): string {
  const v = Math.max(0, Math.floor(value));
  return v < 1000 ? v.toString() : formatNumberFrench(v);
}
```

- [ ] **Step 6: Lancer les tests et vérifier qu'ils passent**

Run: `npm test`
Expected: `pass 2`, `fail 0`.

- [ ] **Step 7: Commit**

```bash
git add scripts/resoudre-ts.ts scripts/tests/engine.test.ts package.json data/engine.ts utils/formatters.ts
git commit -m "fix(logic): la file d'attente ne descend plus sous zéro

Ajoute un banc de tests node:test (npm test).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Demande abondante + flux et saturation

**Files:**
- Modify: `constants/balance.ts` (`BALANCE`)
- Modify: `data/engine.ts` (nouvelles fonctions après `dossiersEnAttente`)
- Test: `scripts/tests/engine.test.ts`

**Interfaces:**
- Consumes: `base`, `avecNotes`, `avancer` (Task 1).
- Produces:
  - `fluxEntrant(s: GameState, m: Modifiers): number` : dossiers arrivant par seconde ;
  - `plafondDemande(s: GameState, m: Modifiers): number` ;
  - `saturation(precedent: boolean, capacite: number, plafond: number): boolean` ;
  - `BALANCE.saturationEntree = 0.8`, `BALANCE.saturationSortie = 0.7`.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `scripts/tests/engine.test.ts` :

```ts
test('avec 3 d/s de collègues, la file reste abondante', () => {
  let s = avecNotes(base(), ['renfort', 'rejet', 'horaires']);
  s = { ...s, agents: { stagiaire: 10, accueil: 4, instructeur: 0, titulaire: 0 } };
  s = avancer(s, 120);
  assert.ok(E.dossiersEnAttente(s) > 40, `file = ${E.dossiersEnAttente(s)}`);
});

test('un tap traite toujours un dossier quand des collègues travaillent', () => {
  let s = avecNotes(base(), ['renfort']);
  s = { ...s, agents: { stagiaire: 10, accueil: 4, instructeur: 0, titulaire: 0 } };
  s = avancer(s, 60);
  const r = E.tamponner(s, 60_100);
  assert.ok(r.ev.traites >= 1, `traités = ${r.ev.traites}`);
});

test('fluxEntrant compte les nouvelles demandes et les retours', () => {
  const s0 = base();
  const m = E.getModifiers(s0, 0);
  const s = { ...s0, file: [0, 0, 0, 0] as [number, number, number, number], retours: [0, 0, 20, 0] as [number, number, number, number] };
  const attendu = (100 - 20) * (1 / 8) + 20 / 20;
  assert.ok(Math.abs(E.fluxEntrant(s, m) - attendu) < 1e-9, `flux = ${E.fluxEntrant(s, m)}`);
});

test('plafondDemande = population × demandeRate × demandeMult', () => {
  const s = avecNotes(base(), ['horaires']);
  const m = E.getModifiers(s, 0);
  assert.ok(Math.abs(E.plafondDemande(s, m) - 100 * (1 / 8) * 1.5) < 1e-9);
});

test('saturation avec hystérésis 80 % / 70 %', () => {
  assert.equal(E.saturation(false, 7.9, 10), false);
  assert.equal(E.saturation(false, 8, 10), true);
  assert.equal(E.saturation(true, 7.5, 10), true);
  assert.equal(E.saturation(true, 6.9, 10), false);
  assert.equal(E.saturation(false, 1, 0), true);
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL. La file vaut environ 0, et `E.fluxEntrant is not a function`.

- [ ] **Step 3: Passer à la demande abondante**

Dans `constants/balance.ts`, remplacer :

```ts
  /** Demandes par seconde et par usager inactif. */
  demandeRate: 1 / 60,
```

par :

```ts
  /**
   * Demandes par seconde et par usager inactif. Assez élevé pour que la file
   * reste abondante : le frein est la capacité de traitement, pas la demande.
   */
  demandeRate: 1 / 8,
  /** Capacité des collègues / plafond de demande à partir duquel on alerte. */
  saturationEntree: 0.8,
  /** Seuil de fin d'alerte (hystérésis, pour éviter le clignotement). */
  saturationSortie: 0.7,
```

- [ ] **Step 4: Ajouter les fonctions de flux**

Dans `data/engine.ts`, juste après la fonction `dossiersEnAttente`, ajouter :

```ts
/** Dossiers arrivant au guichet par seconde : nouvelles demandes + retours de rejetés. */
export function fluxEntrant(s: GameState, m: Modifiers): number {
  const inactifs = Math.max(0, s.population - somme(s.file) - somme(s.retours));
  const delai = BALANCE.delaiRetour * m.delaiRetourMult;
  return inactifs * BALANCE.demandeRate * m.demandeMult + somme(s.retours) / delai;
}

/** Débit maximal de demandes que le périmètre peut produire (file vide). */
export function plafondDemande(s: GameState, m: Modifiers): number {
  return s.population * BALANCE.demandeRate * m.demandeMult;
}

/**
 * Vrai quand la capacité des collègues approche le plafond de demande.
 * Hystérésis : on entre à `saturationEntree`, on sort sous `saturationSortie`.
 */
export function saturation(precedent: boolean, capacite: number, plafond: number): boolean {
  if (plafond <= 0) return capacite > 0;
  const ratio = capacite / plafond;
  return ratio >= (precedent ? BALANCE.saturationSortie : BALANCE.saturationEntree);
}
```

- [ ] **Step 5: Lancer les tests et vérifier qu'ils passent**

Run: `npm test`
Expected: `pass 7`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add constants/balance.ts data/engine.ts scripts/tests/engine.test.ts
git commit -m "feat(logic): demande abondante, flux entrant et saturation

La file ne se vide plus dès que les collègues dépassent 1,7 d/s :
le tap et les collègues restent utiles.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Paliers d'ancienneté + ratios de prix des collègues

**Files:**
- Modify: `constants/balance.ts` (`BALANCE.paliersAnciennete`, tableau `AGENTS`)
- Modify: `data/engine.ts` (`vitesseCollegues` + nouvelles fonctions)
- Test: `scripts/tests/engine.test.ts`

**Interfaces:**
- Consumes: `base` (Task 1).
- Produces:
  - `BALANCE.paliersAnciennete = [10, 25, 50]` ;
  - `multiplicateurAnciennete(possedes: number): number` ;
  - `prochainPalier(possedes: number): number | null` ;
  - `gainAgent(s: GameState, id: AgentId, m: Modifiers): number` : gain de d/s du prochain recrutement, palier compris ;
  - `vitesseCollegues(s, m)`, même signature, qui tient désormais compte des paliers.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `scripts/tests/engine.test.ts` :

```ts
test('multiplicateur et prochain palier d’ancienneté', () => {
  assert.equal(E.multiplicateurAnciennete(9), 1);
  assert.equal(E.multiplicateurAnciennete(10), 2);
  assert.equal(E.multiplicateurAnciennete(25), 4);
  assert.equal(E.multiplicateurAnciennete(50), 8);
  assert.equal(E.prochainPalier(0), 10);
  assert.equal(E.prochainPalier(10), 25);
  assert.equal(E.prochainPalier(50), null);
});

test('le 10ᵉ stagiaire double la vitesse de tous les stagiaires', () => {
  const s = { ...base(), agents: { stagiaire: 9, accueil: 0, instructeur: 0, titulaire: 0 } };
  const m = E.getModifiers(s, 0);
  assert.ok(Math.abs(E.vitesseCollegues(s, m) - 0.9) < 1e-9);
  // 10 × 0,1 × 2 = 2 d/s, donc +1,1 d/s pour ce recrutement.
  assert.ok(Math.abs(E.gainAgent(s, 'stagiaire', m) - 1.1) < 1e-9, `gain = ${E.gainAgent(s, 'stagiaire', m)}`);
});

test('à prix de base, chaque rang est plus rentable que le précédent', async () => {
  const { AGENTS } = await import('../../constants/balance');
  for (let i = 1; i < AGENTS.length; i++) {
    const prec = AGENTS[i - 1].coutBase / AGENTS[i - 1].vitesse;
    const cour = AGENTS[i].coutBase / AGENTS[i].vitesse;
    assert.ok(cour < prec, `${AGENTS[i].id} : ${cour} €/(d/s) ≥ ${prec}`);
  }
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL. `E.multiplicateurAnciennete is not a function`, et le test de rentabilité échoue (accueil à 300 €/(d/s), plus cher que le stagiaire à 200 €/(d/s)).

- [ ] **Step 3: Ajouter les paliers et les nouveaux coûts de base**

Dans `constants/balance.ts`, dans `BALANCE`, après `croissanceCoutAgent: 1.15,`, ajouter :

```ts
  /** Nombre d'exemplaires d'un même collègue qui double sa vitesse. */
  paliersAnciennete: [10, 25, 50],
```

Dans `AGENTS`, remplacer les `coutBase` des 3 derniers collègues. Point de départ : chaque rang coûte environ 17 % de moins par d/s que le précédent. Ces valeurs seront recalées à la Task 5.
- `accueil` : `coutBase: 85,` (170 €/(d/s))
- `instructeur` : `coutBase: 350,` (140 €/(d/s))
- `titulaire` : `coutBase: 1400,` (117 €/(d/s))

Le `stagiaire` reste à `coutBase: 20` (200 €/(d/s)).

- [ ] **Step 4: Tenir compte de l'ancienneté dans le moteur**

Dans `data/engine.ts`, ajouter `type AgentDef` à l'import de `../constants/balance` :

```ts
import { AGENTS, BALANCE, type AgentDef } from '../constants/balance';
```

Remplacer la fonction `vitesseCollegues` par :

```ts
/** Multiplicateur de vitesse d'un type de collègue : ×2 par palier atteint. */
export function multiplicateurAnciennete(possedes: number): number {
  let mult = 1;
  for (const palier of BALANCE.paliersAnciennete) if (possedes >= palier) mult *= 2;
  return mult;
}

/** Prochain palier d'ancienneté, ou null si le dernier est atteint. */
export function prochainPalier(possedes: number): number | null {
  return BALANCE.paliersAnciennete.find((p) => p > possedes) ?? null;
}

/** Vitesse de `n` collègues d'un même type, ancienneté comprise, hors modificateurs. */
function vitesseType(def: AgentDef, n: number): number {
  return n * def.vitesse * multiplicateurAnciennete(n);
}

/** Dossiers traités par seconde par l'ensemble des collègues. */
export function vitesseCollegues(s: GameState, m: Modifiers): number {
  let v = 0;
  for (const a of AGENTS) v += vitesseType(a, s.agents[a.id]);
  return v * m.agentSpeedMult;
}

/** Dossiers/s gagnés en recrutant un collègue de plus (palier compris). */
export function gainAgent(s: GameState, id: AgentId, m: Modifiers): number {
  const def = AGENTS.find((a) => a.id === id);
  if (!def) return 0;
  const n = s.agents[id];
  return (vitesseType(def, n + 1) - vitesseType(def, n)) * m.agentSpeedMult;
}
```

- [ ] **Step 5: Lancer les tests et vérifier qu'ils passent**

Run: `npm test`
Expected: `pass 10`, `fail 0`.

- [ ] **Step 6: Vérifier les types**

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune sortie (code 0).

- [ ] **Step 7: Commit**

```bash
git add constants/balance.ts data/engine.ts scripts/tests/engine.test.ts
git commit -m "feat(logic): paliers d'ancienneté et ratios de prix par rang

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Prime de rejet dès la note n° 2, agent d'accueil débloqué par la note n° 2

**Files:**
- Modify: `data/notes.ts` (notes `renfort` et `rejet`)
- Test: `scripts/tests/engine.test.ts`

**Interfaces:**
- Consumes: `base`, `avecNotes` (Task 1).
- Produces: `getModifiers` donne `primeRejet = 0.2` avec la note `rejet`, et `0.7` avec `rejet` + `prime`. `agentsDisponibles` ne contient `accueil` qu'avec la note `rejet`.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `scripts/tests/engine.test.ts` :

```ts
test('la note n° 1 ne débloque que le stagiaire', () => {
  const m = E.getModifiers(avecNotes(base(), ['renfort']), 0);
  assert.deepEqual(m.agentsDisponibles, ['stagiaire']);
});

test('la note n° 2 débloque l’agent d’accueil et une prime de rejet de 20 %', () => {
  const m = E.getModifiers(avecNotes(base(), ['renfort', 'rejet']), 0);
  assert.ok(m.agentsDisponibles.includes('accueil'));
  assert.ok(Math.abs(m.primeRejet - 0.2) < 1e-9);
  const m2 = E.getModifiers(avecNotes(base(), ['renfort', 'rejet', 'prime']), 0);
  assert.ok(Math.abs(m2.primeRejet - 0.7) < 1e-9);
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL. `agentsDisponibles` vaut `['stagiaire', 'accueil']`, et `primeRejet` vaut 0.

- [ ] **Step 3: Modifier les notes n° 1 et n° 2**

Dans `data/notes.ts`, note `renfort` : remplacer

```ts
      m.agentsDisponibles.push('stagiaire', 'accueil');
```

par

```ts
      m.agentsDisponibles.push('stagiaire');
```

Note `rejet` : remplacer les champs `effet` et `appliquer` par

```ts
    effet: 'Débloque le Taux de rejet (jusqu’à 50 %) et l’agent d’accueil. Dossiers rejetés : dotation +20 %.',
```

et

```ts
    appliquer: (m) => {
      m.rejetVisible = true;
      m.rejetMax = Math.max(m.rejetMax, 0.5);
      m.primeRejet += 0.2;
      m.agentsDisponibles.push('accueil');
    },
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `npm test`
Expected: `pass 12`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add data/notes.ts scripts/tests/engine.test.ts
git commit -m "feat(logic): prime de rejet dès la note n° 2, agent d'accueil débloqué par la note n° 2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Simulateur enrichi + recalage de l'équilibrage

**Files:**
- Modify: `scripts/simulate-acte1.ts`
- Modify (valeurs seulement) : `constants/balance.ts`, `data/notes.ts` (`cout` et seuils `visible`, `EXTENSIONS_PERIMETRE`)

**Interfaces:**
- Consumes: `E.gainAgent`, `E.dossiersEnAttente`, `NOTES_PAR_ID` (Tasks 2-4).
- Produces: valeurs d'équilibrage finales. Aucune signature ne change.

- [ ] **Step 1: Le bot recrute avec les paliers, sans exiger une file ≥ 5**

Dans `scripts/simulate-acte1.ts`, remplacer la ligne d'import des notes :

```ts
const { NOTES } = await import('../data/notes.ts');
```

par :

```ts
const { NOTES, NOTES_PAR_ID } = await import('../data/notes.ts');
```

Supprimer `AGENTS` de l'import de `balance` (il ne sert plus) :

```ts
const { BALANCE } = await import('../constants/balance.ts');
```

Remplacer le bloc `for (;;) { … }` des collègues par :

```ts
  for (;;) {
    const choix = m.agentsDisponibles
      .map((id) => ({ id, cout: E.coutAgent(id, s.agents[id]), gain: E.gainAgent(s, id, m) }))
      .sort((a, b) => b.gain / b.cout - a.gain / a.cout)[0];
    if (!choix || s.budget < choix.cout || (reserve > 0 && choix.cout > reserve * 0.5 && s.budget - choix.cout < reserve)) break;
    s = E.acheterAgent(s, choix.id, now);
    marquer('premier collègue', t);
    if (choix.id === 'stagiaire' && t >= 20 * 60) marquer('stagiaire recruté après 20 min', t);
  }
```

- [ ] **Step 2: Mesurer l'efficacité des taps et les périodes de file vide**

Avant la boucle `for (let t = 1; …)`, ajouter :

```ts
const EXTENSIONS = ['tilleuls', 'commune', 'canton'] as const;
let tapsDemandes = 0;
let tapsTraites = 0;
let serieVide = 0;
let pireSerie = 0;
let pireSerieA = 0;
```

Remplacer la ligne des taps :

```ts
  for (let i = 0; i < taps; i++) s = E.tamponner(s, now).s;
```

par :

```ts
  const puissance = E.getModifiers(s, now).tapPower;
  for (let i = 0; i < taps; i++) {
    const r = E.tamponner(s, now);
    tapsDemandes += puissance;
    tapsTraites += r.ev.traites;
    s = r.s;
  }
```

Juste après `const m = E.getModifiers(s, now);`, ajouter :

```ts
  // Série de file vide, excusée si une extension de périmètre attend d'être achetée.
  const extensionEnAttente = EXTENSIONS.some((id) => s.notes[id] === undefined && NOTES_PAR_ID[id].visible(s));
  if (E.dossiersEnAttente(s) < 1 && !extensionEnAttente) {
    serieVide += 1;
    if (serieVide > pireSerie) {
      pireSerie = serieVide;
      pireSerieA = t;
    }
  } else {
    serieVide = 0;
  }
```

À la fin du fichier, ajouter :

```ts
console.log('\nMesures :');
console.log(`  efficacité des taps : ${((tapsTraites / Math.max(1, tapsDemandes)) * 100).toFixed(1)} %`);
console.log(`  plus longue file vide : ${pireSerie} s (finie à ${mn(pireSerieA)})`);
```

- [ ] **Step 3: Lancer le simulateur et relever l'état de départ**

Run: `node scripts/simulate-acte1.ts 2 120`
Expected: l'acte se termine (jalon « fin de l'acte »). Relever la durée, l'efficacité des taps, la plus longue file vide et la présence du jalon « stagiaire recruté après 20 min ». Avec la demande abondante, l'acte sera probablement **beaucoup plus court** que 60 min, puisque le budget augmente beaucoup plus vite.

- [ ] **Step 4: Recaler jusqu'à atteindre toutes les cibles**

Cibles, toutes obligatoires :
1. « fin de l'acte » entre **60 et 75 min** ;
2. plus longue file vide **≤ 30 s** ;
3. efficacité des taps **≥ 95 %** ;
4. jalon « stagiaire recruté après 20 min » présent.

Leviers, à ajuster dans cet ordre, en relançant `node scripts/simulate-acte1.ts 2 120` après chaque changement :
1. **Rythme global** : multiplier les `cout` de toutes les notes payantes de `data/notes.ts` par un même facteur `k`, arrondi à la dizaine (au centime près pour les petites valeurs). On garde `BALANCE.dotation = 1`, puisque la fiche de poste affiche « Chaque dossier rapporte 1 € ».
2. **Collègues** : multiplier les 4 `coutBase` de `AGENTS` par un même facteur, pour garder les ratios de la Task 3 (le test de rentabilité doit rester vert).
3. **File vide** : si la pire série est trop longue, avancer le seuil `visible` de l'extension suivante (`tampons >= …`), ou augmenter sa valeur dans `EXTENSIONS_PERIMETRE`.
4. **Conformité** : si le rythme est bon mais que la fin tarde ou arrive trop tôt, ajuster `BALANCE.confCible`.

À chaque ajustement, mettre à jour la table « Rythme cible » de `specs/007-acte1-guichet/spec.md` si elle cite un seuil modifié.

- [ ] **Step 5: Vérifier aussi un joueur qui tape peu**

Run: `node scripts/simulate-acte1.ts 1 150`
Expected: l'acte se termine en ≤ 95 min, sans rupture de formulaires prolongée (la colonne `file` des lignes de 10 min n'est jamais à 0 hors fin de phase).

- [ ] **Step 6: Tests + types**

Run: `npm test && ./node_modules/.bin/tsc --noEmit -p .`
Expected: tous les tests passent, et tsc ne sort rien.

- [ ] **Step 7: Commit**

Remplacer `<valeurs mesurées>` par les résultats réels du simulateur.

```bash
git add scripts/simulate-acte1.ts constants/balance.ts data/notes.ts specs/007-acte1-guichet/spec.md
git commit -m "perf(logic): rééquilibrage de l'acte I pour la demande abondante

Simulateur : choix des collègues avec paliers, mesures d'efficacité des
taps et de file vide. <valeurs mesurées>

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Ordre du jour, circulaires et normalisation de la sauvegarde (logique)

**Files:**
- Create: `data/ordreDuJour.ts`
- Create: `data/circulaires.ts`
- Modify: `types/game.ts` (`GameState`)
- Modify: `data/engine.ts` (`etatInitial`)
- Modify: `data/save.ts`
- Test: `scripts/tests/guidage.test.ts`

**Interfaces:**
- Consumes: `E.getModifiers`, `NOTES_PAR_ID`.
- Produces:
  - `GameState.circulairesVues: string[]` ;
  - `type Onglet = 'recruitment' | 'notes'` ;
  - `interface Consigne { id: string; texte: string; progression?: { valeur: number; cible: number }; onglet?: Onglet }` ;
  - `ordreDuJour(s: GameState, m: Modifiers): Consigne | null` ;
  - `interface CirculaireDef { id: string; numero: number; titre: string; texte: string; declencheur: (s: GameState, m: Modifiers) => boolean }` ;
  - `CIRCULAIRES: CirculaireDef[]` ;
  - `circulaireAAfficher(s: GameState, m: Modifiers): CirculaireDef | null` ;
  - `circulairesDejaDeclenchees(s: GameState, m: Modifiers): string[]` ;
  - `normaliserSauvegarde(s: GameState, maintenant: number): GameState`.

- [ ] **Step 1: Écrire les tests qui échouent**

`scripts/tests/guidage.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import { ordreDuJour } from '../../data/ordreDuJour';
import { circulaireAAfficher } from '../../data/circulaires';
import { normaliserSauvegarde } from '../../data/save';
import type { GameState, NoteId } from '../../types/game';

const base = (): GameState => E.signerCerfa(E.etatInitial(0), 'Test', 0);
const avecNotes = (s: GameState, ids: NoteId[]): GameState => {
  const notes = { ...s.notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return { ...s, notes };
};
const consigne = (s: GameState) => ordreDuJour(s, E.getModifiers(s, 0));
const agents = (stagiaire: number) => ({ stagiaire, accueil: 0, instructeur: 0, titulaire: 0 });

test('ordre du jour : déroulé complet', () => {
  let s = base();
  assert.equal(consigne(s)?.id, 'tamponner');
  assert.deepEqual(consigne({ ...s, tampons: 3.6 })?.progression, { valeur: 3, cible: 8 });

  s = { ...s, tampons: 8 };
  assert.equal(consigne(s)?.id, 'note');

  s = avecNotes(s, ['renfort']);
  assert.equal(consigne(s)?.id, 'recruter');
  assert.equal(consigne(s)?.onglet, 'recruitment');

  s = { ...s, agents: agents(1) };
  assert.equal(consigne(s)?.id, 'formulaires');

  s = { ...s, stats: { ...s.stats, formulairesAchetes: 100 } };
  assert.equal(consigne(s)?.id, 'poursuivre');

  s = { ...s, tampons: 250 };
  assert.equal(consigne(s)?.id, 'note');

  s = avecNotes(s, ['rejet']);
  assert.equal(consigne(s)?.id, 'rejet');

  s = { ...s, tauxRejet: 0.2 };
  assert.equal(consigne(s)?.id, 'attendrePerimetre');

  s = { ...s, tampons: 1_000_000 };
  assert.equal(consigne(s)?.id, 'perimetre');

  s = avecNotes(s, ['tilleuls']);
  assert.equal(consigne(s), null);
});

test('ordre du jour : les formulaires passent devant quand le stock est bas', () => {
  const s = { ...avecNotes({ ...base(), tampons: 8 }, ['renfort']), formulaires: 10 };
  assert.equal(consigne(s)?.id, 'formulaires');
});

test('circulaires : une à la fois, puis plus jamais', () => {
  let s = avecNotes(base(), ['renfort']);
  const c = circulaireAAfficher(s, E.getModifiers(s, 0));
  assert.equal(c?.id, 'collegues');
  s = { ...s, circulairesVues: ['collegues'] };
  assert.equal(circulaireAAfficher(s, E.getModifiers(s, 0)), null);
});

test('sauvegarde ancienne : les circulaires déjà débloquées sont marquées vues', () => {
  const s = avecNotes(base(), ['renfort', 'rejet']);
  const { circulairesVues: _, ...ancienne } = s;
  const n = normaliserSauvegarde(ancienne as GameState, 0);
  assert.deepEqual(n.circulairesVues, ['collegues', 'rejet']);
});

test('sauvegarde récente : circulairesVues conservé', () => {
  const s = { ...avecNotes(base(), ['renfort']), circulairesVues: [] };
  assert.deepEqual(normaliserSauvegarde(s, 0).circulairesVues, []);
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL, `Cannot find module '…/data/ordreDuJour'`.

- [ ] **Step 3: Ajouter `circulairesVues` à l'état**

Dans `types/game.ts`, dans `GameState`, après `fichePosteVue: boolean;` :

```ts
  /** Circulaires déjà affichées (une seule fois par mécanique). */
  circulairesVues: string[];
```

Dans `data/engine.ts`, fonction `etatInitial`, après `fichePosteVue: false,` :

```ts
    circulairesVues: [],
```

- [ ] **Step 4: Créer `data/ordreDuJour.ts`**

```ts
/**
 * Ordre du jour : une consigne à la fois pour guider les premières minutes.
 * La première consigne non remplie s'affiche ; null quand tout est fait.
 */
import type { GameState, Modifiers } from '../types/game';
import { NOTES_PAR_ID } from './notes';

export type Onglet = 'recruitment' | 'notes';

export interface Consigne {
  id: string;
  texte: string;
  progression?: { valeur: number; cible: number };
  /** Onglet ouvert par un tap sur le bandeau. */
  onglet?: Onglet;
}

/** En dessous de ce stock, racheter des formulaires passe en priorité. */
const SEUIL_FORMULAIRES = 20;

const NOTE_EN_ATTENTE: Consigne = { id: 'note', texte: 'Une note de service vous attend.', onglet: 'notes' };
const FORMULAIRES: Consigne = {
  id: 'formulaires',
  texte: 'Rachetez des formulaires avant la rupture.',
  onglet: 'recruitment',
};

export function ordreDuJour(s: GameState, m: Modifiers): Consigne | null {
  const achetee = (id: keyof typeof NOTES_PAR_ID) => s.notes[id] !== undefined;
  const tampons = Math.floor(s.tampons);
  const collegues = Object.values(s.agents).reduce((a, b) => a + b, 0);
  const aRachete = s.stats.formulairesAchetes > 0;

  if (m.recrutementVisible && !aRachete && s.formulaires < SEUIL_FORMULAIRES) return FORMULAIRES;
  if (tampons < 8) {
    return { id: 'tamponner', texte: 'Tamponnez les dossiers en attente.', progression: { valeur: tampons, cible: 8 } };
  }
  if (!achetee('renfort')) return NOTE_EN_ATTENTE;
  if (collegues === 0) return { id: 'recruter', texte: 'Recrutez un collègue (onglet Recrutement).', onglet: 'recruitment' };
  if (!aRachete) return FORMULAIRES;
  if (!achetee('rejet')) {
    if (!NOTES_PAR_ID.rejet.visible(s)) {
      return {
        id: 'poursuivre',
        texte: 'Poursuivez : de nouvelles instructions suivront.',
        progression: { valeur: tampons, cible: 250 },
      };
    }
    return NOTE_EN_ATTENTE;
  }
  if (s.tauxRejet <= 0) return { id: 'rejet', texte: 'Réglez le taux de rejet.' };
  if (!achetee('tilleuls')) {
    if (!NOTES_PAR_ID.tilleuls.visible(s)) {
      return { id: 'attendrePerimetre', texte: 'Traitez des dossiers : une extension du périmètre sera proposée.' };
    }
    return { id: 'perimetre', texte: 'Étendez le périmètre (note de service).', onglet: 'notes' };
  }
  return null;
}
```

Remarque : la cible `250` doit rester égale au seuil `tampons >= 250` de la note `rejet` dans `data/notes.ts`. Si la Task 5 a modifié ce seuil, reporter la nouvelle valeur ici et dans le test.

- [ ] **Step 5: Créer `data/circulaires.ts`**

```ts
/**
 * Circulaires : une courte explication, affichée une seule fois,
 * quand une mécanique apparaît.
 */
import type { GameState, Modifiers } from '../types/game';
import { NOTES_PAR_ID } from './notes';

export interface CirculaireDef {
  id: string;
  numero: number;
  titre: string;
  texte: string;
  declencheur: (s: GameState, m: Modifiers) => boolean;
}

export const CIRCULAIRES: CirculaireDef[] = [
  {
    id: 'collegues',
    numero: 1,
    titre: 'Recrutement de collègues',
    texte:
      'Des collègues peuvent être recrutés. Ils tamponnent à votre place, sans enthousiasme mais sans interruption. Plus vous en avez, plus la file baisse.',
    declencheur: (_s, m) => m.recrutementVisible,
  },
  {
    id: 'rejet',
    numero: 2,
    titre: 'Rejet des dossiers',
    texte:
      'Vous pouvez désormais rejeter des dossiers. Un dossier rejeté rapporte une prime et revient plus tard, moins patient. Un usager sans patience abandonne.',
    declencheur: (_s, m) => m.rejetVisible,
  },
  {
    id: 'perimetre',
    numero: 3,
    titre: 'Périmètre du guichet',
    texte:
      'La file ne se remplit pas toute seule. Quand vos collègues vont plus vite que les demandes, étendez le périmètre : de nouveaux usagers, de nouveaux dossiers.',
    declencheur: (s) => s.notes.tilleuls !== undefined || NOTES_PAR_ID.tilleuls.visible(s),
  },
  {
    id: 'conformite',
    numero: 4,
    titre: 'Mesure de la conformité',
    texte:
      'Votre Conformité est désormais mesurée. Elle monte avec les rejets et les pièces exigées. À 100 %, votre dossier sera réexaminé.',
    declencheur: (_s, m) => m.conformiteVisible,
  },
];

/** Première circulaire déclenchée et pas encore lue. */
export function circulaireAAfficher(s: GameState, m: Modifiers): CirculaireDef | null {
  return CIRCULAIRES.find((c) => !s.circulairesVues.includes(c.id) && c.declencheur(s, m)) ?? null;
}

/** Identifiants des circulaires dont la mécanique est déjà débloquée. */
export function circulairesDejaDeclenchees(s: GameState, m: Modifiers): string[] {
  return CIRCULAIRES.filter((c) => c.declencheur(s, m)).map((c) => c.id);
}
```

- [ ] **Step 6: Ajouter `normaliserSauvegarde` dans `data/save.ts`**

Ajouter en haut, après l'import existant :

```ts
import { getModifiers } from './engine';
import { circulairesDejaDeclenchees } from './circulaires';
```

Ajouter à la fin du fichier :

```ts
/**
 * Complète une sauvegarde antérieure à la spec 008 : sans `circulairesVues`,
 * les circulaires des mécaniques déjà débloquées sont marquées comme lues.
 */
export function normaliserSauvegarde(s: GameState, maintenant: number): GameState {
  if (Array.isArray((s as Partial<GameState>).circulairesVues)) return s;
  const provisoire: GameState = { ...s, circulairesVues: [] };
  return {
    ...provisoire,
    circulairesVues: circulairesDejaDeclenchees(provisoire, getModifiers(provisoire, maintenant)),
  };
}
```

- [ ] **Step 7: Lancer les tests et vérifier qu'ils passent**

Run: `npm test`
Expected: tous les tests passent (`fail 0`).

- [ ] **Step 8: Vérifier les types**

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune sortie.

- [ ] **Step 9: Commit**

```bash
git add data/ordreDuJour.ts data/circulaires.ts data/save.ts data/engine.ts types/game.ts scripts/tests/guidage.test.ts
git commit -m "feat(logic): ordre du jour, circulaires et normalisation de la sauvegarde

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Exposer le guidage et le flux dans le contexte

**Files:**
- Modify: `context/GameStateContext.tsx`

**Interfaces:**
- Consumes: `E.fluxEntrant`, `E.plafondDemande`, `E.saturation`, `E.gainAgent`, `E.prochainPalier`, `E.multiplicateurAnciennete`, `ordreDuJour`, `circulaireAAfficher`, `normaliserSauvegarde`.
- Produces (sur `useGameState()`) :
  - `flux: { arrivees: number; traitement: number; sature: boolean }` : `traitement` = collègues + dossiers tamponnés par seconde sur les 5 dernières secondes ; `sature` concerne la capacité des collègues seule ;
  - `consigne: Consigne | null` ;
  - `circulaire: CirculaireDef | null` ;
  - `marquerCirculaireVue: (id: string) => void` ;
  - `AgentAffiche` gagne `gain: number`, `multiplicateur: number` et `prochainPalier: number | null` ;
  - types réexportés : `Consigne`, `Onglet`, `CirculaireDef`.

- [ ] **Step 1: Imports et types**

Dans `context/GameStateContext.tsx`, remplacer :

```ts
import { CLE_SAUVEGARDE, estSauvegardeValide } from '@/data/save';
```

par :

```ts
import { CLE_SAUVEGARDE, estSauvegardeValide, normaliserSauvegarde } from '@/data/save';
import { ordreDuJour, type Consigne, type Onglet } from '@/data/ordreDuJour';
import { circulaireAAfficher, type CirculaireDef } from '@/data/circulaires';
```

Remplacer `export type { UsagerAffiche };` par :

```ts
export type { UsagerAffiche, Consigne, Onglet, CirculaireDef };
```

Après la constante `SEUIL_ABSENCE`, ajouter :

```ts
/** Fenêtre de calcul du débit des taps (ms). */
const FENETRE_TAPS = 5000;

export interface Flux {
  /** Dossiers arrivant par seconde. */
  arrivees: number;
  /** Dossiers traités par seconde : collègues + taps récents. */
  traitement: number;
  /** Les collègues approchent le plafond de demande du périmètre. */
  sature: boolean;
}
```

Dans `AgentAffiche`, après `achetable: boolean;` :

```ts
  /** Dossiers/s gagnés avec le prochain recrutement (palier compris). */
  gain: number;
  /** Multiplicateur d'ancienneté actuel (×1, ×2, ×4, ×8). */
  multiplicateur: number;
  prochainPalier: number | null;
```

Dans `GameContextType`, après `verdict: Verdict | null;` :

```ts
  flux: Flux;
  consigne: Consigne | null;
  circulaire: CirculaireDef | null;
```

et après `marquerFichePoste: (vue: boolean) => void;` :

```ts
  marquerCirculaireVue: (id: string) => void;
```

- [ ] **Step 2: Normaliser au chargement**

Dans l'effet de chargement, remplacer :

```ts
          if (estSauvegardeValide(lu)) s = rattraperAbsence(lu, maintenant);
```

par :

```ts
          if (estSauvegardeValide(lu)) s = rattraperAbsence(normaliserSauvegarde(lu, maintenant), maintenant);
```

- [ ] **Step 3: Mémoriser les taps récents**

Après `const sauvegardeTimer = useRef…`, ajouter :

```ts
  const tapsRecents = useRef<{ t: number; n: number }[]>([]);
  const satureRef = useRef(false);
```

Dans `tamponner`, remplacer la ligne `const r = E.tamponner(etatRef.current, Date.now());` par :

```ts
    const t = Date.now();
    const r = E.tamponner(etatRef.current, t);
    if (r.ev.traites > 0) {
      tapsRecents.current = [...tapsRecents.current.filter((x) => t - x.t < FENETRE_TAPS), { t, n: r.ev.traites }];
    }
```

Dans `nouvellePartie`, après `rejetAcc.current = 0;` :

```ts
    tapsRecents.current = [];
    satureRef.current = false;
```

- [ ] **Step 4: Action `marquerCirculaireVue`**

Après `marquerFichePoste` :

```ts
  const marquerCirculaireVue = useCallback(
    (id: string) => {
      const s = etatRef.current;
      if (s.circulairesVues.includes(id)) return;
      appliquer({ ...s, circulairesVues: [...s.circulairesVues, id] });
    },
    [appliquer],
  );
```

- [ ] **Step 5: Valeurs dérivées**

Remplacer le `useMemo` de `agents` par :

```ts
  const agents = useMemo<AgentAffiche[]>(
    () =>
      AGENTS.filter((a) => mods.agentsDisponibles.includes(a.id)).map((a) => {
        const possedes = etat.agents[a.id];
        const cout = E.coutAgent(a.id, possedes);
        return {
          ...a,
          possedes,
          cout,
          achetable: etat.budget >= cout,
          gain: E.gainAgent(etat, a.id, mods),
          multiplicateur: E.multiplicateurAnciennete(possedes),
          prochainPalier: E.prochainPalier(possedes),
        };
      }),
    [etat, mods],
  );

  const vitesse = useMemo(() => E.vitesseCollegues(etat, mods), [etat, mods]);

  const flux = useMemo<Flux>(() => {
    const recents = tapsRecents.current.filter((x) => maintenant - x.t < FENETRE_TAPS);
    const parTaps = recents.reduce((acc, x) => acc + x.n, 0) / (FENETRE_TAPS / 1000);
    const sature = E.saturation(satureRef.current, vitesse, E.plafondDemande(etat, mods));
    satureRef.current = sature;
    return { arrivees: E.fluxEntrant(etat, mods), traitement: vitesse + parTaps, sature };
  }, [etat, mods, maintenant, vitesse]);

  const consigne = useMemo(() => ordreDuJour(etat, mods), [etat, mods]);
  const circulaire = useMemo(() => circulaireAAfficher(etat, mods), [etat, mods]);
```

Dans l'objet `valeur`, remplacer `vitesse: E.vitesseCollegues(etat, mods),` par `vitesse,`. Après `verdict,`, ajouter :

```ts
      flux,
      consigne,
      circulaire,
```

et après `marquerFichePoste,` :

```ts
      marquerCirculaireVue,
```

Mettre à jour le tableau de dépendances de `valeur` :

```ts
    [
      pret, etat, mods, maintenant, vitesse, notes, agents, verdict, flux, consigne, circulaire, tamponner,
      acheterAgent, acheterRamettes, reglerTauxRejet, acheterNote, marquerNotesVues, signerCerfa,
      deposerDemission, marquerLettresLues, marquerFinActeVue, marquerFichePoste, marquerCirculaireVue,
      nouvellePartie,
    ],
```

- [ ] **Step 6: Types + lint**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add context/GameStateContext.tsx
git commit -m "feat(state): expose flux, ordre du jour, circulaires et ancienneté

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Flux visible dans la file et le recrutement

**Files:**
- Modify: `components/FileAttente.tsx`
- Modify: `app/(tabs)/recruitment.tsx`

**Interfaces:**
- Consumes: `flux`, `AgentAffiche.gain`, `AgentAffiche.multiplicateur`, `AgentAffiche.prochainPalier` (Task 7).

- [ ] **Step 1: Ligne de flux dans `FileAttente`**

Dans `components/FileAttente.tsx`, remplacer l'import des formatters :

```ts
import { formatEntier, formatNumberFrench } from '@/utils/formatters';
```

Dans `FileAttente()`, remplacer `const { tete, enAttente, mods } = useGameState();` par :

```ts
  const { tete, enAttente, mods, flux } = useGameState();
```

Juste après `<Text style={styles.titre}>Guichet 3 · file d’attente</Text>`, ajouter :

```tsx
      <Text
        style={[styles.flux, flux.sature && styles.fluxAlerte]}
        accessibilityLabel={`Arrivées ${formatNumberFrench(flux.arrivees)} dossiers par seconde, traitement ${formatNumberFrench(flux.traitement)} dossiers par seconde`}
      >
        Arrivées {formatNumberFrench(flux.arrivees)}/s · Traitement {formatNumberFrench(flux.traitement)}/s
      </Text>
      {flux.sature && <Text style={styles.alerte}>Le périmètre s’épuise : il faut de nouveaux usagers.</Text>}
```

Dans `styles`, après `titre: { … },` :

```ts
  flux: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: 11,
    color: Colors.crayon,
  },
  fluxAlerte: {
    color: Colors.encreTexte,
  },
  alerte: {
    fontFamily: Fonts.texteGras,
    fontSize: 12,
    color: Colors.encreTexte,
  },
```

- [ ] **Step 2: Recrutement, alerte et ancienneté**

Dans `app/(tabs)/recruitment.tsx`, dans `CarteAgent`, remplacer :

```tsx
        <Text style={styles.detail}>{formatNumberFrench(agent.vitesse)} dossier/s chacun</Text>
```

par :

```tsx
        <Text style={styles.detail}>+{formatNumberFrench(agent.gain)} dossier/s au prochain recrutement</Text>
        <Text style={styles.anciennete}>
          {agent.prochainPalier === null
            ? `Ancienneté maximale · ×${agent.multiplicateur}`
            : `Ancienneté : ×${agent.multiplicateur * 2} à ${agent.prochainPalier}`}
        </Text>
```

Dans `RecrutementScreen`, remplacer la déstructuration par :

```ts
  const { agents, acheterAgent, acheterRamettes, prixRamette, etat, vitesse, flux } = useGameState();
```

Juste après le `<Text style={styles.titre}>Collègues …</Text>`, ajouter :

```tsx
        {flux.sature && (
          <Text style={styles.alerte}>
            Le périmètre s’épuise : vos collègues vont bientôt manquer de dossiers. Étendez le périmètre (notes de service).
          </Text>
        )}
```

Dans `styles`, après `detail: { … },` :

```ts
  anciennete: {
    fontFamily: Fonts.texteGras,
    fontSize: 11,
    color: Colors.encreTexte,
  },
  alerte: {
    fontFamily: Fonts.texteGras,
    fontSize: 12,
    color: Colors.encreTexte,
  },
```

- [ ] **Step 3: Types + lint**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add components/FileAttente.tsx "app/(tabs)/recruitment.tsx"
git commit -m "feat(ui): flux d'arrivée et de traitement, ancienneté des collègues

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Bandeau « Ordre du jour » et fenêtre de circulaire

**Files:**
- Create: `components/OrdreDuJour.tsx`
- Create: `components/Circulaire.tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `consigne`, `circulaire`, `marquerCirculaireVue`, `etat.fichePosteVue`, `etat.acteTermine`, `etat.finActeVue` (Task 7).

- [ ] **Step 1: Créer `components/OrdreDuJour.tsx`**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ClipboardList } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';

/** Bandeau du guichet : la prochaine chose à faire, une seule à la fois. */
export default function OrdreDuJour() {
  const { consigne } = useGameState();
  const router = useRouter();
  if (!consigne) return null;

  const { texte, progression, onglet } = consigne;
  const suffixe = progression ? ` (${Math.min(progression.valeur, progression.cible)} / ${progression.cible})` : '';

  return (
    <Pressable
      onPress={onglet ? () => router.push(`/${onglet}`) : undefined}
      disabled={!onglet}
      style={({ pressed }) => [styles.bandeau, pressed && styles.presse]}
      accessibilityRole={onglet ? 'button' : 'text'}
      accessibilityLabel={`Ordre du jour : ${texte}${suffixe}`}
    >
      <View style={styles.icone}>
        <ClipboardList size={16} color={Colors.anthracite} />
      </View>
      <View style={styles.texte}>
        <Text style={styles.sur}>ORDRE DU JOUR</Text>
        <Text style={styles.consigne}>
          {texte}
          {suffixe}
        </Text>
      </View>
      {onglet && <ChevronRight size={18} color={Colors.anthracite} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 44,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  icone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.encreFond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: {
    flex: 1,
  },
  sur: {
    fontFamily: Fonts.texteGras,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.encreTexte,
  },
  consigne: {
    fontFamily: Fonts.texteGras,
    fontSize: 13,
    color: Colors.anthracite,
  },
});
```

Remarque : si `router.push(`/${onglet}`)` ne passe pas le typage de routes d'expo-router, utiliser `router.push(onglet === 'notes' ? '/notes' : '/recruitment')`.

- [ ] **Step 2: Monter le bandeau sur le guichet**

Dans `app/(tabs)/index.tsx`, ajouter l'import :

```ts
import OrdreDuJour from '@/components/OrdreDuJour';
```

et remplacer `<SceneGuichet />` par :

```tsx
        <OrdreDuJour />
        <SceneGuichet />
```

- [ ] **Step 3: Créer `components/Circulaire.tsx`**

```tsx
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/** Circulaire : explique une mécanique au moment où elle apparaît, une seule fois. */
export default function Circulaire() {
  const { etat, circulaire, marquerCirculaireVue } = useGameState();
  const finActeEnCours = etat.acteTermine && !etat.finActeVue;
  const visible = circulaire !== null && etat.fichePosteVue && !finActeEnCours;
  if (!circulaire) return null;

  const fermer = () => marquerCirculaireVue(circulaire.id);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <View style={styles.voile}>
        <ScrollView contentContainerStyle={styles.defilement}>
          <Panneau contenuStyle={styles.fiche} rayon={12}>
            <Text style={styles.reference}>Circulaire n° {circulaire.numero} · S.I.C.</Text>
            <Text style={styles.titre} accessibilityRole="header">
              {circulaire.titre}
            </Text>
            <View style={styles.separateur} />
            <Text style={styles.texte}>{circulaire.texte}</Text>
            <BoutonPoussoir libelle="PRIS CONNAISSANCE" taille={16} hauteur={48} onPress={fermer} />
          </Panneau>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: 'rgba(45,52,54,0.55)',
  },
  defilement: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
  },
  fiche: {
    padding: 18,
    gap: 10,
    backgroundColor: '#FFFEF9',
  },
  reference: {
    fontFamily: Fonts.chiffres,
    fontSize: 11,
    color: Colors.crayon,
  },
  titre: {
    fontFamily: Fonts.titreGras,
    fontSize: 20,
    color: Colors.anthracite,
  },
  separateur: {
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.anthracite,
    marginBottom: 6,
  },
});
```

Remarque : `rgba(45,52,54,0.55)` et `#FFFEF9` reprennent exactement les valeurs de `FichePoste.tsx`. Si `Colors` expose un équivalent (vérifier `constants/Colors.ts`), l'utiliser dans les deux composants.

- [ ] **Step 4: Monter la circulaire**

Dans `app/(tabs)/_layout.tsx`, ajouter l'import :

```ts
import Circulaire from '@/components/Circulaire';
```

et, juste après `<FichePoste />`, ajouter :

```tsx
      <Circulaire />
```

- [ ] **Step 5: Types + lint + tests**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, tous les tests passent.

- [ ] **Step 6: Vérification dans le navigateur**

1. Lancer le serveur de développement avec l'outil `preview_start` (configuration de `.claude/launch.json`).
2. Dans l'onglet Options, faire « nouvelle partie », signer le Cerfa et fermer la fiche de poste.
3. Vérifier : le bandeau « Tamponnez les dossiers en attente. (0 / 8) » s'affiche, et la ligne « Arrivées … · Traitement … » se met à jour.
4. Taper 8 fois : la circulaire n° 1 ne s'affiche qu'après l'achat de la note n° 1, et le bandeau passe à « Une note de service vous attend. ».
5. Acheter la note n° 1 : la circulaire « Recrutement de collègues » s'affiche une fois. La fermer, recharger la page, et vérifier qu'elle ne revient pas.
6. Recruter 10 stagiaires (budget suffisant après quelques minutes, ou via le simulateur) : la carte affiche « Ancienneté : ×2 à 10 », puis « ×4 à 25 ». La file reste > 0 pendant qu'on tape.
7. Vérifier la console (`read_console_messages`) : aucune erreur.
8. Faire une capture d'écran du guichet et du recrutement comme preuve.

- [ ] **Step 7: Commit**

```bash
git add components/OrdreDuJour.tsx components/Circulaire.tsx "app/(tabs)/index.tsx" "app/(tabs)/_layout.tsx"
git commit -m "feat(ui): bandeau Ordre du jour et circulaires

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `specs/007-acte1-guichet/spec.md` (section « Boucle de jeu », paragraphe « Conséquence voulue »)

- [ ] **Step 1: `CLAUDE.md`**

Dans le bloc `## Commands`, après la ligne `./node_modules/.bin/tsc --noEmit -p .`, ajouter :

```bash
npm test                                 # Unit tests of data/ (node:test, scripts/tests/*.test.ts)
```

Remplacer la phrase « There is no automated test suite. » par :

« Pure data-layer logic is covered by `npm test` (Node's built-in test runner, no dependency). »

Dans le paragraphe « Act I loop », remplacer « A player-set **Taux de rejet** sends usagers back (more dossiers, more budget, hidden Conformité) until their patience runs out and they abandon. » par :

« Demand is abundant (the queue rarely empties): the bottleneck is processing capacity and formulaires. A player-set **Taux de rejet** sends usagers back; a rejected dossier pays a bonus (prime de rejet) and raises hidden Conformité, but usagers who run out of patience abandon, shrinking future demand. Collègues double their speed at 10/25/50 copies (ancienneté). An **Ordre du jour** banner and one-off **circulaires** guide the first minutes (spec 008). »

Dans la table « Data layer files », ajouter :

```markdown
| `data/ordreDuJour.ts` | Current objective shown in the guichet banner |
| `data/circulaires.ts` | One-off explanations shown when a mechanic unlocks |
```

- [ ] **Step 2: spec 007**

Dans `specs/007-acte1-guichet/spec.md`, sous le paragraphe « Conséquence voulue : … », ajouter :

« > **Révisé par la spec 008** : la demande est désormais abondante. Rejeter ne multiplie plus le nombre de dossiers ; un dossier rejeté rapporte plus (prime de rejet dès la note n° 2) et produit de la Conformité. »

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md specs/007-acte1-guichet/spec.md
git commit -m "docs: demande abondante, npm test, ordre du jour et circulaires

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Couverture de la spec

| Exigence de la spec 008 | Tâche |
|---|---|
| US1 modèle (demandeRate ~1/8) | 2 (recalage en 5) |
| US1 extensions recalées avant saturation | 5 |
| US1 prime de rejet note n° 2 | 4 |
| US1 correctifs file / formatEntier | 1 |
| US1 acceptance (≤ 30 s de file vide, tap toujours utile, pas de négatif) | 1, 2, 5 |
| US2 paliers, ratios, accueil débloqué par la note n° 2 | 3, 4 |
| US2 acceptance (stagiaire après 20 min, gain du 10ᵉ) | 3, 5 |
| US3 fluxEntrant / plafondDemande / hystérésis | 2, 7 |
| US3 affichage file + recrutement | 8 |
| US4 ordre du jour | 6, 7, 9 |
| US5 circulaires + sauvegarde ancienne | 6, 7, 9 |
| Simulateur (mesures, cibles) | 5 |
| Accessibilité (labels, onRequestClose) | 8, 9 |
