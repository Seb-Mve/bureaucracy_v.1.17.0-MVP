# Acte II — Le début : du premier visa au premier guichet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire comprendre le début de l'Acte II par le jeu lui-même. Le chef de service arrive **sans guichet**, avec **20 demandes au Visa** : chaque tap vise une demande, consomme un formulaire, délivre une Carte d'identité et rapporte 1,60 € (au grade de départ). Les visas épuisés, plus rien n'arrive sur le bureau : les nouvelles demandes s'entassent à la « Vérification des pièces », TAMPONNER s'éteint, et la note n° 1 « Réouverture du guichet 3 » apparaît (« AAAAH, c'est ça ! ») ; elle ouvre le recrutement, le premier guichet (30 €) est payé par les 20 visas. L'en-tête devient Budget · Formulaires · À viser, la population passe au titre du relevé, un seul mot désigne ce que traite le service : « demande ». Spec (approuvée, contraignante) : `specs/012-acte2-debut/spec.md` ; référence visuelle qui fait foi : `specs/012-acte2-debut/storyboard.html`.

**Architecture:** Tout le calcul reste dans `data/` (fonctions pures, `npm test`). `EtatActe2` gagne un champ, `reouvertureVisible` (la note n° 1 est apparue ; elle le reste), posé par `tick2` quand `reouvertureAttendue` est vraie (plus rien à viser, au moins une demande à la première étape d'une procédure demandée). `tick2` porte aussi le filet `guichetDOffice` : si le budget des 20 visas est parti ailleurs (ramette), le guichet 3 rouvre d'office, la Direction ne reste jamais bloquée. `Events2.delivres` compte les documents remis à des usagers (la bulle montre l'usager qui repart). `data/acte2/vues.ts` choisit la demande de la bulle (au visa, sinon la plus avancée), ce qu'elle attend, son chemin (étapes faites, « ← ici », pictogramme de guichet seulement s'il y en a) et la ligne « 1 500 usagers en ville » ; `data/acte2/production.ts` ajoute « N formulaires la carte » et ne montre valeur, formulaires et abandons qu'avec l'Atelier. Les composants ne font qu'afficher (`useGameState()`), la bulle garde 1,2 s l'usager servi. Une ancienne sauvegarde reçoit `reouvertureVisible: true` (la note y était visible dès l'entrée). Identifiants internes inchangés (`piece`, `pieceService`, `prise`, `parapheur`, lignes de fiche).

**Tech Stack:** TypeScript strict, React Native / Expo 53 (expo-router, lucide-react-native), Node (`node:test`).

## Questions ouvertes pour le porteur de projet

Chaque point est tranché par le défaut indiqué, déjà appliqué dans le plan ; un autre choix ne touche que la tâche citée.

1. **Antériorité (10 guichets offerts) :** la condition « plus rien à viser » pourrait ne jamais se produire (les guichets réalimentent le Visa). *Défaut :* avec des guichets offerts, la note n° 1 est visible dès l'entrée, et la lettre « Prise de fonctions » dit « Vos guichets vous sont confiés à titre d’unités » au lieu de « Le guichet 3 est fermé pour réorganisation » (Tâche 1).
2. **Blocage possible :** mesuré, 20 visas rapportent au moins 32 € (≥ 30 € du guichet), mais jusqu'à 64,08 € au dernier grade avec Ancienneté reconnue, rejet à 50 % et des tirages chanceux — plus qu'une ramette avec Vide juridique (60 €). Acheter cette ramette avant le guichet bloquerait la Direction. *Défaut :* filet silencieux `guichetDOffice` — recrutement ouvert, aucun guichet ni agent, rien à viser, budget < prix du premier guichet → le guichet 3 rouvre d'office (Tâche 1, testé).
3. **Puces du relevé avant l'Atelier :** la planche n'en montre aucune aux moments 2 à 5 et les trois au moment 6. Avant l'Atelier, un tap ne rapporte que la dotation du visa : « +3,20 € la carte » contredirait le « +1,60 € » vu au Budget. *Défaut :* « +X € la carte », « N formulaires la carte » et les abandons apparaissent avec la note « Atelier des procédures » (Tâche 2).
4. **Fiche « Délivrée » :** la planche ne la met au vert qu'au moment de la délivrance (2, après) et la laisse neutre ensuite (3, 5, 6), contrairement à la spec 011 (verte dès la première carte). *Défaut :* la planche — verte, en gras, seulement pendant « Repart avec sa Carte d’identité » (1,2 s) ; `delivrance.faite` disparaît (Tâche 6).
5. **Ce que la spec ne retire pas :** « N demandes · M délivrées » (la planche ne montre « demandes » qu'au moment 2) et les débits signés sous Budget et Formulaires (absents de la planche) sont *conservés*.
6. **Population au relevé :** *défaut :* le titre « Production du service · 1 500 usagers en ville » s'affiche toujours, y compris condensé (375 × 667, trois procédures), sinon la population disparaîtrait de l'écran ; le nombre est la population réelle (1 500 à l'entrée ; le « 70 » de la planche est illustratif) (Tâche 7).
7. **Fiche de poste :** textes fixes « Cartes d’identité », « La carte », même après qu'une Réforme a renommé la procédure (une fiche de poste que personne ne met à jour) ; titres terminés par un point comme sur la planche, lignes Agents et Service des achats comprises (Tâche 4).
8. **Vocabulaire hors périmètre strict :** « Dossier administratif » (titre d'Options, le dossier de l'agent, pas une demande) et tous les textes de l'Acte I sont *conservés* ; la note n° 8 devient « Justificatif délivré par nos services » ; « Dossier déjà instruit » devient « Note déjà instruite » (aux deux actes) ; la lettre d'avancement dit « par demande » à l'Acte II (Tâches 4 et 8).
9. **Détails de la planche repris :** pastille « NOUVEAU » sur la carte Guichet ×0 (et sur un agent tout juste débloqué) ; « 0 étape/s » au singulier ; « ← ici » sur le visa où attend la demande ; coche sur une étape franchie où plus personne n'attend. Le « ×10 609 € » de la planche vaut 613 € (prix arrondi guichet par guichet) (Tâches 2, 6, 7).
10. **Détail de la bulle pour les autres étapes** (non spécifié) : « Attend la signature », « Attend le justificatif exigé », « Attend la fin du délai de réflexion », « Attend la commission » (Tâche 2).

## Global Constraints

- **Base :** branche `feat/acte2-debut` (specs 009 à 011 livrées, spec 012 commitée ; 193 tests verts). Ne jamais faire `git add -A` ni `git add .` : chaque commit liste ses fichiers.
- **Couches strictes :** `components/` et `app/` n'importent jamais `data/` ; tout passe par `useGameState()`, qui réexporte les types (`EtapeChaine`, `ParapheurAffiche`, `VueDirection`…). Constantes de l'Acte II dans `constants/balanceActe2.ts`. L'Acte I (`data/engine.ts`, `constants/balance.ts`) n'est pas modifié ; à l'écran, l'Acte I ne change pas (TAMPONNER garde « AUCUN DOSSIER »).
- **Identifiants internes inchangés :** types d'étape `piece` / `pieceService`, note `prise`, lignes de fiche `circulation` / `guichets` / `dotation`, champ `parapheur`, `PREMIER_PARAPHEUR`. Seul l'affichage change.
- **Ce que l'interface n'ajoute pas** (contraintes permanentes) : ligne d'explication sous un contrôle, bouton « ? », bandeau sur la scène, texte sous TAMPONNER éteint, annulation d'achat. Rien ne nomme la boucle ni la dématérialisation avant leur note.
- **Un seul mot à l'écran de l'Acte II : « demande »** (bulle, fiche, règlement, notes, lettres, accessibilité) ; « pièce » ne désigne plus que la « Vérification des pièces ». Vérifié par `scripts/tests/vocabulaire-acte2.test.ts` (Tâche 4).
- **Charte :** couleurs de `constants/Colors.ts` (encre de l'acte via `encre`), tailles par `Typo`, `Interligne`, `Espace`, `Charte` ; `StyleSheet.create` ; `Pressable` seulement ; composants ≤ ~300 lignes.
- **Accessibilité :** cibles ≥ 44 × 44 pt ; libellé sur chaque bloc ; jamais la couleur seule (étape faite = coche + fond ; « ici » = texte « ← ici » + encre ; « Délivrée » à la délivrance = gras + bord + fond).
- Français, apostrophes typographiques `’`, nombres par `utils/formatters`, espace insécable avant « € ». Pas de `any`. Prettier : guillemets simples, 2 espaces.
- Commits Conventional Commits (`feat(logic)`, `feat(ui)`, `test`, `docs`…), terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Vérifier dans le navigateur (tâches d'interface)

1. **Serveur :** depuis la racine du worktree, `npx expo start --web --port 8085`. Ouvrir `http://localhost:8085` dans le Browser pane (`preview_start` avec l'URL). **Un seul onglet de jeu** : deux onglets se disputeraient la sauvegarde. Si Metro ne voit pas une modification : relancer avec `--clear` (dossier iCloud, voir CLAUDE.md).
2. **Largeur de téléphone :** `resize_window` preset `mobile` (375 × 812) ; écran compact : `resize_window` 375 × 667. Revenir au preset `desktop` à la fin.
3. **Charger un préréglage :** `http://localhost:8085/?test` ouvre « Raccourcis de test » ; toucher la carte, confirmer « Charger » : la partie est remplacée et l'on revient au premier onglet. Préréglages utiles : `debut` (« Acte II — prise de fonctions »), `visasEpuises` (« Acte II — visas épuisés », Tâche 3), `atelier`, `compliquer`, `boucle`. Repli sans l'écran : `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <préréglage>` imprime une ligne `localStorage.setItem(…)` à exécuter avec `javascript_tool` sur `http://localhost:8085/manifest.webmanifest`, puis revenir sur `/`.
4. **Lire l'état :** `javascript_tool` → `JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')).acte2` (écrit au plus une seconde après chaque changement).
5. **Console :** `read_console_messages` avec `onlyErrors: true` vide à la fin de chaque vérification (recharger la page si un ancien bundle avait échoué).

## File Structure

| Fichier | Rôle | Statut |
|---|---|---|
| `types/acte2.ts` | `EtatActe2.reouvertureVisible`, `Events2.delivres` | Modifier |
| `constants/balanceActe2.ts` | `guichetsInitiaux` 0, `fileInitiale` 0, `visasInitiaux` 20 ; noms des étapes `piece` et `pieceService` | Modifier |
| `data/acte2/moteur.ts` | État initial, `reouvertureAttendue`, `guichetDOffice`, fin de `tick2`, `ev.delivres` | Modifier |
| `data/acte2/notes2.ts` | Note n° 1 « Réouverture du guichet 3 » et sa visibilité ; textes sans « dossier » ; note n° 8 renommée | Modifier |
| `data/acte2/courrier2.ts`, `data/courrier.ts` | Lettre « Prise de fonctions » ; vocabulaire | Modifier |
| `data/save.ts` | `reouvertureVisible` complété (vrai) | Modifier |
| `data/acte2/vues.ts` | Demande de la bulle (`demandeEnTete`, `attente`, `repart`, `rang`), chaîne (`pictogramme`, `faite`, `ici`), `ville`, noms d'étapes, description du guichet, `delivrance` sans `faite` | Modifier |
| `data/acte2/production.ts` | `possessif`, `formulairesDocument`, puces avec l'Atelier | Modifier |
| `data/acte2/fiche.ts` | Trois lignes de la spec § 5 | Modifier |
| `data/presets.ts` | `visasEpuises` ; libellés | Modifier |
| `components/direction/reglementDirection.ts` | Vocabulaire | Modifier |
| `context/GameStateContext.tsx` | `Verdict.delivre` | Modifier |
| `components/Hud.tsx` | Colonne « À viser » | Modifier |
| `components/BoutonTamponner.tsx` | Éteint sans texte à l'Acte II | Modifier |
| `components/direction/BulleDirection.tsx` | Bulle qui suit la demande, « Repart avec… » | Réécrire |
| `components/direction/ReleveProduction.tsx` | Titre avec la population | Modifier |
| `components/direction/ServiceDirection.tsx`, `components/service/CarteUnite.tsx` | « étape/s », pastille « NOUVEAU » | Modifier |
| `components/atelier/FicheEtape.tsx`, `FeuilleEtape.tsx`, `BilanProcedure.tsx`, `app/(tabs)/notes.tsx`, `components/scene/ScenePixelDirection.tsx`, `ScenePixelDirection.web.tsx` | Vocabulaire et libellés d'accessibilité | Modifier |
| `scripts/simulate-acte2.ts`, `scripts/save-acte2.ts` | Jalon « premier guichet » ; liste des préréglages | Modifier |
| `scripts/tests/vocabulaire-acte2.test.ts` | Aucun « dossier » ni « parapheur » à l'écran de l'Acte II | Créer |
| `scripts/tests/acte2.test.ts`, `vues-acte2.test.ts`, `releve-acte2.test.ts`, `presets.test.ts`, `reforme.test.ts`, `production-acte2.test.ts`, `fiche-acte2.test.ts`, `atelier-acte2.test.ts` | Mises à jour et nouveaux cas | Modifier |
| `specs/009-acte2-direction/spec.md`, `CLAUDE.md` | Mesures du robot, documentation | Modifier |

Toutes les commandes se lancent depuis la racine du worktree. Avant de commencer : `npm test` doit passer (`ℹ pass 193`). Un fichier de test seul : `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts --test scripts/tests/<fichier>.test.ts`. Les blocs « remplacer … par … » sont exacts au caractère près (le plan a été appliqué tâche par tâche sur une copie du worktree : chaque étape « échoue » puis « passe » avec les nombres annoncés).

---

### Task 1: Démarrage sans guichet, note n° 1 « Réouverture du guichet 3 », filet du premier guichet

**Files:**
- Modify: `constants/balanceActe2.ts` (`fileInitiale`, `visasInitiaux`, `guichetsInitiaux`)
- Modify: `types/acte2.ts` (`EtatActe2`, `Events2`)
- Modify: `data/acte2/moteur.ts` (`etatInitialActe2`, `reouvertureAttendue`, `guichetDOffice`, `evVide`, `franchir`, `tick2`, commentaire de `guichetsOfferts`)
- Modify: `data/acte2/notes2.ts` (note `prise`)
- Modify: `data/acte2/courrier2.ts` (lettre `a2-prise`)
- Modify: `data/save.ts` (`normaliserSauvegarde`)
- Modify: `scripts/tests/acte2.test.ts`, `scripts/tests/reforme.test.ts`, `scripts/tests/production-acte2.test.ts`, `scripts/tests/vues-acte2.test.ts`

**Interfaces:**
- Consumes: `visasEnAttente`, `vitesseVisas`, `coutGuichet`, `guichetsOfferts`, `getModifiers2`, `franchir`, `tick2`, `tamponner2` (`data/acte2/moteur.ts`) ; `PROCS_DEMANDEES`, `BALANCE2` ; `normaliserSauvegarde`, `estSauvegardeValide`.
- Produces: `EtatActe2.reouvertureVisible: boolean` ; `Events2.delivres: number` ; `reouvertureAttendue(x: EtatActe2): boolean` ; `guichetDOffice(s: GameState, m: Modifiers2): boolean` ; `BALANCE2.guichetsInitiaux = 0`, `fileInitiale = 0`, `visasInitiaux = 20` ; note `prise` visible si `reouvertureVisible || guichets > 0`.

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/acte2.test.ts`, remplacer :

```ts
  assert.equal(x(s).guichets, 1);
  assert.deepEqual(
    x(s).procedures.identite.map((e) => e.type),
    ['piece', 'visa'],
  );
  assert.deepEqual(x(s).usagers.identite, [
    BALANCE2.fileInitiale,
    BALANCE2.visasInitiaux,
  ]);
```

par :

```ts
  // specs/012 : aucun guichet, 20 demandes au visa, personne à la vérification des pièces.
  assert.equal(x(s).guichets, 0);
  assert.equal(x(s).reouvertureVisible, false);
  assert.deepEqual(
    x(s).procedures.identite.map((e) => e.type),
    ['piece', 'visa'],
  );
  assert.deepEqual(x(s).usagers.identite, [0, 20]);
```

puis remplacer :

```ts
test('la note n° 1 est visible d’emblée et ouvre le recrutement', () => {
  const s = base2();
  assert.ok(D.notesVisibles2(s).includes('prise'));
  assert.equal(
    D.getModifiers2(D.acheterNote2(s, 'prise', 0), 0).recrutementVisible,
    true,
  );
});
```

par :

```ts
test('la note n° 1 apparaît quand plus rien n’est à viser et qu’une demande attend la vérification des pièces, puis le reste', () => {
  let s = base2();
  assert.ok(!D.notesVisibles2(s).includes('prise'), 'cachée à l’arrivée');
  for (let i = 0; i < BALANCE2.visasInitiaux; i++)
    s = D.tamponner2(s, 0, () => 0.99).s;
  assert.ok(D.visasEnAttente(x(s)) < 1e-9);
  assert.ok(!D.notesVisibles2(s).includes('prise'), 'personne n’attend encore la vérification');
  // Sans guichet, les nouvelles demandes s'entassent à la première étape.
  s = D.tick2(s, 1, 1000).s;
  assert.ok(x(s).usagers.identite[0] >= 1);
  assert.equal(x(s).reouvertureVisible, true);
  assert.ok(D.notesVisibles2(s).includes('prise'));
  // Une demande revenue au visa ne la cache plus.
  s = D.tick2(avec2(s, { usagers: { ...x(s).usagers, identite: [0, 5] } }), 0.1, 1100).s;
  assert.ok(D.notesVisibles2(s).includes('prise'));
  assert.equal(
    D.getModifiers2(D.acheterNote2(s, 'prise', 1100), 1100).recrutementVisible,
    true,
  );
});

test('note n° 1 : visible d’emblée quand des guichets sont offerts (Antériorité)', () => {
  assert.ok(D.notesVisibles2(avec2(base2(), { guichets: 10 })).includes('prise'));
});

test('sans guichet, rien ne bouge tant que le chef de service ne tamponne pas', () => {
  const s0 = base2();
  let s = s0;
  for (let i = 1; i <= 100; i++) s = D.tick2(s, 0.1, i * 100).s;
  assert.equal(s.tampons, s0.tampons);
  assert.equal(s.budget, s0.budget);
  assert.equal(s.formulaires, s0.formulaires);
  assert.equal(D.visasEnAttente(x(s)), BALANCE2.visasInitiaux);
  assert.ok(x(s).usagers.identite[0] > 20, 'les demandes s’entassent à la vérification des pièces');
});

test('20 visas paient le premier guichet ; dépensés en ramettes, le guichet 3 rouvre d’office', () => {
  const coutGuichet = D.coutGuichet(0, 0);
  // Grade de départ, sans Jurisprudence, sans rejet : le minimum.
  let min = { ...base2(), budget: 0, tampons: 0 };
  for (let i = 0; i < BALANCE2.visasInitiaux; i++)
    min = D.tamponner2(min, 0, () => 0.99).s;
  assert.ok(min.budget >= coutGuichet, `${min.budget} < ${coutGuichet}`);
  // Dernier grade, Ancienneté reconnue et Vide juridique, rejet au maximum (la prime s'ajoute) : le maximum.
  let max = {
    ...avec2(base2(), { tauxRejet: BALANCE2.rejetMaxInitial }),
    budget: 0,
    tampons: 1e9,
    reformes: { ...base2().reformes, jurisprudence: ['anciennete', 'videJuridique'] },
  } as GameState;
  for (let i = 0; i < BALANCE2.visasInitiaux; i++)
    max = D.tamponner2(max, 0, () => 0).s;
  // Avec de la chance au rejet, une ramette (60 € avec Vide juridique) devient abordable avant le guichet.
  max = D.tick2(max, 1, 1000).s;
  max = D.acheterNote2(max, 'prise', 1000);
  const ramette = D.acheterRamettes2(max, 1);
  assert.notEqual(ramette, max, 'une ramette achetée');
  assert.ok(ramette.budget < coutGuichet);
  assert.equal(x(ramette).guichets, 0);
  // Plus rien à viser, plus de quoi payer un guichet : il rouvre d'office au tick suivant.
  assert.equal(x(D.tick2(ramette, 0.1, 1100).s).guichets, 1);
  // Jamais tant qu'un guichet est payable.
  assert.equal(x(D.tick2(max, 0.1, 1100).s).guichets, 0);
});

test('un visa compte le document remis à son usager', () => {
  const r = D.tamponner2(base2(), 0, () => 0.99);
  proche(r.ev.delivres, 1 - BALANCE2.abandonParPoint);
  const vide = D.tamponner2(avec2(base2(), { usagers: { ...x(base2()).usagers, identite: [0, 0] } }), 0);
  assert.equal(vide.ev.delivres, 0);
});

test('sauvegarde antérieure à specs/012 : la note n° 1 reste visible', () => {
  const s = base2();
  const { reouvertureVisible: _r, ...reste } = x(s);
  const ancien = { ...s, acte2: reste } as unknown as GameState;
  assert.equal(estSauvegardeValide(ancien), true);
  assert.equal(x(normaliserSauvegarde(ancien)).reouvertureVisible, true);
});
```

puis remplacer :

```ts
test('les guichets franchissent les pièces, jamais les visas', () => {
  // Population = dossiers en cours : aucune nouvelle demande pendant ce tick.
  const s = D.tick2(
    avec2(base2(), { population: BALANCE2.fileInitiale }),
    1,
    1000,
  ).s;
  // La carte est délivrée aux usagers : personne ne s'impatiente en attendant (specs/011).
  proche(x(s).usagers.identite[0], BALANCE2.fileInitiale - 0.5);
```

par :

```ts
test('les guichets franchissent les pièces, jamais les visas', () => {
  // Un guichet ; population = demandes en cours : aucune nouvelle demande pendant ce tick.
  const b = base2();
  const s = D.tick2(
    avec2(b, {
      guichets: 1,
      population: 20 + BALANCE2.visasInitiaux,
      usagers: { ...x(b).usagers, identite: [20, BALANCE2.visasInitiaux] },
    }),
    1,
    1000,
  ).s;
  // La carte est délivrée aux usagers : personne ne s'impatiente en attendant (specs/011).
  proche(x(s).usagers.identite[0], 20 - 0.5);
```

puis remplacer :

```ts
  assert.equal(D.acheterGuichet(s, 0), s);
  assert.equal(x(D.acheterGuichet(avecNotes2(s, ['prise']), 0)).guichets, 2);
  assert.equal(D.coutGuichet(1), 30);
  assert.equal(D.coutGuichet(2), Math.ceil(30 * 1.15));
```

par :

```ts
  assert.equal(D.acheterGuichet(s, 0), s);
  const achete = D.acheterGuichet(avecNotes2(s, ['prise']), 0);
  assert.equal(x(achete).guichets, 1);
  assert.equal(s.budget - achete.budget, 30);
  assert.equal(D.coutGuichet(0), 30);
  assert.equal(D.coutGuichet(1), Math.ceil(30 * 1.15));
```

puis remplacer :

```ts
  const vue = D.marquerNotesVues2(base2());
```

par :

```ts
  const vue = D.marquerNotesVues2(avec2(base2(), { reouvertureVisible: true }));
```

Dans `scripts/tests/reforme.test.ts`, remplacer :

```ts
test('Antériorité : l’acte II commence avec 10 guichets, le suivant au prix du deuxième', () => {
```

par :

```ts
test('Antériorité : l’acte II commence avec 10 guichets et la note n° 1, le suivant au prix du premier', () => {
```

puis remplacer :

```ts
  assert.equal(x(s2).guichets, REFORME.guichetsAnteriorite);
  assert.equal(
    D.coutGuichet(x(s2).guichets, D.guichetsOfferts(s2)),
    D.coutGuichet(1),
  );
```

par :

```ts
  assert.equal(x(s2).guichets, REFORME.guichetsAnteriorite);
  assert.equal(
    D.coutGuichet(x(s2).guichets, D.guichetsOfferts(s2)),
    D.coutGuichet(0),
  );
  assert.ok(D.notesVisibles2(s2).includes('prise'));
```

puis remplacer :

```ts
  const base = avec2(
    D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0),
    {
      population: BALANCE2.fileInitiale,
    },
  );
```

par :

```ts
  const s0 = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  // Un guichet, 20 demandes à la vérification des pièces ; population = demandes en cours (aucune nouvelle).
  const base = avec2(s0, {
    guichets: 1,
    population: 20 + BALANCE2.visasInitiaux,
    usagers: { ...x(s0).usagers, identite: [20, BALANCE2.visasInitiaux] },
  });
```

puis remplacer :

```ts
  const s2 = { ...D.entrerActe2(E.signerCerfa(R.reformer(avantReforme(), 0, zero), 'Camille', 0), 0), budget: 0 };
```

par :

```ts
  const entree = D.entrerActe2(E.signerCerfa(R.reformer(avantReforme(), 0, zero), 'Camille', 0), 0);
  const s2 = { ...avec2(entree, { reouvertureVisible: true }), budget: 0 };
```

puis remplacer :

```ts
  assert.equal(V.vueService2(avecNotes2(anterieur, ['prise']), 0)?.guichet.cout, D.coutGuichet(1));
```

par :

```ts
  assert.equal(V.vueService2(avecNotes2(anterieur, ['prise']), 0)?.guichet.cout, D.coutGuichet(0));
```

Dans `scripts/tests/production-acte2.test.ts`, remplacer :

```ts
  let s = sauvegardePreset('debut', 0);
  s = { ...s, formulaires: 1e9 };
```

par :

```ts
  let s = sauvegardePreset('debut', 0);
  // Le guichet 3 rouvert (specs/012 : la prise de fonctions n'en a plus).
  s = avec2({ ...s, formulaires: 1e9 }, { guichets: 1 });
```

Dans `scripts/tests/vues-acte2.test.ts`, remplacer :

```ts
test('écran Direction à l’entrée : visas du guichet 3, Carte d’identité, pas de dématérialisation', () => {
  const d = vue(base2());
  assert.equal(d.visas, BALANCE2.visasInitiaux);
  assert.equal(d.usagers, BALANCE2.fileInitiale + BALANCE2.visasInitiaux);
  assert.equal(d.guichets, 1);
```

par :

```ts
test('écran Direction à l’entrée : 20 demandes à viser, aucun guichet, Carte d’identité', () => {
  const d = vue(base2());
  assert.equal(d.visas, BALANCE2.visasInitiaux);
  assert.equal(d.usagers, BALANCE2.visasInitiaux);
  assert.equal(d.guichets, 0);
```

puis remplacer :

```ts
  const sv = V.vueService2(s, 0) as V.VueService2;
  assert.equal(sv.guichet.possedes, 1);
  assert.equal(sv.guichet.cout, D.coutGuichet(1));
  // 30 + 35 = 65 ; un troisième (40) dépasserait 99.
  assert.equal(sv.guichet.maxAchetables, 2);
  assert.equal(sv.guichet.coutMax, D.coutGuichet(1) + D.coutGuichet(2));
  let dix = 0;
  for (let i = 0; i < 10; i++) dix += D.coutGuichet(1 + i);
```

par :

```ts
  const sv = V.vueService2(s, 0) as V.VueService2;
  // Aucun guichet à l'entrée (specs/012) : le premier coûte 30 €.
  assert.equal(sv.guichet.possedes, 0);
  assert.equal(sv.guichet.cout, 30);
  // 30 + 35 = 65 ; un troisième (40) dépasserait 99.
  assert.equal(sv.guichet.maxAchetables, 2);
  assert.equal(sv.guichet.coutMax, D.coutGuichet(0) + D.coutGuichet(1));
  let dix = 0;
  for (let i = 0; i < 10; i++) dix += D.coutGuichet(i);
```

puis remplacer :

```ts
  assert.equal(sv.etapesParSeconde, BALANCE2.guichet.vitesse);
```

par :

```ts
  assert.equal(sv.etapesParSeconde, 0);
```

puis remplacer :

```ts
      ['Pièce', BALANCE2.fileInitiale, 'guichets', false, true],
      ['Visa', BALANCE2.visasInitiaux, 'visa', true, false],
```

par :

```ts
      ['Pièce', 0, 'guichets', false, false],
      ['Visa', BALANCE2.visasInitiaux, 'visa', true, true],
```

- [ ] **Step 2: Lancer les tests**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 188`, `ℹ fail 10` (entrée dans l'acte II, note n° 1, « sans guichet, rien ne bouge », « 20 visas paient… », « un visa compte… », sauvegarde antérieure, guichets et note n° 1, écran Direction à l'entrée, Service, tableau de circulation).

- [ ] **Step 3: Implémenter**

Dans `constants/balanceActe2.ts`, remplacer :

```ts
  /** Dossiers d'usagers qui attendent déjà à la Carte d'identité. */
  fileInitiale: 20,
  /** Parapheurs qui attendent déjà le visa du chef de service : il tamponne dès la première seconde. */
  visasInitiaux: 12,
```

par :

```ts
  /** Demandes qui attendent déjà à la première étape de la Carte d'identité : aucune (specs/012). */
  fileInitiale: 0,
  /**
   * Demandes qui attendent déjà le visa du chef de service (specs/012) : il vise dès la première seconde, et ces
   * 20 visas paient le premier guichet (20 × 1,60 € ≥ BALANCE2.guichet.coutBase).
   */
  visasInitiaux: 20,
```

puis remplacer :

```ts
  /** Le guichet 3 de l'acte I, compressé en unité. */
  guichetsInitiaux: 1,
```

par :

```ts
  /** Aucun guichet à l'entrée (specs/012) : le guichet 3 rouvre avec la note n° 1, puis s'achète. */
  guichetsInitiaux: 0,
```

Dans `types/acte2.ts`, remplacer :

```ts
  achatsActifs: boolean;
  stats: StatsActe2;
}
```

par :

```ts
  achatsActifs: boolean;
  /**
   * La note n° 1 « Réouverture du guichet 3 » est apparue (specs/012) : plus rien à viser alors qu'une demande
   * attendait à la première étape. Elle reste visible ensuite.
   */
  reouvertureVisible: boolean;
  stats: StatsActe2;
}
```

puis remplacer :

```ts
  rupture: boolean;
  aucunVisa: boolean;
}
```

par :

```ts
  rupture: boolean;
  aucunVisa: boolean;
  /** Documents remis à des usagers (procédures qu'ils demandent), rejets déduits. */
  delivres: number;
}
```

Dans `data/acte2/moteur.ts`, remplacer :

```ts
/** État de la Direction à l'entrée dans l'acte : le guichet 3 et la procédure du S.I.C. */
```

par :

```ts
/** État de la Direction à l'entrée dans l'acte : aucun guichet, la procédure du S.I.C. et 20 demandes au visa. */
```

puis remplacer :

```ts
    achatsActifs: true,
    stats: {
```

par :

```ts
    achatsActifs: true,
    reouvertureVisible: false,
    stats: {
```

puis remplacer :

```ts
/** Étapes (hors visas) franchies par seconde par les Guichets. */
```

par :

```ts
/**
 * Plus rien à viser, et au moins une demande attend à la première étape d'une procédure que les usagers
 * demandent : la note « Réouverture du guichet 3 » apparaît (specs/012).
 */
export function reouvertureAttendue(x: EtatActe2): boolean {
  let enTete = 0;
  for (const p of PROCS_DEMANDEES) enTete += x.usagers[p][0] ?? 0;
  return visasEnAttente(x) < 1 && enTete >= 1;
}

/**
 * Filet du premier guichet (specs/012) : recrutement ouvert, aucun guichet ni agent, rien à viser et plus de
 * quoi payer un guichet (le budget des 20 visas est parti en ramettes) — le guichet 3 rouvre d'office.
 */
export function guichetDOffice(s: GameState, m: Modifiers2): boolean {
  const x = s.acte2;
  return (
    x !== null &&
    m.recrutementVisible &&
    x.guichets === 0 &&
    vitesseVisas(x) === 0 &&
    visasEnAttente(x) < 1 &&
    s.budget < coutGuichet(0, guichetsOfferts(s))
  );
}

/** Étapes (hors visas) franchies par seconde par les Guichets. */
```

puis remplacer :

```ts
  rupture: false,
  aucunVisa: false,
});
```

par :

```ts
  rupture: false,
  aucunVisa: false,
  delivres: 0,
});
```

puis remplacer :

```ts
    if (PROCS_DEMANDEES.includes(l.p)) delivresUsagers[l.p] += livresU;
    else delivresService[l.p] += livresU;
```

par :

```ts
    if (PROCS_DEMANDEES.includes(l.p)) {
      delivresUsagers[l.p] += livresU;
      ev.delivres += livresU;
    } else delivresService[l.p] += livresU;
```

puis remplacer :

```ts
  const r = franchir(s, lots, enJeu ? m : { ...m, rejetMax: 0 }, maintenant);
  return { s: r.s, ev: { ...r.ev, achats: commande.cout } };
```

par :

```ts
  const r = franchir(s, lots, enJeu ? m : { ...m, rejetMax: 0 }, maintenant);
  // La note « Réouverture du guichet 3 » apparaît quand plus rien n'est à viser ; elle le reste (specs/012).
  // Sans de quoi payer le premier guichet, il rouvre d'office : la Direction ne reste jamais bloquée.
  const y = r.s.acte2 as EtatActe2;
  const apparue = !y.reouvertureVisible && reouvertureAttendue(y);
  const office = guichetDOffice(r.s, m);
  const s1: GameState =
    apparue || office
      ? {
          ...r.s,
          acte2: {
            ...y,
            reouvertureVisible: y.reouvertureVisible || apparue,
            guichets: office ? 1 : y.guichets,
          },
        }
      : r.s;
  return { s: s1, ev: { ...r.ev, achats: commande.cout } };
```

puis remplacer :

```ts
/** Guichets offerts à l'entrée dans l'acte : le guichet 3, ou dix avec Antériorité (Jurisprudence). */
```

par :

```ts
/** Guichets offerts à l'entrée dans l'acte : aucun (specs/012), ou dix avec Antériorité (Jurisprudence). */
```

Dans `data/acte2/notes2.ts`, remplacer :

```ts
    titre: 'Prise de fonctions',
    texte: 'Vous êtes nommé chef de service. Votre bureau sera livré prochainement. Votre bureau, c’est le guichet 3.',
    effet: 'Débloque le recrutement des Guichets.',
    cout: 0,
    instruction: 0,
    visible: si(() => true),
```

par :

```ts
    titre: 'Réouverture du guichet 3',
    texte: 'Les pièces justificatives seront désormais vérifiées au guichet. Le guichet 3 rouvre, sous votre autorité.',
    effet: 'Débloque le recrutement des guichets.',
    cout: 0,
    instruction: 0,
    // Plus rien à viser et des demandes attendent la vérification des pièces (specs/012) ; aussitôt avec des
    // guichets offerts (Antériorité), qui vérifient déjà les pièces.
    visible: si((x) => x.reouvertureVisible || x.guichets > 0),
```

Dans `data/acte2/courrier2.ts`, remplacer :

```ts
      `${nom(s)},\n\nVous êtes nommé·e chef de service.\n\nLe budget non consommé de l’exercice précédent a été restitué au Trésor. Le guichet 3 vous est confié à titre d’unité.`,
```

par :

```ts
      `${nom(s)},\n\nVous êtes nommé·e chef de service.\n\nLe budget non consommé de l’exercice précédent a été restitué au Trésor. ${
        s.acte2 !== null && s.acte2.guichets > 0
          ? 'Vos guichets vous sont confiés à titre d’unités.'
          : 'Le guichet 3 est fermé pour réorganisation.'
      }`,
```

Dans `data/save.ts`, remplacer :

```ts
        achatsActifs: x.achatsActifs ?? true,
```

par :

```ts
        achatsActifs: x.achatsActifs ?? true,
        // Avant specs/012, la note n° 1 était visible dès l'entrée dans l'acte.
        reouvertureVisible: x.reouvertureVisible ?? true,
```

puis remplacer :

```ts
 poursuivent leur procédure (aucun) et les documents délivrés (zéro).
```

par :

```ts
 poursuivent leur procédure (aucun) et les documents délivrés (zéro) ; depuis specs/012, la note n° 1 déjà
 * apparue (elle l'était dès l'entrée).
```

- [ ] **Step 4: Vérifier**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)" && ./node_modules/.bin/tsc --noEmit -p .`
Expected: `ℹ pass 198`, `ℹ fail 0` ; tsc sans erreur.

- [ ] **Step 5: Commiter**

```bash
git add constants/balanceActe2.ts types/acte2.ts data/acte2/moteur.ts data/acte2/notes2.ts data/acte2/courrier2.ts data/save.ts scripts/tests/acte2.test.ts scripts/tests/reforme.test.ts scripts/tests/production-acte2.test.ts scripts/tests/vues-acte2.test.ts
git commit -m "feat(logic): l'acte II démarre sans guichet, 20 demandes au visa, la note n° 1 attend que plus rien ne soit à viser

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: La bulle suit une demande ; relevé « N formulaires la carte »

**Files:**
- Modify: `data/acte2/production.ts` (`possessif`, `formulairesDocument`, `lignesProduction`)
- Modify: `data/acte2/vues.ts` (noms d'étapes, `ATTENTES`, `ParapheurAffiche`, `EtapeChaine`, `VueDirection`, `visasDe`, `demandeEnTete`, `tableauCirculation`, `vueDirection`)
- Modify: `scripts/tests/vues-acte2.test.ts`, `scripts/tests/releve-acte2.test.ts`

**Interfaces:**
- Consumes: `documentDe`, `compte`, `dossiersEnCours`, `valeurDocument` (`production.ts`) ; `tirage`, `demandeur` (`data/usagers.ts`) ; `Modifiers2.atelierVisible`.
- Produces: `possessif(nom: string): 'sa' | 'son'` (type `string`) ; `formulairesDocument(x, p): number` ; `ParapheurAffiche.rang: number`, `.attente: string`, `.repart: string | null` ; `EtapeChaine.pictogramme: 'visa' | 'guichet' | null`, `.faite: boolean`, `.ici: boolean` ; `tableauCirculation(x, p, rang = null)` ; `VueDirection.ville: string` ; `LigneProduction.valeur` = trois puces (valeur, formulaires, abandons) une fois l'Atelier ouvert, sinon `null`. `VueDirection.delivrance` garde `faite` jusqu'à la Tâche 6.

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/vues-acte2.test.ts`, remplacer :

```ts
  assert.equal(d.guichets, 0);
  assert.equal(d.demat, null);
```

par :

```ts
  assert.equal(d.guichets, 0);
  assert.equal(d.ville, `${formatEntier(BALANCE2.populationInitiale)} usagers en ville`);
  assert.equal(d.demat, null);
```

puis remplacer :

```ts
  assert.equal(d.parapheur?.titre, `${d.parapheur?.demandeur} demande une Carte d’identité`);
  assert.deepEqual(d.delivrance, { nom: 'Délivrée', faite: false });
  assert.deepEqual(
    d.etapes.map((e) => [e.nom, e.allumee]),
    [
      ['Pièce', false],
      ['Visa', true],
    ],
  );
```

par :

```ts
  assert.equal(d.parapheur?.titre, `${d.parapheur?.demandeur} demande une Carte d’identité`);
  assert.equal(d.parapheur?.rang, 1);
  assert.equal(d.parapheur?.attente, 'Attend votre visa');
  assert.equal(d.parapheur?.repart, 'Repart avec sa Carte d’identité');
  assert.deepEqual(d.delivrance, { nom: 'Délivrée', faite: false });
  // Ses pièces ont été vérifiées (personne n'y attend) : coche ; le visa est « ici ».
  assert.deepEqual(
    d.etapes.map((e) => [e.nom, e.pictogramme, e.allumee, e.faite, e.ici]),
    [
      ['Vérification des pièces', null, false, true, false],
      ['Visa', 'visa', true, false, true],
    ],
  );
```

puis remplacer :

```ts
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
```

par :

```ts
test('plus rien à viser : la bulle suit la demande qui attend la vérification des pièces ; sans demande, rien', () => {
  const b = base2();
  const sansVisa = avec2(b, { usagers: { ...x(b).usagers, identite: [5, 0] } });
  const d = vue(sansVisa);
  assert.equal(d.parapheur?.rang, 0);
  assert.equal(d.parapheur?.attente, 'Attend la vérification des pièces');
  assert.match(d.parapheur?.titre ?? '', /^(Mme|M\.) .+ demande une Carte d’identité$/);
  // Aucun guichet : pas de pictogramme de guichet ; rien d'allumé, rien de fait.
  assert.deepEqual(
    d.etapes.map((e) => [e.attente, e.pictogramme, e.allumee, e.ici, e.faite]),
    [
      [5, null, false, false, false],
      [0, 'visa', false, false, false],
    ],
  );
  assert.equal(vue(avec2(sansVisa, { guichets: 1 })).etapes[0].pictogramme, 'guichet');
  const vide = avec2(b, { usagers: { ...x(b).usagers, identite: [0, 0] } });
  assert.equal(vue(vide).parapheur, null);
  assert.equal(vue(vide).appel, null);
});
```

puis remplacer :

```ts
  assert.equal(sv.guichet.possedes, 0);
  assert.equal(sv.guichet.cout, 30);
```

par :

```ts
  assert.equal(sv.guichet.possedes, 0);
  assert.equal(sv.guichet.description, 'Vérifie les pièces justificatives.');
  assert.equal(sv.guichet.cout, 30);
```

puis remplacer :

```ts
test('tableau de circulation : dossiers en attente à chaque étape, et qui la traite', () => {
```

par :

```ts
test('tableau de circulation : demandes en attente à chaque étape, et qui la traite', () => {
```

puis remplacer :

```ts
      ['Pièce', 0, 'guichets', false, false],
```

par :

```ts
      ['Vérification des pièces', 0, 'guichets', false, false],
```

Dans `scripts/tests/releve-acte2.test.ts`, remplacer :

```ts
    {
      texte: `+${formatEuros(2 * BALANCE2.dotation)}\u00a0€ la carte`,
      sens: 'plus',
    },
    { texte: '1 abandon', sens: 'moins' },
  ]);
```

par :

```ts
    {
      texte: `+${formatEuros(2 * BALANCE2.dotation)}\u00a0€ la carte`,
      sens: 'plus',
    },
    { texte: '2 formulaires la carte', sens: 'neutre' },
    { texte: '1 abandon', sens: 'moins' },
  ]);
```

puis remplacer :

```ts
test('première carte visée : délivrée, relevé à 1 et fiche « Délivrée » allumée', () => {
```

par :

```ts
test('relevé : valeur, formulaires et abandons seulement une fois l’Atelier ouvert ; formulaires × Exemplaires', () => {
  const b = base2();
  assert.equal((P.lignesProduction(b, 0) as P.LigneProduction[])[0].valeur, null);
  const s = avec2(avecNotes(b, ['atelier', 'signature', 'exemplaires']), {
    procedures: {
      ...x(b).procedures,
      identite: [{ type: 'piece' }, { type: 'signature' }, { type: 'commission' }, { type: 'visa' }],
    },
    usagers: { ...x(b).usagers, identite: [0, 0, 0, 0] },
    boucles: { ...x(b).boucles, identite: [0, 0, 0, 0] },
    suites: { ...x(b).suites, identite: [0, 0, 0, 0] },
    exemplaires: 2,
  });
  assert.equal(P.formulairesDocument(x(s), 'identite'), 8);
  assert.deepEqual(
    (P.lignesProduction(s, 0) as P.LigneProduction[])[0].valeur?.map((e) => e.texte)[1],
    '8 formulaires la carte',
  );
});

test('possessif d’un document : « sa carte », « son titre », « son attestation »', () => {
  assert.equal(P.possessif('Carte d’identité'), 'sa');
  assert.equal(P.possessif('Démarche d’identification citoyenne'), 'sa');
  assert.equal(P.possessif('Titre d’identité simplifié'), 'son');
  assert.equal(P.possessif('Attestation d’hébergement'), 'son');
});

test('première carte visée : délivrée, relevé à 1 et fiche « Délivrée » allumée', () => {
```

- [ ] **Step 2: Lancer les tests**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 193`, `ℹ fail 7`.

- [ ] **Step 3: Implémenter**

Dans `data/acte2/production.ts`, remplacer :

```ts
/** Le mot qui suit un nombre
```

par :

```ts
/** « sa Carte d’identité », « son Titre d’identité simplifié », « son attestation » (élision devant voyelle). */
export function possessif(nom: string): string {
  return documentDe(nom).feminin && !/^[aeiouyhéèêàâîôû]/i.test(nom)
    ? 'sa'
    : 'son';
}

/** Le mot qui suit un nombre
```

puis remplacer :

```ts
/** Dossiers en cours dans une procédure
```

par :

```ts
/** Formulaires qu'exige un document : un par étape et par exemplaire (specs/012). */
export function formulairesDocument(x: EtatActe2, p: ProcId): number {
  return x.procedures[p].length * x.exemplaires;
}

/** Dossiers en cours dans une procédure
```

puis remplacer :

```ts
  /**
   * Procédure que les usagers demandent : valeur d'un document (« +4,48 € la carte ») et usagers perdus
   * (« 12 abandons »), symbole + mot comme les effets de l'Atelier ; null pour les autres procédures.
   */
```

par :

```ts
  /**
   * Procédure que les usagers demandent, une fois l'Atelier ouvert (specs/012) : valeur d'un document
   * (« +4,48 € la carte »), formulaires qu'il exige (« 4 formulaires la carte ») et usagers perdus
   * (« 12 abandons »), symbole + mot comme les effets de l'Atelier ; null sinon.
   */
```

puis remplacer :

```ts
      valeur: demandee
        ? [
            {
              texte: `+${formatEuros(valeurDocument(x, p, m))}\u00a0€ ${doc.article}`,
              sens: 'plus',
            },
            { texte: compte(abandons, 'abandon', 'abandons'), sens: 'moins' },
          ]
        : null,
```

par :

```ts
      // Avant l'Atelier, un tap rapporte la dotation du seul visa : la valeur d'une carte entière tromperait.
      valeur:
        demandee && m.atelierVisible
          ? [
              {
                texte: `+${formatEuros(valeurDocument(x, p, m))}\u00a0€ ${doc.article}`,
                sens: 'plus',
              },
              {
                texte: `${compte(formulairesDocument(x, p), 'formulaire', 'formulaires')} ${doc.article}`,
                sens: 'neutre',
              },
              { texte: compte(abandons, 'abandon', 'abandons'), sens: 'moins' },
            ]
          : null,
```

Dans `data/acte2/vues.ts`, remplacer :

```ts
import { delivresEntiers, documentDe } from './production';
```

par :

```ts
import {
  compte,
  delivresEntiers,
  documentDe,
  dossiersEnCours,
  possessif,
} from './production';
```

puis remplacer :

```ts
/** Numéro du premier parapheur présenté au chef de service (le panneau d'appel affiche le précédent). */
export const PREMIER_PARAPHEUR = 48;

const DESCRIPTION_GUICHET =
  'Le guichet 3 et ses semblables. Joignent les pièces, sans lire.';
/** Noms courts des étapes, pour la chaîne de fiches de la bulle. */
const NOMS_COURTS: Record<EtapeType, string> = {
  piece: 'Pièce',
  visa: 'Visa',
  signature: 'Signature',
  pieceService: 'Pièce de service',
  reflexion: 'Réflexion',
  commission: 'Commission',
};
```

par :

```ts
/** Numéro de la première demande présentée au chef de service (le panneau d'appel affiche la précédente). */
export const PREMIER_PARAPHEUR = 48;

const DESCRIPTION_GUICHET = 'Vérifie les pièces justificatives.';
/** Noms des étapes dans la chaîne de fiches de la bulle (specs/012 : « pièce » ne désigne que la vérification). */
const NOMS_COURTS: Record<EtapeType, string> = {
  piece: 'Vérification des pièces',
  visa: 'Visa',
  signature: 'Signature',
  pieceService: 'Justificatif exigé',
  reflexion: 'Réflexion',
  commission: 'Commission',
};
/** Ce qu'attend la demande de la bulle, selon l'étape où elle se trouve. */
const ATTENTES: Record<EtapeType, string> = {
  piece: 'Attend la vérification des pièces',
  visa: 'Attend votre visa',
  signature: 'Attend la signature',
  pieceService: 'Attend le justificatif exigé',
  reflexion: 'Attend la fin du délai de réflexion',
  commission: 'Attend la commission',
};
```

puis remplacer :

```ts
export interface ParapheurAffiche {
  numero: number;
  proc: ProcId;
  procNom: string;
  /** L'usager qui attend ce document (« Mme Lefèvre »), null pour une demande sans usager. */
  demandeur: string | null;
  /** « Mme Lefèvre demande une Carte d’identité », ou « Demande n° 9 907 · Carte d’identité ». */
  titre: string;
}
```

par :

```ts
/** La demande de la bulle (le nom « parapheur » reste interne : à l'écran, c'est une demande). */
export interface ParapheurAffiche {
  numero: number;
  proc: ProcId;
  procNom: string;
  /** L'usager qui attend ce document (« Mme Lefèvre »), null pour une demande sans usager. */
  demandeur: string | null;
  /** « Mme Lefèvre demande une Carte d’identité », ou « Demande n° 9 907 · Carte d’identité ». */
  titre: string;
  /** Rang de l'étape où elle attend. */
  rang: number;
  /** « Attend votre visa », « Attend la vérification des pièces »… */
  attente: string;
  /** Juste après sa délivrance : « Repart avec sa Carte d’identité » (null sans usager). */
  repart: string | null;
}
```

puis remplacer :

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

par :

```ts
/**
 * Une fiche du tableau de circulation (bulle) : les demandes qui attendent à cette étape et qui la traite.
 * Un visa en attente « s'allume » ; la fiche la plus encombrée est marquée ; une étape que la demande de la
 * bulle a franchie et où plus personne n'attend est « faite ».
 */
export interface EtapeChaine {
  type: EtapeType;
  nom: string;
  /** Demandes (usagers et sans usager) qui attendent à cette étape. */
  attente: number;
  /** Qui franchit l'étape : les guichets, ou le chef de service et ses agents (visa). */
  traitePar: 'guichets' | 'visa';
  /** Pictogramme : tampon (visa), guichet, ou aucun tant que le service n'a pas de guichet (specs/012). */
  pictogramme: 'visa' | 'guichet' | null;
  /** Visa avec au moins une demande en attente. */
  allumee: boolean;
  /** L'étape où attendent le plus de demandes (au moins une ; la première en cas d'égalité). */
  encombree: boolean;
  /** Franchie par la demande de la bulle, et plus personne n'y attend (coche, fond vert). */
  faite: boolean;
  /** Le visa où attend la demande de la bulle : « ← ici ». */
  ici: boolean;
}
```

puis remplacer :

```ts
  visas: number;
  /** Usagers qui ont une démarche en cours (colonne Usagers de l'en-tête, salle de la scène). */
  usagers: number;
```

par :

```ts
  /** Demandes qui attendent un visa (colonne « À viser » de l'en-tête). */
  visas: number;
  /** Usagers qui ont une démarche en cours (salle de la scène). */
  usagers: number;
  /** « 1 500 usagers en ville » : habitants de la ville, au titre du relevé (specs/012). */
  ville: string;
```

puis remplacer :

```ts
  /** Étapes de la procédure du parapheur (Carte d'identité s'il n'y en a pas). */
```

par :

```ts
  /** Étapes de la procédure de la demande (Carte d'identité s'il n'y en a pas). */
```

puis remplacer :

```ts
/** Dossiers d'usagers et dossiers en boucle qui attendent un visa dans la procédure `p`. */
function visasDe(x: EtatActe2, p: ProcId): { u: number; b: number } {
  let u = 0;
  let b = 0;
  x.procedures[p].forEach((e, k) => {
    if (e.type !== 'visa') return;
    u += x.usagers[p][k];
    b += x.boucles[p][k] + x.suites[p][k];
  });
  return { u, b };
}

/** Tableau de circulation d'une procédure : dossiers en attente à chaque étape, et qui la traite. */
export function tableauCirculation(x: EtatActe2, p: ProcId): EtapeChaine[] {
  const attentes = x.procedures[p].map((_, k) =>
    Math.floor(x.usagers[p][k] + x.boucles[p][k] + x.suites[p][k]),
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
```

par :

```ts
/** Une demande en tête : sa procédure, le rang de son étape, et ce qui y attend (`u` usagers, `b` sans usager). */
interface Tete {
  p: ProcId;
  k: number;
  u: number;
  b: number;
}

/** Demandes qui attendent un visa dans la procédure `p`, et le visa le plus chargé. */
function visasDe(x: EtatActe2, p: ProcId): Tete {
  const t: Tete = { p, k: -1, u: 0, b: 0 };
  let max = -1;
  x.procedures[p].forEach((e, k) => {
    if (e.type !== 'visa') return;
    const u = x.usagers[p][k];
    const b = x.boucles[p][k] + x.suites[p][k];
    t.u += u;
    t.b += b;
    if (u + b > max) {
      max = u + b;
      t.k = k;
    }
  });
  return t;
}

/**
 * La demande de la bulle : au visa s'il y en a (procédure qui en a le plus) ; sinon, dans la procédure la plus
 * chargée, la plus proche du bureau (la dernière étape où quelqu'un attend). Null : aucune demande nulle part.
 */
function demandeEnTete(x: EtatActe2, ouvertes: ProcId[]): Tete | null {
  let tete: Tete | null = null;
  for (const p of ouvertes) {
    const v = visasDe(x, p);
    if (v.u + v.b >= 1 && (!tete || v.u + v.b > tete.u + tete.b)) tete = v;
  }
  if (tete) return tete;
  let charge = 0;
  for (const p of ouvertes) {
    const total = dossiersEnCours(x, p);
    if (total <= charge) continue;
    for (let k = x.procedures[p].length - 1; k >= 0; k--) {
      const u = x.usagers[p][k];
      const b = x.boucles[p][k] + x.suites[p][k];
      if (u + b >= 1) {
        tete = { p, k, u, b };
        charge = total;
        break;
      }
    }
  }
  return tete;
}

/**
 * Tableau de circulation d'une procédure : demandes en attente à chaque étape, qui la traite, et le chemin de
 * la demande de la bulle (`rang` : son étape, null s'il n'y en a pas).
 */
export function tableauCirculation(
  x: EtatActe2,
  p: ProcId,
  rang: number | null = null,
): EtapeChaine[] {
  const attentes = x.procedures[p].map((_, k) =>
    Math.floor(x.usagers[p][k] + x.boucles[p][k] + x.suites[p][k]),
  );
  const max = Math.max(...attentes);
  const rangMax = max >= 1 ? attentes.indexOf(max) : -1;
  return x.procedures[p].map((e, k) => {
    const visa = e.type === 'visa';
    return {
      type: e.type,
      nom: NOMS_COURTS[e.type],
      attente: attentes[k],
      traitePar: visa ? 'visa' : 'guichets',
      pictogramme: visa ? 'visa' : x.guichets > 0 ? 'guichet' : null,
      allumee: visa && attentes[k] >= 1,
      encombree: k === rangMax,
      faite: rang !== null && k < rang && attentes[k] === 0,
      ici: visa && k === rang && attentes[k] >= 1,
    };
  });
}
```

puis remplacer :

```ts
/** Écran Direction : ressources, parapheur à viser, scène et curseurs. Null hors de l'acte II. */
```

par :

```ts
/** Écran Direction : ressources, demande de la bulle, scène et curseurs. Null hors de l'acte II. */
```

puis remplacer :

```ts
  const numero = PREMIER_PARAPHEUR + Math.floor(x.stats.visasTampons);
  // Le parapheur en tête vient de la procédure qui a le plus de visas en attente.
  let tete: { p: ProcId; u: number; b: number } | null = null;
  for (const p of m.procsOuvertes) {
    const v = visasDe(x, p);
    if (v.u + v.b >= 1 && (!tete || v.u + v.b > tete.u + tete.b))
      tete = { p, ...v };
  }
  const p: ProcId = tete?.p ?? 'identite';
```

par :

```ts
  const numero = PREMIER_PARAPHEUR + Math.floor(x.stats.visasTampons);
  const tete = demandeEnTete(x, m.procsOuvertes);
  const p: ProcId = tete?.p ?? 'identite';
```

puis remplacer :

```ts
    // Un usager attend ce parapheur selon la part des dossiers d'usagers à ce visa (tirage stable par numéro),
    // et seulement dans une procédure que les usagers demandent.
```

par :

```ts
    // Un usager attend cette demande selon la part des demandes d'usagers à son étape (tirage stable par numéro),
    // et seulement dans une procédure que les usagers demandent.
```

puis remplacer :

```ts
      titre: qui
        ? `${qui} demande ${documentDe(nom).feminin ? 'une' : 'un'} ${nom}`
        : `Demande n° ${numeroRegistre(numero)} · ${nom}`,
    };
```

par :

```ts
      titre: qui
        ? `${qui} demande ${documentDe(nom).feminin ? 'une' : 'un'} ${nom}`
        : `Demande n° ${numeroRegistre(numero)} · ${nom}`,
      rang: tete.k,
      attente: ATTENTES[x.procedures[tete.p][tete.k].type],
      repart: qui ? `Repart avec ${possessif(nom)} ${nom}` : null,
    };
```

puis remplacer :

```ts
    visas: Math.floor(visasEnAttente(x)),
    usagers,
```

par :

```ts
    visas: Math.floor(visasEnAttente(x)),
    usagers,
    ville: `${compte(x.population, 'usager', 'usagers')} en ville`,
```

puis remplacer :

```ts
    etapes: tableauCirculation(x, p),
```

par :

```ts
    etapes: tableauCirculation(x, p, tete?.k ?? null),
```

- [ ] **Step 4: Vérifier**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)" && ./node_modules/.bin/tsc --noEmit -p .`
Expected: `ℹ pass 200`, `ℹ fail 0` ; tsc sans erreur (la bulle actuelle affiche déjà les nouveaux noms d'étapes ; elle est réécrite à la Tâche 6).

- [ ] **Step 5: Commiter**

```bash
git add data/acte2/production.ts data/acte2/vues.ts scripts/tests/vues-acte2.test.ts scripts/tests/releve-acte2.test.ts
git commit -m "feat(logic): la bulle suit une demande, et le relevé dit combien de formulaires coûte une carte

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Raccourci « Acte II — visas épuisés »

**Files:**
- Modify: `data/presets.ts` (`Preset`, `PRESETS_INFO`, `NOTES`, `epuiserVisas`, `sauvegardePreset`)
- Modify: `scripts/save-acte2.ts` (commentaire)
- Modify: `scripts/tests/presets.test.ts`

**Interfaces:**
- Consumes: `tamponner2`, `tick2` (Tâche 1), `marquerFiche2`.
- Produces: préréglage `visasEpuises` (après `debut`) : aucun guichet, À viser 0, demandes à la vérification des pièces, `reouvertureVisible` vrai, note n° 1 non vue, fiche lue, courrier réputé envoyé ; `debut` décrit « aucun guichet, 20 demandes à viser ».

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/presets.test.ts`, remplacer :

```ts
  debut: 2,
  atelier: 2,
```

par :

```ts
  debut: 2,
  visasEpuises: 2,
  atelier: 2,
```

puis remplacer :

```ts
    'debut',
    'atelier',
    'compliquer',
```

par :

```ts
    'debut',
    'visasEpuises',
    'atelier',
    'compliquer',
```

puis remplacer :

```ts
test('raccourci « pièce de nos services » : il ne reste qu’à exiger un justificatif', () => {
```

par :

```ts
test('raccourci « prise de fonctions » : aucun guichet, 20 demandes à viser, note n° 1 cachée', () => {
  const s = sauvegardePreset('debut', T);
  assert.equal(x2(s).guichets, 0);
  assert.equal(D.visasEnAttente(x2(s)), 20);
  assert.ok(!D.notesVisibles2(s).includes('prise'));
});

test('raccourci « visas épuisés » : À viser 0, demandes à la vérification des pièces, note n° 1 visible et nouvelle', () => {
  const s = sauvegardePreset('visasEpuises', T);
  assert.equal(x2(s).guichets, 0);
  assert.ok(D.visasEnAttente(x2(s)) < 1);
  assert.ok(x2(s).usagers.identite[0] >= 1);
  assert.equal(x2(s).reouvertureVisible, true);
  assert.ok(D.notesVisibles2(s).includes('prise'));
  assert.deepEqual(x2(s).notesVues, []);
  assert.ok(s.budget >= D.coutGuichet(0), 'de quoi payer le premier guichet');
  assert.equal(F.vueFiche2(s, T)?.visible, false);
  assert.deepEqual(nouvellesLettres(s, T), []);
});

test('raccourci « pièce de nos services » : il ne reste qu’à exiger un justificatif', () => {
```

- [ ] **Step 2: Lancer les tests**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 200`, `ℹ fail 2` (ordre des préréglages, « visas épuisés »).

- [ ] **Step 3: Implémenter**

Dans `data/presets.ts`, remplacer :

```ts
  | 'debut'
  | 'atelier'
```

par :

```ts
  | 'debut'
  | 'visasEpuises'
  | 'atelier'
```

puis remplacer :

```ts
  { id: 'debut', titre: 'Acte II — prise de fonctions', detail: 'Entrée à la Direction' },
```

par :

```ts
  {
    id: 'debut',
    titre: 'Acte II — prise de fonctions',
    detail: 'Entrée à la Direction, aucun guichet, 20 demandes à viser',
  },
  {
    id: 'visasEpuises',
    titre: 'Acte II — visas épuisés',
    detail: 'À viser 0, demandes bloquées à la vérification des pièces, note n° 1 visible',
  },
```

puis remplacer :

```ts
  debut: [],
  atelier: NOTES_ATELIER,
```

par :

```ts
  debut: [],
  visasEpuises: [],
  atelier: NOTES_ATELIER,
```

puis remplacer :

```ts
/** Sauvegarde du préréglage, horodatée
```

par :

```ts
/**
 * Les 20 visas de l'arrivée accordés un par un, puis 5 s sans guichet : plus rien à viser, les nouvelles
 * demandes attendent la vérification des pièces et la note « Réouverture du guichet 3 » est apparue.
 */
function epuiserVisas(s0: GameState, maintenant: number): GameState {
  let s = s0;
  for (let i = 0; i < BALANCE2.visasInitiaux; i++)
    s = D.tamponner2(s, maintenant, () => 0.99).s;
  return D.tick2(s, 5, maintenant).s;
}

/** Sauvegarde du préréglage, horodatée
```

puis remplacer :

```ts
  if (preset !== 'debut') s = marquerFiche2(s, true, maintenant);
```

par :

```ts
  if (preset !== 'debut') s = marquerFiche2(s, true, maintenant);
  if (preset === 'visasEpuises') s = epuiserVisas(s, maintenant);
```

Dans `scripts/save-acte2.ts`, remplacer :

```ts
 * Préréglages : acte1Debut, acte1Milieu, finActeI, debut, atelier, compliquer, achats, pieceService, avantBoucle,
 * boucle, demat, fin, reforme, cerfa2
```

par :

```ts
 * Préréglages : acte1Debut, acte1Milieu, finActeI, debut, visasEpuises, atelier, compliquer, achats, pieceService,
 * avantBoucle, boucle, demat, fin, reforme, cerfa2
```

- [ ] **Step 4: Vérifier**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)" && ./node_modules/.bin/tsc --noEmit -p .`
Expected: `ℹ pass 202`, `ℹ fail 0` ; tsc sans erreur.

Navigateur (procédure « Vérifier dans le navigateur »), 375 × 812 : `http://localhost:8085/?test` montre quinze cartes, « Acte II — visas épuisés · À viser 0, demandes bloquées à la vérification des pièces, note n° 1 visible » juste après « Acte II — prise de fonctions » ; la charger : l'onglet Notes apparaît avec la pastille « 1 » ; `javascript_tool` → `JSON.parse(localStorage.getItem('bureaucracy_acte1_v1')).acte2.reouvertureVisible` vaut `true`. Console sans erreur.

- [ ] **Step 5: Commiter**

```bash
git add data/presets.ts scripts/save-acte2.ts scripts/tests/presets.test.ts
git commit -m "feat(logic): raccourci de test « visas épuisés », la prise de fonctions sans guichet

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Un seul mot, « demande » ; étapes renommées ; fiche de poste

**Files:**
- Create: `scripts/tests/vocabulaire-acte2.test.ts`
- Modify: `constants/balanceActe2.ts` (`ETAPES.piece`, `ETAPES.pieceService`, commentaire `filetMinutes`), `types/acte2.ts` (commentaire `Etape.exige`)
- Modify: `data/acte2/notes2.ts`, `data/acte2/courrier2.ts`, `data/courrier.ts`, `data/acte2/fiche.ts`, `components/direction/reglementDirection.ts`, `data/presets.ts`
- Modify: `scripts/tests/fiche-acte2.test.ts`, `scripts/tests/atelier-acte2.test.ts`, `scripts/tests/acte2.test.ts`, `scripts/tests/presets.test.ts`

**Interfaces:**
- Consumes: `vueDirection`, `vueService2`, `vueFiche2`, `lignesProduction` (Tâche 2) ; `articlesDirection` ; `LETTRES_ACTE2`, `lettreAbsence2` ; `PRESETS_INFO`, `sauvegardePreset` (Tâche 3).
- Produces: `ETAPES.piece.nom = 'Vérification des pièces'`, `ETAPES.pieceService.nom = 'Justificatif exigé'` (l'Atelier et son catalogue suivent) ; fiche § 5 ; aucun texte de l'Acte II avec « dossier » ou « parapheur ».

- [ ] **Step 1: Écrire les tests (ils échouent)**

Créer `scripts/tests/vocabulaire-acte2.test.ts` :

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../../data/acte2/vues';
import * as F from '../../data/acte2/fiche';
import * as P from '../../data/acte2/production';
import { NOTES2 } from '../../data/acte2/notes2';
import { LETTRES_ACTE2, lettreAbsence2 } from '../../data/acte2/courrier2';
import { PRESETS_INFO, sauvegardePreset, type Preset } from '../../data/presets';
import { ETAPES } from '../../constants/balanceActe2';
import { articlesDirection } from '../../components/direction/reglementDirection';
import type { GameState } from '../../types/game';

const T = 1_000_000_000;
const INTERDITS = /dossier|parapheur/i;
/** Des moments de l'acte II, de la prise de fonctions à la fin. */
const MOMENTS: Preset[] = ['debut', 'visasEpuises', 'atelier', 'achats', 'avantBoucle', 'boucle', 'fin'];

/** Tout ce que l'acte II écrit à l'écran pour une partie donnée (hors noms propres). */
function textesEcran(s: GameState): string[] {
  const d = V.vueDirection(s, T);
  const sv = V.vueService2(s, T);
  const f = F.vueFiche2(s, T);
  const lignes = P.lignesProduction(s, T) ?? [];
  return [
    ...(d
      ? [
          d.parapheur?.titre ?? '',
          d.parapheur?.attente ?? '',
          d.parapheur?.repart ?? '',
          d.ville,
          d.delivrance.nom,
          ...d.etapes.map((e) => e.nom),
          ...articlesDirection(d, true, 80).flatMap((a) => [a.titre, a.texte]),
        ]
      : []),
    ...(sv ? [sv.guichet.description, ...sv.agents.map((a) => a.description)] : []),
    ...(f ? f.lignes.flatMap((l) => [l.titre, l.texte]) : []),
    ...lignes.flatMap((l) => [l.demandesTexte, l.delivresTexte, ...(l.valeur ?? []).map((e) => e.texte)]),
    ...LETTRES_ACTE2.map((l) => `${l.objet} ${l.corps(s)}`),
  ];
}

test('acte II : un seul mot, « demande » — ni dossier ni parapheur à l’écran', () => {
  const fixes = [
    ...NOTES2.flatMap((n) => [n.titre, n.texte, n.effet]),
    ...Object.values(ETAPES).flatMap((e) => [e.nom, e.description]),
    lettreAbsence2(3600, 100, 200, T).corps,
    ...PRESETS_INFO.filter((p) => p.titre.startsWith('Acte II')).flatMap((p) => [p.titre, p.detail]),
  ];
  for (const t of fixes) assert.ok(!INTERDITS.test(t), t);
  for (const p of MOMENTS)
    for (const t of textesEcran(sauvegardePreset(p, T))) assert.ok(!INTERDITS.test(t), `${p} : ${t}`);
});

test('étapes renommées : « pièce » ne désigne plus que la vérification', () => {
  assert.equal(ETAPES.piece.nom, 'Vérification des pièces');
  assert.equal(ETAPES.pieceService.nom, 'Justificatif exigé');
  for (const e of Object.values(ETAPES))
    if (e.type !== 'piece') assert.ok(!/pièce/i.test(e.nom), e.nom);
});
```

Dans `scripts/tests/fiche-acte2.test.ts`, remplacer :

```ts
    [
      'Les dossiers circulent d’étape en étape',
      'Vous visez les parapheurs',
      'Chaque étape consomme des formulaires',
    ],
  );
```

par :

```ts
    [
      'Les usagers demandent des Cartes d’identité.',
      'Vous tamponnez le dernier : le visa.',
      'Chaque carte délivrée rapporte une dotation.',
    ],
  );
  assert.deepEqual(
    f.lignes.map((l) => l.texte),
    [
      'Chaque demande est une liasse de formulaires, un par étape.',
      'La carte est délivrée à l’usager.',
      'Plus elle exige de formulaires, plus elle rapporte.',
    ],
  );
```

puis remplacer :

```ts
      `la fiche explique un arbitrage ou nomme la boucle : ${l.id}`,
    );
```

par :

```ts
      `la fiche explique un arbitrage ou nomme la boucle : ${l.id}`,
    );
    assert.ok(
      !/dossier|parapheur/i.test(l.titre + l.texte),
      `un seul mot, « demande » : ${l.id}`,
    );
```

Dans `scripts/tests/atelier-acte2.test.ts`, remplacer :

```ts
    ['Pièce justificative', 'Visa'],
```

par :

```ts
    ['Vérification des pièces', 'Visa'],
```

Dans `scripts/tests/acte2.test.ts`, remplacer :

```ts
test('l’Atelier ouvre le Justificatif de domicile et la Pièce justificative', () => {
```

par :

```ts
test('l’Atelier ouvre le Justificatif de domicile et la Vérification des pièces', () => {
```

Dans `scripts/tests/presets.test.ts`, remplacer :

```ts
test('raccourci « pièce de nos services » : il ne reste qu’à exiger un justificatif', () => {
```

par :

```ts
test('raccourci « justificatif exigé » : il ne reste qu’à exiger un justificatif', () => {
```

- [ ] **Step 2: Lancer les tests**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 199`, `ℹ fail 5` (vocabulaire, étapes renommées, deux tests de fiche, Atelier).

- [ ] **Step 3: Implémenter**

Dans `constants/balanceActe2.ts`, remplacer :

```ts
    nom: 'Pièce justificative',
    description: 'Une pièce de plus. Elle justifie la suivante.',
```

par :

```ts
    nom: 'Vérification des pièces',
    description: 'Une vérification de plus. Elle justifie la suivante.',
```

puis remplacer :

```ts
    nom: 'Pièce délivrée par nos services',
```

par :

```ts
    nom: 'Justificatif exigé',
```

puis remplacer :

```ts
  /** Délai du filet de sécurité après la note « Pièce délivrée par nos services » (min). */
```

par :

```ts
  /** Délai du filet de sécurité après la note « Justificatif délivré par nos services » (min). */
```

Dans `types/acte2.ts`, remplacer :

```ts
  /** Procédure exigée (étape « Pièce délivrée par nos services » seulement). */
```

par :

```ts
  /** Procédure exigée (étape « Justificatif exigé » seulement). */
```

Dans `data/acte2/notes2.ts`, remplacer :

```ts
l’étape Pièce justificative.'
```

par :

```ts
l’étape Vérification des pièces.'
```

puis remplacer :

```ts
qu’aux dossiers incomplets, c’est-à-dire à tous.'
```

par :

```ts
qu’aux demandes incomplètes, c’est-à-dire à toutes.'
```

puis remplacer :

```ts
examinera les dossiers dès que
```

par :

```ts
examinera les demandes dès que
```

puis remplacer :

```ts
    titre: 'Pièce délivrée par nos services',
```

par :

```ts
    titre: 'Justificatif délivré par nos services',
```

puis remplacer :

```ts
    effet: 'Débloque l’étape Pièce délivrée par nos services.',
```

par :

```ts
    effet: 'Débloque l’étape Justificatif exigé.',
```

Dans `data/acte2/courrier2.ts`, remplacer :

```ts
pourrait exiger une pièce délivrée par la procédure
```

par :

```ts
pourrait exiger un justificatif délivré par la procédure
```

puis remplacer :

```ts
Pièce manquante : justificatif de conformité
```

par :

```ts
Justificatif manquant : attestation de conformité
```

puis remplacer :

```ts
Aucun dossier n’a été rejeté
```

par :

```ts
Aucune demande n’a été rejetée
```

Dans `data/courrier.ts`, remplacer :

```ts
% par dossier.`,
  declencheur: (s: GameState) => rangGrade(s.tampons) >= i + 1,
```

par :

```ts
% par ${s.acte === 2 ? 'demande' : 'dossier'}.`,
  declencheur: (s: GameState) => rangGrade(s.tampons) >= i + 1,
```

Dans `data/acte2/fiche.ts`, remplacer :

```ts
 * de fonctions, se relit depuis Options ; trois lignes d'orientation, puis les agents et le service des achats
 * à leur note (specs/011 : aucune ligne n'explique un arbitrage). Rien ne nomme la boucle ni la dématérialisation.
```

par :

```ts
 * de fonctions, se relit depuis Options ; trois lignes d'orientation (specs/012 : la demande, le visa, la dotation),
 * puis les agents et le service des achats à leur note (aucune ligne n'explique un arbitrage). Rien ne nomme la
 * boucle ni la dématérialisation ; le seul mot pour ce que le service traite est « demande ».
```

puis remplacer :

```ts
    titre: 'Les dossiers circulent d’étape en étape',
    texte:
      'Chaque procédure est une suite d’étapes. Un dossier les franchit dans l’ordre, sans exception.',
```

par :

```ts
    titre: 'Les usagers demandent des Cartes d’identité.',
    texte: 'Chaque demande est une liasse de formulaires, un par étape.',
```

puis remplacer :

```ts
    titre: 'Vous visez les parapheurs',
    texte:
      'Chaque tap accorde un visa en attente. Les guichets traitent le reste.',
```

par :

```ts
    titre: 'Vous tamponnez le dernier : le visa.',
    texte: 'La carte est délivrée à l’usager.',
```

puis remplacer :

```ts
    titre: 'Chaque étape consomme des formulaires',
    texte: 'Sans formulaires, plus aucune étape ne se franchit.',
```

par :

```ts
    titre: 'Chaque carte délivrée rapporte une dotation.',
    texte: 'Plus elle exige de formulaires, plus elle rapporte.',
```

puis remplacer :

```ts
    titre: 'Les agents visent à votre place',
```

par :

```ts
    titre: 'Les agents visent à votre place.',
```

puis remplacer :

```ts
    titre: 'Les fournitures sont commandées par le service des achats',
```

par :

```ts
    titre: 'Les fournitures sont commandées par le service des achats.',
```

Dans `components/direction/reglementDirection.ts`, remplacer :

```ts
      texte: `Chaque coup de tampon accorde un visa en attente. Le nombre
```

par :

```ts
      texte: `Chaque coup de tampon vise une demande en attente. Le nombre
```

puis remplacer :

```ts
        'Un dossier franchit les étapes de sa procédure dans l’ordre. Les guichets
```

par :

```ts
        'Une demande franchit les étapes de sa procédure dans l’ordre. Les guichets
```

puis remplacer :

```ts
      'Un dossier rejeté en fin de procédure rapporte
```

par :

```ts
      'Une demande rejetée en fin de procédure rapporte
```

puis remplacer :

```ts
Une modification s’applique aussitôt aux dossiers en cours.',
```

par :

```ts
Une modification s’applique aussitôt aux demandes en cours.',
```

Dans `data/presets.ts`, remplacer :

```ts
    titre: 'Acte II — pièce de nos services',
```

par :

```ts
    titre: 'Acte II — justificatif exigé',
```

- [ ] **Step 4: Vérifier**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)" && ./node_modules/.bin/tsc --noEmit -p . && grep -rniE "dossier|parapheur" data/acte2/notes2.ts data/acte2/courrier2.ts data/acte2/fiche.ts components/direction/reglementDirection.ts | grep -vE "^[^:]+:[0-9]+:\s*(//|\*)"`
Expected: `ℹ pass 204`, `ℹ fail 0` ; tsc sans erreur ; le `grep` n'imprime rien.

Navigateur, 375 × 812 : charger `debut` : la fiche de poste montre « 1. Les usagers demandent des Cartes d’identité. » / « Chaque demande est une liasse de formulaires, un par étape. », « 2. Vous tamponnez le dernier : le visa. » / « La carte est délivrée à l’usager. », « 3. Chaque carte délivrée rapporte une dotation. » / « Plus elle exige de formulaires, plus elle rapporte. », pastilles trombone, tampon, copies (planche, moment 1). Options → Règlement intérieur : aucun « dossier ». Charger `atelier` : Atelier → la procédure montre « Vérification des pièces » ; « Ajouter une étape » liste « Justificatif exigé » en attente de réglementation. Console sans erreur.

- [ ] **Step 5: Commiter**

```bash
git add scripts/tests/vocabulaire-acte2.test.ts constants/balanceActe2.ts types/acte2.ts data/acte2/notes2.ts data/acte2/courrier2.ts data/courrier.ts data/acte2/fiche.ts components/direction/reglementDirection.ts data/presets.ts scripts/tests/fiche-acte2.test.ts scripts/tests/atelier-acte2.test.ts scripts/tests/acte2.test.ts scripts/tests/presets.test.ts
git commit -m "feat(logic): un seul mot, « demande » ; vérification des pièces et justificatif exigé ; fiche de poste du chef de service

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: En-tête Budget · Formulaires · À viser ; TAMPONNER éteint ; verdict « délivré »

**Files:**
- Modify: `context/GameStateContext.tsx` (`Verdict`, `tamponner`)
- Modify: `components/Hud.tsx`
- Modify: `components/BoutonTamponner.tsx`

**Interfaces:**
- Consumes: `VueDirection.visas` ; `Events2.delivres` (Tâche 1).
- Produces: `Verdict.delivre?: boolean` (Acte II : le coup a remis un document à son usager), lu par la bulle (Tâche 6). En-tête de l'Acte II : Budget, Formulaires, « À viser » (+ Démat. à sa note). TAMPONNER de l'Acte II : toujours « TAMPONNER », grisé quand À viser vaut 0.

- [ ] **Step 1: Implémenter**

Dans `context/GameStateContext.tsx`, remplacer :

```tsx
  /** Le dossier qui vient d'être tamponné (celui qui était au guichet). */
  usager: UsagerAffiche | null;
}
```

par :

```tsx
  /** Le dossier qui vient d'être tamponné (celui qui était au guichet). */
  usager: UsagerAffiche | null;
  /** Acte II : le coup a délivré un document à son usager (la bulle le montre repartir avec). */
  delivre?: boolean;
}
```

puis remplacer :

```tsx
        setVerdict({ id: verdictId.current, rejete: false, abandon: false, usager: null });
```

par :

```tsx
        setVerdict({
          id: verdictId.current,
          rejete: false,
          abandon: false,
          usager: null,
          delivre: r2.ev.delivres > 0,
        });
```

Dans `components/Hud.tsx`, remplacer :

```tsx
/**
 * Tableau des ressources, à plat sous l'en-tête. Acte I : budget, formulaires, dossiers en attente et, une fois
 * révélée, Conformité. Acte II : budget, formulaires (chacun avec son débit signé), usagers qui ont une démarche
 * en cours et, après sa note, Taux de dématérialisation (le nombre de visas en attente est sur la fiche Visa de
 * la bulle).
 */
```

par :

```tsx
/**
 * Tableau des ressources, à plat sous l'en-tête. Acte I : budget, formulaires, dossiers en attente et, une fois
 * révélée, Conformité. Acte II (specs/012) : budget, formulaires (chacun avec son débit signé), demandes « À
 * viser » (un tap en vise une) et, après sa note, Taux de dématérialisation. Les habitants de la ville sont au
 * titre du relevé « Production du service ».
 */
```

puis remplacer :

```tsx
          <Colonne
            label="Usagers"
            valeur={formatEntier(direction.usagers)}
```

par :

```tsx
          <Colonne
            label="À viser"
            valeur={formatEntier(direction.visas)}
```

Dans `components/BoutonTamponner.tsx`, remplacer :

```tsx
 * l'acte II ; la pastille de l'onglet où s'en procurer fait le reste). Le gain d'un coup se lit dans les compteurs.
 */
```

par :

```tsx
 * l'acte II ; la pastille de l'onglet où s'en procurer fait le reste). Le gain d'un coup se lit dans les compteurs.
 * Rien à traiter : « AUCUN DOSSIER » à l'acte I ; à l'acte II, le bouton s'éteint sans rien dire (specs/012).
 */
```

puis remplacer :

```tsx
  const libelleVide = direction ? 'AUCUN VISA' : 'AUCUN DOSSIER';
  const libelle = signal > 0 ? libelleSignal : vide && !rupture ? libelleVide : 'TAMPONNER';
```

par :

```tsx
  const libelle =
    signal > 0
      ? libelleSignal
      : vide && !rupture && !direction
        ? 'AUCUN DOSSIER'
        : 'TAMPONNER';
```

puis remplacer :

```tsx
                ? 'Aucun visa en attente'
```

par :

```tsx
                ? 'Aucune demande à viser'
```

- [ ] **Step 2: Vérifier**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)" && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 204`, `ℹ fail 0` ; tsc et lint sans erreur.

Navigateur, 375 × 812 puis 375 × 667 :
1. Charger `debut`, fermer la fiche (« PRENDRE MON POSTE ») : en-tête « Budget 0 € · Formulaires 300 · À viser 20 », pas de colonne Usagers, aucun onglet Service ni Notes ; pendant 10 s sans taper, Budget, Formulaires et le compteur de tampons ne bougent pas (planche, moment 1 – 2).
2. Un tap (barre d'espace) : À viser 19, Formulaires 299, Budget 1,60 € fois le bonus de grade (le préréglage est au dernier grade : 2,24 €).
3. Charger `visasEpuises` : À viser 0, TAMPONNER grisé et toujours libellé « TAMPONNER » (pas de « AUCUN VISA ») ; un tap n'y change rien ; l'onglet Notes porte la pastille « 1 » (moment 3).
4. Recharger `acte1Debut` : au guichet, file vide → « AUCUN DOSSIER » comme avant (Acte I inchangé).
5. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 3: Commiter**

```bash
git add context/GameStateContext.tsx components/Hud.tsx components/BoutonTamponner.tsx
git commit -m "feat(ui): en-tête de l'acte II Budget, Formulaires, À viser ; TAMPONNER s'éteint sans rien dire

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Bulle — « Attend votre visa », « Attend la vérification des pièces », « Repart avec sa Carte d’identité »

**Files:**
- Modify: `data/acte2/vues.ts` (import, `VueDirection.delivrance`, `vueDirection`)
- Rewrite: `components/direction/BulleDirection.tsx`
- Modify: `scripts/tests/vues-acte2.test.ts`, `scripts/tests/releve-acte2.test.ts`

**Interfaces:**
- Consumes: `VueDirection.parapheur` (`titre`, `attente`, `repart`), `etapes` (`pictogramme`, `faite`, `ici`, `encombree`, `attente`) (Tâche 2) ; `Verdict.delivre` (Tâche 5).
- Produces: `VueDirection.delivrance: { nom: string }` ; bulle qui montre l'usager servi 1,2 s après un coup qui délivre (titre conservé, « Repart avec sa Carte d’identité », chaîne cochée, « Délivrée » en gras sur fond vert), puis la demande suivante. Sans aucune demande : « Aucune demande en cours ».

- [ ] **Step 1: Écrire les tests (ils échouent)**

Dans `scripts/tests/vues-acte2.test.ts`, remplacer :

```ts
  assert.deepEqual(d.delivrance, { nom: 'Délivrée', faite: false });
```

par :

```ts
  assert.deepEqual(d.delivrance, { nom: 'Délivrée' });
```

puis remplacer :

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

par :

```ts
test('bulle : la chaîne se termine par « Délivrée » ou « Délivré », accordé au document', () => {
  const s = base2();
  assert.deepEqual(vue(s).delivrance, { nom: 'Délivrée' });
  const d = s.reformes.denomination;
  const titre: GameState = {
    ...s,
    reformes: {
      ...s.reformes,
      denomination: { ...d, procedures: { ...d.procedures, identite: 'Titre d’identité simplifié' } },
    },
  };
  assert.deepEqual(vue(titre).delivrance, { nom: 'Délivré' });
  assert.equal(vue(titre).parapheur?.repart, 'Repart avec son Titre d’identité simplifié');
});
```

Dans `scripts/tests/releve-acte2.test.ts`, remplacer :

```ts
test('première carte visée : délivrée, relevé à 1 et fiche « Délivrée » allumée', () => {
  const t = 1_000_000_000;
  const { s } = D.tamponner2(sauvegardePreset('debut', t), t);
  const carte = (P.lignesProduction(s, t) as P.LigneProduction[])[0];
  assert.equal(carte.delivres, 1);
  assert.equal(carte.delivresTexte, '1 délivrée');
  assert.equal(V.vueDirection(s, t)?.delivrance.faite, true);
});
```

par :

```ts
test('première carte visée : délivrée à son usager, relevé à 1', () => {
  const t = 1_000_000_000;
  const { s, ev } = D.tamponner2(sauvegardePreset('debut', t), t);
  proche(ev.delivres, 1 - BALANCE2.abandonParPoint);
  const carte = (P.lignesProduction(s, t) as P.LigneProduction[])[0];
  assert.equal(carte.delivres, 1);
  assert.equal(carte.delivresTexte, '1 délivrée');
  assert.equal(V.vueDirection(s, t)?.parapheur?.attente, 'Attend votre visa');
});
```

- [ ] **Step 2: Lancer les tests**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 202`, `ℹ fail 2`.

- [ ] **Step 3: Implémenter**

Dans `data/acte2/vues.ts`, remplacer :

```ts
import {
  compte,
  delivresEntiers,
  documentDe,
  dossiersEnCours,
  possessif,
} from './production';
```

par :

```ts
import { compte, documentDe, dossiersEnCours, possessif } from './production';
```

puis remplacer :

```ts
  /** Fiche qui clôt la chaîne : « Délivrée » (accordé au document), faite dès le premier document délivré. */
  delivrance: { nom: string; faite: boolean };
```

par :

```ts
  /** Fiche qui clôt la chaîne : « Délivrée » (accordé au document) ; elle ne s'allume qu'à la délivrance (specs/012). */
  delivrance: { nom: string };
```

puis remplacer :

```ts
    delivrance: {
      nom: doc.feminin ? 'Délivrée' : 'Délivré',
      faite: delivresEntiers(x, p) >= 1,
    },
```

par :

```ts
    delivrance: { nom: doc.feminin ? 'Délivrée' : 'Délivré' },
```

Remplacer tout le contenu de `components/direction/BulleDirection.tsx` par :

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, IdCard, Landmark, Paperclip, Stamp } from 'lucide-react-native';
import {
  useGameState,
  type EtapeChaine,
  type ParapheurAffiche,
} from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';

/** Durée pendant laquelle la bulle montre l'usager qui repart avec son document (ms). */
const DUREE_REPART = 1200;

/** Ce que la bulle montrait juste avant un coup : la demande, sa chaîne et la fiche de délivrance. */
interface Instantane {
  parapheur: ParapheurAffiche;
  etapes: EtapeChaine[];
  delivrance: { nom: string };
}

/** Lecture d'une fiche pour l'accessibilité. */
function lectureFiche(e: EtapeChaine, repart: boolean): string {
  if (repart || e.faite) return `${e.nom}, faite`;
  const qui =
    e.pictogramme === 'visa'
      ? 'visée par vous et vos agents'
      : e.pictogramme === 'guichet'
        ? 'traitée par les guichets'
        : 'aucun guichet';
  return `${e.nom}, ${formatEntier(e.attente)} en attente, ${qui}${e.encombree ? ', la plus encombrée' : ''}${e.ici ? ', ici' : ''}`;
}

/**
 * Bulle de l'écran Direction (specs/012) : la demande que suit la bulle (« Mme Lefèvre demande une Carte
 * d’identité », ou « Demande n° 9 907 · Carte d’identité » sans usager), ce qu'elle attend (« Attend votre
 * visa », « Attend la vérification des pièces ») et sa procédure en fiches reliées par des trombones, jusqu'à
 * « Délivrée ». Chaque fiche porte qui la traite (tampon, guichet, rien tant qu'il n'y a pas de guichet) et les
 * demandes qui y attendent ; une étape franchie où plus personne n'attend porte une coche ; le visa de la
 * demande s'allume (« ← ici ») ; la plus encombrée a un bord épais. Juste après une délivrance, la bulle garde
 * l'usager servi : « Repart avec sa Carte d’identité », toute la chaîne cochée, « Délivrée » en gras sur fond
 * vert (jamais la seule couleur).
 */
export default function BulleDirection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { direction, verdict, encre } = useGameState();
  const [repart, setRepart] = useState<Instantane | null>(null);
  const dernierVerdict = useRef(verdict?.id ?? null);
  const precedent = useRef<Instantane | null>(null);

  // Un coup qui délivre un document à son usager : la bulle le garde un instant (avant d'enregistrer l'état).
  useEffect(() => {
    if (!verdict || verdict.id === dernierVerdict.current) return;
    dernierVerdict.current = verdict.id;
    const servi = precedent.current;
    if (!verdict.delivre || !servi || servi.parapheur.repart === null) {
      setRepart(null);
      return;
    }
    setRepart(servi);
    const t = setTimeout(() => setRepart(null), DUREE_REPART);
    return () => clearTimeout(t);
  }, [verdict]);

  // La demande affichée, mémorisée pour le prochain coup.
  useEffect(() => {
    precedent.current = direction?.parapheur
      ? {
          parapheur: direction.parapheur,
          etapes: direction.etapes,
          delivrance: direction.delivrance,
        }
      : null;
  });

  if (!direction) return null;
  const vue: Instantane | null = repart ?? (direction.parapheur
    ? {
        parapheur: direction.parapheur,
        etapes: direction.etapes,
        delivrance: direction.delivrance,
      }
    : null);
  const etapes = vue?.etapes ?? direction.etapes;
  const delivrance = vue?.delivrance ?? direction.delivrance;
  const servi = repart !== null;

  const titre = vue ? vue.parapheur.titre : 'Aucune demande en cours';
  const detail = vue
    ? servi
      ? vue.parapheur.repart
      : vue.parapheur.attente
    : null;
  const chaine = etapes
    .map((e) => lectureFiche(e, servi))
    .concat(`${delivrance.nom}${servi ? ', faite' : ''}`)
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
            {etapes.map((e, i) => {
              const faite = servi || e.faite;
              const ici = !servi && e.ici;
              return (
                <React.Fragment key={`${e.type}-${i}`}>
                  {i > 0 && <Paperclip size={12} color={Colors.crayon} />}
                  <View
                    style={[
                      styles.fiche,
                      !faite && e.encombree && styles.ficheEncombree,
                      faite && styles.ficheFaite,
                      ici && { backgroundColor: encre.face },
                    ]}
                  >
                    {faite ? (
                      <Check size={12} color={Colors.anthracite} />
                    ) : e.pictogramme === 'visa' ? (
                      <Stamp size={12} color={Colors.anthracite} />
                    ) : e.pictogramme === 'guichet' ? (
                      <Landmark size={12} color={Colors.anthracite} />
                    ) : null}
                    <Text
                      style={[styles.ficheTexte, ici && styles.ficheAllumee]}
                      numberOfLines={1}
                    >
                      {ici ? `${e.nom} ← ici` : e.nom}
                    </Text>
                    {!faite && (
                      <Text
                        style={[
                          styles.ficheNombre,
                          e.encombree && styles.ficheNombreEncombre,
                        ]}
                        numberOfLines={1}
                      >
                        {formatEntier(e.attente)}
                      </Text>
                    )}
                  </View>
                </React.Fragment>
              );
            })}
            <Paperclip size={12} color={Colors.crayon} />
            <View style={[styles.fiche, servi && styles.ficheDelivree]}>
              <IdCard size={12} color={Colors.anthracite} />
              <Text
                style={[styles.ficheTexte, servi && styles.ficheAllumee]}
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
  /** Étape franchie : coche et fond vert (jamais la couleur seule). */
  ficheFaite: {
    backgroundColor: Colors.pastelVert,
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
  /** « Délivrée » à la délivrance : bord moyen et fond vert, en plus du texte gras. */
  ficheDelivree: {
    borderWidth: Charte.traitFin,
    backgroundColor: Colors.pastelVert,
  },
});
```

- [ ] **Step 4: Vérifier**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)" && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 204`, `ℹ fail 0` ; tsc et lint sans erreur.

Navigateur, 375 × 812 (bulle complète ; à 375 × 667 la bulle tient sur une ligne, sans détail ni chaîne, comme avant) :
1. Charger `debut` : « M./Mme … demande une Carte d’identité », « Attend votre visa » ; chaîne « ✓ Vérification des pièces » (fond vert, sans nombre) — trombone — « Visa ← ici 20 » (fond bleu, gras) — trombone — « Délivrée » neutre ; au bout d'une seconde, des demandes arrivent : la fiche « Vérification des pièces » perd sa coche et montre son nombre, sans pictogramme de guichet.
2. Un tap : pendant ~1,2 s, même titre, « Repart avec sa Carte d’identité », toute la chaîne cochée, « Délivrée » en gras sur fond vert (planche, moment 2, après) ; puis la demande suivante. Taper vite : chaque tap montre l'usager précédent.
3. Charger `visasEpuises` : « … demande une Carte d’identité », « Attend la vérification des pièces » ; « Vérification des pièces » au bord épais avec son nombre, sans pictogramme ; « Visa 0 » (moment 3).
4. Approuver la note n° 1 (Notes) puis acheter un guichet (Service ×1, 30 €) : revenu sur Direction, la fiche « Vérification des pièces » porte le pictogramme du guichet ; À viser remonte ; « Visa ← ici N » (moment 5).
5. `read_page` sur la bulle : le libellé d'accessibilité lit la demande, ce qu'elle attend et chaque étape (« Vérification des pièces, N en attente, aucun guichet, la plus encombrée ; Visa, 0 en attente, visée par vous et vos agents ; Délivrée »).
6. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 5: Commiter**

```bash
git add data/acte2/vues.ts components/direction/BulleDirection.tsx scripts/tests/vues-acte2.test.ts scripts/tests/releve-acte2.test.ts
git commit -m "feat(ui): la bulle suit la demande, du visa à la carte délivrée

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Relevé « · 1 500 usagers en ville » ; Service « Guichet ×0 NOUVEAU »

**Files:**
- Modify: `components/direction/ReleveProduction.tsx`
- Modify: `components/direction/ServiceDirection.tsx`
- Modify: `components/service/CarteUnite.tsx`

**Interfaces:**
- Consumes: `VueDirection.ville` (Tâche 2) ; `LigneProduction.valeur` (trois puces, Tâche 2) ; `VueService2.guichet.possedes`, `.description`.
- Produces: titre du relevé toujours affiché, avec la population ; `CarteUnite` prop optionnelle `nouveau?: boolean` (pastille « NOUVEAU », même forme que celle des notes) ; « 0 étape/s », « 1,5 étape/s », « 2 étapes/s ».

- [ ] **Step 1: Implémenter**

Dans `components/direction/ReleveProduction.tsx`, remplacer :

```tsx
 * Relevé « Production du service » (acte II) : ce que chaque procédure ouverte délivre. Sur l'écran Direction
 * (sous la bulle) et au pied de l'Atelier.
```

par :

```tsx
 * Relevé « Production du service » (acte II) : ce que chaque procédure ouverte délivre, et au titre les habitants
 * de la ville (« · 1 500 usagers en ville »). Sur l'écran Direction (sous la bulle) et au pied de l'Atelier.
```

puis remplacer :

```tsx
  const { production, verdict, encre } = useGameState();
```

par :

```tsx
  const { production, direction, verdict, encre } = useGameState();
```

puis remplacer :

```tsx
        {!condense && <Text style={styles.titre}>Production du service</Text>}
```

par :

```tsx
        {/* Le titre porte les habitants de la ville (specs/012) : il reste, même condensé. */}
        <Text style={styles.titre} numberOfLines={1}>
          Production du service
          {direction && <Text style={styles.ville}> · {direction.ville}</Text>}
        </Text>
```

puis remplacer :

```tsx
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
```

par :

```tsx
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  ville: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
  },
```

Dans `components/direction/ServiceDirection.tsx`, remplacer :

```tsx
            · {formatDebit(etapesParSeconde)} étapes/s au total
```

par :

```tsx
            · {formatDebit(etapesParSeconde)}{' '}
            {etapesParSeconde < 2 ? 'étape/s' : 'étapes/s'} au total
```

puis remplacer :

```tsx
          verbe="Acheter"
          onAcheter={acheterGuichet}
```

par :

```tsx
          verbe="Acheter"
          nouveau={guichet.possedes === 0}
          onAcheter={acheterGuichet}
```

puis remplacer :

```tsx
            verbe="Recruter"
            onAcheter={(nb) => acheterAgent2(a.id, nb)}
```

par :

```tsx
            verbe="Recruter"
            nouveau={a.possedes === 0}
            onAcheter={(nb) => acheterAgent2(a.id, nb)}
```

Dans `components/service/CarteUnite.tsx`, remplacer :

```tsx
  /** Verbe des libellés d'accessibilité (« Recruter », « Acheter »). */
  verbe: string;
```

par :

```tsx
  /** Verbe des libellés d'accessibilité (« Recruter », « Acheter »). */
  verbe: string;
  /** Acte II : unité tout juste débloquée, aucune encore achetée (pastille « NOUVEAU »). */
  nouveau?: boolean;
```

puis remplacer :

```tsx
  verbe,
  onAcheter,
}: CarteUniteProps) {
```

par :

```tsx
  verbe,
  nouveau = false,
  onAcheter,
}: CarteUniteProps) {
```

puis remplacer :

```tsx
          <Text style={styles.nom}>
            {nom}{' '}
            <Text style={[styles.possedes, { color: encre.texte }]}>
              ×{possedes}
            </Text>
          </Text>
```

par :

```tsx
          <View style={styles.ligneNom}>
            <Text style={styles.nom}>
              {nom}{' '}
              <Text style={[styles.possedes, { color: encre.texte }]}>
                ×{possedes}
              </Text>
            </Text>
            {nouveau && (
              <View style={[styles.nouveau, { backgroundColor: encre.face }]}>
                <Text style={styles.nouveauTexte}>NOUVEAU</Text>
              </View>
            )}
          </View>
```

puis remplacer :

```tsx
  description: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
});
```

par :

```tsx
  description: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
  ligneNom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Espace.s,
  },
  /** Même pastille que les notes nouvelles. */
  nouveau: {
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    paddingHorizontal: Espace.s,
  },
  nouveauTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    color: Colors.anthracite,
  },
});
```

- [ ] **Step 2: Vérifier**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)" && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 204`, `ℹ fail 0` ; tsc et lint sans erreur.

Navigateur :
1. 375 × 812, `debut` : relevé « Production du service · 1 500 usagers en ville », « Carte d’identité N demandes · 0 délivrée », « → usagers », **sans** puces (pas d'Atelier) (moment 2).
2. `visasEpuises` → Notes → APPROUVER la note n° 1 « Réouverture du guichet 3 » (texte et effet de la planche, moment 4) → onglet Service : « Guichets · 0 étape/s au total », carte « Guichet ×0 » avec la pastille « NOUVEAU », « Vérifie les pièces justificatives. », ×1 30 €, ×10 613 € (grisé), Max ×1 30 € ; acheter ×1 : la pastille disparaît, « 0,5 étape/s ».
3. `compliquer` : sous « Carte d’identité … délivrées », les puces « +X € la carte », « 2 formulaires la carte », « N abandons » ; ajouter une Signature dans l'Atelier : « 3 formulaires la carte » (moment 6).
4. 375 × 667, `boucle` puis `demat` : le titre « Production du service · … usagers en ville » reste sur une ligne au-dessus des lignes condensées ; la scène garde au moins ~120 pt de haut (`read_page` / capture) ; sinon, revenir avec la mesure au porteur de projet (question 6).
5. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 3: Commiter**

```bash
git add components/direction/ReleveProduction.tsx components/direction/ServiceDirection.tsx components/service/CarteUnite.tsx
git commit -m "feat(ui): la population au relevé, le premier guichet signalé au Service

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Vocabulaire à l'écran — Atelier, notes, scène

**Files:**
- Modify: `components/atelier/FicheEtape.tsx`, `components/atelier/FeuilleEtape.tsx`, `components/atelier/BilanProcedure.tsx`
- Modify: `app/(tabs)/notes.tsx`
- Modify: `components/scene/ScenePixelDirection.tsx`, `components/scene/ScenePixelDirection.web.tsx`

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: « Justificatif exigé » (feuille, fiche, accessibilité), « Par demande », « Note déjà instruite, procédure simplifiée. », « le chef de service vise les demandes ».

- [ ] **Step 1: Implémenter**

Dans `components/atelier/FicheEtape.tsx`, remplacer :

```tsx
          accessibilityLabel={`Pièce exigée : ${etape.exigeNom ?? 'aucune'}${etape.boucle
```

par :

```tsx
          accessibilityLabel={`Justificatif exigé : ${etape.exigeNom ?? 'aucun'}${etape.boucle
```

puis remplacer :

```tsx
            exige : {etape.exigeNom ?? 'aucune pièce'}
```

par :

```tsx
            exige : {etape.exigeNom ?? 'aucun justificatif'}
```

Dans `components/atelier/FeuilleEtape.tsx`, remplacer :

```tsx
              {mode?.type === 'exiger' ? 'Pièce exigée' : 'Ajouter une étape'}
```

par :

```tsx
              {mode?.type === 'exiger' ? 'Justificatif exigé' : 'Ajouter une étape'}
```

Dans `components/atelier/BilanProcedure.tsx`, remplacer :

```tsx
 * service »), puis le bilan d'un dossier qui la franchit en entier
```

par :

```tsx
 * service »), puis le bilan d'une demande qui la franchit en entier
```

puis remplacer :

```tsx
        accessibilityLabel={`${proc.nom} : ${compteurs}. Par dossier : ${proc.bilan
```

par :

```tsx
        accessibilityLabel={`${proc.nom} : ${compteurs}. Par demande : ${proc.bilan
```

puis remplacer :

```tsx
          <Text style={styles.libelle}>Par dossier</Text>
```

par :

```tsx
          <Text style={styles.libelle}>Par demande</Text>
```

Dans `app/(tabs)/notes.tsx`, remplacer :

```tsx
' Dossier déjà instruit, procédure simplifiée.'
```

par :

```tsx
' Note déjà instruite, procédure simplifiée.'
```

Dans `components/scene/ScenePixelDirection.tsx`, remplacer :

```tsx
le chef de service vise les parapheurs ;
```

par :

```tsx
le chef de service vise les demandes ;
```

Dans `components/scene/ScenePixelDirection.web.tsx`, remplacer :

```tsx
le chef de service vise les parapheurs ;
```

par :

```tsx
le chef de service vise les demandes ;
```

- [ ] **Step 2: Vérifier**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)" && ./node_modules/.bin/tsc --noEmit -p . && npm run lint && grep -rniE "dossier|parapheur" components/direction components/atelier components/service app/\(tabs\)/notes.tsx components/scene/ScenePixelDirection*.tsx | grep -vE "^[^:]+:[0-9]+:\s*(//|\*|\{/\*)" | grep -vE "\.parapheur|parapheur[?.:,]|ParapheurAffiche"`
Expected: `ℹ pass 204`, `ℹ fail 0` ; tsc et lint sans erreur ; le dernier `grep` n'imprime rien (seuls restent des identifiants internes).

Navigateur, 375 × 812 :
1. Charger `pieceService` → Atelier → Carte d'identité → « Ajouter une étape » → « Justificatif exigé » : la feuille du document s'intitule « Justificatif exigé » ; la fiche ajoutée dit « exige : Justificatif de domicile » ; l'en-tête de la procédure dit « Par demande ».
2. Charger `cerfa2`, signer le Cerfa, tamponner jusqu'à la première note (20 à 30 tampons) : sa ligne d'effet finit par « Note déjà instruite, procédure simplifiée. ».
3. Charger `debut` : `read_page` sur la scène → « La Direction : le chef de service vise les demandes ; derrière la vitre, la salle d’attente ».
4. Console sans erreur ; revenir au preset `desktop`.

- [ ] **Step 3: Commiter**

```bash
git add components/atelier/FicheEtape.tsx components/atelier/FeuilleEtape.tsx components/atelier/BilanProcedure.tsx "app/(tabs)/notes.tsx" components/scene/ScenePixelDirection.tsx components/scene/ScenePixelDirection.web.tsx
git commit -m "feat(ui): un seul mot à l'écran de l'acte II, « demande »

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Simulateur, mesures de la spec 009, CLAUDE.md et vérification d'ensemble

**Files:**
- Modify: `scripts/simulate-acte2.ts`
- Modify: `specs/009-acte2-direction/spec.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: tout le travail des Tâches 1 à 8. Le robot (`scripts/robots.ts`) n'a pas à changer : il tamponne les 20 visas, achète la note n° 1 dès qu'elle est visible (gratuite, effective aussitôt) puis le guichet le plus rentable.
- Produces: jalon « premier guichet » ; mesures et documentation à jour. `demaCible` inchangé (68 000) : les jalons restent dans les cibles.

- [ ] **Step 1: Jalon « premier guichet »**

Dans `scripts/simulate-acte2.ts`, remplacer :

```ts
    for (const id of Object.keys(x.notes)) marquer(`note ${id}${tour()}`, t);

```

par :

```ts
    for (const id of Object.keys(x.notes)) marquer(`note ${id}${tour()}`, t);
    if (x.guichets > 0) marquer(`premier guichet${tour()}`, t);

```

- [ ] **Step 2: Mesurer**

Run: `for t in 1 2 3; do node scripts/simulate-acte2.ts $t 300 2>/dev/null | grep -vE "^ +[0-9.]+ min \|"; done; node scripts/simulate-acte2.ts 2 300 0 15 2>/dev/null | grep -E "réforme|acte I rejoué|fin de"; node scripts/simulate-acte2.ts 2 300 balayage 2>/dev/null`
Expected (mesuré sur une copie du worktree avec ce plan appliqué ; les tirages font varier de quelques dixièmes de minute) :

| Jalon (min) | 1 tap/s | 2 taps/s | 3 taps/s |
|---|---|---|---|
| note prise / premier guichet | 0.3 | 0.2 | 0.1 |
| premier agent | 3.1 | 2.8 | 2.8 |
| atelier | 9.6 | 9.2 | 9.1 |
| note achats | 17.9 | 16.7 | 15.7 |
| première boucle | 28.6 | 27.2 | 25.8 |
| dématérialisation 50 % | 89.2 | 86.1 | 83.1 |
| dématérialisation 100 % (fin) | 193.6 | 188.2 | 182.8 |

- « 10 min après la première boucle : … critère tenu » aux trois vitesses (143 / 140 / 138 usagers en cours, 9,7 / 12,2 / 15,1 % du maximum ; 1 533 – 1 546 documents délivrés au service, 0 aux usagers) ; « plus de documents délivrés au service qu’aux usagers » vers 53,6 – 55,3 min ; fournitures 35,2 – 35,5 % des recettes en ×1 ; prudent 7,17 € la carte, agressif 14,34 €.
- `2 300 0 15` : réforme débloquée 42.2 min, acte I rejoué 63.9 min, fin de l'acte II 119.6 min (cible humaine 105 – 135).
- `balayage` : sans Réforme 188.1 min ; Réforme rentable de 0 à 80 % (fin entre 113.3 et 184.9 min), acte I rejoué en 18 à 22 min, la plus petite Réforme rapporte 6 trombones.

Si une fin d'acte sort de 150 – 200 min à 1, 2 ou 3 taps/s, recaler `BALANCE2.demaCible` (seule constante autorisée par la spec § 7) et le dire au porteur de projet.

- [ ] **Step 3: La spec 009**

Dans `specs/009-acte2-direction/spec.md`, remplacer :

```markdown
| 1 | Prise de fonctions | Ouvre le recrutement des Guichets | Début |
```

par :

```markdown
| 1 | Réouverture du guichet 3 (specs/012) | Ouvre le recrutement des guichets | Plus rien à viser et une demande attend la vérification des pièces (dès l'entrée avec des guichets offerts) |
```

remplacer :

```markdown
| 3 | Atelier des procédures | Ouvre l'onglet Atelier, la procédure Justificatif de domicile et l'étape Pièce justificative | 10 – 20 min |
```

par :

```markdown
| 3 | Atelier des procédures | Ouvre l'onglet Atelier, la procédure Justificatif de domicile et l'étape Vérification des pièces | 10 – 20 min |
```

remplacer :

```markdown
| 8 | Pièce délivrée par nos services | Étape Pièce délivrée par nos services. Texte-indice
```

par :

```markdown
| 8 | Justificatif délivré par nos services | Étape Justificatif exigé. Texte-indice
```

remplacer :

```markdown
| Premier agent | 2.2 | 2.0 | 2.2 |
| Atelier | 9.0 | 8.5 | 8.6 |
| Marché public de fournitures (specs/010) | 17.2 | 16.0 | 15.2 |
| Première boucle | 27.7 | 26.4 | 25.9 |
| Dématérialisation 50 % | 85.8 | 83.2 | 82.2 |
| Dématérialisation 100 % | 185.3 | 180.6 | 178.9 |
```

par :

```markdown
| Premier guichet (specs/012) | 0.3 | 0.2 | 0.1 |
| Premier agent | 3.1 | 2.8 | 2.8 |
| Atelier | 9.6 | 9.2 | 9.1 |
| Marché public de fournitures (specs/010) | 17.9 | 16.7 | 15.7 |
| Première boucle | 28.6 | 27.2 | 25.8 |
| Dématérialisation 50 % | 89.2 | 86.1 | 83.1 |
| Dématérialisation 100 % | 193.6 | 188.2 | 182.8 |

Depuis specs/012 (le début de l'acte) : aucun guichet à l'entrée, 20 demandes au Visa ; le robot vise les 20, approuve la note n° 1 dès qu'elle apparaît et achète son premier guichet aussitôt. Usagers en cours après la première boucle, à +0 / +2 / +4 / +6 / +10 min : 1 tap/s 610 / 520 / 406 / 298 / 143 (41,2 / 35,2 / 27,5 / 20,2 / 9,7 %) ; 2 taps/s 561 / 496 / 396 / 293 / 140 (48,9 / 43,2 / 34,5 / 25,5 / 12,2 %) ; 3 taps/s 529 / 478 / 388 / 289 / 138 (57,8 / 52,2 / 42,3 / 31,5 / 15,1 %). Critère de la spec 011 § 10 tenu (1 533 à 1 546 documents délivrés au service en 10 min, aucun aux usagers) ; en cumul, le service passe devant les usagers vers 54 – 55 min. `demaCible` inchangé.
```

remplacer :

```markdown
Avec une Réforme (2 taps/s, `balayage`) : rentable de 0 à 80 % de dématérialisation (fin de l'acte entre 112.5 et 180.2 min contre 180.7) ; l'acte I est rejoué en 18 à 22 min ; la plus petite Réforme rapporte 6 trombones.

Le robot construit la boucle dès que l'étape est disponible. Avec 15 min de compréhension de la note n° 8 et une Réforme dès son déblocage (`node scripts/simulate-acte2.ts 2 300 0 15`) : Réforme débloquée à 41.4 min, acte I rejoué à 63.2 min, fin de l'acte à 116.0 min.
```

par :

```markdown
Avec une Réforme (2 taps/s, `balayage`) : rentable de 0 à 80 % de dématérialisation (fin de l'acte entre 113.3 et 184.9 min contre 188.1) ; l'acte I est rejoué en 18 à 22 min ; la plus petite Réforme rapporte 6 trombones.

Le robot construit la boucle dès que l'étape est disponible. Avec 15 min de compréhension de la note n° 8 et une Réforme dès son déblocage (`node scripts/simulate-acte2.ts 2 300 0 15`) : Réforme débloquée à 42.2 min, acte I rejoué à 63.9 min, fin de l'acte à 119.6 min.
```

et, dans le paragraphe « Cible du robot pour 100 % sans Réforme », remplacer `(mesuré : 178.9 à 185.3)` par `(mesuré : 182.8 à 193.6)` et `(83.2 min à 2 taps/s` par `(86.1 min à 2 taps/s`. Reporter les nombres réellement mesurés au Step 2 s'ils diffèrent.

- [ ] **Step 4: CLAUDE.md**

Dans `CLAUDE.md`, à la fin du premier paragraphe de « Project Overview », remplacer :

```markdown
the bubble shows « Mme Lefèvre demande une Carte d’identité » ending in a « Délivrée » chip, then anonymous « Demande n° … » requests.
```

par :

```markdown
the bubble shows « Mme Lefèvre demande une Carte d’identité » ending in a « Délivrée » chip, then anonymous « Demande n° … » requests. Act II starts without any guichet (spec: `specs/012-acte2-debut/spec.md`, storyboard `specs/012-acte2-debut/storyboard.html`): 20 demandes wait at the Visa and their 20 visas pay for the first guichet; nothing moves until the player stamps; note n° 1 « Réouverture du guichet 3 » appears only once nothing is left to stamp and a demande waits at the first step (`reouvertureVisible`, kept once set; at once when Antériorité offers guichets), and if the budget went elsewhere the guichet 3 reopens d'office (`guichetDOffice`). On screen, Act II has one word for what it processes, « demande » (steps « Vérification des pièces » and « Justificatif exigé »; internal ids unchanged, checked by `scripts/tests/vocabulaire-acte2.test.ts`). The header reads Budget · Formulaires · À viser (TAMPONNER greys out silently at 0), the town's population heads the « Production du service » statement, whose « +X € la carte », « N formulaires la carte » and abandons chips appear with the Atelier; the bubble follows one demande (« Attend votre visa », « Attend la vérification des pièces »; a crossed step nobody waits at is ticked; « ← ici » on its Visa) and, for 1.2 s after a delivery, shows « Repart avec sa Carte d’identité » with a green « Délivrée » chip.
```

remplacer :

```markdown
(presets of data/presets.ts: acte1Debut, acte1Milieu, finActeI, debut, atelier, compliquer, achats, pieceService, avantBoucle, boucle, demat, fin, reforme, cerfa2)
```

par :

```markdown
(presets of data/presets.ts: acte1Debut, acte1Milieu, finActeI, debut, visasEpuises, atelier, compliquer, achats, pieceService, avantBoucle, boucle, demat, fin, reforme, cerfa2)
```

et remplacer :

```markdown
(tab « Direction »: resources Budget, Formulaires, Usagers (usagers with a démarche in progress), then Démat.; bubble with the request (an usager's name, or « Demande n° … » without usager) and its procedure as a circulation table (dossiers waiting at each step, guichet or stamp pictogram, thick border on the most loaded step) ending in a « Délivrée » chip; the « Production du service » statement (one line per procedure when compact or from three procedures);
```

par :

```markdown
(tab « Direction »: resources Budget, Formulaires, À viser (demandes waiting for the visa), then Démat.; bubble with the demande it follows (an usager's name, or « Demande n° … » without usager), what it waits for, and its procedure as a circulation table (demandes waiting at each step, stamp pictogram, guichet pictogram once the service has a guichet, thick border on the most loaded step) ending in a « Délivrée » chip; the « Production du service » statement headed by the town's population (one line per procedure when compact or from three procedures);
```

- [ ] **Step 5: Vérification d'ensemble**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)" && ./node_modules/.bin/tsc --noEmit -p . && npm run lint`
Expected: `ℹ pass 204`, `ℹ fail 0` ; tsc et lint sans erreur.

Navigateur, la planche de bout en bout, à 375 × 812 puis 375 × 667 :
1. `debut` : fiche de poste (moment 1) ; « PRENDRE MON POSTE » ; 20 taps (barre d'espace) : À viser 20 → 0, Formulaires 300 → 280, relevé « 20 délivrées » ; à chaque tap « Repart avec sa Carte d’identité » (moment 2).
2. Sans taper : À viser 0, TAMPONNER grisé, les demandes s'entassent à « Vérification des pièces », l'onglet Notes apparaît avec la pastille « 1 » (moment 3).
3. Notes : « NOTE DE SERVICE N° 001 · NOUVEAU · Réouverture du guichet 3 · … · Effet : Débloque le recrutement des guichets. · APPROUVER · Gratuit » ; approuver (moment 4).
4. Service : « Guichet ×0 NOUVEAU » ; acheter ×1 ; Direction : la vérification se vide, À viser remonte, « Visa ← ici » (moment 5).
5. `compliquer` : puces « +X € la carte · N formulaires la carte · K abandons » (moment 6).
6. `acte1Debut` : le guichet de l'Acte I est inchangé (« AUCUN DOSSIER » file vide, colonne « En attente »).
7. Console sans erreur à chaque préréglage ; revenir au preset `desktop`.

- [ ] **Step 6: Commiter**

```bash
git add scripts/simulate-acte2.ts specs/009-acte2-direction/spec.md CLAUDE.md
git commit -m "docs: le début de l'acte II, mesures du robot et documentation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-review (spec 012 et planche)

| Spec / planche | Où |
|---|---|
| § 1 Aucun guichet (`guichetsInitiaux` 0, Antériorité conservée), 20 demandes au Visa, 20 visas ≥ premier guichet | Tâche 1 (tests « entrée », « 20 visas paient… », Antériorité dans `reforme.test.ts`) |
| § 1 Sans guichet, les demandes s'entassent ; tampons, budget, formulaires ne bougent qu'au tap | Tâche 1 (« sans guichet, rien ne bouge… ») |
| § 1 Pas de blocage (variantes Exemplaires / Jurisprudence, Réforme avec déjà-vu) | Tâche 1 : Exemplaires vaut ×1 à chaque entrée (note n° 5 requise) ; minimum 32 € ≥ 30 € ; maximum 64 € → filet `guichetDOffice` (question 2) ; la note n° 1 est gratuite (déjà-vu sans effet sur un coût nul, délai nul) ; Antériorité : note visible d'emblée (question 1) ; robot après Réforme : « note prise (après la Réforme) » 0,2 min après le replay (Tâche 9) |
| § 2 Note renommée, texte, effet, gratuite, sans délai ; visible à « plus rien à viser et ≥ 1 à la première étape » ; reste visible | Tâche 1 (`reouvertureVisible`, posé par `tick2`, migré à `true`) |
| § 3 En-tête Budget · Formulaires · À viser (+ Démat.) ; population au relevé ; tap −1 À viser, −1 formulaire, +1 carte ; TAMPONNER grisé sans texte | Tâches 2 (`ville`), 5, 7 |
| § 4 « demande » partout à l'Acte II ; étapes renommées sans changer les identifiants | Tâches 2 (bulle), 4 (données, fiche, règlement, notes, lettres, test de vocabulaire), 8 (Atelier, notes, scène, accessibilité) |
| § 5 Fiche : trois lignes, format de l'Acte I ; agents et achats sans « dossiers » | Tâche 4 (question 7) |
| § 6 Bulle « Attend la vérification des pièces » sans pictogramme de guichet, « Attend votre visa », « Repart avec sa Carte d’identité » | Tâches 2 (données), 5 (`Verdict.delivre`), 6 (affichage) |
| § 6 Relevé « N formulaires la carte » (étapes × Exemplaires) | Tâche 2 (`formulairesDocument`), Tâche 7 (affichage ; puces avec l'Atelier, question 3) |
| § 7 Robot : note puis premier guichet ; jalons 009 et critère 011 § 10 ; `demaCible` inchangé | Tâche 9 (mesures) |
| § 7 Raccourci « visas épuisés » ; « prise de fonctions » sans guichet | Tâche 3 |
| § 7 `npm test`, navigateur 375 × 812 et 375 × 667, console | Chaque tâche d'interface, Tâche 9 |
| Contraintes permanentes : rien n'explique (TAMPONNER grisé sans texte, aucune ligne sous un contrôle), rien ne nomme la boucle, typographie, a11y, couches | Global Constraints ; libellés d'accessibilité de la bulle et du bouton ; `components/` n'importe jamais `data/` |
| Planche : « ← ici », coche des étapes faites, « Délivrée » vert à la délivrance seulement, « NOUVEAU » au Guichet ×0, « 0 étape/s » | Tâches 2, 6, 7 (questions 4 et 9) |
| Sauvegarde | Tâche 1 (`reouvertureVisible ?? true`, test « sauvegarde antérieure à specs/012 ») |

Écarts assumés : les puces du relevé attendent l'Atelier (question 3) ; « Délivrée » ne reste pas verte (question 4) ; « N demandes · » et les débits sont conservés (question 5) ; le titre du relevé reste en mode condensé (question 6).
