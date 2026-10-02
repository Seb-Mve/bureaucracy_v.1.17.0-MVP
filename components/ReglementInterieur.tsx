import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { BALANCE } from '@/constants/balance';
import { PATIENCE_MAX } from '@/types/game';
import Panneau from '@/components/charte/Panneau';
import { formatMontant } from '@/utils/formatters';

interface Article {
  titre: string;
  texte: string;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

/**
 * Règlement intérieur : l'aide du jeu, rédigée comme un document de service.
 * Un article n'apparaît qu'une fois la mécanique débloquée (rien n'est dévoilé à l'avance).
 */
export default function ReglementInterieur({ ouvertParDefaut = false }: { ouvertParDefaut?: boolean }) {
  const { mods, notes, prixRamette } = useGameState();
  const [ouvert, setOuvert] = useState(ouvertParDefaut);

  const articles: Article[] = [
    {
      titre: 'Le tampon',
      texte: `Chaque coup de tampon traite le dossier posé sur votre bureau. Maintenez le bouton pour tamponner en continu. Le nombre de tampons apposés fixe votre grade : chaque grade ajoute ${pct(BALANCE.bonusGrade)} de dotation.`,
    },
    {
      titre: 'Budget et formulaires',
      texte: `Chaque dossier traité rapporte une dotation et consomme des formulaires. Sans formulaires, plus rien ne se traite.${
        mods.recrutementVisible ? ` Les ramettes s’achètent dans Recrutement (${formatMontant(prixRamette)} l’une).` : ''
      }`,
    },
    {
      titre: 'La file d’attente',
      texte: 'Les usagers du périmètre déposent leurs dossiers au guichet et attendent leur tour.',
    },
  ];
  articles.push({
    titre: 'Fin de l’acte',
    texte: mods.conformiteVisible
      ? 'Quand la Conformité du guichet atteint 100 %, la note de service n° 22 (Demande de réaffectation) devient disponible : la viser clôt l’acte.'
      : 'L’acte s’achève quand la hiérarchie juge votre guichet conforme. Les notes de service vous en rapprochent.',
  });
  if (mods.recrutementVisible) {
    articles.push({
      titre: 'Collègues et ancienneté',
      texte: `Les collègues tamponnent à votre place, sans interruption. Le prix monte à chaque embauche. La vitesse d’un poste double à ${BALANCE.paliersAnciennete.join(', ')} recrues (ancienneté). Un achat s’annule dans les secondes qui suivent.`,
    });
  }
  if (notes.length > 0) {
    articles.push({
      titre: 'Notes de service et relances',
      texte: `Une note visée part en instruction. Pendant ce délai, chaque coup de tampon relance le service : −${BALANCE.relanceParTap} s, dans la limite de ${pct(BALANCE.relanceMax)} du délai réglementaire.`,
    });
  }
  if (mods.rejetVisible) {
    articles.push({
      titre: 'Taux de rejet',
      texte: `Un dossier rejeté rapporte une prime et son usager revient plus tard. Rejeté ${PATIENCE_MAX} fois, l’usager abandonne et quitte le périmètre : la demande baisse. Sous le curseur, la prime et les usagers perdus par minute ; le total est dans le dossier administratif.`,
    });
  }
  if (mods.conformiteVisible) {
    articles.push({
      titre: 'Conformité',
      texte: 'Elle monte avec la rigueur du guichet : dossiers rejetés, pièces exigées en plus. À 100 %, la note n° 22 clôt l’acte.',
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
      {ouvert && <Text style={styles.astuce}>Astuce : touchez un compteur (budget, formulaires…) pour sa définition.</Text>}
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
  astuce: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
    borderTopWidth: Charte.traitFin,
    borderTopColor: Colors.carton,
    paddingTop: Espace.s,
  },
});
