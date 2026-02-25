/**
 * Game State Migration Utilities
 * 
 * Handles version migration for GameState to maintain backward compatibility
 * with older save files when schema changes are introduced.
 */

import { GameState } from '@/types/game';
import { administrations } from '@/data/gameData';

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

    // V5 → V6 Migration: Refresh static agent/admin data (new costs, productions, maxOwned)
    // Preserves isUnlocked per admin and owned count per agent from the saved state.
    if (version === 5) {
      console.log('[Migration] v5→v6: Refreshing static agent/admin data');
      const savedAdmins = s.administrations as Array<Record<string, unknown>> | undefined;
      const freshAdmins = administrations.map(freshAdmin => {
        const savedAdmin = savedAdmins?.find((a) => a.id === freshAdmin.id) as Record<string, unknown> | undefined;
        const savedAgents = savedAdmin?.agents as Array<Record<string, unknown>> | undefined;
        return {
          ...freshAdmin,
          isUnlocked: (savedAdmin?.isUnlocked as boolean | undefined) ?? freshAdmin.isUnlocked,
          agents: freshAdmin.agents.map(freshAgent => {
            const savedAgent = savedAgents?.find((a) => a.id === freshAgent.id);
            return { ...freshAgent, owned: (savedAgent?.owned as number | undefined) ?? 0 };
          }),
        };
      });
      return { ...s, version: 6, administrations: freshAdmins } as unknown as GameState;
    }

    // V4 → V5 Migration: Add prestige system
    if (version === 4) {
      console.log('[Migration] v4→v5: Adding prestige system');
      return {
        ...s,
        version: 5,
        paperclips: 0,
        totalAdministrativeValue: 0,
        currentTier: 'local',
        prestigeUpgrades: [], // string[] of active upgrade IDs
        prestigeInProgress: false
      } as GameState;
    }

    // V3 → V4 Migration: Add storage cap system
    if (version === 3) {
      console.log('[Migration] v3→v4: Adding storage cap system, then migrating to v5');
      return migrateGameState({
        ...s,
        version: 4,
        currentStorageCap: s.currentStorageCap ?? 983 // Default initial cap
      }); // Chain migration to v5
    }

    // Already at current version or newer
    if (version >= 6) {
      return s as unknown as GameState;
    }
    
    // V2 → V3 Migration: Add journal system
    if (version === 2) {
      console.log('[Migration] v2→v3: Adding journal system');
      return migrateGameState({
        ...s,
        version: 3,
        journal: [] // Empty journal for existing V2 saves
      }); // Chain migration to v4
    }

    // V2 with missing new fields → V2 updated (legacy path)
    if (version === 2 && conformite && !Object.prototype.hasOwnProperty.call(conformite, 'isActivated')) {
      console.log('[Migration] v2→v2: Adding isActivated and accumulatedFormulaires, then migrating to v3');
      return migrateGameState({
        ...s,
        version: 3,
        conformite: {
          ...conformite,
          isActivated: false,
          accumulatedFormulaires: 0
        },
        journal: [] // Also add journal when fixing V2 conformité
      }); // Chain migration to v4
    }
    
    // V1 → V3 Migration: Add conformité, message systems, and journal
    if (version === 1) {
      console.log('[Migration] v1→v3: Adding conformité aléatoire, message system, and journal');
      
      // Extract current resource counts for initialization
      const resources = s.resources as Record<string, number> | undefined;
      const currentFormulaires = resources?.formulaires || 0;
      const currentTampons = resources?.tampons || 0;
      
      return migrateGameState({
        ...s,
        version: 3,
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
        },
        journal: [] // Empty journal for V1→V3 migration
      }); // Chain migration to v4
    }
    
    // Future migrations would go here
    // if (version === 4) { ... migrate v4→v5 ... }
    
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
    
    // Check conformité and message system fields (required in v2+)
    if ((s.version as number) >= 2) {
      if (!s.conformite || !s.messageSystem) {
        return false;
      }
    }
    
    // Check journal field (required in v3+)
    if ((s.version as number) >= 3) {
      const journal = s.journal as unknown[];
      
      // Journal must be an array (can be empty)
      if (!Array.isArray(journal)) {
        console.error('[Validation] journal field is not an array');
        return false;
      }
      
      // Validate each entry structure
      for (const entry of journal) {
        const e = entry as Record<string, unknown>;
        
        // Required fields
        if (!e.id || !e.type || !e.text || typeof e.timestamp !== 'number') {
          console.error('[Validation] Invalid journal entry (missing required fields)');
          return false;
        }
        
        // Type must be valid
        if (!['sic', 'non-conformity', 'narrative-hint'].includes(e.type as string)) {
          console.error('[Validation] Invalid journal entry type:', e.type);
          return false;
        }
        
        // Narrative hints require additional fields
        if (e.type === 'narrative-hint') {
          if (typeof e.isRevealed !== 'boolean' || !e.revealedText || !e.targetId) {
            console.error('[Validation] Narrative hint missing required fields');
            return false;
          }
        }
      }
    }
    
    // Check currentStorageCap field (required in v4+)
    if ((s.version as number) >= 4) {
      // currentStorageCap must be number or null
      if (s.currentStorageCap !== null && typeof s.currentStorageCap !== 'number') {
        console.error('[Validation] currentStorageCap must be number or null');
        return false;
      }
    }
    
    // Check prestige fields (required in v5+)
    if ((s.version as number) >= 5) {
      if (typeof s.paperclips !== 'number') {
        console.error('[Validation] paperclips must be a number');
        return false;
      }
      
      if (typeof s.totalAdministrativeValue !== 'number') {
        console.error('[Validation] totalAdministrativeValue must be a number');
        return false;
      }
      
      if (s.currentTier !== 'local' && s.currentTier !== 'national' && s.currentTier !== 'global') {
        console.error('[Validation] currentTier must be local/national/global');
        return false;
      }
      
      // prestigeUpgrades must be an array
      if (!Array.isArray(s.prestigeUpgrades)) {
        console.error('[Validation] prestigeUpgrades must be an array');
        return false;
      }
      
      if (typeof s.prestigeInProgress !== 'boolean') {
        console.error('[Validation] prestigeInProgress must be a boolean');
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}
