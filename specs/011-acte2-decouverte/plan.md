# Acte II — Ce que le service délivre — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Montrer au joueur ce que le service délivre : un relevé « Production du service » (demandes, documents délivrés, valeur d'un document, abandons, « → usagers » seulement pour les documents remis à des usagers) sur l'écran Direction et dans l'Atelier ; une bulle qui présente la demande d'une personne (« Mme Lefèvre demande une Carte d’identité ») jusqu'à une fiche « Délivrée », puis des demandes anonymes (« Demande n° 9 907 · Carte d’identité ») ; une colonne Usagers à la place de Visas ; une fiche de poste réduite à l'orientation. Côté mécanique : seule la Carte d'identité est demandée, chaque document délivré est compté (aux usagers / au service), le dossier qui franchit une pièce de service poursuit sa procédure jusqu'au visa, et les usagers disparaissent vraiment une fois la boucle formée. Trois raccourcis de test pour jouer les moments 2 à 5. Spec (approuvée, contraignante) : `specs/011-acte2-decouverte/spec.md` ; référence visuelle qui fait foi : `specs/011-acte2-decouverte/storyboard.html`.

**Architecture:** Tout le calcul reste dans `data/` (fonctions pures, `npm test`). L'état de l'acte II gagne un troisième stock, `suites` (dossiers sans usager qui ont déposé leur demande liée et poursuivent leur procédure jusqu'à la délivrance, sans plus rien déposer), et deux compteurs, `stats.delivresUsagers` et `stats.delivresService`. `franchir` (`data/acte2/moteur.ts`) fait passer les trois stocks, compte les documents délivrés en fin de procédure et applique la nouvelle règle de la pièce de service ; le nombre de dossiers en boucle (`boucles`) reste exactement celui des usagers entrés dans le circuit (test de conservation existant inchangé). `tick2` ne crée plus de demandes que dans `PROCS_DEMANDEES` (Carte d'identité), applique l'impatience des usagers qui attendent et, quand plus aucune procédure demandée n'aboutit (`aboutitPourUsagers`, `data/acte2/procedures.ts`), arrête les installations et vide la ville. Un nouveau module pur `data/acte2/production.ts` porte le document de chaque procédure (article, genre), la valeur d'un document et les lignes du relevé ; `data/acte2/vues.ts` produit le titre de la bulle et la fiche « Délivrée ». `GameStateContext` expose `production` ; les composants n'importent jamais `data/`. Les anciennes sauvegardes sont complétées par `normaliserSauvegarde` (stock et compteurs à zéro, lignes de fiche retirées oubliées).

**Tech Stack:** TypeScript strict, React Native / Expo 53 (expo-router, lucide-react-native 0.475), Node 25 (`node:test`).

## Questions ouvertes pour le porteur de projet

Chaque point est tranché par le défaut indiqué (déjà appliqué dans le plan) ; un autre choix ne touche que la tâche citée.

1. **Les usagers ne disparaissaient pas (§ 9) : calage.** Mesuré sur une copie du worktree avec les seules règles des § 5 et 8 : 10 min après la première boucle, 1 727 usagers en cours, soit 100 % de leur maximum (ils attendent sans fin à la première étape, aucune patience ne s'use en attendant, et la ville se remplit toujours). *Défaut :* deux mécaniques invisibles (Tâche 3) — **impatience** : chaque seconde d'attente, 0,2 % des usagers en cours renoncent et quittent la ville (≈ 8 min de patience) ; **exode** : quand plus aucune procédure demandée ne peut aboutir pour un usager, personne ne s'installe plus et 1 % des habitants sans démarche partent chaque seconde. Puis la cible de dématérialisation passe de 55 000 à **68 000** points (Tâche 5), parce que les dossiers qui poursuivent leur procédure comptent comme dossiers sans usager. Résultat à 2 taps/s : 9 usagers 10 min après la boucle (1,1 % du maximum), fin de l'acte à 192,3 min (avant : 191,9).
2. **« Documents délivrés au service > aux usagers » (§ 10).** *Défaut :* comparé sur les 10 minutes qui suivent la première boucle (1 667 au service, 0 aux usagers). En cumul depuis l'entrée dans l'acte, le service ne passe devant qu'à 59,5 min (boucle + 29,5 min), parce que 5 866 cartes ont été remises avant la boucle ; le simulateur affiche ce jalon à part.
3. **Quand « → usagers » disparaît.** *Défaut :* la destination suit la procédure, pas les compteurs : elle s'affiche tant que la procédure est demandée par les usagers et qu'aucune de ses pièces de service ne ramène à elle ; elle disparaît dès que la boucle se forme (moment 5), même si des cartes ont été remises avant.
4. **Éléments de la planche absents de la spec.** Le panneau « 9 800 Cartes d’identité délivrées · 3 usagers » (moment 5), la pastille rouge « 24 » sur l'onglet Justificatif de l'Atelier (moment 4) et le moment 0 « Visa ← ici / Repart avec sa Carte d’identité » ne figurent pas au § « Ce qui change ». *Défaut :* non ajoutés (l'en-tête Usagers et le relevé portent déjà ces deux nombres ; une pastille rouge se lit comme une alerte) ; la bulle garde le tableau de circulation et sa fiche « Délivrée » passe en gras sur fond vert dès le premier document délivré.
5. **Place du relevé sur l'écran Direction.** *Défaut :* sous la bulle (qui perd sa pointe, comme sur la planche), avant la scène qui rétrécit d'autant ; en écran compact (< 720 pt) ou dès trois procédures ouvertes, une seule ligne par procédure sans titre (mesuré à 375 × 812 avec deux procédures et le curseur Exemplaires : la scène garde ≈ 150 pt). Au pied de l'Atelier, le relevé est toujours complet ; l'en-tête de chaque procédure de l'Atelier dit « N demandes · M délivrés » (les abandons passent au relevé).
6. **Valeur et abandons, nom de l'usager, numéro.** *Défaut :* la ligne « +X € la carte · K abandons » n'apparaît que pour les procédures que les usagers demandent (la Carte d'identité ; les autres n'ont ni usager à perdre ni document remis), comme sur la planche. La bulle nomme un usager (« Mme Lefèvre », civilité et nom tirés de la liste de `data/usagers.ts`) selon la part des dossiers d'usagers au visa, parapheur par parapheur (tirage stable par numéro) ; sinon « Demande n° 048 · Carte d’identité » avec la numérotation existante des parapheurs (048 + visas accordés au tap).
7. **Fiche de poste.** *Défaut :* trois lignes d'orientation — « Les dossiers circulent d’étape en étape », « Vous visez les parapheurs », « Chaque étape consomme des formulaires » — plus « Les agents visent à votre place » et « Les fournitures sont commandées par le service des achats » à leur note ; les lignes Atelier, Exemplaires, pièce de service et évaluation disparaissent (une ancienne sauvegarde les oublie ; les deux lignes réécrites gardent leur identifiant, donc restent lues).

## Global Constraints

- **Base :** branche `feat/acte2-lisibilite` (acte II plans 1 à 3, raccourcis de test, lisibilité 010 ; 164 tests verts). Ne jamais faire `git add -A` ni `git add .` : chaque commit liste ses fichiers.
- **Couches strictes :** `components/` et `app/` n'importent jamais `data/` ; tout passe par `useGameState()`, qui réexporte les types utiles (`LigneProduction`, `Encre`, `ProcAtelier`…). Constantes de l'acte II dans `constants/balanceActe2.ts` ; l'acte I (`constants/balance.ts`, `data/engine.ts`) n'est pas modifié.
- **Ce que l'interface n'ajoute pas** (contraintes permanentes) : annulation d'achat ; ligne d'explication sous un contrôle ; bouton « ? » ; définition de compteur ; bandeau sur la scène pixel ; raccourci clavier autre que la barre d'espace. Aucun texte ne nomme la boucle ni la dématérialisation avant la note « Plan de dématérialisation » : un document délivré pour un dossier du service n'a simplement **aucune** destination affichée.
- **Charte :** couleurs de `constants/Colors.ts` uniquement (encre de l'acte via `encre`), tailles par `Typo`, `Interligne`, `Espace`, `Charte` ; `StyleSheet.create` ; `Panneau` ; `Pressable` seulement ; composants ≤ ~300 lignes ; `React.memo` sur les éléments de liste.
- **Accessibilité :** cibles ≥ 44 × 44 pt, libellé d'accessibilité sur chaque bloc d'information, aucune information portée par la seule couleur (valeur et abandons = symbole + mot ; « → usagers » = flèche + mot ; fiche « Délivrée » faite = gras + bord + fond).
- Textes en jeu en français, apostrophes typographiques `’`, nombres au format français (`utils/formatters`), espace insécable avant « € ». Pas de `any`. Prettier : guillemets simples, indentation de 2 espaces.
- Commits au format Conventional Commits (`feat(logic): …`, `feat(state): …`, `feat(ui): …`, `perf(logic): …`, `test: …`, `docs: …`), terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Vérifier dans le navigateur (tâches d'interface)

1. **Serveur :** depuis la racine du worktree, `npx expo start --web --port 8085`. Ouvrir `http://localhost:8085` dans le Browser pane (`preview_start` avec l'URL). **Un seul onglet de jeu** : deux onglets se disputeraient la sauvegarde. Si Metro ne voit pas une modification : relancer avec `--clear` (dossier iCloud, voir CLAUDE.md).
2. **Largeur de téléphone :** `resize_window` preset `mobile` (375 × 812) ; écran compact : `resize_window` 375 × 667. Revenir au preset `desktop` à la fin.
3. **Charger un préréglage :** `http://localhost:8085/?test` ouvre « Raccourcis de test » ; toucher la carte du préréglage, confirmer « Charger » : la partie est remplacée et l'on revient au premier onglet. Préréglages utiles : `debut` (« Acte II — prise de fonctions »), `compliquer`, `pieceService`, `avantBoucle` (ajoutés par la Tâche 7), `boucle`, `demat`. Repli sans l'écran : `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <préréglage>` imprime une ligne `localStorage.setItem(…)` à exécuter avec `javascript_tool` sur `http://localhost:8085/manifest.webmanifest`, puis revenir sur `/`.
4. **Lire l'état :** `javascript_tool` → `JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')).acte2` (écrit au plus une seconde après chaque changement).
5. **Console :** `read_console_messages` avec `onlyErrors: true` doit être vide à la fin de chaque vérification (recharger la page avant de lire si un ancien bundle avait échoué).

## File Structure

| Fichier | Rôle | Statut |
|---|---|---|
| `types/acte2.ts` | `EtatActe2.suites` ; `StatsActe2.delivresUsagers`, `delivresService` ; `LigneFiche2Id` réduit, `LIGNES_FICHE2` | Modifier |
| `constants/balanceActe2.ts` | `PROCS_DEMANDEES` ; `BALANCE2.impatience`, `exode` ; `demaCible` 68 000 | Modifier |
| `data/acte2/moteur.ts` | État initial, `parProcNul`, délivrance et pièce de service dans `franchir`, demandes, impatience et exode dans `tick2`, `usagersAvecDemarche`, `dossiersDuService` | Modifier |
| `data/acte2/procedures.ts` | Stock `suites` dans l'Atelier ; `procedureAboutit`, `aboutitPourUsagers` | Modifier |
| `data/acte2/production.ts` | Documents (article, genre), `valeurDocument`, `lignesProduction` | Créer |
| `data/acte2/vues.ts` | Stock `suites` au tableau de circulation ; `usagers` = démarches en cours ; titre de la bulle, `delivrance` | Modifier |
| `data/acte2/vueAtelier.ts` | Bilan par `valeurDocument` ; `enCours` / `abandons` retirés | Modifier |
| `data/acte2/fiche.ts` | Cinq lignes au plus | Modifier |
| `data/usagers.ts` | `tirage`, `demandeur` | Modifier |
| `data/jurisprudence.ts` | `NOMS_PROCEDURES` exporté | Modifier |
| `data/save.ts` | `suites`, compteurs de production, lignes de fiche retirées | Modifier |
| `data/presets.ts` | `compliquer`, `pieceService`, `avantBoucle` ; `suites` et compteurs dans les préréglages existants | Modifier |
| `scripts/robots.ts`, `scripts/simulate-acte2.ts` | Robot (dossiers du service, Atelier optionnel) ; mesures de la spec 011 § 10 | Modifier |
| `scripts/save-acte2.ts` | Liste des préréglages (commentaire) | Modifier |
| `scripts/tests/production-acte2.test.ts` | État, sauvegarde, délivrance, pièce de service, impatience, exode | Créer |
| `scripts/tests/releve-acte2.test.ts` | Relevé, documents, valeur | Créer |
| `scripts/tests/acte2.test.ts`, `reforme.test.ts`, `fiche-acte2.test.ts`, `presets.test.ts`, `vues-acte2.test.ts`, `atelier-acte2.test.ts` | Mises à jour et nouveaux cas | Modifier |
| `context/GameStateContext.tsx` | `production` | Modifier |
| `components/Hud.tsx` | Colonne Usagers | Modifier |
| `components/direction/ReleveProduction.tsx` | Relevé « Production du service » | Créer |
| `components/direction/EcranDirection.tsx` | Relevé sous la bulle | Modifier |
| `components/direction/BulleDirection.tsx` | Demande d'une personne ou anonyme, fiche « Délivrée », sans pointe | Modifier |
| `components/direction/FichePosteDirection.tsx` | Pictogrammes des cinq lignes | Modifier |
| `components/atelier/BilanProcedure.tsx`, `components/atelier/EcranAtelier.tsx` | Demandes et délivrés en tête ; relevé au pied | Modifier |
| `specs/009-acte2-direction/spec.md`, `CLAUDE.md` | Mesures du robot, documentation | Modifier |

Toutes les commandes se lancent depuis la racine du worktree. Avant de commencer : `npm test` doit passer (`ℹ pass 164`). Un fichier de test seul : `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/<fichier>.test.ts`.

---

### Task 1: Stock des dossiers qui poursuivent, compteurs de production, sauvegarde

**Files:**
- Modify: `types/acte2.ts` (`StatsActe2`, `EtatActe2`)
- Modify: `data/acte2/moteur.ts` (`parProcNul`, `etatInitialActe2`, `restaurerMemoire`)
- Modify: `data/acte2/procedures.ts` (`appliquerAction`)
- Modify: `data/save.ts` (`normaliserSauvegarde`)
- Modify: `data/presets.ts` (préréglages `achats` et `boucle`)
- Create: `scripts/tests/production-acte2.test.ts`

**Interfaces:**
- Consumes: `EtatActe2`, `StatsActe2`, `Stocks`, `ProcId` (`types/acte2.ts`) ; `stocksPour`, `abandonsProcNuls`, `restaurerMemoire`, `getModifiers2`, `entrerActe2` (`data/acte2/moteur.ts`) ; `appliquerAction` ; `normaliserSauvegarde`, `estSauvegardeValide` ; `PRESETS`, `sauvegardePreset`.
- Produces: `EtatActe2.suites: Stocks` ; `StatsActe2.delivresUsagers: Record<ProcId, number>`, `StatsActe2.delivresService: Record<ProcId, number>` ; `parProcNul(): Record<ProcId, number>` ; helpers de test `base2`, `x`, `ZERO` dans `scripts/tests/production-acte2.test.ts`.

- [ ] **Step 1: Écrire le test (il échoue)**

`scripts/tests/production-acte2.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import { appliquerAction } from '../../data/acte2/procedures';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import { PRESETS, sauvegardePreset } from '../../data/presets';
import type { GameState } from '../../types/game';
import type { EtatActe2, ProcId } from '../../types/acte2';

/** Entrée dans l'acte II à t = 0, budget et formulaires illimités. */
function base2(): GameState {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  return { ...s, budget: 1e9, formulaires: 1e9 };
}

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

const ZERO = { identite: 0, domicile: 0, hebergement: 0, vie: 0 };

test('entrée dans l’acte II : aucun document délivré, aucun dossier qui poursuit sa procédure', () => {
  const y = x(base2());
  assert.deepEqual(y.suites, D.stocksPour(y.procedures));
  assert.deepEqual(y.stats.delivresUsagers, ZERO);
  assert.deepEqual(y.stats.delivresService, ZERO);
});

test('sauvegarde antérieure : compteurs de production à zéro, dossiers qui poursuivent recréés', () => {
  const s = base2();
  const { delivresUsagers: _u, delivresService: _s, ...stats } = x(s).stats;
  const { suites: _c, ...reste } = x(s);
  const ancien = { ...s, acte2: { ...reste, stats } } as unknown as GameState;
  assert.equal(estSauvegardeValide(ancien), true);
  const n = x(normaliserSauvegarde(ancien));
  assert.deepEqual(n.suites, D.stocksPour(n.procedures));
  assert.deepEqual(n.stats.delivresUsagers, ZERO);
  assert.deepEqual(n.stats.delivresService, ZERO);
  // Des compteurs d'une autre longueur que la procédure sont recréés.
  const tordu = {
    ...s,
    acte2: { ...x(s), suites: { ...x(s).suites, identite: [1] } },
  } as GameState;
  assert.deepEqual(x(normaliserSauvegarde(tordu)).suites.identite, [0, 0]);
});

test('Atelier : les dossiers qui poursuivent leur procédure suivent les étapes ajoutées et retirées', () => {
  const a0 = x(base2());
  const a = { ...a0, suites: { ...a0.suites, identite: [1, 2] } };
  const ajout = appliquerAction(
    a,
    { type: 'ajouter', p: 'identite', etape: 'visa' },
    ['visa'],
    ['identite'],
  );
  assert.deepEqual(ajout.suites.identite, [1, 2, 0]);
  const retrait = appliquerAction(
    a,
    { type: 'retirer', p: 'identite', k: 1 },
    [],
    ['identite'],
  );
  assert.deepEqual(retrait.suites.identite, [3]);
});

test('Mémoire des services : les dossiers qui poursuivent sont rangés sur les procédures restaurées', () => {
  const s0 = base2();
  const memoire = {
    ...x(s0).procedures,
    identite: [{ type: 'piece' }, { type: 'visa' }, { type: 'visa' }],
  } as EtatActe2['procedures'];
  const s = {
    ...s0,
    reformes: { ...s0.reformes, procedures: memoire, jurisprudence: ['memoire'] },
  } as GameState;
  const y = { ...x(s), suites: { ...x(s).suites, identite: [2, 3] } };
  const m = { ...D.getModifiers2(s, 0), atelierVisible: true };
  assert.deepEqual(D.restaurerMemoire(s, y, m).suites.identite, [2, 3, 0]);
});

test('préréglages : un compteur de dossiers qui poursuivent par étape de chaque procédure', () => {
  const T = 1_000_000_000;
  for (const p of PRESETS) {
    const s = sauvegardePreset(p, T);
    assert.equal(estSauvegardeValide(s), true, p);
    if (s.acte !== 2) continue;
    for (const [q, etapes] of Object.entries(x(s).procedures))
      assert.equal(x(s).suites[q as ProcId].length, etapes.length, `${p} ${q}`);
  }
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/production-acte2.test.ts`
Expected: FAIL — `y.suites` vaut `undefined` (« Expected values to be strictly deep-equal »), `TypeError: Cannot read properties of undefined (reading 'identite')` pour l'Atelier, la Mémoire et les préréglages.

- [ ] **Step 3: Les types**

Dans `types/acte2.ts`, remplacer :

```ts
  /** Usagers perdus (patience ou rejet) dans chaque procédure. */
  abandonsProc: Record<ProcId, number>;
  taps: number;
```

par :

```ts
  /** Usagers perdus (patience ou rejet) dans chaque procédure. */
  abandonsProc: Record<ProcId, number>;
  /** Documents délivrés à des usagers, par procédure. */
  delivresUsagers: Record<ProcId, number>;
  /** Documents délivrés pour les dossiers du service (pièces de service, dossiers sans usager), par procédure. */
  delivresService: Record<ProcId, number>;
  taps: number;
```

et remplacer :

```ts
  /** Dossiers en boucle, sans usager. */
  boucles: Stocks;
```

par :

```ts
  /** Dossiers en boucle, sans usager : chacun dépose sa demande liée à chaque pièce de service. */
  boucles: Stocks;
  /**
   * Dossiers sans usager qui ont déposé leur demande liée et poursuivent leur procédure jusqu'à la délivrance
   * (ils ne déposent plus rien ; rejetés, ils reprennent en tête de leur procédure).
   */
  suites: Stocks;
```

- [ ] **Step 4: Le moteur**

Dans `data/acte2/moteur.ts`, remplacer :

```ts
/** Abandons par procédure, à zéro. */
export function abandonsProcNuls(): Record<ProcId, number> {
  return { identite: 0, domicile: 0, hebergement: 0, vie: 0 };
}
```

par :

```ts
/** Abandons par procédure, à zéro. */
export function abandonsProcNuls(): Record<ProcId, number> {
  return { identite: 0, domicile: 0, hebergement: 0, vie: 0 };
}

/** Compteur par procédure à zéro (documents délivrés). */
export const parProcNul = (): Record<ProcId, number> => abandonsProcNuls();
```

remplacer (dans `etatInitialActe2`) :

```ts
    boucles: stocksPour(procedures),
    population: BALANCE2.populationInitiale,
```

par :

```ts
    boucles: stocksPour(procedures),
    suites: stocksPour(procedures),
    population: BALANCE2.populationInitiale,
```

remplacer :

```ts
      abandonsProc: abandonsProcNuls(),
      taps: 0,
```

par :

```ts
      abandonsProc: abandonsProcNuls(),
      delivresUsagers: parProcNul(),
      delivresService: parProcNul(),
      taps: 0,
```

et remplacer (dans `restaurerMemoire`) :

```ts
    boucles: ranger(x.boucles),
    memoireRestauree: true,
```

par :

```ts
    boucles: ranger(x.boucles),
    suites: ranger(x.suites),
    memoireRestauree: true,
```

- [ ] **Step 5: L'Atelier**

Dans `data/acte2/procedures.ts` (`appliquerAction`), remplacer :

```ts
  const b = [...x.boucles[a.p]];
  switch (a.type) {
```

par :

```ts
  const b = [...x.boucles[a.p]];
  const c = [...x.suites[a.p]];
  switch (a.type) {
```

remplacer :

```ts
      u.push(0);
      b.push(0);
      break;
```

par :

```ts
      u.push(0);
      b.push(0);
      c.push(0);
      break;
```

remplacer :

```ts
      const [rb] = b.splice(a.k, 1);
      const cible = Math.min(a.k, etapes.length - 1);
      u[cible] += ru;
      b[cible] += rb;
```

par :

```ts
      const [rb] = b.splice(a.k, 1);
      const [rc] = c.splice(a.k, 1);
      const cible = Math.min(a.k, etapes.length - 1);
      u[cible] += ru;
      b[cible] += rb;
      c[cible] += rc;
```

et remplacer :

```ts
    boucles: { ...x.boucles, [a.p]: b },
    premiereModif: x.premiereModif ?? a.p,
```

par :

```ts
    boucles: { ...x.boucles, [a.p]: b },
    suites: { ...x.suites, [a.p]: c },
    premiereModif: x.premiereModif ?? a.p,
```

- [ ] **Step 6: La sauvegarde**

Dans `data/save.ts`, remplacer :

```ts
import { abandonsProcNuls } from './acte2/moteur';
```

par :

```ts
import { abandonsProcNuls, parProcNul, stocksPour } from './acte2/moteur';
```

remplacer :

```ts
/** Les champs de la Réforme qui comptent (les autres sont complétés par normaliserSauvegarde). */
```

par :

```ts
/** Les dossiers qui poursuivent leur procédure (specs/011) : un compteur par étape, sinon à recréer. */
function suitesValides(x: Partial<EtatActe2> & EtatActe2): boolean {
  const st = x.suites;
  return (
    typeof st === 'object' &&
    st !== null &&
    PROCS.every(
      (p) =>
        Array.isArray(st[p]) &&
        st[p].length === x.procedures[p].length &&
        st[p].every(estNombre),
    )
  );
}

/** Les champs de la Réforme qui comptent (les autres sont complétés par normaliserSauvegarde). */
```

remplacer :

```ts
 * du chef de service (refermée, aucune ligne lue : la pastille d'Options invite à la lire), le Service des
 * achats (en service) et les abandons par procédure (inconnus : zéro).
 */
```

par :

```ts
 * du chef de service (refermée, aucune ligne lue : la pastille d'Options invite à la lire), le Service des
 * achats (en service), les abandons par procédure (inconnus : zéro) et, depuis specs/011, les dossiers qui
 * poursuivent leur procédure (aucun) et les documents délivrés (zéro).
 */
```

et remplacer :

```ts
        stats: { ...x.stats, abandonsProc: x.stats.abandonsProc ?? abandonsProcNuls() },
```

par :

```ts
        suites: suitesValides(x) ? x.suites : stocksPour(x.procedures),
        stats: {
          ...x.stats,
          abandonsProc: x.stats.abandonsProc ?? abandonsProcNuls(),
          delivresUsagers: x.stats.delivresUsagers ?? parProcNul(),
          delivresService: x.stats.delivresService ?? parProcNul(),
        },
```

`acte2Valide` ne change pas : une sauvegarde sans `suites` reste valide, `normaliserSauvegarde` la complète.

- [ ] **Step 7: Les préréglages qui remplacent des procédures**

Dans `data/presets.ts` (préréglage `achats`), remplacer :

```ts
      boucles: D.stocksPour(procedures),
      guichets: 9,
```

par :

```ts
      boucles: D.stocksPour(procedures),
      suites: D.stocksPour(procedures),
      guichets: 9,
```

et (préréglages `boucle`, `demat`, `fin`, `reforme`) remplacer :

```ts
        domicile: [12, 6],
      }),
      guichets: 8,
```

par :

```ts
        domicile: [12, 6],
      }),
      suites: D.stocksPour(procedures),
      guichets: 8,
```

- [ ] **Step 8: Vérifier**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/production-acte2.test.ts && npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p .`
Expected: `ℹ pass 5` pour le fichier ; `ℹ pass 169`, `ℹ fail 0` pour la suite ; tsc sans erreur.

- [ ] **Step 9: Commiter**

```bash
git add types/acte2.ts data/acte2/moteur.ts data/acte2/procedures.ts data/save.ts data/presets.ts scripts/tests/production-acte2.test.ts
git commit -m "feat(logic): dossiers qui poursuivent leur procédure et compteurs de production de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Seule la carte est demandée ; la pièce de service dépose sa demande et poursuit ; documents délivrés

**Files:**
- Modify: `constants/balanceActe2.ts` (`PROCS_DEMANDEES`)
- Modify: `data/acte2/moteur.ts` (`dossiersDuService`, `usagersAvecDemarche`, `visasEnAttente`, `Lot`, `franchir`, `tick2`, `tamponner2`)
- Modify: `data/acte2/vues.ts` (`visasDe`, `tableauCirculation`)
- Modify: `data/acte2/vueAtelier.ts` (`enCours`)
- Modify: `scripts/tests/acte2.test.ts` (fixture du test de conservation)
- Modify: `scripts/tests/production-acte2.test.ts`

**Interfaces:**
- Consumes: `EtatActe2.suites`, `StatsActe2.delivresUsagers` / `delivresService` (Tâche 1) ; `estBoucle` (`procedures.ts`) ; `partRejetee`.
- Produces: `PROCS_DEMANDEES: ProcId[]` (`['identite']`) ; `dossiersDuService(x): number` (boucles + suites) ; `usagersAvecDemarche(x): number` (dossiers d'usagers des procédures demandées) ; dans `franchir` : les trois stocks franchissent ; un document remis à l'usager dans une procédure demandée est compté dans `delivresUsagers`, tout autre document délivré dans `delivresService` ; à une pièce de service, la demande liée est déposée et le dossier poursuit sa procédure dans `suites` (sans plus rien déposer) ; `tick2` ne crée de demandes que dans `PROCS_DEMANDEES` ; helpers de test `avec2`, `avecNotes`, `avecProcedures`, `avancer`, `proche`, `PS`, `BOUCLE`, `sansDemande`.

**La règle (spec 011 § 8), et pourquoi le stock en boucle reste borné :** à une pièce de service, un dossier dépose sa demande liée dans la procédure exigée **et** poursuit sa propre procédure. Le dossier qui poursuit passe dans `suites` : il ne dépose plus jamais rien (même rejeté et repris en tête), et il sort à la délivrance. Ainsi chaque dossier de `boucles` qui franchit une pièce de service en crée exactement un dans `boucles` (la demande liée) et en devient un dans `suites` : `boucles` est conservé à l'unité près (test existant « sans nouvel usager, les dossiers en boucle circulent sans se multiplier » inchangé à 1e-6 près), `suites` ne contient que des dossiers en route vers leur délivrance (borné par le flux × le temps qui reste, et par 1 / (1 − taux de rejet) passages). Un usager qui atteint une pièce de service en boucle est renvoyé chez lui et laisse **un seul** dossier dans `boucles` (spec 009) ; son propre dossier poursuit sans lui, dans `suites`, et sa carte est délivrée au service.

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/production-acte2.test.ts`, remplacer :

```ts
import { PRESETS, sauvegardePreset } from '../../data/presets';
import type { GameState } from '../../types/game';
import type { EtatActe2, ProcId } from '../../types/acte2';
```

par :

```ts
import { PRESETS, sauvegardePreset } from '../../data/presets';
import { BALANCE2 } from '../../constants/balanceActe2';
import type { GameState } from '../../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId } from '../../types/acte2';
```

puis ajouter à la fin du fichier :

```ts

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

/** Notes de l'acte II en vigueur depuis t = 0. */
function avecNotes(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

/** Remplace des procédures ; leurs stocks repartent à zéro (usagers, en boucle, qui poursuivent). */
function avecProcedures(
  s: GameState,
  procedures: Partial<Record<ProcId, Etape[]>>,
): GameState {
  const toutes = { ...x(s).procedures, ...procedures };
  return avec2(s, {
    procedures: toutes,
    usagers: D.stocksPour(toutes),
    boucles: D.stocksPour(toutes),
    suites: D.stocksPour(toutes),
  });
}

/** `secondes` de jeu par pas de 0,1 s depuis t = 0. */
function avancer(s0: GameState, secondes: number): GameState {
  let s = s0;
  for (let i = 1; i <= secondes * 10; i++) s = D.tick2(s, 0.1, i * 100).s;
  return s;
}

const proche = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

const PS = (exige: ProcId): Etape => ({ type: 'pieceService', exige });

/** Boucle Carte d'identité ⇄ Justificatif de domicile ; le visa de la carte vient après sa pièce de service. */
const BOUCLE: Partial<Record<ProcId, Etape[]>> = {
  identite: [{ type: 'piece' }, PS('domicile'), { type: 'visa' }],
  domicile: [{ type: 'piece' }, PS('identite')],
};

/** Toute la population garée dans une procédure fermée : aucune demande, ni installation ni exode. */
function sansDemande(s: GameState): GameState {
  return avec2(s, {
    population: BALANCE2.populationMax,
    usagers: { ...x(s).usagers, vie: [BALANCE2.populationMax] },
  });
}

test('seule la Carte d’identité reçoit des demandes : le Justificatif attend qu’on l’exige', () => {
  const s = D.tick2(avecNotes(base2(), ['atelier']), 1, 1000).s;
  assert.equal(x(s).usagers.domicile[0], 0);
  assert.ok(x(s).usagers.identite[0] > BALANCE2.fileInitiale - 0.5);
});

test('un visa délivre la carte à l’usager ; un justificatif est délivré au service', () => {
  const jamais = () => 0.999;
  let s = avecProcedures(avecNotes(base2(), ['atelier']), {
    identite: [{ type: 'visa' }],
    domicile: [{ type: 'visa' }],
  });
  s = avec2(s, { usagers: { ...x(s).usagers, identite: [5] } });
  const carte = D.tamponner2(s, 0, jamais).s;
  // 4 % des usagers abandonnent au visa ; les autres repartent avec leur carte.
  proche(x(carte).stats.delivresUsagers.identite, 1 - BALANCE2.abandonParPoint);
  assert.equal(x(carte).stats.delivresService.identite, 0);
  // Un dossier d'usager dans une procédure que personne ne demande : un dossier lié, délivré au service.
  s = avec2(s, { usagers: { ...x(s).usagers, identite: [0], domicile: [5] } });
  const justificatif = D.tamponner2(s, 0, jamais).s;
  proche(x(justificatif).stats.delivresService.domicile, 1 - BALANCE2.abandonParPoint);
  assert.equal(x(justificatif).stats.delivresUsagers.domicile, 0);
});

test('simple dépendance : la carte est remise à l’usager, le justificatif délivré au service', () => {
  let s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), {
    identite: [PS('domicile')],
    domicile: [{ type: 'piece' }],
  });
  s = avec2(s, {
    guichets: 100,
    population: 10,
    usagers: { ...x(s).usagers, identite: [10] },
  });
  s = avancer(s, 60);
  const st = x(s).stats;
  assert.ok(st.delivresUsagers.identite > 8, `${st.delivresUsagers.identite}`);
  assert.ok(st.delivresService.domicile > 8, `${st.delivresService.domicile}`);
  assert.equal(st.delivresService.identite, 0);
  assert.equal(st.delivresUsagers.domicile, 0);
  assert.equal(x(s).premiereBoucle, null);
});

test('après la boucle, la demande liée tourne et le dossier poursuit jusqu’au visa, où sa carte est délivrée', () => {
  let s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), BOUCLE);
  s = sansDemande(
    avec2(s, {
      guichets: 100,
      agents: { instructeur: 100, chefBureau: 0, sousDirecteur: 0 },
      boucles: { ...x(s).boucles, identite: [20, 0, 0] },
    }),
  );
  s = avancer(s, 300);
  // Le nombre de dossiers en boucle ne bouge pas : chacun dépose une demande et poursuit sans en redéposer.
  proche(D.dossiersEnBoucle(x(s)), 20);
  const st = x(s).stats;
  assert.ok(st.delivresService.identite > 100, `${st.delivresService.identite}`);
  assert.ok(st.delivresService.domicile > 100, `${st.delivresService.domicile}`);
  assert.equal(st.delivresUsagers.identite, 0);
  // Ceux qui poursuivent ne s'accumulent pas : ils sortent à la délivrance.
  assert.ok(D.sommeStocks(x(s).suites) < 20, `${D.sommeStocks(x(s).suites)}`);
  assert.ok(D.visasEnAttente(x(s)) > 0, 'le visa reste alimenté');
  proche(D.dossiersDuService(x(s)), 20 + D.sommeStocks(x(s).suites));
});

test('rejetés, les dossiers qui poursuivent reprennent en tête sans redéposer de demande', () => {
  let s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), BOUCLE);
  s = sansDemande(
    avec2(s, {
      guichets: 100,
      tauxRejet: 0.5,
      agents: { instructeur: 100, chefBureau: 0, sousDirecteur: 0 },
      boucles: { ...x(s).boucles, identite: [20, 0, 0] },
    }),
  );
  s = avancer(s, 600);
  proche(D.dossiersEnBoucle(x(s)), 20);
  assert.ok(D.sommeStocks(x(s).suites) < 60, `${D.sommeStocks(x(s).suites)}`);
  assert.ok(x(s).stats.franchiesBoucle > 1000);
});

test('un usager qui atteint la pièce de service en boucle est renvoyé chez lui ; son dossier poursuit sans lui', () => {
  let s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), BOUCLE);
  s = sansDemande(
    avec2(s, {
      guichets: 100,
      agents: { instructeur: 100, chefBureau: 0, sousDirecteur: 0 },
    }),
  );
  s = avec2(s, { usagers: { ...x(s).usagers, identite: [0, 10, 0] } });
  s = avancer(s, 120);
  assert.ok(x(s).premiereBoucle !== null);
  // Un seul dossier en boucle par usager renvoyé chez lui (spec 009).
  proche(D.dossiersEnBoucle(x(s)), x(s).stats.abandonsDemarche);
  assert.ok(D.usagersAvecDemarche(x(s)) < 1e-6);
  // Sa carte est délivrée quand même, au service.
  assert.ok(x(s).stats.delivresService.identite > 9, `${x(s).stats.delivresService.identite}`);
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/production-acte2.test.ts`
Expected: FAIL — `x(s).usagers.domicile[0]` n'est pas nul (≈ 1,4 : la moitié des demandes), `delivresUsagers.identite` reste à 0, `D.dossiersDuService is not a function`, `D.usagersAvecDemarche is not a function` ; les cinq tests de la Tâche 1 passent.

- [ ] **Step 3: Les procédures demandées**

Dans `constants/balanceActe2.ts`, remplacer :

```ts
/** Procédures à l'entrée dans l'acte : la Carte d'identité est imposée par le S.I.C. */
```

par :

```ts
/**
 * Procédures que les usagers demandent d'eux-mêmes (specs/011) : les autres ne se remplissent que lorsqu'une
 * pièce de service exige leur document. Leurs documents sont remis aux usagers.
 */
export const PROCS_DEMANDEES: ProcId[] = ['identite'];

/** Procédures à l'entrée dans l'acte : la Carte d'identité est imposée par le S.I.C. */
```

- [ ] **Step 4: Le moteur**

Dans `data/acte2/moteur.ts`, remplacer :

```ts
  PROCEDURES_INITIALES,
  REFORME,
} from '../../constants/balanceActe2';
```

par :

```ts
  PROCEDURES_INITIALES,
  PROCS_DEMANDEES,
  REFORME,
} from '../../constants/balanceActe2';
```

remplacer :

```ts
export const dossiersEnBoucle = (x: EtatActe2): number =>
  sommeStocks(x.boucles);
```

par :

```ts
export const dossiersEnBoucle = (x: EtatActe2): number =>
  sommeStocks(x.boucles);
/** Dossiers sans usager : en boucle, et ceux qui poursuivent leur procédure après avoir déposé leur pièce. */
export const dossiersDuService = (x: EtatActe2): number =>
  sommeStocks(x.boucles) + sommeStocks(x.suites);

/**
 * Usagers qui ont une démarche en cours : leurs dossiers dans les procédures qu'ils demandent. Un dossier lié
 * (déposé par une pièce de service dans une autre procédure) appartient à un usager déjà compté.
 */
export function usagersAvecDemarche(x: EtatActe2): number {
  let t = 0;
  for (const p of PROCS_DEMANDEES) for (const v of x.usagers[p]) t += v;
  return t;
}
```

remplacer (dans `visasEnAttente`) :

```ts
      if (e.type === 'visa') t += x.usagers[p][k] + x.boucles[p][k];
```

par :

```ts
      if (e.type === 'visa')
        t += x.usagers[p][k] + x.boucles[p][k] + x.suites[p][k];
```

remplacer :

```ts
/** Dossiers d'une étape qui la franchissent : `u` d'usagers, `b` en boucle. */
interface Lot {
  p: ProcId;
  k: number;
  u: number;
  b: number;
}
```

par :

```ts
/** Dossiers d'une étape qui la franchissent : `u` d'usagers, `b` en boucle, `c` qui poursuivent leur procédure. */
interface Lot {
  p: ProcId;
  k: number;
  u: number;
  b: number;
  c: number;
}
```

Dans `franchir`, remplacer :

```ts
  for (const l of lots) total += l.u + l.b;
```

par :

```ts
  for (const l of lots) total += l.u + l.b + l.c;
```

remplacer :

```ts
  const boucles = copieStocks(x0.boucles);
  let budget = 0;
```

par :

```ts
  const boucles = copieStocks(x0.boucles);
  const suites = copieStocks(x0.suites);
  const delivresUsagers = { ...x0.stats.delivresUsagers };
  const delivresService = { ...x0.stats.delivresService };
  let budget = 0;
```

remplacer :

```ts
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
```

par :

```ts
    const u0 = l.u * ratio;
    const b0 = l.b * ratio;
    const c0 = l.c * ratio;
    if (u0 + b0 + c0 <= 0) continue;
    const etapes = x0.procedures[l.p];
    const e = etapes[l.k];
    const def = ETAPES[e.type];
    usagers[l.p][l.k] -= u0;
    boucles[l.p][l.k] -= b0;
    suites[l.p][l.k] -= c0;
    // Tout dossier sans usager compte pour la dématérialisation, qu'il tourne en boucle ou poursuive sa procédure.
    const sans = b0 + c0;
    franchies += u0 + sans;
    franchiesBoucle += sans;
    budget += (u0 + sans) * dot * def.dotation;
    conf += (u0 + sans) * def.conf * ex.conf;
    if (e.type === 'visa') ev.visas += u0 + sans;
```

remplacer :

```ts
    let u = u0 - ab;
    let b = b0;

    // Pièce délivrée par nos services : un dossier lié est déposé dans la procédure exigée.
    // Un dossier en boucle n'est pas dupliqué : il passe dans la procédure exigée.
    if (
      e.type === 'pieceService' &&
      e.exige !== undefined &&
      m.procsOuvertes.includes(e.exige)
    ) {
      if (estBoucle(x0.procedures, m.procsOuvertes, l.p, e.exige)) {
        // La chaîne ne peut plus aboutir : l'usager est renvoyé chez lui, le dossier continue sans lui.
        abandonsDemarche += u;
        boucles[e.exige][0] += b + u;
        if (b + u > 0 && premiereBoucle === null) premiereBoucle = maintenant;
        // Le dossier part dans la procédure exigée : il ne poursuit pas la sienne (un seul dossier par usager).
        b = 0;
        u = 0;
      } else {
        usagers[e.exige][0] += u;
        boucles[e.exige][0] += b;
        b = 0;
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
    abandonsProc[l.p] += abRejet;
    usagers[l.p][0] += rejU - abRejet;
    boucles[l.p][0] += rejB;
  }
```

par :

```ts
    let u = u0 - ab;
    let b = b0;
    let c = c0;

    // Pièce délivrée par nos services : la demande liée est déposée dans la procédure exigée, et le dossier
    // poursuit sa propre procédure jusqu'à la délivrance. Un dossier qui a déjà déposé sa pièce (`c`) ne dépose
    // plus rien : le nombre de dossiers en boucle reste celui des usagers entrés dans le circuit.
    if (
      e.type === 'pieceService' &&
      e.exige !== undefined &&
      m.procsOuvertes.includes(e.exige)
    ) {
      if (estBoucle(x0.procedures, m.procsOuvertes, l.p, e.exige)) {
        // La chaîne ne peut plus aboutir : l'usager est renvoyé chez lui, sa demande tourne sans lui.
        abandonsDemarche += u;
        boucles[e.exige][0] += b + u;
        if (b + u > 0 && premiereBoucle === null) premiereBoucle = maintenant;
        c += b + u;
        b = 0;
        u = 0;
      } else {
        // Simple dépendance : l'usager suit les deux démarches ; un dossier en boucle passe sa demande.
        usagers[e.exige][0] += u;
        boucles[e.exige][0] += b;
        c += b;
        b = 0;
      }
    }

    if (l.k + 1 < etapes.length) {
      usagers[l.p][l.k + 1] += u;
      boucles[l.p][l.k + 1] += b;
      suites[l.p][l.k + 1] += c;
      continue;
    }

    // Fin de procédure : rejet. Sans usager, le rejet ne coûte rien (le dossier reprend en tête).
    const part = alea ? partRejetee(u + b + c, taux, alea) : taux;
    const rejU = u * part;
    const rejB = b * part;
    const rejC = c * part;
    budget += (rejU + rejB + rejC) * dot * m.primeRejet;
    conf += (rejU + rejB + rejC) * BALANCE2.confParRejet;
    const abRejet = rejU * BALANCE2.abandonRejet;
    population -= abRejet;
    abandons += abRejet;
    abandonsProc[l.p] += abRejet;
    usagers[l.p][0] += rejU - abRejet;
    boucles[l.p][0] += rejB;
    suites[l.p][0] += rejC;
    // Délivrance : remis à l'usager dans une procédure qu'il demande, sinon délivré pour un dossier du service.
    const livresU = u - rejU;
    const livresS = b - rejB + c - rejC;
    if (PROCS_DEMANDEES.includes(l.p)) delivresUsagers[l.p] += livresU;
    else delivresService[l.p] += livresU;
    delivresService[l.p] += livresS;
  }
```

remplacer :

```ts
    usagers: nettoyer(usagers),
    boucles: nettoyer(boucles),
    population: Math.max(0, population),
```

par :

```ts
    usagers: nettoyer(usagers),
    boucles: nettoyer(boucles),
    suites: nettoyer(suites),
    population: Math.max(0, population),
```

et remplacer :

```ts
      abandonsDemarche,
      abandonsProc,
    },
```

par :

```ts
      abandonsDemarche,
      abandonsProc,
      delivresUsagers,
      delivresService,
    },
```

Dans `tick2`, remplacer :

```ts
  // Nouvelles demandes des usagers inactifs, réparties entre les procédures ouvertes.
  const usagers = copieStocks(x0.usagers);
  const inactifs = Math.max(0, x0.population - sommeStocks(usagers));
  const nouvelles = inactifs * (1 - Math.exp(-BALANCE2.demandeRate * dt));
  for (const p of m.procsOuvertes)
    usagers[p][0] += nouvelles / m.procsOuvertes.length;
```

par :

```ts
  // Nouvelles demandes des usagers inactifs, seulement dans les procédures qu'ils demandent (specs/011).
  const usagers = copieStocks(x0.usagers);
  const inactifs = Math.max(0, x0.population - sommeStocks(usagers));
  const nouvelles = inactifs * (1 - Math.exp(-BALANCE2.demandeRate * dt));
  const demandees = PROCS_DEMANDEES.filter((p) => m.procsOuvertes.includes(p));
  for (const p of demandees) usagers[p][0] += nouvelles / demandees.length;
```

remplacer :

```ts
      const f = 1 - Math.exp(-dt / ETAPES[e.type].delai);
      const lot = { p, k, u: x.usagers[p][k] * f, b: x.boucles[p][k] * f };
      if (e.type === 'visa') {
        visa.push(lot);
        totalV += lot.u + lot.b;
      } else {
        guichet.push(lot);
        totalG += lot.u + lot.b;
      }
```

par :

```ts
      const f = 1 - Math.exp(-dt / ETAPES[e.type].delai);
      const lot = {
        p,
        k,
        u: x.usagers[p][k] * f,
        b: x.boucles[p][k] * f,
        c: x.suites[p][k] * f,
      };
      if (e.type === 'visa') {
        visa.push(lot);
        totalV += lot.u + lot.b + lot.c;
      } else {
        guichet.push(lot);
        totalG += lot.u + lot.b + lot.c;
      }
```

et remplacer :

```ts
    ...guichet.map((l) => ({ ...l, u: l.u * rG, b: l.b * rG })),
    ...visa.map((l) => ({ ...l, u: l.u * rV, b: l.b * rV })),
```

par :

```ts
    ...guichet.map((l) => ({ ...l, u: l.u * rG, b: l.b * rG, c: l.c * rG })),
    ...visa.map((l) => ({ ...l, u: l.u * rV, b: l.b * rV, c: l.c * rV })),
```

Dans `tamponner2`, remplacer :

```ts
      if (e.type !== 'visa') return;
      lots.push({ p, k, u: x0.usagers[p][k], b: x0.boucles[p][k] });
      total += x0.usagers[p][k] + x0.boucles[p][k];
```

par :

```ts
      if (e.type !== 'visa') return;
      const l = {
        p,
        k,
        u: x0.usagers[p][k],
        b: x0.boucles[p][k],
        c: x0.suites[p][k],
      };
      lots.push(l);
      total += l.u + l.b + l.c;
```

et remplacer :

```ts
    lots.map((l) => ({ ...l, u: l.u * part, b: l.b * part })),
```

par :

```ts
    lots.map((l) => ({ ...l, u: l.u * part, b: l.b * part, c: l.c * part })),
```

- [ ] **Step 5: Les vues comptent aussi les dossiers qui poursuivent**

Dans `data/acte2/vues.ts`, remplacer (dans `visasDe`) :

```ts
    u += x.usagers[p][k];
    b += x.boucles[p][k];
```

par :

```ts
    u += x.usagers[p][k];
    b += x.boucles[p][k] + x.suites[p][k];
```

et (dans `tableauCirculation`) remplacer :

```ts
    Math.floor(x.usagers[p][k] + x.boucles[p][k]),
```

par :

```ts
    Math.floor(x.usagers[p][k] + x.boucles[p][k] + x.suites[p][k]),
```

Dans `data/acte2/vueAtelier.ts` (`vueAtelier`, champ `enCours`), remplacer :

```ts
            x.boucles[p].reduce((a, v) => a + v, 0),
```

par :

```ts
            x.boucles[p].reduce((a, v) => a + v, 0) +
            x.suites[p].reduce((a, v) => a + v, 0),
```

- [ ] **Step 6: Le test de conservation remplace aussi le nouveau stock**

Le test existant remplace les procédures sans remplacer `suites` : leurs compteurs doivent avoir la longueur des nouvelles procédures. Dans `scripts/tests/acte2.test.ts` (test « sans nouvel usager, les dossiers en boucle circulent sans se multiplier »), remplacer :

```ts
    boucles: { ...x(s).boucles, identite: [50, 0], domicile: [0, 0] },
  });
```

par :

```ts
    boucles: { ...x(s).boucles, identite: [50, 0], domicile: [0, 0] },
    suites: { ...x(s).suites, identite: [0, 0], domicile: [0, 0] },
  });
```

Son assertion (`proche(D.dossiersEnBoucle(x(s)), 50, 1e-6)`) ne change pas.

- [ ] **Step 7: Vérifier**

Run: `npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p .`
Expected: `ℹ pass 175`, `ℹ fail 0` ; tsc sans erreur.

- [ ] **Step 8: Commiter**

```bash
git add constants/balanceActe2.ts data/acte2/moteur.ts data/acte2/vues.ts data/acte2/vueAtelier.ts scripts/tests/acte2.test.ts scripts/tests/production-acte2.test.ts
git commit -m "feat(logic): seule la carte d'identité est demandée, la pièce de service poursuit sa procédure et les documents délivrés sont comptés

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Les usagers s'impatientent, la ville se vide

**Files:**
- Modify: `constants/balanceActe2.ts` (`BALANCE2.impatience`, `BALANCE2.exode`)
- Modify: `data/acte2/procedures.ts` (`procedureAboutit`, `aboutitPourUsagers`)
- Modify: `data/acte2/moteur.ts` (`tick2`)
- Modify: `scripts/tests/acte2.test.ts`, `scripts/tests/reforme.test.ts`, `scripts/tests/production-acte2.test.ts`

**Interfaces:**
- Consumes: `estBoucle` ; `PROCS_DEMANDEES` (Tâche 2) ; `restaurerMemoire`.
- Produces: `BALANCE2.impatience = 0.002` (part des dossiers d'usagers en cours qui renoncent par seconde) et `BALANCE2.exode = 0.01` (part des habitants sans démarche qui partent par seconde quand plus rien n'aboutit) ; `procedureAboutit(procedures, ouvertes, p): boolean` ; `aboutitPourUsagers(x, ouvertes): boolean` ; dans `tick2` : impatience sur tous les dossiers d'usagers (abandons, `abandonsProc`, population), installations seulement si `aboutitPourUsagers`, sinon exode.

**Pourquoi (spec 011 § 9, mesuré sur une copie du worktree) :** avec les seules Tâches 1 et 2, 10 min après la première boucle le robot a 1 727 usagers en cours, soit 100 % de leur maximum : les dossiers du service occupent les guichets, mais un usager qui attend ne perd aucune patience, et la ville se remplit toujours (installation de 1/60 de la place libre par seconde). L'impatience fait partir ceux qui attendent ; l'exode coupe l'arrivée de nouveaux habitants dès que la carte ne peut plus être remise à personne. Avant la boucle, l'impatience rend aussi l'Atelier lisible : compliquer la carte fait attendre, donc abandonner davantage (mesure prudent / agressif de la Tâche 5).

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/production-acte2.test.ts`, remplacer :

```ts
import { appliquerAction } from '../../data/acte2/procedures';
```

par :

```ts
import {
  aboutitPourUsagers,
  appliquerAction,
  procedureAboutit,
} from '../../data/acte2/procedures';
```

puis ajouter à la fin du fichier :

```ts

test('impatience : chaque seconde d’attente, une part des usagers renonce et quitte la ville', () => {
  let s = avecProcedures(base2(), { identite: [{ type: 'visa' }] });
  s = avec2(s, { population: 100, usagers: { ...x(s).usagers, identite: [100] } });
  const r = D.tick2(s, 1, 1000).s;
  const partis = 100 * (1 - Math.exp(-BALANCE2.impatience));
  proche(x(r).usagers.identite[0], 100 - partis);
  proche(x(r).abandons, partis);
  proche(x(r).stats.abandonsProc.identite, partis);
  // La Carte d'identité aboutit : la ville continue de se peupler.
  proche(
    x(r).population,
    100 - partis + (BALANCE2.populationMax - 100) * BALANCE2.installationRate,
  );
});

test('quand plus aucune démarche n’aboutit, personne ne s’installe et la ville se vide', () => {
  const s0 = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), BOUCLE);
  // Aucun guichet : rien ne franchit d'étape pendant cette seconde.
  const s = avec2(s0, { population: 1000, guichets: 0 });
  assert.equal(aboutitPourUsagers(x(s), ['identite', 'domicile']), false);
  const r = D.tick2(s, 1, 1000).s;
  const nouvelles = 1000 * (1 - Math.exp(-BALANCE2.demandeRate));
  proche(
    x(r).population,
    1000 - (1000 - nouvelles) * (1 - Math.exp(-BALANCE2.exode)),
  );
});

test('une procédure demandée aboutit tant qu’aucune de ses pièces ne ramène à elle', () => {
  const s = avecNotes(base2(), ['atelier', 'pieceService', 'troisieme']);
  const ouvertes: ProcId[] = ['identite', 'domicile', 'hebergement'];
  const simple = avecProcedures(s, { identite: [PS('domicile')] });
  assert.equal(procedureAboutit(x(simple).procedures, ouvertes, 'identite'), true);
  assert.equal(aboutitPourUsagers(x(simple), ouvertes), true);
  const boucle = avecProcedures(s, BOUCLE);
  assert.equal(procedureAboutit(x(boucle).procedures, ouvertes, 'identite'), false);
  assert.equal(aboutitPourUsagers(x(boucle), ouvertes), false);
  // Une boucle entre deux procédures que personne ne demande : la carte aboutit toujours.
  const ailleurs = avecProcedures(s, {
    domicile: [PS('hebergement')],
    hebergement: [PS('domicile')],
  });
  assert.equal(aboutitPourUsagers(x(ailleurs), ouvertes), true);
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/production-acte2.test.ts`
Expected: FAIL — « The requested module '../../data/acte2/procedures' does not provide an export named 'aboutitPourUsagers' » : le fichier échoue au chargement.

- [ ] **Step 3: Les constantes**

Dans `constants/balanceActe2.ts`, remplacer :

```ts
  /** Part des usagers rejetés qui abandonnent (un point de patience sur trois). */
  abandonRejet: 1 / 3,
```

par :

```ts
  /** Part des usagers rejetés qui abandonnent (un point de patience sur trois). */
  abandonRejet: 1 / 3,
  /**
   * Impatience (specs/011) : part des dossiers d'usagers en cours dont l'usager renonce, chaque seconde d'attente
   * (≈ 8 min de patience en moyenne). Il quitte la ville.
   */
  impatience: 0.002,
  /**
   * Exode (specs/011) : quand plus aucune procédure demandée n'aboutit pour les usagers, personne ne s'installe
   * plus et cette part des habitants sans démarche quitte la ville chaque seconde.
   */
  exode: 0.01,
```

- [ ] **Step 4: Une procédure demandée aboutit-elle encore ?**

Dans `data/acte2/procedures.ts`, remplacer :

```ts
import { BALANCE2 } from '../../constants/balanceActe2';
```

par :

```ts
import { BALANCE2, PROCS_DEMANDEES } from '../../constants/balanceActe2';
```

et remplacer :

```ts
const exigenceValide = (
```

par :

```ts
/**
 * Vrai si la procédure `p` peut mener un dossier d'usager jusqu'à la délivrance : aucune de ses pièces de
 * service n'exige une procédure qui y ramène (sinon l'usager est renvoyé chez lui en chemin).
 */
export function procedureAboutit(
  procedures: Record<ProcId, Etape[]>,
  ouvertes: ProcId[],
  p: ProcId,
): boolean {
  return procedures[p].every(
    (e) =>
      e.type !== 'pieceService' ||
      e.exige === undefined ||
      !ouvertes.includes(e.exige) ||
      !estBoucle(procedures, ouvertes, p, e.exige),
  );
}

/** Vrai si une procédure que les usagers demandent peut encore leur délivrer son document. */
export function aboutitPourUsagers(x: EtatActe2, ouvertes: ProcId[]): boolean {
  return PROCS_DEMANDEES.some(
    (p) => ouvertes.includes(p) && procedureAboutit(x.procedures, ouvertes, p),
  );
}

const exigenceValide = (
```

- [ ] **Step 5: Impatience et exode dans `tick2`**

Dans `data/acte2/moteur.ts`, remplacer :

```ts
import { appliquerAction, estBoucle } from './procedures';
```

par :

```ts
import { aboutitPourUsagers, appliquerAction, estBoucle } from './procedures';
```

remplacer :

```ts
  // Nouvelles demandes des usagers inactifs, seulement dans les procédures qu'ils demandent (specs/011).
  const usagers = copieStocks(x0.usagers);
  const inactifs = Math.max(0, x0.population - sommeStocks(usagers));
  const nouvelles = inactifs * (1 - Math.exp(-BALANCE2.demandeRate * dt));
  const demandees = PROCS_DEMANDEES.filter((p) => m.procsOuvertes.includes(p));
  for (const p of demandees) usagers[p][0] += nouvelles / demandees.length;
  const population =
    x0.population +
    Math.max(0, BALANCE2.populationMax - x0.population) *
      BALANCE2.installationRate *
      dt;
```

par :

```ts
  // Impatience (specs/011) : une part des usagers qui attendent renonce et quitte la ville.
  const usagers = copieStocks(x0.usagers);
  const fImpatience = 1 - Math.exp(-BALANCE2.impatience * dt);
  const abandonsProc = { ...x0.stats.abandonsProc };
  let impatients = 0;
  for (const p of PROCS) {
    usagers[p] = usagers[p].map((v) => {
      const ab = v * fImpatience;
      abandonsProc[p] += ab;
      impatients += ab;
      return v - ab;
    });
  }

  // Nouvelles demandes des usagers inactifs, seulement dans les procédures qu'ils demandent (specs/011).
  const inactifs = Math.max(
    0,
    x0.population - impatients - sommeStocks(usagers),
  );
  const nouvelles = inactifs * (1 - Math.exp(-BALANCE2.demandeRate * dt));
  const demandees = PROCS_DEMANDEES.filter((p) => m.procsOuvertes.includes(p));
  for (const p of demandees) usagers[p][0] += nouvelles / demandees.length;

  // La ville se peuple tant que le service délivre aux usagers ; sinon, elle se vide (specs/011).
  const servie = aboutitPourUsagers(x0, m.procsOuvertes);
  const installes = servie
    ? Math.max(0, BALANCE2.populationMax - x0.population) *
      BALANCE2.installationRate *
      dt
    : 0;
  const partis = servie
    ? 0
    : (inactifs - nouvelles) * (1 - Math.exp(-BALANCE2.exode * dt));
  const population = x0.population - impatients + installes - partis;
```

et remplacer :

```ts
    { ...x0, usagers, population, duree: x0.duree + dt },
```

par :

```ts
    {
      ...x0,
      usagers,
      population,
      abandons: x0.abandons + impatients,
      duree: x0.duree + dt,
      stats: { ...x0.stats, abandonsProc },
    },
```

L'impatience et l'exode vivent dans `tick2` : ils jouent aussi pendant une absence (`simulerAbsence2`), comme le reste de la ville.

- [ ] **Step 6: Les tests existants qui supposaient des usagers infiniment patients**

Dans `scripts/tests/acte2.test.ts`, remplacer :

```ts
  proche(x(s).usagers.identite[0], BALANCE2.fileInitiale - 0.5);
  proche(
    x(s).usagers.identite[1],
    BALANCE2.visasInitiaux + 0.5 * (1 - BALANCE2.abandonParPoint),
  );
  proche(s.tampons, 0.5);
```

par :

```ts
  // Une seconde d'attente : une part des usagers renonce (impatience, specs/011).
  const reste = Math.exp(-BALANCE2.impatience);
  proche(x(s).usagers.identite[0], BALANCE2.fileInitiale * reste - 0.5);
  proche(
    x(s).usagers.identite[1],
    BALANCE2.visasInitiaux * reste + 0.5 * (1 - BALANCE2.abandonParPoint),
  );
  proche(s.tampons, 0.5);
```

Dans `scripts/tests/reforme.test.ts`, remplacer :

```ts
  for (let i = 1; i <= 6000; i++) s = D.tick2(s, 0.1, i * 100).s;
  proche(D.dossiersEnBoucle(x(s)), 10 * (1 - BALANCE2.abandonParPoint));
  proche(x(s).stats.abandonsDemarche, 10 * (1 - BALANCE2.abandonParPoint));
});
```

par :

```ts
  for (let i = 1; i <= 6000; i++) s = D.tick2(s, 0.1, i * 100).s;
  // Un dossier en boucle par usager renvoyé chez lui, quoi qu'il arrive ensuite (rejets compris) ; les usagers
  // perdus en chemin (patience, impatience) n'en laissent aucun.
  proche(D.dossiersEnBoucle(x(s)), x(s).stats.abandonsDemarche);
  assert.ok(x(s).stats.abandonsDemarche > 9);
  assert.ok(x(s).stats.abandonsDemarche < 10 * (1 - BALANCE2.abandonParPoint));
});
```

et remplacer :

```ts
  const sans = D.tick2(base, 1, 1000).s;
  const avec = D.tick2(avecJurisprudence(base, ['droitAcquis']), 1, 1000).s;
  assert.ok(x(sans).abandons > 0);
  assert.equal(x(avec).abandons, 0);
});
```

par :

```ts
  const sans = D.tick2(base, 1, 1000).s;
  const avec = D.tick2(avecJurisprudence(base, ['droitAcquis']), 1, 1000).s;
  // La même impatience des deux côtés ; seule la Pièce (0,5 dossier franchi, 1 point) coûte de la patience sans.
  proche(x(sans).abandons - x(avec).abandons, 0.5 * BALANCE2.abandonParPoint);
});
```

- [ ] **Step 7: Vérifier**

Run: `npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p .`
Expected: `ℹ pass 178`, `ℹ fail 0` ; tsc sans erreur.

- [ ] **Step 8: Commiter**

```bash
git add constants/balanceActe2.ts data/acte2/procedures.ts data/acte2/moteur.ts scripts/tests/acte2.test.ts scripts/tests/reforme.test.ts scripts/tests/production-acte2.test.ts
git commit -m "feat(logic): les usagers s'impatientent et la ville se vide quand plus rien n'aboutit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Relevé « Production du service » (logique)

**Files:**
- Create: `data/acte2/production.ts`
- Modify: `data/acte2/vueAtelier.ts` (`bilanProcedure`)
- Modify: `data/jurisprudence.ts` (`NOMS_PROCEDURES` exporté)
- Create: `scripts/tests/releve-acte2.test.ts`

**Interfaces:**
- Consumes: `EtatActe2.suites`, `stats.delivresUsagers` / `delivresService` / `abandonsProc` ; `PROCS_DEMANDEES`, `ETAPES`, `EXEMPLAIRES`, `BALANCE2.dotation` ; `getModifiers2` ; `procedureAboutit` (Tâche 3) ; `EffetAffiche` (type, `vueAtelier.ts`) ; `formatEntier`, `formatEuros`.
- Produces: `interface Document { article; feminin }`, `documentDe(nom): Document` ; `compte(n, singulier, pluriel): string` ; `valeurDocument(x, p, m): number` ; `dossiersEnCours(x, p): number` ; `interface LigneProduction { id; nom; demandes; delivres; demandesMot; delivresMot; demandesTexte; delivresTexte; valeur: EffetAffiche[] | null; versUsagers }` ; `lignesProduction(s, maintenant): LigneProduction[] | null` ; `bilanProcedure` calcule ses euros par `valeurDocument` (même résultat) ; `NOMS_PROCEDURES` exporté.

Le relevé (spec § 1) : une ligne par procédure ouverte ; `demandes` = tous les dossiers en cours dans la procédure (usagers, en boucle, qui poursuivent) ; `delivres` = documents délivrés (aux usagers et au service) ; pour une procédure demandée par les usagers seulement, `valeur` = « +X € la carte » (dotation d'un dossier qui franchit toute la procédure, grade, Jurisprudence et Exemplaires compris : spec § 7) et « K abandons » ; `versUsagers` vrai tant que la procédure est demandée **et** aboutit (aucune pièce de service ne ramène à elle). Les noms des procédures changent à chaque Réforme : chaque nom possible a son document (article, genre) pour les accords « délivrée(s) / délivré(s) », « la carte / le justificatif », « une / un ».

- [ ] **Step 1: Écrire le test (il échoue)**

`scripts/tests/releve-acte2.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as P from '../../data/acte2/production';
import { NOMS_PROCEDURES } from '../../data/jurisprudence';
import { BALANCE2, PROC_NOMS } from '../../constants/balanceActe2';
import { formatEuros } from '../../utils/formatters';
import type { GameState } from '../../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId } from '../../types/acte2';

/** Entrée dans l'acte II à t = 0, au grade de départ (dotation ×1). */
function base2(): GameState {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  return { ...s, budget: 1e9, formulaires: 1e9, tampons: 0 };
}

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

function avecNotes(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

const proche = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

const PS = (exige: ProcId): Etape => ({ type: 'pieceService', exige });

test('relevé « Production du service » : demandes, délivrés, valeur d’une carte et destination', () => {
  const s0 = avecNotes(base2(), ['atelier']);
  const s = avec2(s0, {
    stats: {
      ...x(s0).stats,
      delivresUsagers: { ...x(s0).stats.delivresUsagers, identite: 312.6 },
      abandonsProc: { ...x(s0).stats.abandonsProc, identite: 1.2 },
    },
  });
  const [carte, justificatif] = P.lignesProduction(s, 0) as P.LigneProduction[];
  assert.equal(carte.nom, 'Carte d’identité');
  assert.equal(carte.demandes, BALANCE2.fileInitiale + BALANCE2.visasInitiaux);
  assert.equal(carte.demandesTexte, `${carte.demandes} demandes`);
  assert.equal(carte.delivresTexte, '312 délivrées');
  assert.equal(carte.delivresMot, 'délivrées');
  // Pièce + Visa au grade de départ, ×1.
  assert.deepEqual(carte.valeur, [
    { texte: `+${formatEuros(2 * BALANCE2.dotation)} € la carte`, sens: 'plus' },
    { texte: '1 abandon', sens: 'moins' },
  ]);
  assert.equal(carte.versUsagers, true);
  assert.equal(justificatif.demandesTexte, '0 demande');
  assert.equal(justificatif.delivresTexte, '0 délivré');
  assert.equal(justificatif.valeur, null);
  assert.equal(justificatif.versUsagers, false);
  assert.equal(P.lignesProduction(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0), null);
});

test('relevé : les demandes comptent tous les dossiers en cours, avec ou sans usager', () => {
  const b = avecNotes(base2(), ['atelier']);
  const s = avec2(b, {
    usagers: { ...x(b).usagers, identite: [1, 1] },
    boucles: { ...x(b).boucles, identite: [2, 0] },
    suites: { ...x(b).suites, identite: [0, 3] },
  });
  assert.equal((P.lignesProduction(s, 0) as P.LigneProduction[])[0].demandes, 7);
});

test('relevé : une fois la boucle formée, la carte n’a plus de destination', () => {
  const b = avecNotes(base2(), ['atelier', 'pieceService']);
  const procedures = {
    ...x(b).procedures,
    identite: [{ type: 'piece' }, PS('domicile'), { type: 'visa' }] as Etape[],
    domicile: [{ type: 'piece' }, PS('identite')] as Etape[],
  };
  const s = avec2(b, {
    procedures,
    usagers: D.stocksPour(procedures),
    boucles: D.stocksPour(procedures),
    suites: D.stocksPour(procedures),
  });
  const [carte, justificatif] = P.lignesProduction(s, 0) as P.LigneProduction[];
  assert.equal(carte.versUsagers, false);
  assert.notEqual(carte.valeur, null);
  assert.equal(justificatif.versUsagers, false);
});

test('valeur d’un document : toutes les étapes de la procédure, Exemplaires compris', () => {
  const s = base2();
  const m = D.getModifiers2(s, 0);
  proche(P.valeurDocument(x(s), 'identite', m), 2 * BALANCE2.dotation);
  proche(
    P.valeurDocument({ ...x(s), exemplaires: 2 }, 'identite', m),
    2 * BALANCE2.dotation * 1.6,
  );
});

test('chaque nom de procédure a son document, avec article et genre', () => {
  const noms = [
    ...Object.values(PROC_NOMS),
    ...Object.values(NOMS_PROCEDURES).flat(),
  ];
  for (const nom of noms) {
    const d = P.documentDe(nom);
    assert.notEqual(d.article, 'le document', nom);
    assert.match(d.article, /^(la |le |l’)/, nom);
  }
  assert.deepEqual(P.documentDe('Carte d’identité'), { article: 'la carte', feminin: true });
  assert.deepEqual(P.documentDe('Justificatif de domicile'), {
    article: 'le justificatif',
    feminin: false,
  });
  assert.equal(P.compte(0, 'demande', 'demandes'), '0 demande');
  assert.equal(P.compte(1, 'demande', 'demandes'), '1 demande');
  assert.equal(P.compte(2, 'demande', 'demandes'), '2 demandes');
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/releve-acte2.test.ts`
Expected: FAIL — `Cannot find module '…/data/acte2/production'`.

- [ ] **Step 3: Exporter les noms des procédures**

Dans `data/jurisprudence.ts`, remplacer :

```ts
const NOMS_PROCEDURES: Record<ProcId, string[]> = {
```

par :

```ts
export const NOMS_PROCEDURES: Record<ProcId, string[]> = {
```

- [ ] **Step 4: Le module**

`data/acte2/production.ts` :

```ts
/**
 * Production du service (acte II, specs/011) : ce que chaque procédure délivre, à qui, et ce que rapporte un
 * document. Relevé de l'écran Direction et de l'Atelier. Fonctions pures. Rien ici ne nomme la boucle : un
 * document délivré pour un dossier du service n'a simplement pas de destination.
 */
import type { GameState } from '../../types/game';
import {
  PROCS,
  type EtatActe2,
  type Modifiers2,
  type ProcId,
} from '../../types/acte2';
import {
  BALANCE2,
  ETAPES,
  EXEMPLAIRES,
  PROCS_DEMANDEES,
} from '../../constants/balanceActe2';
import { formatEntier, formatEuros } from '../../utils/formatters';
import { getModifiers2 } from './moteur';
import { procedureAboutit } from './procedures';
import type { EffetAffiche } from './vueAtelier';

/** Le document d'une procédure : son nom court avec article (« la carte ») et son genre (accords). */
export interface Document {
  article: string;
  feminin: boolean;
}

/** Tous les noms que peut prendre une procédure (PROC_NOMS, puis NOMS_PROCEDURES après une Réforme). */
const DOCUMENTS: Record<string, Document> = {
  'Carte d’identité': { article: 'la carte', feminin: true },
  'Démarche d’identification citoyenne': { article: 'la démarche', feminin: true },
  'Parcours d’attestation d’identité': { article: 'le parcours', feminin: false },
  'Titre d’identité simplifié': { article: 'le titre', feminin: false },
  'Justificatif de domicile': { article: 'le justificatif', feminin: false },
  'Attestation de résidence effective': { article: 'l’attestation', feminin: true },
  'Parcours de domiciliation': { article: 'le parcours', feminin: false },
  'Certificat d’adressage citoyen': { article: 'le certificat', feminin: false },
  'Attestation d’hébergement': { article: 'l’attestation', feminin: true },
  'Déclaration de cohabitation': { article: 'la déclaration', feminin: true },
  'Parcours d’accueil résidentiel': { article: 'le parcours', feminin: false },
  'Justificatif de mise à l’abri': { article: 'le justificatif', feminin: false },
  'Certificat de vie': { article: 'le certificat', feminin: false },
  'Attestation d’existence': { article: 'l’attestation', feminin: true },
  'Parcours de maintien en vie administrative': { article: 'le parcours', feminin: false },
  'Justificatif de présence au monde': { article: 'le justificatif', feminin: false },
};

/** Le document d'une procédure d'après son nom (« le document » pour un nom inconnu). */
export function documentDe(nom: string): Document {
  return DOCUMENTS[nom] ?? { article: 'le document', feminin: false };
}

/** Le mot qui suit un nombre : pluriel à partir de 2, comme en français (« 0 demande », « 24 demandes »). */
const mot = (n: number, singulier: string, pluriel: string): string =>
  n >= 2 ? pluriel : singulier;

/** « 0 demande », « 1 demande », « 24 demandes ». */
export function compte(n: number, singulier: string, pluriel: string): string {
  return `${formatEntier(n)} ${mot(n, singulier, pluriel)}`;
}

/** Valeur d'un document délivré : dotation d'un dossier qui franchit toute la procédure `p` (€). */
export function valeurDocument(x: EtatActe2, p: ProcId, m: Modifiers2): number {
  const dot =
    BALANCE2.dotation * m.dotationMult * EXEMPLAIRES[x.exemplaires].dotation;
  let euros = 0;
  for (const e of x.procedures[p]) euros += dot * ETAPES[e.type].dotation;
  return euros;
}

/** Dossiers en cours dans une procédure : usagers, en boucle, et ceux qui poursuivent leur procédure. */
export function dossiersEnCours(x: EtatActe2, p: ProcId): number {
  let t = 0;
  for (const st of [x.usagers, x.boucles, x.suites]) for (const v of st[p]) t += v;
  return t;
}

export interface LigneProduction {
  id: ProcId;
  nom: string;
  demandes: number;
  delivres: number;
  /** « demandes » : le mot qui suit le nombre. */
  demandesMot: string;
  /** « délivrées » (accordé au document de la procédure). */
  delivresMot: string;
  /** « 24 demandes » */
  demandesTexte: string;
  /** « 312 délivrées » */
  delivresTexte: string;
  /**
   * Procédure que les usagers demandent : valeur d'un document (« +4,48 € la carte ») et usagers perdus
   * (« 12 abandons »), symbole + mot comme les effets de l'Atelier ; null pour les autres procédures.
   */
  valeur: EffetAffiche[] | null;
  /** Les documents de cette procédure sont remis à des usagers (« → usagers ») ; faux : aucune destination. */
  versUsagers: boolean;
}

/** Relevé « Production du service » : une ligne par procédure ouverte. Null hors de l'acte II. */
export function lignesProduction(
  s: GameState,
  maintenant: number,
): LigneProduction[] | null {
  const x = s.acte === 2 ? s.acte2 : null;
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  const ouvertes = PROCS.filter((p) => m.procsOuvertes.includes(p));
  return ouvertes.map((p) => {
    const nom = s.reformes.denomination.procedures[p];
    const doc = documentDe(nom);
    const demandee = PROCS_DEMANDEES.includes(p);
    const demandes = Math.floor(dossiersEnCours(x, p));
    const delivres = Math.floor(
      x.stats.delivresUsagers[p] + x.stats.delivresService[p],
    );
    const abandons = Math.floor(x.stats.abandonsProc[p]);
    const demandesMot = mot(demandes, 'demande', 'demandes');
    const delivresMot = mot(
      delivres,
      doc.feminin ? 'délivrée' : 'délivré',
      doc.feminin ? 'délivrées' : 'délivrés',
    );
    return {
      id: p,
      nom,
      demandes,
      delivres,
      demandesMot,
      delivresMot,
      demandesTexte: `${formatEntier(demandes)} ${demandesMot}`,
      delivresTexte: `${formatEntier(delivres)} ${delivresMot}`,
      valeur: demandee
        ? [
            {
              texte: `+${formatEuros(valeurDocument(x, p, m))} € ${doc.article}`,
              sens: 'plus',
            },
            { texte: compte(abandons, 'abandon', 'abandons'), sens: 'moins' },
          ]
        : null,
      versUsagers: demandee && procedureAboutit(x.procedures, ouvertes, p),
    };
  });
}
```

`production.ts` n'importe de `vueAtelier.ts` qu'un type (`import type`) : aucun cycle à l'exécution.

- [ ] **Step 5: Le bilan de l'Atelier passe par la même valeur**

Dans `data/acte2/vueAtelier.ts`, remplacer :

```ts
import { estBoucle, mene } from './procedures';
```

par :

```ts
import { estBoucle, mene } from './procedures';
import { valeurDocument } from './production';
```

et remplacer :

```ts
  const ex = EXEMPLAIRES[x.exemplaires];
  const dot = BALANCE2.dotation * m.dotationMult * ex.dotation;
  let euros = 0;
  let patience = 0;
  let delai = 0;
  x.procedures[p].forEach((e, k) => {
    const def = ETAPES[e.type];
    euros += dot * def.dotation;
    if (!(m.droitAcquis && k === 0)) patience += def.patience * ex.patience;
    delai += def.delai;
  });
```

par :

```ts
  const ex = EXEMPLAIRES[x.exemplaires];
  const euros = valeurDocument(x, p, m);
  let patience = 0;
  let delai = 0;
  x.procedures[p].forEach((e, k) => {
    const def = ETAPES[e.type];
    if (!(m.droitAcquis && k === 0)) patience += def.patience * ex.patience;
    delai += def.delai;
  });
```

- [ ] **Step 6: Vérifier**

Run: `npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 183`, `ℹ fail 0` (le test du bilan de l'Atelier est inchangé et passe) ; tsc et lint sans erreur.

- [ ] **Step 7: Commiter**

```bash
git add data/acte2/production.ts data/acte2/vueAtelier.ts data/jurisprudence.ts scripts/tests/releve-acte2.test.ts
git commit -m "feat(logic): relevé de la production du service, document et valeur de chaque procédure

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Robot, simulateur et calage de la dématérialisation

**Files:**
- Modify: `scripts/robots.ts` (`robotActe2`)
- Modify: `scripts/simulate-acte2.ts`
- Modify: `constants/balanceActe2.ts` (`demaCible`)

**Interfaces:**
- Consumes: `usagersAvecDemarche`, `dossiersDuService` (Tâche 2) ; `stats.delivresUsagers` / `delivresService` ; `valeurDocument` (Tâche 4).
- Produces: `robotActe2(s, now, taps, decouverte = 0, compose = true)` (sans `compose`, le robot ne touche pas à l'Atelier) ; le robot recrute selon la part des visas parmi **tous** les dossiers (usagers + `dossiersDuService`) ; `simulate-acte2` affiche les usagers en cours, les dossiers sans usager et les documents délivrés (usagers / service) toutes les 10 min, le jalon « plus de documents délivrés au service qu’aux usagers », la ligne « 10 min après la première boucle » (critère spec § 10) et la comparaison prudent / agressif depuis l'ouverture de l'Atelier ; `BALANCE2.demaCible = 68_000`.

- [ ] **Step 1: Le robot**

Dans `scripts/robots.ts`, remplacer :

```ts
  taps: number,
  decouverte = 0,
): GameState {
  let s = s0;
```

par :

```ts
  taps: number,
  decouverte = 0,
  compose = true,
): GameState {
  let s = s0;
```

remplacer :

```ts
  s = composer(s, now, decouverte);
```

par :

```ts
  if (compose) s = composer(s, now, decouverte);
```

et remplacer :

```ts
    const total = D.usagersEnCours(y) + D.dossiersEnBoucle(y);
```

par :

```ts
    const total = D.usagersEnCours(y) + D.dossiersDuService(y);
```

(Les dossiers qui poursuivent leur procédure attendent aussi aux visas : sans eux au dénominateur, la part des visas est surestimée et le robot recrute 21 chefs de bureau au lieu de 8, ce qui retarde toutes les notes chères.)

- [ ] **Step 2: Le simulateur**

Remplacer tout le contenu de `scripts/simulate-acte2.ts` par :

```ts
/**
 * Simulateur d'équilibrage de l'acte II, Réforme comprise.
 * Usage : node scripts/simulate-acte2.ts [tapsParSeconde] [minutesMax] [réformeÀ | balayage] [découverte]
 *
 * Un joueur-robot entre dans l'acte II avec le compteur d'une fin d'acte I et joue (scripts/robots.ts).
 * Sans troisième argument, il ne réforme pas. Avec `réformeÀ` (en % de dématérialisation), il réforme
 * dès ce taux atteint, achète sa Jurisprudence, rejoue l'acte I, revient à l'acte II et le termine.
 * `balayage` compare la fin de l'acte sans Réforme et avec une Réforme à 0, 20, 40, 50, 60, 70 et 80 %.
 * Il construit la boucle instantanément : un humain mettra plus longtemps.
 */
import { registerHooks } from 'node:module';
import type { GameState } from '../types/game.ts';

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

const D = await import('../data/acte2/moteur.ts');
const { valeurDocument } = await import('../data/acte2/production.ts');
const { BALANCE } = await import('../constants/balance.ts');
const R = await import('../data/reforme.ts');
const { finActeIRobot, robotActe1, robotActe2, robotReforme } = await import('./robots.ts');

const taps = Number(process.argv[2] ?? 2);
const minutesMax = Number(process.argv[3] ?? 300);
const mode = process.argv[4];
/** Minutes qu'un humain met à comprendre la note n° 8 (première partie seulement). */
const decouverte = Number(process.argv[5] ?? 0) * 60;

const mn = (t: number) => `${(t / 60).toFixed(1)} min`;

/** Part des recettes de la partie dépensée en ramettes (à la main ou par le Service des achats), en %. */
const partFournitures = (s: GameState): number =>
  (100 * (s.stats.formulairesAchetes / BALANCE.ramette) * D.prixRamette2(s)) /
  Math.max(1, s.stats.budgetGagne);

/** Documents délivrés depuis l'entrée dans l'acte : aux usagers, et pour les dossiers du service. */
function delivres(s: GameState): { usagers: number; service: number } {
  const x = s.acte2!;
  const somme = (r: Record<string, number>) => Object.values(r).reduce((a, v) => a + v, 0);
  return { usagers: somme(x.stats.delivresUsagers), service: somme(x.stats.delivresService) };
}

/** Ce que l'on mesure 10 minutes après la première boucle (critère de la spec 011, § 10). */
interface ApresBoucle {
  usagers: number;
  usagersMax: number;
  /** Documents délivrés pendant ces 10 minutes. */
  delivresUsagers: number;
  delivresService: number;
}

interface Partie {
  jalons: Record<string, number>;
  fin: number | null;
  s: GameState;
  /** Part des fournitures dans les recettes tant que tout se fait en ×1 (avant le curseur Exemplaires). */
  partX1: number | null;
  /** Mesures 10 min après la première boucle (null : pas de boucle, ou partie trop courte). */
  apresBoucle: ApresBoucle | null;
  /** L'état à l'ouverture de l'Atelier (première partie), pour comparer un joueur prudent et un agressif. */
  atelier: { s: GameState; t: number } | null;
}

/** Joue depuis l'entrée dans l'acte II ; réforme une fois à `reformeA` % de dématérialisation (null : jamais). */
function jouer(reformeA: number | null, journal: boolean): Partie {
  let s = D.entrerActe2({ ...finActeIRobot(), finActeVue: true }, 0);
  const jalons: Record<string, number> = {};
  const marquer = (k: string, t: number) => {
    if (jalons[k] === undefined) jalons[k] = t;
  };
  const tour = () => (s.reformes.nombre > 0 ? ' (après la Réforme)' : '');
  let partX1: number | null = null;
  let usagersMax = 0;
  let apresBoucle: ApresBoucle | null = null;
  let atelier: { s: GameState; t: number } | null = null;
  let aLaBoucle: { usagers: number; service: number } | null = null;
  for (let t = 1; t <= minutesMax * 60; t++) {
    const now = t * 1000;
    if (s.acte === 1) {
      s = robotActe1(s, now, taps);
      if (s.acteTermine) {
        marquer('acte I rejoué', t);
        s = D.entrerActe2({ ...s, finActeVue: true }, now);
      }
      continue;
    }
    // Le temps de compréhension de l'indice ne compte qu'à la première partie : ensuite, le joueur sait.
    if (partX1 === null && s.reformes.nombre === 0 && D.getModifiers2(s, now).exemplairesVisible)
      partX1 = partFournitures(s);
    if (atelier === null && D.getModifiers2(s, now).atelierVisible) atelier = { s, t };
    s = robotActe2(s, now, taps, s.reformes.nombre === 0 ? decouverte : 0);
    const x = s.acte2!;
    const enCours = D.usagersAvecDemarche(x);
    if (s.reformes.nombre === 0) usagersMax = Math.max(usagersMax, enCours);
    if (s.reformes.nombre === 0 && x.premiereBoucle !== null) {
      if (aLaBoucle === null) aLaBoucle = delivres(s);
      else if (apresBoucle === null && now >= x.premiereBoucle + 600_000) {
        const d = delivres(s);
        apresBoucle = {
          usagers: enCours,
          usagersMax,
          delivresUsagers: d.usagers - aLaBoucle.usagers,
          delivresService: d.service - aLaBoucle.service,
        };
      }
      const d = delivres(s);
      if (d.service > d.usagers) marquer('plus de documents délivrés au service qu’aux usagers', t);
    }

    for (const id of Object.keys(x.notes)) marquer(`note ${id}${tour()}`, t);
    if (x.agents.instructeur > 0) marquer(`premier agent${tour()}`, t);
    if (x.agents.chefBureau > 0) marquer(`premier chef de bureau${tour()}`, t);
    if (D.getModifiers2(s, now).atelierVisible) marquer(`atelier${tour()}`, t);
    if (x.premiereBoucle !== null) marquer(`première boucle${tour()}`, t);
    if (R.peutReformer(s, now)) marquer('réforme débloquée', t);
    for (const pct of [25, 50, 75, 100]) if (D.dematerialisation(x) >= pct) marquer(`dématérialisation ${pct} %${tour()}`, t);
    if (reformeA !== null && s.reformes.nombre === 0 && D.dematerialisation(x) >= reformeA && R.peutReformer(s, now)) {
      const gain = R.trombonesReforme(s);
      s = robotReforme(s, now);
      marquer(`réforme (${gain} trombones : ${s.reformes.jurisprudence.join(', ') || 'aucun bonus'})`, t);
      continue;
    }
    if (x.acteTermine) {
      marquer('fin de l’acte II', t);
      return { jalons, fin: t, s, partX1, apresBoucle, atelier };
    }
    if (journal && t % 600 === 0) {
      console.log(
        `${mn(t).padStart(9)} | budget ${Math.round(s.budget).toString().padStart(9)} € | guichets ${x.guichets} | agents ${x.agents.instructeur}/${x.agents.chefBureau}/${x.agents.sousDirecteur} | usagers ${Math.round(enCours).toString().padStart(4)} | sans usager ${Math.round(D.dossiersDuService(x)).toString().padStart(5)} | délivrés ${Math.round(delivres(s).usagers)} / ${Math.round(delivres(s).service)} | démat ${D.dematerialisation(x).toFixed(1)} %`,
      );
    }
  }
  return { jalons, fin: null, s, partX1, apresBoucle, atelier };
}

/**
 * Avant la boucle : 10 minutes depuis l'ouverture de l'Atelier, en gardant la Carte d'identité telle quelle
 * (prudent) ou en ajoutant toutes les étapes permises (agressif). Valeur d'une carte et abandons.
 */
function comparerAtelier(depart: { s: GameState; t: number }): void {
  for (const [nom, compose] of [['prudent', false], ['agressif', true]] as const) {
    let s = depart.s;
    const ab0 = s.acte2!.stats.abandonsProc.identite;
    for (let t = depart.t; t < depart.t + 600; t++) s = robotActe2(s, t * 1000, taps, 0, compose);
    const now = (depart.t + 600) * 1000;
    const x = s.acte2!;
    const valeur = valeurDocument(x, 'identite', D.getModifiers2(s, now));
    console.log(
      `  ${nom.padEnd(8)} : ${x.procedures.identite.length} étapes, ${valeur.toFixed(2)} € la carte, ${Math.round(x.stats.abandonsProc.identite - ab0)} abandons en 10 min`,
    );
  }
}

if (mode === 'balayage') {
  const sans = jouer(null, false);
  console.log(`Sans Réforme : fin de l’acte II à ${sans.fin === null ? `plus de ${minutesMax} min` : mn(sans.fin)}`);
  for (const a of [0, 20, 40, 50, 60, 70, 80]) {
    const p = jouer(a, false);
    const reforme = Object.entries(p.jalons).find(([k]) => k.startsWith('réforme ('));
    const gagne = p.fin !== null && (sans.fin === null || p.fin < sans.fin);
    console.log(
      `Réforme à ${a} % : ${reforme ? `${reforme[0]} à ${mn(reforme[1])}` : 'pas de Réforme'} · acte I rejoué ${p.jalons['acte I rejoué'] !== undefined ? mn(p.jalons['acte I rejoué']) : '—'} · fin ${p.fin === null ? '—' : mn(p.fin)} · ${gagne ? 'rentable' : 'pas rentable'}`,
    );
  }
} else {
  const p = jouer(mode === undefined ? null : Number(mode), true);
  console.log('\nJalons :');
  for (const [k, t] of Object.entries(p.jalons).sort((a, b) => a[1] - b[1])) console.log(`  ${mn(t).padStart(9)}  ${k}`);
  const fin = p.s.acte2;
  if (fin) {
    console.log('\nMesures :');
    console.log(`  visas au tap : ${Math.round(fin.stats.visasTampons)} sur ${Math.round(fin.stats.taps)} taps`);
    console.log(
      `  fournitures : ${p.partX1 === null ? '—' : p.partX1.toFixed(1)} % des recettes en ×1, ${partFournitures(p.s).toFixed(1)} % sur l’acte`,
    );
    console.log(`  procédures : ${Object.entries(fin.procedures).map(([q, e]) => `${q} [${e.map((v) => v.type).join(', ')}]`).join(' · ')}`);
  }
  const a = p.apresBoucle;
  if (a) {
    const part = (100 * a.usagers) / Math.max(1, a.usagersMax);
    console.log(
      `  10 min après la première boucle : ${Math.round(a.usagers)} usagers en cours (${part.toFixed(1)} % du maximum, ${Math.round(a.usagersMax)}) · en 10 min, ${Math.round(a.delivresService)} documents délivrés au service, ${Math.round(a.delivresUsagers)} aux usagers · ${part < 25 && a.delivresService > a.delivresUsagers ? 'critère tenu' : 'critère NON tenu'}`,
    );
  }
  if (p.atelier) {
    console.log('  avant la boucle, 10 min depuis l’ouverture de l’Atelier :');
    comparerAtelier(p.atelier);
  }
}
```

- [ ] **Step 3: Mesurer avec l'ancienne cible**

Run: `node scripts/simulate-acte2.ts 2 300 | grep -E "dématérialisation (50|100) %$|10 min après|prudent|agressif"`
Expected (cible 55 000, les tirages du tap varient de quelques dixièmes) :

```
   75.9 min  dématérialisation 50 %
  146.7 min  dématérialisation 100 %
  10 min après la première boucle : 9 usagers en cours (1.1 % du maximum, 750) · en 10 min, 1667 documents délivrés au service, 0 aux usagers · critère tenu
  prudent  : 2 étapes, 7.17 € la carte, 1697 abandons en 10 min
  agressif : 4 étapes, 14.34 € la carte, 1981 abandons en 10 min
```

Les usagers s'effondrent (critère tenu), mais l'acte se termine sous la cible du robot (150 – 200 min) : les dossiers qui poursuivent leur procédure ajoutent des étapes sans usager.

- [ ] **Step 4: Recaler la cible de dématérialisation**

Dans `constants/balanceActe2.ts`, remplacer :

```ts
  /** Points de dématérialisation correspondant à 100 %. */
  demaCible: 55_000,
```

par :

```ts
  /**
   * Points de dématérialisation correspondant à 100 %. Relevé de 55 000 avec specs/011 : les dossiers qui
   * poursuivent leur procédure après leur pièce de service comptent aussi (fin de l'acte du robot vers 192 min).
   */
  demaCible: 68_000,
```

- [ ] **Step 5: Vérifier les jalons de la spec 009 et le critère de la spec 011**

Run: `node scripts/simulate-acte2.ts 2 300 | grep -E "premier agent$|  atelier$|note achats$|note pieceService$|première boucle$|plus de doc|dématérialisation (50|100) %$|fournitures|10 min après|prudent|agressif"`
Expected :

```
    2.0 min  premier agent
    8.9 min  atelier
   16.1 min  note achats
   26.0 min  note pieceService
   30.0 min  première boucle
   59.5 min  plus de documents délivrés au service qu’aux usagers
   89.2 min  dématérialisation 50 %
  192.3 min  dématérialisation 100 %
  fournitures : 35.2 % des recettes en ×1, 40.0 % sur l’acte
  10 min après la première boucle : 9 usagers en cours (1.1 % du maximum, 744) · en 10 min, 1667 documents délivrés au service, 0 aux usagers · critère tenu
  prudent  : 2 étapes, 7.17 € la carte, 1697 abandons en 10 min
  agressif : 4 étapes, 14.34 € la carte, 1981 abandons en 10 min
```

Puis `node scripts/simulate-acte2.ts 1 300` et `node scripts/simulate-acte2.ts 3 300` : fin de l'acte à 196.9 et 187.0 min, première boucle à 31.3 et 27.6 min, « critère tenu » (0,9 % et 1,4 % du maximum). Puis `node scripts/simulate-acte2.ts 2 300 balayage` :

```
Sans Réforme : fin de l’acte II à 192.2 min
Réforme à 0 % : réforme (7 trombones : anteriorite) à 30.0 min · acte I rejoué 51.7 min · fin 111.7 min · rentable
Réforme à 20 % : réforme (10 trombones : memoire) à 51.5 min · acte I rejoué 73.2 min · fin 120.8 min · rentable
Réforme à 40 % : réforme (13 trombones : memoire, anteriorite) à 75.3 min · acte I rejoué 97.0 min · fin 127.7 min · rentable
Réforme à 50 % : réforme (14 trombones : memoire, anteriorite) à 89.2 min · acte I rejoué 110.8 min · fin 141.8 min · rentable
Réforme à 60 % : réforme (16 trombones : memoire, anteriorite, videJuridique) à 106.0 min · acte I rejoué 127.5 min · fin 155.3 min · rentable
Réforme à 70 % : réforme (18 trombones : memoire, anteriorite, videJuridique) à 124.2 min · acte I rejoué 145.7 min · fin 171.8 min · rentable
Réforme à 80 % : réforme (20 trombones : memoire, anteriorite, anciennete) à 144.8 min · acte I rejoué 163.3 min · fin 187.0 min · rentable
```

et `node scripts/simulate-acte2.ts 2 300 0 15` : Réforme débloquée à 45.0 min, acte I rejoué à 66.6 min, fin de l'acte à 117.3 min. Spec 009 : premier Instructeur, Atelier, pièce de service, première boucle, Réforme débloquée (40 – 55), première Réforme replay compris (60 – 90), fin de l'acte (105 – 135) restent dans leurs fourchettes ; Réforme rentable jusqu'à 70 % au moins (ici 80 %) ; la plus petite Réforme rapporte 6 trombones au moins (ici 7). Si un nombre s'écarte de plus d'une minute, ne pas toucher aux constantes sans en parler au porteur de projet.

- [ ] **Step 6: Vérifier les tests**

Run: `npm test 2>&1 | tail -8`
Expected: `ℹ pass 183`, `ℹ fail 0` (les tests n'utilisent la cible que par `BALANCE2.demaCible`).

- [ ] **Step 7: Commiter**

```bash
git add scripts/robots.ts scripts/simulate-acte2.ts constants/balanceActe2.ts
git commit -m "perf(logic): mesures de la production au simulateur et cible de dématérialisation recalée

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Fiche de poste réduite à l'orientation

**Files:**
- Modify: `types/acte2.ts` (`LigneFiche2Id`, `LIGNES_FICHE2`)
- Modify: `data/acte2/fiche.ts` (`LIGNES`)
- Modify: `data/save.ts` (lignes retirées oubliées)
- Modify: `components/direction/FichePosteDirection.tsx` (pictogrammes)
- Modify: `scripts/tests/fiche-acte2.test.ts`

**Interfaces:**
- Consumes: `vueFiche2`, `marquerFiche2`, `lignesFiche2` (`data/acte2/fiche.ts`) ; `normaliserSauvegarde`.
- Produces: `LigneFiche2Id = 'circulation' | 'guichets' | 'dotation' | 'agents' | 'achats'` ; `LIGNES_FICHE2: LigneFiche2Id[]` ; une sauvegarde qui citait `evaluation`, `atelier`, `exemplaires` ou `pieceService` dans `ficheLues` les oublie.

- [ ] **Step 1: Mettre les tests à jour (ils échouent)**

Dans `scripts/tests/fiche-acte2.test.ts`, remplacer :

```ts
import * as F from '../../data/acte2/fiche';
```

par :

```ts
import * as F from '../../data/acte2/fiche';
import { normaliserSauvegarde } from '../../data/save';
```

remplacer :

```ts
test('fiche de poste du chef de service : quatre lignes à la prise de fonctions, ouverte', () => {
```

par :

```ts
test('fiche de poste du chef de service : trois lignes à la prise de fonctions, ouverte', () => {
```

remplacer :

```ts
    ['circulation', 'guichets', 'dotation', 'evaluation'],
  );
  assert.equal(
    f.nonLues,
```

par :

```ts
    ['circulation', 'guichets', 'dotation'],
  );
  assert.deepEqual(
    f.lignes.map((l) => l.titre),
    [
      'Les dossiers circulent d’étape en étape',
      'Vous visez les parapheurs',
      'Chaque étape consomme des formulaires',
    ],
  );
  assert.equal(
    f.nonLues,
```

remplacer :

```ts
  assert.equal(f.lignes.filter((l) => l.nouvelle).length, 4);
```

par :

```ts
  assert.equal(f.lignes.filter((l) => l.nouvelle).length, 3);
```

remplacer :

```ts
  const f = F.vueFiche2(s, 0) as F.VueFiche2;
  assert.deepEqual(
    f.lignes.map((l) => l.id),
    [
      'circulation',
      'guichets',
      'dotation',
      'evaluation',
      'agents',
      'atelier',
      'exemplaires',
      'achats',
      'pieceService',
    ],
  );
  assert.equal(f.nonLues, 5);
  assert.deepEqual(
    f.lignes.filter((l) => l.nouvelle).map((l) => l.id),
    ['agents', 'atelier', 'exemplaires', 'achats', 'pieceService'],
  );
```

par :

```ts
  const f = F.vueFiche2(s, 0) as F.VueFiche2;
  // L'Atelier, les Exemplaires et la pièce de service n'ajoutent plus de ligne (specs/011).
  assert.deepEqual(
    f.lignes.map((l) => l.id),
    ['circulation', 'guichets', 'dotation', 'agents', 'achats'],
  );
  assert.equal(f.nonLues, 2);
  assert.deepEqual(
    f.lignes.filter((l) => l.nouvelle).map((l) => l.id),
    ['agents', 'achats'],
  );
```

remplacer :

```ts
      !/boucle|dématérialis/i.test(l.titre + l.texte),
      `la fiche nomme la boucle : ${l.id}`,
    );
```

par :

```ts
      !/boucle|dématérialis|évaluation|atelier|exemplaire/i.test(l.titre + l.texte),
      `la fiche explique un arbitrage ou nomme la boucle : ${l.id}`,
    );
```

puis ajouter à la fin du fichier :

```ts

test('sauvegarde antérieure : les lignes retirées de la fiche sont oubliées', () => {
  const s = F.marquerFiche2(base2(), true, 0);
  const ancien = avec2(s, {
    ficheLues: ['circulation', 'evaluation', 'atelier'] as unknown as EtatActe2['ficheLues'],
  });
  assert.deepEqual(x(normaliserSauvegarde(ancien)).ficheLues, ['circulation']);
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/fiche-acte2.test.ts`
Expected: FAIL — quatre lignes au lieu de trois (`evaluation`), titres différents, neuf lignes au lieu de cinq, `ficheLues` garde `evaluation` et `atelier`.

- [ ] **Step 3: Les lignes de la fiche**

Dans `types/acte2.ts`, remplacer :

```ts
/** Lignes de la fiche de poste du chef de service, dans l'ordre de la fiche. */
export type LigneFiche2Id =
  | 'circulation'
  | 'guichets'
  | 'dotation'
  | 'evaluation'
  | 'agents'
  | 'atelier'
  | 'exemplaires'
  | 'achats'
  | 'pieceService';
```

par :

```ts
/** Lignes de la fiche de poste du chef de service, dans l'ordre de la fiche (specs/011 : trois lignes d'orientation). */
export type LigneFiche2Id =
  | 'circulation'
  | 'guichets'
  | 'dotation'
  | 'agents'
  | 'achats';

/** Toutes les lignes de la fiche (une sauvegarde plus ancienne peut en citer d'autres, retirées depuis). */
export const LIGNES_FICHE2: LigneFiche2Id[] = [
  'circulation',
  'guichets',
  'dotation',
  'agents',
  'achats',
];
```

Dans `data/acte2/fiche.ts`, remplacer :

```ts
 * Fiche de poste du chef de service (acte II) : même format que celle du guichet 3. Elle s'ouvre à la prise
 * de fonctions, se relit depuis Options, et le S.I.C. la complète d'une ligne à chaque mécanique débloquée.
 * Aucune ligne ne nomme la boucle ni la dématérialisation.
```

par :

```ts
 * Fiche de poste du chef de service (acte II) : même format que celle du guichet 3. Elle s'ouvre à la prise
 * de fonctions, se relit depuis Options ; trois lignes d'orientation, puis les agents et le service des achats
 * à leur note (specs/011 : aucune ligne n'explique un arbitrage). Rien ne nomme la boucle ni la dématérialisation.
```

puis remplacer toute la constante `LIGNES` (de `const LIGNES: LigneDef[] = [` à son `];`) par :

```ts
const LIGNES: LigneDef[] = [
  {
    id: 'circulation',
    note: null,
    titre: 'Les dossiers circulent d’étape en étape',
    texte:
      'Chaque procédure est une suite d’étapes. Un dossier les franchit dans l’ordre, sans exception.',
  },
  {
    id: 'guichets',
    note: null,
    titre: 'Vous visez les parapheurs',
    texte: 'Chaque tap accorde un visa en attente. Les guichets traitent le reste.',
  },
  {
    id: 'dotation',
    note: null,
    titre: 'Chaque étape consomme des formulaires',
    texte: 'Sans formulaires, plus aucune étape ne se franchit.',
  },
  {
    id: 'agents',
    note: 'agents',
    titre: 'Les agents visent à votre place',
    texte: 'Ils accordent les visas en attente, au rythme de leur ancienneté.',
  },
  {
    id: 'achats',
    note: 'achats',
    titre: 'Les fournitures sont commandées par le service des achats',
    texte: 'Il prélève sur votre budget ce que le marché public exige.',
  },
];
```

- [ ] **Step 4: La sauvegarde oublie les lignes retirées**

Dans `data/save.ts`, remplacer :

```ts
import { PROCS } from '../types/acte2';
```

par :

```ts
import { LIGNES_FICHE2, PROCS } from '../types/acte2';
```

et remplacer :

```ts
        ficheLues: Array.isArray(x.ficheLues) ? x.ficheLues : [],
```

par :

```ts
        // Les lignes retirées de la fiche (specs/011) sont oubliées.
        ficheLues: Array.isArray(x.ficheLues)
          ? x.ficheLues.filter((id) => LIGNES_FICHE2.includes(id))
          : [],
```

- [ ] **Step 5: Les pictogrammes**

Dans `components/direction/FichePosteDirection.tsx`, remplacer :

```tsx
import {
  ChartColumn,
  Coins,
  Copy,
  Landmark,
  Paperclip,
  Truck,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
```

par :

```tsx
import {
  Copy,
  Paperclip,
  Stamp,
  Truck,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
```

remplacer :

```tsx
  circulation: { Icone: Paperclip, fond: Colors.pastelBleu },
  guichets: { Icone: Landmark, fond: Colors.bleuFond },
  dotation: { Icone: Coins, fond: Colors.pastelJaune },
  evaluation: { Icone: ChartColumn, fond: Colors.pastelVert },
  agents: { Icone: UserRound, fond: Colors.pastelJaune },
  atelier: { Icone: Wrench, fond: Colors.bleuFond },
  exemplaires: { Icone: Copy, fond: Colors.pastelBleu },
  achats: { Icone: Truck, fond: Colors.pastelVert },
  pieceService: { Icone: Landmark, fond: Colors.pastelBleu },
```

par :

```tsx
  circulation: { Icone: Paperclip, fond: Colors.pastelBleu },
  guichets: { Icone: Stamp, fond: Colors.bleuFond },
  dotation: { Icone: Copy, fond: Colors.pastelJaune },
  agents: { Icone: UserRound, fond: Colors.pastelJaune },
  achats: { Icone: Truck, fond: Colors.pastelVert },
```

et remplacer :

```tsx
 * Fiche de poste du chef de service (acte II), au format de celle du guichet 3 : elle s'ouvre à la prise de
 * fonctions, se relit depuis Options, et le S.I.C. la complète à chaque mécanique débloquée (une ligne ajoutée
 * porte « NOUVEAU » jusqu'à la relecture).
```

par :

```tsx
 * Fiche de poste du chef de service (acte II), au format de celle du guichet 3 : elle s'ouvre à la prise de
 * fonctions, se relit depuis Options ; trois lignes d'orientation, puis les agents et le service des achats à
 * leur note (une ligne ajoutée porte « NOUVEAU » jusqu'à la relecture).
```

- [ ] **Step 6: Vérifier**

Run: `npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 184`, `ℹ fail 0` ; tsc et lint sans erreur.

Navigateur (procédure « Vérifier dans le navigateur »), 375 × 812 :
1. Préréglage `debut` : la fiche « Fiche de poste n° 3-B » s'ouvre avec trois lignes — trombone « Les dossiers circulent d’étape en étape », tampon « Vous visez les parapheurs », copies « Chaque étape consomme des formulaires » ; aucune ligne sur l'évaluation. « PRENDRE MON POSTE » la referme.
2. Préréglage `achats` : Options → « Relire ma fiche de poste » : cinq lignes (les trois, « Les agents visent à votre place », « Les fournitures sont commandées par le service des achats ») ; ni Atelier, ni Exemplaires, ni pièce de service.
3. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 7: Commiter**

```bash
git add types/acte2.ts data/acte2/fiche.ts data/save.ts components/direction/FichePosteDirection.tsx scripts/tests/fiche-acte2.test.ts
git commit -m "feat(logic): fiche de poste du chef de service réduite à l'orientation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Raccourcis « compliquer rapporte », « pièce de nos services », « boucle sur le point de se former »

**Files:**
- Modify: `data/presets.ts`
- Modify: `scripts/tests/presets.test.ts`
- Modify: `scripts/save-acte2.ts` (commentaire)

**Interfaces:**
- Consumes: `sauvegardePreset`, `PRESETS_INFO` ; `D.stocksPour`, `D.modifierProcedure`, `D.tick2` ; `lignesProduction` (Tâche 4) ; `procsEnBoucle`.
- Produces: `Preset` gagne `'compliquer'`, `'pieceService'`, `'avantBoucle'` (ordre : `…, atelier, compliquer, achats, pieceService, avantBoucle, boucle, …`) ; helper `production(x, delivresUsagers, delivresService, abandons): StatsActe2` ; préréglage `achats` sans usager au Justificatif ; préréglage `boucle` (et `demat`, `fin`, `reforme`) avec des dossiers qui poursuivent jusqu'au visa et des compteurs de production.

Les trois préréglages (spec § 11), tous avec la fiche réputée lue et le courrier déjà mérité réputé envoyé :
- **`compliquer`** (≈ 11 min, moment 2) : Atelier et Signature en vigueur, Carte d'identité `[Pièce, Visa]` avec 52 usagers, Justificatif `[Pièce]` vide (moment 3), 8 guichets, 6 instructeurs, 2 000 cartes délivrées, 600 abandons, population 3 800.
- **`pieceService`** (≈ 27 min, moment 4 à faire) : note n° 8 en vigueur (et Chef de bureau), Carte `[Pièce, Signature, Visa]`, Justificatif `[Pièce, Visa]` vide ; il ne reste qu'à ajouter « Pièce délivrée par nos services » qui exige le Justificatif.
- **`avantBoucle`** (moment 4 fait) : la Carte `[Pièce, Signature, Pièce de service → Justificatif, Visa]` remplit le Justificatif (26 demandes, 150 délivrés au service) ; ajouter au Justificatif une pièce de service qui exige la Carte forme la boucle.

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/presets.test.ts`, remplacer :

```ts
import * as F from '../../data/acte2/fiche';
import type { EtatActe2 } from '../../types/acte2';
```

par :

```ts
import * as F from '../../data/acte2/fiche';
import * as P from '../../data/acte2/production';
import { procsEnBoucle } from '../../data/acte2/procedures';
import type { EtatActe2 } from '../../types/acte2';
```

remplacer :

```ts
  debut: 2,
  atelier: 2,
  achats: 2,
```

par :

```ts
  debut: 2,
  atelier: 2,
  compliquer: 2,
  achats: 2,
  pieceService: 2,
  avantBoucle: 2,
```

remplacer :

```ts
    'debut',
    'atelier',
    'achats',
    'boucle',
```

par :

```ts
    'debut',
    'atelier',
    'compliquer',
    'achats',
    'pieceService',
    'avantBoucle',
    'boucle',
```

puis ajouter à la fin du fichier :

```ts

const x2 = (s: ReturnType<typeof sauvegardePreset>): EtatActe2 => s.acte2 as EtatActe2;

test('raccourci « compliquer rapporte » : Atelier ouvert, Signature permise, la carte seule demandée', () => {
  const s = sauvegardePreset('compliquer', T);
  const m = D.getModifiers2(s, T);
  assert.equal(m.atelierVisible, true);
  assert.ok(m.etapesDisponibles.includes('signature'));
  const [carte, justificatif] = P.lignesProduction(s, T) as P.LigneProduction[];
  assert.ok(carte.demandes > 0 && carte.delivres > 0 && carte.versUsagers);
  assert.equal(justificatif.demandes, 0);
  assert.equal(justificatif.delivres, 0);
  assert.equal(F.vueFiche2(s, T)?.nonLues, 0);
});

test('raccourci « pièce de nos services » : il ne reste qu’à exiger un justificatif', () => {
  const s = sauvegardePreset('pieceService', T);
  assert.ok(D.getModifiers2(s, T).etapesDisponibles.includes('pieceService'));
  assert.ok(
    Object.values(x2(s).procedures)
      .flat()
      .every((e) => e.type !== 'pieceService'),
  );
  const exige = D.modifierProcedure(
    s,
    { type: 'ajouter', p: 'identite', etape: 'pieceService', exige: 'domicile' },
    T,
  );
  assert.notEqual(exige, s);
  assert.deepEqual(procsEnBoucle(x2(exige).procedures, ['identite', 'domicile']), []);
});

test('raccourci « boucle sur le point de se former » : le justificatif peut exiger une carte', () => {
  const s = sauvegardePreset('avantBoucle', T);
  assert.equal(x2(s).premiereBoucle, null);
  const [, justificatif] = P.lignesProduction(s, T) as P.LigneProduction[];
  assert.ok(justificatif.demandes > 0 && !justificatif.versUsagers);
  const b = D.modifierProcedure(
    s,
    { type: 'ajouter', p: 'domicile', etape: 'pieceService', exige: 'identite' },
    T,
  );
  assert.deepEqual(procsEnBoucle(x2(b).procedures, ['identite', 'domicile']), [
    'identite',
    'domicile',
  ]);
  let r = b;
  for (let i = 1; i <= 600; i++) r = D.tick2(r, 0.1, T + i * 100).s;
  assert.ok(x2(r).premiereBoucle !== null);
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/presets.test.ts`
Expected: FAIL — l'ordre des préréglages n'a pas les trois nouveaux ; `sauvegardePreset('compliquer', T)` lève `TypeError: Cannot read properties of undefined (reading 'map')` (aucune note pour ce préréglage).

- [ ] **Step 3: Les préréglages**

Dans `data/presets.ts`, remplacer :

```ts
import type { Etape, EtatActe2, Note2Id, ProcId, Stocks } from '../types/acte2';
```

par :

```ts
import type { Etape, EtatActe2, Note2Id, ProcId, StatsActe2, Stocks } from '../types/acte2';
```

remplacer :

```ts
  | 'atelier'
  | 'achats'
  | 'boucle'
```

par :

```ts
  | 'atelier'
  | 'compliquer'
  | 'achats'
  | 'pieceService'
  | 'avantBoucle'
  | 'boucle'
```

remplacer :

```ts
  {
    id: 'achats',
    titre: 'Acte II — service des achats',
    detail: 'Marché public de fournitures en vigueur, ×2 exemplaires',
  },
```

par :

```ts
  {
    id: 'compliquer',
    titre: 'Acte II — compliquer rapporte',
    detail: 'Atelier ouvert, Carte d’identité seule demandée',
  },
  {
    id: 'achats',
    titre: 'Acte II — service des achats',
    detail: 'Marché public de fournitures en vigueur, ×2 exemplaires',
  },
  {
    id: 'pieceService',
    titre: 'Acte II — pièce de nos services',
    detail: 'Il ne reste qu’à exiger un justificatif',
  },
  {
    id: 'avantBoucle',
    titre: 'Acte II — boucle sur le point de se former',
    detail: 'Le justificatif peut exiger une carte',
  },
```

remplacer :

```ts
const NOTES_BOUCLE: Note2Id[] = [...NOTES_ACHATS, 'pieceService'];
```

par :

```ts
const NOTES_PIECE: Note2Id[] = [...NOTES_ACHATS, 'chefBureau', 'pieceService'];
const NOTES_BOUCLE: Note2Id[] = [...NOTES_ACHATS, 'pieceService'];
```

remplacer :

```ts
  atelier: NOTES_ATELIER,
  achats: NOTES_ACHATS,
```

par :

```ts
  atelier: NOTES_ATELIER,
  compliquer: [...NOTES_ATELIER, 'signature'],
  achats: NOTES_ACHATS,
  pieceService: NOTES_PIECE,
  avantBoucle: NOTES_PIECE,
```

remplacer :

```ts
/** Une boucle Carte d'identité ⇄ Justificatif de domicile. */
```

par :

```ts
/** Avant la pièce de service : la Carte d'identité déjà compliquée, le Justificatif que personne ne demande. */
const PROCEDURES_PIECE: Partial<Record<ProcId, Etape[]>> = {
  identite: [{ type: 'piece' }, { type: 'signature' }, { type: 'visa' }],
  domicile: [{ type: 'piece' }, { type: 'visa' }],
};

/** La Carte d'identité exige un Justificatif de domicile ; il ne reste qu'à faire exiger une carte au justificatif. */
const PROCEDURES_AVANT_BOUCLE: Partial<Record<ProcId, Etape[]>> = {
  identite: [
    { type: 'piece' },
    { type: 'signature' },
    { type: 'pieceService', exige: 'domicile' },
    { type: 'visa' },
  ],
  domicile: [{ type: 'piece' }, { type: 'visa' }],
};

/** Documents délivrés et usagers perdus depuis l'entrée dans l'acte. */
function production(
  x: EtatActe2,
  delivresUsagers: number,
  delivresService: Partial<Record<ProcId, number>>,
  abandons: number,
): StatsActe2 {
  return {
    ...x.stats,
    delivresUsagers: { ...x.stats.delivresUsagers, identite: delivresUsagers },
    delivresService: { ...x.stats.delivresService, ...delivresService },
    abandonsProc: { ...x.stats.abandonsProc, identite: abandons },
  };
}

/** Une boucle Carte d'identité ⇄ Justificatif de domicile. */
```

remplacer :

```ts
  if (preset === 'achats') {
```

par :

```ts
  if (preset === 'compliquer') {
    // Vers 11 min : l'Atelier et la Signature en vigueur, la Carte d'identité telle que le S.I.C. l'a laissée.
    x = {
      ...x,
      guichets: 8,
      agents: { ...x.agents, instructeur: 6 },
      usagers: remplir(D.stocksPour(x.procedures), { identite: [40, 12] }),
      population: 3_800,
      stats: { ...production(x, 2_000, {}, 600), franchies: 10_000 },
    };
    s = { ...s, budget: 3_000, formulaires: 1_500 };
  }
  if (preset === 'pieceService' || preset === 'avantBoucle') {
    // Vers 27 min : la note n° 8 en vigueur ; le Justificatif ne reçoit rien tant qu'aucune pièce ne l'exige.
    const exige = preset === 'avantBoucle';
    const procedures = {
      ...x.procedures,
      ...(exige ? PROCEDURES_AVANT_BOUCLE : PROCEDURES_PIECE),
    };
    x = {
      ...x,
      procedures,
      usagers: remplir(D.stocksPour(procedures), {
        identite: exige ? [60, 20, 10, 25] : [60, 20, 25],
        domicile: exige ? [20, 6] : [0, 0],
      }),
      boucles: D.stocksPour(procedures),
      suites: D.stocksPour(procedures),
      guichets: 12,
      agents: { ...x.agents, instructeur: 10, chefBureau: 2 },
      population: 3_700,
      exemplaires: 2,
      premiereModif: 'identite',
      stats: {
        ...production(x, exige ? 5_400 : 5_000, exige ? { domicile: 150 } : {}, 1_500),
        franchies: exige ? 42_000 : 40_000,
      },
    };
    s = { ...s, budget: 6_000, formulaires: 3_000 };
  }
  if (preset === 'achats') {
```

remplacer (préréglage `achats`) :

```ts
      usagers: remplir(D.stocksPour(procedures), {
        identite: [30, 6, 4, 8],
        domicile: [12, 3, 5],
      }),
```

par :

```ts
      // Personne ne demande de justificatif (specs/011) : seule la Carte d'identité a des usagers.
      usagers: remplir(D.stocksPour(procedures), {
        identite: [30, 6, 4, 8],
      }),
```

remplacer (préréglages `boucle`, `demat`, `fin`, `reforme`) :

```ts
      usagers: remplir(D.stocksPour(procedures), {
        identite: [20, 5, 8],
        domicile: [6, 2],
      }),
      boucles: remplir(D.stocksPour(procedures), {
        identite: [10, 4, 20],
        domicile: [12, 6],
      }),
      suites: D.stocksPour(procedures),
```

par :

```ts
      usagers: remplir(D.stocksPour(procedures), {
        identite: [20, 5, 8],
      }),
      boucles: remplir(D.stocksPour(procedures), {
        identite: [10, 4, 0],
        domicile: [12, 6],
      }),
      // Ceux qui ont déposé leur pièce poursuivent jusqu'au visa (specs/011).
      suites: remplir(D.stocksPour(procedures), { identite: [0, 0, 20] }),
```

et remplacer :

```ts
      stats: {
        ...x.stats,
        franchies: 40_000,
        franchiesBoucle: 6_000,
        abandonsDemarche: 350,
      },
```

par :

```ts
      stats: {
        ...production(x, 5_900, { identite: 800, domicile: 700 }, 5_700),
        franchies: 40_000,
        franchiesBoucle: 6_000,
        abandonsDemarche: 350,
      },
```

Dans `scripts/save-acte2.ts`, remplacer :

```ts
 * Préréglages : acte1Debut, acte1Milieu, finActeI, debut, atelier, achats, boucle, demat, fin, reforme, cerfa2
```

par :

```ts
 * Préréglages : acte1Debut, acte1Milieu, finActeI, debut, atelier, compliquer, achats, pieceService, avantBoucle,
 * boucle, demat, fin, reforme, cerfa2
```

- [ ] **Step 4: Vérifier**

Run: `npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 187`, `ℹ fail 0` ; tsc et lint sans erreur.

Navigateur (procédure « Vérifier dans le navigateur »), 375 × 812 :
1. `http://localhost:8085/?test` : quatorze cartes, dans l'ordre ; « Acte II — compliquer rapporte · Atelier ouvert, Carte d’identité seule demandée », « Acte II — pièce de nos services · Il ne reste qu’à exiger un justificatif », « Acte II — boucle sur le point de se former · Le justificatif peut exiger une carte ».
2. Charger `compliquer` : onglet Atelier présent ; « Ajouter une étape » propose la Signature. `javascript_tool` → `JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')).acte2.stats.delivresUsagers.identite` augmente au fil des visas.
3. Charger `avantBoucle` : Atelier → Justificatif de domicile → « Ajouter une étape » → « Pièce délivrée par nos services », document exigé « Carte d’identité » → « AJOUTER L’ÉTAPE » : la carte « Carte d’identité ⇄ Justificatif de domicile · Ces procédures s’exigent mutuellement » apparaît ; quelques secondes plus tard une lettre arrive (enveloppe) et `acte2.premiereBoucle` n'est plus `null`.
4. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 5: Commiter**

```bash
git add data/presets.ts scripts/tests/presets.test.ts scripts/save-acte2.ts
git commit -m "feat(logic): raccourcis de test compliquer rapporte, pièce de nos services et boucle sur le point de se former

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Le relevé dans GameStateContext

**Files:**
- Modify: `context/GameStateContext.tsx`

**Interfaces:**
- Consumes: `lignesProduction`, `LigneProduction` (Tâche 4).
- Produces: `useGameState().production: LigneProduction[] | null` (null à l'acte I) ; type `LigneProduction` réexporté pour les composants.

- [ ] **Step 1: Brancher le relevé**

Dans `context/GameStateContext.tsx`, remplacer :

```tsx
import * as F from '@/data/acte2/fiche';
```

par :

```tsx
import * as F from '@/data/acte2/fiche';
import { lignesProduction, type LigneProduction } from '@/data/acte2/production';
```

remplacer :

```tsx
export type { LigneFicheAffichee, VueFiche2 } from '@/data/acte2/fiche';
```

par :

```tsx
export type { LigneFicheAffichee, VueFiche2 } from '@/data/acte2/fiche';
export type { LigneProduction } from '@/data/acte2/production';
```

remplacer :

```tsx
  /** Fiche de poste du chef de service (acte II) ; null à l'acte I. */
  fiche2: F.VueFiche2 | null;
```

par :

```tsx
  /** Fiche de poste du chef de service (acte II) ; null à l'acte I. */
  fiche2: F.VueFiche2 | null;
  /** Relevé « Production du service » : une ligne par procédure ouverte (acte II) ; null à l'acte I. */
  production: LigneProduction[] | null;
```

remplacer :

```tsx
  const fiche2 = useMemo(() => F.vueFiche2(etat, maintenant), [etat, maintenant]);
```

par :

```tsx
  const fiche2 = useMemo(() => F.vueFiche2(etat, maintenant), [etat, maintenant]);
  const production = useMemo(() => lignesProduction(etat, maintenant), [etat, maintenant]);
```

remplacer :

```tsx
      fiche2,
      debits: direction ? debits : null,
```

par :

```tsx
      fiche2,
      production,
      debits: direction ? debits : null,
```

et remplacer :

```tsx
      fiche2, debits, reglerAchats,
    ],
```

par :

```tsx
      fiche2, production, debits, reglerAchats,
    ],
```

- [ ] **Step 2: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test 2>&1 | tail -8`
Expected: aucune erreur ; `ℹ pass 187`, `ℹ fail 0`.

- [ ] **Step 3: Commiter**

```bash
git add context/GameStateContext.tsx
git commit -m "feat(state): relevé de la production du service dans GameStateContext

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Colonne Usagers et relevé « Production du service » sur l'écran Direction

**Files:**
- Modify: `data/acte2/vues.ts` (`VueDirection.usagers`)
- Modify: `components/Hud.tsx`
- Create: `components/direction/ReleveProduction.tsx`
- Modify: `components/direction/EcranDirection.tsx`
- Modify: `scripts/tests/vues-acte2.test.ts`

**Interfaces:**
- Consumes: `usagersAvecDemarche` (Tâche 2) ; `production`, `verdict`, `encre`, `direction` (contexte) ; `Panneau`, `ValeurAnimee`, `Effets` (`components/atelier/Elements`).
- Produces: `VueDirection.usagers` = usagers qui ont une démarche en cours (colonne de l'en-tête, salle de la scène, panneau d'appel) ; colonne « Usagers » à la place de « Visas » ; composant `ReleveProduction({ compact?, atelier? })` : titre « Production du service », un bloc par procédure (nom, « N demandes · M délivrées », puis pour la Carte d'identité les puces « +X € la carte » et « K abandons », puis « → usagers » tant que la carte est remise à des usagers) ; condensé (une ligne par procédure, sans titre) en écran compact ou dès trois procédures sur l'écran Direction, jamais dans l'Atelier.

- [ ] **Step 1: Le test de la colonne (il échoue)**

Ajouter à la fin de `scripts/tests/vues-acte2.test.ts` :

```ts

test('en-tête : les usagers qui ont une démarche en cours, pas les dossiers liés ni ceux du service', () => {
  const b = avecNotes(base2(), ['atelier']);
  const s = avec2(b, {
    usagers: { ...x(b).usagers, identite: [3, 2], domicile: [7] },
    boucles: { ...x(b).boucles, identite: [10, 0] },
  });
  assert.equal(vue(s).usagers, 5);
});
```

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/vues-acte2.test.ts`
Expected: FAIL — `12 !== 5` (les dossiers liés du Justificatif sont comptés).

- [ ] **Step 2: La vue**

Dans `data/acte2/vues.ts`, remplacer :

```ts
  notesVisibles2,
  usagersEnCours,
  visasEnAttente,
```

par :

```ts
  notesVisibles2,
  usagersAvecDemarche,
  visasEnAttente,
```

remplacer :

```ts
  visas: number;
  usagers: number;
  guichets: number;
```

par :

```ts
  visas: number;
  /** Usagers qui ont une démarche en cours (colonne Usagers de l'en-tête, salle de la scène). */
  usagers: number;
  guichets: number;
```

et remplacer :

```ts
  const usagers = Math.floor(usagersEnCours(x));
```

par :

```ts
  const usagers = Math.floor(usagersAvecDemarche(x));
```

- [ ] **Step 3: La colonne Usagers**

Dans `components/Hud.tsx`, remplacer :

```tsx
          <Colonne
            label="Visas"
            valeur={formatEntier(direction.visas)}
```

par :

```tsx
          <Colonne
            label="Usagers"
            valeur={formatEntier(direction.usagers)}
```

et remplacer :

```tsx
 * révélée, Conformité. Acte II : budget, formulaires (chacun avec son débit signé), visas et, après sa note,
 * Taux de dématérialisation.
```

par :

```tsx
 * révélée, Conformité. Acte II : budget, formulaires (chacun avec son débit signé), usagers qui ont une démarche
 * en cours et, après sa note, Taux de dématérialisation (le nombre de visas en attente est sur la fiche Visa de
 * la bulle).
```

La colonne garde `declencheur={verdict?.id}` et `effet="baisse"` : un visa qui remet une carte fait partir un usager.

- [ ] **Step 4: Le relevé**

`components/direction/ReleveProduction.tsx` :

```tsx
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useGameState,
  type Encre,
  type LigneProduction,
} from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import ValeurAnimee from '@/components/charte/ValeurAnimee';
import { Effets } from '@/components/atelier/Elements';

interface BlocProps {
  ligne: LigneProduction;
  compact: boolean;
  premier: boolean;
  declencheur: number | null | undefined;
  encre: Encre;
}

/** Une procédure du relevé : demandes et délivrés, puis valeur et abandons, puis la destination s'il y en a une. */
const Bloc = memo(function Bloc({
  ligne,
  compact,
  premier,
  declencheur,
  encre,
}: BlocProps) {
  const lecture = [
    ligne.demandesTexte,
    ligne.delivresTexte,
    ...(ligne.valeur ?? []).map((e) => e.texte),
    ...(ligne.versUsagers ? ['vers les usagers'] : []),
  ].join(', ');
  return (
    <View
      style={[styles.bloc, !premier && styles.blocSuivant]}
      accessible
      accessibilityLabel={`${ligne.nom} : ${lecture}`}
    >
      <View style={styles.ligne}>
        <Text style={styles.nom} numberOfLines={1}>
          {ligne.nom}
        </Text>
        <Text style={styles.nombre}>{formatEntier(ligne.demandes)}</Text>
        <Text style={styles.chiffres}>{ligne.demandesMot} ·</Text>
        <ValeurAnimee
          texte={formatEntier(ligne.delivres)}
          declencheur={declencheur}
          effet="saut"
          style={styles.nombre}
          numberOfLines={1}
        />
        <Text style={styles.chiffres}>{ligne.delivresMot}</Text>
      </View>
      {!compact && ligne.valeur && <Effets effets={ligne.valeur} />}
      {!compact && ligne.versUsagers && (
        <Text style={[styles.destination, { color: encre.texte }]}>
          → usagers
        </Text>
      )}
    </View>
  );
});

/**
 * Relevé « Production du service » (acte II) : ce que chaque procédure ouverte délivre. Sur l'écran Direction
 * (sous la bulle) et au pied de l'Atelier. Les documents remis à des usagers portent « → usagers » ; ceux
 * délivrés pour les dossiers du service n'ont aucune destination. Sur l'écran Direction, en écran compact ou
 * dès trois procédures ouvertes, une ligne par procédure (la scène garde sa place) ; l'Atelier défile et
 * montre tout.
 */
export default function ReleveProduction({
  compact = false,
  atelier = false,
}: {
  compact?: boolean;
  /** Au pied de l'Atelier : sans retrait (l'écran a déjà ses marges), jamais condensé. */
  atelier?: boolean;
}) {
  const { production, verdict, encre } = useGameState();
  if (!production || production.length === 0) return null;
  const condense = !atelier && (compact || production.length > 2);
  return (
    <View style={!atelier && styles.cadre}>
      <Panneau
        contenuStyle={[styles.carte, condense && styles.carteCompacte]}
        rayon={Charte.rayonPetit}
      >
        {!condense && <Text style={styles.titre}>Production du service</Text>}
        {production.map((l, i) => (
          <Bloc
            key={l.id}
            ligne={l}
            compact={condense}
            premier={i === 0}
            declencheur={verdict?.id}
            encre={encre}
          />
        ))}
      </Panneau>
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    paddingHorizontal: Espace.l,
  },
  carte: {
    backgroundColor: Colors.papierChaud,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
    gap: Espace.xs,
  },
  carteCompacte: {
    paddingVertical: Espace.xs,
    gap: 0,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  bloc: {
    gap: 2,
  },
  /** Trait pointillé entre deux procédures. */
  blocSuivant: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: Colors.crayonClair,
    paddingTop: Espace.xs,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: Espace.xs,
  },
  nom: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
  chiffres: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  nombre: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
  destination: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
  },
});
```

`gap: 2` est un écart de filet (1 – 3 pt permis par la charte). Le relevé ne porte que des nombres et des mots : aucune définition de compteur, aucune phrase d'explication.

- [ ] **Step 5: Sous la bulle**

Remplacer tout le contenu de `components/direction/EcranDirection.tsx` par :

```tsx
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Colors, { Espace } from '@/constants/Colors';
import Hud from '@/components/Hud';
import CurseurRejet from '@/components/CurseurRejet';
import BoutonTamponner from '@/components/BoutonTamponner';
import BulleDirection from '@/components/direction/BulleDirection';
import ReleveProduction from '@/components/direction/ReleveProduction';
import SceneDirection from '@/components/direction/SceneDirection';
import CurseurExemplaires from '@/components/direction/CurseurExemplaires';

/**
 * Écran Direction (acte II), même structure que le guichet, sans défilement : ressources, demande à viser,
 * relevé « Production du service », scène du bureau du chef (toute la place restante), curseurs, TAMPONNER.
 */
export default function EcranDirection() {
  // Petit écran : bulle sur une ligne, la hauteur va à la scène.
  const compact = useWindowDimensions().height < 720;
  return (
    <View style={styles.ecran}>
      <Hud />
      <BulleDirection compact={compact} />
      <ReleveProduction compact={compact} />
      <View style={styles.zoneScene}>
        <SceneDirection />
      </View>
      <CurseurRejet />
      <CurseurExemplaires />
      <BoutonTamponner />
    </View>
  );
}

const styles = StyleSheet.create({
  zoneScene: {
    flex: 1,
    minHeight: 0,
    marginTop: Espace.s,
  },
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
});
```

- [ ] **Step 6: Vérifier**

Run: `npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 188`, `ℹ fail 0` ; tsc et lint sans erreur.

Navigateur (procédure « Vérifier dans le navigateur ») :
1. 375 × 812, préréglage `compliquer` : en-tête « Budget · Formulaires · Usagers » (plus de colonne Visas ; Usagers ≈ 52). Sous la bulle, panneau « Production du service » : « Carte d’identité  52 demandes · 2 000 délivrées » au chargement (nombres en chiffres gras), puces « +4,47 € la carte » (fond vert) et « 600 abandons » (fond rose), « → usagers » en bleu ; trait pointillé ; « Justificatif de domicile  0 demande · 0 délivré », sans puce ni destination. Taper TAMPONNER : le nombre de cartes délivrées saute et augmente.
2. Atelier → Carte d’identité → ajouter une Signature, revenir sur Direction : « +X € la carte » augmente ; les abandons montent plus vite.
3. Préréglage `boucle` : la ligne Carte d’identité n'a plus « → usagers » ; la colonne Usagers baisse en quelques minutes (impatience et exode).
4. Préréglage `demat` (quatre colonnes) : la colonne Démat. garde sa jauge ; trois procédures ou plus : le relevé est condensé (une ligne par procédure, sans titre ni puces).
5. 375 × 667, préréglage `compliquer` : relevé condensé, TAMPONNER visible sans défilement, la scène garde de la hauteur.
6. `find` « Carte d’identité : » : libellé de la forme « Carte d’identité : 52 demandes, 2 000 délivrées, +4,47 € la carte, 600 abandons, vers les usagers » (les nombres ont bougé depuis le chargement). Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 7: Commiter**

```bash
git add data/acte2/vues.ts components/Hud.tsx components/direction/ReleveProduction.tsx components/direction/EcranDirection.tsx scripts/tests/vues-acte2.test.ts
git commit -m "feat(ui): colonne Usagers et relevé de la production du service sur l'écran Direction

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Bulle — la demande d'une personne, puis une demande anonyme, jusqu'à « Délivrée »

**Files:**
- Modify: `data/usagers.ts` (`tirage`, `demandeur`)
- Modify: `data/acte2/vues.ts` (`ParapheurAffiche`, `numeroRegistre`, `VueDirection.delivrance`, `vueDirection`)
- Modify: `components/direction/BulleDirection.tsx`
- Modify: `scripts/tests/vues-acte2.test.ts`

**Interfaces:**
- Consumes: `PROCS_DEMANDEES` ; `documentDe` (Tâche 4) ; `stats.delivresUsagers` / `delivresService` ; `direction` (contexte).
- Produces: `tirage(numero): number` dans [0, 1) et `demandeur(numero): string` (« Mme Lefèvre », « M. Diallo ») ; `ParapheurAffiche = { numero; proc; procNom; demandeur: string | null; titre: string }` (`sansUsager` disparaît) ; `numeroRegistre(n)` (« 048 », « 9 907 ») ; `VueDirection.delivrance: { nom: 'Délivrée' | 'Délivré'; faite: boolean }` ; la bulle affiche `parapheur.titre`, le détail « Visa du chef de service », la chaîne terminée par la fiche « Délivrée » (carte d'identité) ; plus de « Salle d’attente vide », plus de « Dossier sans usager », plus de pointe.

- [ ] **Step 1: Les tests (ils échouent)**

Dans `scripts/tests/vues-acte2.test.ts`, remplacer :

```ts
import { BALANCE2 } from '../../constants/balanceActe2';
```

par :

```ts
import { BALANCE2 } from '../../constants/balanceActe2';
import { formatEntier } from '../../utils/formatters';
```

remplacer :

```ts
  assert.deepEqual(d.parapheur, {
    numero: V.PREMIER_PARAPHEUR,
    proc: 'identite',
    procNom: 'Carte d’identité',
    sansUsager: false,
  });
```

par :

```ts
  // Seuls des usagers attendent : le parapheur est la demande d'une personne.
  assert.equal(d.parapheur?.numero, V.PREMIER_PARAPHEUR);
  assert.equal(d.parapheur?.proc, 'identite');
  assert.match(d.parapheur?.demandeur ?? '', /^(Mme|M\.) \S/);
  assert.equal(d.parapheur?.titre, `${d.parapheur?.demandeur} demande une Carte d’identité`);
  assert.deepEqual(d.delivrance, { nom: 'Délivrée', faite: false });
```

remplacer :

```ts
test('parapheur sans usager quand les dossiers en boucle dominent le visa', () => {
  const b = base2();
  const s = avec2(b, {
    usagers: { ...x(b).usagers, identite: [0, 2] },
    boucles: { ...x(b).boucles, identite: [0, 10] },
  });
  assert.equal(vue(s).parapheur?.sansUsager, true);
  assert.equal(vue(s).visas, 12);
});
```

par :

```ts
test('parapheur sans usager : une demande anonyme, numérotée', () => {
  const b = base2();
  const s = avec2(b, {
    usagers: { ...x(b).usagers, identite: [0, 0] },
    boucles: { ...x(b).boucles, identite: [0, 10] },
    suites: { ...x(b).suites, identite: [0, 2] },
  });
  assert.equal(vue(s).parapheur?.demandeur, null);
  assert.equal(vue(s).parapheur?.titre, 'Demande n° 048 · Carte d’identité');
  assert.equal(vue(s).visas, 12);
  const loin = avec2(s, { stats: { ...x(s).stats, visasTampons: 9_859 } });
  assert.equal(vue(loin).parapheur?.titre, `Demande n° ${formatEntier(9_907)} · Carte d’identité`);
});

test('parapheur : la part des dossiers d’usagers au visa décide, numéro par numéro', () => {
  const b = base2();
  // Un usager sur deux au visa : sur 200 parapheurs successifs, environ la moitié portent un nom.
  let noms = 0;
  for (let i = 0; i < 200; i++) {
    const s = avec2(b, {
      usagers: { ...x(b).usagers, identite: [0, 5] },
      boucles: { ...x(b).boucles, identite: [0, 5] },
      stats: { ...x(b).stats, visasTampons: i },
    });
    if (vue(s).parapheur?.demandeur) noms++;
  }
  assert.ok(noms > 70 && noms < 130, `${noms} parapheurs nommés sur 200`);
});
```

puis ajouter à la fin du fichier :

```ts

test('bulle : la chaîne se termine par « Délivrée », faite dès la première carte', () => {
  const s = base2();
  assert.deepEqual(vue(s).delivrance, { nom: 'Délivrée', faite: false });
  const u = avec2(s, {
    stats: { ...x(s).stats, delivresUsagers: { ...x(s).stats.delivresUsagers, identite: 1 } },
  });
  assert.deepEqual(vue(u).delivrance, { nom: 'Délivrée', faite: true });
});
```

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/vues-acte2.test.ts`
Expected: FAIL — `demandeur`, `titre` et `delivrance` valent `undefined`.

- [ ] **Step 2: Le nom de l'usager**

Dans `data/usagers.ts`, remplacer :

```ts
/** Usager correspondant au numéro `numero`, avec une patience donnée. */
```

par :

```ts
/** Tirage stable dans [0, 1) pour un numéro (acte II : le parapheur a-t-il un usager ?). */
export function tirage(numero: number): number {
  return h(numero, 7) / 4294967296;
}

/** Civilité et nom de l'usager d'un parapheur de l'acte II (« Mme Lefèvre », « M. Diallo »). */
export function demandeur(numero: number): string {
  const civilite = h(numero, 8) % 2 === 0 ? 'Mme' : 'M.';
  return `${civilite} ${NOMS[h(numero, 2) % NOMS.length]}`;
}

/** Usager correspondant au numéro `numero`, avec une patience donnée. */
```

- [ ] **Step 3: La vue de la bulle**

Dans `data/acte2/vues.ts`, remplacer :

```ts
import { AGENTS2 } from '../../constants/balanceActe2';
```

par :

```ts
import { AGENTS2, PROCS_DEMANDEES } from '../../constants/balanceActe2';
import { formatEntier } from '../../utils/formatters';
import { demandeur, tirage } from '../usagers';
import { documentDe } from './production';
```

remplacer :

```ts
  procNom: string;
  /** La plupart des dossiers de ce visa n'ont plus d'usager. */
  sansUsager: boolean;
}
```

par :

```ts
  procNom: string;
  /** L'usager qui attend ce document (« Mme Lefèvre »), null pour une demande sans usager. */
  demandeur: string | null;
  /** « Mme Lefèvre demande une Carte d’identité », ou « Demande n° 9 907 · Carte d’identité ». */
  titre: string;
}

/** Numéro sur trois chiffres au moins, comme un registre (« 048 », puis « 9 412 »). */
export const numeroRegistre = (n: number): string =>
  n < 1000 ? n.toString().padStart(3, '0') : formatEntier(n);
```

remplacer :

```ts
  /** Étapes de la procédure du parapheur (Carte d'identité s'il n'y en a pas). */
  etapes: EtapeChaine[];
```

par :

```ts
  /** Étapes de la procédure du parapheur (Carte d'identité s'il n'y en a pas). */
  etapes: EtapeChaine[];
  /** Fiche qui clôt la chaîne : « Délivrée » (accordé au document), faite dès le premier document délivré. */
  delivrance: { nom: string; faite: boolean };
```

remplacer :

```ts
  const usagers = Math.floor(usagersAvecDemarche(x));
```

par :

```ts
  const usagers = Math.floor(usagersAvecDemarche(x));
  const noms = s.reformes.denomination.procedures;
  const doc = documentDe(noms[p]);
  let parapheur: ParapheurAffiche | null = null;
  if (tete) {
    // Un usager attend ce parapheur selon la part des dossiers d'usagers à ce visa (tirage stable par numéro),
    // et seulement dans une procédure que les usagers demandent.
    const avecUsager =
      PROCS_DEMANDEES.includes(tete.p) &&
      tirage(numero) < tete.u / (tete.u + tete.b);
    const nom = noms[tete.p];
    const qui = avecUsager ? demandeur(numero) : null;
    parapheur = {
      numero,
      proc: tete.p,
      procNom: nom,
      demandeur: qui,
      titre: qui
        ? `${qui} demande ${documentDe(nom).feminin ? 'une' : 'un'} ${nom}`
        : `Demande n° ${numeroRegistre(numero)} · ${nom}`,
    };
  }
```

et remplacer :

```ts
    parapheur: tete
      ? {
          numero,
          proc: tete.p,
          procNom: s.reformes.denomination.procedures[tete.p],
          sansUsager: tete.b > tete.u,
        }
      : null,
    etapes: tableauCirculation(x, p),
```

par :

```ts
    parapheur,
    etapes: tableauCirculation(x, p),
    delivrance: {
      nom: doc.feminin ? 'Délivrée' : 'Délivré',
      faite: x.stats.delivresUsagers[p] + x.stats.delivresService[p] >= 1,
    },
```

`data/usagers.ts` n'importe que des types de `types/game.ts` : `vues.ts` peut l'importer sans cycle.

- [ ] **Step 4: La bulle**

Remplacer tout le contenu de `components/direction/BulleDirection.tsx` par :

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IdCard, Landmark, Paperclip, Stamp } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';

/**
 * Bulle de l'écran Direction : la demande que le prochain coup vise (« Mme Lefèvre demande une Carte d’identité »,
 * ou « Demande n° 9 907 · Carte d’identité » quand personne ne l'attend), et le tableau de circulation de sa
 * procédure, en fiches reliées par des trombones, jusqu'à la fiche « Délivrée ». Chaque fiche porte qui la traite
 * (guichet ou tampon) et les dossiers qui y attendent ; les visas en attente s'allument (fond d'encre) ; la plus
 * encombrée a un bord épais ; « Délivrée » passe en gras sur fond vert dès le premier document (jamais la seule
 * couleur).
 */
export default function BulleDirection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { direction, encre } = useGameState();
  if (!direction) return null;
  const { parapheur, etapes, delivrance } = direction;

  const titre = parapheur ? parapheur.titre : 'Aucun parapheur à viser';
  const detail = parapheur ? 'Visa du chef de service' : null;
  const chaine = etapes
    .map(
      (e) =>
        `${e.nom}, ${formatEntier(e.attente)} en attente, ${
          e.traitePar === 'visa'
            ? 'visée par vous et vos agents'
            : 'traitée par les guichets'
        }${e.encombree ? ', la plus encombrée' : ''}`,
    )
    .concat(delivrance.nom)
    .join(' ; ');

  return (
    <View style={[styles.zone, compact && styles.zoneCompacte]}>
      <View
        style={[styles.bulle, compact && styles.bulleCompacte]}
        accessible
        accessibilityLabel={`${titre}.${detail ? ` ${detail}.` : ''} Procédure : ${chaine}.`}
      >
        <Text style={styles.titre} numberOfLines={compact ? 1 : 2}>
          {titre}
        </Text>
        {detail && !compact && (
          <Text style={styles.detail} numberOfLines={1}>
            {detail}
          </Text>
        )}
        {!compact && (
          <View style={styles.chaine}>
            {etapes.map((e, i) => (
              <React.Fragment key={`${e.type}-${i}`}>
                {i > 0 && <Paperclip size={12} color={Colors.crayon} />}
                <View
                  style={[
                    styles.fiche,
                    e.encombree && styles.ficheEncombree,
                    e.allumee && { backgroundColor: encre.face },
                  ]}
                >
                  {e.traitePar === 'visa' ? (
                    <Stamp size={12} color={Colors.anthracite} />
                  ) : (
                    <Landmark size={12} color={Colors.anthracite} />
                  )}
                  <Text
                    style={[
                      styles.ficheTexte,
                      e.allumee && styles.ficheAllumee,
                    ]}
                    numberOfLines={1}
                  >
                    {e.nom}
                  </Text>
                  <Text
                    style={[
                      styles.ficheNombre,
                      e.encombree && styles.ficheNombreEncombre,
                    ]}
                    numberOfLines={1}
                  >
                    {formatEntier(e.attente)}
                  </Text>
                </View>
              </React.Fragment>
            ))}
            <Paperclip size={12} color={Colors.crayon} />
            <View
              style={[
                styles.fiche,
                delivrance.faite && styles.ficheDelivree,
              ]}
            >
              <IdCard size={12} color={Colors.anthracite} />
              <Text
                style={[
                  styles.ficheTexte,
                  delivrance.faite && styles.ficheAllumee,
                ]}
                numberOfLines={1}
              >
                {delivrance.nom}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: Espace.l,
    paddingTop: Espace.s,
    paddingBottom: Espace.s,
  },
  zoneCompacte: {
    paddingTop: Espace.xs,
    paddingBottom: Espace.xs,
  },
  bulle: {
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
    gap: 2,
  },
  bulleCompacte: {
    paddingVertical: Espace.xs,
  },
  titre: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  detail: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.crayon,
  },
  chaine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Espace.xs,
    marginTop: Espace.xs,
  },
  fiche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.xs,
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    paddingHorizontal: Espace.xs,
    backgroundColor: Colors.papierChaud,
  },
  ficheTexte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.anthracite,
  },
  ficheAllumee: {
    fontFamily: Fonts.texteGras,
  },
  /** La fiche la plus encombrée : bord épais, en plus du chiffre. */
  ficheEncombree: {
    borderWidth: Charte.trait,
  },
  ficheNombre: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.anthracite,
  },
  ficheNombreEncombre: {
    fontFamily: Fonts.chiffres,
  },
  /** « Délivrée » : bord moyen et fond vert, en plus du texte gras. */
  ficheDelivree: {
    borderWidth: Charte.traitFin,
    backgroundColor: Colors.pastelVert,
  },
});
```

Le titre tient sur deux lignes au plus (« Mme Lefèvre demande une Carte d’identité »), une seule en écran compact ; sans pointe, la bulle ne désigne plus la scène (le relevé est dessous).

- [ ] **Step 5: Vérifier**

Run: `npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 190`, `ℹ fail 0` ; tsc et lint sans erreur.

Navigateur (procédure « Vérifier dans le navigateur ») :
1. 375 × 812, préréglage `debut` : bulle « Mme … demande une Carte d’identité » (ou « M. … »), « Visa du chef de service », chaîne `[guichet] Pièce 20 · [tampon] Visa 12 · [carte] Délivrée` ; la fiche « Délivrée » est neutre. Taper TAMPONNER : la fiche « Délivrée » passe en gras sur fond vert (première carte), le nom change à chaque coup.
2. Préréglage `avantBoucle`, puis la boucle formée comme à la Tâche 7 (étape 3) : en une minute, les titres deviennent « Demande n° 048 · Carte d’identité » de plus en plus souvent, puis toujours ; la chaîne montre « Pièce de service » et un Visa toujours alimenté ; « → usagers » a disparu du relevé.
3. 375 × 667 : titre sur une ligne, sans chaîne. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 6: Commiter**

```bash
git add data/usagers.ts data/acte2/vues.ts components/direction/BulleDirection.tsx scripts/tests/vues-acte2.test.ts
git commit -m "feat(ui): la bulle présente la demande d'un usager, puis une demande anonyme, jusqu'à sa délivrance

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Atelier — demandes et délivrés en tête, relevé au pied

**Files:**
- Modify: `data/acte2/vueAtelier.ts` (`ProcAtelier.enCours`, `abandons` retirés)
- Modify: `components/atelier/BilanProcedure.tsx`
- Modify: `components/atelier/EcranAtelier.tsx`
- Modify: `scripts/tests/atelier-acte2.test.ts`

**Interfaces:**
- Consumes: `production` (contexte, Tâche 8) ; `ReleveProduction` (Tâche 9) ; `ProcAtelier.bilan`.
- Produces: `ProcAtelier` sans `enCours` ni `abandons` ; `BilanProcedure({ proc, ligne })` affiche « N demandes · M délivrés » (ligne de la procédure dans le relevé) puis « Par dossier » ; le relevé complet au pied de l'Atelier (`<ReleveProduction atelier />`).

- [ ] **Step 1: Retirer les anciens compteurs de la vue**

Dans `scripts/tests/atelier-acte2.test.ts`, remplacer :

```ts
test('Atelier : dossiers en cours, abandons et bilan d’un dossier sur la procédure', () => {
```

par :

```ts
test('Atelier : bilan d’un dossier sur la procédure', () => {
```

et remplacer :

```ts
  const p = (A.vueAtelier(s, 0) as A.VueAtelier).procedures[0];
  assert.equal(p.enCours, 10);
  assert.equal(p.abandons, 7);
```

par :

```ts
  const p = (A.vueAtelier(s, 0) as A.VueAtelier).procedures[0];
```

Dans `data/acte2/vueAtelier.ts`, remplacer :

```ts
  nom: string;
  /** Dossiers en cours dans la procédure (usagers et sans usager). */
  enCours: number;
  /** Usagers perdus dans la procédure (patience et rejet). */
  abandons: number;
  /** Bilan
```

par :

```ts
  nom: string;
  /** Bilan
```

et remplacer :

```ts
        enCours: Math.floor(
          x.usagers[p].reduce((a, v) => a + v, 0) +
            x.boucles[p].reduce((a, v) => a + v, 0) +
            x.suites[p].reduce((a, v) => a + v, 0),
        ),
        abandons: Math.floor(x.stats.abandonsProc[p]),
```

par rien : supprimer ces six lignes (les demandes et les abandons sont au relevé).

- [ ] **Step 2: L'en-tête d'une procédure**

Remplacer tout le contenu de `components/atelier/BilanProcedure.tsx` par :

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  LigneProduction,
  ProcAtelier,
} from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import { Effets } from '@/components/atelier/Elements';

/**
 * En-tête d'une procédure de l'Atelier : ses demandes et ses documents délivrés (relevé « Production du
 * service »), puis le bilan d'un dossier qui la franchit en entier (symbole + mot, la couleur ne fait que
 * doubler l'information).
 */
export default function BilanProcedure({
  proc,
  ligne,
}: {
  proc: ProcAtelier;
  ligne: LigneProduction | undefined;
}) {
  const compteurs = ligne
    ? `${ligne.demandesTexte} · ${ligne.delivresTexte}`
    : '';
  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayonPetit}>
      <View
        accessible
        accessibilityLabel={`${proc.nom} : ${compteurs}. Par dossier : ${proc.bilan
          .map((e) => e.texte)
          .join(', ')}.`}
      >
        <Text style={styles.compteurs}>{compteurs}</Text>
        <View style={styles.ligne}>
          <Text style={styles.libelle}>Par dossier</Text>
          <Effets effets={proc.bilan} />
        </View>
      </View>
    </Panneau>
  );
}

const styles = StyleSheet.create({
  carte: {
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
    backgroundColor: Colors.papierChaud,
  },
  compteurs: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  ligne: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: Espace.s,
  },
  libelle: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
    marginTop: Espace.xs,
  },
});
```

- [ ] **Step 3: L'écran de l'Atelier**

Dans `components/atelier/EcranAtelier.tsx`, remplacer :

```tsx
import BilanProcedure from '@/components/atelier/BilanProcedure';
```

par :

```tsx
import BilanProcedure from '@/components/atelier/BilanProcedure';
import ReleveProduction from '@/components/direction/ReleveProduction';
```

remplacer :

```tsx
 * Atelier des procédures (acte II) : une procédure par écran, son bilan, ses étapes en fiches reliées par des trombones.
```

par :

```tsx
 * Atelier des procédures (acte II) : une procédure par écran, ses demandes et documents délivrés, son bilan, ses
 * étapes en fiches reliées par des trombones, et au pied le relevé « Production du service ».
```

remplacer :

```tsx
  const { atelier, modifierProcedure, encre } = useGameState();
```

par :

```tsx
  const { atelier, production, modifierProcedure, encre } = useGameState();
```

remplacer :

```tsx
        <BilanProcedure proc={proc} />
```

par :

```tsx
        <BilanProcedure
          proc={proc}
          ligne={production?.find((l) => l.id === proc.id)}
        />
```

et remplacer :

```tsx
            + Ajouter une étape · {n} / {atelier.etapesMax}
          </Text>
        </Pressable>
      </ScrollView>
```

par :

```tsx
            + Ajouter une étape · {n} / {atelier.etapesMax}
          </Text>
        </Pressable>
        <ReleveProduction atelier />
      </ScrollView>
```

- [ ] **Step 4: Vérifier**

Run: `npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 190`, `ℹ fail 0` ; tsc et lint sans erreur.

Navigateur (procédure « Vérifier dans le navigateur »), 375 × 812 :
1. Préréglage `compliquer`, onglet Atelier : en tête « 52 demandes · 2 000 délivrées » (au chargement), puis « Par dossier » « +4,47 € » — la même valeur que « +4,47 € la carte » du relevé ; onglet « Justificatif de domicile » : « 0 demande · 0 délivré » (moment 3).
2. Défiler jusqu'au pied : le relevé complet « Production du service » (titre, puces, « → usagers »), sans retrait supplémentaire, aucun nom tronqué.
3. Préréglage `avantBoucle`, onglet Justificatif : « 26 demandes · 150 délivrés » ; ajouter la pièce de service qui exige la Carte : la carte « Carte d’identité ⇄ Justificatif de domicile » apparaît, puis au pied « → usagers » disparaît de la Carte d'identité.
4. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 5: Commiter**

```bash
git add data/acte2/vueAtelier.ts components/atelier/BilanProcedure.tsx components/atelier/EcranAtelier.tsx scripts/tests/atelier-acte2.test.ts
git commit -m "feat(ui): demandes et documents délivrés en tête de l'Atelier, relevé au pied

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Mesures de la spec 009, CLAUDE.md et vérification d'ensemble

**Files:**
- Modify: `specs/009-acte2-direction/spec.md` (section « Mesures du robot »)
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: les mesures de la Tâche 5 ; tout le travail des Tâches 1 à 11.
- Produces: documentation à jour (relevé, colonne Usagers, procédures demandées, dossiers qui poursuivent, impatience et exode, raccourcis).

- [ ] **Step 1: La spec 009**

Dans `specs/009-acte2-direction/spec.md`, remplacer :

```markdown
| Premier agent | 2.2 | 2.0 | 2.2 |
| Atelier | 9.0 | 8.7 | 8.6 |
| Marché public de fournitures (specs/010) | 17.3 | 16.0 | 15.2 |
| Première boucle | 27.7 | 26.4 | 25.9 |
| Dématérialisation 50 % | 99.5 | 96.8 | 95.8 |
| Dématérialisation 100 % | 196.0 | 191.8 | 190.2 |
```

par :

```markdown
| Premier agent | 2.2 | 2.0 | 2.2 |
| Atelier | 9.4 | 8.9 | 8.6 |
| Marché public de fournitures (specs/010) | 17.7 | 16.1 | 15.3 |
| Première boucle | 31.3 | 30.0 | 27.6 |
| Dématérialisation 50 % | 91.9 | 89.2 | 85.3 |
| Dématérialisation 100 % | 196.9 | 192.3 | 187.0 |

Depuis specs/011 (ce que le service délivre) : seule la Carte d'identité reçoit des demandes ; le dossier qui franchit une pièce de service poursuit sa procédure jusqu'à la délivrance ; les usagers qui attendent s'impatientent (0,2 %/s) et, une fois qu'aucune procédure demandée n'aboutit, la ville ne se repeuple plus et se vide (1 %/s des habitants sans démarche) ; la cible de dématérialisation passe à 68 000 points. 10 min après la première boucle, il reste 9 usagers en cours (0,9 à 1,4 % de leur maximum) et 1 625 à 1 667 documents ont été délivrés au service, aucun aux usagers ; en cumul, le service passe devant les usagers vers 57 – 60 min.
```

remplacer :

```markdown
Avec une Réforme (2 taps/s, `balayage`) : rentable de 0 à 70 % de dématérialisation (fin de l'acte entre 124.5 et 179.8 min contre 191.7), pas à 80 % (198.3) ; l'acte I est rejoué en 18 à 22 min ; la plus petite Réforme rapporte 6 trombones.

Le robot construit la boucle dès que l'étape est disponible. Avec 15 min de compréhension de la note n° 8 et une Réforme dès son déblocage (`node scripts/simulate-acte2.ts 2 300 0 15`) : Réforme débloquée à 41.4 min, acte I rejoué à 63.1 min, fin de l'acte à 130.7 min.
```

par :

```markdown
Avec une Réforme (2 taps/s, `balayage`) : rentable de 0 à 80 % de dématérialisation (fin de l'acte entre 111.7 et 187.0 min contre 192.2) ; l'acte I est rejoué en 18 à 22 min ; la plus petite Réforme rapporte 7 trombones.

Le robot construit la boucle dès que l'étape est disponible. Avec 15 min de compréhension de la note n° 8 et une Réforme dès son déblocage (`node scripts/simulate-acte2.ts 2 300 0 15`) : Réforme débloquée à 45.0 min, acte I rejoué à 66.6 min, fin de l'acte à 117.3 min.
```

et, dans le paragraphe « Cible du robot pour 100 % sans Réforme », remplacer `(mesuré : 190.2 à 196.0)` par `(mesuré : 187.0 à 196.9)` et `(96.8 min à 2 taps/s` par `(89.2 min à 2 taps/s`.

- [ ] **Step 2: CLAUDE.md**

Dans `CLAUDE.md`, à la fin du premier paragraphe de « Project Overview », remplacer :

```markdown
note n° 6 « Marché public de fournitures » unlocks the Service des achats (automatic ramettes below 30 s of capacity, also offline, switch in the Service tab).
```

par :

```markdown
note n° 6 « Marché public de fournitures » unlocks the Service des achats (automatic ramettes below 30 s of capacity, also offline, switch in the Service tab). Act II shows what the service delivers (spec: `specs/011-acte2-decouverte/spec.md`, storyboard `specs/011-acte2-decouverte/storyboard.html`): only the Carte d'identité gets spontaneous demand (`PROCS_DEMANDEES`); every delivered document is counted (`stats.delivresUsagers` / `delivresService`); a dossier crossing a « Pièce délivrée par nos services » step deposits its linked request and goes on to the end of its own procedure in a third stock, `suites` (it never deposits again, so `boucles` stays one dossier per usager who entered the loop); usagers who wait grow impatient (`BALANCE2.impatience`) and, once no demanded procedure can deliver to an usager (`aboutitPourUsagers`), nobody settles and the town empties (`BALANCE2.exode`). The Direction screen and the Atelier show a « Production du service » statement (`data/acte2/production.ts`, `components/direction/ReleveProduction.tsx`): demandes, documents délivrés, « +X € la carte » and abandons for the Carte d'identité, « → usagers » only while documents still go to usagers; the bubble shows « Mme Lefèvre demande une Carte d’identité » ending in a « Délivrée » chip, then anonymous « Demande n° … » requests.
```

remplacer :

```markdown
(presets of data/presets.ts: acte1Debut, acte1Milieu, finActeI, debut, atelier, achats, boucle, demat, fin, reforme, cerfa2)
```

par :

```markdown
(presets of data/presets.ts: acte1Debut, acte1Milieu, finActeI, debut, atelier, compliquer, achats, pieceService, avantBoucle, boucle, demat, fin, reforme, cerfa2)
```

remplacer :

```markdown
`reglerAchats` (Service des achats switch).
```

par :

```markdown
`reglerAchats` (Service des achats switch), `production` (« Production du service » lines, one per open procedure).
```

remplacer :

```markdown
| `data/acte2/debits.ts` | Header rates: event flows, cost of a formulaire bought by the Service des achats, exponential smoothing |
```

par :

```markdown
| `data/acte2/debits.ts` | Header rates: event flows, cost of a formulaire bought by the Service des achats, exponential smoothing |
| `data/acte2/production.ts` | What the service delivers: each procedure's document (article, gender), value of a document, « Production du service » lines |
```

et remplacer :

```markdown
(tab « Direction »: resources Budget, Formulaires, Visas, then Démat.; bubble with the parapheur and its procedure as a circulation table (dossiers waiting at each step, guichet or stamp pictogram, thick border on the most loaded step); `MoteurDirection` scene;
```

par :

```markdown
(tab « Direction »: resources Budget, Formulaires, Usagers (usagers with a démarche in progress), then Démat.; bubble with the request (an usager's name, or « Demande n° … » without usager) and its procedure as a circulation table (dossiers waiting at each step, guichet or stamp pictogram, thick border on the most loaded step) ending in a « Délivrée » chip; the « Production du service » statement (one line per procedure when compact or from three procedures); `MoteurDirection` scene;
```

- [ ] **Step 3: Vérification d'ensemble**

Run: `npm test 2>&1 | tail -8 && ./node_modules/.bin/tsc --noEmit -p . && npm run lint && node scripts/simulate-acte2.ts 2 300 | tail -8`
Expected: `ℹ pass 190`, `ℹ fail 0` ; tsc et lint sans erreur ; le simulateur finit par « critère tenu » et les deux lignes prudent / agressif (Tâche 5).

Navigateur (procédure « Vérifier dans le navigateur »), à 375 × 812 puis 375 × 667, les moments de la planche :
1. `debut` (moment 0 – 1) : « Mme … demande une Carte d’identité », TAMPONNER → la fiche « Délivrée » passe au vert, le relevé compte les cartes délivrées, « → usagers ».
2. `compliquer` (moment 2 – 3) : ajouter une Signature à la Carte : « +X € la carte » monte, les abandons montent ; le Justificatif reste à « 0 demande · 0 délivré ».
3. `pieceService` (moment 4) : ajouter à la Carte une pièce de service qui exige le Justificatif : le Justificatif se remplit (« N demandes · M délivrés », sans destination), la Carte garde « → usagers ».
4. `avantBoucle` (moment 5) : faire exiger la Carte au Justificatif : « → usagers » disparaît, la bulle passe aux « Demande n° … », la colonne Usagers tombe vers quelques unités en une dizaine de minutes, le Visa reste alimenté et la Carte continue d'être délivrée.
5. `demat` (moment 6) : quatre colonnes avec Démat., relevé condensé, Usagers proche de 0.
6. Console sans erreur à chaque préréglage ; revenir au preset `desktop`.

- [ ] **Step 4: Commiter**

```bash
git add specs/009-acte2-direction/spec.md CLAUDE.md
git commit -m "docs: ce que le service délivre, mesures du robot et documentation de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-review (spec 011 et planche)

| Spec / planche | Où |
|---|---|
| § 1 Relevé « Production du service » (Direction sous la bulle, Atelier en tête de procédure) : « N demandes · M délivrées », « +X € la carte » accordé, « K abandons » | Tâches 4, 9, 11 (en tête de l'Atelier : demandes et délivrés ; valeur et abandons au relevé du pied — question 5) |
| § 1 « → usagers » seulement pour les documents remis à des usagers, rien pour le service ; mots + chiffres | Tâche 4 (`versUsagers`), Tâche 9 (flèche + mot, nombres en chiffres, puces symbole + mot) |
| § 2 Demande d'une personne, noms d'une liste, chaîne finie par « Délivrée » ; « Demande n° 9 907 · Carte d’identité » sans autre mention | Tâche 10 (« Salle d’attente vide » et « Dossier sans usager » supprimés) |
| § 3 HUD Budget · Formulaires · Usagers (+ Démat. à sa note) ; Visas quitte l'en-tête mais reste sur la fiche Visa | Tâche 9 |
| § 4 Tableau de circulation, débits, « en attente de réglementation », service des achats conservés ; fiche à trois lignes + Agents + Service des achats | Tâches 6, 10 (tableau inchangé, fiche « Délivrée » ajoutée) |
| § 5 Seule la Carte d'identité est demandée | Tâche 2 (`PROCS_DEMANDEES`) ; conséquences mesurées (Tâche 5) : jalons de la spec 009 tenus, préréglage `achats` sans usager au Justificatif (Tâche 7) |
| § 6 Compteurs par procédure (usagers / service), migration | Tâches 1, 2 |
| § 7 Valeur d'un document par `data/` | Tâche 4 (`valeurDocument`, partagée avec le bilan de l'Atelier) |
| § 8 Le Visa reste alimenté ; un seul dossier en boucle par usager ; conservation | Tâche 2 (stock `suites`), tests « après la boucle… », « rejetés… », « un usager qui atteint… » et test de conservation existant inchangé |
| § 9 Les usagers disparaissent vraiment | Tâche 3 (impatience, exode), mesuré Tâche 5 (question 1) |
| § 10 Simulateur : usagers et documents aux jalons, critère, prudent / agressif | Tâche 5 (critère tenu à 1, 2 et 3 taps/s ; prudent 7,17 € et 1 697 abandons, agressif 14,34 € et 1 981 abandons en 10 min) |
| § 11 Trois raccourcis, préréglages existants valides | Tâche 7 (+ test « préréglages : un compteur… par étape » de la Tâche 1) |
| § 12 `npm test`, navigateur 375 × 812 et 375 × 667, console | Chaque tâche d'interface, Tâche 12 |
| Contraintes permanentes : rien n'explique, pas de « ? », pas de bandeau sur la scène, rien ne nomme la boucle avant la note, typographie, a11y, couches | Global Constraints ; relevé et bulle sans phrase d'explication ; la fiche est testée contre « boucle / dématérialis / évaluation / atelier / exemplaire » |
| Planche : panneau « 9 800 Cartes d’identité délivrées · 3 usagers », pastille « 24 » sur l'onglet Justificatif, moment 0 « ← ici » | Non ajoutés (question 4) |
| Planche : la bulle n'a pas de pointe et le relevé est dessous | Tâches 9 et 10 |

Écarts assumés : le relevé est condensé à l'écran Direction en compact ou dès trois procédures (question 5) ; la valeur n'est affichée que pour la Carte d'identité (question 6) ; le critère « service > usagers » est lu sur la fenêtre de 10 min (question 2).
