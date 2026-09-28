import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Coins, FileText, Inbox, Stamp } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

const MISSIONS = [
  {
    Icone: Inbox,
    fond: '#A0C4FF',
    titre: 'Les usagers déposent des dossiers',
    texte: 'Ils attendent leur tour dans la file du guichet 3.',
  },
  {
    Icone: Stamp,
    fond: Colors.encreClaire,
    titre: 'Vous tamponnez',
    texte: 'Chaque tap tamponne le dossier posé sur votre bureau.',
  },
  {
    Icone: Coins,
    fond: '#FFEAA7',
    titre: 'Chaque dossier rapporte 1 €',
    texte: 'C’est la dotation versée à votre service pour chaque dossier traité.',
  },
  {
    Icone: FileText,
    fond: '#C7ECB5',
    titre: 'Et consomme 1 formulaire',
    texte: 'Sans formulaires, plus rien ne se traite. Les ramettes s’achètent avec le budget.',
  },
];

/** Fiche de poste : explique le principe du guichet à la prise de fonction. */
export default function FichePoste() {
  const { etat, marquerFichePoste } = useGameState();
  const visible = etat.cerfa.signe && !etat.fichePosteVue;
  const agent = etat.cerfa.prenom || 'Agent sans prénom';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => marquerFichePoste(true)}>
      <View style={styles.voile}>
        <ScrollView contentContainerStyle={styles.defilement}>
          <Panneau contenuStyle={styles.fiche} rayon={12}>
            <Text style={styles.reference}>Fiche de poste n° 3-A</Text>
            <Text style={styles.titre}>Agent du guichet 3</Text>
            <Text style={styles.titulaire}>Titulaire : {agent}</Text>

            <View style={styles.missions}>
              {MISSIONS.map(({ Icone, fond, titre, texte }, i) => (
                <View key={titre} style={styles.mission}>
                  <View style={[styles.pastille, { backgroundColor: fond }]}>
                    <Icone size={18} color={Colors.anthracite} />
                  </View>
                  <View style={styles.missionTexte}>
                    <Text style={styles.missionTitre}>
                      {i + 1}. {titre}
                    </Text>
                    <Text style={styles.missionDetail}>{texte}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.chute}>
              Objectif : tamponner. Le reste relève de votre appréciation, et de la hiérarchie.
            </Text>
            <BoutonPoussoir libelle="PRENDRE MON POSTE" taille={17} hauteur={52} onPress={() => marquerFichePoste(true)} />
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
    fontSize: 22,
    color: Colors.anthracite,
  },
  titulaire: {
    fontFamily: Fonts.texteGras,
    fontSize: 13,
    color: Colors.crayon,
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
    paddingBottom: 8,
  },
  missions: {
    gap: 12,
    marginTop: 4,
  },
  mission: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  pastille: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTexte: {
    flex: 1,
  },
  missionTitre: {
    fontFamily: Fonts.titre,
    fontSize: 15,
    color: Colors.anthracite,
  },
  missionDetail: {
    fontFamily: Fonts.texte,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.crayon,
  },
  chute: {
    fontFamily: Fonts.texteGras,
    fontSize: 13,
    color: Colors.anthracite,
    fontStyle: 'italic',
    marginVertical: 6,
  },
});
