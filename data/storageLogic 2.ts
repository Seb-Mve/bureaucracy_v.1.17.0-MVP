/**
 * Storage Logic - Pure functions for formulaires storage cap management
 * 
 * This module implements the storage cap system for formulaires, including:
 * - Storage blocking detection (when stock reaches cap)
 * - Purchase validation (sequence + cost checks)
 * - Cap application (surplus handling)
 * - Visibility control (upgrades appear only when blocked)
 * 
 * All functions are pure (no side effects, no React dependencies).
 * Pattern: Mirrors conformiteLogic.ts approach.
 */

import { GameState, Upgrade } from '@/types/game';

/**
 * Storage cap thresholds (in order of sequence)
 */
export const STORAGE_CAPS = [983, 1983, 4583, 11025] as const;

/**
 * Storage upgrade IDs (in strict sequence order)
 */
export const STORAGE_UPGRADE_IDS = [
  'storage_upgrade_1',
  'storage_upgrade_2',
  'storage_upgrade_3',
  'storage_upgrade_4'
] as const;

/**
 * Gets the initial storage cap value.
 * @returns Initial cap (983 formulaires)
 */
export function getInitialStorageCap(): number {
  return STORAGE_CAPS[0];
}

/**
 * Determines if the formulaires stock has reached or exceeded the current cap.
 * 
 * @param state - Complete game state
 * @returns true if stock >= cap (and cap is not unlimited), false otherwise
 * 
 * @example
 * isStorageBlocked({ resources: { formulaires: 983 }, currentStorageCap: 983 })
 * // → true (exactly at cap)
 * 
 * @example
 * isStorageBlocked({ resources: { formulaires: 5000 }, currentStorageCap: null })
 * // → false (unlimited cap)
 */
export function isStorageBlocked(state: GameState): boolean {
  if (state.currentStorageCap === null) return false; // unlimited
  return state.resources.formulaires >= state.currentStorageCap;
}

/**
 * Applies the storage cap to a stock value (capping).
 * 
 * @param currentStock - Current formulaires stock
 * @param cap - Current storage cap (null = unlimited)
 * @returns Capped stock value (never exceeds cap)
 * 
 * @example
 * applyStorageCap(1000, 983) // → 983 (capped)
 * 
 * @example
 * applyStorageCap(500, 983) // → 500 (under cap)
 * 
 * @example
 * applyStorageCap(10000, null) // → 10000 (unlimited)
 */
export function applyStorageCap(
  currentStock: number,
  cap: number | null
): number {
  if (cap === null) return currentStock; // unlimited
  return Math.min(currentStock, cap);
}

/**
 * Finds a storage upgrade by ID from a list of upgrades.
 * Helper function used internally.
 * 
 * @param upgrades - List of all upgrades
 * @param upgradeId - Upgrade ID to find
 * @returns The upgrade if found and is type 'storage', undefined otherwise
 */
function findStorageUpgrade(
  upgrades: Upgrade[],
  upgradeId: string
): Upgrade | undefined {
  const upgrade = upgrades.find(u => u.id === upgradeId);
  if (!upgrade || upgrade.type !== 'storage') return undefined;
  return upgrade;
}

/**
 * Checks if a storage upgrade can be purchased.
 * Validates:
 * 1. Upgrade exists and is type 'storage'
 * 2. Required previous upgrade is purchased (sequence enforcement)
 * 3. Player has enough formulaires (cost validation)
 * 
 * @param state - Complete game state
 * @param upgrades - List of all upgrades
 * @param upgradeId - ID of the upgrade to check
 * @returns true if all conditions met, false otherwise
 * 
 * @example
 * // Upgrade 1, player has 983 formulaires, no prerequisite
 * canPurchaseStorageUpgrade(state, upgrades, 'storage_upgrade_1') // → true
 * 
 * @example
 * // Upgrade 2, player has 1983 formulaires, but Upgrade 1 not purchased
 * canPurchaseStorageUpgrade(state, upgrades, 'storage_upgrade_2') // → false
 */
export function canPurchaseStorageUpgrade(
  state: GameState,
  upgrades: Upgrade[],
  upgradeId: string
): boolean {
  const upgrade = findStorageUpgrade(upgrades, upgradeId);
  if (!upgrade) return false;
  
  // Check if already purchased
  if (upgrade.isPurchased) return false;
  
  // Check sequence (required previous upgrade must be purchased)
  if (upgrade.storageConfig?.requiredUpgradeId) {
    const required = findStorageUpgrade(
      upgrades,
      upgrade.storageConfig.requiredUpgradeId
    );
    if (!required?.isPurchased) return false;
  }
  
  // Check cost (player has enough formulaires)
  const cost = upgrade.cost.formulaires ?? 0;
  return state.resources.formulaires >= cost;
}

/**
 * Gets the storage cap after purchasing a specific upgrade.
 * 
 * @param upgrades - List of all upgrades
 * @param upgradeId - ID of the upgrade being purchased
 * @returns The new cap value (number or null for unlimited)
 * 
 * @example
 * getStorageCapAfterUpgrade(upgrades, 'storage_upgrade_1') // → 1983
 * 
 * @example
 * getStorageCapAfterUpgrade(upgrades, 'storage_upgrade_4') // → null (unlimited)
 */
export function getStorageCapAfterUpgrade(
  upgrades: Upgrade[],
  upgradeId: string
): number | null {
  const upgrade = findStorageUpgrade(upgrades, upgradeId);
  if (!upgrade || !upgrade.storageConfig) {
    return null; // fallback to unlimited if invalid
  }
  return upgrade.storageConfig.newCap;
}

/**
 * Gets visible storage upgrades based on blocking state.
 * Upgrades are only visible when storage is blocked.
 * 
 * @param state - Complete game state
 * @param upgrades - List of all upgrades
 * @returns Array of storage upgrades (empty if not blocked)
 * 
 * @example
 * // Stock = 983, cap = 983 → blocked
 * getVisibleStorageUpgrades(state, upgrades)
 * // → [storage_upgrade_1, storage_upgrade_2, storage_upgrade_3, storage_upgrade_4]
 * 
 * @example
 * // Stock = 500, cap = 983 → not blocked
 * getVisibleStorageUpgrades(state, upgrades) // → []
 */
export function getVisibleStorageUpgrades(
  state: GameState,
  upgrades: Upgrade[]
): Upgrade[] {
  // Only show storage upgrades when blocked
  if (!isStorageBlocked(state)) return [];
  
  // Return all storage upgrades (UI will handle purchase validation)
  return upgrades.filter(u => u.type === 'storage');
}

/**
 * Gets the cost of a storage upgrade.
 * 
 * @param upgrades - List of all upgrades
 * @param upgradeId - ID of the upgrade
 * @returns Cost in formulaires (0 if upgrade not found)
 * 
 * @example
 * getUpgradeCost(upgrades, 'storage_upgrade_1') // → 983
 */
export function getUpgradeCost(
  upgrades: Upgrade[],
  upgradeId: string
): number {
  const upgrade = findStorageUpgrade(upgrades, upgradeId);
  return upgrade?.cost.formulaires ?? 0;
}

/**
 * Gets the next unpurchased storage upgrade cap.
 * 
 * @param state - Complete game state
 * @param upgrades - List of all upgrades
 * @returns Next cap value (null if all purchased or next is unlimited)
 * 
 * @example
 * // No upgrades purchased → next = Upgrade 1 (1983)
 * getNextStorageCap(state, upgrades) // → 1983
 * 
 * @example
 * // All upgrades purchased
 * getNextStorageCap(state, upgrades) // → null
 */
export function getNextStorageCap(
  state: GameState,
  upgrades: Upgrade[]
): number | null {
  const storageUpgrades = upgrades
    .filter(u => u.type === 'storage')
    .sort((a, b) => 
      (a.storageConfig?.sequenceIndex ?? 0) - (b.storageConfig?.sequenceIndex ?? 0)
    );
  
  const nextUpgrade = storageUpgrades.find(u => !u.isPurchased);
  return nextUpgrade?.storageConfig?.newCap ?? null;
}
