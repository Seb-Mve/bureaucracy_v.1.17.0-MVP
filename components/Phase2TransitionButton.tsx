/**
 * Phase 2 Transition Button Component
 * 
 * "Réaffectation différée" button that appears grayed-out
 * and activates at 100% conformité.
 */

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useGameState } from '@/context/GameStateContext';

export default function Phase2TransitionButton() {
  const { 
    gameState, 
    isPhase2ButtonActive, 
    showToast 
  } = useGameState();
  
  const conformite = gameState.conformite;
  
  // Don't render if conformité not unlocked
  if (!conformite || !conformite.isUnlocked) {
    return null;
  }
  
  const isActive = isPhase2ButtonActive();
  const currentPercentage = Math.floor(conformite.percentage);
  
  const handlePress = () => {
    if (!isActive) {
      // Optional: show tooltip when grayed out
      // For now, button is simply disabled
      return;
    }
    
    // Show Phase 2 notification
    showToast(
      "Votre niveau de conformité a été jugé satisfaisant. Une réaffectation de niveau supérieur pourrait être envisagée conformément aux dispositions du règlement intérieur.",
      'phase2',
      6000
    );
  };
  
  // Accessibility labels
  const getAccessibilityLabel = () => {
    if (isActive) {
      return "Réaffectation différée. Conformité complète. Appuyez pour continuer.";
    } else {
      return `Réaffectation différée. Conformité requise : cent pourcent. Actuellement à ${currentPercentage} pourcent.`;
    }
  };
  
  const getAccessibilityHint = () => {
    if (!isActive) {
      return "Ce bouton deviendra actif lorsque vous atteindrez cent pourcent de conformité.";
    }
    return undefined;
  };
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        !isActive && styles.buttonGrayed,
        pressed && isActive && styles.buttonPressed,
      ]}
      onPress={handlePress}
      disabled={!isActive}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={getAccessibilityHint()}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isActive }}
    >
      <Text style={[
        styles.buttonText,
        !isActive && styles.buttonTextGrayed
      ]}>
        Réaffectation différée
      </Text>
      {!isActive && (
        <Text style={styles.requirementText}>
          Conformité requise : 100%
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#27AE60',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    minHeight: 44, // Accessibility requirement: 44×44pt touch target
    borderWidth: 2,
    borderColor: '#229954',
  },
  buttonGrayed: {
    backgroundColor: '#555555',
    borderColor: '#444444',
    opacity: 0.6,
  },
  buttonPressed: {
    backgroundColor: '#1E8449',
    opacity: 0.9,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextGrayed: {
    color: '#AAAAAA',
  },
  requirementText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
