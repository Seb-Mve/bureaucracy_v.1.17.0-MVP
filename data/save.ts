/**
 * Validation de la sauvegarde de l'acte I.
 * L'ancienne sauvegarde (clé 'bureaucracy_game_state', schéma v4) est ignorée.
 */
import type { GameState } from '../types/game';

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
 * Met à niveau une sauvegarde plus ancienne : retire les champs qui n'existent plus (`circulairesVues`)
 * et complète `seuilRenfort` (ancien seuil fixe de 8 tampons, pour ne pas cacher une note déjà vue).
 */
export function normaliserSauvegarde(s: GameState): GameState {
  const { circulairesVues: _, ...reste } = s as GameState & { circulairesVues?: unknown };
  return estNombre(reste.seuilRenfort) ? reste : { ...reste, seuilRenfort: 8 };
}
