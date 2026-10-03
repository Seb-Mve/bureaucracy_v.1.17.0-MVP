import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import Hud from '@/components/Hud';
import BulleGuichet from '@/components/guichet/BulleGuichet';
import SceneGuichet from '@/components/SceneGuichet';
import CurseurRejet from '@/components/CurseurRejet';
import BoutonTamponner from '@/components/BoutonTamponner';

/**
 * Écran principal : le guichet 3, sans défilement.
 * Ressources, ce qui réclame l'attention, la parole de l'usager, puis la scène cadrée sur l'action
 * (elle prend toute la place restante), le taux de rejet et TAMPONNER.
 */
export default function GuichetScreen() {
  const { mods } = useGameState();
  // Petit écran : bulle sur une ligne, la hauteur va à la scène.
  const compact = useWindowDimensions().height < 720;

  return (
    <View style={styles.ecran}>
      <Hud />
      <BulleGuichet compact={compact} />
      <View style={styles.zoneScene}>
        <SceneGuichet />
      </View>
      {mods.rejetVisible && <CurseurRejet />}
      <BoutonTamponner />
    </View>
  );
}

const styles = StyleSheet.create({
  zoneScene: {
    flex: 1,
    minHeight: 0,
  },
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
});
