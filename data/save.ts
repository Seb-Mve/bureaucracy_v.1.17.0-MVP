/**
 * Validation de la sauvegarde de l'acte I.
 * L'ancienne sauvegarde (clé 'bureaucracy_game_state', schéma v4) est ignorée.
 */
import type { GameState } from '../types/game';
import { getModifiers } from './engine';
import { circulairesDejaDeclenchees } from './circulaires';

export const CLE_SAUVEGARDE = 'bureaucracy_acte1_v1';

const estNombre = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** Vrai si l'objet ressemble à une sauvegarde v1 exploitable. */
export function estSauvegardeValide(x: unknown): x is GameState {
  if (typeof x !== 'object' || x === null) return false;
  const s = x as Partial<GameState>;
  return (
    s.version === 1 &&
    typeof s.cerfa === 'object' &&
    estNombre(s.tampons) &&
    estNombre(s.budget) &&
    estNombre(s.formulaires) &&
    Array.isArray(s.file) &&
    s.file.length === 4 &&
    Array.isArray(s.retours) &&
    s.retours.length === 4 &&
    estNombre(s.population) &&
    estNombre(s.conformitePoints) &&
    typeof s.agents === 'object' &&
    typeof s.notes === 'object' &&
    Array.isArray(s.courrier) &&
    typeof s.stats === 'object' &&
    estNombre(s.derniereMaj)
  );
}

/**
 * Complète une sauvegarde antérieure à la spec 008 : sans `circulairesVues`,
 * les circulaires des mécaniques déjà débloquées sont marquées comme lues.
 */
export function normaliserSauvegarde(s: GameState, maintenant: number): GameState {
  if (Array.isArray((s as Partial<GameState>).circulairesVues)) return s;
  const provisoire: GameState = { ...s, circulairesVues: [] };
  return {
    ...provisoire,
    circulairesVues: circulairesDejaDeclenchees(provisoire, getModifiers(provisoire, maintenant)),
  };
}
