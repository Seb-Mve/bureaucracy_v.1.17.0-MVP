import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useGameState, type NoteAffichee } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import { formatMontant } from '@/utils/formatters';
import Hud from '@/components/Hud';
import Panneau from '@/components/charte/Panneau';

/** Temps pendant lequel une note approuvée reste à sa place avant de changer de section (ms). */
const RETENUE_MS = 1200;

function duree(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} min ${s.toString().padStart(2, '0')} s` : `${s} s`;
}

const CarteNote = memo(function CarteNote({
  note,
  onSigner,
}: {
  note: NoteAffichee;
  onSigner: () => void;
}) {
  const signee = note.statut === 'instruction' || note.statut === 'effective';
  const cout = note.cout > 0 ? `${formatMontant(note.cout)}` : 'Gratuit';

  let action: React.ReactNode;
  if (note.statut === 'effective') {
    action = (
      <View style={[styles.etiquette, styles.etiquetteEffective]}>
        <Text style={[styles.etiquetteTexte, styles.texteEffectif]}>EN VIGUEUR</Text>
      </View>
    );
  } else if (note.statut === 'instruction') {
    action = (
      <View style={[styles.etiquette, styles.etiquetteInstruction]}>
        <Text style={styles.etiquetteTexte}>En instruction · {duree(note.resteSec)}</Text>
      </View>
    );
  } else {
    const actif = note.statut === 'disponible';
    action = (
      <Pressable
        onPress={onSigner}
        disabled={!actif}
        accessibilityRole="button"
        accessibilityLabel={`Approuver la note de service numéro ${note.numero}, ${cout}`}
        accessibilityState={{ disabled: !actif }}
        style={({ pressed }) => [styles.viser, actif ? styles.viserActif : styles.viserInactif, pressed && styles.presse]}
      >
        <Text style={[styles.viserTexte, !actif && styles.viserTexteInactif]}>Approuver · {cout}</Text>
      </Pressable>
    );
  }

  return (
    <Panneau contenuStyle={[styles.carte, signee && styles.carteSignee]} rayon={Charte.rayon}>
      <View style={styles.entete}>
        <Text style={styles.numero}>NOTE DE SERVICE N° {note.numero.toString().padStart(3, '0')}</Text>
        {note.nouvelle && (
          <View style={styles.nouveau}>
            <Text style={styles.nouveauTexte}>NOUVEAU</Text>
          </View>
        )}
      </View>
      <Text style={styles.titre}>{note.titre}</Text>
      <Text style={styles.texte}>{note.texte}</Text>
      <Text style={styles.effet}>
        Effet : {note.effet}
        {note.instruction > 0 && !signee ? ` Délai d’instruction : ${duree(note.instruction)}.` : ''}
      </Text>
      <View style={styles.pied}>{action}</View>
    </Panneau>
  );
});

/** Notes de service : le fil de projets du jeu. */
export default function NotesScreen() {
  const { notes, acheterNote, marquerNotesVues } = useGameState();
  // Une note qui vient d'être approuvée reste à sa place un instant (au tampon « EN VIGUEUR ») avant de rejoindre
  // sa section : la carte suivante ne glisse pas sous le doigt.
  const [retenue, setRetenue] = useState<string | null>(null);
  useEffect(() => {
    if (!retenue) return;
    const t = setTimeout(() => setRetenue(null), RETENUE_MS);
    return () => clearTimeout(t);
  }, [retenue]);
  const viser = useCallback(
    (id: NoteAffichee['id']) => {
      acheterNote(id);
      setRetenue(id);
    },
    [acheterNote],
  );

  useFocusEffect(
    useCallback(() => {
      marquerNotesVues();
      return () => marquerNotesVues();
    }, [marquerNotesVues]),
  );

  // Les notes à traiter d'abord, puis les notes en vigueur (plus récentes en haut).
  const aTraiter = notes.filter((n) => n.statut !== 'effective' || n.id === retenue);
  const enVigueur = notes.filter((n) => n.statut === 'effective' && n.id !== retenue).reverse();

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView contentContainerStyle={styles.contenu}>
        {notes.length === 0 && (
          <Text style={styles.vide}>Aucune note de service. Continuez à tamponner : la hiérarchie vous observe.</Text>
        )}
        {aTraiter.map((n) => (
          <CarteNote key={n.id} note={n} onSigner={() => viser(n.id)} />
        ))}
        {enVigueur.length > 0 && <Text style={styles.section}>En vigueur</Text>}
        {enVigueur.map((n) => (
          <CarteNote key={n.id} note={n} onSigner={() => undefined} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  contenu: {
    padding: Espace.m,
    gap: Espace.m,
  },
  vide: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    color: Colors.crayon,
    textAlign: 'center',
    paddingVertical: Espace.xxl,
    paddingHorizontal: Espace.m,
  },
  section: {
    fontFamily: Fonts.titre,
    fontSize: Typo.corps,
    color: Colors.crayon,
    marginTop: Espace.s,
  },
  carte: {
    padding: Espace.m,
    gap: Espace.s,
    backgroundColor: Colors.papierChaud,
  },
  carteSignee: {
    backgroundColor: Colors.papier,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: Charte.traitFin,
    borderBottomColor: Colors.anthracite,
    paddingBottom: Espace.xs,
  },
  numero: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
    letterSpacing: 0.5,
  },
  nouveau: {
    backgroundColor: Colors.encre,
    borderRadius: Charte.rayonMini,
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    paddingHorizontal: Espace.s,
    paddingVertical: 1,
  },
  nouveauTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    color: Colors.anthracite,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.anthracite,
  },
  effet: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
  pied: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  viser: {
    minHeight: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    paddingHorizontal: Espace.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viserActif: {
    backgroundColor: Colors.encre,
  },
  viserInactif: {
    backgroundColor: Colors.carton,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  viserTexte: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  viserTexteInactif: {
    color: Colors.crayon,
  },
  etiquette: {
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
  },
  etiquetteInstruction: {
    borderColor: Colors.anthracite,
    backgroundColor: Colors.pastelJaune,
  },
  etiquetteEffective: {
    borderColor: Colors.vertEncre,
    transform: [{ rotate: '-4deg' }],
  },
  etiquetteTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  texteEffectif: {
    fontFamily: Fonts.titreGras,
    color: Colors.vertEncre,
    letterSpacing: 1,
  },
});
