import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import ReglementInterieur from '@/components/ReglementInterieur';
import { raccourcisVisibles } from '@/components/raccourcis';
import { useFenetreBloquante, useGameState } from '@/context/GameStateContext';

interface AideModalProps {
  visible: boolean;
  onFermer: () => void;
}

/** Aide, ouverte depuis le « ? » de l'en-tête : le règlement intérieur et, sur le web, les raccourcis. */
export default function AideModal({ visible, onFermer }: AideModalProps) {
  useFenetreBloquante('aide', visible, onFermer);
  const { mods, notes } = useGameState();
  const raccourcis = raccourcisVisibles(mods.recrutementVisible, notes.length > 0);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      {/* Panneau sur voile : toucher le voile, au-dessus, ferme comme la croix. */}
      <View style={styles.voile}>
        <Pressable style={styles.zoneVoile} onPress={onFermer} accessible={false} />
        <SafeAreaView edges={['bottom']} style={styles.ecran}>
          <View style={styles.entete}>
            <Text style={styles.titre}>Aide du guichet 3</Text>
            <Pressable onPress={onFermer} style={styles.fermer} accessibilityRole="button" accessibilityLabel="Fermer l’aide">
              <X size={22} color={Colors.anthracite} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.contenu}>
            <ReglementInterieur ouvertParDefaut />
            {Platform.OS === 'web' && (
              <View style={styles.raccourcis}>
                <Text style={styles.sousTitre}>Raccourcis clavier</Text>
                {raccourcis.map(([touche, effet]) => (
                  <View key={touche} style={styles.ligne}>
                    <Text style={styles.touche}>{touche}</Text>
                    <Text style={styles.effet}>{effet}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: Colors.voile,
  },
  /** Bande de voile au-dessus de la fenêtre : la toucher ferme (assez haute pour le pouce). */
  zoneVoile: {
    height: Espace.xxl * 3,
  },
  ecran: {
    flex: 1,
    width: '100%',
    maxWidth: Charte.largeurColonne,
    alignSelf: 'center',
    borderTopLeftRadius: Charte.rayon,
    borderTopRightRadius: Charte.rayon,
    borderTopWidth: Charte.trait,
    borderColor: Colors.anthracite,
    overflow: 'hidden',
    backgroundColor: Colors.creme,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espace.l,
    paddingVertical: Espace.m,
    borderBottomWidth: Charte.trait,
    borderBottomColor: Colors.anthracite,
  },
  titre: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.titre,
    color: Colors.anthracite,
  },
  fermer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenu: {
    padding: Espace.l,
    gap: Espace.l,
  },
  raccourcis: {
    gap: Espace.s,
  },
  sousTitre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.titre,
    color: Colors.anthracite,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
  },
  touche: {
    minWidth: 64,
    textAlign: 'center',
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    paddingHorizontal: Espace.s,
    paddingVertical: Espace.xs,
  },
  effet: {
    flex: 1,
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
});
