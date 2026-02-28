import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text, Animated, AppState } from 'react-native';
import { Lock } from 'lucide-react-native';
import { Administration } from '@/types/game';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

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

  const breathAnim = useSharedValue(1);
  const panAnim = useSharedValue(0);
  const nameOpacity = useSharedValue(1);
  const nameTranslateY = useSharedValue(0);
  const isFirstRenderRef = useRef(true);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathAnim.value }],
  }));

  const panStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panAnim.value }],
  }));

  const nameAnimStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }));

  useEffect(() => {
    if (isActive) {
      breathAnim.value = withRepeat(withTiming(1.008, { duration: 1250 }), -1, true);
    } else {
      cancelAnimation(breathAnim);
      breathAnim.value = withTiming(1.0, { duration: 200 });
    }
  }, [isActive, breathAnim]);

  useEffect(() => {
    if (isActive && administration.isUnlocked) {
      panAnim.value = withRepeat(withTiming(-8, { duration: 3500 }), -1, true);
    } else {
      cancelAnimation(panAnim);
      panAnim.value = withTiming(0, { duration: 300 });
    }
  }, [isActive, administration.isUnlocked, panAnim]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isActive) {
      nameOpacity.value = 0;
      nameTranslateY.value = 6;
      nameOpacity.value = withTiming(1, { duration: 180 });
      nameTranslateY.value = withTiming(0, { duration: 180 });
    }
  }, [isActive, nameOpacity, nameTranslateY]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && isActive) {
        if (administration.isUnlocked) {
          panAnim.value = withRepeat(withTiming(-8, { duration: 3500 }), -1, true);
        }
        breathAnim.value = withRepeat(withTiming(1.008, { duration: 1250 }), -1, true);
      }
    });
    return () => sub.remove();
  }, [isActive, administration.isUnlocked, breathAnim, panAnim]);

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
    <Reanimated.View style={breathStyle}>
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
          <Reanimated.View style={[styles.imageWrapper, panStyle]}>
            <Image
              source={administration.imagePath}
              style={styles.image}
            />
          </Reanimated.View>

          <View style={styles.nameRow}>
            <Reanimated.View style={nameAnimStyle}>
              <Text style={styles.nameText} numberOfLines={1}>{administration.name}</Text>
            </Reanimated.View>
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
    </Reanimated.View>
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
  imageWrapper: {
    width: '115%',
    alignSelf: 'center',
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
