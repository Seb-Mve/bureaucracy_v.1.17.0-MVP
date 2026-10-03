import React, { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';

interface BoutonAchatProps {
  libelle: string;
  actif: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Se partage la largeur avec ses voisins (achats en lot). */
  large?: boolean;
  /** Seconde ligne (prix du lot). */
  detail?: string;
}

/** Bouton vert d'achat du Service (×1, ×10, Max) ; gris quand le budget ne suffit pas. */
const BoutonAchat = memo(function BoutonAchat({
  libelle,
  actif,
  onPress,
  accessibilityLabel,
  large,
  detail,
}: BoutonAchatProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!actif}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !actif }}
      style={({ pressed }) => [
        styles.achat,
        large && styles.achatLarge,
        actif ? styles.achatActif : styles.achatInactif,
        pressed && styles.achatPresse,
      ]}
    >
      <Text
        style={[styles.achatTexte, !actif && styles.achatTexteInactif]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {libelle}
      </Text>
      {detail !== undefined && (
        <Text
          style={[styles.achatDetail, !actif && styles.achatTexteInactif]}
          numberOfLines={2}
        >
          {detail}
        </Text>
      )}
    </Pressable>
  );
});

export default BoutonAchat;

const styles = StyleSheet.create({
  achat: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espace.s,
  },
  achatLarge: {
    flex: 1,
    minWidth: 0,
  },
  achatActif: {
    backgroundColor: Colors.vert,
  },
  achatInactif: {
    backgroundColor: Colors.carton,
  },
  achatPresse: {
    transform: [{ translateY: 2 }],
  },
  achatTexte: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  achatDetail: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.petit,
    textAlign: 'center',
    color: Colors.anthracite,
  },
  achatTexteInactif: {
    color: Colors.crayon,
  },
});
