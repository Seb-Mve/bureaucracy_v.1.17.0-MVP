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
  horsLigneMax: 20 * 60,
  /** Nombre d'exemplaires d'un même collègue qui double sa vitesse. */
  paliersAnciennete: [10, 25, 50],
  /** Dotation supplémentaire par grade atteint (+10 % par grade). */
  bonusGrade: 0.1,
  /** Délai d'instruction retiré par tap (s), quelle que soit la puissance du tap. */
  relanceParTap: 1,
  /** Part maximale du délai d'instruction qu'on peut effacer par des relances. */
  relanceMax: 0.5,
} as const;

export interface GradeDef {
  nom: string;
  /** Tampons apposés nécessaires pour atteindre ce grade. */
  seuil: number;
}

/** Grades de l'agent, atteints au compteur de tampons. Le premier est le grade de départ. */
export const GRADES: GradeDef[] = [
  { nom: 'Stagiaire', seuil: 0 },
  { nom: 'Vacataire', seuil: 1000 },
  { nom: 'Contractuel', seuil: 10000 },
  { nom: 'Stagiaire de la fonction publique', seuil: 50000 },
  { nom: 'Titulaire', seuil: 150000 },
];

export interface AgentDef {
  id: AgentId;
  nom: string;
  description: string;
  /** Dossiers traités par seconde. */
  vitesse: number;
  coutBase: number;
  /**
   * Hausse du prix à chaque recrutement. Plus faible pour les petits rangs,
   * pour qu'un lot de stagiaires reste un achat valable tout l'acte.
   */
  croissance: number;
}

export const AGENTS: AgentDef[] = [
  {
    id: 'stagiaire',
    nom: 'Stagiaire',
    description: "Motivé, non rémunéré, ne sait pas où est l’agrafeuse.",
    vitesse: 0.1,
    coutBase: 100,
    croissance: 1.12,
  },
  {
    id: 'accueil',
    nom: "Agent d’accueil",
    description: 'Sourit par délégation.',
    vitesse: 0.5,
    coutBase: 450,
    croissance: 1.13,
  },
  {
    id: 'instructeur',
    nom: 'Agent instructeur',
    description: 'Instruit. Surtout des refus.',
    vitesse: 2.5,
    coutBase: 1900,
    croissance: 1.15,
  },
  {
    id: 'titulaire',
    nom: 'Titulaire',
    description: 'Inamovible, imperturbable, indispensable.',
    vitesse: 12,
    coutBase: 8000,
    croissance: 1.15,
  },
];
