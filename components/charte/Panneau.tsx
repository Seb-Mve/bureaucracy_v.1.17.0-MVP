import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Colors, { Charte } from '@/constants/Colors';

interface PanneauProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Style du contenu (fond, padding…). */
  contenuStyle?: StyleProp<ViewStyle>;
  rayon?: number;
  ombre?: number;
  trait?: number;
}

/**
 * Carte de la charte : contour anthracite épais + ombre dure décalée.
 * L'ombre est une vue pleine décalée (rendu identique iOS / Android / web).
 */
export default function Panneau({
  children,
  style,
  contenuStyle,
  rayon = Charte.rayon,
  ombre = Charte.ombre,
  trait = Charte.trait,
}: PanneauProps) {
  return (
    <View style={[styles.conteneur, { marginRight: ombre, marginBottom: ombre }, style]}>
      <View
        style={[styles.ombre, { borderRadius: rayon, top: ombre, left: ombre, right: -ombre, bottom: -ombre }]}
      />
      <View style={[styles.contenu, { borderRadius: rayon, borderWidth: trait }, contenuStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    position: 'relative',
  },
  ombre: {
    position: 'absolute',
    backgroundColor: Colors.anthracite,
  },
  contenu: {
    backgroundColor: Colors.papier,
    borderColor: Colors.anthracite,
    overflow: 'hidden',
  },
});
