import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import Colors from '@/constants/Colors';

interface JaugeHachureeProps {
  /** Remplissage de 0 à 1. */
  valeur: number;
  couleur: string;
  couleurClaire: string;
  hauteur?: number;
  /** Identifiant unique du motif SVG (plusieurs jauges par écran). */
  motif: string;
  accessibilityLabel?: string;
}

/** Jauge épaisse et hachurée de la charte (« chunky »). */
function JaugeHachuree({
  valeur,
  couleur,
  couleurClaire,
  hauteur = 18,
  motif,
  accessibilityLabel,
}: JaugeHachureeProps) {
  const v = Math.max(0, Math.min(1, valeur));
  return (
    <View
      style={[styles.cadre, { height: hauteur, borderRadius: hauteur / 2 }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
    >
      <View style={[styles.remplissage, { width: `${v * 100}%` }, v > 0 && v < 1 && styles.bord]}>
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id={motif} patternUnits="userSpaceOnUse" width={12} height={12} patternTransform="rotate(45)">
              <Rect width={12} height={12} fill={couleurClaire} />
              <Line x1={3} y1={0} x2={3} y2={12} stroke={couleur} strokeWidth={6} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${motif})`} />
        </Svg>
      </View>
    </View>
  );
}

export default memo(JaugeHachuree);

const styles = StyleSheet.create({
  cadre: {
    borderWidth: 2,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papier,
    overflow: 'hidden',
  },
  remplissage: {
    height: '100%',
  },
  bord: {
    borderRightWidth: 2,
    borderRightColor: Colors.anthracite,
  },
});
