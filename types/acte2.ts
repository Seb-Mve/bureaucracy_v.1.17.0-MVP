/**
 * Types de l'acte II — La Direction.
 * Voir specs/009-acte2-direction/spec.md.
 */
import type { NoteState } from './game';

export type ProcId = 'identite' | 'domicile' | 'hebergement' | 'vie';

/** Ordre d'affichage et d'ouverture des procédures. */
export const PROCS: ProcId[] = ['identite', 'domicile', 'hebergement', 'vie'];

export type EtapeType = 'visa' | 'piece' | 'signature' | 'pieceService' | 'reflexion' | 'commission';

export interface Etape {
  type: EtapeType;
  /** Procédure exigée (étape « Pièce délivrée par nos services » seulement). */
  exige?: ProcId;
}

export type Agent2Id = 'instructeur' | 'chefBureau' | 'sousDirecteur';

export type Note2Id =
  | 'prise'
  | 'agents'
  | 'atelier'
  | 'signature'
  | 'exemplaires'
  | 'chefBureau'
  | 'pieceService'
  | 'reflexion'
  | 'troisieme'
  | 'reforme'
  | 'demat'
  | 'rejetElargi'
  | 'commission'
  | 'sousDirecteur'
  | 'quatrieme'
  | 'tableau'
  | 'promotion';

export type Exemplaires = 1 | 2 | 3;

/** Dossiers par procédure et par rang d'étape (même longueur que la procédure). */
export type Stocks = Record<ProcId, number[]>;

export interface StatsActe2 {
  /** Étapes franchies, tous dossiers confondus. */
  franchies: number;
  /** Étapes franchies par des dossiers en boucle. */
  franchiesBoucle: number;
  /** Visas accordés par un tap. */
  visasTampons: number;
  /** Usagers renvoyés chez eux parce que leur dossier est parti en boucle. */
  abandonsDemarche: number;
  taps: number;
}

export interface EtatActe2 {
  /** Horodatage de l'entrée dans l'acte (ms). */
  debut: number;
  guichets: number;
  agents: Record<Agent2Id, number>;
  procedures: Record<ProcId, Etape[]>;
  /** Dossiers d'usagers en cours. */
  usagers: Stocks;
  /** Dossiers en boucle, sans usager. */
  boucles: Stocks;
  population: number;
  abandons: number;
  conformitePoints: number;
  /** Points de dématérialisation (BALANCE2.demaCible = 100 %). Ne baisse jamais. */
  demaPoints: number;
  tauxRejet: number;
  exemplaires: Exemplaires;
  notes: Partial<Record<Note2Id, NoteState>>;
  notesVues: Note2Id[];
  /** Horodatage du premier dossier en boucle (null : aucune boucle encore). */
  premiereBoucle: number | null;
  /** Première procédure modifiée dans l'Atelier, citée par la lettre de démission. */
  premiereModif: ProcId | null;
  acteTermine: boolean;
  finActeVue: boolean;
  /** Secondes simulées depuis l'entrée dans l'acte (absences comprises, plafonnées) : l'âge des services. */
  duree: number;
  /** Mémoire des services : les procédures d'avant la Réforme ont été restaurées. */
  memoireRestauree: boolean;
  stats: StatsActe2;
}

/** Modificateurs dérivés des notes de service effectives de l'acte II et du grade. */
export interface Modifiers2 {
  tapPower: number;
  dotationMult: number;
  primeRejet: number;
  rejetMax: number;
  recrutementVisible: boolean;
  agentsDisponibles: Agent2Id[];
  atelierVisible: boolean;
  /** Étapes que l'Atelier permet d'ajouter. */
  etapesDisponibles: EtapeType[];
  procsOuvertes: ProcId[];
  exemplairesVisible: boolean;
  dematVisible: boolean;
  reformeVisible: boolean;
  tableauVisible: boolean;
  /** Jurisprudence « Droit acquis » : la première étape de chaque procédure ne coûte aucune patience. */
  droitAcquis: boolean;
}

/** Une modification demandée dans l'Atelier. */
export type ActionAtelier =
  | { type: 'ajouter'; p: ProcId; etape: EtapeType; exige?: ProcId }
  | { type: 'retirer'; p: ProcId; k: number }
  | { type: 'deplacer'; p: ProcId; k: number; sens: -1 | 1 }
  | { type: 'exiger'; p: ProcId; k: number; exige: ProcId };

/** Évènements produits par un tick ou un tap de l'acte II, pour le retour visuel. */
export interface Events2 {
  franchies: number;
  visas: number;
  budget: number;
  rupture: boolean;
  aucunVisa: boolean;
}
