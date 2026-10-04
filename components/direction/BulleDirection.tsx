import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Landmark, Paperclip, Stamp } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';

/** Numéro sur trois chiffres au moins, comme un registre (« 048 », puis « 9 412 »). */
const numeroParapheur = (n: number): string =>
  n < 1000 ? n.toString().padStart(3, '0') : formatEntier(n);

/**
 * Bulle de l'écran Direction, au-dessus de la scène : le parapheur que le prochain coup vise, et le tableau de
 * circulation de sa procédure, en fiches reliées par des trombones. Chaque fiche porte qui la traite (guichet ou
 * tampon) et les dossiers qui y attendent ; les visas en attente s'allument (fond d'encre) ; la plus encombrée a
 * un bord épais (jamais la seule couleur).
 */
export default function BulleDirection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { direction, encre } = useGameState();
  if (!direction) return null;
  const { parapheur, etapes, usagers } = direction;

  let titre = 'Aucun parapheur à viser';
  let detail: string | null = null;
  if (usagers < 1) {
    titre = 'Salle d’attente vide';
    detail = 'Aucun usager · les procédures suivent leur cours';
  } else if (parapheur) {
    titre = `Parapheur n° ${numeroParapheur(parapheur.numero)} · ${parapheur.procNom}`;
    detail = parapheur.sansUsager
      ? 'Dossier sans usager'
      : 'Visa du chef de service';
  }
  const chaine = etapes
    .map(
      (e) =>
        `${e.nom}, ${formatEntier(e.attente)} en attente, ${
          e.traitePar === 'visa'
            ? 'visée par vous et vos agents'
            : 'traitée par les guichets'
        }${e.encombree ? ', la plus encombrée' : ''}`,
    )
    .join(' ; ');

  return (
    <View style={[styles.zone, compact && styles.zoneCompacte]}>
      <View
        style={[styles.bulle, compact && styles.bulleCompacte]}
        accessible
        accessibilityLabel={`${titre}.${detail ? ` ${detail}.` : ''} Procédure : ${chaine}.`}
      >
        <Text style={styles.titre} numberOfLines={1}>
          {titre}
        </Text>
        {detail && !compact && (
          <Text style={styles.detail} numberOfLines={1}>
            {detail}
          </Text>
        )}
        {!compact && (
          <View style={styles.chaine}>
            {etapes.map((e, i) => (
              <React.Fragment key={`${e.type}-${i}`}>
                {i > 0 && <Paperclip size={12} color={Colors.crayon} />}
                <View
                  style={[
                    styles.fiche,
                    e.encombree && styles.ficheEncombree,
                    e.allumee && { backgroundColor: encre.face },
                  ]}
                >
                  {e.traitePar === 'visa' ? (
                    <Stamp size={12} color={Colors.anthracite} />
                  ) : (
                    <Landmark size={12} color={Colors.anthracite} />
                  )}
                  <Text
                    style={[
                      styles.ficheTexte,
                      e.allumee && styles.ficheAllumee,
                    ]}
                    numberOfLines={1}
                  >
                    {e.nom}
                  </Text>
                  <Text
                    style={[
                      styles.ficheNombre,
                      e.encombree && styles.ficheNombreEncombre,
                    ]}
                    numberOfLines={1}
                  >
                    {formatEntier(e.attente)}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}
        {/* La pointe descend vers la corbeille du chef, au milieu de la scène. */}
        <View style={styles.pointe} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: Espace.l,
    paddingTop: Espace.s,
    paddingBottom: Espace.m,
    zIndex: 2,
  },
  zoneCompacte: {
    paddingTop: Espace.xs,
    paddingBottom: Espace.xs,
  },
  bulle: {
    backgroundColor: Colors.papier,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
    gap: 2,
  },
  bulleCompacte: {
    paddingVertical: Espace.xs,
  },
  titre: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    lineHeight: Interligne.corps,
    color: Colors.anthracite,
  },
  detail: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.crayon,
  },
  chaine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Espace.xs,
    marginTop: Espace.xs,
  },
  fiche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.xs,
    borderWidth: 1.5,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonMini,
    paddingHorizontal: Espace.xs,
    backgroundColor: Colors.papierChaud,
  },
  ficheTexte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.anthracite,
  },
  ficheAllumee: {
    fontFamily: Fonts.texteGras,
  },
  /** La fiche la plus encombrée : bord épais, en plus du chiffre. */
  ficheEncombree: {
    borderWidth: Charte.trait,
  },
  ficheNombre: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.micro,
    lineHeight: Interligne.micro,
    color: Colors.anthracite,
  },
  ficheNombreEncombre: {
    fontFamily: Fonts.chiffres,
  },
  pointe: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -7,
    width: 14,
    height: 14,
    backgroundColor: Colors.papier,
    borderRightWidth: Charte.traitFin,
    borderBottomWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    transform: [{ rotate: '45deg' }],
  },
});
