import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Colors, { Espace } from '@/constants/Colors';
import { useGameState } from '@/context/GameStateContext';
import Hud from '@/components/Hud';
import CurseurRejet from '@/components/CurseurRejet';
import BoutonTamponner from '@/components/BoutonTamponner';
import CircuitDirection from '@/components/direction/CircuitDirection';
import ReleveProduction from '@/components/direction/ReleveProduction';
import SceneDirection from '@/components/direction/SceneDirection';
import CurseurExemplaires from '@/components/direction/CurseurExemplaires';

/**
 * Écran Direction (acte II), même structure que le guichet, sans défilement : ressources, circuit d'une demande
 * (specs/013), relevé « Production du service » une fois l'Atelier ouvert, scène du bureau du chef (toute la place restante), curseurs (le rejet dès
 * le premier guichet), TAMPONNER.
 */
export default function EcranDirection() {
  // Petit écran : bulle sur une ligne, la hauteur va à la scène.
  const compact = useWindowDimensions().height < 720;
  // Le Taux de rejet n'apparaît qu'avec le premier guichet : avant, rejeter ne sert à rien. Le relevé attend
  // l'Atelier, où ce que rapporte et coûte une carte devient un choix.
  const { direction } = useGameState();
  return (
    <View style={styles.ecran}>
      <Hud />
      <CircuitDirection compact={compact} />
      {direction?.atelierVisible && <ReleveProduction compact={compact} />}
      <View style={styles.zoneScene}>
        <SceneDirection />
      </View>
      {direction?.rejetVisible && <CurseurRejet />}
      <CurseurExemplaires />
      <BoutonTamponner />
    </View>
  );
}

const styles = StyleSheet.create({
  zoneScene: {
    flex: 1,
    minHeight: 0,
    marginTop: Espace.s,
  },
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
});
