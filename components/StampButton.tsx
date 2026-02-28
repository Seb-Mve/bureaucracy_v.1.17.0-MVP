import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Platform, View } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { formatNumberFrench } from '@/utils/formatters';

// Angles en étoile à 5 branches (pré-calculés au niveau module)
const PARTICLE_ANGLES = [0, 72, 144, 216, 288].map(d => (d * Math.PI) / 180);

interface StampButtonProps {
  onTap?: () => void;
}

interface FloatingNumberProps {
  value: number;
  onDone: () => void;
}

function FloatingNumber({ value, onDone }: FloatingNumberProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const xOffset = useRef(Math.random() * 30 - 15).current;
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    translateY.value = withTiming(-60, { duration: 700 });
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 600 })
    );
    const t = setTimeout(() => onDoneRef.current(), 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: xOffset }],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.Text pointerEvents="none" style={[styles.floatText, style]}>
      +{formatNumberFrench(value)}
    </Reanimated.Text>
  );
}

type FloatEntry = { key: number; value: number };

export default function StampButton({ onTap }: StampButtonProps) {
  const { incrementResource, dossierClickMultiplier } = useGameState();

  // Animation principale bouton (Reanimated v3 — translateY)
  const pressAnim = useSharedValue(0);

  // Pool de 5 particules RN Animated (pré-alloué)
  const particles = useRef(
    PARTICLE_ANGLES.map(() => ({
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      op: new Animated.Value(0),
    }))
  ).current;

  // Floating numbers
  const [activeFloats, setActiveFloats] = useState<FloatEntry[]>([]);
  const floatKeyRef = useRef(0);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressAnim.value }],
  }));

  const fireParticles = useCallback(() => {
    particles.forEach((p, i) => {
      const dist = 40 + Math.random() * 30;
      const angle = PARTICLE_ANGLES[i];
      p.tx.setValue(0);
      p.ty.setValue(0);
      p.op.setValue(1);
      Animated.parallel([
        Animated.timing(p.tx, { toValue: Math.cos(angle) * dist, duration: 450, useNativeDriver: true }),
        Animated.timing(p.ty, { toValue: Math.sin(angle) * dist, duration: 450, useNativeDriver: true }),
        Animated.timing(p.op, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    });
  }, [particles]);

  const addFloat = useCallback((value: number) => {
    setActiveFloats(prev => {
      if (prev.length >= 5) return prev;
      return [...prev, { key: floatKeyRef.current++, value }];
    });
  }, []);

  const removeFloat = useCallback((key: number) => {
    setActiveFloats(prev => prev.filter(f => f.key !== key));
  }, []);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    pressAnim.value = withSequence(
      withTiming(4, { duration: 80 }),
      withSpring(0, { damping: 6, stiffness: 200 })
    );
    fireParticles();
    addFloat(dossierClickMultiplier);
    incrementResource('dossiers', 1);
    onTap?.();
  }, [pressAnim, fireParticles, addFloat, dossierClickMultiplier, incrementResource, onTap]);

  return (
    <View style={styles.container}>
      {/* Particules d'encre — positionnées absolument, non-interactives */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              transform: [{ translateX: p.tx }, { translateY: p.ty }],
              opacity: p.op,
            },
          ]}
        />
      ))}

      {/* Floating +N */}
      {activeFloats.map(f => (
        <FloatingNumber
          key={f.key}
          value={f.value}
          onDone={() => removeFloat(f.key)}
        />
      ))}

      {/* Bouton tampon — 3 couches visuelles */}
      <View style={styles.bottomShadow}>
        <View style={styles.middleShadow}>
          <Reanimated.View style={[styles.buttonContainer, animatedButtonStyle]}>
            <TouchableOpacity
              style={styles.button}
              onPress={handlePress}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel="Tamponner un dossier"
              accessibilityHint="Appuyez pour tamponner un dossier et gagner une ressource"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>TAMPONNER</Text>
            </TouchableOpacity>
          </Reanimated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  particle: {
    position: 'absolute',
    alignSelf: 'center',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.resourceDossiers,
  },
  floatText: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.resourceDossiers,
  },
  bottomShadow: {
    backgroundColor: '#c27c43',
    borderRadius: 12,
    padding: 6,
    width: '75%',
    maxWidth: 300,
  },
  middleShadow: {
    backgroundColor: '#d68d54',
    borderRadius: 10,
    padding: 4,
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#ecb376',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#f2c08a',
    borderBottomColor: '#e5a96b',
    borderRightColor: '#e5a96b',
  },
  buttonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    letterSpacing: 1,
  },
});
