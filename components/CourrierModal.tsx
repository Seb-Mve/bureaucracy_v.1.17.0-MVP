import React, { useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';

interface CourrierModalProps {
  visible: boolean;
  onFermer: () => void;
}

function date(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} à ${p(d.getHours())} h ${p(d.getMinutes())}`;
}

/** Le courrier du S.I.C. : lettres reçues, plus récentes en haut. */
export default function CourrierModal({ visible, onFermer }: CourrierModalProps) {
  const { etat, marquerLettresLues } = useGameState();

  useEffect(() => {
    if (!visible) return;
    return () => marquerLettresLues();
  }, [visible, marquerLettresLues]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onFermer}>
      <SafeAreaView style={styles.ecran}>
        <View style={styles.entete}>
          <Text style={styles.titre}>Courrier du S.I.C.</Text>
          <Pressable onPress={onFermer} style={styles.fermer} accessibilityRole="button" accessibilityLabel="Fermer le courrier">
            <X size={22} color={Colors.anthracite} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.liste}>
          {etat.courrier.length === 0 && (
            <Text style={styles.vide}>Aucun courrier. Le S.I.C. ne vous a pas encore remarqué.</Text>
          )}
          {etat.courrier.map((l) => (
            <Panneau key={`${l.id}-${l.recue}`} contenuStyle={styles.lettre} rayon={Charte.rayonPetit}>
              <View style={styles.lettreEntete}>
                <Text style={styles.expediteur}>SERVICE INCONNU DE COORDINATION</Text>
                {!l.lue && <View style={styles.pastille} accessibilityLabel="Non lue" />}
              </View>
              <Text style={styles.date}>Le {date(l.recue)}</Text>
              <Text style={styles.objet}>Objet : {l.objet}</Text>
              <Text style={styles.corps}>{l.corps}</Text>
              <Text style={styles.signature}>— Le S.I.C.</Text>
            </Panneau>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.carton,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espace.l,
    paddingVertical: Espace.m,
    borderBottomWidth: Charte.trait,
    borderBottomColor: Colors.anthracite,
    backgroundColor: Colors.creme,
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
  liste: {
    padding: Espace.l,
    gap: Espace.l,
  },
  vide: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    color: Colors.crayon,
    textAlign: 'center',
    paddingVertical: Espace.xxl,
  },
  lettre: {
    padding: Espace.l,
    gap: Espace.s,
    backgroundColor: Colors.papierFiche,
  },
  lettreEntete: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expediteur: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
    letterSpacing: 1,
  },
  pastille: {
    width: 10,
    height: 10,
    borderRadius: Charte.rayonMini,
    backgroundColor: Colors.rouge,
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
  },
  date: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    color: Colors.crayon,
  },
  objet: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  corps: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  signature: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
    textAlign: 'right',
  },
});
