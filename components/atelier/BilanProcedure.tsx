import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ProcAtelier } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import { Effets } from '@/components/atelier/Elements';

/**
 * En-tête d'une procédure de l'Atelier : dossiers en cours, usagers perdus dans la procédure et bilan d'un
 * dossier qui la franchit en entier (symbole + mot, la couleur ne fait que doubler l'information).
 */
export default function BilanProcedure({ proc }: { proc: ProcAtelier }) {
  const enCours = `${formatEntier(proc.enCours)} dossier${proc.enCours > 1 ? 's' : ''} en cours`;
  const abandons = `${formatEntier(proc.abandons)} abandon${proc.abandons > 1 ? 's' : ''}`;
  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayonPetit}>
      <View
        accessible
        accessibilityLabel={`${proc.nom} : ${enCours}, ${abandons}. Par dossier : ${proc.bilan
          .map((e) => e.texte)
          .join(', ')}.`}
      >
        <Text style={styles.compteurs}>
          {enCours} · {abandons}
        </Text>
        <View style={styles.ligne}>
          <Text style={styles.libelle}>Par dossier</Text>
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
