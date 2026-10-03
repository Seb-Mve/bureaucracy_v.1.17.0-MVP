import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { AgentId, GameEvents, GameState, Lettre, Modifiers, NoteId } from '@/types/game';
import { AGENTS, BALANCE, GRADES, type AgentDef, type GradeDef } from '@/constants/balance';
import * as E from '@/data/engine';
import { NOTES_PAR_ID, type NoteDef } from '@/data/notes';
import { nouvellesLettres, lettreAbsence } from '@/data/courrier';
import { teteDeFile, type UsagerAffiche } from '@/data/usagers';
import { CLE_SAUVEGARDE, estSauvegardeValide, normaliserSauvegarde } from '@/data/save';
import { usePreferences } from '@/context/PreferencesContext';

export type { UsagerAffiche };

const INTERVALLE = 100;
/** Au-delà de cet écart entre deux ticks, on considère une absence (onglet en veille). */
const SEUIL_ABSENCE = 30_000;
/** Délai maximal entre une modification de l'état et son écriture sur le disque (ms). */
const DELAI_SAUVEGARDE = 1000;
/** Plafond d'un achat « Max » de collègues, par sécurité. */
const ACHAT_MAX = 500;
/** Une absence plus courte (simple rechargement) est rattrapée sans lettre du S.I.C. (s). */
const ABSENCE_LETTRE_S = 300;

export type StatutNote = 'disponible' | 'tropCher' | 'instruction' | 'effective';

export interface NoteAffichee extends Omit<NoteDef, 'visible' | 'appliquer'> {
  statut: StatutNote;
  /** Secondes restantes d'instruction. */
  resteSec: number;
  nouvelle: boolean;
}

export interface AgentAffiche extends AgentDef {
  possedes: number;
  cout: number;
  achetable: boolean;
  /** Coût de dix recrutements d'affilée (le prix monte à chaque embauche). */
  cout10: number;
  /** Recrutements possibles d'affilée avec le budget actuel. */
  maxAchetables: number;
  /** Coût de ces recrutements d'affilée. */
  coutMax: number;
}

export interface GradeAffiche {
  nom: string;
  /** 0 = grade de départ. */
  rang: number;
  /** Dotation supplémentaire apportée par le grade (0,1 = +10 %). */
  bonus: number;
  suivant: GradeDef | null;
}

export interface Verdict {
  id: number;
  rejete: boolean;
  /** L'usager rejeté l'était pour la dernière fois : il abandonne et quitte le périmètre. */
  abandon: boolean;
  /** Le dossier qui vient d'être tamponné (celui qui était au guichet). */
  usager: UsagerAffiche | null;
}

interface GameContextType {
  pret: boolean;
  etat: GameState;
  mods: Modifiers;
  maintenant: number;
  enAttente: number;
  vitesse: number;
  perimetre: number;
  conformite: number;
  grade: GradeAffiche;
  tete: UsagerAffiche[];
  notes: NoteAffichee[];
  notesNonVues: number;
  agents: AgentAffiche[];
  prixRamette: number;
  /** Ramettes du bouton « Max » : ce que le budget permet, plafonné à un stock de 10 minutes. */
  maxRamettes: number;
  lettresNonLues: number;
  verdict: Verdict | null;
  /** Abandons cumulés hors de l'usager au guichet (collègues, reste d'un coup à plusieurs dossiers) : la scène en fait partir autant. */
  abandonsFile: number;
  demandeLimitante: boolean;
  /** Une ramette gratuite quand la rupture bloquerait le guichet faute de budget. */
  demanderRequisition: () => void;
  tamponner: () => GameEvents;
  /** Recrute `nb` collègues d'affilée (autant que le budget le permet). */
  acheterAgent: (id: AgentId, nb?: number) => void;
  acheterRamettes: (nb: number) => void;
  reglerTauxRejet: (taux: number) => void;
  acheterNote: (id: NoteId) => void;
  marquerNotesVues: () => void;
  signerCerfa: (prenom: string) => void;
  deposerDemission: () => void;
  marquerLettresLues: () => void;
  marquerFinActeVue: () => void;
  marquerFichePoste: (vue: boolean) => void;
  nouvellePartie: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

function vibrer(style: 'leger' | 'moyen' | 'succes') {
  if (Platform.OS === 'web') return;
  if (style === 'succes') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else Haptics.impactAsync(style === 'leger' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
}

/** Ajoute au courrier les lettres dont le déclencheur est devenu vrai. */
function distribuerCourrier(s: GameState, maintenant: number): GameState {
  const lettres = nouvellesLettres(s, maintenant);
  if (lettres.length === 0) return s;
  return {
    ...s,
    courrier: [...lettres, ...s.courrier],
    lettresEnvoyees: [...s.lettresEnvoyees, ...lettres.map((l) => l.id)],
  };
}

function rattraperAbsence(s: GameState, maintenant: number): GameState {
  const r = E.simulerAbsence(s, maintenant);
  if (r.secondes < ABSENCE_LETTRE_S || r.traites < 1) return r.s;
  const lettre: Lettre = lettreAbsence(r.secondes, r.traites, r.budget, maintenant);
  return { ...r.s, courrier: [lettre, ...r.s.courrier] };
}

export default function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [etat, setEtat] = useState<GameState>(() => E.etatInitial(Date.now()));
  const [pret, setPret] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [abandonsFile, setAbandonsFile] = useState(0);
  /** Fractions d'abandon pas encore montrées (le moteur agrège des parts de dossier). */
  const abandonsEnCours = useRef(0);
  const compterAbandons = useCallback((n: number) => {
    if (n <= 0) return;
    abandonsEnCours.current += n;
    const entiers = Math.floor(abandonsEnCours.current);
    if (entiers < 1) return;
    abandonsEnCours.current -= entiers;
    setAbandonsFile((a) => a + entiers);
  }, []);
  const { vibrations } = usePreferences();
  const vibrationsRef = useRef(vibrations);
  vibrationsRef.current = vibrations;
  const vibrerSi = useCallback((style: 'leger' | 'moyen' | 'succes') => {
    if (vibrationsRef.current) vibrer(style);
  }, []);
  const etatRef = useRef(etat);
  const verdictId = useRef(0);
  const sauvegardeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const satureRef = useRef(false);

  const appliquer = useCallback((s: GameState) => {
    etatRef.current = s;
    setEtat(s);
  }, []);

  // Chargement de la sauvegarde + rattrapage de l'absence.
  useEffect(() => {
    let annule = false;
    (async () => {
      const maintenant = Date.now();
      let s = E.etatInitial(maintenant);
      try {
        const brut = await AsyncStorage.getItem(CLE_SAUVEGARDE);
        if (brut) {
          const lu: unknown = JSON.parse(brut);
          if (estSauvegardeValide(lu)) s = rattraperAbsence(normaliserSauvegarde(lu), maintenant);
        }
      } catch {
        // Sauvegarde corrompue : nouvelle partie.
      }
      if (!annule) {
        appliquer(s);
        setPret(true);
      }
    })();
    return () => {
      annule = true;
    };
  }, [appliquer]);

  // Sauvegarde limitée à une écriture par seconde. La boucle de jeu modifie l'état toutes
  // les 100 ms : on ne réarme donc pas un minuteur déjà en attente (sinon il ne partirait
  // jamais) ; il écrira l'état le plus récent au moment où il se déclenche.
  useEffect(() => {
    if (!pret || sauvegardeTimer.current) return;
    sauvegardeTimer.current = setTimeout(() => {
      sauvegardeTimer.current = null;
      AsyncStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etatRef.current)).catch(() => undefined);
    }, DELAI_SAUVEGARDE);
  }, [etat, pret]);

  useEffect(
    () => () => {
      if (sauvegardeTimer.current) clearTimeout(sauvegardeTimer.current);
    },
    [],
  );

  // Boucle de jeu.
  useEffect(() => {
    if (!pret) return;
    const id = setInterval(() => {
      const maintenant = Date.now();
      const s0 = etatRef.current;
      if (!s0.cerfa.signe) return;
      const ecart = maintenant - s0.derniereMaj;
      let s1: GameState;
      if (ecart > SEUIL_ABSENCE) {
        s1 = rattraperAbsence(s0, maintenant);
      } else {
        const r = E.tick(s0, Math.max(0, ecart) / 1000, maintenant);
        compterAbandons(r.ev.abandons);
        s1 = r.s;
      }
      appliquer(distribuerCourrier(s1, maintenant));
    }, INTERVALLE);
    return () => clearInterval(id);
  }, [pret, appliquer, compterAbandons]);

  // Sauvegarde immédiate en arrière-plan.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') {
        AsyncStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etatRef.current)).catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, []);

  const tamponner = useCallback((): GameEvents => {
    // L'usager de la bulle est celui dont le dossier passe en premier : ce que dit la bulle (« Troisième fois… »)
    // est ce que le coup produit.
    const avant = teteDeFile(etatRef.current)[0] ?? null;
    const t = Date.now();
    const r = E.tamponner(etatRef.current, t, Math.random, avant?.patience);
    if (r.ev.traites > 0) {
      const rejete = r.ev.tete ? r.ev.tete.rejete : r.ev.rejetes > 0 && Math.random() < r.ev.rejetes / r.ev.traites;
      const abandon = r.ev.tete?.abandon ?? false;
      verdictId.current += 1;
      setVerdict({ id: verdictId.current, rejete, abandon, usager: avant });
      compterAbandons(r.ev.abandons - (abandon ? 1 : 0));
      vibrerSi('leger');
    }
    appliquer(r.s);
    return r.ev;
  }, [appliquer, vibrerSi, compterAbandons]);

  const acheterAgent = useCallback(
    (id: AgentId, nb = 1) => {
      const maintenant = Date.now();
      let s = etatRef.current;
      for (let i = 0; i < Math.min(nb, ACHAT_MAX); i++) {
        const suivant = E.acheterAgent(s, id, maintenant);
        if (suivant === s) break;
        s = suivant;
      }
      if (s !== etatRef.current) vibrerSi('moyen');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );

  const acheterRamettes = useCallback(
    (nb: number) => {
      const s = E.acheterRamettes(etatRef.current, nb, Date.now());
      if (s !== etatRef.current) vibrerSi('moyen');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );

  const demanderRequisition = useCallback(() => {
    const s = E.requisitionUrgence(etatRef.current, Date.now());
    if (s !== etatRef.current) vibrerSi('moyen');
    appliquer(s);
  }, [appliquer, vibrerSi]);

  const reglerTauxRejet = useCallback(
    (taux: number) => appliquer(E.reglerTauxRejet(etatRef.current, taux, Date.now())),
    [appliquer],
  );

  const acheterNote = useCallback(
    (id: NoteId) => {
      const s = E.acheterNote(etatRef.current, id, Date.now());
      if (s !== etatRef.current) vibrerSi('succes');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );

  const marquerNotesVues = useCallback(() => {
    const s = etatRef.current;
    const visibles = E.notesVisibles(s);
    if (visibles.every((id) => s.notesVues.includes(id))) return;
    appliquer({ ...s, notesVues: visibles });
  }, [appliquer]);

  const signerCerfa = useCallback(
    (prenom: string) => {
      const maintenant = Date.now();
      vibrerSi('succes');
      appliquer({ ...E.signerCerfa(etatRef.current, prenom, maintenant), derniereMaj: maintenant });
    },
    [appliquer, vibrerSi],
  );

  const deposerDemission = useCallback(
    () => appliquer(E.deposerDemission(etatRef.current, Date.now())),
    [appliquer],
  );

  const marquerLettresLues = useCallback(() => {
    const s = etatRef.current;
    if (s.courrier.every((l) => l.lue)) return;
    appliquer({ ...s, courrier: s.courrier.map((l) => (l.lue ? l : { ...l, lue: true })) });
  }, [appliquer]);

  const marquerFinActeVue = useCallback(
    () => appliquer({ ...etatRef.current, finActeVue: true }),
    [appliquer],
  );

  const marquerFichePoste = useCallback(
    (vue: boolean) => appliquer({ ...etatRef.current, fichePosteVue: vue }),
    [appliquer],
  );

  const nouvellePartie = useCallback(() => {
    satureRef.current = false;
    setVerdict(null);
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    appliquer(E.etatInitial(Date.now()));
  }, [appliquer]);

  const maintenant = etat.derniereMaj;
  const mods = useMemo(() => E.getModifiers(etat, maintenant), [etat, maintenant]);

  const notes = useMemo<NoteAffichee[]>(
    () =>
      E.notesVisibles(etat).map((id) => {
        const def = NOTES_PAR_ID[id];
        const st = etat.notes[id];
        let statut: StatutNote = etat.budget >= def.cout ? 'disponible' : 'tropCher';
        let resteSec = 0;
        if (st) {
          resteSec = Math.max(0, Math.ceil((st.effective - maintenant) / 1000));
          statut = resteSec > 0 ? 'instruction' : 'effective';
        }
        const { visible: _v, appliquer: _a, ...rest } = def;
        return { ...rest, statut, resteSec, nouvelle: !etat.notesVues.includes(id) };
      }),
    [etat, maintenant],
  );

  const agents = useMemo<AgentAffiche[]>(
    () =>
      AGENTS.filter((a) => mods.agentsDisponibles.includes(a.id)).map((a) => {
        const possedes = etat.agents[a.id];
        const cout = E.coutAgent(a.id, possedes);
        let cout10 = 0;
        for (let i = 0; i < 10; i++) cout10 += E.coutAgent(a.id, possedes + i);
        let maxAchetables = 0;
        let coutMax = 0;
        for (let reste = etat.budget; maxAchetables < ACHAT_MAX; maxAchetables++) {
          const prix = E.coutAgent(a.id, possedes + maxAchetables);
          if (reste < prix) break;
          reste -= prix;
          coutMax += prix;
        }
        return {
          ...a,
          possedes,
          cout,
          achetable: etat.budget >= cout,
          cout10,
          maxAchetables,
          coutMax,
        };
      }),
    [etat, mods],
  );

  const vitesse = useMemo(() => E.vitesseCollegues(etat, mods), [etat, mods]);

  // Les collègues approchent le plafond de demande du périmètre : recruter n'accélérerait plus rien.
  const sature = useMemo(() => {
    const s = E.saturation(satureRef.current, vitesse, E.plafondDemande(etat, mods));
    satureRef.current = s;
    return s;
  }, [etat, mods, vitesse]);

  const rang = E.rangGrade(etat.tampons);
  const grade = useMemo<GradeAffiche>(
    () => ({ nom: GRADES[rang].nom, rang, bonus: rang * BALANCE.bonusGrade, suivant: GRADES[rang + 1] ?? null }),
    [rang],
  );

  const valeur = useMemo<GameContextType>(
    () => ({
      pret,
      etat,
      mods,
      maintenant,
      enAttente: E.dossiersEnAttente(etat),
      vitesse,
      perimetre: E.perimetre(etat, maintenant),
      conformite: E.conformite(etat),
      grade,
      tete: teteDeFile(etat),
      notes,
      notesNonVues: notes.filter((n) => n.nouvelle).length,
      agents,
      prixRamette: E.prixRamette(mods),
      maxRamettes: Math.floor(etat.budget / E.prixRamette(mods)),
      lettresNonLues: etat.courrier.filter((l) => !l.lue).length,
      verdict,
      abandonsFile,
      // Seulement quand les collègues butent sur la demande : une file vidée par les taps du joueur ne compte pas.
      demandeLimitante: sature,
      demanderRequisition,
      tamponner,
      acheterAgent,
      acheterRamettes,
      reglerTauxRejet,
      acheterNote,
      marquerNotesVues,
      signerCerfa,
      deposerDemission,
      marquerLettresLues,
      marquerFinActeVue,
      marquerFichePoste,
      nouvellePartie,
    }),
    [
      pret, etat, mods, maintenant, vitesse, notes, agents, verdict, abandonsFile, sature, demanderRequisition, grade, tamponner,
      acheterAgent, acheterRamettes, reglerTauxRejet, acheterNote, marquerNotesVues, signerCerfa,
      deposerDemission, marquerLettresLues, marquerFinActeVue, marquerFichePoste,
      nouvellePartie,
    ],
  );

  return <GameContext.Provider value={valeur}>{children}</GameContext.Provider>;
}

/** Accès à l'état et aux actions du jeu. */
export function useGameState(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState doit être utilisé dans GameStateProvider');
  return ctx;
}

/**
 * Fenêtre (fiche de poste, courrier, confirmation, fin d'acte) : elle se ferme par Échap sur le web
 * (le bouton retour d'Android passe par onRequestClose). Le jeu ne se met jamais en pause.
 */
export function useFermetureEchap(ouverte: boolean, fermer: () => void) {
  const fermerRef = useRef(fermer);
  fermerRef.current = fermer;

  useEffect(() => {
    if (Platform.OS !== 'web' || !ouverte) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      fermerRef.current();
    };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [ouverte]);
}
