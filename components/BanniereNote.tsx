import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ScrollText } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';

/** Bandeau sur le guichet quand une note de service vient d'arriver. */
export default function BanniereNote() {
  const { notes } = useGameState();
  const router = useRouter();
  const nouvelle = [...notes].reverse().find((n) => n.nouvelle);
  if (!nouvelle) return null;

  return (
    <Pressable
      onPress={() => router.push('/notes')}
      style={({ pressed }) => [styles.banniere, pressed && styles.presse]}
      accessibilityRole="button"
      accessibilityLabel={`Nouvelle note de service : ${nouvelle.titre}. Ouvrir les notes.`}
    >
      <View style={styles.icone}>
        <ScrollText size={18} color={Colors.anthracite} />
      </View>
      <View style={styles.texte}>
        <Text style={styles.sur}>Nouvelle note de service n° {nouvelle.numero}</Text>
        <Text style={styles.titre} numberOfLines={1}>
          {nouvelle.titre}
        </Text>
      </View>
      <ChevronRight size={20} color={Colors.anthracite} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banniere: {
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFEAA7',
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 48,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  icone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papier,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: {
    flex: 1,
  },
  sur: {
    fontFamily: Fonts.texteGras,
    fontSize: 10,
    color: Colors.crayon,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: 14,
    color: Colors.anthracite,
  },
});
