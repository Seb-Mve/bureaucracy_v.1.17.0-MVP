# BUREAUCRACY++ – Copilot Instructions

Satirical French incremental/idle mobile game built with React Native + Expo. Players collect three resources (dossiers, tampons, formulaires) by clicking a stamp button and by hiring agents that automate production.

## Commands

```bash
npm run dev          # Start Expo dev server (press i/a for iOS/Android, or open in browser)
npm run build:web    # Export static web build
npm run lint         # Run ESLint via expo lint
```

There is no test suite. To run the app in the browser during development, use `npm run dev` and press `w`.

## Architecture

### State management

`context/GameStateContext.tsx` is the **single source of truth** for all runtime game state. Every component that needs state consumes it via the `useGameState()` hook (exported from the context file). The context exposes actions (`purchaseAgent`, `unlockAdministration`, `incrementResource`, etc.) — components never mutate state directly.

The game loop runs inside a `setInterval` at **100ms** (`UPDATE_INTERVAL`). State is auto-saved to `AsyncStorage` every **5 seconds** (`SAVE_INTERVAL`) under the key `'bureaucracy_game_state'`.

The `GameState` object carries a `version` field. Backward-compatible schema changes must go through `utils/stateMigration.ts` (`migrateGameState`). The toast queue is **not** persisted — it lives in a separate `useState` inside the context provider.

### Game logic separation

All business logic must be **pure functions with no React dependencies**:

| File | Responsibility |
|---|---|
| `data/gameData.ts` | Static definitions — administrations, agents, costs, production rates |
| `data/conformiteLogic.ts` | Conformité unlock checks, percentage calculations, test costs |
| `data/messageSystem.ts` | S.I.C. message pool, probability logic, milestone thresholds |
| `utils/formatters.ts` | French number formatting (`formatNumberFrench`) |
| `utils/stateMigration.ts` | GameState version migration |

React components and context consume these functions; they do not contain game math.

### Navigation

File-based routing via `expo-router`. Tabs are defined in `app/(tabs)/`:
- `index.tsx` — main stamping screen (primary game loop)
- `recruitment.tsx` — buy agents and unlock administrations
- `progression.tsx` — stats and progression tracking
- `options.tsx` — settings, reset save

### Bonus system

`Agent.productionBonus` has two scopes:
- `isGlobal: false` — bonus applies only within its administration
- `isGlobal: true` — bonus applies to the global multiplier across all administrations

The target can be `'dossiers'`, `'tampons'`, `'formulaires'`, or `'all'`.

## Key Conventions

### French language
All in-game text (agent names, descriptions, toast messages, UI labels) **must be in French** with correct accents and authentic administrative terminology. The S.I.C. message pool in `data/messageSystem.ts` is the reference for tone.

### Number formatting
Always use `formatNumberFrench(value)` from `utils/formatters.ts`. It follows French conventions: space as thousands separator, comma as decimal separator, lowercase `k`/`M` abbreviations (e.g., `1 500` → `"1,5 k"`).

### TypeScript
Strict mode is enabled. Avoid `any` — use the interfaces in `types/game.ts`. The `@/` path alias maps to the project root.

### Styling
- All colors come from `constants/Colors.ts`. Do not hardcode hex values in components.
- Prettier config: single quotes, 2-space indent, no tabs.
- Components should stay under ~300 lines; split if needed.

### Adding a new administration or agent
1. Add the definition to the `administrations` array in `data/gameData.ts` following the existing structure.
2. Ensure `isUnlocked: false` and define an `unlockCost` (except `administration-centrale` which starts unlocked).
3. Agent costs and `baseProduction` use `Partial<Resources>` — only specify the resources that apply.
4. If the agent only provides a bonus (no direct production), set `baseProduction: {}` and define `productionBonus`.

### Conformité system
Unlocks when `highestEverTampons >= 1000` AND `highestEverFormulaires >= 100` AND all five administrations are unlocked. All threshold constants live in `data/conformiteLogic.ts` — change them there, not inline.

### SpecKit workflow
This repo uses the SpecKit agent suite (`.specify/`). Feature specs live in `specs/`. Before implementing a significant feature, use `speckit.specify` → `speckit.plan` → `speckit.tasks` → `speckit.implement`.
