import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { GameState, ResourceType, Resources, Production } from '@/types/game';
import { initialGameState } from '@/data/gameData';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameContextType {
  gameState: GameState;
  incrementResource: (resource: ResourceType, amount: number) => void;
  purchaseAgent: (administrationId: string, agentId: string) => boolean;
  unlockAdministration: (administrationId: string) => boolean;
  setActiveAdministration: (administrationId: string) => void;
  formatNumber: (value: number) => string;
  canPurchaseAgent: (administrationId: string, agentId: string) => boolean;
  canUnlockAdministration: (administrationId: string) => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY = 'bureaucracy_game_state';
const UPDATE_INTERVAL = 100; // Plus fréquent pour une meilleure réactivité
const SAVE_INTERVAL = 5000; // Sauvegarde toutes les 5 secondes

export default function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(() => ({
    ...initialGameState,
  }));
  
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
          const parsedState = JSON.parse(storedState) as GameState;
          setGameState(prevState => ({
            ...parsedState,
            lastTimestamp: Date.now(),
          }));
        } else if (isMountedRef.current) {
          setGameState(prevState => ({
            ...prevState,
            lastTimestamp: Date.now(),
          }));
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
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
      Object.keys(currentProduction).forEach(resource => {
        const resourceKey = resource as keyof Resources;
        newResources[resourceKey] += currentProduction[resourceKey as keyof Production] * deltaTime;
      });

      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        resources: newResources,
        production: currentProduction,
        lastTimestamp: currentTime
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

  const incrementResource = useCallback((resource: ResourceType, amount: number) => {
    setGameState(prevState => ({
      ...prevState,
      resources: {
        ...prevState.resources,
        [resource]: prevState.resources[resource] + amount
      }
    }));
  }, []);

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

  const setActiveAdministration = useCallback((administrationId: string) => {
    setGameState(prevState => ({
      ...prevState,
      activeAdministrationId: administrationId
    }));
  }, []);

  const formatNumber = useCallback((value: number): string => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    } else if (value >= 100) {
      return Math.floor(value).toString();
    } else if (value >= 10) {
      return value.toFixed(1);
    } else {
      return value.toFixed(2);
    }
  }, []);

  const canPurchaseAgent = useCallback((administrationId: string, agentId: string): boolean => {
    const administration = gameState.administrations.find(a => a.id === administrationId);
    if (!administration || !administration.isUnlocked) return false;

    const agent = administration.agents.find(a => a.id === agentId);
    if (!agent) return false;

    return canAfford(agent.cost);
  }, [gameState.administrations, canAfford]);

  const canUnlockAdministration = useCallback((administrationId: string): boolean => {
    const administration = gameState.administrations.find(a => a.id === administrationId);
    if (!administration || administration.isUnlocked) return false;

    return canAfford(administration.unlockCost);
  }, [gameState.administrations, canAfford]);

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