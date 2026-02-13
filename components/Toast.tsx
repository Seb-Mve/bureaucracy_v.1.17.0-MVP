/**
 * Toast Notification Component
 * 
 * Displays ephemeral notifications with slide-in/fade-out animations.
 * Used for S.I.C. messages, non-conformity alerts, and Phase 2 notifications.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Text, Pressable, StyleSheet, View } from 'react-native';
import { ToastMessage } from '@/types/game';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Slide-in and fade-in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true, // GPU acceleration for 60fps
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto-dismiss animation
    const dismissTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(toast.id);
      });
    }, toast.duration - 250); // Start exit animation 250ms before duration ends
    
    return () => {
      clearTimeout(dismissTimer);
    };
  }, [toast.id, toast.duration, slideAnim, opacityAnim, onDismiss]);
  
  const handlePress = () => {
    // Manual dismiss
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };
  
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
  
  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={toast.text}
    >
      <Pressable
        onPress={handlePress}
        style={[styles.toast, getToastStyle()]}
        accessibilityRole="button"
        accessibilityHint="Appuyez pour fermer cette notification"
      >
        <Text style={styles.toastText}>{toast.text}</Text>
      </Pressable>
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
    backgroundColor: '#2C3E50',
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  toastNonConformity: {
    backgroundColor: '#3D2C2C',
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  toastPhase2: {
    backgroundColor: '#2C3E2C',
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
  },
  toastSystem: {
    backgroundColor: '#2C2C2C',
    borderLeftWidth: 4,
    borderLeftColor: '#95A5A6',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
