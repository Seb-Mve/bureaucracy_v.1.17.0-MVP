import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as V from '../../data/acte2/vues';
import { procsEnBoucle } from '../../data/acte2/procedures';
import { estSauvegardeValide } from '../../data/save';
import { PRESETS, sauvegardeActe2 } from '../presets-acte2';
import { vueAtelier } from '../../data/acte2/vueAtelier';
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

const vue = (s: GameState): V.VueDirection =>
  V.vueDirection(s, 0) as V.VueDirection;

test('vues de l’acte II : rien à l’acte I', () => {
  const s = E.signerCerfa(E.etatInitial(0), 'Test', 0);
  assert.equal(V.vueDirection(s, 0), null);
  assert.equal(V.vueService2(s, 0), null);
  assert.deepEqual(V.notesAffichees2(s, 0), []);
});

test('écran Direction à l’entrée : visas du guichet 3, Carte d’identité, pas de dématérialisation', () => {
  const d = vue(base2());
  assert.equal(d.visas, BALANCE2.visasInitiaux);
  assert.equal(d.usagers, BALANCE2.fileInitiale + BALANCE2.visasInitiaux);
  assert.equal(d.guichets, 1);
  assert.equal(d.demat, null);
  assert.equal(d.rupture, false);
  assert.deepEqual(d.parapheur, {
    numero: V.PREMIER_PARAPHEUR,
    proc: 'identite',
    procNom: 'Carte d’identité',
    sansUsager: false,
  });
  assert.deepEqual(
    d.etapes.map((e) => [e.nom, e.allumee]),
    [
      ['Pièce', false],
      ['Visa', true],
    ],
  );
  assert.equal(d.etapes[1].attente, BALANCE2.visasInitiaux);
  assert.equal(d.appel, V.PREMIER_PARAPHEUR - 1);
  assert.equal(d.tableau, null);
});

test('un coup de tampon passe au parapheur suivant', () => {
  const s = D.tamponner2(base2(), 0).s;
  assert.equal(vue(s).parapheur?.numero, V.PREMIER_PARAPHEUR + 1);
  assert.equal(vue(s).visas, BALANCE2.visasInitiaux - 1);
});

test('parapheur sans usager quand les dossiers en boucle dominent le visa', () => {
  const b = base2();
  const s = avec2(b, {
    usagers: { ...x(b).usagers, identite: [0, 2] },
    boucles: { ...x(b).boucles, identite: [0, 10] },
  });
  assert.equal(vue(s).parapheur?.sansUsager, true);
  assert.equal(vue(s).visas, 12);
});

test('sans visa en attente : aucun parapheur ; sans usager : panneau d’appel éteint', () => {
  const b = base2();
  const sansVisa = avec2(b, { usagers: { ...x(b).usagers, identite: [5, 0] } });
  assert.equal(vue(sansVisa).parapheur, null);
  assert.deepEqual(
    vue(sansVisa).etapes.map((e) => e.allumee),
    [false, false],
  );
  const vide = avec2(b, { usagers: { ...x(b).usagers, identite: [0, 0] } });
  assert.equal(vue(vide).appel, null);
});

test('rupture d’imprimés : moins de formulaires que d’exemplaires exigés', () => {
  const b = { ...base2(), formulaires: 1 };
  assert.equal(vue(b).rupture, false);
  assert.equal(vue(avec2(b, { exemplaires: 2 })).rupture, true);
});

test('Démat. et tableau de bord : affichés après leur note', () => {
  const b0 = base2();
  const b = avec2(b0, {
    demaPoints: BALANCE2.demaCible / 4,
    stats: { ...x(b0).stats, abandonsDemarche: 42.7 },
  });
  assert.equal(vue(b).demat, null);
  const n = avecNotes(b, ['demat', 'tableau']);
  assert.equal(vue(n).demat, 25);
  assert.deepEqual(vue(n).tableau, { abandonsDemarche: 42 });
});

test('taux de rejet affiché : plafonné tant que « Rejet élargi » n’est pas en vigueur', () => {
  const b = avec2(base2(), { tauxRejet: 0.8 });
  assert.equal(vue(b).rejetMax, 0.5);
  assert.equal(vue(b).tauxRejet, 0.5);
  assert.equal(vue(avecNotes(b, ['rejetElargi'])).tauxRejet, 0.8);
});

test('Service : le guichet et les agents débloqués, achats en lot', () => {
  const s = { ...avecNotes(base2(), ['prise', 'agents']), budget: 99 };
  const sv = V.vueService2(s, 0) as V.VueService2;
  assert.equal(sv.guichet.possedes, 1);
  assert.equal(sv.guichet.cout, D.coutGuichet(1));
  // 30 + 35 = 65 ; un troisième (40) dépasserait 99.
  assert.equal(sv.guichet.maxAchetables, 2);
  assert.equal(sv.guichet.coutMax, D.coutGuichet(1) + D.coutGuichet(2));
  let dix = 0;
  for (let i = 0; i < 10; i++) dix += D.coutGuichet(1 + i);
  assert.equal(sv.guichet.cout10, dix);
  assert.deepEqual(
    sv.agents.map((a) => a.id),
    ['instructeur'],
  );
  assert.equal(sv.agents[0].achetable, false);
  assert.equal(sv.etapesParSeconde, BALANCE2.guichet.vitesse);
  assert.equal(sv.visasParSeconde, 0);
});

test('notes de l’acte II : statut, instruction et pastille', () => {
  const s0 = avec2({ ...base2(), budget: 150 }, { guichets: 5 });
  assert.deepEqual(
    V.notesAffichees2(s0, 0).map((n) => [n.id, n.statut, n.nouvelle]),
    [
      ['prise', 'disponible', true],
      ['agents', 'tropCher', true],
    ],
  );
  const s = D.acheterNote2({ ...s0, budget: 1000 }, 'agents', 0);
  const agents = V.notesAffichees2(s, 10_000).find((n) => n.id === 'agents');
  assert.equal(agents?.statut, 'instruction');
  assert.equal(agents?.resteSec, 20);
  assert.ok(
    V.notesAffichees2(D.marquerNotesVues2(s), 0).every((n) => !n.nouvelle),
  );
});

test('identifiants de notes : ceux de l’acte II sont reconnus', () => {
  assert.equal(V.estNote2('pieceService'), true);
  assert.equal(V.estNote2('reaffectation'), false);
});

test('préréglages de vérification : sauvegardes valides, à l’acte voulu', () => {
  const t = 1_000_000_000;
  for (const p of PRESETS) {
    const s = sauvegardeActe2(p, t);
    assert.equal(estSauvegardeValide(s), true, p);
    assert.equal(s.acte, p === 'finActeI' ? 1 : 2, p);
  }
  const boucle = sauvegardeActe2('boucle', t);
  assert.deepEqual(procsEnBoucle(x(boucle).procedures, ['identite', 'domicile']), ['identite', 'domicile']);
  assert.equal(V.vueDirection(sauvegardeActe2('fin', t), t)?.demat, 100);
  assert.notEqual(vueAtelier(sauvegardeActe2('atelier', t), t), null);
  assert.equal(sauvegardeActe2('finActeI', t).acteTermine, true);
});
