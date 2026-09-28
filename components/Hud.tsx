import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Coins, FileText, Inbox } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import { formatEntier, formatEuros } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import JaugeHachuree from '@/components/charte/JaugeHachuree';

interface CapsuleProps {
  icone: React.ReactNode;
  valeur: string;
  label: string;
  alerte?: boolean;
}

const Capsule = memo(function Capsule({ icone, valeur, label, alerte }: CapsuleProps) {
  return (
    <View style={styles.capsuleBloc}>
      <View style={[styles.capsule, alerte && styles.capsuleAlerte]} accessible accessibilityLabel={`${label} : ${valeur}`}>
        {icone}
        <Text style={[styles.capsuleValeur, alerte && styles.texteAlerte]} numberOfLines={1} adjustsFontSizeToFit>
          {valeur}
        </Text>
      </View>
      <Text style={[styles.capsuleLabel, alerte && styles.texteAlerte]} numberOfLines={1}>
        {alerte ? 'Rupture !' : label}
      </Text>
    </View>
  );
});

/** Compteurs en haut de l'écran : Tampons apposés, budget, formulaires, file. */
export default function Hud() {
  const { etat, enAttente, mods, conformite } = useGameState();
  const rupture = etat.formulaires < mods.pieces;

  return (
    <View style={styles.hud}>
      <Panneau rayon={14} contenuStyle={styles.score}>
        <Text style={styles.scoreLabel}>TAMPONS APPOSÉS</Text>
        <Text style={styles.scoreValeur} accessibilityLabel={`Tampons apposés : ${Math.floor(etat.tampons)}`}>
          {Math.floor(etat.tampons).toLocaleString('fr-FR')}
        </Text>
      </Panneau>
      <View style={styles.ligne}>
        <Capsule
          label="Budget"
          valeur={`${formatEuros(etat.budget)} €`}
          icone={<Coins size={16} color={Colors.anthracite} />}
        />
        <Capsule
          label="Formulaires"
          valeur={formatEntier(etat.formulaires)}
          alerte={rupture}
          icone={<FileText size={16} color={rupture ? Colors.rouge : Colors.anthracite} />}
        />
        <Capsule
          label="En attente"
          valeur={formatEntier(enAttente)}
          icone={<Inbox size={16} color={Colors.anthracite} />}
        />
      </View>
      {mods.conformiteVisible && (
        <View style={styles.conformite}>
          <Text style={styles.conformiteLabel}>Conformité</Text>
          <View style={styles.conformiteJauge}>
            <JaugeHachuree
              valeur={conformite / 100}
              couleur={Colors.vert}
              couleurClaire={Colors.vertClair}
              hauteur={16}
              motif="jauge-conformite"
              accessibilityLabel="Conformité"
            />
          </View>
          <Text style={styles.conformiteValeur}>{conformite.toFixed(1).replace('.', ',')} %</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scoreLabel: {
    fontFamily: Fonts.texteGras,
    fontSize: 11,
    color: Colors.crayon,
    letterSpacing: 0.5,
  },
  scoreValeur: {
    fontFamily: Fonts.chiffres,
    fontSize: 22,
    color: Colors.anthracite,
  },
  ligne: {
    flexDirection: 'row',
    gap: 6,
  },
  capsuleBloc: {
    flex: 1,
    gap: 1,
  },
  capsuleLabel: {
    fontFamily: Fonts.texteGras,
    fontSize: 10,
    color: Colors.crayon,
    textAlign: 'center',
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 32,
  },
  capsuleAlerte: {
    backgroundColor: Colors.rougeFond,
  },
  capsuleValeur: {
    flex: 1,
    fontFamily: Fonts.chiffres,
    fontSize: 13,
    color: Colors.anthracite,
  },
  texteAlerte: {
    color: Colors.rougeTexte,
  },
  conformite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conformiteLabel: {
    fontFamily: Fonts.texteGras,
    fontSize: 12,
    color: Colors.anthracite,
  },
  conformiteJauge: {
    flex: 1,
  },
  conformiteValeur: {
    fontFamily: Fonts.chiffres,
    fontSize: 12,
    color: Colors.anthracite,
    minWidth: 52,
    textAlign: 'right',
  },
});
