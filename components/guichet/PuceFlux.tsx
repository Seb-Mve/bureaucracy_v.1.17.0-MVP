import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import { formatEntier, formatNumberFrench } from '@/utils/formatters';

/** Demande et débit, posés sur le comptoir : dossiers en attente, arrivées et traitement par seconde. */
export default function PuceFlux() {
  const { enAttente, flux } = useGameState();
  const attente = formatEntier(Math.floor(enAttente));
  const arrivees = formatNumberFrench(flux.arrivees);
  const traitement = formatNumberFrench(flux.traitement);

  return (
    <View
      style={[styles.puce, flux.sature && styles.sature]}
      accessible
      accessibilityLabel={`${attente} dossiers en attente. Arrivées ${arrivees} par seconde, traitement ${traitement} par seconde${flux.sature ? '. Le périmètre s’épuise' : ''}`}
    >
      <Text style={styles.attente}>
        {attente} <Text style={styles.petit}>en attente</Text>
      </Text>
      <Text style={[styles.flux, flux.sature && styles.fluxSature]}>
        {flux.sature ? 'Le périmètre s’épuise' : `+${arrivees}/s · −${traitement}/s`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  puce: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'flex-end',
    shadowColor: Colors.anthracite,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  sature: {
    backgroundColor: Colors.encreFond,
  },
  attente: {
    fontFamily: Fonts.chiffres,
    fontSize: 13,
    color: Colors.anthracite,
  },
  petit: {
    fontFamily: Fonts.texteGras,
    fontSize: 10,
    color: Colors.crayon,
  },
  flux: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: 10,
    color: Colors.crayon,
  },
  fluxSature: {
    fontFamily: Fonts.texteGras,
    color: Colors.encreTexte,
  },
});
