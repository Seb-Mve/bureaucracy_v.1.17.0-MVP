/**
 * Types de l'acte I — Le Guichet.
 * Voir specs/007-acte1-guichet/spec.md.
 */

export type AgentId = 'stagiaire' | 'accueil' | 'instructeur' | 'titulaire';

export type NoteId =
  | 'renfort'
  | 'rejet'
  | 'horaires'
  | 'ramettes'
  | 'dateur'
  | 'prime'
  | 'tilleuls'
  | 'numerotation'
  | 'piece'
  | 'instructeur'
  | 'doubleEncrage'
  | 'plafond'
  | 'retour48h'
  | 'commandeAuto'
  | 'commune'
  | 'audit'
  | 'formDemande'
  | 'titularisation'
  | 'titulaire'
  | 'canton'
  | 'guichetUnique'
  | 'reaffectation';

export type LettreId = string;

/** Nombre de points de patience d'un usager qui dépose une nouvelle demande. */
export const PATIENCE_MAX = 3;

/**
 * Compteurs indexés par points de patience restants (index 1..PATIENCE_MAX).
 * L'index 0 est toujours à 0.
 */
export type ParPatience = [number, number, number, number];

export interface NoteState {
  /** Horodatage de l'achat (ms). */
  achetee: number;
  /** Horodatage à partir duquel l'effet s'applique (fin d'instruction). */
  effective: number;
}

export interface Lettre {
  id: LettreId;
  objet: string;
  corps: string;
  recue: number;
  lue: boolean;
}

export interface GameStats {
  traites: number;
  rejetes: number;
  acceptes: number;
  taps: number;
  formulairesAchetes: number;
  budgetGagne: number;
  /** Temps de jeu cumulé, en secondes (hors absence). */
  tempsDeJeu: number;
}

export interface GameState {
  version: 1;
  cerfa: {
    signe: boolean;
    prenom: string;
    signeLe: number | null;
  };
  tampons: number;
  budget: number;
  formulaires: number;
  /** Dossiers en attente au guichet, par patience restante de l'usager. */
  file: ParPatience;
  /** Usagers rejetés qui vont revenir, par patience restante. */
  retours: ParPatience;
  /** Usagers du périmètre qui n'ont pas abandonné. */
  population: number;
  abandons: number;
  conformitePoints: number;
  /** Taux de rejet choisi par le joueur (0..1). */
  tauxRejet: number;
  agents: Record<AgentId, number>;
  notes: Partial<Record<NoteId, NoteState>>;
  /** Notes déjà affichées au joueur (pour la pastille « nouveau »). */
  notesVues: NoteId[];
  courrier: Lettre[];
  /** Déclencheurs de lettres déjà envoyées. */
  lettresEnvoyees: LettreId[];
  demission: {
    deposeeLe: number | null;
    relances: number;
  };
  acteTermine: boolean;
  /** L'écran de fin d'acte a été affiché. */
  finActeVue: boolean;
  /** La fiche de poste (explication du principe) a été lue. */
  fichePosteVue: boolean;
  /** Circulaires déjà affichées (une seule fois par mécanique). */
  circulairesVues: string[];
  stats: GameStats;
  /** Dernier horodatage de simulation (ms), pour le hors-ligne. */
  derniereMaj: number;
}

/** Modificateurs dérivés des notes de service effectives. */
export interface Modifiers {
  tapPower: number;
  demandeMult: number;
  dotationMult: number;
  primeRejet: number;
  pieces: number;
  rejetVisible: boolean;
  rejetMax: number;
  delaiRetourMult: number;
  agentSpeedMult: number;
  prixFormulaireMult: number;
  commandeAuto: boolean;
  confRejetMult: number;
  confPieceMult: number;
  agentsDisponibles: AgentId[];
  recrutementVisible: boolean;
  numerotation: boolean;
  conformiteVisible: boolean;
}

/** Évènements produits par une action ou un tick, pour le retour visuel. */
export interface GameEvents {
  traites: number;
  rejetes: number;
  budget: number;
  rupture: boolean;
  fileVide: boolean;
}
