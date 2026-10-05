/**
 * Raccourcis de test : sauvegardes prêtes à charger, de l'acte I à la Réforme, pour vérifier
 * n'importe quel moment du jeu sans le rejouer. Utilisé par l'écran /test (GameStateContext),
 * par scripts/save-acte2.ts et par les tests. Fonctions pures, sans React.
 */
import type { GameState, NoteId } from '../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId, StatsActe2, Stocks } from '../types/acte2';
import * as E from './engine';
import * as D from './acte2/moteur';
import { nouvellesLettres } from './courrier';
import * as R from './reforme';
import { marquerFiche2 } from './acte2/fiche';
import { BALANCE2 } from '../constants/balanceActe2';
import { NOTES as NOTES_ACTE1 } from './notes';

export type Preset =
  | 'acte1Debut'
  | 'acte1Milieu'
  | 'finActeI'
  | 'debut'
  | 'visasEpuises'
  | 'atelier'
  | 'compliquer'
  | 'achats'
  | 'pieceService'
  | 'avantBoucle'
  | 'boucle'
  | 'demat'
  | 'fin'
  | 'reforme'
  | 'cerfa2';

/** Ce que l'écran des raccourcis affiche pour chaque préréglage. */
export interface PresetInfo {
  id: Preset;
  titre: string;
  detail: string;
}

export const PRESETS_INFO: PresetInfo[] = [
  { id: 'acte1Debut', titre: 'Acte I — début', detail: 'Cerfa signé, premier jour au guichet' },
  {
    id: 'acte1Milieu',
    titre: 'Acte I — milieu',
    detail: '11 notes en vigueur, collègues et rejet, Conformité encore cachée',
  },
  { id: 'finActeI', titre: 'Acte I — fin', detail: 'Réaffectation approuvée, fenêtre de fin d’acte' },
  {
    id: 'debut',
    titre: 'Acte II — prise de fonctions',
    detail: 'Entrée à la Direction, aucun guichet, 50 demandes à viser',
  },
  {
    id: 'visasEpuises',
    titre: 'Acte II — visas épuisés',
    detail: 'À viser 0, demandes bloquées à la vérification des pièces, note n° 1 visible',
  },
  { id: 'atelier', titre: 'Acte II — Atelier ouvert', detail: 'Atelier des procédures, 5 guichets' },
  {
    id: 'compliquer',
    titre: 'Acte II — compliquer rapporte',
    detail: 'Atelier ouvert, Carte d’identité seule demandée',
  },
  {
    id: 'achats',
    titre: 'Acte II — service des achats',
    detail: 'Marché public de fournitures en vigueur, ×2 exemplaires',
  },
  {
    id: 'pieceService',
    titre: 'Acte II — justificatif exigé',
    detail: 'Il ne reste qu’à exiger un justificatif',
  },
  {
    id: 'avantBoucle',
    titre: 'Acte II — boucle sur le point de se former',
    detail: 'Le justificatif peut exiger une carte',
  },
  {
    id: 'boucle',
    titre: 'Acte II — boucle formée',
    detail: 'Carte d’identité ⇄ Justificatif de domicile',
  },
  { id: 'demat', titre: 'Acte II — dématérialisation', detail: 'Démat. à 38 %' },
  { id: 'fin', titre: 'Acte II — fin', detail: 'Démat. à 100 %, rapport annuel' },
  { id: 'reforme', titre: 'Acte II — Réforme possible', detail: 'Démat. à 60 %, note n° 11 en vigueur' },
  { id: 'cerfa2', titre: 'Après la Réforme', detail: 'Cerfa n° 00001*02 à signer, 15 trombones' },
];

export const PRESETS: Preset[] = PRESETS_INFO.map((p) => p.id);

const NOTES_ATELIER: Note2Id[] = ['prise', 'agents', 'atelier'];
const NOTES_ACHATS: Note2Id[] = [
  ...NOTES_ATELIER,
  'signature',
  'exemplaires',
  'achats',
];
const NOTES_PIECE: Note2Id[] = [...NOTES_ACHATS, 'chefBureau', 'pieceService'];
const NOTES_BOUCLE: Note2Id[] = [...NOTES_ACHATS, 'pieceService'];
const NOTES_DEMAT: Note2Id[] = [
  ...NOTES_BOUCLE,
  'reflexion',
  'troisieme',
  'demat',
  'rejetElargi',
  'tableau',
];
const NOTES: Record<Exclude<Preset, 'acte1Debut' | 'acte1Milieu' | 'finActeI' | 'cerfa2'>, Note2Id[]> = {
  debut: [],
  visasEpuises: [],
  atelier: NOTES_ATELIER,
  compliquer: [...NOTES_ATELIER, 'signature'],
  achats: NOTES_ACHATS,
  pieceService: NOTES_PIECE,
  avantBoucle: NOTES_PIECE,
  boucle: NOTES_BOUCLE,
  demat: NOTES_DEMAT,
  fin: NOTES_DEMAT,
  reforme: [...NOTES_DEMAT, 'reforme'],
};

/** Procédures du robot vers 17 min : un second visa et une signature, pas encore de pièce de service. */
const PROCEDURES_ACHATS: Partial<Record<ProcId, Etape[]>> = {
  identite: [{ type: 'piece' }, { type: 'visa' }, { type: 'visa' }, { type: 'signature' }],
  domicile: [{ type: 'piece' }, { type: 'visa' }, { type: 'signature' }],
};

/** Avant la pièce de service : la Carte d'identité déjà compliquée, le Justificatif que personne ne demande. */
const PROCEDURES_PIECE: Partial<Record<ProcId, Etape[]>> = {
  identite: [{ type: 'piece' }, { type: 'signature' }, { type: 'visa' }],
  domicile: [{ type: 'piece' }, { type: 'visa' }],
};

/** La Carte d'identité exige un Justificatif de domicile ; il ne reste qu'à faire exiger une carte au justificatif. */
const PROCEDURES_AVANT_BOUCLE: Partial<Record<ProcId, Etape[]>> = {
  identite: [
    { type: 'piece' },
    { type: 'signature' },
    { type: 'pieceService', exige: 'domicile' },
    { type: 'visa' },
  ],
  domicile: [{ type: 'piece' }, { type: 'visa' }],
};

/** Documents délivrés et usagers perdus depuis l'entrée dans l'acte. */
function production(
  x: EtatActe2,
  delivresUsagers: number,
  delivresService: Partial<Record<ProcId, number>>,
  abandons: number,
): StatsActe2 {
  return {
    ...x.stats,
    delivresUsagers: { ...x.stats.delivresUsagers, identite: delivresUsagers },
    delivresService: { ...x.stats.delivresService, ...delivresService },
    abandonsProc: { ...x.stats.abandonsProc, identite: abandons },
  };
}

/** Une boucle Carte d'identité ⇄ Justificatif de domicile. */
const PROCEDURES_BOUCLE: Partial<Record<ProcId, Etape[]>> = {
  identite: [
    { type: 'piece' },
    { type: 'pieceService', exige: 'domicile' },
    { type: 'visa' },
  ],
  domicile: [{ type: 'piece' }, { type: 'pieceService', exige: 'identite' }],
};

const remplir = (st: Stocks, valeurs: Partial<Stocks>): Stocks => ({
  ...st,
  ...valeurs,
});

/** Courrier déjà mérité : réputé envoyé (et donc pas distribué au chargement). */
const courrierEnvoye = (s: GameState, t: number): GameState => ({
  ...s,
  lettresEnvoyees: [...s.lettresEnvoyees, ...nouvellesLettres(s, t).map((l) => l.id)],
});

/** Début de l'acte I : Cerfa signé (Camille), fiche de poste encore à lire, rien d'autre. */
function acte1Debut(t: number): GameState {
  return E.signerCerfa(
    E.etatInitial(t, () => 0.5),
    'Camille',
    t,
  );
}

/**
 * Notes du milieu de l'acte I : les 11 premières que le simulateur approuve (≈ 30 min sur
 * ~65 min, jusqu'à « Numérotation des dossiers »). Pas l'Audit : la Conformité reste cachée,
 * comme pour un joueur à mi-parcours ; les extensions de la commune et du canton non plus.
 */
const NOTES_MILIEU: NoteId[] = [
  'renfort',
  'rejet',
  'ramettes',
  'horaires',
  'dateur',
  'prime',
  'tilleuls',
  'piece',
  'instructeur',
  'doubleEncrage',
  'numerotation',
];

/**
 * Milieu de l'acte I, calé sur le robot de scripts/simulate-acte1.ts vers 30 min : ~9 000 tampons,
 * périmètre des Tilleuls (1 100 usagers) plein, file d'environ 900 dossiers, rejet à 50 %,
 * stagiaires, agents d'accueil et quelques instructeurs, budget et formulaires de quelques minutes.
 */
function acte1Milieu(t: number): GameState {
  const avant = t - 600_000;
  const s0 = acte1Debut(t);
  const notes = Object.fromEntries(
    NOTES_MILIEU.map((id) => [id, { achetee: avant, effective: avant }]),
  );
  const base: GameState = {
    ...s0,
    fichePosteVue: true,
    notes,
    notesVues: [...NOTES_MILIEU],
    tampons: 9_000,
    budget: 1_500,
    formulaires: 1_200,
    tauxRejet: 0.5,
    agents: { stagiaire: 10, accueil: 8, instructeur: 3, titulaire: 0 },
    conformitePoints: 5_000,
    abandons: 500,
    stats: {
      ...s0.stats,
      traites: 9_000,
      rejetes: 1_200,
      acceptes: 7_800,
      taps: 6_000,
      formulairesAchetes: 9_500,
      budgetGagne: 40_000,
      tempsDeJeu: 1_800,
    },
  };
  const population = E.perimetre(base, t);
  return courrierEnvoye(
    { ...base, population, file: [0, 100, 150, 650], retours: [0, 20, 40, 0] },
    t,
  );
}

/** Fin de l'acte I : la note « Demande de réaffectation » vient d'être approuvée. */
function finActeI(t: number): GameState {
  const s0 = E.signerCerfa(
    E.etatInitial(t, () => 0.5),
    'Camille',
    t,
  );
  const s: GameState = {
    ...s0,
    tampons: 160_000,
    fichePosteVue: true,
    acteTermine: true,
    conformitePoints: 500_000,
    // Toutes les notes de l'acte I approuvées (le déjà-vu les retrouve après une Réforme).
    notes: Object.fromEntries(NOTES_ACTE1.map((n) => [n.id, { achetee: t, effective: t }])),
  };
  return { ...s, lettresEnvoyees: nouvellesLettres(s, t).map((l) => l.id) };
}

/**
 * Les visas de l'arrivée accordés un par un, puis quelques taps dans le vide : plus rien à viser, des demandes
 * attendent la vérification des pièces et la note « Réouverture du guichet 3 » est apparue.
 */
function epuiserVisas(s0: GameState, maintenant: number): GameState {
  let s = s0;
  for (let i = 0; i < BALANCE2.visasInitiaux + BALANCE2.tapsAvantReouverture; i++)
    s = D.tamponner2(s, maintenant, () => 0.99).s;
  return D.tick2(s, 5, maintenant).s;
}

/** Sauvegarde du préréglage, horodatée à `maintenant` (pas de rattrapage d'absence au chargement). */
export function sauvegardePreset(preset: Preset, maintenant: number): GameState {
  if (preset === 'acte1Debut') return acte1Debut(maintenant);
  if (preset === 'acte1Milieu') return acte1Milieu(maintenant);
  const fin = finActeI(maintenant);
  if (preset === 'finActeI') return fin;
  if (preset === 'cerfa2') {
    // Juste après une Réforme à 60 % : Cerfa n° 00001*02 à signer, 15 trombones à dépenser.
    return R.reformer(sauvegardePreset('reforme', maintenant), maintenant, () => 0.5);
  }
  let s = D.entrerActe2({ ...fin, finActeVue: true }, maintenant);
  const avant = maintenant - 3_600_000;
  const ids = NOTES[preset];
  const notes = Object.fromEntries(
    ids.map((id) => [id, { achetee: avant, effective: avant }]),
  );
  let x: EtatActe2 = { ...(s.acte2 as EtatActe2), notes, notesVues: [...ids] };
  if (preset === 'atelier') {
    x = {
      ...x,
      guichets: 5,
      agents: { ...x.agents, instructeur: 4 },
      stats: { ...x.stats, franchies: 9_000 },
    };
    s = { ...s, budget: 6_400, formulaires: 2_300 };
  }
  if (preset === 'compliquer') {
    // Vers 11 min : l'Atelier et la Signature en vigueur, la Carte d'identité telle que le S.I.C. l'a laissée.
    x = {
      ...x,
      guichets: 8,
      agents: { ...x.agents, instructeur: 6 },
      usagers: remplir(D.stocksPour(x.procedures), { identite: [40, 12] }),
      population: 3_800,
      stats: { ...production(x, 2_000, {}, 600), franchies: 10_000 },
    };
    s = { ...s, budget: 3_000, formulaires: 1_500 };
  }
  if (preset === 'pieceService' || preset === 'avantBoucle') {
    // Vers 27 min : la note n° 8 en vigueur ; le Justificatif ne reçoit rien tant qu'aucune pièce ne l'exige.
    const exige = preset === 'avantBoucle';
    const procedures = {
      ...x.procedures,
      ...(exige ? PROCEDURES_AVANT_BOUCLE : PROCEDURES_PIECE),
    };
    x = {
      ...x,
      procedures,
      usagers: remplir(D.stocksPour(procedures), {
        identite: exige ? [60, 20, 10, 25] : [60, 20, 25],
        domicile: exige ? [20, 6] : [0, 0],
      }),
      boucles: D.stocksPour(procedures),
      suites: D.stocksPour(procedures),
      guichets: 12,
      agents: { ...x.agents, instructeur: 10, chefBureau: 2 },
      population: 3_700,
      exemplaires: 2,
      premiereModif: 'identite',
      stats: {
        ...production(x, exige ? 5_400 : 5_000, exige ? { domicile: 150 } : {}, 1_500),
        franchies: exige ? 42_000 : 40_000,
      },
    };
    s = { ...s, budget: 6_000, formulaires: 3_000 };
  }
  if (preset === 'achats') {
    // Le robot de simulate-acte2 vers 17 min : la note vient d'entrer en vigueur, le stock est bas.
    const procedures = { ...x.procedures, ...PROCEDURES_ACHATS };
    x = {
      ...x,
      procedures,
      // Personne ne demande de justificatif (specs/011) : seule la Carte d'identité a des usagers.
      usagers: remplir(D.stocksPour(procedures), {
        identite: [30, 6, 4, 8],
      }),
      boucles: D.stocksPour(procedures),
      suites: D.stocksPour(procedures),
      guichets: 9,
      agents: { ...x.agents, instructeur: 9 },
      exemplaires: 2,
      premiereModif: 'identite',
      stats: { ...x.stats, franchies: 20_000 },
    };
    s = { ...s, budget: 2_400, formulaires: 400 };
  }
  if (preset === 'boucle' || preset === 'demat' || preset === 'fin' || preset === 'reforme') {
    const procedures = { ...x.procedures, ...PROCEDURES_BOUCLE };
    x = {
      ...x,
      procedures,
      usagers: remplir(D.stocksPour(procedures), {
        identite: [20, 5, 8],
      }),
      boucles: remplir(D.stocksPour(procedures), {
        identite: [10, 4, 0],
        domicile: [12, 6],
      }),
      // Ceux qui ont déposé leur pièce poursuivent jusqu'au visa (specs/011).
      suites: remplir(D.stocksPour(procedures), { identite: [0, 0, 20] }),
      guichets: 8,
      agents: { ...x.agents, instructeur: 10 },
      premiereBoucle: avant,
      premiereModif: 'identite',
      stats: {
        ...production(x, 5_900, { identite: 800, domicile: 700 }, 5_700),
        franchies: 40_000,
        franchiesBoucle: 6_000,
        abandonsDemarche: 350,
      },
    };
    s = { ...s, budget: 19_000, formulaires: 5_400 };
  }
  if (preset === 'demat' || preset === 'fin' || preset === 'reforme') {
    x = {
      ...x,
      demaPoints: BALANCE2.demaCible * { demat: 0.38, fin: 1, reforme: 0.6 }[preset],
      // Âge et Conformité d'une Direction à ce stade (robot : 38 % vers 75 min, 60 % vers 115 min).
      duree: { demat: 4500, fin: 12000, reforme: 6900 }[preset],
      conformitePoints: { demat: 30_000_000, fin: 100_000_000, reforme: 60_000_000 }[preset],
      tauxRejet: 0.8,
      exemplaires: 2,
      agents: { ...x.agents, chefBureau: 6 },
    };
    s = { ...s, budget: 412_000, formulaires: 38_000 };
  }
  s = { ...s, acte2: x };
  // La fiche de poste du chef de service est réputée lue, sauf à la prise de fonctions.
  if (preset !== 'debut') s = marquerFiche2(s, true, maintenant);
  if (preset === 'visasEpuises') s = epuiserVisas(s, maintenant);
  // Courrier déjà mérité : réputé envoyé, sauf à l'entrée (Prise de fonctions) et à la fin (Rapport annuel).
  if (preset === 'debut') {
    return {
      ...s,
      lettresEnvoyees: [
        ...s.lettresEnvoyees,
        ...nouvellesLettres(s, maintenant)
          .filter((l) => l.id !== 'a2-prise')
          .map((l) => l.id),
      ],
    };
  }
  if (preset === 'fin') {
    return {
      ...s,
      lettresEnvoyees: [
        ...s.lettresEnvoyees,
        ...nouvellesLettres(s, maintenant)
          .filter((l) => l.id !== 'a2-rapport')
          .map((l) => l.id),
      ],
    };
  }
  return {
    ...s,
    lettresEnvoyees: [
      ...s.lettresEnvoyees,
      ...nouvellesLettres(s, maintenant).map((l) => l.id),
    ],
  };
}
