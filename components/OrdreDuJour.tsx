import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ClipboardList } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';

/** Bandeau du guichet : la prochaine chose à faire, une seule à la fois. */
export default function OrdreDuJour() {
  const { consigne } = useGameState();
  const router = useRouter();
  if (!consigne) return null;

  const { texte, progression, onglet } = consigne;
  const suffixe = progression ? ` (${Math.min(progression.valeur, progression.cible)} / ${progression.cible})` : '';

  return (
    <Pressable
      onPress={onglet ? () => router.push(onglet === 'notes' ? '/notes' : '/recruitment') : undefined}
      disabled={!onglet}
      style={({ pressed }) => [styles.bandeau, pressed && styles.presse]}
      accessibilityRole={onglet ? 'button' : 'text'}
      accessibilityLabel={`Ordre du jour : ${texte}${suffixe}`}
    >
      <View style={styles.icone}>
        <ClipboardList size={16} color={Colors.anthracite} />
      </View>
      <View style={styles.texte}>
        <Text style={styles.sur}>ORDRE DU JOUR</Text>
        <Text style={styles.consigne}>
          {texte}
          {suffixe}
        </Text>
      </View>
      {onglet && <ChevronRight size={18} color={Colors.anthracite} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 44,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  icone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.encreFond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: {
    flex: 1,
  },
  sur: {
    fontFamily: Fonts.texteGras,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.encreTexte,
  },
  consigne: {
    fontFamily: Fonts.texteGras,
    fontSize: 13,
    color: Colors.anthracite,
  },
});
