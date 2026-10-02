import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatEuros, formatMontant } from '@/utils/formatters';

/**
 * Bandeau qui suit un achat : ce qui vient d'être acheté et, quelques secondes,
 * de quoi revenir en arrière (remboursement complet).
 */
export default function BandeauAnnulation({ style }: { style?: StyleProp<ViewStyle> }) {
  const { dernierAchat, annulerDernierAchat } = useGameState();
  if (!dernierAchat) return null;

  return (
    <View style={[styles.bandeau, style]} accessibilityLiveRegion="polite">
      {/* Le montant passe d'abord et ne se coupe jamais : seul le libellé peut céder la place. */}
      {dernierAchat.budget > 0 && <Text style={styles.montant}>−{formatMontant(dernierAchat.budget)}</Text>}
      <Text style={styles.texte} numberOfLines={1}>
        {dernierAchat.libelle}
      </Text>
      <Pressable
        onPress={annulerDernierAchat}
        style={({ pressed }) => [styles.annuler, pressed && styles.presse]}
        accessibilityRole="button"
        accessibilityLabel={`Annuler : ${dernierAchat.libelle}${dernierAchat.budget > 0 ? `, remboursement de ${formatEuros(dernierAchat.budget)} euros` : ''}`}
      >
        <Text style={styles.annulerTexte}>Annuler</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
    backgroundColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingLeft: Espace.m,
    paddingRight: Espace.xs,
    paddingVertical: Espace.xs,
    minHeight: 52,
  },
  montant: {
    flexShrink: 0,
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.papierChaud,
  },
  texte: {
    flex: 1,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.papierChaud,
  },
  annuler: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Espace.m,
    borderRadius: Charte.rayonPetit,
    backgroundColor: Colors.papierChaud,
  },
  presse: {
    opacity: 0.7,
  },
  annulerTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
});
