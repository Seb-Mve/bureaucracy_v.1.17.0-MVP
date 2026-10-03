# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BUREAUCRACY++** is a satirical French incremental/idle mobile game built with React Native + Expo. The game is being rebuilt as a 6-act arc (see the design document); the code currently implements **Act I — Le Guichet** (spec: `specs/007-acte1-guichet/spec.md`).

Act I loop: usagers file dossiers at the guichet; the player taps TAMPONNER (and hires collègues) to process them; each processed dossier consumes formulaires and pays a dotation. Demand is abundant (the queue rarely empties): the bottleneck is processing capacity and formulaires. A player-set **Taux de rejet** sends usagers back; a rejected dossier pays a bonus (prime de rejet) and raises hidden Conformité, but usagers who run out of patience abandon, shrinking future demand. Collègues double their speed at 10/25/50 copies (ancienneté). Each collègue type has its own cost growth (`croissance`, lower for the stagiaire). The **Tampons apposés** counter sets the player’s grade (`GRADES` in `constants/balance.ts`): +10 % dotation per grade, announced only by a S.I.C. letter and shown in Options (dossier administratif), never in the HUD. A note in instruction takes its full official delay: tapping does not shorten it. Note n° 1 (« Renfort estival », opens the Service tab) appears at a tampons count drawn per game between 20 and 30 (`GameState.seuilRenfort`, `BALANCE.seuilRenfort`), so the player senses hidden rules. Near the end of the act the collègues outrun the population and the queue empties for ~15–20 s: this is intended, explained by the bubble and a S.I.C. letter (« Excédent de productivité ») that teases Act II. There is no ordre du jour and no circulaires: the player discovers the game (fiche de poste at the start, règlement intérieur in Options, notes de service, S.I.C. letters). The game explains itself once: no counter definitions, no help button, no explanatory lines under controls, no note notification on the Guichet (a new note shows only as the Notes tab badge). Notes de service (projects) drip-feed mechanics. The act ends when Conformité reaches 100 %.

- Language: TypeScript (strict mode)
- Platform: React Native / Expo 53, portrait only
- GameState schema: v1 of the Act I rewrite (AsyncStorage key `bureaucracy_acte1_v1`; the old `bureaucracy_game_state` v4 save is ignored)
- All in-game text is in French (typographic apostrophes ’)
- Visual identity: charte « Pastel Dystopia / Soft-Vector » (`constants/Colors.ts`: cream `#F9F4E0`, anthracite outlines, hard offset shadows; fonts Fredoka / Nunito / Roboto Mono)

## Commands

```bash
npm run dev                              # Start Expo dev server (i=iOS, a=Android, w=browser)
npm run build:web                        # Export static web build to dist/
npm run lint                             # Run ESLint via expo lint
./node_modules/.bin/tsc --noEmit -p .    # Type-check (scripts/ and specs/ are excluded)
npm test                                 # Unit tests of data/ and of the pixel-art scene engine (node:test, scripts/tests/*.test.ts)
node scripts/simulate-acte1.ts [taps/s] [minutes]   # Balance simulator: bot player, prints milestones
```

Pure data-layer logic is covered by `npm test` (Node's built-in test runner, no dependency). Balance changes must be checked with the simulator (target: bot finishes Act I in ~60–75 min, i.e. ~85–100 min for a human).

**iCloud warning:** the repo lives in an iCloud-synced `Documents` folder. If npm, tsc or Metro hang with 0 % CPU, macOS has probably evicted files from `node_modules` (`ls -lO` shows `dataless`). Fix: `rm -rf node_modules && npm ci`. Metro's file watcher may also miss edits: restart with `npx expo start --clear`.

## Architecture

### Three-layer separation (strict)

```
components/   → UI only, no game math (components/charte/ = charte primitives)
context/      → GameStateContext: state, actions, game loop, save; PreferencesContext: device settings
data/         → Pure functions, no React dependencies (also run by the simulator under Node)
constants/    → Colors/Fonts/Charte, balance numbers and agent definitions
```

Components must never import from `data/`. Everything goes through `useGameState()`; types needed by components are re-exported from the context.

### GameStateContext (`context/GameStateContext.tsx`)

- **Game loop:** `setInterval` at 100 ms, calls `tick(state, dt)`; a gap > 30 s (backgrounded tab) is treated as an absence.
- **Offline progress:** `simulerAbsence` runs 1 s ticks with collègues only, without rejection or Conformité gain (capped at 20 min, `BALANCE.horsLigneMax`) and posts a courrier letter.
- **Save:** throttled to AsyncStorage: the first state change arms a 1 s timer that is never re-armed while pending, so the latest state is written at most once per second while playing (a debounce would never fire, since the loop changes the state every 100 ms). Plus an immediate save when the app goes to background.
- **Courrier:** `nouvellesLettres` is checked every tick; each letter is sent once (`lettresEnvoyees`).
- **No pause:** the game never pauses, not even behind a window (job sheet, mail, confirmation, end of act). `useFermetureEchap` only closes a window with Escape on the web.
- **Rupture:** no alert on the Guichet. The Formulaires column turns red (Budget too when it can no longer pay a ramette), a « ! » badge appears on the tab where forms can be had (Service, or Notes before note n° 1), and tapping TAMPONNER in rupture makes the button read « PLUS DE FORMULAIRES » for 1.5 s. Without budget, the Service tab’s ×1 ramette button becomes a free « Réquisition » (`E.requisitionUrgence`), so the guichet can never be stuck. « Max » ramettes buys everything the budget allows.
- **Purchases are final:** there is no undo.
- **Head of the queue:** the usager in the bubble (`teteDeFile(s)[0]`, patience drawn per usager number from the real queue mix) is the one whose dossier the next tap processes first (`E.tamponner(…, premier)`), so « Troisième fois… » then a rejection is an abandon. Abandons show in the scene: the usager drops their dossier (it lies on the floor 2.5 s), leaves fast with a red exit arrow (`MoteurScene.abandon`, `Verdict.abandon`, `abandonsFile` for collègue abandons, at most 2/s).
- **Tap feedback:** a tap shows no floating numbers. It reads in the scene (arm, impact star, ink, shake) and in the counters, which react to `verdict.id` through `components/charte/ValeurAnimee`. TAMPONNER fires on press-in, one stamp per press (`BoutonPoussoir` `immediat`, no auto-repeat), and the space bar stamps on the web (the only keyboard shortcut).

### PreferencesContext (`context/PreferencesContext.tsx`)

Vibrations and reduced animations, stored under their own AsyncStorage key (`bureaucracy_preferences_v1`) so they survive « Effacer la partie ». `reduireMouvement` also follows the system setting.

### Data layer files

| File | Responsibility |
|---|---|
| `data/engine.ts` | Initial state, `tick`, `tamponner`, purchases, modifiers derived from notes, offline simulation |
| `data/notes.ts` | The 22 Notes de service: text, cost, instruction delay, visibility condition, effect on `Modifiers` |
| `data/courrier.ts` | S.I.C. letters and their triggers, absence summary letter |
| `data/usagers.ts` | Deterministic usager identities (name, request, mood) for the queue display |
| `data/save.ts` | Storage key, save validation, removal of obsolete fields from older saves |
| `constants/balance.ts` | All tuning numbers (`BALANCE`) and collègue definitions (`AGENTS`) |
| `utils/formatters.ts` | `formatEntier` (counts) and `formatEuros` (money): full digits up to 99 999, then « 124 k », « 4,47 M »; `formatPourcent`; `formatNumberFrench` (rates) |

### Economy model (aggregate, no per-usager objects)

`file[p]` / `retours[p]` count dossiers by remaining patience `p` (1..3). Rejection: each dossier stamped by the player is rejected with probability `tauxRejet` (a real draw, `alea` parameter of `E.tamponner`); collègues and offline volumes use the expected fraction. A rejected usager returns with `p-1`; at `p = 1` they abandon and leave the population. Population refills toward the périmètre capacity (extension notes raise it).

### Navigation

File-based routing via `expo-router`. First launch shows `CerfaEcran` (hiring form) instead of the tabs. Tabs in `app/(tabs)/`:
- `index.tsx` — Guichet, no scrolling, top to bottom: resources (`Hud`, flat columns incl. « En attente »), the usager’s bubble (`BulleGuichet`, its tail points at the head of the queue), the pixel-art scene (`SceneGuichet`, the whole world framed by the engine itself; nothing sits on it), rejection slider, TAMPONNER
- `recruitment.tsx` — tab « Service »: ramettes and collègues (hidden until note n° 1)
- `notes.tsx` — Notes de service (hidden until the first note)
- `options.tsx` — no resources table; dossier administratif, règlement intérieur (help, one article per unlocked mechanic), confort settings, démission, reset

The header (`EnTete`) holds the **Tampons apposés** counter (always at the top, on every tab), and the S.I.C. courrier envelope. Below 720 pt of height the Guichet goes compact (single-line bubble, tighter HUD and button). On the web the app is a centred column of at most 480 pt, and `public/index.html` sets `viewport-fit=cover` so iPhone home-screen installs get real safe-area insets (the tab bar adds the bottom inset).

### Pixel-art scene (`components/scene/`)

`pixel/` is a platform-free engine (no React): `moteur.ts` keeps its own visual queue (driven by `enAttente` and each `verdict`), animates the stamp and draws each frame into a small RGBA `Toile` (≈176 × 112 px); `sprites.ts` generates usagers, the agent and the stamp; `decor.ts` paints the static layers once per size. `ScenePixel.tsx` shows the frames with `@shopify/react-native-skia` (nearest-neighbour sampling), `ScenePixel.web.tsx` with a plain `<canvas>` (no Skia on the web). Pixel colours live in `constants/PalettePixel.ts`. The loop runs only while the Guichet tab is focused and draws 30 frames/s. Usager moods are deliberately not shown in the queue; only a rejected usager leaves angry.

## Key Conventions

### TypeScript
- Strict mode — no `any`. Use interfaces from `types/game.ts`.
- Path alias `@/` maps to project root.

### Styling
- All colors from `constants/Colors.ts` — never hardcode hex values in components. Use `Colors.encreTexte` / `Colors.rougeTexte` for orange/red text (AA contrast).
- Sizes come from the tokens in `constants/Colors.ts`: `Typo` (6 font sizes, nothing below 11) with matching `Interligne`, `Espace` (4-pt grid; 1–3 pt only for hairline offsets), `Charte.rayon` / `rayonPetit` / `rayonMini`. No raw numbers for fontSize, lineHeight, padding, margin, gap or borderRadius.
- Build cards with `components/charte/Panneau` (hard shadow), buttons with `BoutonPoussoir`, gauges with `JaugeHachuree`.
- `StyleSheet.create` always — never inline style objects.
- Text that must fit on one line measures its container with `components/charte/useLargeur` (`onLayout` alone does not always fire on the web; `adjustsFontSizeToFit` does not exist there).
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

### Adding a Note de service or a collègue

1. Notes: add an entry to `NOTES` in `data/notes.ts` (and its id to `NoteId` in `types/game.ts`). Effects only mutate `Modifiers`.
2. Collègues: add to `AGENTS` in `constants/balance.ts` (and `AgentId`), then unlock it from a note.
3. Re-run `node scripts/simulate-acte1.ts` to check pacing.

### SpecKit workflow

For significant features, use the SpecKit agent suite before implementing:
```
speckit.specify → speckit.plan → speckit.tasks → speckit.implement
```
Specs live in `specs/<id>-<name>/`. The project constitution is in `.specify/memory/constitution.md`.

### Commit messages

Conventional Commits format: `type(scope): description`

Common types: `feat(ui)`, `fix(state)`, `perf(logic)`, `refactor(ui)`, `style(ui)`, `docs`, `chore`
