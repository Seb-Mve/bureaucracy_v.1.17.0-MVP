import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import {
  aboutitPourUsagers,
  appliquerAction,
  procedureAboutit,
} from '../../data/acte2/procedures';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import { PRESETS, sauvegardePreset } from '../../data/presets';
import { BALANCE2 } from '../../constants/balanceActe2';
import type { GameState } from '../../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId } from '../../types/acte2';

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

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

/** Notes de l'acte II en vigueur depuis t = 0. */
function avecNotes(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

/** Remplace des procédures ; leurs stocks repartent à zéro (usagers, en boucle, qui poursuivent). */
function avecProcedures(
  s: GameState,
  procedures: Partial<Record<ProcId, Etape[]>>,
): GameState {
  const toutes = { ...x(s).procedures, ...procedures };
  return avec2(s, {
    procedures: toutes,
    usagers: D.stocksPour(toutes),
    boucles: D.stocksPour(toutes),
    suites: D.stocksPour(toutes),
  });
}

/** `secondes` de jeu par pas de 0,1 s depuis t = 0. */
function avancer(s0: GameState, secondes: number): GameState {
  let s = s0;
  for (let i = 1; i <= secondes * 10; i++) s = D.tick2(s, 0.1, i * 100).s;
  return s;
}

const proche = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

const PS = (exige: ProcId): Etape => ({ type: 'pieceService', exige });

/** Boucle Carte d'identité ⇄ Justificatif de domicile ; le visa de la carte vient après sa pièce de service. */
const BOUCLE: Partial<Record<ProcId, Etape[]>> = {
  identite: [{ type: 'piece' }, PS('domicile'), { type: 'visa' }],
  domicile: [{ type: 'piece' }, PS('identite')],
};

/** Toute la population garée dans une procédure fermée : aucune demande, ni installation ni exode. */
function sansDemande(s: GameState): GameState {
  return avec2(s, {
    population: BALANCE2.populationMax,
    usagers: { ...x(s).usagers, vie: [BALANCE2.populationMax] },
  });
}

test('seule la Carte d’identité reçoit des demandes : le Justificatif attend qu’on l’exige', () => {
  const s = D.tick2(avecNotes(base2(), ['atelier']), 1, 1000).s;
  assert.equal(x(s).usagers.domicile[0], 0);
  assert.ok(x(s).usagers.identite[0] > BALANCE2.fileInitiale - 0.5);
});

test('un visa délivre la carte à l’usager ; un justificatif est délivré au service', () => {
  const jamais = () => 0.999;
  let s = avecProcedures(avecNotes(base2(), ['atelier']), {
    identite: [{ type: 'visa' }],
    domicile: [{ type: 'visa' }],
  });
  s = avec2(s, { usagers: { ...x(s).usagers, identite: [5] } });
  const carte = D.tamponner2(s, 0, jamais).s;
  // Le visa du joueur délivre une carte entière à son usager.
  proche(x(carte).stats.delivresUsagers.identite, 1);
  assert.equal(x(carte).stats.delivresService.identite, 0);
  // Un dossier d'usager dans une procédure que personne ne demande : un dossier lié, délivré au service.
  s = avec2(s, { usagers: { ...x(s).usagers, identite: [0], domicile: [5] } });
  const justificatif = D.tamponner2(s, 0, jamais).s;
  proche(x(justificatif).stats.delivresService.domicile, 1);
  assert.equal(x(justificatif).stats.delivresUsagers.domicile, 0);
});

test('simple dépendance : la carte est remise à l’usager, le justificatif délivré au service', () => {
  let s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), {
    identite: [PS('domicile')],
    domicile: [{ type: 'piece' }],
  });
  s = avec2(s, {
    guichets: 100,
    population: 10,
    usagers: { ...x(s).usagers, identite: [10] },
  });
  s = avancer(s, 60);
  const st = x(s).stats;
  assert.ok(st.delivresUsagers.identite > 8, `${st.delivresUsagers.identite}`);
  assert.ok(st.delivresService.domicile > 8, `${st.delivresService.domicile}`);
  assert.equal(st.delivresService.identite, 0);
  assert.equal(st.delivresUsagers.domicile, 0);
  assert.equal(x(s).premiereBoucle, null);
});

test('après la boucle, la demande liée tourne et le dossier poursuit jusqu’au visa, où sa carte est délivrée', () => {
  let s = avecProcedures(
    avecNotes(base2(), ['atelier', 'pieceService']),
    BOUCLE,
  );
  s = sansDemande(
    avec2(s, {
      guichets: 100,
      agents: { instructeur: 100, chefBureau: 0, sousDirecteur: 0 },
      boucles: { ...x(s).boucles, identite: [20, 0, 0] },
    }),
  );
  s = avancer(s, 300);
  // Le nombre de dossiers en boucle ne bouge pas : chacun dépose une demande et poursuit sans en redéposer.
  proche(D.dossiersEnBoucle(x(s)), 20);
  const st = x(s).stats;
  assert.ok(
    st.delivresService.identite > 100,
    `${st.delivresService.identite}`,
  );
  assert.ok(
    st.delivresService.domicile > 100,
    `${st.delivresService.domicile}`,
  );
  assert.equal(st.delivresUsagers.identite, 0);
  // Ceux qui poursuivent ne s'accumulent pas : ils sortent à la délivrance.
  assert.ok(D.sommeStocks(x(s).suites) < 20, `${D.sommeStocks(x(s).suites)}`);
  assert.ok(D.visasEnAttente(x(s)) > 0, 'le visa reste alimenté');
  proche(D.dossiersDuService(x(s)), 20 + D.sommeStocks(x(s).suites));
});

test('rejetés, les dossiers qui poursuivent reprennent en tête sans redéposer de demande', () => {
  let s = avecProcedures(
    avecNotes(base2(), ['atelier', 'pieceService']),
    BOUCLE,
  );
  s = sansDemande(
    avec2(s, {
      guichets: 100,
      tauxRejet: 0.5,
      agents: { instructeur: 100, chefBureau: 0, sousDirecteur: 0 },
      boucles: { ...x(s).boucles, identite: [20, 0, 0] },
    }),
  );
  s = avancer(s, 600);
  proche(D.dossiersEnBoucle(x(s)), 20);
  assert.ok(D.sommeStocks(x(s).suites) < 60, `${D.sommeStocks(x(s).suites)}`);
  assert.ok(x(s).stats.franchiesBoucle > 1000);
});

test('un usager qui atteint la pièce de service en boucle est renvoyé chez lui ; son dossier poursuit sans lui', () => {
  let s = avecProcedures(
    avecNotes(base2(), ['atelier', 'pieceService']),
    BOUCLE,
  );
  s = sansDemande(
    avec2(s, {
      guichets: 100,
      agents: { instructeur: 100, chefBureau: 0, sousDirecteur: 0 },
    }),
  );
  s = avec2(s, { usagers: { ...x(s).usagers, identite: [0, 10, 0] } });
  s = avancer(s, 120);
  assert.ok(x(s).premiereBoucle !== null);
  // Un seul dossier en boucle par usager renvoyé chez lui (spec 009).
  proche(D.dossiersEnBoucle(x(s)), x(s).stats.abandonsDemarche);
  assert.ok(D.usagersAvecDemarche(x(s)) < 1e-6);
  // Sa carte est délivrée quand même, au service.
  assert.ok(
    x(s).stats.delivresService.identite > 9,
    `${x(s).stats.delivresService.identite}`,
  );
});

test('tant que la carte est délivrée aux usagers, personne ne s’impatiente en attendant', () => {
  let s = avecProcedures(base2(), { identite: [{ type: 'visa' }] });
  // Un guichet ouvert (personne ne s'installe avant le premier) ; aucun agent : personne ne franchit le visa.
  s = avec2(s, {
    population: 100,
    guichets: 1,
    usagers: { ...x(s).usagers, identite: [100] },
  });
  const r = D.tick2(s, 1, 1000).s;
  proche(x(r).usagers.identite[0], 100);
  assert.equal(x(r).abandons, 0);
  assert.equal(x(r).stats.abandonsProc.identite, 0);
  // La Carte d'identité aboutit : la ville continue de se peupler.
  proche(
    x(r).population,
    100 + (BALANCE2.populationMax - 100) * BALANCE2.installationRate,
  );
});

test('une fois la boucle formée, chaque seconde d’attente, une part des usagers renonce et quitte la ville', () => {
  let s = avecProcedures(
    avecNotes(base2(), ['atelier', 'pieceService']),
    BOUCLE,
  );
  // Aucun guichet : rien ne franchit d'étape ; toute la population attend (aucune demande, aucun exode).
  s = avec2(s, {
    guichets: 0,
    population: 100,
    usagers: { ...x(s).usagers, identite: [100, 0, 0] },
  });
  assert.equal(aboutitPourUsagers(x(s), ['identite', 'domicile']), false);
  const r = D.tick2(s, 1, 1000).s;
  const partis = 100 * (1 - Math.exp(-BALANCE2.impatience));
  proche(x(r).usagers.identite[0], 100 - partis);
  proche(x(r).abandons, partis);
  proche(x(r).stats.abandonsProc.identite, partis);
  proche(x(r).population, 100 - partis);
});

/**
 * Dix minutes de prise de fonctions (préréglage `debut`) à deux taps par seconde, sans rejet, formulaires à
 * volonté : la Carte d'identité est délivrée aux usagers tout du long. `equipe` : 20 guichets et 10 instructeurs,
 * assez pour que les étapes ne fassent pas attendre (le débit suit alors la demande, non la capacité).
 */
function dixMinutesDebut(identite?: Etape[], equipe = false): EtatActe2 {
  let s = sauvegardePreset('debut', 0);
  // Le guichet 3 rouvert (specs/012 : la prise de fonctions n'en a plus).
  s = avec2({ ...s, formulaires: 1e9 }, { guichets: 1 });
  if (equipe)
    s = avec2(s, {
      guichets: 20,
      agents: { ...x(s).agents, instructeur: 10 },
    });
  if (identite) {
    s = avecProcedures(s, { identite });
    s = avec2(s, {
      usagers: {
        ...x(s).usagers,
        identite: identite.map((_, k) => (k === 0 ? BALANCE2.fileInitiale : 0)),
      },
    });
  }
  assert.equal(x(s).tauxRejet, 0);
  for (let i = 1; i <= 6000; i++) {
    s = D.tick2(s, 0.1, i * 100).s;
    if (i % 5 === 0) s = D.tamponner2(s, i * 100, () => 0.5).s;
  }
  return x(s);
}

test('avant la boucle, les seuls abandons sont ceux que coûtent les étapes', () => {
  const y = dixMinutesDebut();
  assert.ok(y.premiereBoucle === null);
  // Pièce et Visa coûtent chacune 1 point de patience en ×1 : chaque étape franchie par un usager en perd
  // `abandonParPoint`, sauf les visas du joueur ; avant la boucle, toutes les étapes franchies le sont par des usagers.
  assert.ok(y.stats.franchies > 250, `${y.stats.franchies}`);
  proche(
    y.stats.abandonsProc.identite,
    BALANCE2.abandonParPoint * (y.stats.franchies - y.stats.visasTampons),
    1e-6,
  );
  proche(y.abandons, y.stats.abandonsProc.identite);
  // Compliquer la carte fait abandonner davantage : chaque usager franchit quatre étapes au lieu de deux, et la
  // Commission coûte deux points. À équipe égale, assez nombreuse pour que la capacité ne bride pas le débit.
  const simple = dixMinutesDebut(undefined, true);
  const complique = dixMinutesDebut(
    [
      { type: 'piece' },
      { type: 'visa' },
      { type: 'signature' },
      { type: 'commission' },
    ],
    true,
  );
  proche(
    simple.stats.abandonsProc.identite,
    BALANCE2.abandonParPoint *
      (simple.stats.franchies - simple.stats.visasTampons),
    1e-6,
  );
  assert.ok(
    complique.stats.abandonsProc.identite > simple.stats.abandonsProc.identite,
    `${complique.stats.abandonsProc.identite} ≤ ${simple.stats.abandonsProc.identite}`,
  );
  // Par carte délivrée, l'écart est net : plus du double d'abandons.
  const parCarte = (y: EtatActe2) =>
    y.stats.abandonsProc.identite / y.stats.delivresUsagers.identite;
  assert.ok(
    parCarte(complique) > 2 * parCarte(simple),
    `${parCarte(complique)} ≤ 2 × ${parCarte(simple)}`,
  );
});

test('quand plus aucune démarche n’aboutit, personne ne s’installe et la ville se vide', () => {
  const s0 = avecProcedures(
    avecNotes(base2(), ['atelier', 'pieceService']),
    BOUCLE,
  );
  // Aucun guichet : rien ne franchit d'étape pendant cette seconde.
  const s = avec2(s0, { population: 1000, guichets: 0 });
  assert.equal(aboutitPourUsagers(x(s), ['identite', 'domicile']), false);
  const r = D.tick2(s, 1, 1000).s;
  // Sans guichet, aucune nouvelle demande (specs/012) : tous les habitants sans démarche peuvent partir.
  proche(x(r).population, 1000 - 1000 * (1 - Math.exp(-BALANCE2.exode)));
});

test('une procédure demandée aboutit tant qu’aucune de ses pièces ne ramène à elle', () => {
  const s = avecNotes(base2(), ['atelier', 'pieceService', 'troisieme']);
  const ouvertes: ProcId[] = ['identite', 'domicile', 'hebergement'];
  const simple = avecProcedures(s, { identite: [PS('domicile')] });
  assert.equal(
    procedureAboutit(x(simple).procedures, ouvertes, 'identite'),
    true,
  );
  assert.equal(aboutitPourUsagers(x(simple), ouvertes), true);
  const boucle = avecProcedures(s, BOUCLE);
  assert.equal(
    procedureAboutit(x(boucle).procedures, ouvertes, 'identite'),
    false,
  );
  assert.equal(aboutitPourUsagers(x(boucle), ouvertes), false);
  // Une boucle entre deux procédures que personne ne demande : la carte aboutit toujours.
  const ailleurs = avecProcedures(s, {
    domicile: [PS('hebergement')],
    hebergement: [PS('domicile')],
  });
  assert.equal(aboutitPourUsagers(x(ailleurs), ouvertes), true);
});
