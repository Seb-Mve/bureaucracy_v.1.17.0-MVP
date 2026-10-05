import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import { estSauvegardeValide } from '../../data/save';
import { nouvellesLettres } from '../../data/courrier';
import { PRESETS, PRESETS_INFO, sauvegardePreset } from '../../data/presets';
import * as D from '../../data/acte2/moteur';
import * as F from '../../data/acte2/fiche';
import * as P from '../../data/acte2/production';
import { procsEnBoucle } from '../../data/acte2/procedures';
import type { EtatActe2 } from '../../types/acte2';

const T = 1_000_000_000;
const ACTE: Record<string, 1 | 2> = {
  acte1Debut: 1,
  acte1Milieu: 1,
  finActeI: 1,
  debut: 2,
  visasEpuises: 2,
  atelier: 2,
  compliquer: 2,
  achats: 2,
  pieceService: 2,
  avantBoucle: 2,
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
    'visasEpuises',
    'atelier',
    'compliquer',
    'achats',
    'pieceService',
    'avantBoucle',
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

test('préréglage « service des achats » : note en vigueur, ×2, fiche lue ; « prise de fonctions » : fiche ouverte', () => {
  const s = sauvegardePreset('achats', T);
  assert.equal(s.acte, 2);
  assert.equal(D.getModifiers2(s, T).achatsVisible, true);
  assert.equal(D.getModifiers2(s, T).exemplairesVisible, true);
  assert.equal((s.acte2 as EtatActe2).exemplaires, 2);
  assert.equal((s.acte2 as EtatActe2).premiereBoucle, null);
  assert.equal(F.vueFiche2(s, T)?.visible, false);
  assert.equal(F.vueFiche2(s, T)?.nonLues, 0);
  // Stock bas : le Service des achats commande dès le premier tick.
  assert.ok(D.tick2(s, 0.1, T + 100).ev.achats > 0);
  for (const p of ['atelier', 'boucle', 'demat', 'fin', 'reforme'] as const)
    assert.equal(F.vueFiche2(sauvegardePreset(p, T), T)?.nonLues, 0, p);
  assert.equal(F.vueFiche2(sauvegardePreset('debut', T), T)?.visible, true);
});

const x2 = (s: ReturnType<typeof sauvegardePreset>): EtatActe2 => s.acte2 as EtatActe2;

test('raccourci « compliquer rapporte » : Atelier ouvert, Signature permise, la carte seule demandée', () => {
  const s = sauvegardePreset('compliquer', T);
  const m = D.getModifiers2(s, T);
  assert.equal(m.atelierVisible, true);
  assert.ok(m.etapesDisponibles.includes('signature'));
  const [carte, justificatif] = P.lignesProduction(s, T) as P.LigneProduction[];
  assert.ok(carte.demandes > 0 && carte.delivres > 0 && carte.versUsagers);
  assert.equal(justificatif.demandes, 0);
  assert.equal(justificatif.delivres, 0);
  assert.equal(F.vueFiche2(s, T)?.nonLues, 0);
});

test('raccourci « prise de fonctions » : aucun guichet, 20 demandes à viser, note n° 1 cachée', () => {
  const s = sauvegardePreset('debut', T);
  assert.equal(x2(s).guichets, 0);
  assert.equal(D.visasEnAttente(x2(s)), 20);
  assert.ok(!D.notesVisibles2(s).includes('prise'));
});

test('raccourci « visas épuisés » : À viser 0, demandes à la vérification des pièces, note n° 1 visible et nouvelle', () => {
  const s = sauvegardePreset('visasEpuises', T);
  assert.equal(x2(s).guichets, 0);
  assert.ok(D.visasEnAttente(x2(s)) < 1);
  assert.ok(x2(s).usagers.identite[0] >= 1);
  assert.equal(x2(s).reouvertureVisible, true);
  assert.ok(D.notesVisibles2(s).includes('prise'));
  assert.deepEqual(x2(s).notesVues, []);
  assert.ok(s.budget >= D.coutGuichet(0), 'de quoi payer le premier guichet');
  assert.equal(F.vueFiche2(s, T)?.visible, false);
  assert.deepEqual(nouvellesLettres(s, T), []);
});

test('raccourci « pièce de nos services » : il ne reste qu’à exiger un justificatif', () => {
  const s = sauvegardePreset('pieceService', T);
  assert.ok(D.getModifiers2(s, T).etapesDisponibles.includes('pieceService'));
  assert.ok(
    Object.values(x2(s).procedures)
      .flat()
      .every((e) => e.type !== 'pieceService'),
  );
  const exige = D.modifierProcedure(
    s,
    { type: 'ajouter', p: 'identite', etape: 'pieceService', exige: 'domicile' },
    T,
  );
  assert.notEqual(exige, s);
  assert.deepEqual(procsEnBoucle(x2(exige).procedures, ['identite', 'domicile']), []);
});

test('raccourci « boucle sur le point de se former » : le justificatif peut exiger une carte', () => {
  const s = sauvegardePreset('avantBoucle', T);
  assert.equal(x2(s).premiereBoucle, null);
  const [, justificatif] = P.lignesProduction(s, T) as P.LigneProduction[];
  assert.ok(justificatif.demandes > 0 && !justificatif.versUsagers);
  const b = D.modifierProcedure(
    s,
    { type: 'ajouter', p: 'domicile', etape: 'pieceService', exige: 'identite' },
    T,
  );
  assert.deepEqual(procsEnBoucle(x2(b).procedures, ['identite', 'domicile']), [
    'identite',
    'domicile',
  ]);
  let r = b;
  for (let i = 1; i <= 600; i++) r = D.tick2(r, 0.1, T + i * 100).s;
  assert.ok(x2(r).premiereBoucle !== null);
});
