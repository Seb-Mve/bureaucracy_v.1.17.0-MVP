import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AgentItem from './AgentItem';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { Lock, Package } from 'lucide-react-native';

export default function AdminContentSection() {
  const {
    gameState,
    canUnlockAdministration,
    unlockAdministration,
    formatNumber,
    purchaseStorageUpgrade,
    getAdminStorageUpgrades,
  } = useGameState();

  const { administrations, activeAdministrationId } = gameState;
  const activeAdministration = administrations.find(a => a.id === activeAdministrationId);

  if (!activeAdministration) return null;

  // Administration verrouillée snappée au centre
  if (!activeAdministration.isUnlocked) {
    const canUnlock = canUnlockAdministration(activeAdministration.id);
    return (
      <View style={styles.lockedContent}>
        <Lock size={32} color={Colors.textLight} />
        <Text style={styles.lockedTitle}>Administration verrouillée</Text>
        <Text style={styles.lockedSubtitle}>
          {canUnlock
            ? `Ressources disponibles pour débloquer cette administration.`
            : `Ressources insuffisantes pour débloquer cette administration.`}
        </Text>
        {Object.entries(activeAdministration.unlockCost).map(([resource, amount]) => (
          <Text key={resource} style={[
            styles.lockedCost,
            { color: canUnlock ? Colors.success : Colors.error }
          ]}>
            {formatNumber(amount ?? 0)} {resource}
          </Text>
        ))}
        {canUnlock && (
          <Pressable
            style={styles.unlockButton}
            onPress={() => unlockAdministration(activeAdministration.id)}
            accessibilityLabel={`Débloquer ${activeAdministration.name}`}
            accessibilityRole="button"
          >
            <Text style={styles.unlockButtonText}>Débloquer</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Administration débloquée : upgrades de stockage + agents
  const upgrades = getAdminStorageUpgrades(activeAdministration.id);

  return (
    <View style={styles.container}>
      {upgrades.length > 0 && (
        <View style={styles.upgradesSection}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={Colors.storageCapped} />
            <Text style={styles.sectionTitle}>Déblocages de Stockage</Text>
          </View>
          {upgrades.map((upgrade) => (
            <View key={upgrade.id} style={[
              styles.upgradeCard,
              !upgrade.canPurchase && styles.upgradeCardDisabled
            ]}>
              <View style={styles.upgradeHeader}>
                <Text style={styles.upgradeName}>{upgrade.name}</Text>
                <Text style={[styles.upgradeCost, { color: upgrade.canPurchase ? Colors.success : Colors.error }]}>
                  {formatNumber(upgrade.cost.formulaires ?? 0)} formulaires
                </Text>
              </View>
              <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
              <Text style={styles.upgradeEffect}>{upgrade.effect}</Text>
              <Pressable
                style={[styles.purchaseButton, !upgrade.canPurchase && styles.purchaseButtonDisabled]}
                onPress={() => { if (upgrade.canPurchase) purchaseStorageUpgrade(upgrade.id); }}
                disabled={!upgrade.canPurchase}
                accessibilityLabel={
                  upgrade.canPurchase
                    ? `Acheter ${upgrade.name} pour ${formatNumber(upgrade.cost.formulaires ?? 0)} formulaires`
                    : `${upgrade.name} non disponible`
                }
                accessibilityRole="button"
              >
                <Text style={[styles.purchaseButtonText, !upgrade.canPurchase && styles.purchaseButtonTextDisabled]}>
                  {upgrade.canPurchase ? `Acheter` : `Verrouillé`}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.agentsSection}>
        {activeAdministration.agents.map((agent) => (
          <AgentItem
            key={agent.id}
            agent={agent}
            administrationId={activeAdministration.id}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  lockedContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  lockedTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.text,
    marginTop: 8,
  },
  lockedSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedCost: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  unlockButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 25,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  upgradesSection: {
    marginBottom: 20,
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
    fontFamily: 'Inter-Regular',
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
    minHeight: 44,
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
  agentsSection: {},
});
