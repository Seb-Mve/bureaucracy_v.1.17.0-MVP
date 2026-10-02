import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatNumberFrench } from '@/utils/formatters';

/** Le débit, posé sur le mur de la scène : arrivées et traitement par seconde (l'attente est dans le HUD). */
export default function PuceFlux() {
  const { flux } = useGameState();
  // Tant que la mesure est trop courte, un tiret plutôt qu'un chiffre qui saute.
  const arrivees = flux.mesure ? formatNumberFrench(flux.arrivees) : '—';
  const traitement = flux.mesure ? formatNumberFrench(flux.traitement) : '—';

  return (
    <View
      style={[styles.puce, flux.sature && styles.sature]}
      accessible
      accessibilityLabel={
        flux.mesure
          ? `Arrivées : ${arrivees} dossiers par seconde. Traités : ${traitement} dossiers par seconde${flux.sature ? '. Le périmètre s’épuise' : ''}`
          : 'Débits en cours de mesure'
      }
    >
      <Text style={[styles.flux, flux.sature && styles.fluxSature]}>
        {flux.sature ? 'Le périmètre s’épuise' : `Arrivées ${arrivees}/s · Traités ${traitement}/s`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  puce: {
    position: 'absolute',
    // En haut, sur le mur : elle ne chevauche ni les pieds de la file ni le comptoir.
    left: Espace.s,
    top: Espace.s,
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.s,
    paddingVertical: 2,
  },
  sature: {
    backgroundColor: Colors.encreFond,
  },
  flux: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
  fluxSature: {
    fontFamily: Fonts.texteGras,
    color: Colors.encreTexte,
  },
});
