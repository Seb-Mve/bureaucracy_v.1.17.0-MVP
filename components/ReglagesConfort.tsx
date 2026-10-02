import React from 'react';
import { Platform, StyleSheet, Switch, Text, View, type SwitchProps } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import Colors, { Fonts } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';

/** Sur le web, la pastille de l'interrupteur actif a sa propre couleur (bleu-vert par défaut). */
const PASTILLE_WEB = { activeThumbColor: Colors.papier } as Partial<SwitchProps>;

interface LigneProps {
  titre: string;
  aide: string;
  valeur: boolean;
  surChange: (v: boolean) => void;
}

function Ligne({ titre, aide, valeur, surChange }: LigneProps) {
  return (
    <View style={styles.ligne}>
      <View style={styles.textes}>
        <Text style={styles.titre}>{titre}</Text>
        <Text style={styles.aide}>{aide}</Text>
      </View>
      <Switch
        value={valeur}
        onValueChange={surChange}
        trackColor={{ false: Colors.carton, true: Colors.encre }}
        thumbColor={Colors.papier}
        {...(Platform.OS === 'web' ? PASTILLE_WEB : null)}
        accessibilityLabel={titre}
      />
    </View>
  );
}

/** Réglages de confort, propres à l'appareil (ils survivent à « Effacer la partie »). */
export default function ReglagesConfort() {
  const { vibrations, animationsReduites, regler } = usePreferences();

  return (
    <Panneau contenuStyle={styles.fiche} rayon={14}>
      {Platform.OS !== 'web' && (
        <Ligne
          titre="Vibrations"
          aide="Un léger retour à chaque coup de tampon et à chaque achat."
          valeur={vibrations}
          surChange={(v) => regler({ vibrations: v })}
        />
      )}
      <Ligne
        titre="Animations réduites"
        aide="Coupe la secousse de la scène et les compteurs qui sautent. Suit aussi le réglage de l’appareil."
        valeur={animationsReduites}
        surChange={(v) => regler({ animationsReduites: v })}
      />
    </Panneau>
  );
}

const styles = StyleSheet.create({
  fiche: {
    padding: 12,
    gap: 12,
    backgroundColor: Colors.papierChaud,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  textes: {
    flex: 1,
    gap: 2,
  },
  titre: {
    fontFamily: Fonts.texteGras,
    fontSize: 14,
    color: Colors.anthracite,
  },
  aide: {
    fontFamily: Fonts.texte,
    fontSize: 12,
    color: Colors.crayon,
  },
});
