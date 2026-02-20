/**
 * Prestige System - Pure Business Logic
 * 
 * All prestige calculations as pure functions (no React dependencies, no side effects).
 * Implements the trans-phasic formula for Paperclip generation and all prestige upgrade effects.
 * 
 * @module data/prestigeLogic
 */

import { 
  GameState, 
  PrestigeUpgrade, 
  PrestigePotential, 
  Tier, 
  Production 
} from '@/types/game';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Tier phase coefficients (used in sqrt formula)
 * 
 * Higher coefficients = harder to generate Paperclips
 * - local: 1000 (easy mode, default for all players)
 * - national: 5000 (medium difficulty)
 * - global: 25000 (hard difficulty)
 */
export const TIER_COEFFICIENTS: Record<Tier, number> = {
  local: 1000,
  national: 5000,
  global: 25000
};

/**
 * Maximum age (ms) for transaction recovery before rollback
 */
export const TRANSACTION_MAX_AGE_MS = 30_000; // 30 seconds

/**
 * AsyncStorage key for prestige transaction log
 */
export const PRESTIGE_TRANSACTION_KEY = 'prestige_transaction';

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Get the phase coefficient for a given tier
 * 
 * @param tier - Player tier ('local', 'national', or 'global')
 * @returns Coefficient value (1000, 5000, or 25000)
 * 
 * @example
 * getTierCoefficient('local')    // Returns: 1000
 * getTierCoefficient('national') // Returns: 5000
 * getTierCoefficient('global')   // Returns: 25000
 */
export function getTierCoefficient(tier: Tier): number {
  return TIER_COEFFICIENTS[tier];
}

/**
 * Calculate the minimum VAT required to gain at least 1 paperclip
 * 
 * Formula: For gain = 1, we need sqrt(VAT / coefficient) >= 1
 *          Therefore VAT >= coefficient
 * 
 * @param tier - Current player tier
 * @returns Minimum VAT threshold
 * 
 * @example
 * getMinVATForPrestige('local')
 * // Returns: 1000 (sqrt(1000 / 1000) = 1)
 * 
 * @example
 * getMinVATForPrestige('national')
 * // Returns: 5000 (sqrt(5000 / 5000) = 1)
 */
export function getMinVATForPrestige(tier: Tier): number {
  return getTierCoefficient(tier);
}

/**
 * Calculate how many paperclips would be gained from a prestige
 * 
 * Uses the trans-phasic formula: floor(sqrt(VAT / coefficient))
 * 
 * @param totalAdministrativeValue - Cumulative VAT since last prestige
 * @param tier - Current player tier
 * @returns Number of paperclips (floor of sqrt formula)
 * 
 * @example
 * calculatePrestigePaperclips(250000, 'local')
 * // Returns: 15 (floor(sqrt(250000 / 1000)) = floor(15.81))
 * 
 * @example
 * calculatePrestigePaperclips(500000, 'national')
 * // Returns: 10 (floor(sqrt(500000 / 5000)) = floor(10))
 * 
 * @example
 * calculatePrestigePaperclips(500, 'local')
 * // Returns: 0 (floor(sqrt(500 / 1000)) = floor(0.707))
 */
export function calculatePrestigePaperclips(
  totalAdministrativeValue: number,
  tier: Tier
): number {
  const coefficient = getTierCoefficient(tier);
  return Math.floor(Math.sqrt(totalAdministrativeValue / coefficient));
}

/**
 * Get complete prestige potential data
 * 
 * @param state - Current game state
 * @returns Prestige potential object with all relevant data
 * 
 * @example
 * getPrestigePotential(gameState)
 * // Returns: {
 * //   paperclipsGain: 15,
 * //   currentVAT: 250000,
 * //   tierCoefficient: 1000,
 * //   minVATRequired: 1000,
 * //   canPrestige: true
 * // }
 */
export function getPrestigePotential(state: GameState): PrestigePotential {
  const tier = state.currentTier;
  const vat = state.totalAdministrativeValue;
  const coefficient = getTierCoefficient(tier);
  const gain = calculatePrestigePaperclips(vat, tier);
  const minVAT = getMinVATForPrestige(tier);

  return {
    paperclipsGain: gain,
    currentVAT: vat,
    tierCoefficient: coefficient,
    minVATRequired: minVAT,
    canPrestige: gain >= 1
  };
}

// ============================================================================
// UPGRADE VALIDATION
// ============================================================================

/**
 * Check if a prestige upgrade can be purchased
 * 
 * @param state - Current game state
 * @param upgrades - Array of all prestige upgrades
 * @param upgradeId - ID of the upgrade to check
 * @returns true if upgrade can be purchased, false otherwise
 * 
 * Validates:
 * 1. Upgrade exists in catalog
 * 2. Player has enough paperclips
 * 3. Upgrade is not already active in current run
 * 
 * @example
 * canPurchasePrestigeUpgrade(gameState, prestigeUpgrades, 'prestige_01')
 * // Returns: true if player has >= 10 paperclips and upgrade not active
 */
export function canPurchasePrestigeUpgrade(
  state: GameState,
  upgrades: PrestigeUpgrade[],
  upgradeId: string
): boolean {
  const upgrade = upgrades.find(u => u.id === upgradeId);
  if (!upgrade) return false;
  
  if (state.paperclips < upgrade.cost) return false;
  
  if (state.prestigeUpgrades[upgradeId] === true) return false;
  
  return true;
}

// ============================================================================
// UPGRADE EFFECTS
// ============================================================================

/**
 * Get click multiplier for TAMPONNER button
 * 
 * Checks if prestige_01 (Tampon Double Flux) is active.
 * 
 * @param activeUpgrades - Array of currently active upgrade IDs
 * @param allUpgrades - Array of all prestige upgrades
 * @returns Click multiplier (1 if no upgrades, 2 if prestige_01 active)
 * 
 * @example
 * getClickMultiplier(['prestige_01'], prestigeUpgrades)
 * // Returns: 2 (Tampon Double Flux active)
 * 
 * @example
 * getClickMultiplier([], prestigeUpgrades)
 * // Returns: 1 (no click upgrades active)
 */
export function getClickMultiplier(
  activeUpgrades: string[],
  allUpgrades: PrestigeUpgrade[]
): number {
  const clickUpgrade = allUpgrades.find(
    u => u.effectType === 'click_multiplier' && activeUpgrades.includes(u.id)
  );
  
  return clickUpgrade ? clickUpgrade.effectValue : 1;
}

/**
 * Apply prestige multipliers to production rates
 * 
 * Applies multiplicative bonuses from active prestige upgrades.
 * Order: specific resource bonuses → global bonuses
 * Multiple bonuses of same type are MULTIPLICATIVE (not additive).
 * 
 * @param baseProduction - Base production rates
 * @param activeUpgrades - Array of currently active upgrade IDs
 * @param allUpgrades - Array of all prestige upgrades (for lookup)
 * @returns Modified production rates with multipliers applied
 * 
 * @example
 * applyPrestigeMultipliers(
 *   { dossiers: 100, tampons: 50, formulaires: 20 },
 *   ['prestige_02', 'prestige_05'],
 *   prestigeUpgrades
 * )
 * // Returns: { dossiers: 121, tampons: 55, formulaires: 22 }
 * // Calculation:
 * // - prestige_02: +10% dossiers → 100 * 1.10 = 110
 * // - prestige_05: +10% all → 110 * 1.10 = 121 dossiers
 * //                          → 50 * 1.10 = 55 tampons
 * //                          → 20 * 1.10 = 22 formulaires
 */
export function applyPrestigeMultipliers(
  baseProduction: Production,
  activeUpgrades: string[],
  allUpgrades: PrestigeUpgrade[]
): Production {
  const result = { ...baseProduction };
  
  // Get all active production multiplier upgrades
  const productionUpgrades = allUpgrades.filter(
    u => u.effectType === 'production_multiplier' && activeUpgrades.includes(u.id)
  );
  
  // Apply each upgrade multiplicatively
  for (const upgrade of productionUpgrades) {
    const multiplier = 1 + (upgrade.effectValue / 100); // Convert percentage to multiplier
    
    if (upgrade.effectTarget === 'all') {
      // Apply to all resources
      result.dossiers *= multiplier;
      result.tampons *= multiplier;
      result.formulaires *= multiplier;
    } else {
      // Apply to specific resource
      result[upgrade.effectTarget] *= multiplier;
    }
  }
  
  return result;
}

/**
 * Apply prestige storage capacity modifiers
 * 
 * Applies percentage-based storage bonus from prestige_04 (Extension des Classeurs).
 * 
 * @param baseCapacity - Base storage capacity
 * @param activeUpgrades - Array of currently active upgrade IDs
 * @param allUpgrades - Array of all prestige upgrades
 * @returns Modified storage capacity
 * 
 * @example
 * applyPrestigeStorageBonus(1000, ['prestige_04'], prestigeUpgrades)
 * // Returns: 1200 (1000 * 1.2 from Extension des Classeurs +20%)
 * 
 * @example
 * applyPrestigeStorageBonus(1000, [], prestigeUpgrades)
 * // Returns: 1000 (no storage upgrades active)
 */
export function applyPrestigeStorageBonus(
  baseCapacity: number,
  activeUpgrades: string[],
  allUpgrades: PrestigeUpgrade[]
): number {
  const storageUpgrades = allUpgrades.filter(
    u => u.effectType === 'storage_capacity' && activeUpgrades.includes(u.id)
  );
  
  let capacity = baseCapacity;
  
  for (const upgrade of storageUpgrades) {
    const multiplier = 1 + (upgrade.effectValue / 100);
    capacity *= multiplier;
  }
  
  return Math.floor(capacity);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a tier value
 * 
 * @param value - Value to validate
 * @returns true if valid tier, false otherwise
 */
export function isValidTier(value: unknown): value is Tier {
  return value === 'local' || value === 'national' || value === 'global';
}
