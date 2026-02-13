<!--
═══════════════════════════════════════════════════════════════════════════
SYNC IMPACT REPORT - Constitution v1.0.0
═══════════════════════════════════════════════════════════════════════════
Version Change: NONE → 1.0.0 (Initial ratification)
Modified Principles: 
  - Added: I. User Experience & Performance First
  - Added: II. Code Quality & Maintainability
  - Added: III. French Language & Cultural Authenticity
  - Added: IV. Accessibility & Inclusive Design
  - Added: V. Architectural Separation of Concerns
Removed Sections: None
Added Sections: 
  - Core Principles (5 principles)
  - Technical Standards
  - Development Workflow
  - Governance

Templates Requiring Updates:
  ✅ constitution-template.md - Used as base (no updates needed)
  ✅ plan-template.md - Constitution Check section updated with 5 principles
  ✅ spec-template.md - Added Accessibility and Localization Requirements sections
  ✅ tasks-template.md - Added [i18n], [a11y], [perf] task categorization labels

Follow-up TODOs: None - all placeholders filled
═══════════════════════════════════════════════════════════════════════════
-->

# BUREAUCRACY v.1.17.0-MVP Constitution

## Core Principles

### I. User Experience & Performance First

**MUST Requirements:**
- All user interactions MUST provide immediate visual feedback (target: <100ms perceived response)
- Game state updates MUST render at 60fps on mid-range mobile devices (iPhone 11 / Android equivalent)
- Idle game mechanics MUST function correctly when app is backgrounded/resumed
- Resource calculations MUST remain accurate across app lifecycle events
- All animations MUST be optimized for React Native performance best practices
- AsyncStorage operations MUST be batched and non-blocking

**Rationale:** As an idle/incremental game, smooth performance and reliable state management are critical to player retention and satisfaction. Poor performance breaks immersion and undermines the core game loop.

### II. Code Quality & Maintainability

**MUST Requirements:**
- All game logic MUST be separated from presentation components
- Shared state MUST be managed through React Context (GameStateContext pattern)
- Business logic MUST be pure functions that are independently testable
- Component files MUST follow single responsibility principle (max 300 lines)
- TypeScript MUST be used with strict mode enabled—no `any` types without explicit justification
- All public functions and complex logic MUST have JSDoc comments
- Game constants (costs, rates, multipliers) MUST be defined in centralized data files

**Rationale:** Incremental games grow in complexity quickly. Maintaining clean architecture from the start prevents technical debt that would slow feature velocity and increase bug risk.

### III. French Language & Cultural Authenticity

**MUST Requirements:**
- All in-game text MUST be in French with authentic bureaucratic terminology
- French language content MUST use proper accents, grammar, and orthography
- Game mechanics MUST reference real French administrative structures (ministères, préfectures, etc.)
- Humor and references MUST be culturally appropriate for French-speaking audiences
- Number formatting MUST follow French conventions (spaces for thousands: "1 000", comma for decimals: "1,5")
- Date/time displays MUST use French locale (dd/mm/yyyy format)

**SHOULD Requirements:**
- Consider providing localization infrastructure for future language support
- Use locale-aware formatting functions from React Native/Expo

**Rationale:** The game's unique value proposition is its authentic French bureaucratic theme. Maintaining linguistic and cultural accuracy is essential to the game's identity and appeal to its target audience.

### IV. Accessibility & Inclusive Design

**MUST Requirements:**
- All interactive elements MUST have minimum touch target size of 44×44 points
- Color MUST NOT be the only means of conveying information (e.g., use icons + text)
- Text contrast MUST meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- All icons and images MUST have descriptive accessibility labels for screen readers
- Font sizes MUST be responsive to system accessibility settings
- Game MUST be playable without sound/haptics (visual alternatives required)

**SHOULD Requirements:**
- Support reduced motion preferences where appropriate
- Provide alternative input methods (tapping vs. holding)
- Test with React Native Accessibility Inspector

**Rationale:** Building accessibility in from the start ensures the game reaches the widest possible audience and complies with platform accessibility guidelines, preventing costly retrofitting later.

### V. Architectural Separation of Concerns

**MUST Requirements:**
- **Presentation Layer** (`/components`): React components responsible only for rendering UI
- **State Layer** (`/context`): Game state management, Context providers, state hooks
- **Business Logic Layer** (`/data`): Game calculations, progression formulas, unlock conditions
- **Type Definitions** (`/types`): Shared TypeScript interfaces and type definitions
- **Constants** (`/constants`): Static configuration, costs, rates, multipliers
- Cross-layer dependencies MUST flow unidirectionally: Presentation → State → Logic
- Components MUST NOT directly import from `/data`—use Context hooks instead
- Pure calculation functions in `/data` MUST NOT have React dependencies

**Rationale:** Clear separation enables independent testing, easier debugging, and parallel development. It prevents tangled dependencies that make refactoring and feature additions exponentially more difficult as the codebase grows.

## Technical Standards

### React Native & Expo Compliance

- Project MUST use Expo SDK latest stable version (currently ~53.0.0)
- Expo Router MUST be used for navigation (no React Navigation direct imports)
- Platform-specific code MUST use `Platform.OS` checks or platform extensions (`.ios.tsx`, `.android.tsx`)
- Deprecated Expo APIs MUST be avoided—prefer modern equivalents
- Web support via `expo export --platform web` MUST remain functional

### State Persistence

- Game state MUST persist to AsyncStorage on every significant change
- Save operations MUST be debounced (max 1 save per second) to prevent performance degradation
- State schema MUST be versioned to support migrations
- Corrupted save data MUST be handled gracefully with fallback to new game
- Critical operations MUST implement optimistic updates with rollback capability

### Performance Benchmarks

- Time to interactive (TTI) MUST be under 3 seconds on target devices
- JavaScript bundle size MUST remain under 5MB (monitor with `expo build:web`)
- Re-renders per user action MUST be minimized via React.memo and useMemo
- Large lists MUST use FlatList with proper optimization (keyExtractor, getItemLayout)

### Code Style

- MUST follow Prettier configuration in `.prettierrc`
- MUST pass Expo lint rules (`npm run lint`)
- File naming: PascalCase for components, camelCase for utilities
- Folder structure MUST match the architectural layers defined in Principle V

## Development Workflow

### Feature Development

1. **Specification Phase**: Document feature in `/specs` with user stories and acceptance criteria
2. **Design Phase**: Define state changes, component structure, and data flow
3. **Implementation Phase**: 
   - Create/update type definitions first
   - Implement business logic in `/data` with unit tests (if testing required)
   - Update Context providers and hooks in `/context`
   - Build UI components in `/components`
   - Integrate in app routes (`/app`)
4. **Validation Phase**: Manual testing on iOS and Android simulators
5. **Review Phase**: Code review must verify adherence to all 5 Core Principles

### Commit Standards

- Commits MUST follow conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `perf`, `refactor`, `style`, `docs`, `chore`
- Scope should reference affected layer: `state`, `ui`, `logic`, `i18n`, `a11y`
- Examples:
  - `feat(ui): add administration card component`
  - `fix(state): correct dossier calculation on resume`
  - `perf(logic): optimize agent production loop`

### Testing Strategy (when tests are required)

- Business logic functions in `/data` SHOULD have unit tests
- Context state updates SHOULD have integration tests
- Critical user flows (e.g., purchase agent, unlock administration) SHOULD have E2E tests
- Performance regressions MUST be caught via manual testing on target devices

## Governance

### Constitution Authority

This constitution supersedes all other development practices and conventions. When conflicts arise between this document and other guidance, the constitution takes precedence.

### Amendment Process

1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Review**: Team discussion of trade-offs and alternatives
3. **Approval**: Consensus required for MAJOR changes; lead approval for MINOR/PATCH
4. **Migration**: Update all affected templates, documentation, and code
5. **Version Bump**: Increment version according to semantic versioning rules

### Versioning Policy

- **MAJOR** (X.0.0): Removing or fundamentally changing a core principle; breaking architectural changes
- **MINOR** (1.X.0): Adding new principle or section; expanding scope of existing principle
- **PATCH** (1.0.X): Clarifications, typo fixes, non-semantic refinements

### Compliance & Review

- All pull requests MUST verify compliance with Core Principles (I–V)
- Code reviews MUST explicitly check:
  - ✅ Performance implications (Principle I)
  - ✅ Code organization and maintainability (Principle II)
  - ✅ French language correctness (Principle III)
  - ✅ Accessibility standards (Principle IV)
  - ✅ Architectural boundaries respected (Principle V)
- Violations MUST be justified in PR description or rejected
- Complexity that violates principles MUST provide evidence of simpler alternatives being insufficient

### Continuous Improvement

- Constitution SHOULD be reviewed quarterly for relevance
- Metrics SHOULD be collected to validate performance and accessibility standards
- Team feedback SHOULD inform amendments to improve developer experience

---

**Version**: 1.0.0 | **Ratified**: 2025-01-21 | **Last Amended**: 2025-01-21
