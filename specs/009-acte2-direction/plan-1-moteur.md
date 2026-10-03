# Acte II — Moteur de La Direction — Implementation Plan (1/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Écrire le moteur de l'acte II (procédures, boucles, dématérialisation, curseurs, notes, courrier) en fonctions pures testées, et un simulateur qui joue l'acte. Spec : `specs/009-acte2-direction/spec.md`.

**Architecture:** L'acte II vit dans `data/acte2/` (fonctions pures, sans React), à côté du moteur de l'acte I qui reste intact. `GameState` gagne `acte` et `acte2` : l'état propre à l'acte II est rangé dans `acte2`, les ressources partagées (tampons, budget, formulaires, courrier, Cerfa) restent à la racine. Comme à l'acte I, l'économie est agrégée : des compteurs de dossiers par procédure et par rang d'étape, jamais un objet par dossier.

**Tech Stack:** TypeScript strict, Node 25 (exécution directe des `.ts` + `node:test`), React Native / Expo 53 (non touché par ce plan).

**Découpage de l'acte II en trois plans :**
1. **Ce plan** — moteur et simulateur. Le jeu reste jouable à l'acte I ; l'acte II tourne au simulateur.
2. Plan 2 — écrans (Direction, Atelier, curseurs, recrutement, notes) et branchement dans `GameStateContext`, transition de fin d'acte I.
3. Plan 3 — Réforme, Jurisprudence, déjà-vu administratif, Cerfa redemandé, calage du mur.

## Global Constraints

- **Base :** branche `feat/acte2-direction-scene`, partie de `origin/main` (41301e6) et portant la scène de l'acte II (b438490). Ne jamais partir de `fix/remarques-evaluateur` (en retard sur main). Ne jamais faire `git add -A` ni `git add .` : chaque commit liste ses fichiers.
- Comme sur main : pas de relance des notes par le tap, pas de circulaires ni d'ordre du jour ; le rejet d'un coup de tampon du joueur est tiré au sort dossier par dossier (`partRejetee`), celui des automates (guichets, agents) reste à sa valeur moyenne.
- Couches strictes : `components/` n'importe jamais `data/`. Ce plan ne touche aucun composant.
- Textes en jeu en français, apostrophes typographiques `’`.
- Pas de `any`. Prettier : guillemets simples, indentation de 2 espaces.
- Aucune ressource nouvelle (pilier du design) : le Taux de dématérialisation est un indicateur, jamais dépensé.
- Le Taux de dématérialisation reste à **0 exactement** tant qu'aucun dossier en boucle n'existe.
- Le rejet ne coûte rien sur un dossier en boucle (aucune patience, aucun abandon).
- Une étape « Pièce délivrée par nos services » n'exige qu'une **autre** procédure ouverte.
- Commits au format Conventional Commits (`feat(logic): …`, `test: …`, `docs: …`), terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File Structure

| Fichier | Rôle | Statut |
|---|---|---|
| `types/acte2.ts` | Types de l'acte II (procédures, étapes, état, modificateurs, évènements) | Créer |
| `types/game.ts` | `acte` et `acte2` dans `GameState` | Modifier |
| `constants/balanceActe2.ts` | `BALANCE2`, `ETAPES`, `EXEMPLAIRES`, `PROC_NOMS`, `PROCEDURES_INITIALES`, `AGENTS2` | Créer |
| `data/acte2/moteur.ts` | État initial, entrée dans l'acte, modificateurs, tick, tap, achats, réglages, hors-ligne | Créer |
| `data/acte2/procedures.ts` | Graphe des exigences, détection des boucles, actions de l'Atelier | Créer |
| `data/acte2/notes2.ts` | Les 17 notes de service de l'acte II | Créer |
| `data/acte2/courrier2.ts` | Lettres du S.I.C. de l'acte II | Créer |
| `data/engine.ts` | `etatInitial` (champs `acte`), `partRejetee` exportée | Modifier |
| `data/save.ts` | Validation et normalisation des champs `acte` | Modifier |
| `data/courrier.ts` | `LettreDef` exporté, lettres de l'acte II ajoutées | Modifier |
| `scripts/tests/acte2.test.ts` | Tests de l'acte II | Créer |
| `scripts/simulate-acte2.ts` | Simulateur d'équilibrage de l'acte II | Créer |
| `CLAUDE.md` | Commande du simulateur, fichiers de l'acte II | Modifier |

Toutes les commandes se lancent depuis la racine du dépôt : `Github/bureaucracy_v.1.17.0-MVP`.

---

### Task 1: Types, constantes et entrée dans l'acte II

**Files:**
- Create: `types/acte2.ts`
- Create: `constants/balanceActe2.ts`
- Create: `data/acte2/moteur.ts`
- Create: `scripts/tests/acte2.test.ts`
- Modify: `types/game.ts` (interface `GameState`)
- Modify: `data/engine.ts` (`etatInitial`)
- Modify: `data/save.ts` (`estSauvegardeValide`, `normaliserSauvegarde`)

**Interfaces:**
- Produces: tous les types de `types/acte2.ts` ; `PROCS` ; les constantes de `constants/balanceActe2.ts` ; dans `data/acte2/moteur.ts` : `copieProcedures(p)`, `copieStocks(st)`, `stocksPour(procedures)`, `sommeStocks(st)`, `etatInitialActe2(maintenant): EtatActe2`, `entrerActe2(s, maintenant): GameState`. Helpers de test `base2()`, `x(s)`, `avec2(s, patch)`, `proche(a, b)`.

- [ ] **Step 1: Écrire les types de l'acte II**

`types/acte2.ts` :

```ts
/**
 * Types de l'acte II — La Direction.
 * Voir specs/009-acte2-direction/spec.md.
 */
import type { NoteState } from './game';

export type ProcId = 'identite' | 'domicile' | 'hebergement' | 'vie';

/** Ordre d'affichage et d'ouverture des procédures. */
export const PROCS: ProcId[] = ['identite', 'domicile', 'hebergement', 'vie'];

export type EtapeType = 'visa' | 'piece' | 'signature' | 'pieceService' | 'reflexion' | 'commission';

export interface Etape {
  type: EtapeType;
  /** Procédure exigée (étape « Pièce délivrée par nos services » seulement). */
  exige?: ProcId;
}

export type Agent2Id = 'instructeur' | 'chefBureau' | 'sousDirecteur';

export type Note2Id =
  | 'prise'
  | 'agents'
  | 'atelier'
  | 'signature'
  | 'exemplaires'
  | 'chefBureau'
  | 'pieceService'
  | 'reflexion'
  | 'troisieme'
  | 'reforme'
  | 'demat'
  | 'rejetElargi'
  | 'commission'
  | 'sousDirecteur'
  | 'quatrieme'
  | 'tableau'
  | 'promotion';

export type Exemplaires = 1 | 2 | 3;

/** Dossiers par procédure et par rang d'étape (même longueur que la procédure). */
export type Stocks = Record<ProcId, number[]>;

export interface StatsActe2 {
  /** Étapes franchies, tous dossiers confondus. */
  franchies: number;
  /** Étapes franchies par des dossiers en boucle. */
  franchiesBoucle: number;
  /** Visas accordés par un tap. */
  visasTampons: number;
  /** Usagers renvoyés chez eux parce que leur dossier est parti en boucle. */
  abandonsDemarche: number;
  taps: number;
}

export interface EtatActe2 {
  /** Horodatage de l'entrée dans l'acte (ms). */
  debut: number;
  guichets: number;
  agents: Record<Agent2Id, number>;
  procedures: Record<ProcId, Etape[]>;
  /** Dossiers d'usagers en cours. */
  usagers: Stocks;
  /** Dossiers en boucle, sans usager. */
  boucles: Stocks;
  population: number;
  abandons: number;
  conformitePoints: number;
  /** Points de dématérialisation (BALANCE2.demaCible = 100 %). Ne baisse jamais. */
  demaPoints: number;
  tauxRejet: number;
  exemplaires: Exemplaires;
  notes: Partial<Record<Note2Id, NoteState>>;
  notesVues: Note2Id[];
  /** Horodatage du premier dossier en boucle (null : aucune boucle encore). */
  premiereBoucle: number | null;
  /** Première procédure modifiée dans l'Atelier, citée par la lettre de démission. */
  premiereModif: ProcId | null;
  acteTermine: boolean;
  finActeVue: boolean;
  stats: StatsActe2;
}

/** Modificateurs dérivés des notes de service effectives de l'acte II et du grade. */
export interface Modifiers2 {
  tapPower: number;
  dotationMult: number;
  primeRejet: number;
  rejetMax: number;
  recrutementVisible: boolean;
  agentsDisponibles: Agent2Id[];
  atelierVisible: boolean;
  /** Étapes que l'Atelier permet d'ajouter. */
  etapesDisponibles: EtapeType[];
  procsOuvertes: ProcId[];
  exemplairesVisible: boolean;
  dematVisible: boolean;
  reformeVisible: boolean;
  tableauVisible: boolean;
}

/** Une modification demandée dans l'Atelier. */
export type ActionAtelier =
  | { type: 'ajouter'; p: ProcId; etape: EtapeType; exige?: ProcId }
  | { type: 'retirer'; p: ProcId; k: number }
  | { type: 'deplacer'; p: ProcId; k: number; sens: -1 | 1 }
  | { type: 'exiger'; p: ProcId; k: number; exige: ProcId };

/** Évènements produits par un tick ou un tap de l'acte II, pour le retour visuel. */
export interface Events2 {
  franchies: number;
  visas: number;
  budget: number;
  rupture: boolean;
  aucunVisa: boolean;
}
```

- [ ] **Step 2: Ajouter l'acte en cours à `GameState`**

Dans `types/game.ts`, en tête de fichier sous le commentaire d'en-tête, ajouter :

```ts
import type { EtatActe2 } from './acte2';
```

Dans `interface GameState`, juste après `version: 1;`, ajouter :

```ts
  /** Acte en cours (1 = Le Guichet, 2 = La Direction). */
  acte: 1 | 2;
  /** État de l'acte II, null tant que l'acte I n'est pas terminé. */
  acte2: EtatActe2 | null;
```

Dans `data/engine.ts`, fonction `etatInitial`, juste après `version: 1,`, ajouter :

```ts
    acte: 1,
    acte2: null,
```

- [ ] **Step 3: Écrire les constantes de l'acte II**

`constants/balanceActe2.ts` :

```ts
/**
 * Constantes d'équilibrage de l'acte II — La Direction.
 * Toute valeur ici est vérifiée par scripts/simulate-acte2.ts.
 */
import type { Agent2Id, Etape, EtapeType, Exemplaires, ProcId } from '../types/acte2';

export const BALANCE2 = {
  /** Habitants de la ville à l'entrée dans l'acte, et capacité maximale. */
  populationInitiale: 1500,
  populationMax: 4000,
  /** Nouveaux habitants par seconde, en fraction de la place libre. */
  installationRate: 1 / 60,
  /** Demandes par seconde et par usager inactif. */
  demandeRate: 1 / 20,
  /** Dossiers d'usagers qui attendent déjà à la Carte d'identité. */
  fileInitiale: 20,
  budgetInitial: 0,
  formulairesInitiaux: 300,
  /** Dotation de base par étape franchie (€), multipliée par celle de l'étape. */
  dotation: 1,
  /** Prime de rejet : part de la dotation versée en plus pour un dossier rejeté. */
  primeRejet: 0.2,
  confParRejet: 1,
  /** Part des usagers qui abandonnent, par point de patience coûté par une étape. */
  abandonParPoint: 0.04,
  /** Part des usagers rejetés qui abandonnent (un point de patience sur trois). */
  abandonRejet: 1 / 3,
  rejetMaxInitial: 0.5,
  /** Guichets : étapes franchies par seconde et prix. */
  guichet: { vitesse: 0.5, coutBase: 60, croissance: 1.15 },
  /** Le guichet 3 de l'acte I, compressé en unité. */
  guichetsInitiaux: 1,
  etapesMax: 8,
  /** Points de dématérialisation correspondant à 100 %. */
  demaCible: 3_000_000,
  /** Délai du filet de sécurité après la note « Pièce délivrée par nos services » (min). */
  filetMinutes: 15,
} as const;

export interface EtapeDef {
  type: EtapeType;
  nom: string;
  description: string;
  conf: number;
  dotation: number;
  /** Temps moyen passé à l'étape (s). */
  delai: number;
  /** Points de patience coûtés à l'usager. */
  patience: number;
}

export const ETAPES: Record<EtapeType, EtapeDef> = {
  piece: {
    type: 'piece',
    nom: 'Pièce justificative',
    description: 'Une pièce de plus. Elle justifie la suivante.',
    conf: 1,
    dotation: 1,
    delai: 3,
    patience: 1,
  },
  visa: {
    type: 'visa',
    nom: 'Visa',
    description: 'Attend un coup de tampon.',
    conf: 2,
    dotation: 1,
    delai: 4,
    patience: 1,
  },
  signature: {
    type: 'signature',
    nom: 'Signature',
    description: 'Lisible de préférence. Jamais lisible.',
    conf: 1,
    dotation: 1,
    delai: 3,
    patience: 1,
  },
  pieceService: {
    type: 'pieceService',
    nom: 'Pièce délivrée par nos services',
    description: 'Exige un document délivré par une autre de vos procédures.',
    conf: 1,
    dotation: 1,
    delai: 3,
    patience: 1,
  },
  reflexion: {
    type: 'reflexion',
    nom: 'Délai de réflexion',
    description: 'Protège l’usager de toute décision hâtive.',
    conf: 1,
    dotation: 0,
    delai: 15,
    patience: 2,
  },
  commission: {
    type: 'commission',
    nom: 'Commission',
    description: 'Se réunit quand le quorum est atteint.',
    conf: 3,
    dotation: 2,
    delai: 15,
    patience: 2,
  },
};

/** Effet du curseur Exemplaires exigés, par étape franchie. Les formulaires suivent le nombre d'exemplaires. */
export const EXEMPLAIRES: Record<Exemplaires, { dotation: number; conf: number; patience: number }> = {
  1: { dotation: 1, conf: 1, patience: 1 },
  2: { dotation: 1.6, conf: 1.8, patience: 1.5 },
  3: { dotation: 2.1, conf: 2.5, patience: 2 },
};

export const PROC_NOMS: Record<ProcId, string> = {
  identite: 'Carte d’identité',
  domicile: 'Justificatif de domicile',
  hebergement: 'Attestation d’hébergement',
  vie: 'Certificat de vie',
};

/** Procédures à l'entrée dans l'acte : la Carte d'identité est imposée par le S.I.C. */
export const PROCEDURES_INITIALES: Record<ProcId, Etape[]> = {
  identite: [{ type: 'piece' }, { type: 'visa' }],
  domicile: [{ type: 'piece' }],
  hebergement: [{ type: 'piece' }],
  vie: [{ type: 'piece' }],
};

export interface Agent2Def {
  id: Agent2Id;
  nom: string;
  description: string;
  /** Visas accordés par seconde. */
  vitesse: number;
  coutBase: number;
  croissance: number;
}

export const AGENTS2: Agent2Def[] = [
  {
    id: 'instructeur',
    nom: 'Instructeur',
    description: 'Vise ce qu’on lui tend. Ne lit pas, par principe.',
    vitesse: 0.3,
    coutBase: 100,
    croissance: 1.13,
  },
  {
    id: 'chefBureau',
    nom: 'Chef de bureau',
    description: 'Vise ce que l’instructeur a visé, pour le cas où.',
    vitesse: 2,
    coutBase: 1500,
    croissance: 1.15,
  },
  {
    id: 'sousDirecteur',
    nom: 'Sous-directeur',
    description: 'Ne vise rien lui-même. Délègue, très vite.',
    vitesse: 12,
    coutBase: 20000,
    croissance: 1.15,
  },
];
```

- [ ] **Step 4: Écrire les tests d'entrée dans l'acte**

`scripts/tests/acte2.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import { BALANCE2 } from '../../constants/balanceActe2';
import type { GameState } from '../../types/game';
import type { EtatActe2 } from '../../types/acte2';

/** Entrée dans l'acte II à t = 0, budget et formulaires illimités. */
function base2(): GameState {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  return { ...s, budget: 1e9, formulaires: 1e9 };
}

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

const proche = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('entrée dans l’acte II : seul le compteur de tampons est conservé', () => {
  const fin = { ...E.signerCerfa(E.etatInitial(0), 'Test', 0), tampons: 160000, budget: 5e6, formulaires: 9000 };
  const s = D.entrerActe2(fin, 1000);
  assert.equal(s.acte, 2);
  assert.equal(s.tampons, 160000);
  assert.equal(s.budget, BALANCE2.budgetInitial);
  assert.equal(s.formulaires, BALANCE2.formulairesInitiaux);
  assert.equal(x(s).guichets, 1);
  assert.deepEqual(x(s).procedures.identite.map((e) => e.type), ['piece', 'visa']);
  assert.deepEqual(x(s).usagers.identite, [BALANCE2.fileInitiale, 0]);
  assert.deepEqual(x(s).boucles.domicile, [0]);
  assert.equal(x(s).debut, 1000);
});

test('entrer deux fois dans l’acte II ne remet rien à zéro', () => {
  const s = { ...base2(), tampons: 42 };
  assert.equal(D.entrerActe2(s, 5000), s);
});

test('sauvegarde antérieure à l’acte II : acte 1, sans état d’acte II', () => {
  const ancienne: Partial<GameState> = { ...E.etatInitial(0) };
  delete ancienne.acte;
  delete ancienne.acte2;
  const n = normaliserSauvegarde(ancienne as GameState);
  assert.equal(n.acte, 1);
  assert.equal(n.acte2, null);
});

test('une sauvegarde d’acte II sans son état est refusée', () => {
  assert.equal(estSauvegardeValide({ ...E.etatInitial(0), acte: 2, acte2: null }), false);
  assert.equal(estSauvegardeValide(base2()), true);
});
```

- [ ] **Step 5: Lancer les tests, vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL, `Cannot find module '…/data/acte2/moteur'`.

- [ ] **Step 6: Écrire l'état initial et l'entrée dans l'acte**

`data/acte2/moteur.ts` :

```ts
/**
 * Moteur de l'acte II — La Direction. Fonctions pures, sans dépendance React :
 * utilisées par GameStateContext et par scripts/simulate-acte2.ts.
 */
import type { GameState } from '../../types/game';
import { PROCS, type Etape, type EtatActe2, type ProcId, type Stocks } from '../../types/acte2';
import { BALANCE2, PROCEDURES_INITIALES } from '../../constants/balanceActe2';

export function copieProcedures(p: Record<ProcId, Etape[]>): Record<ProcId, Etape[]> {
  return Object.fromEntries(PROCS.map((id) => [id, p[id].map((e) => ({ ...e }))])) as Record<
    ProcId,
    Etape[]
  >;
}

export function copieStocks(st: Stocks): Stocks {
  return Object.fromEntries(PROCS.map((p) => [p, [...st[p]]])) as Stocks;
}

/** Stocks à zéro : un compteur par étape de chaque procédure. */
export function stocksPour(procedures: Record<ProcId, Etape[]>): Stocks {
  return Object.fromEntries(PROCS.map((p) => [p, procedures[p].map(() => 0)])) as Stocks;
}

export function sommeStocks(st: Stocks): number {
  let t = 0;
  for (const p of PROCS) for (const v of st[p]) t += v;
  return t;
}

/** État de la Direction à l'entrée dans l'acte : le guichet 3 et la procédure du S.I.C. */
export function etatInitialActe2(maintenant: number): EtatActe2 {
  const procedures = copieProcedures(PROCEDURES_INITIALES);
  const usagers = stocksPour(procedures);
  usagers.identite[0] = BALANCE2.fileInitiale;
  return {
    debut: maintenant,
    guichets: BALANCE2.guichetsInitiaux,
    agents: { instructeur: 0, chefBureau: 0, sousDirecteur: 0 },
    procedures,
    usagers,
    boucles: stocksPour(procedures),
    population: BALANCE2.populationInitiale,
    abandons: 0,
    conformitePoints: 0,
    demaPoints: 0,
    tauxRejet: 0,
    exemplaires: 1,
    notes: {},
    notesVues: [],
    premiereBoucle: null,
    premiereModif: null,
    acteTermine: false,
    finActeVue: false,
    stats: { franchies: 0, franchiesBoucle: 0, visasTampons: 0, abandonsDemarche: 0, taps: 0 },
  };
}

/**
 * Passage à l'acte II : toutes les ressources repartent à zéro, sauf le compteur
 * de tampons (et donc le grade). Le budget non consommé est « restitué au Trésor ».
 */
export function entrerActe2(s: GameState, maintenant: number): GameState {
  if (s.acte === 2) return s;
  return {
    ...s,
    acte: 2,
    acte2: etatInitialActe2(maintenant),
    budget: BALANCE2.budgetInitial,
    formulaires: BALANCE2.formulairesInitiaux,
    derniereMaj: maintenant,
  };
}
```

- [ ] **Step 7: Valider et normaliser les sauvegardes**

Dans `data/save.ts`, dans `estSauvegardeValide`, remplacer la dernière ligne de la condition `estNombre(s.derniereMaj)` par :

```ts
    estNombre(s.derniereMaj) &&
    (s.acte !== 2 || (typeof s.acte2 === 'object' && s.acte2 !== null))
```

Remplacer toute la fonction `normaliserSauvegarde` par :

```ts
/**
 * Met à niveau une sauvegarde plus ancienne : retire les champs qui n'existent plus (`circulairesVues`),
 * complète `seuilRenfort` (ancien seuil fixe de 8 tampons, pour ne pas cacher une note déjà vue)
 * et, sans `acte` (antérieure à l'acte II), place la partie à l'acte I.
 */
export function normaliserSauvegarde(s: GameState): GameState {
  const { circulairesVues: _, ...reste } = s as GameState & { circulairesVues?: unknown };
  const avecSeuil = estNombre(reste.seuilRenfort) ? reste : { ...reste, seuilRenfort: 8 };
  return (avecSeuil as Partial<GameState>).acte === undefined ? { ...avecSeuil, acte: 1, acte2: null } : avecSeuil;
}
```

- [ ] **Step 8: Lancer les tests et le contrôle de types**

Run: `npm test`
Expected: PASS (tous les tests, anciens compris).

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune erreur. S'il en apparaît dans `context/` ou `components/` parce qu'un objet `GameState` y est construit à la main, y ajouter `acte: 1, acte2: null` à l'endroit signalé.

- [ ] **Step 9: Commit**

```bash
git add types/acte2.ts types/game.ts constants/balanceActe2.ts data/acte2/moteur.ts data/engine.ts data/save.ts scripts/tests/acte2.test.ts
git commit -m "feat(logic): état de l'acte II et entrée dans La Direction

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Procédures, boucles et Atelier

**Files:**
- Create: `data/acte2/procedures.ts`
- Modify: `scripts/tests/acte2.test.ts` (ajouts en fin de fichier)

**Interfaces:**
- Consumes: types de `types/acte2.ts`, `BALANCE2`, `PROCEDURES_INITIALES`.
- Produces: `exigences(procedures, p): ProcId[]`, `mene(procedures, ouvertes, depart, cible): boolean`, `estBoucle(procedures, ouvertes, p, exige): boolean`, `procsEnBoucle(procedures, ouvertes): ProcId[]`, `appliquerAction(x, action, disponibles, ouvertes): EtatActe2` (renvoie **le même objet** `x` si l'action est refusée).

- [ ] **Step 1: Écrire les tests**

Ajouter les imports en tête de `scripts/tests/acte2.test.ts` :

```ts
import { appliquerAction, estBoucle, procsEnBoucle } from '../../data/acte2/procedures';
import { PROCEDURES_INITIALES } from '../../constants/balanceActe2';
import type { Etape, EtapeType, ProcId } from '../../types/acte2';
```

Ajouter en fin de fichier :

```ts
const P = (type: EtapeType, exige?: ProcId): Etape => (exige ? { type, exige } : { type });
const procs = (o: Partial<Record<ProcId, Etape[]>>): Record<ProcId, Etape[]> => ({
  ...PROCEDURES_INITIALES,
  ...o,
});

test('boucle : la Carte d’identité exige le Justificatif, qui exige la Carte', () => {
  const p = procs({ identite: [P('pieceService', 'domicile')], domicile: [P('pieceService', 'identite')] });
  const ouvertes: ProcId[] = ['identite', 'domicile'];
  assert.equal(estBoucle(p, ouvertes, 'identite', 'domicile'), true);
  assert.deepEqual(procsEnBoucle(p, ouvertes), ['identite', 'domicile']);
});

test('boucle à trois procédures, rompue si l’une est fermée', () => {
  const p = procs({
    identite: [P('pieceService', 'domicile')],
    domicile: [P('pieceService', 'hebergement')],
    hebergement: [P('pieceService', 'identite')],
  });
  assert.equal(estBoucle(p, ['identite', 'domicile', 'hebergement'], 'identite', 'domicile'), true);
  assert.equal(estBoucle(p, ['identite', 'domicile'], 'identite', 'domicile'), false);
});

test('simple dépendance : pas de boucle', () => {
  const p = procs({ identite: [P('pieceService', 'domicile')], domicile: [P('piece')] });
  assert.equal(estBoucle(p, ['identite', 'domicile'], 'identite', 'domicile'), false);
  assert.deepEqual(procsEnBoucle(p, ['identite', 'domicile']), []);
});

test('Atelier : ajouter une étape débloquée, en fin de liste', () => {
  const a = x(base2());
  const b = appliquerAction(a, { type: 'ajouter', p: 'identite', etape: 'signature' }, ['signature'], ['identite']);
  assert.deepEqual(b.procedures.identite.map((e) => e.type), ['piece', 'visa', 'signature']);
  assert.equal(b.usagers.identite.length, 3);
  assert.equal(b.boucles.identite.length, 3);
  assert.equal(b.premiereModif, 'identite');
});

test('Atelier : étape non débloquée ou procédure fermée → refus', () => {
  const a = x(base2());
  assert.equal(appliquerAction(a, { type: 'ajouter', p: 'identite', etape: 'commission' }, ['signature'], ['identite']), a);
  assert.equal(appliquerAction(a, { type: 'ajouter', p: 'domicile', etape: 'signature' }, ['signature'], ['identite']), a);
});

test('Atelier : une pièce de nos services n’exige qu’une autre procédure ouverte', () => {
  const a = x(base2());
  const dispo: EtapeType[] = ['pieceService'];
  const ouvertes: ProcId[] = ['identite', 'domicile'];
  const ajout = (exige?: ProcId) =>
    appliquerAction(a, { type: 'ajouter', p: 'identite', etape: 'pieceService', exige }, dispo, ouvertes);
  assert.equal(ajout('identite'), a);
  assert.equal(ajout('vie'), a);
  assert.equal(ajout(undefined), a);
  assert.deepEqual(ajout('domicile').procedures.identite[2], { type: 'pieceService', exige: 'domicile' });
});

test('Atelier : jamais moins d’une étape ni plus de huit', () => {
  const a = x(base2());
  const seule = appliquerAction(a, { type: 'retirer', p: 'domicile', k: 0 }, [], ['identite', 'domicile']);
  assert.equal(seule, a);
  const pleine = { ...a, procedures: { ...a.procedures, identite: Array.from({ length: 8 }, () => P('piece')) } };
  assert.equal(appliquerAction(pleine, { type: 'ajouter', p: 'identite', etape: 'piece' }, ['piece'], ['identite']), pleine);
});

test('Atelier : retirer une étape reporte ses dossiers sur celle qui prend sa place', () => {
  const a0 = x(base2());
  const a = { ...a0, usagers: { ...a0.usagers, identite: [3, 5] }, boucles: { ...a0.boucles, identite: [1, 2] } };
  const b = appliquerAction(a, { type: 'retirer', p: 'identite', k: 1 }, [], ['identite']);
  assert.deepEqual(b.procedures.identite.map((e) => e.type), ['piece']);
  assert.deepEqual(b.usagers.identite, [8]);
  assert.deepEqual(b.boucles.identite, [3]);
});

test('Atelier : déplacer une étape, les dossiers restent à leur rang', () => {
  const a0 = x(base2());
  const a = { ...a0, usagers: { ...a0.usagers, identite: [3, 5] } };
  const b = appliquerAction(a, { type: 'deplacer', p: 'identite', k: 1, sens: -1 }, [], ['identite']);
  assert.deepEqual(b.procedures.identite.map((e) => e.type), ['visa', 'piece']);
  assert.deepEqual(b.usagers.identite, [3, 5]);
  assert.equal(appliquerAction(a, { type: 'deplacer', p: 'identite', k: 1, sens: 1 }, [], ['identite']), a);
});

test('Atelier : changer la procédure exigée', () => {
  const a0 = x(base2());
  const a = { ...a0, procedures: { ...a0.procedures, identite: [P('pieceService', 'domicile')] }, usagers: { ...a0.usagers, identite: [0] }, boucles: { ...a0.boucles, identite: [0] } };
  const ouvertes: ProcId[] = ['identite', 'domicile', 'hebergement'];
  const b = appliquerAction(a, { type: 'exiger', p: 'identite', k: 0, exige: 'hebergement' }, [], ouvertes);
  assert.deepEqual(b.procedures.identite[0], { type: 'pieceService', exige: 'hebergement' });
  assert.equal(appliquerAction(a, { type: 'exiger', p: 'identite', k: 0, exige: 'identite' }, [], ouvertes), a);
});
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL, `Cannot find module '…/data/acte2/procedures'`.

- [ ] **Step 3: Écrire le graphe et les actions de l'Atelier**

`data/acte2/procedures.ts` :

```ts
/**
 * Procédures de l'acte II : graphe des exigences, détection des boucles, actions de l'Atelier.
 * Une boucle n'est jamais nommée au joueur : elle naît de ses propres exigences.
 */
import type { ActionAtelier, Etape, EtapeType, EtatActe2, ProcId } from '../../types/acte2';
import { BALANCE2 } from '../../constants/balanceActe2';

/** Procédures exigées par `p` (étapes « Pièce délivrée par nos services »). */
export function exigences(procedures: Record<ProcId, Etape[]>, p: ProcId): ProcId[] {
  const r: ProcId[] = [];
  for (const e of procedures[p]) if (e.type === 'pieceService' && e.exige !== undefined) r.push(e.exige);
  return r;
}

/** Vrai si l'on va de `depart` à `cible` en suivant les exigences, par des procédures ouvertes. */
export function mene(
  procedures: Record<ProcId, Etape[]>,
  ouvertes: ProcId[],
  depart: ProcId,
  cible: ProcId,
): boolean {
  const vues = new Set<ProcId>();
  const pile: ProcId[] = [depart];
  while (pile.length > 0) {
    const p = pile.pop() as ProcId;
    for (const suivante of exigences(procedures, p)) {
      if (!ouvertes.includes(suivante)) continue;
      if (suivante === cible) return true;
      if (!vues.has(suivante)) {
        vues.add(suivante);
        pile.push(suivante);
      }
    }
  }
  return false;
}

/** Un dossier de `p` qui exige une pièce de `exige` part en boucle si `exige` ramène à `p`. */
export function estBoucle(
  procedures: Record<ProcId, Etape[]>,
  ouvertes: ProcId[],
  p: ProcId,
  exige: ProcId,
): boolean {
  return mene(procedures, ouvertes, exige, p);
}

/** Procédures prises dans au moins une boucle. */
export function procsEnBoucle(procedures: Record<ProcId, Etape[]>, ouvertes: ProcId[]): ProcId[] {
  return ouvertes.filter((p) => mene(procedures, ouvertes, p, p));
}

const exigenceValide = (p: ProcId, exige: ProcId | undefined, ouvertes: ProcId[]): exige is ProcId =>
  exige !== undefined && exige !== p && ouvertes.includes(exige);

/**
 * Applique une modification de l'Atelier. Les dossiers engagés restent à leur rang ;
 * ceux d'une étape retirée passent à celle qui prend sa place (ou à la dernière).
 * Renvoie `x` inchangé (même objet) si l'action est refusée.
 */
export function appliquerAction(
  x: EtatActe2,
  a: ActionAtelier,
  disponibles: EtapeType[],
  ouvertes: ProcId[],
): EtatActe2 {
  if (!ouvertes.includes(a.p)) return x;
  const etapes = [...x.procedures[a.p]];
  const u = [...x.usagers[a.p]];
  const b = [...x.boucles[a.p]];
  switch (a.type) {
    case 'ajouter': {
      if (!disponibles.includes(a.etape) || etapes.length >= BALANCE2.etapesMax) return x;
      if (a.etape === 'pieceService') {
        if (!exigenceValide(a.p, a.exige, ouvertes)) return x;
        etapes.push({ type: 'pieceService', exige: a.exige });
      } else {
        etapes.push({ type: a.etape });
      }
      u.push(0);
      b.push(0);
      break;
    }
    case 'retirer': {
      if (etapes.length <= 1 || a.k < 0 || a.k >= etapes.length) return x;
      etapes.splice(a.k, 1);
      const [ru] = u.splice(a.k, 1);
      const [rb] = b.splice(a.k, 1);
      const cible = Math.min(a.k, etapes.length - 1);
      u[cible] += ru;
      b[cible] += rb;
      break;
    }
    case 'deplacer': {
      const j = a.k + a.sens;
      if (a.k < 0 || a.k >= etapes.length || j < 0 || j >= etapes.length) return x;
      [etapes[a.k], etapes[j]] = [etapes[j], etapes[a.k]];
      break;
    }
    case 'exiger': {
      const e = etapes[a.k];
      if (!e || e.type !== 'pieceService' || !exigenceValide(a.p, a.exige, ouvertes)) return x;
      etapes[a.k] = { type: 'pieceService', exige: a.exige };
      break;
    }
  }
  return {
    ...x,
    procedures: { ...x.procedures, [a.p]: etapes },
    usagers: { ...x.usagers, [a.p]: u },
    boucles: { ...x.boucles, [a.p]: b },
    premiereModif: x.premiereModif ?? a.p,
  };
}
```

- [ ] **Step 4: Lancer les tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add data/acte2/procedures.ts scripts/tests/acte2.test.ts
git commit -m "feat(logic): procédures de l'acte II, détection des boucles et Atelier

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Notes de service de l'acte II et modificateurs

**Files:**
- Create: `data/acte2/notes2.ts`
- Modify: `data/acte2/moteur.ts` (ajouts)
- Modify: `scripts/tests/acte2.test.ts` (ajouts)

**Interfaces:**
- Consumes: `EtatActe2`, `Modifiers2`, `Note2Id`, `BALANCE2`, `rangGrade` et `BALANCE` de l'acte I.
- Produces: dans `notes2.ts` : `NoteDef2`, `NOTES2`, `NOTES2_PAR_ID`, `dematPct(x): number` (non plafonné). Dans `moteur.ts` : `noteEffective2(x, id, maintenant)`, `getModifiers2(s, maintenant): Modifiers2`, `notesVisibles2(s): Note2Id[]`, `peutAcheterNote2(s, id)`, `acheterNote2(s, id, maintenant)`. Helper de test `avecNotes2(s, ids)`.

- [ ] **Step 1: Écrire les tests**

Ajouter en tête de `scripts/tests/acte2.test.ts` :

```ts
import { NOTES2 } from '../../data/acte2/notes2';
import type { Note2Id } from '../../types/acte2';
```

Ajouter en fin de fichier :

```ts
/** Marque des notes de l'acte II comme achetées et effectives depuis t = 0. */
function avecNotes2(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

test('début d’acte : seule la Carte d’identité est ouverte, l’Atelier est fermé', () => {
  const m = D.getModifiers2(base2(), 0);
  assert.deepEqual(m.procsOuvertes, ['identite']);
  assert.deepEqual(m.etapesDisponibles, ['visa']);
  assert.equal(m.atelierVisible, false);
  assert.equal(m.recrutementVisible, false);
  assert.equal(m.rejetMax, 0.5);
});

test('le catalogue compte 17 notes numérotées de 1 à 17', () => {
  assert.deepEqual(NOTES2.map((n) => n.numero), Array.from({ length: 17 }, (_, i) => i + 1));
});

test('la note n° 1 est visible d’emblée et ouvre le recrutement', () => {
  const s = base2();
  assert.ok(D.notesVisibles2(s).includes('prise'));
  assert.equal(D.getModifiers2(D.acheterNote2(s, 'prise', 0), 0).recrutementVisible, true);
});

test('l’Atelier ouvre le Justificatif de domicile et la Pièce justificative', () => {
  const m = D.getModifiers2(avecNotes2(base2(), ['atelier']), 0);
  assert.equal(m.atelierVisible, true);
  assert.deepEqual(m.procsOuvertes, ['identite', 'domicile']);
  assert.ok(m.etapesDisponibles.includes('piece'));
});

test('une note en instruction ne s’applique qu’à la fin de son délai', () => {
  let s = avec2(base2(), { stats: { ...x(base2()).stats, franchies: 3000 } });
  s = D.acheterNote2(s, 'atelier', 0);
  assert.equal(D.getModifiers2(s, 1000).atelierVisible, false);
  assert.equal(D.getModifiers2(s, 120_000).atelierVisible, true);
});

test('Promotion : visible à 100 % de dématérialisation, termine l’acte', () => {
  const s = avec2(base2(), { demaPoints: BALANCE2.demaCible });
  assert.ok(D.notesVisibles2(s).includes('promotion'));
  assert.equal(x(D.acheterNote2(s, 'promotion', 0)).acteTermine, true);
});

test('grades : la dotation de l’acte II suit le compteur de tampons', () => {
  proche(D.getModifiers2({ ...base2(), tampons: 10000 }, 0).dotationMult, 1.2);
});
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL, `Cannot find module '…/data/acte2/notes2'`.

- [ ] **Step 3: Écrire le catalogue des notes**

`data/acte2/notes2.ts` :

```ts
/**
 * Notes de service de l'acte II — La Direction.
 * Chaque note apporte une blague, une mécanique et un indice (comme à l'acte I).
 */
import type { GameState } from '../../types/game';
import type { EtatActe2, Modifiers2, Note2Id } from '../../types/acte2';
import { BALANCE2 } from '../../constants/balanceActe2';

export interface NoteDef2 {
  id: Note2Id;
  numero: number;
  titre: string;
  texte: string;
  effet: string;
  cout: number;
  /** Délai d'instruction en secondes réelles (0 = immédiat). */
  instruction: number;
  visible: (s: GameState) => boolean;
  appliquer: (m: Modifiers2) => void;
}

/** Pourcentage de dématérialisation (0..∞), non plafonné pour les conditions. */
export function dematPct(x: EtatActe2): number {
  return (x.demaPoints / BALANCE2.demaCible) * 100;
}

const achetee = (x: EtatActe2, id: Note2Id): boolean => x.notes[id] !== undefined;

/** Condition de visibilité évaluée sur l'état de l'acte II (fausse hors de l'acte II). */
const si =
  (f: (x: EtatActe2) => boolean) =>
  (s: GameState): boolean =>
    s.acte2 !== null && f(s.acte2);

export const NOTES2: NoteDef2[] = [
  {
    id: 'prise',
    numero: 1,
    titre: 'Prise de fonctions',
    texte: 'Vous êtes nommé chef de service. Votre bureau sera livré prochainement. Votre bureau, c’est le guichet 3.',
    effet: 'Débloque le recrutement des Guichets.',
    cout: 0,
    instruction: 0,
    visible: si(() => true),
    appliquer: (m) => {
      m.recrutementVisible = true;
    },
  },
  {
    id: 'agents',
    numero: 2,
    titre: 'Agents d’instruction',
    texte: 'Les visas ne s’accordent pas tout seuls. Des agents ont été formés pour les accorder tout seuls.',
    effet: 'Débloque l’Instructeur.',
    cout: 200,
    instruction: 30,
    visible: si((x) => x.guichets >= 5),
    appliquer: (m) => {
      m.agentsDisponibles.push('instructeur');
    },
  },
  {
    id: 'atelier',
    numero: 3,
    titre: 'Atelier des procédures',
    texte: 'Le chef de service est autorisé à compléter les procédures. Il n’est pas autorisé à les simplifier.',
    effet: 'Débloque l’Atelier, la procédure Justificatif de domicile et l’étape Pièce justificative.',
    cout: 1500,
    instruction: 120,
    visible: si((x) => x.stats.franchies >= 3000),
    appliquer: (m) => {
      m.atelierVisible = true;
      m.procsOuvertes.push('domicile');
      m.etapesDisponibles.push('piece');
    },
  },
  {
    id: 'signature',
    numero: 4,
    titre: 'Signature manuscrite',
    texte: 'Toute pièce doit être signée. Toute signature doit être lisible. Aucune signature n’est lisible.',
    effet: 'Débloque l’étape Signature.',
    cout: 2500,
    instruction: 60,
    visible: si((x) => achetee(x, 'atelier')),
    appliquer: (m) => {
      m.etapesDisponibles.push('signature');
    },
  },
  {
    id: 'exemplaires',
    numero: 5,
    titre: 'Exemplaires exigés',
    texte: 'Par mesure de sécurité, toute pièce est exigée en plusieurs exemplaires. Les exemplaires sont détruits après vérification.',
    effet: 'Débloque le curseur Exemplaires exigés.',
    cout: 4000,
    instruction: 120,
    visible: si((x) => achetee(x, 'atelier') && x.stats.franchies >= 8000),
    appliquer: (m) => {
      m.exemplairesVisible = true;
    },
  },
  {
    id: 'chefBureau',
    numero: 6,
    titre: 'Chef de bureau',
    texte: 'Un chef de bureau vise ce que l’instructeur a visé, pour le cas où.',
    effet: 'Débloque le Chef de bureau.',
    cout: 8000,
    instruction: 120,
    visible: si((x) => x.agents.instructeur >= 10),
    appliquer: (m) => {
      m.agentsDisponibles.push('chefBureau');
    },
  },
  {
    id: 'pieceService',
    numero: 7,
    titre: 'Pièce délivrée par nos services',
    texte: 'Rappel : un justificatif délivré par nos services fait foi pour toute démarche, y compris celle qui l’a délivré.',
    effet: 'Débloque l’étape Pièce délivrée par nos services.',
    cout: 15000,
    instruction: 240,
    visible: si((x) => achetee(x, 'signature') && x.stats.franchies >= 25000),
    appliquer: (m) => {
      m.etapesDisponibles.push('pieceService');
    },
  },
  {
    id: 'reflexion',
    numero: 8,
    titre: 'Délai de réflexion',
    texte: 'Un délai de réflexion protège l’usager contre toute décision hâtive, y compris la sienne.',
    effet: 'Débloque l’étape Délai de réflexion.',
    cout: 20000,
    instruction: 180,
    visible: si((x) => achetee(x, 'pieceService')),
    appliquer: (m) => {
      m.etapesDisponibles.push('reflexion');
    },
  },
  {
    id: 'troisieme',
    numero: 9,
    titre: 'Troisième guichet thématique',
    texte: 'Une démarche est créée pour attester que l’usager est hébergé. Par lui-même, le cas échéant.',
    effet: 'Ouvre la procédure Attestation d’hébergement.',
    cout: 30000,
    instruction: 240,
    visible: si((x) => achetee(x, 'pieceService')),
    appliquer: (m) => {
      m.procsOuvertes.push('hebergement');
    },
  },
  {
    id: 'reforme',
    numero: 10,
    titre: 'Réforme de l’action publique',
    texte: 'Une réforme peut être engagée à tout moment. Elle réorganisera l’ensemble des services sans en modifier le fonctionnement.',
    effet: 'Débloque la Réforme (Options).',
    cout: 0,
    instruction: 0,
    visible: si((x) => x.premiereBoucle !== null),
    appliquer: (m) => {
      m.reformeVisible = true;
    },
  },
  {
    id: 'demat',
    numero: 11,
    titre: 'Plan de dématérialisation',
    texte: 'Le S.I.C. engage la dématérialisation des démarches. Une démarche dématérialisée ne nécessite plus d’usager. Votre taux de dématérialisation sera désormais publié.',
    effet: 'Révèle le Taux de dématérialisation.',
    cout: 50000,
    instruction: 300,
    visible: si((x) => x.premiereBoucle !== null && x.stats.franchiesBoucle >= 5000),
    appliquer: (m) => {
      m.dematVisible = true;
    },
  },
  {
    id: 'rejetElargi',
    numero: 12,
    titre: 'Rejet élargi',
    texte: 'Le taux de rejet maximal est relevé. Il ne s’applique, rappelons-le, qu’aux dossiers incomplets, c’est-à-dire à tous.',
    effet: 'Taux de rejet jusqu’à 80 %.',
    cout: 80000,
    instruction: 180,
    visible: si((x) => achetee(x, 'demat')),
    appliquer: (m) => {
      m.rejetMax = Math.max(m.rejetMax, 0.8);
    },
  },
  {
    id: 'commission',
    numero: 13,
    titre: 'Commission ad hoc',
    texte: 'Une commission examinera les dossiers dès que son règlement intérieur aura été examiné par une commission.',
    effet: 'Débloque l’étape Commission.',
    cout: 120000,
    instruction: 300,
    visible: si((x) => achetee(x, 'demat')),
    appliquer: (m) => {
      m.etapesDisponibles.push('commission');
    },
  },
  {
    id: 'sousDirecteur',
    numero: 14,
    titre: 'Sous-directeur',
    texte: 'Le sous-directeur ne vise rien lui-même. Il délègue, ce qui va beaucoup plus vite.',
    effet: 'Débloque le Sous-directeur.',
    cout: 200000,
    instruction: 300,
    visible: si((x) => x.agents.chefBureau >= 10),
    appliquer: (m) => {
      m.agentsDisponibles.push('sousDirecteur');
    },
  },
  {
    id: 'quatrieme',
    numero: 15,
    titre: 'Quatrième guichet thématique',
    texte: 'Pour toute démarche, l’usager doit désormais prouver qu’il est en vie. La preuve est valable trois mois, sauf décès.',
    effet: 'Ouvre la procédure Certificat de vie.',
    cout: 300000,
    instruction: 480,
    visible: si((x) => achetee(x, 'commission')),
    appliquer: (m) => {
      m.procsOuvertes.push('vie');
    },
  },
  {
    id: 'tableau',
    numero: 16,
    titre: 'Tableau de bord',
    texte: 'Un tableau de bord est mis à votre disposition. Il mesure ce qui a été jugé mesurable.',
    effet: 'Affiche les abandons de démarche et le taux de satisfaction.',
    cout: 0,
    instruction: 0,
    visible: si((x) => dematPct(x) >= 25),
    appliquer: (m) => {
      m.tableauVisible = true;
    },
  },
  {
    id: 'promotion',
    numero: 17,
    titre: 'Promotion',
    texte: 'Vos résultats ont été jugés exemplaires. La Direction sera rattachée au ministère. Vous aussi.',
    effet: 'Termine l’acte II.',
    cout: 0,
    instruction: 0,
    visible: si((x) => dematPct(x) >= 100),
    appliquer: () => undefined,
  },
];

export const NOTES2_PAR_ID: Record<Note2Id, NoteDef2> = Object.fromEntries(
  NOTES2.map((n) => [n.id, n]),
) as Record<Note2Id, NoteDef2>;
```

- [ ] **Step 4: Ajouter les modificateurs et l'achat des notes au moteur**

Dans `data/acte2/moteur.ts`, remplacer le bloc d'imports par :

```ts
import type { GameState } from '../../types/game';
import {
  PROCS,
  type Etape,
  type EtatActe2,
  type Modifiers2,
  type Note2Id,
  type ProcId,
  type Stocks,
} from '../../types/acte2';
import { BALANCE } from '../../constants/balance';
import { BALANCE2, PROCEDURES_INITIALES } from '../../constants/balanceActe2';
import { rangGrade } from '../engine';
import { NOTES2, NOTES2_PAR_ID } from './notes2';
```

Ajouter en fin de fichier :

```ts
/** Vrai si la note est achetée et son délai d'instruction écoulé. */
export function noteEffective2(x: EtatActe2, id: Note2Id, maintenant: number): boolean {
  const n = x.notes[id];
  return n !== undefined && n.effective <= maintenant;
}

/** Modificateurs de l'acte II : notes effectives et grade (le grade suit le compteur de tampons). */
export function getModifiers2(s: GameState, maintenant: number): Modifiers2 {
  const m: Modifiers2 = {
    tapPower: 1,
    dotationMult: 1 + BALANCE.bonusGrade * rangGrade(s.tampons),
    primeRejet: BALANCE2.primeRejet,
    rejetMax: BALANCE2.rejetMaxInitial,
    recrutementVisible: false,
    agentsDisponibles: [],
    atelierVisible: false,
    etapesDisponibles: ['visa'],
    procsOuvertes: ['identite'],
    exemplairesVisible: false,
    dematVisible: false,
    reformeVisible: false,
    tableauVisible: false,
  };
  const x = s.acte2;
  if (!x) return m;
  for (const n of NOTES2) if (noteEffective2(x, n.id, maintenant)) n.appliquer(m);
  return m;
}

/** Notes visibles (conditions remplies), achetées ou non, dans l'ordre du catalogue. */
export function notesVisibles2(s: GameState): Note2Id[] {
  const x = s.acte2;
  if (!x) return [];
  return NOTES2.filter((n) => x.notes[n.id] !== undefined || n.visible(s)).map((n) => n.id);
}

export function peutAcheterNote2(s: GameState, id: Note2Id): boolean {
  const x = s.acte2;
  const n = NOTES2_PAR_ID[id];
  return x !== null && x.notes[id] === undefined && n.visible(s) && s.budget >= n.cout;
}

export function acheterNote2(s: GameState, id: Note2Id, maintenant: number): GameState {
  if (!peutAcheterNote2(s, id)) return s;
  const x = s.acte2 as EtatActe2;
  const n = NOTES2_PAR_ID[id];
  return {
    ...s,
    budget: s.budget - n.cout,
    acte2: {
      ...x,
      notes: { ...x.notes, [id]: { achetee: maintenant, effective: maintenant + n.instruction * 1000 } },
      acteTermine: x.acteTermine || id === 'promotion',
    },
  };
}
```

- [ ] **Step 5: Lancer les tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add data/acte2/notes2.ts data/acte2/moteur.ts scripts/tests/acte2.test.ts
git commit -m "feat(logic): notes de service de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Moteur — étapes, visas, boucles et dématérialisation

**Files:**
- Modify: `data/engine.ts` (`relancer` extrait en `relancerNotes`)
- Modify: `data/acte2/moteur.ts` (ajouts)
- Modify: `scripts/tests/acte2.test.ts` (ajouts)

**Interfaces:**
- Consumes: `estBoucle` (Task 2), `getModifiers2` (Task 3), `multiplicateurAnciennete` et `partRejetee` de l'acte I.
- Produces: dans `engine.ts` : `partRejetee` exportée. Dans `moteur.ts` : `vitesseGuichets(x)`, `vitesseVisas(x)`, `usagersEnCours(x)`, `dossiersEnBoucle(x)`, `visasEnAttente(x)`, `dematerialisation(x)` (0..100), `tick2(s, dt, maintenant, enJeu?) → { s, ev: Events2 }`, `tamponner2(s, maintenant, alea?) → { s, ev: Events2 }`. Helper de test `avancer2(s, secondes, depart?)`.

Règles (spec, section « Boucle de jeu » et « La boucle ») :
- Chaque étape franchie : dotation de l'étape × exemplaires, Conformité, `+1 tampon`, `exemplaires` formulaires.
- Les Guichets franchissent toutes les étapes sauf les Visas ; les Visas sont accordés par les agents (tick) et par le tap.
- Un dossier ne peut franchir une étape qu'après son délai moyen (sortie exponentielle, comme les retours de l'acte I).
- Patience : à chaque étape, une part `patience × abandonParPoint × exemplaires.patience` des usagers abandonne.
- Pièce délivrée par nos services : un dossier lié est déposé dans la procédure exigée. Si celle-ci ramène à la procédure du dossier, c'est une boucle : l'usager est renvoyé chez lui (abandon de démarche) et le dossier continue sans lui.
- Fin de procédure : rejet. Un usager rejeté revient au début (un tiers abandonne) ; un dossier en boucle rejeté revient au début sans aucun coût. Au tap, la part rejetée est tirée au sort comme à l'acte I (`partRejetee`) ; pour les guichets et les agents, c'est le taux moyen.
- Chaque étape franchie par un dossier en boucle ajoute 1 point de dématérialisation.

- [ ] **Step 1: Écrire les tests**

Ajouter en fin de `scripts/tests/acte2.test.ts` :

```ts
/** Avance de `secondes` par pas de 100 ms. */
function avancer2(s: GameState, secondes: number, depart = 0): GameState {
  let r = s;
  for (let i = 1; i <= secondes * 10; i++) r = D.tick2(r, 0.1, depart + i * 100).s;
  return r;
}

/** Une procédure à un seul Visa, avec des dossiers d'usagers ou en boucle à ce visa. */
function auVisa(s: GameState, usagers: number, boucles: number): GameState {
  return avec2(s, {
    procedures: { ...x(s).procedures, identite: [{ type: 'visa' }] },
    usagers: { ...x(s).usagers, identite: [usagers] },
    boucles: { ...x(s).boucles, identite: [boucles] },
  });
}

test('les guichets franchissent les pièces, jamais les visas', () => {
  // Population = dossiers en cours : aucune nouvelle demande pendant ce tick.
  const s = D.tick2(avec2(base2(), { population: BALANCE2.fileInitiale }), 1, 1000).s;
  proche(x(s).usagers.identite[0], BALANCE2.fileInitiale - 0.5);
  proche(x(s).usagers.identite[1], 0.5 * (1 - BALANCE2.abandonParPoint));
  proche(s.tampons, 0.5);
});

test('un tap accorde un visa : dotation, tampon, Conformité', () => {
  const s0 = auVisa(base2(), 5, 0);
  const r = D.tamponner2(s0, 0);
  assert.equal(r.ev.visas, 1);
  proche(x(r.s).usagers.identite[0], 4);
  proche(r.s.budget - s0.budget, 1);
  proche(x(r.s).conformitePoints, 2);
  proche(r.s.tampons, s0.tampons + 1);
});

test('sans visa en attente, le tap ne fait rien', () => {
  const s0 = auVisa(base2(), 0, 0);
  const r = D.tamponner2(s0, 0);
  assert.equal(r.ev.aucunVisa, true);
  assert.equal(r.s.budget, s0.budget);
});

/** Tirage qui rejette toujours (alea < taux), et tirage qui ne rejette jamais. */
const toujours = () => 0;
const jamais = () => 0.999;

test('rejet d’un usager : il perd patience et peut abandonner', () => {
  const s0 = avec2(auVisa(base2(), 5, 0), { tauxRejet: 0.5 });
  const r = D.tamponner2(s0, 0, toujours);
  // 4 % abandonnent au visa ; le reste est rejeté (tirage) ; un tiers des rejetés abandonne.
  proche(x(r.s).abandons, 0.04 + 0.96 / 3);
  proche(x(r.s).usagers.identite[0], 4 + 0.96 - 0.96 / 3);
  proche(r.s.budget - s0.budget, 1 + 0.96 * BALANCE2.primeRejet);
  proche(x(D.tamponner2(s0, 0, jamais).s).abandons, 0.04);
});

test('rejet d’un dossier en boucle : aucun coût, il est redéposé', () => {
  const s0 = avec2(auVisa(base2(), 0, 5), { tauxRejet: 0.5 });
  const r = D.tamponner2(s0, 0, toujours);
  assert.equal(x(r.s).abandons, 0);
  proche(x(r.s).boucles.identite[0], 5);
  proche(x(r.s).demaPoints, 1);
});

test('automates : le rejet est au taux moyen, sans tirage', () => {
  let s = avec2(base2(), { tauxRejet: 0.5, agents: { instructeur: 50, chefBureau: 0, sousDirecteur: 0 }, population: 0 });
  s = avec2(s, { usagers: { ...x(s).usagers, identite: [0, 10] } });
  const a = D.tick2(s, 1, 1000).s, b = D.tick2(s, 1, 1000).s;
  assert.deepEqual(x(a).usagers, x(b).usagers);
});

test('Exemplaires ×3 : trois formulaires par étape, dotation ×2,1', () => {
  const s0 = avec2(auVisa(base2(), 5, 0), { exemplaires: 3 });
  const r = D.tamponner2(s0, 0);
  proche(s0.formulaires - r.s.formulaires, 3);
  proche(r.s.budget - s0.budget, 2.1);
});

test('rupture d’imprimés : aucun visa sans formulaires', () => {
  const s0 = { ...auVisa(base2(), 5, 0), formulaires: 0 };
  const r = D.tamponner2(s0, 0);
  assert.equal(r.ev.rupture, true);
  assert.deepEqual(x(r.s).usagers.identite, [5]);
});

test('une boucle renvoie les usagers chez eux et produit de la dématérialisation', () => {
  let s = avecNotes2(base2(), ['atelier', 'pieceService']);
  s = avec2(s, {
    guichets: 100,
    population: 10,
    procedures: {
      ...x(s).procedures,
      identite: [{ type: 'pieceService', exige: 'domicile' }],
      domicile: [{ type: 'pieceService', exige: 'identite' }],
    },
    usagers: { ...x(s).usagers, identite: [10], domicile: [0] },
    boucles: { ...x(s).boucles, identite: [0], domicile: [0] },
  });
  s = avancer2(s, 10);
  assert.ok(x(s).premiereBoucle !== null);
  assert.ok(x(s).stats.abandonsDemarche > 0);
  assert.ok(D.dossiersEnBoucle(x(s)) > 0);
  assert.ok(x(s).demaPoints > 0);
});

test('simple dépendance : un second dossier d’usager, pas de dématérialisation', () => {
  let s = avecNotes2(base2(), ['atelier', 'pieceService']);
  s = avec2(s, {
    guichets: 100,
    procedures: { ...x(s).procedures, identite: [{ type: 'pieceService', exige: 'domicile' }] },
    usagers: { ...x(s).usagers, identite: [10] },
    boucles: { ...x(s).boucles, identite: [0] },
  });
  s = avancer2(s, 30);
  assert.equal(x(s).demaPoints, 0);
  assert.equal(x(s).premiereBoucle, null);
  assert.ok(x(s).usagers.domicile[0] > 0);
});

test('sans boucle, le Taux de dématérialisation reste à 0 exactement', () => {
  const s = avancer2(avec2(avecNotes2(base2(), ['prise', 'agents']), { guichets: 10, agents: { instructeur: 10, chefBureau: 0, sousDirecteur: 0 } }), 120);
  assert.ok(x(s).stats.franchies > 100);
  assert.equal(x(s).demaPoints, 0);
  assert.equal(D.dematerialisation(x(s)), 0);
});

```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL, `D.tick2 is not a function`.

- [ ] **Step 3: Exporter le tirage du rejet de l'acte I**

Dans `data/engine.ts`, remplacer `function partRejetee(` par `export function partRejetee(` (aucun autre changement).

Run: `npm test`
Expected: les tests de l'acte I passent toujours (ceux de l'acte II échouent encore).

- [ ] **Step 4: Écrire le franchissement, le tick et le tap**

Dans `data/acte2/moteur.ts`, remplacer tout le bloc d'imports par :

```ts
import type { GameState } from '../../types/game';
import {
  PROCS,
  type Etape,
  type EtatActe2,
  type Events2,
  type Modifiers2,
  type Note2Id,
  type ProcId,
  type Stocks,
} from '../../types/acte2';
import { BALANCE } from '../../constants/balance';
import { AGENTS2, BALANCE2, ETAPES, EXEMPLAIRES, PROCEDURES_INITIALES } from '../../constants/balanceActe2';
import { multiplicateurAnciennete, partRejetee, rangGrade } from '../engine';
import { NOTES2, NOTES2_PAR_ID, dematPct } from './notes2';
import { estBoucle } from './procedures';
```

Ajouter en fin de fichier :

```ts
export const usagersEnCours = (x: EtatActe2): number => sommeStocks(x.usagers);
export const dossiersEnBoucle = (x: EtatActe2): number => sommeStocks(x.boucles);

/** Taux de dématérialisation affichable, plafonné à 100 %. */
export function dematerialisation(x: EtatActe2): number {
  return Math.min(100, dematPct(x));
}

/** Dossiers (usagers et boucles) qui attendent un visa. */
export function visasEnAttente(x: EtatActe2): number {
  let t = 0;
  for (const p of PROCS) {
    x.procedures[p].forEach((e, k) => {
      if (e.type === 'visa') t += x.usagers[p][k] + x.boucles[p][k];
    });
  }
  return t;
}

/** Étapes (hors visas) franchies par seconde par les Guichets. */
export function vitesseGuichets(x: EtatActe2): number {
  return x.guichets * BALANCE2.guichet.vitesse;
}

/** Visas accordés par seconde par les agents, ancienneté comprise. */
export function vitesseVisas(x: EtatActe2): number {
  let v = 0;
  for (const a of AGENTS2) {
    const n = x.agents[a.id];
    v += n * a.vitesse * multiplicateurAnciennete(n);
  }
  return v;
}

/** Dossiers d'une étape qui la franchissent : `u` d'usagers, `b` en boucle. */
interface Lot {
  p: ProcId;
  k: number;
  u: number;
  b: number;
}

const evVide = (): Events2 => ({ franchies: 0, visas: 0, budget: 0, rupture: false, aucunVisa: false });

function nettoyer(st: Stocks): Stocks {
  return Object.fromEntries(PROCS.map((p) => [p, st[p].map((v) => Math.max(0, v))])) as Stocks;
}

/**
 * Fait franchir leur étape aux lots : dotation, Conformité, tampons, formulaires, patience,
 * dossiers liés, boucles, rejet en fin de procédure, dématérialisation.
 * `alea` fourni (coup du joueur) : rejet tiré au sort ; absent (automates) : taux moyen.
 */
function franchir(
  s: GameState,
  lots: Lot[],
  m: Modifiers2,
  maintenant: number,
  alea?: () => number,
): { s: GameState; ev: Events2 } {
  const x0 = s.acte2 as EtatActe2;
  const ev = evVide();
  let total = 0;
  for (const l of lots) total += l.u + l.b;
  if (total <= 0) return { s, ev };
  // Formulaires : on franchit au prorata de ce que le stock permet.
  const ratio = Math.min(1, Math.max(0, s.formulaires) / (total * x0.exemplaires));
  if (ratio < 1) ev.rupture = true;
  if (ratio <= 0) return { s, ev };

  const ex = EXEMPLAIRES[x0.exemplaires];
  const dot = BALANCE2.dotation * m.dotationMult * ex.dotation;
  const taux = Math.min(x0.tauxRejet, m.rejetMax);
  const usagers = copieStocks(x0.usagers);
  const boucles = copieStocks(x0.boucles);
  let budget = 0;
  let conf = 0;
  let franchies = 0;
  let franchiesBoucle = 0;
  let population = x0.population;
  let abandons = x0.abandons;
  let abandonsDemarche = x0.stats.abandonsDemarche;
  let premiereBoucle = x0.premiereBoucle;

  for (const l of lots) {
    const u0 = l.u * ratio;
    const b0 = l.b * ratio;
    if (u0 + b0 <= 0) continue;
    const etapes = x0.procedures[l.p];
    const e = etapes[l.k];
    const def = ETAPES[e.type];
    usagers[l.p][l.k] -= u0;
    boucles[l.p][l.k] -= b0;
    franchies += u0 + b0;
    franchiesBoucle += b0;
    budget += (u0 + b0) * dot * def.dotation;
    conf += (u0 + b0) * def.conf * ex.conf;
    if (e.type === 'visa') ev.visas += u0 + b0;

    // Patience : une part des usagers abandonne à chaque étape.
    const ab = u0 * Math.min(1, def.patience * BALANCE2.abandonParPoint * ex.patience);
    population -= ab;
    abandons += ab;
    let u = u0 - ab;
    let b = b0;

    // Pièce délivrée par nos services : un dossier lié est déposé dans la procédure exigée.
    if (e.type === 'pieceService' && e.exige !== undefined && m.procsOuvertes.includes(e.exige)) {
      if (estBoucle(x0.procedures, m.procsOuvertes, l.p, e.exige)) {
        // La chaîne ne peut plus aboutir : l'usager est renvoyé chez lui, le dossier continue sans lui.
        abandonsDemarche += u;
        b += u;
        u = 0;
        boucles[e.exige][0] += b;
        if (b > 0 && premiereBoucle === null) premiereBoucle = maintenant;
      } else {
        usagers[e.exige][0] += u;
        boucles[e.exige][0] += b;
      }
    }

    if (l.k + 1 < etapes.length) {
      usagers[l.p][l.k + 1] += u;
      boucles[l.p][l.k + 1] += b;
      continue;
    }

    // Fin de procédure : rejet. Sans usager, le rejet ne coûte rien.
    const part = alea ? partRejetee(u + b, taux, alea) : taux;
    const rejU = u * part;
    const rejB = b * part;
    budget += (rejU + rejB) * dot * m.primeRejet;
    conf += (rejU + rejB) * BALANCE2.confParRejet;
    const abRejet = rejU * BALANCE2.abandonRejet;
    population -= abRejet;
    abandons += abRejet;
    usagers[l.p][0] += rejU - abRejet;
    boucles[l.p][0] += rejB;
  }

  ev.franchies = franchies;
  ev.budget = budget;
  const x: EtatActe2 = {
    ...x0,
    usagers: nettoyer(usagers),
    boucles: nettoyer(boucles),
    population: Math.max(0, population),
    abandons,
    conformitePoints: x0.conformitePoints + conf,
    demaPoints: x0.demaPoints + franchiesBoucle,
    premiereBoucle,
    stats: {
      ...x0.stats,
      franchies: x0.stats.franchies + franchies,
      franchiesBoucle: x0.stats.franchiesBoucle + franchiesBoucle,
      abandonsDemarche,
    },
  };
  return {
    ev,
    s: {
      ...s,
      acte2: x,
      tampons: s.tampons + franchies,
      budget: s.budget + budget,
      formulaires: s.formulaires - franchies * x0.exemplaires,
      stats: { ...s.stats, budgetGagne: s.stats.budgetGagne + budget },
    },
  };
}

/**
 * Avance l'acte II de `dt` secondes : demandes, installations, Guichets et agents.
 * Hors jeu (absence), aucun rejet.
 */
export function tick2(
  s0: GameState,
  dt: number,
  maintenant: number,
  enJeu = true,
): { s: GameState; ev: Events2 } {
  const x0 = s0.acte2;
  if (!x0) return { s: s0, ev: evVide() };
  const m = getModifiers2(s0, maintenant);

  // Nouvelles demandes des usagers inactifs, réparties entre les procédures ouvertes.
  const usagers = copieStocks(x0.usagers);
  const inactifs = Math.max(0, x0.population - sommeStocks(usagers));
  const nouvelles = inactifs * (1 - Math.exp(-BALANCE2.demandeRate * dt));
  for (const p of m.procsOuvertes) usagers[p][0] += nouvelles / m.procsOuvertes.length;
  const population =
    x0.population + Math.max(0, BALANCE2.populationMax - x0.population) * BALANCE2.installationRate * dt;

  const x: EtatActe2 = { ...x0, usagers, population };
  const s: GameState = {
    ...s0,
    acte2: x,
    derniereMaj: maintenant,
    stats: enJeu ? { ...s0.stats, tempsDeJeu: s0.stats.tempsDeJeu + dt } : s0.stats,
  };

  // Dossiers prêts à franchir leur étape (délai moyen de l'étape écoulé).
  const guichet: Lot[] = [];
  const visa: Lot[] = [];
  let totalG = 0;
  let totalV = 0;
  for (const p of m.procsOuvertes) {
    x.procedures[p].forEach((e, k) => {
      const f = 1 - Math.exp(-dt / ETAPES[e.type].delai);
      const lot = { p, k, u: x.usagers[p][k] * f, b: x.boucles[p][k] * f };
      if (e.type === 'visa') {
        visa.push(lot);
        totalV += lot.u + lot.b;
      } else {
        guichet.push(lot);
        totalG += lot.u + lot.b;
      }
    });
  }
  const rG = totalG > 0 ? Math.min(1, (vitesseGuichets(x) * dt) / totalG) : 0;
  const rV = totalV > 0 ? Math.min(1, (vitesseVisas(x) * dt) / totalV) : 0;
  const lots = [
    ...guichet.map((l) => ({ ...l, u: l.u * rG, b: l.b * rG })),
    ...visa.map((l) => ({ ...l, u: l.u * rV, b: l.b * rV })),
  ];
  return franchir(s, lots, enJeu ? m : { ...m, rejetMax: 0 }, maintenant);
}

/** Un tap sur TAMPONNER : accorde `tapPower` visas en attente ; le rejet de chaque dossier est tiré au sort. */
export function tamponner2(
  s0: GameState,
  maintenant: number,
  alea: () => number = Math.random,
): { s: GameState; ev: Events2 } {
  const x0 = s0.acte2;
  if (!x0) return { s: s0, ev: evVide() };
  const m = getModifiers2(s0, maintenant);
  const s: GameState = {
    ...s0,
    acte2: { ...x0, stats: { ...x0.stats, taps: x0.stats.taps + 1 } },
    stats: { ...s0.stats, taps: s0.stats.taps + 1 },
  };
  const lots: Lot[] = [];
  let total = 0;
  for (const p of m.procsOuvertes) {
    x0.procedures[p].forEach((e, k) => {
      if (e.type !== 'visa') return;
      lots.push({ p, k, u: x0.usagers[p][k], b: x0.boucles[p][k] });
      total += x0.usagers[p][k] + x0.boucles[p][k];
    });
  }
  if (total < 1e-9) return { s, ev: { ...evVide(), aucunVisa: true } };
  const part = Math.min(1, m.tapPower / total);
  const r = franchir(s, lots.map((l) => ({ ...l, u: l.u * part, b: l.b * part })), m, maintenant, alea);
  const x = r.s.acte2 as EtatActe2;
  return { ev: r.ev, s: { ...r.s, acte2: { ...x, stats: { ...x.stats, visasTampons: x.stats.visasTampons + r.ev.visas } } } };
}
```

- [ ] **Step 5: Lancer les tests**

Run: `npm test`
Expected: PASS (acte I et acte II).

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add data/engine.ts data/acte2/moteur.ts scripts/tests/acte2.test.ts
git commit -m "feat(logic): moteur de l'acte II, boucles et dématérialisation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Achats, curseurs, Atelier et hors-ligne

**Files:**
- Modify: `data/acte2/moteur.ts` (ajouts)
- Modify: `scripts/tests/acte2.test.ts` (ajouts)

**Interfaces:**
- Consumes: `appliquerAction` (Task 2), `getModifiers2` (Task 3), `tick2`, `vitesseVisas` (Task 4).
- Produces: `coutGuichet(possedes)`, `acheterGuichet(s, maintenant)`, `coutAgent2(id, possedes)`, `gainAgent2(x, id)`, `peutAcheterAgent2(s, id, maintenant)`, `acheterAgent2(s, id, maintenant)`, `acheterRamettes2(s, nb)`, `requisitionUrgence2(s)`, `reglerTauxRejet2(s, taux, maintenant)`, `reglerExemplaires(s, n, maintenant)`, `modifierProcedure(s, action, maintenant)`, `simulerAbsence2(s, maintenant) → { s, secondes, franchies, budget }`. Toutes renvoient `s` inchangé si l'action est impossible.

- [ ] **Step 1: Écrire les tests**

Ajouter en tête de `scripts/tests/acte2.test.ts` :

```ts
import { BALANCE } from '../../constants/balance';
```

Ajouter en fin de fichier :

```ts
test('guichets : il faut la note n° 1, puis le prix monte de 15 %', () => {
  const s = base2();
  assert.equal(D.acheterGuichet(s, 0), s);
  assert.equal(x(D.acheterGuichet(avecNotes2(s, ['prise']), 0)).guichets, 2);
  assert.equal(D.coutGuichet(1), 60);
  assert.equal(D.coutGuichet(2), Math.ceil(60 * 1.15));
});

test('agents : débloqués par note, ancienneté comprise', () => {
  let s = base2();
  assert.equal(D.peutAcheterAgent2(s, 'instructeur', 0), false);
  s = D.acheterAgent2(avecNotes2(s, ['agents']), 'instructeur', 0);
  assert.equal(x(s).agents.instructeur, 1);
  proche(D.vitesseVisas(x(s)), 0.3);
  // Le 10ᵉ instructeur double la vitesse de tous les instructeurs.
  const neuf = { ...x(s), agents: { ...x(s).agents, instructeur: 9 } };
  proche(D.gainAgent2(neuf, 'instructeur'), 10 * 0.3 * 2 - 9 * 0.3);
});

test('Taux de rejet plafonné, Exemplaires exigés après leur note', () => {
  let s = D.reglerTauxRejet2(base2(), 0.9, 0);
  proche(x(s).tauxRejet, 0.5);
  assert.equal(x(D.reglerExemplaires(s, 3, 0)).exemplaires, 1);
  s = avecNotes2(s, ['exemplaires']);
  assert.equal(x(D.reglerExemplaires(s, 3, 0)).exemplaires, 3);
});

test('Atelier fermé : aucune modification de procédure', () => {
  const s = base2();
  assert.equal(D.modifierProcedure(s, { type: 'retirer', p: 'identite', k: 0 }, 0), s);
  const s2 = D.modifierProcedure(avecNotes2(s, ['atelier']), { type: 'retirer', p: 'identite', k: 0 }, 0);
  assert.deepEqual(x(s2).procedures.identite.map((e) => e.type), ['visa']);
});

test('ramettes au prix de l’acte I, réquisition d’urgence sans budget', () => {
  const s = D.acheterRamettes2({ ...base2(), budget: 20, formulaires: 0 }, 5);
  assert.equal(s.formulaires, 2 * BALANCE.ramette);
  proche(s.budget, 20 - 2 * BALANCE.prixRamette);
  const vide = { ...base2(), budget: 0, formulaires: 0 };
  assert.equal(D.requisitionUrgence2(vide).formulaires, BALANCE.ramette);
  assert.equal(D.requisitionUrgence2({ ...vide, budget: 100 }).formulaires, 0);
});

test('hors-ligne : la simulation s’arrête au plafond', () => {
  const s = avec2(avecNotes2(base2(), ['prise', 'agents']), {
    guichets: 20,
    agents: { instructeur: 20, chefBureau: 0, sousDirecteur: 0 },
  });
  const r = D.simulerAbsence2(s, 10 * 3600 * 1000);
  assert.equal(r.secondes, BALANCE.horsLigneMax);
  assert.ok(r.franchies > 0);
  assert.equal(r.s.derniereMaj, 10 * 3600 * 1000);
});
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL, `D.acheterGuichet is not a function`.

- [ ] **Step 3: Écrire les achats et réglages**

Dans `data/acte2/moteur.ts`, remplacer l'import depuis `'../../types/acte2'` et celui depuis `'./procedures'` par :

```ts
import {
  PROCS,
  type ActionAtelier,
  type Agent2Id,
  type Etape,
  type EtatActe2,
  type Events2,
  type Exemplaires,
  type Modifiers2,
  type Note2Id,
  type ProcId,
  type Stocks,
} from '../../types/acte2';
import { appliquerAction, estBoucle } from './procedures';
```

Ajouter en fin de fichier :

```ts
/** Prix du prochain Guichet : le guichet 3, offert, ne compte pas. */
export function coutGuichet(possedes: number): number {
  const g = BALANCE2.guichet;
  return Math.ceil(g.coutBase * Math.pow(g.croissance, possedes - BALANCE2.guichetsInitiaux));
}

export function acheterGuichet(s: GameState, maintenant: number): GameState {
  const x = s.acte2;
  if (!x || !getModifiers2(s, maintenant).recrutementVisible) return s;
  const cout = coutGuichet(x.guichets);
  if (s.budget < cout) return s;
  return { ...s, budget: s.budget - cout, acte2: { ...x, guichets: x.guichets + 1 } };
}

export function coutAgent2(id: Agent2Id, possedes: number): number {
  const def = AGENTS2.find((a) => a.id === id);
  if (!def) return Infinity;
  return Math.ceil(def.coutBase * Math.pow(def.croissance, possedes));
}

/** Visas/s gagnés en recrutant un agent de plus (palier d'ancienneté compris). */
export function gainAgent2(x: EtatActe2, id: Agent2Id): number {
  const def = AGENTS2.find((a) => a.id === id);
  if (!def) return 0;
  const n = x.agents[id];
  return (n + 1) * def.vitesse * multiplicateurAnciennete(n + 1) - n * def.vitesse * multiplicateurAnciennete(n);
}

export function peutAcheterAgent2(s: GameState, id: Agent2Id, maintenant: number): boolean {
  const x = s.acte2;
  return (
    x !== null &&
    getModifiers2(s, maintenant).agentsDisponibles.includes(id) &&
    s.budget >= coutAgent2(id, x.agents[id])
  );
}

export function acheterAgent2(s: GameState, id: Agent2Id, maintenant: number): GameState {
  if (!peutAcheterAgent2(s, id, maintenant)) return s;
  const x = s.acte2 as EtatActe2;
  return {
    ...s,
    budget: s.budget - coutAgent2(id, x.agents[id]),
    acte2: { ...x, agents: { ...x.agents, [id]: x.agents[id] + 1 } },
  };
}

/** Achète `nb` ramettes au prix de l'acte I (sinon le maximum possible). */
export function acheterRamettes2(s: GameState, nb: number): GameState {
  const possibles = Math.min(nb, Math.floor(s.budget / BALANCE.prixRamette));
  if (possibles <= 0) return s;
  return {
    ...s,
    budget: s.budget - possibles * BALANCE.prixRamette,
    formulaires: s.formulaires + possibles * BALANCE.ramette,
    stats: { ...s.stats, formulairesAchetes: s.stats.formulairesAchetes + possibles * BALANCE.ramette },
  };
}

/** En rupture et sans de quoi payer une ramette, le service en fournit une, gratuitement. */
export function requisitionUrgence2(s: GameState): GameState {
  const x = s.acte2;
  if (!x || s.formulaires >= x.exemplaires || s.budget >= BALANCE.prixRamette) return s;
  return { ...s, formulaires: s.formulaires + BALANCE.ramette };
}

export function reglerTauxRejet2(s: GameState, taux: number, maintenant: number): GameState {
  const x = s.acte2;
  if (!x) return s;
  const m = getModifiers2(s, maintenant);
  const t = Math.max(0, Math.min(m.rejetMax, Math.round(taux * 100) / 100));
  return { ...s, acte2: { ...x, tauxRejet: t } };
}

export function reglerExemplaires(s: GameState, n: Exemplaires, maintenant: number): GameState {
  const x = s.acte2;
  if (!x || !getModifiers2(s, maintenant).exemplairesVisible) return s;
  return { ...s, acte2: { ...x, exemplaires: n } };
}

/** Modification d'une procédure dans l'Atelier (refusée tant que l'Atelier est fermé). */
export function modifierProcedure(s: GameState, action: ActionAtelier, maintenant: number): GameState {
  const x = s.acte2;
  if (!x) return s;
  const m = getModifiers2(s, maintenant);
  if (!m.atelierVisible) return s;
  const x2 = appliquerAction(x, action, m.etapesDisponibles, m.procsOuvertes);
  return x2 === x ? s : { ...s, acte2: x2 };
}

/** Simule une absence (Guichets et agents seuls, sans rejet), par pas d'une seconde, plafonnée. */
export function simulerAbsence2(
  s0: GameState,
  maintenant: number,
): { s: GameState; secondes: number; franchies: number; budget: number } {
  const secondes = Math.min(BALANCE.horsLigneMax, Math.max(0, Math.floor((maintenant - s0.derniereMaj) / 1000)));
  let s = s0;
  let franchies = 0;
  let budget = 0;
  const debut = maintenant - secondes * 1000;
  for (let i = 1; i <= secondes; i++) {
    const r = tick2(s, 1, debut + i * 1000, false);
    s = r.s;
    franchies += r.ev.franchies;
    budget += r.ev.budget;
  }
  return { s: { ...s, derniereMaj: maintenant }, secondes, franchies, budget };
}
```

- [ ] **Step 4: Lancer les tests et le contrôle de types**

Run: `npm test`
Expected: PASS.

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add data/acte2/moteur.ts scripts/tests/acte2.test.ts
git commit -m "feat(logic): achats, curseurs, Atelier et hors-ligne de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Courrier du S.I.C. de l'acte II

**Files:**
- Create: `data/acte2/courrier2.ts`
- Modify: `data/courrier.ts` (export de `LettreDef`, ajout des lettres de l'acte II)
- Modify: `scripts/tests/acte2.test.ts` (ajouts)

**Interfaces:**
- Consumes: `NOTES2` effectifs via `EtatActe2.notes`, `dematPct` (Task 3), `PROC_NOMS`, `formatEntier`.
- Produces: `LETTRES_ACTE2: LettreDef[]` (ids `a2-prise`, `a2-boucle`, `a2-filet1`, `a2-filet2`, `a2-demission`, `a2-rapport`), envoyées par l'existant `nouvellesLettres`.

- [ ] **Step 1: Écrire les tests**

Ajouter en tête de `scripts/tests/acte2.test.ts` :

```ts
import { nouvellesLettres } from '../../data/courrier';
```

Ajouter en fin de fichier :

```ts
const lettres = (s: GameState, t: number): string[] => nouvellesLettres(s, t).map((l) => l.id);

test('courrier : prise de fonctions à l’entrée dans l’acte II', () => {
  assert.ok(lettres(base2(), 0).includes('a2-prise'));
  assert.ok(!lettres(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0).includes('a2-prise'));
});

test('filet de sécurité : 15 puis 30 min après la note, tant qu’aucune boucle n’existe', () => {
  const s = avecNotes2(base2(), ['pieceService']);
  const min = 60_000;
  assert.ok(!lettres(s, 14 * min).includes('a2-filet1'));
  assert.ok(lettres(s, 15 * min).includes('a2-filet1'));
  assert.ok(!lettres(s, 29 * min).includes('a2-filet2'));
  assert.ok(lettres(s, 30 * min).includes('a2-filet2'));
  assert.ok(!lettres(avec2(s, { premiereBoucle: 1 }), 30 * min).includes('a2-filet1'));
});

test('félicitations du S.I.C. au premier dossier en boucle', () => {
  assert.ok(lettres(avec2(base2(), { premiereBoucle: 1 }), 0).includes('a2-boucle'));
});

test('démission : la pièce manquante est la première procédure modifiée', () => {
  const s = avec2({ ...base2(), demission: { deposeeLe: 0, relances: 0 } }, { premiereModif: 'domicile' });
  const l = nouvellesLettres(s, 0).find((v) => v.id === 'a2-demission');
  assert.ok(l?.corps.includes('Justificatif de domicile'));
});

test('rapport annuel à 100 % de dématérialisation', () => {
  const s = avec2(base2(), { demaPoints: BALANCE2.demaCible });
  const l = nouvellesLettres(s, 0).find((v) => v.id === 'a2-rapport');
  assert.ok(l?.corps.includes('Taux de satisfaction : 100 % (sur les usagers restants)'));
});
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL sur les tests de courrier (lettres absentes).

- [ ] **Step 3: Écrire les lettres de l'acte II**

`data/acte2/courrier2.ts` :

```ts
/**
 * Courrier du S.I.C. pour l'acte II — La Direction.
 * Les lettres passent par `nouvellesLettres` (data/courrier.ts), une seule fois chacune.
 */
import type { GameState } from '../../types/game';
import type { EtatActe2 } from '../../types/acte2';
import type { LettreDef } from '../courrier';
import { BALANCE2, PROC_NOMS } from '../../constants/balanceActe2';
import { formatEntier } from '../../utils/formatters';
import { dematPct } from './notes2';

const nom = (s: GameState): string => s.cerfa.prenom || 'Agent sans prénom';
const minutes = (m: number) => m * 60 * 1000;

/** Vrai si `n` délais de filet se sont écoulés depuis la note n° 7, sans aucune boucle. */
function filet(x: EtatActe2 | null, maintenant: number, n: number): boolean {
  const note = x?.notes.pieceService;
  return (
    x !== null &&
    note !== undefined &&
    x.premiereBoucle === null &&
    maintenant - note.effective >= minutes(BALANCE2.filetMinutes * n)
  );
}

export const LETTRES_ACTE2: LettreDef[] = [
  {
    id: 'a2-prise',
    objet: 'Prise de fonctions',
    corps: (s) =>
      `${nom(s)},\n\nVous êtes nommé·e chef de service à la Direction.\n\nLe budget non consommé de l’exercice précédent a été restitué au Trésor. Le guichet 3 vous est confié à titre d’unité.`,
    declencheur: (s) => s.acte2 !== null,
  },
  {
    id: 'a2-boucle',
    objet: 'Optimisation de vos circuits',
    corps: () =>
      'Le S.I.C. vous félicite pour l’optimisation de vos circuits.\n\nVos procédures se sollicitent désormais mutuellement. L’usager n’est plus indispensable à leur bon fonctionnement. Il n’en a pas été informé.',
    declencheur: (s) => s.acte2 !== null && s.acte2.premiereBoucle !== null,
  },
  {
    id: 'a2-filet1',
    objet: 'Constat de non-sollicitation',
    corps: () =>
      'Nos services constatent que vos procédures ne se sollicitent pas mutuellement.\n\nCette situation est regrettable.',
    declencheur: (s, t) => filet(s.acte2, t, 1),
  },
  {
    id: 'a2-filet2',
    objet: 'Constat de non-sollicitation (relance)',
    corps: () =>
      `La procédure « ${PROC_NOMS.identite} » pourrait exiger une pièce délivrée par la procédure « ${PROC_NOMS.domicile} ». L’inverse serait également fondé.\n\nLe S.I.C. ne donne pas d’instruction. Il constate.`,
    declencheur: (s, t) => filet(s.acte2, t, 2),
  },
  {
    id: 'a2-demission',
    objet: 'Votre demande n° 000001',
    corps: (s) => {
      const p = s.acte2?.premiereModif;
      return `Votre demande de démission demeure incomplète.\n\nPièce manquante : justificatif de conformité à la procédure « ${p ? PROC_NOMS[p] : PROC_NOMS.identite} ».`;
    },
    declencheur: (s) => s.demission.deposeeLe !== null && s.acte2 !== null && s.acte2.premiereModif !== null,
  },
  {
    id: 'a2-rapport',
    objet: 'Rapport annuel de performance',
    corps: (s) =>
      `Taux de satisfaction : 100 % (sur les usagers restants).\n\nAbandons de démarche : ${formatEntier(s.acte2?.stats.abandonsDemarche ?? 0)}.\n\nLe S.I.C. salue une Direction qui n’a plus besoin de personne.`,
    declencheur: (s) => s.acte2 !== null && dematPct(s.acte2) >= 100,
  },
];
```

Dans `data/courrier.ts` :
1. remplacer `interface LettreDef {` par `export interface LettreDef {` ;
2. ajouter l'import `import { LETTRES_ACTE2 } from './acte2/courrier2';` sous les imports existants ;
3. dans le tableau `LETTRES`, ajouter `...LETTRES_ACTE2,` juste après l'entrée `reaffectation` (dernier élément).

- [ ] **Step 4: Lancer les tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add data/acte2/courrier2.ts data/courrier.ts scripts/tests/acte2.test.ts
git commit -m "feat(logic): courrier du S.I.C. de l'acte II et filet de sécurité

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Simulateur de l'acte II et premier calage

**Files:**
- Create: `scripts/simulate-acte2.ts`
- Modify: `constants/balanceActe2.ts` et `data/acte2/notes2.ts` (calage)
- Modify: `specs/009-acte2-direction/spec.md` (section « Rythme cible » : mesures du robot)
- Modify: `CLAUDE.md` (commandes et fichiers de l'acte II)

**Interfaces:**
- Consumes: tout `data/acte2/moteur.ts`, `NOTES2`.
- Produces: la commande `node scripts/simulate-acte2.ts [taps/s] [minutes]`.

- [ ] **Step 1: Écrire le simulateur**

`scripts/simulate-acte2.ts` :

```ts
/**
 * Simulateur d'équilibrage de l'acte II.
 * Usage : node scripts/simulate-acte2.ts [tapsParSeconde] [minutesMax]
 *
 * Un joueur-robot entre dans l'acte II avec le compteur d'une fin d'acte I, tamponne les visas,
 * règle les curseurs au maximum, achète les notes dès qu'il peut, compose ses procédures
 * (boucle dès que possible) et recrute selon le goulot. Il construit la boucle instantanément :
 * un humain mettra plus longtemps. Sans Réforme (plan 3).
 */
import { registerHooks } from 'node:module';
import type { ActionAtelier, EtapeType, ProcId } from '../types/acte2.ts';

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

const { BALANCE } = await import('../constants/balance.ts');
const E = await import('../data/engine.ts');
const D = await import('../data/acte2/moteur.ts');
const { NOTES2 } = await import('../data/acte2/notes2.ts');

const taps = Number(process.argv[2] ?? 2);
const minutesMax = Number(process.argv[3] ?? 240);

let s = D.entrerActe2({ ...E.signerCerfa(E.etatInitial(0), 'Robot', 0), tampons: 160000 }, 0);
const jalons: Record<string, number> = {};
const marquer = (k: string, t: number) => {
  if (jalons[k] === undefined) jalons[k] = t;
};
const mn = (t: number) => `${(t / 60).toFixed(1)} min`;

/** Procédure exigée par chaque procédure : identite ↔ domicile forment la boucle. */
const PARTENAIRE: Record<ProcId, ProcId> = {
  identite: 'domicile',
  domicile: 'identite',
  hebergement: 'domicile',
  vie: 'identite',
};
const VOULU: EtapeType[] = ['piece', 'visa', 'signature', 'pieceService', 'commission'];

/** Ajoute à chaque procédure ouverte les étapes voulues qui manquent. */
function composer(now: number): void {
  for (;;) {
    const m = D.getModifiers2(s, now);
    if (!m.atelierVisible) return;
    const x = s.acte2!;
    let action: ActionAtelier | null = null;
    for (const p of m.procsOuvertes) {
      const types = x.procedures[p].map((e) => e.type);
      const manque = VOULU.find((t) => m.etapesDisponibles.includes(t) && !types.includes(t));
      if (manque === undefined) continue;
      action =
        manque === 'pieceService'
          ? { type: 'ajouter', p, etape: manque, exige: PARTENAIRE[p] }
          : { type: 'ajouter', p, etape: manque };
      break;
    }
    if (!action) return;
    const avant = s;
    s = D.modifierProcedure(s, action, now);
    if (s === avant) return;
  }
}

for (let t = 1; t <= minutesMax * 60; t++) {
  const now = t * 1000;
  for (let i = 0; i < taps; i++) s = D.tamponner2(s, now).s;
  s = D.tick2(s, 1, now).s;

  let m = D.getModifiers2(s, now);
  s = D.reglerTauxRejet2(s, m.rejetMax, now);
  if (m.exemplairesVisible) s = D.reglerExemplaires(s, 2, now);

  for (const id of D.notesVisibles2(s)) {
    if (D.peutAcheterNote2(s, id)) {
      s = D.acheterNote2(s, id, now);
      marquer(`note ${id}`, t);
    }
  }
  composer(now);
  m = D.getModifiers2(s, now);

  // Formulaires : garder 20 s de consommation.
  const x = s.acte2!;
  const conso = (D.vitesseGuichets(x) + D.vitesseVisas(x) + taps) * x.exemplaires * 20;
  if (s.formulaires < conso) s = D.acheterRamettes2(s, Math.ceil((conso - s.formulaires) / BALANCE.ramette));
  s = D.requisitionUrgence2(s);

  // Recrutement : on renforce le goulot (visas ou guichets), sans affamer la prochaine note.
  const enAttente = NOTES2.filter((n) => s.acte2!.notes[n.id] === undefined && n.visible(s) && n.cout > 0);
  const reserve = enAttente.length ? Math.min(...enAttente.map((n) => n.cout)) : 0;
  for (;;) {
    const y = s.acte2!;
    const visas = D.visasEnAttente(y);
    const autres = D.usagersEnCours(y) + D.dossiersEnBoucle(y) - visas;
    const agent = m.agentsDisponibles
      .map((id) => ({ id, cout: D.coutAgent2(id, y.agents[id]), gain: D.gainAgent2(y, id) }))
      .sort((a, b) => b.gain / b.cout - a.gain / a.cout)[0];
    const veutAgent = agent !== undefined && visas > autres;
    const cout = veutAgent ? agent.cout : D.coutGuichet(y.guichets);
    if (!m.recrutementVisible || s.budget < cout) break;
    if (reserve > 0 && cout > reserve * 0.5 && s.budget - cout < reserve) break;
    const avant = s;
    s = veutAgent ? D.acheterAgent2(s, agent.id, now) : D.acheterGuichet(s, now);
    if (s === avant) break;
    if (veutAgent) marquer('premier agent', t);
  }

  const y = s.acte2!;
  if (m.atelierVisible) marquer('atelier', t);
  if (y.premiereBoucle !== null) marquer('première boucle', t);
  if (m.reformeVisible) marquer('réforme débloquée', t);
  for (const pct of [25, 50, 75, 100]) if (D.dematerialisation(y) >= pct) marquer(`dématérialisation ${pct} %`, t);
  if (y.acteTermine) {
    marquer('fin de l’acte II', t);
    break;
  }

  if (t % 600 === 0) {
    console.log(
      `${mn(t).padStart(9)} | budget ${Math.round(s.budget).toString().padStart(9)} € | guichets ${y.guichets} | agents ${y.agents.instructeur}/${y.agents.chefBureau}/${y.agents.sousDirecteur} | usagers ${Math.round(D.usagersEnCours(y))} | boucle ${Math.round(D.dossiersEnBoucle(y))} | pop ${Math.round(y.population)} | démarches abandonnées ${Math.round(y.stats.abandonsDemarche)} | démat ${D.dematerialisation(y).toFixed(1)} %`,
    );
  }
}

console.log('\nJalons :');
for (const [k, t] of Object.entries(jalons).sort((a, b) => a[1] - b[1])) {
  console.log(`  ${mn(t).padStart(9)}  ${k}`);
}
const fin = s.acte2!;
console.log('\nMesures :');
console.log(`  visas au tap : ${Math.round(fin.stats.visasTampons)} sur ${Math.round(fin.stats.taps)} taps`);
console.log(`  procédures : ${Object.entries(fin.procedures).map(([p, e]) => `${p} [${e.map((v) => v.type).join(', ')}]`).join(' · ')}`);
```

- [ ] **Step 2: Lancer le simulateur**

Run: `node scripts/simulate-acte2.ts 2 240`
Expected: un journal toutes les 10 minutes, puis les jalons. Le script doit tourner sans erreur ; les valeurs de départ ne tombent pas forcément dans les cibles.

- [ ] **Step 3: Caler les jalons du robot**

Cibles du robot à 2 taps/s, **sans Réforme** (la Réforme et le mur sont calés au plan 3) :

| Jalon | Cible robot |
|---|---|
| Premier agent | 2 – 5 min |
| Atelier | 8 – 15 min |
| Note « Pièce délivrée par nos services » achetée | 18 – 28 min |
| Première boucle | 20 – 30 min |
| Dématérialisation 50 % | 60 – 85 min |
| Dématérialisation 100 % | 150 – 200 min (le mur que la Réforme aidera à franchir) |

Leviers, à ajuster dans cet ordre, en relançant `node scripts/simulate-acte2.ts 2 240` après chaque changement :
1. seuils `stats.franchies` des notes n° 3, 5 et 7 dans `data/acte2/notes2.ts` (date des déblocages) ;
2. coûts des notes n° 3 à 7 ;
3. `BALANCE2.demaCible` (durée de la montée de 0 à 100 %) ;
4. `BALANCE2.guichet` (vitesse, coût, croissance) et `AGENTS2` (vitesses, coûts) ;
5. `BALANCE2.demandeRate` et `populationMax` (abondance des usagers).

Après chaque ajustement : `npm test` doit rester vert (les tests utilisent les constantes par leur nom, sauf `coutGuichet(1) = 60`, `0,3` visa/s de l'instructeur et `1,2` de dotation au grade 2 : mettre ces trois tests à jour si `guichet.coutBase` ou la vitesse de l'instructeur changent).

Vérifier aussi à 1 et 3 taps/s : `node scripts/simulate-acte2.ts 1 300` et `node scripts/simulate-acte2.ts 3 240`. À 1 tap/s, la première boucle doit arriver avant 40 min.

- [ ] **Step 4: Consigner les mesures dans la spec**

Dans `specs/009-acte2-direction/spec.md`, sous le tableau « Rythme cible », ajouter :

```markdown
### Mesures du robot (sans Réforme, `scripts/simulate-acte2.ts`)

| Jalon | Robot 1 tap/s | Robot 2 taps/s | Robot 3 taps/s |
|---|---|---|---|
| Premier agent | … | … | … |
| Atelier | … | … | … |
| Première boucle | … | … | … |
| Dématérialisation 50 % | … | … | … |
| Dématérialisation 100 % | … | … | … |

Le robot construit la boucle dès que l'étape est disponible : le temps de découverte humain n'est pas mesuré ici.
```

en remplaçant chaque `…` par la valeur mesurée (en minutes, une décimale).

- [ ] **Step 5: Mettre à jour CLAUDE.md**

Dans `CLAUDE.md`, section « Commands », sous la ligne `node scripts/simulate-acte1.ts …`, ajouter :

```bash
node scripts/simulate-acte2.ts [taps/s] [minutes]   # Act II balance simulator (no Réforme yet)
```

Dans le tableau « Data layer files », ajouter ces lignes :

```markdown
| `data/acte2/moteur.ts` | Act II (La Direction): entry, `tick2`, `tamponner2` (visas), purchases, sliders, offline |
| `data/acte2/procedures.ts` | Procedure graph, loop detection, Atelier actions |
| `data/acte2/notes2.ts` | The 17 Act II Notes de service |
| `data/acte2/courrier2.ts` | Act II S.I.C. letters (incl. the safety-net letters) |
| `constants/balanceActe2.ts` | Act II tuning (`BALANCE2`), steps, Exemplaires, agents |
```

Si `CLAUDE.md` contient encore des modifications non commitées qui ne viennent pas de ce plan, demander au porteur de projet avant de le commiter.

- [ ] **Step 6: Vérifier puis commiter**

Run: `npm test`
Expected: PASS.

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune erreur.

```bash
git add scripts/simulate-acte2.ts constants/balanceActe2.ts data/acte2/notes2.ts specs/009-acte2-direction/spec.md CLAUDE.md scripts/tests/acte2.test.ts
git commit -m "perf(logic): simulateur de l'acte II et premier calage du rythme

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
