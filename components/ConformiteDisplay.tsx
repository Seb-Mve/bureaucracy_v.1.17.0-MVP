/**
 * Conformité Display Component
 * 
 * Shows the "Conformité aléatoire" system:
 * - Appears after unlocking 5th administration
 * - Activation button (mystery mechanic - no costs shown)
 * - Progress bar showing passive progression
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useGameState } from '@/context/GameStateContext';

export default function ConformiteDisplay() {
  const {
    gameState,
    shouldShowConformite,
    canActivateConformite,
    activateConformite,
    isPhase2ButtonActive,
    conformiteDisplayPercentage,
  } = useGameState();
  
  const conformite = gameState.conformite;
  
  // Don't render if 5th admin not unlocked
  if (!shouldShowConformite || !conformite) {
    return null;
  }
  
  const isActivated = conformite.isActivated;
  const percentageInt = conformite.percentage;
  const percentageDisplay = conformiteDisplayPercentage.toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  
  const handleActivate = () => {
    activateConformite();
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={styles.title}
          accessibilityLabel={`Conformité aléatoire : ${percentageDisplay} pourcent`}
        >
          Conformité aléatoire : {percentageDisplay} %
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill,
              { width: `${conformiteDisplayPercentage}%` }
            ]}
          />
        </View>
      </View>
      
      {!isActivated && (
        <Pressable
          style={({ pressed }) => [
            styles.testButton,
            !canActivateConformite && styles.testButtonDisabled,
            pressed && canActivateConformite && styles.testButtonPressed
          ]}
          onPress={handleActivate}
          disabled={!canActivateConformite}
          accessibilityLabel="Activer le système de conformité aléatoire"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canActivateConformite }}
        >
          <Text style={[
            styles.testButtonText,
            !canActivateConformite && styles.testButtonTextDisabled
          ]}>
            Activer la conformité
          </Text>
        </Pressable>
      )}
      
      {isActivated && percentageInt < 100 && (
        <Text style={styles.progressInfo}>
          Progression passive en cours...
        </Text>
      )}
      
      {percentageInt >= 100 && isPhase2ButtonActive() && (
        <Pressable
          style={({ pressed }) => [
            styles.reaffectationButton,
            pressed && styles.testButtonPressed
          ]}
          onPress={() => {
            // Réaffectation différée — prestige mechanic, not yet implemented
          }}
          accessibilityLabel="Réaffectation différée"
          accessibilityRole="button"
        >
          <Text style={styles.reaffectationButtonText}>
            Réaffectation différée
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E0E0',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  testButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Accessibility requirement: 44×44pt touch target
    minWidth: 200,
  },
  testButtonPressed: {
    backgroundColor: '#3A7BC2',
    opacity: 0.8,
  },
  testButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  testButtonTextDisabled: {
    color: '#AAA',
  },
  progressInfo: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  reaffectationButton: {
    backgroundColor: '#E2A94A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 200,
  },
  reaffectationButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
