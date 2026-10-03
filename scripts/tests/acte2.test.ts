import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import type { GameState } from '../../types/game';
import {
  appliquerAction,
  estBoucle,
  procsEnBoucle,
} from '../../data/acte2/procedures';
import { BALANCE2, PROCEDURES_INITIALES } from '../../constants/balanceActe2';
import type { Etape, EtapeType, EtatActe2, ProcId } from '../../types/acte2';

/** Entrée dans l'acte II à t = 0, budget et formulaires illimités. */
function base2(): GameState {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  return { ...s, budget: 1e9, formulaires: 1e9 };
}

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

const proche = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('entrée dans l’acte II : seul le compteur de tampons est conservé', () => {
  const fin = {
    ...E.signerCerfa(E.etatInitial(0), 'Test', 0),
    tampons: 160000,
    budget: 5e6,
    formulaires: 9000,
  };
  const s = D.entrerActe2(fin, 1000);
  assert.equal(s.acte, 2);
  assert.equal(s.tampons, 160000);
  assert.equal(s.budget, BALANCE2.budgetInitial);
  assert.equal(s.formulaires, BALANCE2.formulairesInitiaux);
  assert.equal(x(s).guichets, 1);
  assert.deepEqual(
    x(s).procedures.identite.map((e) => e.type),
    ['piece', 'visa'],
  );
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
  assert.equal(
    estSauvegardeValide({ ...E.etatInitial(0), acte: 2, acte2: null }),
    false,
  );
  assert.equal(estSauvegardeValide(base2()), true);
});

const P = (type: EtapeType, exige?: ProcId): Etape =>
  exige ? { type, exige } : { type };
const procs = (
  o: Partial<Record<ProcId, Etape[]>>,
): Record<ProcId, Etape[]> => ({
  ...PROCEDURES_INITIALES,
  ...o,
});

test('boucle : la Carte d’identité exige le Justificatif, qui exige la Carte', () => {
  const p = procs({
    identite: [P('pieceService', 'domicile')],
    domicile: [P('pieceService', 'identite')],
  });
  const ouvertes: ProcId[] = ['identite', 'domicile'];
  assert.equal(estBoucle(p, ouvertes, 'identite', 'domicile'), true);
  assert.deepEqual(procsEnBoucle(p, ouvertes), ['identite', 'domicile']);
});

test('boucle à trois procédures, rompue si l’une est fermée', () => {
  const p = procs({
    identite: [P('pieceService', 'domicile')],
    domicile: [P('pieceService', 'hebergement')],
    hebergement: [P('pieceService', 'identite')],
  });
  assert.equal(
    estBoucle(
      p,
      ['identite', 'domicile', 'hebergement'],
      'identite',
      'domicile',
    ),
    true,
  );
  assert.equal(
    estBoucle(p, ['identite', 'domicile'], 'identite', 'domicile'),
    false,
  );
});

test('simple dépendance : pas de boucle', () => {
  const p = procs({
    identite: [P('pieceService', 'domicile')],
    domicile: [P('piece')],
  });
  assert.equal(
    estBoucle(p, ['identite', 'domicile'], 'identite', 'domicile'),
    false,
  );
  assert.deepEqual(procsEnBoucle(p, ['identite', 'domicile']), []);
});

test('Atelier : ajouter une étape débloquée, en fin de liste', () => {
  const a = x(base2());
  const b = appliquerAction(
    a,
    { type: 'ajouter', p: 'identite', etape: 'signature' },
    ['signature'],
    ['identite'],
  );
  assert.deepEqual(
    b.procedures.identite.map((e) => e.type),
    ['piece', 'visa', 'signature'],
  );
  assert.equal(b.usagers.identite.length, 3);
  assert.equal(b.boucles.identite.length, 3);
  assert.equal(b.premiereModif, 'identite');
});

test('Atelier : étape non débloquée ou procédure fermée → refus', () => {
  const a = x(base2());
  assert.equal(
    appliquerAction(
      a,
      { type: 'ajouter', p: 'identite', etape: 'commission' },
      ['signature'],
      ['identite'],
    ),
    a,
  );
  assert.equal(
    appliquerAction(
      a,
      { type: 'ajouter', p: 'domicile', etape: 'signature' },
      ['signature'],
      ['identite'],
    ),
    a,
  );
});

test('Atelier : une pièce de nos services n’exige qu’une autre procédure ouverte', () => {
  const a = x(base2());
  const dispo: EtapeType[] = ['pieceService'];
  const ouvertes: ProcId[] = ['identite', 'domicile'];
  const ajout = (exige?: ProcId) =>
    appliquerAction(
      a,
      { type: 'ajouter', p: 'identite', etape: 'pieceService', exige },
      dispo,
      ouvertes,
    );
  assert.equal(ajout('identite'), a);
  assert.equal(ajout('vie'), a);
  assert.equal(ajout(undefined), a);
  assert.deepEqual(ajout('domicile').procedures.identite[2], {
    type: 'pieceService',
    exige: 'domicile',
  });
});

test('Atelier : jamais moins d’une étape ni plus de huit', () => {
  const a = x(base2());
  const seule = appliquerAction(
    a,
    { type: 'retirer', p: 'domicile', k: 0 },
    [],
    ['identite', 'domicile'],
  );
  assert.equal(seule, a);
  const pleine = {
    ...a,
    procedures: {
      ...a.procedures,
      identite: Array.from({ length: 8 }, () => P('piece')),
    },
  };
  assert.equal(
    appliquerAction(
      pleine,
      { type: 'ajouter', p: 'identite', etape: 'piece' },
      ['piece'],
      ['identite'],
    ),
    pleine,
  );
});

test('Atelier : retirer une étape reporte ses dossiers sur celle qui prend sa place', () => {
  const a0 = x(base2());
  const a = {
    ...a0,
    usagers: { ...a0.usagers, identite: [3, 5] },
    boucles: { ...a0.boucles, identite: [1, 2] },
  };
  const b = appliquerAction(
    a,
    { type: 'retirer', p: 'identite', k: 1 },
    [],
    ['identite'],
  );
  assert.deepEqual(
    b.procedures.identite.map((e) => e.type),
    ['piece'],
  );
  assert.deepEqual(b.usagers.identite, [8]);
  assert.deepEqual(b.boucles.identite, [3]);
});

test('Atelier : déplacer une étape, les dossiers restent à leur rang', () => {
  const a0 = x(base2());
  const a = { ...a0, usagers: { ...a0.usagers, identite: [3, 5] } };
  const b = appliquerAction(
    a,
    { type: 'deplacer', p: 'identite', k: 1, sens: -1 },
    [],
    ['identite'],
  );
  assert.deepEqual(
    b.procedures.identite.map((e) => e.type),
    ['visa', 'piece'],
  );
  assert.deepEqual(b.usagers.identite, [3, 5]);
  assert.equal(
    appliquerAction(
      a,
      { type: 'deplacer', p: 'identite', k: 1, sens: 1 },
      [],
      ['identite'],
    ),
    a,
  );
});

test('Atelier : changer la procédure exigée', () => {
  const a0 = x(base2());
  const a = {
    ...a0,
    procedures: { ...a0.procedures, identite: [P('pieceService', 'domicile')] },
    usagers: { ...a0.usagers, identite: [0] },
    boucles: { ...a0.boucles, identite: [0] },
  };
  const ouvertes: ProcId[] = ['identite', 'domicile', 'hebergement'];
  const b = appliquerAction(
    a,
    { type: 'exiger', p: 'identite', k: 0, exige: 'hebergement' },
    [],
    ouvertes,
  );
  assert.deepEqual(b.procedures.identite[0], {
    type: 'pieceService',
    exige: 'hebergement',
  });
  assert.equal(
    appliquerAction(
      a,
      { type: 'exiger', p: 'identite', k: 0, exige: 'identite' },
      [],
      ouvertes,
    ),
    a,
  );
});
