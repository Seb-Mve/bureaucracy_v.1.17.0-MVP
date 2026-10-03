/**
 * Moteur de l'acte II — La Direction. Fonctions pures, sans dépendance React :
 * utilisées par GameStateContext et par scripts/simulate-acte2.ts.
 */
import type { GameState } from '../../types/game';
import { PROCS, type Etape, type EtatActe2, type ProcId, type Stocks } from '../../types/acte2';
import { BALANCE2, PROCEDURES_INITIALES } from '../../constants/balanceActe2';

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
