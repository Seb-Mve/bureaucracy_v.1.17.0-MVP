import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Colors, { Charte } from '@/constants/Colors';
import ScenePixel from '@/components/scene/ScenePixel';
import BulleGuichet from '@/components/guichet/BulleGuichet';
import FilScene from '@/components/guichet/FilScene';
import PuceFlux from '@/components/guichet/PuceFlux';
import { usePreferences } from '@/context/PreferencesContext';

/**
 * La scène du guichet occupe tout le milieu de l'écran : la file elle-même,
 * l'agent qui tamponne, et, épinglés dessus, la bulle de l'usager, le fil
 * (note ou ordre du jour) et la demande.
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
      <BulleGuichet />
      <FilScene />
      <PuceFlux />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 12,
    marginTop: 8,
    overflow: 'hidden',
    backgroundColor: Colors.creme,
    borderWidth: Charte.trait,
    borderColor: Colors.anthracite,
    borderRadius: 18,
  },
});
