/**
 * Conformité Display Component
 * 
 * Shows the mysterious "Conformité aléatoire" percentage and test button.
 * Only visible after unlocking (1000 tampons + 100 formulaires).
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import { TEST_COST } from '@/data/conformiteLogic';

export default function ConformiteDisplay() {
  const { 
    gameState, 
    performConformiteTest, 
    formatNumber 
  } = useGameState();
  
  const conformite = gameState.conformite;
  
  // Don't render if not unlocked
  if (!conformite || !conformite.isUnlocked) {
    return null;
  }
  
  // Hide the test button once conformité has started (> 0%)
  const showTestButton = conformite.percentage === 0;
  const canAffordTest = gameState.resources.formulaires >= TEST_COST;
  const buttonDisabled = !canAffordTest;
  
  const handleTestPress = () => {
    const success = performConformiteTest();
    // Success feedback handled by optimistic UI update
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text 
          style={styles.title}
          accessibilityLabel={`Conformité aléatoire : ${Math.floor(conformite.percentage)} pourcent`}
        >
          Conformité aléatoire : {Math.floor(conformite.percentage)}%
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${conformite.percentage}%` }
            ]} 
          />
        </View>
      </View>
      
      {showTestButton && (
        <Pressable
          style={({ pressed }) => [
            styles.testButton,
            buttonDisabled && styles.testButtonDisabled,
            pressed && !buttonDisabled && styles.testButtonPressed
          ]}
          onPress={handleTestPress}
          disabled={buttonDisabled}
          accessibilityLabel={`Réaliser un test de conformité. Coûte ${formatNumber(TEST_COST)} formulaires.`}
          accessibilityRole="button"
          accessibilityState={{ disabled: buttonDisabled }}
        >
          <Text style={[
            styles.testButtonText,
            buttonDisabled && styles.testButtonTextDisabled
          ]}>
            Réaliser un test de conformité
          </Text>
          <Text style={[
            styles.testButtonCost,
            buttonDisabled && styles.testButtonCostDisabled
          ]}>
            ({formatNumber(TEST_COST)} formulaires)
          </Text>
        </Pressable>
      )}
      
      {!showTestButton && (
        <Text style={styles.progressInfo}>
          Progression passive en cours...
        </Text>
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
  testButtonCost: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  testButtonCostDisabled: {
    color: '#AAA',
  },
  progressInfo: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
