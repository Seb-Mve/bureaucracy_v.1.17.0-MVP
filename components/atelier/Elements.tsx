import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  FileCheck,
  Hourglass,
  Landmark,
  Paperclip,
  PenLine,
  Stamp,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import {
  useGameState,
  type EffetAffiche,
  type EtapeType,
} from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';

const ICONES: Record<EtapeType, LucideIcon> = {
  piece: FileCheck,
  visa: Stamp,
  signature: PenLine,
  pieceService: Landmark,
  reflexion: Hourglass,
  commission: Users,
};

/** Pastille ronde d'une étape, avec son pictogramme (le visa, qui attend un tampon, est jaune). */
export function IconeEtape({ type }: { type: EtapeType }) {
  const { encre } = useGameState();
  const Icone = ICONES[type];
  return (
    <View
      style={[
        styles.rond,
        { backgroundColor: type === 'visa' ? Colors.pastelJaune : encre.fond },
      ]}
    >
      <Icone size={18} color={Colors.anthracite} />
    </View>
  );
}

const FONDS = StyleSheet.create({
  plus: { backgroundColor: Colors.pastelVert },
  moins: { backgroundColor: Colors.rougeFond },
  neutre: { backgroundColor: Colors.papier },
});

/** Effets d'une étape : un symbole et un mot chacun, la couleur ne fait que doubler l'information. */
export function Effets({ effets }: { effets: EffetAffiche[] }) {
  return (
    <View style={styles.effets}>
      {effets.map((e) => (
        <View key={e.texte} style={[styles.effet, FONDS[e.sens]]}>
          <Text style={styles.effetTexte}>{e.texte}</Text>
        </View>
      ))}
    </View>
  );
}

/** Trombone entre deux fiches d'une même procédure. */
export function Trombone() {
  return (
    <View
      style={styles.trombone}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Paperclip size={18} color={Colors.anthracite} />
    </View>
  );
}

/** Trombone fermé sur lui-même : ces procédures s'exigent mutuellement (jamais nommé « boucle »). */
export function TromboneFerme() {
  const { encre } = useGameState();
  return (
    <View
      style={[styles.anneau, { borderColor: encre.texte }]}
      accessible
      accessibilityLabel="Ces procédures s’exigent mutuellement"
    >
      <Paperclip size={14} color={encre.texte} />
    </View>
  );
}

const styles = StyleSheet.create({
  rond: {
    width: 36,
    height: 36,
    borderRadius: Charte.rayon,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espace.xs,
    marginTop: Espace.xs,
  },
  effet: {
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    paddingHorizontal: Espace.xs,
  },
  effetTexte: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.anthracite,
  },
  trombone: {
    alignItems: 'center',
    marginVertical: -Espace.xs,
    zIndex: 1,
  },
  anneau: {
    width: 24,
    height: 24,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
