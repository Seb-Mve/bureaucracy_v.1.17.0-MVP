import React, { useCallback, useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import JaugeHachuree from '@/components/charte/JaugeHachuree';
import { formatNumberFrench, formatMontant } from '@/utils/formatters';
import { PATIENCE_MAX } from '@/types/game';

const PAS = 0.05;

/** Curseur du Taux de rejet (débloqué par la note de service n° 2). */
export default function CurseurRejet() {
  const { etat, mods, reglerTauxRejet, coutRejet } = useGameState();
  const largeur = useRef(1);
  const max = mods.rejetMax;
  const taux = Math.min(etat.tauxRejet, max);

  const regler = useCallback((t: number) => reglerTauxRejet(Math.max(0, Math.min(max, t))), [reglerTauxRejet, max]);
  const reglerRef = useRef(regler);
  reglerRef.current = regler;
  const maxRef = useRef(max);
  maxRef.current = max;

  const depuisX = (x: number) => {
    const brut = (x / largeur.current) * maxRef.current;
    reglerRef.current(Math.round(brut / 0.01) * 0.01);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => depuisX(e.nativeEvent.locationX),
        onPanResponderMove: (e) => depuisX(e.nativeEvent.locationX),
      }),
    [],
  );

  const surLayout = (e: LayoutChangeEvent) => {
    largeur.current = Math.max(1, e.nativeEvent.layout.width);
  };

  const pct = Math.round(taux * 100);
  // Le prix du rejet, en clair : la prime gagnée et les usagers perdus pour de bon.
  // Tout rejet finira par coûter des usagers : la ligne prévient avant la première perte, pas après.
  const pertes = coutRejet.abandonsParMin >= 0.05;
  const cout =
    pct === 0
      ? 'Aucun rejet : aucun usager perdu.'
      : `Prime +${formatMontant(coutRejet.primeParRejet)} par rejet · ${
          pertes
            ? `${formatNumberFrench(coutRejet.abandonsParMin)} usagers perdus/min`
            : `${PATIENCE_MAX} rejets = 1 usager perdu`
        }`;

  return (
    <View style={styles.bloc}>
      <View style={styles.ligne}>
        <View style={styles.entete}>
          <Text style={styles.valeur}>
            <Text style={styles.label}>Rejet </Text>
            {pct} %
          </Text>
          <Text style={styles.plafond}>max {Math.round(max * 100)} %</Text>
        </View>
        <Pressable
          style={styles.pas}
          onPress={() => regler(taux - PAS)}
          accessibilityRole="button"
          accessibilityLabel="Diminuer le taux de rejet"
        >
          <Minus size={18} color={Colors.anthracite} />
        </Pressable>
        <View
          style={styles.piste}
          onLayout={surLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Taux de rejet"
          accessibilityValue={{ min: 0, max: Math.round(max * 100), now: pct, text: `${pct} %` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => regler(taux + (e.nativeEvent.actionName === 'increment' ? PAS : -PAS))}
          {...pan.panHandlers}
        >
          <View pointerEvents="none">
            <JaugeHachuree
              valeur={max > 0 ? taux / max : 0}
              couleur={Colors.encre}
              couleurClaire={Colors.encreClaire}
              hauteur={22}
              motif="jauge-rejet"
            />
          </View>
        </View>
        <Pressable
          style={styles.pas}
          onPress={() => regler(taux + PAS)}
          accessibilityRole="button"
          accessibilityLabel="Augmenter le taux de rejet"
        >
          <Plus size={18} color={Colors.anthracite} />
        </Pressable>
      </View>
      <Text style={[styles.cout, pct > 0 && styles.coutPerte]} accessibilityLiveRegion="polite">
        {cout}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cout: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
    marginTop: 2,
    textAlign: 'center',
  },
  coutPerte: {
    color: Colors.rougeTexte,
  },
  bloc: {
    marginHorizontal: Espace.m,
    marginTop: Espace.xs,
  },
  entete: {
    width: 84,
  },
  label: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  valeur: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  plafond: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
  },
  piste: {
    flex: 1,
    paddingVertical: Espace.m,
  },
  pas: {
    width: 44,
    height: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papierChaud,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
