import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatEntier, formatEuros } from '@/utils/formatters';
import JaugeHachuree from '@/components/charte/JaugeHachuree';
import ValeurAnimee from '@/components/charte/ValeurAnimee';

type Etat = 'normal' | 'bas' | 'rupture';

/** Durée d'affichage d'une définition après un appui long (ms). */
const DUREE_DEFINITION = 5000;

interface ColonneProps {
  label: string;
  valeur: string;
  definition: string;
  surDefinition: (texte: string) => void;
  etat?: Etat;
  declencheur?: number | null;
  effet?: 'pop' | 'baisse';
  premiere?: boolean;
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
  children,
}: ColonneProps) {
  const libelle = etat === 'rupture' ? 'Rupture !' : etat === 'bas' ? 'Bientôt à court' : label;
  const couleurTexte = etat === 'rupture' ? styles.texteRupture : etat === 'bas' ? styles.texteBas : null;
  return (
    <Pressable
      onLongPress={() => surDefinition(definition)}
      delayLongPress={350}
      style={[
        styles.colonne,
        !premiere && styles.separee,
        etat === 'rupture' && styles.fondRupture,
        etat === 'bas' && styles.fondBas,
      ]}
      accessibilityLabel={`${label} : ${valeur}${etat === 'normal' ? '' : `, ${libelle}`}`}
      accessibilityHint="Appui long : définition"
    >
      <Text style={[styles.label, couleurTexte]} numberOfLines={1}>
        {libelle}
      </Text>
      <ValeurAnimee
        texte={valeur}
        declencheur={declencheur}
        effet={effet}
        style={[styles.valeur, couleurTexte]}
        numberOfLines={1}
        adjustsFontSizeToFit
      />
      {children}
    </Pressable>
  );
});

/**
 * Tableau des ressources, à plat sous l'en-tête : budget, formulaires, dossiers en attente
 * et, une fois révélée, Conformité. Un appui long sur une colonne donne sa définition.
 */
export default function Hud() {
  const { etat, mods, conformite, verdict, stockBas, enAttente } = useGameState();
  const [definition, setDefinition] = useState<string | null>(null);
  const rupture = etat.formulaires < mods.pieces;
  const etatStock: Etat = rupture ? 'rupture' : stockBas ? 'bas' : 'normal';
  const pieces = mods.pieces === 1 ? '1 formulaire' : `${formatEntier(mods.pieces)} formulaires`;

  const surDefinition = useCallback((texte: string) => setDefinition(texte), []);
  useEffect(() => {
    if (definition === null) return;
    const t = setTimeout(() => setDefinition(null), DUREE_DEFINITION);
    return () => clearTimeout(t);
  }, [definition]);

  return (
    <View>
      <View style={styles.ligne}>
        <Colonne
          premiere
          label="Budget"
          valeur={`${formatEuros(etat.budget)} €`}
          definition="Budget : la dotation versée pour chaque dossier traité. Il paie les recrutements, les ramettes et les notes de service."
          surDefinition={surDefinition}
          declencheur={verdict?.id}
        />
        <Colonne
          label="Formulaires"
          valeur={formatEntier(etat.formulaires)}
          definition={`Formulaires : chaque dossier traité en consomme ${pieces}. À zéro, plus rien ne se traite. Les ramettes s’achètent dans Recrutement.`}
          surDefinition={surDefinition}
          etat={etatStock}
          declencheur={verdict?.id}
          effet="baisse"
        />
        <Colonne
          label="En attente"
          valeur={formatEntier(Math.floor(enAttente))}
          definition="En attente : les dossiers déposés au guichet qui n’ont pas encore été tamponnés."
          surDefinition={surDefinition}
        />
        {mods.conformiteVisible && (
          <Colonne
            label="Conformité"
            valeur={`${conformite.toFixed(1).replace('.', ',')} %`}
            definition="Conformité : elle monte avec la rigueur du guichet (dossiers rejetés, pièces exigées en plus). L’acte s’achève à 100 %."
            surDefinition={surDefinition}
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
    paddingHorizontal: Espace.s,
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
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
  texteRupture: {
    color: Colors.rougeTexte,
  },
  texteBas: {
    color: Colors.encreTexte,
  },
  definition: {
    marginHorizontal: Espace.l,
    marginTop: Espace.s,
    backgroundColor: Colors.papierChaud,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
  },
  definitionTexte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
});
