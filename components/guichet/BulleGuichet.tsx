import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';

/** Bulle de l'usager au guichet : sa réplique, son nom et sa demande. */
export default function BulleGuichet() {
  const { tete, mods } = useGameState();
  const premier = tete[0] ?? null;

  let replique = mods.conformiteVisible ? 'Personne au guichet. C’est un succès.' : 'Personne au guichet. Pour l’instant.';
  let qui: string | null = null;
  if (premier) {
    const numero = premier.numero.toLocaleString('fr-FR');
    replique = mods.numerotation ? `Ticket n° ${numero}` : `« ${premier.replique} »`;
    qui = mods.numerotation ? `Usager n° ${numero}` : `${premier.prenom} ${premier.nom}`;
  }

  return (
    <View style={styles.bulle} accessible accessibilityLabel={qui ? `Au guichet : ${qui}, ${premier?.demande}. ${replique}` : replique}>
      <Text style={styles.replique} numberOfLines={2}>
        {replique}
      </Text>
      {qui && premier && (
        <Text style={styles.qui} numberOfLines={1}>
          <Text style={styles.nom}>{qui}</Text> · {premier.demande}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bulle: {
    position: 'absolute',
    top: 8,
    left: 8,
    maxWidth: '54%',
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 1,
    shadowColor: Colors.anthracite,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  replique: {
    fontFamily: Fonts.texteGras,
    fontSize: 12,
    lineHeight: 15,
    color: Colors.anthracite,
  },
  qui: {
    fontFamily: Fonts.texte,
    fontSize: 10,
    color: Colors.crayon,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    color: Colors.anthracite,
  },
});
