import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as F from '../../data/acte2/fiche';
import { normaliserSauvegarde } from '../../data/save';
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

test('fiche de poste du chef de service : trois lignes à la prise de fonctions, ouverte', () => {
  const f = F.vueFiche2(base2(), 0) as F.VueFiche2;
  assert.equal(f.visible, true);
  assert.equal(f.premiere, true);
  assert.equal(f.agent, 'Test');
  assert.equal(f.nomService, 'La Direction');
  assert.deepEqual(
    f.lignes.map((l) => l.id),
    ['circulation', 'guichets', 'dotation'],
  );
  assert.deepEqual(
    f.lignes.map((l) => l.titre),
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
  assert.equal(
    f.nonLues,
    0,
    'pas de pastille sur Options tant que la fiche est ouverte',
  );
  assert.equal(f.lignes.filter((l) => l.nouvelle).length, 3);
  assert.equal(
    F.vueFiche2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0),
    null,
  );
});

test('fiche de poste : refermée, elle est lue ; une note en vigueur ajoute une ligne non lue', () => {
  const lue = F.marquerFiche2(base2(), true, 0);
  assert.equal(F.vueFiche2(lue, 0)?.visible, false);
  assert.equal(F.vueFiche2(lue, 0)?.nonLues, 0);
  assert.equal(
    F.marquerFiche2(lue, true, 0),
    lue,
    'rien à marquer : même objet',
  );
  // Fiche déjà refermée : la refermer n'a aucun effet, même avec des lignes non lues (badge intact).
  const nonLue = avecNotes(lue, ['agents']);
  assert.equal(F.vueFiche2(nonLue, 0)?.nonLues, 1);
  assert.equal(F.marquerFiche2(nonLue, true, 0), nonLue);
  assert.equal(F.vueFiche2(F.marquerFiche2(nonLue, true, 0), 0)?.nonLues, 1);
  // Une note achetée mais en instruction n'ajoute rien.
  const instruction = avec2(lue, {
    notes: { agents: { achetee: 0, effective: 30_000 } },
  });
  assert.equal(F.vueFiche2(instruction, 10_000)?.nonLues, 0);
  const s = avecNotes(lue, [
    'agents',
    'atelier',
    'exemplaires',
    'achats',
    'pieceService',
  ]);
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
  for (const l of f.lignes) {
    assert.ok(!/'/.test(l.titre + l.texte), `apostrophe droite : ${l.id}`);
    assert.ok(
      !/boucle|dématérialis|évaluation|atelier|exemplaire/i.test(
        l.titre + l.texte,
      ),
      `la fiche explique un arbitrage ou nomme la boucle : ${l.id}`,
    );
    assert.ok(
      !/dossier|parapheur/i.test(l.titre + l.texte),
      `un seul mot, « demande » : ${l.id}`,
    );
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

test('sauvegarde antérieure : les lignes retirées de la fiche sont oubliées', () => {
  const s = F.marquerFiche2(base2(), true, 0);
  const ancien = avec2(s, {
    ficheLues: [
      'circulation',
      'evaluation',
      'atelier',
    ] as unknown as EtatActe2['ficheLues'],
  });
  assert.deepEqual(x(normaliserSauvegarde(ancien)).ficheLues, ['circulation']);
});
