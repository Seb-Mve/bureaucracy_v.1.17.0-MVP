# Quickstart — Modale de Réaffectation Différée

**Feature**: `004-reaffectation-modal`
**Fichiers modifiés** : `data/conformiteLogic.ts`, `context/GameStateContext.tsx`, `components/ConformiteDisplay.tsx`
**Fichier créé** : `components/ReaffectationModal.tsx`

---

## Étape 1 — Ajouter les fonctions pures dans `conformiteLogic.ts`

Ajouter à la fin du fichier (avant la dernière accolade si applicable) :

```typescript
/**
 * Génère un seuil de réinitialisation aléatoire pour le refus de réaffectation.
 * @returns Entier aléatoire dans [23, 65]
 */
export function getReaffectationResetPercentage(): number {
  return Math.floor(Math.random() * 43) + 23;
}

/**
 * Calcule accumulatedFormulaires pour un pourcentage cible donné.
 * Résultat = somme des coûts de 0 % à targetPct−1 % (le joueur repart du début du Nème pourcent).
 * @param targetPct - Pourcentage cible (0-100)
 * @returns Total de formulaires accumulés correspondant
 */
export function getAccumulatedFormulairesForPercentage(targetPct: number): number {
  let accumulated = 0;
  for (let p = 0; p < targetPct; p++) {
    accumulated += getFormulairesRequiredForNextPercent(p);
  }
  return accumulated;
}
```

---

## Étape 2 — Ajouter `refuseReaffectation` dans `GameStateContext.tsx`

### 2a — Import

Ajouter aux imports de `conformiteLogic` :

```typescript
getReaffectationResetPercentage,
getAccumulatedFormulairesForPercentage,
```

### 2b — Interface `GameContextType`

Ajouter dans la section `// Conformité system methods` :

```typescript
/** Refuse la réaffectation : réinitialise la conformité à [23,65] et retourne le nouveau %. */
refuseReaffectation: () => number;
```

### 2c — Implémentation (après `activateConformite`)

```typescript
const refuseReaffectation = useCallback((): number => {
  const newPct = getReaffectationResetPercentage();
  const newAccumulated = getAccumulatedFormulairesForPercentage(newPct);
  setGameState(prev => ({
    ...prev,
    conformite: prev.conformite ? {
      ...prev.conformite,
      percentage: newPct,
      accumulatedFormulaires: newAccumulated,
    } : prev.conformite,
  }));
  return newPct;
}, []);
```

### 2d — Provider value

Ajouter `refuseReaffectation,` dans l'objet passé à `GameContext.Provider`.

---

## Étape 3 — Créer `components/ReaffectationModal.tsx`

Créer le fichier avec ce contenu :

```tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface ReaffectationModalProps {
  visible: boolean;
  onAccept: () => void;
  onRefuse: () => void;
}

export default function ReaffectationModal({ visible, onAccept, onRefuse }: ReaffectationModalProps) {
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    if (!visible) setShowComingSoon(false);
  }, [visible]);

  const handleAccept = () => {
    setShowComingSoon(true);
  };

  const handleClose = () => {
    onAccept();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent={true}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {!showComingSoon ? (
            <>
              <Text style={styles.title} accessibilityRole="header">
                Alerte
              </Text>
              <Text style={styles.body}>
                Le volume de dossiers locaux a atteint le seuil de compression critique.
                L'espace de stockage physique est saturé. Pour continuer à exister
                administrativement, votre dossier personnel doit être délocalisé vers
                l'échelon Départemental.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.buttonAccept, pressed && styles.buttonPressed]}
                onPress={handleAccept}
                accessibilityLabel="Accepter la migration — Transférer mon matricule et mes dossiers"
                accessibilityRole="button"
              >
                <Text style={styles.buttonAcceptText}>ACCEPTER LA MIGRATION</Text>
                <Text style={styles.buttonSubtitle}>Transférer mon matricule et mes dossiers.</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.buttonRefuse, pressed && styles.buttonPressed]}
                onPress={onRefuse}
                accessibilityLabel="Refuser la migration — Rester ici, l'excès de dossiers sera pilonné"
                accessibilityRole="button"
              >
                <Text style={styles.buttonRefuseText}>REFUSER</Text>
                <Text style={styles.buttonSubtitleDanger}>
                  Rester ici (Attention : l'excès de dossiers sera pilonné pour libérer de l'espace).
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>À venir</Text>
              <Text style={styles.body}>Fonctionnalité à venir.</Text>
              <Pressable
                style={({ pressed }) => [styles.buttonAccept, pressed && styles.buttonPressed]}
                onPress={handleClose}
                accessibilityLabel="Fermer"
                accessibilityRole="button"
              >
                <Text style={styles.buttonAcceptText}>Fermer</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#555',
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#E74C3C',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonAccept: {
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 12,
  },
  buttonRefuse: {
    backgroundColor: '#3A3A3A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E74C3C',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 44,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonAcceptText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonRefuseText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#E74C3C',
    letterSpacing: 0.5,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonSubtitleDanger: {
    fontSize: 12,
    color: 'rgba(231,76,60,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
});
```

---

## Étape 4 — Modifier `components/ConformiteDisplay.tsx`

### 4a — Imports à ajouter

```typescript
// Ajouter useRef, useEffect à l'import React existant
import React, { useRef, useEffect, useState } from 'react';
// Ajouter Animated à l'import react-native existant
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
// Ajouter le nouveau composant
import ReaffectationModal from './ReaffectationModal';
```

### 4b — Ajouter `refuseReaffectation` au destructuring du contexte

```typescript
const {
  gameState,
  shouldShowConformite,
  canActivateConformite,
  activateConformite,
  isPhase2ButtonActive,
  conformiteDisplayPercentage,
  refuseReaffectation,        // ← ajouter
} = useGameState();
```

### 4c — Ajouter après les variables existantes (`isActivated`, `percentageInt`, `percentageDisplay`)

```typescript
const [modalVisible, setModalVisible] = useState(false);
const animatedBarWidth = useRef(new Animated.Value(0)).current;
const isAnimatingRef = useRef(false);

useEffect(() => {
  if (!isAnimatingRef.current) {
    animatedBarWidth.setValue(conformiteDisplayPercentage);
  }
}, [conformiteDisplayPercentage]);

const handleRefuse = () => {
  setModalVisible(false);
  const newPct = refuseReaffectation();
  isAnimatingRef.current = true;
  animatedBarWidth.setValue(100);
  Animated.timing(animatedBarWidth, {
    toValue: newPct,
    duration: 300,
    useNativeDriver: false,
  }).start(() => { isAnimatingRef.current = false; });
};

const handleAccept = () => {
  setModalVisible(false);
};
```

### 4d — Remplacer la barre de progression

```tsx
// Avant :
<View
  style={[
    styles.progressBarFill,
    { width: `${conformiteDisplayPercentage}%` }
  ]}
/>
// Après :
<Animated.View
  style={[
    styles.progressBarFill,
    {
      width: animatedBarWidth.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
      }),
    },
  ]}
/>
```

### 4e — Remplacer le handler du CTA Réaffectation

```tsx
// Avant :
onPress={() => {
  // Réaffectation différée — prestige mechanic, not yet implemented
}}
// Après :
onPress={() => setModalVisible(true)}
```

### 4f — Ajouter la modale dans le JSX (avant la fermeture de `</View>`)

```tsx
<ReaffectationModal
  visible={modalVisible}
  onAccept={handleAccept}
  onRefuse={handleRefuse}
/>
```

---

## Étape 5 — Lint

```bash
npm run lint
```

Aucune nouvelle erreur attendue.

---

## Validation manuelle

1. Atteindre 100 % de conformité (ou forcer l'état en dev)
2. Taper « Réaffectation différée » → modale s'ouvre avec le message et les deux boutons
3. Tenter de fermer sans choisir (tap hors modale, bouton retour Android) → modale reste ouverte
4. Taper [ACCEPTER LA MIGRATION] → vue « Fonctionnalité à venir » + bouton Fermer
5. Fermer → conformité reste à 100 %, CTA toujours visible
6. Retaper CTA → modale complète réapparaît (pas directement le « Coming soon »)
7. Taper [REFUSER] → modale se ferme, barre animate en descente ~300 ms vers [23–65] %
8. Vérifier que la progression passive reprend normalement
9. Attendre à nouveau 100 % → modale réapparaît (cycle illimité)
