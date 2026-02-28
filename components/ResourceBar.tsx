import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { File, Stamp, ClipboardList } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';

interface ResourceBarProps {
  dossierTapSignal?: number;
}

export default function ResourceBar({ dossierTapSignal }: ResourceBarProps) {
  const { gameState, formatNumber, isStorageBlocked } = useGameState();

  // Shared value for blinking animation (formulaires storage blocked)
  const opacity = useSharedValue(1);

  // Pulse icônes — T007 (dossiers tap) + T014 (tampons, formulaires, auto-prod)
  const dossierScale = useSharedValue(1);
  const tamponsScale = useSharedValue(1);
  const formulairesScale = useSharedValue(1);

  // Throttle auto-production : max 1 pulse/s par icône (PR-004)
  const lastPulseRef = useRef({ dossiers: 0, tampons: 0, formulaires: 0 });

  // Refs pour détecter les incréments de production automatique (T015)
  const prevDossiers = useRef<number | null>(null);
  const prevTampons = useRef<number | null>(null);
  const prevFormulaires = useRef<number | null>(null);

  // Animated styles icônes
  const dossierIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dossierScale.value }],
  }));
  const tamponsIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tamponsScale.value }],
  }));
  const formulairesIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: formulairesScale.value }],
  }));

  // Fonction unifiée de pulse (T014)
  const triggerPulse = useCallback(
    (r: 'dossiers' | 'tampons' | 'formulaires', throttle: boolean) => {
      if (r === 'formulaires' && isStorageBlocked) return; // FR-008: pas d'empilement blink
      if (throttle) {
        const now = Date.now();
        if (now - lastPulseRef.current[r] < 1000) return;
        lastPulseRef.current[r] = now;
      }
      const sv = r === 'dossiers' ? dossierScale : r === 'tampons' ? tamponsScale : formulairesScale;
      sv.value = withSequence(
        withSpring(1.25, { damping: 10, stiffness: 200 }),
        withSpring(1.0, { damping: 12, stiffness: 200 })
      );
    },
    [isStorageBlocked, dossierScale, tamponsScale, formulairesScale]
  );

  // T007 — Pulse icône dossiers sur tap Tamponner (non-throttlé)
  useEffect(() => {
    if (dossierTapSignal !== undefined && dossierTapSignal > 0) {
      dossierScale.value = withSequence(
        withSpring(1.25, { damping: 10, stiffness: 200 }),
        withSpring(1.0, { damping: 12, stiffness: 200 })
      );
    }
  }, [dossierTapSignal, dossierScale]);

  // T015 — Pulse icônes sur production automatique (throttlé 1/s par icône)
  useEffect(() => {
    if (!gameState?.resources) return;
    const curr = gameState.resources;

    if (prevDossiers.current !== null && curr.dossiers > prevDossiers.current) {
      triggerPulse('dossiers', true);
    }
    if (prevTampons.current !== null && curr.tampons > prevTampons.current) {
      triggerPulse('tampons', true);
    }
    if (prevFormulaires.current !== null && curr.formulaires > prevFormulaires.current) {
      triggerPulse('formulaires', true);
    }

    prevDossiers.current = curr.dossiers;
    prevTampons.current = curr.tampons;
    prevFormulaires.current = curr.formulaires;
  }, [gameState?.resources, triggerPulse]);

  // Animation effect for storage blocking
  useEffect(() => {
    if (isStorageBlocked) {
      // Start blinking at ~2Hz (500ms total: 250ms fade out + 250ms fade in)
      opacity.value = withRepeat(
        withTiming(0, { duration: 250 }),
        -1, // infinite loop
        true // reverse (fade in after fade out)
      );
    } else {
      // Stop blinking immediately
      opacity.value = withTiming(1, { duration: 0 });
    }
  }, [isStorageBlocked, opacity]);

  // Animated style for formulaires
  const animatedFormulairesStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  // Early return with loading state if gameState is not initialized
  if (!gameState || !gameState.resources || !gameState.production) {
    return (
      <View style={styles.container}>
        <Text>Loading resources...</Text>
      </View>
    );
  }

  const { resources, production } = gameState;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={
        isStorageBlocked
          ? `Ressources. Dossiers: ${formatNumber(resources.dossiers)}, production ${formatNumber(production.dossiers)} par seconde. Tampons: ${formatNumber(resources.tampons)}, production ${formatNumber(production.tampons)} par seconde. Formulaires: ${formatNumber(resources.formulaires)}, BLOQUÉ à ${gameState.currentStorageCap}, capacité maximale atteinte.`
          : `Ressources. Dossiers: ${formatNumber(resources.dossiers)}, production ${formatNumber(production.dossiers)} par seconde. Tampons: ${formatNumber(resources.tampons)}, production ${formatNumber(production.tampons)} par seconde. Formulaires: ${formatNumber(resources.formulaires)}, production ${formatNumber(production.formulaires)} par seconde.`
      }
      accessibilityRole="summary"
    >
      <View style={styles.resourceItem}>
        <Animated.View style={dossierIconStyle}>
          <File color={Colors.resourceDossiers} size={18} />
        </Animated.View>
        <View style={styles.resourceValues}>
          <Text style={styles.resourceValue}>{formatNumber(resources.dossiers)}</Text>
          <Text style={styles.resourceProduction}>
            +{formatNumber(production.dossiers)}/s
          </Text>
        </View>
      </View>

      <View style={styles.resourceItem}>
        <Animated.View style={tamponsIconStyle}>
          <Stamp color={Colors.resourceTampons} size={18} />
        </Animated.View>
        <View style={styles.resourceValues}>
          <Text style={styles.resourceValue}>{formatNumber(resources.tampons)}</Text>
          <Text style={styles.resourceProduction}>
            +{formatNumber(production.tampons)}/s
          </Text>
        </View>
      </View>

      <View style={styles.resourceItem}>
        <Animated.View style={formulairesIconStyle}>
          <ClipboardList
            color={isStorageBlocked ? Colors.storageCapped : Colors.resourceFormulaires}
            size={18}
          />
        </Animated.View>
        <Animated.View style={[styles.resourceValues, animatedFormulairesStyle]}>
          <Text
            style={[
              styles.resourceValue,
              isStorageBlocked && { color: Colors.storageCapped }
            ]}
          >
            {formatNumber(resources.formulaires)}
          </Text>
          <Text style={styles.resourceProduction}>
            +{formatNumber(production.formulaires)}/s
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resourceItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
    flex: 1,
  },
  resourceValues: {
    alignItems: 'center',
    marginTop: 4,
  },
  resourceValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.text,
  },
  resourceProduction: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
    flexShrink: 1,
  },
});
