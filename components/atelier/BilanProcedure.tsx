import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LigneProduction, ProcAtelier } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import { Effets } from '@/components/atelier/Elements';

/**
 * En-tête d'une procédure de l'Atelier : ses demandes et ses documents délivrés (relevé « Production du
 * service »), puis le bilan d'une demande qui la franchit en entier (symbole + mot, la couleur ne fait que
 * doubler l'information).
 */
export default function BilanProcedure({
  proc,
  ligne,
}: {
  proc: ProcAtelier;
  ligne: LigneProduction | undefined;
}) {
  const compteurs = ligne
    ? `${ligne.demandesTexte} · ${ligne.delivresTexte}`
    : '';
  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayonPetit}>
      <View
        accessible
        accessibilityLabel={`${proc.nom} : ${compteurs}. Par demande : ${proc.bilan
          .map((e) => e.texte)
          .join(', ')}.`}
      >
        <Text style={styles.compteurs}>{compteurs}</Text>
        <View style={styles.ligne}>
          <Text style={styles.libelle}>Par demande</Text>
          <Effets effets={proc.bilan} />
        </View>
      </View>
    </Panneau>
  );
}

const styles = StyleSheet.create({
  carte: {
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
    backgroundColor: Colors.papierChaud,
  },
  compteurs: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  ligne: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: Espace.s,
  },
  libelle: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
    marginTop: Espace.xs,
  },
});
