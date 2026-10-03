/**
 * Vues de l'acte II : ce que les écrans de La Direction affichent (écran Direction, Service, notes),
 * calculé à partir de l'état. Fonctions pures : GameStateContext les appelle (les composants n'importent
 * jamais data/). L'Atelier a sa propre vue : data/acte2/vueAtelier.ts.
 */
import type { GameState, NoteId } from '../../types/game';
import type {
  Agent2Id,
  EtapeType,
  EtatActe2,
  Exemplaires,
  Note2Id,
  ProcId,
} from '../../types/acte2';
import { AGENTS2, PROC_NOMS } from '../../constants/balanceActe2';
import {
  coutAgent2,
  coutGuichet,
  dematerialisation,
  getModifiers2,
  notesVisibles2,
  usagersEnCours,
  visasEnAttente,
  vitesseGuichets,
  vitesseVisas,
} from './moteur';
import { NOTES2_PAR_ID } from './notes2';

/** Plafond d'un achat « Max » (collègues, guichets, agents), par sécurité. */
export const ACHAT_MAX = 500;
/** Numéro du premier parapheur présenté au chef de service (le panneau d'appel affiche le précédent). */
export const PREMIER_PARAPHEUR = 48;

const DESCRIPTION_GUICHET =
  'Le guichet 3 et ses semblables. Joignent les pièces, sans lire.';
/** Noms courts des étapes, pour la chaîne de fiches de la bulle. */
const NOMS_COURTS: Record<EtapeType, string> = {
  piece: 'Pièce',
  visa: 'Visa',
  signature: 'Signature',
  pieceService: 'Pièce de service',
  reflexion: 'Réflexion',
  commission: 'Commission',
};

/** État de l'acte II, seulement quand la partie est à l'acte II. */
export const acte2 = (s: GameState): EtatActe2 | null =>
  s.acte === 2 ? s.acte2 : null;

/** Vrai pour un identifiant de note de l'acte II. */
export function estNote2(id: NoteId | Note2Id): id is Note2Id {
  return id in NOTES2_PAR_ID;
}

// ---------------------------------------------------------------------------------------------
// Écran Direction
// ---------------------------------------------------------------------------------------------

export interface ParapheurAffiche {
  numero: number;
  proc: ProcId;
  procNom: string;
  /** La plupart des dossiers de ce visa n'ont plus d'usager. */
  sansUsager: boolean;
}

/** Une fiche de la chaîne affichée dans la bulle ; un visa en attente « s'allume ». */
export interface EtapeChaine {
  type: EtapeType;
  nom: string;
  /** Dossiers qui attendent ce visa (0 hors visa). */
  attente: number;
  allumee: boolean;
}

export interface VueDirection {
  visas: number;
  usagers: number;
  guichets: number;
  /** Taux de dématérialisation (%), null tant que sa note n'est pas en vigueur. */
  demat: number | null;
  /** Moins de formulaires que d'exemplaires exigés : plus aucune étape ne passe. */
  rupture: boolean;
  tauxRejet: number;
  rejetMax: number;
  exemplaires: Exemplaires;
  exemplairesVisible: boolean;
  parapheur: ParapheurAffiche | null;
  /** Étapes de la procédure du parapheur (Carte d'identité s'il n'y en a pas). */
  etapes: EtapeChaine[];
  /** Numéro du panneau d'appel de la salle (null : salle vide, panneau éteint). */
  appel: number | null;
  recrutementVisible: boolean;
  atelierVisible: boolean;
  visasAccordes: number;
  abandons: number;
  /** Tableau de bord (note n° 16), null avant. */
  tableau: { abandonsDemarche: number } | null;
  acteTermine: boolean;
  finActeVue: boolean;
}

/** Dossiers d'usagers et dossiers en boucle qui attendent un visa dans la procédure `p`. */
function visasDe(x: EtatActe2, p: ProcId): { u: number; b: number } {
  let u = 0;
  let b = 0;
  x.procedures[p].forEach((e, k) => {
    if (e.type !== 'visa') return;
    u += x.usagers[p][k];
    b += x.boucles[p][k];
  });
  return { u, b };
}

/** Écran Direction : ressources, parapheur à viser, scène et curseurs. Null hors de l'acte II. */
export function vueDirection(
  s: GameState,
  maintenant: number,
): VueDirection | null {
  const x = acte2(s);
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  const numero = PREMIER_PARAPHEUR + Math.floor(x.stats.visasTampons);
  // Le parapheur en tête vient de la procédure qui a le plus de visas en attente.
  let tete: { p: ProcId; u: number; b: number } | null = null;
  for (const p of m.procsOuvertes) {
    const v = visasDe(x, p);
    if (v.u + v.b >= 1 && (!tete || v.u + v.b > tete.u + tete.b))
      tete = { p, ...v };
  }
  const p: ProcId = tete?.p ?? 'identite';
  const usagers = Math.floor(usagersEnCours(x));
  return {
    visas: Math.floor(visasEnAttente(x)),
    usagers,
    guichets: x.guichets,
    demat: m.dematVisible ? dematerialisation(x) : null,
    rupture: s.formulaires < x.exemplaires,
    tauxRejet: Math.min(x.tauxRejet, m.rejetMax),
    rejetMax: m.rejetMax,
    exemplaires: x.exemplaires,
    exemplairesVisible: m.exemplairesVisible,
    parapheur: tete
      ? {
          numero,
          proc: tete.p,
          procNom: PROC_NOMS[tete.p],
          sansUsager: tete.b > tete.u,
        }
      : null,
    etapes: x.procedures[p].map((e, k) => {
      const attente =
        e.type === 'visa' ? Math.floor(x.usagers[p][k] + x.boucles[p][k]) : 0;
      return {
        type: e.type,
        nom: NOMS_COURTS[e.type],
        attente,
        allumee: attente >= 1,
      };
    }),
    appel: usagers >= 1 ? numero - 1 : null,
    recrutementVisible: m.recrutementVisible,
    atelierVisible: m.atelierVisible,
    visasAccordes: Math.floor(x.stats.visasTampons),
    abandons: Math.floor(x.abandons),
    tableau: m.tableauVisible
      ? { abandonsDemarche: Math.floor(x.stats.abandonsDemarche) }
      : null,
    acteTermine: x.acteTermine,
    finActeVue: x.finActeVue,
  };
}

// ---------------------------------------------------------------------------------------------
// Onglet Service
// ---------------------------------------------------------------------------------------------

export interface UniteAffichee<Id extends string = string> {
  id: Id;
  nom: string;
  description: string;
  possedes: number;
  cout: number;
  /** Coût de dix achats d'affilée (le prix monte à chaque achat). */
  cout10: number;
  /** Achats possibles d'affilée avec le budget actuel. */
  maxAchetables: number;
  coutMax: number;
  achetable: boolean;
}

export interface VueService2 {
  guichet: UniteAffichee<'guichet'>;
  agents: UniteAffichee<Agent2Id>[];
  etapesParSeconde: number;
  visasParSeconde: number;
}

/** Prix d'un achat, de dix achats et du plus grand lot que le budget permet. */
function lot(
  prix: (possedes: number) => number,
  possedes: number,
  budget: number,
) {
  const cout = prix(possedes);
  let cout10 = 0;
  for (let i = 0; i < 10; i++) cout10 += prix(possedes + i);
  let maxAchetables = 0;
  let coutMax = 0;
  for (let reste = budget; maxAchetables < ACHAT_MAX; maxAchetables++) {
    const p = prix(possedes + maxAchetables);
    if (reste < p) break;
    reste -= p;
    coutMax += p;
  }
  return { cout, cout10, maxAchetables, coutMax, achetable: budget >= cout };
}

/** Onglet Service de l'acte II : guichets et agents débloqués. Null hors de l'acte II. */
export function vueService2(
  s: GameState,
  maintenant: number,
): VueService2 | null {
  const x = acte2(s);
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  return {
    guichet: {
      id: 'guichet',
      nom: 'Guichet',
      description: DESCRIPTION_GUICHET,
      possedes: x.guichets,
      ...lot(coutGuichet, x.guichets, s.budget),
    },
    agents: AGENTS2.filter((a) => m.agentsDisponibles.includes(a.id)).map(
      (a) => ({
        id: a.id,
        nom: a.nom,
        description: a.description,
        possedes: x.agents[a.id],
        ...lot((n) => coutAgent2(a.id, n), x.agents[a.id], s.budget),
      }),
    ),
    etapesParSeconde: vitesseGuichets(x),
    visasParSeconde: vitesseVisas(x),
  };
}

// ---------------------------------------------------------------------------------------------
// Notes de service
// ---------------------------------------------------------------------------------------------

export type StatutNote2 =
  'disponible' | 'tropCher' | 'instruction' | 'effective';

export interface NoteVue2 {
  id: Note2Id;
  numero: number;
  titre: string;
  texte: string;
  effet: string;
  cout: number;
  instruction: number;
  statut: StatutNote2;
  /** Secondes restantes d'instruction. */
  resteSec: number;
  nouvelle: boolean;
}

/** Notes de l'acte II visibles, avec leur statut (même carte qu'à l'acte I). */
export function notesAffichees2(s: GameState, maintenant: number): NoteVue2[] {
  const x = acte2(s);
  if (!x) return [];
  return notesVisibles2(s).map((id) => {
    const def = NOTES2_PAR_ID[id];
    const st = x.notes[id];
    let statut: StatutNote2 = s.budget >= def.cout ? 'disponible' : 'tropCher';
    let resteSec = 0;
    if (st) {
      resteSec = Math.max(0, Math.ceil((st.effective - maintenant) / 1000));
      statut = resteSec > 0 ? 'instruction' : 'effective';
    }
    return {
      id,
      numero: def.numero,
      titre: def.titre,
      texte: def.texte,
      effet: def.effet,
      cout: def.cout,
      instruction: def.instruction,
      statut,
      resteSec,
      nouvelle: !x.notesVues.includes(id),
    };
  });
}
