/**
 * PrestigeShopModal Component
 * 
 * Full-screen modal displaying all prestige upgrades with Trombone balance.
 * Shows available upgrades, active upgrades, and blocked upgrades.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameState } from '@/context/GameStateContext';
import { prestigeUpgrades } from '@/data/gameData';
import Colors from '@/constants/Colors';
import { X, Paperclip } from 'lucide-react-native';
import PrestigeUpgradeCard from './PrestigeUpgradeCard';

interface PrestigeShopModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrestigeShopModal({ visible, onClose }: PrestigeShopModalProps) {
  const { gameState, buyPrestigeUpgrade, formatNumber } = useGameState();
  
  const handlePurchase = (upgradeId: string) => {
    buyPrestigeUpgrade(upgradeId);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Boutique de Prestige</Text>
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed
            ]}
            onPress={onClose}
            accessibilityLabel="Fermer la boutique de prestige"
            accessibilityRole="button"
          >
            <X size={24} color={Colors.title} strokeWidth={2} />
          </Pressable>
        </View>
        
        {/* Trombone Balance */}
        <View style={styles.balanceContainer}>
          <Paperclip size={20} color={Colors.title} strokeWidth={2} />
          <Text style={styles.balanceText}>
            {formatNumber(gameState.paperclips)} Trombone{gameState.paperclips > 1 ? 's' : ''}
          </Text>
        </View>
        
        {/* Upgrades List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.sectionTitle}>Améliorations Disponibles</Text>
          <Text style={styles.sectionSubtitle}>
            Les améliorations sont actives uniquement durant le run actuel. 
            Elles seront désactivées après une Réforme Administrative.
          </Text>
          
          {prestigeUpgrades.map(upgrade => {
            const isActive = gameState.prestigeUpgrades.includes(upgrade.id);
            const canAfford = gameState.paperclips >= upgrade.cost;
            
            return (
              <PrestigeUpgradeCard
                key={upgrade.id}
                upgrade={upgrade}
                isActive={isActive}
                canAfford={canAfford}
                onPurchase={handlePurchase}
                formatNumber={formatNumber}
              />
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.title,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 44, // Accessibility: minimum touch target
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPressed: {
    backgroundColor: Colors.border,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  balanceText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.title,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.title,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },
});
