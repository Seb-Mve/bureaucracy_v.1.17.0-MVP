import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Réglages de l'appareil : hors de la partie, ils survivent à « Effacer la partie ». */
const CLE_PREFERENCES = 'bureaucracy_preferences_v1';

export interface Preferences {
  vibrations: boolean;
  animationsReduites: boolean;
}

const DEFAUT: Preferences = { vibrations: true, animationsReduites: false };

interface PreferencesContextType extends Preferences {
  /** Réglage du joueur ou réglage système « Réduire les animations ». */
  reduireMouvement: boolean;
  regler: (p: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export default function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAUT);
  const [systeme, setSysteme] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLE_PREFERENCES)
      .then((brut) => {
        if (!brut) return;
        const lu = JSON.parse(brut) as Partial<Preferences>;
        setPrefs({
          vibrations: typeof lu.vibrations === 'boolean' ? lu.vibrations : DEFAUT.vibrations,
          animationsReduites: typeof lu.animationsReduites === 'boolean' ? lu.animationsReduites : DEFAUT.animationsReduites,
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSysteme)
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSysteme);
    return () => sub.remove();
  }, []);

  const regler = useCallback((p: Partial<Preferences>) => {
    setPrefs((avant) => {
      const apres = { ...avant, ...p };
      AsyncStorage.setItem(CLE_PREFERENCES, JSON.stringify(apres)).catch(() => undefined);
      return apres;
    });
  }, []);

  const valeur = useMemo<PreferencesContextType>(
    () => ({ ...prefs, reduireMouvement: prefs.animationsReduites || systeme, regler }),
    [prefs, systeme, regler],
  );

  return <PreferencesContext.Provider value={valeur}>{children}</PreferencesContext.Provider>;
}

/** Réglages de confort du joueur (vibrations, animations). */
export function usePreferences(): PreferencesContextType {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences doit être utilisé dans PreferencesProvider');
  return ctx;
}
