# Acte II — Lisibilité : fiche de poste, tableau de circulation, débits, Atelier, service des achats — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre l'acte II lisible sans rien dévoiler : fiche de poste du chef de service complétée au fil des notes (pastille sur Options), bulle devenue tableau de circulation, débits signés sous Budget et Formulaires, Atelier qui montre l'effet de chaque procédure et les étapes encore « en attente de réglementation », formulaires devenus une vraie contrainte puis confiés à un Service des achats, nouveau préréglage de test. Spec (approuvée, contraignante) : `specs/010-acte2-lisibilite/spec.md`.

**Architecture:** Tout le calcul reste dans `data/` (fonctions pures, testées par `npm test`) : le moteur de l'acte II (`data/acte2/moteur.ts`) gagne le prix de ramette propre à l'acte II, le Service des achats (`commandeAchats`, appelé par `tick2`, donc aussi hors ligne), son interrupteur (`reglerAchats`) et les abandons par procédure ; deux nouveaux modules purs portent la fiche de poste (`data/acte2/fiche.ts`) et les débits lissés (`data/acte2/debits.ts`) ; les vues existantes (`data/acte2/vues.ts`, `data/acte2/vueAtelier.ts`) exposent le tableau de circulation, le bilan par procédure, le catalogue complet et l'interrupteur. `GameStateContext` expose `fiche2`, `debits` et `reglerAchats` ; les composants n'importent jamais `data/`. L'état nouveau vit dans `EtatActe2` (`ficheVue`, `ficheLues`, `achatsActifs`, `stats.abandonsProc`), complété par `normaliserSauvegarde` pour les anciennes sauvegardes. Les débits ne sont pas sauvegardés (état React du contexte).

**Tech Stack:** TypeScript strict, React Native / Expo 53 (expo-router, lucide-react-native), Node 25 (`node:test`).

## Questions ouvertes pour le porteur de projet

Chaque point est tranché par le défaut indiqué (déjà appliqué dans le plan) ; un autre choix ne touche que la tâche citée.

1. **Comment rendre les formulaires chers sans ralentir l'acte.** Mesuré sur une copie du worktree : la ramette d'acte II à 50 € (au lieu de 8) donne bien 35 % des recettes en ×1, mais l'acte se termine en 257 min au lieu de 192 (le budget net baisse de 40 %). *Défaut :* la ramette d'acte II passe à **80 €** et la dotation de base de l'acte II à **1,60 € par étape** (au lieu de 1) : les fournitures pèsent **35 % des recettes en ×1** (44 % en ×2), la recette nette par étape reste celle d'avant, et tous les jalons de la spec 009 sont tenus (Tâche 3). L'acte I garde `BALANCE.prixRamette` (8 €) et sa dotation.
2. **Exemplaires : un arbitrage réel, pas une perte.** Net par étape au grade de fin d'acte I : 1,44 € (×1), 1,98 € (×2), 2,30 € (×3) pour 1, 2 et 3 formulaires. *Défaut :* gardé ainsi — ×3 triple la consommation pour +60 % de net, double la perte de patience et gagne de la Conformité (trombones). Le robot reste à ×2.
3. **Numéro de la note « Marché public de fournitures ».** *Défaut :* n° 6, juste après « Exemplaires exigés » ; les notes suivantes prennent +1 (Réforme n° 11, Plan de dématérialisation n° 12, Tableau de bord n° 17, Promotion n° 18). Les références (commentaires, titres de tests, préréglage « Réforme possible », tableau des notes de la spec 009, CLAUDE.md) sont mises à jour (Tâche 14). Visible après « Exemplaires exigés » et 18 000 étapes franchies, 3 000 €, 120 s d'instruction : le robot l'approuve à 16 min, avant la pièce de service (22 min).
4. **Seuil du Service des achats.** *Défaut :* comme la commande automatique de l'acte I : il commande dès que le stock couvre moins de 30 s de capacité (guichets + agents + 3 taps/s, × Exemplaires), dans la limite du budget. Il peut donc vider le budget : c'est l'arbitrage, et l'interrupteur le suspend. Il fonctionne hors ligne (il vit dans `tick2`).
5. **Ce que mesure le débit du budget.** *Défaut :* dotation et primes, moins — quand le Service des achats est en service — les formulaires consommés au prix du marché (il rachète ce qui se consomme ; le débit reste lisse entre deux commandes). Un achat fait à la main (ramette, guichet, agent, note) n'est jamais un débit. Débit des formulaires : la consommation seule (toujours négatif ou nul). Lissage exponentiel de 3 s ; remis à zéro après une absence, une Réforme, un raccourci de test.
6. **« Abandons de la procédure » dans l'Atelier.** *Défaut :* les usagers perdus dans cette procédure (patience à une étape, ou rejet de trop), comme « Usagers perdus » du dossier administratif ; pas les « abandons de démarche » (usagers renvoyés chez eux quand leur dossier part en boucle), qui restent réservés au Tableau de bord. Nouvelle statistique `stats.abandonsProc`, à zéro pour une ancienne sauvegarde.
7. **Bilan par dossier.** *Défaut :* dotation brute d'un dossier qui franchit toute la procédure (grade, Ancienneté reconnue et Exemplaires compris, sans la prime de rejet ni le prix des formulaires), patience coûtée (Exemplaires et Droit acquis compris), délai cumulé des étapes : « +14 € · −6 patience · 14 s de délai » (puces symbole + mot de l'Atelier). La spec écrit « 13 s » : « de délai » est ajouté pour que la puce porte un mot.
8. **Anciennes sauvegardes de l'acte II.** *Défaut :* la fiche n'est pas imposée en pleine partie ; elle est réputée refermée sans aucune ligne lue, donc la pastille d'Options compte toutes les lignes en vigueur jusqu'à la première relecture. Service des achats « en service ».
9. **Pastille d'Options pendant la prise de fonctions.** *Défaut :* pas de pastille tant que la fiche est ouverte (elle se lit à l'écran) ; la pastille compte les lignes ajoutées depuis la dernière fermeture.
10. **Texte de la fiche.** La spec donne une phrase par ligne ; le format de l'acte I veut un titre et une phrase. *Défaut :* titre = la phrase de la spec, phrase = un complément dans le ton (Tâche 5) ; chute « Le S.I.C. se réserve le droit de compléter la présente fiche. » ; « Fiche de poste n° 3-B », « Chef de service », titulaire « Agent : Camille · La Direction » (nom du service tiré à chaque Réforme). Aucune ligne ne nomme la boucle ni la dématérialisation (vérifié par un test).
11. **Place du tableau de circulation.** Chaque fiche porte maintenant pictogramme + nom court + nombre : une procédure de 8 étapes tient sur 3 lignes à 375 pt (2 pour 6). *Défaut :* accepté (la scène rétrécit d'autant) ; en écran compact (< 720 pt) la chaîne reste masquée, comme aujourd'hui.

## Global Constraints

- **Base :** branche `feat/acte2-lisibilite` (= `feat/raccourcis-test` : acte II plans 1 à 3 + raccourcis de test, 143 tests verts). Ne jamais faire `git add -A` ni `git add .` : chaque commit liste ses fichiers.
- **Couches strictes :** `components/` et `app/` n'importent jamais `data/` ; tout passe par `useGameState()`, qui réexporte les types utiles (`ProcAtelier`, `ChoixEtape`, `LigneFiche2Id`, `VueFiche2`, `Debits`…). Les constantes de l'acte II vont dans `constants/balanceActe2.ts` ; l'acte I (`constants/balance.ts`, `data/engine.ts`) n'est pas modifié.
- **Ce que l'interface n'ajoute pas** (contraintes permanentes du porteur de projet) : annulation d'achat ; ligne d'explication sous un contrôle ; bouton « ? » ; définition de compteur ; bandeau sur la scène pixel ; raccourci clavier autre que la barre d'espace. La découverte reste totale : rien ne nomme la boucle, rien ne dit de se passer d'usager, le Taux de dématérialisation reste caché jusqu'à sa note.
- **Charte :** couleurs de `constants/Colors.ts` uniquement (encre de l'acte via `encre`), tailles par `Typo`, `Interligne`, `Espace`, `Charte` ; `StyleSheet.create` ; `Panneau`, `BoutonPoussoir` ; `Pressable` seulement ; composants ≤ ~300 lignes ; `React.memo` sur les éléments de liste.
- **Accessibilité :** cibles ≥ 44 × 44 pt, libellé d'accessibilité sur chaque bouton et chaque fiche, aucune information portée par la seule couleur (fiche encombrée = bord épais + chiffre ; interrupteur = mot « EN SERVICE / SUSPENDU » + coche + trait plein ; étape verrouillée = mention + trait pointillé).
- Textes en jeu en français, apostrophes typographiques `’`, signe moins typographique `−` dans les débits et les bilans, nombres au format français (`utils/formatters`). Pas de `any`. Prettier : guillemets simples, indentation de 2 espaces.
- Commits au format Conventional Commits (`feat(logic): …`, `feat(state): …`, `feat(ui): …`, `perf(logic): …`, `test: …`, `docs: …`), terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Vérifier dans le navigateur (tâches d'interface)

1. **Serveur :** depuis la racine du worktree, `npx expo start --web --port 8085` (ou la configuration de `.claude/launch.json` à la racine de `BUREAUCRACY++` qui pointe sur ce worktree). Ouvrir `http://localhost:8085` dans le Browser pane (`preview_start` avec l'URL). **Un seul onglet de jeu** : deux onglets se disputeraient la sauvegarde. Si Metro ne voit pas une modification : relancer avec `--clear` (dossier iCloud, voir CLAUDE.md).
2. **Largeur de téléphone :** `resize_window` preset `mobile` (375 × 812) ; écran compact : `resize_window` 375 × 667. Revenir au preset `desktop` à la fin.
3. **Charger un préréglage :** `http://localhost:8085/?test` ouvre « Raccourcis de test » (le serveur de développement les active) ; toucher la carte du préréglage, confirmer : la partie est remplacée et l'on revient au premier onglet. Préréglages utiles : `debut` (« Acte II — prise de fonctions », fiche ouverte), `atelier`, `achats` (ajouté par la Tâche 7 : « Acte II — service des achats »), `boucle`. Repli sans l'écran : `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <préréglage>` imprime une ligne `localStorage.setItem(…)` à exécuter avec `javascript_tool` sur `http://localhost:8085/manifest.webmanifest`, puis revenir sur `/`.
4. **Lire l'état :** `javascript_tool` → `JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')).acte2` (écrit au plus une seconde après chaque changement).
5. **Console :** `read_console_messages` avec `onlyErrors: true` doit être vide à la fin de chaque vérification.

## File Structure

| Fichier | Rôle | Statut |
|---|---|---|
| `types/acte2.ts` | `LigneFiche2Id` ; `EtatActe2.ficheVue`, `ficheLues`, `achatsActifs` ; `StatsActe2.abandonsProc` ; `Note2Id` `'achats'` ; `Modifiers2.achatsVisible` ; `Events2.formulaires`, `achats` | Modifier |
| `constants/balanceActe2.ts` | `BALANCE2.dotation` 1,6 ; `prixRamette`, `achatsSecondes`, `lissageDebits` | Modifier |
| `data/acte2/moteur.ts` | État initial, `abandonsProcNuls`, abandons par procédure, formulaires consommés, `commandeAchats`, `reglerAchats`, `prixRamette2` d'acte II | Modifier |
| `data/acte2/notes2.ts` | Note n° 6 « Marché public de fournitures », renumérotation | Modifier |
| `data/save.ts` | Normalisation des nouveaux champs | Modifier |
| `data/acte2/debits.ts` | Flux, coût d'un formulaire au débit, lissage | Créer |
| `data/acte2/fiche.ts` | Lignes de la fiche, vue, ouverture et lecture | Créer |
| `data/acte2/vues.ts` | `tableauCirculation`, `EtapeChaine` enrichie, `achatsVisible`, `VueService2.achats` | Modifier |
| `data/acte2/vueAtelier.ts` | `bilanProcedure`, `ProcAtelier.enCours/abandons/bilan`, catalogue complet (`disponible`) | Modifier |
| `data/presets.ts` | Préréglage `achats`, notes des préréglages, fiche réputée lue | Modifier |
| `utils/formatters.ts` | `formatDebitSigne` | Modifier |
| `scripts/robots.ts` | Le robot laisse les fournitures au Service des achats | Modifier |
| `scripts/simulate-acte2.ts` | Part des fournitures dans les recettes (×1 et sur l'acte) | Modifier |
| `scripts/save-acte2.ts` | Liste des préréglages | Modifier |
| `scripts/tests/achats-acte2.test.ts` | État, sauvegarde, prix, note, Service des achats, abandons par procédure | Créer |
| `scripts/tests/debits-acte2.test.ts` | Débits et format signé | Créer |
| `scripts/tests/fiche-acte2.test.ts` | Fiche de poste du chef de service | Créer |
| `scripts/tests/acte2.test.ts`, `reforme.test.ts`, `vues-acte2.test.ts`, `atelier-acte2.test.ts`, `presets.test.ts` | Nouvelle dotation et nouveau prix, 18 notes, tableau, bilan, préréglage | Modifier |
| `context/GameStateContext.tsx` | `fiche2`, `debits`, `reglerAchats`, `marquerFichePoste` par acte | Modifier |
| `components/Hud.tsx` | Débits signés sous Budget et Formulaires | Modifier |
| `components/direction/BulleDirection.tsx` | Tableau de circulation | Modifier |
| `components/atelier/BilanProcedure.tsx` | En-tête d'une procédure | Créer |
| `components/atelier/ChoixVerrouille.tsx` | Étape « En attente de réglementation » | Créer |
| `components/atelier/EcranAtelier.tsx`, `FeuilleEtape.tsx` | Bilan ; catalogue complet | Modifier |
| `components/service/CarteAchats.tsx` | Interrupteur du Service des achats | Créer |
| `components/direction/ServiceDirection.tsx`, `reglementDirection.ts` | Carte et article du Service des achats | Modifier |
| `components/direction/FichePosteDirection.tsx` | Fiche de poste du chef de service | Créer |
| `app/(tabs)/_layout.tsx`, `app/(tabs)/options.tsx` | Fiche montée, pastille d'Options, « Relire ma fiche de poste » à l'acte II | Modifier |
| `components/reforme/SectionReforme.tsx`, `data/acte2/courrier2.ts`, `scripts/simulate-acte2.ts` | Numéros de notes dans les commentaires | Modifier |
| `specs/009-acte2-direction/spec.md`, `CLAUDE.md` | Tableau des notes, mesures du robot, documentation | Modifier |

Toutes les commandes se lancent depuis la racine du worktree. Avant de commencer : `npm test` doit passer (`ℹ pass 143`).

---

### Task 1: État de la lisibilité et sauvegarde

**Files:**
- Modify: `types/acte2.ts` (`LigneFiche2Id`, `StatsActe2`, `EtatActe2`)
- Modify: `data/acte2/moteur.ts` (`abandonsProcNuls`, `etatInitialActe2`)
- Modify: `data/save.ts` (`normaliserSauvegarde`)
- Create: `scripts/tests/achats-acte2.test.ts`

**Interfaces:**
- Consumes: `EtatActe2`, `StatsActe2`, `ProcId` (`types/acte2.ts`), `etatInitialActe2`, `entrerActe2` (`data/acte2/moteur.ts`), `normaliserSauvegarde`, `estSauvegardeValide` (`data/save.ts`).
- Produces: type `LigneFiche2Id` ; champs `EtatActe2.ficheVue: boolean`, `EtatActe2.ficheLues: LigneFiche2Id[]`, `EtatActe2.achatsActifs: boolean`, `StatsActe2.abandonsProc: Record<ProcId, number>` ; `abandonsProcNuls(): Record<ProcId, number>` ; helpers de test `base2`, `x`, `avec2`, `avecNotes`, `proche` dans `scripts/tests/achats-acte2.test.ts`.

- [ ] **Step 1: Écrire le test (il échoue)**

`scripts/tests/achats-acte2.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import type { GameState } from '../../types/game';
import type { EtatActe2, Note2Id } from '../../types/acte2';

/** Entrée dans l'acte II à t = 0, budget et formulaires illimités. */
function base2(): GameState {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  return { ...s, budget: 1e9, formulaires: 1e9 };
}

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

/** Notes de l'acte II en vigueur depuis t = 0. */
function avecNotes(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

const proche = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('entrée dans l’acte II : fiche de poste à lire, Service des achats en service, aucun abandon', () => {
  const y = x(base2());
  assert.equal(y.ficheVue, false);
  assert.deepEqual(y.ficheLues, []);
  assert.equal(y.achatsActifs, true);
  assert.deepEqual(y.stats.abandonsProc, { identite: 0, domicile: 0, hebergement: 0, vie: 0 });
});

test('sauvegarde d’acte II antérieure à la lisibilité : fiche refermée non lue, achats en service', () => {
  const s = base2();
  const { ficheVue: _f, ficheLues: _l, achatsActifs: _a, ...ancien } = x(s);
  const { abandonsProc: _p, ...stats } = ancien.stats;
  const sauvegarde = { ...s, acte2: { ...ancien, stats } } as unknown as GameState;
  assert.equal(estSauvegardeValide(sauvegarde), true);
  const n = x(normaliserSauvegarde(sauvegarde));
  assert.equal(n.ficheVue, true);
  assert.deepEqual(n.ficheLues, []);
  assert.equal(n.achatsActifs, true);
  assert.deepEqual(n.stats.abandonsProc, { identite: 0, domicile: 0, hebergement: 0, vie: 0 });
  // Les champs déjà présents sont gardés.
  const lue = avec2(s, { ficheVue: true, ficheLues: ['circulation'], achatsActifs: false });
  assert.deepEqual(x(normaliserSauvegarde(lue)).ficheLues, ['circulation']);
  assert.equal(x(normaliserSauvegarde(lue)).achatsActifs, false);
});
```

`avecNotes` et `proche` servent à la Tâche 2, qui complète ce fichier.

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `entrée dans l’acte II : fiche de poste à lire…` (`undefined !== false`) et `sauvegarde d’acte II antérieure…` ; `ℹ pass 143`, `ℹ fail 2`.

- [ ] **Step 3: Les types**

Dans `types/acte2.ts`, remplacer :

```ts
export type Exemplaires = 1 | 2 | 3;
```

par :

```ts
export type Exemplaires = 1 | 2 | 3;

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

Dans l'interface `StatsActe2`, remplacer :

```ts
  abandonsDemarche: number;
  taps: number;
}
```

par :

```ts
  abandonsDemarche: number;
  /** Usagers perdus (patience ou rejet) dans chaque procédure. */
  abandonsProc: Record<ProcId, number>;
  taps: number;
}
```

Dans l'interface `EtatActe2`, remplacer :

```ts
  /** Mémoire des services : les procédures d'avant la Réforme ont été restaurées. */
  memoireRestauree: boolean;
  stats: StatsActe2;
```

par :

```ts
  /** Mémoire des services : les procédures d'avant la Réforme ont été restaurées. */
  memoireRestauree: boolean;
  /** La fiche de poste du chef de service est refermée (false : elle s'affiche). */
  ficheVue: boolean;
  /** Lignes de la fiche de poste lues à sa dernière fermeture (les autres font la pastille d'Options). */
  ficheLues: LigneFiche2Id[];
  /** Interrupteur du Service des achats (note « Marché public de fournitures »). */
  achatsActifs: boolean;
  stats: StatsActe2;
```

- [ ] **Step 4: L'état initial**

Dans `data/acte2/moteur.ts`, remplacer :

```ts
/** État de la Direction à l'entrée dans l'acte : le guichet 3 et la procédure du S.I.C. */
```

par :

```ts
/** Abandons par procédure, à zéro. */
export function abandonsProcNuls(): Record<ProcId, number> {
  return { identite: 0, domicile: 0, hebergement: 0, vie: 0 };
}

/** État de la Direction à l'entrée dans l'acte : le guichet 3 et la procédure du S.I.C. */
```

puis, dans `etatInitialActe2`, remplacer :

```ts
    duree: 0,
    memoireRestauree: false,
    stats: {
      franchies: 0,
      franchiesBoucle: 0,
      visasTampons: 0,
      abandonsDemarche: 0,
      taps: 0,
    },
```

par :

```ts
    duree: 0,
    memoireRestauree: false,
    ficheVue: false,
    ficheLues: [],
    achatsActifs: true,
    stats: {
      franchies: 0,
      franchiesBoucle: 0,
      visasTampons: 0,
      abandonsDemarche: 0,
      abandonsProc: abandonsProcNuls(),
      taps: 0,
    },
```

`achatsActifs` vaut `true` dès l'entrée : l'interrupteur est sans effet avant la note, et le Service des achats est ainsi « activé par défaut à l'achat de la note » (spec, section 5).

- [ ] **Step 5: La sauvegarde**

Dans `data/save.ts`, remplacer :

```ts
import { reformesInitiales } from './jurisprudence';
```

par :

```ts
import { reformesInitiales } from './jurisprudence';
import { abandonsProcNuls } from './acte2/moteur';
```

puis remplacer :

```ts
 * et, à l'acte II, l'âge des services (`duree`, depuis `debut`) et la Mémoire des services.
 */
```

par :

```ts
 * et, à l'acte II, l'âge des services (`duree`, depuis `debut`), la Mémoire des services, la fiche de poste
 * du chef de service (refermée, aucune ligne lue : la pastille d'Options invite à la lire), le Service des
 * achats (en service) et les abandons par procédure (inconnus : zéro).
 */
```

et remplacer :

```ts
        memoireRestauree: x.memoireRestauree ?? false,
      }
```

par :

```ts
        memoireRestauree: x.memoireRestauree ?? false,
        ficheVue: x.ficheVue ?? true,
        ficheLues: Array.isArray(x.ficheLues) ? x.ficheLues : [],
        achatsActifs: x.achatsActifs ?? true,
        stats: { ...x.stats, abandonsProc: x.stats.abandonsProc ?? abandonsProcNuls() },
      }
```

- [ ] **Step 6: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: aucune erreur de types ; `ℹ pass 145`, `ℹ fail 0`.

- [ ] **Step 7: Commiter**

```bash
git add types/acte2.ts data/acte2/moteur.ts data/save.ts scripts/tests/achats-acte2.test.ts
git commit -m "feat(logic): état de la fiche de poste, du service des achats et des abandons par procédure

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Ramette d'acte II, note « Marché public de fournitures », Service des achats

**Files:**
- Modify: `types/acte2.ts` (`Note2Id`, `Modifiers2`, `Events2`)
- Modify: `constants/balanceActe2.ts` (`BALANCE2`)
- Modify: `data/acte2/moteur.ts` (`getModifiers2`, `evVide`, `franchir`, `tick2`, `commandeAchats`, `reglerAchats`, `prixRamette2`)
- Modify: `data/acte2/notes2.ts` (`NOTES2`)
- Modify: `scripts/tests/achats-acte2.test.ts`, `scripts/tests/acte2.test.ts`, `scripts/tests/reforme.test.ts`

**Interfaces:**
- Consumes: `abandonsProcNuls`, `EtatActe2.achatsActifs`, `StatsActe2.abandonsProc` (Tâche 1) ; `acheterRamettes2`, `vitesseGuichets`, `vitesseVisas`, `getModifiers2`, `prixFormulairesJurisprudence` ; `BALANCE.ramette`.
- Produces: `Note2Id` `'achats'` (note n° 6) ; `Modifiers2.achatsVisible` ; `Events2.formulaires` (formulaires consommés), `Events2.achats` (€ dépensés par le Service des achats) ; `BALANCE2.dotation` = 1,6, `BALANCE2.prixRamette` = 80, `BALANCE2.achatsSecondes` = 30, `BALANCE2.lissageDebits` = 3 ; `commandeAchats(s, m): { s: GameState; cout: number }` ; `reglerAchats(s, actifs, maintenant): GameState` ; `prixRamette2(s)` au prix d'acte II.

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/achats-acte2.test.ts`, remplacer :

```ts
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import type { GameState } from '../../types/game';
```

par :

```ts
import * as V from '../../data/acte2/vues';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import { BALANCE } from '../../constants/balance';
import { BALANCE2 } from '../../constants/balanceActe2';
import type { GameState } from '../../types/game';
```

et ajouter à la fin du fichier :

```ts
test('ramette de l’acte II : 30 à 40 % de la dotation d’une étape en ×1, au grade de fin d’acte I', () => {
  const s = { ...base2(), tampons: 160_000 };
  const dotationEtape = BALANCE2.dotation * D.getModifiers2(s, 0).dotationMult;
  const formulaireEtape = D.prixRamette2(s) / BALANCE.ramette;
  const part = formulaireEtape / dotationEtape;
  assert.ok(part >= 0.3 && part <= 0.4, `part des fournitures : ${part}`);
});

test('Marché public de fournitures : note n° 6, après les Exemplaires, débloque le Service des achats', () => {
  const s = avecNotes(base2(), ['prise', 'agents', 'atelier', 'signature']);
  assert.ok(!D.notesVisibles2(avec2(s, { stats: { ...x(s).stats, franchies: 50_000 } })).includes('achats'));
  const e = avecNotes(s, ['exemplaires']);
  assert.ok(!D.notesVisibles2(avec2(e, { stats: { ...x(e).stats, franchies: 17_999 } })).includes('achats'));
  const pret = avec2(e, { stats: { ...x(e).stats, franchies: 18_000 } });
  assert.ok(D.notesVisibles2(pret).includes('achats'));
  assert.equal(V.notesAffichees2(pret, 0).find((n) => n.id === 'achats')?.numero, 6);
  assert.equal(D.getModifiers2(pret, 0).achatsVisible, false);
  assert.equal(D.getModifiers2(avecNotes(pret, ['achats']), 0).achatsVisible, true);
});

/** Direction de 10 guichets et 10 instructeurs, Service des achats en vigueur, sans dossier ni usager. */
function avecAchats(budget: number, formulaires: number): GameState {
  const b = avecNotes(base2(), ['prise', 'agents', 'achats']);
  return {
    ...avec2(b, {
      guichets: 10,
      agents: { instructeur: 10, chefBureau: 0, sousDirecteur: 0 },
      usagers: D.stocksPour(x(b).procedures),
      population: 0,
    }),
    budget,
    formulaires,
  };
}

test('Service des achats : sous 30 s de capacité, il commande des ramettes sur le budget', () => {
  const s = avecAchats(10_000, 0);
  // (10 × 0,5 + 10 × 0,3 × 2 [ancienneté] + 3 taps) × ×1 × 30 s = 420 formulaires : 5 ramettes.
  const besoin = (D.vitesseGuichets(x(s)) + D.vitesseVisas(x(s)) + 3) * BALANCE2.achatsSecondes;
  const ramettes = Math.ceil(besoin / BALANCE.ramette);
  const r = D.tick2(s, 0.1, 100);
  assert.equal(r.s.formulaires, ramettes * BALANCE.ramette);
  proche(r.ev.achats, ramettes * BALANCE2.prixRamette);
  proche(r.s.budget, 10_000 - ramettes * BALANCE2.prixRamette);
  assert.equal(r.s.stats.formulairesAchetes, ramettes * BALANCE.ramette);
  // Stock suffisant : rien.
  const plein = D.tick2(r.s, 0.1, 200);
  assert.equal(plein.ev.achats, 0);
  // Pas de quoi payer une ramette : rien.
  assert.equal(D.tick2(avecAchats(BALANCE2.prixRamette - 1, 0), 0.1, 100).ev.achats, 0);
});

test('Service des achats : les Exemplaires multiplient la commande', () => {
  const un = D.tick2(avecAchats(10_000, 0), 0.1, 100).ev.achats;
  const trois = D.tick2(avec2(avecAchats(10_000, 0), { exemplaires: 3 }), 0.1, 100).ev.achats;
  assert.ok(trois > 2.5 * un, `${trois} contre ${un}`);
});

test('Service des achats : suspendu par son interrupteur, refusé avant sa note', () => {
  const s = avecAchats(10_000, 0);
  const coupe = D.reglerAchats(s, false, 0);
  assert.equal(x(coupe).achatsActifs, false);
  assert.equal(D.tick2(coupe, 0.1, 100).ev.achats, 0);
  assert.equal(x(D.reglerAchats(coupe, true, 0)).achatsActifs, true);
  assert.equal(D.reglerAchats(s, true, 0), s, 'déjà en service : même objet');
  const avant = { ...base2(), budget: 10_000, formulaires: 0 };
  assert.equal(D.reglerAchats(avant, false, 0), avant);
  assert.equal(D.tick2(avant, 0.1, 100).ev.achats, 0);
});

test('Service des achats : il commande aussi pendant une absence', () => {
  const s = { ...avecAchats(10_000, 0), derniereMaj: 0 };
  const r = D.simulerAbsence2(s, 60_000);
  assert.ok(r.s.stats.formulairesAchetes > 0);
  assert.ok(r.s.budget < 10_000);
});

test('abandons par procédure : patience et rejet, comptés dans la procédure de l’usager', () => {
  const b = avec2(base2(), { tauxRejet: 0.5 });
  const s = avec2(b, {
    procedures: { ...x(b).procedures, identite: [{ type: 'visa' }] },
    usagers: { ...x(b).usagers, identite: [5] },
  });
  const r = D.tamponner2(s, 0, () => 0);
  // 4 % au visa, puis un tiers des 0,96 rejetés.
  proche(x(r.s).stats.abandonsProc.identite, 0.04 + 0.96 / 3);
  proche(x(r.s).stats.abandonsProc.identite, x(r.s).abandons);
  assert.equal(x(r.s).stats.abandonsProc.domicile, 0);
});

test('évènements : formulaires consommés par les étapes franchies', () => {
  const s = avec2(base2(), { exemplaires: 2 });
  const r = D.tamponner2(s, 0);
  proche(r.ev.formulaires, 2);
  assert.equal(r.ev.achats, 0);
});
```

Dans `scripts/tests/acte2.test.ts`, remplacer :

```ts
test('le catalogue compte 17 notes numérotées de 1 à 17', () => {
  assert.deepEqual(
    NOTES2.map((n) => n.numero),
    Array.from({ length: 17 }, (_, i) => i + 1),
  );
});
```

par :

```ts
test('le catalogue compte 18 notes numérotées de 1 à 18', () => {
  assert.deepEqual(
    NOTES2.map((n) => n.numero),
    Array.from({ length: 18 }, (_, i) => i + 1),
  );
});
```

remplacer :

```ts
  proche(x(r.s).usagers.identite[0], 4);
  proche(r.s.budget - s0.budget, 1);
```

par :

```ts
  proche(x(r.s).usagers.identite[0], 4);
  proche(r.s.budget - s0.budget, BALANCE2.dotation);
```

remplacer :

```ts
  proche(r.s.budget - s0.budget, 1 + 0.96 * BALANCE2.primeRejet);
```

par :

```ts
  proche(
    r.s.budget - s0.budget,
    BALANCE2.dotation * (1 + 0.96 * BALANCE2.primeRejet),
  );
```

remplacer :

```ts
  proche(s0.formulaires - r.s.formulaires, 3);
  proche(r.s.budget - s0.budget, 2.1);
```

par :

```ts
  proche(s0.formulaires - r.s.formulaires, 3);
  proche(r.ev.formulaires, 3);
  proche(r.s.budget - s0.budget, 2.1 * BALANCE2.dotation);
```

et remplacer :

```ts
test('ramettes au prix de l’acte I, réquisition d’urgence sans budget', () => {
  const s = D.acheterRamettes2({ ...base2(), budget: 20, formulaires: 0 }, 5);
  assert.equal(s.formulaires, 2 * BALANCE.ramette);
  proche(s.budget, 20 - 2 * BALANCE.prixRamette);
  const vide = { ...base2(), budget: 0, formulaires: 0 };
  assert.equal(D.requisitionUrgence2(vide).formulaires, BALANCE.ramette);
  assert.equal(D.requisitionUrgence2({ ...vide, budget: 100 }).formulaires, 0);
});
```

par :

```ts
test('ramettes au prix de l’acte II, réquisition d’urgence sans budget', () => {
  const budget = 2.5 * BALANCE2.prixRamette;
  const s = D.acheterRamettes2({ ...base2(), budget, formulaires: 0 }, 5);
  assert.equal(s.formulaires, 2 * BALANCE.ramette);
  proche(s.budget, budget - 2 * BALANCE2.prixRamette);
  assert.ok(BALANCE2.prixRamette > BALANCE.prixRamette, 'l’acte I garde son prix');
  const vide = { ...base2(), budget: 0, formulaires: 0 };
  assert.equal(D.requisitionUrgence2(vide).formulaires, BALANCE.ramette);
  assert.equal(
    D.requisitionUrgence2({ ...vide, budget: BALANCE2.prixRamette }).formulaires,
    0,
  );
});
```

Dans `scripts/tests/reforme.test.ts` (test « Vide juridique : formulaires −25 % aux deux actes »), remplacer :

```ts
    budget: 60,
  };
  proche(D.prixRamette2(s2), BALANCE.prixRamette * 0.75);
```

par :

```ts
    budget: BALANCE2.prixRamette * 0.75 * 10,
  };
  proche(D.prixRamette2(s2), BALANCE2.prixRamette * 0.75);
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `ℹ pass 141`, `ℹ fail 12` : les 8 nouveaux tests de `achats-acte2.test.ts` (`BALANCE2.prixRamette` indéfini, `D.reglerAchats is not a function`, note `achats` absente, `ev.formulaires` indéfini, `abandonsProc` jamais incrémenté), `le catalogue compte 18 notes…`, `Exemplaires ×3…`, `ramettes au prix de l’acte II…`, `Vide juridique…`. Les deux tests de dotation passent encore (`BALANCE2.dotation` vaut 1).

- [ ] **Step 3: Les types**

Dans `types/acte2.ts`, remplacer :

```ts
  | 'exemplaires'
  | 'chefBureau'
```

par :

```ts
  | 'exemplaires'
  | 'achats'
  | 'chefBureau'
```

Dans l'interface `Modifiers2`, remplacer :

```ts
  tableauVisible: boolean;
  /** Jurisprudence « Droit acquis » : la première étape de chaque procédure ne coûte aucune patience. */
```

par :

```ts
  tableauVisible: boolean;
  /** Service des achats débloqué (note « Marché public de fournitures »). */
  achatsVisible: boolean;
  /** Jurisprudence « Droit acquis » : la première étape de chaque procédure ne coûte aucune patience. */
```

Dans l'interface `Events2`, remplacer :

```ts
  budget: number;
  rupture: boolean;
  aucunVisa: boolean;
}
```

par :

```ts
  budget: number;
  /** Formulaires consommés par les étapes franchies. */
  formulaires: number;
  /** Euros dépensés par le Service des achats. */
  achats: number;
  rupture: boolean;
  aucunVisa: boolean;
}
```

- [ ] **Step 4: Les constantes**

Dans `constants/balanceActe2.ts`, remplacer :

```ts
  /** Dotation de base par étape franchie (€), multipliée par celle de l'étape. */
  dotation: 1,
```

par :

```ts
  /**
   * Dotation de base par étape franchie (€), multipliée par celle de l'étape. Relevée avec le prix de la
   * ramette d'acte II (specs/010) : la recette nette d'une étape reste celle d'avant, les fournitures pèsent.
   */
  dotation: 1.6,
```

et remplacer :

```ts
  /** Délai du filet de sécurité après la note « Pièce délivrée par nos services » (min). */
  filetMinutes: 15,
} as const;
```

par :

```ts
  /** Délai du filet de sécurité après la note « Pièce délivrée par nos services » (min). */
  filetMinutes: 15,
  /**
   * Prix d'une ramette (BALANCE.ramette formulaires) à l'acte II : les fournitures pèsent 30 à 40 % des
   * recettes en ×1 (l'acte I garde BALANCE.prixRamette).
   */
  prixRamette: 80,
  /** Service des achats : il commande quand le stock couvre moins de ces secondes de capacité. */
  achatsSecondes: 30,
  /** Débits de l'en-tête (€/s, formulaires/s) : constante de lissage (s). */
  lissageDebits: 3,
} as const;
```

(1,6 € et 80 € sont les valeurs mesurées à la Tâche 3 ; la Tâche 3 les vérifie au simulateur.)

- [ ] **Step 5: La note n° 6**

Dans `data/acte2/notes2.ts`, renuméroter les notes qui suivent « Exemplaires exigés » : `numero: 6` (Chef de bureau) devient `numero: 7`, `7` → `8`, `8` → `9`, `9` → `10`, `10` → `11`, `11` → `12`, `12` → `13`, `13` → `14`, `14` → `15`, `15` → `16`, `16` → `17`, `17` → `18` (en partant de la fin pour ne rien écraser). Puis remplacer :

```ts
  {
    id: 'chefBureau',
    numero: 7,
```

par :

```ts
  {
    id: 'achats',
    numero: 6,
    titre: 'Marché public de fournitures',
    texte: 'Un marché public de fournitures a été attribué au service des achats. Les ramettes seront commandées au prix du marché, qui est celui du marché.',
    effet: 'Débloque le Service des achats : les ramettes sont commandées sur le budget quand le stock baisse.',
    cout: 3000,
    instruction: 120,
    visible: si((x) => achetee(x, 'exemplaires') && x.stats.franchies >= 18000),
    appliquer: (m) => {
      m.achatsVisible = true;
    },
  },
  {
    id: 'chefBureau',
    numero: 7,
```

Vérification : `grep -n "numero:" data/acte2/notes2.ts` liste 1 à 18 dans l'ordre.

- [ ] **Step 6: Le moteur**

Dans `data/acte2/moteur.ts`, `getModifiers2`, remplacer :

```ts
    tableauVisible: false,
    droitAcquis: aJurisprudence(s, 'droitAcquis'),
```

par :

```ts
    tableauVisible: false,
    achatsVisible: false,
    droitAcquis: aJurisprudence(s, 'droitAcquis'),
```

Dans `evVide`, remplacer :

```ts
  budget: 0,
  rupture: false,
  aucunVisa: false,
});
```

par :

```ts
  budget: 0,
  formulaires: 0,
  achats: 0,
  rupture: false,
  aucunVisa: false,
});
```

Dans `franchir`, remplacer :

```ts
  let abandonsDemarche = x0.stats.abandonsDemarche;
  let premiereBoucle = x0.premiereBoucle;
```

par :

```ts
  let abandonsDemarche = x0.stats.abandonsDemarche;
  const abandonsProc = { ...x0.stats.abandonsProc };
  let premiereBoucle = x0.premiereBoucle;
```

remplacer :

```ts
    population -= ab;
    abandons += ab;
    let u = u0 - ab;
```

par :

```ts
    population -= ab;
    abandons += ab;
    abandonsProc[l.p] += ab;
    let u = u0 - ab;
```

remplacer :

```ts
    population -= abRejet;
    abandons += abRejet;
    usagers[l.p][0] += rejU - abRejet;
```

par :

```ts
    population -= abRejet;
    abandons += abRejet;
    abandonsProc[l.p] += abRejet;
    usagers[l.p][0] += rejU - abRejet;
```

remplacer :

```ts
  ev.franchies = franchies;
  ev.budget = budget;
```

par :

```ts
  ev.franchies = franchies;
  ev.budget = budget;
  ev.formulaires = franchies * x0.exemplaires;
```

et remplacer :

```ts
      franchiesBoucle: x0.stats.franchiesBoucle + franchiesBoucle,
      abandonsDemarche,
    },
```

par :

```ts
      franchiesBoucle: x0.stats.franchiesBoucle + franchiesBoucle,
      abandonsDemarche,
      abandonsProc,
    },
```

Dans `tick2`, remplacer :

```ts
  const s: GameState = {
    ...s0,
    acte2: x,
    derniereMaj: maintenant,
    stats: enJeu
      ? { ...s0.stats, tempsDeJeu: s0.stats.tempsDeJeu + dt }
      : s0.stats,
  };
```

par :

```ts
  const avant: GameState = {
    ...s0,
    acte2: x,
    derniereMaj: maintenant,
    stats: enJeu
      ? { ...s0.stats, tempsDeJeu: s0.stats.tempsDeJeu + dt }
      : s0.stats,
  };
  // Service des achats : les ramettes arrivent avant que les étapes ne les consomment (absences comprises).
  const commande = commandeAchats(avant, m);
  const s = commande.s;
```

puis remplacer la fin de `tick2` :

```ts
  return franchir(s, lots, enJeu ? m : { ...m, rejetMax: 0 }, maintenant);
}
```

par :

```ts
  const r = franchir(s, lots, enJeu ? m : { ...m, rejetMax: 0 }, maintenant);
  return { s: r.s, ev: { ...r.ev, achats: commande.cout } };
}

/**
 * Service des achats : quand le stock de formulaires couvre moins de `BALANCE2.achatsSecondes` secondes
 * de capacité (guichets, agents et trois taps par seconde), il commande des ramettes sur le budget.
 */
export function commandeAchats(
  s: GameState,
  m: Modifiers2,
): { s: GameState; cout: number } {
  const x = s.acte2;
  if (!x || !m.achatsVisible || !x.achatsActifs) return { s, cout: 0 };
  const besoin =
    (vitesseGuichets(x) + vitesseVisas(x) + 3 * m.tapPower) *
    x.exemplaires *
    BALANCE2.achatsSecondes;
  if (s.formulaires >= besoin) return { s, cout: 0 };
  const prix = prixRamette2(s);
  const nb = Math.min(
    Math.ceil((besoin - s.formulaires) / BALANCE.ramette),
    Math.floor(s.budget / prix),
  );
  if (nb <= 0) return { s, cout: 0 };
  return { s: acheterRamettes2(s, nb), cout: nb * prix };
}

/** Interrupteur du Service des achats (sans effet avant sa note). */
export function reglerAchats(
  s: GameState,
  actifs: boolean,
  maintenant: number,
): GameState {
  const x = s.acte2;
  if (!x || x.achatsActifs === actifs) return s;
  if (!getModifiers2(s, maintenant).achatsVisible) return s;
  return { ...s, acte2: { ...x, achatsActifs: actifs } };
}
```

Enfin remplacer :

```ts
/** Prix d'une ramette à l'acte II : celui de l'acte I, Vide juridique compris. */
export function prixRamette2(s: GameState): number {
  return (
    Math.round(BALANCE.prixRamette * prixFormulairesJurisprudence(s) * 100) /
    100
  );
}
```

par :

```ts
/** Prix d'une ramette à l'acte II (plus cher qu'à l'acte I), Vide juridique compris. */
export function prixRamette2(s: GameState): number {
  return (
    Math.round(BALANCE2.prixRamette * prixFormulairesJurisprudence(s) * 100) /
    100
  );
}
```

`acheterRamettes2` compte les ramettes du Service des achats dans `stats.formulairesAchetes`, comme celles achetées à la main.

- [ ] **Step 7: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: aucune erreur de types ; `ℹ pass 153`, `ℹ fail 0`.

- [ ] **Step 8: Commiter**

```bash
git add types/acte2.ts constants/balanceActe2.ts data/acte2/moteur.ts data/acte2/notes2.ts scripts/tests/achats-acte2.test.ts scripts/tests/acte2.test.ts scripts/tests/reforme.test.ts
git commit -m "feat(logic): ramette d'acte II, marché public de fournitures et service des achats

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Robot, simulateur et calage des fournitures

**Files:**
- Modify: `scripts/robots.ts` (`robotActe2`)
- Modify: `scripts/simulate-acte2.ts` (part des fournitures)
- Modify: `specs/009-acte2-direction/spec.md` (« Mesures du robot »)

**Interfaces:**
- Consumes: `Modifiers2.achatsVisible`, `EtatActe2.achatsActifs`, `BALANCE2.dotation`, `BALANCE2.prixRamette`, `prixRamette2` (Tâche 2) ; `BALANCE.ramette` ; `GameState.stats.formulairesAchetes`, `stats.budgetGagne`.
- Produces: robot qui laisse les fournitures au Service des achats ; ligne « fournitures : … % des recettes en ×1, … % sur l’acte » dans les mesures de `simulate-acte2` ; mesures du robot à jour dans la spec 009.

- [ ] **Step 1: Le robot confie les fournitures au Service des achats**

Dans `scripts/robots.ts` (`robotActe2`), remplacer :

```ts
  // Formulaires : garder 20 s de consommation.
  const x = s.acte2!;
  const conso =
    (D.vitesseGuichets(x) + D.vitesseVisas(x) + taps) * x.exemplaires * 20;
  if (s.formulaires < conso)
```

par :

```ts
  // Formulaires : garder 20 s de consommation, tant que le Service des achats ne s'en charge pas.
  const x = s.acte2!;
  const conso =
    (D.vitesseGuichets(x) + D.vitesseVisas(x) + taps) * x.exemplaires * 20;
  if (!(m.achatsVisible && x.achatsActifs) && s.formulaires < conso)
```

- [ ] **Step 2: Le simulateur mesure la part des fournitures**

Dans `scripts/simulate-acte2.ts`, remplacer :

```ts
const D = await import('../data/acte2/moteur.ts');
```

par :

```ts
const D = await import('../data/acte2/moteur.ts');
const { BALANCE } = await import('../constants/balance.ts');
```

remplacer :

```ts
const mn = (t: number) => `${(t / 60).toFixed(1)} min`;
```

par :

```ts
const mn = (t: number) => `${(t / 60).toFixed(1)} min`;

/** Part des recettes de la partie dépensée en ramettes (à la main ou par le Service des achats), en %. */
const partFournitures = (s: GameState): number =>
  (100 * (s.stats.formulairesAchetes / BALANCE.ramette) * D.prixRamette2(s)) /
  Math.max(1, s.stats.budgetGagne);
```

remplacer :

```ts
interface Partie {
  jalons: Record<string, number>;
  fin: number | null;
  s: GameState;
}
```

par :

```ts
interface Partie {
  jalons: Record<string, number>;
  fin: number | null;
  s: GameState;
  /** Part des fournitures dans les recettes tant que tout se fait en ×1 (avant le curseur Exemplaires). */
  partX1: number | null;
}
```

remplacer :

```ts
  const tour = () => (s.reformes.nombre > 0 ? ' (après la Réforme)' : '');
```

par :

```ts
  const tour = () => (s.reformes.nombre > 0 ? ' (après la Réforme)' : '');
  let partX1: number | null = null;
```

remplacer :

```ts
    s = robotActe2(s, now, taps, s.reformes.nombre === 0 ? decouverte : 0);
    const x = s.acte2!;
```

par :

```ts
    if (partX1 === null && s.reformes.nombre === 0 && D.getModifiers2(s, now).exemplairesVisible)
      partX1 = partFournitures(s);
    s = robotActe2(s, now, taps, s.reformes.nombre === 0 ? decouverte : 0);
    const x = s.acte2!;
```

remplacer :

```ts
      marquer('fin de l’acte II', t);
      return { jalons, fin: t, s };
```

par :

```ts
      marquer('fin de l’acte II', t);
      return { jalons, fin: t, s, partX1 };
```

remplacer :

```ts
  return { jalons, fin: null, s };
}
```

par :

```ts
  return { jalons, fin: null, s, partX1 };
}
```

et remplacer :

```ts
    console.log(`  visas au tap : ${Math.round(fin.stats.visasTampons)} sur ${Math.round(fin.stats.taps)} taps`);
```

par :

```ts
    console.log(`  visas au tap : ${Math.round(fin.stats.visasTampons)} sur ${Math.round(fin.stats.taps)} taps`);
    console.log(
      `  fournitures : ${p.partX1 === null ? '—' : p.partX1.toFixed(1)} % des recettes en ×1, ${partFournitures(p.s).toFixed(1)} % sur l’acte`,
    );
```

- [ ] **Step 3: Mesurer**

Run: `node scripts/simulate-acte2.ts 2 300 2>/dev/null | sed -n '/Jalons/,$p'`
Expected (robot 2 taps/s, sans Réforme) :

```
    2.0 min  premier agent
    8.5 min  atelier
   12.1 min  note exemplaires
   16.0 min  note achats
   22.4 min  note pieceService
   26.4 min  première boucle
   96.9 min  dématérialisation 50 %
  191.9 min  fin de l’acte II
  fournitures : 35.3 % des recettes en ×1, 44.4 % sur l’acte
```

(extraits ; à ±0,2 min près). Run: `node scripts/simulate-acte2.ts 1 300` puis `node scripts/simulate-acte2.ts 3 300`
Expected : 100 % à 195,8 min (1 tap/s) et 189,6 min (3 taps/s) ; fournitures 35,4 % et 35,3 % en ×1.

Run: `node scripts/simulate-acte2.ts 2 300 balayage`
Expected :

```
Sans Réforme : fin de l’acte II à 191.8 min
Réforme à 0 % : … · fin 124.4 min · rentable
Réforme à 20 % : … · fin 132.6 min · rentable
Réforme à 40 % : … · fin 143.2 min · rentable
Réforme à 50 % : … · fin 157.5 min · rentable
Réforme à 60 % : … · fin 169.0 min · rentable
Réforme à 70 % : … · fin 179.8 min · rentable
Réforme à 80 % : … · fin 198.1 min · pas rentable
```

Run: `node scripts/simulate-acte2.ts 2 300 0 15 | grep -E "réforme débloquée|rejoué|fin de"`
Expected : Réforme débloquée à 41,4 min (cible 40 – 55), acte I rejoué à 63,1 min (cible 60 – 90), fin de l'acte à 130,8 min (cible 105 – 135).

Si un jalon sort de sa cible (spec 009, « Rythme cible »), ajuster `BALANCE2.dotation` et `BALANCE2.prixRamette` **ensemble** (prix ≈ 50 × dotation garde la part des fournitures à 35 % en ×1) et relancer `npm test` (le test « ramette de l’acte II : 30 à 40 % » garde la borne).

Run: `node scripts/simulate-acte1.ts 2 180 | tail -3`
Expected : inchangé (l'acte I n'est pas touché).

- [ ] **Step 4: Mettre à jour les mesures de la spec 009**

Dans `specs/009-acte2-direction/spec.md`, remplacer :

```markdown
| Premier agent | 3.0 | 2.8 | 3.0 |
| Atelier | 9.8 | 9.4 | 9.3 |
| Première boucle | 27.8 | 27.2 | 26.6 |
| Dématérialisation 50 % | 98.5 | 97.3 | 96.1 |
| Dématérialisation 100 % | 193.5 | 191.5 | 189.7 |

Avec une Réforme (2 taps/s, `balayage`) : rentable de 0 à 70 % de dématérialisation (fin de l'acte entre 124.7 et 182.2 min contre 191.5), pas à 80 % (199.5) ; l'acte I est rejoué en 18 à 22 min ; la plus petite Réforme rapporte 6 trombones.

Le robot construit la boucle dès que l'étape est disponible. Avec 15 min de compréhension de la note n° 7 et une Réforme dès son déblocage (`node scripts/simulate-acte2.ts 2 300 0 15`) : Réforme débloquée à 42.2 min, acte I rejoué à 63.9 min, fin de l'acte à 132.7 min.
```

par :

```markdown
| Premier agent | 2.2 | 2.0 | 2.2 |
| Atelier | 9.0 | 8.5 | 8.6 |
| Marché public de fournitures (specs/010) | 17.2 | 16.0 | 15.2 |
| Première boucle | 27.7 | 26.4 | 26.2 |
| Dématérialisation 50 % | 99.5 | 96.9 | 95.5 |
| Dématérialisation 100 % | 195.8 | 191.9 | 189.6 |

Depuis specs/010 (lisibilité), la ramette d'acte II coûte 80 € et l'étape rapporte 1,60 € de base : les fournitures pèsent 35 % des recettes en ×1 (44 % en ×2, le choix du robot), et le robot laisse les fournitures au Service des achats dès sa note.

Avec une Réforme (2 taps/s, `balayage`) : rentable de 0 à 70 % de dématérialisation (fin de l'acte entre 124.4 et 179.8 min contre 191.8), pas à 80 % (198.1) ; l'acte I est rejoué en 18 à 22 min ; la plus petite Réforme rapporte 6 trombones.

Le robot construit la boucle dès que l'étape est disponible. Avec 15 min de compréhension de la note n° 8 et une Réforme dès son déblocage (`node scripts/simulate-acte2.ts 2 300 0 15`) : Réforme débloquée à 41.4 min, acte I rejoué à 63.1 min, fin de l'acte à 130.8 min.
```

Remplacer aussi `(mesuré : 189.7 à 193.5)` par `(mesuré : 189.6 à 195.8)` et `(97.3 min à 2 taps/s)` par `(96.9 min à 2 taps/s)` dans le paragraphe qui suit.

- [ ] **Step 5: Commiter**

```bash
git add scripts/robots.ts scripts/simulate-acte2.ts specs/009-acte2-direction/spec.md
git commit -m "perf(logic): fournitures à 35 % des recettes de l'acte II, jalons tenus

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Débits signés et lissés

**Files:**
- Create: `data/acte2/debits.ts`
- Modify: `utils/formatters.ts` (`formatDebitSigne`)
- Create: `scripts/tests/debits-acte2.test.ts`

**Interfaces:**
- Consumes: `Events2.budget`, `Events2.formulaires` (Tâche 2) ; `getModifiers2`, `prixRamette2`, `reglerAchats` ; `EtatActe2.achatsActifs` ; `BALANCE.ramette`, `BALANCE2.lissageDebits` ; `formatDebit` (`utils/formatters.ts`).
- Produces: `interface Debits { budget: number; formulaires: number }`, `DEBITS_NULS`, `coutFormulaireDebit(s, maintenant): number`, `fluxDe(ev, coutFormulaire): Debits`, `ajouterFlux(a, b): Debits`, `lisserDebits(prec, flux, dt, tau?): Debits` ; `formatDebitSigne(value): string`.

- [ ] **Step 1: Écrire le test (il échoue)**

`scripts/tests/debits-acte2.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import {
  DEBITS_NULS,
  ajouterFlux,
  coutFormulaireDebit,
  fluxDe,
  lisserDebits,
} from '../../data/acte2/debits';
import { formatDebitSigne } from '../../utils/formatters';
import { BALANCE } from '../../constants/balance';
import { BALANCE2 } from '../../constants/balanceActe2';
import type { GameState } from '../../types/game';
import type { EtatActe2, Events2, Note2Id } from '../../types/acte2';

/** Entrée dans l'acte II à t = 0, budget et formulaires illimités. */
function base2(): GameState {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  return { ...s, budget: 1e9, formulaires: 1e9 };
}

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

/** Notes de l'acte II en vigueur depuis t = 0. */
function avecNotes(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

const proche = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

const ev = (patch: Partial<Events2>): Events2 => ({
  franchies: 0,
  visas: 0,
  budget: 0,
  formulaires: 0,
  achats: 0,
  rupture: false,
  aucunVisa: false,
  ...patch,
});

test('débits : flux d’un évènement, formulaires rachetés par le service déduits du budget', () => {
  assert.deepEqual(fluxDe(ev({ budget: 12, formulaires: 5, achats: 400 }), 0.8), {
    budget: 8,
    formulaires: -5,
  });
  assert.deepEqual(fluxDe(ev({ budget: 12, formulaires: 5 }), 0), { budget: 12, formulaires: -5 });
  // Coût d'un formulaire : celui du marché, seulement quand le Service des achats est en service.
  assert.equal(coutFormulaireDebit(base2(), 0), 0);
  const achats = avecNotes(base2(), ['achats']);
  proche(coutFormulaireDebit(achats, 0), BALANCE2.prixRamette / BALANCE.ramette);
  assert.equal(coutFormulaireDebit(D.reglerAchats(achats, false, 0), 0), 0);
  assert.deepEqual(
    ajouterFlux({ budget: 1, formulaires: -2 }, { budget: 3, formulaires: -4 }),
    { budget: 4, formulaires: -6 },
  );
});

test('débits : lissés, ils rejoignent un flux constant en quelques secondes', () => {
  let d = DEBITS_NULS;
  // 1,5 € et 1 formulaire tous les dixièmes de seconde : +15 €/s et −10 /s.
  for (let i = 0; i < 10; i++) d = lisserDebits(d, { budget: 1.5, formulaires: -1 }, 0.1);
  assert.ok(d.budget > 3 && d.budget < 15, `après 1 s : ${d.budget}`);
  for (let i = 0; i < 300; i++) d = lisserDebits(d, { budget: 1.5, formulaires: -1 }, 0.1);
  proche(d.budget, 15, 1e-3);
  proche(d.formulaires, -10, 1e-3);
  assert.equal(lisserDebits(d, { budget: 99, formulaires: 0 }, 0), d);
});

test('débit signé : signe typographique, format des débits, zéro sans signe', () => {
  assert.equal(formatDebitSigne(15.3), '+15');
  assert.equal(formatDebitSigne(-13), '−13');
  assert.equal(formatDebitSigne(0.4), '+0,40');
  assert.equal(formatDebitSigne(0.001), '0');
  assert.equal(formatDebitSigne(-124_560), '−124 k');
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `Cannot find module '…/data/acte2/debits'` pour `scripts/tests/debits-acte2.test.ts` ; les autres fichiers passent.

- [ ] **Step 3: Le format signé**

À la fin de `utils/formatters.ts`, ajouter :

```ts

/**
 * Débit signé (« +15 », « −13 », « +0,40 »), sans unité : même écriture que les débits, avec le signe
 * typographique ; « 0 » quand il est négligeable.
 */
export function formatDebitSigne(value: number): string {
  if (Math.abs(value) < 0.005) return '0';
  return `${value > 0 ? '+' : '−'}${formatDebit(Math.abs(value))}`;
}
```

- [ ] **Step 4: Le module des débits**

`data/acte2/debits.ts` :

```ts
/**
 * Débits de l'en-tête de l'acte II : euros et formulaires par seconde, signés et lissés.
 * Ils mesurent les flux du service (dotation, consommation), jamais un achat du joueur.
 */
import type { GameState } from '../../types/game';
import type { Events2 } from '../../types/acte2';
import { BALANCE } from '../../constants/balance';
import { BALANCE2 } from '../../constants/balanceActe2';
import { getModifiers2, prixRamette2 } from './moteur';

export interface Debits {
  /** €/s : dotation et primes, moins les formulaires rachetés par le Service des achats. */
  budget: number;
  /** Formulaires/s : consommation des étapes franchies (négatif). */
  formulaires: number;
}

export const DEBITS_NULS: Debits = { budget: 0, formulaires: 0 };

/**
 * Coût d'un formulaire porté au débit du budget : son prix quand le Service des achats est en service (il
 * rachète ce qui se consomme, le débit reste lisse entre deux commandes) ; 0 sinon (une ramette achetée à
 * la main est un achat, pas un flux).
 */
export function coutFormulaireDebit(s: GameState, maintenant: number): number {
  const x = s.acte2;
  if (!x || !x.achatsActifs || !getModifiers2(s, maintenant).achatsVisible) return 0;
  return prixRamette2(s) / BALANCE.ramette;
}

/** Flux d'un tick ou d'un tap (montants, pas encore des débits). */
export function fluxDe(ev: Events2, coutFormulaire: number): Debits {
  return {
    budget: ev.budget - ev.formulaires * coutFormulaire,
    formulaires: -ev.formulaires,
  };
}

export function ajouterFlux(a: Debits, b: Debits): Debits {
  return { budget: a.budget + b.budget, formulaires: a.formulaires + b.formulaires };
}

/**
 * Moyenne glissante exponentielle : `flux` accumulé pendant `dt` secondes rapproche les débits de
 * `flux / dt`, avec la constante `tau` (s). `dt` nul : rien ne change.
 */
export function lisserDebits(
  prec: Debits,
  flux: Debits,
  dt: number,
  tau: number = BALANCE2.lissageDebits,
): Debits {
  if (dt <= 0) return prec;
  const k = 1 - Math.exp(-dt / tau);
  return {
    budget: prec.budget + (flux.budget / dt - prec.budget) * k,
    formulaires: prec.formulaires + (flux.formulaires / dt - prec.formulaires) * k,
  };
}
```

- [ ] **Step 5: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: aucune erreur de types ; `ℹ pass 156`, `ℹ fail 0`.

- [ ] **Step 6: Commiter**

```bash
git add data/acte2/debits.ts utils/formatters.ts scripts/tests/debits-acte2.test.ts
git commit -m "feat(logic): débits signés et lissés du budget et des formulaires

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Fiche de poste du chef de service (logique)

**Files:**
- Create: `data/acte2/fiche.ts`
- Create: `scripts/tests/fiche-acte2.test.ts`

**Interfaces:**
- Consumes: `LigneFiche2Id`, `EtatActe2.ficheVue`, `EtatActe2.ficheLues` (Tâche 1) ; `Note2Id` `'achats'` (Tâche 2) ; `noteEffective2` (`data/acte2/moteur.ts`) ; `s.cerfa.prenom`, `s.reformes.denomination.direction`.
- Produces: `lignesFiche2(s, maintenant): LigneFiche2Id[]`, `interface LigneFicheAffichee { id; titre; texte; nouvelle }`, `interface VueFiche2 { visible; premiere; agent; nomService; lignes; nonLues }`, `vueFiche2(s, maintenant): VueFiche2 | null`, `marquerFiche2(s, vue, maintenant): GameState`.

Lignes (titre = phrase de la spec, texte = complément dans le ton ; une ligne de note s'ajoute quand la note entre en vigueur) :

| Ligne | Note | Titre | Texte |
|---|---|---|---|
| `circulation` | — | Les dossiers circulent d’étape en étape | Chaque procédure est une suite d’étapes. Un dossier les franchit dans l’ordre, sans exception. |
| `guichets` | — | Les guichets traitent les pièces | Vous visez les parapheurs : chaque tap accorde un visa en attente. |
| `dotation` | — | Chaque étape franchie rapporte une dotation | Et consomme des formulaires. Sans formulaires, plus aucune étape ne se franchit. |
| `evaluation` | — | Votre évaluation portera sur le volume traité | Le volume se compte en étapes franchies, quel que soit le dossier. |
| `agents` | n° 2 | Les agents visent à votre place | Ils accordent les visas en attente, au rythme de leur ancienneté. |
| `atelier` | n° 3 | Vous complétez les procédures | Chaque étape ajoutée rapporte, mais use la patience des usagers. |
| `exemplaires` | n° 5 | Chaque exemplaire exigé multiplie la dotation… | … et les formulaires. |
| `achats` | n° 6 | Les fournitures sont commandées par le service des achats | Il prélève sur votre budget ce que le marché public exige. |
| `pieceService` | n° 8 | Une procédure peut exiger une pièce délivrée par une autre | La pièce est délivrée par vos services, dans les formes. |

- [ ] **Step 1: Écrire le test (il échoue)**

`scripts/tests/fiche-acte2.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as F from '../../data/acte2/fiche';
import type { GameState } from '../../types/game';
import type { EtatActe2, Note2Id } from '../../types/acte2';

/** Entrée dans l'acte II à t = 0, budget et formulaires illimités. */
function base2(): GameState {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  return { ...s, budget: 1e9, formulaires: 1e9 };
}

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

/** Notes de l'acte II en vigueur depuis t = 0. */
function avecNotes(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

test('fiche de poste du chef de service : quatre lignes à la prise de fonctions, ouverte', () => {
  const f = F.vueFiche2(base2(), 0) as F.VueFiche2;
  assert.equal(f.visible, true);
  assert.equal(f.premiere, true);
  assert.equal(f.agent, 'Test');
  assert.equal(f.nomService, 'La Direction');
  assert.deepEqual(
    f.lignes.map((l) => l.id),
    ['circulation', 'guichets', 'dotation', 'evaluation'],
  );
  assert.equal(f.nonLues, 0, 'pas de pastille sur Options tant que la fiche est ouverte');
  assert.equal(f.lignes.filter((l) => l.nouvelle).length, 4);
  assert.equal(F.vueFiche2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0), null);
});

test('fiche de poste : refermée, elle est lue ; une note en vigueur ajoute une ligne non lue', () => {
  const lue = F.marquerFiche2(base2(), true, 0);
  assert.equal(F.vueFiche2(lue, 0)?.visible, false);
  assert.equal(F.vueFiche2(lue, 0)?.nonLues, 0);
  assert.equal(F.marquerFiche2(lue, true, 0), lue, 'rien à marquer : même objet');
  // Une note achetée mais en instruction n'ajoute rien.
  const instruction = avec2(lue, { notes: { agents: { achetee: 0, effective: 30_000 } } });
  assert.equal(F.vueFiche2(instruction, 10_000)?.nonLues, 0);
  const s = avecNotes(lue, ['agents', 'atelier', 'exemplaires', 'achats', 'pieceService']);
  const f = F.vueFiche2(s, 0) as F.VueFiche2;
  assert.deepEqual(
    f.lignes.map((l) => l.id),
    ['circulation', 'guichets', 'dotation', 'evaluation', 'agents', 'atelier', 'exemplaires', 'achats', 'pieceService'],
  );
  assert.equal(f.nonLues, 5);
  assert.deepEqual(
    f.lignes.filter((l) => l.nouvelle).map((l) => l.id),
    ['agents', 'atelier', 'exemplaires', 'achats', 'pieceService'],
  );
  for (const l of f.lignes) {
    assert.ok(!/'/.test(l.titre + l.texte), `apostrophe droite : ${l.id}`);
    assert.ok(!/boucle|dématérialis/i.test(l.titre + l.texte), `la fiche nomme la boucle : ${l.id}`);
  }
});

test('fiche de poste : « Relire » la rouvre ; la refermer éteint la pastille', () => {
  const s = avecNotes(F.marquerFiche2(base2(), true, 0), ['agents']);
  const ouverte = F.marquerFiche2(s, false, 0);
  assert.equal(F.vueFiche2(ouverte, 0)?.visible, true);
  assert.equal(F.vueFiche2(ouverte, 0)?.premiere, false);
  const relue = F.marquerFiche2(ouverte, true, 0);
  assert.equal(F.vueFiche2(relue, 0)?.visible, false);
  assert.equal(F.vueFiche2(relue, 0)?.nonLues, 0);
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `Cannot find module '…/data/acte2/fiche'` pour `scripts/tests/fiche-acte2.test.ts`.

- [ ] **Step 3: Le module de la fiche**

`data/acte2/fiche.ts` :

```ts
/**
 * Fiche de poste du chef de service (acte II) : même format que celle du guichet 3. Elle s'ouvre à la prise
 * de fonctions, se relit depuis Options, et le S.I.C. la complète d'une ligne à chaque mécanique débloquée.
 * Aucune ligne ne nomme la boucle ni la dématérialisation.
 */
import type { GameState } from '../../types/game';
import type { EtatActe2, LigneFiche2Id, Note2Id } from '../../types/acte2';
import { noteEffective2 } from './moteur';

interface LigneDef {
  id: LigneFiche2Id;
  /** Note dont l'entrée en vigueur ajoute la ligne (null : dès la prise de fonctions). */
  note: Note2Id | null;
  titre: string;
  texte: string;
}

const LIGNES: LigneDef[] = [
  {
    id: 'circulation',
    note: null,
    titre: 'Les dossiers circulent d’étape en étape',
    texte: 'Chaque procédure est une suite d’étapes. Un dossier les franchit dans l’ordre, sans exception.',
  },
  {
    id: 'guichets',
    note: null,
    titre: 'Les guichets traitent les pièces',
    texte: 'Vous visez les parapheurs : chaque tap accorde un visa en attente.',
  },
  {
    id: 'dotation',
    note: null,
    titre: 'Chaque étape franchie rapporte une dotation',
    texte: 'Et consomme des formulaires. Sans formulaires, plus aucune étape ne se franchit.',
  },
  {
    id: 'evaluation',
    note: null,
    titre: 'Votre évaluation portera sur le volume traité',
    texte: 'Le volume se compte en étapes franchies, quel que soit le dossier.',
  },
  {
    id: 'agents',
    note: 'agents',
    titre: 'Les agents visent à votre place',
    texte: 'Ils accordent les visas en attente, au rythme de leur ancienneté.',
  },
  {
    id: 'atelier',
    note: 'atelier',
    titre: 'Vous complétez les procédures',
    texte: 'Chaque étape ajoutée rapporte, mais use la patience des usagers.',
  },
  {
    id: 'exemplaires',
    note: 'exemplaires',
    titre: 'Chaque exemplaire exigé multiplie la dotation…',
    texte: '… et les formulaires.',
  },
  {
    id: 'achats',
    note: 'achats',
    titre: 'Les fournitures sont commandées par le service des achats',
    texte: 'Il prélève sur votre budget ce que le marché public exige.',
  },
  {
    id: 'pieceService',
    note: 'pieceService',
    titre: 'Une procédure peut exiger une pièce délivrée par une autre',
    texte: 'La pièce est délivrée par vos services, dans les formes.',
  },
];

/** Lignes de la fiche à cette date (notes en vigueur), dans l'ordre de la fiche. */
export function lignesFiche2(s: GameState, maintenant: number): LigneFiche2Id[] {
  const x = s.acte2;
  if (!x) return [];
  return LIGNES.filter(
    (l) => l.note === null || noteEffective2(x, l.note, maintenant),
  ).map((l) => l.id);
}

export interface LigneFicheAffichee {
  id: LigneFiche2Id;
  titre: string;
  texte: string;
  /** Ajoutée depuis la dernière lecture. */
  nouvelle: boolean;
}

export interface VueFiche2 {
  /** La fiche est ouverte (prise de fonctions, ou relue depuis Options). */
  visible: boolean;
  /** Jamais refermée : le bouton dit « PRENDRE MON POSTE », sinon « FERMER ». */
  premiere: boolean;
  agent: string;
  nomService: string;
  lignes: LigneFicheAffichee[];
  /** Lignes ajoutées depuis la dernière lecture (pastille de l'onglet Options), 0 tant que la fiche est ouverte. */
  nonLues: number;
}

/** Fiche de poste du chef de service. Null hors de l'acte II. */
export function vueFiche2(s: GameState, maintenant: number): VueFiche2 | null {
  const x = s.acte === 2 ? s.acte2 : null;
  if (!x) return null;
  const ids = lignesFiche2(s, maintenant);
  const lignes = LIGNES.filter((l) => ids.includes(l.id)).map((l) => ({
    id: l.id,
    titre: l.titre,
    texte: l.texte,
    nouvelle: !x.ficheLues.includes(l.id),
  }));
  return {
    visible: !x.ficheVue,
    premiere: x.ficheLues.length === 0,
    agent: s.cerfa.prenom || 'Agent sans prénom',
    nomService: s.reformes.denomination.direction,
    lignes,
    nonLues: x.ficheVue ? lignes.filter((l) => l.nouvelle).length : 0,
  };
}

/**
 * Ouvre (`vue` faux, « Relire ma fiche de poste ») ou referme la fiche. La refermer marque lues toutes les
 * lignes en vigueur. Même objet si rien ne change.
 */
export function marquerFiche2(
  s: GameState,
  vue: boolean,
  maintenant: number,
): GameState {
  const x = s.acte2;
  if (!x || s.acte !== 2) return s;
  if (!vue) return x.ficheVue ? { ...s, acte2: { ...x, ficheVue: false } } : s;
  const lues = lignesFiche2(s, maintenant);
  if (x.ficheVue && lues.every((id) => x.ficheLues.includes(id))) return s;
  const y: EtatActe2 = { ...x, ficheVue: true, ficheLues: lues };
  return { ...s, acte2: y };
}
```

- [ ] **Step 4: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: aucune erreur de types ; `ℹ pass 159`, `ℹ fail 0`.

- [ ] **Step 5: Commiter**

```bash
git add data/acte2/fiche.ts scripts/tests/fiche-acte2.test.ts
git commit -m "feat(logic): fiche de poste du chef de service, complétée au fil des notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Vues — tableau de circulation, bilan des procédures, catalogue complet, interrupteur

**Files:**
- Modify: `data/acte2/vues.ts` (`EtapeChaine`, `tableauCirculation`, `VueDirection`, `vueDirection`, `VueService2`, `vueService2`)
- Modify: `data/acte2/vueAtelier.ts` (imports, `ProcAtelier`, `ChoixEtape`, `bilanProcedure`, `vueAtelier`)
- Modify: `scripts/tests/vues-acte2.test.ts`, `scripts/tests/atelier-acte2.test.ts`

**Interfaces:**
- Consumes: `EtatActe2.achatsActifs`, `StatsActe2.abandonsProc` (Tâche 1) ; `Modifiers2.achatsVisible`, `reglerAchats`, `BALANCE2.dotation` (Tâche 2) ; `EXEMPLAIRES`, `ETAPES` ; `formatEntier`, `formatEuros`.
- Produces: `EtapeChaine { type; nom; attente; traitePar: 'guichets' | 'visa'; allumee; encombree }`, `tableauCirculation(x, p): EtapeChaine[]`, `VueDirection.achatsVisible`, `VueService2.achats: { actifs: boolean } | null` ; `ProcAtelier.enCours`, `ProcAtelier.abandons`, `ProcAtelier.bilan: EffetAffiche[]`, `ChoixEtape.disponible`, `bilanProcedure(x, p, m): EffetAffiche[]`.

- [ ] **Step 1: Écrire les tests (ils échouent)**

À la fin de `scripts/tests/vues-acte2.test.ts`, ajouter :

```ts
test('tableau de circulation : dossiers en attente à chaque étape, et qui la traite', () => {
  const d = V.vueDirection(base2(), 0) as V.VueDirection;
  assert.deepEqual(
    d.etapes.map((e) => [e.nom, e.attente, e.traitePar, e.allumee, e.encombree]),
    [
      ['Pièce', BALANCE2.fileInitiale, 'guichets', false, true],
      ['Visa', BALANCE2.visasInitiaux, 'visa', true, false],
    ],
  );
});

test('tableau de circulation : dossiers sans usager compris ; aucune fiche encombrée sans dossier', () => {
  const b = base2();
  const s = avec2(b, {
    usagers: { ...x(b).usagers, identite: [3, 2] },
    boucles: { ...x(b).boucles, identite: [0, 9.6] },
  });
  const e = (V.vueDirection(s, 0) as V.VueDirection).etapes;
  assert.deepEqual(e.map((f) => [f.attente, f.encombree]), [
    [3, false],
    [11, true],
  ]);
  const vide = avec2(b, { usagers: { ...x(b).usagers, identite: [0, 0] } });
  assert.ok((V.vueDirection(vide, 0) as V.VueDirection).etapes.every((f) => !f.encombree));
  const egal = avec2(b, { usagers: { ...x(b).usagers, identite: [4, 4] } });
  assert.deepEqual(
    (V.vueDirection(egal, 0) as V.VueDirection).etapes.map((f) => f.encombree),
    [true, false],
  );
});

test('Service : interrupteur du Service des achats après sa note', () => {
  const s = avecNotes(base2(), ['prise']);
  assert.equal((V.vueService2(s, 0) as V.VueService2).achats, null);
  const a = avecNotes(s, ['achats']);
  assert.deepEqual((V.vueService2(a, 0) as V.VueService2).achats, { actifs: true });
  assert.deepEqual((V.vueService2(D.reglerAchats(a, false, 0), 0) as V.VueService2).achats, {
    actifs: false,
  });
  assert.equal((V.vueDirection(a, 0) as V.VueDirection).achatsVisible, true);
});
```

Dans `scripts/tests/atelier-acte2.test.ts`, remplacer :

```ts
test('Atelier : procédures ouvertes et catalogue des étapes débloquées', () => {
  const a = A.vueAtelier(avecNotes(base2(), ['atelier']), 0) as A.VueAtelier;
  assert.deepEqual(
    a.procedures.map((p) => p.id),
    ['identite', 'domicile'],
  );
  assert.deepEqual(
    a.catalogue.map((c) => c.type),
    ['piece', 'visa'],
  );
```

par :

```ts
test('Atelier : procédures ouvertes, catalogue complet, étapes non réglementées grisées', () => {
  const a = A.vueAtelier(avecNotes(base2(), ['atelier']), 0) as A.VueAtelier;
  assert.deepEqual(
    a.procedures.map((p) => p.id),
    ['identite', 'domicile'],
  );
  assert.deepEqual(
    a.catalogue.map((c) => [c.type, c.disponible]),
    [
      ['piece', true],
      ['visa', true],
      ['signature', false],
      ['pieceService', false],
      ['reflexion', false],
      ['commission', false],
    ],
  );
```

et ajouter à la fin du fichier :

```ts
test('Atelier : dossiers en cours, abandons et bilan d’un dossier sur la procédure', () => {
  const b = avecNotes({ ...base2(), tampons: 0 }, ['atelier']);
  const s = avec2(b, {
    procedures: { ...x(b).procedures, identite: [{ type: 'piece' }, { type: 'visa' }, { type: 'commission' }] },
    usagers: { ...x(b).usagers, identite: [4, 2.5, 1] },
    boucles: { ...x(b).boucles, identite: [0, 3, 0] },
    stats: { ...x(b).stats, abandonsProc: { identite: 7.9, domicile: 0, hebergement: 0, vie: 0 } },
  });
  const p = (A.vueAtelier(s, 0) as A.VueAtelier).procedures[0];
  assert.equal(p.enCours, 10);
  assert.equal(p.abandons, 7);
  // Grade de départ, ×1 : 1 + 1 + 2 dotations ; 1 + 1 + 2 patience ; 3 + 4 + 15 s.
  const euros = 4 * BALANCE2.dotation;
  assert.deepEqual(
    p.bilan.map((e) => e.texte),
    [`+${euros.toFixed(2).replace('.', ',')} €`, '−4 patience', '22 s de délai'],
  );
  assert.deepEqual(p.bilan.map((e) => e.sens), ['plus', 'moins', 'neutre']);
  // ×2 : dotation ×1,6, patience ×1,5.
  const deux = (A.vueAtelier(avec2(s, { exemplaires: 2 }), 0) as A.VueAtelier).procedures[0];
  assert.equal(deux.bilan[1].texte, '−6 patience');
  // Une Réflexion seule : ni euro ni dotation.
  const r = avec2(b, {
    procedures: { ...x(b).procedures, domicile: [{ type: 'reflexion' }] },
    usagers: { ...x(b).usagers, domicile: [0] },
    boucles: { ...x(b).boucles, domicile: [0] },
  });
  assert.deepEqual(
    (A.vueAtelier(r, 0) as A.VueAtelier).procedures[1].bilan.map((e) => e.texte),
    ['0 €', '−2 patience', '15 s de délai'],
  );
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `tableau de circulation : …` (2 tests : `traitePar` et `encombree` indéfinis, pièce à 0 en attente), `Service : interrupteur du Service des achats après sa note` (`achats` indéfini), `Atelier : procédures ouvertes, catalogue complet…`, `Atelier : dossiers en cours, abandons et bilan…`.

- [ ] **Step 3: La vue Direction et la vue Service**

Dans `data/acte2/vues.ts`, remplacer :

```ts
/** Une fiche de la chaîne affichée dans la bulle ; un visa en attente « s'allume ». */
export interface EtapeChaine {
  type: EtapeType;
  nom: string;
  /** Dossiers qui attendent ce visa (0 hors visa). */
  attente: number;
  allumee: boolean;
}
```

par :

```ts
/**
 * Une fiche du tableau de circulation (bulle) : les dossiers qui attendent à cette étape et qui la traite.
 * Un visa en attente « s'allume » ; la fiche la plus encombrée est marquée.
 */
export interface EtapeChaine {
  type: EtapeType;
  nom: string;
  /** Dossiers (usagers et sans usager) qui attendent à cette étape. */
  attente: number;
  /** Qui franchit l'étape : les guichets, ou le chef de service et ses agents (visa). */
  traitePar: 'guichets' | 'visa';
  /** Visa avec au moins un dossier en attente. */
  allumee: boolean;
  /** L'étape où attendent le plus de dossiers (au moins un ; la première en cas d'égalité). */
  encombree: boolean;
}
```

remplacer :

```ts
  recrutementVisible: boolean;
  atelierVisible: boolean;
  /** Note n° 10 en vigueur : la Réforme peut être engagée (Options). */
```

par :

```ts
  recrutementVisible: boolean;
  atelierVisible: boolean;
  /** Service des achats débloqué (note « Marché public de fournitures »). */
  achatsVisible: boolean;
  /** Note n° 11 en vigueur : la Réforme peut être engagée (Options). */
```

remplacer :

```ts
  /** Tableau de bord (note n° 16), null avant. */
```

par :

```ts
  /** Tableau de bord (note n° 17), null avant. */
```

remplacer :

```ts
/** Écran Direction : ressources, parapheur à viser, scène et curseurs. Null hors de l'acte II. */
```

par :

```ts
/** Tableau de circulation d'une procédure : dossiers en attente à chaque étape, et qui la traite. */
export function tableauCirculation(x: EtatActe2, p: ProcId): EtapeChaine[] {
  const attentes = x.procedures[p].map((_, k) =>
    Math.floor(x.usagers[p][k] + x.boucles[p][k]),
  );
  const max = Math.max(...attentes);
  const rangMax = max >= 1 ? attentes.indexOf(max) : -1;
  return x.procedures[p].map((e, k) => ({
    type: e.type,
    nom: NOMS_COURTS[e.type],
    attente: attentes[k],
    traitePar: e.type === 'visa' ? 'visa' : 'guichets',
    allumee: e.type === 'visa' && attentes[k] >= 1,
    encombree: k === rangMax,
  }));
}

/** Écran Direction : ressources, parapheur à viser, scène et curseurs. Null hors de l'acte II. */
```

remplacer, dans `vueDirection` :

```ts
    etapes: x.procedures[p].map((e, k) => {
      const attente =
        e.type === 'visa' ? Math.floor(x.usagers[p][k] + x.boucles[p][k]) : 0;
      return {
        type: e.type,
        nom: NOMS_COURTS[e.type],
        attente,
        allumee: attente >= 1,
      };
    }),
```

par :

```ts
    etapes: tableauCirculation(x, p),
```

remplacer :

```ts
    atelierVisible: m.atelierVisible,
    reformeVisible: m.reformeVisible,
```

par :

```ts
    atelierVisible: m.atelierVisible,
    achatsVisible: m.achatsVisible,
    reformeVisible: m.reformeVisible,
```

remplacer :

```ts
export interface VueService2 {
  guichet: UniteAffichee<'guichet'>;
  agents: UniteAffichee<Agent2Id>[];
  etapesParSeconde: number;
  visasParSeconde: number;
}
```

par :

```ts
export interface VueService2 {
  guichet: UniteAffichee<'guichet'>;
  agents: UniteAffichee<Agent2Id>[];
  etapesParSeconde: number;
  visasParSeconde: number;
  /** Service des achats (null avant sa note) : son interrupteur. */
  achats: { actifs: boolean } | null;
}
```

et remplacer, dans `vueService2` :

```ts
    etapesParSeconde: vitesseGuichets(x),
    visasParSeconde: vitesseVisas(x),
  };
```

par :

```ts
    etapesParSeconde: vitesseGuichets(x),
    visasParSeconde: vitesseVisas(x),
    achats: m.achatsVisible ? { actifs: x.achatsActifs } : null,
  };
```

- [ ] **Step 4: La vue de l'Atelier**

Dans `data/acte2/vueAtelier.ts`, remplacer :

```ts
import type { GameState } from '../../types/game';
import {
  PROCS,
  type Etape,
  type EtapeType,
  type ProcId,
} from '../../types/acte2';
import { BALANCE2, ETAPES } from '../../constants/balanceActe2';
import { getModifiers2 } from './moteur';
```

par :

```ts
import type { GameState } from '../../types/game';
import {
  PROCS,
  type Etape,
  type EtapeType,
  type EtatActe2,
  type Modifiers2,
  type ProcId,
} from '../../types/acte2';
import { BALANCE2, ETAPES, EXEMPLAIRES } from '../../constants/balanceActe2';
import { formatEntier, formatEuros } from '../../utils/formatters';
import { getModifiers2 } from './moteur';
```

remplacer :

```ts
export interface ProcAtelier {
  id: ProcId;
  nom: string;
  etapes: EtapeAtelier[];
```

par :

```ts
export interface ProcAtelier {
  id: ProcId;
  nom: string;
  /** Dossiers en cours dans la procédure (usagers et sans usager). */
  enCours: number;
  /** Usagers perdus dans la procédure (patience et rejet). */
  abandons: number;
  /** Bilan d'un dossier sur la procédure entière : « +4,48 € », « −4 patience », « 13 s de délai ». */
  bilan: EffetAffiche[];
  etapes: EtapeAtelier[];
```

remplacer :

```ts
export interface ChoixEtape {
  type: EtapeType;
  nom: string;
  description: string;
  effets: EffetAffiche[];
}
```

par :

```ts
export interface ChoixEtape {
  type: EtapeType;
  nom: string;
  description: string;
  effets: EffetAffiche[];
  /** Faux : « En attente de réglementation » (aucune note n'est citée), non sélectionnable. */
  disponible: boolean;
}
```

remplacer :

```ts
/** Atelier : procédures ouvertes et catalogue des étapes débloquées. Null tant que l'Atelier est fermé. */
```

par :

```ts
/** Patience à une décimale au plus (« 4 », « 4,5 »). */
const unDecimal = (v: number): string =>
  (Math.round(v * 10) / 10).toLocaleString('fr-FR');

/**
 * Bilan d'un dossier qui franchit toute la procédure `p` : dotation (grade, Jurisprudence et Exemplaires
 * compris, sans la prime de rejet), patience coûtée (Droit acquis compris) et délai cumulé des étapes.
 */
export function bilanProcedure(
  x: EtatActe2,
  p: ProcId,
  m: Modifiers2,
): EffetAffiche[] {
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
  return [
    euros > 0
      ? { texte: `+${formatEuros(euros)} €`, sens: 'plus' }
      : { texte: '0 €', sens: 'neutre' },
    patience > 0
      ? { texte: `−${unDecimal(patience)} patience`, sens: 'moins' }
      : { texte: '0 patience', sens: 'neutre' },
    { texte: `${formatEntier(delai)} s de délai`, sens: 'neutre' },
  ];
}

/** Atelier : procédures ouvertes, leur bilan, et le catalogue de toutes les étapes. Null tant que l'Atelier est fermé. */
```

remplacer :

```ts
    catalogue: ORDRE_ETAPES.filter((t) => m.etapesDisponibles.includes(t)).map(
      (t) => ({
        type: t,
        nom: ETAPES[t].nom,
        description: ETAPES[t].description,
        effets: effetsEtape(t),
      }),
    ),
```

par :

```ts
    // Toutes les étapes ; celles qu'aucune note n'a encore réglementées sont grisées.
    catalogue: ORDRE_ETAPES.map((t) => ({
      type: t,
      nom: ETAPES[t].nom,
      description: ETAPES[t].description,
      effets: effetsEtape(t),
      disponible: m.etapesDisponibles.includes(t),
    })),
```

et remplacer :

```ts
      return {
        id: p,
        nom: noms[p],
        pleine: x.procedures[p].length >= BALANCE2.etapesMax,
```

par :

```ts
      return {
        id: p,
        nom: noms[p],
        enCours: Math.floor(
          x.usagers[p].reduce((a, v) => a + v, 0) +
            x.boucles[p].reduce((a, v) => a + v, 0),
        ),
        abandons: Math.floor(x.stats.abandonsProc[p]),
        bilan: bilanProcedure(x, p, m),
        pleine: x.procedures[p].length >= BALANCE2.etapesMax,
```

Le moteur refuse toujours une étape non débloquée (`appliquerAction` vérifie `m.etapesDisponibles`) : le catalogue complet ne change que l'affichage.

- [ ] **Step 5: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: aucune erreur de types ; `ℹ pass 163`, `ℹ fail 0`.

- [ ] **Step 6: Commiter**

```bash
git add data/acte2/vues.ts data/acte2/vueAtelier.ts scripts/tests/vues-acte2.test.ts scripts/tests/atelier-acte2.test.ts
git commit -m "feat(logic): tableau de circulation, bilan des procédures et catalogue complet de l'Atelier

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Préréglage « Acte II — service des achats » et fiche réputée lue

**Files:**
- Modify: `data/presets.ts` (imports, `Preset`, `PRESETS_INFO`, notes, `PROCEDURES_ACHATS`, `sauvegardePreset`)
- Modify: `scripts/save-acte2.ts` (commentaire)
- Modify: `scripts/tests/presets.test.ts`

**Interfaces:**
- Consumes: `marquerFiche2`, `vueFiche2` (Tâche 5) ; `Note2Id` `'achats'`, `Modifiers2.achatsVisible`, `tick2` (Tâche 2) ; `D.stocksPour`.
- Produces: préréglage `'achats'` (entre `atelier` et `boucle`) ; les préréglages `boucle`, `demat`, `fin`, `reforme` ont aussi la note `achats` ; tous les préréglages d'acte II sauf `debut` ont la fiche refermée et lue.

- [ ] **Step 1: Écrire le test (il échoue)**

Dans `scripts/tests/presets.test.ts`, remplacer :

```ts
import { PRESETS, PRESETS_INFO, sauvegardePreset } from '../../data/presets';
```

par :

```ts
import { PRESETS, PRESETS_INFO, sauvegardePreset } from '../../data/presets';
import * as D from '../../data/acte2/moteur';
import * as F from '../../data/acte2/fiche';
import type { EtatActe2 } from '../../types/acte2';
```

remplacer (table `ACTE`) :

```ts
  atelier: 2,
  boucle: 2,
```

par :

```ts
  atelier: 2,
  achats: 2,
  boucle: 2,
```

remplacer (test « ordre des préréglages ») :

```ts
    'atelier',
    'boucle',
```

par :

```ts
    'atelier',
    'achats',
    'boucle',
```

et ajouter à la fin du fichier :

```ts

test('préréglage « service des achats » : note en vigueur, ×2, fiche lue ; « prise de fonctions » : fiche ouverte', () => {
  const s = sauvegardePreset('achats', T);
  assert.equal(s.acte, 2);
  assert.equal(D.getModifiers2(s, T).achatsVisible, true);
  assert.equal(D.getModifiers2(s, T).exemplairesVisible, true);
  assert.equal((s.acte2 as EtatActe2).exemplaires, 2);
  assert.equal((s.acte2 as EtatActe2).premiereBoucle, null);
  assert.equal(F.vueFiche2(s, T)?.visible, false);
  assert.equal(F.vueFiche2(s, T)?.nonLues, 0);
  // Stock bas : le Service des achats commande dès le premier tick.
  assert.ok(D.tick2(s, 0.1, T + 100).ev.achats > 0);
  for (const p of ['atelier', 'boucle', 'demat', 'fin', 'reforme'] as const)
    assert.equal(F.vueFiche2(sauvegardePreset(p, T), T)?.nonLues, 0, p);
  assert.equal(F.vueFiche2(sauvegardePreset('debut', T), T)?.visible, true);
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `raccourcis : ordre des préréglages…` (`'achats'` absent), `préréglage « service des achats »…` (`NOTES[preset]` indéfini : TypeError).

- [ ] **Step 3: Le préréglage**

Dans `data/presets.ts`, remplacer :

```ts
import * as R from './reforme';
```

par :

```ts
import * as R from './reforme';
import { marquerFiche2 } from './acte2/fiche';
```

remplacer :

```ts
  | 'atelier'
  | 'boucle'
```

par :

```ts
  | 'atelier'
  | 'achats'
  | 'boucle'
```

remplacer :

```ts
  { id: 'atelier', titre: 'Acte II — Atelier ouvert', detail: 'Atelier des procédures, 5 guichets' },
```

par :

```ts
  { id: 'atelier', titre: 'Acte II — Atelier ouvert', detail: 'Atelier des procédures, 5 guichets' },
  {
    id: 'achats',
    titre: 'Acte II — service des achats',
    detail: 'Marché public de fournitures en vigueur, ×2 exemplaires',
  },
```

remplacer :

```ts
  { id: 'reforme', titre: 'Acte II — Réforme possible', detail: 'Démat. à 60 %, note n° 10 en vigueur' },
```

par :

```ts
  { id: 'reforme', titre: 'Acte II — Réforme possible', detail: 'Démat. à 60 %, note n° 11 en vigueur' },
```

remplacer :

```ts
const NOTES_ATELIER: Note2Id[] = ['prise', 'agents', 'atelier'];
const NOTES_BOUCLE: Note2Id[] = [
  ...NOTES_ATELIER,
  'signature',
  'exemplaires',
  'pieceService',
];
```

par :

```ts
const NOTES_ATELIER: Note2Id[] = ['prise', 'agents', 'atelier'];
const NOTES_ACHATS: Note2Id[] = [
  ...NOTES_ATELIER,
  'signature',
  'exemplaires',
  'achats',
];
const NOTES_BOUCLE: Note2Id[] = [...NOTES_ACHATS, 'pieceService'];
```

remplacer :

```ts
  debut: [],
  atelier: NOTES_ATELIER,
```

par :

```ts
  debut: [],
  atelier: NOTES_ATELIER,
  achats: NOTES_ACHATS,
```

remplacer :

```ts
/** Une boucle Carte d'identité ⇄ Justificatif de domicile. */
```

par :

```ts
/** Procédures du robot vers 17 min : un second visa et une signature, pas encore de pièce de service. */
const PROCEDURES_ACHATS: Partial<Record<ProcId, Etape[]>> = {
  identite: [{ type: 'piece' }, { type: 'visa' }, { type: 'visa' }, { type: 'signature' }],
  domicile: [{ type: 'piece' }, { type: 'visa' }, { type: 'signature' }],
};

/** Une boucle Carte d'identité ⇄ Justificatif de domicile. */
```

remplacer, dans `sauvegardePreset` :

```ts
    s = { ...s, budget: 6_400, formulaires: 2_300 };
  }
```

par :

```ts
    s = { ...s, budget: 6_400, formulaires: 2_300 };
  }
  if (preset === 'achats') {
    // Le robot de simulate-acte2 vers 17 min : la note vient d'entrer en vigueur, le stock est bas.
    const procedures = { ...x.procedures, ...PROCEDURES_ACHATS };
    x = {
      ...x,
      procedures,
      usagers: remplir(D.stocksPour(procedures), {
        identite: [30, 6, 4, 8],
        domicile: [12, 3, 5],
      }),
      boucles: D.stocksPour(procedures),
      guichets: 9,
      agents: { ...x.agents, instructeur: 9 },
      exemplaires: 2,
      premiereModif: 'identite',
      stats: { ...x.stats, franchies: 20_000 },
    };
    s = { ...s, budget: 2_400, formulaires: 400 };
  }
```

et remplacer :

```ts
  s = { ...s, acte2: x };
  // Courrier déjà mérité : réputé envoyé, sauf à l'entrée (Prise de fonctions) et à la fin (Rapport annuel).
```

par :

```ts
  s = { ...s, acte2: x };
  // La fiche de poste du chef de service est réputée lue, sauf à la prise de fonctions.
  if (preset !== 'debut') s = marquerFiche2(s, true, maintenant);
  // Courrier déjà mérité : réputé envoyé, sauf à l'entrée (Prise de fonctions) et à la fin (Rapport annuel).
```

(Le préréglage `atelier` garde ses notes : le Marché public n'y est pas encore visible.)

- [ ] **Step 4: La liste du script**

Dans `scripts/save-acte2.ts`, remplacer :

```ts
 * Préréglages : acte1Debut, acte1Milieu, finActeI, debut, atelier, boucle, demat, fin, reforme, cerfa2
```

par :

```ts
 * Préréglages : acte1Debut, acte1Milieu, finActeI, debut, atelier, achats, boucle, demat, fin, reforme, cerfa2
```

- [ ] **Step 5: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: aucune erreur de types ; `ℹ pass 164`, `ℹ fail 0`.

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts achats | head -c 60`
Expected: `localStorage.setItem("bureaucracy_acte1_v1", "{\"version\":1,`

- [ ] **Step 6: Commiter**

```bash
git add data/presets.ts scripts/save-acte2.ts scripts/tests/presets.test.ts
git commit -m "feat(logic): préréglage du service des achats, fiche de poste réputée lue

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Branchement dans GameStateContext

**Files:**
- Modify: `context/GameStateContext.tsx`

**Interfaces:**
- Consumes: `vueFiche2`, `marquerFiche2` (Tâche 5) ; `DEBITS_NULS`, `ajouterFlux`, `coutFormulaireDebit`, `fluxDe`, `lisserDebits`, `Debits` (Tâche 4) ; `reglerAchats`, `tick2`, `tamponner2` (Tâche 2).
- Produces: dans `GameContextType` : `fiche2: VueFiche2 | null`, `debits: Debits | null` (null à l'acte I), `reglerAchats(actifs: boolean): void` ; `marquerFichePoste(vue)` agit sur la fiche du guichet 3 à l'acte I et sur celle du chef de service à l'acte II ; types réexportés `LigneFicheAffichee`, `VueFiche2`, `Debits`, `LigneFiche2Id`.

- [ ] **Step 1: Imports et types réexportés**

Dans `context/GameStateContext.tsx`, remplacer :

```tsx
import * as A from '@/data/acte2/vueAtelier';
```

par :

```tsx
import * as A from '@/data/acte2/vueAtelier';
import * as F from '@/data/acte2/fiche';
import {
  DEBITS_NULS,
  ajouterFlux,
  coutFormulaireDebit,
  fluxDe,
  lisserDebits,
  type Debits,
} from '@/data/acte2/debits';
```

et remplacer :

```tsx
export type { ChoixEtape, EffetAffiche, EtapeAtelier, ProcAtelier, VueAtelier } from '@/data/acte2/vueAtelier';
```

par :

```tsx
export type { ChoixEtape, EffetAffiche, EtapeAtelier, ProcAtelier, VueAtelier } from '@/data/acte2/vueAtelier';
export type { LigneFicheAffichee, VueFiche2 } from '@/data/acte2/fiche';
export type { Debits } from '@/data/acte2/debits';
export type { LigneFiche2Id } from '@/types/acte2';
```

- [ ] **Step 2: Le type du contexte**

Remplacer :

```tsx
  /** Atelier des procédures ; null tant qu'il est fermé (et à l'acte I). */
  atelier: A.VueAtelier | null;
```

par :

```tsx
  /** Atelier des procédures ; null tant qu'il est fermé (et à l'acte I). */
  atelier: A.VueAtelier | null;
  /** Fiche de poste du chef de service (acte II) ; null à l'acte I. */
  fiche2: F.VueFiche2 | null;
  /** Débits lissés de l'en-tête, €/s et formulaires/s (acte II) ; null à l'acte I. */
  debits: Debits | null;
```

et remplacer :

```tsx
  reglerExemplaires: (n: Exemplaires) => void;
```

par :

```tsx
  reglerExemplaires: (n: Exemplaires) => void;
  /** Acte II : interrupteur du Service des achats. */
  reglerAchats: (actifs: boolean) => void;
```

- [ ] **Step 3: L'état des débits**

Remplacer :

```tsx
  const [abandonsFile, setAbandonsFile] = useState(0);
```

par :

```tsx
  const [abandonsFile, setAbandonsFile] = useState(0);
  const [debits, setDebits] = useState<Debits>(DEBITS_NULS);
  /** Flux des taps de l'acte II depuis le dernier tick (lissés avec celui du tick). */
  const fluxTaps = useRef<Debits>(DEBITS_NULS);
  const remettreDebits = useCallback(() => {
    fluxTaps.current = DEBITS_NULS;
    setDebits(DEBITS_NULS);
  }, []);
```

Dans la boucle de jeu, remplacer :

```tsx
      if (ecart > SEUIL_ABSENCE) {
        s1 = rattraperAbsence(s0, maintenant);
      } else if (s0.acte === 2) {
        // Acte II : le moteur de la Direction, jamais celui du guichet.
        s1 = D.tick2(s0, Math.max(0, ecart) / 1000, maintenant).s;
      } else {
```

par :

```tsx
      if (ecart > SEUIL_ABSENCE) {
        s1 = rattraperAbsence(s0, maintenant);
        // L'absence n'entre pas dans les débits affichés.
        fluxTaps.current = DEBITS_NULS;
        setDebits(DEBITS_NULS);
      } else if (s0.acte === 2) {
        // Acte II : le moteur de la Direction, jamais celui du guichet.
        const dt = Math.max(0, ecart) / 1000;
        const r2 = D.tick2(s0, dt, maintenant);
        const flux = ajouterFlux(fluxTaps.current, fluxDe(r2.ev, coutFormulaireDebit(s0, maintenant)));
        fluxTaps.current = DEBITS_NULS;
        setDebits((d) => lisserDebits(d, flux, dt));
        s1 = r2.s;
      } else {
```

Dans `tamponner`, remplacer :

```tsx
      const r2 = D.tamponner2(etatRef.current, Date.now());
      if (r2.ev.visas > 0) {
```

par :

```tsx
      const t2 = Date.now();
      const r2 = D.tamponner2(etatRef.current, t2);
      fluxTaps.current = ajouterFlux(fluxTaps.current, fluxDe(r2.ev, coutFormulaireDebit(etatRef.current, t2)));
      if (r2.ev.visas > 0) {
```

- [ ] **Step 4: Les actions**

Remplacer :

```tsx
  const modifierProcedure = useCallback(
```

par :

```tsx
  const reglerAchats = useCallback(
    (actifs: boolean) => appliquer(D.reglerAchats(etatRef.current, actifs, Date.now())),
    [appliquer],
  );

  const modifierProcedure = useCallback(
```

Dans `entrerDirection`, remplacer :

```tsx
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    vibrerSi('succes');
    appliquer(D.entrerActe2({ ...s, finActeVue: true }, Date.now()));
  }, [appliquer, vibrerSi]);
```

par :

```tsx
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    remettreDebits();
    vibrerSi('succes');
    appliquer(D.entrerActe2({ ...s, finActeVue: true }, Date.now()));
  }, [appliquer, vibrerSi, remettreDebits]);
```

Dans `reformer`, remplacer :

```tsx
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    vibrerSi('succes');
    appliquer(s);
  }, [appliquer, vibrerSi]);
```

par :

```tsx
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    remettreDebits();
    vibrerSi('succes');
    appliquer(s);
  }, [appliquer, vibrerSi, remettreDebits]);
```

Remplacer :

```tsx
  const marquerFichePoste = useCallback(
    (vue: boolean) => appliquer({ ...etatRef.current, fichePosteVue: vue }),
    [appliquer],
  );
```

par :

```tsx
  // Acte I : la fiche du guichet 3 ; acte II : celle du chef de service (refermée, ses lignes sont lues).
  const marquerFichePoste = useCallback(
    (vue: boolean) => {
      const s = etatRef.current;
      appliquer(s.acte === 2 ? F.marquerFiche2(s, vue, Date.now()) : { ...s, fichePosteVue: vue });
    },
    [appliquer],
  );
```

Dans `nouvellePartie`, remplacer :

```tsx
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    appliquer(E.etatInitial(Date.now()));
  }, [appliquer]);
```

par :

```tsx
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    remettreDebits();
    appliquer(E.etatInitial(Date.now()));
  }, [appliquer, remettreDebits]);
```

Dans `chargerRaccourci`, remplacer :

```tsx
      setAbandonsFile(0);
      abandonsEnCours.current = 0;
      appliquer(s);
      AsyncStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(s)).catch(() => undefined);
      router.replace('/');
    },
    [appliquer],
  );
```

par :

```tsx
      setAbandonsFile(0);
      abandonsEnCours.current = 0;
      remettreDebits();
      appliquer(s);
      AsyncStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(s)).catch(() => undefined);
      router.replace('/');
    },
    [appliquer, remettreDebits],
  );
```

- [ ] **Step 5: Les vues exposées**

Remplacer :

```tsx
  const atelier = useMemo(() => A.vueAtelier(etat, maintenant), [etat, maintenant]);
```

par :

```tsx
  const atelier = useMemo(() => A.vueAtelier(etat, maintenant), [etat, maintenant]);
  const fiche2 = useMemo(() => F.vueFiche2(etat, maintenant), [etat, maintenant]);
```

Dans l'objet `valeur`, remplacer :

```tsx
      atelier,
      reforme,
      cerfaNumero: R.numeroCerfa(etat),
```

par :

```tsx
      atelier,
      fiche2,
      debits: direction ? debits : null,
      reforme,
      cerfaNumero: R.numeroCerfa(etat),
```

remplacer :

```tsx
      reglerExemplaires,
      modifierProcedure,
      entrerDirection,
```

par :

```tsx
      reglerExemplaires,
      reglerAchats,
      modifierProcedure,
      entrerDirection,
```

et, dans le tableau de dépendances du `useMemo`, remplacer :

```tsx
      reglerExemplaires, modifierProcedure, entrerDirection, reforme, reformer, acheterJurisprudence, chargerRaccourci,
    ],
```

par :

```tsx
      reglerExemplaires, modifierProcedure, entrerDirection, reforme, reformer, acheterJurisprudence, chargerRaccourci,
      fiche2, debits, reglerAchats,
    ],
```

- [ ] **Step 6: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur ni avertissement nouveau ; `ℹ pass 164`, `ℹ fail 0`.

Navigateur (procédure « Vérifier dans le navigateur »), 375 × 812 : préréglage `achats` ; après deux secondes, `javascript_tool` → `JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')).acte2.achatsActifs` vaut `true` et `stats.formulairesAchetes` a augmenté (le Service des achats a commandé). Console sans erreur.

- [ ] **Step 7: Commiter**

```bash
git add context/GameStateContext.tsx
git commit -m "feat(state): fiche de poste du chef de service, débits et service des achats dans GameStateContext

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Débits dans l'en-tête

**Files:**
- Modify: `components/Hud.tsx`

**Interfaces:**
- Consumes: `debits` (`useGameState()`, Tâche 8) ; `formatDebitSigne` (Tâche 4).
- Produces: sous Budget « +15 €/s », sous Formulaires « −13 /s » (acte II seulement), dans le libellé d'accessibilité de la colonne (« Budget : 2 240 €, plus 15 euros par seconde »).

- [ ] **Step 1: La colonne accepte un débit**

Dans `components/Hud.tsx`, remplacer :

```tsx
import { formatEntier, formatPourcent, formatMontant } from '@/utils/formatters';
```

par :

```tsx
import { formatDebitSigne, formatEntier, formatPourcent, formatMontant } from '@/utils/formatters';
```

remplacer :

```tsx
  /** Part de largeur : « large » pour la valeur la plus longue (le budget), sinon pour un libellé long sur écran serré. */
  place?: 'large' | 'libelleLong' | 'libelleMoyen';
  children?: React.ReactNode;
}
```

par :

```tsx
  /** Part de largeur : « large » pour la valeur la plus longue (le budget), sinon pour un libellé long sur écran serré. */
  place?: 'large' | 'libelleLong' | 'libelleMoyen';
  /** Débit signé sous la valeur (acte II : « +15 €/s »), et sa lecture (« plus 15 euros par seconde »). */
  debit?: { texte: string; lecture: string };
  children?: React.ReactNode;
}
```

remplacer :

```tsx
  place,
  children,
}: ColonneProps) {
```

par :

```tsx
  place,
  debit,
  children,
}: ColonneProps) {
```

remplacer :

```tsx
      accessibilityLabel={`${label} : ${valeur}${rupture ? ', rupture' : ''}`}
```

par :

```tsx
      accessibilityLabel={`${label} : ${valeur}${debit ? `, ${debit.lecture}` : ''}${rupture ? ', rupture' : ''}`}
```

et remplacer :

```tsx
          numberOfLines={1}
        />
      </View>
      {children}
```

par :

```tsx
          numberOfLines={1}
        />
      </View>
      {debit && (
        <Text style={[styles.debit, couleurTexte]} numberOfLines={1}>
          {debit.texte}
        </Text>
      )}
      {children}
```

- [ ] **Step 2: Budget et Formulaires portent leur débit**

Remplacer :

```tsx
/**
 * Tableau des ressources, à plat sous l'en-tête. Acte I : budget, formulaires, dossiers en attente et, une fois
 * révélée, Conformité. Acte II : budget, formulaires, visas et, après sa note, Taux de dématérialisation.
 */
```

par :

```tsx
/** Débit signé et sa lecture d'accessibilité (« −13 /s », « moins 13 formulaires par seconde »). */
function debitAffiche(valeur: number, unite: string, uniteLue: string) {
  const texte = formatDebitSigne(valeur);
  const lecture = `${texte.replace('+', 'plus ').replace('−', 'moins ')}${uniteLue} par seconde`;
  return { texte: `${texte}${unite}/s`, lecture };
}

/**
 * Tableau des ressources, à plat sous l'en-tête. Acte I : budget, formulaires, dossiers en attente et, une fois
 * révélée, Conformité. Acte II : budget, formulaires (chacun avec son débit signé), visas et, après sa note,
 * Taux de dématérialisation.
 */
```

remplacer :

```tsx
  const { etat, mods, conformite, verdict, enAttente, prixRamette, rupture, direction, encre } = useGameState();
```

par :

```tsx
  const { etat, mods, conformite, verdict, enAttente, prixRamette, rupture, direction, encre, debits } =
    useGameState();
```

remplacer (colonne Budget) :

```tsx
          rupture={sansBudget}
          declencheur={verdict?.id}
        />
```

par :

```tsx
          rupture={sansBudget}
          declencheur={verdict?.id}
          debit={debits ? debitAffiche(debits.budget, '\u00a0€', ' euros') : undefined}
        />
```

remplacer (colonne Formulaires) :

```tsx
          rupture={rupture}
          declencheur={verdict?.id}
          effet="baisse"
        />
```

par :

```tsx
          rupture={rupture}
          declencheur={verdict?.id}
          effet="baisse"
          debit={debits ? debitAffiche(debits.formulaires, '\u00a0', ' formulaires') : undefined}
        />
```

et, dans `StyleSheet.create`, remplacer :

```tsx
  texteRupture: {
    color: Colors.rougeTexte,
  },
```

par :

```tsx
  texteRupture: {
    color: Colors.rougeTexte,
  },
  debit: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.crayon,
  },
```

- [ ] **Step 3: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur ; `ℹ pass 164`.

Navigateur (procédure « Vérifier dans le navigateur ») :
1. 375 × 812, préréglage `debut`, refermer la fiche : sous « Budget », « +1,12 €/s » (1 guichet : 0,5 étape/s × 1,60 € × 1,4) qui monte quand on tape TAMPONNER ; sous « Formulaires », « −0,50 /s » environ. Petits chiffres gris d'une ligne, rien sous Visas.
2. Préréglage `achats` : sous « Formulaires », un débit d'environ −9 /s (×2 exemplaires) ; sous « Budget », un débit positif et sans à-coup quand le Service des achats commande (le stock remonte par paliers de ramettes, le débit ne bondit pas).
3. Toucher ×1 puis ×3 (curseur Exemplaires) : le débit des formulaires se divise par deux puis triple en quelques secondes.
4. `find` « Budget : » : le libellé d'accessibilité contient « euros par seconde ».
5. 375 × 667 : l'en-tête garde ses colonnes sur une ligne, les débits restent lisibles ; la bulle passe en une ligne comme avant.
6. Préréglage `acte1Milieu` : aucun débit à l'acte I. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 4: Commiter**

```bash
git add components/Hud.tsx
git commit -m "feat(ui): débits signés sous le budget et les formulaires

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Tableau de circulation dans la bulle

**Files:**
- Modify: `components/direction/BulleDirection.tsx`

**Interfaces:**
- Consumes: `direction.etapes: EtapeChaine[]` (`attente`, `traitePar`, `allumee`, `encombree` — Tâche 6), `encre`.
- Produces: chaque fiche de la bulle porte un pictogramme (guichet `Landmark` ou tampon `Stamp`), le nom court et le nombre de dossiers qui attendent ; la plus encombrée a un bord de `Charte.trait` et un chiffre gras ; libellé d'accessibilité complet.

- [ ] **Step 1: La bulle**

Dans `components/direction/BulleDirection.tsx`, remplacer :

```tsx
import { Paperclip, Stamp } from 'lucide-react-native';
```

par :

```tsx
import { Landmark, Paperclip, Stamp } from 'lucide-react-native';
```

remplacer :

```tsx
/**
 * Bulle de l'écran Direction, au-dessus de la scène : le parapheur que le prochain coup vise, et sa procédure
 * en fiches reliées par des trombones (les visas en attente s'allument : fond d'encre et tampon).
 */
```

par :

```tsx
/**
 * Bulle de l'écran Direction, au-dessus de la scène : le parapheur que le prochain coup vise, et le tableau de
 * circulation de sa procédure, en fiches reliées par des trombones. Chaque fiche porte qui la traite (guichet ou
 * tampon) et les dossiers qui y attendent ; les visas en attente s'allument (fond d'encre) ; la plus encombrée a
 * un bord épais (jamais la seule couleur).
 */
```

remplacer :

```tsx
  const chaine = etapes
    .map((e) =>
      e.allumee ? `${e.nom}, ${formatEntier(e.attente)} en attente` : e.nom,
    )
    .join(' ; ');
```

par :

```tsx
  const chaine = etapes
    .map(
      (e) =>
        `${e.nom}, ${formatEntier(e.attente)} en attente, ${
          e.traitePar === 'visa' ? 'visée par vous et vos agents' : 'traitée par les guichets'
        }${e.encombree ? ', la plus encombrée' : ''}`,
    )
    .join(' ; ');
```

remplacer :

```tsx
                <View
                  style={[
                    styles.fiche,
                    e.allumee && { backgroundColor: encre.face },
                  ]}
                >
                  {e.allumee && <Stamp size={12} color={Colors.anthracite} />}
                  <Text
                    style={[
                      styles.ficheTexte,
                      e.allumee && styles.ficheAllumee,
                    ]}
                    numberOfLines={1}
                  >
                    {e.nom}
                  </Text>
                </View>
```

par :

```tsx
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
```

Dans `StyleSheet.create`, remplacer :

```tsx
    alignItems: 'center',
    gap: 2,
    borderWidth: 1.5,
```

par :

```tsx
    alignItems: 'center',
    gap: Espace.xs,
    borderWidth: 1.5,
```

et remplacer :

```tsx
  ficheAllumee: {
    fontFamily: Fonts.texteGras,
  },
```

par :

```tsx
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
```

Le titre (« Parapheur n° 048 · Carte d’identité »), le détail (« Visa du chef de service », « Dossier sans usager », « Salle d’attente vide ») et le masquage de la chaîne en écran compact ne changent pas.

- [ ] **Step 2: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: aucune erreur.

Navigateur (procédure « Vérifier dans le navigateur ») :
1. 375 × 812, préréglage `debut` : bulle « Parapheur n° 048 · Carte d’identité », puis deux fiches reliées par un trombone : `[guichet] Pièce 20` (environ) à bord épais (la plus encombrée), `[tampon] Visa 12` sur fond bleu. Taper TAMPONNER trois fois : le nombre du Visa baisse.
2. Préréglage `achats` : quatre fiches `Pièce · Visa · Visa · Signature` sur deux lignes au plus, la plus chargée seule à bord épais.
3. Préréglage `boucle` : quand le parapheur est sans usager, le détail dit « Dossier sans usager » et les nombres comptent aussi les dossiers sans usager.
4. Atelier → ajouter des étapes jusqu'à 8 sur la Carte d'identité, revenir sur Direction : la chaîne tient sur trois lignes au plus, aucune fiche coupée ; TAMPONNER reste visible sans défilement.
5. `find` « Procédure : » : libellé « … Pièce, 20 en attente, traitée par les guichets, la plus encombrée ; Visa, 12 en attente, visée par vous et vos agents. »
6. 375 × 667 : la bulle reste sur une ligne (titre seul). Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 3: Commiter**

```bash
git add components/direction/BulleDirection.tsx
git commit -m "feat(ui): la bulle de la Direction devient un tableau de circulation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Atelier lisible — en-tête des procédures et étapes en attente de réglementation

**Files:**
- Create: `components/atelier/BilanProcedure.tsx`
- Create: `components/atelier/ChoixVerrouille.tsx`
- Modify: `components/atelier/EcranAtelier.tsx`
- Modify: `components/atelier/FeuilleEtape.tsx`

**Interfaces:**
- Consumes: `ProcAtelier.enCours`, `abandons`, `bilan`, `ChoixEtape.disponible` (Tâche 6, réexportés par le contexte) ; `Effets`, `IconeEtape` (`components/atelier/Elements.tsx`) ; `Panneau`.
- Produces: `BilanProcedure({ proc })` (carte sous le sélecteur de procédure) ; `ChoixVerrouille({ choix })` (ligne grisée, non sélectionnable, « En attente de réglementation ») ; la feuille « Ajouter une étape » liste les six types d'étape.

- [ ] **Step 1: L'en-tête d'une procédure**

`components/atelier/BilanProcedure.tsx` :

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ProcAtelier } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import { Effets } from '@/components/atelier/Elements';

/**
 * En-tête d'une procédure de l'Atelier : dossiers en cours, usagers perdus dans la procédure et bilan d'un
 * dossier qui la franchit en entier (symbole + mot, la couleur ne fait que doubler l'information).
 */
export default function BilanProcedure({ proc }: { proc: ProcAtelier }) {
  const enCours = `${formatEntier(proc.enCours)} dossier${proc.enCours > 1 ? 's' : ''} en cours`;
  const abandons = `${formatEntier(proc.abandons)} abandon${proc.abandons > 1 ? 's' : ''}`;
  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayonPetit}>
      <View
        accessible
        accessibilityLabel={`${proc.nom} : ${enCours}, ${abandons}. Par dossier : ${proc.bilan
          .map((e) => e.texte)
          .join(', ')}.`}
      >
        <Text style={styles.compteurs}>
          {enCours} · {abandons}
        </Text>
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

Dans `components/atelier/EcranAtelier.tsx`, remplacer :

```tsx
import FicheEtape from '@/components/atelier/FicheEtape';
```

par :

```tsx
import FicheEtape from '@/components/atelier/FicheEtape';
import BilanProcedure from '@/components/atelier/BilanProcedure';
```

remplacer :

```tsx
          onChoisir={setChoisie}
        />
        <View>
```

par :

```tsx
          onChoisir={setChoisie}
        />
        <BilanProcedure proc={proc} />
        <View>
```

et remplacer :

```tsx
/**
 * Atelier des procédures (acte II) : une procédure par écran, ses étapes en fiches reliées par des trombones.
```

par :

```tsx
/**
 * Atelier des procédures (acte II) : une procédure par écran, son bilan, ses étapes en fiches reliées par des trombones.
```

- [ ] **Step 2: Les étapes en attente de réglementation**

`components/atelier/ChoixVerrouille.tsx` :

```tsx
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChoixEtape } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { IconeEtape } from '@/components/atelier/Elements';

/**
 * Étape pas encore réglementée, dans la feuille « Ajouter une étape » : grisée, non sélectionnable, marquée
 * « En attente de réglementation » (aucune note n'est citée).
 */
function ChoixVerrouille({ choix }: { choix: ChoixEtape }) {
  return (
    <View
      style={styles.choix}
      accessible
      accessibilityRole="radio"
      accessibilityState={{ disabled: true, checked: false }}
      accessibilityLabel={`${choix.nom}. En attente de réglementation`}
    >
      <View style={styles.icone}>
        <IconeEtape type={choix.type} />
      </View>
      <View style={styles.texte}>
        <Text style={styles.nom}>{choix.nom}</Text>
        <Text style={styles.mention}>En attente de réglementation</Text>
      </View>
    </View>
  );
}

export default memo(ChoixVerrouille);

const styles = StyleSheet.create({
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    minHeight: 44,
    borderWidth: Charte.traitFin,
    borderStyle: 'dashed',
    borderColor: Colors.crayonClair,
    borderRadius: Charte.rayonPetit,
    backgroundColor: Colors.creme,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
  },
  icone: {
    opacity: 0.5,
  },
  texte: {
    flex: 1,
    gap: 2,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.crayon,
  },
  mention: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
    textTransform: 'uppercase',
  },
});
```

Dans `components/atelier/FeuilleEtape.tsx`, remplacer :

```tsx
import { Effets, IconeEtape } from '@/components/atelier/Elements';
```

par :

```tsx
import { Effets, IconeEtape } from '@/components/atelier/Elements';
import ChoixVerrouille from '@/components/atelier/ChoixVerrouille';
```

remplacer :

```tsx
/** Feuille qui monte du bas (comme le courrier) : catalogue des étapes débloquées, puis le document exigé. */
```

par :

```tsx
/**
 * Feuille qui monte du bas (comme le courrier) : catalogue de toutes les étapes (celles qu'aucune note n'a
 * encore réglementées sont grisées), puis le document exigé.
 */
```

et remplacer :

```tsx
                {atelier.catalogue.map((c) => (
                  <React.Fragment key={c.type}>
                    <Choix
                      libelle={c.nom}
                      detail={c.description}
                      choisi={etape === c.type}
                      onPress={() => setEtape(c.type)}
                      icone={<IconeEtape type={c.type} />}
                      pied={<Effets effets={c.effets} />}
                    />
                    {/* Le document exigé se choisit juste sous la pièce de service, sans défiler. */}
                    {c.type === 'pieceService' && avecExige && documentExige}
                  </React.Fragment>
                ))}
```

par :

```tsx
                {atelier.catalogue.map((c) =>
                  c.disponible ? (
                    <React.Fragment key={c.type}>
                      <Choix
                        libelle={c.nom}
                        detail={c.description}
                        choisi={etape === c.type}
                        onPress={() => setEtape(c.type)}
                        icone={<IconeEtape type={c.type} />}
                        pied={<Effets effets={c.effets} />}
                      />
                      {/* Le document exigé se choisit juste sous la pièce de service, sans défiler. */}
                      {c.type === 'pieceService' && avecExige && documentExige}
                    </React.Fragment>
                  ) : (
                    <ChoixVerrouille key={c.type} choix={c} />
                  ),
                )}
```

- [ ] **Step 3: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: aucune erreur.

Navigateur (procédure « Vérifier dans le navigateur ») :
1. 375 × 812, préréglage `achats`, onglet Atelier : sous les onglets de procédure, une carte « 52 dossiers en cours · 0 abandon » (nombres du moment), puis « Par dossier » et trois puces : `+14 €` (vert), `−6 patience` (rose), `14 s de délai` (blanc) pour Pièce · Visa · Visa · Signature en ×2. Passer à « Justificatif de domicile » : la carte change.
2. Revenir sur Direction, régler Exemplaires ×1, revenir sur l'Atelier : `+8,96 €` et `−4 patience` (le bilan suit le curseur).
3. « + Ajouter une étape » : Pièce justificative, Visa, Signature sélectionnables (effets inchangés) ; « Pièce délivrée par nos services », « Délai de réflexion », « Commission » en trait pointillé, grisés, mention « EN ATTENTE DE RÉGLEMENTATION », aucune note citée ; les toucher ne coche rien et le bouton « AJOUTER L’ÉTAPE » reste éteint. Libellé d'accessibilité (`find` « réglementation ») : « Commission. En attente de réglementation », état désactivé.
4. Préréglage `boucle` : « Pièce délivrée par nos services » est sélectionnable et le choix du document exigé s'ouvre toujours juste dessous.
5. 375 × 667 : la carte d'en-tête tient sur deux lignes, la feuille défile. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 4: Commiter**

```bash
git add components/atelier/BilanProcedure.tsx components/atelier/ChoixVerrouille.tsx components/atelier/EcranAtelier.tsx components/atelier/FeuilleEtape.tsx
git commit -m "feat(ui): bilan des procédures et étapes en attente de réglementation dans l'Atelier

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Service des achats dans l'onglet Service et au règlement intérieur

**Files:**
- Create: `components/service/CarteAchats.tsx`
- Modify: `components/direction/ServiceDirection.tsx`
- Modify: `components/direction/reglementDirection.ts`

**Interfaces:**
- Consumes: `service2.achats` (Tâche 6), `reglerAchats` (Tâche 8), `direction.achatsVisible` (`VueDirection`, Tâche 6), `encre`.
- Produces: carte « Service des achats » sous la carte des ramettes, avec un interrupteur (`accessibilityRole="switch"`, 44 pt) « EN SERVICE » / « SUSPENDU » ; article « Service des achats » au règlement intérieur une fois la note en vigueur.

- [ ] **Step 1: La carte**

`components/service/CarteAchats.tsx` :

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Circle, CircleCheck, Truck } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';

/**
 * Service des achats (acte II, note « Marché public de fournitures ») : un interrupteur. En service, il commande
 * les ramettes sur le budget quand le stock baisse ; l'état se lit au mot et à la coche, pas à la couleur.
 */
export default function CarteAchats() {
  const { service2, reglerAchats, encre } = useGameState();
  const achats = service2?.achats;
  if (!achats) return null;
  const { actifs } = achats;

  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
      <View style={styles.avatar}>
        <Truck size={18} color={Colors.anthracite} />
      </View>
      <Text style={styles.nom}>Service des achats</Text>
      <Pressable
        onPress={() => reglerAchats(!actifs)}
        accessibilityRole="switch"
        accessibilityState={{ checked: actifs }}
        accessibilityLabel="Service des achats"
        style={({ pressed }) => [
          styles.interrupteur,
          actifs && styles.interrupteurActif,
          actifs && { backgroundColor: encre.fond },
          pressed && styles.presse,
        ]}
      >
        {actifs ? (
          <CircleCheck size={18} color={Colors.anthracite} />
        ) : (
          <Circle size={18} color={Colors.crayon} />
        )}
        <Text style={[styles.etat, !actifs && styles.etatSuspendu]}>
          {actifs ? 'EN SERVICE' : 'SUSPENDU'}
        </Text>
      </Pressable>
    </Panneau>
  );
}

const styles = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    padding: Espace.m,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Charte.rayon,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.pastelBleu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nom: {
    flex: 1,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  interrupteur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.xs,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: Espace.m,
    borderWidth: Charte.traitFin,
    borderStyle: 'dashed',
    borderColor: Colors.crayon,
    borderRadius: Charte.rayonPetit,
    backgroundColor: Colors.papier,
  },
  /** En service : trait plein et épais, comme un tampon apposé. */
  interrupteurActif: {
    borderStyle: 'solid',
    borderWidth: Charte.trait,
    borderColor: Colors.anthracite,
  },
  etat: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  etatSuspendu: {
    color: Colors.crayon,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
```

Dans `components/direction/ServiceDirection.tsx`, remplacer :

```tsx
import CarteRamettes from '@/components/service/CarteRamettes';
```

par :

```tsx
import CarteRamettes from '@/components/service/CarteRamettes';
import CarteAchats from '@/components/service/CarteAchats';
```

remplacer :

```tsx
/** Onglet Service de l'acte II : fournitures, guichets (franchissent les étapes) et agents (accordent les visas). */
```

par :

```tsx
/**
 * Onglet Service de l'acte II : fournitures (ramettes, puis Service des achats), guichets (franchissent les
 * étapes) et agents (accordent les visas).
 */
```

et remplacer :

```tsx
        <CarteRamettes />
```

par :

```tsx
        <CarteRamettes />
        <CarteAchats />
```

- [ ] **Step 2: L'article du règlement**

Dans `components/direction/reglementDirection.ts`, remplacer :

```ts
  if (d.reformeVisible) {
```

par :

```ts
  if (d.achatsVisible) {
    articles.push({
      titre: 'Service des achats',
      texte:
        'En service, il commande des ramettes sur le budget dès que le stock ne couvre plus trente secondes de travail, y compris en votre absence. Il se suspend depuis l’onglet Service.',
    });
  }
  if (d.reformeVisible) {
```

- [ ] **Step 3: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: aucune erreur.

Navigateur (procédure « Vérifier dans le navigateur ») :
1. 375 × 812, préréglage `atelier`, onglet Service : pas de carte « Service des achats » ; le bouton ×1 de la ramette affiche « 80 € ».
2. Préréglage `achats`, onglet Service : sous la ramette, carte « Service des achats » (camion sur rond bleu pâle) et, à droite, « EN SERVICE » avec une coche, trait plein épais. Aucune ligne de texte sous la carte.
3. La toucher : « SUSPENDU », cercle vide, trait pointillé gris ; `acte2.achatsActifs` vaut `false` ; le stock de formulaires descend sans être recommandé ; le débit du budget remonte (plus de formulaires portés au débit). La retoucher : « EN SERVICE », une commande part si le stock est bas.
4. `find` « Service des achats » : rôle switch, état coché ou non.
5. Options → Règlement intérieur : article « Service des achats ».
6. 375 × 667 : la carte tient sur une ligne (nom sur deux lignes au plus). Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 4: Commiter**

```bash
git add components/service/CarteAchats.tsx components/direction/ServiceDirection.tsx components/direction/reglementDirection.ts
git commit -m "feat(ui): interrupteur du service des achats et article du règlement

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Fiche de poste du chef de service à l'écran, pastille d'Options

**Files:**
- Create: `components/direction/FichePosteDirection.tsx`
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/(tabs)/options.tsx`

**Interfaces:**
- Consumes: `fiche2: VueFiche2 | null`, `LigneFiche2Id`, `marquerFichePoste` (Tâche 8) ; `useFermetureEchap`, `Panneau`, `BoutonPoussoir`, `NotificationBadge`, `encre`.
- Produces: fenêtre « Fiche de poste n° 3-B · Chef de service » au format de `components/FichePoste.tsx`, ouverte à la prise de fonctions et par « Relire ma fiche de poste » (Options, acte I et acte II) ; pastille sur l'onglet Options et sur le bouton « Relire » tant que des lignes ajoutées n'ont pas été lues ; « NOUVEAU » sur ces lignes à la relecture.

- [ ] **Step 1: La fenêtre**

`components/direction/FichePosteDirection.tsx` :

```tsx
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useFermetureEchap, useGameState, type LigneFiche2Id } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/** Pictogramme et fond de chaque ligne de la fiche. */
const ICONES: Record<LigneFiche2Id, { Icone: LucideIcon; fond: string }> = {
  circulation: { Icone: Paperclip, fond: Colors.pastelBleu },
  guichets: { Icone: Landmark, fond: Colors.bleuFond },
  dotation: { Icone: Coins, fond: Colors.pastelJaune },
  evaluation: { Icone: ChartColumn, fond: Colors.pastelVert },
  agents: { Icone: UserRound, fond: Colors.pastelJaune },
  atelier: { Icone: Wrench, fond: Colors.bleuFond },
  exemplaires: { Icone: Copy, fond: Colors.pastelBleu },
  achats: { Icone: Truck, fond: Colors.pastelVert },
  pieceService: { Icone: Landmark, fond: Colors.pastelBleu },
};

/**
 * Fiche de poste du chef de service (acte II), au format de celle du guichet 3 : elle s'ouvre à la prise de
 * fonctions, se relit depuis Options, et le S.I.C. la complète à chaque mécanique débloquée (une ligne ajoutée
 * porte « NOUVEAU » jusqu'à la relecture).
 */
export default function FichePosteDirection() {
  const { fiche2, marquerFichePoste, encre } = useGameState();
  const visible = fiche2?.visible ?? false;
  useFermetureEchap(visible, () => marquerFichePoste(true));
  if (!fiche2) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => marquerFichePoste(true)}>
      <Pressable style={styles.voile} onPress={() => marquerFichePoste(true)} accessible={false}>
        <ScrollView contentContainerStyle={styles.defilement}>
          <Pressable onPress={() => undefined} accessible={false} style={styles.colonne}>
            <Panneau contenuStyle={styles.fiche} rayon={Charte.rayonPetit}>
              <Text style={styles.reference}>Fiche de poste n° 3-B</Text>
              <Text style={styles.titre}>Chef de service</Text>
              <Text style={styles.titulaire}>
                Agent : {fiche2.agent} · {fiche2.nomService}
              </Text>

              <View style={styles.missions}>
                {fiche2.lignes.map((l, i) => {
                  const { Icone, fond } = ICONES[l.id];
                  return (
                    <View
                      key={l.id}
                      style={styles.mission}
                      accessible
                      accessibilityLabel={`${i + 1}. ${l.titre}. ${l.texte}${l.nouvelle && !fiche2.premiere ? ' Nouveau.' : ''}`}
                    >
                      <View style={[styles.pastille, { backgroundColor: fond }]}>
                        <Icone size={18} color={Colors.anthracite} />
                      </View>
                      <View style={styles.missionTexte}>
                        <Text style={styles.missionTitre}>
                          {i + 1}. {l.titre}
                        </Text>
                        <Text style={styles.missionDetail}>{l.texte}</Text>
                        {l.nouvelle && !fiche2.premiere && <Text style={styles.nouveau}>NOUVEAU</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.chute}>
                Le S.I.C. se réserve le droit de compléter la présente fiche.
              </Text>
              <BoutonPoussoir
                libelle={fiche2.premiere ? 'PRENDRE MON POSTE' : 'FERMER'}
                taille={Typo.titre}
                hauteur={56}
                couleur={encre.face}
                couleurOmbre={encre.flanc}
                onPress={() => marquerFichePoste(true)}
              />
            </Panneau>
          </Pressable>
        </ScrollView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /** Sur grand écran, la fenêtre garde la largeur de la colonne de l'app. */
  colonne: {
    width: '100%',
    maxWidth: Charte.largeurColonne,
    alignSelf: 'center',
  },
  voile: {
    flex: 1,
    backgroundColor: Colors.voile,
  },
  defilement: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Espace.l,
  },
  fiche: {
    padding: Espace.l,
    gap: Espace.m,
    backgroundColor: Colors.papierFiche,
  },
  reference: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
  },
  titre: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.grand,
    color: Colors.anthracite,
  },
  titulaire: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
    paddingBottom: Espace.s,
  },
  missions: {
    gap: Espace.m,
    marginTop: Espace.xs,
  },
  mission: {
    flexDirection: 'row',
    gap: Espace.m,
    alignItems: 'flex-start',
  },
  pastille: {
    width: 36,
    height: 36,
    borderRadius: Charte.rayon,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTexte: {
    flex: 1,
  },
  missionTitre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  missionDetail: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  nouveau: {
    alignSelf: 'flex-start',
    marginTop: Espace.xs,
    paddingHorizontal: Espace.xs,
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.anthracite,
    backgroundColor: Colors.pastelJaune,
  },
  chute: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.anthracite,
    fontStyle: 'italic',
    marginVertical: Espace.s,
  },
});
```

La fenêtre ne met pas le jeu en pause (comme toutes les fenêtres) ; Échap, le voile et le bouton la referment, et la refermer marque lues toutes les lignes en vigueur.

- [ ] **Step 2: Montée dans les onglets, pastille d'Options**

Dans `app/(tabs)/_layout.tsx`, remplacer :

```tsx
import FichePoste from '@/components/FichePoste';
```

par :

```tsx
import FichePoste from '@/components/FichePoste';
import FichePosteDirection from '@/components/direction/FichePosteDirection';
```

remplacer :

```tsx
    encre,
    raccourcisActifs,
  } = useGameState();
```

par :

```tsx
    encre,
    raccourcisActifs,
    fiche2,
  } = useGameState();
```

remplacer :

```tsx
  const ruptureNotes = rupture && !recrutementVisible;
```

par :

```tsx
  const ruptureNotes = rupture && !recrutementVisible;
  // Acte II : lignes ajoutées à la fiche de poste depuis sa dernière lecture (elle se relit dans Options).
  const ficheNonLues = fiche2?.nonLues ?? 0;
```

remplacer :

```tsx
      <FichePoste />
```

par :

```tsx
      <FichePoste />
      <FichePosteDirection />
```

et remplacer :

```tsx
            title: 'Options',
            tabBarAccessibilityLabel: 'Options',
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
```

par :

```tsx
            title: 'Options',
            tabBarAccessibilityLabel: ficheNonLues > 0 ? 'Options, fiche de poste complétée' : 'Options',
            tabBarIcon: ({ color, size }) => (
              <View>
                <Settings size={size} color={color} />
                <NotificationBadge count={ficheNonLues} />
              </View>
            ),
```

- [ ] **Step 3: « Relire ma fiche de poste » à l'acte II**

Dans `app/(tabs)/options.tsx`, remplacer :

```tsx
import ListeJurisprudence from '@/components/reforme/ListeJurisprudence';
```

par :

```tsx
import ListeJurisprudence from '@/components/reforme/ListeJurisprudence';
import NotificationBadge from '@/components/NotificationBadge';
```

remplacer :

```tsx
  const { etat, grade, direction, reforme, deposerDemission, nouvellePartie, marquerFichePoste, encre } =
    useGameState();
```

par :

```tsx
  const { etat, grade, direction, reforme, deposerDemission, nouvellePartie, marquerFichePoste, encre, fiche2 } =
    useGameState();
  const ficheNonLues = fiche2?.nonLues ?? 0;
```

et remplacer :

```tsx
          {/* La fiche de poste est celle du guichet 3 : elle ne se relit plus à la Direction. */}
          {!direction && (
            <Pressable
              style={({ pressed }) => [styles.relire, pressed && styles.presse]}
              accessibilityRole="button"
              accessibilityLabel="Relire ma fiche de poste"
              onPress={() => marquerFichePoste(false)}
            >
              <Text style={styles.relireTexte}>Relire ma fiche de poste</Text>
            </Pressable>
          )}
```

par :

```tsx
          {/* Acte I : la fiche du guichet 3 ; acte II : celle du chef de service, complétée au fil des notes. */}
          <Pressable
            style={({ pressed }) => [styles.relire, pressed && styles.presse]}
            accessibilityRole="button"
            accessibilityLabel={ficheNonLues > 0 ? 'Relire ma fiche de poste, complétée' : 'Relire ma fiche de poste'}
            onPress={() => marquerFichePoste(false)}
          >
            <Text style={styles.relireTexte}>Relire ma fiche de poste</Text>
            <NotificationBadge count={ficheNonLues} />
          </Pressable>
```

- [ ] **Step 4: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: aucune erreur.

Navigateur (procédure « Vérifier dans le navigateur ») :
1. 375 × 812, préréglage `finActeI` → « PRENDRE MES FONCTIONS » : la fiche « Fiche de poste n° 3-B / Chef de service / Agent : Camille · La Direction » s'ouvre, quatre lignes numérotées (pictogrammes trombone, guichet, pièces, graphique), chute « Le S.I.C. se réserve le droit de compléter la présente fiche. », bouton bleu « PRENDRE MON POSTE ». Aucune pastille sur Options pendant qu'elle est ouverte. Le jeu tourne derrière (les compteurs bougent).
2. « PRENDRE MON POSTE » : la fiche se ferme, Options sans pastille ; `acte2.ficheVue` vaut `true`, `acte2.ficheLues` les quatre lignes.
3. Notes : approuver « Prise de fonctions », acheter des guichets jusqu'à « Agents d’instruction », l'approuver et attendre la fin de l'instruction (30 s) : pastille « 1 » sur l'onglet Options (libellé « Options, fiche de poste complétée ») et sur « Relire ma fiche de poste ».
4. Options → « Relire ma fiche de poste » : cinq lignes, la cinquième « Les agents visent à votre place » porte « NOUVEAU » ; bouton « FERMER ». Fermer : les deux pastilles disparaissent.
5. Préréglage `boucle` : aucune fiche à l'ouverture, aucune pastille ; « Relire » montre neuf lignes, aucune « NOUVEAU » ; aucune ligne ne parle de boucle ni de dématérialisation.
6. Préréglage `acte1Milieu` : « Relire ma fiche de poste » ouvre la fiche du guichet 3 (orange) comme avant.
7. 375 × 667 : la fiche défile, le bouton reste atteignable ; Échap la ferme. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 5: Commiter**

```bash
git add components/direction/FichePosteDirection.tsx "app/(tabs)/_layout.tsx" "app/(tabs)/options.tsx"
git commit -m "feat(ui): fiche de poste du chef de service et pastille d'Options

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Numéros des notes, spec 009, CLAUDE.md et vérification d'ensemble

**Files:**
- Modify: `components/reforme/SectionReforme.tsx`, `app/(tabs)/options.tsx`, `data/acte2/courrier2.ts`, `scripts/simulate-acte2.ts`, `scripts/tests/reforme.test.ts` (commentaires et titres : numéros des notes)
- Modify: `specs/009-acte2-direction/spec.md` (tableau des notes, filet de sécurité)
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: tout ce qui précède.
- Produces: numéros de notes à jour partout (n° 6 Marché public, n° 8 Pièce délivrée par nos services, n° 11 Réforme, n° 12 Plan de dématérialisation, n° 17 Tableau de bord, n° 18 Promotion) ; documentation à jour.

- [ ] **Step 1: Les numéros dans le code**

- `components/reforme/SectionReforme.tsx` : remplacer ` * Réforme (Options, acte II, après la note n° 10) : une carte qui ouvre le Formulaire R-01.` par ` * Réforme (Options, acte II, après la note n° 11) : une carte qui ouvre le Formulaire R-01.`
- `app/(tabs)/options.tsx` : remplacer `        // Tableau de bord (note n° 16) : il mesure ce qui a été jugé mesurable.` par `        // Tableau de bord (note n° 17) : il mesure ce qui a été jugé mesurable.`
- `data/acte2/courrier2.ts` : remplacer ``/** Vrai si `n` délais de filet se sont écoulés depuis la note n° 7, sans aucune boucle. */`` par ``/** Vrai si `n` délais de filet se sont écoulés depuis la note n° 8, sans aucune boucle. */``
- `scripts/simulate-acte2.ts` : remplacer `/** Minutes qu'un humain met à comprendre la note n° 7 (première partie seulement). */` par `/** Minutes qu'un humain met à comprendre la note n° 8 (première partie seulement). */`
- `scripts/tests/reforme.test.ts` : remplacer `/** Acte II d'une partie de Camille, note n° 10 en vigueur : la Réforme est possible. */` par `/** Acte II d'une partie de Camille, note n° 11 en vigueur : la Réforme est possible. */`, et `test('la Réforme exige l’acte II et la note n° 10 en vigueur', () => {` par `test('la Réforme exige l’acte II et la note n° 11 en vigueur', () => {`

Run: `grep -rnE "note n° (7|10|16)([^0-9]|$)" app components data context scripts`
Expected: aucune ligne.

- [ ] **Step 2: La spec 009**

Dans `specs/009-acte2-direction/spec.md`, remplacer les lignes 6 à 17 du tableau des notes :

```markdown
| 6 | Chef de bureau | Ouvre le Chef de bureau | 10 Instructeurs |
| 7 | Pièce délivrée par nos services | Étape Pièce délivrée par nos services. Texte-indice : « Un justificatif délivré par nos services fait foi pour toute démarche, y compris celle qui l'a délivré. » | 25 – 35 min |
| 8 | Délai de réflexion | Étape Délai de réflexion | Après n° 7 |
| 9 | Troisième guichet thématique | Procédure Attestation d'hébergement | Après n° 7 |
| 10 | Réforme de l'action publique | Débloque la Réforme | Premier dossier en boucle |
| 11 | Plan de dématérialisation | Révèle le Taux de dématérialisation | Premier dossier en boucle + délai |
| 12 | Rejet élargi | Taux de rejet max 80 % | Après n° 11 |
| 13 | Commission ad hoc | Étape Commission | Après n° 11 |
| 14 | Sous-directeur | Ouvre le Sous-directeur | 10 Chefs de bureau |
| 15 | Quatrième guichet thématique | Procédure Certificat de vie | Après n° 13 |
| 16 | Tableau de bord | Affiche les Abandons de démarche et le taux de satisfaction | 25 % de dématérialisation |
| 17 | Promotion | Termine l'acte II | 100 % de dématérialisation |
```

par :

```markdown
| 6 | Marché public de fournitures (specs/010) | Service des achats : ramettes commandées sur le budget quand le stock baisse (interrupteur dans Service) | Après n° 5 et 18 000 étapes franchies |
| 7 | Chef de bureau | Ouvre le Chef de bureau | 10 Instructeurs |
| 8 | Pièce délivrée par nos services | Étape Pièce délivrée par nos services. Texte-indice : « Un justificatif délivré par nos services fait foi pour toute démarche, y compris celle qui l'a délivré. » | 25 – 35 min |
| 9 | Délai de réflexion | Étape Délai de réflexion | Après n° 8 |
| 10 | Troisième guichet thématique | Procédure Attestation d'hébergement | Après n° 8 |
| 11 | Réforme de l'action publique | Débloque la Réforme | Premier dossier en boucle |
| 12 | Plan de dématérialisation | Révèle le Taux de dématérialisation | Premier dossier en boucle + délai |
| 13 | Rejet élargi | Taux de rejet max 80 % | Après n° 12 |
| 14 | Commission ad hoc | Étape Commission | Après n° 12 |
| 15 | Sous-directeur | Ouvre le Sous-directeur | 10 Chefs de bureau |
| 16 | Quatrième guichet thématique | Procédure Certificat de vie | Après n° 14 |
| 17 | Tableau de bord | Affiche les Abandons de démarche et le taux de satisfaction | 25 % de dématérialisation |
| 18 | Promotion | Termine l'acte II | 100 % de dématérialisation |
```

et remplacer `| Filet de sécurité (si pas de boucle) | 15 min après la note n° 7 |` par `| Filet de sécurité (si pas de boucle) | 15 min après la note n° 8 |`.

- [ ] **Step 3: CLAUDE.md**

Section « Project Overview », remplacer `(first prestige, Options at Act II once note n° 10 is in force)` par `(first prestige, Options at Act II once note n° 11 is in force)`, et ajouter à la fin de ce premier paragraphe :

```markdown
 Act II explains itself the way Act I does (spec: `specs/010-acte2-lisibilite/spec.md`): a chef de service job sheet (`data/acte2/fiche.ts`, `components/direction/FichePosteDirection.tsx`) opens on entry and gains a line per unlocked mechanic (badge on the Options tab until re-read, « Relire ma fiche de poste »); the bubble is a circulation table; Budget and Formulaires show smoothed signed rates; the Atelier shows each procedure's dossiers, abandons and per-dossier balance and lists locked step types as « En attente de réglementation ». Act II ramettes cost 80 € (Act I: 8 €) against a 1.60 € base dotation per step, so supplies weigh ~35 % of income at ×1; note n° 6 « Marché public de fournitures » unlocks the Service des achats (automatic ramettes below 30 s of capacity, also offline, switch in the Service tab).
```

Section « Commands », dans la ligne de `scripts/save-acte2.ts`, remplacer `finActeI, debut, atelier, boucle, demat, fin, reforme, cerfa2)` par `finActeI, debut, atelier, achats, boucle, demat, fin, reforme, cerfa2)`.

Section « GameStateContext », sous la ligne `- **Réforme:** …`, ajouter :

```markdown
- **Lisibilité (Act II):** `fiche2` (job sheet view; `marquerFichePoste` opens/closes the Act I or Act II sheet depending on the act), `debits` (smoothed €/s and formulaires/s, not saved; reset after an absence, a Réforme, a test shortcut), `reglerAchats` (Service des achats switch).
```

Section « Data layer files », sous la ligne de `data/acte2/vueAtelier.ts`, ajouter :

```markdown
| `data/acte2/fiche.ts` | Act II job sheet: lines unlocked by notes in force, read lines, Options badge |
| `data/acte2/debits.ts` | Header rates: event flows, cost of a formulaire bought by the Service des achats, exponential smoothing |
```

Section « Navigation », remplacer `bubble with the parapheur and its procedure as linked mini-cards;` par `bubble with the parapheur and its procedure as a circulation table (dossiers waiting at each step, guichet or stamp pictogram, thick border on the most loaded step);`, et `` `recruitment.tsx` shows `ServiceDirection` (guichets and agents)`` par `` `recruitment.tsx` shows `ServiceDirection` (ramettes, the Service des achats switch after note n° 6, guichets and agents)``.

- [ ] **Step 4: Vérification d'ensemble**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur ; `ℹ pass 164`, `ℹ fail 0`.

Run: `node scripts/simulate-acte2.ts 2 300 balayage` et `node scripts/simulate-acte2.ts 2 300 0 15 | grep -E "réforme débloquée|rejoué|fin de"`
Expected: les nombres de la Tâche 3, Step 3.

Run: `npm run build:web`
Expected: export web sans erreur dans `dist/`.

Navigateur, 375 × 812 puis 375 × 667, un seul onglet de jeu : parcours `finActeI` → « PRENDRE MES FONCTIONS » → fiche (quatre lignes) → Direction (débits, tableau de circulation) ; préréglage `achats` → Service (interrupteur), Atelier (bilan, étapes en attente de réglementation), Notes (« NOTE DE SERVICE N° 006 · Marché public de fournitures » approuvée) ; Options (pas de pastille, « Relire » : huit lignes). Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 5: Commiter**

```bash
git add components/reforme/SectionReforme.tsx "app/(tabs)/options.tsx" data/acte2/courrier2.ts scripts/simulate-acte2.ts scripts/tests/reforme.test.ts specs/009-acte2-direction/spec.md CLAUDE.md
git commit -m "docs: lisibilité de l'acte II, service des achats et numéros des notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-review (couverture de la spec)

| Exigence de `specs/010-acte2-lisibilite/spec.md` | Où |
|---|---|
| Décision 1 : découverte totale, objectif apparent, Démat. caché jusqu'à sa note | Tâche 5 (ligne « Votre évaluation portera sur le volume traité », test : aucune ligne ne nomme la boucle ni la dématérialisation) ; aucune tâche ne touche `dematVisible` |
| 1. Fiche de poste du chef de service au format de `FichePoste.tsx`, ouverte à l'entrée (après « PRENDRE MES FONCTIONS »), relisible dans Options, boutons « PRENDRE MON POSTE » / « FERMER » | Tâches 1 (`ficheVue` faux à l'entrée), 5 (`vueFiche2`, `premiere`), 8 (`marquerFichePoste` par acte), 13 (fenêtre, « Relire » à l'acte II) |
| 1. Lignes ajoutées au fil des déblocages, pastille sur Options jusqu'à relecture ; neuf lignes (quatre toujours, Agents, Atelier, Exemplaires, Pièce de service, Marché public) | Tâches 5 (`LIGNES`, `nonLues`, tests), 13 (pastille de l'onglet et du bouton, « NOUVEAU ») ; question 9 |
| 2. Tableau de circulation : dossiers en attente et qui traite chaque fiche ; la plus encombrée marquée (bord épais + chiffre) ; parapheur, « Dossier sans usager », compact inchangés | Tâches 6 (`tableauCirculation`, tests), 10 (bulle) ; question 11 |
| 3. Débits signés par seconde sous Budget et Formulaires, lissés, format français | Tâches 4 (`lisserDebits`, `formatDebitSigne`, tests), 8 (flux des ticks et des taps), 9 (en-tête) ; question 5 |
| 4. Atelier : dossiers en cours, abandons de la procédure, bilan par dossier (symboles + mots) ; effets par étape conservés | Tâches 1 et 2 (`abandonsProc`), 6 (`bilanProcedure`, `enCours`, tests), 11 (`BilanProcedure`) ; questions 6 et 7 |
| 4. Feuille « Ajouter une étape » : étapes pas encore débloquées, non sélectionnables, « En attente de réglementation », sans la note | Tâches 6 (`disponible`), 11 (`ChoixVerrouille`) |
| 5. Fournitures ≈ 30 – 40 % des recettes en ×1 (ramette d'acte II relevée, acte I inchangé) ; Exemplaires = vrai arbitrage | Tâches 2 (`BALANCE2.prixRamette`, test de la part), 3 (35,3 % mesuré en ×1) ; questions 1 et 2 |
| 5. Note « Marché public de fournitures » au milieu de l'acte, avant la boucle ; Service des achats automatique sous un seuil, interrupteur dans Service activé à l'achat ; aucune ressource nouvelle ; fonctionne hors ligne | Tâches 2 (note n° 6, `commandeAchats` dans `tick2`, `reglerAchats`, tests dont l'absence), 3 (16 min au robot, boucle à 26 min), 12 (carte, règlement) ; questions 3 et 4 |
| 5. Rythme recalé au simulateur, robot qui achète les fournitures, cibles de la spec 009 inchangées | Tâche 3 (robot, mesures, spec 009) |
| 6. Préréglages existants valides ; préréglage « Acte II — service des achats » ; fiche réputée lue sauf « prise de fonctions » | Tâche 7 (tests) |
| Contraintes permanentes : pas d'annulation, pas de ligne sous un contrôle, pas de « ? », pas de définition de compteur, rien sur la scène, Espace seul raccourci ; 44 pt, libellés, rien par la seule couleur | Tâches 9 à 13 (aucune ligne d'explication : seule la mention exigée par la spec sur les étapes verrouillées ; interrupteur `switch` 44 pt avec mot et coche ; fiche encombrée au bord épais ; débits lus « plus 15 euros par seconde ») |
| Sauvegarde : les anciennes sauvegardes (acte I, acte II, après Réforme) se chargent | Tâche 1 (`normaliserSauvegarde`, test) ; l'acte I et `reformes` ne changent pas ; question 8 |
| Vérification : `npm test` (débits, bilan, service des achats, prix, lignes de fiche), navigateur 375 × 812 et 375 × 667 via `?test` sans erreur console, simulateur | Tâches 1 à 7 (21 tests nouveaux, 164 au total), 8 à 14 (navigateur), 3 et 14 (simulateur) |

Vérifications faites sur ce plan : aucune étape sans code ; les noms viennent du code livré (`entrerActe2`, `etatInitialActe2`, `getModifiers2`, `noteEffective2`, `franchir`, `tick2`, `tamponner2`, `simulerAbsence2`, `acheterRamettes2`, `requisitionUrgence2`, `prixRamette2`, `vitesseGuichets`, `vitesseVisas`, `notesVisibles2`, `notesAffichees2`, `vueDirection`, `vueService2`, `vueAtelier`, `effetsEtape`, `normaliserSauvegarde`, `estSauvegardeValide`, `sauvegardePreset`, `PRESETS_INFO`, `robotActe2`, `useFermetureEchap`, `Panneau`, `BoutonPoussoir`, `NotificationBadge`, `Effets`, `IconeEtape`) ; types cohérents d'une tâche à l'autre (`LigneFiche2Id`, `EtapeChaine.traitePar/encombree`, `ProcAtelier.enCours/abandons/bilan`, `ChoixEtape.disponible`, `VueService2.achats`, `VueDirection.achatsVisible`, `VueFiche2`, `Debits`, `Events2.formulaires/achats`). Le code des Tâches 1 à 13 a été rejoué depuis le texte de ce plan sur une copie neuve du worktree : chaque remplacement trouve son ancre une seule fois, `tsc`, `npm run lint` et `npm test` passent après chaque tâche (145, 153, 153, 156, 159, 163, 164 tests). Les simulateurs donnent les nombres de la Tâche 3. Une construction web de la copie a été vérifiée dans le navigateur à 375 × 812 et 375 × 667 (préréglages `debut` et `achats` : fiche, débits, tableau de circulation, carte du Service des achats, bilan de l'Atelier, feuille « Ajouter une étape », Options), console sans erreur.
