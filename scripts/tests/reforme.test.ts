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

const proche = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('sauvegardes antérieures à la Réforme : reformes complétées, âge des services déduit', () => {
  const acte1: Partial<GameState> = { ...E.etatInitial(0) };
  delete acte1.reformes;
  assert.equal(estSauvegardeValide(acte1), true);
  assert.deepEqual(
    normaliserSauvegarde(acte1 as GameState).reformes,
    E.etatInitial(0).reformes,
  );

  const s2 = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 1000);
  const { duree: _d, memoireRestauree: _m, ...ancien } = x(s2);
  const sauvegarde = {
    ...s2,
    derniereMaj: 61_000,
    acte2: ancien,
  } as unknown as GameState;
  delete (sauvegarde as Partial<GameState>).reformes;
  const n = normaliserSauvegarde(sauvegarde);
  assert.equal(x(n).duree, 60);
  assert.equal(x(n).memoireRestauree, false);
  assert.equal(n.reformes.nombre, 0);
  assert.equal(
    estSauvegardeValide({ ...s2, reformes: { nombre: 'deux' } }),
    false,
  );
});
