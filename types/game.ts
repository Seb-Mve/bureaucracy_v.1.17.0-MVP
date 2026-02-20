// Resource types
export type ResourceType = 'dossiers' | 'tampons' | 'formulaires';

// Resource counter structure
export interface Resources {
  dossiers: number;
  tampons: number;
  formulaires: number;
}

// Production rates
export interface Production {
  dossiers: number;
  tampons: number;
  formulaires: number;
}

// Agent structure
export interface Agent {
  id: string;
  name: string;
  description: string;
  cost: Partial<Resources>;
  baseProduction: Partial<Production>;
  productionBonus?: {
    target: 'dossiers' | 'tampons' | 'formulaires' | 'all';
    value: number;
    isPercentage: boolean;
    isGlobal: boolean;
  };
  owned: number;
  incrementThreshold: number;
  incrementValue: number;
  incrementIsPercentage: boolean;
}

// Administration structure
export interface Administration {
  id: string;
  name: string;
  unlockCost: Partial<Resources>;
  agents: Agent[];
  isUnlocked: boolean;
  imagePath: string;
}

// Conformité state structure
export interface ConformiteState {
  /** Current conformité percentage (0-100, integer or float) */
  percentage: number;
  
  /** Whether the conformité system has been unlocked for display */
  isUnlocked: boolean;
  
  /** Whether the conformité system has been activated (one-time action) */
  isActivated: boolean;
  
  /** Formulaires accumulated since activation (for exponential progression) */
  accumulatedFormulaires: number;
  
  /** Total formulaires produced across lifetime (for passive progression tracking) */
  lifetimeFormulaires: number;
  
  /** Timestamp of last manual conformité test (for button debouncing) */
  lastTestTimestamp: number | null;
  
  /** Highest ever achieved tampons count (for unlock persistence) */
  highestEverTampons: number;
  
  /** Highest ever achieved formulaires count (for unlock persistence) */
  highestEverFormulaires: number;
}

// Message system state structure
export interface MessageSystemState {
  /** Timestamp of last S.I.C. message display (for cooldown calculation) */
  sicLastTriggerTime: number | null;
  
  /** Timestamp of last "Tampon non conforme" notification (for rate limiting) */
  nonConformityLastTriggerTime: number | null;
  
  /** Production milestone tracking (to detect threshold crossings) */
  lastProductionMilestone: {
    dossiers: number;
    tampons: number;
    formulaires: number;
  };
}

// Toast message structure
export interface ToastMessage {
  /** Unique identifier for this message instance */
  id: string;
  
  /** Message text to display (French bureaucratic language) */
  text: string;
  
  /** Message type for styling/categorization */
  type: 'sic' | 'non-conformity' | 'phase2' | 'system';
  
  /** Auto-dismiss duration in milliseconds (default: 4000) */
  duration: number;
  
  /** Timestamp when message was created */
  timestamp: number;
}

// Journal entry structure (for S.I.C. message system)
export interface JournalEntry {
  /** Unique identifier (timestamp-based: `${Date.now()}_${Math.random()}`) */
  id: string;
  
  /** Entry type for styling and categorization */
  type: 'sic' | 'non-conformity' | 'narrative-hint';
  
  /** Displayed message text (French bureaucratic language) */
  text: string;
  
  /** Creation timestamp (Date.now()) */
  timestamp: number;
  
  /** Whether narrative hint is revealed (only for type='narrative-hint') */
  isRevealed?: boolean;
  
  /** Full unredacted text (only for type='narrative-hint') */
  revealedText?: string;
  
  /** Target administration/system ID for narrative hints (e.g., 'ministere-affaires-obscures', 'conformite') */
  targetId?: string;
}

// Upgrade structure
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: Partial<Resources>;
  effect: string;
  type: 'agent' | 'production' | 'storage';
  isPurchased: boolean;
  administrationId?: number;
  
  // Storage-specific configuration (only for type='storage')
  storageConfig?: {
    newCap: number | null;       // null = unlimited (Upgrade 4)
    requiredUpgradeId?: string;  // Previous upgrade in sequence
    sequenceIndex: number;       // 0-3 for strict order
  };
}

// Prestige system types (V5 addition)
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

// Game state structure
export interface GameState {
  /** Schema version for migration support */
  version: number;
  
  resources: Resources;
  production: Production;
  administrations: Administration[];
  activeAdministrationId: string;
  lastTimestamp: number | null;
  
  /** Current storage cap for formulaires (null = unlimited) - V4 addition */
  currentStorageCap: number | null;
  
  /** Conformité system state */
  conformite?: ConformiteState;
  
  /** Message system state */
  messageSystem?: MessageSystemState;
  
  /** Journal entries (max 500, FIFO rotation) - V3 addition */
  journal: JournalEntry[];
  
  /** Prestige system (V5 addition) */
  paperclips: number;
  totalAdministrativeValue: number;
  currentTier: Tier;
  prestigeUpgrades: Record<string, boolean>; // upgradeId → isActive in current run
  prestigeInProgress: boolean; // Transaction safety flag
}