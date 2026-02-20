/**
 * FloatingText Component
 * 
 * Animated "+X" text that floats up and fades out
 * Used for visual feedback when prestige click multiplier is active
 */

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

interface FloatingTextProps {
  text: string;
  x: number;
  y: number;
  onComplete?: () => void;
}

export default function FloatingText({ text, x, y, onComplete }: FloatingTextProps) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  
  useEffect(() => {
    // Animate opacity: 1 → 1 (hold) → 0
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
    
    // Animate translateY: 0 → -50
    translateY.value = withTiming(-50, {
      duration: 1000,
      easing: Easing.out(Easing.cubic)
    }, (finished) => {
      'worklet';
      if (finished && onComplete) {
        onComplete();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return (
    <Animated.View
      style={[
        styles.container,
        { position: 'absolute', left: x, top: y },
        animatedStyle
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
