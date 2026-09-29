/**
 * Constantes d'équilibrage de l'acte I.
 * Toute valeur ici est vérifiée par scripts/simulate-acte1.ts.
 */
import type { AgentId } from '../types/game';

export const BALANCE = {
  /** Dossiers en retard au premier lancement. */
  fileInitiale: 30,
  populationInitiale: 100,
  /**
   * Demandes par seconde et par usager inactif. Assez élevé pour que la file
   * reste abondante : le frein est la capacité de traitement, pas la demande.
   */
  demandeRate: 1 / 8,
  /** Nouveaux habitants par seconde, en fraction de la place libre du périmètre. */
  installationRate: 1 / 30,
  /** Délai moyen avant le retour d'un usager rejeté (s). */
  delaiRetour: 20,
  /** Capacité des collègues / plafond de demande à partir duquel on alerte. */
  saturationEntree: 0.8,
  /** Seuil de fin d'alerte (hystérésis, pour éviter le clignotement). */
  saturationSortie: 0.7,
  /** Budget reçu par dossier traité (€). */
  dotation: 1,
  budgetInitial: 0,
  formulairesInitiaux: 60,
  /** Une ramette = N formulaires. */
  ramette: 100,
  prixRamette: 8,
  /** Points de Conformité par rejet. */
  confParRejet: 1,
  /** Points de Conformité par pièce supplémentaire exigée, par dossier. */
  confParPiece: 0.25,
  /** Points de Conformité correspondant à 100 %. */
  confCible: 500000,
  /** Plafond de simulation hors-ligne (s). */
  horsLigneMax: 2 * 60 * 60,
  croissanceCoutAgent: 1.15,
  /** Nombre d'exemplaires d'un même collègue qui double sa vitesse. */
  paliersAnciennete: [10, 25, 50],
} as const;

export interface AgentDef {
  id: AgentId;
  nom: string;
  description: string;
  /** Dossiers traités par seconde. */
  vitesse: number;
  coutBase: number;
}

export const AGENTS: AgentDef[] = [
  {
    id: 'stagiaire',
    nom: 'Stagiaire',
    description: "Motivé, non rémunéré, ne sait pas où est l’agrafeuse.",
    vitesse: 0.1,
    coutBase: 80,
  },
  {
    id: 'accueil',
    nom: "Agent d’accueil",
    description: 'Sourit par délégation.',
    vitesse: 0.5,
    coutBase: 340,
  },
  {
    id: 'instructeur',
    nom: 'Agent instructeur',
    description: 'Instruit. Surtout des refus.',
    vitesse: 2.5,
    coutBase: 1400,
  },
  {
    id: 'titulaire',
    nom: 'Titulaire',
    description: 'Inamovible, imperturbable, indispensable.',
    vitesse: 12,
    coutBase: 5600,
  },
];
