import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { BALANCE } from '@/constants/balance';
import { PATIENCE_MAX } from '@/types/game';
import Panneau from '@/components/charte/Panneau';
import { formatEntier, formatMontant } from '@/utils/formatters';

interface Article {
  titre: string;
  texte: string;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;
/** Ce que traite un coup de tampon, selon le nombre de dossiers par coup en vigueur. */
const parCoup = (n: number) => (n === 1 ? 'le dossier posé' : `${formatEntier(n)} dossiers posés`);

/**
 * Règlement intérieur : l'aide du jeu, rédigée comme un document de service.
 * Un article n'apparaît qu'une fois la mécanique débloquée (rien n'est dévoilé à l'avance).
 */
export default function ReglementInterieur() {
  const { mods, notes, prixRamette } = useGameState();
  const [ouvert, setOuvert] = useState(false);

  const articles: Article[] = [
    {
      titre: 'Le tampon',
      texte: `Chaque coup de tampon traite ${parCoup(mods.tapPower)} sur votre bureau. Le nombre de tampons apposés fixe votre grade : chaque grade ajoute ${pct(BALANCE.bonusGrade)} de dotation.`,
    },
    {
      titre: 'Budget et formulaires',
      texte: `Chaque dossier traité rapporte une dotation et consomme des formulaires. Sans formulaires, plus rien ne se traite.${
        mods.recrutementVisible ? ` Les ramettes s’achètent dans l’onglet Service (${formatMontant(prixRamette)} l’une).` : ''
      }`,
    },
    {
      titre: 'La file d’attente',
      texte: 'Les usagers du périmètre déposent leurs dossiers au guichet et attendent leur tour.',
    },
  ];
  if (mods.recrutementVisible) {
    articles.push({
      titre: 'Collègues et ancienneté',
      texte: `Les collègues tamponnent à votre place, sans interruption. Le prix monte à chaque embauche. La vitesse d’un poste double à ${BALANCE.paliersAnciennete.join(', ')} recrues (ancienneté).`,
    });
  }
  if (notes.length > 0) {
    articles.push({
      titre: 'Notes de service',
      texte: 'Une note approuvée prend effet aussitôt, ou au terme de son délai d’instruction quand elle en a un.',
    });
  }
  if (mods.rejetVisible) {
    articles.push({
      titre: 'Taux de rejet',
      texte: `Un dossier rejeté, par vous ou par vos collègues, rapporte une prime et son usager revient plus tard. Rejeté ${PATIENCE_MAX} fois, l’usager abandonne et quitte le périmètre : la demande baisse. Le total des usagers perdus est dans le dossier administratif.`,
    });
  }
  if (mods.conformiteVisible) {
    // Rien n'annonce la fin avant l'audit : le jeu se découvre.
    articles.push({
      titre: 'Conformité',
      texte:
        'Elle monte avec la rigueur du guichet : dossiers rejetés, pièces exigées en plus. À 100 %, la note de service n° 22 (Demande de réaffectation) devient disponible.',
    });
  }

  return (
    <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
      <Pressable
        onPress={() => setOuvert((o) => !o)}
        style={styles.entete}
        accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }}
        accessibilityLabel="Règlement intérieur"
      >
        <Text style={styles.reference}>Guichet 3 · {articles.length} articles en vigueur</Text>
        {ouvert ? <ChevronDown size={18} color={Colors.anthracite} /> : <ChevronRight size={18} color={Colors.anthracite} />}
      </Pressable>
      {ouvert &&
        articles.map((a, i) => (
          <View key={a.titre} style={styles.article}>
            <Text style={styles.titre}>
              Article {i + 1} · {a.titre}
            </Text>
            <Text style={styles.texte}>{a.texte}</Text>
          </View>
        ))}
    </Panneau>
  );
}

const styles = StyleSheet.create({
  fiche: {
    padding: Espace.m,
    gap: Espace.m,
    backgroundColor: Colors.papierChaud,
  },
  entete: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Espace.s,
  },
  reference: {
    flex: 1,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  article: {
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.carton,
    paddingTop: Espace.s,
  },
  titre: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.encreTexte,
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
});
