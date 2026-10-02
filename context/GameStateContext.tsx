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
import { ordreDuJour, SEUIL_FORMULAIRES, type Consigne, type Onglet } from '@/data/ordreDuJour';
import { circulaireAAfficher, type CirculaireDef } from '@/data/circulaires';
import { formatEntier } from '@/utils/formatters';
import { usePreferences } from '@/context/PreferencesContext';

export type { UsagerAffiche, Consigne, Onglet, CirculaireDef };

const INTERVALLE = 100;
/** Au-delà de cet écart entre deux ticks, on considère une absence (onglet en veille). */
const SEUIL_ABSENCE = 30_000;
/** Délai maximal entre une modification de l'état et son écriture sur le disque (ms). */
const DELAI_SAUVEGARDE = 1000;
/** Fenêtre de calcul du débit des taps (ms). */
const FENETRE_TAPS = 5000;
/** Plafond d'un achat « Max » de collègues, par sécurité. */
const ACHAT_MAX = 500;
/** Le stock de formulaires est « bas » s'il tient moins que ce temps au rythme des collègues (s). */
const AUTONOMIE_MIN = 15;

export interface Flux {
  /** Dossiers arrivant par seconde. */
  arrivees: number;
  /** Dossiers traités par seconde : collègues + taps récents. */
  traitement: number;
  /** Les collègues approchent le plafond de demande du périmètre. */
  sature: boolean;
}

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
  /** Dossiers/s gagnés avec le prochain recrutement (palier compris). */
  gain: number;
  /** Multiplicateur d'ancienneté actuel (×1, ×2, ×4, ×8). */
  multiplicateur: number;
  prochainPalier: number | null;
  /** Coût de dix recrutements d'affilée (le prix monte à chaque embauche). */
  cout10: number;
  /** Recrutements possibles d'affilée avec le budget actuel. */
  maxAchetables: number;
}

export interface GradeAffiche {
  nom: string;
  /** 0 = grade de départ. */
  rang: number;
  /** Dotation supplémentaire apportée par le grade (0,1 = +10 %). */
  bonus: number;
  suivant: GradeDef | null;
}

/** Dernière relance d'une note en instruction, provoquée par un coup de tampon. */
export interface Relance {
  id: number;
  etat: 'transmise' | 'classee';
}

export interface Verdict {
  id: number;
  rejete: boolean;
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
  lettresNonLues: number;
  verdict: Verdict | null;
  relance: Relance | null;
  flux: Flux;
  /** Le stock de formulaires va bientôt manquer (avant la rupture). */
  stockBas: boolean;
  consigne: Consigne | null;
  circulaire: CirculaireDef | null;
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
  marquerCirculaireVue: (id: string) => void;
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
  if (r.secondes < 30 || r.traites < 1) return r.s;
  const lettre: Lettre = lettreAbsence(r.secondes, r.traites, r.budget, maintenant, formatEntier);
  return { ...r.s, courrier: [lettre, ...r.s.courrier] };
}

export default function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [etat, setEtat] = useState<GameState>(() => E.etatInitial(Date.now()));
  const [pret, setPret] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [relance, setRelance] = useState<Relance | null>(null);
  const relanceId = useRef(0);
  const { vibrations } = usePreferences();
  const vibrationsRef = useRef(vibrations);
  vibrationsRef.current = vibrations;
  const vibrerSi = useCallback((style: 'leger' | 'moyen' | 'succes') => {
    if (vibrationsRef.current) vibrer(style);
  }, []);
  const etatRef = useRef(etat);
  const rejetAcc = useRef(0);
  const verdictId = useRef(0);
  const sauvegardeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapsRecents = useRef<{ t: number; n: number }[]>([]);
  const satureRef = useRef(false);
  const debitCollegues = useRef(0);

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
          if (estSauvegardeValide(lu)) s = rattraperAbsence(normaliserSauvegarde(lu, maintenant), maintenant);
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
        const dt = Math.max(0, ecart) / 1000;
        const r = E.tick(s0, dt, maintenant);
        if (dt > 0) debitCollegues.current = debitCollegues.current * 0.8 + (r.ev.traites / dt) * 0.2;
        s1 = r.s;
      }
      appliquer(distribuerCourrier(s1, maintenant));
    }, INTERVALLE);
    return () => clearInterval(id);
  }, [pret, appliquer]);

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
    const avant = teteDeFile(etatRef.current, 1)[0] ?? null;
    const t = Date.now();
    const r = E.tamponner(etatRef.current, t);
    if (r.ev.traites > 0) {
      tapsRecents.current = [...tapsRecents.current.filter((x) => t - x.t < FENETRE_TAPS), { t, n: r.ev.traites }];
      rejetAcc.current += r.ev.rejetes;
      const rejete = rejetAcc.current >= 0.999;
      if (rejete) rejetAcc.current -= 1;
      verdictId.current += 1;
      setVerdict({ id: verdictId.current, rejete, usager: avant });
      vibrerSi('leger');
    }
    if (r.ev.relance) {
      relanceId.current += 1;
      setRelance({ id: relanceId.current, etat: r.ev.relance });
    }
    appliquer(r.s);
    return r.ev;
  }, [appliquer, vibrerSi]);

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

  const marquerCirculaireVue = useCallback(
    (id: string) => {
      const s = etatRef.current;
      if (s.circulairesVues.includes(id)) return;
      appliquer({ ...s, circulairesVues: [...s.circulairesVues, id] });
    },
    [appliquer],
  );

  const nouvellePartie = useCallback(() => {
    rejetAcc.current = 0;
    tapsRecents.current = [];
    satureRef.current = false;
    debitCollegues.current = 0;
    setVerdict(null);
    setRelance(null);
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
        for (let reste = etat.budget; maxAchetables < ACHAT_MAX; maxAchetables++) {
          const prix = E.coutAgent(a.id, possedes + maxAchetables);
          if (reste < prix) break;
          reste -= prix;
        }
        return {
          ...a,
          possedes,
          cout,
          achetable: etat.budget >= cout,
          gain: E.gainAgent(etat, a.id, mods),
          multiplicateur: E.multiplicateurAnciennete(possedes),
          prochainPalier: E.prochainPalier(possedes),
          cout10,
          maxAchetables,
        };
      }),
    [etat, mods],
  );

  const vitesse = useMemo(() => E.vitesseCollegues(etat, mods), [etat, mods]);

  const flux = useMemo<Flux>(() => {
    const recents = tapsRecents.current.filter((x) => maintenant - x.t < FENETRE_TAPS);
    const parTaps = recents.reduce((acc, x) => acc + x.n, 0) / (FENETRE_TAPS / 1000);
    const sature = E.saturation(satureRef.current, vitesse, E.plafondDemande(etat, mods));
    satureRef.current = sature;
    return { arrivees: E.fluxEntrant(etat, mods), traitement: debitCollegues.current + parTaps, sature };
  }, [etat, mods, maintenant, vitesse]);

  const rang = E.rangGrade(etat.tampons);
  const grade = useMemo<GradeAffiche>(
    () => ({ nom: GRADES[rang].nom, rang, bonus: rang * BALANCE.bonusGrade, suivant: GRADES[rang + 1] ?? null }),
    [rang],
  );

  const consigne = useMemo(() => ordreDuJour(etat, mods), [etat, mods]);
  // Seuil calé sur les collègues (stable) plutôt que sur les taps (qui retombent dès qu'on s'arrête).
  const seuilStock = Math.max(SEUIL_FORMULAIRES, vitesse * mods.pieces * AUTONOMIE_MIN);
  const stockBas = mods.recrutementVisible && etat.formulaires >= mods.pieces && etat.formulaires <= seuilStock;
  const circulaire = useMemo(() => circulaireAAfficher(etat, mods), [etat, mods]);

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
      lettresNonLues: etat.courrier.filter((l) => !l.lue).length,
      verdict,
      relance,
      flux,
      stockBas,
      consigne,
      circulaire,
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
      marquerCirculaireVue,
      nouvellePartie,
    }),
    [
      pret, etat, mods, maintenant, vitesse, notes, agents, verdict, relance, flux, stockBas, grade, consigne, circulaire, tamponner,
      acheterAgent, acheterRamettes, reglerTauxRejet, acheterNote, marquerNotesVues, signerCerfa,
      deposerDemission, marquerLettresLues, marquerFinActeVue, marquerFichePoste, marquerCirculaireVue,
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
