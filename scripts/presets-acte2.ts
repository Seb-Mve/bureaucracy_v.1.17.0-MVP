/**
 * Sauvegardes prêtes à charger dans le navigateur, pour vérifier les écrans de l'acte II
 * sans rejouer la partie. Utilisé par scripts/save-acte2.ts et par scripts/tests/vues-acte2.test.ts.
 */
import type { GameState } from '../types/game';
import type { Etape, EtatActe2, Note2Id, ProcId, Stocks } from '../types/acte2';
import * as E from '../data/engine';
import * as D from '../data/acte2/moteur';
import { nouvellesLettres } from '../data/courrier';
import * as R from '../data/reforme';
import { BALANCE2 } from '../constants/balanceActe2';
import { NOTES as NOTES_ACTE1 } from '../data/notes';

export type Preset =
  'finActeI' | 'debut' | 'atelier' | 'boucle' | 'demat' | 'fin' | 'reforme' | 'cerfa2';
export const PRESETS: Preset[] = [
  'finActeI',
  'debut',
  'atelier',
  'boucle',
  'demat',
  'fin',
  'reforme',
  'cerfa2',
];

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
const NOTES: Record<Exclude<Preset, 'finActeI' | 'cerfa2'>, Note2Id[]> = {
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
export function sauvegardeActe2(preset: Preset, maintenant: number): GameState {
  const fin = finActeI(maintenant);
  if (preset === 'finActeI') return fin;
  if (preset === 'cerfa2') {
    // Juste après une Réforme à 60 % : Cerfa n° 00001*02 à signer, 15 trombones à dépenser.
    return R.reformer(sauvegardeActe2('reforme', maintenant), maintenant, () => 0.5);
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
