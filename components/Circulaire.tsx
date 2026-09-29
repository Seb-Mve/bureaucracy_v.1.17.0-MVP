import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/** Circulaire : explique une mécanique au moment où elle apparaît, une seule fois. */
export default function Circulaire() {
  const { etat, circulaire, marquerCirculaireVue } = useGameState();
  const finActeEnCours = etat.acteTermine && !etat.finActeVue;
  const visible = circulaire !== null && etat.fichePosteVue && !finActeEnCours;
  if (!circulaire) return null;

  const fermer = () => marquerCirculaireVue(circulaire.id);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <View style={styles.voile}>
        <ScrollView contentContainerStyle={styles.defilement}>
          <Panneau contenuStyle={styles.fiche} rayon={12}>
            <Text style={styles.reference}>Circulaire n° {circulaire.numero} · S.I.C.</Text>
            <Text style={styles.titre} accessibilityRole="header">
              {circulaire.titre}
            </Text>
            <View style={styles.separateur} />
            <Text style={styles.texte}>{circulaire.texte}</Text>
            <BoutonPoussoir libelle="PRIS CONNAISSANCE" taille={16} hauteur={48} onPress={fermer} />
          </Panneau>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: 'rgba(45,52,54,0.55)',
  },
  defilement: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
  },
  fiche: {
    padding: 18,
    gap: 10,
    backgroundColor: '#FFFEF9',
  },
  reference: {
    fontFamily: Fonts.chiffres,
    fontSize: 11,
    color: Colors.crayon,
  },
  titre: {
    fontFamily: Fonts.titreGras,
    fontSize: 20,
    color: Colors.anthracite,
  },
  separateur: {
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.anthracite,
    marginBottom: 6,
  },
});
