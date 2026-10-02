import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useLargeur } from '@/components/charte/useLargeur';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';

interface BoutonPoussoirProps {
  libelle: string;
  onPress: () => void;
  couleur?: string;
  couleurOmbre?: string;
  couleurTexte?: string;
  /** Hauteur totale, flanc compris. */
  hauteur?: number;
  taille?: number;
  desactive?: boolean;
  /** Maintenu enfoncé, le bouton répète l'action (premier coup immédiat). */
  repetition?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const TRAIT = 3;
/** Largeur moyenne d'une capitale en Fredoka gras, en fraction de la taille (estimation prudente). */
const CHASSE = 0.74;
/** Espacement des lettres du libellé (pt). */
const INTERLETTRE = 2;
/** Avant de répéter, le doigt doit rester posé ce temps (ms). */
const DELAI_REPETITION = 400;
/** Une répétition toutes les… (ms) : 3 coups/s, le rythme d'un joueur qui tape normalement. */
const PERIODE_REPETITION = 333;

/**
 * Bouton poussoir de la charte : une face posée sur un socle plus sombre.
 * Le flanc visible donne le relief ; à l'appui, la face descend jusqu'au socle.
 */
export default function BoutonPoussoir({
  libelle,
  onPress,
  couleur = Colors.encre,
  couleurOmbre = Colors.encreFlanc,
  couleurTexte = Colors.anthracite,
  hauteur = 66,
  taille = Typo.grand,
  desactive = false,
  repetition = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: BoutonPoussoirProps) {
  const course = hauteur >= 60 ? 10 : 7;
  // Le libellé tient toujours sur une ligne : on réduit la taille s'il serait trop large
  // (adjustsFontSizeToFit n'existe pas sur le web).
  const { ref: refSocle, largeur, surLayout } = useLargeur();
  const place = largeur - 2 * 12 - 2 * TRAIT;
  const estime = libelle.length * (taille * CHASSE + INTERLETTRE);
  const tailleAjustee = largeur > 0 && estime > place ? Math.max(11, Math.floor((taille * place) / estime)) : taille;
  const enfonce = useSharedValue(0);
  const action = useRef(onPress);
  action.current = onPress;
  const minuteur = useRef<ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | null>(null);
  /** L'appui a déjà déclenché l'action (mode répétition) : le relâcher ne la refait pas. */
  const dejaFait = useRef(false);

  const arreter = useCallback(() => {
    if (minuteur.current !== null) {
      clearTimeout(minuteur.current as ReturnType<typeof setTimeout>);
      clearInterval(minuteur.current as ReturnType<typeof setInterval>);
      minuteur.current = null;
    }
  }, []);
  useEffect(() => arreter, [arreter]);
  useEffect(() => {
    if (desactive) arreter();
  }, [desactive, arreter]);

  const surAppui = useCallback(() => {
    enfonce.value = withTiming(1, { duration: 40 });
    if (!repetition) return;
    dejaFait.current = true;
    action.current();
    arreter();
    minuteur.current = setTimeout(() => {
      minuteur.current = setInterval(() => action.current(), PERIODE_REPETITION);
    }, DELAI_REPETITION);
  }, [enfonce, repetition, arreter]);

  const surRelache = useCallback(() => {
    enfonce.value = withTiming(0, { duration: 140, easing: Easing.out(Easing.cubic) });
    arreter();
  }, [enfonce, arreter]);

  const surPress = useCallback(() => {
    // Lecteur d'écran ou clavier : pas d'appui préalable, l'action part ici.
    if (repetition && dejaFait.current) {
      dejaFait.current = false;
      return;
    }
    action.current();
  }, [repetition]);

  const styleFace = useAnimatedStyle(() => ({
    transform: [{ translateY: enfonce.value * (course - 1) }],
  }));
  const styleReflet = useAnimatedStyle(() => ({ opacity: 1 - enfonce.value * 0.7 }));

  const fond = desactive ? Colors.carton : couleur;
  const flanc = desactive ? Colors.crayonClair : couleurOmbre;

  return (
    <Pressable
      onPress={surPress}
      onPressIn={surAppui}
      onPressOut={surRelache}
      disabled={desactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? libelle}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: desactive }}
      style={[styles.cadre, { height: hauteur }, style]}
    >
      {/* Le socle (une View simple, pleine largeur) sert à mesurer la place du libellé. */}
      <View ref={refSocle} style={[styles.socle, { top: course, backgroundColor: flanc }]} onLayout={surLayout} />
      <Animated.View style={[styles.face, { height: hauteur - course, backgroundColor: fond }, styleFace]}>
        <Animated.View style={[styles.reflet, styleReflet]} pointerEvents="none" />
        <Text
          style={[styles.libelle, { fontSize: tailleAjustee, color: desactive ? Colors.crayon : couleurTexte }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {libelle}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cadre: {
    position: 'relative',
  },
  socle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Charte.rayon,
    borderWidth: TRAIT,
    borderBottomWidth: TRAIT + 2,
    borderColor: Colors.anthracite,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: Charte.rayon,
    borderWidth: TRAIT,
    borderColor: Colors.anthracite,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espace.m,
  },
  reflet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.reflet,
  },
  libelle: {
    fontFamily: Fonts.titreGras,
    letterSpacing: INTERLETTRE,
  },
});
