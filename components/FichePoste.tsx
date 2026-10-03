import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Coins, FileText, Inbox, Stamp } from 'lucide-react-native';
import { useFermetureEchap, useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';
import { BALANCE } from '@/constants/balance';
import { formatEntier, formatMontant } from '@/utils/formatters';

/** Les missions du poste, avec la dotation et la consommation en vigueur (la fiche se relit depuis Options). */
const missions = (dotation: number, pieces: number, parCoup: number) => [
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
    texte:
      parCoup === 1
        ? 'Chaque tap tamponne le dossier posé sur votre bureau.'
        : `Chaque tap tamponne ${formatEntier(parCoup)} dossiers posés sur votre bureau.`,
  },
  {
    Icone: Coins,
    fond: Colors.pastelJaune,
    titre: `Chaque dossier rapporte ${formatMontant(dotation)}`,
    texte: 'C’est la dotation versée à votre service pour chaque dossier traité.',
  },
  {
    Icone: FileText,
    fond: Colors.pastelVert,
    titre: pieces === 1 ? 'Et consomme 1 formulaire' : `Et consomme ${formatEntier(pieces)} formulaires`,
    texte: 'Sans formulaires, plus rien ne se traite. Les ramettes s’achètent avec le budget.',
  },
];

/** Fiche de poste : explique le principe du guichet à la prise de fonction. */
export default function FichePoste() {
  const { etat, mods, marquerFichePoste } = useGameState();
  // Relue depuis Options en cours de partie : on referme simplement la fiche.
  const relue = etat.tampons > 0;
  const visible = etat.cerfa.signe && !etat.fichePosteVue;
  useFermetureEchap(visible, () => marquerFichePoste(true));
  const agent = etat.cerfa.prenom || 'Agent sans prénom';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => marquerFichePoste(true)}>
      <Pressable style={styles.voile} onPress={() => marquerFichePoste(true)} accessible={false}>
        <ScrollView contentContainerStyle={styles.defilement}>
          <Pressable onPress={() => undefined} accessible={false} style={styles.colonne}>
            <Panneau contenuStyle={styles.fiche} rayon={Charte.rayonPetit}>
              <Text style={styles.reference}>Fiche de poste n° 3-A</Text>
              <Text style={styles.titre}>Agent du guichet 3</Text>
              <Text style={styles.titulaire}>Agent : {agent}</Text>

              <View style={styles.missions}>
                {missions(BALANCE.dotation * mods.dotationMult, mods.pieces, mods.tapPower).map(({ Icone, fond, titre, texte }, i) => (
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
              <BoutonPoussoir libelle={relue ? 'FERMER' : 'PRENDRE MON POSTE'} taille={Typo.titre} hauteur={56} onPress={() => marquerFichePoste(true)} />
            </Panneau>
          </Pressable>
        </ScrollView>
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
