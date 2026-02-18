# Component Contracts: Système de Messages S.I.C.

**Purpose**: Define component interfaces and responsibilities for the S.I.C. message system  
**Audience**: Frontend developers implementing UI components  
**Status**: Complete

---

## Overview

This document specifies the **TypeScript interfaces and behavior contracts** for all UI components in the S.I.C. message system. No external APIs are involved (all data is local to GameState).

---

## 1. JournalDrawer

**File**: `components/JournalDrawer.tsx`

### Interface

```typescript
interface JournalDrawerProps {
  /** Whether drawer is open/visible */
  isOpen: boolean;
  
  /** Callback fired when user closes drawer (tap overlay or close button) */
  onClose: () => void;
  
  /** Journal entries to display (sorted newest-first by caller) */
  entries: JournalEntry[];
}

export default function JournalDrawer(props: JournalDrawerProps): JSX.Element;
```

### Responsibilities

1. **Slide animation from right** (~300ms duration)
   - Uses `react-native-reanimated` v3 (`useSharedValue`, `useAnimatedStyle`, `withTiming`)
   - Starting position: `translateX: 400` (off-screen right)
   - End position: `translateX: 0` (fully visible)
   - Synchronized overlay fade-in/out

2. **Full-height drawer** (from safe area top to bottom)
   - Width: 320pt (configurable via style constant)
   - Background: `#f9edcd` (matches app theme)
   - Shadow: `shadowOpacity: 0.3, shadowRadius: 12` (depth effect)

3. **Overlay dismiss**
   - Semi-transparent overlay (`backgroundColor: 'rgba(0,0,0,0.5)'`)
   - `onPress` triggers `onClose()` callback
   - `pointerEvents="box-none"` to allow interaction with drawer content

4. **FlatList with virtualization** (see optimization contracts below)
   - Renders `JournalEntry` items
   - Reverse chronological order (newest at top)
   - Empty state: "Aucune entrée pour le moment" (French)

5. **Accessibility**
   - Drawer has `accessibilityRole="menu"`
   - Overlay has `accessibilityLabel="Fermer le journal S.I.C."`
   - Supports swipe-to-dismiss (optional enhancement)

### Behavior Contracts

| Event | Expected Behavior |
|-------|-------------------|
| `isOpen={true}` | Drawer slides in from right (300ms), overlay fades in |
| `isOpen={false}` | Drawer slides out to right (300ms), overlay fades out |
| Tap overlay | Calls `onClose()`, does not prevent event propagation |
| Tap inside drawer | Does not trigger `onClose()` |
| Scroll FlatList | Smooth 60fps scrolling (see optimization requirements) |
| Empty `entries` array | Shows empty state message centered in drawer |

### Performance Requirements

- **Animation FPS**: 58-60fps minimum (use Perf Monitor to verify)
- **Initial render time**: <200ms to first visible entry
- **Memory footprint**: <5MB for 500 entries (with virtualization)
- **FlatList scroll**: No frame drops during fast scroll

### Style Constants

```typescript
const DRAWER_WIDTH = 320;
const ANIMATION_DURATION = 300;
const OVERLAY_OPACITY = 0.5;
const DRAWER_BG_COLOR = '#f9edcd';
const DRAWER_SHADOW_OPACITY = 0.3;
```

---

## 2. JournalEntry

**File**: `components/JournalEntry.tsx`

### Interface

```typescript
interface JournalEntryProps {
  /** Journal entry data to display */
  entry: JournalEntry;
}

export const JournalEntry = React.memo(
  (props: JournalEntryProps): JSX.Element
);
```

### Responsibilities

1. **Display entry metadata**
   - Type indicator icon (left side):
     - `type='sic'`: Blue dot or S.I.C. icon
     - `type='non-conformity'`: Red warning triangle
     - `type='narrative-hint'`: Gold/purple star or lock icon (changes when revealed)
   - Timestamp (top-right): Formatted via `formatTimestampFrench()`

2. **Display message text**
   - For `type='sic'` or `type='non-conformity'`: Display `entry.text` as-is
   - For `type='narrative-hint'`:
     - If `isRevealed=false`: Display redacted `text` (with `█` blocks)
     - If `isRevealed=true`: Display full `revealedText` (or updated `text`)

3. **Fixed height enforcement**
   - Container `minHeight: 80, maxHeight: 80` (for FlatList `getItemLayout`)
   - Text truncation: `numberOfLines={3}` with `ellipsizeMode="tail"`
   - Overflow: Hidden (no scroll inside entry)

4. **Styling by type**
   - `type='sic'`: Blue accent color (`#3498DB`)
   - `type='non-conformity'`: Red accent color (`#E74C3C`)
   - `type='narrative-hint'` (unrevealed): Gold/purple accent (`#9B59B6` or `#F39C12`)
   - `type='narrative-hint'` (revealed): Green accent (`#27AE60`)

5. **Accessibility**
   - `accessibilityRole="text"`
   - `accessibilityLabel`: Combines type, timestamp, and text
     - Example: `"Message S.I.C., Il y a 2 minutes, Ce dossier a été transféré..."`
   - Redacted text: `"Information classifiée, non révélée"` for screen readers

### Behavior Contracts

| Entry State | Visual Presentation |
|-------------|---------------------|
| `type='sic'` | Blue dot icon, normal text, blue left border |
| `type='non-conformity'` | Red triangle icon, normal text, red left border |
| `type='narrative-hint'`, `isRevealed=false` | Lock icon, `████` blocks, purple left border |
| `type='narrative-hint'`, `isRevealed=true` | Star icon, full text, green left border |
| Text >3 lines | Truncated with "..." ellipsis |
| Timestamp <24h | Relative format ("Il y a 2 minutes") |
| Timestamp ≥24h | Absolute format ("23 janv. à 14:30") |

### Performance Requirements

- **Memoization**: Component wrapped in `React.memo` with shallow comparison
- **Re-render trigger**: Only when `entry.id` changes (prevents unnecessary re-renders)
- **Text rendering**: Use `Text` component (not `TextInput`), avoid shadow/gradient effects

### Style Constants

```typescript
const ENTRY_HEIGHT = 80;
const ICON_SIZE = 24;
const BORDER_WIDTH = 3;
const TEXT_MAX_LINES = 3;

const TYPE_COLORS = {
  sic: '#3498DB',
  'non-conformity': '#E74C3C',
  'narrative-hint-unrevealed': '#9B59B6',
  'narrative-hint-revealed': '#27AE60'
};
```

---

## 3. Toast (refactored)

**File**: `components/Toast.tsx`

### Interface

```typescript
interface ToastProps {
  /** Toast message data */
  toast: ToastMessage;
  
  /** Callback fired when toast should be dismissed (auto or manual) */
  onDismiss: (id: string) => void;
}

export default function Toast(props: ToastProps): JSX.Element;
```

### Responsibilities

1. **Slide-in + micro-bounce animation** (react-native-reanimated v3)
   - Phase 1 (200ms): Slide down from `translateY: -100` to `translateY: 0` (withTiming)
   - Phase 2 (200ms): Bounce scale from `scaleY: 0` to `scaleY: 1` (withSpring)
   - Spring config: `{ mass: 0.8, damping: 10, stiffness: 100 }` (subtle bounce)

2. **Auto-dismiss after duration** (default: 5000ms)
   - Starts exit animation 250ms before duration expires
   - Exit animation: Reverse of entrance (slide up, fade out)
   - Calls `onDismiss(toast.id)` after exit animation completes

3. **Passive interaction** (NO manual dismiss)
   - `onPress` handler removed (spec clarification Q3)
   - `pointerEvents="none"` to prevent tap interception
   - Toast is purely visual and atmospheric

4. **Styling by type**
   - `type='sic'`: Dark background (`#2C3E50`), blue left border (`#3498DB`)
   - `type='non-conformity'`: Dark red background (`#3D2C2C`), red left border (`#E74C3C`)
   - `type='phase2'`: Dark green background (`#2C3E2C`), green left border (`#27AE60`)
   - `type='system'`: Dark gray background (`#2C2C2C`), gray left border (`#95A5A6`)

5. **Accessibility**
   - `accessibilityLiveRegion="polite"` (announces new toasts to screen readers)
   - `accessibilityLabel={toast.text}` (speaks message content)
   - No `accessibilityHint` (toast is not interactive)

### Behavior Contracts

| Event | Expected Behavior |
|-------|-------------------|
| Toast appears | Slide-in (200ms) + bounce (200ms), total ~400ms |
| Duration expires (5000ms) | Exit animation starts at 4750ms, complete by 5000ms |
| Exit animation completes | Calls `onDismiss(toast.id)` |
| User taps toast | No effect (passive, non-interactive) |
| >3 toasts queued | Only first 3 rendered, rest silently dropped by `ToastContainer` |

### Performance Requirements

- **Animation FPS**: 60fps (use `useNativeDriver: true` in reanimated config)
- **Render time**: <50ms from `showToast()` call to first frame visible
- **Memory**: <1KB per toast instance (lightweight ephemeral component)

### Migration from Legacy Animated API

**Before** (legacy):
```typescript
const slideAnim = useRef(new Animated.Value(-100)).current;

Animated.timing(slideAnim, {
  toValue: 0,
  duration: 300,
  useNativeDriver: true
}).start();
```

**After** (reanimated v3):
```typescript
const translateY = useSharedValue(-100);

useEffect(() => {
  translateY.value = withTiming(0, { duration: 200 });
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: translateY.value }]
}));
```

---

## 4. ToastContainer (modified)

**File**: `components/ToastContainer.tsx`

### Interface

```typescript
interface ToastContainerProps {
  // No props — consumes toastQueue from GameStateContext
}

export default function ToastContainer(): JSX.Element;
```

### Responsibilities

1. **Consume toast queue from context**
   - Accesses `toastQueue` via `useGameState()` hook
   - Max 3 toasts displayed (enforced by context, not container)

2. **Stack toasts vertically** with offset
   - First toast: `top: 20` (below safe area)
   - Second toast: `top: 20 + 10 = 30` (10pt offset)
   - Third toast: `top: 20 + 20 = 40` (20pt offset)
   - Fourth+ toasts: Not rendered (dropped by context before reaching container)

3. **Absolute positioning** (overlay above all content)
   - `position: 'absolute'`
   - `top: 0, left: 0, right: 0`
   - `zIndex: 1000` (above drawer overlay at `zIndex: 999`)
   - `pointerEvents="box-none"` (allow taps to pass through to content below)

4. **Lifecycle management**
   - Renders `Toast` component for each item in `toastQueue`
   - Passes `dismissToast` callback from context
   - No local state (fully controlled by context)

### Behavior Contracts

| Event | Expected Behavior |
|-------|-------------------|
| `toastQueue` updated | Re-renders with new stack positions |
| Toast duration expires | Context removes from queue, container re-renders |
| User navigates screens | Toasts remain visible (mounted at tab layout level) |
| Drawer opens | Toasts remain above drawer (higher z-index) |

### Performance Requirements

- **Re-render cost**: <5ms (simple map over queue)
- **No memory leaks**: Auto-dismissed toasts removed from queue by context

### Migration Notes

**Before**: Mounted only on Bureau screen (`app/(tabs)/index.tsx`)  
**After**: Mounted at tab layout level (`app/(tabs)/_layout.tsx`) as sibling to `<Tabs>` component

```typescript
// app/(tabs)/_layout.tsx
export default function TabLayout() {
  return (
    <>
      <ToastContainer /> {/* NEW: Mount at layout level */}
      <Tabs screenOptions={{...}}>
        {/* ... existing tabs ... */}
      </Tabs>
    </>
  );
}
```

---

## 5. Burger Menu Button (new)

**File**: `app/(tabs)/_layout.tsx` (inline component)

### Interface

```typescript
// Rendered in Tabs screenOptions.headerRight
function BurgerMenuButton(): JSX.Element;
```

### Responsibilities

1. **Icon display**
   - Use `Menu` icon from `lucide-react-native` (hamburger menu: ☰)
   - Size: 24pt
   - Color: `#4b6c8c` (matches header title color)

2. **Touch target**
   - Minimum 44×44pt (AR-001 requirement)
   - Padding: 10pt horizontal, 8pt vertical (ensures target size)

3. **Toggle drawer state**
   - `onPress`: Sets local state `drawerOpen = true`
   - State managed in `_layout.tsx` (passed to `JournalDrawer` as `isOpen` prop)

4. **Accessibility**
   - `accessibilityRole="button"`
   - `accessibilityLabel="Ouvrir le journal S.I.C."` (French)
   - `accessibilityHint` omitted (action is self-explanatory)

### Behavior Contracts

| Event | Expected Behavior |
|-------|-------------------|
| User taps button | Drawer slides in from right, overlay appears |
| Drawer already open | No effect (button disabled or hidden) |

### Implementation Example

```typescript
// app/(tabs)/_layout.tsx
const [drawerOpen, setDrawerOpen] = useState(false);

<Tabs
  screenOptions={{
    // ... existing options ...
    headerRight: () => (
      <Pressable
        onPress={() => setDrawerOpen(true)}
        style={{ padding: 10, minWidth: 44, minHeight: 44 }}
        accessibilityRole="button"
        accessibilityLabel="Ouvrir le journal S.I.C."
      >
        <Menu size={24} color="#4b6c8c" />
      </Pressable>
    )
  }}
>
  {/* ... tabs ... */}
</Tabs>

<JournalDrawer
  isOpen={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  entries={gameState.journal}
/>
```

---

## Optimization Contracts

### FlatList Configuration (JournalDrawer)

**Required Props**:
```typescript
<FlatList
  data={entries}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <JournalEntry entry={item} />}
  
  // Virtualization (critical for 500 entries)
  windowSize={10}
  initialNumToRender={25}
  maxToRenderPerBatch={25}
  updateCellsBatchingPeriod={50}
  
  // Fixed-height optimization
  getItemLayout={(data, index) => ({
    length: 80,
    offset: 80 * index,
    index
  })}
  
  // Android-specific
  removeClippedSubviews={Platform.OS === 'android'}
  
  // Performance
  scrollEventThrottle={16}
  ListEmptyComponent={<EmptyJournalState />}
/>
```

**Performance Targets**:
- Initial render: <200ms to first visible entry
- Scroll FPS: 58-60fps minimum (verified with Perf Monitor)
- Memory: <5MB total for 500 entries

---

## Testing Contracts

### Unit Testing (if required)

**JournalEntry Component**:
```typescript
it('displays redacted text for unrevealed narrative hints', () => {
  const entry = {
    id: '1',
    type: 'narrative-hint',
    text: '████ ████████ disponible',
    timestamp: Date.now(),
    isRevealed: false,
    revealedText: 'Nouvelle administration disponible',
    targetId: 'test-admin'
  };
  
  const { getByText } = render(<JournalEntry entry={entry} />);
  expect(getByText(/████/)).toBeTruthy();
});
```

**Toast Component**:
```typescript
it('auto-dismisses after duration', async () => {
  const onDismiss = jest.fn();
  const toast = {
    id: '1',
    text: 'Test',
    type: 'sic',
    duration: 1000,
    timestamp: Date.now()
  };
  
  render(<Toast toast={toast} onDismiss={onDismiss} />);
  
  await waitFor(() => expect(onDismiss).toHaveBeenCalledWith('1'), {
    timeout: 1500
  });
});
```

### Manual Testing Checklist

- [ ] Toasts appear on all screens (Bureau, Recrutement, Progression, Options)
- [ ] Max 3 toasts visible, 4th+ silently dropped
- [ ] Toast animation includes micro-bounce effect (~400ms total)
- [ ] Drawer slides smoothly at 60fps
- [ ] Journal displays 500 entries without lag
- [ ] French timestamps format correctly (relative <24h, absolute ≥24h)
- [ ] Narrative hints reveal on unlock (administration purchase)
- [ ] V2 saves migrate to V3 without data loss
- [ ] Accessibility labels read correctly in VoiceOver/TalkBack

---

## Summary

**Component Count**: 5 (JournalDrawer, JournalEntry, Toast, ToastContainer, BurgerMenuButton)  
**External Dependencies**: react-native-reanimated v3, lucide-react-native  
**Performance Target**: 60fps animations, <5MB memory for journal  
**Accessibility**: WCAG 2.1 AA compliant, screen reader friendly

**Proceed to**: Implementation phase with task breakdown
