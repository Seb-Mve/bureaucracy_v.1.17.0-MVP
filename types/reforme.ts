/**
 * Types de la Réforme (premier prestige) : trombones, Jurisprudence, déjà-vu administratif.
 * Voir specs/009-acte2-direction/spec.md, section « La Réforme ».
 */
import type { NoteId } from './game';
import type { Etape, Note2Id, ProcId } from './acte2';

export type JurisprudenceId =
  | 'droitAcquis'
  | 'precedent'
  | 'videJuridique'
  | 'anteriorite'
  | 'memoire'
  | 'anciennete';

/** Noms des services, tirés au sort à chaque Réforme (« rien d'autre ne change »). */
export interface Denomination {
  /** Nom du service du chef, avec son article : « La Direction », « Le Pôle de la simplification »… */
  direction: string;
  procedures: Record<ProcId, string>;
}

/** Tout ce qui survit à une Réforme, avec le compteur Tampons apposés et le prénom. */
export interface Reformes {
  /** Réformes accomplies (0 avant la première). */
  nombre: number;
  /** Trombones disponibles (gagnés moins dépensés en Jurisprudence). */
  trombones: number;
  /** Trombones obtenus depuis le début, dépensés ou non (jurisprudence constante). */
  trombonesObtenus: number;
  /** Bonus de Jurisprudence achetés, dans l'ordre d'achat. */
  jurisprudence: JurisprudenceId[];
  /** Conformité des parties précédentes, déjà convertie en trombones. */
  conformiteConvertie: number;
  /** Notes de l'acte I achetées lors d'une partie précédente (déjà-vu administratif). */
  notesInstruites: NoteId[];
  /** Notes de l'acte II achetées lors d'une partie précédente. */
  notes2Instruites: Note2Id[];
  /** Procédures telles qu'avant la dernière Réforme (Mémoire des services), null avant la première. */
  procedures: Record<ProcId, Etape[]> | null;
  denomination: Denomination;
  /** Le premier Cerfa tamponné, stocké inchangé : l'original exigé à l'acte VI. Null avant la première Réforme. */
  premierCerfa: { prenom: string; signeLe: number | null } | null;
}
