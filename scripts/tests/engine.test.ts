import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
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

test('formatEntier n\'affiche jamais de valeur négative', () => {
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
