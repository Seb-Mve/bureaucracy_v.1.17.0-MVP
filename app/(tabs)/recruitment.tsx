import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResourceBar from '@/components/ResourceBar';
import AgentItem from '@/components/AgentItem';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { Lock, Package } from 'lucide-react-native';
import { Administration } from '@/types/game';
import { storageUpgrades } from '@/data/gameData';
import { getVisibleStorageUpgrades, canPurchaseStorageUpgrade } from '@/data/storageLogic';

export default function RecruitmentScreen() {
  const { 
    gameState, 
    setActiveAdministration, 
    canUnlockAdministration, 
    unlockAdministration, 
    formatNumber,
    purchaseStorageUpgrade 
  } = useGameState();
  const { administrations, activeAdministrationId } = gameState;
  
  const activeAdministration = administrations.find(
    admin => admin.id === activeAdministrationId
  );
  
  // Get visible storage upgrades (only when blocked)
  const visibleStorageUpgrades = getVisibleStorageUpgrades(gameState, storageUpgrades);
  
  // Filter storage upgrades for active administration
  const adminStorageUpgrades = activeAdministration 
    ? visibleStorageUpgrades.filter(u => {
        // Map administrationId (number) to admin array index
        // Admin 1 = index 0, Admin 2 = index 1, etc.
        const adminIndex = administrations.findIndex(a => a.id === activeAdministration.id);
        return u.administrationId === adminIndex + 1;
      })
    : [];

  const handleAdministrationPress = (administrationId: string) => {
    setActiveAdministration(administrationId);
  };

  const renderUnlockCost = (administration: Administration) => {
    return Object.entries(administration.unlockCost).map(([resource, amount]) => (
      <Text key={resource} style={[
        styles.costText,
        { color: canUnlockAdministration(administration.id) ? Colors.success : Colors.error }
      ]}>
        {formatNumber(amount || 0)} {resource}
      </Text>
    ));
  };

  const handleUnlock = (administrationId: string) => {
    if (canUnlockAdministration(administrationId)) {
      unlockAdministration(administrationId);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ResourceBar />
      
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {administrations.map((administration) => (
            <TouchableOpacity
              key={administration.id}
              style={[
                styles.tab,
                administration.id === activeAdministrationId && styles.activeTab,
                !administration.isUnlocked && styles.lockedTab
              ]}
              onPress={() => administration.isUnlocked ? 
                handleAdministrationPress(administration.id) : 
                handleUnlock(administration.id)
              }
            >
              {!administration.isUnlocked && (
                <View style={styles.lockContainer}>
                  <Lock size={16} color={Colors.textLight} />
                  <View style={styles.unlockInfo}>
                    {renderUnlockCost(administration)}
                  </View>
                </View>
              )}
              <Text style={[
                styles.tabText,
                administration.id === activeAdministrationId && styles.activeTabText,
                !administration.isUnlocked && styles.lockedTabText
              ]}>
                {administration.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {(!activeAdministration || !activeAdministration.isUnlocked) ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Sélectionnez une administration débloquée pour recruter des agents
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {/* Storage Upgrades Section (conditional) */}
          {adminStorageUpgrades.length > 0 && (
            <View style={styles.upgradesSection}>
              <View style={styles.sectionHeader}>
                <Package size={20} color={Colors.storageCapped} />
                <Text style={styles.sectionTitle}>Déblocages de Stockage</Text>
              </View>
              {adminStorageUpgrades.map((upgrade) => {
                const canPurchase = canPurchaseStorageUpgrade(gameState, storageUpgrades, upgrade.id);
                const cost = upgrade.cost.formulaires ?? 0;
                
                return (
                  <View key={upgrade.id} style={[
                    styles.upgradeCard,
                    !canPurchase && styles.upgradeCardDisabled
                  ]}>
                    <View style={styles.upgradeHeader}>
                      <Text style={styles.upgradeName}>{upgrade.name}</Text>
                      <Text style={[
                        styles.upgradeCost,
                        { color: canPurchase ? Colors.success : Colors.error }
                      ]}>
                        {formatNumber(cost)} formulaires
                      </Text>
                    </View>
                    <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
                    <Text style={styles.upgradeEffect}>{upgrade.effect}</Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.purchaseButton,
                        !canPurchase && styles.purchaseButtonDisabled
                      ]}
                      onPress={() => {
                        if (canPurchase) {
                          purchaseStorageUpgrade(upgrade.id);
                        }
                      }}
                      disabled={!canPurchase}
                      accessible={true}
                      accessibilityLabel={
                        canPurchase 
                          ? `Acheter ${upgrade.name} pour ${formatNumber(cost)} formulaires`
                          : `${upgrade.name} non disponible. ${
                              upgrade.storageConfig?.requiredUpgradeId 
                                ? 'Déblocage précédent requis.' 
                                : 'Formulaires insuffisants.'
                            }`
                      }
                      accessibilityRole="button"
                    >
                      <Text style={[
                        styles.purchaseButtonText,
                        !canPurchase && styles.purchaseButtonTextDisabled
                      ]}>
                        {canPurchase ? 'Acheter' : 'Verrouillé'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
          
          {/* Agents Section */}
          <View style={styles.agentsSection}>
            {activeAdministration.agents.map((agent) => (
              <AgentItem 
                key={agent.id}
                agent={agent} 
                administrationId={activeAdministration.id} 
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContainer: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeTab: {
    backgroundColor: Colors.buttonPrimary,
  },
  lockedTab: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  activeTabText: {
    color: 'white',
  },
  lockedTabText: {
    color: Colors.textLight,
  },
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  unlockInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  costText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  upgradesSection: {
    marginBottom: 20,
  },
  agentsSection: {
    // No specific styles needed, just a container
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.storageCapped,
  },
  upgradeCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.storageCapped,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeCardDisabled: {
    borderColor: Colors.border,
    opacity: 0.6,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upgradeName: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  upgradeCost: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginLeft: 8,
  },
  upgradeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 6,
  },
  upgradeEffect: {
    fontFamily: 'Inter-Italic',
    fontSize: 12,
    color: Colors.text,
    marginBottom: 10,
  },
  purchaseButton: {
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    minHeight: 44, // Accessibility touch target
  },
  purchaseButtonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  purchaseButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: 'white',
  },
  purchaseButtonTextDisabled: {
    color: Colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
});