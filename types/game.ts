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

// Game state structure
export interface GameState {
  /** Schema version for migration support */
  version: number;
  
  resources: Resources;
  production: Production;
  administrations: Administration[];
  activeAdministrationId: string;
  lastTimestamp: number | null;
  
  /** Conformité system state */
  conformite?: ConformiteState;
  
  /** Message system state */
  messageSystem?: MessageSystemState;
}