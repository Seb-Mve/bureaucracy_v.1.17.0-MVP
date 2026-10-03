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
  /** Part de largeur : « large » pour la valeur la plus longue (le budget), sinon pour un libellé long sur écran serré. */
  place?: 'large' | 'libelleLong' | 'libelleMoyen';
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
  place,
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
        place && PLACE_STYLE[place],
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
  // Écran étroit : colonnes resserrées.
  const etroit = width < 400;
  // Écran étroit à quatre colonnes : la largeur va aux libellés longs (« Formulaires », « Conformité » en 13 px)
  // plutôt qu'au budget, dont la valeur rétrécit d'elle-même pour tenir.
  const serre = etroit && mods.conformiteVisible;
  const rupture = etat.formulaires < mods.pieces;
  // En rupture, le budget est en cause aussi s'il ne paie plus une ramette (une fois les ramettes en vente).
  const sansBudget = rupture && mods.recrutementVisible && etat.budget < prixRamette;

  return (
    <View style={styles.conteneur}>
      <View style={styles.ligne}>
        <Colonne
          premiere
          place={serre ? undefined : 'large'}
          label="Budget"
          valeur={`${formatMontant(etat.budget)}`}
          compact={compact}
          etroit={etroit}
          rupture={sansBudget}
          declencheur={verdict?.id}
        />
        <Colonne
          label="Formulaires"
          place={serre ? 'libelleLong' : undefined}
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
            place={serre ? 'libelleMoyen' : undefined}
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
  colonneLibelleLong: {
    flex: 1.15,
  },
  colonneLibelleMoyen: {
    flex: 1.05,
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
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
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

const PLACE_STYLE = {
  large: styles.colonneLarge,
  libelleLong: styles.colonneLibelleLong,
  libelleMoyen: styles.colonneLibelleMoyen,
} as const;

const TAILLE_STYLE: Record<number, TextStyle | undefined> = {
  [Typo.corps]: styles.valeurCorps,
  [Typo.petit]: styles.valeurPetit,
};
