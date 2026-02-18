/**
 * Menu Side Drawer
 *
 * Left-side drawer that slides in from the left, opened by the ☰ burger button.
 * Acts as the main menu layer — each item navigates to its own screen/modal.
 * New items can be added here without touching the journal or other features.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(300, SCREEN_WIDTH * 0.78);

export default function MenuBottomSheet({ isOpen, onClose, items }: MenuBottomSheetProps) {
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      overlayOpacity.value = withTiming(1, { duration: 250 });
      translateX.value = withSpring(0, { mass: 0.8, damping: 16, stiffness: 140 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 220 });
    }
  }, [isOpen, translateX, overlayOpacity]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
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

      {/* Left side drawer */}
      <Animated.View style={[styles.drawer, drawerStyle]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'bottom']}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Menu</Text>
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
                  setTimeout(item.onPress, 200);
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
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.background,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  safeArea: {
    flex: 1,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 20,
    color: Colors.title,
    letterSpacing: 0.5,
  },
  itemList: {
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 64,
    backgroundColor: Colors.background,
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
    marginRight: 14,
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  itemDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
});
