import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Fonts } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/** Écran de fin de l'acte I, affiché une fois après la « Demande de réaffectation ». */
export default function FinActeModal() {
  const { etat, marquerFinActeVue } = useGameState();
  const visible = etat.acteTermine && !etat.finActeVue;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={marquerFinActeVue}>
      <View style={styles.voile}>
        <Panneau contenuStyle={styles.carte} rayon={16}>
          <Text style={styles.sur}>Guichet 3 — archivé</Text>
          <Text style={styles.citation}>
            « Votre niveau de conformité a été jugé satisfaisant. Une réaffectation de niveau supérieur pourrait être
            envisagée… »
          </Text>
          <Text style={styles.bilan}>
            {formatEntier(etat.tampons)} tampons apposés ·{' '}
            {formatEntier(etat.stats.rejetes)} rejets
          </Text>
          <Text style={styles.fin}>FIN DE L’ACTE I</Text>
          <Text style={styles.suite}>L’acte II — Le Service — est en cours d’instruction.</Text>
          <BoutonPoussoir libelle="RETOURNER AU GUICHET" taille={16} hauteur={52} onPress={marquerFinActeVue} />
        </Panneau>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: 'rgba(45,52,54,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  carte: {
    padding: 20,
    gap: 12,
    backgroundColor: Colors.creme,
  },
  sur: {
    fontFamily: Fonts.chiffres,
    fontSize: 11,
    color: Colors.crayon,
    textAlign: 'center',
  },
  citation: {
    fontFamily: Fonts.texte,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.anthracite,
    textAlign: 'center',
  },
  bilan: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: 12,
    color: Colors.crayon,
    textAlign: 'center',
  },
  fin: {
    fontFamily: Fonts.titreGras,
    fontSize: 28,
    color: Colors.anthracite,
    textAlign: 'center',
    letterSpacing: 1,
  },
  suite: {
    fontFamily: Fonts.texteGras,
    fontSize: 13,
    color: Colors.crayon,
    textAlign: 'center',
  },
});
