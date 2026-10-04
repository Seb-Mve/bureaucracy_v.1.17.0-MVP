import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChoixEtape } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { IconeEtape } from '@/components/atelier/Elements';

/**
 * Étape pas encore réglementée, dans la feuille « Ajouter une étape » : grisée, non sélectionnable, marquée
 * « En attente de réglementation » (aucune note n'est citée).
 */
function ChoixVerrouille({ choix }: { choix: ChoixEtape }) {
  return (
    <View
      style={styles.choix}
      accessible
      accessibilityRole="radio"
      accessibilityState={{ disabled: true, checked: false }}
      // react-native-web ne traduit plus accessibilityState : l'état désactivé passe aussi par aria-*.
      aria-disabled
      aria-checked={false}
      accessibilityLabel={`${choix.nom}. En attente de réglementation`}
    >
      <View style={styles.icone}>
        <IconeEtape type={choix.type} />
      </View>
      <View style={styles.texte}>
        <Text style={styles.nom}>{choix.nom}</Text>
        <Text style={styles.mention}>En attente de réglementation</Text>
      </View>
    </View>
  );
}

export default memo(ChoixVerrouille);

const styles = StyleSheet.create({
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    minHeight: 44,
    borderWidth: Charte.traitFin,
    borderStyle: 'dashed',
    borderColor: Colors.crayonClair,
    borderRadius: Charte.rayonPetit,
    backgroundColor: Colors.creme,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
  },
  icone: {
    opacity: 0.5,
  },
  texte: {
    flex: 1,
    gap: 2,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.crayon,
  },
  mention: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
    textTransform: 'uppercase',
  },
});
