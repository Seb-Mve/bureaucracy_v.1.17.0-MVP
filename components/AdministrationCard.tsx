import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';
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

  const handleUnlock = () => {
    if (isUnlockable) {
      unlockAdministration(administration.id);
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

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isActive && styles.activeContainer,
      ]}
      onPress={administration.isUnlocked ? onPress : undefined}
      activeOpacity={0.8}
    >
      <Image 
        source={administration.imagePath}
        style={styles.image}
      />
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
              >
                <Text style={styles.unlockButtonText}>Débloquer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 200,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  activeContainer: {
    borderWidth: 3,
    borderColor: Colors.buttonPrimary,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(2px)',
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
});