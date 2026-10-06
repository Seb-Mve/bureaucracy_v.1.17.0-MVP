import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { IdCard, Landmark, Stamp } from 'lucide-react-native';
import { useGameState, type CircuitAffiche } from '@/context/GameStateContext';
import { usePreferences } from '@/context/PreferencesContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';

/** Durée pendant laquelle la ligne montre l'usager qui repart avec son document (ms). */
const DUREE_REPART = 1200;
/** Demi-période du clignotement de la case Guichets quand tout est bloqué (ms). */
const DEMI_PERIODE = 600;

type Ligne = NonNullable<CircuitAffiche['ligne']>;

/** Une case du circuit : un nom, un chiffre ou un pictogramme, un sous-titre. */
function Poste({
  nom,
  sous,
  valeur,
  icone,
  style,
  sousStyle,
}: {
  nom: string;
  sous: string;
  valeur?: string;
  icone?: React.ReactNode;
  style?: object;
  sousStyle?: object;
}) {
  return (
    <View style={[styles.poste, style]}>
      <Text style={styles.nom} numberOfLines={1}>
        {nom}
      </Text>
      {valeur !== undefined ? (
        <Text style={styles.valeur} numberOfLines={1}>
          {valeur}
        </Text>
      ) : (
        icone
      )}
      <Text style={[styles.sous, sousStyle]} numberOfLines={2}>
        {sous}
      </Text>
    </View>
  );
}

function Fleche({ coupee }: { coupee: boolean }) {
  return (
    <Text style={[styles.fleche, coupee && styles.flecheCoupee]} accessibilityElementsHidden importantForAccessibility="no">
      {coupee ? '✕' : '→'}
    </Text>
  );
}

/**
 * Circuit d'une demande sur l'écran Direction (specs/013), de gauche à droite : les usagers qui attendent, les
 * guichets qui vérifient leurs pièces, votre bureau, le document délivré. Sans guichet ouvert, la case Guichets
 * est rouge (« aucun ouvert », jamais la couleur seule) et la flèche vers le bureau est coupée ; quand plus rien
 * n'est à viser alors que des usagers attendent, elle clignote. Dessous, la demande suivie : « M. Benali attend
 * votre visa », puis « repart avec sa Carte d’identité » juste après la délivrance.
 */
export default function CircuitDirection({ compact = false }: { compact?: boolean }) {
  const { direction, verdict } = useGameState();
  const { reduireMouvement } = usePreferences();
  const [repart, setRepart] = useState<Ligne | null>(null);
  const dernierVerdict = useRef(verdict?.id ?? null);
  const precedente = useRef<Ligne | null>(null);
  const opacite = useSharedValue(1);
  const bloque = direction?.circuit.bloque ?? false;

  // Un coup qui délivre un document à son usager : la ligne le garde un instant.
  useEffect(() => {
    if (!verdict) {
      setRepart(null);
      return;
    }
    if (verdict.id === dernierVerdict.current) return;
    dernierVerdict.current = verdict.id;
    const servie = precedente.current;
    setRepart(verdict.delivre && servie?.repart ? servie : null);
  }, [verdict]);

  useEffect(() => {
    if (!repart) return;
    const t = setTimeout(() => setRepart(null), DUREE_REPART);
    return () => clearTimeout(t);
  }, [repart]);

  useEffect(() => {
    precedente.current = direction?.circuit.ligne ?? null;
  });

  useEffect(() => {
    if (bloque && !reduireMouvement) {
      opacite.value = withRepeat(withTiming(0.45, { duration: DEMI_PERIODE }), -1, true);
    } else {
      cancelAnimation(opacite);
      opacite.value = 1;
    }
  }, [bloque, reduireMouvement, opacite]);
  const clignote = useAnimatedStyle(() => ({ opacity: opacite.value }));

  if (!direction) return null;
  const c = direction.circuit;
  const ouverts = c.guichets > 0;
  const ligne = repart ?? c.ligne;
  const quoi = repart ? repart.repart : ligne?.attente;
  const guichetsSous = ouverts ? (c.guichets > 1 ? 'ouverts' : 'ouvert') : 'aucun ouvert';
  const bureauSous = c.agents ? 'vous + agents' : 'vous';
  const lecture =
    `${c.procNom} : ${formatEntier(c.attendent)} usagers attendent ; ` +
    `guichets : ${ouverts ? formatEntier(c.guichets) + ' ' + guichetsSous : 'aucun ouvert, rien n’arrive sur votre bureau'} ; ` +
    `votre bureau${c.bureauVide ? ', vide' : ''} ; ${c.document} ${direction.delivrance.nom.toLowerCase()}.` +
    (ligne && quoi ? ` ${ligne.qui} ${quoi}.` : '');

  return (
    <View style={[styles.zone, compact && styles.zoneCompacte]}>
      <View style={styles.cadre} accessible accessibilityLabel={lecture}>
        {!compact && (
          <Text style={styles.titre} numberOfLines={1}>
            {c.procNom}
          </Text>
        )}
        <View style={styles.etapes}>
          <Poste nom="Usagers" valeur={formatEntier(c.attendent)} sous="attendent" />
          <Fleche coupee={false} />
          <Animated.View style={[styles.case, clignote]}>
            <Poste
              nom="Guichets"
              valeur={ouverts ? `×${formatEntier(c.guichets)}` : undefined}
              icone={<Landmark size={18} color={Colors.rougeTexte} />}
              sous={guichetsSous}
              style={ouverts ? styles.ouvert : styles.ferme}
              sousStyle={ouverts ? undefined : styles.sousFerme}
            />
          </Animated.View>
          <Fleche coupee={!ouverts} />
          <Poste
            nom="Bureau"
            icone={<Stamp size={18} color={c.bureauVide ? Colors.crayonClair : Colors.anthracite} />}
            sous={bureauSous}
            style={c.bureauVide ? styles.bureauVide : styles.bureau}
          />
          <Fleche coupee={false} />
          <Poste
            nom={c.document}
            icone={<IdCard size={18} color={Colors.anthracite} />}
            sous={direction.delivrance.nom.toLowerCase()}
            style={[styles.carte, repart && styles.carteServie]}
          />
        </View>
        {!compact && ligne && quoi && (
          <Text style={styles.ligne} numberOfLines={1}>
            <Text style={styles.qui}>{ligne.qui} </Text>
            {quoi}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: Espace.l,
    paddingTop: Espace.s,
    paddingBottom: Espace.s,
  },
  zoneCompacte: {
    paddingTop: Espace.xs,
    paddingBottom: Espace.xs,
  },
  cadre: {
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.s,
    paddingVertical: Espace.s,
    gap: Espace.xs,
  },
  titre: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.crayon,
  },
  etapes: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  case: {
    flex: 1,
    minWidth: 0,
  },
  poste: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: Espace.xs,
    paddingHorizontal: 2,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    backgroundColor: Colors.papierChaud,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.anthracite,
  },
  valeur: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  sous: {
    textAlign: 'center',
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.crayon,
  },
  /** Aucun guichet ouvert : fond rouge pâle, bord rouge épais, « aucun ouvert » en rouge. */
  ferme: {
    backgroundColor: Colors.rougeFond,
    borderColor: Colors.rouge,
    borderWidth: Charte.trait,
  },
  sousFerme: {
    color: Colors.rougeTexte,
  },
  ouvert: {
    backgroundColor: Colors.pastelVert,
  },
  bureau: {
    backgroundColor: Colors.bleuFond,
  },
  /** Plus rien à viser : bord pointillé gris. */
  bureauVide: {
    borderStyle: 'dashed',
    borderColor: Colors.crayonClair,
  },
  carte: {
    backgroundColor: Colors.papierChaud,
  },
  carteServie: {
    backgroundColor: Colors.pastelVert,
  },
  fleche: {
    width: Espace.l,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
  flecheCoupee: {
    color: Colors.rougeTexte,
  },
  ligne: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  qui: {
    fontFamily: Fonts.texteGras,
    color: Colors.anthracite,
  },
});
