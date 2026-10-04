import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as R from '../../data/reforme';
import { nouvellesLettres } from '../../data/courrier';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import { BALANCE } from '../../constants/balance';
import { BALANCE2, REFORME } from '../../constants/balanceActe2';
import { PROCS, type EtatActe2, type Note2Id } from '../../types/acte2';
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

/** Toujours le premier choix : tirages reproductibles. */
const zero = () => 0;

/** Acte II d'une partie de Camille, note n° 10 en vigueur : la Réforme est possible. */
function avantReforme(): GameState {
  const fin = {
    ...E.signerCerfa(E.etatInitial(0), 'Camille', 1234),
    tampons: 300_000,
    conformitePoints: 500_000,
    notes: {
      renfort: { achetee: 0, effective: 0 },
      tilleuls: { achetee: 0, effective: 0 },
    },
  };
  const s = avecNotes2(D.entrerActe2(fin, 0), ['prise', 'atelier', 'reforme']);
  return {
    ...avec2(s, { conformitePoints: 1_500_000, guichets: 40 }),
    budget: 99_999,
  };
}

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

test('sclérose : le rendement de la dématérialisation baisse avec l’âge des services', () => {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  proche(D.rendementDemat(s, x(s)), 1);
  proche(D.rendementDemat(s, { ...x(s), duree: REFORME.scleroseS }), 0.5);
  const obtenus = { ...s, reformes: { ...s.reformes, trombonesObtenus: 10 } };
  proche(
    D.rendementDemat(obtenus, x(s)),
    1 + 10 * REFORME.jurisprudenceConstante,
  );
  proche(x(D.tick2(s, 2.5, 2500).s).duree, 2.5);
});

test('un usager qui entre dans une boucle n’y laisse qu’un seul dossier, même rejeté', () => {
  let s = avecNotes2(
    D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0),
    ['atelier', 'pieceService'],
  );
  // Population entière garée dans la procédure fermée : aucune demande, aucune installation.
  s = avec2(s, {
    guichets: 100,
    tauxRejet: 0.5,
    population: BALANCE2.populationMax,
    procedures: {
      ...x(s).procedures,
      identite: [
        { type: 'piece' },
        { type: 'pieceService', exige: 'domicile' },
      ],
      domicile: [{ type: 'pieceService', exige: 'identite' }],
    },
    usagers: {
      ...x(s).usagers,
      identite: [0, 10],
      domicile: [0],
      vie: [BALANCE2.populationMax],
    },
    boucles: { ...x(s).boucles, identite: [0, 0], domicile: [0] },
  });
  for (let i = 1; i <= 6000; i++) s = D.tick2(s, 0.1, i * 100).s;
  proche(D.dossiersEnBoucle(x(s)), 10 * (1 - BALANCE2.abandonParPoint));
  proche(x(s).stats.abandonsDemarche, 10 * (1 - BALANCE2.abandonParPoint));
});

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
  assert.deepEqual(s.agents, {
    stagiaire: 0,
    accueil: 0,
    instructeur: 0,
    titulaire: 0,
  });
  assert.deepEqual(s.cerfa, { signe: false, prenom: 'Camille', signeLe: null });
  assert.equal(s.fichePosteVue, true);
  assert.deepEqual(s.courrier, s0.courrier);
  assert.equal(s.reformes.nombre, 1);
  assert.equal(s.reformes.trombones, R.trombonesReforme(s0));
  assert.deepEqual(s.reformes.premierCerfa, {
    prenom: 'Camille',
    signeLe: 1234,
  });
  assert.deepEqual(s.reformes.notesInstruites, ['renfort', 'tilleuls']);
  assert.deepEqual(s.reformes.notes2Instruites, [
    'prise',
    'atelier',
    'reforme',
  ]);
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
  assert.equal(
    R.trombonesReforme(s0),
    Math.floor(Math.sqrt(2_000_000 / REFORME.k)),
  );
  const s = R.reformer(s0, 0, zero);
  assert.equal(s.reformes.conformiteConvertie, 2_000_000);
  assert.equal(s.reformes.trombonesObtenus, s.reformes.trombones);
  // Partie suivante : seule sa propre Conformité compte.
  assert.equal(
    R.trombonesReforme({ ...s, conformitePoints: REFORME.k * 4 }),
    2,
  );
});

test('le Cerfa est redemandé sous un nouveau numéro ; le premier reste l’original', () => {
  const s1 = R.reformer(avantReforme(), 0, zero);
  assert.equal(R.numeroCerfa(s1), '00001*02');
  const relance = avecNotes2(
    D.entrerActe2(E.signerCerfa(s1, 'Dominique', 9999), 0),
    ['reforme'],
  );
  const s2 = R.reformer(relance, 0, zero);
  assert.equal(R.numeroCerfa(s2), '00001*03');
  assert.equal(s2.cerfa.prenom, 'Dominique');
  assert.deepEqual(s2.reformes.premierCerfa, {
    prenom: 'Camille',
    signeLe: 1234,
  });
});

test('à chaque Réforme, la Direction et toutes les procédures changent de nom ; une lettre l’annonce', () => {
  const s0 = avantReforme();
  const s = R.reformer(s0, 0, () => 0.99);
  assert.notEqual(
    s.reformes.denomination.direction,
    s0.reformes.denomination.direction,
  );
  for (const p of PROCS) {
    assert.notEqual(
      s.reformes.denomination.procedures[p],
      s0.reformes.denomination.procedures[p],
    );
  }
  const lettres = nouvellesLettres(s, 0);
  const lettre = lettres.find((l) => l.id === 'reforme-1');
  assert.ok(lettre);
  assert.ok(lettre.corps.includes(s.reformes.denomination.direction));
  assert.ok(lettre.corps.includes('00001*02'));
  const envoyee = {
    ...s,
    lettresEnvoyees: [...s.lettresEnvoyees, 'reforme-1'],
  };
  assert.equal(
    nouvellesLettres(envoyee, 0).some((l) => l.id === 'reforme-1'),
    false,
  );
});

test('les lettres d’avancement ne repartent pas après la Réforme, les autres si', () => {
  const s0 = {
    ...avantReforme(),
    lettresEnvoyees: ['grade1', 'bienvenue', 'a2-prise'],
  };
  assert.deepEqual(R.reformer(s0, 0, zero).lettresEnvoyees, ['grade1']);
});
