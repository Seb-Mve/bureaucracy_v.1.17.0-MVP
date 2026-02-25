/**
 * Contracts: Rééquilibrage des administrations et de la conformité aléatoire
 *
 * Ce fichier documente les signatures de méthodes modifiées ou ajoutées
 * dans GameContextType (context/GameStateContext.tsx).
 * Il sert de référence contractuelle — non exécuté, non importé.
 */

import { Resources } from '@/types/game';

// ---------------------------------------------------------------------------
// MÉTHODES MODIFIÉES
// ---------------------------------------------------------------------------

/**
 * Vérifie si l'agent peut être acheté.
 *
 * AVANT: vérifie uniquement canAfford(agent.cost)
 * APRÈS: vérifie also maxOwned cap ET canAfford(getEscalatedAgentCost(agent))
 *
 * @returns false si:
 *   - Administration non trouvée ou non déverrouillée
 *   - Agent non trouvé
 *   - agent.owned >= agent.maxOwned (plafond atteint)
 *   - Ressources insuffisantes pour le coût escaladé
 */
declare function canPurchaseAgent(administrationId: string, agentId: string): boolean;

/**
 * Achète un agent en déduisant le coût escaladé (pas le coût de base).
 *
 * AVANT: déduit agent.cost (coût de base fixe)
 * APRÈS: déduit getEscalatedAgentCost(agent) + vérifie maxOwned avant achat
 *
 * @returns true si achat réussi, false si bloqué (cap ou ressources)
 */
declare function purchaseAgent(administrationId: string, agentId: string): boolean;

// ---------------------------------------------------------------------------
// NOUVELLES MÉTHODES
// ---------------------------------------------------------------------------

/**
 * Retourne le coût réel (escaladé) actuel d'un agent pour affichage UI.
 * Formule: ceil(coût_base × 1,09^floor(owned / 10))
 *
 * Utilisé par AgentItem pour afficher le coût correct dans le bouton d'achat.
 * Si l'agent n'est pas trouvé, retourne {} (objet vide).
 *
 * @param administrationId - ID de l'administration contenant l'agent
 * @param agentId - ID de l'agent
 * @returns Coût escaladé en Partial<Resources>
 *
 * @example
 * // Stagiaire (base: 50 dossiers), owned = 10
 * getAgentCurrentCost('administration-centrale', 'stagiaire-administratif')
 * // → { dossiers: 55 }  // ceil(50 × 1.09) = 55
 *
 * // Agent plafonné (owned >= maxOwned)
 * getAgentCurrentCost('administration-centrale', 'directeur-pole')
 * // → { formulaires: MAX_COST }  // coût calculé même si button disabled
 */
declare function getAgentCurrentCost(
  administrationId: string,
  agentId: string
): Partial<Resources>;

// ---------------------------------------------------------------------------
// MÉTHODES INCHANGÉES (rappel)
// ---------------------------------------------------------------------------

/**
 * Déverrouille une administration (inchangé).
 * La vérification se fait sur les ressources ACTUELLEMENT détenues (FR-002..005).
 * @returns true si succès, false si déjà déverrouillée ou ressources insuffisantes
 */
declare function unlockAdministration(administrationId: string): boolean;

/**
 * Active le système de conformité aléatoire (inchangé).
 * Déduit 40 000 tampons + 10 000 formulaires.
 * @returns true si succès, false si déjà activée ou ressources insuffisantes
 */
declare function activateConformite(): boolean;
