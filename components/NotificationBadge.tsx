import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';

/** Pastille de nouveauté (onglets, enveloppe du courrier). */
export default function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge} accessibilityLabel={`${count} nouveau${count > 1 ? 'x' : ''}`}>
      <Text style={styles.texte}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colors.rouge,
    borderRadius: Charte.rayonPetit,
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Espace.xs,
    zIndex: 1,
  },
  texte: {
    color: Colors.papier,
    fontSize: Typo.micro,
    fontFamily: Fonts.texteGras,
  },
});
