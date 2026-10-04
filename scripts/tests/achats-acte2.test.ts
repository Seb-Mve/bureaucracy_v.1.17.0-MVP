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
