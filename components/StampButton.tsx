import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';

export default function StampButton() {
  const { incrementResource } = useGameState();
  const [scale] = useState(new Animated.Value(1));

  const handlePress = () => {
    // Trigger haptic feedback on mobile
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animate button press with more pronounced effect
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Increment the dossier resource
    incrementResource('dossiers', 1);
  };

  return (
    <View style={styles.container}>
      {/* Bottom shadow layer */}
      <View style={styles.bottomShadow}>
        {/* Middle shadow layer */}
        <View style={styles.middleShadow}>
          {/* Top button container */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [{ scale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={handlePress}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>TAMPONNER</Text>
            </TouchableOpacity>
          </Animated.View>
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