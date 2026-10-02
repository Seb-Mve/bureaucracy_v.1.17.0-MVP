import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Coins, FileText, ShieldCheck } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import { formatEntier, formatEuros } from '@/utils/formatters';
import JaugeHachuree from '@/components/charte/JaugeHachuree';
import ValeurAnimee from '@/components/charte/ValeurAnimee';

type Etat = 'normal' | 'bas' | 'rupture';

/** Durée d'affichage d'une définition après un appui long (ms). */
const DUREE_DEFINITION = 5000;

interface CapsuleProps {
  icone: React.ReactNode;
  label: string;
  valeur: string;
  definition: string;
  surDefinition: (texte: string) => void;
  etat?: Etat;
  declencheur?: number | null;
  effet?: 'pop' | 'baisse';
  children?: React.ReactNode;
}

const Capsule = memo(function Capsule({
  icone,
  label,
  valeur,
  definition,
  surDefinition,
  etat = 'normal',
  declencheur,
  effet,
  children,
}: CapsuleProps) {
  const libelle = etat === 'rupture' ? 'Rupture !' : etat === 'bas' ? 'Bientôt à court' : label;
  return (
    <Pressable
      onLongPress={() => surDefinition(definition)}
      delayLongPress={350}
      style={[styles.capsule, etat === 'rupture' && styles.capsuleRupture, etat === 'bas' && styles.capsuleBas]}
      accessibilityLabel={`${label} : ${valeur}${etat === 'normal' ? '' : `, ${libelle}`}`}
      accessibilityHint="Appui long : définition"
    >
      {icone}
      <View style={styles.contenu}>
        <Text style={[styles.label, etat === 'rupture' && styles.texteRupture, etat === 'bas' && styles.texteBas]} numberOfLines={1}>
          {libelle}
        </Text>
        {children ?? (
          <ValeurAnimee
            texte={valeur}
            declencheur={declencheur}
            effet={effet}
            style={[styles.valeur, etat === 'rupture' && styles.texteRupture, etat === 'bas' && styles.texteBas]}
            numberOfLines={1}
            adjustsFontSizeToFit
          />
        )}
      </View>
    </Pressable>
  );
});

/** Ressources sous l'en-tête : budget, formulaires et, une fois révélée, Conformité. */
export default function Hud() {
  const { etat, mods, conformite, verdict, stockBas } = useGameState();
  const [definition, setDefinition] = useState<string | null>(null);
  const rupture = etat.formulaires < mods.pieces;
  const etatStock: Etat = rupture ? 'rupture' : stockBas ? 'bas' : 'normal';
  const pct = `${conformite.toFixed(1).replace('.', ',')} %`;
  const pieces = mods.pieces === 1 ? '1 formulaire' : `${formatEntier(mods.pieces)} formulaires`;

  const surDefinition = useCallback((texte: string) => setDefinition(texte), []);
  useEffect(() => {
    if (definition === null) return;
    const t = setTimeout(() => setDefinition(null), DUREE_DEFINITION);
    return () => clearTimeout(t);
  }, [definition]);

  return (
    <View style={styles.bloc}>
      <View style={styles.hud}>
        <Capsule
          label="Budget"
          valeur={`${formatEuros(etat.budget)} €`}
          definition="Budget : la dotation versée pour chaque dossier traité. Il paie les recrutements, les ramettes et les notes de service."
          surDefinition={surDefinition}
          declencheur={verdict?.id}
          icone={<Coins size={16} color={Colors.anthracite} />}
        />
        <Capsule
          label="Formulaires"
          valeur={formatEntier(etat.formulaires)}
          definition={`Formulaires : chaque dossier traité en consomme ${pieces}. À zéro, plus rien ne se traite. Les ramettes s’achètent dans Recrutement.`}
          surDefinition={surDefinition}
          etat={etatStock}
          declencheur={verdict?.id}
          effet="baisse"
          icone={<FileText size={16} color={rupture ? Colors.rouge : stockBas ? Colors.encreTexte : Colors.anthracite} />}
        />
        {mods.conformiteVisible && (
          <Capsule
            label="Conformité"
            valeur={pct}
            definition="Conformité : elle monte avec la rigueur du guichet (dossiers rejetés, pièces exigées en plus). L’acte s’achève à 100 %."
            surDefinition={surDefinition}
            icone={<ShieldCheck size={16} color={Colors.anthracite} />}
          >
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
      {definition !== null && (
        <Pressable onPress={() => setDefinition(null)} accessibilityRole="button" accessibilityLabel={`${definition} Fermer`}>
          <Text style={styles.definition}>{definition}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  hud: {
    flexDirection: 'row',
    gap: 6,
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
  capsuleRupture: {
    backgroundColor: Colors.rougeFond,
  },
  capsuleBas: {
    backgroundColor: Colors.encreFond,
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
    alignSelf: 'flex-start',
    transformOrigin: 'left center',
  },
  texteRupture: {
    color: Colors.rougeTexte,
  },
  texteBas: {
    color: Colors.encreTexte,
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
  definition: {
    fontFamily: Fonts.texte,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.anthracite,
    backgroundColor: Colors.papierChaud,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
