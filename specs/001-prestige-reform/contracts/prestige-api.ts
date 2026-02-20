/**
 * Prestige System API Contracts
 * 
 * This file defines TypeScript interfaces and type contracts for all prestige-related
 * operations in the BUREAUCRACY++ system. These contracts serve as the source of truth
 * for implementation in data/prestigeLogic.ts and context/GameStateContext.tsx.
 * 
 * @module contracts/prestige-api
 * @version 1.0.0
 */

import { GameState, Resources, Production } from '@/types/game';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Tier (Strate) - Niveau de progression global du joueur
 */
export type Tier = 'local' | 'national' | 'global';

/**
 * Effect type for prestige upgrades
 */
export type PrestigeEffectType = 
  | 'click_multiplier'      // Modifie le gain des clics manuels
  | 'production_multiplier' // Augmente la production passive
  | 'storage_capacity';     // Augmente la capacité de stockage

/**
 * Effect target for prestige upgrades
 */
export type PrestigeEffectTarget = 'dossiers' | 'tampons' | 'formulaires' | 'all';

/**
 * Prestige Upgrade definition (static data)
 */
export interface PrestigeUpgrade {
  /** Unique identifier (format: prestige_01, prestige_02, ...) */
  id: string;
  
  /** Display name (French bureaucratic language) */
  name: string;
  
  /** Description of the effect */
  description: string;
  
  /** Cost in Paperclips */
  cost: number;
  
  /** Type of effect applied */
  effectType: PrestigeEffectType;
  
  /** Resource(s) affected by the effect */
  effectTarget: PrestigeEffectTarget;
  
  /** Effect magnitude (percentage for multipliers, absolute for click) */
  effectValue: number;
  
  /** Whether the upgrade is currently active (state managed in GameState) */
  isActive: boolean;
}

/**
 * Prestige Transaction (for two-phase commit)
 */
export interface PrestigeTransaction {
  /** Transaction in progress flag */
  prestigeInProgress: boolean;
  
  /** Transaction start timestamp (Date.now()) */
  timestampStart: number | null;
  
  /** Expected paperclips gain */
  expectedGain: number | null;
  
  /** Pre-prestige snapshot for rollback */
  prePrestigeSnapshot: {
    paperclips: number;
    totalAdministrativeValue: number;
  } | null;
}

/**
 * Prestige Potential calculation result
 */
export interface PrestigePotential {
  /** Number of paperclips that would be gained */
  paperclipsGain: number;
  
  /** Current total administrative value */
  currentVAT: number;
  
  /** Current tier coefficient */
  tierCoefficient: number;
  
  /** Minimum VAT required to gain 1 paperclip */
  minVATRequired: number;
  
  /** Whether prestige is currently allowed (gain >= 1) */
  canPrestige: boolean;
}

// ============================================================================
// PURE CALCULATION FUNCTIONS (data/prestigeLogic.ts)
// ============================================================================

/**
 * Calculate how many paperclips would be gained from a prestige
 * 
 * @param totalAdministrativeValue - Cumulative VAT since last prestige
 * @param tier - Current player tier
 * @returns Number of paperclips (floor of sqrt formula)
 * 
 * @example
 * calculatePrestigePaperclips(250000, 'local')
 * // Returns: 15 (floor(sqrt(250000 / 1000)))
 * 
 * @example
 * calculatePrestigePaperclips(500000, 'national')
 * // Returns: 10 (floor(sqrt(500000 / 5000)))
 */
export declare function calculatePrestigePaperclips(
  totalAdministrativeValue: number,
  tier: Tier
): number;

/**
 * Get the phase coefficient for a given tier
 * 
 * @param tier - Player tier
 * @returns Coefficient value (1000, 5000, or 25000)
 * 
 * @example
 * getTierCoefficient('local') // Returns: 1000
 * getTierCoefficient('national') // Returns: 5000
 */
export declare function getTierCoefficient(tier: Tier): number;

/**
 * Calculate the minimum VAT required to gain at least 1 paperclip
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
export declare function getMinVATForPrestige(tier: Tier): number;

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
export declare function getPrestigePotential(state: GameState): PrestigePotential;

/**
 * Check if a prestige upgrade can be purchased
 * 
 * @param state - Current game state
 * @param upgrades - Array of all prestige upgrades
 * @param upgradeId - ID of the upgrade to check
 * @returns true if upgrade can be purchased, false otherwise
 * 
 * Validates:
 * 1. Upgrade exists
 * 2. Player has enough paperclips
 * 3. Upgrade is not already active in current run
 */
export declare function canPurchasePrestigeUpgrade(
  state: GameState,
  upgrades: PrestigeUpgrade[],
  upgradeId: string
): boolean;

/**
 * Apply prestige multipliers to production rates
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
 * // (Optimisation +10% dossiers, Synergie +10% global)
 */
export declare function applyPrestigeMultipliers(
  baseProduction: Production,
  activeUpgrades: string[],
  allUpgrades: PrestigeUpgrade[]
): Production;

/**
 * Apply prestige storage capacity modifiers
 * 
 * @param baseCapacity - Base storage capacity
 * @param activeUpgrades - Array of currently active upgrade IDs
 * @param allUpgrades - Array of all prestige upgrades
 * @returns Modified storage capacity
 * 
 * @example
 * applyPrestigeStorageBonus(1000, ['prestige_04'], prestigeUpgrades)
 * // Returns: 1200 (1000 * 1.2 from Extension des Classeurs +20%)
 */
export declare function applyPrestigeStorageBonus(
  baseCapacity: number,
  activeUpgrades: string[],
  allUpgrades: PrestigeUpgrade[]
): number;

/**
 * Get click multiplier for TAMPONNER button
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
export declare function getClickMultiplier(
  activeUpgrades: string[],
  allUpgrades: PrestigeUpgrade[]
): number;

// ============================================================================
// STATE MANAGEMENT FUNCTIONS (context/GameStateContext.tsx)
// ============================================================================

/**
 * Perform a prestige (Réforme Administrative)
 * 
 * This function orchestrates the complete prestige operation:
 * 1. Validate prestige is allowed (gain >= 1 paperclip)
 * 2. Write transaction log (two-phase commit)
 * 3. Reset resources and infrastructure
 * 4. Credit paperclips
 * 5. Commit to AsyncStorage
 * 6. Clear transaction log
 * 
 * @returns true if prestige succeeded, false otherwise
 * 
 * Side effects:
 * - Resets resources to 0
 * - Resets agent owned counts to 0
 * - Locks all administrations except 'administration-centrale'
 * - Disables all prestige upgrades
 * - Resets totalAdministrativeValue to 0
 * - Credits paperclips
 * - Preserves: paperclip total, currentTier, journal, conformité state
 */
export declare function performPrestige(): Promise<boolean>;

/**
 * Purchase a prestige upgrade
 * 
 * @param upgradeId - ID of the upgrade to purchase
 * @returns true if purchase succeeded, false otherwise
 * 
 * Validates:
 * - Player has enough paperclips
 * - Upgrade is not already active
 * 
 * Side effects:
 * - Deducts upgrade cost from paperclips
 * - Activates upgrade (sets isActive = true in GameState)
 * - Displays toast notification
 * - Immediately applies effect to production/resources
 */
export declare function buyPrestigeUpgrade(upgradeId: string): boolean;

/**
 * Get current prestige potential (reactive calculation)
 * 
 * @returns Prestige potential object
 * 
 * This function is called reactively to update the prestige gauge in real-time
 * as the player accumulates resources.
 */
export declare function getPrestigePotentialLive(): PrestigePotential;

/**
 * Check if a prestige upgrade is currently active
 * 
 * @param upgradeId - ID of the upgrade to check
 * @returns true if upgrade is active in current run, false otherwise
 */
export declare function hasPrestigeUpgrade(upgradeId: string): boolean;

/**
 * Get all active prestige upgrade IDs
 * 
 * @returns Array of active upgrade IDs
 * 
 * @example
 * getActivePrestigeUpgrades()
 * // Returns: ['prestige_01', 'prestige_02']
 */
export declare function getActivePrestigeUpgrades(): string[];

// ============================================================================
// RECOVERY FUNCTIONS (two-phase commit recovery)
// ============================================================================

/**
 * Recover from an incomplete prestige transaction
 * 
 * Called on app startup if prestigeInProgress flag is detected.
 * 
 * @param transaction - Transaction data from AsyncStorage
 * @returns true if recovery succeeded, false if rollback required
 * 
 * Logic:
 * - If transaction < 30s old → complete prestige (credit paperclips)
 * - If transaction > 30s old → rollback to snapshot
 * - If transaction corrupted → ignore and clear flag
 */
export declare function recoverPrestigeTransaction(
  transaction: PrestigeTransaction
): Promise<boolean>;

/**
 * Check for incomplete transactions on app startup
 * 
 * @returns Transaction object if found, null otherwise
 * 
 * Side effects:
 * - Reads from AsyncStorage key 'prestige_transaction'
 */
export declare function checkForIncompletePrestige(): Promise<PrestigeTransaction | null>;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Tier phase coefficients (used in sqrt formula)
 */
export const TIER_COEFFICIENTS: Record<Tier, number>;

/**
 * Maximum age (ms) for transaction recovery before rollback
 */
export const TRANSACTION_MAX_AGE_MS: number;

/**
 * AsyncStorage key for prestige transaction log
 */
export const PRESTIGE_TRANSACTION_KEY: string;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Validate a prestige transaction object
 * 
 * @param obj - Unknown object to validate
 * @returns true if valid transaction, false otherwise
 */
export declare function isValidPrestigeTransaction(obj: unknown): obj is PrestigeTransaction;

/**
 * Validate a tier value
 * 
 * @param value - Value to validate
 * @returns true if valid tier, false otherwise
 */
export declare function isValidTier(value: unknown): value is Tier;
