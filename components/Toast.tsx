/**
 * Toast Notification Component
 * 
 * Displays ephemeral notifications with slide-in + micro-bounce animations.
 * Used for S.I.C. messages, non-conformity alerts, and Phase 2 notifications.
 * 
 * IMPORTANT: Uses react-native-reanimated v3 for 60fps animations on UI thread.
 */

import React, { useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { ToastMessage } from '@/types/game';
import Colors from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  const translateY = useSharedValue(-100);
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    // Trigger haptic feedback for S.I.C. messages only
    if (toast.type === 'sic') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Phase 1: Slide in from top (200ms)
    translateY.value = withTiming(0, { duration: 200 });
    opacity.value = withTiming(1, { duration: 200 });
    
    // Phase 2: Micro-bounce "stamp" effect (200ms spring)
    scale.value = withSpring(1, {
      mass: 0.8,
      damping: 10,
      stiffness: 100
    });
    
    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      // Slide out animation
      translateY.value = withTiming(-100, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(onDismiss)(toast.id);
        }
      });
      opacity.value = withTiming(0, { duration: 200 });
    }, toast.duration);
    
    return () => {
      clearTimeout(dismissTimer);
    };
  }, [toast.id, toast.duration, toast.type, translateY, scale, opacity, onDismiss]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));
  
  // Style based on toast type
  const getToastStyle = () => {
    switch (toast.type) {
      case 'sic':
        return styles.toastSIC;
      case 'non-conformity':
        return styles.toastNonConformity;
      case 'phase2':
        return styles.toastPhase2;
      case 'system':
      default:
        return styles.toastSystem;
    }
  };
  
  // Type prefix for accessibility (color alone must not be sole indicator — AR-008)
  const getTypePrefix = () => {
    switch (toast.type) {
      case 'sic': return 'S.I.C. — ';
      case 'non-conformity': return '⚠ NON-CONFORMITÉ — ';
      default: return '';
    }
  };

  return (
    <Animated.View
      style={[styles.toastContainer, animatedStyle]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${getTypePrefix()}${toast.text}`}
    >
      <View style={[styles.toast, getToastStyle()]}>
        <Text style={styles.toastText}>{getTypePrefix()}{toast.text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSIC: {
    backgroundColor: Colors.sicBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.resourceTampons,
  },
  toastNonConformity: {
    backgroundColor: Colors.nonConformityBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  toastPhase2: {
    backgroundColor: Colors.phase2Background,
    borderLeftWidth: 4,
    borderLeftColor: Colors.phase2Border,
  },
  toastSystem: {
    backgroundColor: Colors.journalBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.systemBorder,
  },
  toastText: {
    color: Colors.toastText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

