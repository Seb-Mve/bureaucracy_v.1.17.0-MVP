# Feature Specification: Conformité Aléatoire System and Hidden Narrative Layer

**Feature Branch**: `001-conformite-narrative`  
**Created**: 2025-01-21  
**Status**: Draft  
**Input**: User description: "Implement missing Phase 1 features: Conformité Aléatoire system with hidden narrative elements (S.I.C. messages, rare notifications) and Phase 2 transition UI for BUREAUCRACY++ idle game"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discovering the Conformité System (Priority: P1)

A player who has been enjoying the idle game mechanics suddenly notices a new mysterious stat appearing in their interface after reaching 1000 tampons and 100 formulaires. They see "Conformité aléatoire: 12%" displayed and a button labeled "Réaliser un test de conformité" that costs 150 formulaires. Curious about this new system, they click the button and watch their conformité percentage slowly increase. They notice it also increases passively as they produce more formulaires, creating a new long-term goal to reach 100%.

**Why this priority**: This is the core mechanic that creates the "conceptual trap" and drives player curiosity. Without this, the entire narrative layer fails. It's the foundation for Phase 2 transition.

**Independent Test**: Can be fully tested by playing the game to 1000 tampons + 100 formulaires, observing the conformité stat appearance, clicking the test button (costs 150 formulaires), and verifying passive progression (+1% per 150 formulaires produced). Delivers a complete new progression system independent of other features.

**Acceptance Scenarios**:

1. **Given** a new player with 0 resources, **When** they check their game interface, **Then** the conformité system is completely hidden (no stat, no button visible)
2. **Given** a player with 999 tampons and 100 formulaires, **When** they check their interface, **Then** conformité remains hidden
3. **Given** a player who just reached 1000 tampons and 100 formulaires, **When** the game updates, **Then** "Conformité aléatoire: 0%" appears in the interface with a "Réaliser un test de conformité" button
4. **Given** a player with conformité visible and 200 formulaires, **When** they click "Réaliser un test de conformité", **Then** 150 formulaires are deducted and conformité increases immediately
5. **Given** a player has produced 150 formulaires since last conformité increase, **When** the game calculates production, **Then** conformité automatically increments by +1%
6. **Given** a player at 99% conformité, **When** they gain the final +1%, **Then** conformité displays "100%" and the "Réaffectation différée" button becomes active

---

### User Story 2 - Encountering Hidden Narrative Messages (Priority: P2)

While playing the idle game and managing their bureaux, a player occasionally sees strange messages mentioning "S.I.C." (Service Inconnu de Coordination) appear in their game logs or notifications. Messages like "Ce dossier a été transféré au S.I.C." or "Le S.I.C. a validé cette procédure" appear randomly but infrequently. The player becomes curious about this mysterious service but the game provides no direct explanation, creating an atmosphere of intrigue.

**Why this priority**: These messages add the narrative mystery layer but are not critical for gameplay functionality. They enhance the "conceptual trap" experience by creating questions in the player's mind. Can be implemented after core conformité system.

**Independent Test**: Can be tested by triggering various game events (production milestones, agent purchases, etc.) and verifying that S.I.C. messages appear randomly with appropriate frequency. Delivers atmospheric storytelling independent of the conformité mechanic.

**Acceptance Scenarios**:

1. **Given** a player producing resources normally, **When** certain production thresholds are crossed, **Then** there is a 10-15% chance a S.I.C. message appears
2. **Given** a S.I.C. message has just appeared, **When** another triggering event occurs within 5 minutes, **Then** the message probability is reduced to 2% to avoid spam
3. **Given** a player views a S.I.C. message, **When** they read it, **Then** the message uses French bureaucratic language and mentions "S.I.C." without explaining what it is
4. **Given** a player has been playing for 30 minutes without a S.I.C. message, **When** the next triggering event occurs, **Then** probability increases to ensure messages appear occasionally

---

### User Story 3 - Rare Conformity Violation Notifications (Priority: P3)

Very occasionally, a player receives an unexpected notification: "Tampon non conforme détecté – Niveau 0". This message appears seemingly at random, with no clear pattern, and has no visible effect on their gameplay. The player might wonder if their stamps are being rejected or if there's a hidden quality system, adding to the mysterious atmosphere without punishing them.

**Why this priority**: This is pure atmospheric flavor that reinforces the surveillance/bureaucracy theme. It has zero gameplay impact and serves only to deepen the mystery. Lowest priority but adds polish to the narrative experience.

**Independent Test**: Can be tested by monitoring production over extended play sessions and verifying the notification appears at the correct rarity level (approximately 1 in 500 tampon productions). Delivers narrative flavor independently.

**Acceptance Scenarios**:

1. **Given** a player producing tampons normally, **When** a tampon is produced, **Then** there is a 0.2% chance (1 in 500) of triggering the "Tampon non conforme" notification
2. **Given** the notification appears, **When** the player reads it, **Then** it displays "Tampon non conforme détecté – Niveau 0" with no gameplay consequences
3. **Given** the notification has appeared, **When** the player continues playing, **Then** their production rates and resources remain unchanged (purely cosmetic notification)
4. **Given** a player with very high tampon production (10+ per second), **When** notifications trigger, **Then** they are rate-limited to a maximum of one per 10 minutes to avoid spam

---

### User Story 4 - Phase 2 Transition Discovery (Priority: P1)

A player notices a grayed-out button labeled "Réaffectation différée" in their interface. It appears inactive and mysterious. As they progress through the conformité system and finally reach 100%, the button lights up and becomes clickable. When clicked, they receive a vague, bureaucratic notification: "Votre niveau de conformité a été jugé satisfaisant. Une réaffectation de niveau supérieur pourrait être envisagée..." This creates anticipation for what comes next without immediately revealing Phase 2 content.

**Why this priority**: This is critical for player retention and Phase 2 transition. It provides a clear goal (reach 100% conformité) and creates curiosity about what happens next. Must be implemented alongside conformité system as they are tightly coupled.

**Independent Test**: Can be tested by setting conformité to various percentages (0%, 50%, 99%, 100%) and verifying button states (grayed out vs active) and notification behavior. Delivers a complete goal-setting and achievement mechanic.

**Acceptance Scenarios**:

1. **Given** a player with 0-99% conformité, **When** they view the interface, **Then** the "Réaffectation différée" button is visible but grayed out (inactive state)
2. **Given** a player clicks the grayed-out button, **When** conformité is below 100%, **Then** nothing happens (button is non-interactive)
3. **Given** a player reaches exactly 100% conformité, **When** the interface updates, **Then** the "Réaffectation différée" button becomes active (normal button appearance)
4. **Given** a player with 100% conformité clicks the button, **When** the action processes, **Then** a notification appears: "Votre niveau de conformité a été jugé satisfaisant. Une réaffectation de niveau supérieur pourrait être envisagée..."
5. **Given** the notification is dismissed, **When** the player checks their interface, **Then** the button remains visible and active (can be clicked again, though future Phase 2 implementation will handle actual transition)

---

### User Story 5 - Bureau Name Correction (Priority: P3)

A player exploring different departments notices that one administration is named "Administration Centrale" which feels generic. After the update, this bureau is renamed to "Bureau des Documents Obsolètes" which better fits the absurdist bureaucratic theme and adds flavor to the game world.

**Why this priority**: This is a simple text change that improves thematic consistency but has zero gameplay impact. Lowest priority, can be done quickly as a minor polish task.

**Independent Test**: Can be tested by checking the first administration's name displays correctly in all UI locations (administration cards, navigation, game data). Delivers improved thematic consistency.

**Acceptance Scenarios**:

1. **Given** a player views their available administrations, **When** they look at the first administration, **Then** it displays "Bureau des Documents Obsolètes" instead of "Administration Centrale"
2. **Given** a player has the first administration active, **When** they check the interface header or navigation, **Then** all references show "Bureau des Documents Obsolètes"
3. **Given** the game loads saved data from before the rename, **When** it initializes, **Then** the administration ID remains unchanged (for save compatibility) but the display name updates to "Bureau des Documents Obsolètes"

---

### Edge Cases

- **What happens when a player loads an old save file created before the conformité system existed?** The system should initialize conformité at 0% and hide it until they reach the 1000 tampons + 100 formulaires threshold, treating them as a new player for this feature.

- **What happens if a player has enough formulaires to click "Réaliser un test de conformité" multiple times rapidly?** The button should debounce or disable briefly after each click to prevent accidental spam-clicking, with appropriate visual feedback.

- **What happens when conformité reaches exactly 100% through passive progression?** The system should immediately activate the "Réaffectation différée" button and potentially show a subtle notification that conformité is complete.

- **How does the system handle edge cases where tampons/formulaires counts decrease (if refund/consumption mechanics exist)?** Conformité unlock should be based on "lifetime total produced" or "highest achieved" rather than current counts to prevent the stat from disappearing if resources are spent.

- **What happens if S.I.C. message generation conflicts with other important game notifications?** S.I.C. messages should have lower priority than gameplay-critical notifications (purchases, unlocks) and should queue or defer if the notification system is busy.

- **What happens if a player reaches 100% conformité but hasn't yet unlocked all Phase 1 content?** The Phase 2 transition button should be active (as conformité is the gate), but ideally there should be narrative acknowledgment that they're advancing quickly.

- **How does the rare "Tampon non conforme" notification behave if the player has notifications disabled?** It should still trigger for tracking purposes but not display, or display only in a non-intrusive log that can be reviewed later.

- **What happens if the player force-quits the app during a conformité test action?** The formulaires cost should be persisted atomically with the conformité increase to prevent resource loss or gain exploits.

- **What happens when conformité passive progression would increase it above 100%?** The system should cap at exactly 100% and not overflow or wrap around.

## Requirements *(mandatory)*

### Functional Requirements

#### Conformité System Core

- **FR-001**: System MUST add a hidden "conformité aléatoire" percentage stat to the game state (0-100%, stored as integer or float)
- **FR-002**: System MUST hide the conformité stat and button until player reaches both 1000 tampons AND 100 formulaires (inclusive thresholds)
- **FR-003**: System MUST display "Conformité aléatoire: X%" in the game interface when unlocked, with percentage value visible to player
- **FR-004**: System MUST provide a "Réaliser un test de conformité" button that costs 150 formulaires when clicked
- **FR-005**: System MUST increment conformité by a fixed amount when player clicks test button and has sufficient formulaires (exact increment amount TBD based on balance testing, estimated +2-5%)
- **FR-006**: System MUST automatically increment conformité by +1% for every 150 formulaires produced (passive progression tracking lifetime production)
- **FR-007**: System MUST persist conformité value across app sessions using AsyncStorage
- **FR-008**: System MUST track total formulaires produced (lifetime counter) separate from current formulaires count to enable passive progression
- **FR-009**: System MUST prevent conformité from exceeding 100% (hard cap)

#### Narrative Message System

- **FR-010**: System MUST randomly generate S.I.C. (Service Inconnu de Coordination) messages with probability between 10-15% on production milestone triggers
- **FR-011**: System MUST include minimum 5 distinct S.I.C. message variants using French bureaucratic language (e.g., "Ce dossier a été transféré au S.I.C.", "Le S.I.C. a validé cette procédure")
- **FR-012**: System MUST reduce S.I.C. message probability to <5% if a message appeared within the last 5 minutes (cooldown to prevent spam)
- **FR-013**: System MUST trigger rare "Tampon non conforme détecté – Niveau 0" notification with approximately 0.2% (1 in 500) probability per tampon produced
- **FR-014**: System MUST rate-limit non-conformity notifications to maximum 1 per 10 minutes regardless of production rate
- **FR-015**: Narrative messages MUST NOT affect gameplay mechanics, resources, or production rates (purely cosmetic)

#### Phase 2 Transition UI

- **FR-016**: System MUST display a "Réaffectation différée" button in the game interface (location TBD - recommend near conformité display)
- **FR-017**: Button MUST appear grayed out (inactive/disabled visual state) when conformité is 0-99%
- **FR-018**: Button MUST become active (normal interactive state) when conformité reaches exactly 100%
- **FR-019**: When button is clicked at 100% conformité, System MUST display notification: "Votre niveau de conformité a été jugé satisfaisant. Une réaffectation de niveau supérieur pourrait être envisagée..."
- **FR-020**: Button MUST remain non-functional for conformité below 100% (clicks should be ignored or show tooltip explaining requirement)

#### Minor Fixes

- **FR-021**: System MUST rename the administration with id 'administration-centrale' from "Administration Centrale" to "Bureau des Documents Obsolètes" in all UI locations
- **FR-022**: Rename MUST preserve the administration ID 'administration-centrale' for save data compatibility

### Accessibility Requirements (Constitutional - Principle IV)

- **AR-001**: "Réaliser un test de conformité" button MUST have minimum 44×44pt touch target
- **AR-002**: "Réaffectation différée" button MUST have minimum 44×44pt touch target
- **AR-003**: Grayed-out (inactive) button state MUST use sufficient contrast reduction to be visually distinguishable while maintaining minimum 3:1 contrast ratio with background
- **AR-004**: Active state of "Réaffectation différée" button MUST have clear visual indicator (color change, border, or brightness increase)
- **AR-005**: Conformité percentage display MUST have accessibility label: "Conformité aléatoire: X pourcent" for screen readers
- **AR-006**: All buttons MUST have descriptive accessibility labels in French (e.g., "Réaliser un test de conformité. Coûte cent cinquante formulaires")
- **AR-007**: S.I.C. messages MUST be readable by screen readers with proper French pronunciation hints
- **AR-008**: Non-conformity notification MUST have accessibility label: "Tampon non conforme détecté. Niveau zéro. Notification informative uniquement."

### Localization Requirements (Constitutional - Principle III)

- **LR-001**: All conformité-related text MUST be in French with proper accents: "Conformité aléatoire", "Réaliser un test de conformité", "Réaffectation différée"
- **LR-002**: Conformité percentage MUST display using French formatting: "45%" (percentage symbol directly after number, no space)
- **LR-003**: S.I.C. messages MUST use authentic French bureaucratic terminology and formal register
- **LR-004**: Notification text MUST follow French bureaucratic style: formal, passive voice, unnecessarily complex phrasing where thematically appropriate
- **LR-005**: "Bureau des Documents Obsolètes" MUST use proper French capitalization rules (capital B for Bureau, lowercase for "des")

### Key Entities

- **Conformité State**: Represents the player's mysterious "compliance" level with the hidden bureaucratic system
  - Attributes: percentage value (0-100), unlock status (boolean), lifetime formulaires count
  - Relationships: Unlocked by tampon + formulaire thresholds, increased by test button and passive production
  - Persistence: Stored in AsyncStorage alongside other game state

- **S.I.C. Message**: A narrative text snippet that references the mysterious "Service Inconnu de Coordination"
  - Attributes: message text (string), trigger probability, cooldown timer
  - Relationships: Triggered by production events, displayed through notification system
  - No persistence needed (ephemeral messages)

- **Non-Conformity Notification**: A rare notification indicating stamp quality issues
  - Attributes: fixed message text, trigger probability (0.2%), cooldown timer (10 minutes)
  - Relationships: Triggered by tampon production events
  - No persistence needed beyond cooldown tracking

- **Phase Transition Button**: UI element that gates access to Phase 2 content
  - Attributes: active state (boolean derived from conformité >= 100%), notification text
  - Relationships: Enabled by conformité reaching 100%, triggers Phase 2 notification
  - State is derived, not persisted separately

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players who reach 1000 tampons + 100 formulaires can see the conformité stat appear within 1 game update cycle (within 0.1 seconds of threshold being crossed)

- **SC-002**: Players can progress from 0% to 100% conformité through normal idle gameplay over approximately 4-6 hours of active play at average production rates (15,000 formulaires total requirement)

- **SC-003**: S.I.C. messages appear frequently enough to create atmosphere (player sees 2-3 messages per 30-minute play session on average) without feeling spammy

- **SC-004**: 95% of conformité button clicks complete within 100ms (deduct resources + update percentage + save to AsyncStorage)

- **SC-005**: Rare notifications appear at correct frequency (approximately 1 "Tampon non conforme" message per 2,500 tampons produced over long-term averages)

- **SC-006**: All conformité-related UI elements meet minimum touch target size (44×44pt) for mobile accessibility

- **SC-007**: Game state persists correctly: player who reaches 50% conformité, closes app, and reopens sees exactly 50% conformité restored

- **SC-008**: Phase 2 transition button becomes active within 1 second of conformité reaching 100%

- **SC-009**: System handles rapid clicking: player clicking "Réaliser un test de conformité" 10 times in 2 seconds correctly deducts resources only for successful purchases (when formulaires >= 150)

- **SC-010**: All French text displays correctly with proper accents on all devices (no character encoding issues)

- **SC-011**: "Bureau des Documents Obsolètes" rename appears in all UI locations (minimum 2 locations: administration card + navigation/header)

- **SC-012**: Players report feeling curious about the conformité system and S.I.C. messages in qualitative playtesting (mystery achieved without frustration)

## Assumptions

- **Assumption 001**: The game currently has a notification/message display system that can show text messages to players. If not, a basic notification component will need to be implemented as part of this feature.

- **Assumption 002**: The game state structure can be extended to add new properties (conformité, lifetime formulaires) without breaking existing save data. Migration strategy may be needed.

- **Assumption 003**: Players will discover the conformité system through natural progression and exploration rather than explicit tutorials or tooltips. This aligns with the "mysterious but not punishing" design goal.

- **Assumption 004**: The 15,000 formulaires requirement for 100% conformité (150 formulaires per +1% × 100) is balanced for Phase 1 completion timeframe. This may need adjustment based on playtesting.

- **Assumption 005**: The cost of 150 formulaires for manual conformité tests is balanced to feel meaningful but not prohibitive. Players at the unlock threshold (100 formulaires) cannot immediately spam the button.

- **Assumption 006**: S.I.C. message trigger points are production milestones (e.g., every 100 dossiers, every 50 tampons). Exact trigger definition will be determined during implementation.

- **Assumption 007**: The game loop runs at sufficient frequency (at least 1Hz) to detect production thresholds and trigger passive conformité progression without significant delays.

- **Assumption 008**: Phase 2 content is not part of this specification. The "Réaffectation différée" button only needs to display a notification in this phase. Actual Phase 2 transition logic will be implemented later.

- **Assumption 009**: The 1000 tampons + 100 formulaires unlock threshold is achievable within the first 1-2 hours of gameplay for average players, providing timely introduction of the mystery layer.

- **Assumption 010**: The rare "Tampon non conforme" notification will not cause player confusion or concern. If playtesting shows anxiety, we may need to adjust messaging or add subtle reassurance that it has no negative effect.

## Dependencies

- **External**: None (all features are self-contained within the game)
- **Internal**: 
  - Requires existing game state management system (GameStateContext)
  - Requires existing resource tracking (tampons, formulaires counts)
  - Requires existing production calculation system (to track lifetime formulaires)
  - May require basic notification/toast component if not already implemented

## Out of Scope

- Phase 2 gameplay mechanics and content (only transition setup is in scope)
- Detailed explanation or tutorial for conformité system (mystery is intentional)
- Multiplayer or social features related to conformité
- Analytics tracking for conformité progression
- Achievement system integration
- Sound effects or haptic feedback for conformité events
- Localization to languages other than French
- Backend synchronization or cloud save for conformité progress
- A/B testing different conformité progression rates

## Open Questions for Future Consideration

None at this time. All critical design decisions have been specified or documented as assumptions. If clarifications are needed during implementation, they should be documented in the planning phase.
