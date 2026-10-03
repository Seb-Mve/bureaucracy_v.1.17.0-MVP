import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameState, type Exemplaires } from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';

const VALEURS: Exemplaires[] = [1, 2, 3];

/** Curseur Exemplaires exigés (note n° 5 de l'acte II) : trois crans, ×1 à ×3. */
export default function CurseurExemplaires() {
  const { direction, reglerExemplaires, encre } = useGameState();
  if (!direction?.exemplairesVisible) return null;
  return (
    <View
      style={styles.ligne}
      accessibilityRole="radiogroup"
      accessibilityLabel="Exemplaires exigés"
    >
      <Text style={styles.label}>Exemplaires</Text>
      <View style={styles.crans}>
        {VALEURS.map((n) => {
          const actif = direction.exemplaires === n;
          return (
            <Pressable
              key={n}
              onPress={() => reglerExemplaires(n)}
              accessibilityRole="radio"
              accessibilityState={{ checked: actif }}
              accessibilityLabel={
                n === 1 ? 'Un exemplaire' : `${n} exemplaires`
              }
              style={({ pressed }) => [
                styles.cran,
                actif && styles.cranActif,
                actif && {
                  backgroundColor: encre.face,
                  borderBottomColor: encre.flanc,
                },
                pressed && styles.presse,
              ]}
            >
              <Text style={[styles.valeur, actif && styles.valeurActive]}>
                ×{n}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
    marginHorizontal: Espace.m,
    marginTop: Espace.xs,
  },
  label: {
    width: 84,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
  crans: {
    flex: 1,
    flexDirection: 'row',
    gap: Espace.s,
  },
  cran: {
    flex: 1,
    height: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papierChaud,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Cran retenu : enfoncé (bord bas épais), pas seulement coloré. */
  cranActif: {
    borderBottomWidth: Charte.trait + 2,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  valeur: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.corps,
    color: Colors.crayon,
  },
  valeurActive: {
    fontFamily: Fonts.chiffres,
    color: Colors.anthracite,
  },
});
