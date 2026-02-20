import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { GameState, ResourceType, Resources, Production, ToastMessage, JournalEntry, Upgrade, PrestigeUpgrade, PrestigeTransaction } from '@/types/game';
import { initialGameState, storageUpgrades, prestigeUpgrades, administrations } from '@/data/gameData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatNumberFrench } from '@/utils/formatters';
import { migrateGameState, isValidGameState } from '@/utils/stateMigration';
import * as Haptics from 'expo-haptics';
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
import {
  getRandomSICMessage,
  calculateSICProbability,
  shouldTriggerNonConformity,
  hasCrossedMilestone,
  MILESTONE_DOSSIERS,
  MILESTONE_TAMPONS,
  MILESTONE_FORMULAIRES
} from '@/data/messageSystem';
import {
  applyStorageCap,
  canPurchaseStorageUpgrade,
  getStorageCapAfterUpgrade,
  isStorageBlocked
} from '@/data/storageLogic';
import {
  getPrestigePotential,
  applyPrestigeMultipliers,
  applyPrestigeStorageBonus,
  getClickMultiplier,
  calculatePrestigePaperclips,
  canPurchasePrestigeUpgrade
} from '@/data/prestigeLogic';

interface GameContextType {
  gameState: GameState;
  incrementResource: (resource: ResourceType, amount: number) => void;
  purchaseAgent: (administrationId: string, agentId: string) => boolean;
  unlockAdministration: (administrationId: string) => boolean;
  setActiveAdministration: (administrationId: string) => void;
  formatNumber: (value: number) => string;
  canPurchaseAgent: (administrationId: string, agentId: string) => boolean;
  canUnlockAdministration: (administrationId: string) => boolean;
  
  // Storage cap system methods
  purchaseStorageUpgrade: (upgradeId: string) => boolean;
  isStorageBlocked: boolean;
  
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
  
  // Journal system methods
  addJournalEntry: (
    type: 'sic' | 'non-conformity' | 'narrative-hint',
    text: string,
    options?: {
      revealedText?: string;
      targetId?: string;
    }
  ) => void;
  revealNarrativeHint: (targetId: string) => void;
  
  // Prestige system methods
  getPrestigePotentialLive: () => {
    paperclipsGain: number;
    isAvailable: boolean;
    minVAT: number;
    currentVAT: number;
    tierName: 'local' | 'national' | 'global';
  };
  performPrestige: () => Promise<boolean>;
  buyPrestigeUpgrade: (upgradeId: string) => boolean;
  hasPrestigeUpgrade: (upgradeId: string) => boolean;
  getActivePrestigeUpgrades: () => string[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY = 'bureaucracy_game_state';
const PRESTIGE_TRANSACTION_KEY = 'prestige_transaction';
const PRESTIGE_TRANSACTION_TIMEOUT = 30000; // 30 seconds
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

    // Apply prestige production multipliers (T050)
    const finalProduction = applyPrestigeMultipliers(
      newProduction,
      state.prestigeUpgrades,
      prestigeUpgrades
    );

    return finalProduction;
  }, []);

  const canAfford = useCallback((cost: Partial<Resources>): boolean => {
    return Object.entries(cost).every(([resource, amount]) => 
      gameState.resources[resource as keyof Resources] >= (amount || 0)
    );
  }, [gameState.resources]);

  // Fonction optimisée pour appliquer les mises à jour en batch
  const applyPendingUpdates = useCallback(() => {
    if (Object.keys(pendingUpdatesRef.current).length > 0) {
      // Snapshot before clearing: React's updater function runs asynchronously
      // (after the current call stack), so pendingUpdatesRef.current would be
      // {} by the time the updater is called if we cleared it first.
      const snapshot = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      setGameState(prev => ({
        ...prev,
        ...snapshot,
      }));
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const loadGameState = async () => {
      try {
        // Check for incomplete prestige transaction first
        const transactionData = await AsyncStorage.getItem(PRESTIGE_TRANSACTION_KEY);
        if (transactionData) {
          const transaction: PrestigeTransaction = JSON.parse(transactionData);
          const transactionAge = Date.now() - transaction.timestamp;
          
          if (transactionAge > PRESTIGE_TRANSACTION_TIMEOUT) {
            // Transaction too old (>30s) - rollback (ignore transaction)
            console.warn('[Prestige Recovery] Transaction too old, performing rollback (ignoring transaction)');
            await AsyncStorage.removeItem(PRESTIGE_TRANSACTION_KEY);
          } else {
            // Transaction recent - attempt to complete prestige
            console.log('[Prestige Recovery] Found recent incomplete transaction, attempting to complete...');
            
            // Load current state
            const storedState = await AsyncStorage.getItem(STORAGE_KEY);
            if (storedState) {
              const parsedState = JSON.parse(storedState);
              const migratedState = migrateGameState(parsedState);
              
              // If prestigeInProgress flag is still true, complete the prestige
              if (migratedState.prestigeInProgress) {
                console.log('[Prestige Recovery] Completing interrupted prestige transaction');
                
                // Credit Paperclips from transaction
                migratedState.paperclips = (migratedState.paperclips || 0) + transaction.paperclipsGained;
                
                // Clear flag
                migratedState.prestigeInProgress = false;
                
                // Save completed state
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedState));
                await AsyncStorage.removeItem(PRESTIGE_TRANSACTION_KEY);
                
                console.log('[Prestige Recovery] Transaction completed successfully');
              } else {
                // Flag already cleared, just remove transaction log
                await AsyncStorage.removeItem(PRESTIGE_TRANSACTION_KEY);
              }
            }
          }
        }
        
        // Now load normal game state
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

  // Toast system methods (declared before game loop to avoid TDZ)

  /**
   * Show a toast notification
   * Enforces max 3 active toasts (overflow silently dropped)
   */
  const showToast = useCallback((
    message: string,
    type: ToastMessage['type'],
    duration: number = 4000
  ): void => {
    setToastQueue(prev => {
      if (prev.length >= 3) {
        return prev; // Drop overflow
      }
      const newToast: ToastMessage = {
        id: `${Date.now()}_${Math.random()}`,
        text: message,
        type,
        duration,
        timestamp: Date.now()
      };
      return [...prev, newToast];
    });
  }, []);

  /**
   * Add a journal entry (S.I.C. message, non-conformity, or narrative hint)
   * Enforces 500-entry limit via FIFO rotation
   */
  const addJournalEntry = useCallback((
    type: 'sic' | 'non-conformity' | 'narrative-hint',
    text: string,
    options: {
      revealedText?: string;
      targetId?: string;
    } = {}
  ) => {
    const newEntry: JournalEntry = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      text,
      timestamp: Date.now(),
      ...(type === 'narrative-hint' ? {
        isRevealed: false,
        revealedText: options.revealedText,
        targetId: options.targetId
      } : {})
    };
    setGameState(prevState => ({
      ...prevState,
      journal: [newEntry, ...prevState.journal].slice(0, 500)
    }));
  }, []);

  /**
   * Reveal a narrative hint by targetId (when unlock condition met)
   */
  const revealNarrativeHint = useCallback((targetId: string) => {
    setGameState(prevState => ({
      ...prevState,
      journal: prevState.journal.map(entry => {
        if (entry.type === 'narrative-hint' && entry.targetId === targetId && !entry.isRevealed) {
          return {
            ...entry,
            isRevealed: true,
            text: entry.revealedText || entry.text
          };
        }
        return entry;
      })
    }));
  }, []);

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
      
      // Apply prestige storage bonus (T051)
      const effectiveStorageCap = applyPrestigeStorageBonus(
        gameState.currentStorageCap,
        gameState.prestigeUpgrades,
        prestigeUpgrades
      );
      
      // Apply storage cap to formulaires (strict enforcement)
      newResources.formulaires = applyStorageCap(
        newResources.formulaires,
        effectiveStorageCap
      );

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

      // Check for milestone crossings and trigger S.I.C. messages
      let newMessageSystem = gameState.messageSystem ? { ...gameState.messageSystem } : undefined;
      
      if (newMessageSystem) {
        const { lastProductionMilestone } = newMessageSystem;
        let milestoneTriggered = false;
        
        // Check dossiers milestone (every 100)
        if (hasCrossedMilestone(newResources.dossiers, lastProductionMilestone.dossiers, MILESTONE_DOSSIERS)) {
          milestoneTriggered = true;
          newMessageSystem.lastProductionMilestone.dossiers = newResources.dossiers;
        }
        
        // Check tampons milestone (every 50)
        if (hasCrossedMilestone(newResources.tampons, lastProductionMilestone.tampons, MILESTONE_TAMPONS)) {
          milestoneTriggered = true;
          newMessageSystem.lastProductionMilestone.tampons = newResources.tampons;
        }
        
        // Check formulaires milestone (every 25)
        if (hasCrossedMilestone(newResources.formulaires, lastProductionMilestone.formulaires, MILESTONE_FORMULAIRES)) {
          milestoneTriggered = true;
          newMessageSystem.lastProductionMilestone.formulaires = newResources.formulaires;
        }
        
        // If any milestone crossed, check if we should trigger a message
        if (milestoneTriggered) {
          // Check non-conformity first (rarer, higher priority)
          if (shouldTriggerNonConformity(newMessageSystem.nonConformityLastTriggerTime)) {
            const nonConformityMessage = 'Tampon non conforme détecté. Analyse en cours.';
            showToast(nonConformityMessage, 'non-conformity', 5000);
            addJournalEntry('non-conformity', nonConformityMessage);
            newMessageSystem.nonConformityLastTriggerTime = Date.now();
          } else {
            // Check S.I.C. message probability
            const probability = calculateSICProbability(newMessageSystem.sicLastTriggerTime);
            if (Math.random() < probability) {
              const sicMessage = getRandomSICMessage();
              showToast(sicMessage, 'sic', 5000);
              addJournalEntry('sic', sicMessage);
              newMessageSystem.sicLastTriggerTime = Date.now();
            }
          }
        }
      }

      // Increment totalAdministrativeValue (VAT) for prestige calculation
      // VAT tracks ALL resources produced (dossiers + tampons + formulaires)
      const totalProduced = currentProduction.dossiers * deltaTime + 
                           currentProduction.tampons * deltaTime + 
                           currentProduction.formulaires * deltaTime;

      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        resources: newResources,
        production: currentProduction,
        lastTimestamp: currentTime,
        conformite: newConformite,
        messageSystem: newMessageSystem,
        totalAdministrativeValue: gameState.totalAdministrativeValue + totalProduced
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
  }, [gameState, calculateProduction, applyPendingUpdates, showToast, addJournalEntry]);

  useEffect(() => {
    productionCacheRef.current = null;
  }, [gameState.administrations]);

  /**
   * Add resources to the current totals (used by the stamp button and game loop).
   * Also tracks lifetime formulaires for conformité progression and VAT for prestige.
   * Applies prestige click multiplier for manual dossier production (T052).
   */
  const incrementResource = useCallback((resource: ResourceType, amount: number) => {
    // Apply click multiplier for dossiers (prestige_01: Tampon Double Flux)
    const clickMultiplier = resource === 'dossiers' 
      ? getClickMultiplier(gameState.prestigeUpgrades, prestigeUpgrades)
      : 1;
    
    const finalAmount = amount * clickMultiplier;
    
    setGameState(prevState => ({
      ...prevState,
      resources: {
        ...prevState.resources,
        [resource]: prevState.resources[resource] + finalAmount
      },
      // Track manual production in totalAdministrativeValue for prestige
      totalAdministrativeValue: prevState.totalAdministrativeValue + finalAmount
    }));
  }, [gameState.prestigeUpgrades]);

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
   * Also reveals any narrative hints for this administration.
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
    
    // Reveal any narrative hint for this administration
    revealNarrativeHint(administrationId);
    
    return true;
  }, [gameState.administrations, canAfford, revealNarrativeHint]);

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

  // Storage cap system methods
  
  /**
   * Check if storage is currently blocked (formulaires >= cap)
   * Memoized computed value for UI reactivity
   */
  const isStorageBlockedValue = useMemo(() => {
    return isStorageBlocked(gameState);
  }, [gameState.resources.formulaires, gameState.currentStorageCap]);
  
  /**
   * Purchase a storage upgrade
   * Validates sequence and cost, then atomically:
   * - Sets formulaires to 0
   * - Updates currentStorageCap to new value
   * - Marks upgrade as purchased
   * 
   * @param upgradeId - ID of the storage upgrade to purchase
   * @returns true if purchase succeeded, false if validation failed
   */
  const purchaseStorageUpgrade = useCallback((upgradeId: string): boolean => {
    // Validate purchase
    if (!canPurchaseStorageUpgrade(gameState, storageUpgrades, upgradeId)) {
      console.warn('[StorageUpgrade] Cannot purchase:', upgradeId);
      return false;
    }
    
    const upgrade = storageUpgrades.find(u => u.id === upgradeId);
    if (!upgrade || !upgrade.storageConfig) {
      console.error('[StorageUpgrade] Invalid upgrade config:', upgradeId);
      return false;
    }
    
    // Atomic transaction: reset formulaires + update cap + mark purchased
    setGameState(prevState => ({
      ...prevState,
      resources: {
        ...prevState.resources,
        formulaires: 0 // Reset to 0 (cost = entire stock)
      },
      currentStorageCap: upgrade.storageConfig!.newCap
    }));
    
    console.log(`[StorageUpgrade] Purchased ${upgradeId}, new cap: ${upgrade.storageConfig.newCap}`);
    return true;
  }, [gameState]);

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
   * Also reveals any narrative hint for conformité system.
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
    
    // Reveal any narrative hint for conformité system
    revealNarrativeHint('conformite');
    return true;
  }, [gameState.resources, gameState.conformite, revealNarrativeHint]);

  /**
   * Get real-time prestige potential for UI display
   */
  const getPrestigePotentialLive = useCallback(() => {
    return getPrestigePotential(
      gameState.totalAdministrativeValue,
      gameState.currentTier
    );
  }, [gameState.totalAdministrativeValue, gameState.currentTier]);

  /**
   * Buy a prestige upgrade with Paperclips
   * Deducts cost and activates upgrade for current run
   * 
   * @param upgradeId - ID of upgrade to purchase
   * @returns true if purchase succeeded, false if blocked
   */
  const buyPrestigeUpgrade = useCallback((upgradeId: string): boolean => {
    const validation = canPurchasePrestigeUpgrade(
      upgradeId,
      gameState.paperclips,
      gameState.prestigeUpgrades,
      prestigeUpgrades
    );
    
    if (!validation.canPurchase) {
      if (validation.error) {
        showToast(validation.error, 'error', 2000);
      }
      return false;
    }
    
    // Find upgrade to get cost and name
    const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) {
      console.error('[Prestige] Upgrade not found:', upgradeId);
      return false;
    }
    
    // Deduct cost and activate upgrade
    setGameState(prevState => ({
      ...prevState,
      paperclips: prevState.paperclips - upgrade.cost,
      prestigeUpgrades: [...prevState.prestigeUpgrades, upgradeId]
    }));
    
    // Haptic feedback (Light for purchase)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Show success toast
    showToast(`Amélioration achetée : ${upgrade.name}`, 'success', 3000);
    
    return true;
  }, [gameState.paperclips, gameState.prestigeUpgrades, showToast]);
  
  /**
   * Check if a prestige upgrade is currently active
   */
  const hasPrestigeUpgrade = useCallback((upgradeId: string): boolean => {
    return gameState.prestigeUpgrades.includes(upgradeId);
  }, [gameState.prestigeUpgrades]);
  
  /**
   * Get list of all active prestige upgrade IDs
   */
  const getActivePrestigeUpgrades = useCallback((): string[] => {
    return gameState.prestigeUpgrades;
  }, [gameState.prestigeUpgrades]);

  /**
   * Perform prestige (Réforme Administrative)
   * Two-phase commit for transaction safety:
   * 1. Write transaction log to separate AsyncStorage key
   * 2. Reset game state (resources, agents, upgrades)
   * 3. Credit Paperclips
   * 4. Commit to AsyncStorage
   * 5. Clear transaction log
   * 
   * @returns Promise<boolean> - true if prestige succeeded, false if blocked
   */
  const performPrestige = useCallback(async (): Promise<boolean> => {
    // Calculate potential gain
    const paperclipsGain = calculatePrestigePaperclips(
      gameState.totalAdministrativeValue,
      gameState.currentTier
    );
    
    // Block prestige if gain is 0
    if (paperclipsGain === 0) {
      showToast('VAT insuffisante pour une Réforme Administrative', 'error', 3000);
      return false;
    }
    
    // Block if prestige already in progress
    if (gameState.prestigeInProgress) {
      console.warn('[Prestige] Transaction already in progress, blocking duplicate prestige');
      return false;
    }
    
    try {
      // Phase 1: Write transaction log (BEFORE any state changes)
      const transaction: PrestigeTransaction = {
        timestamp: Date.now(),
        paperclipsGained: paperclipsGain,
        totalAdministrativeValue: gameState.totalAdministrativeValue,
        currentTier: gameState.currentTier
      };
      
      await AsyncStorage.setItem(PRESTIGE_TRANSACTION_KEY, JSON.stringify(transaction));
      console.log('[Prestige] Transaction logged:', transaction);
      
      // Set prestigeInProgress flag
      await new Promise<void>((resolve) => {
        setGameState(prevState => ({
          ...prevState,
          prestigeInProgress: true
        }));
        // Wait for state update
        setTimeout(resolve, 50);
      });
      
      // Phase 2: Reset game state
      const resetState: GameState = {
        ...initialGameState,
        version: 5, // Keep current version
        // PERSISTENT: Paperclips, currentTier
        paperclips: gameState.paperclips + paperclipsGain,
        currentTier: gameState.currentTier,
        // PERSISTENT: Conformité unlock status (but reset activation)
        conformite: gameState.conformite ? {
          ...initialGameState.conformite!,
          isUnlocked: gameState.conformite.isUnlocked,
          highestEverTampons: gameState.conformite.highestEverTampons,
          highestEverFormulaires: gameState.conformite.highestEverFormulaires
        } : initialGameState.conformite,
        // RESET: Resources, VAT, agents, upgrades, administrations (except centrale)
        resources: { dossiers: 0, tampons: 0, formulaires: 0 },
        totalAdministrativeValue: 0,
        prestigeUpgrades: [], // Reset active upgrades
        administrations: administrations.map((admin, index) => ({
          ...admin,
          isUnlocked: index === 0, // Only centrale unlocked
          agents: admin.agents.map(agent => ({ ...agent, owned: 0 }))
        })),
        activeAdministrationId: 'administration-centrale',
        currentStorageCap: 983, // Reset to initial cap
        messageSystem: initialGameState.messageSystem,
        journal: [], // Clear journal on prestige
        lastTimestamp: null,
        prestigeInProgress: true // Keep flag until commit
      };
      
      // Phase 3: Apply reset state
      setGameState(resetState);
      
      // Phase 4: Save to AsyncStorage (debounced save will happen, but force immediate save)
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));
      console.log('[Prestige] State reset complete, Paperclips credited:', paperclipsGain);
      
      // Phase 5: Clear transaction flag and log
      await AsyncStorage.removeItem(PRESTIGE_TRANSACTION_KEY);
      setGameState(prevState => ({
        ...prevState,
        prestigeInProgress: false
      }));
      
      // Haptic feedback (Medium impact for major action)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Show success toast
      showToast(
        `Réforme Administrative réussie ! +${formatNumberFrench(paperclipsGain)} Trombone${paperclipsGain > 1 ? 's' : ''}`,
        'success',
        4000
      );
      
      console.log('[Prestige] Transaction complete and cleaned up');
      return true;
      
    } catch (error) {
      console.error('[Prestige] Error during prestige operation:', error);
      
      // Attempt to clear transaction flag
      try {
        await AsyncStorage.removeItem(PRESTIGE_TRANSACTION_KEY);
        setGameState(prevState => ({ ...prevState, prestigeInProgress: false }));
      } catch (cleanupError) {
        console.error('[Prestige] Failed to cleanup after error:', cleanupError);
      }
      
      showToast('Erreur lors de la Réforme Administrative', 'error', 3000);
      return false;
    }
  }, [gameState, showToast, formatNumberFrench]);

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
      purchaseStorageUpgrade,
      isStorageBlocked: isStorageBlockedValue,
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
      addJournalEntry,
      revealNarrativeHint,
      getPrestigePotentialLive,
      performPrestige,
      buyPrestigeUpgrade,
      hasPrestigeUpgrade,
      getActivePrestigeUpgrades,
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