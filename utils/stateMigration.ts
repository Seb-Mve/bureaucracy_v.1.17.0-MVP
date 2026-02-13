/**
 * Game State Migration Utilities
 * 
 * Handles version migration for GameState to maintain backward compatibility
 * with older save files when schema changes are introduced.
 */

import { GameState } from '@/types/game';

/**
 * Migrate game state from any version to current version
 * Handles graceful fallback for corrupted or invalid saves
 * 
 * @param loaded - Raw loaded state (any version or corrupted)
 * @returns Migrated GameState at current version
 * 
 * @example
 * // V1 save (no version field)
 * migrateGameState({ resources: {...}, ... }) // → V2 state with conformité
 * 
 * // Already current version
 * migrateGameState({ version: 2, ... }) // → Returns as-is
 * 
 * // Corrupted save
 * migrateGameState(null) // → Throws error, caller should fallback to initialGameState
 */
export function migrateGameState(loaded: any): GameState {
  try {
    // Detect version (assume v1 if no version field)
    const version = loaded.version || 1;
    
    // Already at current version
    if (version >= 2) {
      return loaded as GameState;
    }
    
    // V1 → V2 Migration: Add conformité and message systems
    if (version === 1) {
      console.log('[Migration] v1→v2: Adding conformité aléatoire system');
      
      // Extract current resource counts for initialization
      const currentFormulaires = loaded.resources?.formulaires || 0;
      const currentTampons = loaded.resources?.tampons || 0;
      
      return {
        ...loaded,
        version: 2,
        conformite: {
          percentage: 0,
          isUnlocked: false,
          // Initialize lifetime with current count (assume all existing formulaires count toward progression)
          lifetimeFormulaires: currentFormulaires,
          lastTestTimestamp: null,
          // Initialize highest-ever with current counts
          highestEverTampons: currentTampons,
          highestEverFormulaires: currentFormulaires
        },
        messageSystem: {
          sicLastTriggerTime: null,
          nonConformityLastTriggerTime: null,
          lastProductionMilestone: {
            dossiers: 0,
            tampons: 0,
            formulaires: 0
          }
        }
      };
    }
    
    // Future migrations would go here
    // if (version === 2) { ... migrate v2→v3 ... }
    
    // Unknown version - return as-is and hope for the best
    console.warn(`[Migration] Unknown version ${version}, attempting to load as-is`);
    return loaded as GameState;
    
  } catch (error) {
    console.error('[Migration] Failed to migrate game state:', error);
    throw error; // Caller should catch and fallback to initialGameState
  }
}

/**
 * Validate that a migrated state has all required fields
 * Used for additional safety checks after migration
 * 
 * @param state - State to validate
 * @returns True if valid, false otherwise
 */
export function isValidGameState(state: any): boolean {
  try {
    // Check required top-level fields
    if (!state.version || !state.resources || !state.production || !state.administrations) {
      return false;
    }
    
    // Check required resource fields
    if (typeof state.resources.dossiers !== 'number' ||
        typeof state.resources.tampons !== 'number' ||
        typeof state.resources.formulaires !== 'number') {
      return false;
    }
    
    // Check conformité fields (optional in v1, required in v2+)
    if (state.version >= 2) {
      if (!state.conformite || !state.messageSystem) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}
