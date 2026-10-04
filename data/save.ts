/**
 * Validation de la sauvegarde de l'acte I.
 * L'ancienne sauvegarde (clé 'bureaucracy_game_state', schéma v4) est ignorée.
 */
import type { GameState } from '../types/game';
import type { EtatActe2 } from '../types/acte2';
import { PROCS } from '../types/acte2';
import type { Reformes } from '../types/reforme';
import { reformesInitiales } from './jurisprudence';

export const CLE_SAUVEGARDE = 'bureaucracy_acte1_v1';

const estNombre = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** Vrai si l'objet ressemble à une sauvegarde v1 exploitable. */
function acte2Valide(x: unknown): boolean {
  if (typeof x !== 'object' || x === null) return false;
  const a = x as Record<string, unknown>;
  const rec = (v: unknown): Record<string, unknown> | null =>
    typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
  const procedures = rec(a.procedures);
  const usagers = rec(a.usagers);
  const boucles = rec(a.boucles);
  if (!procedures || !usagers || !boucles) return false;
  return PROCS.every((p) => {
    const etapes = procedures[p];
    if (!Array.isArray(etapes)) return false;
    return [usagers[p], boucles[p]].every(
      (v) => Array.isArray(v) && v.length === etapes.length && v.every(estNombre),
    );
  });
}

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
    estNombre(s.derniereMaj) &&
    (s.acte === undefined || s.acte === 1 || s.acte === 2) &&
    (s.acte !== 2 || acte2Valide(s.acte2)) &&
    (s.reformes === undefined || reformesValides(s.reformes))
  );
}

/** Les champs de la Réforme qui comptent (les autres sont complétés par normaliserSauvegarde). */
function reformesValides(x: unknown): boolean {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Partial<Reformes>;
  return estNombre(r.nombre) && estNombre(r.trombones) && Array.isArray(r.jurisprudence);
}

/**
 * Met à niveau une sauvegarde plus ancienne : retire les champs qui n'existent plus (`circulairesVues`),
 * complète `seuilRenfort` (ancien seuil fixe de 8 tampons, pour ne pas cacher une note déjà vue),
 * place à l'acte I une partie antérieure à l'acte II (sans `acte`), complète `reformes` (aucune Réforme)
 * et, à l'acte II, l'âge des services (`duree`, depuis `debut`) et la Mémoire des services.
 */
export function normaliserSauvegarde(s: GameState): GameState {
  const { circulairesVues: _, ...reste } = s as GameState & { circulairesVues?: unknown };
  const avecSeuil = estNombre(reste.seuilRenfort) ? reste : { ...reste, seuilRenfort: 8 };
  const avecActe: GameState =
    (avecSeuil as Partial<GameState>).acte === undefined ? { ...avecSeuil, acte: 1, acte2: null } : avecSeuil;
  const lu = (avecActe as Partial<GameState>).reformes;
  const reformes: Reformes = { ...reformesInitiales(), ...(lu ?? {}) };
  const x = avecActe.acte2 as (Partial<EtatActe2> & EtatActe2) | null;
  const acte2: EtatActe2 | null = x
    ? {
        ...x,
        duree: estNombre(x.duree) ? x.duree : Math.max(0, (avecActe.derniereMaj - x.debut) / 1000),
        memoireRestauree: x.memoireRestauree ?? false,
      }
    : null;
  return { ...avecActe, acte2, reformes };
}
