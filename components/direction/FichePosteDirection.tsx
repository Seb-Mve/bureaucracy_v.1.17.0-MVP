import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ChartColumn,
  Coins,
  Copy,
  Landmark,
  Paperclip,
  Truck,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import {
  useFermetureEchap,
  useGameState,
  type LigneFiche2Id,
} from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/** Pictogramme et fond de chaque ligne de la fiche. */
const ICONES: Record<LigneFiche2Id, { Icone: LucideIcon; fond: string }> = {
  circulation: { Icone: Paperclip, fond: Colors.pastelBleu },
  guichets: { Icone: Landmark, fond: Colors.bleuFond },
  dotation: { Icone: Coins, fond: Colors.pastelJaune },
  evaluation: { Icone: ChartColumn, fond: Colors.pastelVert },
  agents: { Icone: UserRound, fond: Colors.pastelJaune },
  atelier: { Icone: Wrench, fond: Colors.bleuFond },
  exemplaires: { Icone: Copy, fond: Colors.pastelBleu },
  achats: { Icone: Truck, fond: Colors.pastelVert },
  pieceService: { Icone: Landmark, fond: Colors.pastelBleu },
};

/**
 * Fiche de poste du chef de service (acte II), au format de celle du guichet 3 : elle s'ouvre à la prise de
 * fonctions, se relit depuis Options, et le S.I.C. la complète à chaque mécanique débloquée (une ligne ajoutée
 * porte « NOUVEAU » jusqu'à la relecture).
 */
export default function FichePosteDirection() {
  const { fiche2, marquerFichePoste, encre } = useGameState();
  const visible = fiche2?.visible ?? false;
  useFermetureEchap(visible, () => marquerFichePoste(true));
  if (!fiche2) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => marquerFichePoste(true)}
    >
      <Pressable
        style={styles.voile}
        onPress={() => marquerFichePoste(true)}
        accessible={false}
      >
        <ScrollView contentContainerStyle={styles.defilement}>
          <Pressable
            onPress={() => undefined}
            accessible={false}
            style={styles.colonne}
          >
            <Panneau contenuStyle={styles.fiche} rayon={Charte.rayonPetit}>
              <Text style={styles.reference}>Fiche de poste n° 3-B</Text>
              <Text style={styles.titre}>Chef de service</Text>
              <Text style={styles.titulaire}>
                Agent : {fiche2.agent} · {fiche2.nomService}
              </Text>

              <View style={styles.missions}>
                {fiche2.lignes.map((l, i) => {
                  const { Icone, fond } = ICONES[l.id];
                  return (
                    <View
                      key={l.id}
                      style={styles.mission}
                      accessible
                      accessibilityLabel={`${i + 1}. ${l.titre}. ${l.texte}${l.nouvelle && !fiche2.premiere ? ' Nouveau.' : ''}`}
                    >
                      <View
                        style={[styles.pastille, { backgroundColor: fond }]}
                      >
                        <Icone size={18} color={Colors.anthracite} />
                      </View>
                      <View style={styles.missionTexte}>
                        <Text style={styles.missionTitre}>
                          {i + 1}. {l.titre}
                        </Text>
                        <Text style={styles.missionDetail}>{l.texte}</Text>
                        {l.nouvelle && !fiche2.premiere && (
                          <Text style={styles.nouveau}>NOUVEAU</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.chute}>
                Le S.I.C. se réserve le droit de compléter la présente fiche.
              </Text>
              <BoutonPoussoir
                libelle={fiche2.premiere ? 'PRENDRE MON POSTE' : 'FERMER'}
                taille={Typo.titre}
                hauteur={56}
                couleur={encre.face}
                couleurOmbre={encre.flanc}
                onPress={() => marquerFichePoste(true)}
              />
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
  nouveau: {
    alignSelf: 'flex-start',
    marginTop: Espace.xs,
    paddingHorizontal: Espace.xs,
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.anthracite,
    backgroundColor: Colors.pastelJaune,
  },
  chute: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.anthracite,
    fontStyle: 'italic',
    marginVertical: Espace.s,
  },
});
