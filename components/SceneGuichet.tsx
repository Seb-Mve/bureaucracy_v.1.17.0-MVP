import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Colors, { Charte } from '@/constants/Colors';
import ScenePixel from '@/components/scene/ScenePixel';
import PuceFlux from '@/components/guichet/PuceFlux';
import { usePreferences } from '@/context/PreferencesContext';

/** Largeur du monde que le moteur montre quand on lui donne la zone ci-dessous (px de la scène). */
const LARGEUR_MONDE = 126;
/** Hauteur complète du monde dessiné (px de la scène). */
const HAUTEUR_MONDE = 112;
/** Hauteur de monde à garder visible : de l'agent derrière sa vitre jusqu'aux pieds de la file. */
const HAUTEUR_ACTION = 68;
/** Agrandissement maximal par rapport au cadrage « largeur entière ». */
const ZOOM_MAX = 1.3;
/** Part du débord rognée à gauche (la queue de la file) plutôt qu'à droite (le guichet). */
const ROGNAGE_GAUCHE = 0.6;

/**
 * Caméra serrée : on fait dessiner le moteur sur une zone plus grande que l'écran,
 * à l'échelle qui fait tenir l'action dans la hauteur disponible, puis on n'en montre
 * que le bas, côté guichet. Le moteur reste inchangé : il voit simplement une grande zone.
 */
function cadrer(largeur: number, hauteur: number) {
  const echelle = Math.min(Math.max(hauteur / HAUTEUR_ACTION, largeur / LARGEUR_MONDE), (largeur * ZOOM_MAX) / LARGEUR_MONDE);
  const width = Math.round(LARGEUR_MONDE * echelle);
  const height = Math.round(Math.max(hauteur, HAUTEUR_MONDE * echelle));
  return { width, height, left: -Math.round((width - largeur) * ROGNAGE_GAUCHE), top: hauteur - height };
}

/** La scène du guichet, cadrée sur la file et l'agent qui tamponne. Rien n'est posé dessus, sauf le débit. */
export default function SceneGuichet() {
  const secousse = useSharedValue(0);
  const { reduireMouvement } = usePreferences();
  const [zone, setZone] = useState({ largeur: 0, hauteur: 0 });

  const surLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setZone((z) => (z.largeur === width && z.hauteur === height ? z : { largeur: width, hauteur: height }));
  }, []);
  const camera = useMemo(() => cadrer(zone.largeur, zone.hauteur), [zone]);

  const surImpact = useCallback(() => {
    if (reduireMouvement) return;
    // Retour visuel de la charte : l'écran tremble de 2 px.
    secousse.value = withSequence(withTiming(2, { duration: 30 }), withTiming(-2, { duration: 40 }), withTiming(0, { duration: 40 }));
  }, [secousse, reduireMouvement]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: secousse.value }, { translateY: -secousse.value / 2 }] }));

  return (
    <Animated.View style={[styles.cadre, style]} onLayout={surLayout}>
      {zone.largeur > 0 && zone.hauteur > 0 && (
        <View style={[styles.camera, camera]}>
          <ScenePixel onImpact={surImpact} />
        </View>
      )}
      <PuceFlux />
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
  camera: {
    position: 'absolute',
  },
});
