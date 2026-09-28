import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Colors, { Fonts } from '@/constants/Colors';

interface BoutonPoussoirProps {
  libelle: string;
  onPress: () => void;
  couleur?: string;
  couleurOmbre?: string;
  couleurTexte?: string;
  hauteur?: number;
  taille?: number;
  desactive?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const BORD_BAS = 8;

/**
 * Bouton poussoir de la charte : contour anthracite, bord bas plus foncé
 * qui disparaît quand on appuie (le bouton s'enfonce).
 */
export default function BoutonPoussoir({
  libelle,
  onPress,
  couleur = Colors.encre,
  couleurOmbre = Colors.encreOmbre,
  couleurTexte = Colors.texteSurEncre,
  hauteur = 58,
  taille = 22,
  desactive = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: BoutonPoussoirProps) {
  const enfonce = useSharedValue(0);

  const surAppui = useCallback(() => {
    enfonce.value = withTiming(1, { duration: 60 });
  }, [enfonce]);
  const surRelache = useCallback(() => {
    enfonce.value = withSpring(0, { damping: 9, stiffness: 260 });
  }, [enfonce]);

  const styleFace = useAnimatedStyle(() => ({
    transform: [{ translateY: enfonce.value * (BORD_BAS - 3) }],
  }));

  const fond = desactive ? Colors.carton : couleur;
  const ombre = desactive ? Colors.crayonClair : couleurOmbre;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={surAppui}
      onPressOut={surRelache}
      disabled={desactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? libelle}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: desactive }}
      style={[styles.cadre, { height: hauteur, backgroundColor: ombre }, style]}
    >
      <Animated.View style={[styles.face, { backgroundColor: fond, height: hauteur - BORD_BAS }, styleFace]}>
        <Text
          style={[
            styles.libelle,
            { fontSize: taille, color: desactive ? Colors.crayon : couleurTexte, textShadowColor: ombre },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {libelle}
        </Text>
      </Animated.View>
      <View style={styles.contour} pointerEvents="none" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cadre: {
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  contour: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: Colors.anthracite,
  },
  libelle: {
    fontFamily: Fonts.titreGras,
    letterSpacing: 1,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
});
