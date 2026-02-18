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
export function migrateGameState(loaded: unknown): GameState {
  // Cast once — this function exists specifically to handle untyped deserialized JSON
  const s = loaded as Record<string, unknown>;
  try {
    // Detect version (assume v1 if no version field)
    const version = (s.version as number | undefined) || 1;
    const conformite = s.conformite as Record<string, unknown> | undefined;

    // V2 with missing new fields → V2 updated
    if (version === 2 && conformite && !Object.prototype.hasOwnProperty.call(conformite, 'isActivated')) {
      console.log('[Migration] v2→v2: Adding isActivated and accumulatedFormulaires');
      return {
        ...s,
        conformite: {
          ...conformite,
          isActivated: false,
          accumulatedFormulaires: 0
        }
      } as GameState;
    }
    
    // Already at current version
    if (version >= 2) {
      return s as unknown as GameState;
    }
    
    // V1 → V2 Migration: Add conformité and message systems
    if (version === 1) {
      console.log('[Migration] v1→v2: Adding conformité aléatoire system');
      
      // Extract current resource counts for initialization
      const resources = s.resources as Record<string, number> | undefined;
      const currentFormulaires = resources?.formulaires || 0;
      const currentTampons = resources?.tampons || 0;
      
      return {
        ...s,
        version: 2,
        conformite: {
          percentage: 0,
          isUnlocked: false,
          isActivated: false,
          accumulatedFormulaires: 0,
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
    return s as unknown as GameState;
    
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
export function isValidGameState(state: unknown): boolean {
  try {
    const s = state as Record<string, unknown>;
    const resources = s.resources as Record<string, unknown> | undefined;

    // Check required top-level fields
    if (!s.version || !s.resources || !s.production || !s.administrations) {
      return false;
    }
    
    // Check required resource fields
    if (typeof resources?.dossiers !== 'number' ||
        typeof resources?.tampons !== 'number' ||
        typeof resources?.formulaires !== 'number') {
      return false;
    }
    
    // Check conformité fields (optional in v1, required in v2+)
    if ((s.version as number) >= 2) {
      if (!s.conformite || !s.messageSystem) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}
