import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type TextStyle } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatEntier, formatPourcent, formatMontant } from '@/utils/formatters';
import JaugeHachuree from '@/components/charte/JaugeHachuree';
import ValeurAnimee from '@/components/charte/ValeurAnimee';
import { useLargeur } from '@/components/charte/useLargeur';
import { usePreferences } from '@/context/PreferencesContext';

type Etat = 'normal' | 'bas' | 'rupture';

/** Durée d'affichage d'une définition (ms). */
const DUREE_DEFINITION = 5000;
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
  definition: string;
  surDefinition: (texte: string) => void;
  etat?: Etat;
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
  definition,
  surDefinition,
  etat = 'normal',
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
  // Le libellé ne change jamais (un mot = une grandeur) : l'état du stock s'écrit dessous, en 13 px.
  const statut = etat === 'rupture' ? 'Rupture' : etat === 'bas' ? 'Stock bas' : null;
  const couleurTexte = etat === 'rupture' ? styles.texteRupture : etat === 'bas' ? styles.texteBas : null;
  return (
    <Pressable
      onPress={() => surDefinition(definition)}
      onLongPress={() => surDefinition(definition)}
      delayLongPress={350}
      style={[
        styles.colonne,
        compact && styles.colonneCompacte,
        etroit && styles.colonneEtroite,
        large && styles.colonneLarge,
        !premiere && styles.separee,
        etat === 'rupture' && styles.fondRupture,
        etat === 'bas' && styles.fondBas,
      ]}
      accessibilityLabel={`${label} : ${valeur}${statut ? `, ${statut}` : ''}`}
      accessibilityRole="button"
      accessibilityHint="Affiche la définition"
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
      {statut && (
        <Text style={[styles.statut, couleurTexte]} numberOfLines={1}>
          {statut}
        </Text>
      )}
      {children}
    </Pressable>
  );
});

/**
 * Tableau des ressources, à plat sous l'en-tête : budget, formulaires, dossiers en attente
 * et, une fois révélée, Conformité. Toucher une colonne donne sa définition.
 */
export default function Hud() {
  const { etat, mods, conformite, verdict, stockBas, enAttente } = useGameState();
  const [definition, setDefinition] = useState<string | null>(null);
  const { definitionsDecouvertes, regler } = usePreferences();
  const { height, width } = useWindowDimensions();
  const compact = height < 720;
  // Écran étroit : colonnes resserrées, pour que « Formulaires » tienne entier à côté de la Conformité.
  const etroit = width < 400;
  const rupture = etat.formulaires < mods.pieces;
  const etatStock: Etat = rupture ? 'rupture' : stockBas ? 'bas' : 'normal';
  const pieces = mods.pieces === 1 ? '1 formulaire' : `${formatEntier(mods.pieces)} formulaires`;

  const surDefinition = useCallback(
    (texte: string) => {
      setDefinition((d) => (d === texte ? null : texte));
      if (!definitionsDecouvertes) regler({ definitionsDecouvertes: true });
    },
    [definitionsDecouvertes, regler],
  );
  useEffect(() => {
    if (definition === null) return;
    const t = setTimeout(() => setDefinition(null), DUREE_DEFINITION);
    return () => clearTimeout(t);
  }, [definition]);

  return (
    <View style={styles.conteneur}>
      <View style={styles.ligne}>
        <Colonne
          premiere
          large
          label="Budget"
          valeur={`${formatMontant(etat.budget)}`}
          definition="Budget : la dotation versée pour chaque dossier traité. Il paie les recrutements, les ramettes et les notes de service."
          surDefinition={surDefinition}
          compact={compact}
          etroit={etroit}
          declencheur={verdict?.id}
        />
        <Colonne
          label="Formulaires"
          valeur={formatEntier(etat.formulaires)}
          definition={`Formulaires : chaque dossier traité en consomme ${pieces}. À zéro, plus rien ne se traite. ${
            mods.recrutementVisible
              ? 'Les ramettes s’achètent dans Recrutement, ou d’un geste sous la scène.'
              : 'Pour en commander, visez la note de service n° 1.'
          }`}
          surDefinition={surDefinition}
          compact={compact}
          etroit={etroit}
          etat={etatStock}
          declencheur={verdict?.id}
          effet="baisse"
        />
        <Colonne
          label="En attente"
          valeur={formatEntier(Math.floor(enAttente))}
          definition="En attente : les dossiers déposés au guichet qui n’ont pas encore été tamponnés."
          surDefinition={surDefinition}
          compact={compact}
          etroit={etroit}
        />
        {mods.conformiteVisible && (
          <Colonne
            label="Conformité"
            valeur={`${formatPourcent(conformite)} %`}
            definition="Conformité : elle monte avec la rigueur du guichet (dossiers rejetés, pièces exigées en plus). À 100 %, la note de service n° 22 clôt l’acte."
            surDefinition={surDefinition}
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
      {definition === null && !definitionsDecouvertes && (
        <Text style={styles.astuce}>Touchez un compteur pour savoir à quoi il sert.</Text>
      )}
      {definition !== null && (
        <Pressable
          onPress={() => setDefinition(null)}
          style={styles.definition}
          accessibilityRole="button"
          accessibilityLabel={`${definition} Fermer`}
        >
          <Text style={styles.definitionTexte}>{definition}</Text>
        </Pressable>
      )}
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
  fondBas: {
    backgroundColor: Colors.encreFond,
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
  statut: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
  },
  texteRupture: {
    color: Colors.rougeTexte,
  },
  texteBas: {
    color: Colors.encreTexte,
  },
  conteneur: {
    zIndex: 5,
  },
  /** En surimpression sous le HUD : la définition ne pousse pas l'écran. */
  definition: {
    position: 'absolute',
    top: '100%',
    left: Espace.l,
    right: Espace.l,
    marginTop: Espace.xs,
    shadowColor: Colors.anthracite,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    backgroundColor: Colors.papierChaud,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
  },
  astuce: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.crayon,
    paddingHorizontal: Espace.l,
    paddingTop: Espace.xs,
  },
  definitionTexte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
});

const TAILLE_STYLE: Record<number, TextStyle | undefined> = {
  [Typo.corps]: styles.valeurCorps,
  [Typo.petit]: styles.valeurPetit,
};
