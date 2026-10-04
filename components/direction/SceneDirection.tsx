import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Colors, { Charte } from '@/constants/Colors';
import ScenePixelDirection from '@/components/scene/ScenePixelDirection';
import { useGameState } from '@/context/GameStateContext';
import { usePreferences } from '@/context/PreferencesContext';

/**
 * La scène de la Direction, entière : le moteur cadre lui-même le bureau du chef et la salle derrière la vitre.
 * Rien n'est posé dessus.
 */
export default function SceneDirection() {
  const secousse = useSharedValue(0);
  const { reduireMouvement } = usePreferences();
  const { direction } = useGameState();

  const surImpact = useCallback(() => {
    if (reduireMouvement) return;
    // Retour visuel de la charte : l'écran tremble de 2 px.
    secousse.value = withSequence(
      withTiming(2, { duration: 30 }),
      withTiming(-2, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    );
  }, [secousse, reduireMouvement]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: secousse.value },
      { translateY: -secousse.value / 2 },
    ],
  }));

  return (
    <Animated.View style={[styles.cadre, style]}>
      <ScenePixelDirection nomService={direction?.nomService ?? 'La Direction'} onImpact={surImpact} />
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
