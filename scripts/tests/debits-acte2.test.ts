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
  assert.deepEqual(
    fluxDe(ev({ budget: 12, formulaires: 5, achats: 400 }), 0.8),
    {
      budget: 8,
      formulaires: -5,
    },
  );
  assert.deepEqual(fluxDe(ev({ budget: 12, formulaires: 5 }), 0), {
    budget: 12,
    formulaires: -5,
  });
  // Coût d'un formulaire : celui du marché, seulement quand le Service des achats est en service.
  assert.equal(coutFormulaireDebit(base2(), 0), 0);
  const achats = avecNotes(base2(), ['achats']);
  proche(
    coutFormulaireDebit(achats, 0),
    BALANCE2.prixRamette / BALANCE.ramette,
  );
  assert.equal(coutFormulaireDebit(D.reglerAchats(achats, false, 0), 0), 0);
  assert.deepEqual(
    ajouterFlux({ budget: 1, formulaires: -2 }, { budget: 3, formulaires: -4 }),
    { budget: 4, formulaires: -6 },
  );
});

test('débits : lissés, ils rejoignent un flux constant en quelques secondes', () => {
  let d = DEBITS_NULS;
  // 1,5 € et 1 formulaire tous les dixièmes de seconde : +15 €/s et −10 /s.
  for (let i = 0; i < 10; i++)
    d = lisserDebits(d, { budget: 1.5, formulaires: -1 }, 0.1);
  assert.ok(d.budget > 3 && d.budget < 15, `après 1 s : ${d.budget}`);
  for (let i = 0; i < 300; i++)
    d = lisserDebits(d, { budget: 1.5, formulaires: -1 }, 0.1);
  proche(d.budget, 15, 1e-3);
  proche(d.formulaires, -10, 1e-3);
  assert.equal(lisserDebits(d, { budget: 99, formulaires: 0 }, 0), d);
});

test('débit signé : signe typographique, format des débits, zéro sans signe', () => {
  assert.equal(formatDebitSigne(15.3), '+15');
  assert.equal(formatDebitSigne(-13), '−13');
  assert.equal(formatDebitSigne(0.4), '+0,40');
  assert.equal(formatDebitSigne(0.001), '0');
  assert.equal(formatDebitSigne(0.007), '0');
  assert.equal(formatDebitSigne(-0.007), '0');
  assert.equal(formatDebitSigne(Number.NaN), '0');
  assert.equal(formatDebitSigne(-124_560), '−124 k');
});
