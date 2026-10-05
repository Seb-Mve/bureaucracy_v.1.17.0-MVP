import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { formatEntier, formatEuros, formatMontant } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonAchat from '@/components/service/BoutonAchat';

interface CarteUniteProps {
  id: string;
  nom: string;
  description: string;
  possedes: number;
  cout: number;
  /** Coût de dix achats d'affilée. */
  cout10: number;
  /** Achats possibles d'affilée avec le budget actuel. */
  maxAchetables: number;
  coutMax: number;
  achetable: boolean;
  Icone: LucideIcon;
  fondIcone: string;
  /** Verbe des libellés d'accessibilité (« Recruter », « Acheter »). */
  verbe: string;
  /** Acte II : unité tout juste débloquée, aucune encore achetée (pastille « NOUVEAU »). */
  nouveau?: boolean;
  onAcheter: (nb: number) => void;
}

/** Carte d'achat du Service (collègue, guichet, agent) : ×1, ×10 et Max, comme sur main. */
const CarteUnite = memo(function CarteUnite({
  nom,
  description,
  possedes,
  cout,
  cout10,
  maxAchetables: max,
  coutMax,
  achetable,
  Icone,
  fondIcone,
  verbe,
  nouveau = false,
  onAcheter,
}: CarteUniteProps) {
  const { encre } = useGameState();
  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
      <View style={styles.ligne}>
        <View style={[styles.avatar, { backgroundColor: fondIcone }]}>
          <Icone size={18} color={Colors.anthracite} />
        </View>
        <View style={styles.infos}>
          <View style={styles.ligneNom}>
            <Text style={styles.nom}>
              {nom}{' '}
              <Text style={[styles.possedes, { color: encre.texte }]}>
                ×{possedes}
              </Text>
            </Text>
            {nouveau && (
              <View style={[styles.nouveau, { backgroundColor: encre.face }]}>
                <Text style={styles.nouveauTexte}>NOUVEAU</Text>
              </View>
            )}
          </View>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <View style={styles.achats}>
        <BoutonAchat
          libelle="×1"
          detail={formatMontant(cout)}
          actif={achetable}
          onPress={() => onAcheter(1)}
          accessibilityLabel={`${verbe} : ${nom} ×1, ${formatEuros(cout)} euros`}
          large
        />
        <BoutonAchat
          libelle="×10"
          detail={formatMontant(cout10)}
          actif={max >= 10}
          onPress={() => onAcheter(10)}
          accessibilityLabel={`${verbe} : ${nom} ×10, ${formatEuros(cout10)} euros`}
          large
        />
        <BoutonAchat
          libelle="Max"
          detail={
            max > 0
              ? `×${formatEntier(max)}\n${formatMontant(coutMax)}`
              : `×0\n${formatMontant(cout)}`
          }
          actif={max > 0}
          onPress={() => onAcheter(max)}
          accessibilityLabel={`${verbe} : ${nom}, autant que le budget le permet (${max}), ${formatEuros(coutMax)} euros`}
          large
        />
      </View>
    </Panneau>
  );
});

export default CarteUnite;

const styles = StyleSheet.create({
  carte: {
    padding: Espace.m,
    gap: Espace.m,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
  },
  achats: {
    flexDirection: 'row',
    gap: Espace.s,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Charte.rayon,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infos: {
    flex: 1,
    gap: 1,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  possedes: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
  },
  description: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
  ligneNom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Espace.s,
  },
  /** Même pastille que les notes nouvelles. */
  nouveau: {
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    paddingHorizontal: Espace.s,
  },
  nouveauTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    color: Colors.anthracite,
  },
});
