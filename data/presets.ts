/**
 * Raccourcis de test : sauvegardes prêtes à charger, de l'acte I à la Réforme, pour vérifier
 * n'importe quel moment du jeu sans le rejouer. Utilisé par l'écran /test (GameStateContext),
 * par scripts/save-acte2.ts et par les tests. Fonctions pures, sans React.
 */
import type { GameState, NoteId } from '../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId, Stocks } from '../types/acte2';
import * as E from './engine';
import * as D from './acte2/moteur';
import { nouvellesLettres } from './courrier';
import * as R from './reforme';
import { BALANCE2 } from '../constants/balanceActe2';
import { NOTES as NOTES_ACTE1 } from './notes';

export type Preset =
  | 'acte1Debut'
  | 'acte1Milieu'
  | 'finActeI'
  | 'debut'
  | 'atelier'
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
  { id: 'debut', titre: 'Acte II — prise de fonctions', detail: 'Entrée à la Direction' },
  { id: 'atelier', titre: 'Acte II — Atelier ouvert', detail: 'Atelier des procédures, 5 guichets' },
  {
    id: 'boucle',
    titre: 'Acte II — boucle formée',
    detail: 'Carte d’identité ⇄ Justificatif de domicile',
  },
  { id: 'demat', titre: 'Acte II — dématérialisation', detail: 'Démat. à 38 %' },
  { id: 'fin', titre: 'Acte II — fin', detail: 'Démat. à 100 %, rapport annuel' },
  { id: 'reforme', titre: 'Acte II — Réforme possible', detail: 'Démat. à 60 %, note n° 10 en vigueur' },
  { id: 'cerfa2', titre: 'Après la Réforme', detail: 'Cerfa n° 00001*02 à signer, 15 trombones' },
];

export const PRESETS: Preset[] = PRESETS_INFO.map((p) => p.id);

const NOTES_ATELIER: Note2Id[] = ['prise', 'agents', 'atelier'];
const NOTES_BOUCLE: Note2Id[] = [
  ...NOTES_ATELIER,
  'signature',
  'exemplaires',
  'pieceService',
];
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
  atelier: NOTES_ATELIER,
  boucle: NOTES_BOUCLE,
  demat: NOTES_DEMAT,
  fin: NOTES_DEMAT,
  reforme: [...NOTES_DEMAT, 'reforme'],
};

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
  if (preset === 'boucle' || preset === 'demat' || preset === 'fin' || preset === 'reforme') {
    const procedures = { ...x.procedures, ...PROCEDURES_BOUCLE };
    x = {
      ...x,
      procedures,
      usagers: remplir(D.stocksPour(procedures), {
        identite: [20, 5, 8],
        domicile: [6, 2],
      }),
      boucles: remplir(D.stocksPour(procedures), {
        identite: [10, 4, 20],
        domicile: [12, 6],
      }),
      guichets: 8,
      agents: { ...x.agents, instructeur: 10 },
      premiereBoucle: avant,
      premiereModif: 'identite',
      stats: {
        ...x.stats,
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
