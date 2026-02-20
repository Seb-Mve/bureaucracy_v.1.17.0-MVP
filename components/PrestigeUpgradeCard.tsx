/**
 * PrestigeUpgradeCard Component
 * 
 * Individual upgrade card showing name, description, cost, and purchase button.
 * Shows active status with icon + text (WCAG compliance).
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PrestigeUpgrade } from '@/types/game';
import Colors from '@/constants/Colors';
import { Paperclip, Check } from 'lucide-react-native';

interface PrestigeUpgradeCardProps {
  upgrade: PrestigeUpgrade;
  isActive: boolean;
  canAfford: boolean;
  onPurchase: (upgradeId: string) => void;
  formatNumber: (value: number) => string;
}

export default function PrestigeUpgradeCard({
  upgrade,
  isActive,
  canAfford,
  onPurchase,
  formatNumber
}: PrestigeUpgradeCardProps) {
  
  const buttonDisabled = isActive || !canAfford;
  
  const buttonColor = isActive 
    ? Colors.buttonDisabled 
    : canAfford 
      ? Colors.success 
      : Colors.buttonDisabled;
  
  const accessibilityLabel = isActive
    ? `${upgrade.name} - Coût : ${upgrade.cost} Trombone${upgrade.cost > 1 ? 's' : ''} - Actif`
    : canAfford
      ? `${upgrade.name} - Coût : ${upgrade.cost} Trombone${upgrade.cost > 1 ? 's' : ''} - Disponible`
      : `${upgrade.name} - Coût : ${upgrade.cost} Trombone${upgrade.cost > 1 ? 's' : ''} - Bloqué`;
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{upgrade.name}</Text>
        {isActive && (
          <View style={styles.activeBadge}>
            <Check size={14} color={Colors.success} strokeWidth={3} />
            <Text style={styles.activeBadgeText}>ACTIF</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.description}>{upgrade.description}</Text>
      
      <View style={styles.footer}>
        <View style={styles.costRow}>
          <Paperclip size={16} color={Colors.title} strokeWidth={2} />
          <Text style={styles.costText}>
            {formatNumber(upgrade.cost)} Trombone{upgrade.cost > 1 ? 's' : ''}
          </Text>
        </View>
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: buttonColor },
            pressed && !buttonDisabled && styles.buttonPressed,
            buttonDisabled && styles.buttonDisabled
          ]}
          onPress={() => !buttonDisabled && onPurchase(upgrade.id)}
          disabled={buttonDisabled}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {isActive ? 'Actif' : !canAfford ? 'Bloqué' : 'Acheter'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.title,
    flex: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.title,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    minHeight: 44, // Accessibility: minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
