import React, { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useFermetureEchap, useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/**
 * Écran de fin de l'acte I, après la « Demande de réaffectation ». Le fermer, de quelque façon que ce soit,
 * c'est prendre ses fonctions à la Direction (acte II) : l'écran revient donc aussi aux anciennes sauvegardes
 * dont l'acte I était terminé.
 */
export default function FinActeModal() {
  const { etat, entrerDirection } = useGameState();
  const visible = etat.acte === 1 && etat.acteTermine;
  const prendreFonctions = useCallback(() => {
    entrerDirection();
    router.navigate('/');
  }, [entrerDirection]);
  useFermetureEchap(visible, prendreFonctions);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={prendreFonctions}>
      <Pressable style={styles.voile} onPress={prendreFonctions} accessible={false}>
        <Pressable onPress={() => undefined} accessible={false} style={styles.colonne}>
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
            <Text style={styles.suite}>Acte II — La Direction.</Text>
            <BoutonPoussoir
              libelle="PRENDRE MES FONCTIONS"
              taille={Typo.titre}
              hauteur={56}
              couleur={Colors.bleu}
              couleurOmbre={Colors.bleuFlanc}
              onPress={prendreFonctions}
            />
          </Panneau>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /** Sur grand écran, la fenêtre garde la largeur de la colonne de l'app. */
  colonne: {
    width: '100%',
    maxWidth: Charte.largeurColonne,
    alignSelf: 'center',
  },
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
