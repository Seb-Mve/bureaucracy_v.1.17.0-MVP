import React, { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Paperclip, X } from 'lucide-react-native';
import { useFermetureEchap, useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/**
 * Réforme (Options, acte II, après la note n° 11) : une carte qui ouvre le Formulaire R-01.
 * Tamponner le formulaire engage la Réforme : retour au Cerfa, puis au guichet 3.
 */
export default function SectionReforme() {
  const { reforme, reformer, encre } = useGameState();
  const [ouvert, setOuvert] = useState(false);
  const fermer = useCallback(() => setOuvert(false), []);
  useFermetureEchap(ouvert, fermer);

  const tamponner = useCallback(() => {
    setOuvert(false);
    reformer();
    router.navigate('/');
  }, [reformer]);

  const lignes: [string, string][] = [
    ['Trombones attribués', `+ ${formatEntier(reforme.gain)}`],
    ['Reprise au', 'Guichet 3, acte I'],
    ['Conservé', 'Tampons, trombones, Jurisprudence'],
    ['Nouveau Cerfa', `n° ${reforme.cerfaSuivant}`],
  ];

  return (
    <>
      <Pressable
        onPress={() => setOuvert(true)}
        accessibilityRole="button"
        accessibilityLabel="Réforme de l’action publique, ouvrir le formulaire R-01"
        style={({ pressed }) => pressed && styles.presse}
      >
        <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
          <View style={styles.rond}>
            <Paperclip size={20} color={Colors.anthracite} />
          </View>
          <Text style={styles.titreCarte}>Réforme de l’action publique</Text>
        </Panneau>
      </Pressable>

      <Modal
        visible={ouvert}
        transparent
        animationType="fade"
        onRequestClose={fermer}
      >
        <Pressable style={styles.voile} onPress={fermer} accessible={false}>
          <Pressable
            onPress={() => undefined}
            accessible={false}
            style={styles.colonne}
          >
            <Panneau contenuStyle={styles.feuille} rayon={Charte.rayon}>
              <View style={styles.entete}>
                <Text style={styles.titreFeuille} accessibilityRole="header">
                  Formulaire R-01 · Réforme
                </Text>
                <Pressable
                  onPress={fermer}
                  style={styles.fermer}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer le formulaire"
                >
                  <X size={22} color={Colors.anthracite} />
                </Pressable>
              </View>
              <View style={styles.table}>
                {lignes.map(([k, v]) => (
                  <View key={k} style={styles.ligne}>
                    <Text style={styles.cle}>{k}</Text>
                    <Text style={styles.valeur}>{v}</Text>
                  </View>
                ))}
              </View>
              <BoutonPoussoir
                libelle="TAMPONNER LA RÉFORME"
                taille={Typo.titre}
                hauteur={56}
                couleur={encre.face}
                couleurOmbre={encre.flanc}
                onPress={tamponner}
                accessibilityHint="Engage la Réforme : retour au guichet 3, acte I"
              />
            </Panneau>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    minHeight: 64,
    padding: Espace.m,
    backgroundColor: Colors.papierChaud,
  },
  rond: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.pastelJaune,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titreCarte: {
    flex: 1,
    fontFamily: Fonts.titre,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  /** Sur grand écran, la fenêtre garde la largeur de la colonne de l'app. */
  colonne: {
    width: '100%',
    maxWidth: Charte.largeurColonne,
    alignSelf: 'center',
  },
  voile: {
    flex: 1,
    justifyContent: 'center',
    padding: Espace.l,
    backgroundColor: Colors.voile,
  },
  feuille: {
    padding: Espace.l,
    gap: Espace.m,
    backgroundColor: Colors.papierFiche,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
    paddingBottom: Espace.xs,
  },
  titreFeuille: {
    flex: 1,
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  fermer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  table: {
    gap: Espace.s,
  },
  ligne: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: Espace.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.carton,
    paddingBottom: Espace.xs,
  },
  cle: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
  valeur: {
    flexShrink: 1,
    marginLeft: 'auto',
    textAlign: 'right',
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
});
