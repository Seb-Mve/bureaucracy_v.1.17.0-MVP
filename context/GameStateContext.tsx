import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { GameState, ResourceType, Resources, Production, ToastMessage } from '@/types/game';
import { initialGameState } from '@/data/gameData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatNumberFrench } from '@/utils/formatters';
import { migrateGameState, isValidGameState } from '@/utils/stateMigration';
import { 
  calculateConformitePercentage, 
  shouldUnlockConformite, 
  canPerformTest,
  canActivateConformite as canActivateConformiteCheck,
  calculateConformitePercentageNew,
  getFormulairesRequiredForNextPercent,
  ACTIVATION_COST_TAMPONS,
  ACTIVATION_COST_FORMULAIRES,
  TEST_COST,
  TEST_GAIN,
  MAX_PERCENTAGE
} from '@/data/conformiteLogic';

interface GameContextType {
  gameState: GameState;
  incrementResource: (resource: ResourceType, amount: number) => void;
  purchaseAgent: (administrationId: string, agentId: string) => boolean;
  unlockAdministration: (administrationId: string) => boolean;
  setActiveAdministration: (administrationId: string) => void;
  formatNumber: (value: number) => string;
  canPurchaseAgent: (administrationId: string, agentId: string) => boolean;
  canUnlockAdministration: (administrationId: string) => boolean;
  
  // Conformité system methods
  shouldShowConformite: boolean;
  canActivateConformite: boolean;
  activateConformite: () => boolean;
  isConformiteUnlocked: () => boolean;
  isPhase2ButtonActive: () => boolean;
  performConformiteTest: () => boolean;
  
  // Toast system methods
  toastQueue: ToastMessage[];
  showToast: (message: string, type: ToastMessage['type'], duration?: number) => void;
  dismissToast: (toastId: string) => void;
  getActiveToasts: () => ToastMessage[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY = 'bureaucracy_game_state';
const UPDATE_INTERVAL = 100; // Plus fréquent pour une meilleure réactivité
const SAVE_INTERVAL = 5000; // Sauvegarde toutes les 5 secondes

export default function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(() => ({
    ...initialGameState,
  }));
  
  // Toast queue state (separate from GameState, not persisted)
  const [toastQueue, setToastQueue] = useState<ToastMessage[]>([]);
  
  const gameLoopRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const isMountedRef = useRef(false);
  const productionCacheRef = useRef<Production | null>(null);
  const pendingUpdatesRef = useRef<Partial<GameState>>({});

  // Memoized production calculation
  const calculateProduction = useCallback((state: GameState): Production => {
    const newProduction: Production = { dossiers: 0, tampons: 0, formulaires: 0 };
    const bonusMultipliers: { [key: string]: number } = {
      dossiers: 1,
      tampons: 1,
      formulaires: 1,
      all: 1
    };

    state.administrations.forEach(admin => {
      if (!admin.isUnlocked) return;

      admin.agents.forEach(agent => {
        if (agent.owned === 0) return;

        if (agent.baseProduction) {
          Object.entries(agent.baseProduction).forEach(([resource, amount]) => {
            newProduction[resource as keyof Production] += amount * agent.owned;
          });
        }

        if (agent.productionBonus) {
          const { target, value, isPercentage, isGlobal } = agent.productionBonus;
          
          if (isGlobal) {
            if (isPercentage) {
              bonusMultipliers[target] += (value / 100) * agent.owned;
            }
          } else if (target !== 'all') {
            if (isPercentage) {
              newProduction[target as keyof Production] *= (1 + (value / 100) * agent.owned);
            } else {
              newProduction[target as keyof Production] += value * agent.owned;
            }
          }
        }
      });
    });

    Object.keys(newProduction).forEach(resource => {
      newProduction[resource as keyof Production] *= bonusMultipliers[resource];
    });

    if (bonusMultipliers.all > 1) {
      Object.keys(newProduction).forEach(resource => {
        newProduction[resource as keyof Production] *= bonusMultipliers.all;
      });
    }

    return newProduction;
  }, []);

  const canAfford = useCallback((cost: Partial<Resources>): boolean => {
    return Object.entries(cost).every(([resource, amount]) => 
      gameState.resources[resource as keyof Resources] >= (amount || 0)
    );
  }, [gameState.resources]);

  // Fonction optimisée pour appliquer les mises à jour en batch
  const applyPendingUpdates = useCallback(() => {
    if (Object.keys(pendingUpdatesRef.current).length > 0) {
      setGameState(prev => ({
        ...prev,
        ...pendingUpdatesRef.current,
      }));
      pendingUpdatesRef.current = {};
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const loadGameState = async () => {
      try {
        const storedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedState && isMountedRef.current) {
          const parsedState = JSON.parse(storedState);
          
          // Migrate state from old versions to current version
          const migratedState = migrateGameState(parsedState);
          
          // Validate migrated state
          if (!isValidGameState(migratedState)) {
            console.error('[GameState] Migrated state is invalid, using initial state');
            setGameState({
              ...initialGameState,
              lastTimestamp: Date.now(),
            });
            return;
          }
          
          setGameState({
            ...migratedState,
            lastTimestamp: Date.now(),
          });
        } else if (isMountedRef.current) {
          setGameState(prevState => ({
            ...prevState,
            lastTimestamp: Date.now(),
          }));
        }
      } catch (error) {
        console.error('[GameState] Failed to load game state:', error);
        // Fallback to initial state on any error (corrupted save, migration failure, etc.)
        if (isMountedRef.current) {
          setGameState({
            ...initialGameState,
            lastTimestamp: Date.now(),
          });
        }
      }
    };

    loadGameState();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sauvegarde optimisée avec debounce
  const saveGameState = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }, [gameState]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (gameState.lastTimestamp !== null) {
      saveTimeoutRef.current = setTimeout(saveGameState, SAVE_INTERVAL);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [gameState, saveGameState]);

  // Boucle de jeu optimisée pour la production
  useEffect(() => {
    const updateGameState = () => {
      if (!isMountedRef.current) return;

      const currentTime = Date.now();
      const deltaTime = (currentTime - lastUpdateTimeRef.current) / 1000;
      lastUpdateTimeRef.current = currentTime;

      const currentProduction = productionCacheRef.current || calculateProduction(gameState);
      productionCacheRef.current = currentProduction;

      const newResources = { ...gameState.resources };
      const formulairesGained = currentProduction.formulaires * deltaTime;
      
      Object.keys(currentProduction).forEach(resource => {
        const resourceKey = resource as keyof Resources;
        newResources[resourceKey] += currentProduction[resourceKey as keyof Production] * deltaTime;
      });

      // Update conformité system
      let newConformite = gameState.conformite ? { ...gameState.conformite } : undefined;
      
      if (newConformite) {
        // Track lifetime formulaires for passive progression
        newConformite.lifetimeFormulaires += formulairesGained;
        
        // Update highest-ever counts for unlock tracking
        newConformite.highestEverTampons = Math.max(
          newConformite.highestEverTampons,
          newResources.tampons
        );
        newConformite.highestEverFormulaires = Math.max(
          newConformite.highestEverFormulaires,
          newResources.formulaires
        );
        
        // Check if conformité should unlock (old logic - kept for compatibility)
        if (!newConformite.isUnlocked) {
          const lastAdmin = gameState.administrations.find(a => a.id === 'agence-redondance');
          const isLastAdminUnlocked = lastAdmin?.isUnlocked ?? false;
          
          if (shouldUnlockConformite(
            newConformite.highestEverTampons,
            newConformite.highestEverFormulaires,
            isLastAdminUnlocked
          )) {
            newConformite.isUnlocked = true;
          }
        }
        
        // NEW: Calculate passive conformité progression (exponential formula)
        if (newConformite.isActivated) {
          newConformite.accumulatedFormulaires += formulairesGained;
          newConformite.percentage = calculateConformitePercentageNew(
            0,
            newConformite.accumulatedFormulaires
          );
        }
      }

      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        resources: newResources,
        production: currentProduction,
        lastTimestamp: currentTime,
        conformite: newConformite
      };

      applyPendingUpdates();
    };

    const interval = setInterval(updateGameState, UPDATE_INTERVAL);
    gameLoopRef.current = interval as unknown as number;

    return () => {
      if (gameLoopRef.current !== null) {
        clearInterval(gameLoopRef.current as unknown as NodeJS.Timeout);
      }
    };
  }, [gameState, calculateProduction, applyPendingUpdates]);

  useEffect(() => {
    productionCacheRef.current = null;
  }, [gameState.administrations]);

  /**
   * Add resources to the current totals (used by the stamp button and game loop).
   * Also tracks lifetime formulaires for conformité progression.
   */
  const incrementResource = useCallback((resource: ResourceType, amount: number) => {
    setGameState(prevState => ({
      ...prevState,
      resources: {
        ...prevState.resources,
        [resource]: prevState.resources[resource] + amount
      }
    }));
  }, []);

  /**
   * Purchase one unit of an agent, deducting its cost from current resources.
   * @returns true if purchase succeeded, false if insufficient resources or agent not found
   */
  const purchaseAgent = useCallback((administrationId: string, agentId: string): boolean => {
    const administration = gameState.administrations.find(a => a.id === administrationId);
    if (!administration || !administration.isUnlocked) return false;

    const agent = administration.agents.find(a => a.id === agentId);
    if (!agent) return false;

    if (!canAfford(agent.cost)) return false;

    setGameState(prevState => {
      const newResources = { ...prevState.resources };
      Object.entries(agent.cost).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount || 0;
      });
      
      const newAdministrations = prevState.administrations.map(admin => {
        if (admin.id !== administrationId) return admin;
        const updatedAgents = admin.agents.map(a => {
          if (a.id !== agentId) return a;
          return { ...a, owned: a.owned + 1 };
        });
        return { ...admin, agents: updatedAgents };
      });
      
      return {
        ...prevState,
        resources: newResources,
        administrations: newAdministrations
      };
    });
    
    return true;
  }, [gameState.administrations, canAfford]);

  /**
   * Unlock an administration, deducting its unlockCost and switching the active view to it.
   * @returns true if unlock succeeded, false if already unlocked or insufficient resources
   */
  const unlockAdministration = useCallback((administrationId: string): boolean => {
    const administration = gameState.administrations.find(a => a.id === administrationId);
    if (!administration || administration.isUnlocked) return false;

    if (!canAfford(administration.unlockCost)) return false;

    setGameState(prevState => {
      const newResources = { ...prevState.resources };
      Object.entries(administration.unlockCost).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount || 0;
      });
      
      const newAdministrations = prevState.administrations.map(admin => 
        admin.id === administrationId ? { ...admin, isUnlocked: true } : admin
      );
      
      return {
        ...prevState,
        resources: newResources,
        administrations: newAdministrations,
        activeAdministrationId: administrationId
      };
    });
    
    return true;
  }, [gameState.administrations, canAfford]);

  /** Switch the currently displayed administration tab. */
  const setActiveAdministration = useCallback((administrationId: string) => {
    setGameState(prevState => ({
      ...prevState,
      activeAdministrationId: administrationId
    }));
  }, []);

  const formatNumber = useCallback((value: number): string => {
    return formatNumberFrench(value);
  }, []);

  /** Returns true if the player currently has enough resources to buy the given agent. */
  const canPurchaseAgent = useCallback((administrationId: string, agentId: string): boolean => {
    const administration = gameState.administrations.find(a => a.id === administrationId);
    if (!administration || !administration.isUnlocked) return false;

    const agent = administration.agents.find(a => a.id === agentId);
    if (!agent) return false;

    return canAfford(agent.cost);
  }, [gameState.administrations, canAfford]);

  /** Returns true if the player currently has enough resources to unlock the given administration. */
  const canUnlockAdministration = useCallback((administrationId: string): boolean => {
    const administration = gameState.administrations.find(a => a.id === administrationId);
    if (!administration || administration.isUnlocked) return false;

    return canAfford(administration.unlockCost);
  }, [gameState.administrations, canAfford]);

  // Conformité system methods
  
  /**
   * Check if conformité system is unlocked
   * Memoized for performance
   */
  const isConformiteUnlocked = useMemo(() => {
    return () => {
      if (!gameState.conformite) return false;
      return gameState.conformite.isUnlocked;
    };
  }, [gameState.conformite]);

  /**
   * Check if the "Réaffectation différée" button (post-conformité prestige mechanic) should be active.
   * Distinct from the conformité system itself — this is the Phase 2 transition triggered at 100% conformité.
   * @returns true when conformité percentage reaches 100%
   */
  const isPhase2ButtonActive = useMemo(() => {
    return () => {
      if (!gameState.conformite) return false;
      return gameState.conformite.percentage >= MAX_PERCENTAGE;
    };
  }, [gameState.conformite]);

  /**
   * Perform a conformité test
   * Costs 150 formulaires, grants +3% conformité (capped at 100%)
   * 
   * @returns true if test succeeded, false if validation failed
   */
  const performConformiteTest = useCallback((): boolean => {
    if (!gameState.conformite) return false;
    
    // Validate test can be performed
    const canTest = canPerformTest(
      gameState.resources.formulaires,
      gameState.conformite.lastTestTimestamp,
      gameState.conformite.isUnlocked
    );
    
    if (!canTest) return false;
    
    // Atomic state update: deduct resources, increase percentage, update timestamp
    setGameState(prevState => {
      if (!prevState.conformite) return prevState;
      
      const newPercentage = Math.min(
        prevState.conformite.percentage + TEST_GAIN,
        MAX_PERCENTAGE
      );
      
      return {
        ...prevState,
        resources: {
          ...prevState.resources,
          formulaires: prevState.resources.formulaires - TEST_COST
        },
        conformite: {
          ...prevState.conformite,
          percentage: newPercentage,
          lastTestTimestamp: Date.now()
        }
      };
    });
    
    return true;
  }, [gameState.resources.formulaires, gameState.conformite]);

  // Toast system methods
  
  /**
   * Show a toast notification
   * Max 3 toasts displayed simultaneously
   * 
   * @param message - Message text (French)
   * @param type - Message type for styling
   * @param duration - Auto-dismiss duration in ms (default: 4000)
   */
  const showToast = useCallback((
    message: string,
    type: ToastMessage['type'],
    duration: number = 4000
  ): void => {
    const newToast: ToastMessage = {
      id: `${Date.now()}_${Math.random()}`,
      text: message,
      type,
      duration,
      timestamp: Date.now()
    };
    
    // Add to queue, keep max 3 toasts (evict oldest)
    setToastQueue(prev => [...prev, newToast].slice(-3));
    
    // Auto-dismiss after duration
    setTimeout(() => {
      dismissToast(newToast.id);
    }, duration);
  }, []);

  /**
   * Dismiss a toast by ID
   * 
   * @param toastId - Toast ID to dismiss
   */
  const dismissToast = useCallback((toastId: string): void => {
    setToastQueue(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  /**
   * Get list of active toasts
   * 
   * @returns Array of active toast messages
   */
  const getActiveToasts = useCallback((): ToastMessage[] => {
    return toastQueue;
  }, [toastQueue]);

  // NEW: Conformité system state helpers
  
  /**
   * Check if conformité system should be visible (5th admin unlocked)
   */
  const shouldShowConformite = useMemo(() => {
    return gameState.administrations[4]?.isUnlocked || false;
  }, [gameState.administrations]);

  /**
   * Check if player can activate conformité (40k tampons + 10k formulaires)
   */
  const canActivateConformite = useMemo(() => {
    if (!gameState.conformite) return false;
    if (gameState.conformite.isActivated) return false;
    
    return canActivateConformiteCheck(
      gameState.resources.tampons,
      gameState.resources.formulaires
    );
  }, [gameState.resources.tampons, gameState.resources.formulaires, gameState.conformite]);

  /**
   * Activate conformité system (one-time action)
   */
  const activateConformite = useCallback((): boolean => {
    if (!gameState.conformite) return false;
    if (gameState.conformite.isActivated) return false;
    
    if (!canActivateConformiteCheck(
      gameState.resources.tampons,
      gameState.resources.formulaires
    )) {
      return false;
    }
    
    setGameState(prevState => ({
      ...prevState,
      resources: {
        ...prevState.resources,
        tampons: prevState.resources.tampons - ACTIVATION_COST_TAMPONS,
        formulaires: prevState.resources.formulaires - ACTIVATION_COST_FORMULAIRES
      },
      conformite: prevState.conformite ? {
        ...prevState.conformite,
        isActivated: true,
        percentage: 0,
        accumulatedFormulaires: 0
      } : prevState.conformite
    }));
    
    return true;
  }, [gameState.resources, gameState.conformite]);

  return (
    <GameContext.Provider value={{
      gameState,
      incrementResource,
      purchaseAgent,
      unlockAdministration,
      setActiveAdministration,
      formatNumber,
      canPurchaseAgent,
      canUnlockAdministration,
      shouldShowConformite,
      canActivateConformite,
      activateConformite,
      isConformiteUnlocked,
      isPhase2ButtonActive,
      performConformiteTest,
      toastQueue,
      showToast,
      dismissToast,
      getActiveToasts,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGameState = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};