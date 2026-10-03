import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import { useFermetureEchap } from '@/context/GameStateContext';

interface ConfirmationProps {
  visible: boolean;
  titre: string;
  message: string;
  libelleConfirmer: string;
  /** Action irréversible : le bouton de confirmation passe en rouge. */
  destructive?: boolean;
  onConfirmer: () => void;
  onAnnuler: () => void;
}

/** Demande de confirmation dans la charte (remplace les boîtes natives du système). */
export default function Confirmation({
  visible,
  titre,
  message,
  libelleConfirmer,
  destructive = false,
  onConfirmer,
  onAnnuler,
}: ConfirmationProps) {
  useFermetureEchap(visible, onAnnuler);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <Pressable style={styles.voile} onPress={onAnnuler} accessible={false}>
        <Pressable onPress={() => undefined} accessible={false} style={styles.colonne}>
          <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
            <Text style={styles.titre} accessibilityRole="header">
              {titre}
            </Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.boutons}>
              <Pressable
                onPress={onAnnuler}
                style={({ pressed }) => [styles.bouton, styles.annuler, pressed && styles.presse]}
                accessibilityRole="button"
              >
                <Text style={styles.texteAnnuler}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={onConfirmer}
                style={({ pressed }) => [
                  styles.bouton,
                  destructive ? styles.danger : styles.confirmer,
                  pressed && styles.presse,
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.texteConfirmer, destructive && styles.texteDanger]}>{libelleConfirmer}</Text>
              </Pressable>
            </View>
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
    justifyContent: 'center',
    padding: Espace.l,
    backgroundColor: Colors.voile,
  },
  fiche: {
    padding: Espace.l,
    gap: Espace.m,
    backgroundColor: Colors.papierFiche,
  },
  titre: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.titre,
    lineHeight: Interligne.titre,
    color: Colors.anthracite,
  },
  message: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  boutons: {
    flexDirection: 'row',
    gap: Espace.s,
    marginTop: Espace.xs,
  },
  bouton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    paddingHorizontal: Espace.s,
  },
  annuler: {
    backgroundColor: Colors.papier,
    borderColor: Colors.anthracite,
  },
  confirmer: {
    backgroundColor: Colors.encre,
    borderColor: Colors.anthracite,
  },
  danger: {
    backgroundColor: Colors.rougeFond,
    borderColor: Colors.rouge,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  texteAnnuler: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  texteConfirmer: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  texteDanger: {
    color: Colors.rougeTexte,
  },
});
