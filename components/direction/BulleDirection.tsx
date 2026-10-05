import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, IdCard, Landmark, Paperclip, Stamp } from 'lucide-react-native';
import {
  useGameState,
  type EtapeChaine,
  type ParapheurAffiche,
} from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';

/** Durée pendant laquelle la bulle montre l'usager qui repart avec son document (ms). */
const DUREE_REPART = 1200;

/** Ce que la bulle montrait juste avant un coup : la demande, sa chaîne et la fiche de délivrance. */
interface Instantane {
  parapheur: ParapheurAffiche;
  etapes: EtapeChaine[];
  delivrance: { nom: string };
}

/** Lecture d'une fiche pour l'accessibilité. */
function lectureFiche(e: EtapeChaine, repart: boolean): string {
  if (repart || e.faite) return `${e.nom}, faite`;
  const qui =
    e.pictogramme === 'visa'
      ? 'visée par vous et vos agents'
      : e.pictogramme === 'guichet'
        ? 'traitée par les guichets'
        : 'aucun guichet';
  return `${e.nom}, ${formatEntier(e.attente)} en attente, ${qui}${e.encombree ? ', la plus encombrée' : ''}${e.ici ? ', ici' : ''}`;
}

/**
 * Bulle de l'écran Direction (specs/012) : la demande que suit la bulle (« Mme Lefèvre demande une Carte
 * d’identité », ou « Demande n° 9 907 · Carte d’identité » sans usager), ce qu'elle attend (« Attend votre
 * visa », « Attend la vérification des pièces ») et sa procédure en fiches reliées par des trombones, jusqu'à
 * « Délivrée ». Chaque fiche porte qui la traite (tampon, guichet, rien tant qu'il n'y a pas de guichet) et les
 * demandes qui y attendent ; une étape franchie où plus personne n'attend porte une coche ; le visa de la
 * demande s'allume (« ← ici ») ; la plus encombrée a un bord épais. Juste après une délivrance, la bulle garde
 * l'usager servi : « Repart avec sa Carte d’identité », toute la chaîne cochée, « Délivrée » en gras sur fond
 * vert (jamais la seule couleur).
 */
export default function BulleDirection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { direction, verdict, encre } = useGameState();
  const [repart, setRepart] = useState<Instantane | null>(null);
  const dernierVerdict = useRef(verdict?.id ?? null);
  const precedent = useRef<Instantane | null>(null);

  // Un coup qui délivre un document à son usager : la bulle le garde un instant (avant d'enregistrer l'état).
  useEffect(() => {
    if (!verdict || verdict.id === dernierVerdict.current) return;
    dernierVerdict.current = verdict.id;
    const servi = precedent.current;
    if (!verdict.delivre || !servi || servi.parapheur.repart === null) {
      setRepart(null);
      return;
    }
    setRepart(servi);
    const t = setTimeout(() => setRepart(null), DUREE_REPART);
    return () => clearTimeout(t);
  }, [verdict]);

  // La demande affichée, mémorisée pour le prochain coup.
  useEffect(() => {
    precedent.current = direction?.parapheur
      ? {
          parapheur: direction.parapheur,
          etapes: direction.etapes,
          delivrance: direction.delivrance,
        }
      : null;
  });

  if (!direction) return null;
  const vue: Instantane | null =
    repart ??
    (direction.parapheur
      ? {
          parapheur: direction.parapheur,
          etapes: direction.etapes,
          delivrance: direction.delivrance,
        }
      : null);
  const etapes = vue?.etapes ?? direction.etapes;
  const delivrance = vue?.delivrance ?? direction.delivrance;
  const servi = repart !== null;

  const titre = vue ? vue.parapheur.titre : 'Aucune demande en cours';
  const detail = vue
    ? servi
      ? vue.parapheur.repart
      : vue.parapheur.attente
    : null;
  const chaine = etapes
    .map((e) => lectureFiche(e, servi))
    .concat(`${delivrance.nom}${servi ? ', faite' : ''}`)
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
            {etapes.map((e, i) => {
              const faite = servi || e.faite;
              const ici = !servi && e.ici;
              return (
                <React.Fragment key={`${e.type}-${i}`}>
                  {i > 0 && <Paperclip size={12} color={Colors.crayon} />}
                  <View
                    style={[
                      styles.fiche,
                      !faite && e.encombree && styles.ficheEncombree,
                      faite && styles.ficheFaite,
                      ici && { backgroundColor: encre.face },
                    ]}
                  >
                    {faite ? (
                      <Check size={12} color={Colors.anthracite} />
                    ) : e.pictogramme === 'visa' ? (
                      <Stamp size={12} color={Colors.anthracite} />
                    ) : e.pictogramme === 'guichet' ? (
                      <Landmark size={12} color={Colors.anthracite} />
                    ) : null}
                    <Text
                      style={[styles.ficheTexte, ici && styles.ficheAllumee]}
                      numberOfLines={1}
                    >
                      {ici ? `${e.nom} ← ici` : e.nom}
                    </Text>
                    {!faite && (
                      <Text
                        style={[
                          styles.ficheNombre,
                          e.encombree && styles.ficheNombreEncombre,
                        ]}
                        numberOfLines={1}
                      >
                        {formatEntier(e.attente)}
                      </Text>
                    )}
                  </View>
                </React.Fragment>
              );
            })}
            <Paperclip size={12} color={Colors.crayon} />
            <View style={[styles.fiche, servi && styles.ficheDelivree]}>
              <IdCard size={12} color={Colors.anthracite} />
              <Text
                style={[styles.ficheTexte, servi && styles.ficheAllumee]}
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
  /** Étape franchie : coche et fond vert (jamais la couleur seule). */
  ficheFaite: {
    backgroundColor: Colors.pastelVert,
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
  /** « Délivrée » à la délivrance : bord moyen et fond vert, en plus du texte gras. */
  ficheDelivree: {
    borderWidth: Charte.traitFin,
    backgroundColor: Colors.pastelVert,
  },
});
