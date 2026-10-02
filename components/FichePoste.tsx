import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Coins, FileText, Inbox, Stamp } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

const MISSIONS = [
  {
    Icone: Inbox,
    fond: Colors.pastelBleu,
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
    fond: Colors.pastelJaune,
    titre: 'Chaque dossier rapporte 1 €',
    texte: 'C’est la dotation versée à votre service pour chaque dossier traité.',
  },
  {
    Icone: FileText,
    fond: Colors.pastelVert,
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
          <Panneau contenuStyle={styles.fiche} rayon={Charte.rayonPetit}>
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
            <BoutonPoussoir libelle="PRENDRE MON POSTE" taille={Typo.titre} hauteur={56} onPress={() => marquerFichePoste(true)} />
          </Panneau>
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
    fontSize: Typo.grand,
    color: Colors.anthracite,
  },
  titulaire: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
    paddingBottom: Espace.s,
  },
  missions: {
    gap: Espace.m,
    marginTop: Espace.xs,
  },
  mission: {
    flexDirection: 'row',
    gap: Espace.m,
    alignItems: 'flex-start',
  },
  pastille: {
    width: 36,
    height: 36,
    borderRadius: Charte.rayon,
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
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  missionDetail: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  chute: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.anthracite,
    fontStyle: 'italic',
    marginVertical: Espace.s,
  },
});
