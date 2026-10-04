import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IdCard, Landmark, Paperclip, Stamp } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';

/**
 * Bulle de l'écran Direction : la demande que le prochain coup vise (« Mme Lefèvre demande une Carte d’identité »,
 * ou « Demande n° 9 907 · Carte d’identité » quand personne ne l'attend), et le tableau de circulation de sa
 * procédure, en fiches reliées par des trombones, jusqu'à la fiche « Délivrée ». Chaque fiche porte qui la traite
 * (guichet ou tampon) et les dossiers qui y attendent ; les visas en attente s'allument (fond d'encre) ; la plus
 * encombrée a un bord épais ; « Délivrée » passe en gras sur fond vert dès le premier document (jamais la seule
 * couleur).
 */
export default function BulleDirection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { direction, encre } = useGameState();
  if (!direction) return null;
  const { parapheur, etapes, delivrance } = direction;

  const titre = parapheur ? parapheur.titre : 'Aucun parapheur à viser';
  const detail = parapheur ? 'Visa du chef de service' : null;
  const chaine = etapes
    .map(
      (e) =>
        `${e.nom}, ${formatEntier(e.attente)} en attente, ${
          e.traitePar === 'visa'
            ? 'visée par vous et vos agents'
            : 'traitée par les guichets'
        }${e.encombree ? ', la plus encombrée' : ''}`,
    )
    .concat(delivrance.nom)
    .join(' ; ');

  return (
    <View style={[styles.zone, compact && styles.zoneCompacte]}>
      <View
        style={[styles.bulle, compact && styles.bulleCompacte]}
        accessible
        accessibilityLabel={`${titre}.${detail ? ` ${detail}.` : ''} Procédure : ${chaine}.`}
      >
        <Text style={styles.titre} numberOfLines={compact ? 1 : 2}>
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
            <Paperclip size={12} color={Colors.crayon} />
            <View
              style={[styles.fiche, delivrance.faite && styles.ficheDelivree]}
            >
              <IdCard size={12} color={Colors.anthracite} />
              <Text
                style={[
                  styles.ficheTexte,
                  delivrance.faite && styles.ficheAllumee,
                ]}
                numberOfLines={1}
              >
                {delivrance.nom}
              </Text>
            </View>
          </View>
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
  /** « Délivrée » : bord moyen et fond vert, en plus du texte gras. */
  ficheDelivree: {
    borderWidth: Charte.traitFin,
    backgroundColor: Colors.pastelVert,
  },
});
