import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useGameState,
  type ProcAtelier,
  type ProcId,
} from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';

interface SelecteurProcedureProps {
  procedures: ProcAtelier[];
  choisie: ProcId;
  onChoisir: (p: ProcId) => void;
}

/** Sélecteur de l'Atelier : une procédure ouverte par onglet (la procédure choisie est enfoncée et en gras). */
export default function SelecteurProcedure({
  procedures,
  choisie,
  onChoisir,
}: SelecteurProcedureProps) {
  const { encre } = useGameState();
  return (
    <View style={styles.rangee} accessibilityRole="tablist">
      {procedures.map((p) => {
        const actif = p.id === choisie;
        return (
          <Pressable
            key={p.id}
            onPress={() => onChoisir(p.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: actif }}
            accessibilityLabel={p.nom}
            style={({ pressed }) => [
              styles.onglet,
              actif && styles.ongletActif,
              actif && {
                backgroundColor: encre.face,
                borderBottomColor: encre.flanc,
              },
              pressed && styles.presse,
            ]}
          >
            <Text
              style={[styles.texte, actif && styles.texteActif]}
              numberOfLines={2}
            >
              {p.nom}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rangee: {
    flexDirection: 'row',
    gap: Espace.s,
  },
  onglet: {
    flex: 1,
    minHeight: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papierChaud,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espace.xs,
    paddingVertical: Espace.xs,
  },
  ongletActif: {
    borderBottomWidth: Charte.trait + 2,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.anthracite,
    textAlign: 'center',
  },
  texteActif: {
    fontFamily: Fonts.texteGras,
  },
});
