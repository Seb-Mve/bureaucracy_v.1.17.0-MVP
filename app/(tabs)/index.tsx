import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import Hud from '@/components/Hud';
import FilDuJour from '@/components/guichet/FilDuJour';
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

  return (
    <View style={styles.ecran}>
      <Hud />
      <FilDuJour />
      <BulleGuichet />
      <SceneGuichet />
      {mods.rejetVisible && <CurseurRejet />}
      <BoutonTamponner />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
});
