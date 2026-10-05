import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import { nouvellesLettres } from '../../data/courrier';
import { lettreAbsence2 } from '../../data/acte2/courrier2';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import type { GameState } from '../../types/game';
import {
  appliquerAction,
  estBoucle,
  procsEnBoucle,
} from '../../data/acte2/procedures';
import { BALANCE } from '../../constants/balance';
import { BALANCE2, PROCEDURES_INITIALES } from '../../constants/balanceActe2';
import { NOTES2 } from '../../data/acte2/notes2';
import type { Note2Id } from '../../types/acte2';
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
  // specs/012 : aucun guichet, 20 demandes au visa, personne à la vérification des pièces.
  assert.equal(x(s).guichets, 0);
  assert.equal(x(s).reouvertureVisible, false);
  assert.deepEqual(
    x(s).procedures.identite.map((e) => e.type),
    ['piece', 'visa'],
  );
  assert.deepEqual(x(s).usagers.identite, [0, 20]);
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

/** Marque des notes de l'acte II comme achetées et effectives depuis t = 0. */
function avecNotes2(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

test('début d’acte : seule la Carte d’identité est ouverte, l’Atelier est fermé', () => {
  const m = D.getModifiers2(base2(), 0);
  assert.deepEqual(m.procsOuvertes, ['identite']);
  assert.deepEqual(m.etapesDisponibles, ['visa']);
  assert.equal(m.atelierVisible, false);
  assert.equal(m.recrutementVisible, false);
  assert.equal(m.rejetMax, 0.5);
});

test('le catalogue compte 18 notes numérotées de 1 à 18', () => {
  assert.deepEqual(
    NOTES2.map((n) => n.numero),
    Array.from({ length: 18 }, (_, i) => i + 1),
  );
});

test('la note n° 1 apparaît quand plus rien n’est à viser et qu’une demande attend la vérification des pièces, puis le reste', () => {
  let s = base2();
  assert.ok(!D.notesVisibles2(s).includes('prise'), 'cachée à l’arrivée');
  for (let i = 0; i < BALANCE2.visasInitiaux; i++)
    s = D.tamponner2(s, 0, () => 0.99).s;
  assert.ok(D.visasEnAttente(x(s)) < 1e-9);
  assert.ok(
    !D.notesVisibles2(s).includes('prise'),
    'personne n’attend encore la vérification',
  );
  // Sans guichet, les nouvelles demandes s'entassent à la première étape.
  s = D.tick2(s, 1, 1000).s;
  assert.ok(x(s).usagers.identite[0] >= 1);
  assert.equal(x(s).reouvertureVisible, true);
  assert.ok(D.notesVisibles2(s).includes('prise'));
  // Une demande revenue au visa ne la cache plus.
  s = D.tick2(
    avec2(s, { usagers: { ...x(s).usagers, identite: [0, 5] } }),
    0.1,
    1100,
  ).s;
  assert.ok(D.notesVisibles2(s).includes('prise'));
  assert.equal(
    D.getModifiers2(D.acheterNote2(s, 'prise', 1100), 1100).recrutementVisible,
    true,
  );
});

test('note n° 1 : visible d’emblée quand des guichets sont offerts (Antériorité)', () => {
  assert.ok(
    D.notesVisibles2(avec2(base2(), { guichets: 10 })).includes('prise'),
  );
});

test('sans guichet, rien ne bouge tant que le chef de service ne tamponne pas', () => {
  const s0 = base2();
  let s = s0;
  for (let i = 1; i <= 100; i++) s = D.tick2(s, 0.1, i * 100).s;
  assert.equal(s.tampons, s0.tampons);
  assert.equal(s.budget, s0.budget);
  assert.equal(s.formulaires, s0.formulaires);
  assert.equal(D.visasEnAttente(x(s)), BALANCE2.visasInitiaux);
  assert.ok(
    x(s).usagers.identite[0] > 20,
    'les demandes s’entassent à la vérification des pièces',
  );
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
    reformes: {
      ...base2().reformes,
      jurisprudence: ['anciennete', 'videJuridique'],
    },
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
  const vide = D.tamponner2(
    avec2(base2(), { usagers: { ...x(base2()).usagers, identite: [0, 0] } }),
    0,
  );
  assert.equal(vide.ev.delivres, 0);
});

test('sauvegarde antérieure à specs/012 : la note n° 1 reste visible', () => {
  const s = base2();
  const { reouvertureVisible: _r, ...reste } = x(s);
  const ancien = { ...s, acte2: reste } as unknown as GameState;
  assert.equal(estSauvegardeValide(ancien), true);
  assert.equal(x(normaliserSauvegarde(ancien)).reouvertureVisible, true);
});

test('l’Atelier ouvre le Justificatif de domicile et la Pièce justificative', () => {
  const m = D.getModifiers2(avecNotes2(base2(), ['atelier']), 0);
  assert.equal(m.atelierVisible, true);
  assert.deepEqual(m.procsOuvertes, ['identite', 'domicile']);
  assert.ok(m.etapesDisponibles.includes('piece'));
});

test('une note en instruction ne s’applique qu’à la fin de son délai', () => {
  let s = avec2(base2(), { stats: { ...x(base2()).stats, franchies: 3000 } });
  s = D.acheterNote2(s, 'atelier', 0);
  assert.equal(D.getModifiers2(s, 1000).atelierVisible, false);
  assert.equal(D.getModifiers2(s, 120_000).atelierVisible, true);
});

test('Promotion : visible à 100 % de dématérialisation, termine l’acte', () => {
  const s = avec2(base2(), { demaPoints: BALANCE2.demaCible });
  assert.ok(D.notesVisibles2(s).includes('promotion'));
  assert.equal(x(D.acheterNote2(s, 'promotion', 0)).acteTermine, true);
});

test('grades : la dotation de l’acte II suit le compteur de tampons', () => {
  proche(D.getModifiers2({ ...base2(), tampons: 10000 }, 0).dotationMult, 1.2);
});

/** Avance de `secondes` par pas de 100 ms. */
function avancer2(s: GameState, secondes: number, depart = 0): GameState {
  let r = s;
  for (let i = 1; i <= secondes * 10; i++)
    r = D.tick2(r, 0.1, depart + i * 100).s;
  return r;
}

/** Une procédure à un seul Visa, avec des dossiers d'usagers ou en boucle à ce visa. */
function auVisa(s: GameState, usagers: number, boucles: number): GameState {
  return avec2(s, {
    procedures: { ...x(s).procedures, identite: [{ type: 'visa' }] },
    usagers: { ...x(s).usagers, identite: [usagers] },
    boucles: { ...x(s).boucles, identite: [boucles] },
  });
}

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
  proche(
    x(s).usagers.identite[1],
    BALANCE2.visasInitiaux + 0.5 * (1 - BALANCE2.abandonParPoint),
  );
  proche(s.tampons, 0.5);
});

test('un tap accorde un visa : dotation, tampon, Conformité', () => {
  const s0 = auVisa(base2(), 5, 0);
  const r = D.tamponner2(s0, 0);
  assert.equal(r.ev.visas, 1);
  proche(x(r.s).usagers.identite[0], 4);
  proche(r.s.budget - s0.budget, BALANCE2.dotation);
  proche(x(r.s).conformitePoints, 2 * BALANCE2.conformiteParPoint);
  proche(r.s.tampons, s0.tampons + 1);
});

test('sans visa en attente, le tap ne fait rien', () => {
  const s0 = auVisa(base2(), 0, 0);
  const r = D.tamponner2(s0, 0);
  assert.equal(r.ev.aucunVisa, true);
  assert.equal(r.s.budget, s0.budget);
});

/** Tirage qui rejette toujours (alea < taux), et tirage qui ne rejette jamais. */
const toujours = () => 0;
const jamais = () => 0.999;

test('rejet d’un usager : il perd patience et peut abandonner', () => {
  const s0 = avec2(auVisa(base2(), 5, 0), { tauxRejet: 0.5 });
  const r = D.tamponner2(s0, 0, toujours);
  // 4 % abandonnent au visa ; le reste est rejeté (tirage) ; un tiers des rejetés abandonne.
  proche(x(r.s).abandons, 0.04 + 0.96 / 3);
  proche(x(r.s).usagers.identite[0], 4 + 0.96 - 0.96 / 3);
  proche(
    r.s.budget - s0.budget,
    BALANCE2.dotation * (1 + 0.96 * BALANCE2.primeRejet),
  );
  proche(x(D.tamponner2(s0, 0, jamais).s).abandons, 0.04);
});

test('rejet d’un dossier en boucle : aucun coût, il est redéposé', () => {
  const s0 = avec2(auVisa(base2(), 0, 5), { tauxRejet: 0.5 });
  const r = D.tamponner2(s0, 0, toujours);
  assert.equal(x(r.s).abandons, 0);
  proche(x(r.s).boucles.identite[0], 5);
  proche(x(r.s).demaPoints, 1);
});

test('automates : le rejet est au taux moyen, sans tirage', () => {
  let s = avec2(base2(), {
    tauxRejet: 0.5,
    agents: { instructeur: 50, chefBureau: 0, sousDirecteur: 0 },
    population: 0,
  });
  s = avec2(s, { usagers: { ...x(s).usagers, identite: [0, 10] } });
  const a = D.tick2(s, 1, 1000).s,
    b = D.tick2(s, 1, 1000).s;
  assert.deepEqual(x(a).usagers, x(b).usagers);
});

test('Exemplaires ×3 : trois formulaires par étape, dotation ×2,1', () => {
  const s0 = avec2(auVisa(base2(), 5, 0), { exemplaires: 3 });
  const r = D.tamponner2(s0, 0);
  proche(s0.formulaires - r.s.formulaires, 3);
  proche(r.ev.formulaires, 3);
  proche(r.s.budget - s0.budget, 2.1 * BALANCE2.dotation);
});

test('rupture d’imprimés : aucun visa sans formulaires', () => {
  const s0 = { ...auVisa(base2(), 5, 0), formulaires: 0 };
  const r = D.tamponner2(s0, 0);
  assert.equal(r.ev.rupture, true);
  assert.deepEqual(x(r.s).usagers.identite, [5]);
});

test('une boucle renvoie les usagers chez eux et produit de la dématérialisation', () => {
  let s = avecNotes2(base2(), ['atelier', 'pieceService']);
  s = avec2(s, {
    guichets: 100,
    population: 10,
    procedures: {
      ...x(s).procedures,
      identite: [{ type: 'pieceService', exige: 'domicile' }],
      domicile: [{ type: 'pieceService', exige: 'identite' }],
    },
    usagers: { ...x(s).usagers, identite: [10], domicile: [0] },
    boucles: { ...x(s).boucles, identite: [0], domicile: [0] },
  });
  s = avancer2(s, 10);
  assert.ok(x(s).premiereBoucle !== null);
  assert.ok(x(s).stats.abandonsDemarche > 0);
  assert.ok(D.dossiersEnBoucle(x(s)) > 0);
  assert.ok(x(s).demaPoints > 0);
});

test('sans nouvel usager, les dossiers en boucle circulent sans se multiplier', () => {
  let s = avecNotes2(base2(), ['atelier', 'pieceService']);
  // Population entière garée dans la procédure fermée : aucune demande, aucune installation.
  s = avec2(s, {
    guichets: 100,
    population: BALANCE2.populationMax,
    procedures: {
      ...x(s).procedures,
      identite: [
        { type: 'piece' },
        { type: 'pieceService', exige: 'domicile' },
      ],
      domicile: [
        { type: 'pieceService', exige: 'identite' },
        { type: 'piece' },
      ],
    },
    usagers: {
      ...x(s).usagers,
      identite: [0, 0],
      domicile: [0, 0],
      vie: [BALANCE2.populationMax],
    },
    boucles: { ...x(s).boucles, identite: [50, 0], domicile: [0, 0] },
    suites: { ...x(s).suites, identite: [0, 0], domicile: [0, 0] },
  });
  s = avancer2(s, 600);
  proche(D.dossiersEnBoucle(x(s)), 50, 1e-6);
  assert.ok(x(s).stats.franchiesBoucle > 1000);
  assert.ok(x(s).boucles.domicile[0] > 0);
});

test('simple dépendance : un second dossier d’usager, pas de dématérialisation', () => {
  let s = avecNotes2(base2(), ['atelier', 'pieceService']);
  s = avec2(s, {
    guichets: 100,
    procedures: {
      ...x(s).procedures,
      identite: [{ type: 'pieceService', exige: 'domicile' }],
    },
    usagers: { ...x(s).usagers, identite: [10] },
    boucles: { ...x(s).boucles, identite: [0] },
  });
  s = avancer2(s, 30);
  assert.equal(x(s).demaPoints, 0);
  assert.equal(x(s).premiereBoucle, null);
  assert.ok(x(s).usagers.domicile[0] > 0);
});

test('sans boucle, le Taux de dématérialisation reste à 0 exactement', () => {
  const s = avancer2(
    avec2(avecNotes2(base2(), ['prise', 'agents']), {
      guichets: 10,
      agents: { instructeur: 10, chefBureau: 0, sousDirecteur: 0 },
    }),
    120,
  );
  assert.ok(x(s).stats.franchies > 100);
  assert.equal(x(s).demaPoints, 0);
  assert.equal(D.dematerialisation(x(s)), 0);
});

test('guichets : il faut la note n° 1, puis le prix monte de 15 %', () => {
  const s = base2();
  assert.equal(D.acheterGuichet(s, 0), s);
  const achete = D.acheterGuichet(avecNotes2(s, ['prise']), 0);
  assert.equal(x(achete).guichets, 1);
  assert.equal(s.budget - achete.budget, 30);
  assert.equal(D.coutGuichet(0), 30);
  assert.equal(D.coutGuichet(1), Math.ceil(30 * 1.15));
});

test('agents : débloqués par note, ancienneté comprise', () => {
  let s = base2();
  assert.equal(D.peutAcheterAgent2(s, 'instructeur', 0), false);
  s = D.acheterAgent2(avecNotes2(s, ['agents']), 'instructeur', 0);
  assert.equal(x(s).agents.instructeur, 1);
  proche(D.vitesseVisas(x(s)), 0.3);
  // Le 10ᵉ instructeur double la vitesse de tous les instructeurs.
  const neuf = { ...x(s), agents: { ...x(s).agents, instructeur: 9 } };
  proche(D.gainAgent2(neuf, 'instructeur'), 10 * 0.3 * 2 - 9 * 0.3);
});

test('Taux de rejet plafonné, Exemplaires exigés après leur note', () => {
  let s = D.reglerTauxRejet2(base2(), 0.9, 0);
  proche(x(s).tauxRejet, 0.5);
  assert.equal(x(D.reglerExemplaires(s, 3, 0)).exemplaires, 1);
  s = avecNotes2(s, ['exemplaires']);
  assert.equal(x(D.reglerExemplaires(s, 3, 0)).exemplaires, 3);
});

test('Atelier fermé : aucune modification de procédure', () => {
  const s = base2();
  assert.equal(
    D.modifierProcedure(s, { type: 'retirer', p: 'identite', k: 0 }, 0),
    s,
  );
  const s2 = D.modifierProcedure(
    avecNotes2(s, ['atelier']),
    { type: 'retirer', p: 'identite', k: 0 },
    0,
  );
  assert.deepEqual(
    x(s2).procedures.identite.map((e) => e.type),
    ['visa'],
  );
});

test('ramettes au prix de l’acte II, réquisition d’urgence sans budget', () => {
  const budget = 2.5 * BALANCE2.prixRamette;
  const s = D.acheterRamettes2({ ...base2(), budget, formulaires: 0 }, 5);
  assert.equal(s.formulaires, 2 * BALANCE.ramette);
  proche(s.budget, budget - 2 * BALANCE2.prixRamette);
  assert.ok(
    BALANCE2.prixRamette > BALANCE.prixRamette,
    'l’acte I garde son prix',
  );
  const vide = { ...base2(), budget: 0, formulaires: 0 };
  assert.equal(D.requisitionUrgence2(vide).formulaires, BALANCE.ramette);
  assert.equal(
    D.requisitionUrgence2({ ...vide, budget: BALANCE2.prixRamette })
      .formulaires,
    0,
  );
});

test('hors-ligne : la simulation s’arrête au plafond', () => {
  const s = avec2(avecNotes2(base2(), ['prise', 'agents']), {
    guichets: 20,
    agents: { instructeur: 20, chefBureau: 0, sousDirecteur: 0 },
  });
  const r = D.simulerAbsence2(s, 10 * 3600 * 1000);
  assert.equal(r.secondes, BALANCE.horsLigneMax);
  assert.ok(r.franchies > 0);
  assert.equal(r.s.derniereMaj, 10 * 3600 * 1000);
});

const lettres = (s: GameState, t: number): string[] =>
  nouvellesLettres(s, t).map((l) => l.id);

test('courrier : prise de fonctions à l’entrée dans l’acte II', () => {
  assert.ok(lettres(base2(), 0).includes('a2-prise'));
  assert.ok(
    !lettres(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0).includes(
      'a2-prise',
    ),
  );
});

test('courrier : les lettres de l’acte I restent muettes à l’acte II, le grade non', () => {
  const b = base2();
  const s = {
    ...b,
    tampons: 1e6,
    abandons: 1000,
    stats: { ...b.stats, traites: 50, rejetes: 400 },
  };
  const ids = lettres(s, 0);
  for (const id of ['bienvenue', 'premierRejet', 'fidelite', 'abandons']) {
    assert.ok(!ids.includes(id), id);
  }
  assert.ok(ids.includes('grade1'));
});

test('filet de sécurité : 15 puis 30 min après la note, tant qu’aucune boucle n’existe', () => {
  const s = avecNotes2(base2(), ['pieceService']);
  const min = 60_000;
  assert.ok(!lettres(s, 14 * min).includes('a2-filet1'));
  assert.ok(lettres(s, 15 * min).includes('a2-filet1'));
  assert.ok(!lettres(s, 29 * min).includes('a2-filet2'));
  assert.ok(lettres(s, 30 * min).includes('a2-filet2'));
  assert.ok(
    !lettres(avec2(s, { premiereBoucle: 1 }), 30 * min).includes('a2-filet1'),
  );
});

test('félicitations du S.I.C. au premier dossier en boucle', () => {
  assert.ok(
    lettres(avec2(base2(), { premiereBoucle: 1 }), 0).includes('a2-boucle'),
  );
});

test('démission : la pièce manquante est la première procédure modifiée', () => {
  const s = avec2(
    { ...base2(), demission: { deposeeLe: 0, relances: 0 } },
    { premiereModif: 'domicile' },
  );
  const l = nouvellesLettres(s, 0).find((v) => v.id === 'a2-demission');
  assert.ok(l?.corps.includes('Justificatif de domicile'));
});

test('rapport annuel à 100 % de dématérialisation', () => {
  const s = avec2(base2(), { demaPoints: BALANCE2.demaCible });
  const l = nouvellesLettres(s, 0).find((v) => v.id === 'a2-rapport');
  assert.ok(
    l?.corps.includes(
      'Taux de satisfaction : 100 % (sur les usagers restants)',
    ),
  );
});

test('démission déposée à l’acte II : ni demission1 ni demission2 (a2-demission seule)', () => {
  const s = avec2(
    { ...base2(), demission: { deposeeLe: 0, relances: 0 } },
    { premiereModif: 'domicile' },
  );
  const ids = lettres(s, 60 * 60_000);
  assert.ok(!ids.includes('demission1'));
  assert.ok(!ids.includes('demission2'));
  assert.ok(ids.includes('a2-demission'));
});

test('sauvegarde d’acte II : structure validée', () => {
  const bonne = base2();
  assert.equal(estSauvegardeValide(bonne), true);
  assert.equal(estSauvegardeValide({ ...bonne, acte: 3 }), false);
  const a2 = bonne.acte2 as EtatActe2;
  assert.equal(
    estSauvegardeValide({ ...bonne, acte2: { ...a2, procedures: undefined } }),
    false,
  );
  assert.equal(
    estSauvegardeValide({
      ...bonne,
      acte2: { ...a2, usagers: { identite: [] } },
    }),
    false,
  );
  assert.equal(
    estSauvegardeValide({
      ...bonne,
      acte2: {
        ...a2,
        boucles: { ...a2.boucles, domicile: [...a2.boucles.domicile, 0] },
      },
    }),
    false,
  );
});

test('entrée dans l’acte II : des visas attendent dès la première seconde', () => {
  const s = base2();
  assert.equal(D.visasEnAttente(x(s)), BALANCE2.visasInitiaux);
  assert.equal(D.tamponner2(s, 0).ev.visas, 1);
});

test('notes vues de l’acte II : la pastille « NOUVEAU » s’éteint, une seule fois', () => {
  const vue = D.marquerNotesVues2(avec2(base2(), { reouvertureVisible: true }));
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
  assert.match(l.corps, /vos services ont franchi 1\s500 étapes/);
  assert.match(l.corps, /2\s400\s€/);
  assert.equal(l.lue, false);
});
