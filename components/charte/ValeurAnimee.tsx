import React, { memo, useEffect, useRef } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { usePreferences } from '@/context/PreferencesContext';

interface ValeurAnimeeProps {
  texte: string;
  /** Change à chaque coup de tampon du joueur : la valeur réagit à ce moment-là seulement. */
  declencheur: number | null | undefined;
  /** « pop » : grossit puis revient. « baisse » : descend d'un cran (ce qui se consomme). */
  effet?: 'pop' | 'baisse';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  accessibilityLabel?: string;
}

/**
 * Un compteur qui réagit au geste du joueur, à sa place : c'est le retour
 * du coup de tampon (plus de nombres qui s'envolent du bouton).
 */
function ValeurAnimee({
  texte,
  declencheur,
  effet = 'pop',
  style,
  numberOfLines,
  adjustsFontSizeToFit,
  accessibilityLabel,
}: ValeurAnimeeProps) {
  const { reduireMouvement } = usePreferences();
  const v = useSharedValue(0);
  const precedent = useRef(declencheur);

  useEffect(() => {
    if (declencheur === precedent.current) return;
    precedent.current = declencheur;
    if (declencheur == null || reduireMouvement) return;
    v.value = withSequence(withTiming(1, { duration: 0 }), withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }));
  }, [declencheur, reduireMouvement, v]);

  const styleAnime = useAnimatedStyle(() =>
    effet === 'baisse' ? { transform: [{ translateY: -4 * v.value }] } : { transform: [{ scale: 1 + 0.16 * v.value }] },
  );

  return (
    <Animated.Text
      style={[style, styleAnime]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      accessibilityLabel={accessibilityLabel}
    >
      {texte}
    </Animated.Text>
  );
}

export default memo(ValeurAnimee);
