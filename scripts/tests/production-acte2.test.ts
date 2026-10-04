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
    reformes: {
      ...s0.reformes,
      procedures: memoire,
      jurisprudence: ['memoire'],
    },
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
