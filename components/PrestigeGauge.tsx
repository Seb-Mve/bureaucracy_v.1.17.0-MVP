/**
 * PrestigeGauge Component
 * 
 * Displays real-time prestige potential (Trombones gain) to the player.
 * Shows current tier and required VAT for minimum prestige.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { Paperclip } from 'lucide-react-native';

export default function PrestigeGauge() {
  const { getPrestigePotentialLive, formatNumber } = useGameState();
  
  const potential = useMemo(() => getPrestigePotentialLive(), [getPrestigePotentialLive]);
  
  const tierNameFrench = useMemo(() => {
    switch (potential.tierName) {
      case 'local':
        return 'Strate Locale';
      case 'national':
        return 'Strate Nationale';
      case 'global':
        return 'Strate Mondiale';
      default:
        return 'Strate Locale';
    }
  }, [potential.tierName]);
  
  const gaugeColor = potential.isAvailable ? Colors.success : Colors.textLight;
  const iconColor = potential.isAvailable ? Colors.success : Colors.textLight;
  
  return (
    <View style={styles.container}>
      {/* Tier Display */}
      <Text style={styles.tierText}>{tierNameFrench}</Text>
      
      {/* Prestige Potential */}
      <View style={styles.potentialRow}>
        <Paperclip 
          size={20} 
          color={iconColor} 
          strokeWidth={2}
          accessibilityLabel="Icône Trombone"
        />
        <Text 
          style={[styles.potentialText, { color: gaugeColor }]}
          accessibilityLabel={`Potentiel de Réforme : ${potential.paperclipsGain} Trombones disponibles`}
        >
          {potential.isAvailable 
            ? `Réforme Administrative disponible : ${formatNumber(potential.paperclipsGain)} Trombone${potential.paperclipsGain > 1 ? 's' : ''}`
            : `VAT insuffisante (minimum : ${formatNumber(potential.minVAT)})`
          }
        </Text>
      </View>
      
      {/* Debug info (optional, can be removed in production) */}
      {__DEV__ && (
        <Text style={styles.debugText}>
          VAT: {formatNumber(Math.floor(potential.currentVAT))} / {formatNumber(potential.minVAT)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  potentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  potentialText: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
