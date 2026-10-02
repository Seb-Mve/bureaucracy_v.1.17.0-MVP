import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Espace } from '@/constants/Colors';
import Hud from '@/components/Hud';
import FilDuJour from '@/components/guichet/FilDuJour';
import BulleGuichet from '@/components/guichet/BulleGuichet';
import Circulaire from '@/components/Circulaire';
import BandeauAnnulation from '@/components/BandeauAnnulation';
import SceneGuichet from '@/components/SceneGuichet';
import CurseurRejet from '@/components/CurseurRejet';
import BoutonTamponner from '@/components/BoutonTamponner';

/**
 * Écran principal : le guichet 3, sans défilement.
 * Ressources, ce qui réclame l'attention, la parole de l'usager, puis la scène cadrée sur l'action
 * (elle prend toute la place restante), le taux de rejet et TAMPONNER.
 */
export default function GuichetScreen() {
  const { mods, circulaire, etat, dernierAchat, notes, consigne } = useGameState();
  // Petit écran : bulle sur une ligne, la hauteur va à la scène.
  const compact = useWindowDimensions().height < 720;
  // Une seule ligne d'attention sous les ressources. Priorité : la rupture, la note de fin et la note en
  // instruction, puis la circulaire, puis le fil (une nouvelle note se signale aussi par la pastille de l'onglet).
  // Pendant une instruction, seule la circulaire « Relance » (qui l'explique) peut passer devant le compte à rebours.
  const instruction = notes.some((n) => n.statut === 'instruction');
  const urgent =
    etat.formulaires < mods.pieces ||
    consigne?.id === 'fin' ||
    (instruction && circulaire?.id !== 'relance');
  const circulaireAffichee =
    circulaire !== null && etat.fichePosteVue && !(etat.acteTermine && !etat.finActeVue) && !urgent;

  return (
    <View style={styles.ecran}>
      <Hud />
      {!circulaireAffichee && <FilDuJour />}
      <Circulaire bandeau={circulaireAffichee} />
      <BulleGuichet compact={compact} />
      <View style={styles.zoneScene}>
        <SceneGuichet />
        {/* Le bandeau d'annulation se pose en haut de la scène (le mur), quelques secondes : il ne cache
            ni le fil, ni le comptoir, ni la ligne de débit, et ne recouvre rien d'interactif. */}
        {dernierAchat && <BandeauAnnulation style={styles.annulation} />}
      </View>
      {mods.rejetVisible && <CurseurRejet />}
      <BoutonTamponner />
    </View>
  );
}

const styles = StyleSheet.create({
  zoneScene: {
    flex: 1,
    minHeight: 0,
  },
  annulation: {
    position: 'absolute',
    // Sous la ligne de débit (qui reste visible), au-dessus de la tête de l'agent.
    top: Espace.s + Espace.xxl,
    left: Espace.m,
    right: Espace.m,
    zIndex: 3,
  },
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
});
