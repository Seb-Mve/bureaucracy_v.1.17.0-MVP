import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
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
        <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
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
          <BoutonPoussoir libelle="RETOURNER AU GUICHET" taille={Typo.titre} hauteur={56} onPress={marquerFinActeVue} />
        </Panneau>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: Colors.voile,
    justifyContent: 'center',
    padding: Espace.xl,
  },
  carte: {
    padding: Espace.xl,
    gap: Espace.m,
    backgroundColor: Colors.creme,
  },
  sur: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
    textAlign: 'center',
  },
  citation: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
    textAlign: 'center',
  },
  bilan: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.petit,
    color: Colors.crayon,
    textAlign: 'center',
  },
  fin: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.grand,
    color: Colors.anthracite,
    textAlign: 'center',
    letterSpacing: 1,
  },
  suite: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
    textAlign: 'center',
  },
});
