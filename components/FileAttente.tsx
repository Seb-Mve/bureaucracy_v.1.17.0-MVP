import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Frown, Meh, Smile, Ticket } from 'lucide-react-native';
import { useGameState, type UsagerAffiche } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';

const HUMEURS: Record<number, { Icone: typeof Smile; label: string; couleur: string }> = {
  3: { Icone: Smile, label: 'patient', couleur: Colors.vertEncre },
  2: { Icone: Meh, label: 'agacé', couleur: Colors.encreTexte },
  1: { Icone: Frown, label: 'excédé', couleur: Colors.rouge },
};

interface UsagerCarteProps {
  usager: UsagerAffiche;
  numerote: boolean;
  auGuichet: boolean;
}

const UsagerCarte = memo(function UsagerCarte({ usager, numerote, auGuichet }: UsagerCarteProps) {
  const humeur = HUMEURS[usager.patience] ?? HUMEURS[3];
  const { Icone } = humeur;
  const fond = Colors.avatars[usager.couleur % Colors.avatars.length];
  const nom = numerote ? `Usager n° ${usager.numero.toLocaleString('fr-FR')}` : `${usager.prenom} ${usager.nom}`;

  return (
    <View
      style={[styles.carte, auGuichet && styles.carteGuichet]}
      accessible
      accessibilityLabel={`${auGuichet ? 'Au guichet : ' : ''}${nom}, ${usager.demande}, ${humeur.label}`}
    >
      <View style={[styles.avatar, { backgroundColor: numerote ? Colors.carton : fond }]}>
        {numerote ? (
          <Ticket size={15} color={Colors.anthracite} />
        ) : (
          <Text style={styles.initiales}>{usager.initiales}</Text>
        )}
      </View>
      <View style={styles.identite}>
        {auGuichet && <Text style={styles.auGuichet}>AU GUICHET · dossier sur votre bureau</Text>}
        <Text style={styles.nom} numberOfLines={1}>
          {nom}
        </Text>
        <Text style={styles.demande} numberOfLines={1}>
          {usager.demande}
        </Text>
      </View>
      <View style={styles.humeur}>
        <Icone size={18} color={humeur.couleur} />
        <Text style={[styles.humeurLabel, { color: humeur.couleur }]}>{humeur.label}</Text>
      </View>
    </View>
  );
});

/** Les trois premiers usagers de la file, puis le nombre de dossiers restants. */
export default function FileAttente() {
  const { tete, enAttente, mods } = useGameState();
  const reste = Math.max(0, Math.floor(enAttente) - tete.length);

  return (
    <View style={styles.file}>
      <Text style={styles.titre}>Guichet 3 · file d’attente</Text>
      {tete.length === 0 ? (
        <Text style={styles.vide}>Aucun usager. Le guichet attend.</Text>
      ) : (
        tete.map((u, i) => <UsagerCarte key={u.numero} usager={u} numerote={mods.numerotation} auGuichet={i === 0} />)
      )}
      {reste > 0 && <Text style={styles.reste}>+ {formatEntier(reste)} dossiers en attente</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  file: {
    gap: 6,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: 16,
    color: Colors.anthracite,
  },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    backgroundColor: Colors.papier,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  carteGuichet: {
    backgroundColor: Colors.encreFond,
    borderWidth: Charte.trait,
  },
  auGuichet: {
    fontFamily: Fonts.texteGras,
    fontSize: 9,
    color: Colors.encreTexte,
    letterSpacing: 0.3,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initiales: {
    fontFamily: Fonts.texteGras,
    fontSize: 11,
    color: Colors.anthracite,
  },
  identite: {
    flex: 1,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: 13,
    color: Colors.anthracite,
  },
  demande: {
    fontFamily: Fonts.texte,
    fontSize: 11,
    color: Colors.crayon,
  },
  humeur: {
    alignItems: 'center',
    minWidth: 44,
  },
  humeurLabel: {
    fontFamily: Fonts.texteGras,
    fontSize: 9,
  },
  vide: {
    fontFamily: Fonts.texte,
    fontSize: 13,
    color: Colors.crayon,
    paddingVertical: 12,
    textAlign: 'center',
  },
  reste: {
    fontFamily: Fonts.texteGras,
    fontSize: 11,
    color: Colors.crayon,
    textAlign: 'right',
  },
});
