import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import Hud from '@/components/Hud';
import OrdreDuJour from '@/components/OrdreDuJour';
import SceneGuichet from '@/components/SceneGuichet';
import FileAttente from '@/components/FileAttente';
import CurseurRejet from '@/components/CurseurRejet';
import BoutonTamponner from '@/components/BoutonTamponner';
import Panneau from '@/components/charte/Panneau';
import BanniereNote from '@/components/BanniereNote';

/** Écran principal : le guichet 3. */
export default function GuichetScreen() {
  const { mods } = useGameState();

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView style={styles.defilement} contentContainerStyle={styles.contenu}>
        <OrdreDuJour />
        <SceneGuichet />
        <BanniereNote />
        <Panneau style={styles.panneau} contenuStyle={styles.panneauContenu} rayon={18}>
          <FileAttente />
          {mods.rejetVisible && <CurseurRejet />}
        </Panneau>
      </ScrollView>
      <BoutonTamponner />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  defilement: {
    flex: 1,
  },
  contenu: {
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  panneau: {
    marginHorizontal: 12,
  },
  panneauContenu: {
    padding: 10,
    gap: 10,
  },
});
