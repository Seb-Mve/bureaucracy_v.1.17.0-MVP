import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';

/** Bulle de l'usager au guichet, au-dessus de la scène : sa réplique, son nom et sa demande. */
export default function BulleGuichet({ compact = false }: { compact?: boolean }) {
  const { tete, mods } = useGameState();
  const premier = tete[0] ?? null;

  // File vide : la bulle dit pourquoi (l'explication ne s'ajoute plus sous TAMPONNER, qui ne bouge donc pas).
  let replique = mods.conformiteVisible
    ? 'Personne au guichet : vos collègues vont plus vite que la population. Les rejetés reviennent toujours.'
    : 'Personne au guichet. Les usagers arrivent… à leur rythme.';
  let qui: string | null = null;
  if (premier) {
    const numero = premier.numero.toLocaleString('fr-FR');
    replique = mods.numerotation ? `Ticket n° ${numero}` : `« ${premier.replique} »`;
    qui = mods.numerotation ? `Usager n° ${numero}` : `${premier.prenom} ${premier.nom}`;
  }

  return (
    <View style={[styles.zone, compact && styles.zoneCompacte]}>
      <View style={[styles.bulle, compact && styles.bulleCompacte]} accessible accessibilityLabel={qui ? `Au guichet : ${qui}, ${premier?.demande}. ${replique}` : replique}>
        <Text style={styles.replique} numberOfLines={compact && premier ? 1 : 2}>
          {replique}
        </Text>
        {qui && premier && !compact && (
          <Text style={styles.qui} numberOfLines={1}>
            <Text style={styles.nom}>{qui}</Text> · {premier.demande}
          </Text>
        )}
        {/* La pointe descend vers l'usager en tête de file, juste en dessous dans la scène. */}
        <View style={styles.pointe} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: Espace.l,
    paddingTop: Espace.s,
    paddingBottom: Espace.m,
    zIndex: 2,
  },
  zoneCompacte: {
    paddingTop: Espace.xs,
    paddingBottom: Espace.xs,
  },
  bulleCompacte: {
    paddingVertical: Espace.xs,
  },
  bulle: {
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
    gap: 2,
  },
  pointe: {
    position: 'absolute',
    bottom: -8,
    // La caméra serrée place la tête de file un peu avant le milieu de l'écran, quelle que soit sa taille.
    left: '42%',
    width: 14,
    height: 14,
    backgroundColor: Colors.papier,
    borderRightWidth: Charte.traitFin,
    borderBottomWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    transform: [{ rotate: '45deg' }],
  },
  replique: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  qui: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.crayon,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    color: Colors.anthracite,
  },
});
