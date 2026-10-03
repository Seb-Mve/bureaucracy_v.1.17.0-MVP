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
