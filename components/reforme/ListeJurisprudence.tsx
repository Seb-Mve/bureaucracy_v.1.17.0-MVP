import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useGameState,
  type Encre,
  type JurisprudenceAffichee,
  type JurisprudenceId,
} from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';

const trombones = (n: number) => `${n} trombone${n > 1 ? 's' : ''}`;

const CarteJurisprudence = memo(function CarteJurisprudence({
  j,
  encre,
  onAcquerir,
}: {
  j: JurisprudenceAffichee;
  encre: Encre;
  onAcquerir: (id: JurisprudenceId) => void;
}) {
  return (
    <View style={styles.carte}>
      <View style={styles.texte}>
        <Text style={styles.nom}>{j.nom}</Text>
        <Text style={styles.effet}>{j.effet}</Text>
      </View>
      {j.acquise ? (
        <View
          style={styles.acquise}
          accessible
          accessibilityLabel={`${j.nom}, acquise`}
        >
          <Text style={styles.acquiseTexte}>ACQUISE</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => onAcquerir(j.id)}
          disabled={!j.achetable}
          accessibilityRole="button"
          accessibilityLabel={`Acquérir ${j.nom}, ${trombones(j.cout)}`}
          accessibilityState={{ disabled: !j.achetable }}
          style={({ pressed }) => [
            styles.bouton,
            j.achetable
              ? { backgroundColor: encre.face }
              : styles.boutonInactif,
            pressed && styles.presse,
          ]}
        >
          <Text
            style={[
              styles.boutonTexte,
              !j.achetable && styles.boutonTexteInactif,
            ]}
          >
            {trombones(j.cout)}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

/** Jurisprudence (Options, après la première Réforme) : bonus permanents payés en trombones. */
export default function ListeJurisprudence() {
  const { reforme, acheterJurisprudence, encre } = useGameState();
  if (!reforme.jurisprudence) return null;
  return (
    <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
      {reforme.jurisprudence.map((j) => (
        <CarteJurisprudence
          key={j.id}
          j={j}
          encre={encre}
          onAcquerir={acheterJurisprudence}
        />
      ))}
    </Panneau>
  );
}

const styles = StyleSheet.create({
  fiche: {
    padding: Espace.m,
    gap: Espace.s,
    backgroundColor: Colors.papierChaud,
  },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.carton,
    paddingBottom: Espace.s,
  },
  texte: {
    flex: 1,
    gap: Espace.xs,
  },
  nom: {
    fontFamily: Fonts.titre,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  effet: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  bouton: {
    minHeight: 44,
    minWidth: 112,
    paddingHorizontal: Espace.s,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonInactif: {
    backgroundColor: Colors.carton,
    borderColor: Colors.crayonClair,
  },
  boutonTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  boutonTexteInactif: {
    color: Colors.crayon,
  },
  acquise: {
    minHeight: 44,
    minWidth: 112,
    paddingHorizontal: Espace.s,
    borderRadius: Charte.rayonMini,
    borderWidth: Charte.traitFin,
    borderColor: Colors.vertEncre,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
  },
  acquiseTexte: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.petit,
    color: Colors.vertEncre,
    letterSpacing: 1,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
