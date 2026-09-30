import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import Hud from '@/components/Hud';
import SceneGuichet from '@/components/SceneGuichet';
import CurseurRejet from '@/components/CurseurRejet';
import BoutonTamponner from '@/components/BoutonTamponner';

/**
 * Écran principal : le guichet 3, sans défilement.
 * Ressources, puis la scène (qui prend toute la place restante), le taux de rejet et TAMPONNER.
 */
export default function GuichetScreen() {
  const { mods } = useGameState();

  return (
    <View style={styles.ecran}>
      <Hud />
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
