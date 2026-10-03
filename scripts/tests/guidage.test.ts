import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import { normaliserSauvegarde } from '../../data/save';
import { nouvellesLettres } from '../../data/courrier';
import { teteDeFile } from '../../data/usagers';
import type { GameState, NoteId } from '../../types/game';

const base = (): GameState => E.signerCerfa(E.etatInitial(0), 'Test', 0);
const avecNotes = (s: GameState, ids: NoteId[]): GameState => {
  const notes = { ...s.notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return { ...s, notes };
};

test('sauvegarde ancienne : le champ des circulaires supprimées est retiré', () => {
  const ancienne = { ...base(), circulairesVues: ['collegues'] } as GameState;
  assert.equal('circulairesVues' in normaliserSauvegarde(ancienne), false);
});

test('lettre « Excédent de productivité » : file vide une fois la Conformité révélée', () => {
  const s = avecNotes(base(), ['renfort', 'rejet', 'piece', 'audit']);
  const vide = { ...s, file: [0, 0, 0, 0] as GameState['file'], retours: [0, 0, 0, 0] as GameState['file'] };
  assert.ok(nouvellesLettres(vide, 0).some((l) => l.id === 'penurie'));
  assert.ok(!nouvellesLettres({ ...vide, file: [0, 0, 0, 5] as GameState['file'] }, 0).some((l) => l.id === 'penurie'));
});

test('note n° 1 : seuil tiré au sort entre 20 et 30 tampons, fixe pour la partie', () => {
  assert.equal(E.tirerSeuilRenfort(() => 0), 20);
  assert.equal(E.tirerSeuilRenfort(() => 0.999), 30);
  const s = E.etatInitial(0, () => 0.5);
  assert.equal(s.seuilRenfort, 25);
  assert.ok(!E.notesVisibles({ ...s, tampons: 24 }).includes('renfort'));
  assert.ok(E.notesVisibles({ ...s, tampons: 25 }).includes('renfort'));
});

test('sauvegarde sans seuil de la note n° 1 : ancien seuil de 8 tampons', () => {
  const { seuilRenfort: _, ...ancienne } = base();
  assert.equal(normaliserSauvegarde(ancienne as GameState).seuilRenfort, 8);
});

test('l’usager de la bulle est le même quel que soit le nombre d’usagers demandés', () => {
  for (let traites = 0; traites < 40; traites++) {
    const s = { ...base(), file: [0, 7, 11, 23] as GameState['file'], stats: { ...base().stats, traites } };
    assert.equal(teteDeFile(s, 1)[0].patience, teteDeFile(s, 3)[0].patience);
  }
});
