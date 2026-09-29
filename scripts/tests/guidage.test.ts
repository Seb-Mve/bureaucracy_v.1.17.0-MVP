import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import { ordreDuJour } from '../../data/ordreDuJour';
import { circulaireAAfficher } from '../../data/circulaires';
import { normaliserSauvegarde } from '../../data/save';
import type { GameState, NoteId } from '../../types/game';

const base = (): GameState => E.signerCerfa(E.etatInitial(0), 'Test', 0);
const avecNotes = (s: GameState, ids: NoteId[]): GameState => {
  const notes = { ...s.notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return { ...s, notes };
};
const consigne = (s: GameState) => ordreDuJour(s, E.getModifiers(s, 0));
const agents = (stagiaire: number) => ({ stagiaire, accueil: 0, instructeur: 0, titulaire: 0 });

test('ordre du jour : déroulé complet', () => {
  let s = base();
  assert.equal(consigne(s)?.id, 'tamponner');
  assert.deepEqual(consigne({ ...s, tampons: 3.6 })?.progression, { valeur: 3, cible: 8 });

  s = { ...s, tampons: 8 };
  assert.equal(consigne(s)?.id, 'note');

  s = avecNotes(s, ['renfort']);
  assert.equal(consigne(s)?.id, 'recruter');
  assert.equal(consigne(s)?.onglet, 'recruitment');

  s = { ...s, agents: agents(1) };
  assert.equal(consigne(s)?.id, 'formulaires');

  s = { ...s, stats: { ...s.stats, formulairesAchetes: 100 } };
  assert.equal(consigne(s)?.id, 'poursuivre');

  s = { ...s, tampons: 250 };
  assert.equal(consigne(s)?.id, 'note');

  s = avecNotes(s, ['rejet']);
  assert.equal(consigne(s)?.id, 'rejet');

  s = { ...s, tauxRejet: 0.2 };
  assert.equal(consigne(s)?.id, 'attendrePerimetre');

  s = { ...s, tampons: 1_000_000 };
  assert.equal(consigne(s)?.id, 'perimetre');

  s = avecNotes(s, ['tilleuls']);
  assert.equal(consigne(s), null);
});

test('ordre du jour : les formulaires passent devant quand le stock est bas', () => {
  const s = { ...avecNotes({ ...base(), tampons: 8 }, ['renfort']), formulaires: 10 };
  assert.equal(consigne(s)?.id, 'formulaires');
});

test('circulaires : une à la fois, puis plus jamais', () => {
  let s = avecNotes(base(), ['renfort']);
  const c = circulaireAAfficher(s, E.getModifiers(s, 0));
  assert.equal(c?.id, 'collegues');
  s = { ...s, circulairesVues: ['collegues'] };
  assert.equal(circulaireAAfficher(s, E.getModifiers(s, 0)), null);
});

test('sauvegarde ancienne : les circulaires déjà débloquées sont marquées vues', () => {
  const s = avecNotes(base(), ['renfort', 'rejet']);
  const { circulairesVues: _, ...ancienne } = s;
  const n = normaliserSauvegarde(ancienne as GameState, 0);
  assert.deepEqual(n.circulairesVues, ['collegues', 'rejet']);
});

test('sauvegarde récente : circulairesVues conservé', () => {
  const s = { ...avecNotes(base(), ['renfort']), circulairesVues: [] };
  assert.deepEqual(normaliserSauvegarde(s, 0).circulairesVues, []);
});
