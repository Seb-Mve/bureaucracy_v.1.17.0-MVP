import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as A from '../../data/acte2/vueAtelier';
import { BALANCE2 } from '../../constants/balanceActe2';
import type { GameState } from '../../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId } from '../../types/acte2';

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

const P = (type: Etape['type'], exige?: ProcId): Etape =>
  exige ? { type, exige } : { type };

/** Remplace des procédures (stocks remis à zéro, à la bonne longueur). */
function avecProcedures(
  s: GameState,
  procedures: Partial<Record<ProcId, Etape[]>>,
): GameState {
  const p = { ...x(s).procedures, ...procedures };
  return avec2(s, {
    procedures: p,
    usagers: D.stocksPour(p),
    boucles: D.stocksPour(p),
  });
}

test('effets d’une fiche : un symbole et un mot', () => {
  assert.deepEqual(
    A.effetsEtape('visa').map((e) => e.texte),
    ['++ conformité', '+ €', '++ délai', '− patience'],
  );
  assert.deepEqual(A.effetsEtape('reflexion'), [
    { texte: '+ conformité', sens: 'plus' },
    { texte: '0 €', sens: 'neutre' },
    { texte: '+++ délai', sens: 'neutre' },
    { texte: '−− patience', sens: 'moins' },
  ]);
  assert.deepEqual(
    A.effetsEtape('commission').map((e) => e.texte),
    ['+++ conformité', '++ €', '+++ délai', '−− patience'],
  );
});

test('Atelier fermé, ou acte I : pas de vue', () => {
  assert.equal(A.vueAtelier(base2(), 0), null);
  assert.equal(
    A.vueAtelier(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0),
    null,
  );
});

test('Atelier : procédures ouvertes et catalogue des étapes débloquées', () => {
  const a = A.vueAtelier(avecNotes(base2(), ['atelier']), 0) as A.VueAtelier;
  assert.deepEqual(
    a.procedures.map((p) => p.id),
    ['identite', 'domicile'],
  );
  assert.deepEqual(
    a.catalogue.map((c) => c.type),
    ['piece', 'visa'],
  );
  assert.equal(a.etapesMax, BALANCE2.etapesMax);
  const id = a.procedures[0];
  assert.deepEqual(
    id.etapes.map((e) => e.nom),
    ['Pièce justificative', 'Visa'],
  );
  assert.deepEqual(id.exigeables, [
    { id: 'domicile', nom: 'Justificatif de domicile' },
  ]);
  assert.deepEqual(id.boucle, []);
  assert.equal(id.pleine, false);
});

test('Atelier : une simple dépendance ne relie rien', () => {
  const s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), {
    identite: [P('piece'), P('pieceService', 'domicile'), P('visa')],
  });
  const id = (A.vueAtelier(s, 0) as A.VueAtelier).procedures[0];
  assert.equal(id.etapes[1].exigeNom, 'Justificatif de domicile');
  assert.equal(id.etapes[1].boucle, false);
  assert.deepEqual(id.boucle, []);
});

test('Atelier : deux procédures qui s’exigent mutuellement sont reliées', () => {
  const s = avecProcedures(avecNotes(base2(), ['atelier', 'pieceService']), {
    identite: [P('piece'), P('pieceService', 'domicile'), P('visa')],
    domicile: [P('piece'), P('pieceService', 'identite')],
  });
  const a = A.vueAtelier(s, 0) as A.VueAtelier;
  assert.deepEqual(a.procedures[0].boucle, ['identite', 'domicile']);
  assert.deepEqual(a.procedures[1].boucleNoms, [
    'Carte d’identité',
    'Justificatif de domicile',
  ]);
  assert.equal(a.procedures[0].etapes[1].boucle, true);
  assert.equal(a.procedures[1].etapes[1].boucle, true);
  assert.ok(a.catalogue.some((c) => c.type === 'pieceService'));
});

test('Atelier : une boucle à trois relie ses trois procédures, pas celle qui s’y raccroche', () => {
  const s = avecProcedures(
    avecNotes(base2(), ['atelier', 'pieceService', 'troisieme', 'quatrieme']),
    {
      identite: [P('pieceService', 'domicile')],
      domicile: [P('pieceService', 'hebergement')],
      hebergement: [P('pieceService', 'identite')],
      vie: [P('pieceService', 'identite')],
    },
  );
  const ouvertes: ProcId[] = ['identite', 'domicile', 'hebergement', 'vie'];
  assert.deepEqual(A.boucleDe(x(s).procedures, ouvertes, 'domicile'), [
    'identite',
    'domicile',
    'hebergement',
  ]);
  assert.deepEqual(A.boucleDe(x(s).procedures, ouvertes, 'vie'), []);
});

test('Atelier : une procédure de huit étapes est pleine', () => {
  const huit = Array.from({ length: BALANCE2.etapesMax }, () => P('piece'));
  const s = avecProcedures(avecNotes(base2(), ['atelier']), { identite: huit });
  assert.equal((A.vueAtelier(s, 0) as A.VueAtelier).procedures[0].pleine, true);
});
