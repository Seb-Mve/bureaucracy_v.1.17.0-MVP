import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Colors, { Espace } from '@/constants/Colors';
import Hud from '@/components/Hud';
import CurseurRejet from '@/components/CurseurRejet';
import BoutonTamponner from '@/components/BoutonTamponner';
import BulleDirection from '@/components/direction/BulleDirection';
import ReleveProduction from '@/components/direction/ReleveProduction';
import SceneDirection from '@/components/direction/SceneDirection';
import CurseurExemplaires from '@/components/direction/CurseurExemplaires';

/**
 * Écran Direction (acte II), même structure que le guichet, sans défilement : ressources, demande à viser,
 * relevé « Production du service », scène du bureau du chef (toute la place restante), curseurs, TAMPONNER.
 */
export default function EcranDirection() {
  // Petit écran : bulle sur une ligne, la hauteur va à la scène.
  const compact = useWindowDimensions().height < 720;
  return (
    <View style={styles.ecran}>
      <Hud />
      <BulleDirection compact={compact} />
      <ReleveProduction compact={compact} />
      <View style={styles.zoneScene}>
        <SceneDirection />
      </View>
      <CurseurRejet />
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
