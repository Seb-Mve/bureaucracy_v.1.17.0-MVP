import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { AgentId, GameState, Lettre, Modifiers, NoteId } from '@/types/game';
import type { ActionAtelier, Agent2Id, Exemplaires, Note2Id } from '@/types/acte2';
import { AGENTS, BALANCE, GRADES, type AgentDef, type GradeDef } from '@/constants/balance';
import * as E from '@/data/engine';
import { NOTES_PAR_ID } from '@/data/notes';
import { nouvellesLettres, lettreAbsence } from '@/data/courrier';
import { teteDeFile, type UsagerAffiche } from '@/data/usagers';
import { CLE_SAUVEGARDE, estSauvegardeValide, normaliserSauvegarde } from '@/data/save';
import { usePreferences } from '@/context/PreferencesContext';
import * as D from '@/data/acte2/moteur';
import * as V from '@/data/acte2/vues';
import * as A from '@/data/acte2/vueAtelier';
import { lettreAbsence2 } from '@/data/acte2/courrier2';
import { Encres, type Encre } from '@/constants/Colors';

export type { UsagerAffiche };
export type { ActionAtelier, Agent2Id, EtapeType, Exemplaires, ProcId } from '@/types/acte2';
export type { EtapeChaine, ParapheurAffiche, UniteAffichee, VueDirection, VueService2 } from '@/data/acte2/vues';
export type { ChoixEtape, EffetAffiche, EtapeAtelier, ProcAtelier, VueAtelier } from '@/data/acte2/vueAtelier';
export type { Encre };

const INTERVALLE = 100;
/** Au-delà de cet écart entre deux ticks, on considère une absence (onglet en veille). */
const SEUIL_ABSENCE = 30_000;
/** Délai maximal entre une modification de l'état et son écriture sur le disque (ms). */
const DELAI_SAUVEGARDE = 1000;
/** Plafond d'un achat « Max » de collègues, par sécurité. */
const ACHAT_MAX = V.ACHAT_MAX;
/** Une absence plus courte (simple rechargement) est rattrapée sans lettre du S.I.C. (s). */
const ABSENCE_LETTRE_S = 300;

export type StatutNote = 'disponible' | 'tropCher' | 'instruction' | 'effective';

/** Note de service affichée : même carte à l'acte I et à l'acte II. */
export interface NoteAffichee {
  id: NoteId | Note2Id;
  numero: number;
  titre: string;
  texte: string;
  effet: string;
  cout: number;
  /** Délai d'instruction (s). */
  instruction: number;
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
  /** Formulaires insuffisants pour le prochain coup (pièces exigées à l'acte I, exemplaires à l'acte II). */
  rupture: boolean;
  /** Taux de rejet de l'acte en cours, son plafond, et s'il est réglable. */
  rejet: { taux: number; max: number; visible: boolean };
  /** Encre de l'acte en cours (orange à l'acte I, bleu à l'acte II). */
  encre: Encre;
  /** Écran Direction (acte II) ; null à l'acte I. */
  direction: V.VueDirection | null;
  /** Onglet Service de l'acte II ; null à l'acte I. */
  service2: V.VueService2 | null;
  /** Atelier des procédures ; null tant qu'il est fermé (et à l'acte I). */
  atelier: A.VueAtelier | null;
  /** Une ramette gratuite quand la rupture bloquerait le guichet faute de budget. */
  demanderRequisition: () => void;
  /** Un coup de tampon : un dossier à l'acte I, un visa à l'acte II. */
  tamponner: () => { rupture: boolean };
  /** Recrute `nb` collègues d'affilée (autant que le budget le permet). */
  acheterAgent: (id: AgentId, nb?: number) => void;
  acheterRamettes: (nb: number) => void;
  reglerTauxRejet: (taux: number) => void;
  acheterNote: (id: NoteId | Note2Id) => void;
  /** Acte II : achète `nb` guichets d'affilée (autant que le budget le permet). */
  acheterGuichet: (nb?: number) => void;
  /** Acte II : recrute `nb` agents d'affilée (autant que le budget le permet). */
  acheterAgent2: (id: Agent2Id, nb?: number) => void;
  reglerExemplaires: (n: Exemplaires) => void;
  /** Acte II : modification d'une procédure dans l'Atelier (sans effet si elle est refusée). */
  modifierProcedure: (action: ActionAtelier) => void;
  /** Fin de l'acte I : prise de fonctions à la Direction. */
  entrerDirection: () => void;
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
  if (s.acte === 2) {
    // Acte II : Guichets et agents seuls ; jamais le moteur de l'acte I.
    const r2 = D.simulerAbsence2(s, maintenant);
    if (r2.secondes < ABSENCE_LETTRE_S || r2.franchies < 1) return r2.s;
    return { ...r2.s, courrier: [lettreAbsence2(r2.secondes, r2.franchies, r2.budget, maintenant), ...r2.s.courrier] };
  }
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
      } else if (s0.acte === 2) {
        // Acte II : le moteur de la Direction, jamais celui du guichet.
        s1 = D.tick2(s0, Math.max(0, ecart) / 1000, maintenant).s;
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

  const tamponner = useCallback((): { rupture: boolean } => {
    if (etatRef.current.acte === 2) {
      // Acte II : le coup vise un parapheur ; la scène et les compteurs réagissent au même verdict qu'à l'acte I.
      const r2 = D.tamponner2(etatRef.current, Date.now());
      if (r2.ev.visas > 0) {
        verdictId.current += 1;
        setVerdict({ id: verdictId.current, rejete: false, abandon: false, usager: null });
        vibrerSi('leger');
      }
      appliquer(r2.s);
      return { rupture: r2.ev.rupture };
    }
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

  /** Répète un achat `nb` fois tant qu'il aboutit (plafonné à ACHAT_MAX). */
  const acheterEnLot = useCallback(
    (acheter: (s: GameState, maintenant: number) => GameState, nb: number) => {
      const maintenant = Date.now();
      let s = etatRef.current;
      for (let i = 0; i < Math.min(nb, ACHAT_MAX); i++) {
        const suivant = acheter(s, maintenant);
        if (suivant === s) break;
        s = suivant;
      }
      if (s !== etatRef.current) vibrerSi('moyen');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );

  const acheterGuichet = useCallback((nb = 1) => acheterEnLot(D.acheterGuichet, nb), [acheterEnLot]);

  const acheterAgent2 = useCallback(
    (id: Agent2Id, nb = 1) => acheterEnLot((s, t) => D.acheterAgent2(s, id, t), nb),
    [acheterEnLot],
  );

  const acheterRamettes = useCallback(
    (nb: number) => {
      const s0 = etatRef.current;
      const s = s0.acte === 2 ? D.acheterRamettes2(s0, nb) : E.acheterRamettes(s0, nb, Date.now());
      if (s !== etatRef.current) vibrerSi('moyen');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );

  const demanderRequisition = useCallback(() => {
    const s0 = etatRef.current;
    const s = s0.acte === 2 ? D.requisitionUrgence2(s0) : E.requisitionUrgence(s0, Date.now());
    if (s !== etatRef.current) vibrerSi('moyen');
    appliquer(s);
  }, [appliquer, vibrerSi]);

  const reglerTauxRejet = useCallback(
    (taux: number) => {
      const s0 = etatRef.current;
      const t = Date.now();
      appliquer(s0.acte === 2 ? D.reglerTauxRejet2(s0, taux, t) : E.reglerTauxRejet(s0, taux, t));
    },
    [appliquer],
  );

  const reglerExemplaires = useCallback(
    (n: Exemplaires) => appliquer(D.reglerExemplaires(etatRef.current, n, Date.now())),
    [appliquer],
  );

  const modifierProcedure = useCallback(
    (action: ActionAtelier) => {
      const s = D.modifierProcedure(etatRef.current, action, Date.now());
      if (s === etatRef.current) return;
      vibrerSi('leger');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );

  const acheterNote = useCallback(
    (id: NoteId | Note2Id) => {
      const s0 = etatRef.current;
      const t = Date.now();
      let s = s0;
      if (s0.acte === 2 && V.estNote2(id)) s = D.acheterNote2(s0, id, t);
      else if (s0.acte === 1 && !V.estNote2(id)) s = E.acheterNote(s0, id, t);
      if (s !== etatRef.current) vibrerSi('succes');
      appliquer(s);
    },
    [appliquer, vibrerSi],
  );

  const marquerNotesVues = useCallback(() => {
    const s = etatRef.current;
    if (s.acte === 2) {
      const s2 = D.marquerNotesVues2(s);
      if (s2 !== s) appliquer(s2);
      return;
    }
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

  const marquerFinActeVue = useCallback(() => {
    const s = etatRef.current;
    appliquer(s.acte === 2 ? D.marquerFinActeVue2(s) : { ...s, finActeVue: true });
  }, [appliquer]);

  const entrerDirection = useCallback(() => {
    const s = etatRef.current;
    if (s.acte === 2 || !s.acteTermine) return;
    satureRef.current = false;
    setVerdict(null);
    setAbandonsFile(0);
    abandonsEnCours.current = 0;
    vibrerSi('succes');
    appliquer(D.entrerActe2({ ...s, finActeVue: true }, Date.now()));
  }, [appliquer, vibrerSi]);

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
      etat.acte === 2 ? V.notesAffichees2(etat, maintenant) : E.notesVisibles(etat).map((id) => {
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

  const direction = useMemo(() => V.vueDirection(etat, maintenant), [etat, maintenant]);
  const service2 = useMemo(() => V.vueService2(etat, maintenant), [etat, maintenant]);
  const atelier = useMemo(() => A.vueAtelier(etat, maintenant), [etat, maintenant]);
  const rejet = useMemo(
    () =>
      direction
        ? { taux: direction.tauxRejet, max: direction.rejetMax, visible: true }
        : { taux: Math.min(etat.tauxRejet, mods.rejetMax), max: mods.rejetMax, visible: mods.rejetVisible },
    [direction, etat.tauxRejet, mods],
  );
  const prixRamette = etat.acte === 2 ? BALANCE.prixRamette : E.prixRamette(mods);
  const rupture = direction ? direction.rupture : etat.formulaires < mods.pieces;

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
      tete: etat.acte === 1 ? teteDeFile(etat) : [],
      notes,
      notesNonVues: notes.filter((n) => n.nouvelle).length,
      agents,
      prixRamette,
      maxRamettes: Math.floor(etat.budget / prixRamette),
      lettresNonLues: etat.courrier.filter((l) => !l.lue).length,
      verdict,
      abandonsFile,
      // Seulement quand les collègues butent sur la demande : une file vidée par les taps du joueur ne compte pas.
      demandeLimitante: sature,
      rupture,
      rejet,
      encre: Encres[etat.acte],
      direction,
      service2,
      atelier,
      demanderRequisition,
      tamponner,
      acheterAgent,
      acheterRamettes,
      reglerTauxRejet,
      acheterNote,
      acheterGuichet,
      acheterAgent2,
      reglerExemplaires,
      modifierProcedure,
      entrerDirection,
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
      nouvellePartie, rupture, rejet, prixRamette, direction, service2, atelier, acheterGuichet, acheterAgent2,
      reglerExemplaires, modifierProcedure, entrerDirection,
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
