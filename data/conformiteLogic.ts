/**
 * Conformité Aléatoire System - Business Logic
 * 
 * Pure functions for conformité calculations and validation.
 * No React dependencies - all functions take primitives and return primitives.
 */

// Constants
export const UNLOCK_TAMPONS = 1000;
export const UNLOCK_FORMULAIRES = 100;
export const TEST_COST = 150;
export const TEST_GAIN = 3;
export const PERCENTAGE_INCREMENT_THRESHOLD = 150; // +1% per 150 formulaires
export const MAX_PERCENTAGE = 100;
export const TEST_DEBOUNCE_MS = 500;

/**
 * Calculate conformité percentage from lifetime formulaires
 * +1% per 150 formulaires produced
 * 
 * @param lifetimeFormulaires - Total formulaires produced across all time
 * @returns Conformité percentage (0-100, capped)
 * 
 * @example
 * calculateConformitePercentage(0) // → 0
 * calculateConformitePercentage(150) // → 1
 * calculateConformitePercentage(450) // → 3
 * calculateConformitePercentage(15000) // → 100
 * calculateConformitePercentage(20000) // → 100 (capped)
 */
export function calculateConformitePercentage(lifetimeFormulaires: number): number {
  // +1% per 150 formulaires produced
  const percentage = Math.floor(lifetimeFormulaires / PERCENTAGE_INCREMENT_THRESHOLD);
  
  // Cap at 100%
  return Math.min(percentage, MAX_PERCENTAGE);
}

/**
 * Check if conformité system should be unlocked
 * Requires 1000 tampons + 100 formulaires + last administration unlocked
 * 
 * @param highestEverTampons - Highest tampons count ever achieved
 * @param highestEverFormulaires - Highest formulaires count ever achieved
 * @param isLastAdminUnlocked - Whether the last administration is unlocked
 * @returns True if thresholds met
 * 
 * @example
 * shouldUnlockConformite(1000, 100, true) // → true
 * shouldUnlockConformite(1000, 100, false) // → false (last admin not unlocked)
 * shouldUnlockConformite(1000, 99, true) // → false
 * shouldUnlockConformite(999, 100, true) // → false
 */
export function shouldUnlockConformite(
  highestEverTampons: number,
  highestEverFormulaires: number,
  isLastAdminUnlocked: boolean
): boolean {
  return (
    highestEverTampons >= UNLOCK_TAMPONS &&
    highestEverFormulaires >= UNLOCK_FORMULAIRES &&
    isLastAdminUnlocked
  );
}

/**
 * Validate if conformité test can be performed
 * Checks resource availability and debounce
 * 
 * @param currentFormulaires - Current formulaires count
 * @param lastTestTimestamp - Timestamp of last test (null if never tested)
 * @param isUnlocked - Whether conformité system is unlocked
 * @returns True if test can be performed
 * 
 * @example
 * canPerformTest(150, null, true) // → true
 * canPerformTest(149, null, true) // → false (insufficient resources)
 * canPerformTest(200, Date.now() - 100, true) // → false (debounce)
 * canPerformTest(200, null, false) // → false (not unlocked)
 */
export function canPerformTest(
  currentFormulaires: number,
  lastTestTimestamp: number | null,
  isUnlocked: boolean
): boolean {
  // Must be unlocked
  if (!isUnlocked) {
    return false;
  }
  
  // Must have enough formulaires
  if (currentFormulaires < TEST_COST) {
    return false;
  }
  
  // Debounce: 500ms since last test
  if (lastTestTimestamp !== null) {
    const timeSinceLast = Date.now() - lastTestTimestamp;
    if (timeSinceLast < TEST_DEBOUNCE_MS) {
      return false;
    }
  }
  
  return true;
}

// NEW: Activation system constants
export const ACTIVATION_COST_TAMPONS = 40000;
export const ACTIVATION_COST_FORMULAIRES = 10000;

/**
 * Check if conformité system can be activated
 * Requires 40k tampons + 10k formulaires
 * 
 * @param currentTampons - Current tampons count
 * @param currentFormulaires - Current formulaires count
 * @returns True if activation requirements met
 * 
 * @example
 * canActivateConformite(40000, 10000) // → true
 * canActivateConformite(39999, 10000) // → false
 * canActivateConformite(40000, 9999) // → false
 */
export function canActivateConformite(
  currentTampons: number,
  currentFormulaires: number
): boolean {
  return (
    currentTampons >= ACTIVATION_COST_TAMPONS &&
    currentFormulaires >= ACTIVATION_COST_FORMULAIRES
  );
}

/**
 * Get the number of formulaires required for the next percentage bracket
 * Uses exponential formula: 1000 × (1.1)^bracket
 * 
 * @param currentPercent - Current conformité percentage (0-100)
 * @returns Number of formulaires needed for the next 1%
 * 
 * @example
 * getFormulairesRequiredForNextPercent(0) // → 1000 (bracket 0: 0-9%)
 * getFormulairesRequiredForNextPercent(9) // → 1000 (bracket 0: 0-9%)
 * getFormulairesRequiredForNextPercent(10) // → 1100 (bracket 1: 10-19%)
 * getFormulairesRequiredForNextPercent(50) // → 1611 (bracket 5: 50-59%)
 * getFormulairesRequiredForNextPercent(90) // → 2358 (bracket 9: 90-99%)
 */
export function getFormulairesRequiredForNextPercent(currentPercent: number): number {
  const bracket = Math.floor(currentPercent / 10);
  return Math.round(1000 * Math.pow(1.1, bracket));
}

/**
 * Calculate new conformité percentage using exponential progression
 * 1000 × (1.1)^bracket formulaires per 1%
 * 
 * @param startingPercent - Starting percentage (usually 0 after activation)
 * @param formulairesProduced - Total formulaires produced since activation
 * @returns New conformité percentage (0-100, capped)
 * 
 * @example
 * calculateConformitePercentageNew(0, 0) // → 0
 * calculateConformitePercentageNew(0, 1000) // → 1 (first %)
 * calculateConformitePercentageNew(0, 10000) // → 10 (reaches bracket 1)
 * calculateConformitePercentageNew(0, 159390) // → 100 (full completion)
 */
export function calculateConformitePercentageNew(
  startingPercent: number,
  formulairesProduced: number
): number {
  let currentPercent = startingPercent;
  let remainingFormulaires = formulairesProduced;
  
  // Calculate percentage by consuming formulaires bracket by bracket
  while (currentPercent < MAX_PERCENTAGE && remainingFormulaires > 0) {
    const costForNext = getFormulairesRequiredForNextPercent(currentPercent);
    
    if (remainingFormulaires >= costForNext) {
      remainingFormulaires -= costForNext;
      currentPercent++;
    } else {
      // Not enough for next percentage point
      break;
    }
  }
  
  return Math.min(currentPercent, MAX_PERCENTAGE);
}
