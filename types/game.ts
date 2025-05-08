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

// Game state structure
export interface GameState {
  resources: Resources;
  production: Production;
  administrations: Administration[];
  activeAdministrationId: string;
  lastTimestamp: number | null;
}