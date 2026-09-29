import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
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
import DossierCarte from '@/components/scene/DossierCarte';
import { BRAS_GUICHET, FOND_GUICHET, LEVEE, cadrerIllustration } from '@/components/scene/illustration';

/** Hauteur de la scène (pt). */
const HAUTEUR_SCENE = 200;
/** Durée de la levée du bras (ms). */
const LEVEE_MS = 80;
/** Durée de la descente du tampon jusqu'à l'impact (ms). */
const DESCENTE = 90;
/** Instant de l'impact sur le dossier (ms). */
const IMPACT = LEVEE_MS + DESCENTE;

/** Le dossier qui vient d'être tamponné : il reçoit l'empreinte puis quitte le bureau. */
const DossierSortant = memo(function DossierSortant({ verdict, numerote }: { verdict: Verdict; numerote: boolean }) {
  const opacite = useSharedValue(0);
  const x = useSharedValue(0);
  const sens = verdict.rejete ? -1 : 1;

  useEffect(() => {
    opacite.value = withSequence(
      withDelay(IMPACT, withTiming(1, { duration: 0 })),
      withDelay(520, withTiming(0, { duration: 220 })),
    );
    x.value = withDelay(IMPACT + 300, withTiming(sens * 230, { duration: 420, easing: Easing.in(Easing.quad) }));
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

/** Scène du guichet : l'agent, le dossier sur le bureau et le bras qui tamponne à chaque tap. */
export default function SceneGuichet() {
  const { tete, mods, verdict } = useGameState();
  const premier = tete[0] ?? null;

  const [largeur, setLargeur] = useState(0);
  const surLayout = useCallback((e: LayoutChangeEvent) => setLargeur(e.nativeEvent.layout.width), []);
  const cadres = useMemo(() => cadrerIllustration(largeur, HAUTEUR_SCENE), [largeur]);

  /** 0 = bras posé sur le dossier, 1 = bras levé. */
  const bras = useSharedValue(0);
  const secousse = useSharedValue(0);

  useEffect(() => {
    if (!verdict) return;
    bras.value = withSequence(
      withTiming(1, { duration: LEVEE_MS, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: DESCENTE, easing: Easing.in(Easing.quad) }),
    );
    secousse.value = withSequence(
      withDelay(IMPACT, withTiming(1, { duration: 40 })),
      withTiming(0, { duration: 160 }),
    );
  }, [verdict, bras, secousse]);

  const echelle = cadres.echelle;
  const styleBras = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bras.value * LEVEE.remontee * echelle + secousse.value * 3 },
      { rotate: `${-bras.value * LEVEE.angle}deg` },
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
      <Animated.View style={[StyleSheet.absoluteFill, styleImage]} onLayout={surLayout}>
        {largeur > 0 && (
          <Image
            source={FOND_GUICHET}
            style={[styles.calque, cadres.fond]}
            accessibilityLabel="Le guichet 3 : un agent derrière son bureau, entouré de piles de dossiers"
          />
        )}
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

      {largeur > 0 && (
        <Animated.Image
          source={BRAS_GUICHET}
          style={[styles.calque, cadres.bras, styleBras]}
        />
      )}
    </Panneau>
  );
}

const styles = StyleSheet.create({
  cadre: {
    marginHorizontal: 12,
  },
  contenu: {
    height: HAUTEUR_SCENE,
    backgroundColor: '#FDE7B8',
  },
  calque: {
    position: 'absolute',
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
});
