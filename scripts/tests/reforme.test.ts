import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../data/engine';
import * as D from '../../data/acte2/moteur';
import * as R from '../../data/reforme';
import { nouvellesLettres } from '../../data/courrier';
import { estSauvegardeValide, normaliserSauvegarde } from '../../data/save';
import { BALANCE } from '../../constants/balance';
import { BALANCE2, REFORME } from '../../constants/balanceActe2';
import { NOTES as NOTES_ACTE1, NOTES_PAR_ID } from '../../data/notes';
import { NOTES2_PAR_ID } from '../../data/acte2/notes2';
import type { JurisprudenceId } from '../../types/reforme';
import * as V from '../../data/acte2/vues';
import { vueAtelier } from '../../data/acte2/vueAtelier';
import { sauvegardePreset } from '../../data/presets';
import { PROCS, type EtatActe2, type Note2Id } from '../../types/acte2';
import type { GameState } from '../../types/game';

const x = (s: GameState): EtatActe2 => s.acte2 as EtatActe2;

function avec2(s: GameState, patch: Partial<EtatActe2>): GameState {
  return { ...s, acte2: { ...x(s), ...patch } };
}

function avecNotes2(s: GameState, ids: Note2Id[]): GameState {
  const notes = { ...x(s).notes };
  for (const id of ids) notes[id] = { achetee: 0, effective: 0 };
  return avec2(s, { notes });
}

const proche = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

/** Toujours le premier choix : tirages reproductibles. */
const zero = () => 0;

/** Acte II d'une partie de Camille, note n° 11 en vigueur : la Réforme est possible. */
function avantReforme(): GameState {
  const fin = {
    ...E.signerCerfa(E.etatInitial(0), 'Camille', 1234),
    tampons: 300_000,
    conformitePoints: 500_000,
    notes: {
      renfort: { achetee: 0, effective: 0 },
      tilleuls: { achetee: 0, effective: 0 },
    },
  };
  const s = avecNotes2(D.entrerActe2(fin, 0), ['prise', 'atelier', 'reforme']);
  return {
    ...avec2(s, { conformitePoints: 1_500_000, guichets: 40 }),
    budget: 99_999,
  };
}

const avecJurisprudence = (
  s: GameState,
  ids: JurisprudenceId[],
): GameState => ({
  ...s,
  reformes: { ...s.reformes, jurisprudence: ids },
});

test('sauvegardes antérieures à la Réforme : reformes complétées, âge des services déduit', () => {
  const acte1: Partial<GameState> = { ...E.etatInitial(0) };
  delete acte1.reformes;
  assert.equal(estSauvegardeValide(acte1), true);
  assert.deepEqual(
    normaliserSauvegarde(acte1 as GameState).reformes,
    E.etatInitial(0).reformes,
  );

  const s2 = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 1000);
  const { duree: _d, memoireRestauree: _m, ...ancien } = x(s2);
  const sauvegarde = {
    ...s2,
    derniereMaj: 61_000,
    acte2: ancien,
  } as unknown as GameState;
  delete (sauvegarde as Partial<GameState>).reformes;
  const n = normaliserSauvegarde(sauvegarde);
  assert.equal(x(n).duree, 60);
  assert.equal(x(n).memoireRestauree, false);
  assert.equal(n.reformes.nombre, 0);
  assert.equal(
    estSauvegardeValide({ ...s2, reformes: { nombre: 'deux' } }),
    false,
  );
});

test('sclérose : le rendement de la dématérialisation baisse avec l’âge des services', () => {
  const s = D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0);
  proche(D.rendementDemat(s, x(s)), 1);
  proche(D.rendementDemat(s, { ...x(s), duree: REFORME.scleroseS }), 0.5);
  const obtenus = { ...s, reformes: { ...s.reformes, trombonesObtenus: 10 } };
  proche(
    D.rendementDemat(obtenus, x(s)),
    1 + 10 * REFORME.jurisprudenceConstante,
  );
  proche(x(D.tick2(s, 2.5, 2500).s).duree, 2.5);
});

test('un usager qui entre dans une boucle n’y laisse qu’un seul dossier, même rejeté', () => {
  let s = avecNotes2(
    D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0),
    ['atelier', 'pieceService'],
  );
  // Population entière garée dans la procédure fermée : aucune demande, aucune installation.
  s = avec2(s, {
    guichets: 100,
    tauxRejet: 0.5,
    population: BALANCE2.populationMax,
    procedures: {
      ...x(s).procedures,
      identite: [
        { type: 'piece' },
        { type: 'pieceService', exige: 'domicile' },
      ],
      domicile: [{ type: 'pieceService', exige: 'identite' }],
    },
    usagers: {
      ...x(s).usagers,
      identite: [0, 10],
      domicile: [0],
      vie: [BALANCE2.populationMax],
    },
    boucles: { ...x(s).boucles, identite: [0, 0], domicile: [0] },
  });
  for (let i = 1; i <= 6000; i++) s = D.tick2(s, 0.1, i * 100).s;
  // Un dossier en boucle par usager renvoyé chez lui, quoi qu'il arrive ensuite (rejets compris) ; les usagers
  // perdus en chemin (patience, impatience) n'en laissent aucun.
  proche(D.dossiersEnBoucle(x(s)), x(s).stats.abandonsDemarche);
  assert.ok(x(s).stats.abandonsDemarche > 9);
  assert.ok(x(s).stats.abandonsDemarche < 10 * (1 - BALANCE2.abandonParPoint));
});

test('la Réforme ramène au tout début de l’acte I ; survivent tampons, trombones, prénom, premier Cerfa', () => {
  const s0 = avantReforme();
  const s = R.reformer(s0, 5000, zero);
  assert.equal(s.acte, 1);
  assert.equal(s.acte2, null);
  assert.equal(s.tampons, 300_000);
  assert.equal(s.budget, BALANCE.budgetInitial);
  assert.equal(s.formulaires, BALANCE.formulairesInitiaux);
  assert.equal(s.conformitePoints, 0);
  assert.deepEqual(s.notes, {});
  assert.deepEqual(s.agents, {
    stagiaire: 0,
    accueil: 0,
    instructeur: 0,
    titulaire: 0,
  });
  assert.deepEqual(s.cerfa, { signe: false, prenom: 'Camille', signeLe: null });
  assert.equal(s.fichePosteVue, true);
  assert.deepEqual(s.courrier, s0.courrier);
  assert.equal(s.reformes.nombre, 1);
  assert.equal(s.reformes.trombones, R.trombonesReforme(s0));
  assert.deepEqual(s.reformes.premierCerfa, {
    prenom: 'Camille',
    signeLe: 1234,
  });
  assert.deepEqual(s.reformes.notesInstruites, ['renfort', 'tilleuls']);
  assert.deepEqual(s.reformes.notes2Instruites, [
    'prise',
    'atelier',
    'reforme',
  ]);
  assert.deepEqual(s.reformes.procedures, x(s0).procedures);
});

test('la Réforme exige l’acte II et la note n° 11 en vigueur', () => {
  const sansNote = avec2(avantReforme(), { notes: {} });
  assert.equal(R.reformer(sansNote, 0), sansNote);
  const acte1 = E.signerCerfa(E.etatInitial(0), 'Camille', 0);
  assert.equal(R.reformer(acte1, 0), acte1);
});

test('trombones = ⌊√(Conformité de la partie / k)⌋, acte I compris, convertie une seule fois', () => {
  const s0 = avantReforme();
  assert.equal(
    R.trombonesReforme(s0),
    Math.floor(Math.sqrt(2_000_000 / REFORME.k)),
  );
  const s = R.reformer(s0, 0, zero);
  assert.equal(s.reformes.conformiteConvertie, 2_000_000);
  assert.equal(s.reformes.trombonesObtenus, s.reformes.trombones);
  // Partie suivante : seule sa propre Conformité compte.
  assert.equal(
    R.trombonesReforme({ ...s, conformitePoints: REFORME.k * 4 }),
    2,
  );
});

test('le Cerfa est redemandé sous un nouveau numéro ; le premier reste l’original', () => {
  const s1 = R.reformer(avantReforme(), 0, zero);
  assert.equal(R.numeroCerfa(s1), '00001*02');
  const relance = avecNotes2(
    D.entrerActe2(E.signerCerfa(s1, 'Dominique', 9999), 0),
    ['reforme'],
  );
  const s2 = R.reformer(relance, 0, zero);
  assert.equal(R.numeroCerfa(s2), '00001*03');
  assert.equal(s2.cerfa.prenom, 'Dominique');
  assert.deepEqual(s2.reformes.premierCerfa, {
    prenom: 'Camille',
    signeLe: 1234,
  });
});

test('à chaque Réforme, la Direction et toutes les procédures changent de nom ; une lettre l’annonce', () => {
  const s0 = avantReforme();
  const s = R.reformer(s0, 0, () => 0.99);
  assert.notEqual(
    s.reformes.denomination.direction,
    s0.reformes.denomination.direction,
  );
  for (const p of PROCS) {
    assert.notEqual(
      s.reformes.denomination.procedures[p],
      s0.reformes.denomination.procedures[p],
    );
  }
  const lettres = nouvellesLettres(s, 0);
  const lettre = lettres.find((l) => l.id === 'reforme-1');
  assert.ok(lettre);
  assert.ok(lettre.corps.includes(s.reformes.denomination.direction));
  assert.ok(lettre.corps.includes('00001*02'));
  const envoyee = {
    ...s,
    lettresEnvoyees: [...s.lettresEnvoyees, 'reforme-1'],
  };
  assert.equal(
    nouvellesLettres(envoyee, 0).some((l) => l.id === 'reforme-1'),
    false,
  );
});

test('les lettres d’avancement ne repartent pas après la Réforme, les autres si', () => {
  const s0 = {
    ...avantReforme(),
    lettresEnvoyees: ['grade1', 'bienvenue', 'a2-prise'],
  };
  assert.deepEqual(R.reformer(s0, 0, zero).lettresEnvoyees, ['grade1']);
});

test('Jurisprudence : achat définitif avec les trombones, une seule fois', () => {
  const apres = R.reformer(avantReforme(), 0, zero);
  const s = { ...apres, reformes: { ...apres.reformes, trombones: 10 } };
  const r = R.acheterJurisprudence(s, 'videJuridique');
  assert.equal(r.reformes.trombones, 10 - R.coutJurisprudence('videJuridique'));
  assert.deepEqual(r.reformes.jurisprudence, ['videJuridique']);
  assert.equal(R.acheterJurisprudence(r, 'videJuridique'), r);
  const pauvre = { ...s, reformes: { ...s.reformes, trombones: 0 } };
  assert.equal(R.acheterJurisprudence(pauvre, 'memoire'), pauvre);
});

test('Ancienneté reconnue : dotation +20 % aux deux actes', () => {
  const s1 = E.signerCerfa(E.etatInitial(0), 'Test', 0);
  proche(
    E.getModifiers(avecJurisprudence(s1, ['anciennete']), 0).dotationMult,
    1.2,
  );
  const s2 = D.entrerActe2(s1, 0);
  proche(
    D.getModifiers2(avecJurisprudence(s2, ['anciennete']), 0).dotationMult,
    1.2,
  );
});

test('Vide juridique : formulaires −25 % aux deux actes', () => {
  const s1 = E.signerCerfa(E.etatInitial(0), 'Test', 0);
  proche(
    E.prixRamette(E.getModifiers(avecJurisprudence(s1, ['videJuridique']), 0)),
    BALANCE.prixRamette * 0.75,
  );
  const s2 = {
    ...avecJurisprudence(D.entrerActe2(s1, 0), ['videJuridique']),
    budget: BALANCE2.prixRamette * 0.75 * 10,
  };
  proche(D.prixRamette2(s2), BALANCE2.prixRamette * 0.75);
  assert.equal(
    D.acheterRamettes2(s2, 100).formulaires,
    BALANCE2.formulairesInitiaux + 10 * BALANCE.ramette,
  );
});

test('Précédent : l’acte I recommence avec 3 stagiaires, ou les reçoit aussitôt', () => {
  const s0 = avecJurisprudence(avantReforme(), ['precedent']);
  assert.equal(
    R.reformer(s0, 0, zero).agents.stagiaire,
    REFORME.stagiairesPrecedent,
  );
  const acte1 = R.reformer(avantReforme(), 0, zero);
  const riche = { ...acte1, reformes: { ...acte1.reformes, trombones: 99 } };
  assert.equal(
    R.acheterJurisprudence(riche, 'precedent').agents.stagiaire,
    REFORME.stagiairesPrecedent,
  );
});

test('Antériorité : l’acte II commence avec 10 guichets, le suivant au prix du deuxième', () => {
  const s1 = avecJurisprudence(E.signerCerfa(E.etatInitial(0), 'Test', 0), [
    'anteriorite',
  ]);
  const s2 = D.entrerActe2(s1, 0);
  assert.equal(x(s2).guichets, REFORME.guichetsAnteriorite);
  assert.equal(
    D.coutGuichet(x(s2).guichets, D.guichetsOfferts(s2)),
    D.coutGuichet(1),
  );
});

test('Droit acquis : la première étape de chaque procédure ne coûte aucune patience', () => {
  const base = avec2(
    D.entrerActe2(E.signerCerfa(E.etatInitial(0), 'Test', 0), 0),
    {
      population: BALANCE2.fileInitiale,
    },
  );
  const sans = D.tick2(base, 1, 1000).s;
  const avec = D.tick2(avecJurisprudence(base, ['droitAcquis']), 1, 1000).s;
  // Aucune impatience (la carte est délivrée) ; seule la Pièce (0,5 dossier franchi, 1 point) coûte de la patience sans.
  proche(x(sans).abandons - x(avec).abandons, 0.5 * BALANCE2.abandonParPoint);
});

test('Mémoire des services : procédures restaurées à l’ouverture de l’Atelier, avant toute modification', () => {
  const s1 = R.reformer(avantReforme(), 0, zero);
  const memoire = {
    ...s1.reformes.procedures!,
    identite: [
      { type: 'piece' as const },
      { type: 'pieceService' as const, exige: 'domicile' as const },
    ],
  };
  const avant = {
    ...s1,
    reformes: {
      ...s1.reformes,
      jurisprudence: ['memoire' as const],
      procedures: memoire,
    },
  };
  const s2 = D.entrerActe2(E.signerCerfa(avant, 'Camille', 0), 0);
  // Atelier fermé : rien ne change.
  assert.deepEqual(
    x(D.tick2(s2, 1, 1000).s).procedures.identite.map((e) => e.type),
    ['piece', 'visa'],
  );
  const ouvert = D.tick2(avecNotes2(s2, ['atelier']), 1, 1000).s;
  assert.deepEqual(x(ouvert).procedures.identite, memoire.identite);
  assert.equal(x(ouvert).usagers.identite.length, 2);
  assert.equal(x(ouvert).memoireRestauree, true);
  // Le joueur a déjà modifié une procédure : la mémoire ne l'écrase pas.
  const modifie = avec2(avecNotes2(s2, ['atelier']), {
    premiereModif: 'identite',
  });
  assert.equal(x(D.tick2(modifie, 1, 1000).s).memoireRestauree, false);
});

test('déjà-vu administratif : une note déjà instruite a son délai ÷ 4 et son coût ÷ 6', () => {
  const s1 = R.reformer(avantReforme(), 0, zero);
  const acte1 = {
    ...E.signerCerfa(s1, 'Camille', 0),
    tampons: 300_000,
    budget: 1e6,
  };
  const tilleuls = NOTES_PAR_ID.tilleuls;
  assert.deepEqual(E.conditionsNoteActe1(acte1, 'tilleuls'), {
    cout: Math.round(tilleuls.cout / REFORME.dejaVuCout),
    instruction: tilleuls.instruction / REFORME.dejaVuDelai,
  });
  const achete = E.acheterNote(acte1, 'tilleuls', 0);
  assert.equal(
    achete.notes.tilleuls?.effective,
    (tilleuls.instruction / REFORME.dejaVuDelai) * 1000,
  );
  assert.equal(
    achete.budget,
    1e6 - Math.round(tilleuls.cout / REFORME.dejaVuCout),
  );
  // Une note jamais achetée garde ses conditions.
  assert.equal(
    E.conditionsNoteActe1(acte1, 'commune').cout,
    NOTES_PAR_ID.commune.cout,
  );
  const acte2 = { ...D.entrerActe2(acte1, 0), budget: 1e6 };
  assert.deepEqual(D.conditionsNote2(acte2, 'atelier'), {
    cout: Math.round(NOTES2_PAR_ID.atelier.cout / REFORME.dejaVuCout),
    instruction: NOTES2_PAR_ID.atelier.instruction / REFORME.dejaVuDelai,
  });
});

test('vues : les noms tirés à la Réforme remplacent ceux de la Direction et des procédures', () => {
  const s1 = R.reformer(avantReforme(), 0, () => 0.99);
  const s2 = D.entrerActe2(E.signerCerfa(s1, 'Camille', 0), 0);
  const noms = s2.reformes.denomination;
  const d = V.vueDirection(s2, 0)!;
  assert.equal(d.nomService, noms.direction);
  assert.equal(d.parapheur?.procNom, noms.procedures.identite);
  const atelier = vueAtelier(avecNotes2(s2, ['atelier']), 0)!;
  assert.deepEqual(atelier.procedures.map((p) => p.nom), [noms.procedures.identite, noms.procedures.domicile]);
});

test('vues : le dossier administratif montre trombones et Jurisprudence après la première Réforme', () => {
  const avant = avantReforme();
  const v0 = R.vueReforme(avant, 0);
  assert.equal(v0.trombones, null);
  assert.equal(v0.jurisprudence, null);
  assert.equal(v0.possible, true);
  assert.equal(v0.gain, R.trombonesReforme(avant));
  assert.equal(v0.cerfaSuivant, '00001*02');
  const apres = R.reformer(avant, 0, zero);
  const v1 = R.vueReforme(apres, 0);
  assert.equal(v1.trombones, apres.reformes.trombones);
  assert.equal(v1.possible, false);
  assert.equal(v1.jurisprudence?.length, 6);
  assert.equal(v1.jurisprudence?.every((j) => !j.acquise), true);
});

test('vues : une note déjà instruite le dit, les guichets offerts ne comptent pas dans le prix', () => {
  const s2 = { ...D.entrerActe2(E.signerCerfa(R.reformer(avantReforme(), 0, zero), 'Camille', 0), 0), budget: 0 };
  const note = V.notesAffichees2(s2, 0).find((n) => n.id === 'prise')!;
  assert.equal(note.dejaInstruite, true);
  const anterieur = avecJurisprudence(avec2(s2, { guichets: REFORME.guichetsAnteriorite }), ['anteriorite']);
  assert.equal(V.vueService2(avecNotes2(anterieur, ['prise']), 0)?.guichet.cout, D.coutGuichet(1));
});

test('préréglages de la Réforme : Réforme possible, puis Cerfa n° 00001*02 et trombones à dépenser', () => {
  const t = 1_000_000_000;
  const avant = sauvegardePreset('reforme', t);
  assert.equal(R.peutReformer(avant, t), true);
  assert.ok(R.trombonesReforme(avant) >= R.coutJurisprudence('memoire') + R.coutJurisprudence('anteriorite'));
  const apres = sauvegardePreset('cerfa2', t);
  assert.equal(apres.cerfa.signe, false);
  assert.equal(R.numeroCerfa(apres), '00001*02');
  assert.equal(apres.reformes.trombones, R.trombonesReforme(avant));
  assert.equal(apres.reformes.notesInstruites.length, NOTES_ACTE1.length);
});

test('signer le Cerfa n’est pas une absence : la boucle repart du moment de la signature', () => {
  const s = E.etatInitial(0);
  const signe = E.signerCerfa(s, 'Camille', 400_000);
  assert.equal(signe.derniereMaj, 400_000);
});

test('à la 2e Réforme, la lettre annonce le nom du service d’avant, pas « La Direction »', () => {
  const s1 = R.reformer(avantReforme(), 0, () => 0.99);
  const nom1 = s1.reformes.denomination.direction;
  const l1 = R.lettreReforme(s1, 0);
  assert.ok(l1?.corps.includes('La Direction devient : ' + nom1));
  const relance = avecNotes2(
    D.entrerActe2(E.signerCerfa(s1, 'Dominique', 9999), 0),
    ['reforme'],
  );
  const s2 = R.reformer(relance, 0, () => 0);
  const l2 = R.lettreReforme(s2, 0);
  assert.ok(l2);
  assert.ok(
    l2.corps.includes(
      `\n\n${nom1} devient : ${s2.reformes.denomination.direction}.`,
    ),
  );
});
