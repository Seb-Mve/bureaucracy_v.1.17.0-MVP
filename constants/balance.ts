/**
 * Constantes d'équilibrage de l'acte I.
 * Toute valeur ici est vérifiée par scripts/simulate-acte1.ts.
 */
import type { AgentId } from '../types/game';

export const BALANCE = {
  /** Dossiers en retard au premier lancement. */
  fileInitiale: 30,
  populationInitiale: 100,
  /** Demandes par seconde et par usager inactif. */
  demandeRate: 1 / 60,
  /** Nouveaux habitants par seconde, en fraction de la place libre du périmètre. */
  installationRate: 1 / 120,
  /** Délai moyen avant le retour d'un usager rejeté (s). */
  delaiRetour: 20,
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
  confCible: 100000,
  /** Plafond de simulation hors-ligne (s). */
  horsLigneMax: 2 * 60 * 60,
  croissanceCoutAgent: 1.15,
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
    coutBase: 20,
  },
  {
    id: 'accueil',
    nom: "Agent d’accueil",
    description: 'Sourit par délégation.',
    vitesse: 0.5,
    coutBase: 150,
  },
  {
    id: 'instructeur',
    nom: 'Agent instructeur',
    description: 'Instruit. Surtout des refus.',
    vitesse: 2.5,
    coutBase: 1500,
  },
  {
    id: 'titulaire',
    nom: 'Titulaire',
    description: 'Inamovible, imperturbable, indispensable.',
    vitesse: 12,
    coutBase: 15000,
  },
];
