# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BUREAUCRACY++** is a satirical French incremental/idle mobile game built with React Native + Expo. The game is being rebuilt as a 6-act arc (see the design document); the code currently implements **Act I — Le Guichet** (spec: `specs/007-acte1-guichet/spec.md`) and **Act II — La Direction** with its Réforme (spec: `specs/009-acte2-direction/spec.md`; closing the end-of-Act-I window starts it). The **Réforme** (first prestige, Options at Act II once note n° 11 is in force) is a total reset back to the Cerfa (new number `00001*02`, `*03`…) and the very start of Act I; only `GameState.reformes` (trombones, Jurisprudence, already-instructed notes, memorised procedures, drawn service names, first Cerfa), the Tampons apposés counter (hence the grade) and the first name survive. Notes bought in an earlier run cost ÷ 6 and take ÷ 4 of their delay (déjà-vu administratif). The end-of-Act-II wall is the « sclérose des services »: each loop step yields `(1 + 0.1 × trombones obtained) / (1 + service age / 1250 s)` démat points, and the Réforme resets the age. Act II explains itself the way Act I does (spec: `specs/010-acte2-lisibilite/spec.md`): a chef de service job sheet (`data/acte2/fiche.ts`, `components/direction/FichePosteDirection.tsx`) opens on entry with three orientation lines, then gains a line for the Agents and one for the Service des achats when their notes come into force — no line explains a trade-off (badge on the Options tab until re-read, « Relire ma fiche de poste »); the bubble is a circulation table; the Atelier header shows each procedure's « demandes · délivrés » and per-dossier balance, the « Production du service » statement sits at its foot, and locked step types are listed as « En attente de réglementation ». Act II ramettes cost 80 € (Act I: 8 €) against a 1.60 € base dotation per step, so supplies weigh ~35 % of income at ×1; note n° 6 « Marché public de fournitures » unlocks the Service des achats (automatic ramettes below 30 s of capacity, also offline, switch in the Service tab). Act II shows what the service delivers (spec: `specs/011-acte2-decouverte/spec.md`, storyboard `specs/011-acte2-decouverte/storyboard.html`): only the Carte d'identité gets spontaneous demand (`PROCS_DEMANDEES`); every delivered document is counted (`stats.delivresUsagers` / `delivresService`); a dossier crossing a « Pièce délivrée par nos services » step deposits its linked request and goes on to the end of its own procedure in a third stock, `suites` (it never deposits again, so `boucles` stays one dossier per usager who entered the loop); once no demanded procedure can deliver to an usager (`aboutitPourUsagers`), usagers who wait grow impatient (`BALANCE2.impatience`), nobody settles and the town empties (`BALANCE2.exode`); before that, abandons come only from per-step patience and rejection. The Direction screen and the Atelier show a « Production du service » statement (`data/acte2/production.ts`, `components/direction/ReleveProduction.tsx`): demandes, documents délivrés, « +X € la carte » and abandons for the Carte d'identité, « → usagers » only while documents still go to usagers; the bubble shows « Mme Lefèvre demande une Carte d’identité » ending in a « Délivrée » chip, then anonymous « Demande n° … » requests. Act II starts without any guichet (spec: `specs/012-acte2-debut/spec.md`, storyboard `specs/012-acte2-debut/storyboard.html`): 50 demandes wait at the Visa (and a frozen file of 14 at the Vérification des pièces) and their visas pay for the first guichet; no new demande arrives before the first guichet, so nothing moves until the player stamps; note n° 1 « Réouverture du guichet 3 » appears only after `BALANCE2.tapsAvantReouverture` (3) taps on the greyed TAMPONNER once nothing is left to stamp (`tapsSansVisa`, `reouvertureVisible`, kept once set; at once when Antériorité offers guichets), and if the budget went elsewhere the guichet 3 reopens d'office (`guichetDOffice`). On screen, Act II has one word for what it processes, « demande » (steps « Vérification des pièces » and « Justificatif exigé »; internal ids unchanged, checked by `scripts/tests/vocabulaire-acte2.test.ts`). The header reads Budget · Formulaires · À viser, with no per-second rate (TAMPONNER greys out silently at 0 but stays tappable), the town's population heads the « Production du service » statement, whose « +X € la carte », « N formulaires la carte » and abandons chips appear with the Atelier; the bubble follows one demande (« Attend votre visa », « Attend la vérification des pièces »; a crossed step nobody waits at is ticked; « ← ici » on its Visa) and, for 1.2 s after a delivery, shows « Repart avec sa Carte d’identité » with a green « Délivrée » chip.

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
node scripts/simulate-acte2.ts [taps/s] [minutes] [réformeÀ % | balayage] [découverte min]   # Act II simulator, Réforme and Act I replay included (robots: scripts/robots.ts)
node --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <preset>   # Prints the localStorage line that loads a test save (presets of data/presets.ts: acte1Debut, acte1Milieu, finActeI, debut, visasEpuises, atelier, compliquer, achats, pieceService, avantBoucle, boucle, demat, fin, reforme, cerfa2)
node scripts/bundle-scene-pixel.ts <out.js> [--acte 2]   # Browser bundle of the pixel scenes for DESIGN/ mockups (no dependency)
```

**Raccourcis de test (in-app):** add `?test` to any URL (or open `/test`) to get the « Raccourcis de test » screen (`app/test.tsx`): one card per preset of `data/presets.ts` (`PRESETS_INFO`), a confirmation, then `chargerRaccourci` replaces the game, saves at once and goes back to the first tab. Enabled when `raccourcisActifs` (`__DEV__ || EXPO_PUBLIC_RACCOURCIS === '1'`); `netlify.toml` sets `EXPO_PUBLIC_RACCOURCIS = "1"` for deploy previews and branch deploys only, never production (there `/test` redirects to `/`).

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
- **Acts:** the game loop, the offline catch-up and every action dispatch on `s.acte`: Act I runs `data/engine.ts`, Act II runs `data/acte2/moteur.ts` (`tick2`, `tamponner2`, `simulerAbsence2` + `lettreAbsence2`); Act I code never runs on an Act II state, and Act I fields kept in the save are never shown at Act II. Screens read Act II through `direction`, `service2` and `atelier` (pure views: `data/acte2/vues.ts`, `data/acte2/vueAtelier.ts`; null at Act I) and the act's ink `encre` (`Encres` in `constants/Colors.ts`: orange, then blue). `FinActeModal` calls `entrerDirection`.
- **Raccourcis de test:** `chargerRaccourci(id)` (only when `raccourcisActifs`), `raccourcis` (titles and details of the presets).
- **Réforme:** `reformer` (Options → Formulaire R-01) resets to the Cerfa screen (`cerfaNumero`), `acheterJurisprudence` spends trombones (final, no undo); `reforme` is the Options view (trombones and Jurisprudence appear only after the first Réforme). Components live in `components/reforme/`.
- **Lisibilité (Act II):** `fiche2` (job sheet view; `marquerFichePoste` opens/closes the Act I or Act II sheet depending on the act), `reglerAchats` (Service des achats switch), `production` (« Production du service » lines, one per open procedure).

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
| `data/acte2/moteur.ts` | Act II (La Direction): entry, `tick2`, `tamponner2` (visas), purchases, sliders, offline |
| `data/acte2/procedures.ts` | Procedure graph, loop detection, Atelier actions |
| `data/acte2/notes2.ts` | The 17 Act II Notes de service |
| `data/acte2/courrier2.ts` | Act II S.I.C. letters (incl. the safety-net letters) |
| `constants/balanceActe2.ts` | Act II tuning (`BALANCE2`), steps, Exemplaires, agents |
| `data/acte2/vues.ts` | Act II views: Direction screen (parapheur, step chain, Démat.), Service, notes |
| `data/acte2/vueAtelier.ts` | Atelier view: step effects (symbol + word), loops, catalogue |
| `data/acte2/fiche.ts` | Act II job sheet: lines unlocked by notes in force, read lines, Options badge |
| `data/acte2/production.ts` | What the service delivers: each procedure's document (article, gender), value of a document, « Production du service » lines |
| `data/jurisprudence.ts` | What survives a Réforme: initial `reformes`, Jurisprudence effects, déjà-vu, drawn service names (imported by both engines) |
| `data/reforme.ts` | The Réforme: trombones, `reformer`, Cerfa number, its letter, Jurisprudence purchase, Options view |
| `data/presets.ts` | Test saves built with the engines (`sauvegardePreset`, `PRESETS`, `PRESETS_INFO`), from Act I to after the Réforme: `/test` screen, `scripts/save-acte2.ts`, tests |
| `utils/formatters.ts` | `formatEntier` (counts) and `formatEuros` (money): full digits up to 99 999, then « 124 k », « 4,47 M »; `formatPourcent`; `formatNumberFrench` (rates) |

### Economy model (aggregate, no per-usager objects)

`file[p]` / `retours[p]` count dossiers by remaining patience `p` (1..3). Rejection: each dossier stamped by the player is rejected with probability `tauxRejet` (a real draw, `alea` parameter of `E.tamponner`); collègues and offline volumes use the expected fraction. A rejected usager returns with `p-1`; at `p = 1` they abandon and leave the population. Population refills toward the périmètre capacity (extension notes raise it).

### Navigation

File-based routing via `expo-router`. First launch shows `CerfaEcran` (hiring form) instead of the tabs. Tabs in `app/(tabs)/`:
- `index.tsx` — Guichet, no scrolling, top to bottom: resources (`Hud`, flat columns incl. « En attente »), the usager’s bubble (`BulleGuichet`, its tail points at the head of the queue), the pixel-art scene (`SceneGuichet`, the whole world framed by the engine itself; nothing sits on it), rejection slider, TAMPONNER
- `recruitment.tsx` — tab « Service »: ramettes and collègues (hidden until note n° 1)
- `notes.tsx` — Notes de service (hidden until the first note)
- `options.tsx` — no resources table; dossier administratif, règlement intérieur (help, one article per unlocked mechanic), confort settings, démission, reset
- At Act II, `index.tsx` shows `components/direction/EcranDirection` (tab « Direction »: resources Budget, Formulaires, À viser (demandes waiting for the visa), then Démat.; bubble with the demande it follows (an usager's name, or « Demande n° … » without usager), what it waits for, and its procedure as a circulation table (demandes waiting at each step, stamp pictogram, guichet pictogram once the service has a guichet, thick border on the most loaded step) ending in a « Délivrée » chip; the « Production du service » statement headed by the town's population (one line per procedure when compact or from three procedures); `MoteurDirection` scene; Rejet and Exemplaires sliders; blue TAMPONNER), `recruitment.tsx` shows `ServiceDirection` (ramettes, the Service des achats switch after note n° 6, guichets and agents), and `atelier.tsx` (`components/atelier/`, one procedure per screen, add / remove / move steps, never names the loop) appears after the note « Atelier des procédures ». `FinActe2Modal` closes Act II; the game goes on.

The header (`EnTete`) holds the **Tampons apposés** counter (always at the top, on every tab), and the S.I.C. courrier envelope. Below 720 pt of height the Guichet goes compact (single-line bubble, tighter HUD and button). On the web the app is a centred column of at most 480 pt, and `public/index.html` sets `viewport-fit=cover` so iPhone home-screen installs get real safe-area insets (the tab bar adds the bottom inset).

### Pixel-art scene (`components/scene/`)

`pixel/` is a platform-free engine (no React): `moteur.ts` keeps its own visual queue (driven by `enAttente` and each `verdict`), animates the stamp and draws each frame into a small RGBA `Toile` (≈176 × 112 px); `sprites.ts` generates usagers, the agent and the stamp; `decor.ts` paints the static layers once per size. `ScenePixel.tsx` shows the frames with `@shopify/react-native-skia` (nearest-neighbour sampling), `ScenePixel.web.tsx` with a plain `<canvas>` (no Skia on the web). Pixel colours live in `constants/PalettePixel.ts`. The loop runs only while the Guichet tab is focused and draws 30 frames/s. Usager moods are deliberately not shown in the queue; only a rejected usager leaves angry. Act II has its own scene, `direction.ts` (`MoteurDirection`): the chef de service's glass office above the service hall (numbered guichets, call board, seated ticket holders), the chef stamping the parapheurs that pile up in a two-level tray. DESIGN/ mockups must use these engines through `scripts/bundle-scene-pixel.ts`, never old illustrations.

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
