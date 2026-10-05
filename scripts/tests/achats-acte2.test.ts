import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as V from '../../data/acte2/vues';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import { BALANCE } from '../../constants/balance';
import { BALANCE2 } from '../../constants/balanceActe2';
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

test('ramette de l’acte II : 30 à 40 % de la dotation d’une étape en ×1, au grade de fin d’acte I', () => {
  const s = { ...base2(), tampons: 160_000 };
  const dotationEtape = BALANCE2.dotation * D.getModifiers2(s, 0).dotationMult;
  const formulaireEtape = D.prixRamette2(s) / BALANCE.ramette;
  const part = formulaireEtape / dotationEtape;
  assert.ok(part >= 0.3 && part <= 0.4, `part des fournitures : ${part}`);
});

test('Marché public de fournitures : note n° 6, après les Exemplaires, débloque le Service des achats', () => {
  const s = avecNotes(base2(), ['prise', 'agents', 'atelier', 'signature']);
  assert.ok(!D.notesVisibles2(avec2(s, { stats: { ...x(s).stats, franchies: 50_000 } })).includes('achats'));
  const e = avecNotes(s, ['exemplaires']);
  assert.ok(!D.notesVisibles2(avec2(e, { stats: { ...x(e).stats, franchies: 17_999 } })).includes('achats'));
  const pret = avec2(e, { stats: { ...x(e).stats, franchies: 18_000 } });
  assert.ok(D.notesVisibles2(pret).includes('achats'));
  assert.equal(V.notesAffichees2(pret, 0).find((n) => n.id === 'achats')?.numero, 6);
  assert.equal(D.getModifiers2(pret, 0).achatsVisible, false);
  assert.equal(D.getModifiers2(avecNotes(pret, ['achats']), 0).achatsVisible, true);
});

/** Direction de 10 guichets et 10 instructeurs, Service des achats en vigueur, sans dossier ni usager. */
function avecAchats(budget: number, formulaires: number): GameState {
  const b = avecNotes(base2(), ['prise', 'agents', 'achats']);
  return {
    ...avec2(b, {
      guichets: 10,
      agents: { instructeur: 10, chefBureau: 0, sousDirecteur: 0 },
      usagers: D.stocksPour(x(b).procedures),
      population: 0,
    }),
    budget,
    formulaires,
  };
}

test('Service des achats : sous 30 s de capacité, il commande des ramettes sur le budget', () => {
  const s = avecAchats(10_000, 0);
  // (10 × 0,5 + 10 × 0,3 × 2 [ancienneté] + 3 taps) × ×1 × 30 s = 420 formulaires : 5 ramettes.
  const besoin = (D.vitesseGuichets(x(s)) + D.vitesseVisas(x(s)) + 3) * BALANCE2.achatsSecondes;
  const ramettes = Math.ceil(besoin / BALANCE.ramette);
  const r = D.tick2(s, 0.1, 100);
  assert.equal(r.s.formulaires, ramettes * BALANCE.ramette);
  proche(r.ev.achats, ramettes * BALANCE2.prixRamette);
  proche(r.s.budget, 10_000 - ramettes * BALANCE2.prixRamette);
  assert.equal(r.s.stats.formulairesAchetes, ramettes * BALANCE.ramette);
  // Stock suffisant : rien.
  const plein = D.tick2(r.s, 0.1, 200);
  assert.equal(plein.ev.achats, 0);
  // Pas de quoi payer une ramette : rien.
  assert.equal(D.tick2(avecAchats(BALANCE2.prixRamette - 1, 0), 0.1, 100).ev.achats, 0);
});

test('Service des achats : les Exemplaires multiplient la commande', () => {
  const un = D.tick2(avecAchats(10_000, 0), 0.1, 100).ev.achats;
  const trois = D.tick2(avec2(avecAchats(10_000, 0), { exemplaires: 3 }), 0.1, 100).ev.achats;
  assert.ok(trois > 2.5 * un, `${trois} contre ${un}`);
});

test('Service des achats : suspendu par son interrupteur, refusé avant sa note', () => {
  const s = avecAchats(10_000, 0);
  const coupe = D.reglerAchats(s, false, 0);
  assert.equal(x(coupe).achatsActifs, false);
  assert.equal(D.tick2(coupe, 0.1, 100).ev.achats, 0);
  assert.equal(x(D.reglerAchats(coupe, true, 0)).achatsActifs, true);
  assert.equal(D.reglerAchats(s, true, 0), s, 'déjà en service : même objet');
  const avant = { ...base2(), budget: 10_000, formulaires: 0 };
  assert.equal(D.reglerAchats(avant, false, 0), avant);
  assert.equal(D.tick2(avant, 0.1, 100).ev.achats, 0);
});

test('Service des achats : il commande aussi pendant une absence', () => {
  const s = { ...avecAchats(10_000, 0), derniereMaj: 0 };
  const r = D.simulerAbsence2(s, 60_000);
  assert.ok(r.s.stats.formulairesAchetes > 0);
  assert.ok(r.s.budget < 10_000);
});

test('abandons par procédure : patience et rejet, comptés dans la procédure de l’usager', () => {
  const b = avec2(base2(), { tauxRejet: 0.5 });
  const s = avec2(b, {
    procedures: { ...x(b).procedures, identite: [{ type: 'visa' }] },
    usagers: { ...x(b).usagers, identite: [5] },
  });
  const r = D.tamponner2(s, 0, () => 0);
  // Aucune patience perdue au visa du joueur, puis un tiers de la demande rejetée.
  proche(x(r.s).stats.abandonsProc.identite, 1 / 3);
  proche(x(r.s).stats.abandonsProc.identite, x(r.s).abandons);
  assert.equal(x(r.s).stats.abandonsProc.domicile, 0);
});

test('évènements : formulaires consommés par les étapes franchies', () => {
  const s = avec2(base2(), { exemplaires: 2 });
  const r = D.tamponner2(s, 0);
  proche(r.ev.formulaires, 2);
  assert.equal(r.ev.achats, 0);
});
