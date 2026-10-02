import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import ValeurAnimee from '@/components/charte/ValeurAnimee';

function duree(sec: number): string {
  if (sec < 60) return `${sec} s`;
  return `${Math.floor(sec / 60)} min ${String(sec % 60).padStart(2, '0')} s`;
}

/**
 * Un seul emplacement pour ce qui réclame l'attention, épinglé sur la scène :
 * une nouvelle note de service, sinon la note en instruction (que chaque coup
 * de tampon relance), sinon l'ordre du jour.
 */
export default function FilScene() {
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
      <Text style={styles.sur}>{sur}</Text>
      {compte !== null && (
        <ValeurAnimee
          texte={compte}
          declencheur={relance?.etat === 'transmise' ? relance.id : null}
          style={styles.compte}
        />
      )}
      <Text style={styles.texte} numberOfLines={3}>
        {texte}
        {onglet ? ' ›' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fil: {
    position: 'absolute',
    top: 8,
    right: 8,
    maxWidth: '42%',
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '1.5deg' }],
    shadowColor: Colors.anthracite,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  note: {
    backgroundColor: Colors.encreFond,
  },
  presse: {
    transform: [{ rotate: '1.5deg' }, { translateY: 2 }],
  },
  sur: {
    fontFamily: Fonts.texteGras,
    fontSize: 8.5,
    letterSpacing: 0.4,
    color: Colors.encreTexte,
  },
  compte: {
    fontFamily: Fonts.chiffres,
    fontSize: 15,
    color: Colors.anthracite,
    alignSelf: 'flex-start',
    transformOrigin: 'left center',
  },
  texte: {
    fontFamily: Fonts.texteGras,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.anthracite,
  },
});
