/**
 * Toast Container Component
 * 
 * Renders all active toast notifications in a stacked layout.
 * Max 3 toasts displayed simultaneously.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Toast from './Toast';
import { useGameState } from '@/context/GameStateContext';

export default function ToastContainer() {
  const { toastQueue, dismissToast } = useGameState();
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      {toastQueue.map((toast, index) => (
        <View
          key={toast.id}
          style={[styles.toastWrapper, { top: 20 + index * 10 }]}
        >
          <Toast toast={toast} onDismiss={dismissToast} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
