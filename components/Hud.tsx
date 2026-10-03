import React, { memo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type TextStyle } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatEntier, formatPourcent, formatMontant } from '@/utils/formatters';
import JaugeHachuree from '@/components/charte/JaugeHachuree';
import ValeurAnimee from '@/components/charte/ValeurAnimee';
import { useLargeur } from '@/components/charte/useLargeur';

/** Chasse de Roboto Mono : chaque caractère occupe 0,6 em. */
const CHASSE_CHIFFRES = 0.6;
/** Tailles permises pour une valeur, de la plus grande à la plus petite (jamais sous 13 px). */
const TAILLES_VALEUR = [Typo.titre, Typo.corps, Typo.petit] as const;

/** La plus grande taille qui laisse la valeur entière dans sa colonne (adjustsFontSizeToFit n'existe pas sur le web). */
function tailleQuiTient(texte: string, largeur: number): number {
  if (largeur <= 0) return Typo.titre;
  return TAILLES_VALEUR.find((t) => texte.length * t * CHASSE_CHIFFRES <= largeur) ?? Typo.petit;
}

interface ColonneProps {
  label: string;
  valeur: string;
  rupture?: boolean;
  declencheur?: number | null;
  effet?: 'pop' | 'baisse';
  premiere?: boolean;
  compact?: boolean;
  etroit?: boolean;
  /** Colonne qui reçoit un peu plus de place (le budget, la valeur la plus longue). */
  large?: boolean;
  children?: React.ReactNode;
}

const Colonne = memo(function Colonne({
  label,
  valeur,
  rupture = false,
  declencheur,
  effet,
  premiere,
  compact,
  etroit,
  large,
  children,
}: ColonneProps) {
  const { ref, largeur, surLayout } = useLargeur();
  const taille = tailleQuiTient(valeur, largeur);
  const couleurTexte = rupture ? styles.texteRupture : null;
  return (
    <View
      style={[
        styles.colonne,
        compact && styles.colonneCompacte,
        etroit && styles.colonneEtroite,
        large && styles.colonneLarge,
        !premiere && styles.separee,
        rupture && styles.fondRupture,
      ]}
      accessible
      accessibilityLabel={`${label} : ${valeur}${rupture ? ', rupture' : ''}`}
    >
      <Text style={[styles.label, couleurTexte]} numberOfLines={1}>
        {label}
      </Text>
      <View ref={ref} style={styles.zoneValeur} onLayout={surLayout}>
        <ValeurAnimee
          texte={valeur}
          declencheur={declencheur}
          effet={effet}
          style={[styles.valeur, TAILLE_STYLE[taille], couleurTexte]}
          numberOfLines={1}
        />
      </View>
      {children}
    </View>
  );
});

/**
 * Tableau des ressources, à plat sous l'en-tête : budget, formulaires, dossiers en attente
 * et, une fois révélée, Conformité.
 */
export default function Hud() {
  const { etat, mods, conformite, verdict, enAttente, prixRamette } = useGameState();
  const { height, width } = useWindowDimensions();
  const compact = height < 720;
  // Écran étroit : colonnes resserrées, pour que « Formulaires » tienne entier à côté de la Conformité.
  const etroit = width < 400;
  const rupture = etat.formulaires < mods.pieces;
  // En rupture, le budget est en cause aussi s'il ne paie plus une ramette (une fois les ramettes en vente).
  const sansBudget = rupture && mods.recrutementVisible && etat.budget < prixRamette;

  return (
    <View style={styles.conteneur}>
      <View style={styles.ligne}>
        <Colonne
          premiere
          large
          label="Budget"
          valeur={`${formatMontant(etat.budget)}`}
          compact={compact}
          etroit={etroit}
          rupture={sansBudget}
          declencheur={verdict?.id}
        />
        <Colonne
          label="Formulaires"
          valeur={formatEntier(etat.formulaires)}
          compact={compact}
          etroit={etroit}
          rupture={rupture}
          declencheur={verdict?.id}
          effet="baisse"
        />
        <Colonne
          label="En attente"
          valeur={formatEntier(Math.floor(enAttente))}
          compact={compact}
          etroit={etroit}
        />
        {mods.conformiteVisible && (
          <Colonne
            label="Conformité"
            valeur={`${formatPourcent(conformite)} %`}
            compact={compact}
            etroit={etroit}
          >
            <JaugeHachuree
              valeur={conformite / 100}
              couleur={Colors.vert}
              couleurClaire={Colors.vertClair}
              hauteur={8}
              motif="jauge-conformite"
              accessibilityLabel="Conformité"
            />
          </Colonne>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    paddingHorizontal: Espace.xs,
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
  },
  colonneLarge: {
    flex: 1.2,
  },
  colonneEtroite: {
    paddingHorizontal: Espace.xs,
  },
  valeurCorps: {
    fontSize: Typo.corps,
  },
  valeurPetit: {
    fontSize: Typo.petit,
  },
  zoneValeur: {
    alignSelf: 'stretch',
  },
  colonneCompacte: {
    paddingVertical: Espace.xs,
    gap: 0,
  },
  colonne: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Espace.s,
    paddingHorizontal: Espace.s,
    gap: Espace.xs,
  },
  separee: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.carton,
  },
  fondRupture: {
    backgroundColor: Colors.rougeFond,
  },
  label: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.crayon,
  },
  valeur: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.titre,
    lineHeight: Interligne.titre,
    color: Colors.anthracite,
    alignSelf: 'flex-start',
    transformOrigin: 'left center',
  },
  texteRupture: {
    color: Colors.rougeTexte,
  },
  conteneur: {
    zIndex: 5,
  },
});

const TAILLE_STYLE: Record<number, TextStyle | undefined> = {
  [Typo.corps]: styles.valeurCorps,
  [Typo.petit]: styles.valeurPetit,
};
