/**
 * Constantes d'équilibrage de l'acte II — La Direction.
 * Toute valeur ici est vérifiée par scripts/simulate-acte2.ts.
 */
import type { Agent2Id, Etape, EtapeType, Exemplaires, ProcId } from '../types/acte2';

export const BALANCE2 = {
  /** Habitants de la ville à l'entrée dans l'acte, et capacité maximale. */
  populationInitiale: 1500,
  populationMax: 4000,
  /** Nouveaux habitants par seconde, en fraction de la place libre. */
  installationRate: 1 / 60,
  /** Demandes par seconde et par usager inactif. */
  demandeRate: 1 / 20,
  /** Dossiers d'usagers qui attendent déjà à la Carte d'identité. */
  fileInitiale: 20,
  budgetInitial: 0,
  formulairesInitiaux: 300,
  /** Dotation de base par étape franchie (€), multipliée par celle de l'étape. */
  dotation: 1,
  /** Prime de rejet : part de la dotation versée en plus pour un dossier rejeté. */
  primeRejet: 0.2,
  confParRejet: 1,
  /** Part des usagers qui abandonnent, par point de patience coûté par une étape. */
  abandonParPoint: 0.04,
  /** Part des usagers rejetés qui abandonnent (un point de patience sur trois). */
  abandonRejet: 1 / 3,
  rejetMaxInitial: 0.5,
  /** Guichets : étapes franchies par seconde et prix. */
  guichet: { vitesse: 0.5, coutBase: 60, croissance: 1.15 },
  /** Le guichet 3 de l'acte I, compressé en unité. */
  guichetsInitiaux: 1,
  etapesMax: 8,
  /** Points de dématérialisation correspondant à 100 %. */
  demaCible: 3_000_000,
  /** Délai du filet de sécurité après la note « Pièce délivrée par nos services » (min). */
  filetMinutes: 15,
} as const;

export interface EtapeDef {
  type: EtapeType;
  nom: string;
  description: string;
  conf: number;
  dotation: number;
  /** Temps moyen passé à l'étape (s). */
  delai: number;
  /** Points de patience coûtés à l'usager. */
  patience: number;
}

export const ETAPES: Record<EtapeType, EtapeDef> = {
  piece: {
    type: 'piece',
    nom: 'Pièce justificative',
    description: 'Une pièce de plus. Elle justifie la suivante.',
    conf: 1,
    dotation: 1,
    delai: 3,
    patience: 1,
  },
  visa: {
    type: 'visa',
    nom: 'Visa',
    description: 'Attend un coup de tampon.',
    conf: 2,
    dotation: 1,
    delai: 4,
    patience: 1,
  },
  signature: {
    type: 'signature',
    nom: 'Signature',
    description: 'Lisible de préférence. Jamais lisible.',
    conf: 1,
    dotation: 1,
    delai: 3,
    patience: 1,
  },
  pieceService: {
    type: 'pieceService',
    nom: 'Pièce délivrée par nos services',
    description: 'Exige un document délivré par une autre de vos procédures.',
    conf: 1,
    dotation: 1,
    delai: 3,
    patience: 1,
  },
  reflexion: {
    type: 'reflexion',
    nom: 'Délai de réflexion',
    description: 'Protège l’usager de toute décision hâtive.',
    conf: 1,
    dotation: 0,
    delai: 15,
    patience: 2,
  },
  commission: {
    type: 'commission',
    nom: 'Commission',
    description: 'Se réunit quand le quorum est atteint.',
    conf: 3,
    dotation: 2,
    delai: 15,
    patience: 2,
  },
};

/** Effet du curseur Exemplaires exigés, par étape franchie. Les formulaires suivent le nombre d'exemplaires. */
export const EXEMPLAIRES: Record<Exemplaires, { dotation: number; conf: number; patience: number }> = {
  1: { dotation: 1, conf: 1, patience: 1 },
  2: { dotation: 1.6, conf: 1.8, patience: 1.5 },
  3: { dotation: 2.1, conf: 2.5, patience: 2 },
};

export const PROC_NOMS: Record<ProcId, string> = {
  identite: 'Carte d’identité',
  domicile: 'Justificatif de domicile',
  hebergement: 'Attestation d’hébergement',
  vie: 'Certificat de vie',
};

/** Procédures à l'entrée dans l'acte : la Carte d'identité est imposée par le S.I.C. */
export const PROCEDURES_INITIALES: Record<ProcId, Etape[]> = {
  identite: [{ type: 'piece' }, { type: 'visa' }],
  domicile: [{ type: 'piece' }],
  hebergement: [{ type: 'piece' }],
  vie: [{ type: 'piece' }],
};

export interface Agent2Def {
  id: Agent2Id;
  nom: string;
  description: string;
  /** Visas accordés par seconde. */
  vitesse: number;
  coutBase: number;
  croissance: number;
}

export const AGENTS2: Agent2Def[] = [
  {
    id: 'instructeur',
    nom: 'Instructeur',
    description: 'Vise ce qu’on lui tend. Ne lit pas, par principe.',
    vitesse: 0.3,
    coutBase: 100,
    croissance: 1.13,
  },
  {
    id: 'chefBureau',
    nom: 'Chef de bureau',
    description: 'Vise ce que l’instructeur a visé, pour le cas où.',
    vitesse: 2,
    coutBase: 1500,
    croissance: 1.15,
  },
  {
    id: 'sousDirecteur',
    nom: 'Sous-directeur',
    description: 'Ne vise rien lui-même. Délègue, très vite.',
    vitesse: 12,
    coutBase: 20000,
    croissance: 1.15,
  },
];
