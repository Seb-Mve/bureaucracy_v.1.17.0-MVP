import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Coins, FileText, ShieldCheck } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import { formatEntier, formatEuros } from '@/utils/formatters';
import JaugeHachuree from '@/components/charte/JaugeHachuree';

interface CapsuleProps {
  icone: React.ReactNode;
  label: string;
  valeur: string;
  alerte?: boolean;
  children?: React.ReactNode;
}

const Capsule = memo(function Capsule({ icone, label, valeur, alerte, children }: CapsuleProps) {
  return (
    <View style={[styles.capsule, alerte && styles.capsuleAlerte]} accessible accessibilityLabel={`${label} : ${valeur}`}>
      {icone}
      <View style={styles.contenu}>
        <Text style={[styles.label, alerte && styles.texteAlerte]} numberOfLines={1}>
          {alerte ? 'Rupture !' : label}
        </Text>
        {children ?? (
          <Text style={[styles.valeur, alerte && styles.texteAlerte]} numberOfLines={1} adjustsFontSizeToFit>
            {valeur}
          </Text>
        )}
      </View>
    </View>
  );
});

/** Ressources sous l'en-tête : budget, formulaires et, une fois révélée, Conformité. */
export default function Hud() {
  const { etat, mods, conformite } = useGameState();
  const rupture = etat.formulaires < mods.pieces;
  const pct = `${conformite.toFixed(1).replace('.', ',')} %`;

  return (
    <View style={styles.hud}>
      <Capsule label="Budget" valeur={`${formatEuros(etat.budget)} €`} icone={<Coins size={16} color={Colors.anthracite} />} />
      <Capsule
        label="Formulaires"
        valeur={formatEntier(etat.formulaires)}
        alerte={rupture}
        icone={<FileText size={16} color={rupture ? Colors.rouge : Colors.anthracite} />}
      />
      {mods.conformiteVisible && (
        <Capsule label="Conformité" valeur={pct} icone={<ShieldCheck size={16} color={Colors.anthracite} />}>
          <View style={styles.conformite}>
            <View style={styles.jauge}>
              <JaugeHachuree
                valeur={conformite / 100}
                couleur={Colors.vert}
                couleurClaire={Colors.vertClair}
                hauteur={8}
                motif="jauge-conformite"
                accessibilityLabel="Conformité"
              />
            </View>
            <Text style={styles.pct}>{pct}</Text>
          </View>
        </Capsule>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  capsule: {
    flex: 1,
    minWidth: 0,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: 8,
  },
  capsuleAlerte: {
    backgroundColor: Colors.rougeFond,
  },
  contenu: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: Fonts.texteGras,
    fontSize: 9,
    color: Colors.crayon,
  },
  valeur: {
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
    gap: 4,
  },
  jauge: {
    flex: 1,
  },
  pct: {
    fontFamily: Fonts.chiffres,
    fontSize: 10,
    color: Colors.anthracite,
  },
});
