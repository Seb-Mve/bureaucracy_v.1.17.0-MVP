import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Colors, { Charte } from '@/constants/Colors';
import ScenePixel from '@/components/scene/ScenePixel';
import { usePreferences } from '@/context/PreferencesContext';

/**
 * La scène du guichet, entière : le moteur cadre lui-même le monde dans la zone (mur, fenêtre,
 * file et agent), sans zoom supplémentaire. Rien n'est posé dessus.
 */
export default function SceneGuichet() {
  const secousse = useSharedValue(0);
  const { reduireMouvement } = usePreferences();

  const surImpact = useCallback(() => {
    if (reduireMouvement) return;
    // Retour visuel de la charte : l'écran tremble de 2 px.
    secousse.value = withSequence(withTiming(2, { duration: 30 }), withTiming(-2, { duration: 40 }), withTiming(0, { duration: 40 }));
  }, [secousse, reduireMouvement]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: secousse.value }, { translateY: -secousse.value / 2 }] }));

  return (
    <Animated.View style={[styles.cadre, style]}>
      <ScenePixel onImpact={surImpact} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: Colors.creme,
    borderTopWidth: Charte.trait,
    borderBottomWidth: Charte.trait,
    borderColor: Colors.anthracite,
  },
});
