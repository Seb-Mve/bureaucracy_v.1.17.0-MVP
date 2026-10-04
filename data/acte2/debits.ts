/**
 * Débits de l'en-tête de l'acte II : euros et formulaires par seconde, signés et lissés.
 * Ils mesurent les flux du service (dotation, consommation), jamais un achat du joueur.
 */
import type { GameState } from '../../types/game';
import type { Events2 } from '../../types/acte2';
import { BALANCE } from '../../constants/balance';
import { BALANCE2 } from '../../constants/balanceActe2';
import { getModifiers2, prixRamette2 } from './moteur';

export interface Debits {
  /** €/s : dotation et primes, moins les formulaires rachetés par le Service des achats. */
  budget: number;
  /** Formulaires/s : consommation des étapes franchies (négatif). */
  formulaires: number;
}

export const DEBITS_NULS: Debits = { budget: 0, formulaires: 0 };

/**
 * Coût d'un formulaire porté au débit du budget : son prix quand le Service des achats est en service (il
 * rachète ce qui se consomme, le débit reste lisse entre deux commandes) ; 0 sinon (une ramette achetée à
 * la main est un achat, pas un flux).
 */
export function coutFormulaireDebit(s: GameState, maintenant: number): number {
  const x = s.acte2;
  if (!x || !x.achatsActifs || !getModifiers2(s, maintenant).achatsVisible)
    return 0;
  return prixRamette2(s) / BALANCE.ramette;
}

/** Flux d'un tick ou d'un tap (montants, pas encore des débits). */
export function fluxDe(ev: Events2, coutFormulaire: number): Debits {
  return {
    budget: ev.budget - ev.formulaires * coutFormulaire,
    formulaires: -ev.formulaires,
  };
}

export function ajouterFlux(a: Debits, b: Debits): Debits {
  return {
    budget: a.budget + b.budget,
    formulaires: a.formulaires + b.formulaires,
  };
}

/**
 * Moyenne glissante exponentielle : `flux` accumulé pendant `dt` secondes rapproche les débits de
 * `flux / dt`, avec la constante `tau` (s). `dt` nul : rien ne change.
 */
export function lisserDebits(
  prec: Debits,
  flux: Debits,
  dt: number,
  tau: number = BALANCE2.lissageDebits,
): Debits {
  if (dt <= 0) return prec;
  const k = 1 - Math.exp(-dt / tau);
  return {
    budget: prec.budget + (flux.budget / dt - prec.budget) * k,
    formulaires:
      prec.formulaires + (flux.formulaires / dt - prec.formulaires) * k,
  };
}
