import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

const CASES = [
  'Je certifie sur l’honneur l’exactitude des renseignements ci-dessus.',
  'Je reconnais avoir pris connaissance des conditions que je n’ai pas lues.',
];

/** Premier écran : le Cerfa d'embauche, à tamponner soi-même. */
export default function CerfaEcran() {
  // « BUREAUCRACY++ » tient sur une ligne : une marche de moins sur les écrans étroits.
  const etroit = useWindowDimensions().width < 360;
  const { signerCerfa } = useGameState();
  const [prenom, setPrenom] = useState('');
  const [cases, setCases] = useState([false, false]);
  const [bienvenue, setBienvenue] = useState(false);

  const complet = cases.every(Boolean);

  const valider = () => {
    if (!complet) return;
    setBienvenue(true);
    setTimeout(() => signerCerfa(prenom), 1600);
  };

  return (
    <SafeAreaView style={styles.ecran}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          <Text style={[styles.logo, etroit && styles.logoEtroit]} numberOfLines={1}>
            BUREAUCRACY++
          </Text>
          <Panneau contenuStyle={styles.formulaire} rayon={Charte.rayonPetit}>
            <Text style={styles.cerfa}>Cerfa n° 00001*01</Text>
            <Text style={styles.titre}>Demande d’emploi d’agent administratif</Text>
            <Text style={styles.consigne}>À remplir en lettres capitales, à l’encre noire ou assimilée.</Text>

            <Text style={styles.label}>Case 1 — Prénom de l’agent (facultatif)</Text>
            <TextInput
              value={prenom}
              onChangeText={setPrenom}
              maxLength={20}
              placeholder="Camille"
              placeholderTextColor={Colors.crayonClair}
              style={styles.champ}
              autoCapitalize="words"
              accessibilityLabel="Prénom de l’agent, facultatif"
            />
            <Text style={styles.aide}>Conservé uniquement sur cet appareil.</Text>

            {CASES.map((texte, i) => (
              <Pressable
                key={texte}
                style={styles.caseLigne}
                onPress={() => setCases((c) => c.map((v, j) => (j === i ? !v : v)))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: cases[i] }}
                accessibilityLabel={texte}
              >
                <View style={[styles.case, cases[i] && styles.caseCochee]}>
                  {cases[i] && <Check size={16} color={Colors.anthracite} strokeWidth={3} />}
                </View>
                <Text style={styles.caseTexte}>{texte}</Text>
              </Pressable>
            ))}

            <View style={styles.cadreTampon}>
              {bienvenue ? (
                <View style={styles.tampon}>
                  <Text style={styles.tamponTexte}>EMBAUCHÉ·E</Text>
                </View>
              ) : (
                <Text style={styles.tamponVide}>Cadre réservé à l’administration</Text>
              )}
            </View>
          </Panneau>

          {bienvenue ? (
            <Text style={styles.bienvenue}>Bienvenue. Guichet 3.</Text>
          ) : (
            <>
              <BoutonPoussoir
                libelle="TAMPONNER"
                onPress={valider}
                desactive={!complet}
                accessibilityHint="Valide votre demande d’emploi"
              />
              {!complet && <Text style={styles.manque}>Dossier incomplet : cochez les deux cases.</Text>}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  flex: {
    flex: 1,
  },
  contenu: {
    padding: Espace.l,
    gap: Espace.l,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logo: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.heros,
    color: Colors.anthracite,
    textAlign: 'center',
    letterSpacing: 1,
  },
  logoEtroit: {
    fontSize: Typo.grand,
  },
  formulaire: {
    padding: Espace.l,
    gap: Espace.s,
    backgroundColor: Colors.papierFiche,
  },
  cerfa: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.titre,
    color: Colors.anthracite,
  },
  consigne: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
    marginBottom: Espace.s,
  },
  label: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  champ: {
    minHeight: 44,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    paddingHorizontal: Espace.m,
    fontFamily: Fonts.chiffres,
    fontSize: Typo.corps,
    color: Colors.anthracite,
    backgroundColor: Colors.papier,
  },
  aide: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    color: Colors.crayon,
    marginBottom: Espace.xs,
  },
  caseLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    minHeight: 44,
  },
  case: {
    width: 26,
    height: 26,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    backgroundColor: Colors.papier,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseCochee: {
    backgroundColor: Colors.vertClair,
  },
  caseTexte: {
    flex: 1,
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  cadreTampon: {
    marginTop: Espace.s,
    height: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.crayonClair,
    borderRadius: Charte.rayonMini,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tamponVide: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayonClair,
  },
  tampon: {
    borderWidth: 4,
    borderColor: Colors.encre,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.l,
    paddingVertical: 2,
    transform: [{ rotate: '-8deg' }],
  },
  tamponTexte: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.grand,
    color: Colors.encre,
    letterSpacing: 2,
  },
  bienvenue: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.grand,
    color: Colors.anthracite,
    textAlign: 'center',
  },
  manque: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
    textAlign: 'center',
  },
});
