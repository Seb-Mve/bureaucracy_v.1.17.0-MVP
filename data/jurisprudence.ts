/**
 * Ce qui survit aux Réformes : état initial, Jurisprudence possédée, déjà-vu administratif, dénominations.
 * Sans dépendance vers les moteurs (data/engine.ts et data/acte2/moteur.ts l'importent tous deux).
 */
import type { GameState, NoteId } from '../types/game';
import type { Note2Id, ProcId } from '../types/acte2';
import type { Denomination, JurisprudenceId, Reformes } from '../types/reforme';
import { PROC_NOMS, REFORME } from '../constants/balanceActe2';

/** Noms de la première partie : ceux de la spec. */
export const DENOMINATION_INITIALE: Denomination = {
  direction: 'La Direction',
  procedures: { ...PROC_NOMS },
};

/** Avant toute Réforme. */
export function reformesInitiales(): Reformes {
  return {
    nombre: 0,
    trombones: 0,
    trombonesObtenus: 0,
    jurisprudence: [],
    conformiteConvertie: 0,
    notesInstruites: [],
    notes2Instruites: [],
    procedures: null,
    ancienneDirection: DENOMINATION_INITIALE.direction,
    denomination: {
      direction: DENOMINATION_INITIALE.direction,
      procedures: { ...DENOMINATION_INITIALE.procedures },
    },
    premierCerfa: null,
  };
}

export const aJurisprudence = (s: GameState, id: JurisprudenceId): boolean =>
  s.reformes.jurisprudence.includes(id);

/** Déjà-vu administratif : la note a été achetée lors d'une partie précédente. */
export const dejaInstruite = (s: GameState, id: NoteId): boolean =>
  s.reformes.notesInstruites.includes(id);

export const dejaInstruite2 = (s: GameState, id: Note2Id): boolean =>
  s.reformes.notes2Instruites.includes(id);

/** Délai d'instruction (s) et coût d'une note, déjà-vu compris. */
export function conditionsNote(
  deja: boolean,
  cout: number,
  instruction: number,
): { cout: number; instruction: number } {
  return deja
    ? {
        cout: Math.round(cout / REFORME.dejaVuCout),
        instruction: instruction / REFORME.dejaVuDelai,
      }
    : { cout, instruction };
}

/** Multiplicateur de dotation de la Jurisprudence (Ancienneté reconnue), à tous les actes. */
export const dotationJurisprudence = (s: GameState): number =>
  aJurisprudence(s, 'anciennete') ? 1 + REFORME.bonusAnciennete : 1;

/** Multiplicateur du prix des formulaires de la Jurisprudence (Vide juridique), à tous les actes. */
export const prixFormulairesJurisprudence = (s: GameState): number =>
  aJurisprudence(s, 'videJuridique') ? 1 - REFORME.remiseVideJuridique : 1;

const FORMES = [
  'Le Pôle',
  'L’Agence',
  'La Direction',
  'La Mission',
  'La Délégation',
  'L’Office',
  'La Cellule',
];
const OBJETS = [
  'de l’action administrative',
  'de la simplification',
  'des démarches citoyennes',
  'de la relation à l’usager',
  'de la modernisation publique',
  'des parcours usagers',
];
export const NOMS_PROCEDURES: Record<ProcId, string[]> = {
  identite: [
    'Démarche d’identification citoyenne',
    'Parcours d’attestation d’identité',
    'Titre d’identité simplifié',
  ],
  domicile: [
    'Attestation de résidence effective',
    'Parcours de domiciliation',
    'Certificat d’adressage citoyen',
  ],
  hebergement: [
    'Déclaration de cohabitation',
    'Parcours d’accueil résidentiel',
    'Justificatif de mise à l’abri',
  ],
  vie: [
    'Attestation d’existence',
    'Parcours de maintien en vie administrative',
    'Justificatif de présence au monde',
  ],
};

/** Tire au sort un autre nom que `actuel` dans `noms`. */
function autre(noms: string[], actuel: string, alea: () => number): string {
  const choix = noms.filter((n) => n !== actuel);
  return choix[Math.floor(alea() * choix.length) % choix.length];
}

/** Nouveaux noms des services après une Réforme : tous changent, rien d'autre. */
export function tirerDenomination(
  actuelle: Denomination,
  alea: () => number,
): Denomination {
  const direction = autre(
    FORMES.flatMap((f) => OBJETS.map((o) => `${f} ${o}`)),
    actuelle.direction,
    alea,
  );
  const procedures = Object.fromEntries(
    (Object.keys(NOMS_PROCEDURES) as ProcId[]).map((p) => [
      p,
      autre(
        [PROC_NOMS[p], ...NOMS_PROCEDURES[p]],
        actuelle.procedures[p],
        alea,
      ),
    ]),
  ) as Record<ProcId, string>;
  return { direction, procedures };
}
