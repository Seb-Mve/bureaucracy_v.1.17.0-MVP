import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useGameState,
  type Encre,
  type LigneProduction,
} from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import ValeurAnimee from '@/components/charte/ValeurAnimee';
import { Effets } from '@/components/atelier/Elements';

interface BlocProps {
  ligne: LigneProduction;
  compact: boolean;
  premier: boolean;
  declencheur: number | null | undefined;
  encre: Encre;
}

/** Une procédure du relevé : demandes et délivrés, puis valeur et abandons, puis la destination s'il y en a une. */
const Bloc = memo(function Bloc({
  ligne,
  compact,
  premier,
  declencheur,
  encre,
}: BlocProps) {
  const lecture = [
    ligne.demandesTexte,
    ligne.delivresTexte,
    ...(ligne.valeur ?? []).map((e) => e.texte),
    ...(ligne.versUsagers ? ['vers les usagers'] : []),
  ].join(', ');
  return (
    <View
      style={[styles.bloc, !premier && styles.blocSuivant]}
      accessible
      accessibilityLabel={`${ligne.nom} : ${lecture}`}
    >
      <View style={styles.ligne}>
        <Text style={styles.nom} numberOfLines={1}>
          {ligne.nom}
        </Text>
        <Text style={styles.nombre}>{formatEntier(ligne.demandes)}</Text>
        <Text style={styles.chiffres}>{ligne.demandesMot} ·</Text>
        <ValeurAnimee
          texte={formatEntier(ligne.delivres)}
          declencheur={declencheur}
          effet="saut"
          style={styles.nombre}
          numberOfLines={1}
        />
        <Text style={styles.chiffres}>{ligne.delivresMot}</Text>
      </View>
      {!compact && ligne.valeur && <Effets effets={ligne.valeur} />}
      {!compact && ligne.versUsagers && (
        <Text style={[styles.destination, { color: encre.texte }]}>
          → usagers
        </Text>
      )}
    </View>
  );
});

/**
 * Relevé « Production du service » (acte II) : ce que chaque procédure ouverte délivre. Sur l'écran Direction
 * (sous la bulle) et au pied de l'Atelier. Les documents remis à des usagers portent « → usagers » ; ceux
 * délivrés pour les dossiers du service n'ont aucune destination. Sur l'écran Direction, en écran compact ou
 * dès trois procédures ouvertes, une ligne par procédure (la scène garde sa place) ; l'Atelier défile et
 * montre tout.
 */
export default function ReleveProduction({
  compact = false,
  atelier = false,
}: {
  compact?: boolean;
  /** Au pied de l'Atelier : sans retrait (l'écran a déjà ses marges), jamais condensé. */
  atelier?: boolean;
}) {
  const { production, verdict, encre } = useGameState();
  if (!production || production.length === 0) return null;
  const condense = !atelier && (compact || production.length > 2);
  return (
    <View style={!atelier && styles.cadre}>
      <Panneau
        contenuStyle={[styles.carte, condense && styles.carteCompacte]}
        rayon={Charte.rayonPetit}
      >
        {!condense && <Text style={styles.titre}>Production du service</Text>}
        {production.map((l, i) => (
          <Bloc
            key={l.id}
            ligne={l}
            compact={condense}
            premier={i === 0}
            declencheur={verdict?.id}
            encre={encre}
          />
        ))}
      </Panneau>
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    paddingHorizontal: Espace.l,
  },
  carte: {
    backgroundColor: Colors.papierChaud,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
    gap: Espace.xs,
  },
  carteCompacte: {
    paddingVertical: Espace.xs,
    gap: 0,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  bloc: {
    gap: 2,
  },
  /** Trait pointillé entre deux procédures. */
  blocSuivant: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: Colors.crayonClair,
    paddingTop: Espace.xs,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: Espace.xs,
  },
  nom: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
  chiffres: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  nombre: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
  destination: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
  },
});
