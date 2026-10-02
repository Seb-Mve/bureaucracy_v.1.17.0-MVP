import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import ValeurAnimee from '@/components/charte/ValeurAnimee';

function duree(sec: number): string {
  if (sec < 60) return `${sec} s`;
  return `${Math.floor(sec / 60)} min ${String(sec % 60).padStart(2, '0')} s`;
}

/**
 * Une seule ligne pour ce qui réclame l'attention, sous les ressources :
 * une nouvelle note de service, sinon la note en instruction (que chaque coup
 * de tampon relance), sinon l'ordre du jour.
 */
export default function FilDuJour() {
  const { notes, consigne, relance } = useGameState();
  const router = useRouter();
  const nouvelle = [...notes].reverse().find((n) => n.nouvelle);
  const instruction = notes
    .filter((n) => n.statut === 'instruction')
    .sort((a, b) => a.resteSec - b.resteSec)[0];

  // « Classée sans suite » ne vaut que pour la note en cours : on retient à quelle note la relance s'appliquait.
  const [classee, setClassee] = useState<string | null>(null);
  useEffect(() => {
    if (relance) setClassee(relance.etat === 'classee' ? (instruction?.id ?? null) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relance]);

  let sur: string;
  let texte: string;
  let onglet: 'notes' | 'recruitment' | undefined;
  let compte: string | null = null;
  if (nouvelle) {
    sur = `NOUVELLE NOTE N° ${nouvelle.numero}`;
    texte = nouvelle.titre;
    onglet = 'notes';
  } else if (instruction) {
    sur = `NOTE N° ${instruction.numero} EN INSTRUCTION`;
    compte = duree(instruction.resteSec);
    texte = classee === instruction.id ? 'Délai minimal atteint : relances classées.' : 'Tamponnez pour relancer (−1 s).';
    onglet = 'notes';
  } else if (consigne) {
    const p = consigne.progression;
    sur = 'ORDRE DU JOUR';
    texte = consigne.texte + (p ? ` (${Math.min(p.valeur, p.cible)} / ${p.cible})` : '');
    onglet = consigne.onglet ?? undefined;
  } else {
    return null;
  }

  return (
    <Pressable
      onPress={onglet ? () => router.push(onglet === 'notes' ? '/notes' : '/recruitment') : undefined}
      disabled={!onglet}
      style={({ pressed }) => [styles.fil, (nouvelle || instruction) && styles.note, pressed && styles.presse]}
      accessibilityRole={onglet ? 'button' : 'text'}
      accessibilityLabel={`${sur}${compte ? `, ${compte} restantes` : ''} : ${texte}`}
    >
      <View style={styles.textes}>
        <Text style={styles.sur}>{sur}</Text>
        <Text style={styles.texte} numberOfLines={2}>
          {texte}
        </Text>
      </View>
      {compte !== null && (
        <ValeurAnimee
          texte={compte}
          declencheur={relance?.etat === 'transmise' ? relance.id : null}
          style={styles.compte}
        />
      )}
      {onglet && <ChevronRight size={18} color={Colors.anthracite} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
    minHeight: 44,
    paddingHorizontal: Espace.l,
    paddingVertical: Espace.s,
  },
  note: {
    backgroundColor: Colors.encreFond,
  },
  presse: {
    opacity: 0.7,
  },
  textes: {
    flex: 1,
  },
  sur: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    letterSpacing: 0.6,
    color: Colors.encreTexte,
  },
  texte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  compte: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.titre,
    lineHeight: Interligne.titre,
    color: Colors.anthracite,
  },
});
