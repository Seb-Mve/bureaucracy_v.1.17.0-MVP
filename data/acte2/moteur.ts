/**
 * Moteur de l'acte II — La Direction. Fonctions pures, sans dépendance React :
 * utilisées par GameStateContext et par scripts/simulate-acte2.ts.
 */
import type { GameState } from '../../types/game';
import {
  PROCS,
  type Etape,
  type EtatActe2,
  type Modifiers2,
  type Note2Id,
  type ProcId,
  type Stocks,
} from '../../types/acte2';
import { BALANCE } from '../../constants/balance';
import { BALANCE2, PROCEDURES_INITIALES } from '../../constants/balanceActe2';
import { rangGrade } from '../engine';
import { NOTES2, NOTES2_PAR_ID } from './notes2';

export function copieProcedures(p: Record<ProcId, Etape[]>): Record<ProcId, Etape[]> {
  return Object.fromEntries(PROCS.map((id) => [id, p[id].map((e) => ({ ...e }))])) as Record<
    ProcId,
    Etape[]
  >;
}

export function copieStocks(st: Stocks): Stocks {
  return Object.fromEntries(PROCS.map((p) => [p, [...st[p]]])) as Stocks;
}

/** Stocks à zéro : un compteur par étape de chaque procédure. */
export function stocksPour(procedures: Record<ProcId, Etape[]>): Stocks {
  return Object.fromEntries(PROCS.map((p) => [p, procedures[p].map(() => 0)])) as Stocks;
}

export function sommeStocks(st: Stocks): number {
  let t = 0;
  for (const p of PROCS) for (const v of st[p]) t += v;
  return t;
}

/** État de la Direction à l'entrée dans l'acte : le guichet 3 et la procédure du S.I.C. */
export function etatInitialActe2(maintenant: number): EtatActe2 {
  const procedures = copieProcedures(PROCEDURES_INITIALES);
  const usagers = stocksPour(procedures);
  usagers.identite[0] = BALANCE2.fileInitiale;
  return {
    debut: maintenant,
    guichets: BALANCE2.guichetsInitiaux,
    agents: { instructeur: 0, chefBureau: 0, sousDirecteur: 0 },
    procedures,
    usagers,
    boucles: stocksPour(procedures),
    population: BALANCE2.populationInitiale,
    abandons: 0,
    conformitePoints: 0,
    demaPoints: 0,
    tauxRejet: 0,
    exemplaires: 1,
    notes: {},
    notesVues: [],
    premiereBoucle: null,
    premiereModif: null,
    acteTermine: false,
    finActeVue: false,
    stats: { franchies: 0, franchiesBoucle: 0, visasTampons: 0, abandonsDemarche: 0, taps: 0 },
  };
}

/**
 * Passage à l'acte II : toutes les ressources repartent à zéro, sauf le compteur
 * de tampons (et donc le grade). Le budget non consommé est « restitué au Trésor ».
 */
export function entrerActe2(s: GameState, maintenant: number): GameState {
  if (s.acte === 2) return s;
  return {
    ...s,
    acte: 2,
    acte2: etatInitialActe2(maintenant),
    budget: BALANCE2.budgetInitial,
    formulaires: BALANCE2.formulairesInitiaux,
    derniereMaj: maintenant,
  };
}

/** Vrai si la note est achetée et son délai d'instruction écoulé. */
export function noteEffective2(x: EtatActe2, id: Note2Id, maintenant: number): boolean {
  const n = x.notes[id];
  return n !== undefined && n.effective <= maintenant;
}

/** Modificateurs de l'acte II : notes effectives et grade (le grade suit le compteur de tampons). */
export function getModifiers2(s: GameState, maintenant: number): Modifiers2 {
  const m: Modifiers2 = {
    tapPower: 1,
    dotationMult: 1 + BALANCE.bonusGrade * rangGrade(s.tampons),
    primeRejet: BALANCE2.primeRejet,
    rejetMax: BALANCE2.rejetMaxInitial,
    recrutementVisible: false,
    agentsDisponibles: [],
    atelierVisible: false,
    etapesDisponibles: ['visa'],
    procsOuvertes: ['identite'],
    exemplairesVisible: false,
    dematVisible: false,
    reformeVisible: false,
    tableauVisible: false,
  };
  const x = s.acte2;
  if (!x) return m;
  for (const n of NOTES2) if (noteEffective2(x, n.id, maintenant)) n.appliquer(m);
  return m;
}

/** Notes visibles (conditions remplies), achetées ou non, dans l'ordre du catalogue. */
export function notesVisibles2(s: GameState): Note2Id[] {
  const x = s.acte2;
  if (!x) return [];
  return NOTES2.filter((n) => x.notes[n.id] !== undefined || n.visible(s)).map((n) => n.id);
}

export function peutAcheterNote2(s: GameState, id: Note2Id): boolean {
  const x = s.acte2;
  const n = NOTES2_PAR_ID[id];
  return x !== null && x.notes[id] === undefined && n.visible(s) && s.budget >= n.cout;
}

export function acheterNote2(s: GameState, id: Note2Id, maintenant: number): GameState {
  if (!peutAcheterNote2(s, id)) return s;
  const x = s.acte2 as EtatActe2;
  const n = NOTES2_PAR_ID[id];
  return {
    ...s,
    budget: s.budget - n.cout,
    acte2: {
      ...x,
      notes: { ...x.notes, [id]: { achetee: maintenant, effective: maintenant + n.instruction * 1000 } },
      acteTermine: x.acteTermine || id === 'promotion',
    },
  };
}
