import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as P from '../../data/acte2/production';
import * as V from '../../data/acte2/vues';
import { sauvegardePreset } from '../../data/presets';
import { NOMS_PROCEDURES } from '../../data/jurisprudence';
import { BALANCE2, PROC_NOMS } from '../../constants/balanceActe2';
import { formatEuros } from '../../utils/formatters';
import type { GameState } from '../../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId } from '../../types/acte2';

/** Entrée dans l'acte II à t = 0, au grade de départ (dotation ×1). */
function base2(): GameState {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  return { ...s, budget: 1e9, formulaires: 1e9, tampons: 0 };
}

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

function avecNotes(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

const proche = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

const PS = (exige: ProcId): Etape => ({ type: 'pieceService', exige });

test('relevé « Production du service » : demandes, délivrés, valeur d’une carte et destination', () => {
  const s0 = avecNotes(base2(), ['atelier']);
  const s = avec2(s0, {
    stats: {
      ...x(s0).stats,
      delivresUsagers: { ...x(s0).stats.delivresUsagers, identite: 312.6 },
      abandonsProc: { ...x(s0).stats.abandonsProc, identite: 1.2 },
    },
  });
  const [carte, justificatif] = P.lignesProduction(s, 0) as P.LigneProduction[];
  assert.equal(carte.nom, 'Carte d’identité');
  assert.equal(carte.demandes, BALANCE2.fileInitiale + BALANCE2.visasInitiaux);
  assert.equal(carte.demandesTexte, `${carte.demandes} demandes`);
  assert.equal(carte.delivresTexte, '313 délivrées');
  assert.equal(carte.delivresMot, 'délivrées');
  // Pièce + Visa au grade de départ, ×1.
  assert.deepEqual(carte.valeur, [
    {
      texte: `+${formatEuros(2 * BALANCE2.dotation)}\u00a0€ la carte`,
      sens: 'plus',
    },
    { texte: '2 formulaires la carte', sens: 'neutre' },
    { texte: '1 abandon', sens: 'moins' },
  ]);
  assert.equal(carte.versUsagers, true);
  assert.equal(justificatif.demandesTexte, '0 demande');
  assert.equal(justificatif.delivresTexte, '0 délivré');
  assert.equal(justificatif.valeur, null);
  assert.equal(justificatif.versUsagers, false);
  assert.equal(
    P.lignesProduction(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0),
    null,
  );
});

test('relevé : les demandes comptent tous les dossiers en cours, avec ou sans usager', () => {
  const b = avecNotes(base2(), ['atelier']);
  const s = avec2(b, {
    usagers: { ...x(b).usagers, identite: [1, 1] },
    boucles: { ...x(b).boucles, identite: [2, 0] },
    suites: { ...x(b).suites, identite: [0, 3] },
  });
  assert.equal(
    (P.lignesProduction(s, 0) as P.LigneProduction[])[0].demandes,
    7,
  );
});

test('relevé : une fois la boucle formée, la carte n’a plus de destination', () => {
  const b = avecNotes(base2(), ['atelier', 'pieceService']);
  const procedures = {
    ...x(b).procedures,
    identite: [{ type: 'piece' }, PS('domicile'), { type: 'visa' }] as Etape[],
    domicile: [{ type: 'piece' }, PS('identite')] as Etape[],
  };
  const s = avec2(b, {
    procedures,
    usagers: D.stocksPour(procedures),
    boucles: D.stocksPour(procedures),
    suites: D.stocksPour(procedures),
  });
  const [carte, justificatif] = P.lignesProduction(s, 0) as P.LigneProduction[];
  assert.equal(carte.versUsagers, false);
  assert.notEqual(carte.valeur, null);
  assert.equal(justificatif.versUsagers, false);
});

test('valeur d’un document : toutes les étapes de la procédure, Exemplaires compris', () => {
  const s = base2();
  const m = D.getModifiers2(s, 0);
  proche(P.valeurDocument(x(s), 'identite', m), 2 * BALANCE2.dotation);
  proche(
    P.valeurDocument({ ...x(s), exemplaires: 2 }, 'identite', m),
    2 * BALANCE2.dotation * 1.6,
  );
});

test('chaque nom de procédure a son document, avec article et genre', () => {
  const noms = [
    ...Object.values(PROC_NOMS),
    ...Object.values(NOMS_PROCEDURES).flat(),
  ];
  for (const nom of noms) {
    const d = P.documentDe(nom);
    assert.notEqual(d.article, 'le document', nom);
    assert.match(d.article, /^(la |le |l’)/, nom);
  }
  assert.deepEqual(P.documentDe('Carte d’identité'), {
    article: 'la carte',
    feminin: true,
  });
  assert.deepEqual(P.documentDe('Justificatif de domicile'), {
    article: 'le justificatif',
    feminin: false,
  });
  assert.equal(P.compte(0, 'demande', 'demandes'), '0 demande');
  assert.equal(P.compte(1, 'demande', 'demandes'), '1 demande');
  assert.equal(P.compte(2, 'demande', 'demandes'), '2 demandes');
});

test('relevé : valeur, formulaires et abandons seulement une fois l’Atelier ouvert ; formulaires × Exemplaires', () => {
  const b = base2();
  assert.equal((P.lignesProduction(b, 0) as P.LigneProduction[])[0].valeur, null);
  const s = avec2(avecNotes(b, ['atelier', 'signature', 'exemplaires']), {
    procedures: {
      ...x(b).procedures,
      identite: [{ type: 'piece' }, { type: 'signature' }, { type: 'commission' }, { type: 'visa' }],
    },
    usagers: { ...x(b).usagers, identite: [0, 0, 0, 0] },
    boucles: { ...x(b).boucles, identite: [0, 0, 0, 0] },
    suites: { ...x(b).suites, identite: [0, 0, 0, 0] },
    exemplaires: 2,
  });
  assert.equal(P.formulairesDocument(x(s), 'identite'), 8);
  assert.deepEqual(
    (P.lignesProduction(s, 0) as P.LigneProduction[])[0].valeur?.map((e) => e.texte)[1],
    '8 formulaires la carte',
  );
});

test('possessif d’un document : « sa carte », « son titre », « son attestation »', () => {
  assert.equal(P.possessif('Carte d’identité'), 'sa');
  assert.equal(P.possessif('Démarche d’identification citoyenne'), 'sa');
  assert.equal(P.possessif('Titre d’identité simplifié'), 'son');
  assert.equal(P.possessif('Attestation d’hébergement'), 'son');
});

test('première carte visée : délivrée à son usager, relevé à 1', () => {
  const t = 1_000_000_000;
  const { s, ev } = D.tamponner2(sauvegardePreset('debut', t), t);
  proche(ev.delivres, 1 - BALANCE2.abandonParPoint);
  const carte = (P.lignesProduction(s, t) as P.LigneProduction[])[0];
  assert.equal(carte.delivres, 1);
  assert.equal(carte.delivresTexte, '1 délivrée');
  assert.equal(V.vueDirection(s, t)?.parapheur?.attente, 'Attend votre visa');
});
