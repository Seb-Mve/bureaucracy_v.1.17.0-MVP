import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
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
          {/* Toucher à côté de la circulaire vaut « Pris connaissance ». */}
          <Pressable style={styles.zone} onPress={fermer} accessible={false}>
            <Pressable onPress={() => undefined} accessible={false}>
              <Panneau contenuStyle={styles.fiche} rayon={Charte.rayonPetit}>
                <Text style={styles.reference}>Circulaire n° {circulaire.numero} · S.I.C.</Text>
                <Text style={styles.titre} accessibilityRole="header">
                  {circulaire.titre}
                </Text>
                <View style={styles.separateur} />
                <Text style={styles.texte}>{circulaire.texte}</Text>
                <BoutonPoussoir libelle="PRIS CONNAISSANCE" taille={Typo.titre} hauteur={52} onPress={fermer} />
              </Panneau>
            </Pressable>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: Colors.voile,
  },
  defilement: {
    flexGrow: 1,
  },
  zone: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Espace.l,
  },
  fiche: {
    padding: Espace.l,
    gap: Espace.m,
    backgroundColor: Colors.papierFiche,
  },
  reference: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
  },
  titre: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.titre,
    color: Colors.anthracite,
  },
  separateur: {
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
    marginBottom: Espace.s,
  },
});
