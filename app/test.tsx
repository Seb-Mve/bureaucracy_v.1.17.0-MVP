import React, { memo, useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useGameState,
  type Preset,
  type PresetInfo,
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
import Confirmation from '@/components/charte/Confirmation';

interface CarteProps {
  info: PresetInfo;
  onChoisir: (id: Preset) => void;
}

/** Une carte par préréglage : titre et une ligne de détail (outil de test, pas un écran de jeu). */
const CarteRaccourci = memo(function CarteRaccourci({
  info,
  onChoisir,
}: CarteProps) {
  const choisir = useCallback(() => onChoisir(info.id), [info.id, onChoisir]);
  return (
    <Pressable
      onPress={choisir}
      accessibilityRole="button"
      accessibilityLabel={`Charger ${info.titre}`}
      accessibilityHint={info.detail}
      style={({ pressed }) => [styles.carte, pressed && styles.presse]}
    >
      <Panneau contenuStyle={styles.fiche} rayon={Charte.rayonPetit}>
        <Text style={styles.titreCarte}>{info.titre}</Text>
        <Text style={styles.detail}>{info.detail}</Text>
      </Panneau>
    </Pressable>
  );
});

/** Raccourcis de test : remplacer la partie par une sauvegarde prête, de l’acte I à la Réforme. */
export default function EcranRaccourcis() {
  const { pret, raccourcisActifs, raccourcis, chargerRaccourci, encre } =
    useGameState();
  const [choisi, setChoisi] = useState<PresetInfo | null>(null);

  const choisir = useCallback(
    (id: Preset) => setChoisi(raccourcis.find((r) => r.id === id) ?? null),
    [raccourcis],
  );
  const confirmer = useCallback(() => {
    if (!choisi) return;
    setChoisi(null);
    chargerRaccourci(choisi.id);
  }, [choisi, chargerRaccourci]);
  const annuler = useCallback(() => setChoisi(null), []);
  const fermer = useCallback(() => router.replace('/'), []);

  if (!raccourcisActifs) return <Redirect href="/" />;
  // La sauvegarde doit être lue avant d’être remplacée (sinon le chargement l’écraserait).
  if (!pret) return null;

  return (
    <SafeAreaView style={styles.ecran}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre} accessibilityRole="header">
          Raccourcis de test
        </Text>
        {raccourcis.map((r) => (
          <CarteRaccourci key={r.id} info={r} onChoisir={choisir} />
        ))}
        <BoutonPoussoir
          libelle="Fermer"
          onPress={fermer}
          hauteur={52}
          taille={Typo.titre}
          couleur={Colors.papier}
          couleurOmbre={Colors.carton}
          accessibilityLabel="Fermer les raccourcis de test"
          style={styles.fermer}
        />
      </ScrollView>
      <Confirmation
        visible={choisi !== null}
        titre={choisi?.titre ?? ''}
        message="La partie en cours sera remplacée."
        libelleConfirmer="Charger"
        couleur={encre.face}
        onConfirmer={confirmer}
        onAnnuler={annuler}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  contenu: {
    padding: Espace.m,
    gap: Espace.m,
  },
  titre: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.grand,
    lineHeight: Interligne.grand,
    color: Colors.anthracite,
    marginTop: Espace.s,
  },
  carte: {
    minHeight: 44,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  fiche: {
    minHeight: 44,
    paddingVertical: Espace.s,
    paddingHorizontal: Espace.m,
    gap: Espace.xs,
    backgroundColor: Colors.papierChaud,
  },
  titreCarte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  detail: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  fermer: {
    marginTop: Espace.s,
  },
});
