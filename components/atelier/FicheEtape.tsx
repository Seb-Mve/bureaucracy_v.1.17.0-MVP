import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { useGameState, type EtapeAtelier } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';
import {
  Effets,
  IconeEtape,
  TromboneFerme,
} from '@/components/atelier/Elements';

interface FicheEtapeProps {
  etape: EtapeAtelier;
  rang: number;
  total: number;
  onMonter: () => void;
  onDescendre: () => void;
  onRetirer: () => void;
  onExiger: () => void;
}

/** Bouton carré de 44 pt (monter, descendre, retirer). */
function BoutonCarre({
  Icone,
  libelle,
  desactive,
  onPress,
}: {
  Icone: LucideIcon;
  libelle: string;
  desactive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desactive}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityState={{ disabled: desactive }}
      style={({ pressed }) => [
        styles.carre,
        desactive && styles.carreInactif,
        pressed && styles.presse,
      ]}
    >
      <Icone
        size={18}
        color={desactive ? Colors.crayonClair : Colors.anthracite}
      />
    </Pressable>
  );
}

/** Une étape dans l'Atelier : effets, pièce exigée, boutons monter / descendre / retirer (jamais seulement au glisser). */
const FicheEtape = memo(function FicheEtape({
  etape,
  rang,
  total,
  onMonter,
  onDescendre,
  onRetirer,
  onExiger,
}: FicheEtapeProps) {
  const { encre } = useGameState();
  const effets = etape.effets.map((e) => e.texte).join(', ');
  return (
    <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
      <View
        style={styles.ligne}
        accessible
        accessibilityLabel={`Étape ${rang + 1} sur ${total} : ${etape.nom}. ${effets}`}
      >
        <IconeEtape type={etape.type} />
        <View style={styles.infos}>
          <Text style={styles.nom}>{etape.nom}</Text>
          <Effets effets={etape.effets} />
        </View>
      </View>
      {etape.type === 'pieceService' && (
        <Pressable
          onPress={onExiger}
          accessibilityRole="button"
          accessibilityLabel={`Pièce exigée : ${etape.exigeNom ?? 'aucune'}${etape.boucle ? '. Ces procédures s’exigent mutuellement' : ''}. Changer`}
          style={({ pressed }) => [
            styles.exige,
            { borderColor: encre.texte, backgroundColor: encre.fond },
            pressed && styles.presse,
          ]}
        >
          {etape.boucle && <TromboneFerme />}
          <Text
            style={[styles.exigeTexte, { color: encre.texte }]}
            numberOfLines={1}
          >
            exige : {etape.exigeNom ?? 'aucune pièce'}
          </Text>
        </Pressable>
      )}
      <View style={styles.actions}>
        <BoutonCarre
          Icone={ChevronUp}
          libelle={`Monter l’étape ${etape.nom}`}
          desactive={rang === 0}
          onPress={onMonter}
        />
        <BoutonCarre
          Icone={ChevronDown}
          libelle={`Descendre l’étape ${etape.nom}`}
          desactive={rang === total - 1}
          onPress={onDescendre}
        />
        <BoutonCarre
          Icone={Trash2}
          libelle={`Retirer l’étape ${etape.nom}`}
          desactive={total <= 1}
          onPress={onRetirer}
        />
      </View>
    </Panneau>
  );
});

export default FicheEtape;

const styles = StyleSheet.create({
  fiche: {
    padding: Espace.m,
    gap: Espace.s,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
  },
  infos: {
    flex: 1,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  exige: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espace.s,
    minHeight: 44,
    borderWidth: Charte.traitFin,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.m,
  },
  exigeTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Espace.s,
  },
  carre: {
    width: 44,
    height: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papierChaud,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carreInactif: {
    borderColor: Colors.crayonClair,
    backgroundColor: Colors.carton,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
