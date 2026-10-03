import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Espace, Typo } from '@/constants/Colors';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';

/** Durée pendant laquelle le bouton dit « PLUS DE FORMULAIRES » après un coup dans le vide (ms). */
const DUREE_SIGNAL = 1500;

/** Un champ de saisie ou une fenêtre ouverte garde la barre d'espace pour lui. */
function espaceLibre(e: KeyboardEvent): boolean {
  const cible = e.target as HTMLElement | null;
  if (
    cible &&
    (cible.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName))
  )
    return false;
  return document.querySelector('[aria-modal="true"]') === null;
}

/**
 * Le bouton TAMPONNER. En rupture, rien ne s'affiche d'avance : c'est en tamponnant dans le vide
 * que le bouton dit « PLUS DE FORMULAIRES » (la pastille de l'onglet où s'en procurer fait le reste).
 * Le gain d'un coup se lit dans les compteurs.
 */
export default function BoutonTamponner() {
  const { tamponner, enAttente, etat, mods } = useGameState();
  const focalise = useIsFocused();
  // Petit écran : bouton un peu moins haut, pour laisser la place à la scène.
  const compact = useWindowDimensions().height < 720;
  const [signal, setSignal] = useState(0);

  const surTap = useCallback(() => {
    if (tamponner().rupture) setSignal((n) => n + 1);
  }, [tamponner]);
  const action = useRef(surTap);
  action.current = surTap;

  useEffect(() => {
    if (signal === 0) return;
    const t = setTimeout(() => setSignal(0), DUREE_SIGNAL);
    return () => clearTimeout(t);
  }, [signal]);

  const rupture = etat.formulaires < mods.pieces;
  const vide = enAttente < 1;
  const libelle = signal > 0 ? 'PLUS DE FORMULAIRES' : vide && !rupture ? 'AUCUN DOSSIER' : 'TAMPONNER';
  const eteint = rupture || vide;

  // Web : la barre d'espace tamponne (un appui = un coup).
  useEffect(() => {
    if (Platform.OS !== 'web' || !focalise) return;
    // Sur le Guichet, Espace tamponne toujours, même si un bouton (« + » du rejet…) a gardé le focus :
    // on l'intercepte avant lui et on retire le focus, sinon le navigateur « recliquerait » ce bouton.
    const surTouche = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !espaceLibre(e)) return;
      e.preventDefault();
      e.stopPropagation();
      const focus = document.activeElement as HTMLElement | null;
      if (focus && focus.tagName === 'BUTTON') focus.blur();
      if (!e.repeat) action.current();
    };
    const bloquerRelache = (e: KeyboardEvent) => {
      if (e.code === 'Space' && espaceLibre(e)) e.preventDefault();
    };
    document.addEventListener('keydown', surTouche, true);
    document.addEventListener('keyup', bloquerRelache, true);
    return () => {
      document.removeEventListener('keydown', surTouche, true);
      document.removeEventListener('keyup', bloquerRelache, true);
    };
  }, [focalise]);

  return (
    <View style={[styles.zone, compact && styles.zoneCompacte]}>
      <BoutonPoussoir
        libelle={libelle}
        onPress={surTap}
        immediat
        hauteur={compact ? 54 : 66}
        taille={libelle === 'TAMPONNER' ? Typo.grand : Typo.titre}
        couleur={eteint ? Colors.carton : Colors.encre}
        couleurOmbre={eteint ? Colors.crayonClair : Colors.encreFlanc}
        couleurTexte={signal > 0 ? Colors.rougeTexte : eteint ? Colors.crayon : Colors.anthracite}
        accessibilityLabel="Tamponner un dossier"
        accessibilityHint={rupture ? 'Plus de formulaires' : vide ? 'Aucun dossier en attente' : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: Espace.m,
    paddingTop: Espace.s,
    paddingBottom: Espace.s,
  },
  zoneCompacte: {
    paddingTop: Espace.xs,
  },
});
