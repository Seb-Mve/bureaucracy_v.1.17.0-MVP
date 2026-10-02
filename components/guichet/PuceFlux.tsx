import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatNumberFrench } from '@/utils/formatters';

/** Le débit, posé au sol de la scène : arrivées et traitement par seconde (l'attente est dans le HUD). */
export default function PuceFlux() {
  const { flux } = useGameState();
  const arrivees = formatNumberFrench(flux.arrivees);
  const traitement = formatNumberFrench(flux.traitement);

  return (
    <View
      style={[styles.puce, flux.sature && styles.sature]}
      accessible
      accessibilityLabel={`Arrivées ${arrivees} dossiers par seconde, traitement ${traitement} par seconde${flux.sature ? '. Le périmètre s’épuise' : ''}`}
    >
      <Text style={[styles.flux, flux.sature && styles.fluxSature]}>
        {flux.sature ? 'Le périmètre s’épuise' : `+${arrivees}/s · −${traitement}/s`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  puce: {
    position: 'absolute',
    left: Espace.s,
    bottom: Espace.s,
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
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.anthracite,
  },
  fluxSature: {
    fontFamily: Fonts.texteGras,
    color: Colors.encreTexte,
  },
});
