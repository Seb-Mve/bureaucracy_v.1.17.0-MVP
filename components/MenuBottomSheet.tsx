/**
 * Menu Bottom Sheet
 *
 * Mobile-native bottom sheet that slides up from screen bottom.
 * Acts as the main menu layer — each item navigates to its own screen/modal.
 * New items can be added here without touching the journal or other features.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress: () => void;
}

interface MenuBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
}

const SHEET_HEIGHT = 320;

export default function MenuBottomSheet({ isOpen, onClose, items }: MenuBottomSheetProps) {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      overlayOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { mass: 0.8, damping: 14, stiffness: 120 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 220 });
    }
  }, [isOpen, translateY, overlayOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!isOpen) return null;

  return (
    <>
      {/* Tap-to-close overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="auto">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer le menu"
        />
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Menu items */}
          <View style={styles.itemList}>
            {items.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.item,
                  index < items.length - 1 && styles.itemBorder,
                  pressed && styles.itemPressed,
                ]}
                onPress={() => {
                  onClose();
                  // Small delay so the sheet closes before the next modal opens
                  setTimeout(item.onPress, 180);
                }}
                accessibilityRole="menuitem"
                accessibilityLabel={item.label}
              >
                <View style={styles.itemIcon}>{item.icon}</View>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  {item.description && (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 998,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  safeArea: {
    paddingBottom: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  itemList: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 64,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemPressed: {
    backgroundColor: Colors.border,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.sicBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  itemDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  itemText: {
    flex: 1,
  },
});
