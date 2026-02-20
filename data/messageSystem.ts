/**
 * Message System - S.I.C. Messages and Narrative Triggers
 * 
 * Pure functions for message selection and trigger probability calculations.
 * No React dependencies.
 */

// Milestone thresholds for trigger checks
export const MILESTONE_DOSSIERS = 100;
export const MILESTONE_TAMPONS = 50;
export const MILESTONE_FORMULAIRES = 25;

// Probability constants
const BASE_PROBABILITY = 0.125; // 12.5% base chance
const BOOSTED_PROBABILITY = 0.20; // 20% if 30+ minutes
const COOLDOWN_THRESHOLD_SECONDS = 120; // 2 minutes hard cooldown (no messages)
const BOOST_THRESHOLD_SECONDS = 1800; // 30 minutes

// Non-conformity constants
const NON_CONFORMITY_PROBABILITY = 0.002; // 0.2% (1 in 500)
const NON_CONFORMITY_RATE_LIMIT_MS = 600000; // 10 minutes

/**
 * S.I.C. (Service Inconnu de Coordination) message pool
 * Authentic French bureaucratic language with mysterious tone
 */
export const SIC_MESSAGES = [
  "Ce dossier a été transféré au S.I.C. pour traitement ultérieur.",
  "Le S.I.C. a validé cette procédure conformément au protocole.",
  "Notification S.I.C. : Vérification de conformité en cours.",
  "Le Service Inconnu de Coordination requiert une inspection supplémentaire.",
  "S.I.C. - Classification du document : Niveau de routine.",
  "Autorisation S.I.C. obtenue. Procédure standard applicable."
];

/**
 * Get a random S.I.C. message from the pool
 * 
 * @returns Random bureaucratic message in French
 * 
 * @example
 * getRandomSICMessage() // → "Ce dossier a été transféré au S.I.C. pour traitement ultérieur."
 */
export function getRandomSICMessage(): string {
  const randomIndex = Math.floor(Math.random() * SIC_MESSAGES.length);
  return SIC_MESSAGES[randomIndex];
}

/**
 * Calculate S.I.C. message trigger probability based on cooldown
 * - Blocked: 0% if within 2 minutes (hard cooldown)
 * - Base: 12.5% between 2–30 minutes
 * - Boosted: 20% if 30+ minutes without message
 *
 * @param sicLastTriggerTime - Timestamp of last S.I.C. message (null if never)
 * @returns Probability value (0-1)
 *
 * @example
 * calculateSICProbability(null) // → 0.125 (base)
 * calculateSICProbability(Date.now() - 60000) // → 0 (hard cooldown, 1 min ago)
 * calculateSICProbability(Date.now() - 2000000) // → 0.20 (boosted, 33+ min ago)
 */
export function calculateSICProbability(sicLastTriggerTime: number | null): number {
  if (sicLastTriggerTime === null) {
    return BASE_PROBABILITY; // First message
  }
  
  const now = Date.now();
  const timeSinceLastSeconds = (now - sicLastTriggerTime) / 1000;
  
  if (timeSinceLastSeconds < COOLDOWN_THRESHOLD_SECONDS) {
    // Less than 2 minutes ago: hard block
    return 0;
  } else if (timeSinceLastSeconds > BOOST_THRESHOLD_SECONDS) {
    // More than 30 minutes: increase to 20%
    return BOOSTED_PROBABILITY;
  } else {
    // Between 2–30 minutes: base 12.5%
    return BASE_PROBABILITY;
  }
}

/**
 * Check if non-conformity notification should trigger
 * - Probability: 0.2% (1 in 500)
 * - Rate limit: Max 1 per 10 minutes
 * 
 * @param nonConformityLastTime - Timestamp of last non-conformity notification (null if never)
 * @returns True if should trigger
 * 
 * @example
 * shouldTriggerNonConformity(null) // → true/false (0.2% chance)
 * shouldTriggerNonConformity(Date.now() - 60000) // → false (rate limited, only 1 min ago)
 * shouldTriggerNonConformity(Date.now() - 700000) // → true/false (rate limit passed, 0.2% chance)
 */
export function shouldTriggerNonConformity(nonConformityLastTime: number | null): boolean {
  const now = Date.now();
  
  // Rate limit: Max 1 per 10 minutes
  if (nonConformityLastTime !== null && (now - nonConformityLastTime) < NON_CONFORMITY_RATE_LIMIT_MS) {
    return false;
  }
  
  // 0.2% probability (1 in 500)
  return Math.random() < NON_CONFORMITY_PROBABILITY;
}

/**
 * Check if a production milestone has been crossed
 * Used to detect when to attempt message triggers
 * 
 * @param currentValue - Current resource value
 * @param lastMilestone - Last milestone value
 * @param threshold - Milestone threshold
 * @returns True if milestone crossed
 * 
 * @example
 * hasCrossedMilestone(250, 150, 100) // → true (crossed 200 threshold)
 * hasCrossedMilestone(180, 150, 100) // → false (same milestone bucket)
 * hasCrossedMilestone(99, 50, 100) // → false (not yet crossed 100)
 */
export function hasCrossedMilestone(
  currentValue: number,
  lastMilestone: number,
  threshold: number
): boolean {
  return Math.floor(currentValue / threshold) > Math.floor(lastMilestone / threshold);
}
