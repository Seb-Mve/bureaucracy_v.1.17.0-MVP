import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';

/**
 * Un seul emplacement pour ce qui réclame l'attention, épinglé sur la scène :
 * une nouvelle note de service, sinon l'ordre du jour.
 */
export default function FilScene() {
  const { notes, consigne } = useGameState();
  const router = useRouter();
  const note = [...notes].reverse().find((n) => n.nouvelle);

  let sur: string;
  let texte: string;
  let onglet: 'notes' | 'recruitment' | undefined;
  if (note) {
    sur = `NOUVELLE NOTE N° ${note.numero}`;
    texte = note.titre;
    onglet = 'notes';
  } else if (consigne) {
    const p = consigne.progression;
    sur = 'ORDRE DU JOUR';
    texte = consigne.texte + (p ? ` (${Math.min(p.valeur, p.cible)} / ${p.cible})` : '');
    onglet = consigne.onglet ?? undefined;
  } else {
    return null;
  }

  return (
    <Pressable
      onPress={onglet ? () => router.push(onglet === 'notes' ? '/notes' : '/recruitment') : undefined}
      disabled={!onglet}
      style={({ pressed }) => [styles.fil, note && styles.note, pressed && styles.presse]}
      accessibilityRole={onglet ? 'button' : 'text'}
      accessibilityLabel={`${sur} : ${texte}`}
    >
      <Text style={styles.sur}>{sur}</Text>
      <Text style={styles.texte} numberOfLines={3}>
        {texte}
        {onglet ? ' ›' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fil: {
    position: 'absolute',
    top: 8,
    right: 8,
    maxWidth: '42%',
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '1.5deg' }],
    shadowColor: Colors.anthracite,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  note: {
    backgroundColor: Colors.encreFond,
  },
  presse: {
    transform: [{ rotate: '1.5deg' }, { translateY: 2 }],
  },
  sur: {
    fontFamily: Fonts.texteGras,
    fontSize: 8.5,
    letterSpacing: 0.4,
    color: Colors.encreTexte,
  },
  texte: {
    fontFamily: Fonts.texteGras,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.anthracite,
  },
});
