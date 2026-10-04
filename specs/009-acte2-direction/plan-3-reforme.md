# Acte II — Réforme, Jurisprudence, déjà-vu, Cerfa redemandé, calage du mur — Implementation Plan (3/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la Réforme (premier prestige : trombones, retour au Cerfa puis au début de l'acte I), la Jurisprudence (six bonus permanents), le déjà-vu administratif, le Cerfa redemandé sous un nouveau numéro, les nouveaux noms des services à chaque Réforme, et caler le mur de fin d'acte II pour que la Réforme soit rentable. Spec : `specs/009-acte2-direction/spec.md` (sections « La Réforme », « Jurisprudence », « Déjà-vu administratif », US8, « Rythme cible », « Technique »).

**Architecture:** Ce qui survit à une Réforme vit dans un nouveau champ `GameState.reformes` (type `Reformes`, `types/reforme.ts`) : nombre de Réformes, trombones, Jurisprudence, Conformité déjà convertie, notes déjà instruites, procédures mémorisées, noms des services, premier Cerfa. `data/jurisprudence.ts` (sans dépendance vers les moteurs) porte l'état initial, les effets de la Jurisprudence et du déjà-vu, et le tirage des noms ; les deux moteurs (`data/engine.ts`, `data/acte2/moteur.ts`) l'importent. `data/reforme.ts` porte la Réforme elle-même (`reformer`, trombones, Cerfa, lettre, achat de Jurisprudence, vue du dossier administratif). Le mur est une propriété du moteur de l'acte II : `rendementDemat` (sclérose des services, jurisprudence constante). `GameStateContext` expose `reforme`, `cerfaNumero`, `reformer`, `acheterJurisprudence` ; les composants de la Réforme vivent dans `components/reforme/` et n'importent jamais `data/`. Les robots des simulateurs passent dans `scripts/robots.ts`, partagé par `simulate-acte1.ts` et `simulate-acte2.ts` (Réforme comprise).

**Tech Stack:** TypeScript strict, React Native / Expo 53 (expo-router, lucide-react-native), Node 25 (`node:test`).

**Découpage de l'acte II en trois plans :**
1. Plan 1 — moteur et simulateur (fait).
2. Plan 2 — écrans et branchement (fait).
3. **Ce plan** — Réforme, Jurisprudence, déjà-vu administratif, Cerfa redemandé, calage du mur.

## Questions ouvertes pour le porteur de projet

Chaque point est tranché dans ce plan par le défaut indiqué ; un autre choix ne touche que la tâche citée. La Réforme est un reset total (tranché) : rien ici ne le remet en cause.

1. **Le mur et la rentabilité de la Réforme.** Mesuré sur une copie du worktree : avec les seuls leviers de la spec (coût croissant des guichets, des agents et des formulaires ; les six bonus tels qu'écrits), la deuxième partie de l'acte II n'est qu'un décalage d'une dizaine de minutes de la première : la capacité des guichets croît comme le logarithme du budget, aucun bonus ne la multiplie, et une Réforme à 50 – 70 % n'est jamais rentable (fin de l'acte 20 à 60 min *plus tard* qu'en continuant). *Défaut :* deux mécaniques invisibles, sans ressource nouvelle (Tâche 2) :
   - **Sclérose des services (le mur)** : chaque étape franchie en boucle rapporte `1 / (1 + durée des services / 1 250 s)` point de dématérialisation ; la durée court depuis l'entrée dans l'acte II (absences simulées comprises) et la Réforme la remet à zéro. Satire : une réforme « réorganise sans rien changer », et pourtant tout repart.
   - **Jurisprudence constante** : chaque trombone obtenu (dépensé ou non) ajoute 10 % à ce rendement, pour toutes les parties suivantes.
   - La Conformité de l'acte II compte ×120 (`BALANCE2.conformiteParPoint`) : elle ne sert qu'à la Réforme, et ainsi les trombones récompensent l'acte II plutôt que l'acte I déjà joué (6 trombones au déblocage, 17 à 60 %, 21 à 80 %).
   Résultats et ajustements associés dans la question 3 et la Tâche 6.
2. **Déjà-vu : coût aussi.** La spec ne divise que le délai d'instruction (÷ 4). Mesuré : l'acte I rejoué prend alors 54 min au robot (délais ÷ 4 seuls), 26 min avec le coût ÷ 4. *Défaut :* délai ÷ 4 **et coût ÷ 6** (« procédure simplifiée ») : 18,5 à 21,7 min robot, soit la cible humaine de 20 – 30 min (Tâche 4).
3. **Rythme cible et lecture de « rentable à partir de 50 – 70 % ».** Avec ces réglages, le robot (2 taps/s) finit l'acte sans Réforme en 191,5 min (cible robot 150 – 200) ; une Réforme à 0, 20, 40, 50, 60 ou 70 % le fait finir plus tôt (124,7 → 182,2 min) ; à 80 %, non (199,5). Avec 15 min de temps de compréhension de l'indice (paramètre `découverte`, qui imite un humain), la Réforme est rentable de 0 à 80 %. Le plus rapide est de réformer dès le déblocage : robot « humain » 42,2 min (Réforme débloquée, cible 40 – 55), 63,9 min (acte I rejoué, cible 60 – 90), 132,7 min (fin de l'acte, cible 105 – 135). *Défaut :* « rentable à partir de 50 – 70 % » est lu « rentable au moins jusqu'à 70 % » ; la Tâche 6 le vérifie au simulateur.
4. **Dossiers en boucle : 1 + taux de rejet par usager.** Le moteur livré dépose le dossier de l'usager dans la procédure exigée *et* le laisse poursuivre la sienne ; en fin de procédure, la part rejetée reste en circulation : chaque usager laisse 1 + taux de rejet dossiers permanents, la spec (« chaque nouvel usager qui entre dans une procédure bouclée ajoute un dossier en boucle ») en veut un. *Recommandation et défaut :* corriger (le dossier part, il ne se dédouble pas) ; c'est aussi une condition du calage (Tâche 2).
5. **Usager compté deux fois (simple dépendance).** Quand une procédure exige une pièce d'une procédure qui ne la boucle pas, l'usager a deux dossiers et compte deux fois dans la population occupée. Mesuré au robot : 11 % des demandes déposent un tel dossier lié, qui part en boucle quelques secondes plus tard. *Défaut :* non corrigé (il faudrait une troisième famille de stocks dans tout le moteur) ; à rouvrir si une partie réelle montre une file d'usagers anormalement vide.
6. **`demandeRate` divisé par 25 au plan 1.** *Défaut :* inchangé (1 / 500). Le mur vient désormais de la sclérose ; rouvrir la demande accélérerait le début de l'acte et brouillerait les jalons calés.
7. **Le robot n'embauchait aucun Chef de bureau ; les notes 12 à 15 n'étaient jamais atteintes.** Le robot ne renforçait que les visas quand ils étaient plus nombreux que tout le reste, ce qui n'arrivait jamais avec un seul Visa par procédure. *Défaut :* le robot choisit la meilleure capacité par euro pondérée par la part des dossiers qui l'attendent, et compose ses procédures avec un second Visa (Tâche 6) ; les notes n° 11 à 15 coûtent 12 000, 25 000, 40 000, 60 000 et 90 000 € (au lieu de 50 000 à 300 000). Le robot embauche son premier Chef de bureau vers 24 min et atteint les notes 11, 12, 13 et 15 ; la note 14 (Sous-directeur, 10 Chefs de bureau, seuil de la spec) reste hors de portée du robot, qui n'en a jamais plus de 6.
8. **Réforme débloquée à 27 min (robot) pour une cible humaine de 40 – 55.** *Défaut :* inchangé : le robot construit la boucle à l'instant où la note n° 7 entre en vigueur ; avec 15 min de compréhension, il la débloque à 42,2 min.
9. **Quand la Jurisprudence agit-elle ?** La spec la fait acheter dans Options ; achetés après la Réforme, Précédent (acte I) et Antériorité (acte II) attendraient une partie de plus. *Défaut :* achetés pendant l'acte qu'ils concernent, ils complètent aussitôt les stagiaires à 3 ou les guichets à 10 ; Mémoire des services n'écrase jamais une procédure déjà modifiée par le joueur dans la partie (Tâche 4).
10. **Carte « Réforme » (maquette 10).** La maquette met sous le titre « Réorganise l'ensemble des services sans en modifier le fonctionnement. » *Défaut :* retiré (ligne sous un contrôle) ; la phrase vit dans l'article « La Réforme » du règlement intérieur. Le Formulaire R-01 garde le tableau de la maquette, avec « Conservé : Tampons, trombones, Jurisprudence » (la maquette omet la Jurisprudence) (Tâche 8).
11. **Ce qui change de nom.** *Défaut :* les procédures partout (bulle, Atelier, lettres) ; le service dans le dossier administratif (Affectation), le règlement intérieur, la démission et la fin d'acte. L'onglet garde son libellé « Direction » (repère de navigation) (Tâches 5 et 9).
12. **Deux Cerfa n° 00001*02.** La démission porte déjà « Cerfa n° 00001*02 », numéro que la spec donne au Cerfa d'embauche redemandé. *Défaut :* la démission devient « Cerfa n° 00002*01 » (Tâche 8).
13. **Courrier après la Réforme.** *Défaut :* les lettres reçues restent dans le courrier ; les lettres de l'acte I et de l'acte II peuvent revenir à la partie suivante, sauf les lettres d'avancement (le compteur survit) ; une lettre « Réforme : nouvelle dénomination de vos services » par Réforme, qui cite le nouveau numéro de Cerfa et rappelle que le 00001*01 « demeure l'original » (Tâche 3).
14. **Notes de l'acte I au replay.** Leurs seuils suivent le compteur Tampons apposés, qui survit : toutes celles à seuil de tampons sont visibles dès le début (la note n° 1 aussi). *Défaut :* gardé, c'est le déjà-vu ressenti ; leur coût et leur délai sont réduits (question 2).
15. **Trombones et Jurisprudence avant la première Réforme.** *Défaut :* invisibles (glossaire : « après la première Réforme ») ; la section « Réforme » d'Options n'apparaît qu'à l'acte II, note n° 10 en vigueur (Tâche 8).

## Global Constraints

- **Base :** branche `feat/acte2-direction-scene` (origin/main + scène de l'acte II + plans 1 et 2, 116 tests verts). Ne jamais faire `git add -A` ni `git add .` : chaque commit liste ses fichiers. Rien de ce plan ne part sur main avant sa dernière tâche.
- **Réforme = reset total** (décision du porteur de projet) : retour au tout début de l'acte I ; ne survivent que les trombones, la Jurisprudence achetée, le compteur Tampons apposés (donc le grade), le prénom et le premier Cerfa (stocké inchangé ; nouveau Cerfa *02, *03…), plus ce que ce plan ajoute pour les faire fonctionner (notes déjà instruites pour le déjà-vu, procédures pour Mémoire des services, noms tirés, lettres reçues).
- **Couches strictes :** `components/` et `app/` n'importent jamais `data/` ; tout passe par `useGameState()`, qui réexporte les types utiles. `data/jurisprudence.ts` n'importe aucun moteur (les deux moteurs l'importent).
- **Constantes :** celles de l'acte II et de la Réforme vont dans `constants/balanceActe2.ts` (la spec dit `balance.ts` ; le code a séparé les actes, on suit le code).
- **Ce que l'interface n'ajoute pas** (retiré exprès par le porteur de projet) : annulation d'achat (la Jurisprudence est définitive) ; lignes d'explication sous les contrôles (coût, « Il manque X trombones », astuces) ; boutons « ? » ; définitions de compteurs ; ordre du jour ; circulaires ; raccourcis clavier autres que la barre d'espace ; tout bandeau posé sur la scène pixel.
- **Charte de main :** couleurs de `constants/Colors.ts` uniquement, tailles par `Typo`, `Interligne`, `Espace`, `Charte` ; `StyleSheet.create` ; `Panneau`, `BoutonPoussoir` ; `Pressable` seulement ; composants ≤ ~300 lignes ; `React.memo` sur les éléments de liste. Quand une maquette contredit main, main l'emporte.
- **Accessibilité :** cibles ≥ 44 × 44 pt, libellé d'accessibilité sur chaque bouton, aucune information portée par la seule couleur (bonus acquis = tampon « ACQUISE » en plus de la couleur).
- Textes en jeu en français, apostrophes typographiques `’`, nombres au format français (`utils/formatters`). Pas de `any`. Prettier : guillemets simples, indentation de 2 espaces.
- Commits au format Conventional Commits (`feat(logic): …`, `feat(state): …`, `feat(ui): …`, `perf(logic): …`, `test: …`, `docs: …`), terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Vérifier dans le navigateur (tâches d'interface)

1. **Serveur :** depuis la racine du dépôt, `npx expo start --web --port 8085` (ou la configuration `bureaucracy-main-actuel` de `.claude/launch.json`, à la racine de `BUREAUCRACY++`, qui pointe sur ce worktree). Ouvrir `http://localhost:8085` dans le Browser pane (`preview_start` avec l'URL). **Un seul onglet de jeu** : deux onglets se disputeraient la sauvegarde. Si Metro ne voit pas une modification : relancer avec `--clear` (dossier iCloud, voir CLAUDE.md).
2. **Largeur de téléphone :** `resize_window` preset `mobile` (375 × 812) ; écran compact : `resize_window` 375 × 667. Revenir au preset `desktop` à la fin.
3. **Charger une sauvegarde de vérification :** `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <préréglage>` imprime une ligne `localStorage.setItem(…)`. Dans le même onglet, naviguer sur `http://localhost:8085/manifest.webmanifest` (fichier statique : le jeu n'y tourne pas et ne peut pas réécrire la sauvegarde), exécuter la ligne avec `javascript_tool`, puis naviguer sur `http://localhost:8085/`. Préréglages ajoutés par ce plan : `reforme` (acte II à 60 % de dématérialisation, note n° 10 en vigueur, 15 trombones à gagner) et `cerfa2` (juste après cette Réforme : Cerfa n° 00001*02 à signer, 15 trombones à dépenser, toutes les notes de l'acte I déjà instruites).
4. **Lire l'état :** `javascript_tool` → `JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')).reformes` (écrit au plus une seconde après chaque changement).

## File Structure

| Fichier | Rôle | Statut |
|---|---|---|
| `types/reforme.ts` | `JurisprudenceId`, `Denomination`, `Reformes` | Créer |
| `types/game.ts` | `GameState.reformes` | Modifier |
| `types/acte2.ts` | `EtatActe2.duree`, `EtatActe2.memoireRestauree`, `Modifiers2.droitAcquis` | Modifier |
| `constants/balanceActe2.ts` | `REFORME`, `JURISPRUDENCE`, `BALANCE2.conformiteParPoint`, `demaCible` recalé | Modifier |
| `data/jurisprudence.ts` | État initial des Réformes, effets de la Jurisprudence, déjà-vu, noms tirés | Créer |
| `data/reforme.ts` | Trombones, `reformer`, Cerfa, lettre, achat de Jurisprudence, vue du dossier administratif | Créer |
| `data/engine.ts` | `etatInitial` (`reformes`), Jurisprudence et déjà-vu à l'acte I | Modifier |
| `data/acte2/moteur.ts` | Sclérose, jurisprudence constante, un dossier par usager, Jurisprudence, déjà-vu, Mémoire des services | Modifier |
| `data/acte2/notes2.ts` | Coûts des notes n° 11 à 15 | Modifier |
| `data/save.ts` | Validation et normalisation de `reformes`, `duree`, `memoireRestauree` | Modifier |
| `data/courrier.ts` | Lettre de la Réforme | Modifier |
| `data/acte2/courrier2.ts` | Noms des procédures tirés | Modifier |
| `data/acte2/vues.ts` | `nomService`, `reformeVisible`, noms, guichets offerts, notes déjà instruites | Modifier |
| `data/acte2/vueAtelier.ts` | Noms des procédures tirés | Modifier |
| `scripts/robots.ts` | Robots des acte I et II, Réforme du robot | Créer |
| `scripts/simulate-acte1.ts` | Utilise `robotActe1` | Modifier |
| `scripts/simulate-acte2.ts` | Réforme, balayage, temps de découverte | Modifier |
| `scripts/presets-acte2.ts` | Préréglages `reforme`, `cerfa2` ; fin d'acte I complète | Modifier |
| `scripts/save-acte2.ts` | Liste des préréglages | Modifier |
| `scripts/tests/reforme.test.ts` | Tests de la Réforme | Créer |
| `scripts/tests/acte2.test.ts` | Conformité de l'acte II ×120 | Modifier |
| `scripts/tests/vues-acte2.test.ts` | `cerfa2` est à l'acte I | Modifier |
| `context/GameStateContext.tsx` | `reforme`, `cerfaNumero`, `reformer`, `acheterJurisprudence`, notes déjà instruites, prix des ramettes | Modifier |
| `components/reforme/SectionReforme.tsx` | Carte Réforme et Formulaire R-01 | Créer |
| `components/reforme/ListeJurisprudence.tsx` | Bonus de Jurisprudence | Créer |
| `app/(tabs)/options.tsx` | Trombones, Réforme, Jurisprudence, nom du service, Cerfa de démission | Modifier |
| `components/CerfaEcran.tsx` | Numéro du Cerfa, prénom repris | Modifier |
| `app/(tabs)/notes.tsx` | « Dossier déjà instruit, procédure simplifiée. » | Modifier |
| `components/direction/FinActe2Modal.tsx` | Nom du service | Modifier |
| `components/ReglementInterieur.tsx` | Nom du service | Modifier |
| `components/direction/reglementDirection.ts` | Article « La Réforme » | Modifier |
| `specs/009-acte2-direction/spec.md` | Mur, déjà-vu, mesures du robot | Modifier |
| `CLAUDE.md` | Réforme, simulateurs, préréglages | Modifier |

Toutes les commandes se lancent depuis la racine du dépôt (le worktree `bureaucracy_v.1.17.0-MVP/.claude/worktrees/…`). Avant de commencer : `npm test` doit passer (`ℹ pass 116`).

---

### Task 1: Types, constantes et sauvegarde de la Réforme

**Files:**
- Create: `types/reforme.ts`
- Create: `data/jurisprudence.ts`
- Create: `scripts/tests/reforme.test.ts`
- Modify: `types/game.ts` (`GameState`)
- Modify: `types/acte2.ts` (`EtatActe2`, `Modifiers2`)
- Modify: `constants/balanceActe2.ts` (imports, `REFORME`, `JURISPRUDENCE`)
- Modify: `data/engine.ts` (`etatInitial`)
- Modify: `data/acte2/moteur.ts` (`etatInitialActe2`, `getModifiers2`)
- Modify: `data/save.ts` (`estSauvegardeValide`, `normaliserSauvegarde`)

**Interfaces:**
- Consumes: `PROC_NOMS` (`constants/balanceActe2.ts`), `NoteId`, `GameState` (`types/game.ts`), `Note2Id`, `Etape`, `ProcId` (`types/acte2.ts`).
- Produces: types `JurisprudenceId`, `Denomination`, `Reformes` ; `REFORME` (`k`, `dejaVuDelai`, `dejaVuCout`, `scleroseS`, `jurisprudenceConstante`, `guichetsAnteriorite`, `stagiairesPrecedent`, `remiseVideJuridique`, `bonusAnciennete`), `JurisprudenceDef`, `JURISPRUDENCE` ; dans `data/jurisprudence.ts` : `DENOMINATION_INITIALE`, `reformesInitiales()`, `aJurisprudence(s, id)`, `dejaInstruite(s, id)`, `dejaInstruite2(s, id)`, `conditionsNote(deja, cout, instruction)`, `dotationJurisprudence(s)`, `prixFormulairesJurisprudence(s)`, `tirerDenomination(actuelle, alea)`. Helpers de test `x`, `avec2`, `avecNotes2`, `proche`.

- [ ] **Step 1: Écrire le test (il échoue)**

`scripts/tests/reforme.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import { BALANCE } from '../../constants/balance';
import { BALANCE2, REFORME } from '../../constants/balanceActe2';
import type { EtatActe2, Note2Id } from '../../types/acte2';
import type { GameState } from '../../types/game';

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

function avecNotes2(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

const proche = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('sauvegardes antérieures à la Réforme : reformes complétées, âge des services déduit', () => {
  const acte1: Partial<GameState> = { ...E.etatInitial(0) };
  delete acte1.reformes;
  assert.equal(estSauvegardeValide(acte1), true);
  assert.deepEqual(normaliserSauvegarde(acte1 as GameState).reformes, E.etatInitial(0).reformes);

  const s2 = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 1000);
  const { duree: _d, memoireRestauree: _m, ...ancien } = x(s2);
  const sauvegarde = { ...s2, derniereMaj: 61_000, acte2: ancien } as unknown as GameState;
  delete (sauvegarde as Partial<GameState>).reformes;
  const n = normaliserSauvegarde(sauvegarde);
  assert.equal(x(n).duree, 60);
  assert.equal(x(n).memoireRestauree, false);
  assert.equal(n.reformes.nombre, 0);
  assert.equal(estSauvegardeValide({ ...s2, reformes: { nombre: 'deux' } }), false);
});
```

`BALANCE`, `BALANCE2`, `REFORME`, `avecNotes2` et `proche` servent aux tâches suivantes, qui complètent ce fichier.

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `scripts/tests/reforme.test.ts` : `REFORME` n'est pas exporté par `constants/balanceActe2.ts` (SyntaxError à l'import).

- [ ] **Step 3: Les types**

`types/reforme.ts` :

```ts
/**
 * Types de la Réforme (premier prestige) : trombones, Jurisprudence, déjà-vu administratif.
 * Voir specs/009-acte2-direction/spec.md, section « La Réforme ».
 */
import type { NoteId } from './game';
import type { Etape, Note2Id, ProcId } from './acte2';

export type JurisprudenceId =
  | 'droitAcquis'
  | 'precedent'
  | 'videJuridique'
  | 'anteriorite'
  | 'memoire'
  | 'anciennete';

/** Noms des services, tirés au sort à chaque Réforme (« rien d'autre ne change »). */
export interface Denomination {
  /** Nom du service du chef, avec son article : « La Direction », « Le Pôle de la simplification »… */
  direction: string;
  procedures: Record<ProcId, string>;
}

/** Tout ce qui survit à une Réforme, avec le compteur Tampons apposés et le prénom. */
export interface Reformes {
  /** Réformes accomplies (0 avant la première). */
  nombre: number;
  /** Trombones disponibles (gagnés moins dépensés en Jurisprudence). */
  trombones: number;
  /** Trombones obtenus depuis le début, dépensés ou non (jurisprudence constante). */
  trombonesObtenus: number;
  /** Bonus de Jurisprudence achetés, dans l'ordre d'achat. */
  jurisprudence: JurisprudenceId[];
  /** Conformité des parties précédentes, déjà convertie en trombones. */
  conformiteConvertie: number;
  /** Notes de l'acte I achetées lors d'une partie précédente (déjà-vu administratif). */
  notesInstruites: NoteId[];
  /** Notes de l'acte II achetées lors d'une partie précédente. */
  notes2Instruites: Note2Id[];
  /** Procédures telles qu'avant la dernière Réforme (Mémoire des services), null avant la première. */
  procedures: Record<ProcId, Etape[]> | null;
  denomination: Denomination;
  /** Le premier Cerfa tamponné, stocké inchangé : l'original exigé à l'acte VI. Null avant la première Réforme. */
  premierCerfa: { prenom: string; signeLe: number | null } | null;
}
```

Dans `types/game.ts`, sous `import type { EtatActe2 } from './acte2';`, ajouter :

```ts
import type { Reformes } from './reforme';
```

Dans `interface GameState`, remplacer :

```ts
  /** Dernier horodatage de simulation (ms), pour le hors-ligne. */
  derniereMaj: number;
}
```

par :

```ts
  /** Dernier horodatage de simulation (ms), pour le hors-ligne. */
  derniereMaj: number;
  /** Ce qui survit aux Réformes : trombones, Jurisprudence, notes déjà instruites, noms, premier Cerfa. */
  reformes: Reformes;
}
```

Dans `types/acte2.ts`, interface `EtatActe2`, remplacer :

```ts
  acteTermine: boolean;
  finActeVue: boolean;
  stats: StatsActe2;
}
```

par :

```ts
  acteTermine: boolean;
  finActeVue: boolean;
  /** Secondes simulées depuis l'entrée dans l'acte (absences comprises, plafonnées) : l'âge des services. */
  duree: number;
  /** Mémoire des services : les procédures d'avant la Réforme ont été restaurées. */
  memoireRestauree: boolean;
  stats: StatsActe2;
}
```

et, interface `Modifiers2`, remplacer :

```ts
  reformeVisible: boolean;
  tableauVisible: boolean;
}
```

par :

```ts
  reformeVisible: boolean;
  tableauVisible: boolean;
  /** Jurisprudence « Droit acquis » : la première étape de chaque procédure ne coûte aucune patience. */
  droitAcquis: boolean;
}
```

- [ ] **Step 4: Les constantes de la Réforme**

Dans `constants/balanceActe2.ts`, sous le bloc `import type { … } from '../types/acte2';`, ajouter :

```ts
import type { JurisprudenceId } from '../types/reforme';
```

À la fin du fichier, ajouter :

```ts
/** Réforme, Jurisprudence, déjà-vu administratif et sclérose des services. Vérifié par scripts/simulate-acte2.ts. */
export const REFORME = {
  /** Trombones d'une Réforme : ⌊√(Conformité de la partie / k)⌋ (acte I compris). */
  k: 250_000,
  /** Déjà-vu administratif : une note déjà instruite a son délai divisé par… */
  dejaVuDelai: 4,
  /** … et son coût divisé par… (« procédure simplifiée »). */
  dejaVuCout: 6,
  /** Sclérose des services (le mur) : le rendement de la dématérialisation vaut 1 / (1 + durée / scleroseS), en s. */
  scleroseS: 1250,
  /** Jurisprudence constante : rendement de la dématérialisation +10 % par trombone obtenu. */
  jurisprudenceConstante: 0.1,
  guichetsAnteriorite: 10,
  stagiairesPrecedent: 3,
  remiseVideJuridique: 0.25,
  bonusAnciennete: 0.2,
} as const;

export interface JurisprudenceDef {
  id: JurisprudenceId;
  nom: string;
  effet: string;
  /** Prix en trombones. */
  cout: number;
}

/** Bonus permanents, achetés avec les trombones dans le dossier administratif. */
export const JURISPRUDENCE: JurisprudenceDef[] = [
  { id: 'videJuridique', nom: 'Vide juridique', effet: 'Formulaires −25 %.', cout: 3 },
  { id: 'precedent', nom: 'Précédent', effet: 'L’acte I commence avec 3 stagiaires.', cout: 3 },
  { id: 'droitAcquis', nom: 'Droit acquis', effet: 'Une étape sans perte de patience, par procédure.', cout: 5 },
  { id: 'anciennete', nom: 'Ancienneté reconnue', effet: 'Dotation +20 %, à tous les actes.', cout: 6 },
  { id: 'anteriorite', nom: 'Antériorité', effet: 'L’acte II commence avec 10 guichets.', cout: 5 },
  { id: 'memoire', nom: 'Mémoire des services', effet: 'Vos procédures sont restaurées à l’ouverture de l’Atelier.', cout: 8 },
];
```

Les valeurs viennent du calage fait sur une copie du worktree (Tâche 6) : la plus petite Réforme rapporte 6 trombones, assez pour deux bonus.

- [ ] **Step 5: `data/jurisprudence.ts`**

```ts
/**
 * Ce qui survit aux Réformes : état initial, Jurisprudence possédée, déjà-vu administratif, dénominations.
 * Sans dépendance vers les moteurs (data/engine.ts et data/acte2/moteur.ts l'importent tous deux).
 */
import type { GameState, NoteId } from '../types/game';
import type { Note2Id, ProcId } from '../types/acte2';
import type { Denomination, JurisprudenceId, Reformes } from '../types/reforme';
import { PROC_NOMS, REFORME } from '../constants/balanceActe2';

/** Noms de la première partie : ceux de la spec. */
export const DENOMINATION_INITIALE: Denomination = {
  direction: 'La Direction',
  procedures: { ...PROC_NOMS },
};

/** Avant toute Réforme. */
export function reformesInitiales(): Reformes {
  return {
    nombre: 0,
    trombones: 0,
    trombonesObtenus: 0,
    jurisprudence: [],
    conformiteConvertie: 0,
    notesInstruites: [],
    notes2Instruites: [],
    procedures: null,
    denomination: {
      direction: DENOMINATION_INITIALE.direction,
      procedures: { ...DENOMINATION_INITIALE.procedures },
    },
    premierCerfa: null,
  };
}

export const aJurisprudence = (s: GameState, id: JurisprudenceId): boolean =>
  s.reformes.jurisprudence.includes(id);

/** Déjà-vu administratif : la note a été achetée lors d'une partie précédente. */
export const dejaInstruite = (s: GameState, id: NoteId): boolean =>
  s.reformes.notesInstruites.includes(id);

export const dejaInstruite2 = (s: GameState, id: Note2Id): boolean =>
  s.reformes.notes2Instruites.includes(id);

/** Délai d'instruction (s) et coût d'une note, déjà-vu compris. */
export function conditionsNote(
  deja: boolean,
  cout: number,
  instruction: number,
): { cout: number; instruction: number } {
  return deja
    ? { cout: Math.round(cout / REFORME.dejaVuCout), instruction: instruction / REFORME.dejaVuDelai }
    : { cout, instruction };
}

/** Multiplicateur de dotation de la Jurisprudence (Ancienneté reconnue), à tous les actes. */
export const dotationJurisprudence = (s: GameState): number =>
  aJurisprudence(s, 'anciennete') ? 1 + REFORME.bonusAnciennete : 1;

/** Multiplicateur du prix des formulaires de la Jurisprudence (Vide juridique), à tous les actes. */
export const prixFormulairesJurisprudence = (s: GameState): number =>
  aJurisprudence(s, 'videJuridique') ? 1 - REFORME.remiseVideJuridique : 1;

const FORMES = ['Le Pôle', 'L’Agence', 'La Direction', 'La Mission', 'La Délégation', 'L’Office', 'La Cellule'];
const OBJETS = [
  'de l’action administrative',
  'de la simplification',
  'des démarches citoyennes',
  'de la relation à l’usager',
  'de la modernisation publique',
  'des parcours usagers',
];
const NOMS_PROCEDURES: Record<ProcId, string[]> = {
  identite: [
    'Démarche d’identification citoyenne',
    'Parcours d’attestation d’identité',
    'Titre d’identité simplifié',
  ],
  domicile: [
    'Attestation de résidence effective',
    'Parcours de domiciliation',
    'Certificat d’adressage citoyen',
  ],
  hebergement: [
    'Déclaration de cohabitation',
    'Parcours d’accueil résidentiel',
    'Justificatif de mise à l’abri',
  ],
  vie: [
    'Attestation d’existence',
    'Parcours de maintien en vie administrative',
    'Justificatif de présence au monde',
  ],
};

/** Tire au sort un autre nom que `actuel` dans `noms`. */
function autre(noms: string[], actuel: string, alea: () => number): string {
  const choix = noms.filter((n) => n !== actuel);
  return choix[Math.floor(alea() * choix.length) % choix.length];
}

/** Nouveaux noms des services après une Réforme : tous changent, rien d'autre. */
export function tirerDenomination(actuelle: Denomination, alea: () => number): Denomination {
  const direction = autre(
    FORMES.flatMap((f) => OBJETS.map((o) => `${f} ${o}`)),
    actuelle.direction,
    alea,
  );
  const procedures = Object.fromEntries(
    (Object.keys(NOMS_PROCEDURES) as ProcId[]).map((p) => [
      p,
      autre([PROC_NOMS[p], ...NOMS_PROCEDURES[p]], actuelle.procedures[p], alea),
    ]),
  ) as Record<ProcId, string>;
  return { direction, procedures };
}
```

- [ ] **Step 6: États initiaux**

Dans `data/engine.ts`, sous `import { EXTENSIONS_PERIMETRE, NOTES, NOTES_PAR_ID } from './notes';`, ajouter :

```ts
import { reformesInitiales } from './jurisprudence';
```

Dans `etatInitial`, remplacer :

```ts
    derniereMaj: maintenant,
  };
}
```

par :

```ts
    derniereMaj: maintenant,
    reformes: reformesInitiales(),
  };
}
```

Dans `data/acte2/moteur.ts`, sous `import { appliquerAction, estBoucle } from './procedures';`, ajouter :

```ts
import { aJurisprudence } from '../jurisprudence';
```

Dans `etatInitialActe2`, remplacer :

```ts
    acteTermine: false,
    finActeVue: false,
    stats: {
      franchies: 0,
```

par :

```ts
    acteTermine: false,
    finActeVue: false,
    duree: 0,
    memoireRestauree: false,
    stats: {
      franchies: 0,
```

Dans `getModifiers2`, remplacer :

```ts
    reformeVisible: false,
    tableauVisible: false,
  };
```

par :

```ts
    reformeVisible: false,
    tableauVisible: false,
    droitAcquis: aJurisprudence(s, 'droitAcquis'),
  };
```

- [ ] **Step 7: La sauvegarde**

Dans `data/save.ts`, remplacer :

```ts
import type { GameState } from '../types/game';
import { PROCS } from '../types/acte2';
```

par :

```ts
import type { GameState } from '../types/game';
import type { EtatActe2 } from '../types/acte2';
import { PROCS } from '../types/acte2';
import type { Reformes } from '../types/reforme';
import { reformesInitiales } from './jurisprudence';
```

Dans `estSauvegardeValide`, remplacer :

```ts
    (s.acte === undefined || s.acte === 1 || s.acte === 2) &&
    (s.acte !== 2 || acte2Valide(s.acte2))
  );
}
```

par :

```ts
    (s.acte === undefined || s.acte === 1 || s.acte === 2) &&
    (s.acte !== 2 || acte2Valide(s.acte2)) &&
    (s.reformes === undefined || reformesValides(s.reformes))
  );
}

/** Les champs de la Réforme qui comptent (les autres sont complétés par normaliserSauvegarde). */
function reformesValides(x: unknown): boolean {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Partial<Reformes>;
  return estNombre(r.nombre) && estNombre(r.trombones) && Array.isArray(r.jurisprudence);
}
```

Remplacer toute la fonction `normaliserSauvegarde` (et son commentaire) par :

```ts
/**
 * Met à niveau une sauvegarde plus ancienne : retire les champs qui n'existent plus (`circulairesVues`),
 * complète `seuilRenfort` (ancien seuil fixe de 8 tampons, pour ne pas cacher une note déjà vue),
 * place à l'acte I une partie antérieure à l'acte II (sans `acte`), complète `reformes` (aucune Réforme)
 * et, à l'acte II, l'âge des services (`duree`, depuis `debut`) et la Mémoire des services.
 */
export function normaliserSauvegarde(s: GameState): GameState {
  const { circulairesVues: _, ...reste } = s as GameState & { circulairesVues?: unknown };
  const avecSeuil = estNombre(reste.seuilRenfort) ? reste : { ...reste, seuilRenfort: 8 };
  const avecActe: GameState =
    (avecSeuil as Partial<GameState>).acte === undefined ? { ...avecSeuil, acte: 1, acte2: null } : avecSeuil;
  const lu = (avecActe as Partial<GameState>).reformes;
  const reformes: Reformes = { ...reformesInitiales(), ...(lu ?? {}) };
  const x = avecActe.acte2 as (Partial<EtatActe2> & EtatActe2) | null;
  const acte2: EtatActe2 | null = x
    ? {
        ...x,
        duree: estNombre(x.duree) ? x.duree : Math.max(0, (avecActe.derniereMaj - x.debut) / 1000),
        memoireRestauree: x.memoireRestauree ?? false,
      }
    : null;
  return { ...avecActe, acte2, reformes };
}
```

- [ ] **Step 8: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: aucune erreur de type ; `ℹ pass 117`, `ℹ fail 0`.

- [ ] **Step 9: Commiter**

```bash
git add types/reforme.ts types/game.ts types/acte2.ts constants/balanceActe2.ts data/jurisprudence.ts data/engine.ts data/acte2/moteur.ts data/save.ts scripts/tests/reforme.test.ts
git commit -m "feat(logic): état de la Réforme, Jurisprudence et sauvegarde

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Le mur — sclérose des services, jurisprudence constante, un dossier par usager

**Files:**
- Modify: `constants/balanceActe2.ts` (`BALANCE2`)
- Modify: `data/acte2/moteur.ts` (imports, `rendementDemat`, `franchir`, `tick2`)
- Modify: `scripts/tests/acte2.test.ts` (test « un tap accorde un visa »)
- Modify: `scripts/tests/reforme.test.ts`

**Interfaces:**
- Consumes: `REFORME.scleroseS`, `REFORME.jurisprudenceConstante` (Tâche 1), `s.reformes.trombonesObtenus`.
- Produces: `BALANCE2.conformiteParPoint` ; `rendementDemat(s: GameState, x: EtatActe2): number` ; `tick2` fait vieillir les services (`duree += dt`) ; un usager qui entre dans une boucle n'y laisse qu'un dossier.

- [ ] **Step 1: Écrire les tests (ils échouent)**

À la fin de `scripts/tests/reforme.test.ts`, ajouter :

```ts
test('sclérose : le rendement de la dématérialisation baisse avec l’âge des services', () => {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  proche(D.rendementDemat(s, x(s)), 1);
  proche(D.rendementDemat(s, { ...x(s), duree: REFORME.scleroseS }), 0.5);
  const obtenus = { ...s, reformes: { ...s.reformes, trombonesObtenus: 10 } };
  proche(D.rendementDemat(obtenus, x(s)), 1 + 10 * REFORME.jurisprudenceConstante);
  proche(x(D.tick2(s, 2.5, 2500).s).duree, 2.5);
});

test('un usager qui entre dans une boucle n’y laisse qu’un seul dossier, même rejeté', () => {
  let s = avecNotes2(D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0), ['atelier', 'pieceService']);
  // Population entière garée dans la procédure fermée : aucune demande, aucune installation.
  s = avec2(s, {
    guichets: 100,
    tauxRejet: 0.5,
    population: BALANCE2.populationMax,
    procedures: {
      ...x(s).procedures,
      identite: [{ type: 'piece' }, { type: 'pieceService', exige: 'domicile' }],
      domicile: [{ type: 'pieceService', exige: 'identite' }],
    },
    usagers: { ...x(s).usagers, identite: [0, 10], domicile: [0], vie: [BALANCE2.populationMax] },
    boucles: { ...x(s).boucles, identite: [0, 0], domicile: [0] },
  });
  for (let i = 1; i <= 6000; i++) s = D.tick2(s, 0.1, i * 100).s;
  proche(D.dossiersEnBoucle(x(s)), 10 * (1 - BALANCE2.abandonParPoint));
  proche(x(s).stats.abandonsDemarche, 10 * (1 - BALANCE2.abandonParPoint));
});
```

Dans `scripts/tests/acte2.test.ts`, test « un tap accorde un visa : dotation, tampon, Conformité », remplacer :

```ts
  proche(x(r.s).conformitePoints, 2);
```

par :

```ts
  proche(x(r.s).conformitePoints, 2 * BALANCE2.conformiteParPoint);
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — « sclérose … » (`D.rendementDemat is not a function`), « un usager qui entre dans une boucle … » (14,4 dossiers en boucle au lieu de 9,6 : la copie qui poursuit sa procédure est rejetée une fois sur deux et revient), « un tap accorde un visa … » (`conformiteParPoint` absent : `2 ≠ NaN`).

- [ ] **Step 3: La Conformité de l'acte II**

Dans `constants/balanceActe2.ts`, bloc `BALANCE2`, remplacer :

```ts
  /** Délai du filet de sécurité
```

par :

```ts
  /**
   * Points de Conformité par point d'effet d'étape (et par rejet). À l'acte II, la Conformité ne sert
   * qu'à la Réforme : ce facteur fait peser l'acte II plus lourd que l'acte I dans les trombones.
   */
  conformiteParPoint: 120,
  /** Délai du filet de sécurité
```

- [ ] **Step 4: Le rendement et le vieillissement**

Dans `data/acte2/moteur.ts`, remplacer :

```ts
  PROCEDURES_INITIALES,
} from '../../constants/balanceActe2';
```

par :

```ts
  PROCEDURES_INITIALES,
  REFORME,
} from '../../constants/balanceActe2';
```

Juste avant `/** Dossiers d'une étape qui la franchissent : \`u\` d'usagers, \`b\` en boucle. */`, ajouter :

```ts
/**
 * Points de dématérialisation par étape franchie en boucle. Le mur : la sclérose des services, qui
 * vieillissent depuis l'entrée dans l'acte (la Réforme les rajeunit). La jurisprudence constante :
 * chaque trombone obtenu, dépensé ou non, accélère la dématérialisation des parties suivantes.
 */
export function rendementDemat(s: GameState, x: EtatActe2): number {
  return (
    (1 + REFORME.jurisprudenceConstante * s.reformes.trombonesObtenus) /
    (1 + x.duree / REFORME.scleroseS)
  );
}
```

Dans `franchir`, remplacer :

```ts
        boucles[e.exige][0] += b + u;
        if (b + u > 0 && premiereBoucle === null) premiereBoucle = maintenant;
        b = u;
        u = 0;
```

par :

```ts
        boucles[e.exige][0] += b + u;
        if (b + u > 0 && premiereBoucle === null) premiereBoucle = maintenant;
        // Le dossier part dans la procédure exigée : il ne poursuit pas la sienne (un seul dossier par usager).
        b = 0;
        u = 0;
```

et :

```ts
    conformitePoints: x0.conformitePoints + conf,
    demaPoints: x0.demaPoints + franchiesBoucle,
```

par :

```ts
    conformitePoints: x0.conformitePoints + conf * BALANCE2.conformiteParPoint,
    demaPoints: x0.demaPoints + franchiesBoucle * rendementDemat(s, x0),
```

Dans `tick2`, remplacer :

```ts
  const x: EtatActe2 = { ...x0, usagers, population };
```

par :

```ts
  // Les services vieillissent pendant le jeu comme pendant une absence (simulée, plafonnée).
  const x: EtatActe2 = { ...x0, usagers, population, duree: x0.duree + dt };
```

- [ ] **Step 5: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: `ℹ pass 119`, `ℹ fail 0`.

Run: `node scripts/simulate-acte2.ts 2 240`
Expected: le simulateur du plan 1 tourne sans erreur ; les jalons de dématérialisation reculent nettement (`demaCible` vaut encore 140 000 et la sclérose freine : la Tâche 6 recale).

- [ ] **Step 6: Commiter**

```bash
git add constants/balanceActe2.ts data/acte2/moteur.ts scripts/tests/acte2.test.ts scripts/tests/reforme.test.ts
git commit -m "feat(logic): sclérose des services et un seul dossier en boucle par usager

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: La Réforme — trombones, retour au Cerfa, nouveaux noms

**Files:**
- Create: `data/reforme.ts`
- Modify: `data/courrier.ts` (import, `nouvellesLettres`)
- Modify: `scripts/tests/reforme.test.ts`

**Interfaces:**
- Consumes: `etatInitial(maintenant, alea)` (`data/engine.ts`) ; `copieProcedures`, `getModifiers2` (`data/acte2/moteur.ts`) ; `tirerDenomination` (`data/jurisprudence.ts`) ; `REFORME` ; `PROCS`.
- Produces: dans `data/reforme.ts` : `conformitePartie(s)`, `trombonesReforme(s)`, `peutReformer(s, maintenant)`, `numeroCerfa(s): string`, `reformer(s, maintenant, alea?)`, `lettreReforme(s, maintenant): Lettre | null` ; lettre `reforme-<n>` distribuée par `nouvellesLettres`. Helpers de test `zero`, `avantReforme()`.

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/reforme.test.ts`, sous `import * as D from '../../data/acte2/moteur';`, ajouter :

```ts
import * as R from '../../data/reforme';
import { nouvellesLettres } from '../../data/courrier';
```

Remplacer `import type { EtatActe2, Note2Id } from '../../types/acte2';` par :

```ts
import { PROCS, type EtatActe2, type Note2Id } from '../../types/acte2';
```

Sous la définition de `proche`, ajouter :

```ts
/** Toujours le premier choix : tirages reproductibles. */
const zero = () => 0;

/** Acte II d'une partie de Camille, note n° 10 en vigueur : la Réforme est possible. */
function avantReforme(): GameState {
  const fin = {
    ...E.signerCerfa(E.etatInitial(0), 'Camille', 1234),
    tampons: 300_000,
    conformitePoints: 500_000,
    notes: { renfort: { achetee: 0, effective: 0 }, tilleuls: { achetee: 0, effective: 0 } },
  };
  const s = avecNotes2(D.entrerActe2(fin, 0), ['prise', 'atelier', 'reforme']);
  return { ...avec2(s, { conformitePoints: 1_500_000, guichets: 40 }), budget: 99_999 };
}
```

À la fin du fichier, ajouter :

```ts
test('la Réforme ramène au tout début de l’acte I ; survivent tampons, trombones, prénom, premier Cerfa', () => {
  const s0 = avantReforme();
  const s = R.reformer(s0, 5000, zero);
  assert.equal(s.acte, 1);
  assert.equal(s.acte2, null);
  assert.equal(s.tampons, 300_000);
  assert.equal(s.budget, BALANCE.budgetInitial);
  assert.equal(s.formulaires, BALANCE.formulairesInitiaux);
  assert.equal(s.conformitePoints, 0);
  assert.deepEqual(s.notes, {});
  assert.deepEqual(s.agents, { stagiaire: 0, accueil: 0, instructeur: 0, titulaire: 0 });
  assert.deepEqual(s.cerfa, { signe: false, prenom: 'Camille', signeLe: null });
  assert.equal(s.fichePosteVue, true);
  assert.deepEqual(s.courrier, s0.courrier);
  assert.equal(s.reformes.nombre, 1);
  assert.equal(s.reformes.trombones, R.trombonesReforme(s0));
  assert.deepEqual(s.reformes.premierCerfa, { prenom: 'Camille', signeLe: 1234 });
  assert.deepEqual(s.reformes.notesInstruites, ['renfort', 'tilleuls']);
  assert.deepEqual(s.reformes.notes2Instruites, ['prise', 'atelier', 'reforme']);
  assert.deepEqual(s.reformes.procedures, x(s0).procedures);
});

test('la Réforme exige l’acte II et la note n° 10 en vigueur', () => {
  const sansNote = avec2(avantReforme(), { notes: {} });
  assert.equal(R.reformer(sansNote, 0), sansNote);
  const acte1 = E.signerCerfa(E.etatInitial(0), 'Camille', 0);
  assert.equal(R.reformer(acte1, 0), acte1);
});

test('trombones = ⌊√(Conformité de la partie / k)⌋, acte I compris, convertie une seule fois', () => {
  const s0 = avantReforme();
  assert.equal(R.trombonesReforme(s0), Math.floor(Math.sqrt(2_000_000 / REFORME.k)));
  const s = R.reformer(s0, 0, zero);
  assert.equal(s.reformes.conformiteConvertie, 2_000_000);
  assert.equal(s.reformes.trombonesObtenus, s.reformes.trombones);
  // Partie suivante : seule sa propre Conformité compte.
  assert.equal(R.trombonesReforme({ ...s, conformitePoints: REFORME.k * 4 }), 2);
});

test('le Cerfa est redemandé sous un nouveau numéro ; le premier reste l’original', () => {
  const s1 = R.reformer(avantReforme(), 0, zero);
  assert.equal(R.numeroCerfa(s1), '00001*02');
  const relance = avecNotes2(D.entrerActe2(E.signerCerfa(s1, 'Dominique', 9999), 0), ['reforme']);
  const s2 = R.reformer(relance, 0, zero);
  assert.equal(R.numeroCerfa(s2), '00001*03');
  assert.equal(s2.cerfa.prenom, 'Dominique');
  assert.deepEqual(s2.reformes.premierCerfa, { prenom: 'Camille', signeLe: 1234 });
});

test('à chaque Réforme, la Direction et toutes les procédures changent de nom ; une lettre l’annonce', () => {
  const s0 = avantReforme();
  const s = R.reformer(s0, 0, () => 0.99);
  assert.notEqual(s.reformes.denomination.direction, s0.reformes.denomination.direction);
  for (const p of PROCS) {
    assert.notEqual(s.reformes.denomination.procedures[p], s0.reformes.denomination.procedures[p]);
  }
  const lettres = nouvellesLettres(s, 0);
  const lettre = lettres.find((l) => l.id === 'reforme-1');
  assert.ok(lettre);
  assert.ok(lettre.corps.includes(s.reformes.denomination.direction));
  assert.ok(lettre.corps.includes('00001*02'));
  const envoyee = { ...s, lettresEnvoyees: [...s.lettresEnvoyees, 'reforme-1'] };
  assert.equal(nouvellesLettres(envoyee, 0).some((l) => l.id === 'reforme-1'), false);
});

test('les lettres d’avancement ne repartent pas après la Réforme, les autres si', () => {
  const s0 = { ...avantReforme(), lettresEnvoyees: ['grade1', 'bienvenue', 'a2-prise'] };
  assert.deepEqual(R.reformer(s0, 0, zero).lettresEnvoyees, ['grade1']);
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `scripts/tests/reforme.test.ts` : module `../../data/reforme` introuvable.

- [ ] **Step 3: `data/reforme.ts`**

```ts
/**
 * La Réforme (premier prestige) : trombones, retour au début de l'acte I, Jurisprudence.
 * Fonctions pures, utilisées par GameStateContext et par scripts/simulate-acte2.ts.
 */
import type { GameState, Lettre, NoteId } from '../types/game';
import type { Note2Id, ProcId } from '../types/acte2';
import { PROCS } from '../types/acte2';
import { REFORME } from '../constants/balanceActe2';
import { etatInitial } from './engine';
import { copieProcedures, getModifiers2 } from './acte2/moteur';
import { tirerDenomination } from './jurisprudence';

/** Conformité de la partie en cours, acte I compris : ce que la prochaine Réforme convertit. */
export function conformitePartie(s: GameState): number {
  return s.conformitePoints + (s.acte2?.conformitePoints ?? 0);
}

/** Trombones qu'une Réforme rapporterait maintenant : ⌊√(Conformité cumulée non convertie / k)⌋. */
export function trombonesReforme(s: GameState): number {
  return Math.floor(Math.sqrt(Math.max(0, conformitePartie(s)) / REFORME.k));
}

/** La Réforme se déclenche à l'acte II, une fois la note « Réforme de l'action publique » en vigueur. */
export function peutReformer(s: GameState, maintenant: number): boolean {
  return s.acte === 2 && s.acte2 !== null && getModifiers2(s, maintenant).reformeVisible;
}

/** Numéro du Cerfa d'embauche de la partie : 00001*01, puis *02, *03… à chaque Réforme. */
export function numeroCerfa(s: GameState): string {
  return `00001*${String(s.reformes.nombre + 1).padStart(2, '0')}`;
}

const union = <T>(a: T[], b: T[]): T[] => [...a, ...b.filter((v) => !a.includes(v))];

/**
 * La Réforme : retour au tout début de l'acte I, Cerfa redemandé. Survivent : les trombones (et ceux
 * de cette Réforme), la Jurisprudence, le compteur Tampons apposés (donc le grade), le prénom, le premier
 * Cerfa, les lettres déjà reçues, les notes déjà instruites (déjà-vu) et les procédures (Mémoire des services).
 * La fiche de poste n'est pas reproposée. `alea` tire le nouveau seuil de la note n° 1 et les nouveaux noms.
 */
export function reformer(s: GameState, maintenant: number, alea: () => number = Math.random): GameState {
  if (!peutReformer(s, maintenant) || !s.acte2) return s;
  const r = s.reformes;
  const base = etatInitial(maintenant, alea);
  const precedent = r.jurisprudence.includes('precedent');
  const gain = trombonesReforme(s);
  return {
    ...base,
    cerfa: { signe: false, prenom: s.cerfa.prenom, signeLe: null },
    tampons: s.tampons,
    fichePosteVue: true,
    agents: { ...base.agents, stagiaire: precedent ? REFORME.stagiairesPrecedent : 0 },
    courrier: s.courrier,
    // Les lettres d'avancement suivent le compteur, qui survit : elles ne repartent pas. Les autres, si.
    lettresEnvoyees: s.lettresEnvoyees.filter((id) => id.startsWith('grade') || id.startsWith('reforme-')),
    reformes: {
      ...r,
      nombre: r.nombre + 1,
      trombones: r.trombones + gain,
      trombonesObtenus: r.trombonesObtenus + gain,
      conformiteConvertie: r.conformiteConvertie + conformitePartie(s),
      notesInstruites: union(r.notesInstruites, Object.keys(s.notes) as NoteId[]),
      notes2Instruites: union(r.notes2Instruites, Object.keys(s.acte2.notes) as Note2Id[]),
      procedures: copieProcedures(s.acte2.procedures),
      denomination: tirerDenomination(r.denomination, alea),
      premierCerfa: r.premierCerfa ?? { prenom: s.cerfa.prenom, signeLe: s.cerfa.signeLe },
    },
  };
}

/** Lettre du S.I.C. après chaque Réforme : la nouvelle dénomination des services. Une par Réforme. */
export function lettreReforme(s: GameState, maintenant: number): Lettre | null {
  const n = s.reformes.nombre;
  const id = `reforme-${n}`;
  if (n === 0 || s.lettresEnvoyees.includes(id)) return null;
  const d = s.reformes.denomination;
  const procedures = PROCS.map((p: ProcId) => `— ${d.procedures[p]}`).join('\n');
  return {
    id,
    objet: 'Réforme : nouvelle dénomination de vos services',
    corps: `Dans le cadre de la réforme de l’action publique, vos services sont réorganisés sans modification de leur fonctionnement.\n\nLa Direction devient : ${d.direction}.\n\nVos procédures deviennent :\n${procedures}\n\nVotre réembauche (Cerfa n° ${numeroCerfa(s)}) a été enregistrée. Le Cerfa n° 00001*01 demeure l’original.`,
    recue: maintenant,
    lue: false,
  };
}
```

Le courrier ne tourne qu'une fois le Cerfa signé (la boucle de jeu attend la signature) : la lettre arrive au guichet 3, juste après la réembauche.

- [ ] **Step 4: Distribuer la lettre de la Réforme**

Dans `data/courrier.ts`, sous `import { LETTRES_ACTE2 } from './acte2/courrier2';`, ajouter :

```ts
import { lettreReforme } from './reforme';
```

Dans `nouvellesLettres`, remplacer :

```ts
  return candidates
    .filter((l) => !s.lettresEnvoyees.includes(l.id) && l.declencheur(s, maintenant))
    .map((l) => ({ id: l.id, objet: l.objet, corps: l.corps(s), recue: maintenant, lue: false }));
```

par :

```ts
  const lettres: Lettre[] = candidates
    .filter((l) => !s.lettresEnvoyees.includes(l.id) && l.declencheur(s, maintenant))
    .map((l) => ({ id: l.id, objet: l.objet, corps: l.corps(s), recue: maintenant, lue: false }));
  // Après chaque Réforme : la nouvelle dénomination des services (une lettre par Réforme).
  const reforme = lettreReforme(s, maintenant);
  return reforme ? [reforme, ...lettres] : lettres;
```

`distribuerCourrier` (`GameStateContext`) ajoute déjà l'identifiant de chaque lettre à `lettresEnvoyees` : la lettre `reforme-1` part une fois.

- [ ] **Step 5: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: `ℹ pass 125`, `ℹ fail 0`.

- [ ] **Step 6: Commiter**

```bash
git add data/reforme.ts data/courrier.ts scripts/tests/reforme.test.ts
git commit -m "feat(logic): la Réforme, ses trombones et les nouveaux noms des services

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Jurisprudence et déjà-vu administratif

**Files:**
- Modify: `data/engine.ts` (imports, `getModifiers`, `conditionsNoteActe1`, `peutAcheterNote`, `acheterNote`)
- Modify: `data/acte2/moteur.ts` (imports, `entrerActe2`, `getModifiers2`, `conditionsNote2`, `peutAcheterNote2`, `acheterNote2`, `franchir`, `tick2`, `restaurerMemoire`, `guichetsOfferts`, `coutGuichet`, `acheterGuichet`, `prixRamette2`, `acheterRamettes2`, `requisitionUrgence2`)
- Modify: `data/reforme.ts` (achat de Jurisprudence)
- Modify: `scripts/tests/reforme.test.ts`

**Interfaces:**
- Consumes: `aJurisprudence`, `conditionsNote`, `dejaInstruite`, `dejaInstruite2`, `dotationJurisprudence`, `prixFormulairesJurisprudence` (Tâche 1) ; `JURISPRUDENCE`, `REFORME`.
- Produces: `E.conditionsNoteActe1(s, id): { cout; instruction }` ; `D.conditionsNote2(s, id)` ; `D.restaurerMemoire(s, x, m): EtatActe2` ; `D.guichetsOfferts(s): number` ; `D.coutGuichet(possedes, offerts = BALANCE2.guichetsInitiaux)` ; `D.prixRamette2(s): number` ; `R.coutJurisprudence(id)`, `R.peutAcheterJurisprudence(s, id)`, `R.acheterJurisprudence(s, id)`.

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/reforme.test.ts`, sous `import { BALANCE2, REFORME } from '../../constants/balanceActe2';`, ajouter :

```ts
import { NOTES_PAR_ID } from '../../data/notes';
import { NOTES2_PAR_ID } from '../../data/acte2/notes2';
import type { JurisprudenceId } from '../../types/reforme';
```

Sous la fonction `avantReforme`, ajouter :

```ts
const avecJurisprudence = (s: GameState, ids: JurisprudenceId[]): GameState => ({
  ...s,
  reformes: { ...s.reformes, jurisprudence: ids },
});
```

À la fin du fichier, ajouter :

```ts
test('Jurisprudence : achat définitif avec les trombones, une seule fois', () => {
  const apres = R.reformer(avantReforme(), 0, zero);
  const s = { ...apres, reformes: { ...apres.reformes, trombones: 10 } };
  const r = R.acheterJurisprudence(s, 'videJuridique');
  assert.equal(r.reformes.trombones, 10 - R.coutJurisprudence('videJuridique'));
  assert.deepEqual(r.reformes.jurisprudence, ['videJuridique']);
  assert.equal(R.acheterJurisprudence(r, 'videJuridique'), r);
  const pauvre = { ...s, reformes: { ...s.reformes, trombones: 0 } };
  assert.equal(R.acheterJurisprudence(pauvre, 'memoire'), pauvre);
});

test('Ancienneté reconnue : dotation +20 % aux deux actes', () => {
  const s1 = E.signerCerfa(E.etatInitial(0), 'Test', 0);
  proche(E.getModifiers(avecJurisprudence(s1, ['anciennete']), 0).dotationMult, 1.2);
  const s2 = D.entrerActe2(s1, 0);
  proche(D.getModifiers2(avecJurisprudence(s2, ['anciennete']), 0).dotationMult, 1.2);
});

test('Vide juridique : formulaires −25 % aux deux actes', () => {
  const s1 = E.signerCerfa(E.etatInitial(0), 'Test', 0);
  proche(E.prixRamette(E.getModifiers(avecJurisprudence(s1, ['videJuridique']), 0)), BALANCE.prixRamette * 0.75);
  const s2 = { ...avecJurisprudence(D.entrerActe2(s1, 0), ['videJuridique']), budget: 60 };
  proche(D.prixRamette2(s2), BALANCE.prixRamette * 0.75);
  assert.equal(D.acheterRamettes2(s2, 100).formulaires, BALANCE2.formulairesInitiaux + 10 * BALANCE.ramette);
});

test('Précédent : l’acte I recommence avec 3 stagiaires, ou les reçoit aussitôt', () => {
  const s0 = avecJurisprudence(avantReforme(), ['precedent']);
  assert.equal(R.reformer(s0, 0, zero).agents.stagiaire, REFORME.stagiairesPrecedent);
  const acte1 = R.reformer(avantReforme(), 0, zero);
  const riche = { ...acte1, reformes: { ...acte1.reformes, trombones: 99 } };
  assert.equal(R.acheterJurisprudence(riche, 'precedent').agents.stagiaire, REFORME.stagiairesPrecedent);
});

test('Antériorité : l’acte II commence avec 10 guichets, le suivant au prix du deuxième', () => {
  const s1 = avecJurisprudence(E.signerCerfa(E.etatInitial(0), 'Test', 0), ['anteriorite']);
  const s2 = D.entrerActe2(s1, 0);
  assert.equal(x(s2).guichets, REFORME.guichetsAnteriorite);
  assert.equal(D.coutGuichet(x(s2).guichets, D.guichetsOfferts(s2)), D.coutGuichet(1));
});

test('Droit acquis : la première étape de chaque procédure ne coûte aucune patience', () => {
  const base = avec2(D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0), {
    population: BALANCE2.fileInitiale,
  });
  const sans = D.tick2(base, 1, 1000).s;
  const avec = D.tick2(avecJurisprudence(base, ['droitAcquis']), 1, 1000).s;
  assert.ok(x(sans).abandons > 0);
  assert.equal(x(avec).abandons, 0);
});

test('Mémoire des services : procédures restaurées à l’ouverture de l’Atelier, avant toute modification', () => {
  const s1 = R.reformer(avantReforme(), 0, zero);
  const memoire = {
    ...s1.reformes.procedures!,
    identite: [{ type: 'piece' as const }, { type: 'pieceService' as const, exige: 'domicile' as const }],
  };
  const avant = { ...s1, reformes: { ...s1.reformes, jurisprudence: ['memoire' as const], procedures: memoire } };
  const s2 = D.entrerActe2(E.signerCerfa(avant, 'Camille', 0), 0);
  // Atelier fermé : rien ne change.
  assert.deepEqual(x(D.tick2(s2, 1, 1000).s).procedures.identite.map((e) => e.type), ['piece', 'visa']);
  const ouvert = D.tick2(avecNotes2(s2, ['atelier']), 1, 1000).s;
  assert.deepEqual(x(ouvert).procedures.identite, memoire.identite);
  assert.equal(x(ouvert).usagers.identite.length, 2);
  assert.equal(x(ouvert).memoireRestauree, true);
  // Le joueur a déjà modifié une procédure : la mémoire ne l'écrase pas.
  const modifie = avec2(avecNotes2(s2, ['atelier']), { premiereModif: 'identite' });
  assert.equal(x(D.tick2(modifie, 1, 1000).s).memoireRestauree, false);
});

test('déjà-vu administratif : une note déjà instruite a son délai ÷ 4 et son coût ÷ 6', () => {
  const s1 = R.reformer(avantReforme(), 0, zero);
  const acte1 = { ...E.signerCerfa(s1, 'Camille', 0), tampons: 300_000, budget: 1e6 };
  const tilleuls = NOTES_PAR_ID.tilleuls;
  assert.deepEqual(E.conditionsNoteActe1(acte1, 'tilleuls'), {
    cout: Math.round(tilleuls.cout / REFORME.dejaVuCout),
    instruction: tilleuls.instruction / REFORME.dejaVuDelai,
  });
  const achete = E.acheterNote(acte1, 'tilleuls', 0);
  assert.equal(achete.notes.tilleuls?.effective, (tilleuls.instruction / REFORME.dejaVuDelai) * 1000);
  assert.equal(achete.budget, 1e6 - Math.round(tilleuls.cout / REFORME.dejaVuCout));
  // Une note jamais achetée garde ses conditions.
  assert.equal(E.conditionsNoteActe1(acte1, 'commune').cout, NOTES_PAR_ID.commune.cout);
  const acte2 = { ...D.entrerActe2(acte1, 0), budget: 1e6 };
  assert.deepEqual(D.conditionsNote2(acte2, 'atelier'), {
    cout: Math.round(NOTES2_PAR_ID.atelier.cout / REFORME.dejaVuCout),
    instruction: NOTES2_PAR_ID.atelier.instruction / REFORME.dejaVuDelai,
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — les huit nouveaux tests : fonctions absentes (`R.acheterJurisprudence`, `D.prixRamette2`, `D.guichetsOfferts`, `E.conditionsNoteActe1`), dotation `1 ≠ 1.2`, guichets `1 ≠ 10`, abandons non nuls avec Droit acquis, procédures non restaurées.

- [ ] **Step 3: L'acte I**

Dans `data/engine.ts`, remplacer :

```ts
import { reformesInitiales } from './jurisprudence';
```

par :

```ts
import {
  conditionsNote,
  dejaInstruite,
  dotationJurisprudence,
  prixFormulairesJurisprudence,
  reformesInitiales,
} from './jurisprudence';
```

Dans `getModifiers`, remplacer :

```ts
  m.dotationMult *= 1 + BALANCE.bonusGrade * rangGrade(s.tampons);
  return m;
```

par :

```ts
  m.dotationMult *= (1 + BALANCE.bonusGrade * rangGrade(s.tampons)) * dotationJurisprudence(s);
  m.prixFormulaireMult *= prixFormulairesJurisprudence(s);
  return m;
```

Remplacer :

```ts
export function peutAcheterNote(s: GameState, id: NoteId): boolean {
  const n = NOTES_PAR_ID[id];
  return s.notes[id] === undefined && n.visible(s) && s.budget >= n.cout;
}

export function acheterNote(s: GameState, id: NoteId, maintenant: number): GameState {
  if (!peutAcheterNote(s, id)) return s;
  const n = NOTES_PAR_ID[id];
  return {
    ...s,
    budget: s.budget - n.cout,
    notes: { ...s.notes, [id]: { achetee: maintenant, effective: maintenant + n.instruction * 1000 } },
```

par :

```ts
/** Coût et délai d'instruction d'une note de l'acte I, déjà-vu administratif compris. */
export function conditionsNoteActe1(s: GameState, id: NoteId): { cout: number; instruction: number } {
  const n = NOTES_PAR_ID[id];
  return conditionsNote(dejaInstruite(s, id), n.cout, n.instruction);
}

export function peutAcheterNote(s: GameState, id: NoteId): boolean {
  const n = NOTES_PAR_ID[id];
  return s.notes[id] === undefined && n.visible(s) && s.budget >= conditionsNoteActe1(s, id).cout;
}

export function acheterNote(s: GameState, id: NoteId, maintenant: number): GameState {
  if (!peutAcheterNote(s, id)) return s;
  const { cout, instruction } = conditionsNoteActe1(s, id);
  return {
    ...s,
    budget: s.budget - cout,
    notes: { ...s.notes, [id]: { achetee: maintenant, effective: maintenant + instruction * 1000 } },
```

- [ ] **Step 4: L'acte II**

Dans `data/acte2/moteur.ts`, remplacer :

```ts
import { aJurisprudence } from '../jurisprudence';
```

par :

```ts
import {
  aJurisprudence,
  conditionsNote,
  dejaInstruite2,
  dotationJurisprudence,
  prixFormulairesJurisprudence,
} from '../jurisprudence';
```

Dans `entrerActe2`, remplacer :

```ts
  if (s.acte === 2) return s;
  return {
    ...s,
    acte: 2,
    acte2: etatInitialActe2(maintenant),
```

par :

```ts
  if (s.acte === 2) return s;
  const x = etatInitialActe2(maintenant);
  return {
    ...s,
    acte: 2,
    acte2: { ...x, guichets: guichetsOfferts(s) },
```

Dans `getModifiers2`, remplacer :

```ts
    dotationMult: 1 + BALANCE.bonusGrade * rangGrade(s.tampons),
```

par :

```ts
    dotationMult: (1 + BALANCE.bonusGrade * rangGrade(s.tampons)) * dotationJurisprudence(s),
```

Remplacer :

```ts
export function peutAcheterNote2(s: GameState, id: Note2Id): boolean {
  const x = s.acte2;
  const n = NOTES2_PAR_ID[id];
  return (
    x !== null &&
    x.notes[id] === undefined &&
    n.visible(s) &&
    s.budget >= n.cout
  );
}
```

par :

```ts
/** Coût et délai d'instruction d'une note de l'acte II, déjà-vu administratif compris. */
export function conditionsNote2(s: GameState, id: Note2Id): { cout: number; instruction: number } {
  const n = NOTES2_PAR_ID[id];
  return conditionsNote(dejaInstruite2(s, id), n.cout, n.instruction);
}

export function peutAcheterNote2(s: GameState, id: Note2Id): boolean {
  const x = s.acte2;
  const n = NOTES2_PAR_ID[id];
  return (
    x !== null &&
    x.notes[id] === undefined &&
    n.visible(s) &&
    s.budget >= conditionsNote2(s, id).cout
  );
}
```

Dans `acheterNote2`, remplacer :

```ts
  const x = s.acte2 as EtatActe2;
  const n = NOTES2_PAR_ID[id];
  return {
    ...s,
    budget: s.budget - n.cout,
```

par :

```ts
  const x = s.acte2 as EtatActe2;
  const { cout, instruction } = conditionsNote2(s, id);
  return {
    ...s,
    budget: s.budget - cout,
```

et `          effective: maintenant + n.instruction * 1000,` par `          effective: maintenant + instruction * 1000,`.

Dans `franchir`, remplacer :

```ts
    // Patience : une part des usagers abandonne à chaque étape.
    const ab =
      u0 * Math.min(1, def.patience * BALANCE2.abandonParPoint * ex.patience);
```

par :

```ts
    // Patience : une part des usagers abandonne à chaque étape.
    // Droit acquis (Jurisprudence) : la première étape de chaque procédure ne coûte aucune patience.
    const ab =
      m.droitAcquis && l.k === 0
        ? 0
        : u0 * Math.min(1, def.patience * BALANCE2.abandonParPoint * ex.patience);
```

Dans `tick2`, remplacer :

```ts
  const x: EtatActe2 = { ...x0, usagers, population, duree: x0.duree + dt };
```

par :

```ts
  const x: EtatActe2 = restaurerMemoire(s0, { ...x0, usagers, population, duree: x0.duree + dt }, m);
```

Juste avant `/** Un tap sur TAMPONNER`, ajouter :

```ts
/**
 * Mémoire des services (Jurisprudence) : à l'ouverture de l'Atelier, avant toute modification du joueur,
 * les procédures d'avant la Réforme sont restaurées, une seule fois. Les dossiers engagés gardent leur
 * rang (ou passent à la dernière étape).
 */
export function restaurerMemoire(s: GameState, x: EtatActe2, m: Modifiers2): EtatActe2 {
  const memoire = s.reformes.procedures;
  if (
    x.memoireRestauree ||
    x.premiereModif !== null ||
    !m.atelierVisible ||
    !memoire ||
    !aJurisprudence(s, 'memoire')
  )
    return x;
  const procedures = copieProcedures(memoire);
  const ranger = (st: Stocks): Stocks =>
    Object.fromEntries(
      PROCS.map((p) => {
        const v = procedures[p].map(() => 0);
        st[p].forEach((n, k) => {
          v[Math.min(k, v.length - 1)] += n;
        });
        return [p, v];
      }),
    ) as Stocks;
  return {
    ...x,
    procedures,
    usagers: ranger(x.usagers),
    boucles: ranger(x.boucles),
    memoireRestauree: true,
  };
}
```

Les étapes restaurées le sont telles qu'avant la Réforme, même si leur note n'est pas encore en vigueur ; une « Pièce délivrée par nos services » qui exige une procédure pas encore ouverte reste sans effet jusqu'à son ouverture (règle du plan 1).

Remplacer :

```ts
/** Prix du prochain Guichet : le guichet 3, offert, ne compte pas. */
export function coutGuichet(possedes: number): number {
  const g = BALANCE2.guichet;
  return Math.ceil(
    g.coutBase * Math.pow(g.croissance, possedes - BALANCE2.guichetsInitiaux),
  );
}

export function acheterGuichet(s: GameState, maintenant: number): GameState {
  const x = s.acte2;
  if (!x || !getModifiers2(s, maintenant).recrutementVisible) return s;
  const cout = coutGuichet(x.guichets);
```

par :

```ts
/** Guichets offerts à l'entrée dans l'acte : le guichet 3, ou dix avec Antériorité (Jurisprudence). */
export function guichetsOfferts(s: GameState): number {
  return aJurisprudence(s, 'anteriorite') ? REFORME.guichetsAnteriorite : BALANCE2.guichetsInitiaux;
}

/** Prix du prochain Guichet : les guichets offerts ne comptent pas. */
export function coutGuichet(possedes: number, offerts: number = BALANCE2.guichetsInitiaux): number {
  const g = BALANCE2.guichet;
  return Math.ceil(g.coutBase * Math.pow(g.croissance, Math.max(0, possedes - offerts)));
}

export function acheterGuichet(s: GameState, maintenant: number): GameState {
  const x = s.acte2;
  if (!x || !getModifiers2(s, maintenant).recrutementVisible) return s;
  const cout = coutGuichet(x.guichets, guichetsOfferts(s));
```

Remplacer :

```ts
/** Achète `nb` ramettes au prix de l'acte I (sinon le maximum possible). */
export function acheterRamettes2(s: GameState, nb: number): GameState {
  const possibles = Math.min(nb, Math.floor(s.budget / BALANCE.prixRamette));
  if (possibles <= 0) return s;
  return {
    ...s,
    budget: s.budget - possibles * BALANCE.prixRamette,
```

par :

```ts
/** Prix d'une ramette à l'acte II : celui de l'acte I, Vide juridique compris. */
export function prixRamette2(s: GameState): number {
  return Math.round(BALANCE.prixRamette * prixFormulairesJurisprudence(s) * 100) / 100;
}

/** Achète `nb` ramettes (sinon le maximum possible). */
export function acheterRamettes2(s: GameState, nb: number): GameState {
  const prix = prixRamette2(s);
  const possibles = Math.min(nb, Math.floor(s.budget / prix));
  if (possibles <= 0) return s;
  return {
    ...s,
    budget: s.budget - possibles * prix,
```

Dans `requisitionUrgence2`, remplacer :

```ts
  if (!x || s.formulaires >= x.exemplaires || s.budget >= BALANCE.prixRamette)
```

par :

```ts
  if (!x || s.formulaires >= x.exemplaires || s.budget >= prixRamette2(s))
```

- [ ] **Step 5: L'achat de Jurisprudence**

Dans `data/reforme.ts`, remplacer :

```ts
import { PROCS } from '../types/acte2';
import { REFORME } from '../constants/balanceActe2';
```

par :

```ts
import { PROCS } from '../types/acte2';
import type { JurisprudenceId } from '../types/reforme';
import { JURISPRUDENCE, REFORME } from '../constants/balanceActe2';
```

Juste avant `/** Lettre du S.I.C. après chaque Réforme`, ajouter :

```ts
export function coutJurisprudence(id: JurisprudenceId): number {
  return JURISPRUDENCE.find((j) => j.id === id)?.cout ?? Infinity;
}

export function peutAcheterJurisprudence(s: GameState, id: JurisprudenceId): boolean {
  return !s.reformes.jurisprudence.includes(id) && s.reformes.trombones >= coutJurisprudence(id);
}

/**
 * Achat d'un bonus de Jurisprudence avec les trombones (définitif). Précédent et Antériorité valent aussi
 * pour la partie en cours : acheté à l'acte I, Précédent complète les stagiaires à 3 ; acheté à l'acte II,
 * Antériorité complète les guichets à 10.
 */
export function acheterJurisprudence(s: GameState, id: JurisprudenceId): GameState {
  if (!peutAcheterJurisprudence(s, id)) return s;
  const r: GameState = {
    ...s,
    reformes: {
      ...s.reformes,
      trombones: s.reformes.trombones - coutJurisprudence(id),
      jurisprudence: [...s.reformes.jurisprudence, id],
    },
  };
  if (id === 'precedent' && r.acte === 1) {
    return { ...r, agents: { ...r.agents, stagiaire: Math.max(r.agents.stagiaire, REFORME.stagiairesPrecedent) } };
  }
  if (id === 'anteriorite' && r.acte2 && r.acte === 2) {
    return { ...r, acte2: { ...r.acte2, guichets: Math.max(r.acte2.guichets, REFORME.guichetsAnteriorite) } };
  }
  return r;
}
```

- [ ] **Step 6: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: `ℹ pass 133`, `ℹ fail 0`.

Run: `node scripts/simulate-acte1.ts 2 180`
Expected: `fin de l’acte` à 64,9 min, comme avant (une première partie n'a ni Jurisprudence ni note déjà instruite).

- [ ] **Step 7: Commiter**

```bash
git add data/engine.ts data/acte2/moteur.ts data/reforme.ts scripts/tests/reforme.test.ts
git commit -m "feat(logic): Jurisprudence et déjà-vu administratif

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Vues — noms des services, dossier administratif, notes déjà instruites, préréglages

**Files:**
- Modify: `data/acte2/vues.ts`
- Modify: `data/acte2/vueAtelier.ts`
- Modify: `data/acte2/courrier2.ts`
- Modify: `data/reforme.ts` (vue du dossier administratif)
- Modify: `scripts/presets-acte2.ts`
- Modify: `scripts/save-acte2.ts` (commentaire d'usage)
- Modify: `scripts/tests/vues-acte2.test.ts`
- Modify: `scripts/tests/reforme.test.ts`

**Interfaces:**
- Consumes: `s.reformes.denomination` ; `conditionsNote2`, `guichetsOfferts`, `coutGuichet` (Tâche 4) ; `dejaInstruite2` ; `peutReformer`, `trombonesReforme`, `peutAcheterJurisprudence` (Tâches 3 et 4).
- Produces: `VueDirection.nomService: string`, `VueDirection.reformeVisible: boolean` ; `NoteVue2.dejaInstruite: boolean` ; dans `data/reforme.ts` : `JurisprudenceAffichee` (`JurisprudenceDef` + `acquise`, `achetable`), `VueReforme` (`trombones: number | null`, `possible`, `gain`, `cerfaSuivant`, `jurisprudence: JurisprudenceAffichee[] | null`), `vueReforme(s, maintenant)` ; préréglages `reforme` et `cerfa2`.

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/reforme.test.ts`, remplacer `import { NOTES_PAR_ID } from '../../data/notes';` par :

```ts
import { NOTES as NOTES_ACTE1, NOTES_PAR_ID } from '../../data/notes';
```

et, sous `import type { JurisprudenceId } from '../../types/reforme';`, ajouter :

```ts
import * as V from '../../data/acte2/vues';
import { vueAtelier } from '../../data/acte2/vueAtelier';
import { sauvegardeActe2 } from '../presets-acte2';
```

À la fin du fichier, ajouter :

```ts
test('vues : les noms tirés à la Réforme remplacent ceux de la Direction et des procédures', () => {
  const s1 = R.reformer(avantReforme(), 0, () => 0.99);
  const s2 = D.entrerActe2(E.signerCerfa(s1, 'Camille', 0), 0);
  const noms = s2.reformes.denomination;
  const d = V.vueDirection(s2, 0)!;
  assert.equal(d.nomService, noms.direction);
  assert.equal(d.parapheur?.procNom, noms.procedures.identite);
  const atelier = vueAtelier(avecNotes2(s2, ['atelier']), 0)!;
  assert.deepEqual(atelier.procedures.map((p) => p.nom), [noms.procedures.identite, noms.procedures.domicile]);
});

test('vues : le dossier administratif montre trombones et Jurisprudence après la première Réforme', () => {
  const avant = avantReforme();
  const v0 = R.vueReforme(avant, 0);
  assert.equal(v0.trombones, null);
  assert.equal(v0.jurisprudence, null);
  assert.equal(v0.possible, true);
  assert.equal(v0.gain, R.trombonesReforme(avant));
  assert.equal(v0.cerfaSuivant, '00001*02');
  const apres = R.reformer(avant, 0, zero);
  const v1 = R.vueReforme(apres, 0);
  assert.equal(v1.trombones, apres.reformes.trombones);
  assert.equal(v1.possible, false);
  assert.equal(v1.jurisprudence?.length, 6);
  assert.equal(v1.jurisprudence?.every((j) => !j.acquise), true);
});

test('vues : une note déjà instruite le dit, les guichets offerts ne comptent pas dans le prix', () => {
  const s2 = { ...D.entrerActe2(E.signerCerfa(R.reformer(avantReforme(), 0, zero), 'Camille', 0), 0), budget: 0 };
  const note = V.notesAffichees2(s2, 0).find((n) => n.id === 'prise')!;
  assert.equal(note.dejaInstruite, true);
  const anterieur = avecJurisprudence(avec2(s2, { guichets: REFORME.guichetsAnteriorite }), ['anteriorite']);
  assert.equal(V.vueService2(avecNotes2(anterieur, ['prise']), 0)?.guichet.cout, D.coutGuichet(1));
});

test('préréglages de la Réforme : Réforme possible, puis Cerfa n° 00001*02 et trombones à dépenser', () => {
  const t = 1_000_000_000;
  const avant = sauvegardeActe2('reforme', t);
  assert.equal(R.peutReformer(avant, t), true);
  assert.ok(R.trombonesReforme(avant) >= R.coutJurisprudence('memoire') + R.coutJurisprudence('anteriorite'));
  const apres = sauvegardeActe2('cerfa2', t);
  assert.equal(apres.cerfa.signe, false);
  assert.equal(R.numeroCerfa(apres), '00001*02');
  assert.equal(apres.reformes.trombones, R.trombonesReforme(avant));
  assert.equal(apres.reformes.notesInstruites.length, NOTES_ACTE1.length);
});
```

Dans `scripts/tests/vues-acte2.test.ts`, test « préréglages de vérification … », remplacer :

```ts
    assert.equal(s.acte, p === 'finActeI' ? 1 : 2, p);
```

par :

```ts
    assert.equal(s.acte, p === 'finActeI' || p === 'cerfa2' ? 1 : 2, p);
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `nomService` indéfini (`undefined ≠ 'La Délégation …'`), `R.vueReforme is not a function`, `dejaInstruite` indéfini, préréglage `reforme` inconnu.

- [ ] **Step 3: Les vues de l'acte II**

Dans `data/acte2/vues.ts`, remplacer :

```ts
import { AGENTS2, PROC_NOMS } from '../../constants/balanceActe2';
import {
  coutAgent2,
  coutGuichet,
  dematerialisation,
```

par :

```ts
import { AGENTS2 } from '../../constants/balanceActe2';
import {
  conditionsNote2,
  coutAgent2,
  coutGuichet,
  dematerialisation,
  guichetsOfferts,
```

et `import { NOTES2_PAR_ID } from './notes2';` par :

```ts
import { NOTES2_PAR_ID } from './notes2';
import { dejaInstruite2 } from '../jurisprudence';
```

Dans `interface VueDirection`, remplacer :

```ts
export interface VueDirection {
  visas: number;
```

par :

```ts
export interface VueDirection {
  /** Nom du service du chef (« La Direction », puis un autre à chaque Réforme). */
  nomService: string;
  visas: number;
```

et :

```ts
  recrutementVisible: boolean;
  atelierVisible: boolean;
  visasAccordes: number;
```

par :

```ts
  recrutementVisible: boolean;
  atelierVisible: boolean;
  /** Note n° 10 en vigueur : la Réforme peut être engagée (Options). */
  reformeVisible: boolean;
  visasAccordes: number;
```

Dans `vueDirection`, remplacer :

```ts
  return {
    visas: Math.floor(visasEnAttente(x)),
```

par :

```ts
  return {
    nomService: s.reformes.denomination.direction,
    visas: Math.floor(visasEnAttente(x)),
```

`          procNom: PROC_NOMS[tete.p],` par `          procNom: s.reformes.denomination.procedures[tete.p],`, et :

```ts
    atelierVisible: m.atelierVisible,
    visasAccordes: Math.floor(x.stats.visasTampons),
```

par :

```ts
    atelierVisible: m.atelierVisible,
    reformeVisible: m.reformeVisible,
    visasAccordes: Math.floor(x.stats.visasTampons),
```

Dans `vueService2`, remplacer `      ...lot(coutGuichet, x.guichets, s.budget),` par :

```ts
      ...lot((n) => coutGuichet(n, guichetsOfferts(s)), x.guichets, s.budget),
```

Dans `interface NoteVue2`, remplacer :

```ts
  resteSec: number;
  nouvelle: boolean;
}
```

par :

```ts
  resteSec: number;
  nouvelle: boolean;
  /** Déjà-vu administratif : achetée lors d'une partie précédente (délai et coût réduits). */
  dejaInstruite: boolean;
}
```

Dans `notesAffichees2`, remplacer :

```ts
    const def = NOTES2_PAR_ID[id];
    const st = x.notes[id];
    let statut: StatutNote2 = s.budget >= def.cout ? 'disponible' : 'tropCher';
```

par :

```ts
    const def = NOTES2_PAR_ID[id];
    const { cout, instruction } = conditionsNote2(s, id);
    const st = x.notes[id];
    let statut: StatutNote2 = s.budget >= cout ? 'disponible' : 'tropCher';
```

et :

```ts
      cout: def.cout,
      instruction: def.instruction,
      statut,
      resteSec,
      nouvelle: !x.notesVues.includes(id),
```

par :

```ts
      cout,
      instruction,
      statut,
      resteSec,
      nouvelle: !x.notesVues.includes(id),
      dejaInstruite: dejaInstruite2(s, id),
```

- [ ] **Step 4: L'Atelier et le courrier de l'acte II**

Dans `data/acte2/vueAtelier.ts`, remplacer `import { BALANCE2, ETAPES, PROC_NOMS } from '../../constants/balanceActe2';` par :

```ts
import { BALANCE2, ETAPES } from '../../constants/balanceActe2';
```

Dans `vueAtelier`, sous `  const ouvertes = PROCS.filter((p) => m.procsOuvertes.includes(p));`, ajouter :

```ts
  // Les noms changent à chaque Réforme (« rien d'autre ne change »).
  const noms = s.reformes.denomination.procedures;
```

puis remplacer les quatre `PROC_NOMS[` de la fonction par `noms[` (`nom: noms[p]`, `nom: noms[q]`, `boucle.map((q) => noms[q])`, `exige ? noms[exige] : null`).

Dans `data/acte2/courrier2.ts`, remplacer `import { BALANCE2, PROC_NOMS } from '../../constants/balanceActe2';` par :

```ts
import { BALANCE2 } from '../../constants/balanceActe2';
```

Remplacer, dans la lettre `a2-filet2` :

```ts
    corps: () =>
      `La procédure « ${PROC_NOMS.identite} » pourrait exiger une pièce délivrée par la procédure « ${PROC_NOMS.domicile} ». L’inverse serait également fondé.\n\nLe S.I.C. ne donne pas d’instruction. Il constate.`,
```

par :

```ts
    corps: (s) => {
      const noms = s.reformes.denomination.procedures;
      return `La procédure « ${noms.identite} » pourrait exiger une pièce délivrée par la procédure « ${noms.domicile} ». L’inverse serait également fondé.\n\nLe S.I.C. ne donne pas d’instruction. Il constate.`;
    },
```

et, dans la lettre `a2-demission` :

```ts
      const p = s.acte2?.premiereModif;
      return `Votre demande de démission demeure incomplète.\n\nPièce manquante : justificatif de conformité à la procédure « ${p ? PROC_NOMS[p] : PROC_NOMS.identite} ».`;
```

par :

```ts
      const p = s.acte2?.premiereModif ?? 'identite';
      return `Votre demande de démission demeure incomplète.\n\nPièce manquante : justificatif de conformité à la procédure « ${s.reformes.denomination.procedures[p]} ».`;
```

- [ ] **Step 5: La vue du dossier administratif**

Dans `data/reforme.ts`, remplacer `import { JURISPRUDENCE, REFORME } from '../constants/balanceActe2';` par :

```ts
import { JURISPRUDENCE, REFORME, type JurisprudenceDef } from '../constants/balanceActe2';
```

À la fin du fichier, ajouter :

```ts
export interface JurisprudenceAffichee extends JurisprudenceDef {
  acquise: boolean;
  achetable: boolean;
}

/** Dossier administratif : trombones, Réforme possible et Jurisprudence. */
export interface VueReforme {
  /** Trombones disponibles ; null avant la première Réforme (ils n'apparaissent qu'après). */
  trombones: number | null;
  /** La Réforme peut être engagée (acte II, note « Réforme de l'action publique » en vigueur). */
  possible: boolean;
  /** Trombones qu'elle rapporterait maintenant. */
  gain: number;
  /** Numéro du Cerfa qui sera redemandé après la Réforme. */
  cerfaSuivant: string;
  /** Bonus de Jurisprudence ; null avant la première Réforme. */
  jurisprudence: JurisprudenceAffichee[] | null;
}

export function vueReforme(s: GameState, maintenant: number): VueReforme {
  const r = s.reformes;
  const apres = r.nombre > 0;
  return {
    trombones: apres ? r.trombones : null,
    possible: peutReformer(s, maintenant),
    gain: trombonesReforme(s),
    cerfaSuivant: `00001*${String(r.nombre + 2).padStart(2, '0')}`,
    jurisprudence: apres
      ? JURISPRUDENCE.map((j) => ({
          ...j,
          acquise: r.jurisprudence.includes(j.id),
          achetable: peutAcheterJurisprudence(s, j.id),
        }))
      : null,
  };
}
```

- [ ] **Step 6: Les préréglages**

Dans `scripts/presets-acte2.ts`, remplacer :

```ts
import { nouvellesLettres } from '../data/courrier';
import { BALANCE2 } from '../constants/balanceActe2';

export type Preset =
  'finActeI' | 'debut' | 'atelier' | 'boucle' | 'demat' | 'fin';
export const PRESETS: Preset[] = [
  'finActeI',
  'debut',
  'atelier',
  'boucle',
  'demat',
  'fin',
];
```

par :

```ts
import { nouvellesLettres } from '../data/courrier';
import * as R from '../data/reforme';
import { BALANCE2 } from '../constants/balanceActe2';
import { NOTES as NOTES_ACTE1 } from '../data/notes';

export type Preset =
  'finActeI' | 'debut' | 'atelier' | 'boucle' | 'demat' | 'fin' | 'reforme' | 'cerfa2';
export const PRESETS: Preset[] = [
  'finActeI',
  'debut',
  'atelier',
  'boucle',
  'demat',
  'fin',
  'reforme',
  'cerfa2',
];
```

Remplacer :

```ts
const NOTES: Record<Exclude<Preset, 'finActeI'>, Note2Id[]> = {
  debut: [],
  atelier: NOTES_ATELIER,
  boucle: NOTES_BOUCLE,
  demat: NOTES_DEMAT,
  fin: NOTES_DEMAT,
};
```

par :

```ts
const NOTES: Record<Exclude<Preset, 'finActeI' | 'cerfa2'>, Note2Id[]> = {
  debut: [],
  atelier: NOTES_ATELIER,
  boucle: NOTES_BOUCLE,
  demat: NOTES_DEMAT,
  fin: NOTES_DEMAT,
  reforme: [...NOTES_DEMAT, 'reforme'],
};
```

Dans `finActeI`, remplacer :

```ts
    notes: { reaffectation: { achetee: t, effective: t } },
  };
```

par :

```ts
    conformitePoints: 500_000,
    // Toutes les notes de l'acte I approuvées (le déjà-vu les retrouve après une Réforme).
    notes: Object.fromEntries(NOTES_ACTE1.map((n) => [n.id, { achetee: t, effective: t }])),
  };
```

Dans `sauvegardeActe2`, remplacer :

```ts
  const fin = finActeI(maintenant);
  if (preset === 'finActeI') return fin;
```

par :

```ts
  const fin = finActeI(maintenant);
  if (preset === 'finActeI') return fin;
  if (preset === 'cerfa2') {
    // Juste après une Réforme à 60 % : Cerfa n° 00001*02 à signer, 15 trombones à dépenser.
    return R.reformer(sauvegardeActe2('reforme', maintenant), maintenant, () => 0.5);
  }
```

Remplacer `  if (preset === 'boucle' || preset === 'demat' || preset === 'fin') {` par :

```ts
  if (preset === 'boucle' || preset === 'demat' || preset === 'fin' || preset === 'reforme') {
```

et :

```ts
  if (preset === 'demat' || preset === 'fin') {
    x = {
      ...x,
      demaPoints: BALANCE2.demaCible * (preset === 'fin' ? 1 : 0.38),
```

par :

```ts
  if (preset === 'demat' || preset === 'fin' || preset === 'reforme') {
    x = {
      ...x,
      demaPoints: BALANCE2.demaCible * { demat: 0.38, fin: 1, reforme: 0.6 }[preset],
      // Âge et Conformité d'une Direction à ce stade (robot : 38 % vers 75 min, 60 % vers 115 min).
      duree: { demat: 4500, fin: 12000, reforme: 6900 }[preset],
      conformitePoints: { demat: 30_000_000, fin: 100_000_000, reforme: 60_000_000 }[preset],
```

Dans `scripts/save-acte2.ts`, remplacer ` * Préréglages : finActeI, debut, atelier, boucle, demat, fin (voir scripts/presets-acte2.ts).` par :

```ts
 * Préréglages : finActeI, debut, atelier, boucle, demat, fin, reforme, cerfa2 (voir scripts/presets-acte2.ts).
```

- [ ] **Step 7: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm test`
Expected: `ℹ pass 137`, `ℹ fail 0`.

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts cerfa2 | head -c 80`
Expected: `localStorage.setItem("bureaucracy_acte1_v1", "{\"version\":1,\"acte\":1,…`

- [ ] **Step 8: Commiter**

```bash
git add data/acte2/vues.ts data/acte2/vueAtelier.ts data/acte2/courrier2.ts data/reforme.ts scripts/presets-acte2.ts scripts/save-acte2.ts scripts/tests/vues-acte2.test.ts scripts/tests/reforme.test.ts
git commit -m "feat(logic): noms des services, dossier administratif et préréglages de la Réforme

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Robots, simulateurs et calage du mur

**Files:**
- Create: `scripts/robots.ts`
- Modify: `scripts/simulate-acte1.ts` (remplacé)
- Modify: `scripts/simulate-acte2.ts` (remplacé)
- Modify: `constants/balanceActe2.ts` (`BALANCE2.demaCible`)
- Modify: `data/acte2/notes2.ts` (coûts des notes n° 11 à 15)
- Modify: `specs/009-acte2-direction/spec.md` (mur, déjà-vu, constantes, mesures du robot)

**Interfaces:**
- Consumes: tout le moteur (`E`, `D`), `R.reformer`, `R.peutAcheterJurisprudence`, `R.acheterJurisprudence`, `R.peutReformer`, `R.trombonesReforme`, `D.conditionsNote2`, `E.conditionsNoteActe1`, `D.guichetsOfferts`, `D.rendementDemat`.
- Produces: `finActeIRobot(): GameState`, `robotActe1(s, now, taps, mesures?)`, `robotActe2(s, now, taps, decouverte = 0)`, `PRIORITE_JURISPRUDENCE`, `robotReforme(s, now)` ; `node scripts/simulate-acte2.ts [taps] [minutes] [réformeÀ | balayage] [découverte]`.

Le calage n'a pas de test unitaire : le simulateur est la vérification (spec, « Rythme cible »). Les valeurs ci-dessous ont été obtenues sur une copie du worktree, avec le code des Tâches 1 à 5.

- [ ] **Step 1: Les robots**

`scripts/robots.ts` :

```ts
/**
 * Joueurs-robots des simulateurs : une seconde de jeu à l'acte I (robotActe1) ou à l'acte II (robotActe2).
 * Ils tamponnent, règlent les curseurs au maximum, achètent les notes dès qu'ils peuvent et recrutent.
 * Utilisé par scripts/simulate-acte1.ts et scripts/simulate-acte2.ts (Réforme comprise).
 */
import type { GameState } from '../types/game';
import type { ActionAtelier, EtapeType, ProcId } from '../types/acte2';
import type { JurisprudenceId } from '../types/reforme';
import { BALANCE } from '../constants/balance';
import { BALANCE2 } from '../constants/balanceActe2';
import * as E from '../data/engine';
import * as D from '../data/acte2/moteur';
import * as R from '../data/reforme';
import { NOTES } from '../data/notes';
import { NOTES2 } from '../data/acte2/notes2';

/**
 * Fin d'un premier acte I joué par le robot (scripts/simulate-acte1.ts) : compteur de tampons, Conformité
 * à 100 %, toutes les notes approuvées. Point de départ de simulate-acte2.
 */
export function finActeIRobot(): GameState {
  const s = E.signerCerfa(E.etatInitial(0, () => 0.5), 'Robot', 0);
  return {
    ...s,
    tampons: 160_000,
    conformitePoints: BALANCE.confCible,
    fichePosteVue: true,
    acteTermine: true,
    notes: Object.fromEntries(NOTES.map((n) => [n.id, { achetee: 0, effective: 0 }])),
  };
}

/** Mesures de l'acte I que simulate-acte1 affiche. */
export interface MesuresActe1 {
  tapsDemandes: number;
  tapsTraites: number;
}

/** Une seconde d'acte I : `taps` coups de tampon, un tick, rejet au maximum, notes, ramettes, collègues. */
export function robotActe1(s0: GameState, now: number, taps: number, mesures?: MesuresActe1): GameState {
  let s = s0;
  const puissance = E.getModifiers(s, now).tapPower;
  for (let i = 0; i < taps; i++) {
    const r = E.tamponner(s, now);
    if (mesures) {
      mesures.tapsDemandes += puissance;
      mesures.tapsTraites += r.ev.traites;
    }
    s = r.s;
  }
  s = E.tick(s, 1, now).s;
  const m = E.getModifiers(s, now);
  if (m.rejetVisible) s = E.reglerTauxRejet(s, m.rejetMax, now);
  for (const id of E.notesVisibles(s)) if (E.peutAcheterNote(s, id)) s = E.acheterNote(s, id, now);

  // Formulaires : garder 20 s de consommation.
  const conso = (E.vitesseCollegues(s, m) + m.tapPower * taps) * m.pieces * 20;
  if (!m.commandeAuto && s.formulaires < conso) {
    s = E.acheterRamettes(s, Math.ceil((conso - s.formulaires) / BALANCE.ramette), now);
  }

  // Collègues : le meilleur ratio vitesse/coût, sans affamer la prochaine note.
  const enAttente = NOTES.filter((n) => s.notes[n.id] === undefined && n.visible(s) && n.cout > 0);
  const reserve = enAttente.length ? Math.min(...enAttente.map((n) => E.conditionsNoteActe1(s, n.id).cout)) : 0;
  for (;;) {
    const choix = m.agentsDisponibles
      .map((id) => ({ id, cout: E.coutAgent(id, s.agents[id]), gain: E.gainAgent(s, id, m) }))
      .sort((a, b) => b.gain / b.cout - a.gain / a.cout)[0];
    if (!choix || s.budget < choix.cout || (reserve > 0 && choix.cout > reserve * 0.5 && s.budget - choix.cout < reserve)) break;
    s = E.acheterAgent(s, choix.id, now);
  }
  return s;
}

/** Procédure exigée par chaque procédure : identite ↔ domicile forment la boucle. */
const PARTENAIRE: Record<ProcId, ProcId> = {
  identite: 'domicile',
  domicile: 'identite',
  hebergement: 'domicile',
  vie: 'identite',
};
/** Étapes voulues dans chaque procédure, dans l'ordre (un second visa : les agents travaillent aussi). */
const VOULU: EtapeType[] = ['piece', 'visa', 'signature', 'pieceService', 'visa', 'commission'];

/**
 * Ajoute à chaque procédure ouverte les étapes voulues qui manquent. La « Pièce délivrée par nos services »
 * attend `decouverte` secondes après sa note (le temps qu'un humain comprenne l'indice) ; 0 : aussitôt.
 */
function composer(s0: GameState, now: number, decouverte: number): GameState {
  let s = s0;
  for (;;) {
    const m = D.getModifiers2(s, now);
    if (!m.atelierVisible) return s;
    const x = s.acte2!;
    const note7 = x.notes.pieceService;
    const compris = note7 !== undefined && now >= note7.effective + decouverte * 1000;
    let action: ActionAtelier | null = null;
    for (const p of m.procsOuvertes) {
      const types = x.procedures[p].map((e) => e.type);
      // Une étape manque quand la procédure en compte moins que la liste voulue jusqu'à elle.
      const manque = VOULU.find(
        (t, i) =>
          m.etapesDisponibles.includes(t) &&
          types.filter((v) => v === t).length < VOULU.slice(0, i + 1).filter((v) => v === t).length &&
          (t !== 'pieceService' || compris),
      );
      if (manque === undefined) continue;
      action =
        manque === 'pieceService'
          ? { type: 'ajouter', p, etape: manque, exige: PARTENAIRE[p] }
          : { type: 'ajouter', p, etape: manque };
      break;
    }
    if (!action) return s;
    const avant = s;
    s = D.modifierProcedure(s, action, now);
    if (s === avant) return s;
  }
}

/** Une seconde d'acte II : visas au tap, tick, curseurs, notes, Atelier, ramettes, recrutement selon le goulot. */
export function robotActe2(s0: GameState, now: number, taps: number, decouverte = 0): GameState {
  let s = s0;
  for (let i = 0; i < taps; i++) s = D.tamponner2(s, now).s;
  s = D.tick2(s, 1, now).s;

  let m = D.getModifiers2(s, now);
  s = D.reglerTauxRejet2(s, m.rejetMax, now);
  if (m.exemplairesVisible) s = D.reglerExemplaires(s, 2, now);
  for (const id of D.notesVisibles2(s)) if (D.peutAcheterNote2(s, id)) s = D.acheterNote2(s, id, now);
  s = composer(s, now, decouverte);
  m = D.getModifiers2(s, now);

  // Formulaires : garder 20 s de consommation.
  const x = s.acte2!;
  const conso = (D.vitesseGuichets(x) + D.vitesseVisas(x) + taps) * x.exemplaires * 20;
  if (s.formulaires < conso) s = D.acheterRamettes2(s, Math.ceil((conso - s.formulaires) / BALANCE.ramette));
  s = D.requisitionUrgence2(s);

  // Recrutement : la meilleure capacité par euro, pondérée par la part des dossiers qui l'attendent
  // (visas pour les agents, autres étapes pour les guichets), sans affamer la prochaine note.
  const enAttente = NOTES2.filter((n) => s.acte2!.notes[n.id] === undefined && n.visible(s) && n.cout > 0);
  const reserve = enAttente.length ? Math.min(...enAttente.map((n) => D.conditionsNote2(s, n.id).cout)) : 0;
  for (;;) {
    const y = s.acte2!;
    const visas = D.visasEnAttente(y);
    const total = D.usagersEnCours(y) + D.dossiersEnBoucle(y);
    const partVisas = total > 0 ? visas / total : 0.5;
    const options = [
      { id: 'guichet' as const, cout: D.coutGuichet(y.guichets, D.guichetsOfferts(s)), gain: BALANCE2.guichet.vitesse * (1 - partVisas) },
      ...m.agentsDisponibles.map((id) => ({ id, cout: D.coutAgent2(id, y.agents[id]), gain: D.gainAgent2(y, id) * partVisas })),
    ].sort((a, b) => b.gain / b.cout - a.gain / a.cout);
    const choix = options[0];
    if (!m.recrutementVisible || s.budget < choix.cout) break;
    if (reserve > 0 && choix.cout > reserve * 0.5 && s.budget - choix.cout < reserve) break;
    const avant = s;
    s = choix.id === 'guichet' ? D.acheterGuichet(s, now) : D.acheterAgent2(s, choix.id, now);
    if (s === avant) break;
  }
  return s;
}

/** Ordre d'achat de la Jurisprudence du robot : ce qui raccourcit le plus la partie suivante d'abord. */
export const PRIORITE_JURISPRUDENCE: JurisprudenceId[] = [
  'memoire',
  'anteriorite',
  'anciennete',
  'videJuridique',
  'precedent',
  'droitAcquis',
];

/** Réforme du robot : il réforme, achète la Jurisprudence par priorité et signe le nouveau Cerfa. */
export function robotReforme(s0: GameState, now: number): GameState {
  let s = R.reformer(s0, now);
  for (;;) {
    const id = PRIORITE_JURISPRUDENCE.find((j) => R.peutAcheterJurisprudence(s, j));
    if (!id) break;
    s = R.acheterJurisprudence(s, id);
  }
  return E.signerCerfa(s, s.cerfa.prenom, now);
}
```

Ce qui change par rapport aux robots du plan 1 et de `simulate-acte1.ts` : la réserve pour la prochaine note compte le coût déjà-vu ; à l'acte II, le recrutement compare guichets et agents par capacité par euro pondérée par la part des dossiers qui les attendent (question 7) ; les procédures reçoivent un second Visa ; la Pièce de service peut attendre un temps de compréhension (`decouverte`).

- [ ] **Step 2: Le simulateur de l'acte I utilise le robot partagé**

Remplacer tout `scripts/simulate-acte1.ts` par :

```ts
/**
 * Simulateur d'équilibrage de l'acte I.
 * Usage : node scripts/simulate-acte1.ts [tapsParSeconde] [minutesMax]
 *
 * Un joueur-robot (scripts/robots.ts) tamponne, règle le rejet au maximum, achète les notes dès
 * qu'il peut et recrute le collègue le plus rentable. Affiche les jalons.
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

const E = await import('../data/engine.ts');
const { NOTES, NOTES_PAR_ID } = await import('../data/notes.ts');
const { robotActe1 } = await import('./robots.ts');

const taps = Number(process.argv[2] ?? 2);
const minutesMax = Number(process.argv[3] ?? 180);

let s = E.signerCerfa(E.etatInitial(0), 'Robot', 0);
const jalons: Record<string, number> = {};
const marquer = (k: string, t: number) => {
  if (jalons[k] === undefined) jalons[k] = t;
};
const mn = (t: number) => `${(t / 60).toFixed(1)} min`;

const EXTENSIONS = ['tilleuls', 'commune', 'canton'] as const;
const mesures = { tapsDemandes: 0, tapsTraites: 0 };
let serieVide = 0;
let pireSerie = 0;
let pireSerieA = 0;

for (let t = 1; t <= minutesMax * 60; t++) {
  const now = t * 1000;
  const avant = s;
  s = robotActe1(s, now, taps, mesures);
  const m = E.getModifiers(s, now);
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

  if (m.rejetVisible) marquer('rejet débloqué', t);
  for (const n of NOTES) if (s.notes[n.id] !== undefined) marquer(`note ${n.id}`, t);
  const recrues = Object.values(s.agents).reduce((a, b) => a + b, 0);
  if (recrues > 0) marquer('premier collègue', t);
  if (s.agents.stagiaire > avant.agents.stagiaire && t >= 20 * 60) marquer('stagiaire recruté après 20 min', t);

  if (m.conformiteVisible) marquer('conformité révélée', t);
  if (E.conformite(s) >= 100) marquer('conformité 100 %', t);
  if (s.acteTermine) {
    marquer('fin de l’acte', t);
    break;
  }

  if (t % 600 === 0) {
    console.log(
      `${mn(t).padStart(9)} | tampons ${Math.round(s.tampons).toString().padStart(8)} | budget ${Math.round(s.budget).toString().padStart(7)} € | pop ${Math.round(s.population)}/${E.perimetre(s, now)} | abandons ${Math.round(s.abandons)} | file ${Math.round(E.dossiersEnAttente(s))} | ${E.vitesseCollegues(s, m).toFixed(1)} d/s | rejet ${Math.round(s.tauxRejet * 100)} % | conf ${E.conformite(s).toFixed(1)} %`,
    );
  }
}

console.log('\nJalons :');
for (const [k, t] of Object.entries(jalons).sort((a, b) => a[1] - b[1])) {
  console.log(`  ${mn(t).padStart(9)}  ${k}`);
}

console.log('\nMesures :');
console.log(`  efficacité des taps : ${((mesures.tapsTraites / Math.max(1, mesures.tapsDemandes)) * 100).toFixed(1)} %`);
console.log(`  collègues : ${Object.entries(s.agents).map(([id, n]) => `${id} ${n}`).join(', ')}`);
console.log(`  plus longue file vide : ${pireSerie} s (finie à ${mn(pireSerieA)})`);
```

Run: `node scripts/simulate-acte1.ts 2 180`
Expected: mêmes jalons qu'avant à ±0,1 min (le marquage des jalons se fait désormais après la seconde jouée) : `note rejet` 2,0 min, `conformité révélée` 36,5 min, `fin de l’acte` 65,0 min ; `efficacité des taps : 99.4 %`.

- [ ] **Step 3: Le simulateur de l'acte II, Réforme comprise**

Remplacer tout `scripts/simulate-acte2.ts` par :

```ts
/**
 * Simulateur d'équilibrage de l'acte II, Réforme comprise.
 * Usage : node scripts/simulate-acte2.ts [tapsParSeconde] [minutesMax] [réformeÀ | balayage]
 *
 * Un joueur-robot entre dans l'acte II avec le compteur d'une fin d'acte I et joue (scripts/robots.ts).
 * Sans troisième argument, il ne réforme pas. Avec `réformeÀ` (en % de dématérialisation), il réforme
 * dès ce taux atteint, achète sa Jurisprudence, rejoue l'acte I, revient à l'acte II et le termine.
 * `balayage` compare la fin de l'acte sans Réforme et avec une Réforme à 30, 40 … 80 %.
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

const E = await import('../data/engine.ts');
const D = await import('../data/acte2/moteur.ts');
const R = await import('../data/reforme.ts');
const { finActeIRobot, robotActe1, robotActe2, robotReforme } = await import('./robots.ts');

const taps = Number(process.argv[2] ?? 2);
const minutesMax = Number(process.argv[3] ?? 300);
const mode = process.argv[4];
/** Minutes qu'un humain met à comprendre la note n° 7 (première partie seulement). */
const decouverte = Number(process.argv[5] ?? 0) * 60;

const mn = (t: number) => `${(t / 60).toFixed(1)} min`;

interface Partie {
  jalons: Record<string, number>;
  fin: number | null;
  s: GameState;
}

/** Joue depuis l'entrée dans l'acte II ; réforme une fois à `reformeA` % de dématérialisation (null : jamais). */
function jouer(reformeA: number | null, journal: boolean): Partie {
  let s = D.entrerActe2({ ...finActeIRobot(), finActeVue: true }, 0);
  const jalons: Record<string, number> = {};
  const marquer = (k: string, t: number) => {
    if (jalons[k] === undefined) jalons[k] = t;
  };
  const tour = () => (s.reformes.nombre > 0 ? ' (après la Réforme)' : '');
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
    s = robotActe2(s, now, taps, s.reformes.nombre === 0 ? decouverte : 0);
    const x = s.acte2!;
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
      return { jalons, fin: t, s };
    }
    if (journal && t % 600 === 0) {
      console.log(
        `${mn(t).padStart(9)} | budget ${Math.round(s.budget).toString().padStart(9)} € | guichets ${x.guichets} | agents ${x.agents.instructeur}/${x.agents.chefBureau}/${x.agents.sousDirecteur} | boucle ${Math.round(D.dossiersEnBoucle(x))} | rendement ${D.rendementDemat(s, x).toFixed(2)} | démat ${D.dematerialisation(x).toFixed(1)} %`,
      );
    }
  }
  return { jalons, fin: null, s };
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
    console.log(`  procédures : ${Object.entries(fin.procedures).map(([q, e]) => `${q} [${e.map((v) => v.type).join(', ')}]`).join(' · ')}`);
  }
}
```

- [ ] **Step 4: Recaler la cible de dématérialisation et les notes n° 11 à 15**

Dans `constants/balanceActe2.ts`, bloc `BALANCE2`, remplacer :

```ts
  demaCible: 140_000,
```

par :

```ts
  demaCible: 55_000,
```

Dans `data/acte2/notes2.ts`, remplacer les coûts (un remplacement par note, dans l'ordre du fichier) :

| Note | Avant | Après |
|---|---|---|
| n° 11 `demat` | `cout: 50000,` | `cout: 12000,` |
| n° 12 `rejetElargi` | `cout: 80000,` | `cout: 25000,` |
| n° 13 `commission` | `cout: 120000,` | `cout: 40000,` |
| n° 14 `sousDirecteur` | `cout: 200000,` | `cout: 60000,` |
| n° 15 `quatrieme` | `cout: 300000,` | `cout: 90000,` |

- [ ] **Step 5: Vérifier le calage**

Run: `npm test`
Expected: `ℹ pass 137`, `ℹ fail 0` (les tests sont relatifs à `demaCible`).

Run: `node scripts/simulate-acte2.ts 1 300`, puis `2 300`, puis `3 300`
Expected (jalons, ±0,5 min) :

| Jalon | 1 tap/s | 2 taps/s | 3 taps/s |
|---|---|---|---|
| premier agent | 3,0 | 2,8 | 3,0 |
| atelier | 9,8 | 9,4 | 9,3 |
| premier chef de bureau | 24,9 | 24,2 | 20,7 |
| première boucle (et réforme débloquée) | 27,8 | 27,2 | 26,6 |
| note demat (n° 11) | 35,6 | 35,0 | 34,4 |
| dématérialisation 50 % | 98,5 | 97,3 | 96,1 |
| note quatrieme (n° 15) | 127,1 | 126,5 | 125,9 |
| dématérialisation 100 % | 193,5 | 191,5 | 189,7 |

Cible robot sans Réforme : 150 – 200 min.

Run: `node scripts/simulate-acte2.ts 2 300 balayage`
Expected :

```
Sans Réforme : fin de l’acte II à 191.5 min
Réforme à 0 % : réforme (6 trombones : anteriorite) à 27.2 min · acte I rejoué 48.9 min · fin 124.7 min · rentable
Réforme à 20 % : réforme (11 trombones : memoire, videJuridique) à 54.6 min · acte I rejoué 76.1 min · fin 137.3 min · rentable
Réforme à 40 % : réforme (14 trombones : memoire, anteriorite) à 81.9 min · acte I rejoué 103.7 min · fin 144.2 min · rentable
Réforme à 50 % : réforme (15 trombones : memoire, anteriorite) à 97.2 min · acte I rejoué 118.9 min · fin 158.2 min · rentable
Réforme à 60 % : réforme (17 trombones : memoire, anteriorite, videJuridique) à 113.8 min · acte I rejoué 135.4 min · fin 171.9 min · rentable
Réforme à 70 % : réforme (19 trombones : memoire, anteriorite, anciennete) à 131.3 min · acte I rejoué 149.8 min · fin 182.2 min · rentable
Réforme à 80 % : réforme (20 trombones : memoire, anteriorite, anciennete) à 149.6 min · acte I rejoué 168.1 min · fin 199.5 min · pas rentable
```

(À ±1 min près : le tirage des noms et du seuil de la note n° 1 est aléatoire, sans effet sur le rythme.) Critères : rentable à 50, 60 et 70 % ; au moins deux bonus à toute Réforme (6 trombones au déblocage = deux bonus à 3) ; acte I rejoué en 18 à 22 min (cible humaine 20 – 30).

Run: `node scripts/simulate-acte2.ts 2 300 balayage 15`
Expected : `Sans Réforme : fin de l’acte II à 238.4 min` ; toutes les lignes de 0 à 80 % « rentable » ; `Réforme à 0 % : réforme (9 trombones : memoire) à 42.2 min · acte I rejoué 63.9 min · fin 132.6 min`.

Run: `node scripts/simulate-acte2.ts 2 300 0 15`
Expected : jalons `42.2 min  réforme débloquée`, `63.9 min  acte I rejoué`, `132.7 min  fin de l’acte II` (±1 min). Ce sont ceux d'un joueur qui met 15 min à comprendre la note n° 7 et réforme dès qu'il le peut : Réforme débloquée 42,2 (cible 40 – 55), Première Réforme replay compris 63,9 (cible 60 – 90), fin de l'acte 132,7 (cible 105 – 135).

Si un nombre sort de ±2 min : relire les Tâches 2 et 4 (rendement, déjà-vu) avant de toucher aux constantes ; les leviers, dans l'ordre, sont `REFORME.scleroseS` (plus petit : mur plus dur), `BALANCE2.demaCible`, `REFORME.jurisprudenceConstante`, `REFORME.dejaVuCout`.

- [ ] **Step 6: Mettre la spec à jour**

Dans `specs/009-acte2-direction/spec.md`, remplacer la ligne :

```markdown
- **Le mur** : en fin d'acte, la montée de la dématérialisation ralentit (coût croissant des Guichets et des agents, formulaires). Continuer sans Réforme reste possible mais long ; réformer et revenir avec la Jurisprudence est plus rapide. Le simulateur vérifie que la Réforme est rentable à partir de 50 – 70 % de dématérialisation.
```

par :

```markdown
- **Le mur** : en fin d'acte, la montée de la dématérialisation ralentit. Deux mécaniques invisibles le portent (plan 3) : la **sclérose des services** (chaque étape franchie en boucle rapporte `1 / (1 + durée des services / scleroseS)` point ; la durée court depuis l'entrée dans l'acte et la Réforme la remet à zéro) et la **jurisprudence constante** (+10 % de rendement par trombone obtenu, dépensé ou non). La Conformité de l'acte II compte ×120 : elle ne sert qu'aux trombones. Continuer sans Réforme reste possible mais long ; réformer et revenir avec la Jurisprudence est plus rapide. Le simulateur vérifie que la Réforme est rentable jusqu'à 70 % de dématérialisation au moins (`node scripts/simulate-acte2.ts 2 300 balayage`).
```

Remplacer :

```markdown
Au replay, sans rien acheter : une note de service déjà achetée lors d'une partie précédente a un délai d'instruction divisé par 4 (« Dossier déjà instruit, procédure simplifiée »). La fiche de poste de l'acte I n'est pas reproposée.
```

par :

```markdown
Au replay, sans rien acheter : une note de service déjà achetée lors d'une partie précédente a un délai d'instruction divisé par 4 et un coût divisé par 6 (« Dossier déjà instruit, procédure simplifiée »). La fiche de poste de l'acte I n'est pas reproposée.
```

Remplacer :

```markdown
- Constantes dans `constants/balance.ts` (bloc acte II), vérifiées par `scripts/simulate-acte2.ts`.
```

par :

```markdown
- Constantes dans `constants/balanceActe2.ts` (`BALANCE2`, `REFORME`, `JURISPRUDENCE`), vérifiées par `scripts/simulate-acte2.ts`.
```

Remplacer toute la section, du titre `### Mesures du robot (sans Réforme, \`scripts/simulate-acte2.ts\`)` jusqu'à la ligne « Le robot construit la boucle dès que l'étape est disponible : le temps de découverte humain n'est pas mesuré ici. » comprise, par :

```markdown
### Mesures du robot (`scripts/simulate-acte2.ts`)

Sans Réforme, en minutes depuis l'entrée dans l'acte II :

| Jalon | Robot 1 tap/s | Robot 2 taps/s | Robot 3 taps/s |
|---|---|---|---|
| Premier agent | 3.0 | 2.8 | 3.0 |
| Atelier | 9.8 | 9.4 | 9.3 |
| Première boucle | 27.8 | 27.2 | 26.6 |
| Dématérialisation 50 % | 98.5 | 97.3 | 96.1 |
| Dématérialisation 100 % | 193.5 | 191.5 | 189.7 |

Avec une Réforme (2 taps/s, `balayage`) : rentable de 0 à 70 % de dématérialisation (fin de l'acte entre 124.7 et 182.2 min contre 191.5), pas à 80 % (199.5) ; l'acte I est rejoué en 18 à 22 min ; la plus petite Réforme rapporte 6 trombones.

Le robot construit la boucle dès que l'étape est disponible. Avec 15 min de compréhension de la note n° 7 (`balayage 15`) et une Réforme dès son déblocage : Réforme débloquée à 42.2 min, acte I rejoué à 63.9 min, fin de l'acte à 132.7 min.
```

- [ ] **Step 7: Commiter**

```bash
git add scripts/robots.ts scripts/simulate-acte1.ts scripts/simulate-acte2.ts constants/balanceActe2.ts data/acte2/notes2.ts specs/009-acte2-direction/spec.md
git commit -m "perf(logic): calage du mur de l'acte II et simulateur de la Réforme

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Branchement dans GameStateContext

**Files:**
- Modify: `context/GameStateContext.tsx`

**Interfaces:**
- Consumes: `R.vueReforme`, `R.numeroCerfa`, `R.reformer`, `R.acheterJurisprudence`, `E.conditionsNoteActe1`, `D.prixRamette2`.
- Produces (via `useGameState()`) : `reforme: VueReforme`, `cerfaNumero: string`, `reformer(): void`, `acheterJurisprudence(id: JurisprudenceId): void`, `NoteAffichee.dejaInstruite`, `prixRamette` Vide juridique compris ; types réexportés `JurisprudenceId`, `JurisprudenceAffichee`, `VueReforme`.

- [ ] **Step 1: Imports et types**

Dans `context/GameStateContext.tsx`, sous `import type { ActionAtelier, Agent2Id, Exemplaires, Note2Id } from '@/types/acte2';`, ajouter :

```tsx
import type { JurisprudenceId } from '@/types/reforme';
```

Sous `import { lettreAbsence2 } from '@/data/acte2/courrier2';`, ajouter :

```tsx
import * as R from '@/data/reforme';
```

Sous `export type { Encre };`, ajouter :

```tsx
export type { JurisprudenceId } from '@/types/reforme';
export type { JurisprudenceAffichee, VueReforme } from '@/data/reforme';
```

Dans `interface NoteAffichee`, remplacer :

```tsx
  resteSec: number;
  nouvelle: boolean;
}

export interface AgentAffiche
```

par :

```tsx
  resteSec: number;
  nouvelle: boolean;
  /** Déjà-vu administratif : note achetée lors d'une partie précédente (délai et coût réduits). */
  dejaInstruite: boolean;
}

export interface AgentAffiche
```

Dans `interface GameContextType`, remplacer :

```tsx
  /** Atelier des procédures ; null tant qu'il est fermé (et à l'acte I). */
  atelier: A.VueAtelier | null;
```

par :

```tsx
  /** Atelier des procédures ; null tant qu'il est fermé (et à l'acte I). */
  atelier: A.VueAtelier | null;
  /** Trombones, Réforme possible et Jurisprudence (dossier administratif). */
  reforme: R.VueReforme;
  /** Numéro du Cerfa d'embauche de la partie (00001*01, puis *02… après chaque Réforme). */
  cerfaNumero: string;
```

et :

```tsx
  /** Fin de l'acte I : prise de fonctions à la Direction. */
  entrerDirection: () => void;
```

par :

```tsx
  /** Fin de l'acte I : prise de fonctions à la Direction. */
  entrerDirection: () => void;
  /** La Réforme : retour au Cerfa puis au début de l'acte I (sans effet si elle n'est pas possible). */
  reformer: () => void;
  /** Achète un bonus de Jurisprudence avec les trombones (définitif). */
  acheterJurisprudence: (id: JurisprudenceId) => void;
```

- [ ] **Step 2: Les actions**

Juste avant `  const marquerFichePoste = useCallback(`, ajouter :

```tsx
  const reformer = useCallback(() => {
    const s = R.reformer(etatRef.current, Date.now());
    if (s === etatRef.current) return;
    satureRef.current = false;
    setVerdict(null);
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    vibrerSi('succes');
    appliquer(s);
  }, [appliquer, vibrerSi]);

  const acheterJurisprudence = useCallback(
    (id: JurisprudenceId) => {
      const s = R.acheterJurisprudence(etatRef.current, id);
      if (s === etatRef.current) return;
      vibrerSi('moyen');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );
```

Après la Réforme, `etat.cerfa.signe` est faux : la boucle de jeu s'arrête (`if (!s0.cerfa.signe) return;`) et `TabLayout` affiche `CerfaEcran` ; `signerCerfa` repart de l'heure de la signature (`derniereMaj`), sans absence à rattraper.

- [ ] **Step 3: Les vues**

Dans le `useMemo` des notes, remplacer :

```tsx
            const def = NOTES_PAR_ID[id];
            const st = etat.notes[id];
            let statut: StatutNote = etat.budget >= def.cout ? 'disponible' : 'tropCher';
```

par :

```tsx
            const def = NOTES_PAR_ID[id];
            const { cout, instruction } = E.conditionsNoteActe1(etat, id);
            const st = etat.notes[id];
            let statut: StatutNote = etat.budget >= cout ? 'disponible' : 'tropCher';
```

et :

```tsx
            const { visible: _v, appliquer: _a, ...rest } = def;
            return { ...rest, statut, resteSec, nouvelle: !etat.notesVues.includes(id) };
```

par :

```tsx
            const { visible: _v, appliquer: _a, ...rest } = def;
            return {
              ...rest,
              cout,
              instruction,
              statut,
              resteSec,
              nouvelle: !etat.notesVues.includes(id),
              dejaInstruite: etat.reformes.notesInstruites.includes(id),
            };
```

Remplacer :

```tsx
  const prixRamette = etat.acte === 2 ? BALANCE.prixRamette : E.prixRamette(mods);
```

par :

```tsx
  const prixRamette = etat.acte === 2 ? D.prixRamette2(etat) : E.prixRamette(mods);
  const reforme = useMemo(() => R.vueReforme(etat, maintenant), [etat, maintenant]);
```

Dans l'objet `valeur`, remplacer :

```tsx
      atelier,
      demanderRequisition,
```

par :

```tsx
      atelier,
      reforme,
      cerfaNumero: R.numeroCerfa(etat),
      demanderRequisition,
```

et :

```tsx
      entrerDirection,
      marquerNotesVues,
```

par :

```tsx
      entrerDirection,
      reformer,
      acheterJurisprudence,
      marquerNotesVues,
```

Dans le tableau de dépendances du `useMemo`, remplacer :

```tsx
      reglerExemplaires, modifierProcedure, entrerDirection,
    ],
```

par :

```tsx
      reglerExemplaires, modifierProcedure, entrerDirection, reforme, reformer, acheterJurisprudence,
    ],
```

- [ ] **Step 4: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, `ℹ pass 137`.

- [ ] **Step 5: Commiter**

```bash
git add context/GameStateContext.tsx
git commit -m "feat(state): Réforme, Jurisprudence et Cerfa redemandé dans GameStateContext

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Options — Réforme et Jurisprudence

**Files:**
- Create: `components/reforme/SectionReforme.tsx`
- Create: `components/reforme/ListeJurisprudence.tsx`
- Modify: `app/(tabs)/options.tsx`

**Interfaces:**
- Consumes: `useGameState()` → `reforme` (`trombones`, `possible`, `gain`, `cerfaSuivant`, `jurisprudence`), `reformer`, `acheterJurisprudence`, `encre`, `direction.nomService` ; `useFermetureEchap` ; types `Encre`, `JurisprudenceAffichee`, `JurisprudenceId` ; `router` (`expo-router`) ; icônes `Paperclip`, `X` (`lucide-react-native`).
- Produces: composants par défaut `SectionReforme`, `ListeJurisprudence`.

- [ ] **Step 1: La carte Réforme et le Formulaire R-01**

`components/reforme/SectionReforme.tsx` :

```tsx
import React, { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Paperclip, X } from 'lucide-react-native';
import { useFermetureEchap, useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/**
 * Réforme (Options, acte II, après la note n° 10) : une carte qui ouvre le Formulaire R-01.
 * Tamponner le formulaire engage la Réforme : retour au Cerfa, puis au guichet 3.
 */
export default function SectionReforme() {
  const { reforme, reformer, encre } = useGameState();
  const [ouvert, setOuvert] = useState(false);
  const fermer = useCallback(() => setOuvert(false), []);
  useFermetureEchap(ouvert, fermer);

  const tamponner = useCallback(() => {
    setOuvert(false);
    reformer();
    router.navigate('/');
  }, [reformer]);

  const lignes: [string, string][] = [
    ['Trombones attribués', `+ ${formatEntier(reforme.gain)}`],
    ['Reprise au', 'Guichet 3, acte I'],
    ['Conservé', 'Tampons, trombones, Jurisprudence'],
    ['Nouveau Cerfa', `n° ${reforme.cerfaSuivant}`],
  ];

  return (
    <>
      <Pressable
        onPress={() => setOuvert(true)}
        accessibilityRole="button"
        accessibilityLabel="Réforme de l’action publique, ouvrir le formulaire R-01"
        style={({ pressed }) => pressed && styles.presse}
      >
        <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
          <View style={styles.rond}>
            <Paperclip size={20} color={Colors.anthracite} />
          </View>
          <Text style={styles.titreCarte}>Réforme de l’action publique</Text>
        </Panneau>
      </Pressable>

      <Modal visible={ouvert} transparent animationType="fade" onRequestClose={fermer}>
        <Pressable style={styles.voile} onPress={fermer} accessible={false}>
          <Pressable onPress={() => undefined} accessible={false} style={styles.colonne}>
            <Panneau contenuStyle={styles.feuille} rayon={Charte.rayon}>
              <View style={styles.entete}>
                <Text style={styles.titreFeuille} accessibilityRole="header">
                  Formulaire R-01 · Réforme
                </Text>
                <Pressable
                  onPress={fermer}
                  style={styles.fermer}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer le formulaire"
                >
                  <X size={22} color={Colors.anthracite} />
                </Pressable>
              </View>
              <View style={styles.table}>
                {lignes.map(([k, v]) => (
                  <View key={k} style={styles.ligne}>
                    <Text style={styles.cle}>{k}</Text>
                    <Text style={styles.valeur}>{v}</Text>
                  </View>
                ))}
              </View>
              <BoutonPoussoir
                libelle="TAMPONNER LA RÉFORME"
                taille={Typo.titre}
                hauteur={56}
                couleur={encre.face}
                couleurOmbre={encre.flanc}
                onPress={tamponner}
                accessibilityHint="Engage la Réforme : retour au guichet 3, acte I"
              />
            </Panneau>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    minHeight: 64,
    padding: Espace.m,
    backgroundColor: Colors.papierChaud,
  },
  rond: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.pastelJaune,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titreCarte: {
    flex: 1,
    fontFamily: Fonts.titre,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  /** Sur grand écran, la fenêtre garde la largeur de la colonne de l'app. */
  colonne: {
    width: '100%',
    maxWidth: Charte.largeurColonne,
    alignSelf: 'center',
  },
  voile: {
    flex: 1,
    justifyContent: 'center',
    padding: Espace.l,
    backgroundColor: Colors.voile,
  },
  feuille: {
    padding: Espace.l,
    gap: Espace.m,
    backgroundColor: Colors.papierFiche,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
    paddingBottom: Espace.xs,
  },
  titreFeuille: {
    flex: 1,
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  fermer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  table: {
    gap: Espace.s,
  },
  ligne: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: Espace.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.carton,
    paddingBottom: Espace.xs,
  },
  cle: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
  valeur: {
    flexShrink: 1,
    marginLeft: 'auto',
    textAlign: 'right',
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
});
```

Pas de « Annuler » ni de confirmation de plus : le formulaire est la confirmation (spec : « Confirmation par un formulaire ») ; la croix et le voile le referment.

- [ ] **Step 2: La Jurisprudence**

`components/reforme/ListeJurisprudence.tsx` :

```tsx
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useGameState,
  type Encre,
  type JurisprudenceAffichee,
  type JurisprudenceId,
} from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';

const trombones = (n: number) => `${n} trombone${n > 1 ? 's' : ''}`;

const CarteJurisprudence = memo(function CarteJurisprudence({
  j,
  encre,
  onAcquerir,
}: {
  j: JurisprudenceAffichee;
  encre: Encre;
  onAcquerir: (id: JurisprudenceId) => void;
}) {
  return (
    <View style={styles.carte}>
      <View style={styles.texte}>
        <Text style={styles.nom}>{j.nom}</Text>
        <Text style={styles.effet}>{j.effet}</Text>
      </View>
      {j.acquise ? (
        <View style={styles.acquise} accessible accessibilityLabel={`${j.nom}, acquise`}>
          <Text style={styles.acquiseTexte}>ACQUISE</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => onAcquerir(j.id)}
          disabled={!j.achetable}
          accessibilityRole="button"
          accessibilityLabel={`Acquérir ${j.nom}, ${trombones(j.cout)}`}
          accessibilityState={{ disabled: !j.achetable }}
          style={({ pressed }) => [
            styles.bouton,
            j.achetable ? { backgroundColor: encre.face } : styles.boutonInactif,
            pressed && styles.presse,
          ]}
        >
          <Text style={[styles.boutonTexte, !j.achetable && styles.boutonTexteInactif]}>{trombones(j.cout)}</Text>
        </Pressable>
      )}
    </View>
  );
});

/** Jurisprudence (Options, après la première Réforme) : bonus permanents payés en trombones. */
export default function ListeJurisprudence() {
  const { reforme, acheterJurisprudence, encre } = useGameState();
  if (!reforme.jurisprudence) return null;
  return (
    <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
      {reforme.jurisprudence.map((j) => (
        <CarteJurisprudence key={j.id} j={j} encre={encre} onAcquerir={acheterJurisprudence} />
      ))}
    </Panneau>
  );
}

const styles = StyleSheet.create({
  fiche: {
    padding: Espace.m,
    gap: Espace.s,
    backgroundColor: Colors.papierChaud,
  },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.carton,
    paddingBottom: Espace.s,
  },
  texte: {
    flex: 1,
    gap: Espace.xs,
  },
  nom: {
    fontFamily: Fonts.titre,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  effet: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  bouton: {
    minHeight: 44,
    minWidth: 112,
    paddingHorizontal: Espace.s,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonInactif: {
    backgroundColor: Colors.carton,
    borderColor: Colors.crayonClair,
  },
  boutonTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  boutonTexteInactif: {
    color: Colors.crayon,
  },
  acquise: {
    minHeight: 44,
    minWidth: 112,
    paddingHorizontal: Espace.s,
    borderRadius: Charte.rayonMini,
    borderWidth: Charte.traitFin,
    borderColor: Colors.vertEncre,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
  },
  acquiseTexte: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.petit,
    color: Colors.vertEncre,
    letterSpacing: 1,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
```

Un bonus non achetable garde son prix lisible sur un bouton gris (désactivé, `accessibilityState`) : ni « Il manque … », ni explication.

- [ ] **Step 3: Le dossier administratif**

Dans `app/(tabs)/options.tsx`, sous `import Confirmation from '@/components/charte/Confirmation';`, ajouter :

```tsx
import SectionReforme from '@/components/reforme/SectionReforme';
import ListeJurisprudence from '@/components/reforme/ListeJurisprudence';
```

Remplacer :

```tsx
  const { etat, grade, direction, deposerDemission, nouvellePartie, marquerFichePoste, encre } = useGameState();
```

par :

```tsx
  const { etat, grade, direction, reforme, deposerDemission, nouvellePartie, marquerFichePoste, encre } =
    useGameState();
```

Sous la ligne `  const prime = grade.rang > 0 ? …`, ajouter :

```tsx
  // Les trombones n'apparaissent qu'après la première Réforme.
  const trombones: [string, string][] = reforme.trombones !== null ? [['Trombones', formatEntier(reforme.trombones)]] : [];
```

Dans la branche acte II du tableau `lignes`, remplacer :

```tsx
        ['Affectation', 'La Direction'],
        ['Tampons apposés', formatEntier(etat.tampons)],
```

par :

```tsx
        ['Affectation', direction.nomService],
        ['Tampons apposés', formatEntier(etat.tampons)],
        ...trombones,
```

Dans la branche acte I, remplacer :

```tsx
        ['Tampons apposés', formatEntier(etat.tampons)],
        ['Dossiers rejetés', formatEntier(Math.floor(etat.stats.rejetes))],
```

par :

```tsx
        ['Tampons apposés', formatEntier(etat.tampons)],
        ...trombones,
        ['Dossiers rejetés', formatEntier(Math.floor(etat.stats.rejetes))],
```

Remplacer :

```tsx
        <Text style={styles.titre}>Règlement intérieur</Text>
```

par :

```tsx
        {reforme.possible && (
          <>
            <Text style={styles.titre}>Réforme</Text>
            <SectionReforme />
          </>
        )}

        {reforme.jurisprudence && (
          <>
            <Text style={styles.titre}>Jurisprudence</Text>
            <ListeJurisprudence />
          </>
        )}

        <Text style={styles.titre}>Règlement intérieur</Text>
```

Remplacer :

```tsx
          <Text style={styles.cerfa}>Cerfa n° 00001*02 — Demande de cessation volontaire de fonctions</Text>
```

par :

```tsx
          {/* 00001 est le Cerfa d'embauche, redemandé en *02, *03… à chaque Réforme. */}
          <Text style={styles.cerfa}>Cerfa n° 00002*01 — Demande de cessation volontaire de fonctions</Text>
```

et :

```tsx
                {direction ? 'à la Direction' : 'au guichet 3'}.
```

par :

```tsx
                {direction ? `à ${direction.nomService}` : 'au guichet 3'}.
```

- [ ] **Step 4: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, `ℹ pass 137`.

Navigateur (procédure « Vérifier dans le navigateur »), 375 × 812, un seul onglet de jeu :
1. Préréglage `demat` (note n° 10 non approuvée), Options : ni section « Réforme », ni « Jurisprudence », ni ligne « Trombones ».
2. Préréglage `reforme`, Options : Affectation « La Direction » ; sous le dossier, titre « Réforme » et une carte (trombone sur rond jaune) « Réforme de l’action publique », sans texte dessous. La toucher : fenêtre « Formulaire R-01 · Réforme » ; lignes « Trombones attribués + 15 », « Reprise au Guichet 3, acte I », « Conservé Tampons, trombones, Jurisprudence », « Nouveau Cerfa n° 00001*02 » ; bouton bleu « TAMPONNER LA RÉFORME ». La croix (44 × 44) et Échap la ferment sans rien changer (`reformes.nombre` reste 0).
3. Rouvrir, « TAMPONNER LA RÉFORME » : écran du Cerfa (Tâche 9 pour le numéro). Lire l'état : `acte` 1, `acte2` null, `tampons` 160 000, `reformes.nombre` 1, `reformes.trombones` 15, `reformes.premierCerfa.prenom` « Camille », `reformes.denomination.direction` différent de « La Direction ».
4. Préréglage `cerfa2`, signer le Cerfa (deux cases, TAMPONNER), Options : « Affectation Guichet 3 », « Trombones 15 » ; section « Jurisprudence » : six cartes (nom, effet), boutons « 3 trombones », « 3 trombones », « 5 trombones », « 6 trombones », « 5 trombones », « 8 trombones ». Toucher « 3 trombones » de Précédent : tampon vert « ACQUISE » à sa place, « Trombones 12 », état `agents.stagiaire` 3. Acheter Mémoire des services (8) : il reste 4 trombones ; Ancienneté reconnue (6) est grisé et ne réagit pas. Aucune ligne d'explication sous les cartes ; libellés d'accessibilité « Acquérir Précédent, 3 trombones » (`find`).
5. Démission : « Cerfa n° 00002*01 — … » ; « … de mes fonctions au guichet 3. ».
6. 375 × 667 : le Formulaire R-01 tient sans défilement ; la liste de Jurisprudence défile avec la page.
7. Revenir au preset `desktop`.

- [ ] **Step 5: Commiter**

```bash
git add components/reforme/SectionReforme.tsx components/reforme/ListeJurisprudence.tsx "app/(tabs)/options.tsx"
git commit -m "feat(ui): Réforme et Jurisprudence dans le dossier administratif

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Cerfa redemandé, notes déjà instruites, fin d'acte et règlement

**Files:**
- Modify: `components/CerfaEcran.tsx`
- Modify: `app/(tabs)/notes.tsx` (`CarteNote`)
- Modify: `components/direction/FinActe2Modal.tsx`
- Modify: `components/ReglementInterieur.tsx`
- Modify: `components/direction/reglementDirection.ts`

**Interfaces:**
- Consumes: `useGameState()` → `cerfaNumero`, `etat.cerfa.prenom`, `NoteAffichee.dejaInstruite`, `direction.nomService`, `direction.reformeVisible`.
- Produces: rien de nouveau (affichage).

- [ ] **Step 1: Le Cerfa redemandé**

Dans `components/CerfaEcran.tsx`, remplacer :

```tsx
  const { signerCerfa } = useGameState();
  const [prenom, setPrenom] = useState('');
```

par :

```tsx
  // Après une Réforme, le Cerfa est redemandé sous un nouveau numéro ; le prénom est déjà connu.
  const { signerCerfa, cerfaNumero, etat } = useGameState();
  const [prenom, setPrenom] = useState(etat.cerfa.prenom);
```

et :

```tsx
            <Text style={styles.cerfa}>Cerfa n° 00001*01</Text>
```

par :

```tsx
            <Text style={styles.cerfa}>Cerfa n° {cerfaNumero}</Text>
```

Le reste de l'écran ne change pas (« Bienvenue. Guichet 3. » est vrai après une Réforme aussi). La fiche de poste ne revient pas : `reformer` garde `fichePosteVue` à vrai.

- [ ] **Step 2: « Dossier déjà instruit, procédure simplifiée »**

Dans `app/(tabs)/notes.tsx`, composant `CarteNote`, remplacer :

```tsx
        {note.instruction > 0 && !signee ? ` Délai d’instruction : ${duree(note.instruction)}.` : ''}
```

par :

```tsx
        {note.instruction > 0 && !signee ? ` Délai d’instruction : ${duree(Math.ceil(note.instruction))}.` : ''}
        {note.dejaInstruite && !signee ? ' Dossier déjà instruit, procédure simplifiée.' : ''}
```

(`Math.ceil` : un délai divisé par 4 peut tomber entre deux secondes, 90 s → 22,5 s, affiché « 23 s ».) C'est la mention de la spec, sur la ligne « Effet » de la carte, comme le délai ; le prix affiché sur le bouton est déjà le prix réduit.

- [ ] **Step 3: La fin de l'acte II porte le nom du service**

Remplacer tout `components/direction/FinActe2Modal.tsx` par :

```tsx
import React from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useFermetureEchap, useGameState } from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/** Écran de fin de l'acte II, affiché une fois après la note « Promotion ». Le jeu continue ensuite. */
export default function FinActe2Modal() {
  const { etat, direction, marquerFinActeVue, encre } = useGameState();
  const visible =
    direction !== null && direction.acteTermine && !direction.finActeVue;
  useFermetureEchap(visible, marquerFinActeVue);
  // Le nom du service change à chaque Réforme.
  const nom = direction?.nomService ?? 'La Direction';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={marquerFinActeVue}
    >
      <Pressable
        style={styles.voile}
        onPress={marquerFinActeVue}
        accessible={false}
      >
        <Pressable
          onPress={() => undefined}
          accessible={false}
          style={styles.colonne}
        >
          <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
            <Text style={styles.sur}>{nom} — rattachement au ministère</Text>
            <Text style={styles.citation}>
              {`«\u00a0${nom} devient une unité du ministère. Vous êtes nommé·e ministre.\u00a0»`}
            </Text>
            <Text style={styles.bilan}>
              {formatEntier(etat.tampons)} tampons apposés ·{' '}
              {formatEntier(direction?.visasAccordes ?? 0)} visas accordés
            </Text>
            <Text style={styles.fin}>FIN DE L’ACTE II</Text>
            <Text style={styles.suite}>
              Le service reste ouvert : vos tampons continuent de compter.
            </Text>
            <BoutonPoussoir
              libelle="RETOURNER À LA DIRECTION"
              taille={Typo.titre}
              hauteur={56}
              couleur={encre.face}
              couleurOmbre={encre.flanc}
              onPress={marquerFinActeVue}
            />
          </Panneau>
        </Pressable>
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
    justifyContent: 'center',
    padding: Espace.xl,
  },
  carte: {
    padding: Espace.xl,
    gap: Espace.m,
    backgroundColor: Colors.creme,
  },
  sur: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
    textAlign: 'center',
  },
  citation: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
    textAlign: 'center',
  },
  bilan: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.petit,
    color: Colors.crayon,
    textAlign: 'center',
  },
  fin: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.grand,
    color: Colors.anthracite,
    textAlign: 'center',
    letterSpacing: 1,
  },
  suite: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
    textAlign: 'center',
  },
});
```

(Seuls changent la constante `nom`, la ligne `sur`, la citation et la ligne `suite` : « Le service reste ouvert : … », neutre quel que soit le genre du nouveau nom.)

- [ ] **Step 4: Le règlement intérieur**

Dans `components/ReglementInterieur.tsx`, remplacer :

```tsx
          {direction ? 'La Direction' : 'Guichet 3'} · {affiches.length} articles en vigueur
```

par :

```tsx
          {direction ? direction.nomService : 'Guichet 3'} · {affiches.length} articles en vigueur
```

Dans `components/direction/reglementDirection.ts`, remplacer :

```ts
  if (d.demat !== null) {
```

par :

```ts
  if (d.reformeVisible) {
    articles.push({
      titre: 'La Réforme',
      texte: 'Une réforme réorganise l’ensemble des services sans en modifier le fonctionnement. Elle reprend au guichet 3 ; les tampons apposés, les trombones et la Jurisprudence sont conservés.',
    });
  }
  if (d.demat !== null) {
```

- [ ] **Step 5: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, `ℹ pass 137`.

Navigateur, 375 × 812 :
1. Nouvelle partie (Options → Effacer la partie) : le Cerfa porte « Cerfa n° 00001*01 », champ prénom vide (régression).
2. Préréglage `cerfa2` : « Cerfa n° 00001*02 », champ prénom « Camille » ; signer : guichet 3, aucune fiche de poste ; l'enveloppe porte une pastille, la lettre « Réforme : nouvelle dénomination de vos services » cite le nouveau nom du service, les quatre procédures et « Cerfa n° 00001*02 ».
3. Onglet Notes (visible aussitôt, pastille « 9+ ») : la note n° 1 « Renfort estival » dit « Effet : Débloque l’onglet Service. Dossier déjà instruit, procédure simplifiée. » ; la note n° 7 (Tilleuls) dit « Délai d’instruction : 23 s. Dossier déjà instruit, procédure simplifiée. » et coûte 150 € (900 ÷ 6).
4. Préréglage `reforme` : règlement « La Direction · 10 articles en vigueur », dont « La Réforme » ; aucun article ne contient « boucle » (`get_page_text`).
5. Le nom tiré à l'acte II d'une partie réformée (bulle, Atelier, Affectation) est vérifié à la Tâche 10 et par le test « vues : les noms tirés à la Réforme … » (Tâche 5).
6. Revenir au preset `desktop`.

- [ ] **Step 6: Commiter**

```bash
git add components/CerfaEcran.tsx "app/(tabs)/notes.tsx" components/direction/FinActe2Modal.tsx components/ReglementInterieur.tsx components/direction/reglementDirection.ts
git commit -m "feat(ui): Cerfa redemandé, notes déjà instruites et noms des services

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Vérification d'ensemble et CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: tout ce qui précède.
- Produces: documentation à jour.

- [ ] **Step 1: Mettre CLAUDE.md à jour**

Section « Project Overview », remplacer :

```markdown
and **Act II — La Direction** without the Réforme yet (spec: `specs/009-acte2-direction/spec.md`; closing the end-of-Act-I window starts it).
```

par :

```markdown
and **Act II — La Direction** with its Réforme (spec: `specs/009-acte2-direction/spec.md`; closing the end-of-Act-I window starts it). The **Réforme** (first prestige, Options at Act II once note n° 10 is in force) is a total reset back to the Cerfa (new number `00001*02`, `*03`…) and the very start of Act I; only `GameState.reformes` (trombones, Jurisprudence, already-instructed notes, memorised procedures, drawn service names, first Cerfa), the Tampons apposés counter (hence the grade) and the first name survive. Notes bought in an earlier run cost ÷ 6 and take ÷ 4 of their delay (déjà-vu administratif). The end-of-Act-II wall is the « sclérose des services »: each loop step yields `(1 + 0.1 × trombones obtained) / (1 + service age / 1250 s)` démat points, and the Réforme resets the age.
```

Section « Commands », remplacer :

```bash
node scripts/simulate-acte2.ts [taps/s] [minutes]   # Act II balance simulator (no Réforme yet)
node --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <preset>   # Prints the localStorage line that loads an Act II test save (finActeI, debut, atelier, boucle, demat, fin)
```

par :

```bash
node scripts/simulate-acte2.ts [taps/s] [minutes] [réformeÀ % | balayage] [découverte min]   # Act II simulator, Réforme and Act I replay included (robots: scripts/robots.ts)
node --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <preset>   # Prints the localStorage line that loads a test save (finActeI, debut, atelier, boucle, demat, fin, reforme, cerfa2)
```

Section « Data layer files », sous la ligne de `data/acte2/vueAtelier.ts`, ajouter :

```markdown
| `data/jurisprudence.ts` | What survives a Réforme: initial `reformes`, Jurisprudence effects, déjà-vu, drawn service names (imported by both engines) |
| `data/reforme.ts` | The Réforme: trombones, `reformer`, Cerfa number, its letter, Jurisprudence purchase, Options view |
```

Section « GameStateContext », ajouter en fin de liste :

```markdown
- **Réforme:** `reformer` (Options → Formulaire R-01) resets to the Cerfa screen (`cerfaNumero`), `acheterJurisprudence` spends trombones (final, no undo); `reforme` is the Options view (trombones and Jurisprudence appear only after the first Réforme). Components live in `components/reforme/`.
```

- [ ] **Step 2: Vérification d'ensemble**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, `ℹ pass 137`, `ℹ fail 0`.

Run: `node scripts/simulate-acte1.ts 2 180`
Expected: `fin de l’acte` à 65,0 min.

Run: `node scripts/simulate-acte2.ts 2 300 balayage`
Expected: les lignes de la Tâche 6, Step 5.

Run: `npm run build:web`
Expected: export web sans erreur dans `dist/`.

Navigateur, 375 × 812, un seul onglet de jeu, partie accélérée par les préréglages :
1. `reforme` → Options → Formulaire R-01 → TAMPONNER LA RÉFORME → Cerfa n° 00001*02 (prénom repris) → signer → guichet 3 de l'acte I : Budget 0,00 €, Formulaires 60 ; en-tête « Tampons apposés 160 k » inchangé ; aucune fiche de poste ; lettre de la Réforme au courrier.
2. Options : « Trombones 15 », Jurisprudence ; acheter Antériorité (5) et Mémoire des services (8).
3. Acte II d'une partie réformée : sur `http://localhost:8085/manifest.webmanifest`, lire la sauvegarde de l'étape 2, y mettre `acteTermine = true` et `derniereMaj = Date.now()`, la réécrire, revenir sur `/` : fenêtre de fin d'acte I, « PRENDRE MES FONCTIONS » → écran Direction, bulle « Parapheur n° 048 · » suivi du nouveau nom de la Carte d'identité ; Notes : « Prise de fonctions » porte la mention « Dossier déjà instruit, procédure simplifiée. » ; l'approuver, puis Service : 10 guichets, le prochain à 30 € ; Options : « Affectation » au nouveau nom du service, « Trombones 2 ». La restauration des procédures par Mémoire des services à l'ouverture de l'Atelier est couverte par son test (Tâche 4).
4. Revenir au preset `desktop`.

- [ ] **Step 3: Commiter**

```bash
git add CLAUDE.md
git commit -m "docs: Réforme, simulateur et préréglages dans CLAUDE.md

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-review (couverture de la spec)

| Exigence | Où |
|---|---|
| Déblocage : note « Réforme de l’action publique » après le premier dossier en boucle | Plan 1 (note n° 10) ; Tâche 3 (`peutReformer`), Tâche 5 (`possible`), Tâche 8 (section visible) |
| Déclenchement libre depuis Options, confirmation par un formulaire | Tâche 8 (Formulaire R-01, maquette 10) |
| Gain `⌊√(Conformité cumulée / k)⌋`, acte I compris, moins la Conformité déjà convertie | Tâche 3 (`conformitePartie`, `trombonesReforme`, `conformiteConvertie`) ; Tâche 2 (poids de l'acte II, question 1) |
| Effet : retour au début de l'acte I, tout à zéro ; survivent trombones, Jurisprudence, Tampons (et grade), prénom, premier Cerfa | Tâche 3 (`reformer`, test « la Réforme ramène… ») |
| Cerfa redemandé (*02, *03…), premier Cerfa stocké inchangé | Tâches 3 (`numeroCerfa`, `premierCerfa`), 9 (`CerfaEcran`) |
| Satire : noms au hasard de la Direction et des procédures, rien d'autre ne change ; lettre « Réforme : nouvelle dénomination » | Tâches 1 (`tirerDenomination`), 3 (lettre), 5 (vues, courrier), 8 et 9 (Options, fin d'acte, règlement) |
| Le mur ; Réforme rentable à 50 – 70 % au simulateur | Tâches 2 (sclérose, jurisprudence constante) et 6 (balayage) ; questions 1 et 3 |
| Jurisprudence : six bonus, achetés en trombones dans Options ; deux bonus à la première Réforme | Tâches 1 (`JURISPRUDENCE`), 4 (effets, achat), 6 (6 trombones au minimum), 8 (liste) |
| Droit acquis, Précédent, Vide juridique, Antériorité, Mémoire des services, Ancienneté reconnue | Tâche 4 (un test par bonus) |
| Déjà-vu : délai ÷ 4, « Dossier déjà instruit, procédure simplifiée », fiche de poste non reproposée ; acte I rejoué en 20 – 30 min | Tâches 4 (÷ 4, et coût ÷ 6 : question 2), 9 (mention), 3 (`fichePosteVue`), 6 (18 à 22 min robot) |
| US8, critères 1 à 4 | Tâches 3, 8, 9 ; vérification d'ensemble (Tâche 10) |
| Rythme cible (Réforme débloquée 40 – 55, première Réforme replay compris 60 – 90, fin 105 – 135) et mesures du robot | Tâche 6 (avec 15 min de découverte : 42,2 / 63,9 / 132,7) ; spec mise à jour |
| Technique : sauvegarde `reformes` (nombre, trombones, Jurisprudence, Conformité convertie), premier Cerfa ; anciennes sauvegardes chargées | Tâche 1 (`Reformes`, `normaliserSauvegarde`, test) |
| Points des revues des plans 1 et 2 : Réforme à 27 min, notes 12 – 15, Chef de bureau, `demandeRate`, usager compté deux fois, 1 + taux de rejet dossiers par usager | Questions 4 à 8 ; Tâches 2 et 6 |
| Interface : pas d'annulation d'achat, pas de ligne d'explication, 44 pt, libellés, pas d'information par la seule couleur | Tâches 8 et 9 (« ACQUISE » en plus du vert, bouton gris désactivé, croix 44 × 44) |

Vérifications faites sur ce plan : aucune étape sans code ; les noms viennent du code livré (`entrerActe2`, `etatInitialActe2`, `getModifiers2`, `franchir`, `tick2`, `tamponner2`, `acheterGuichet`, `coutGuichet`, `acheterRamettes2`, `requisitionUrgence2`, `notesAffichees2`, `vueDirection`, `vueService2`, `vueAtelier`, `nouvellesLettres`, `LETTRES_ACTE2`, `normaliserSauvegarde`, `estSauvegardeValide`, `sauvegardeActe2`, `PROC_NOMS`, `BALANCE2`, `useFermetureEchap`, `Panneau`, `BoutonPoussoir`) ; types cohérents d'une tâche à l'autre (`Reformes`, `Denomination`, `JurisprudenceId`, `JurisprudenceDef`, `JurisprudenceAffichee`, `VueReforme`, `VueDirection.nomService`, `NoteVue2.dejaInstruite`, `NoteAffichee.dejaInstruite`). Le code de toutes les tâches a été appliqué à une copie du worktree : `tsc`, `npm run lint` et `npm test` (137 tests) passent ; les simulateurs donnent les nombres de la Tâche 6 ; le parcours Réforme → Cerfa n° 00001*02 → guichet 3 → Jurisprudence a été joué dans le navigateur à 375 × 812 avec les préréglages `reforme` et `cerfa2`.
