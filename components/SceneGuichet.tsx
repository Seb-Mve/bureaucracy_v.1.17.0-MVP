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
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import {
  BRAS_CONTOUR_GUICHET,
  BRAS_GUICHET,
  FOND_GUICHET,
  LEVEE,
  cadrerIllustration,
} from '@/components/scene/illustration';

/** Hauteur de la scène (pt). */
const HAUTEUR_SCENE = 200;
/** Durée de la levée du bras (ms). */
const LEVEE_MS = 80;
/** Durée de la descente du tampon jusqu'à l'impact (ms). */
const DESCENTE = 90;
/** Instant de l'impact sur le papier (ms). */
const IMPACT = LEVEE_MS + DESCENTE;
/** Durée pendant laquelle l'empreinte reste visible avant de s'effacer (ms). */
const EMPREINTE_VISIBLE = 450;
/** Taille de l'empreinte (pt). */
const EMPREINTE = { largeur: 64, hauteur: 20 };

interface Position {
  left: number;
  top: number;
}

/** Empreinte ACCEPTÉ / REJETÉ laissée sur le papier du bureau par le tampon. */
const Empreinte = memo(function Empreinte({ rejete, position }: { rejete: boolean; position: Position }) {
  const opacite = useSharedValue(0);
  const echelle = useSharedValue(1.4);

  useEffect(() => {
    opacite.value = withSequence(
      withDelay(IMPACT, withTiming(1, { duration: 0 })),
      withDelay(EMPREINTE_VISIBLE, withTiming(0, { duration: 250 })),
    );
    echelle.value = withDelay(IMPACT, withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }));
  }, [opacite, echelle]);

  const style = useAnimatedStyle(() => ({
    opacity: opacite.value,
    transform: [{ rotate: '-14deg' }, { scale: echelle.value }],
  }));

  return (
    <Animated.View
      style={[styles.empreinte, rejete ? styles.rejet : styles.accepte, position, style]}
      pointerEvents="none"
    >
      <Text style={[styles.empreinteTexte, rejete ? styles.rejetTexte : styles.accepteTexte]}>
        {rejete ? 'REJETÉ' : 'ACCEPTÉ'}
      </Text>
    </Animated.View>
  );
});

/** Scène du guichet : l'agent tamponne le dossier posé sur son bureau à chaque tap. */
export default function SceneGuichet() {
  const { tete, mods, verdict } = useGameState();
  const premier = tete[0] ?? null;

  const [largeur, setLargeur] = useState(0);
  const surLayout = useCallback((e: LayoutChangeEvent) => setLargeur(e.nativeEvent.layout.width), []);
  const cadres = useMemo(() => cadrerIllustration(largeur, HAUTEUR_SCENE), [largeur]);
  const positionEmpreinte = useMemo<Position>(
    () => ({ left: cadres.empreinte.x - EMPREINTE.largeur / 2, top: cadres.empreinte.y - EMPREINTE.hauteur / 2 }),
    [cadres],
  );

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
  // Le contour du dessous n'existe pas sur l'illustration : il n'apparaît que bras levé.
  const styleContour = useAnimatedStyle(() => ({ opacity: Math.min(1, bras.value * 4) }));
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

      {largeur > 0 && verdict && <Empreinte key={verdict.id} rejete={verdict.rejete} position={positionEmpreinte} />}

      {largeur > 0 && (
        <Animated.View style={[styles.calque, styles.bras, cadres.bras, styleBras]}>
          <Image source={BRAS_GUICHET} style={styles.plein} />
          <Animated.Image source={BRAS_CONTOUR_GUICHET} style={[styles.plein, styleContour]} />
        </Animated.View>
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
  bras: {
    zIndex: 3,
  },
  plein: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  empreinte: {
    position: 'absolute',
    zIndex: 2,
    width: EMPREINTE.largeur,
    height: EMPREINTE.hauteur,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  rejet: {
    borderColor: Colors.rouge,
  },
  accepte: {
    borderColor: Colors.vertEncre,
  },
  empreinteTexte: {
    fontFamily: Fonts.titreGras,
    fontSize: 11,
    letterSpacing: 1,
  },
  rejetTexte: {
    color: Colors.rouge,
  },
  accepteTexte: {
    color: Colors.vertEncre,
  },
});
