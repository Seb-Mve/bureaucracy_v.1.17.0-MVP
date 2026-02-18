/**
 * Journal Drawer Component
 * 
 * Full-height drawer that slides from right with S.I.C. journal entries.
 * Uses FlatList virtualization for smooth performance with 500+ entries.
 * Displays entries in reverse chronological order (newest first).
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import JournalEntry from './JournalEntry';
import { JournalEntry as JournalEntryType } from '@/types/game';
import { X } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(400, width * 0.85);
const ENTRY_HEIGHT = 88; // 80pt entry + 8pt margin

interface JournalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntryType[];
}

export default function JournalDrawer({ isOpen, onClose, entries }: JournalDrawerProps) {
  const translateX = useSharedValue(DRAWER_WIDTH);
  const overlayOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (isOpen) {
      // Slide in from right
      translateX.value = withTiming(0, { duration: 300 });
      overlayOpacity.value = withTiming(0.5, { duration: 300 });
    } else {
      // Slide out to right
      translateX.value = withTiming(DRAWER_WIDTH, { duration: 300 });
      overlayOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen, translateX, overlayOpacity]);
  
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));
  
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value
  }));
  
  // Sort entries by timestamp descending (newest first)
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <>
      {/* Semi-transparent overlay */}
      <Animated.View
        style={[styles.overlay, overlayStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer le journal"
          accessibilityHint="Appuyez pour fermer le panneau du journal"
        />
      </Animated.View>
      
      {/* Drawer panel */}
      <Animated.View
        style={[styles.drawer, drawerStyle]}
        accessibilityRole="menu"
        accessibilityLabel="Journal S.I.C."
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Journal S.I.C.</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fermer le journal"
            >
              <X size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          
          {/* Entry list */}
          {sortedEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune entrée pour le moment</Text>
              <Text style={styles.emptySubtext}>
                Les messages S.I.C. apparaîtraient ici au fil de votre progression.
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedEntries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <JournalEntry entry={item} />}
              
              // Virtualization props for performance with 500 items
              windowSize={10}
              initialNumToRender={25}
              maxToRenderPerBatch={25}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={true}
              
              // Fixed-height optimization (instant offset calculation)
              getItemLayout={(data, index) => ({
                length: ENTRY_HEIGHT,
                offset: ENTRY_HEIGHT * index,
                index,
              })}
              
              // Scroll performance
              scrollEventThrottle={16}
              
              contentContainerStyle={styles.listContent}
            />
          )}
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#1a1a1a',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#999999',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
