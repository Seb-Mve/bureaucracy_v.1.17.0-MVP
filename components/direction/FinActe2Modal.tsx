import React from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useFermetureEchap, useGameState } from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/** Écran de fin de l'acte II, affiché une fois après la note « Promotion ». Le jeu continue ensuite. */
export default function FinActe2Modal() {
  const { etat, direction, marquerFinActeVue, encre } = useGameState();
  const visible =
    direction !== null && direction.acteTermine && !direction.finActeVue;
  useFermetureEchap(visible, marquerFinActeVue);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={marquerFinActeVue}
    >
      <Pressable
        style={styles.voile}
        onPress={marquerFinActeVue}
        accessible={false}
      >
        <Pressable
          onPress={() => undefined}
          accessible={false}
          style={styles.colonne}
        >
          <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
            <Text style={styles.sur}>
              La Direction — rattachée au ministère
            </Text>
            <Text style={styles.citation}>
              {
                '« La Direction devient une unité du ministère. Vous êtes nommé·e ministre. »'
              }
            </Text>
            <Text style={styles.bilan}>
              {formatEntier(etat.tampons)} tampons apposés ·{' '}
              {formatEntier(direction?.visasAccordes ?? 0)} visas accordés
            </Text>
            <Text style={styles.fin}>FIN DE L’ACTE II</Text>
            <Text style={styles.suite}>
              La Direction reste ouverte : vos tampons continuent de compter.
            </Text>
            <BoutonPoussoir
              libelle="RETOURNER À LA DIRECTION"
              taille={Typo.titre}
              hauteur={56}
              couleur={encre.face}
              couleurOmbre={encre.flanc}
              onPress={marquerFinActeVue}
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
