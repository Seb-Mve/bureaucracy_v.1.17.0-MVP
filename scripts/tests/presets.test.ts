import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import { estSauvegardeValide } from '../../data/save';
import { nouvellesLettres } from '../../data/courrier';
import { PRESETS, PRESETS_INFO, sauvegardePreset } from '../../data/presets';

const T = 1_000_000_000;
const ACTE: Record<string, 1 | 2> = {
  acte1Debut: 1,
  acte1Milieu: 1,
  finActeI: 1,
  debut: 2,
  atelier: 2,
  boucle: 2,
  demat: 2,
  fin: 2,
  reforme: 2,
  cerfa2: 1,
};

test('raccourcis : ordre des préréglages, de l’acte I à la Réforme', () => {
  assert.deepEqual(PRESETS, [
    'acte1Debut',
    'acte1Milieu',
    'finActeI',
    'debut',
    'atelier',
    'boucle',
    'demat',
    'fin',
    'reforme',
    'cerfa2',
  ]);
  assert.deepEqual(
    PRESETS_INFO.map((p) => p.id),
    PRESETS,
  );
  for (const p of PRESETS_INFO) {
    assert.ok(p.titre.length > 0 && p.detail.length > 0, p.id);
    assert.ok(!/'/.test(p.titre + p.detail), `apostrophe droite dans ${p.id}`);
  }
});

test('raccourcis : chaque préréglage est une sauvegarde valide, à l’acte voulu', () => {
  for (const p of PRESETS) {
    const s = sauvegardePreset(p, T);
    assert.equal(estSauvegardeValide(s), true, p);
    assert.equal(s.acte, ACTE[p], p);
    assert.equal(s.derniereMaj, T, p);
  }
});

test('raccourcis : les deux préréglages de l’acte I commencent après le Cerfa signé', () => {
  for (const p of ['acte1Debut', 'acte1Milieu'] as const) {
    const s = sauvegardePreset(p, T);
    assert.equal(s.acte, 1, p);
    assert.equal(s.cerfa.signe, true, p);
    assert.equal(s.cerfa.prenom, 'Camille', p);
    assert.equal(s.acteTermine, false, p);
    assert.equal(s.acte2, null, p);
  }
  const debut = sauvegardePreset('acte1Debut', T);
  assert.equal(debut.tampons, 0);
  assert.deepEqual(debut.notes, {});
});

test('raccourcis : le milieu de l’acte I a des notes en vigueur, des collègues et du courrier à jour', () => {
  const s = sauvegardePreset('acte1Milieu', T);
  const m = E.getModifiers(s, T);
  assert.ok(Object.keys(s.notes).length >= 8, 'environ la moitié des notes');
  for (const [id, n] of Object.entries(s.notes))
    assert.ok(n.effective <= T, `${id} en vigueur`);
  assert.equal(s.notes.reaffectation, undefined);
  assert.equal(s.notes.audit, undefined, 'Conformité pas encore révélée');
  assert.equal(m.conformiteVisible, false);
  assert.equal(m.recrutementVisible, true);
  assert.equal(m.rejetVisible, true);
  assert.ok(E.vitesseCollegues(s, m) > 0, 'des collègues au travail');
  assert.ok(s.population <= E.perimetre(s, T));
  assert.ok(E.dossiersEnAttente(s) > 0);
  // Courrier déjà mérité : réputé envoyé.
  assert.deepEqual(nouvellesLettres(s, T), []);
  // Le jeu tourne : quelques secondes de boucle font avancer les tampons.
  let x = s;
  for (let i = 1; i <= 50; i++) x = E.tick(x, 0.1, T + i * 100).s;
  assert.ok(x.tampons > s.tampons);
});
