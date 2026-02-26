import React, { useRef } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text, Animated } from 'react-native';
import { Lock } from 'lucide-react-native';
import { Administration } from '@/types/game';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';

interface AdministrationCardProps {
  administration: Administration;
  isActive: boolean;
  onPress: () => void;
}

export default function AdministrationCard({
  administration,
  isActive,
  onPress
}: AdministrationCardProps) {
  const { canUnlockAdministration, unlockAdministration, formatNumber } = useGameState();
  const isUnlockable = canUnlockAdministration(administration.id);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleUnlock = () => {
    if (isUnlockable) {
      unlockAdministration(administration.id);
    }
  };

  const handlePress = () => {
    onPress();
    if (!administration.isUnlocked) {
      if (isUnlockable) handleUnlock();
      else triggerShake();
    }
  };

  const renderUnlockCost = () => {
    return Object.entries(administration.unlockCost).map(([resource, amount]) => (
      <Text key={resource} style={[
        styles.costText,
        { color: isUnlockable ? Colors.success : Colors.error }
      ]}>
        {formatNumber(amount || 0)} {resource}
      </Text>
    ));
  };

  const getAccessibilityLabel = () => {
    if (!administration.isUnlocked) {
      const costText = Object.entries(administration.unlockCost)
        .map(([resource, amount]) => `${formatNumber(amount || 0)} ${resource}`)
        .join(', ');
      return `${administration.name}. Verrouillé. Coût de déblocage: ${costText}`;
    }
    return `${administration.name}. ${isActive ? 'Sélectionné' : 'Non sélectionné'}`;
  };

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          isActive && styles.activeContainer,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={
          administration.isUnlocked
            ? 'Appuyez pour sélectionner cette administration'
            : isUnlockable
            ? 'Appuyez pour débloquer cette administration'
            : 'Ressources insuffisantes pour débloquer'
        }
        accessibilityRole="button"
        accessibilityState={{ selected: isActive, disabled: false }}
      >
        <Image
          source={administration.imagePath}
          style={styles.image}
        />
        <View style={styles.nameRow}>
          <Text style={styles.nameText} numberOfLines={1}>{administration.name}</Text>
        </View>
        {!administration.isUnlocked && (
          <View style={styles.lockedOverlay}>
            <Lock size={48} color="white" strokeWidth={1.5} />
            <View style={styles.unlockInfo}>
              <Text style={styles.unlockTitle}>Coût de déblocage:</Text>
              <View style={styles.costContainer}>
                {renderUnlockCost()}
              </View>
              {isUnlockable && (
                <TouchableOpacity
                  style={styles.unlockButton}
                  onPress={handleUnlock}
                  accessible={true}
                  accessibilityLabel={`Débloquer ${administration.name}`}
                  accessibilityHint="Appuyez pour débloquer cette administration"
                  accessibilityRole="button"
                >
                  <Text style={styles.unlockButtonText}>Débloquer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        {isUnlockable && !administration.isUnlocked && (
          <View style={styles.unlockableBadge} accessibilityLabel="Débloquable">
            <Text style={styles.unlockableBadgeText}>!</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  activeContainer: {
    borderWidth: 3,
    borderColor: Colors.buttonPrimary,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  nameRow: {
    height: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.title,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  unlockTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  costContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  costText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginVertical: 2,
  },
  unlockButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  unlockButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  unlockableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockableBadgeText: {
    color: 'white',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
});
