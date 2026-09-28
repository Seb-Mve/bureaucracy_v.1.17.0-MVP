import React, { memo, useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useGameState, type Verdict } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import TamponSvg from '@/components/scene/TamponSvg';
import DossierCarte from '@/components/scene/DossierCarte';

const ILLUSTRATION = require('@/assets/carousel-images/administration_centrale_bureaucracy_carousel.png');

/** Durée de la descente du tampon jusqu'à l'impact (ms). */
const DESCENTE = 90;

/** Le dossier qui vient d'être tamponné : il reçoit l'empreinte puis quitte le bureau. */
const DossierSortant = memo(function DossierSortant({ verdict, numerote }: { verdict: Verdict; numerote: boolean }) {
  const opacite = useSharedValue(0);
  const x = useSharedValue(0);
  const sens = verdict.rejete ? -1 : 1;

  useEffect(() => {
    opacite.value = withSequence(
      withDelay(DESCENTE, withTiming(1, { duration: 0 })),
      withDelay(520, withTiming(0, { duration: 220 })),
    );
    x.value = withDelay(DESCENTE + 300, withTiming(sens * 230, { duration: 420, easing: Easing.in(Easing.quad) }));
  }, [opacite, x, sens]);

  const style = useAnimatedStyle(() => ({
    opacity: opacite.value,
    transform: [{ translateX: x.value }, { rotate: `${-3 + x.value / 25}deg` }],
  }));

  return (
    <Animated.View style={[styles.dossier, styles.sortant, style]} pointerEvents="none">
      <DossierCarte usager={verdict.usager} numerote={numerote} empreinte={verdict.rejete ? 'rejete' : 'accepte'} />
    </Animated.View>
  );
});

/** Scène du guichet : l'agent, le dossier sur le bureau et le tampon qui s'abat à chaque tap. */
export default function SceneGuichet() {
  const { tete, mods, verdict } = useGameState();
  const premier = tete[0] ?? null;

  const tampon = useSharedValue(0);
  const secousse = useSharedValue(0);

  useEffect(() => {
    if (!verdict) return;
    tampon.value = withSequence(
      withTiming(1, { duration: DESCENTE, easing: Easing.in(Easing.quad) }),
      withDelay(70, withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) })),
    );
    secousse.value = withSequence(
      withDelay(DESCENTE, withTiming(1, { duration: 40 })),
      withTiming(0, { duration: 160 }),
    );
  }, [verdict, tampon, secousse]);

  const styleTampon = useAnimatedStyle(() => ({
    transform: [
      { translateX: -tampon.value * 38 },
      { translateY: tampon.value * 38 },
      { rotate: `${12 - tampon.value * 12}deg` },
    ],
  }));
  const styleImage = useAnimatedStyle(() => ({
    transform: [{ translateY: secousse.value * 3 }, { scale: 1 + secousse.value * 0.012 }],
  }));

  let bulle = 'Personne au guichet. Pour l’instant.';
  if (premier) {
    bulle = mods.numerotation
      ? `Ticket n° ${premier.numero.toLocaleString('fr-FR')}`
      : `« ${premier.replique} »`;
  }

  return (
    <Panneau style={styles.cadre} contenuStyle={styles.contenu} rayon={18}>
      <Animated.View style={[StyleSheet.absoluteFill, styleImage]}>
        <Image
          source={ILLUSTRATION}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel="Le guichet 3 : un agent derrière son bureau, entouré de piles de dossiers"
        />
      </Animated.View>

      <View style={styles.bulle}>
        <Text style={styles.bulleTexte} numberOfLines={2}>
          {bulle}
        </Text>
      </View>

      <View style={styles.dossier} pointerEvents="none">
        <DossierCarte usager={premier} numerote={mods.numerotation} />
      </View>
      {verdict?.usager && <DossierSortant key={verdict.id} verdict={verdict} numerote={mods.numerotation} />}

      <Animated.View style={[styles.tampon, styleTampon]} pointerEvents="none">
        <TamponSvg taille={58} />
      </Animated.View>
    </Panneau>
  );
}

const styles = StyleSheet.create({
  cadre: {
    marginHorizontal: 12,
  },
  contenu: {
    height: 200,
    backgroundColor: '#FDE7B8',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bulle: {
    position: 'absolute',
    top: 8,
    left: 8,
    maxWidth: '64%',
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  bulleTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: 12,
    color: Colors.anthracite,
  },
  dossier: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  sortant: {
    zIndex: 2,
  },
  tampon: {
    position: 'absolute',
    bottom: 78,
    right: '14%',
    zIndex: 3,
  },
});
