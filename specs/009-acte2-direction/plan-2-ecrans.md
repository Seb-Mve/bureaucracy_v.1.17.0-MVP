# Acte II — Écrans et branchement — Implementation Plan (2/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre l'acte II jouable dans l'app : écran Direction (bulle du parapheur, scène du bureau du chef, Taux de rejet, Exemplaires exigés, TAMPONNER), onglets Service, Notes et Atelier, dossier administratif et fin d'acte, branchés dans `GameStateContext` qui aiguille chaque action sur l'acte en cours ; transition de la fin de l'acte I vers La Direction. Spec : `specs/009-acte2-direction/spec.md`.

**Architecture:** Le moteur du plan 1 (`data/acte2/`) reste la seule logique de jeu. Deux modules de vues purs, testés sous Node, traduisent l'état en ce que les écrans affichent : `data/acte2/vues.ts` (écran Direction, Service, notes) et `data/acte2/vueAtelier.ts` (Atelier). `GameStateContext` aiguille la boucle de jeu, l'absence et chaque action sur `s.acte` (jamais de code de l'acte I sur un état d'acte II), expose ces vues (`direction`, `service2`, `atelier`, `null` à l'acte I) et l'encre de l'acte (`encre`). Les composants de l'acte II vivent dans `components/direction/`, `components/atelier/` et `components/service/` ; ils n'importent jamais `data/`.

**Tech Stack:** TypeScript strict, React Native / Expo 53 (expo-router, reanimated, lucide-react-native), Node 25 (`node:test`), scène pixel `MoteurDirection` (b438490).

**Découpage de l'acte II en trois plans :**
1. Plan 1 — moteur et simulateur (fait).
2. **Ce plan** — écrans (Direction, Atelier, curseurs, recrutement, notes) et branchement dans `GameStateContext`, transition de fin d'acte I.
3. Plan 3 — Réforme, Jurisprudence, déjà-vu administratif, Cerfa redemandé, calage du mur.

## Questions ouvertes pour le porteur de projet

Chaque point est tranché dans ce plan par le défaut indiqué ; un autre choix ne touche que la tâche citée.

1. **Les fiches de la procédure sur l'écran Direction.** La spec (US1, US2) veut « la procédure de la demande en cours sous forme de fiches reliées par des trombones » dans le panneau ; les maquettes n'ont que la bulle, et l'écran ne défile pas. *Défaut :* la bulle porte, sous le parapheur, la chaîne des étapes en mini-fiches reliées par des trombones ; un visa en attente « s'allume » (fond d'encre **et** pictogramme tampon). Masquée en écran compact (< 720 pt), comme la deuxième ligne de la bulle de l'acte I (Tâche 6).
2. **La Conformité à l'acte II.** Le glossaire la dit « visible dès le début de l'acte » ; la section Interface et les maquettes listent Budget, Formulaires, Visas, puis « Démat. ». *Défaut :* pas de colonne Conformité à l'acte II (Tâche 6). Elle reste comptée par le moteur pour la Réforme (plan 3).
3. **« Rupture d'imprimés ».** La spec veut que le bouton l'affiche sans formulaires ; sur main, rien ne s'affiche d'avance et le libellé n'apparaît qu'en tamponnant dans le vide (1,5 s). *Défaut :* mécanique de main, avec le libellé « RUPTURE D’IMPRIMÉS » à l'acte II (Tâche 6).
4. **Bandeau « DOSSIER SANS USAGER » sur la scène (maquette 9).** Interdit (aucun bandeau sur la scène pixel). *Défaut :* retiré ; la bulle dit « Dossier sans usager » sous le numéro du parapheur (Tâche 6).
5. **Feuille « Ajouter une étape » (maquettes 4 et 5).** Elle cite la note n° 7 en indice et montre grisées « Carte d’identité · c’est cette procédure », « Attestation d’hébergement · fermée » ; le sélecteur montre un onglet « Fermée ». *Défaut :* ni indice (astuce interdite), ni procédure grisée, ni onglet fermé : la spec (US3, critère 2) ne propose que les autres procédures ouvertes (Tâche 8).
6. **« Ces procédures s’exigent mutuellement. »** La spec en fait le libellé d'accessibilité du trombone fermé ; la maquette 6 l'écrit aussi sur une carte neutre. *Défaut :* les deux, comme la maquette (ce n'est pas une ligne d'aide sous un contrôle, c'est un constat) ; le mot « boucle » n'apparaît nulle part (Tâche 8).
7. **Où s'affiche le Tableau de bord (note n° 16) ?** La spec ne le dit pas. *Défaut :* dans le dossier administratif (Options) : « Abandons de démarche » et « Taux de satisfaction : 100 % (sur les usagers restants) », valeur fixe comme dans le Rapport annuel (Tâche 9).
8. **Fin de l'acte I.** Sur main, la fenêtre de fin d'acte se ferme sur « RETOURNER AU GUICHET » et le guichet 3 reste ouvert ; la spec veut que l'achat de la note fasse commencer l'acte II. *Défaut :* fermer la fenêtre, de quelque façon que ce soit, c'est « PRENDRE MES FONCTIONS » ; une sauvegarde déjà à l'acte I terminé revoit la fenêtre au prochain lancement (Tâche 10).
9. **Tamponner dès la première seconde (US1, critère 3).** Le moteur livré entre dans l'acte II sans aucun visa en attente (les 20 dossiers attendent la Pièce justificative ; le premier visa arrive au bout de 2 s environ). *Défaut :* `BALANCE2.visasInitiaux = 12` parapheurs déjà au Visa, la valeur de la maquette 1 ; le simulateur bouge de 0,3 min (Tâche 1).
10. **Règlement intérieur de l'acte II.** Non prévu par la spec ; celui de main décrit le guichet 3. *Défaut :* un règlement propre à la Direction, un article par mécanique débloquée, qui ne nomme jamais la boucle et porte la phrase de la spec « Le rejet n’use que la patience des usagers. » (Tâche 9).
11. **Note n° 10 « Réforme de l’action publique ».** Elle s'achète déjà mais l'onglet Options n'aura sa Réforme qu'au plan 3. *Défaut :* la note reste ; ne pas publier sur main entre le plan 2 et le plan 3.
12. **Lettre « Prise de fonctions ».** « L’acte commence par la lettre » : sur main, le courrier ne s'ouvre jamais tout seul. *Défaut :* pastille sur l'enveloppe, comme toute lettre.
13. **Bord bas du bouton bleu.** La spec dit `#4A89DC`, la maquette met un flanc `#3A6FB5` plus sombre que l'ombre, comme l'orange de main. *Défaut :* `#3A6FB5` (Tâche 5).

## Global Constraints

- **Base :** branche `feat/acte2-direction-scene` (origin/main + scène de l'acte II + moteur du plan 1, tests verts). Ne jamais faire `git add -A` ni `git add .` : chaque commit liste ses fichiers.
- **Couches strictes :** `components/` et `app/` n'importent jamais `data/` ; tout passe par `useGameState()`, qui réexporte les types utiles. `context/` est le seul à appeler `data/acte2/`.
- **Aiguillage par acte :** la boucle de jeu, le rattrapage d'absence et chaque action de `GameStateContext` testent `s.acte` ; à l'acte II on n'appelle que `data/acte2/moteur.ts` (`tick2`, `tamponner2`, `simulerAbsence2`…). Les champs de l'acte I conservés par `entrerActe2` (`agents`, `notes`, `file`, `tauxRejet`, `acteTermine`…) ne s'affichent jamais à l'acte II : collègues à zéro (US1).
- **Ce que l'interface n'ajoute pas** (retiré exprès par le porteur de projet) : annulation d'achat ; lignes d'explication sous les contrôles (coût du rejet, « Il manque X € », astuces) ; boutons « ? » ; définitions de compteurs ; ordre du jour ; circulaires ; raccourcis clavier autres que la barre d'espace ; tout bandeau posé sur la scène pixel.
- **Charte de main :** couleurs de `constants/Colors.ts` uniquement (jamais d'hexadécimal dans un composant), tailles par `Typo`, `Interligne`, `Espace`, `Charte` ; `StyleSheet.create` (une couleur d'encre calculée peut s'ajouter en tableau, comme sur main) ; `Panneau`, `BoutonPoussoir`, `JaugeHachuree` ; `Pressable` seulement ; composants ≤ ~300 lignes. Quand une maquette contredit main, main l'emporte.
- **Accessibilité :** cibles tactiles ≥ 44 × 44 pt (les flèches de 34 × 30 de la maquette passent à 44 × 44) ; libellé d'accessibilité sur chaque bouton, fiche et curseur ; aucune information portée par la seule couleur (effets = symbole + mot ; choix retenu = coche ou bord épais en plus de la couleur ; boucle = trombone fermé + libellé).
- Textes en jeu en français, apostrophes typographiques `’`, nombres au format français (`utils/formatters`).
- Hors périmètre (plan 3) : Réforme, Jurisprudence, déjà-vu administratif, Cerfa redemandé, calage du mur. Aucun emplacement d'interface n'est réservé pour eux.
- Pas de `any`. Prettier : guillemets simples, indentation de 2 espaces.
- Commits au format Conventional Commits (`feat(ui): …`, `feat(state): …`, `feat(logic): …`, `test: …`, `docs: …`), terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Vérifier dans le navigateur (tâches d'interface)

1. **Serveur :** depuis la racine du dépôt, `npx expo start --web --port 8085` (ou la configuration `bureaucracy-main-actuel` de `.claude/launch.json`, à la racine de `BUREAUCRACY++`, qui pointe sur ce worktree). Ouvrir `http://localhost:8085` dans le Browser pane (`preview_start` avec l'URL). Si Metro ne voit pas une modification : relancer avec `--clear` (dossier iCloud, voir CLAUDE.md).
2. **Largeur de téléphone :** `resize_window` preset `mobile` (375 × 812) ; écran compact : `resize_window` 375 × 667. Revenir au preset `desktop` à la fin.
3. **Charger une sauvegarde de vérification** (à partir de la Tâche 4) : `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <préréglage>` imprime une ligne `localStorage.setItem(…)`. Naviguer sur `http://localhost:8085/manifest.webmanifest` (fichier statique : le jeu n'y tourne pas, il ne peut donc pas réécrire la sauvegarde), exécuter la ligne avec `javascript_tool`, puis naviguer sur `http://localhost:8085/`. Préréglages : `finActeI` (fin de l'acte I, fenêtre de fin d'acte), `debut` (entrée dans l'acte II), `atelier`, `boucle` (Carte d'identité ⇄ Justificatif de domicile), `demat` (38 % de dématérialisation, rejet 80 %, ×2), `fin` (100 %, note « Promotion » à approuver).
4. **Lire l'état :** `javascript_tool` → `JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')).acte2` (écrit au plus une seconde après chaque changement).

## File Structure

| Fichier | Rôle | Statut |
|---|---|---|
| `constants/balanceActe2.ts` | `visasInitiaux` | Modifier |
| `data/acte2/moteur.ts` | Visas à l'entrée, `marquerNotesVues2`, `marquerFinActeVue2` | Modifier |
| `data/acte2/courrier2.ts` | `lettreAbsence2` (lettre d'absence de l'acte II) | Modifier |
| `data/acte2/vues.ts` | Vues : écran Direction, Service, notes ; `estNote2`, `ACHAT_MAX` | Créer |
| `data/acte2/vueAtelier.ts` | Vue de l'Atelier : effets des étapes, boucles, catalogue | Créer |
| `scripts/presets-acte2.ts` | Sauvegardes de vérification (préréglages) | Créer |
| `scripts/save-acte2.ts` | Imprime la ligne qui charge un préréglage dans le navigateur | Créer |
| `scripts/tests/acte2.test.ts` | Visas initiaux, notes vues, fin d'acte vue, lettre d'absence | Modifier |
| `scripts/tests/vues-acte2.test.ts` | Tests des vues et des préréglages | Créer |
| `scripts/tests/atelier-acte2.test.ts` | Tests de la vue de l'Atelier | Créer |
| `constants/Colors.ts` | Encre bleue, `Encre`, `Encres` | Modifier |
| `context/GameStateContext.tsx` | Aiguillage par acte, vues, actions de l'acte II, `entrerDirection` | Modifier |
| `components/Hud.tsx` | Colonnes Visas et Démat. à l'acte II | Modifier |
| `components/BoutonTamponner.tsx` | Libellés de l'acte II, encre de l'acte | Modifier |
| `components/CurseurRejet.tsx` | Taux de rejet de l'acte en cours, encre | Modifier |
| `components/scene/pixel/useMoteurDirection.ts` | Branche `MoteurDirection` sur le jeu | Créer |
| `components/scene/ScenePixelDirection.tsx` / `.web.tsx` | Rendu Skia / canvas de la scène de l'acte II | Créer |
| `components/direction/SceneDirection.tsx` | Cadre et secousse de la scène | Créer |
| `components/direction/BulleDirection.tsx` | Parapheur à viser et chaîne de fiches | Créer |
| `components/direction/CurseurExemplaires.tsx` | Curseur ×1 ×2 ×3 | Créer |
| `components/direction/EcranDirection.tsx` | Écran Direction | Créer |
| `app/(tabs)/index.tsx` | Écran Direction à l'acte II | Modifier |
| `components/service/BoutonAchat.tsx` | Bouton vert d'achat (extrait de l'onglet Service) | Créer |
| `components/service/CarteUnite.tsx` | Carte d'achat ×1 ×10 Max (collègue, guichet, agent) | Créer |
| `components/service/CarteRamettes.tsx` | Carte des ramettes (Réquisition comprise) | Créer |
| `components/direction/ServiceDirection.tsx` | Onglet Service de l'acte II | Créer |
| `app/(tabs)/recruitment.tsx` | Utilise les cartes extraites ; Service de l'acte II | Modifier |
| `app/(tabs)/notes.tsx` | Encre de l'acte | Modifier |
| `app/(tabs)/_layout.tsx` | Onglets Direction et Atelier, pastilles, encre, fin d'acte II | Modifier |
| `components/atelier/Elements.tsx` | Pictogramme d'étape, effets, trombones | Créer |
| `components/atelier/SelecteurProcedure.tsx` | Une procédure par onglet | Créer |
| `components/atelier/FicheEtape.tsx` | Fiche d'étape : effets, pièce exigée, monter / descendre / retirer | Créer |
| `components/atelier/FeuilleEtape.tsx` | Feuille « Ajouter une étape » / « Pièce exigée » | Créer |
| `components/atelier/EcranAtelier.tsx` | Écran de l'Atelier | Créer |
| `app/(tabs)/atelier.tsx` | Route de l'onglet Atelier | Créer |
| `components/direction/reglementDirection.ts` | Articles du règlement intérieur de l'acte II | Créer |
| `components/ReglementInterieur.tsx` | Règlement de l'acte en cours | Modifier |
| `components/direction/FinActe2Modal.tsx` | Écran de fin de l'acte II | Créer |
| `app/(tabs)/options.tsx` | Dossier administratif et démission de l'acte II | Modifier |
| `components/FinActeModal.tsx` | Transition vers La Direction | Modifier |
| `CLAUDE.md` | Acte II jouable, aiguillage, préréglages | Modifier |

Toutes les commandes se lancent depuis la racine du dépôt (le worktree `bureaucracy_v.1.17.0-MVP/.claude/worktrees/…`). Avant de commencer : `npm test` doit passer (92 tests).

---

### Task 1: Moteur — visas dès l'entrée, notes vues, fin d'acte vue, lettre d'absence

**Files:**
- Modify: `constants/balanceActe2.ts` (`BALANCE2`)
- Modify: `data/acte2/moteur.ts` (`etatInitialActe2`, nouvelles fonctions)
- Modify: `data/acte2/courrier2.ts` (nouvelle fonction)
- Modify: `scripts/tests/acte2.test.ts`

**Interfaces:**
- Consumes: `notesVisibles2(s)`, `visasEnAttente(x)`, `tamponner2(s, t)` (`data/acte2/moteur.ts`) ; `formatEntier`, `formatMontant` (`utils/formatters.ts`) ; `Lettre` (`types/game.ts`).
- Produces: `BALANCE2.visasInitiaux` ; `marquerNotesVues2(s: GameState): GameState` ; `marquerFinActeVue2(s: GameState): GameState` (même objet quand rien ne change) ; `lettreAbsence2(secondes, franchies, budget, maintenant): Lettre`.

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/acte2.test.ts`, sous la ligne `import { nouvellesLettres } from '../../data/courrier';`, ajouter :

```ts
import { lettreAbsence2 } from '../../data/acte2/courrier2';
```

Remplacer, dans le test « entrée dans l’acte II : seul le compteur de tampons est conservé » :

```ts
  assert.deepEqual(x(s).usagers.identite, [BALANCE2.fileInitiale, 0]);
```

par :

```ts
  assert.deepEqual(x(s).usagers.identite, [BALANCE2.fileInitiale, BALANCE2.visasInitiaux]);
```

Remplacer, dans le test « les guichets franchissent les pièces, jamais les visas » :

```ts
  proche(x(s).usagers.identite[1], 0.5 * (1 - BALANCE2.abandonParPoint));
```

par :

```ts
  proche(x(s).usagers.identite[1], BALANCE2.visasInitiaux + 0.5 * (1 - BALANCE2.abandonParPoint));
```

Ajouter en fin de fichier :

```ts
test('entrée dans l’acte II : des visas attendent dès la première seconde', () => {
  const s = base2();
  assert.equal(D.visasEnAttente(x(s)), BALANCE2.visasInitiaux);
  assert.equal(D.tamponner2(s, 0).ev.visas, 1);
});

test('notes vues de l’acte II : la pastille « NOUVEAU » s’éteint, une seule fois', () => {
  const vue = D.marquerNotesVues2(base2());
  assert.deepEqual(x(vue).notesVues, ['prise']);
  assert.equal(D.marquerNotesVues2(vue), vue);
});

test('fin de l’acte II vue : marquée dans l’état de l’acte II, pas dans celui de l’acte I', () => {
  const s = { ...base2(), finActeVue: false };
  const v = D.marquerFinActeVue2(s);
  assert.equal(x(v).finActeVue, true);
  assert.equal(v.finActeVue, false);
  assert.equal(D.marquerFinActeVue2(v), v);
});

test('lettre d’absence de l’acte II : étapes franchies et dotation de la Direction', () => {
  const l = lettreAbsence2(3720, 1500, 2400, 99);
  assert.equal(l.id, 'absence-99');
  assert.equal(l.objet, 'Pendant votre absence');
  assert.match(l.corps, /\(1 h 2 min\)/);
  assert.match(l.corps, /la Direction a franchi 1\s500 étapes/);
  assert.match(l.corps, /2\s400\s€/);
  assert.equal(l.lue, false);
});
```

- [ ] **Step 2: Vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL — `BALANCE2.visasInitiaux` n'existe pas (type), `marquerNotesVues2`, `marquerFinActeVue2` et `lettreAbsence2` ne sont pas des fonctions.

- [ ] **Step 3: Ajouter les visas initiaux**

Dans `constants/balanceActe2.ts`, sous `fileInitiale: 20,`, ajouter :

```ts
  /** Parapheurs qui attendent déjà le visa du chef de service : il tamponne dès la première seconde. */
  visasInitiaux: 12,
```

Dans `data/acte2/moteur.ts`, fonction `etatInitialActe2`, sous `usagers.identite[0] = BALANCE2.fileInitiale;`, ajouter (l'étape n° 2 de la Carte d'identité est le Visa, voir `PROCEDURES_INITIALES`) :

```ts
  usagers.identite[1] = BALANCE2.visasInitiaux;
```

- [ ] **Step 4: Notes vues et fin d'acte vue de l'acte II**

Dans `data/acte2/moteur.ts`, juste avant `export const usagersEnCours`, ajouter :

```ts
/** Les notes visibles de l'acte II sont marquées vues (pastille « NOUVEAU »). Même objet si rien ne change. */
export function marquerNotesVues2(s: GameState): GameState {
  const x = s.acte2;
  if (!x) return s;
  const visibles = notesVisibles2(s);
  if (visibles.every((id) => x.notesVues.includes(id))) return s;
  return { ...s, acte2: { ...x, notesVues: visibles } };
}

/** L'écran de fin de l'acte II a été affiché (champ de l'acte II, distinct de celui de l'acte I). */
export function marquerFinActeVue2(s: GameState): GameState {
  const x = s.acte2;
  if (!x || x.finActeVue) return s;
  return { ...s, acte2: { ...x, finActeVue: true } };
}
```

- [ ] **Step 5: Lettre d'absence de l'acte II**

Dans `data/acte2/courrier2.ts`, remplacer :

```ts
import type { GameState } from '../../types/game';
```

par :

```ts
import type { GameState, Lettre } from '../../types/game';
```

et :

```ts
import { formatEntier } from '../../utils/formatters';
```

par :

```ts
import { formatEntier, formatMontant } from '../../utils/formatters';
```

Puis ajouter en fin de fichier :

```ts
/** Durée d'une absence, en heures et minutes. */
function dureeAbsence(secondes: number): string {
  return secondes >= 3600
    ? `${Math.floor(secondes / 3600)} h ${Math.floor((secondes % 3600) / 60)} min`
    : `${Math.max(1, Math.floor(secondes / 60))} min`;
}

/** Lettre de résumé après une absence à l'acte II (Guichets et agents seuls, sans rejet). */
export function lettreAbsence2(
  secondes: number,
  franchies: number,
  budget: number,
  maintenant: number,
): Lettre {
  return {
    id: `absence-${maintenant}`,
    objet: 'Pendant votre absence',
    corps: `Pendant votre absence (${dureeAbsence(secondes)}), la Direction a franchi ${formatEntier(franchies)} étapes et perçu ${formatMontant(budget)} de dotation.\n\nAucun dossier n’a été rejeté : la rigueur ne se délègue pas.\n\nVos procédures ont suivi leur cours.`,
    recue: maintenant,
    lue: false,
  };
}
```

- [ ] **Step 6: Vérifier**

Run: `npm test`
Expected: PASS (`ℹ pass 96`, `ℹ fail 0`).

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune erreur.

Run: `node scripts/simulate-acte2.ts 2 240`
Expected: « fin de l’acte II » vers 125 min (125,4 mesuré ; 125,7 avant la tâche) : les visas initiaux ne déplacent aucun jalon de plus d'une minute.

- [ ] **Step 7: Commiter**

```bash
git add constants/balanceActe2.ts data/acte2/moteur.ts data/acte2/courrier2.ts scripts/tests/acte2.test.ts
git commit -m "feat(logic): visas dès l'entrée, notes vues et lettre d'absence de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Vues de l'écran Direction, du Service et des notes

**Files:**
- Create: `data/acte2/vues.ts`
- Create: `scripts/tests/vues-acte2.test.ts`

**Interfaces:**
- Consumes: `getModifiers2`, `notesVisibles2`, `usagersEnCours`, `visasEnAttente`, `dematerialisation`, `vitesseGuichets`, `vitesseVisas`, `coutGuichet`, `coutAgent2`, `acheterNote2`, `tamponner2`, `marquerNotesVues2`, `entrerActe2` (`data/acte2/moteur.ts`) ; `NOTES2_PAR_ID` (`data/acte2/notes2.ts`) ; `AGENTS2`, `PROC_NOMS`, `BALANCE2` (`constants/balanceActe2.ts`).
- Produces: `ACHAT_MAX`, `PREMIER_PARAPHEUR`, `acte2(s)`, `estNote2(id)`, `vueDirection(s, t): VueDirection | null`, `vueService2(s, t): VueService2 | null`, `notesAffichees2(s, t): NoteVue2[]` et les types `ParapheurAffiche`, `EtapeChaine`, `VueDirection`, `UniteAffichee<Id>`, `VueService2`, `StatutNote2`, `NoteVue2`. Toutes les vues valent `null` (ou `[]`) hors de l'acte II.

- [ ] **Step 1: Écrire les tests (ils échouent)**

`scripts/tests/vues-acte2.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as V from '../../data/acte2/vues';
import { BALANCE2 } from '../../constants/balanceActe2';
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

const vue = (s: GameState): V.VueDirection => V.vueDirection(s, 0) as V.VueDirection;

test('vues de l’acte II : rien à l’acte I', () => {
  const s = E.signerCerfa(E.etatInitial(0), 'Test', 0);
  assert.equal(V.vueDirection(s, 0), null);
  assert.equal(V.vueService2(s, 0), null);
  assert.deepEqual(V.notesAffichees2(s, 0), []);
});

test('écran Direction à l’entrée : visas du guichet 3, Carte d’identité, pas de dématérialisation', () => {
  const d = vue(base2());
  assert.equal(d.visas, BALANCE2.visasInitiaux);
  assert.equal(d.usagers, BALANCE2.fileInitiale + BALANCE2.visasInitiaux);
  assert.equal(d.guichets, 1);
  assert.equal(d.demat, null);
  assert.equal(d.rupture, false);
  assert.deepEqual(d.parapheur, {
    numero: V.PREMIER_PARAPHEUR,
    proc: 'identite',
    procNom: 'Carte d’identité',
    sansUsager: false,
  });
  assert.deepEqual(
    d.etapes.map((e) => [e.nom, e.allumee]),
    [
      ['Pièce', false],
      ['Visa', true],
    ],
  );
  assert.equal(d.etapes[1].attente, BALANCE2.visasInitiaux);
  assert.equal(d.appel, V.PREMIER_PARAPHEUR - 1);
  assert.equal(d.tableau, null);
});

test('un coup de tampon passe au parapheur suivant', () => {
  const s = D.tamponner2(base2(), 0).s;
  assert.equal(vue(s).parapheur?.numero, V.PREMIER_PARAPHEUR + 1);
  assert.equal(vue(s).visas, BALANCE2.visasInitiaux - 1);
});

test('parapheur sans usager quand les dossiers en boucle dominent le visa', () => {
  const b = base2();
  const s = avec2(b, {
    usagers: { ...x(b).usagers, identite: [0, 2] },
    boucles: { ...x(b).boucles, identite: [0, 10] },
  });
  assert.equal(vue(s).parapheur?.sansUsager, true);
  assert.equal(vue(s).visas, 12);
});

test('sans visa en attente : aucun parapheur ; sans usager : panneau d’appel éteint', () => {
  const b = base2();
  const sansVisa = avec2(b, { usagers: { ...x(b).usagers, identite: [5, 0] } });
  assert.equal(vue(sansVisa).parapheur, null);
  assert.deepEqual(
    vue(sansVisa).etapes.map((e) => e.allumee),
    [false, false],
  );
  const vide = avec2(b, { usagers: { ...x(b).usagers, identite: [0, 0] } });
  assert.equal(vue(vide).appel, null);
});

test('rupture d’imprimés : moins de formulaires que d’exemplaires exigés', () => {
  const b = { ...base2(), formulaires: 1 };
  assert.equal(vue(b).rupture, false);
  assert.equal(vue(avec2(b, { exemplaires: 2 })).rupture, true);
});

test('Démat. et tableau de bord : affichés après leur note', () => {
  const b0 = base2();
  const b = avec2(b0, {
    demaPoints: BALANCE2.demaCible / 4,
    stats: { ...x(b0).stats, abandonsDemarche: 42.7 },
  });
  assert.equal(vue(b).demat, null);
  const n = avecNotes(b, ['demat', 'tableau']);
  assert.equal(vue(n).demat, 25);
  assert.deepEqual(vue(n).tableau, { abandonsDemarche: 42 });
});

test('taux de rejet affiché : plafonné tant que « Rejet élargi » n’est pas en vigueur', () => {
  const b = avec2(base2(), { tauxRejet: 0.8 });
  assert.equal(vue(b).rejetMax, 0.5);
  assert.equal(vue(b).tauxRejet, 0.5);
  assert.equal(vue(avecNotes(b, ['rejetElargi'])).tauxRejet, 0.8);
});

test('Service : le guichet et les agents débloqués, achats en lot', () => {
  const s = { ...avecNotes(base2(), ['prise', 'agents']), budget: 99 };
  const sv = V.vueService2(s, 0) as V.VueService2;
  assert.equal(sv.guichet.possedes, 1);
  assert.equal(sv.guichet.cout, D.coutGuichet(1));
  // 30 + 35 = 65 ; un troisième (40) dépasserait 99.
  assert.equal(sv.guichet.maxAchetables, 2);
  assert.equal(sv.guichet.coutMax, D.coutGuichet(1) + D.coutGuichet(2));
  let dix = 0;
  for (let i = 0; i < 10; i++) dix += D.coutGuichet(1 + i);
  assert.equal(sv.guichet.cout10, dix);
  assert.deepEqual(
    sv.agents.map((a) => a.id),
    ['instructeur'],
  );
  assert.equal(sv.agents[0].achetable, false);
  assert.equal(sv.etapesParSeconde, BALANCE2.guichet.vitesse);
  assert.equal(sv.visasParSeconde, 0);
});

test('notes de l’acte II : statut, instruction et pastille', () => {
  const s0 = avec2({ ...base2(), budget: 150 }, { guichets: 5 });
  assert.deepEqual(
    V.notesAffichees2(s0, 0).map((n) => [n.id, n.statut, n.nouvelle]),
    [
      ['prise', 'disponible', true],
      ['agents', 'tropCher', true],
    ],
  );
  const s = D.acheterNote2({ ...s0, budget: 1000 }, 'agents', 0);
  const agents = V.notesAffichees2(s, 10_000).find((n) => n.id === 'agents');
  assert.equal(agents?.statut, 'instruction');
  assert.equal(agents?.resteSec, 20);
  assert.ok(V.notesAffichees2(D.marquerNotesVues2(s), 0).every((n) => !n.nouvelle));
});

test('identifiants de notes : ceux de l’acte II sont reconnus', () => {
  assert.equal(V.estNote2('pieceService'), true);
  assert.equal(V.estNote2('reaffectation'), false);
});
```

- [ ] **Step 2: Vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL — `Cannot find module '…/data/acte2/vues'`.

- [ ] **Step 3: Écrire les vues**

`data/acte2/vues.ts` :

```ts
/**
 * Vues de l'acte II : ce que les écrans de La Direction affichent (écran Direction, Service, notes),
 * calculé à partir de l'état. Fonctions pures : GameStateContext les appelle (les composants n'importent
 * jamais data/). L'Atelier a sa propre vue : data/acte2/vueAtelier.ts.
 */
import type { GameState, NoteId } from '../../types/game';
import type { Agent2Id, EtapeType, EtatActe2, Exemplaires, Note2Id, ProcId } from '../../types/acte2';
import { AGENTS2, PROC_NOMS } from '../../constants/balanceActe2';
import {
  coutAgent2,
  coutGuichet,
  dematerialisation,
  getModifiers2,
  notesVisibles2,
  usagersEnCours,
  visasEnAttente,
  vitesseGuichets,
  vitesseVisas,
} from './moteur';
import { NOTES2_PAR_ID } from './notes2';

/** Plafond d'un achat « Max » (collègues, guichets, agents), par sécurité. */
export const ACHAT_MAX = 500;
/** Numéro du premier parapheur présenté au chef de service (le panneau d'appel affiche le précédent). */
export const PREMIER_PARAPHEUR = 48;

const DESCRIPTION_GUICHET = 'Le guichet 3 et ses semblables. Joignent les pièces, sans lire.';
/** Noms courts des étapes, pour la chaîne de fiches de la bulle. */
const NOMS_COURTS: Record<EtapeType, string> = {
  piece: 'Pièce',
  visa: 'Visa',
  signature: 'Signature',
  pieceService: 'Pièce de service',
  reflexion: 'Réflexion',
  commission: 'Commission',
};

/** État de l'acte II, seulement quand la partie est à l'acte II. */
export const acte2 = (s: GameState): EtatActe2 | null => (s.acte === 2 ? s.acte2 : null);

/** Vrai pour un identifiant de note de l'acte II. */
export function estNote2(id: NoteId | Note2Id): id is Note2Id {
  return id in NOTES2_PAR_ID;
}

// ---------------------------------------------------------------------------------------------
// Écran Direction
// ---------------------------------------------------------------------------------------------

export interface ParapheurAffiche {
  numero: number;
  proc: ProcId;
  procNom: string;
  /** La plupart des dossiers de ce visa n'ont plus d'usager. */
  sansUsager: boolean;
}

/** Une fiche de la chaîne affichée dans la bulle ; un visa en attente « s'allume ». */
export interface EtapeChaine {
  type: EtapeType;
  nom: string;
  /** Dossiers qui attendent ce visa (0 hors visa). */
  attente: number;
  allumee: boolean;
}

export interface VueDirection {
  visas: number;
  usagers: number;
  guichets: number;
  /** Taux de dématérialisation (%), null tant que sa note n'est pas en vigueur. */
  demat: number | null;
  /** Moins de formulaires que d'exemplaires exigés : plus aucune étape ne passe. */
  rupture: boolean;
  tauxRejet: number;
  rejetMax: number;
  exemplaires: Exemplaires;
  exemplairesVisible: boolean;
  parapheur: ParapheurAffiche | null;
  /** Étapes de la procédure du parapheur (Carte d'identité s'il n'y en a pas). */
  etapes: EtapeChaine[];
  /** Numéro du panneau d'appel de la salle (null : salle vide, panneau éteint). */
  appel: number | null;
  recrutementVisible: boolean;
  atelierVisible: boolean;
  visasAccordes: number;
  abandons: number;
  /** Tableau de bord (note n° 16), null avant. */
  tableau: { abandonsDemarche: number } | null;
  acteTermine: boolean;
  finActeVue: boolean;
}

/** Dossiers d'usagers et dossiers en boucle qui attendent un visa dans la procédure `p`. */
function visasDe(x: EtatActe2, p: ProcId): { u: number; b: number } {
  let u = 0;
  let b = 0;
  x.procedures[p].forEach((e, k) => {
    if (e.type !== 'visa') return;
    u += x.usagers[p][k];
    b += x.boucles[p][k];
  });
  return { u, b };
}

/** Écran Direction : ressources, parapheur à viser, scène et curseurs. Null hors de l'acte II. */
export function vueDirection(s: GameState, maintenant: number): VueDirection | null {
  const x = acte2(s);
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  const numero = PREMIER_PARAPHEUR + Math.floor(x.stats.visasTampons);
  // Le parapheur en tête vient de la procédure qui a le plus de visas en attente.
  let tete: { p: ProcId; u: number; b: number } | null = null;
  for (const p of m.procsOuvertes) {
    const v = visasDe(x, p);
    if (v.u + v.b >= 1 && (!tete || v.u + v.b > tete.u + tete.b)) tete = { p, ...v };
  }
  const p: ProcId = tete?.p ?? 'identite';
  const usagers = Math.floor(usagersEnCours(x));
  return {
    visas: Math.floor(visasEnAttente(x)),
    usagers,
    guichets: x.guichets,
    demat: m.dematVisible ? dematerialisation(x) : null,
    rupture: s.formulaires < x.exemplaires,
    tauxRejet: Math.min(x.tauxRejet, m.rejetMax),
    rejetMax: m.rejetMax,
    exemplaires: x.exemplaires,
    exemplairesVisible: m.exemplairesVisible,
    parapheur: tete
      ? { numero, proc: tete.p, procNom: PROC_NOMS[tete.p], sansUsager: tete.b > tete.u }
      : null,
    etapes: x.procedures[p].map((e, k) => {
      const attente = e.type === 'visa' ? Math.floor(x.usagers[p][k] + x.boucles[p][k]) : 0;
      return { type: e.type, nom: NOMS_COURTS[e.type], attente, allumee: attente >= 1 };
    }),
    appel: usagers >= 1 ? numero - 1 : null,
    recrutementVisible: m.recrutementVisible,
    atelierVisible: m.atelierVisible,
    visasAccordes: Math.floor(x.stats.visasTampons),
    abandons: Math.floor(x.abandons),
    tableau: m.tableauVisible ? { abandonsDemarche: Math.floor(x.stats.abandonsDemarche) } : null,
    acteTermine: x.acteTermine,
    finActeVue: x.finActeVue,
  };
}

// ---------------------------------------------------------------------------------------------
// Onglet Service
// ---------------------------------------------------------------------------------------------

export interface UniteAffichee<Id extends string = string> {
  id: Id;
  nom: string;
  description: string;
  possedes: number;
  cout: number;
  /** Coût de dix achats d'affilée (le prix monte à chaque achat). */
  cout10: number;
  /** Achats possibles d'affilée avec le budget actuel. */
  maxAchetables: number;
  coutMax: number;
  achetable: boolean;
}

export interface VueService2 {
  guichet: UniteAffichee<'guichet'>;
  agents: UniteAffichee<Agent2Id>[];
  etapesParSeconde: number;
  visasParSeconde: number;
}

/** Prix d'un achat, de dix achats et du plus grand lot que le budget permet. */
function lot(prix: (possedes: number) => number, possedes: number, budget: number) {
  const cout = prix(possedes);
  let cout10 = 0;
  for (let i = 0; i < 10; i++) cout10 += prix(possedes + i);
  let maxAchetables = 0;
  let coutMax = 0;
  for (let reste = budget; maxAchetables < ACHAT_MAX; maxAchetables++) {
    const p = prix(possedes + maxAchetables);
    if (reste < p) break;
    reste -= p;
    coutMax += p;
  }
  return { cout, cout10, maxAchetables, coutMax, achetable: budget >= cout };
}

/** Onglet Service de l'acte II : guichets et agents débloqués. Null hors de l'acte II. */
export function vueService2(s: GameState, maintenant: number): VueService2 | null {
  const x = acte2(s);
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  return {
    guichet: {
      id: 'guichet',
      nom: 'Guichet',
      description: DESCRIPTION_GUICHET,
      possedes: x.guichets,
      ...lot(coutGuichet, x.guichets, s.budget),
    },
    agents: AGENTS2.filter((a) => m.agentsDisponibles.includes(a.id)).map((a) => ({
      id: a.id,
      nom: a.nom,
      description: a.description,
      possedes: x.agents[a.id],
      ...lot((n) => coutAgent2(a.id, n), x.agents[a.id], s.budget),
    })),
    etapesParSeconde: vitesseGuichets(x),
    visasParSeconde: vitesseVisas(x),
  };
}

// ---------------------------------------------------------------------------------------------
// Notes de service
// ---------------------------------------------------------------------------------------------

export type StatutNote2 = 'disponible' | 'tropCher' | 'instruction' | 'effective';

export interface NoteVue2 {
  id: Note2Id;
  numero: number;
  titre: string;
  texte: string;
  effet: string;
  cout: number;
  instruction: number;
  statut: StatutNote2;
  /** Secondes restantes d'instruction. */
  resteSec: number;
  nouvelle: boolean;
}

/** Notes de l'acte II visibles, avec leur statut (même carte qu'à l'acte I). */
export function notesAffichees2(s: GameState, maintenant: number): NoteVue2[] {
  const x = acte2(s);
  if (!x) return [];
  return notesVisibles2(s).map((id) => {
    const def = NOTES2_PAR_ID[id];
    const st = x.notes[id];
    let statut: StatutNote2 = s.budget >= def.cout ? 'disponible' : 'tropCher';
    let resteSec = 0;
    if (st) {
      resteSec = Math.max(0, Math.ceil((st.effective - maintenant) / 1000));
      statut = resteSec > 0 ? 'instruction' : 'effective';
    }
    return {
      id,
      numero: def.numero,
      titre: def.titre,
      texte: def.texte,
      effet: def.effet,
      cout: def.cout,
      instruction: def.instruction,
      statut,
      resteSec,
      nouvelle: !x.notesVues.includes(id),
    };
  });
}
```

- [ ] **Step 4: Vérifier**

Run: `npm test`
Expected: PASS (`ℹ pass 107`).

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune erreur.

- [ ] **Step 5: Commiter**

```bash
git add data/acte2/vues.ts scripts/tests/vues-acte2.test.ts
git commit -m "feat(logic): vues de l'écran Direction, du Service et des notes de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Vue de l'Atelier des procédures

**Files:**
- Create: `data/acte2/vueAtelier.ts`
- Create: `scripts/tests/atelier-acte2.test.ts`

**Interfaces:**
- Consumes: `getModifiers2`, `stocksPour` (`data/acte2/moteur.ts`) ; `mene`, `estBoucle` (`data/acte2/procedures.ts`) ; `acte2` (`data/acte2/vues.ts`) ; `ETAPES`, `PROC_NOMS`, `BALANCE2` ; `PROCS`, `Etape`, `EtapeType`, `ProcId` (`types/acte2.ts`).
- Produces: `effetsEtape(type): EffetAffiche[]`, `boucleDe(procedures, ouvertes, p): ProcId[]`, `vueAtelier(s, t): VueAtelier | null` et les types `SensEffet`, `EffetAffiche`, `EtapeAtelier`, `ProcAtelier`, `ChoixEtape`, `VueAtelier`.

- [ ] **Step 1: Écrire les tests (ils échouent)**

`scripts/tests/atelier-acte2.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as A from '../../data/acte2/vueAtelier';
import { BALANCE2 } from '../../constants/balanceActe2';
import type { GameState } from '../../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId } from '../../types/acte2';

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

const P = (type: Etape['type'], exige?: ProcId): Etape => (exige ? { type, exige } : { type });

/** Remplace des procédures (stocks remis à zéro, à la bonne longueur). */
function avecProcedures(s: GameState, procedures: Partial<Record<ProcId, Etape[]>>): GameState {
  const p = { ...x(s).procedures, ...procedures };
  return avec2(s, { procedures: p, usagers: D.stocksPour(p), boucles: D.stocksPour(p) });
}

test('effets d’une fiche : un symbole et un mot', () => {
  assert.deepEqual(
    A.effetsEtape('visa').map((e) => e.texte),
    ['++ conformité', '+ €', '++ délai', '− patience'],
  );
  assert.deepEqual(A.effetsEtape('reflexion'), [
    { texte: '+ conformité', sens: 'plus' },
    { texte: '0 €', sens: 'neutre' },
    { texte: '+++ délai', sens: 'neutre' },
    { texte: '−− patience', sens: 'moins' },
  ]);
  assert.deepEqual(
    A.effetsEtape('commission').map((e) => e.texte),
    ['+++ conformité', '++ €', '+++ délai', '−− patience'],
  );
});

test('Atelier fermé, ou acte I : pas de vue', () => {
  assert.equal(A.vueAtelier(base2(), 0), null);
  assert.equal(A.vueAtelier(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0), null);
});

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
  assert.equal(a.etapesMax, BALANCE2.etapesMax);
  const id = a.procedures[0];
  assert.deepEqual(
    id.etapes.map((e) => e.nom),
    ['Pièce justificative', 'Visa'],
  );
  assert.deepEqual(id.exigeables, [{ id: 'domicile', nom: 'Justificatif de domicile' }]);
  assert.deepEqual(id.boucle, []);
  assert.equal(id.pleine, false);
});

test('Atelier : une simple dépendance ne relie rien', () => {
  const s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), {
    identite: [P('piece'), P('pieceService', 'domicile'), P('visa')],
  });
  const id = (A.vueAtelier(s, 0) as A.VueAtelier).procedures[0];
  assert.equal(id.etapes[1].exigeNom, 'Justificatif de domicile');
  assert.equal(id.etapes[1].boucle, false);
  assert.deepEqual(id.boucle, []);
});

test('Atelier : deux procédures qui s’exigent mutuellement sont reliées', () => {
  const s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), {
    identite: [P('piece'), P('pieceService', 'domicile'), P('visa')],
    domicile: [P('piece'), P('pieceService', 'identite')],
  });
  const a = A.vueAtelier(s, 0) as A.VueAtelier;
  assert.deepEqual(a.procedures[0].boucle, ['identite', 'domicile']);
  assert.deepEqual(a.procedures[1].boucleNoms, ['Carte d’identité', 'Justificatif de domicile']);
  assert.equal(a.procedures[0].etapes[1].boucle, true);
  assert.equal(a.procedures[1].etapes[1].boucle, true);
  assert.ok(a.catalogue.some((c) => c.type === 'pieceService'));
});

test('Atelier : une boucle à trois relie ses trois procédures, pas celle qui s’y raccroche', () => {
  const s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService', 'troisieme', 'quatrieme']), {
    identite: [P('pieceService', 'domicile')],
    domicile: [P('pieceService', 'hebergement')],
    hebergement: [P('pieceService', 'identite')],
    vie: [P('pieceService', 'identite')],
  });
  const ouvertes: ProcId[] = ['identite', 'domicile', 'hebergement', 'vie'];
  assert.deepEqual(A.boucleDe(x(s).procedures, ouvertes, 'domicile'), ['identite', 'domicile', 'hebergement']);
  assert.deepEqual(A.boucleDe(x(s).procedures, ouvertes, 'vie'), []);
});

test('Atelier : une procédure de huit étapes est pleine', () => {
  const huit = Array.from({ length: BALANCE2.etapesMax }, () => P('piece'));
  const s = avecProcedures(avecNotes(base2(), ['atelier']), { identite: huit });
  assert.equal((A.vueAtelier(s, 0) as A.VueAtelier).procedures[0].pleine, true);
});
```

- [ ] **Step 2: Vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL — `Cannot find module '…/data/acte2/vueAtelier'`.

- [ ] **Step 3: Écrire la vue de l'Atelier**

`data/acte2/vueAtelier.ts` :

```ts
/**
 * Vue de l'Atelier des procédures (acte II) : fiches d'étapes avec leurs effets (symbole + mot, jamais la
 * couleur seule), procédures ouvertes, pièces exigées et procédures qui s'exigent mutuellement.
 * Rien ici ne nomme la boucle : l'Atelier la montre par un trombone fermé.
 */
import type { GameState } from '../../types/game';
import { PROCS, type Etape, type EtapeType, type ProcId } from '../../types/acte2';
import { BALANCE2, ETAPES, PROC_NOMS } from '../../constants/balanceActe2';
import { getModifiers2 } from './moteur';
import { estBoucle, mene } from './procedures';
import { acte2 } from './vues';

/** Ordre du catalogue de l'Atelier. */
const ORDRE_ETAPES: EtapeType[] = ['piece', 'visa', 'signature', 'pieceService', 'reflexion', 'commission'];

export type SensEffet = 'plus' | 'moins' | 'neutre';

export interface EffetAffiche {
  /** Symbole et mot : « ++ conformité », « + € », « +++ délai », « − patience ». */
  texte: string;
  sens: SensEffet;
}

/** Crans d'un délai : + jusqu'à 3 s, ++ jusqu'à 5 s, +++ au-delà. */
const cransDelai = (s: number): number => (s <= 3 ? 1 : s <= 5 ? 2 : 3);

/** Effets d'une étape sur la Conformité, la dotation, le délai et la patience. */
export function effetsEtape(type: EtapeType): EffetAffiche[] {
  const e = ETAPES[type];
  return [
    { texte: `${'+'.repeat(e.conf)} conformité`, sens: 'plus' },
    e.dotation > 0 ? { texte: `${'+'.repeat(e.dotation)} €`, sens: 'plus' } : { texte: '0 €', sens: 'neutre' },
    { texte: `${'+'.repeat(cransDelai(e.delai))} délai`, sens: 'neutre' },
    { texte: `${'−'.repeat(e.patience)} patience`, sens: 'moins' },
  ];
}

export interface EtapeAtelier {
  type: EtapeType;
  nom: string;
  effets: EffetAffiche[];
  /** Procédure exigée (« Pièce délivrée par nos services »), sinon null. */
  exige: ProcId | null;
  exigeNom: string | null;
  /** Cette pièce ramène à sa propre procédure : la fiche porte le trombone fermé. */
  boucle: boolean;
}

export interface ProcAtelier {
  id: ProcId;
  nom: string;
  etapes: EtapeAtelier[];
  /** Plus de place pour une étape (BALANCE2.etapesMax). */
  pleine: boolean;
  /** Procédures qu'une pièce de service de cette procédure peut exiger : les autres procédures ouvertes. */
  exigeables: { id: ProcId; nom: string }[];
  /** Procédures prises avec celle-ci dans une boucle (vide sinon). */
  boucle: ProcId[];
  boucleNoms: string[];
}

export interface ChoixEtape {
  type: EtapeType;
  nom: string;
  description: string;
  effets: EffetAffiche[];
}

export interface VueAtelier {
  procedures: ProcAtelier[];
  catalogue: ChoixEtape[];
  etapesMax: number;
}

/** Procédures prises dans la même boucle que `p` (vide si `p` n'est dans aucune). */
export function boucleDe(procedures: Record<ProcId, Etape[]>, ouvertes: ProcId[], p: ProcId): ProcId[] {
  if (!mene(procedures, ouvertes, p, p)) return [];
  return ouvertes.filter(
    (q) => q === p || (mene(procedures, ouvertes, p, q) && mene(procedures, ouvertes, q, p)),
  );
}

/** Atelier : procédures ouvertes et catalogue des étapes débloquées. Null tant que l'Atelier est fermé. */
export function vueAtelier(s: GameState, maintenant: number): VueAtelier | null {
  const x = acte2(s);
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  if (!m.atelierVisible) return null;
  const ouvertes = PROCS.filter((p) => m.procsOuvertes.includes(p));
  return {
    etapesMax: BALANCE2.etapesMax,
    catalogue: ORDRE_ETAPES.filter((t) => m.etapesDisponibles.includes(t)).map((t) => ({
      type: t,
      nom: ETAPES[t].nom,
      description: ETAPES[t].description,
      effets: effetsEtape(t),
    })),
    procedures: ouvertes.map((p) => {
      const boucle = boucleDe(x.procedures, ouvertes, p);
      return {
        id: p,
        nom: PROC_NOMS[p],
        pleine: x.procedures[p].length >= BALANCE2.etapesMax,
        exigeables: ouvertes.filter((q) => q !== p).map((q) => ({ id: q, nom: PROC_NOMS[q] })),
        boucle,
        boucleNoms: boucle.map((q) => PROC_NOMS[q]),
        etapes: x.procedures[p].map((e) => {
          const exige = e.type === 'pieceService' && e.exige !== undefined ? e.exige : null;
          return {
            type: e.type,
            nom: ETAPES[e.type].nom,
            effets: effetsEtape(e.type),
            exige,
            exigeNom: exige ? PROC_NOMS[exige] : null,
            boucle: exige !== null && ouvertes.includes(exige) && estBoucle(x.procedures, ouvertes, p, exige),
          };
        }),
      };
    }),
  };
}
```

- [ ] **Step 4: Vérifier**

Run: `npm test`
Expected: PASS (`ℹ pass 114`).

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune erreur.

- [ ] **Step 5: Commiter**

```bash
git add data/acte2/vueAtelier.ts scripts/tests/atelier-acte2.test.ts
git commit -m "feat(logic): vue de l'Atelier des procédures

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Sauvegardes de vérification

Les tâches d'interface se vérifient dans le navigateur à chaque moment de l'acte (entrée, Atelier, boucle, dématérialisation, fin) sans rejouer deux heures. Les préréglages sont des sauvegardes valides, construites avec le moteur.

**Files:**
- Create: `scripts/presets-acte2.ts`
- Create: `scripts/save-acte2.ts`
- Modify: `scripts/tests/vues-acte2.test.ts`

**Interfaces:**
- Consumes: `etatInitial`, `signerCerfa` (`data/engine.ts`) ; `entrerActe2`, `stocksPour` (`data/acte2/moteur.ts`) ; `nouvellesLettres` (`data/courrier.ts`) ; `CLE_SAUVEGARDE`, `estSauvegardeValide` (`data/save.ts`) ; `vueDirection` (`data/acte2/vues.ts`), `vueAtelier` (`data/acte2/vueAtelier.ts`).
- Produces: `type Preset`, `PRESETS`, `sauvegardeActe2(preset, maintenant): GameState` ; la commande `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <préréglage>`.

- [ ] **Step 1: Écrire le test (il échoue)**

Dans `scripts/tests/vues-acte2.test.ts`, sous `import * as V from '../../data/acte2/vues';`, ajouter :

```ts
import { procsEnBoucle } from '../../data/acte2/procedures';
import { estSauvegardeValide } from '../../data/save';
import { PRESETS, sauvegardeActe2 } from '../presets-acte2';
import { vueAtelier } from '../../data/acte2/vueAtelier';
```

Ajouter en fin de fichier :

```ts
test('préréglages de vérification : sauvegardes valides, à l’acte voulu', () => {
  const t = 1_000_000_000;
  for (const p of PRESETS) {
    const s = sauvegardeActe2(p, t);
    assert.equal(estSauvegardeValide(s), true, p);
    assert.equal(s.acte, p === 'finActeI' ? 1 : 2, p);
  }
  const boucle = sauvegardeActe2('boucle', t);
  assert.deepEqual(procsEnBoucle(x(boucle).procedures, ['identite', 'domicile']), ['identite', 'domicile']);
  assert.equal(V.vueDirection(sauvegardeActe2('fin', t), t)?.demat, 100);
  assert.notEqual(vueAtelier(sauvegardeActe2('atelier', t), t), null);
  assert.equal(sauvegardeActe2('finActeI', t).acteTermine, true);
});
```

Run: `npm test`
Expected: FAIL — `Cannot find module '…/scripts/presets-acte2'`.

- [ ] **Step 2: Écrire les préréglages**

`scripts/presets-acte2.ts` :

```ts
/**
 * Sauvegardes prêtes à charger dans le navigateur, pour vérifier les écrans de l'acte II
 * sans rejouer la partie. Utilisé par scripts/save-acte2.ts et par scripts/tests/vues-acte2.test.ts.
 */
import type { GameState } from '../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId, Stocks } from '../types/acte2';
import * as E from '../data/engine';
import * as D from '../data/acte2/moteur';
import { nouvellesLettres } from '../data/courrier';
import { BALANCE2 } from '../constants/balanceActe2';

export type Preset = 'finActeI' | 'debut' | 'atelier' | 'boucle' | 'demat' | 'fin';
export const PRESETS: Preset[] = ['finActeI', 'debut', 'atelier', 'boucle', 'demat', 'fin'];

const NOTES_ATELIER: Note2Id[] = ['prise', 'agents', 'atelier'];
const NOTES_BOUCLE: Note2Id[] = [...NOTES_ATELIER, 'signature', 'exemplaires', 'pieceService'];
const NOTES_DEMAT: Note2Id[] = [...NOTES_BOUCLE, 'reflexion', 'troisieme', 'demat', 'rejetElargi', 'tableau'];
const NOTES: Record<Exclude<Preset, 'finActeI'>, Note2Id[]> = {
  debut: [],
  atelier: NOTES_ATELIER,
  boucle: NOTES_BOUCLE,
  demat: NOTES_DEMAT,
  fin: NOTES_DEMAT,
};

/** Une boucle Carte d'identité ⇄ Justificatif de domicile. */
const PROCEDURES_BOUCLE: Partial<Record<ProcId, Etape[]>> = {
  identite: [{ type: 'piece' }, { type: 'pieceService', exige: 'domicile' }, { type: 'visa' }],
  domicile: [{ type: 'piece' }, { type: 'pieceService', exige: 'identite' }],
};

const remplir = (st: Stocks, valeurs: Partial<Stocks>): Stocks => ({ ...st, ...valeurs });

/** Fin de l'acte I : la note « Demande de réaffectation » vient d'être approuvée. */
function finActeI(t: number): GameState {
  const s0 = E.signerCerfa(E.etatInitial(t, () => 0.5), 'Camille', t);
  const s: GameState = {
    ...s0,
    tampons: 160_000,
    fichePosteVue: true,
    acteTermine: true,
    notes: { reaffectation: { achetee: t, effective: t } },
  };
  return { ...s, lettresEnvoyees: nouvellesLettres(s, t).map((l) => l.id) };
}

/** Sauvegarde du préréglage, horodatée à `maintenant` (pas de rattrapage d'absence au chargement). */
export function sauvegardeActe2(preset: Preset, maintenant: number): GameState {
  const fin = finActeI(maintenant);
  if (preset === 'finActeI') return fin;
  let s = D.entrerActe2({ ...fin, finActeVue: true }, maintenant);
  const avant = maintenant - 3_600_000;
  const ids = NOTES[preset];
  const notes = Object.fromEntries(ids.map((id) => [id, { achetee: avant, effective: avant }]));
  let x: EtatActe2 = { ...(s.acte2 as EtatActe2), notes, notesVues: [...ids] };
  if (preset === 'atelier') {
    x = { ...x, guichets: 5, agents: { ...x.agents, instructeur: 4 }, stats: { ...x.stats, franchies: 9_000 } };
    s = { ...s, budget: 6_400, formulaires: 2_300 };
  }
  if (preset === 'boucle' || preset === 'demat' || preset === 'fin') {
    const procedures = { ...x.procedures, ...PROCEDURES_BOUCLE };
    x = {
      ...x,
      procedures,
      usagers: remplir(D.stocksPour(procedures), { identite: [20, 5, 8], domicile: [6, 2] }),
      boucles: remplir(D.stocksPour(procedures), { identite: [10, 4, 20], domicile: [12, 6] }),
      guichets: 8,
      agents: { ...x.agents, instructeur: 10 },
      premiereBoucle: avant,
      premiereModif: 'identite',
      stats: { ...x.stats, franchies: 40_000, franchiesBoucle: 6_000, abandonsDemarche: 350 },
    };
    s = { ...s, budget: 19_000, formulaires: 5_400 };
  }
  if (preset === 'demat' || preset === 'fin') {
    x = {
      ...x,
      demaPoints: BALANCE2.demaCible * (preset === 'fin' ? 1 : 0.38),
      tauxRejet: 0.8,
      exemplaires: 2,
      agents: { ...x.agents, chefBureau: 6 },
    };
    s = { ...s, budget: 412_000, formulaires: 38_000 };
  }
  s = { ...s, acte2: x };
  // Courrier déjà mérité : réputé envoyé, sauf à l'entrée (Prise de fonctions) et à la fin (Rapport annuel).
  if (preset === 'debut' || preset === 'fin') return s;
  return { ...s, lettresEnvoyees: [...s.lettresEnvoyees, ...nouvellesLettres(s, maintenant).map((l) => l.id)] };
}
```

- [ ] **Step 3: Écrire la commande**

`scripts/save-acte2.ts` :

```ts
/**
 * Imprime la ligne JavaScript qui charge une sauvegarde de vérification de l'acte II dans le navigateur.
 * Usage : node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <préréglage>
 * Préréglages : finActeI, debut, atelier, boucle, demat, fin (voir scripts/presets-acte2.ts).
 */
import { CLE_SAUVEGARDE } from '../data/save';
import { PRESETS, sauvegardeActe2 } from './presets-acte2';

const demande = process.argv[2] ?? 'debut';
const preset = PRESETS.find((p) => p === demande);
if (!preset) {
  console.error(`Préréglage inconnu : ${demande}. Préréglages : ${PRESETS.join(', ')}.`);
  process.exit(1);
}
const s = sauvegardeActe2(preset, Date.now());
console.log(`localStorage.setItem(${JSON.stringify(CLE_SAUVEGARDE)}, ${JSON.stringify(JSON.stringify(s))});`);
```

- [ ] **Step 4: Vérifier**

Run: `npm test`
Expected: PASS (`ℹ pass 115`).

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts boucle`
Expected: une seule ligne `localStorage.setItem("bureaucracy_acte1_v1", "{\"version\":1,\"acte\":2,…");`.

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts inconnu; echo $?`
Expected: `Préréglage inconnu : inconnu. Préréglages : finActeI, debut, atelier, boucle, demat, fin.` puis `1`.

- [ ] **Step 5: Commiter**

```bash
git add scripts/presets-acte2.ts scripts/save-acte2.ts scripts/tests/vues-acte2.test.ts
git commit -m "test: sauvegardes de vérification de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Branchement dans GameStateContext

**Files:**
- Modify: `constants/Colors.ts`
- Modify: `context/GameStateContext.tsx`

**Interfaces:**
- Consumes: `tick2`, `tamponner2`, `simulerAbsence2`, `acheterGuichet`, `acheterAgent2`, `acheterRamettes2`, `requisitionUrgence2`, `reglerTauxRejet2`, `reglerExemplaires`, `modifierProcedure`, `acheterNote2`, `marquerNotesVues2`, `marquerFinActeVue2`, `entrerActe2` (`data/acte2/moteur.ts`) ; `lettreAbsence2` (`data/acte2/courrier2.ts`) ; `ACHAT_MAX`, `estNote2`, `vueDirection`, `vueService2`, `notesAffichees2` (`data/acte2/vues.ts`) ; `vueAtelier` (`data/acte2/vueAtelier.ts`).
- Produces, dans `useGameState()` : `rupture: boolean`, `rejet: { taux; max; visible }`, `encre: Encre`, `direction: VueDirection | null`, `service2: VueService2 | null`, `atelier: VueAtelier | null` ; `tamponner(): { rupture: boolean }` ; `acheterNote(id: NoteId | Note2Id)` ; `acheterGuichet(nb?)`, `acheterAgent2(id, nb?)`, `reglerExemplaires(n)`, `modifierProcedure(action)`, `entrerDirection()` ; `prixRamette`, `maxRamettes`, `notes`, `marquerNotesVues`, `marquerFinActeVue`, `reglerTauxRejet`, `acheterRamettes`, `demanderRequisition` aiguillés sur l'acte. Types réexportés : `ActionAtelier`, `Agent2Id`, `EtapeType`, `Exemplaires`, `ProcId`, `EtapeChaine`, `ParapheurAffiche`, `UniteAffichee`, `VueDirection`, `VueService2`, `ChoixEtape`, `EffetAffiche`, `EtapeAtelier`, `ProcAtelier`, `VueAtelier`, `Encre`. Dans `constants/Colors.ts` : `Colors.bleuFlanc`, `Colors.bleuFond`, `Colors.bleuTexte`, `interface Encre`, `Encres`.

- [ ] **Step 1: L'encre de chaque acte**

Dans `constants/Colors.ts`, remplacer :

```ts
  // Secondaire
  bleu: '#5D9CEC',
  bleuOmbre: '#4A89DC',
```

par :

```ts
  // Secondaire, et encre de l'acte II (bouton poussoir bleu)
  bleu: '#5D9CEC',
  bleuOmbre: '#4A89DC',
  /** Flanc du bouton poussoir bleu, plus sombre que l'ombre (même relief qu'à l'acte I). */
  bleuFlanc: '#3A6FB5',
  /** Fond bleu très clair (fiches de l'Atelier, choix retenu). */
  bleuFond: '#EAF2FE',
  /** Bleu lisible pour du texte (contraste AA sur fond clair). */
  bleuTexte: '#2F6DB8',
```

Sous `export default Colors;`, ajouter :

```ts

/** Encre de l'acte en cours : bouton TAMPONNER, jauges, onglet actif, cartes de l'Atelier. */
export interface Encre {
  face: string;
  flanc: string;
  claire: string;
  fond: string;
  texte: string;
}

/** Orange à l'acte I (le guichet), bleu à l'acte II (la Direction). */
export const Encres: Record<1 | 2, Encre> = {
  1: { face: Colors.encre, flanc: Colors.encreFlanc, claire: Colors.encreClaire, fond: Colors.encreFond, texte: Colors.encreTexte },
  2: { face: Colors.bleu, flanc: Colors.bleuFlanc, claire: Colors.pastelBleu, fond: Colors.bleuFond, texte: Colors.bleuTexte },
};
```

(`#2F6DB8` : contraste 4,8:1 sur la crème, 4,6:1 sur `bleuFond`.)

- [ ] **Step 2: Imports et types du contexte**

Dans `context/GameStateContext.tsx`, remplacer :

```ts
import type { AgentId, GameEvents, GameState, Lettre, Modifiers, NoteId } from '@/types/game';
```

par :

```ts
import type { AgentId, GameState, Lettre, Modifiers, NoteId } from '@/types/game';
import type { ActionAtelier, Agent2Id, Exemplaires, Note2Id } from '@/types/acte2';
```

Remplacer `import { NOTES_PAR_ID, type NoteDef } from '@/data/notes';` par `import { NOTES_PAR_ID } from '@/data/notes';`.

Sous `import { usePreferences } from '@/context/PreferencesContext';`, ajouter :

```ts
import * as D from '@/data/acte2/moteur';
import * as V from '@/data/acte2/vues';
import * as A from '@/data/acte2/vueAtelier';
import { lettreAbsence2 } from '@/data/acte2/courrier2';
import { Encres, type Encre } from '@/constants/Colors';
```

Sous `export type { UsagerAffiche };`, ajouter :

```ts
export type { ActionAtelier, Agent2Id, EtapeType, Exemplaires, ProcId } from '@/types/acte2';
export type { EtapeChaine, ParapheurAffiche, UniteAffichee, VueDirection, VueService2 } from '@/data/acte2/vues';
export type { ChoixEtape, EffetAffiche, EtapeAtelier, ProcAtelier, VueAtelier } from '@/data/acte2/vueAtelier';
export type { Encre };
```

Remplacer `const ACHAT_MAX = 500;` par `const ACHAT_MAX = V.ACHAT_MAX;`.

Remplacer :

```ts
export interface NoteAffichee extends Omit<NoteDef, 'visible' | 'appliquer'> {
  statut: StatutNote;
```

par :

```ts
/** Note de service affichée : même carte à l'acte I et à l'acte II. */
export interface NoteAffichee {
  id: NoteId | Note2Id;
  numero: number;
  titre: string;
  texte: string;
  effet: string;
  cout: number;
  /** Délai d'instruction (s). */
  instruction: number;
  statut: StatutNote;
```

- [ ] **Step 3: Le type du contexte**

Dans `interface GameContextType`, sous `demandeLimitante: boolean;`, ajouter :

```ts
  /** Formulaires insuffisants pour le prochain coup (pièces exigées à l'acte I, exemplaires à l'acte II). */
  rupture: boolean;
  /** Taux de rejet de l'acte en cours, son plafond, et s'il est réglable. */
  rejet: { taux: number; max: number; visible: boolean };
  /** Encre de l'acte en cours (orange à l'acte I, bleu à l'acte II). */
  encre: Encre;
  /** Écran Direction (acte II) ; null à l'acte I. */
  direction: V.VueDirection | null;
  /** Onglet Service de l'acte II ; null à l'acte I. */
  service2: V.VueService2 | null;
  /** Atelier des procédures ; null tant qu'il est fermé (et à l'acte I). */
  atelier: A.VueAtelier | null;
```

Remplacer `  tamponner: () => GameEvents;` par :

```ts
  /** Un coup de tampon : un dossier à l'acte I, un visa à l'acte II. */
  tamponner: () => { rupture: boolean };
```

Remplacer `  acheterNote: (id: NoteId) => void;` par :

```ts
  acheterNote: (id: NoteId | Note2Id) => void;
  /** Acte II : achète `nb` guichets d'affilée (autant que le budget le permet). */
  acheterGuichet: (nb?: number) => void;
  /** Acte II : recrute `nb` agents d'affilée (autant que le budget le permet). */
  acheterAgent2: (id: Agent2Id, nb?: number) => void;
  reglerExemplaires: (n: Exemplaires) => void;
  /** Acte II : modification d'une procédure dans l'Atelier (sans effet si elle est refusée). */
  modifierProcedure: (action: ActionAtelier) => void;
  /** Fin de l'acte I : prise de fonctions à la Direction. */
  entrerDirection: () => void;
```

- [ ] **Step 4: Absence et boucle de jeu aiguillées**

En tête de `function rattraperAbsence(s: GameState, maintenant: number): GameState {`, ajouter :

```ts
  if (s.acte === 2) {
    // Acte II : Guichets et agents seuls ; jamais le moteur de l'acte I.
    const r2 = D.simulerAbsence2(s, maintenant);
    if (r2.secondes < ABSENCE_LETTRE_S || r2.franchies < 1) return r2.s;
    return { ...r2.s, courrier: [lettreAbsence2(r2.secondes, r2.franchies, r2.budget, maintenant), ...r2.s.courrier] };
  }
```

Dans la boucle de jeu, remplacer :

```ts
      if (ecart > SEUIL_ABSENCE) {
        s1 = rattraperAbsence(s0, maintenant);
      } else {
```

par :

```ts
      if (ecart > SEUIL_ABSENCE) {
        s1 = rattraperAbsence(s0, maintenant);
      } else if (s0.acte === 2) {
        // Acte II : le moteur de la Direction, jamais celui du guichet.
        s1 = D.tick2(s0, Math.max(0, ecart) / 1000, maintenant).s;
      } else {
```

- [ ] **Step 5: Le coup de tampon**

Remplacer :

```ts
  const tamponner = useCallback((): GameEvents => {
```

par :

```ts
  const tamponner = useCallback((): { rupture: boolean } => {
    if (etatRef.current.acte === 2) {
      // Acte II : le coup vise un parapheur ; la scène et les compteurs réagissent au même verdict qu'à l'acte I.
      const r2 = D.tamponner2(etatRef.current, Date.now());
      if (r2.ev.visas > 0) {
        verdictId.current += 1;
        setVerdict({ id: verdictId.current, rejete: false, abandon: false, usager: null });
        vibrerSi('leger');
      }
      appliquer(r2.s);
      return { rupture: r2.ev.rupture };
    }
```

(La suite de la fonction, celle de l'acte I, ne change pas ; elle renvoie `r.ev`, qui a bien un champ `rupture`.)

- [ ] **Step 6: Achats, curseurs, Atelier et notes aiguillés**

Remplacer :

```ts
  const acheterRamettes = useCallback(
    (nb: number) => {
      const s = E.acheterRamettes(etatRef.current, nb, Date.now());
```

par :

```ts
  /** Répète un achat `nb` fois tant qu'il aboutit (plafonné à ACHAT_MAX). */
  const acheterEnLot = useCallback(
    (acheter: (s: GameState, maintenant: number) => GameState, nb: number) => {
      const maintenant = Date.now();
      let s = etatRef.current;
      for (let i = 0; i < Math.min(nb, ACHAT_MAX); i++) {
        const suivant = acheter(s, maintenant);
        if (suivant === s) break;
        s = suivant;
      }
      if (s !== etatRef.current) vibrerSi('moyen');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );

  const acheterGuichet = useCallback((nb = 1) => acheterEnLot(D.acheterGuichet, nb), [acheterEnLot]);

  const acheterAgent2 = useCallback(
    (id: Agent2Id, nb = 1) => acheterEnLot((s, t) => D.acheterAgent2(s, id, t), nb),
    [acheterEnLot],
  );

  const acheterRamettes = useCallback(
    (nb: number) => {
      const s0 = etatRef.current;
      const s = s0.acte === 2 ? D.acheterRamettes2(s0, nb) : E.acheterRamettes(s0, nb, Date.now());
```

Dans `demanderRequisition`, remplacer :

```ts
    const s = E.requisitionUrgence(etatRef.current, Date.now());
```

par :

```ts
    const s0 = etatRef.current;
    const s = s0.acte === 2 ? D.requisitionUrgence2(s0) : E.requisitionUrgence(s0, Date.now());
```

Remplacer :

```ts
  const reglerTauxRejet = useCallback(
    (taux: number) => appliquer(E.reglerTauxRejet(etatRef.current, taux, Date.now())),
    [appliquer],
  );

  const acheterNote = useCallback(
    (id: NoteId) => {
      const s = E.acheterNote(etatRef.current, id, Date.now());
```

par :

```ts
  const reglerTauxRejet = useCallback(
    (taux: number) => {
      const s0 = etatRef.current;
      const t = Date.now();
      appliquer(s0.acte === 2 ? D.reglerTauxRejet2(s0, taux, t) : E.reglerTauxRejet(s0, taux, t));
    },
    [appliquer],
  );

  const reglerExemplaires = useCallback(
    (n: Exemplaires) => appliquer(D.reglerExemplaires(etatRef.current, n, Date.now())),
    [appliquer],
  );

  const modifierProcedure = useCallback(
    (action: ActionAtelier) => {
      const s = D.modifierProcedure(etatRef.current, action, Date.now());
      if (s === etatRef.current) return;
      vibrerSi('leger');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );

  const acheterNote = useCallback(
    (id: NoteId | Note2Id) => {
      const s0 = etatRef.current;
      const t = Date.now();
      let s = s0;
      if (s0.acte === 2 && V.estNote2(id)) s = D.acheterNote2(s0, id, t);
      else if (s0.acte === 1 && !V.estNote2(id)) s = E.acheterNote(s0, id, t);
```

En tête de `marquerNotesVues`, sous `const s = etatRef.current;`, ajouter :

```ts
    if (s.acte === 2) {
      const s2 = D.marquerNotesVues2(s);
      if (s2 !== s) appliquer(s2);
      return;
    }
```

Remplacer :

```ts
  const marquerFinActeVue = useCallback(
    () => appliquer({ ...etatRef.current, finActeVue: true }),
    [appliquer],
  );
```

par :

```ts
  const marquerFinActeVue = useCallback(() => {
    const s = etatRef.current;
    appliquer(s.acte === 2 ? D.marquerFinActeVue2(s) : { ...s, finActeVue: true });
  }, [appliquer]);

  const entrerDirection = useCallback(() => {
    const s = etatRef.current;
    if (s.acte === 2 || !s.acteTermine) return;
    satureRef.current = false;
    setVerdict(null);
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    vibrerSi('succes');
    appliquer(D.entrerActe2({ ...s, finActeVue: true }, Date.now()));
  }, [appliquer, vibrerSi]);
```

- [ ] **Step 7: Valeurs dérivées**

Dans le `useMemo` de `notes`, remplacer la ligne :

```ts
      E.notesVisibles(etat).map((id) => {
```

par :

```ts
      etat.acte === 2 ? V.notesAffichees2(etat, maintenant) : E.notesVisibles(etat).map((id) => {
```

(Prettier peut reformater ce ternaire ; le reste du `map` ne change pas.)

Juste avant `const rang = E.rangGrade(etat.tampons);`, ajouter :

```ts
  const direction = useMemo(() => V.vueDirection(etat, maintenant), [etat, maintenant]);
  const service2 = useMemo(() => V.vueService2(etat, maintenant), [etat, maintenant]);
  const atelier = useMemo(() => A.vueAtelier(etat, maintenant), [etat, maintenant]);
  const rejet = useMemo(
    () =>
      direction
        ? { taux: direction.tauxRejet, max: direction.rejetMax, visible: true }
        : { taux: Math.min(etat.tauxRejet, mods.rejetMax), max: mods.rejetMax, visible: mods.rejetVisible },
    [direction, etat.tauxRejet, mods],
  );
  const prixRamette = etat.acte === 2 ? BALANCE.prixRamette : E.prixRamette(mods);
  const rupture = direction ? direction.rupture : etat.formulaires < mods.pieces;
```

Dans l'objet `valeur`, remplacer `      tete: teteDeFile(etat),` par `      tete: etat.acte === 1 ? teteDeFile(etat) : [],` et :

```ts
      prixRamette: E.prixRamette(mods),
      maxRamettes: Math.floor(etat.budget / E.prixRamette(mods)),
```

par :

```ts
      prixRamette,
      maxRamettes: Math.floor(etat.budget / prixRamette),
```

Sous `      demandeLimitante: sature,`, ajouter :

```ts
      rupture,
      rejet,
      encre: Encres[etat.acte],
      direction,
      service2,
      atelier,
```

Sous `      acheterNote,` (dans l'objet), ajouter :

```ts
      acheterGuichet,
      acheterAgent2,
      reglerExemplaires,
      modifierProcedure,
      entrerDirection,
```

Dans le tableau de dépendances du `useMemo` de `valeur`, remplacer la ligne `      nouvellePartie,` par :

```ts
      nouvellePartie, rupture, rejet, prixRamette, direction, service2, atelier, acheterGuichet, acheterAgent2,
      reglerExemplaires, modifierProcedure, entrerDirection,
```

- [ ] **Step 8: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p .`
Expected: aucune erreur (les composants existants compilent : `BoutonTamponner` lit `tamponner().rupture`, `NotesScreen` passe des `NoteAffichee['id']`).

Run: `npm run lint && npm test`
Expected: aucune erreur de lint, tests PASS (115).

Navigateur (voir « Vérifier dans le navigateur ») :
1. Sans sauvegarde (Options → Effacer la partie si besoin), signer le Cerfa : l'acte I se joue comme avant (TAMPONNER orange, file, Notes).
2. Charger `debut` : l'écran principal est encore celui du guichet (l'écran Direction arrive à la Tâche 6), mais l'enveloppe porte 1 lettre « Prise de fonctions », le compteur Tampons apposés monte seul (le guichet 3 franchit des pièces) et `JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')).acte2.stats.franchies` augmente. Aucune erreur dans la console (`read_console_messages`, `onlyErrors`).

- [ ] **Step 9: Commiter**

```bash
git add constants/Colors.ts context/GameStateContext.tsx
git commit -m "feat(state): GameStateContext aiguille la boucle et les actions sur l'acte en cours

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: L'écran Direction

**Files:**
- Create: `components/scene/pixel/useMoteurDirection.ts`
- Create: `components/scene/ScenePixelDirection.web.tsx`
- Create: `components/scene/ScenePixelDirection.tsx`
- Create: `components/direction/SceneDirection.tsx`
- Create: `components/direction/BulleDirection.tsx`
- Create: `components/direction/CurseurExemplaires.tsx`
- Create: `components/direction/EcranDirection.tsx`
- Modify: `components/Hud.tsx`
- Modify: `components/BoutonTamponner.tsx`
- Modify: `components/CurseurRejet.tsx`
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `useGameState()` → `direction`, `verdict`, `encre`, `rupture`, `rejet`, `reglerTauxRejet`, `reglerExemplaires`, `tamponner`, `enAttente` ; `MoteurDirection`, `EtatDirection` (`components/scene/pixel/direction.ts`) ; `TailleScene` (`useMoteurScene.ts`) ; `Toile` (`toile.ts`).
- Produces: `useMoteurDirection(dessiner, onImpact): { surLayout, taille }` ; composants par défaut `ScenePixelDirection`, `SceneDirection`, `BulleDirection({ compact })`, `CurseurExemplaires`, `EcranDirection`.

La scène de l'acte II reprend la boucle d'animation de `useMoteurScene` (30 images/s tant que l'écran est affiché) sans toucher aux fichiers de l'acte I : la scène du guichet ne change pas. Rien n'est posé sur la scène.

- [ ] **Step 1: Brancher la scène de l'acte II**

`components/scene/pixel/useMoteurDirection.ts` :

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useGameState } from '@/context/GameStateContext';
import { MoteurDirection, type EtatDirection } from './direction';
import type { Toile } from './toile';
import type { TailleScene } from './useMoteurScene';

/** Images dessinées par seconde (le moteur avance, lui, à chaque frame). */
const IMAGES_PAR_SECONDE = 30;

/**
 * Branche la scène de l'acte II (bureau du chef de service) sur l'état du jeu et fait tourner
 * sa boucle tant que l'écran Direction est affiché. `dessiner` reçoit chaque image.
 */
export function useMoteurDirection(dessiner: (t: Toile) => void, onImpact?: () => void) {
  const { direction, verdict } = useGameState();
  const impactRef = useRef(onImpact);
  impactRef.current = onImpact;
  const dessinerRef = useRef(dessiner);
  dessinerRef.current = dessiner;
  const moteurRef = useRef<MoteurDirection | null>(null);
  if (!moteurRef.current) moteurRef.current = new MoteurDirection(() => impactRef.current?.());
  const moteur = moteurRef.current;
  const [taille, setTaille] = useState<TailleScene>({ largeur: 0, hauteur: 0 });

  const usagers = direction?.usagers ?? 0;
  const visas = direction?.visas ?? 0;
  const guichets = direction?.guichets ?? 1;
  const appel = direction?.appel ?? null;
  const etatRef = useRef<EtatDirection>({ usagers, visas, guichets, appel });
  etatRef.current = { usagers, visas, guichets, appel };
  useEffect(() => {
    moteur.etat({ usagers, visas, guichets, appel });
  }, [moteur, usagers, visas, guichets, appel]);

  // Chaque coup de tampon qui accorde un visa fait viser un parapheur au chef, une seule fois.
  const dernierVerdict = useRef(verdict?.id ?? null);
  useEffect(() => {
    if (!verdict || verdict.id === dernierVerdict.current) return;
    dernierVerdict.current = verdict.id;
    moteur.tamponner();
  }, [moteur, verdict]);

  useFocusEffect(
    useCallback(() => {
      let raf = 0;
      let precedent = performance.now();
      let dernierDessin = 0;
      const boucle = (maintenant: number) => {
        moteur.avancer(Math.min(64, Math.max(0, maintenant - precedent)));
        precedent = maintenant;
        if (maintenant - dernierDessin >= 1000 / IMAGES_PAR_SECONDE - 2) {
          dernierDessin = maintenant;
          const toile = moteur.peindre();
          if (toile) dessinerRef.current(toile);
        }
        raf = requestAnimationFrame(boucle);
      };
      raf = requestAnimationFrame(boucle);
      return () => cancelAnimationFrame(raf);
    }, [moteur]),
  );

  const surLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      moteur.redim(width, height);
      moteur.etat(etatRef.current);
      setTaille({ largeur: width, hauteur: height });
    },
    [moteur],
  );

  return { surLayout, taille };
}
```

`components/scene/ScenePixelDirection.web.tsx` :

```tsx
import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMoteurDirection } from '@/components/scene/pixel/useMoteurDirection';
import type { Toile } from '@/components/scene/pixel/toile';

interface Props {
  onImpact?: () => void;
}

/** Style du canvas : agrandi sans lissage pour garder les pixels nets. */
const STYLE_CANVAS = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  imageRendering: 'pixelated',
  display: 'block',
} as const;

/** Scène de la Direction en pixel art (web : canvas 2D, sans Skia ni WebAssembly). */
export default function ScenePixelDirection({ onImpact }: Props) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const tampon = useRef<ImageData | null>(null);

  const dessiner = useCallback((t: Toile) => {
    const cv = canvas.current;
    if (!cv) return;
    if (cv.width !== t.w || cv.height !== t.h) {
      cv.width = t.w;
      cv.height = t.h;
      tampon.current = null;
    }
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    if (!tampon.current) tampon.current = ctx.createImageData(t.w, t.h);
    tampon.current.data.set(t.octets);
    ctx.putImageData(tampon.current, 0, 0);
  }, []);

  const { surLayout } = useMoteurDirection(dessiner, onImpact);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={surLayout}
      accessible
      accessibilityLabel="La Direction : le chef de service vise les parapheurs ; derrière la vitre, la salle d’attente"
    >
      {React.createElement('canvas', { ref: canvas, style: STYLE_CANVAS, 'aria-hidden': true })}
    </View>
  );
}
```

`components/scene/ScenePixelDirection.tsx` :

```tsx
import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { AlphaType, Canvas, ColorType, FilterMode, Image, MipmapMode, Skia, type SkImage } from '@shopify/react-native-skia';
import { useMoteurDirection } from '@/components/scene/pixel/useMoteurDirection';
import type { Toile } from '@/components/scene/pixel/toile';

interface Props {
  onImpact?: () => void;
}

/** Échantillonnage « au plus proche » : les pixels restent nets une fois agrandis. */
const NET = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };
/** Images gardées en vie le temps que le fil graphique ait fini de les afficher. */
const RESERVE = 3;

/** Scène de la Direction en pixel art (téléphone : rendu Skia). */
export default function ScenePixelDirection({ onImpact }: Props) {
  const image = useSharedValue<SkImage | null>(null);
  const anciennes = useRef<SkImage[]>([]);

  const dessiner = useCallback(
    (t: Toile) => {
      const img = Skia.Image.MakeImage(
        { width: t.w, height: t.h, alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888 },
        Skia.Data.fromBytes(t.octets),
        t.w * 4,
      );
      if (!img) return;
      image.value = img;
      anciennes.current.push(img);
      while (anciennes.current.length > RESERVE) anciennes.current.shift()?.dispose();
    },
    [image],
  );

  const { surLayout, taille } = useMoteurDirection(dessiner, onImpact);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={surLayout}
      accessible
      accessibilityLabel="La Direction : le chef de service vise les parapheurs ; derrière la vitre, la salle d’attente"
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Image image={image} x={0} y={0} width={taille.largeur} height={taille.hauteur} fit="fill" sampling={NET} />
      </Canvas>
    </View>
  );
}
```

`components/direction/SceneDirection.tsx` :

```tsx
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Colors, { Charte } from '@/constants/Colors';
import ScenePixelDirection from '@/components/scene/ScenePixelDirection';
import { usePreferences } from '@/context/PreferencesContext';

/**
 * La scène de la Direction, entière : le moteur cadre lui-même le bureau du chef et la salle derrière la vitre.
 * Rien n'est posé dessus.
 */
export default function SceneDirection() {
  const secousse = useSharedValue(0);
  const { reduireMouvement } = usePreferences();

  const surImpact = useCallback(() => {
    if (reduireMouvement) return;
    // Retour visuel de la charte : l'écran tremble de 2 px.
    secousse.value = withSequence(withTiming(2, { duration: 30 }), withTiming(-2, { duration: 40 }), withTiming(0, { duration: 40 }));
  }, [secousse, reduireMouvement]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: secousse.value }, { translateY: -secousse.value / 2 }] }));

  return (
    <Animated.View style={[styles.cadre, style]}>
      <ScenePixelDirection onImpact={surImpact} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: Colors.creme,
    borderTopWidth: Charte.trait,
    borderBottomWidth: Charte.trait,
    borderColor: Colors.anthracite,
  },
});
```

- [ ] **Step 2: La bulle du parapheur**

`components/direction/BulleDirection.tsx` :

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Paperclip, Stamp } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';

/** Numéro sur trois chiffres au moins, comme un registre (« 048 », puis « 9 412 »). */
const numeroParapheur = (n: number): string => (n < 1000 ? n.toString().padStart(3, '0') : n.toLocaleString('fr-FR'));

/**
 * Bulle de l'écran Direction, au-dessus de la scène : le parapheur que le prochain coup vise, et sa procédure
 * en fiches reliées par des trombones (les visas en attente s'allument : fond d'encre et tampon).
 */
export default function BulleDirection({ compact = false }: { compact?: boolean }) {
  const { direction, encre } = useGameState();
  if (!direction) return null;
  const { parapheur, etapes, usagers } = direction;

  let titre = 'Aucun parapheur à viser';
  let detail: string | null = null;
  if (usagers < 1) {
    titre = 'Salle d’attente vide';
    detail = 'Aucun usager · les procédures suivent leur cours';
  } else if (parapheur) {
    titre = `Parapheur n° ${numeroParapheur(parapheur.numero)} · ${parapheur.procNom}`;
    detail = parapheur.sansUsager ? 'Dossier sans usager' : 'Visa du chef de service';
  }
  const chaine = etapes
    .map((e) => (e.allumee ? `${e.nom}, ${formatEntier(e.attente)} en attente` : e.nom))
    .join(' ; ');

  return (
    <View style={[styles.zone, compact && styles.zoneCompacte]}>
      <View
        style={[styles.bulle, compact && styles.bulleCompacte]}
        accessible
        accessibilityLabel={`${titre}.${detail ? ` ${detail}.` : ''} Procédure : ${chaine}.`}
      >
        <Text style={styles.titre} numberOfLines={1}>
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
                <View style={[styles.fiche, e.allumee && { backgroundColor: encre.face }]}>
                  {e.allumee && <Stamp size={12} color={Colors.anthracite} />}
                  <Text style={[styles.ficheTexte, e.allumee && styles.ficheAllumee]} numberOfLines={1}>
                    {e.nom}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}
        {/* La pointe descend vers la corbeille du chef, au milieu de la scène. */}
        <View style={styles.pointe} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: Espace.l,
    paddingTop: Espace.s,
    paddingBottom: Espace.m,
    zIndex: 2,
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
    gap: 2,
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
  pointe: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    width: 14,
    height: 14,
    backgroundColor: Colors.papier,
    borderRightWidth: Charte.traitFin,
    borderBottomWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    transform: [{ rotate: '45deg' }],
  },
});
```

- [ ] **Step 3: Le curseur Exemplaires exigés**

`components/direction/CurseurExemplaires.tsx` :

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameState, type Exemplaires } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';

const VALEURS: Exemplaires[] = [1, 2, 3];

/** Curseur Exemplaires exigés (note n° 5 de l'acte II) : trois crans, ×1 à ×3. */
export default function CurseurExemplaires() {
  const { direction, reglerExemplaires, encre } = useGameState();
  if (!direction?.exemplairesVisible) return null;
  return (
    <View style={styles.ligne} accessibilityRole="radiogroup" accessibilityLabel="Exemplaires exigés">
      <Text style={styles.label}>Exemplaires</Text>
      <View style={styles.crans}>
        {VALEURS.map((n) => {
          const actif = direction.exemplaires === n;
          return (
            <Pressable
              key={n}
              onPress={() => reglerExemplaires(n)}
              accessibilityRole="radio"
              accessibilityState={{ checked: actif }}
              accessibilityLabel={n === 1 ? 'Un exemplaire' : `${n} exemplaires`}
              style={({ pressed }) => [
                styles.cran,
                actif && styles.cranActif,
                actif && { backgroundColor: encre.face, borderBottomColor: encre.flanc },
                pressed && styles.presse,
              ]}
            >
              <Text style={[styles.valeur, actif && styles.valeurActive]}>×{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
    marginHorizontal: Espace.m,
    marginTop: Espace.xs,
  },
  label: {
    width: 84,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
  crans: {
    flex: 1,
    flexDirection: 'row',
    gap: Espace.s,
  },
  cran: {
    flex: 1,
    height: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papierChaud,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Cran retenu : enfoncé (bord bas épais), pas seulement coloré. */
  cranActif: {
    borderBottomWidth: Charte.trait + 2,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  valeur: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.corps,
    color: Colors.crayon,
  },
  valeurActive: {
    fontFamily: Fonts.chiffres,
    color: Colors.anthracite,
  },
});
```

- [ ] **Step 4: Le Taux de rejet et TAMPONNER de l'acte en cours**

Dans `components/CurseurRejet.tsx`, remplacer le commentaire `/** Curseur du Taux de rejet (débloqué par la note de service n° 2). */` par :

```ts
/** Curseur du Taux de rejet (acte I : débloqué par la note de service n° 2 ; acte II : dès l'entrée). */
```

puis `  const { etat, mods, reglerTauxRejet } = useGameState();` par `  const { rejet, reglerTauxRejet, encre } = useGameState();`, et :

```ts
  const max = mods.rejetMax;
  const taux = Math.min(etat.tauxRejet, max);
```

par :

```ts
  const max = rejet.max;
  const taux = rejet.taux;
```

et, dans la `JaugeHachuree` :

```tsx
              couleur={Colors.encre}
              couleurClaire={Colors.encreClaire}
```

par :

```tsx
              couleur={encre.face}
              couleurClaire={encre.claire}
```

Dans `components/BoutonTamponner.tsx`, remplacer le commentaire de la fonction par défaut :

```ts
/**
 * Le bouton TAMPONNER. En rupture, rien ne s'affiche d'avance : c'est en tamponnant dans le vide
 * que le bouton dit « PLUS DE FORMULAIRES » (la pastille de l'onglet où s'en procurer fait le reste).
 * Le gain d'un coup se lit dans les compteurs.
 */
```

par :

```ts
/**
 * Le bouton TAMPONNER : un dossier à l'acte I, un visa à l'acte II. En rupture, rien ne s'affiche d'avance :
 * c'est en tamponnant dans le vide que le bouton le dit (« PLUS DE FORMULAIRES », « RUPTURE D’IMPRIMÉS » à
 * l'acte II ; la pastille de l'onglet où s'en procurer fait le reste). Le gain d'un coup se lit dans les compteurs.
 */
```

Remplacer `  const { tamponner, enAttente, etat, mods } = useGameState();` par `  const { tamponner, enAttente, rupture, direction, encre } = useGameState();`, puis :

```ts
  const rupture = etat.formulaires < mods.pieces;
  const vide = enAttente < 1;
  const libelle = signal > 0 ? 'PLUS DE FORMULAIRES' : vide && !rupture ? 'AUCUN DOSSIER' : 'TAMPONNER';
```

par :

```ts
  const vide = direction ? direction.visas < 1 : enAttente < 1;
  const libelleSignal = direction ? 'RUPTURE D’IMPRIMÉS' : 'PLUS DE FORMULAIRES';
  const libelleVide = direction ? 'AUCUN VISA' : 'AUCUN DOSSIER';
  const libelle = signal > 0 ? libelleSignal : vide && !rupture ? libelleVide : 'TAMPONNER';
```

et, dans le `BoutonPoussoir` :

```tsx
        couleur={eteint ? Colors.carton : Colors.encre}
        couleurOmbre={eteint ? Colors.crayonClair : Colors.encreFlanc}
        couleurTexte={signal > 0 ? Colors.rougeTexte : eteint ? Colors.crayon : Colors.anthracite}
        accessibilityLabel="Tamponner un dossier"
        accessibilityHint={rupture ? 'Plus de formulaires' : vide ? 'Aucun dossier en attente' : undefined}
```

par :

```tsx
        couleur={eteint ? Colors.carton : encre.face}
        couleurOmbre={eteint ? Colors.crayonClair : encre.flanc}
        couleurTexte={signal > 0 ? Colors.rougeTexte : eteint ? Colors.crayon : Colors.anthracite}
        accessibilityLabel={direction ? 'Tamponner un visa' : 'Tamponner un dossier'}
        accessibilityHint={
          rupture
            ? direction
              ? 'Rupture d’imprimés'
              : 'Plus de formulaires'
            : vide
              ? direction
                ? 'Aucun visa en attente'
                : 'Aucun dossier en attente'
              : undefined
        }
```

La barre d'espace (seul raccourci clavier) tamponne aux deux actes sans autre changement.

- [ ] **Step 5: Les ressources de l'acte II**

Dans `components/Hud.tsx`, remplacer le début de la fonction par défaut :

```tsx
/**
 * Tableau des ressources, à plat sous l'en-tête : budget, formulaires, dossiers en attente
 * et, une fois révélée, Conformité.
 */
export default function Hud() {
  const { etat, mods, conformite, verdict, enAttente, prixRamette } = useGameState();
  const { height, width } = useWindowDimensions();
  const compact = height < 720;
  // Écran étroit : colonnes resserrées.
  const etroit = width < 400;
  // Écran étroit à quatre colonnes : la largeur va aux libellés longs (« Formulaires », « Conformité » en 13 px)
  // plutôt qu'au budget, dont la valeur rétrécit d'elle-même pour tenir.
  const serre = etroit && mods.conformiteVisible;
  const rupture = etat.formulaires < mods.pieces;
  // En rupture, le budget est en cause aussi s'il ne paie plus une ramette (une fois les ramettes en vente).
  const sansBudget = rupture && mods.recrutementVisible && etat.budget < prixRamette;
```

par :

```tsx
/**
 * Tableau des ressources, à plat sous l'en-tête. Acte I : budget, formulaires, dossiers en attente et, une fois
 * révélée, Conformité. Acte II : budget, formulaires, visas et, après sa note, Taux de dématérialisation.
 */
export default function Hud() {
  const { etat, mods, conformite, verdict, enAttente, prixRamette, rupture, direction, encre } = useGameState();
  const { height, width } = useWindowDimensions();
  const compact = height < 720;
  // Écran étroit : colonnes resserrées.
  const etroit = width < 400;
  // Écran étroit à quatre colonnes : la largeur va aux libellés longs (« Formulaires », « Conformité » en 13 px)
  // plutôt qu'au budget, dont la valeur rétrécit d'elle-même pour tenir.
  const serre = etroit && (direction ? direction.demat !== null : mods.conformiteVisible);
  const recrutementVisible = direction ? direction.recrutementVisible : mods.recrutementVisible;
  // En rupture, le budget est en cause aussi s'il ne paie plus une ramette (une fois les ramettes en vente).
  const sansBudget = rupture && recrutementVisible && etat.budget < prixRamette;
```

Puis remplacer :

```tsx
        <Colonne
          label="En attente"
          valeur={formatEntier(Math.floor(enAttente))}
          compact={compact}
          etroit={etroit}
        />
        {mods.conformiteVisible && (
```

par :

```tsx
        {direction ? (
          <Colonne
            label="Visas"
            valeur={formatEntier(direction.visas)}
            compact={compact}
            etroit={etroit}
            declencheur={verdict?.id}
            effet="baisse"
          />
        ) : (
          <Colonne
            label="En attente"
            valeur={formatEntier(Math.floor(enAttente))}
            compact={compact}
            etroit={etroit}
          />
        )}
        {direction && direction.demat !== null && (
          <Colonne label="Démat." valeur={`${formatPourcent(direction.demat)} %`} compact={compact} etroit={etroit}>
            <JaugeHachuree
              valeur={direction.demat / 100}
              couleur={encre.face}
              couleurClaire={encre.claire}
              hauteur={8}
              motif="jauge-demat"
              accessibilityLabel="Taux de dématérialisation"
            />
          </Colonne>
        )}
        {!direction && mods.conformiteVisible && (
```

(La colonne Formulaires garde `rupture={rupture}`, qui vient désormais du contexte.)

- [ ] **Step 6: L'écran et sa route**

`components/direction/EcranDirection.tsx` :

```tsx
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Colors from '@/constants/Colors';
import Hud from '@/components/Hud';
import CurseurRejet from '@/components/CurseurRejet';
import BoutonTamponner from '@/components/BoutonTamponner';
import BulleDirection from '@/components/direction/BulleDirection';
import SceneDirection from '@/components/direction/SceneDirection';
import CurseurExemplaires from '@/components/direction/CurseurExemplaires';

/**
 * Écran Direction (acte II), même structure que le guichet, sans défilement : ressources, parapheur à viser,
 * scène du bureau du chef (toute la place restante), curseurs, TAMPONNER.
 */
export default function EcranDirection() {
  // Petit écran : bulle sur une ligne, la hauteur va à la scène.
  const compact = useWindowDimensions().height < 720;
  return (
    <View style={styles.ecran}>
      <Hud />
      <BulleDirection compact={compact} />
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
  },
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
});
```

Dans `app/(tabs)/index.tsx`, sous `import BoutonTamponner from '@/components/BoutonTamponner';`, ajouter :

```tsx
import EcranDirection from '@/components/direction/EcranDirection';
```

et remplacer :

```tsx
  const { mods } = useGameState();
  // Petit écran : bulle sur une ligne, la hauteur va à la scène.
  const compact = useWindowDimensions().height < 720;
```

par :

```tsx
  const { mods, direction } = useGameState();
  // Petit écran : bulle sur une ligne, la hauteur va à la scène.
  const compact = useWindowDimensions().height < 720;

  // Acte II : l'onglet principal devient l'écran Direction.
  if (direction) return <EcranDirection />;
```

- [ ] **Step 7: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, tests PASS.

Navigateur, 375 × 812 :
1. Préréglage `debut` : en-tête « TAMPONS APPOSÉS 160 k » ; colonnes Budget, Formulaires (300), Visas (12) ; bulle « Parapheur n° 048 · Carte d’identité », « Visa du chef de service », fiches « Pièce », trombone, « Visa » (le Visa sur fond bleu, avec un tampon) ; scène du bureau du chef, panneau « APPEL 0047 », aucun texte posé dessus ; « Rejet 0 % » ; TAMPONNER bleu, texte anthracite. Aucun visage ni prénom.
2. Trois clics sur TAMPONNER (ou trois appuis sur Espace) : le chef vise un parapheur à chaque coup, Visas baisse, Budget monte, la bulle passe à « Parapheur n° 051 ». L'écran ne défile pas.
3. « AUCUN VISA » et « RUPTURE D’IMPRIMÉS » : sur la page `manifest.webmanifest`, partir du préréglage `debut` et retirer le Visa de la Carte d'identité : `const s=JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')); s.acte2.procedures.identite=[{type:'piece'}]; s.acte2.usagers.identite=[20]; s.acte2.boucles.identite=[0]; localStorage.setItem('bureaucracy_acte1_v1', JSON.stringify(s))`, puis recharger le jeu : le bouton, grisé, dit « AUCUN VISA » ; la bulle dit « Aucun parapheur à viser » et sa chaîne n'a plus que « Pièce ». Recharger `debut`, mettre `s.formulaires=0` de la même façon : TAMPONNER garde son libellé, la colonne Formulaires est rouge, et un clic affiche « RUPTURE D’IMPRIMÉS » 1,5 s.
4. Préréglage `demat` : quatrième colonne « Démat. 38,x % » avec sa jauge ; « Rejet 80 % » ; ligne « Exemplaires ×1 ×2 ×3 », ×2 enfoncé ; la bulle dit « Dossier sans usager » quand les dossiers en boucle dominent le visa en tête.
5. 375 × 667 (compact) : la bulle tient sur une ligne (sans fiches), Exemplaires et TAMPONNER restent visibles sans défilement.

- [ ] **Step 8: Commiter**

```bash
git add components/scene/pixel/useMoteurDirection.ts components/scene/ScenePixelDirection.web.tsx components/scene/ScenePixelDirection.tsx components/direction/SceneDirection.tsx components/direction/BulleDirection.tsx components/direction/CurseurExemplaires.tsx components/direction/EcranDirection.tsx components/Hud.tsx components/BoutonTamponner.tsx components/CurseurRejet.tsx "app/(tabs)/index.tsx"
git commit -m "feat(ui): écran Direction de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Onglets, Service et Notes de l'acte II

**Files:**
- Create: `components/service/BoutonAchat.tsx`
- Create: `components/service/CarteUnite.tsx`
- Create: `components/service/CarteRamettes.tsx`
- Create: `components/direction/ServiceDirection.tsx`
- Modify: `app/(tabs)/recruitment.tsx` (réécrit)
- Modify: `app/(tabs)/notes.tsx`
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `useGameState()` → `service2`, `acheterGuichet`, `acheterAgent2`, `encre`, `rupture`, `prixRamette`, `maxRamettes`, `acheterRamettes`, `demanderRequisition`, `agents`, `acheterAgent`, `vitesse`, `demandeLimitante`, `direction`, `notes`, `notesNonVues`, `acheterNote`, `marquerNotesVues` ; `type Encre` (`constants/Colors.ts`) ; `type LucideIcon` (`lucide-react-native`).
- Produces: composants par défaut `BoutonAchat`, `CarteUnite` (props `id, nom, description, possedes, cout, cout10, maxAchetables, coutMax, achetable, Icone, fondIcone, verbe, onAcheter(nb)`), `CarteRamettes`, `ServiceDirection` ; onglet principal titré « Direction » à l'acte II.

Le Service de l'acte I est découpé en cartes réutilisables, sans changer son rendu : mêmes boutons verts, mêmes lots ×1, ×10, Max.

- [ ] **Step 1: Extraire les cartes du Service**

`components/service/BoutonAchat.tsx` :

```tsx
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';

interface BoutonAchatProps {
  libelle: string;
  actif: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Se partage la largeur avec ses voisins (achats en lot). */
  large?: boolean;
  /** Seconde ligne (prix du lot). */
  detail?: string;
}

/** Bouton vert d'achat du Service (×1, ×10, Max) ; gris quand le budget ne suffit pas. */
const BoutonAchat = memo(function BoutonAchat({ libelle, actif, onPress, accessibilityLabel, large, detail }: BoutonAchatProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!actif}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !actif }}
      style={({ pressed }) => [styles.achat, large && styles.achatLarge, actif ? styles.achatActif : styles.achatInactif, pressed && styles.achatPresse]}
    >
      <Text style={[styles.achatTexte, !actif && styles.achatTexteInactif]} numberOfLines={1} adjustsFontSizeToFit>
        {libelle}
      </Text>
      {detail !== undefined && (
        <Text style={[styles.achatDetail, !actif && styles.achatTexteInactif]} numberOfLines={2}>
          {detail}
        </Text>
      )}
    </Pressable>
  );
});

export default BoutonAchat;

const styles = StyleSheet.create({
  achat: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espace.s,
  },
  achatLarge: {
    flex: 1,
    minWidth: 0,
  },
  achatActif: {
    backgroundColor: Colors.vert,
  },
  achatInactif: {
    backgroundColor: Colors.carton,
  },
  achatPresse: {
    transform: [{ translateY: 2 }],
  },
  achatTexte: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  achatDetail: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.petit,
    textAlign: 'center',
    color: Colors.anthracite,
  },
  achatTexteInactif: {
    color: Colors.crayon,
  },
});
```

`components/service/CarteUnite.tsx` :

```tsx
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { formatEntier, formatEuros, formatMontant } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonAchat from '@/components/service/BoutonAchat';

interface CarteUniteProps {
  id: string;
  nom: string;
  description: string;
  possedes: number;
  cout: number;
  /** Coût de dix achats d'affilée. */
  cout10: number;
  /** Achats possibles d'affilée avec le budget actuel. */
  maxAchetables: number;
  coutMax: number;
  achetable: boolean;
  Icone: LucideIcon;
  fondIcone: string;
  /** Verbe des libellés d'accessibilité (« Recruter », « Acheter »). */
  verbe: string;
  onAcheter: (nb: number) => void;
}

/** Carte d'achat du Service (collègue, guichet, agent) : ×1, ×10 et Max, comme sur main. */
const CarteUnite = memo(function CarteUnite({
  nom,
  description,
  possedes,
  cout,
  cout10,
  maxAchetables: max,
  coutMax,
  achetable,
  Icone,
  fondIcone,
  verbe,
  onAcheter,
}: CarteUniteProps) {
  const { encre } = useGameState();
  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
      <View style={styles.ligne}>
        <View style={[styles.avatar, { backgroundColor: fondIcone }]}>
          <Icone size={18} color={Colors.anthracite} />
        </View>
        <View style={styles.infos}>
          <Text style={styles.nom}>
            {nom} <Text style={[styles.possedes, { color: encre.texte }]}>×{possedes}</Text>
          </Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <View style={styles.achats}>
        <BoutonAchat
          libelle="×1"
          detail={formatMontant(cout)}
          actif={achetable}
          onPress={() => onAcheter(1)}
          accessibilityLabel={`${verbe} : ${nom} ×1, ${formatEuros(cout)} euros`}
          large
        />
        <BoutonAchat
          libelle="×10"
          detail={formatMontant(cout10)}
          actif={max >= 10}
          onPress={() => onAcheter(10)}
          accessibilityLabel={`${verbe} : ${nom} ×10, ${formatEuros(cout10)} euros`}
          large
        />
        <BoutonAchat
          libelle="Max"
          detail={max > 0 ? `×${formatEntier(max)}\n${formatMontant(coutMax)}` : `×0\n${formatMontant(cout)}`}
          actif={max > 0}
          onPress={() => onAcheter(max)}
          accessibilityLabel={`${verbe} : ${nom}, autant que le budget le permet (${max}), ${formatEuros(coutMax)} euros`}
          large
        />
      </View>
    </Panneau>
  );
});

export default CarteUnite;

const styles = StyleSheet.create({
  carte: {
    padding: Espace.m,
    gap: Espace.m,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
  },
  achats: {
    flexDirection: 'row',
    gap: Espace.s,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Charte.rayon,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infos: {
    flex: 1,
    gap: 1,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  possedes: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
  },
  description: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
});
```

`components/service/CarteRamettes.tsx` :

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FileStack } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { BALANCE } from '@/constants/balance';
import { formatEntier, formatEuros, formatMontant } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonAchat from '@/components/service/BoutonAchat';

/** Fournitures du Service : ramettes ×1, ×10, Max (acte I et acte II, même prix de base). */
export default function CarteRamettes() {
  const { etat, rupture, prixRamette, maxRamettes, acheterRamettes, demanderRequisition } = useGameState();
  // Rupture sans de quoi payer une ramette : le ×1 devient une réquisition gratuite (rien n'est jamais bloqué).
  const requisition = rupture && etat.budget < prixRamette;

  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
      <View style={styles.ligne}>
        <View style={styles.avatar}>
          <FileStack size={18} color={Colors.anthracite} />
        </View>
        <View style={styles.infos}>
          <Text style={styles.nom}>Ramette de {BALANCE.ramette} formulaires</Text>
          <Text style={styles.description}>Formulaires réglementaires, format A4, couleur administrative.</Text>
        </View>
      </View>
      <View style={styles.achats}>
        {requisition ? (
          <BoutonAchat
            libelle="Réquisition"
            detail="Gratuit"
            actif
            onPress={demanderRequisition}
            accessibilityLabel="Demander une ramette de réquisition, gratuite"
            large
          />
        ) : (
          <BoutonAchat
            libelle="×1"
            detail={formatMontant(prixRamette)}
            actif={etat.budget >= prixRamette}
            onPress={() => acheterRamettes(1)}
            accessibilityLabel={`Acheter une ramette, ${formatEuros(prixRamette)} euros`}
            large
          />
        )}
        <BoutonAchat
          libelle="×10"
          detail={formatMontant(prixRamette * 10)}
          actif={etat.budget >= prixRamette * 10}
          onPress={() => acheterRamettes(10)}
          accessibilityLabel={`Acheter dix ramettes, ${formatEuros(prixRamette * 10)} euros`}
          large
        />
        <BoutonAchat
          libelle="Max"
          detail={
            maxRamettes > 0
              ? `×${formatEntier(maxRamettes)}\n${formatMontant(maxRamettes * prixRamette)}`
              : `×0\n${formatMontant(prixRamette)}`
          }
          actif={maxRamettes > 0}
          onPress={() => acheterRamettes(maxRamettes)}
          accessibilityLabel={`Acheter ${maxRamettes} ramettes (ce que permet le budget), ${formatEuros(maxRamettes * prixRamette)} euros`}
          large
        />
      </View>
    </Panneau>
  );
}

const styles = StyleSheet.create({
  carte: {
    padding: Espace.m,
    gap: Espace.m,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
  },
  achats: {
    flexDirection: 'row',
    gap: Espace.s,
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
  infos: {
    flex: 1,
    gap: 1,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  description: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
});
```

- [ ] **Step 2: Le Service de la Direction**

`components/direction/ServiceDirection.tsx` :

```tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Landmark, UserRound } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Espace, Fonts, Typo } from '@/constants/Colors';
import { formatDebit } from '@/utils/formatters';
import Hud from '@/components/Hud';
import CarteRamettes from '@/components/service/CarteRamettes';
import CarteUnite from '@/components/service/CarteUnite';

/** Onglet Service de l'acte II : fournitures, guichets (franchissent les étapes) et agents (accordent les visas). */
export default function ServiceDirection() {
  const { service2, acheterGuichet, acheterAgent2, encre } = useGameState();
  if (!service2) return null;
  const { guichet, agents, etapesParSeconde, visasParSeconde } = service2;

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Fournitures</Text>
        <CarteRamettes />

        <Text style={styles.titre}>
          Guichets <Text style={styles.sousTitre}>· {formatDebit(etapesParSeconde)} étapes/s au total</Text>
        </Text>
        <CarteUnite {...guichet} Icone={Landmark} fondIcone={encre.fond} verbe="Acheter" onAcheter={acheterGuichet} />

        {agents.length > 0 && (
          <Text style={styles.titre}>
            Agents <Text style={styles.sousTitre}>· {formatDebit(visasParSeconde)} visas/s au total</Text>
          </Text>
        )}
        {agents.map((a) => (
          <CarteUnite
            key={a.id}
            {...a}
            Icone={UserRound}
            fondIcone={Colors.pastelJaune}
            verbe="Recruter"
            onAcheter={(nb) => acheterAgent2(a.id, nb)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  contenu: {
    padding: Espace.m,
    gap: Espace.m,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.titre,
    color: Colors.anthracite,
    marginTop: Espace.xs,
  },
  sousTitre: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
});
```

- [ ] **Step 3: Réécrire l'onglet Service**

Remplacer tout le contenu de `app/(tabs)/recruitment.tsx` par :

```tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserRound } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Espace, Fonts, Typo } from '@/constants/Colors';
import { formatDebit } from '@/utils/formatters';
import Hud from '@/components/Hud';
import CarteRamettes from '@/components/service/CarteRamettes';
import CarteUnite from '@/components/service/CarteUnite';
import ServiceDirection from '@/components/direction/ServiceDirection';

/** Onglet Service : fournitures (ramettes) et recrutement des collègues (acte I), ou de la Direction (acte II). */
export default function ServiceScreen() {
  const { agents, acheterAgent, vitesse, demandeLimitante, direction } = useGameState();
  if (direction) return <ServiceDirection />;

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Fournitures</Text>
        <CarteRamettes />

        <Text style={styles.titre}>
          Collègues <Text style={styles.sousTitre}>· {formatDebit(vitesse)} dossiers/s au total</Text>
        </Text>
        {demandeLimitante && (
          <Text style={styles.alerte}>
            Ce sont les usagers qui manquent, pas les bras : un collègue de plus n’accélérerait rien. Étendez le
            périmètre ou les horaires (notes de service).
          </Text>
        )}
        {agents.map((a) => (
          <CarteUnite
            key={a.id}
            id={a.id}
            nom={a.nom}
            description={a.description}
            possedes={a.possedes}
            cout={a.cout}
            cout10={a.cout10}
            maxAchetables={a.maxAchetables}
            coutMax={a.coutMax}
            achetable={a.achetable}
            Icone={UserRound}
            fondIcone={Colors.encreFond}
            verbe="Recruter"
            onAcheter={(nb) => acheterAgent(a.id, nb)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  contenu: {
    padding: Espace.m,
    gap: Espace.m,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.titre,
    color: Colors.anthracite,
    marginTop: Espace.xs,
  },
  sousTitre: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
  alerte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.encreTexte,
  },
});
```

- [ ] **Step 4: Les notes à l'encre de l'acte**

Dans `app/(tabs)/notes.tsx` :

- remplacer `import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';` par `import Colors, { Charte, Espace, Fonts, Interligne, Typo, type Encre } from '@/constants/Colors';` ;
- dans la signature de `CarteNote`, ajouter la prop `encre` :

```tsx
const CarteNote = memo(function CarteNote({
  note,
  encre,
  onSigner,
}: {
  note: NoteAffichee;
  encre: Encre;
  onSigner: () => void;
}) {
```

- remplacer `style={({ pressed }) => [styles.viser, actif ? styles.viserActif : styles.viserInactif, pressed && styles.presse]}` par `style={({ pressed }) => [styles.viser, actif ? { backgroundColor: encre.face } : styles.viserInactif, pressed && styles.presse]}` ;
- remplacer `<View style={styles.nouveau}>` par `<View style={[styles.nouveau, { backgroundColor: encre.face }]}>` ;
- dans `NotesScreen`, remplacer `const { notes, acheterNote, marquerNotesVues } = useGameState();` par `const { notes, acheterNote, marquerNotesVues, encre } = useGameState();`, et passer `encre={encre}` aux deux `<CarteNote … />` ;
- dans les styles, retirer `backgroundColor: Colors.encre,` de `nouveau` et supprimer le style `viserActif`.

- [ ] **Step 5: Les onglets de l'acte II**

Dans `app/(tabs)/_layout.tsx`, remplacer :

```tsx
  const { pret, etat, mods, notes, notesNonVues, agents, demandeLimitante } = useGameState();
```

par :

```tsx
  const { pret, etat, mods, notes, notesNonVues, agents, demandeLimitante, direction, service2, rupture, encre } =
    useGameState();
```

Remplacer :

```tsx
  // Quand la demande limite, la pastille n'invite plus à recruter : ce serait de l'argent perdu.
  const recrutablesDispo = demandeLimitante ? 0 : agents.filter((a) => a.achetable).length;
  // Rupture de formulaires : un « ! » sur l'onglet où s'en procurer (Service, ou Notes avant la note n° 1).
  const rupture = etat.formulaires < mods.pieces;
  const ruptureService = rupture && mods.recrutementVisible;
  const ruptureNotes = rupture && !mods.recrutementVisible;
```

par :

```tsx
  const recrutementVisible = direction ? direction.recrutementVisible : mods.recrutementVisible;
  // Acte I : quand la demande limite, la pastille n'invite plus à recruter (ce serait de l'argent perdu).
  // Acte II : guichets et agents achetables.
  const recrutablesDispo = service2
    ? [service2.guichet, ...service2.agents].filter((u) => u.achetable).length
    : demandeLimitante
      ? 0
      : agents.filter((a) => a.achetable).length;
  // Rupture de formulaires : un « ! » sur l'onglet où s'en procurer (Service, ou Notes avant la note n° 1).
  const ruptureService = rupture && recrutementVisible;
  const ruptureNotes = rupture && !recrutementVisible;
```

Remplacer `tabBarActiveTintColor: Colors.encreTexte,` par `tabBarActiveTintColor: encre.texte,` ; dans l'écran `index` :

```tsx
            title: 'Guichet',
            tabBarAccessibilityLabel: 'Guichet',
```

par :

```tsx
            // Acte II : l'onglet principal devient « Direction ».
            title: direction ? 'Direction' : 'Guichet',
            tabBarAccessibilityLabel: direction ? 'Direction' : 'Guichet',
```

et, dans l'écran `recruitment`, `href: mods.recrutementVisible ? undefined : null,` par `href: recrutementVisible ? undefined : null,`.

- [ ] **Step 6: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, tests PASS.

Navigateur, 375 × 812 :
1. Régression de l'acte I (partie neuve, ou une sauvegarde d'acte I) : l'onglet Service est identique à main (Fournitures, « Collègues · … dossiers/s au total », boutons verts ×1, ×10, Max, Réquisition gratuite en rupture sans budget) ; l'onglet actif est orange.
2. Préréglage `debut` : onglets « Direction · Notes · Options », Direction en bleu ; Notes porte « 1 » ; dans Notes, « NOTE DE SERVICE N° 001 — Prise de fonctions », bouton « Approuver · Gratuit » bleu. L'approuver : l'onglet Service apparaît.
3. Service : « Fournitures », « Guichets · 0,50 étapes/s au total », carte « Guichet ×1 » (« Le guichet 3 et ses semblables… »). Préréglage `boucle` : section « Agents · 6,00 visas/s au total », « Instructeur ×10 » ; acheter un Guichet ×1 : Guichet ×9, budget en baisse, pas d'annulation proposée.
4. Mettre `formulaires` à 0 (comme à la Tâche 6) dans le préréglage `boucle` : « ! » sur l'onglet Service ; avec aussi `budget` à 0, le ×1 des ramettes devient « Réquisition · Gratuit ».

- [ ] **Step 7: Commiter**

```bash
git add components/service/BoutonAchat.tsx components/service/CarteUnite.tsx components/service/CarteRamettes.tsx components/direction/ServiceDirection.tsx "app/(tabs)/recruitment.tsx" "app/(tabs)/notes.tsx" "app/(tabs)/_layout.tsx"
git commit -m "feat(ui): onglets Direction, Service et Notes de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: L'Atelier des procédures

**Files:**
- Create: `components/atelier/Elements.tsx`
- Create: `components/atelier/SelecteurProcedure.tsx`
- Create: `components/atelier/FicheEtape.tsx`
- Create: `components/atelier/FeuilleEtape.tsx`
- Create: `components/atelier/EcranAtelier.tsx`
- Create: `app/(tabs)/atelier.tsx`
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `useGameState()` → `atelier`, `modifierProcedure`, `encre`, `useFermetureEchap` ; types `ActionAtelier`, `EtapeType`, `ProcId`, `VueAtelier`, `ProcAtelier`, `EtapeAtelier`, `EffetAffiche`.
- Produces: `IconeEtape`, `Effets`, `Trombone`, `TromboneFerme` ; composants par défaut `SelecteurProcedure`, `FicheEtape`, `FeuilleEtape` (+ `type ModeFeuille`), `EcranAtelier` ; route `atelier` visible quand `direction.atelierVisible`.

Une procédure par écran (sélecteur en haut, procédures ouvertes seulement), les étapes en fiches reliées par des trombones, chaque effet en symbole + mot. Monter, descendre, retirer : trois boutons de 44 × 44 pt sur chaque fiche (jamais seulement au glisser). « Ajouter une étape » et la pièce exigée se choisissent dans une feuille qui monte du bas, comme le courrier. Une modification s'applique aussitôt (le moteur garde les dossiers engagés à leur rang). Rien ne nomme la boucle.

- [ ] **Step 1: Les éléments des fiches**

`components/atelier/Elements.tsx` :

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FileCheck, Hourglass, Landmark, Paperclip, PenLine, Stamp, Users, type LucideIcon } from 'lucide-react-native';
import { useGameState, type EffetAffiche, type EtapeType } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';

const ICONES: Record<EtapeType, LucideIcon> = {
  piece: FileCheck,
  visa: Stamp,
  signature: PenLine,
  pieceService: Landmark,
  reflexion: Hourglass,
  commission: Users,
};

/** Pastille ronde d'une étape, avec son pictogramme (le visa, qui attend un tampon, est jaune). */
export function IconeEtape({ type }: { type: EtapeType }) {
  const { encre } = useGameState();
  const Icone = ICONES[type];
  return (
    <View style={[styles.rond, { backgroundColor: type === 'visa' ? Colors.pastelJaune : encre.fond }]}>
      <Icone size={18} color={Colors.anthracite} />
    </View>
  );
}

const FONDS = StyleSheet.create({
  plus: { backgroundColor: Colors.pastelVert },
  moins: { backgroundColor: Colors.rougeFond },
  neutre: { backgroundColor: Colors.papier },
});

/** Effets d'une étape : un symbole et un mot chacun, la couleur ne fait que doubler l'information. */
export function Effets({ effets }: { effets: EffetAffiche[] }) {
  return (
    <View style={styles.effets}>
      {effets.map((e) => (
        <View key={e.texte} style={[styles.effet, FONDS[e.sens]]}>
          <Text style={styles.effetTexte}>{e.texte}</Text>
        </View>
      ))}
    </View>
  );
}

/** Trombone entre deux fiches d'une même procédure. */
export function Trombone() {
  return (
    <View style={styles.trombone} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Paperclip size={18} color={Colors.anthracite} />
    </View>
  );
}

/** Trombone fermé sur lui-même : ces procédures s'exigent mutuellement (jamais nommé « boucle »). */
export function TromboneFerme() {
  const { encre } = useGameState();
  return (
    <View
      style={[styles.anneau, { borderColor: encre.texte }]}
      accessible
      accessibilityLabel="Ces procédures s’exigent mutuellement"
    >
      <Paperclip size={14} color={encre.texte} />
    </View>
  );
}

const styles = StyleSheet.create({
  rond: {
    width: 36,
    height: 36,
    borderRadius: Charte.rayon,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espace.xs,
    marginTop: Espace.xs,
  },
  effet: {
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    paddingHorizontal: Espace.xs,
  },
  effetTexte: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.anthracite,
  },
  trombone: {
    alignItems: 'center',
    marginVertical: -Espace.xs,
    zIndex: 1,
  },
  anneau: {
    width: 24,
    height: 24,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Le sélecteur de procédure**

`components/atelier/SelecteurProcedure.tsx` :

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameState, type ProcAtelier, type ProcId } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';

interface SelecteurProcedureProps {
  procedures: ProcAtelier[];
  choisie: ProcId;
  onChoisir: (p: ProcId) => void;
}

/** Sélecteur de l'Atelier : une procédure ouverte par onglet (la procédure choisie est enfoncée et en gras). */
export default function SelecteurProcedure({ procedures, choisie, onChoisir }: SelecteurProcedureProps) {
  const { encre } = useGameState();
  return (
    <View style={styles.rangee} accessibilityRole="tablist">
      {procedures.map((p) => {
        const actif = p.id === choisie;
        return (
          <Pressable
            key={p.id}
            onPress={() => onChoisir(p.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: actif }}
            accessibilityLabel={p.nom}
            style={({ pressed }) => [
              styles.onglet,
              actif && styles.ongletActif,
              actif && { backgroundColor: encre.face, borderBottomColor: encre.flanc },
              pressed && styles.presse,
            ]}
          >
            <Text style={[styles.texte, actif && styles.texteActif]} numberOfLines={2}>
              {p.nom}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rangee: {
    flexDirection: 'row',
    gap: Espace.s,
  },
  onglet: {
    flex: 1,
    minHeight: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papierChaud,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espace.xs,
    paddingVertical: Espace.xs,
  },
  ongletActif: {
    borderBottomWidth: Charte.trait + 2,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.anthracite,
    textAlign: 'center',
  },
  texteActif: {
    fontFamily: Fonts.texteGras,
  },
});
```

- [ ] **Step 3: La fiche d'étape**

`components/atelier/FicheEtape.tsx` :

```tsx
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, Trash2, type LucideIcon } from 'lucide-react-native';
import { useGameState, type EtapeAtelier } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import { Effets, IconeEtape, TromboneFerme } from '@/components/atelier/Elements';

interface FicheEtapeProps {
  etape: EtapeAtelier;
  rang: number;
  total: number;
  onMonter: () => void;
  onDescendre: () => void;
  onRetirer: () => void;
  onExiger: () => void;
}

/** Bouton carré de 44 pt (monter, descendre, retirer). */
function BoutonCarre({
  Icone,
  libelle,
  desactive,
  onPress,
}: {
  Icone: LucideIcon;
  libelle: string;
  desactive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desactive}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityState={{ disabled: desactive }}
      style={({ pressed }) => [styles.carre, desactive && styles.carreInactif, pressed && styles.presse]}
    >
      <Icone size={18} color={desactive ? Colors.crayonClair : Colors.anthracite} />
    </Pressable>
  );
}

/** Une étape dans l'Atelier : effets, pièce exigée, boutons monter / descendre / retirer (jamais seulement au glisser). */
const FicheEtape = memo(function FicheEtape({
  etape,
  rang,
  total,
  onMonter,
  onDescendre,
  onRetirer,
  onExiger,
}: FicheEtapeProps) {
  const { encre } = useGameState();
  const effets = etape.effets.map((e) => e.texte).join(', ');
  return (
    <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
      <View style={styles.ligne} accessible accessibilityLabel={`Étape ${rang + 1} sur ${total} : ${etape.nom}. ${effets}`}>
        <IconeEtape type={etape.type} />
        <View style={styles.infos}>
          <Text style={styles.nom}>{etape.nom}</Text>
          <Effets effets={etape.effets} />
        </View>
      </View>
      {etape.type === 'pieceService' && (
        <Pressable
          onPress={onExiger}
          accessibilityRole="button"
          accessibilityLabel={`Pièce exigée : ${etape.exigeNom ?? 'aucune'}${etape.boucle ? '. Ces procédures s’exigent mutuellement' : ''}. Changer`}
          style={({ pressed }) => [
            styles.exige,
            { borderColor: encre.texte, backgroundColor: encre.fond },
            pressed && styles.presse,
          ]}
        >
          {etape.boucle && <TromboneFerme />}
          <Text style={[styles.exigeTexte, { color: encre.texte }]} numberOfLines={1}>
            exige : {etape.exigeNom ?? 'aucune pièce'}
          </Text>
        </Pressable>
      )}
      <View style={styles.actions}>
        <BoutonCarre Icone={ChevronUp} libelle={`Monter l’étape ${etape.nom}`} desactive={rang === 0} onPress={onMonter} />
        <BoutonCarre
          Icone={ChevronDown}
          libelle={`Descendre l’étape ${etape.nom}`}
          desactive={rang === total - 1}
          onPress={onDescendre}
        />
        <BoutonCarre Icone={Trash2} libelle={`Retirer l’étape ${etape.nom}`} desactive={total <= 1} onPress={onRetirer} />
      </View>
    </Panneau>
  );
});

export default FicheEtape;

const styles = StyleSheet.create({
  fiche: {
    padding: Espace.m,
    gap: Espace.s,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
  },
  infos: {
    flex: 1,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  exige: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espace.s,
    minHeight: 44,
    borderWidth: Charte.traitFin,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.m,
  },
  exigeTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Espace.s,
  },
  carre: {
    width: 44,
    height: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papierChaud,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carreInactif: {
    borderColor: Colors.crayonClair,
    backgroundColor: Colors.carton,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
```

- [ ] **Step 4: La feuille « Ajouter une étape » / « Pièce exigée »**

`components/atelier/FeuilleEtape.tsx` :

```tsx
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, CircleCheck, X } from 'lucide-react-native';
import {
  useFermetureEchap,
  useGameState,
  type ActionAtelier,
  type EtapeType,
  type ProcId,
  type VueAtelier,
} from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';
import { Effets, IconeEtape } from '@/components/atelier/Elements';

/** Ce que demande la feuille : une étape à ajouter, ou la procédure qu'exige une pièce de service. */
export type ModeFeuille =
  | { type: 'ajouter'; p: ProcId }
  | { type: 'exiger'; p: ProcId; k: number; actuelle: ProcId | null };

interface FeuilleEtapeProps {
  mode: ModeFeuille | null;
  atelier: VueAtelier;
  onFermer: () => void;
  onValider: (action: ActionAtelier) => void;
}

interface ChoixProps {
  libelle: string;
  detail?: string;
  choisi: boolean;
  onPress: () => void;
  icone?: React.ReactNode;
  pied?: React.ReactNode;
}

/** Une ligne à choisir (bouton radio) : coche et bord épais en plus de la couleur. */
function Choix({ libelle, detail, choisi, onPress, icone, pied }: ChoixProps) {
  const { encre } = useGameState();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: choisi }}
      accessibilityLabel={detail ? `${libelle}. ${detail}` : libelle}
      style={({ pressed }) => [
        styles.choix,
        choisi && styles.choixRetenu,
        choisi && { backgroundColor: encre.fond, borderLeftColor: encre.face },
        pressed && styles.presse,
      ]}
    >
      {icone}
      <View style={styles.choixTexte}>
        <Text style={styles.choixNom}>{libelle}</Text>
        {detail ? <Text style={styles.choixDetail}>{detail}</Text> : null}
        {pied}
      </View>
      {choisi ? <CircleCheck size={22} color={Colors.anthracite} /> : <Circle size={22} color={Colors.crayonClair} />}
    </Pressable>
  );
}

/** Feuille qui monte du bas (comme le courrier) : catalogue des étapes débloquées, puis le document exigé. */
export default function FeuilleEtape({ mode, atelier, onFermer, onValider }: FeuilleEtapeProps) {
  const { encre } = useGameState();
  const [etape, setEtape] = useState<EtapeType | null>(null);
  const [exige, setExige] = useState<ProcId | null>(null);
  useEffect(() => {
    setEtape(mode?.type === 'exiger' ? 'pieceService' : null);
    setExige(mode?.type === 'exiger' ? mode.actuelle : null);
  }, [mode]);
  const visible = mode !== null;
  useFermetureEchap(visible, onFermer);

  const proc = mode ? atelier.procedures.find((p) => p.id === mode.p) : undefined;
  const avecExige = etape === 'pieceService';
  const valide = etape !== null && (!avecExige || exige !== null);

  const documentExige = proc ? (
    <View
      style={[styles.groupe, mode?.type === 'ajouter' && styles.retrait]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Document exigé"
    >
      <Text style={styles.sousTitre}>Document exigé</Text>
      {proc.exigeables.map((q) => (
        <Choix key={q.id} libelle={q.nom} choisi={exige === q.id} onPress={() => setExige(q.id)} />
      ))}
    </View>
  ) : null;

  const valider = () => {
    if (!mode || !etape) return;
    if (mode.type === 'exiger') {
      if (exige) onValider({ type: 'exiger', p: mode.p, k: mode.k, exige });
      return;
    }
    if (etape === 'pieceService') {
      if (exige) onValider({ type: 'ajouter', p: mode.p, etape, exige });
      return;
    }
    onValider({ type: 'ajouter', p: mode.p, etape });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <View style={styles.voile}>
        {/* Toucher le voile, au-dessus de la feuille, ferme comme la croix. */}
        <Pressable style={styles.zoneVoile} onPress={onFermer} accessible={false} />
        <SafeAreaView edges={['bottom']} style={styles.feuille}>
          <View style={styles.entete}>
            <Text style={styles.titre}>{mode?.type === 'exiger' ? 'Pièce exigée' : 'Ajouter une étape'}</Text>
            <Pressable onPress={onFermer} style={styles.fermer} accessibilityRole="button" accessibilityLabel="Fermer">
              <X size={22} color={Colors.anthracite} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.corps}>
            {mode?.type === 'ajouter' && (
              <View style={styles.groupe} accessibilityRole="radiogroup" accessibilityLabel="Étape">
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
              </View>
            )}
            {mode?.type === 'exiger' && documentExige}
            <BoutonPoussoir
              libelle={mode?.type === 'exiger' ? 'EXIGER CETTE PIÈCE' : 'AJOUTER L’ÉTAPE'}
              taille={Typo.titre}
              hauteur={56}
              couleur={encre.face}
              couleurOmbre={encre.flanc}
              desactive={!valide}
              onPress={valider}
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: Colors.voile,
    justifyContent: 'flex-end',
  },
  zoneVoile: {
    flex: 1,
    minHeight: Espace.xxl * 3,
  },
  feuille: {
    maxHeight: '92%',
    width: '100%',
    maxWidth: Charte.largeurColonne,
    alignSelf: 'center',
    borderTopLeftRadius: Charte.rayon,
    borderTopRightRadius: Charte.rayon,
    borderTopWidth: Charte.trait,
    borderColor: Colors.anthracite,
    overflow: 'hidden',
    backgroundColor: Colors.carton,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espace.l,
    paddingVertical: Espace.m,
    borderBottomWidth: Charte.trait,
    borderBottomColor: Colors.anthracite,
    backgroundColor: Colors.creme,
  },
  titre: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.titre,
    color: Colors.anthracite,
  },
  fermer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corps: {
    padding: Espace.l,
    gap: Espace.m,
  },
  groupe: {
    gap: Espace.s,
  },
  /** Le document exigé, en retrait sous la pièce de service. */
  retrait: {
    marginLeft: Espace.xl,
  },
  sousTitre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    minHeight: 44,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    backgroundColor: Colors.papier,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
  },
  choixRetenu: {
    borderLeftWidth: Espace.xs + 2,
  },
  choixTexte: {
    flex: 1,
    gap: 2,
  },
  choixNom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  choixDetail: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
```

- [ ] **Step 5: L'écran et sa route**

`components/atelier/EcranAtelier.tsx` :

```tsx
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGameState, type ActionAtelier, type ProcId } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import Hud from '@/components/Hud';
import Panneau from '@/components/charte/Panneau';
import SelecteurProcedure from '@/components/atelier/SelecteurProcedure';
import FicheEtape from '@/components/atelier/FicheEtape';
import FeuilleEtape, { type ModeFeuille } from '@/components/atelier/FeuilleEtape';
import { Trombone, TromboneFerme } from '@/components/atelier/Elements';

/**
 * Atelier des procédures (acte II) : une procédure par écran, ses étapes en fiches reliées par des trombones.
 * Une modification s'applique aussitôt. Quand des procédures s'exigent mutuellement, une carte neutre les relie
 * par un trombone fermé ; rien ne la nomme « boucle ».
 */
export default function EcranAtelier() {
  const { atelier, modifierProcedure, encre } = useGameState();
  const [choisie, setChoisie] = useState<ProcId>('identite');
  const [feuille, setFeuille] = useState<ModeFeuille | null>(null);
  const fermer = useCallback(() => setFeuille(null), []);
  const valider = useCallback(
    (action: ActionAtelier) => {
      modifierProcedure(action);
      setFeuille(null);
    },
    [modifierProcedure],
  );

  if (!atelier) return null;
  const proc = atelier.procedures.find((p) => p.id === choisie) ?? atelier.procedures[0];
  const n = proc.etapes.length;

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Atelier des procédures</Text>
        <SelecteurProcedure procedures={atelier.procedures} choisie={proc.id} onChoisir={setChoisie} />
        <View>
          {proc.etapes.map((e, k) => (
            <View key={`${proc.id}-${k}-${e.type}-${e.exige ?? ''}`}>
              {k > 0 && <Trombone />}
              <FicheEtape
                etape={e}
                rang={k}
                total={n}
                onMonter={() => modifierProcedure({ type: 'deplacer', p: proc.id, k, sens: -1 })}
                onDescendre={() => modifierProcedure({ type: 'deplacer', p: proc.id, k, sens: 1 })}
                onRetirer={() => modifierProcedure({ type: 'retirer', p: proc.id, k })}
                onExiger={() => setFeuille({ type: 'exiger', p: proc.id, k, actuelle: e.exige })}
              />
            </View>
          ))}
        </View>
        {proc.boucle.length > 0 && (
          <Panneau contenuStyle={[styles.boucle, { backgroundColor: encre.fond }]} rayon={Charte.rayon}>
            <TromboneFerme />
            <View style={styles.boucleTexte}>
              <Text style={styles.boucleNoms}>{proc.boucleNoms.join(' ⇄ ')}</Text>
              <Text style={styles.boucleDetail}>Ces procédures s’exigent mutuellement.</Text>
            </View>
          </Panneau>
        )}
        <Pressable
          onPress={() => setFeuille({ type: 'ajouter', p: proc.id })}
          disabled={proc.pleine}
          accessibilityRole="button"
          accessibilityLabel={`Ajouter une étape à la procédure ${proc.nom}, ${n} sur ${atelier.etapesMax}`}
          accessibilityState={{ disabled: proc.pleine }}
          style={({ pressed }) => [styles.ajouter, proc.pleine && styles.ajouterInactif, pressed && styles.presse]}
        >
          <Text style={[styles.ajouterTexte, { color: proc.pleine ? Colors.crayon : encre.texte }]}>
            + Ajouter une étape · {n} / {atelier.etapesMax}
          </Text>
        </Pressable>
      </ScrollView>
      <FeuilleEtape mode={feuille} atelier={atelier} onFermer={fermer} onValider={valider} />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  contenu: {
    padding: Espace.m,
    gap: Espace.m,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.titre,
    color: Colors.anthracite,
    marginTop: Espace.xs,
  },
  boucle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    padding: Espace.m,
  },
  boucleTexte: {
    flex: 1,
    gap: 2,
  },
  boucleNoms: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  boucleDetail: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  ajouter: {
    minHeight: 44,
    borderWidth: Charte.traitFin,
    borderStyle: 'dashed',
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Espace.m,
  },
  ajouterInactif: {
    borderColor: Colors.crayonClair,
  },
  ajouterTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
```

`app/(tabs)/atelier.tsx` :

```tsx
import React from 'react';
import EcranAtelier from '@/components/atelier/EcranAtelier';

/** Onglet Atelier (acte II), visible après la note « Atelier des procédures ». */
export default function AtelierScreen() {
  return <EcranAtelier />;
}
```

Dans `app/(tabs)/_layout.tsx`, remplacer `import { Building2, ScrollText, Settings, UserPlus } from 'lucide-react-native';` par `import { Building2, ScrollText, Settings, UserPlus, Wrench } from 'lucide-react-native';`, et ajouter, juste avant `<Tabs.Screen name="options" …>` (ordre : Direction · Service · Notes · Atelier · Options) :

```tsx
        <Tabs.Screen
          name="atelier"
          options={{
            title: 'Atelier',
            tabBarAccessibilityLabel: 'Atelier des procédures',
            href: direction?.atelierVisible ? undefined : null,
            tabBarIcon: ({ color, size }) => <Wrench size={size} color={color} />,
          }}
        />
```

- [ ] **Step 6: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, tests PASS.

Navigateur, 375 × 812 :
1. Préréglage `debut` : pas d'onglet Atelier. Préréglage `atelier` : cinq onglets « Direction · Service · Notes · Atelier · Options », libellés lisibles.
2. Atelier : titre « Atelier des procédures » ; sélecteur « Carte d’identité » (enfoncé, en gras) / « Justificatif de domicile » ; fiches « Pièce justificative » (`+ conformité` `+ €` `+ délai` `− patience`), trombone, « Visa » (`++ conformité` `+ €` `++ délai` `− patience`) ; « + Ajouter une étape · 2 / 8 ».
3. « Monter » est grisé sur la première fiche, « Descendre » sur la dernière. Descendre la Pièce justificative : l'ordre s'inverse aussitôt ; `procedures.identite` dans la sauvegarde aussi.
4. « + Ajouter une étape » : la feuille monte, avec « Pièce justificative » et « Visa » (description et effets) ; « AJOUTER L’ÉTAPE » grisé tant que rien n'est choisi ; choisir « Visa », ajouter : une troisième fiche, « 3 / 8 ». Échap ou un toucher sur le voile ferme la feuille sans rien changer.
5. Préréglage `boucle` : sur « Carte d’identité », la fiche « Pièce délivrée par nos services » porte « exige : Justificatif de domicile » avec le trombone fermé ; sous les fiches, la carte « Carte d’identité ⇄ Justificatif de domicile — Ces procédures s’exigent mutuellement. » ; le mot « boucle » n'apparaît nulle part (`get_page_text`). Toucher « exige : … » ouvre « Pièce exigée » sur les seules autres procédures ouvertes.
6. Ajouter une « Pièce délivrée par nos services » : « Document exigé » s'ouvre juste sous ce choix, sans défiler ; « AJOUTER L’ÉTAPE » reste grisé tant qu'aucun document n'est coché.
7. Retirer une étape jusqu'à n'en garder qu'une : « Retirer » se grise.

- [ ] **Step 7: Commiter**

```bash
git add components/atelier/Elements.tsx components/atelier/SelecteurProcedure.tsx components/atelier/FicheEtape.tsx components/atelier/FeuilleEtape.tsx components/atelier/EcranAtelier.tsx "app/(tabs)/atelier.tsx" "app/(tabs)/_layout.tsx"
git commit -m "feat(ui): Atelier des procédures

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Options et fin de l'acte II

**Files:**
- Create: `components/direction/reglementDirection.ts`
- Create: `components/direction/FinActe2Modal.tsx`
- Modify: `components/ReglementInterieur.tsx`
- Modify: `app/(tabs)/options.tsx`
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `useGameState()` → `direction` (`visasAccordes`, `abandons`, `tableau`, `recrutementVisible`, `atelierVisible`, `exemplairesVisible`, `demat`, `acteTermine`, `finActeVue`), `marquerFinActeVue`, `encre`, `notes`, `prixRamette`, `grade`, `etat` ; `BALANCE` (`constants/balance.ts`).
- Produces: `articlesDirection(d, avecNotes, prixRamette): Article[]` ; composant par défaut `FinActe2Modal`.

- [ ] **Step 1: Le règlement intérieur de la Direction**

`components/direction/reglementDirection.ts` :

```ts
import { BALANCE } from '@/constants/balance';
import { formatMontant } from '@/utils/formatters';
import type { VueDirection } from '@/context/GameStateContext';

export interface Article {
  titre: string;
  texte: string;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

/**
 * Règlement intérieur de la Direction (acte II) : un article par mécanique débloquée.
 * Aucun article ne nomme la boucle : le joueur la construit lui-même.
 */
export function articlesDirection(d: VueDirection, avecNotes: boolean, prixRamette: number): Article[] {
  const articles: Article[] = [
    {
      titre: 'Le visa',
      texte: `Chaque coup de tampon accorde un visa en attente. Le nombre de tampons apposés fixe votre grade : chaque grade ajoute ${pct(BALANCE.bonusGrade)} de dotation.`,
    },
    {
      titre: 'Budget et formulaires',
      texte: `Chaque étape franchie rapporte une dotation et consomme un formulaire par exemplaire exigé. Sans formulaires, plus aucune étape n’est franchie.${
        d.recrutementVisible ? ` Les ramettes s’achètent dans l’onglet Service (${formatMontant(prixRamette)} l’une).` : ''
      }`,
    },
    {
      titre: 'Les procédures',
      texte: 'Un dossier franchit les étapes de sa procédure dans l’ordre. Les guichets franchissent toutes les étapes, sauf les visas.',
    },
  ];
  if (d.recrutementVisible) {
    articles.push({
      titre: 'Guichets et agents',
      texte: `Le prix monte à chaque achat. Les agents accordent les visas à votre place ; la vitesse d’un poste double à ${BALANCE.paliersAnciennete.join(', ')} recrues (ancienneté).`,
    });
  }
  if (avecNotes) {
    articles.push({
      titre: 'Notes de service',
      texte: 'Une note approuvée prend effet aussitôt, ou au terme de son délai d’instruction quand elle en a un.',
    });
  }
  articles.push({
    titre: 'Taux de rejet',
    texte: 'Un dossier rejeté en fin de procédure rapporte une prime et repart en tête de sa procédure. Le rejet n’use que la patience des usagers.',
  });
  if (d.atelierVisible) {
    articles.push({
      titre: 'Atelier des procédures',
      texte: 'Le chef de service complète les procédures : ajouter, retirer ou déplacer une étape. Une modification s’applique aussitôt aux dossiers en cours.',
    });
  }
  if (d.exemplairesVisible) {
    articles.push({
      titre: 'Exemplaires exigés',
      texte: 'Chaque étape exige un, deux ou trois exemplaires : plus de dotation et de conformité, plus de formulaires, moins de patience.',
    });
  }
  if (d.demat !== null) {
    articles.push({
      titre: 'Dématérialisation',
      texte: 'Le taux publié par le S.I.C. mesure la part de l’activité de la Direction qui se passe d’usager.',
    });
  }
  return articles;
}
```

Dans `components/ReglementInterieur.tsx`, sous `import { formatEntier, formatMontant } from '@/utils/formatters';`, ajouter :

```tsx
import { articlesDirection } from '@/components/direction/reglementDirection';
```

Remplacer `  const { mods, notes, prixRamette } = useGameState();` par `  const { mods, notes, prixRamette, direction } = useGameState();`. Juste avant le `return (` du composant, ajouter :

```tsx
  // Acte II : le règlement de la Direction remplace celui du guichet 3.
  const affiches = direction ? articlesDirection(direction, notes.length > 0, prixRamette) : articles;

```

Remplacer :

```tsx
        <Text style={styles.reference}>Guichet 3 · {articles.length} articles en vigueur</Text>
```

par :

```tsx
        <Text style={styles.reference}>
          {direction ? 'La Direction' : 'Guichet 3'} · {affiches.length} articles en vigueur
        </Text>
```

et `        articles.map((a, i) => (` par `        affiches.map((a, i) => (`.

- [ ] **Step 2: Le dossier administratif et la démission de l'acte II**

Dans `app/(tabs)/options.tsx`, remplacer `  const { etat, grade, deposerDemission, nouvellePartie, marquerFichePoste } = useGameState();` par :

```tsx
  const { etat, grade, direction, deposerDemission, nouvellePartie, marquerFichePoste } = useGameState();
```

Remplacer tout le tableau `const lignes: [string, string][] = [ … ];` par :

```tsx
  const prime = grade.rang > 0 ? `+${Math.round(grade.bonus * 100)} % de dotation` : 'Néant';
  // Acte II : les compteurs de la Direction ; ceux du guichet 3 restent dans la sauvegarde, sans être montrés.
  const lignes: [string, string][] = direction
    ? [
        ['Agent', agent],
        ['Grade', grade.nom],
        ['Prime d’avancement', prime],
        ['Affectation', 'La Direction'],
        ['Tampons apposés', formatEntier(etat.tampons)],
        ['Visas accordés', formatEntier(direction.visasAccordes)],
        ['Usagers perdus (abandons)', formatEntier(direction.abandons)],
        // Tableau de bord (note n° 16) : il mesure ce qui a été jugé mesurable.
        ...(direction.tableau
          ? ([
              ['Abandons de démarche', formatEntier(direction.tableau.abandonsDemarche)],
              ['Taux de satisfaction', '100 % (sur les usagers restants)'],
            ] as [string, string][])
          : []),
        ['Temps de service', dureeJeu(etat.stats.tempsDeJeu)],
      ]
    : [
        ['Agent', agent],
        ['Grade', grade.nom],
        ['Prime d’avancement', prime],
        ['Affectation', 'Guichet 3'],
        // Même mot, même grandeur que l'en-tête : un tampon apposé = un dossier traité.
        ['Tampons apposés', formatEntier(etat.tampons)],
        ['Dossiers rejetés', formatEntier(Math.floor(etat.stats.rejetes))],
        ['Usagers perdus (abandons)', formatEntier(Math.floor(etat.abandons))],
        ['Temps de service', dureeJeu(etat.stats.tempsDeJeu)],
      ];
```

Remplacer le bouton « Relire ma fiche de poste » :

```tsx
          <Pressable
            style={({ pressed }) => [styles.relire, pressed && styles.presse]}
            accessibilityRole="button"
            accessibilityLabel="Relire ma fiche de poste"
            onPress={() => marquerFichePoste(false)}
          >
            <Text style={styles.relireTexte}>Relire ma fiche de poste</Text>
          </Pressable>
```

par :

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

Remplacer :

```tsx
                Je soussigné·e, {agent}, sollicite la cessation de mes fonctions au guichet 3.
```

par :

```tsx
                Je soussigné·e, {agent}, sollicite la cessation de mes fonctions{' '}
                {direction ? 'à la Direction' : 'au guichet 3'}.
```

La réponse du S.I.C. à la démission (US10) est la lettre `a2-demission` du plan 1 : rien à ajouter ici.

- [ ] **Step 3: L'écran de fin de l'acte II**

`components/direction/FinActe2Modal.tsx` :

```tsx
import React from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useFermetureEchap, useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/** Écran de fin de l'acte II, affiché une fois après la note « Promotion ». Le jeu continue ensuite. */
export default function FinActe2Modal() {
  const { etat, direction, marquerFinActeVue, encre } = useGameState();
  const visible = direction !== null && direction.acteTermine && !direction.finActeVue;
  useFermetureEchap(visible, marquerFinActeVue);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={marquerFinActeVue}>
      <Pressable style={styles.voile} onPress={marquerFinActeVue} accessible={false}>
        <Pressable onPress={() => undefined} accessible={false} style={styles.colonne}>
          <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
            <Text style={styles.sur}>La Direction — rattachée au ministère</Text>
            <Text style={styles.citation}>
              {'«\u00a0La Direction devient une unité du ministère. Vous êtes nommé·e ministre.\u00a0»'}
            </Text>
            <Text style={styles.bilan}>
              {formatEntier(etat.tampons)} tampons apposés · {formatEntier(direction?.visasAccordes ?? 0)} visas
              accordés
            </Text>
            <Text style={styles.fin}>FIN DE L’ACTE II</Text>
            <Text style={styles.suite}>La Direction reste ouverte : vos tampons continuent de compter.</Text>
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

Dans `app/(tabs)/_layout.tsx`, sous `import FinActeModal from '@/components/FinActeModal';`, ajouter `import FinActe2Modal from '@/components/direction/FinActe2Modal';`, et sous `      <FinActeModal />`, ajouter `      <FinActe2Modal />`.

- [ ] **Step 4: Vérifier**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, tests PASS.

Navigateur, 375 × 812 :
1. Acte I (régression) : Options inchangé (Affectation « Guichet 3 », « Dossiers rejetés », « Relire ma fiche de poste », règlement « Guichet 3 · n articles »).
2. Préréglage `debut`, Options : Affectation « La Direction », « Visas accordés », « Usagers perdus (abandons) », pas de « Dossiers rejetés » ni de bouton « Relire ma fiche de poste » ; règlement « La Direction · 5 articles en vigueur » (Le visa, Budget et formulaires, Les procédures, Notes de service, Taux de rejet) ; l'article Taux de rejet se termine par « Le rejet n’use que la patience des usagers. » ; démission « … de mes fonctions à la Direction. ».
3. Préréglage `demat` : « Abandons de démarche » et « Taux de satisfaction 100 % (sur les usagers restants) » ; règlement à 9 articles, aucun ne contient « boucle » (`get_page_text`).
4. Préréglage `fin` : Notes → approuver la note n° 17 « Promotion » : la fenêtre « La Direction — rattachée au ministère », « « La Direction devient une unité du ministère. Vous êtes nommé·e ministre. » », « FIN DE L’ACTE II », bouton bleu « RETOURNER À LA DIRECTION ». La fermer : la partie continue (`acte2.acteTermine` et `acte2.finActeVue` à `true`, `finActeVue` de l'acte I inchangé) ; recharger : la fenêtre ne revient pas. Le courrier contient « Rapport annuel de performance ».

- [ ] **Step 5: Commiter**

```bash
git add components/direction/reglementDirection.ts components/direction/FinActe2Modal.tsx components/ReglementInterieur.tsx "app/(tabs)/options.tsx" "app/(tabs)/_layout.tsx"
git commit -m "feat(ui): dossier administratif, règlement et fin de l'acte II

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Transition de fin d'acte I et vérification d'ensemble

**Files:**
- Modify: `components/FinActeModal.tsx`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `useGameState()` → `etat` (`acte`, `acteTermine`, `tampons`, `stats.rejetes`), `entrerDirection` ; `router` (`expo-router`).
- Produces: la fenêtre de fin d'acte I mène à La Direction.

- [ ] **Step 1: La fenêtre de fin d'acte I mène à La Direction**

Dans `components/FinActeModal.tsx`, remplacer :

```tsx
import React from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
```

par :

```tsx
import React, { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
```

Remplacer :

```tsx
/** Écran de fin de l'acte I, affiché une fois après la « Demande de réaffectation ». */
export default function FinActeModal() {
  const { etat, marquerFinActeVue } = useGameState();
  const visible = etat.acteTermine && !etat.finActeVue;
  useFermetureEchap(visible, marquerFinActeVue);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={marquerFinActeVue}>
      <Pressable style={styles.voile} onPress={marquerFinActeVue} accessible={false}>
```

par :

```tsx
/**
 * Écran de fin de l'acte I, après la « Demande de réaffectation ». Le fermer, de quelque façon que ce soit,
 * c'est prendre ses fonctions à la Direction (acte II) : l'écran revient donc aussi aux anciennes sauvegardes
 * dont l'acte I était terminé.
 */
export default function FinActeModal() {
  const { etat, entrerDirection } = useGameState();
  const visible = etat.acte === 1 && etat.acteTermine;
  const prendreFonctions = useCallback(() => {
    entrerDirection();
    router.navigate('/');
  }, [entrerDirection]);
  useFermetureEchap(visible, prendreFonctions);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={prendreFonctions}>
      <Pressable style={styles.voile} onPress={prendreFonctions} accessible={false}>
```

Remplacer :

```tsx
            <Text style={styles.suite}>L’acte II — Le Service — est en cours d’instruction.</Text>
            <Text style={styles.suite}>En attendant, le guichet 3 reste ouvert : vos tampons continuent de compter.</Text>
            <BoutonPoussoir libelle="RETOURNER AU GUICHET" taille={Typo.titre} hauteur={56} onPress={marquerFinActeVue} />
```

par :

```tsx
            <Text style={styles.suite}>Acte II — La Direction.</Text>
            <BoutonPoussoir
              libelle="PRENDRE MES FONCTIONS"
              taille={Typo.titre}
              hauteur={56}
              couleur={Colors.bleu}
              couleurOmbre={Colors.bleuFlanc}
              onPress={prendreFonctions}
            />
```

La remise à zéro (« Le budget non consommé de l’exercice précédent a été restitué au Trésor ») est annoncée par la lettre « Prise de fonctions », pas par cette fenêtre.

- [ ] **Step 2: Mettre à jour CLAUDE.md**

Dans `CLAUDE.md`, section « Project Overview », remplacer :

```markdown
the code currently implements **Act I — Le Guichet** (spec: `specs/007-acte1-guichet/spec.md`).
```

par :

```markdown
the code currently implements **Act I — Le Guichet** (spec: `specs/007-acte1-guichet/spec.md`) and **Act II — La Direction** without the Réforme yet (spec: `specs/009-acte2-direction/spec.md`; closing the end-of-Act-I window starts it).
```

Section « Commands », sous la ligne `node scripts/simulate-acte2.ts …`, ajouter :

```bash
node --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <preset>   # Prints the localStorage line that loads an Act II test save (finActeI, debut, atelier, boucle, demat, fin)
```

Section « GameStateContext », ajouter en fin de liste :

```markdown
- **Acts:** the game loop, the offline catch-up and every action dispatch on `s.acte`: Act I runs `data/engine.ts`, Act II runs `data/acte2/moteur.ts` (`tick2`, `tamponner2`, `simulerAbsence2` + `lettreAbsence2`); Act I code never runs on an Act II state, and Act I fields kept in the save are never shown at Act II. Screens read Act II through `direction`, `service2` and `atelier` (pure views: `data/acte2/vues.ts`, `data/acte2/vueAtelier.ts`; null at Act I) and the act's ink `encre` (`Encres` in `constants/Colors.ts`: orange, then blue). `FinActeModal` calls `entrerDirection`.
```

Tableau « Data layer files », ajouter :

```markdown
| `data/acte2/vues.ts` | Act II views: Direction screen (parapheur, step chain, Démat.), Service, notes |
| `data/acte2/vueAtelier.ts` | Atelier view: step effects (symbol + word), loops, catalogue |
```

Section « Navigation », sous la ligne de `options.tsx`, ajouter :

```markdown
- At Act II, `index.tsx` shows `components/direction/EcranDirection` (tab « Direction »: resources Budget, Formulaires, Visas, then Démat.; bubble with the parapheur and its procedure as linked mini-cards; `MoteurDirection` scene; Rejet and Exemplaires sliders; blue TAMPONNER), `recruitment.tsx` shows `ServiceDirection` (guichets and agents), and `atelier.tsx` (`components/atelier/`, one procedure per screen, add / remove / move steps, never names the loop) appears after the note « Atelier des procédures ». `FinActe2Modal` closes Act II; the game goes on.
```

- [ ] **Step 3: Vérification d'ensemble**

Run: `./node_modules/.bin/tsc --noEmit -p . && npm run lint && npm test`
Expected: aucune erreur, `ℹ pass 115`, `ℹ fail 0`.

Run: `node scripts/simulate-acte2.ts 2 240`
Expected: jalons à ±1 min de ceux de la Tâche 1 (le plan 2 ne touche pas l'équilibrage).

Run: `npm run build:web`
Expected: export web sans erreur dans `dist/`.

Navigateur, 375 × 812 :
1. Préréglage `finActeI` : la fenêtre « Guichet 3 — archivé … FIN DE L’ACTE I — Acte II — La Direction. » avec « PRENDRE MES FONCTIONS » en bleu. La toucher : écran Direction ; Budget 0 €, Formulaires 300, Visas 12 ; Tampons apposés 160 k inchangé ; aucun collègue de l'acte I visible nulle part (Service caché, Options sans « Dossiers rejetés ») ; l'enveloppe porte « Prise de fonctions » (« … Le budget non consommé de l’exercice précédent a été restitué au Trésor. … »).
2. Recharger `finActeI`, fermer cette fois par Échap : même résultat. Recharger la page ensuite : on reste à l'acte II, la fenêtre ne revient pas.
3. Partie complète accélérée : `debut` → approuver « Prise de fonctions » → acheter des guichets → Notes ; `atelier` → construire Carte d'identité ⇄ Justificatif de domicile avec deux « Pièce délivrée par nos services » (préréglage `boucle` si la note n° 7 manque) → la lettre « Optimisation de vos circuits » arrive, la note n° 10 apparaît ; `demat` → Démat. monte ; `fin` → Promotion → fin de l'acte II.
4. Absence : charger `boucle`, puis dans la page `manifest.webmanifest` reculer `derniereMaj` de 10 minutes (`s.derniereMaj -= 600000`) avant de recharger : une lettre « Pendant votre absence (… min), la Direction a franchi … étapes et perçu … de dotation. » arrive.
5. 375 × 667 : Direction, Service, Atelier et Options utilisables sans débordement horizontal.
6. Revenir au preset `desktop`.

- [ ] **Step 4: Commiter**

```bash
git add components/FinActeModal.tsx CLAUDE.md
git commit -m "feat(ui): la fin de l'acte I mène à La Direction

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-review (couverture de la spec)

| Exigence | Où |
|---|---|
| Entrée : ressources à zéro sauf Tampons, lettre « Prise de fonctions », Guichet 3, Carte d'identité imposée | Plan 1 (`entrerActe2`, `a2-prise`) ; Tâche 10 (transition), Tâche 5 (`entrerDirection`) |
| US1 — collègues à zéro, tickets sans visages, tamponner dès la première seconde | Tâches 1 (`visasInitiaux`), 6 (scène, bulle), 7 et 9 (aucun champ de l'acte I affiché) |
| US2 — même structure, fiches reliées par des trombones, visas qui s'allument, « Aucun visa », « Rupture d'imprimés », pas de défilement | Tâche 6 (questions 1 et 3) |
| US3 — Atelier : onglet débloqué, une procédure par écran, ajouter / retirer / déplacer, effets symbole + mot, pièce de service vers les autres procédures ouvertes, trombone fermé sans le mot « boucle », modification immédiate, 44 pt, boutons monter / descendre | Tâches 3 et 8 |
| US4 — Taux de rejet dès le début, Exemplaires après sa note, dans le panneau | Tâches 5 (`rejet`), 6 |
| US5 — Service : guichets, agents, ramettes, achats en lot | Tâche 7 |
| US6 — Notes : même onglet, mêmes délais | Tâches 2 (`notesAffichees2`), 5, 7 |
| US7 — filet de sécurité | Plan 1 (lettres) ; distribuées par le courrier existant |
| US9 — rapport annuel, note « Promotion », écran de fin, on continue | Plan 1 (lettre) ; Tâche 9 |
| US10 — démission | Plan 1 (`a2-demission`) ; Tâche 9 (texte de la demande) |
| US11 — hors-ligne et lettre au courrier | Tâches 1 (`lettreAbsence2`), 5 |
| Interface : encre bleue, onglets Direction · Service · Notes · Atelier · Options, colonnes Budget, Formulaires, Visas, Démat., bulle du parapheur, scène `MoteurDirection` | Tâches 5, 6, 7, 8 |
| Accessibilité : 44 pt, libellés, jamais la couleur seule, nombres français | Toutes les tâches d'interface |
| Notes vues et fin d'acte vue de l'acte II | Tâches 1, 5 |
| US8, Réforme, Jurisprudence, déjà-vu, Cerfa redemandé, mur | Plan 3 (hors périmètre) |

Vérifications faites sur ce plan : aucune étape sans code ; les noms viennent du moteur livré (`tick2`, `tamponner2`, `simulerAbsence2`, `acheterGuichet`, `acheterAgent2`, `acheterRamettes2`, `requisitionUrgence2`, `reglerTauxRejet2`, `reglerExemplaires`, `modifierProcedure`, `acheterNote2`, `notesVisibles2`, `getModifiers2`, `coutGuichet`, `coutAgent2`, `visasEnAttente`, `usagersEnCours`, `dematerialisation`, `vitesseGuichets`, `vitesseVisas`, `mene`, `estBoucle`, `procsEnBoucle`, `PROC_NOMS`, `ETAPES`, `AGENTS2`, `BALANCE2`) ; types cohérents d'une tâche à l'autre (`VueDirection`, `VueService2`, `UniteAffichee<Id>`, `VueAtelier`, `ProcAtelier`, `EtapeAtelier`, `EffetAffiche`, `ModeFeuille`, `Encre`). Le code de chaque tâche a été appliqué à une copie du worktree : `tsc`, `npm run lint` et `npm test` (115 tests) passent, et les écrans ont été parcourus dans le navigateur à 375 × 812 et 375 × 667 avec les préréglages.
