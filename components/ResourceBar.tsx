import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { File, Stamp, ClipboardList } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';

export default function ResourceBar() {
  const { gameState, formatNumber } = useGameState();
  
  // Early return with loading state if gameState is not initialized
  if (!gameState || !gameState.resources || !gameState.production) {
    return (
      <View style={styles.container}>
        <Text>Loading resources...</Text>
      </View>
    );
  }

  const { resources, production } = gameState;

  return (
    <View style={styles.container}>
      <View style={styles.resourceItem}>
        <File color={Colors.resourceDossiers} size={18} />
        <View style={styles.resourceValues}>
          <Text style={styles.resourceValue}>{formatNumber(resources.dossiers)}</Text>
          <Text style={styles.resourceProduction}>
            +{formatNumber(production.dossiers)}/s
          </Text>
        </View>
      </View>

      <View style={styles.resourceItem}>
        <Stamp color={Colors.resourceTampons} size={18} />
        <View style={styles.resourceValues}>
          <Text style={styles.resourceValue}>{formatNumber(resources.tampons)}</Text>
          <Text style={styles.resourceProduction}>
            +{formatNumber(production.tampons)}/s
          </Text>
        </View>
      </View>

      <View style={styles.resourceItem}>
        <ClipboardList color={Colors.resourceFormulaires} size={18} />
        <View style={styles.resourceValues}>
          <Text style={styles.resourceValue}>{formatNumber(resources.formulaires)}</Text>
          <Text style={styles.resourceProduction}>
            +{formatNumber(production.formulaires)}/s
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resourceItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  resourceValues: {
    alignItems: 'center',
    marginTop: 4,
  },
  resourceValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.text,
  },
  resourceProduction: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
});