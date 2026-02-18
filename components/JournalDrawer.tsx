/**
 * Journal Modal — full-screen S.I.C. log
 *
 * Slides up from the bottom as a full-screen overlay.
 * Opened from the MenuBottomSheet, not directly from the header.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import JournalEntry from './JournalEntry';
import { JournalEntry as JournalEntryType } from '@/types/game';
import { X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ENTRY_HEIGHT = 88; // 80pt entry + 8pt margin

interface JournalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntryType[];
}

export default function JournalDrawer({ isOpen, onClose, entries }: JournalDrawerProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(0, { mass: 0.9, damping: 18, stiffness: 130 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 260 });
    }
  }, [isOpen, translateY]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  if (!isOpen) return null;

  return (
    <Animated.View style={[styles.modal, modalStyle]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Journal S.I.C.</Text>
            <Text style={styles.subtitle}>Service Inconnu de Coordination</Text>
          </View>
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
            windowSize={10}
            initialNumToRender={25}
            maxToRenderPerBatch={25}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: ENTRY_HEIGHT,
              offset: ENTRY_HEIGHT * index,
              index,
            })}
            scrollEventThrottle={16}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
    zIndex: 1000,
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
  headerLeft: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'ArchivoBlack-Regular',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    letterSpacing: 0.3,
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
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#999999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    textAlign: 'center',
  },
});
