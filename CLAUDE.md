# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BUREAUCRACY++** is a satirical French incremental/idle mobile game built with React Native + Expo. Players collect three resources (dossiers, tampons, formulaires) by clicking a stamp button and hiring agents that automate production.

- Language: TypeScript (strict mode)
- Platform: React Native / Expo 53, portrait only
- GameState schema: v4
- All in-game text is in French

## Commands

```bash
npm run dev          # Start Expo dev server (i=iOS, a=Android, w=browser)
npm run build:web    # Export static web build to dist/
npm run lint         # Run ESLint via expo lint
```

There is no automated test suite. Testing is done manually on iOS/Android simulators or in the browser (`npm run dev` then press `w`).

## Architecture

### Three-layer separation (strict)

```
components/   → UI only, no game math
context/      → GameStateContext: state, actions, game loop
data/         → Pure functions, no React dependencies
```

Components must never import directly from `data/`. All business logic is accessed through `GameStateContext` via the `useGameState()` hook.

### GameStateContext (`context/GameStateContext.tsx`)

Single source of truth for all runtime state. Key internals:

- **Game loop:** `setInterval` at 100ms (`UPDATE_INTERVAL`)
- **Auto-save:** Debounced 5s to AsyncStorage key `'bureaucracy_game_state'`
- **Production cache:** Invalidated only when the administrations list changes
- **Refs vs state:** Values read by the game loop but not displayed (timestamps, caches, pending updates) live in `useRef`, never in `useState`
- **Pending updates pattern:** Snapshot pending updates *before* clearing them — React's async updater requires this

Toast queue is **not** persisted; it lives in a separate `useState` in the provider.

### Data layer files

| File | Responsibility |
|---|---|
| `data/gameData.ts` | Static definitions — administrations, agents, costs, initial state |
| `data/conformiteLogic.ts` | Conformité unlock/activation checks, percentage calculations |
| `data/messageSystem.ts` | S.I.C. message pool, cooldown-based probabilities, milestone thresholds |
| `data/storageLogic.ts` | Storage cap checks, upgrade sequence validation |
| `data/prestigeLogic.ts` | Prestige paperclip gain, multipliers, upgrade validation |
| `utils/formatters.ts` | `formatNumberFrench()` — always use this, never raw `.toLocaleString()` |
| `utils/stateMigration.ts` | GameState version migration chain (v1→v4) |

### Navigation

File-based routing via `expo-router`. Tabs in `app/(tabs)/`:
- `index.tsx` — main stamping screen
- `recruitment.tsx` — buy agents, unlock administrations
- `progression.tsx` — stats and prestige
- `options.tsx` — settings, reset save

### Resource system

Three resources: **dossiers** (orange `#e67e22`), **tampons** (blue `#3498db`), **formulaires** (purple `#9b59b6`). All floating-point; always display via `formatNumberFrench()`. Formulaires are storage-capped (until Vide Juridique upgrade).

### Bonus system

`Agent.productionBonus` scope:
- `isGlobal: false` — applies only within its administration
- `isGlobal: true` — applies to the global multiplier across all administrations

Target: `'dossiers'` | `'tampons'` | `'formulaires'` | `'all'`

### Conformité system

Unlocks when 5th administration is active AND `highestEverTampons >= 1000` AND `highestEverFormulaires >= 100`. Activation costs 40,000 tampons + 10,000 formulaires (one-time). Percentage advances via exponential formula by 10% tranches — all threshold constants live in `data/conformiteLogic.ts`.

### Storage cap system

Four upgrades in mandatory sequence (Casier B-9 → Rayonnage Vertical → Compression A-1 → Vide Juridique). Only the next eligible upgrade is shown. Storage is blocked (formulaires icon turns red) when `resources.formulaires >= currentStorageCap`.

### S.I.C. message system

Milestone triggers (every 100 dossiers / 50 tampons / 25 formulaires) check cooldown-based probability. Non-conformity alerts: 0.2% per milestone, max 1 per 10 minutes. Journal max 500 entries (FIFO).

### Prestige system

Paperclips are earned via `performPrestige()`, spent in the prestige shop. Effect types: `'click_multiplier'`, `'production_bonus'`, `'storage_bonus'`. Use `getPrestigePotentialLive()` for live gain preview.

### State migration

To add a new schema version:
1. Increment `initialGameState.version` in `data/gameData.ts`
2. Add a migration block in `utils/stateMigration.ts` (before the `if (version >= N+1)` guard)
3. Update `isValidGameState()` for any new required fields

## Key Conventions

### TypeScript
- Strict mode — no `any`. Use interfaces from `types/game.ts`.
- Path alias `@/` maps to project root.

### Styling
- All colors from `constants/Colors.ts` — never hardcode hex values in components.
- `StyleSheet.create` always — never inline style objects.
- Prettier: single quotes, 2-space indent, no tabs.
- Components ≤ ~300 lines; split if larger.

### React Native patterns
- `Pressable` only — never `TouchableOpacity` or `TouchableHighlight`.
- iOS shadows (`shadow*`) + Android `elevation` must both be set.
- `FlatList` over `ScrollView` for any list that can exceed 10 items.
- `React.memo` on all list item components. `useCallback`/`useMemo` on props/derived values.
- Animations via `react-native-reanimated` v3 (`useSharedValue` + `useAnimatedStyle`). Never animate with `setState`.
- Haptics: `Light` impact for taps, `Medium` for purchases, `Success` notification for unlocks.
- Screens always wrapped in `SafeAreaView` from `react-native-safe-area-context`.

### Adding a new administration or agent

1. Add to the `administrations` array in `data/gameData.ts`.
2. Set `isUnlocked: false` with an `unlockCost` (except `administration-centrale` which starts unlocked).
3. Use `Partial<Resources>` for `baseProduction` — only specify applicable resources.
4. Bonus-only agents: set `baseProduction: {}` and define `productionBonus`.

### SpecKit workflow

For significant features, use the SpecKit agent suite before implementing:
```
speckit.specify → speckit.plan → speckit.tasks → speckit.implement
```
Specs live in `specs/<id>-<name>/`. The project constitution is in `.specify/memory/constitution.md`.

### Commit messages

Conventional Commits format: `type(scope): description`

Common types: `feat(ui)`, `fix(state)`, `perf(logic)`, `refactor(ui)`, `style(ui)`, `docs`, `chore`
