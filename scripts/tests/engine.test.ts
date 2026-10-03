import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import { BALANCE } from '../../constants/balance';
import { formatEntier } from '../../utils/formatters';
import type { GameState, NoteId } from '../../types/game';

/** Partie neuve, Cerfa signé, budget et formulaires illimités. */
export function base(): GameState {
  return { ...E.signerCerfa(E.etatInitial(0), 'Test', 0), budget: 1e9, formulaires: 1e9 };
}

/** Marque des notes comme achetées et effectives depuis t = 0. */
export function avecNotes(s: GameState, ids: NoteId[]): GameState {
  const notes = { ...s.notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return { ...s, notes };
}

/** Avance de `secondes` par pas de 100 ms. */
export function avancer(s: GameState, secondes: number, depart = 0): GameState {
  let r = s;
  for (let i = 1; i <= secondes * 10; i++) r = E.tick(r, 0.1, depart + i * 100).s;
  return r;
}

test('la file ne devient jamais négative', () => {
  let s = avecNotes(base(), ['renfort', 'rejet', 'horaires']);
  s = { ...s, agents: { stagiaire: 10, accueil: 4, instructeur: 0, titulaire: 0 } };
  s = E.reglerTauxRejet(s, 0.5, 0);
  for (let i = 1; i <= 3000; i++) {
    s = E.tick(s, 0.1, i * 100).s;
    for (let p = 0; p < 4; p++) assert.ok(s.file[p] >= 0, `file[${p}] = ${s.file[p]} au pas ${i}`);
  }
});

test('formatEntier n’affiche jamais de valeur négative', () => {
  assert.equal(formatEntier(-1e-15), '0');
  assert.equal(formatEntier(-3), '0');
  assert.equal(formatEntier(12.7), '12');
});

test('avec 3 d/s de collègues, la file reste abondante', () => {
  let s = avecNotes(base(), ['renfort', 'rejet', 'horaires']);
  s = { ...s, agents: { stagiaire: 10, accueil: 4, instructeur: 0, titulaire: 0 } };
  s = avancer(s, 120);
  assert.ok(E.dossiersEnAttente(s) > 40, `file = ${E.dossiersEnAttente(s)}`);
});

test('un tap traite toujours un dossier quand des collègues travaillent', () => {
  let s = avecNotes(base(), ['renfort']);
  s = { ...s, agents: { stagiaire: 10, accueil: 4, instructeur: 0, titulaire: 0 } };
  s = avancer(s, 60);
  const r = E.tamponner(s, 60_100);
  assert.ok(r.ev.traites >= 1, `traités = ${r.ev.traites}`);
});

test('fluxEntrant compte les nouvelles demandes et les retours', () => {
  const s0 = base();
  const m = E.getModifiers(s0, 0);
  const s = { ...s0, file: [0, 0, 0, 0] as [number, number, number, number], retours: [0, 0, 20, 0] as [number, number, number, number] };
  const attendu = (100 - 20) * (1 / 8) + 20 / 20;
  assert.ok(Math.abs(E.fluxEntrant(s, m) - attendu) < 1e-9, `flux = ${E.fluxEntrant(s, m)}`);
});

test('un grand pas de temps ne crée pas de dossiers fantômes', () => {
  let s = avecNotes(base(), ['horaires']);
  s = { ...s, population: 100, file: [0, 0, 0, 0] as [number, number, number, number] };
  const r = E.tick(s, 20, 20_000);
  const enAttente = E.dossiersEnAttente(r.s);
  const enRetour = r.s.retours.reduce((a, b) => a + b, 0);
  assert.ok(
    enAttente + enRetour <= r.s.population + 1e-9,
    `file + retours = ${enAttente + enRetour}, population = ${r.s.population}`,
  );
});

test('plafondDemande = population × demandeRate × demandeMult', () => {
  const s = avecNotes(base(), ['horaires']);
  const m = E.getModifiers(s, 0);
  assert.ok(Math.abs(E.plafondDemande(s, m) - 100 * (1 / 8) * 1.5) < 1e-9);
});

test('saturation avec hystérésis 80 % / 70 %', () => {
  assert.equal(E.saturation(false, 7.9, 10), false);
  assert.equal(E.saturation(false, 8, 10), true);
  assert.equal(E.saturation(true, 7.5, 10), true);
  assert.equal(E.saturation(true, 6.9, 10), false);
  assert.equal(E.saturation(false, 1, 0), true);
});

test('multiplicateur et prochain palier d’ancienneté', () => {
  assert.equal(E.multiplicateurAnciennete(9), 1);
  assert.equal(E.multiplicateurAnciennete(10), 2);
  assert.equal(E.multiplicateurAnciennete(25), 4);
  assert.equal(E.multiplicateurAnciennete(50), 8);
  assert.equal(E.prochainPalier(0), 10);
  assert.equal(E.prochainPalier(10), 25);
  assert.equal(E.prochainPalier(50), null);
});

test('le 10ᵉ stagiaire double la vitesse de tous les stagiaires', () => {
  const s = { ...base(), agents: { stagiaire: 9, accueil: 0, instructeur: 0, titulaire: 0 } };
  const m = E.getModifiers(s, 0);
  assert.ok(Math.abs(E.vitesseCollegues(s, m) - 0.9) < 1e-9);
  // 10 × 0,1 × 2 = 2 d/s, donc +1,1 d/s pour ce recrutement.
  assert.ok(Math.abs(E.gainAgent(s, 'stagiaire', m) - 1.1) < 1e-9, `gain = ${E.gainAgent(s, 'stagiaire', m)}`);
});

test('à prix de base, chaque rang est plus rentable que le précédent', async () => {
  const { AGENTS } = await import('../../constants/balance');
  for (let i = 1; i < AGENTS.length; i++) {
    const prec = AGENTS[i - 1].coutBase / AGENTS[i - 1].vitesse;
    const cour = AGENTS[i].coutBase / AGENTS[i].vitesse;
    assert.ok(cour < prec, `${AGENTS[i].id} : ${cour} €/(d/s) ≥ ${prec}`);
  }
});

test('la note n° 1 ne débloque que le stagiaire', () => {
  const m = E.getModifiers(avecNotes(base(), ['renfort']), 0);
  assert.deepEqual(m.agentsDisponibles, ['stagiaire']);
});

test('la note n° 2 débloque l’agent d’accueil et une prime de rejet de 20 %', () => {
  const m = E.getModifiers(avecNotes(base(), ['renfort', 'rejet']), 0);
  assert.ok(m.agentsDisponibles.includes('accueil'));
  assert.ok(Math.abs(m.primeRejet - 0.2) < 1e-9);
  const m2 = E.getModifiers(avecNotes(base(), ['renfort', 'rejet', 'prime']), 0);
  assert.ok(Math.abs(m2.primeRejet - 0.7) < 1e-9);
});

test('hors-ligne, les collègues traitent sans rejeter ni produire de Conformité', () => {
  let s = avecNotes(base(), ['renfort', 'rejet', 'piece']);
  s = { ...s, agents: { stagiaire: 10, accueil: 4, instructeur: 0, titulaire: 0 } };
  s = { ...E.reglerTauxRejet(s, 0.5, 0), derniereMaj: 0 };
  const r = E.simulerAbsence(s, 600_000);
  assert.ok(r.traites > 100, `traités = ${r.traites}`);
  assert.ok(r.budget > 0);
  assert.equal(r.s.conformitePoints, s.conformitePoints);
  assert.equal(r.s.stats.rejetes, s.stats.rejetes);
  assert.equal(r.s.abandons, s.abandons);
  assert.equal(r.s.tauxRejet, 0.5, 'le réglage du joueur est conservé');
});

test('hors-ligne : la simulation s’arrête au plafond, même après une longue absence', () => {
  const s = { ...base(), agents: { stagiaire: 10, accueil: 0, instructeur: 0, titulaire: 0 }, derniereMaj: 0 };
  const r = E.simulerAbsence(s, 2 * 60 * 60 * 1000);
  assert.equal(r.secondes, BALANCE.horsLigneMax);
  assert.equal(r.s.derniereMaj, 2 * 60 * 60 * 1000, 'le temps au-delà du plafond est perdu, pas reporté');
});

test('réquisition d’urgence : seulement en rupture et sans budget pour une ramette', () => {
  const coince = { ...avecNotes(base(), ['renfort']), formulaires: 0, budget: 3 };
  assert.equal(E.requisitionUrgence(coince, 0).formulaires, BALANCE.ramette);
  assert.equal(E.requisitionUrgence({ ...coince, budget: 500 }, 0).formulaires, 0, 'qui peut payer achète');
  assert.equal(E.requisitionUrgence({ ...coince, formulaires: 50 }, 0).formulaires, 50, 'pas de rupture, pas de réquisition');
});

test('grades : rang selon les tampons, +10 % de dotation par grade', () => {
  assert.equal(E.rangGrade(0), 0);
  assert.equal(E.rangGrade(999), 0);
  assert.equal(E.rangGrade(1000), 1);
  assert.equal(E.rangGrade(10000), 2);
  assert.equal(E.rangGrade(150000), 4);
  assert.equal(E.rangGrade(1e9), 4);
  const s = base();
  const m0 = E.getModifiers(s, 0);
  const m2 = E.getModifiers({ ...s, tampons: 10000 }, 0);
  assert.ok(Math.abs(m2.dotationMult / m0.dotationMult - 1.2) < 1e-9);
});

test('tamponner ne raccourcit pas le délai d’instruction d’une note', () => {
  const s = { ...base(), notes: { tilleuls: { achetee: 0, effective: 90_000 } } };
  assert.equal(E.tamponner(s, 1000).s.notes.tilleuls?.effective, 90_000);
});

test('le prix du stagiaire monte moins vite que celui du titulaire', () => {
  assert.equal(E.coutAgent('stagiaire', 0), 100);
  assert.ok(E.coutAgent('stagiaire', 10) / E.coutAgent('stagiaire', 0) < 3.2);
  assert.ok(E.coutAgent('titulaire', 10) / E.coutAgent('titulaire', 0) > 4);
});

test('rejet au tampon : chaque dossier est tiré au sort selon le taux', () => {
  let s = avecNotes(base(), ['renfort', 'rejet']);
  s = E.reglerTauxRejet(s, 0.5, 0);
  assert.equal(E.tamponner(s, 1000, () => 0).ev.rejetes, 1, 'tirage sous le taux : rejeté');
  assert.equal(E.tamponner(s, 1000, () => 0.99).ev.rejetes, 0, 'tirage au-dessus : accepté');
});

test('rejet au tampon : en moyenne, la part rejetée suit le taux (avec des séries)', () => {
  let s = avecNotes(base(), ['renfort', 'rejet']);
  s = E.reglerTauxRejet(s, 0.5, 0);
  // Générateur pseudo-aléatoire fixe : le test ne dépend pas de la chance.
  let graine = 12345;
  const alea = () => ((graine = (graine * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  let rejetes = 0;
  let serieMax = 0;
  let serie = 0;
  for (let i = 0; i < 2000; i++) {
    const r = E.tamponner(s, 1000, alea);
    rejetes += r.ev.rejetes;
    serie = r.ev.rejetes > 0 ? serie + 1 : 0;
    serieMax = Math.max(serieMax, serie);
  }
  assert.ok(Math.abs(rejetes / 2000 - 0.5) < 0.05, `part rejetée ${rejetes / 2000}`);
  assert.ok(serieMax >= 3, 'un vrai tirage produit des séries de rejets');
});
