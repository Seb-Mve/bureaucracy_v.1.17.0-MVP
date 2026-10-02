import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ScrollText, X } from 'lucide-react-native';
import { useFenetreBloquante, useGameState, type CirculaireDef } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';

/**
 * Circulaire : explique une mécanique au moment où elle apparaît, une seule fois.
 * Elle prend la place du fil, sous les ressources (rien ne se pose sur la scène) ;
 * « Lire » ouvre le texte complet, jeu en pause le temps de la lecture. L'ouvrir vaut
 * prise de connaissance (les plus anciennes encore en attente, dépassées, sont classées avec elle).
 * Toujours monté, pour que la lecture survive à la disparition du bandeau.
 */
export default function Circulaire({ bandeau }: { bandeau: boolean }) {
  const { circulaire, marquerCirculaireVue } = useGameState();
  const compact = useWindowDimensions().height < 720;
  const [lue, setLue] = useState<CirculaireDef | null>(null);
  useFenetreBloquante('circulaire', lue !== null, () => setLue(null));

  const lire = (c: CirculaireDef) => {
    setLue(c);
    marquerCirculaireVue(c.id);
  };
  const sur = circulaire ? `CIRCULAIRE N° ${circulaire.numero}` : '';

  return (
    <>
      {bandeau && circulaire && (
        <View style={[styles.bandeau, compact && styles.bandeauCompact]} accessibilityLiveRegion="polite">
          <Pressable
            style={({ pressed }) => [styles.titreZone, pressed && styles.presseLeger]}
            onPress={() => lire(circulaire)}
            accessibilityRole="button"
            accessibilityLabel={`Lire la circulaire n° ${circulaire.numero} : ${circulaire.titre}`}
          >
            <ScrollText size={18} color={Colors.anthracite} />
            <View style={styles.textes}>
              {!compact && <Text style={styles.sur}>{sur}</Text>}
              <Text style={styles.titre} numberOfLines={2}>
                {compact && <Text style={styles.sur}>{sur} · </Text>}
                {circulaire.titre}
              </Text>
            </View>
            <Text style={styles.lire}>Lire</Text>
          </Pressable>
          <Pressable
            onPress={() => marquerCirculaireVue(circulaire.id)}
            style={styles.fermer}
            accessibilityRole="button"
            accessibilityLabel="Pris connaissance, fermer la circulaire"
          >
            <X size={18} color={Colors.anthracite} />
          </Pressable>
        </View>
      )}

      <Modal visible={lue !== null} transparent animationType="fade" onRequestClose={() => setLue(null)}>
        <Pressable style={styles.voile} onPress={() => setLue(null)} accessible={false}>
          <Pressable onPress={() => undefined} accessible={false} style={styles.colonne}>
            {lue && (
              <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
                <Text style={styles.referenceFiche}>Circulaire n° {lue.numero} · S.I.C.</Text>
                <Text style={styles.titreFiche} accessibilityRole="header">
                  {lue.titre}
                </Text>
                <Text style={styles.texte}>{lue.texte}</Text>
                <Pressable
                  onPress={() => setLue(null)}
                  style={({ pressed }) => [styles.pris, pressed && styles.presse]}
                  accessibilityRole="button"
                >
                  <Text style={styles.prisTexte}>Pris connaissance</Text>
                </Pressable>
              </Panneau>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  /** Sur grand écran, la fenêtre garde la largeur de la colonne de l'app. */
  colonne: {
    width: '100%',
    maxWidth: Charte.largeurColonne,
    alignSelf: 'center',
  },
  /** Même gabarit que le fil du jour, dont il prend la place. */
  bandeau: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingLeft: Espace.l,
    paddingVertical: Espace.s,
    backgroundColor: Colors.papierFiche,
  },
  bandeauCompact: {
    paddingVertical: Espace.xs,
  },
  titreZone: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
  },
  presseLeger: {
    opacity: 0.7,
  },
  textes: {
    flex: 1,
  },
  sur: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    letterSpacing: 0.6,
    color: Colors.encreTexte,
  },
  titre: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  lire: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.encreTexte,
  },
  fermer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voile: {
    flex: 1,
    justifyContent: 'center',
    padding: Espace.l,
    backgroundColor: Colors.voile,
  },
  fiche: {
    padding: Espace.l,
    gap: Espace.s,
    backgroundColor: Colors.papierFiche,
  },
  referenceFiche: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
  },
  titreFiche: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.titre,
    lineHeight: Interligne.titre,
    color: Colors.anthracite,
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  pris: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Espace.m,
    marginTop: Espace.xs,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.encre,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  prisTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
});
