import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { AgentId, GameEvents, GameState, Lettre, Modifiers, NoteId } from '@/types/game';
import { AGENTS, type AgentDef } from '@/constants/balance';
import * as E from '@/data/engine';
import { NOTES_PAR_ID, type NoteDef } from '@/data/notes';
import { nouvellesLettres, lettreAbsence } from '@/data/courrier';
import { teteDeFile, type UsagerAffiche } from '@/data/usagers';
import { CLE_SAUVEGARDE, estSauvegardeValide } from '@/data/save';
import { formatEntier } from '@/utils/formatters';

export type { UsagerAffiche };

const INTERVALLE = 100;
/** Au-delà de cet écart entre deux ticks, on considère une absence (onglet en veille). */
const SEUIL_ABSENCE = 30_000;

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
  tete: UsagerAffiche[];
  notes: NoteAffichee[];
  notesNonVues: number;
  agents: AgentAffiche[];
  prixRamette: number;
  lettresNonLues: number;
  verdict: Verdict | null;
  tamponner: () => GameEvents;
  acheterAgent: (id: AgentId) => void;
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
  if (r.secondes < 30 || r.traites < 1) return r.s;
  const lettre: Lettre = lettreAbsence(r.secondes, r.traites, r.budget, maintenant, formatEntier);
  return { ...r.s, courrier: [lettre, ...r.s.courrier] };
}

export default function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [etat, setEtat] = useState<GameState>(() => E.etatInitial(Date.now()));
  const [pret, setPret] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const etatRef = useRef(etat);
  const rejetAcc = useRef(0);
  const verdictId = useRef(0);
  const sauvegardeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          if (estSauvegardeValide(lu)) s = rattraperAbsence(lu, maintenant);
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

  // Sauvegarde différée (1 s).
  useEffect(() => {
    if (!pret) return;
    if (sauvegardeTimer.current) clearTimeout(sauvegardeTimer.current);
    sauvegardeTimer.current = setTimeout(() => {
      AsyncStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etatRef.current)).catch(() => undefined);
    }, 1000);
  }, [etat, pret]);

  // Boucle de jeu.
  useEffect(() => {
    if (!pret) return;
    const id = setInterval(() => {
      const maintenant = Date.now();
      const s0 = etatRef.current;
      if (!s0.cerfa.signe) return;
      const ecart = maintenant - s0.derniereMaj;
      const s1 =
        ecart > SEUIL_ABSENCE
          ? rattraperAbsence(s0, maintenant)
          : E.tick(s0, Math.max(0, ecart) / 1000, maintenant).s;
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
    const r = E.tamponner(etatRef.current, Date.now());
    if (r.ev.traites > 0) {
      rejetAcc.current += r.ev.rejetes;
      const rejete = rejetAcc.current >= 0.999;
      if (rejete) rejetAcc.current -= 1;
      verdictId.current += 1;
      setVerdict({ id: verdictId.current, rejete, usager: avant });
      vibrer('leger');
    }
    appliquer(r.s);
    return r.ev;
  }, [appliquer]);

  const acheterAgent = useCallback(
    (id: AgentId) => {
      const s = E.acheterAgent(etatRef.current, id, Date.now());
      if (s !== etatRef.current) vibrer('moyen');
      appliquer(s);
    },
    [appliquer],
  );

  const acheterRamettes = useCallback(
    (nb: number) => {
      const s = E.acheterRamettes(etatRef.current, nb, Date.now());
      if (s !== etatRef.current) vibrer('moyen');
      appliquer(s);
    },
    [appliquer],
  );

  const reglerTauxRejet = useCallback(
    (taux: number) => appliquer(E.reglerTauxRejet(etatRef.current, taux, Date.now())),
    [appliquer],
  );

  const acheterNote = useCallback(
    (id: NoteId) => {
      const s = E.acheterNote(etatRef.current, id, Date.now());
      if (s !== etatRef.current) vibrer('succes');
      appliquer(s);
    },
    [appliquer],
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
      vibrer('succes');
      appliquer({ ...E.signerCerfa(etatRef.current, prenom, maintenant), derniereMaj: maintenant });
    },
    [appliquer],
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
    rejetAcc.current = 0;
    setVerdict(null);
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
        const cout = E.coutAgent(a.id, etat.agents[a.id]);
        return { ...a, possedes: etat.agents[a.id], cout, achetable: etat.budget >= cout };
      }),
    [etat, mods],
  );

  const valeur = useMemo<GameContextType>(
    () => ({
      pret,
      etat,
      mods,
      maintenant,
      enAttente: E.dossiersEnAttente(etat),
      vitesse: E.vitesseCollegues(etat, mods),
      perimetre: E.perimetre(etat, maintenant),
      conformite: E.conformite(etat),
      tete: teteDeFile(etat),
      notes,
      notesNonVues: notes.filter((n) => n.nouvelle).length,
      agents,
      prixRamette: E.prixRamette(mods),
      lettresNonLues: etat.courrier.filter((l) => !l.lue).length,
      verdict,
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
      pret, etat, mods, maintenant, notes, agents, verdict, tamponner, acheterAgent, acheterRamettes,
      reglerTauxRejet, acheterNote, marquerNotesVues, signerCerfa, deposerDemission, marquerLettresLues,
      marquerFinActeVue, marquerFichePoste, nouvellePartie,
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
