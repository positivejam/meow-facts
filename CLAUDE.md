# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meow Facts is a spaced repetition math practice app built with React, TypeScript, and Vite. It's deployed as a **PWA** (via `vite-plugin-pwa`) for offline-capable mobile use. It wraps an SM-2 spaced repetition algorithm in a rescue game narrative where players help animals (kittens, puppies, snails) by solving math problems. The companion character "Sunshine" (a black cat) provides encouraging dialogue throughout.

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Lint the codebase
npm run lint

# Preview production build
npm run preview

# Run all tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (for CI)
npm run test:run

# Run a single test file
npm run test -- src/components/Game.test.tsx

# Run tests matching a pattern
npm run test -- -t "shows mission intro"
```

## Testing

- **Test runner**: Vitest with React Testing Library
- **Test location**: Colocated with components (e.g., `Game.test.tsx` next to `Game.tsx`)
- **Testing philosophy**: Test user-visible behavior, not internal component state
- **Test environment**: jsdom with fake-indexeddb for realistic IndexedDB simulation
- **Debugging**: VS Code launch configurations in `.vscode/launch.json` for debugging tests
- **Performance**: Tests use `userEvent.setup({ delay: null })` to remove typing delays
- **Database cleanup**: `Game.test.tsx` handles its own `afterEach` cleanup with `db.close()` to prevent race conditions with IndexedDB. Other test files rely on the global cleanup in `src/test/setup.ts`.

## Architecture

### Core System Flow

1. **Fact Charts & Card Generation** (`factChart.ts`, `cardGenerator.ts`): Each operation has an 11×11 chart of facts (0–10); cards are generated for the chart facts selected in Settings
2. **Spaced Repetition** (`spacedRepetition.ts`): Implements SM-2 algorithm to:
   - Update card difficulty (easeFactor) based on correctness and response time
   - Select which cards to show (prioritizes struggling cards and overdue reviews)
   - Track intervals, repetitions, and next review times
3. **Storage** (`storage-dexie.ts`): Persists card progress, settings, rescue missions, and sparkles to IndexedDB using Dexie
4. **Rescue Game** (`rescue.ts`, `sunshine.ts`, `sparkles.ts`): Wraps spaced repetition in narrative layer
5. **Game State** (`Game.tsx`): Orchestrates the session flow, manages card state, and coordinates rescue missions
6. **Types** (`types/game.ts`): Centralized type definitions for all game entities (cards, missions, settings, dialogue)

### Spaced Repetition Logic

The app uses a modified SM-2 algorithm that considers both correctness and speed:

- **Quality scoring (0-5)**: Incorrect = 0, Correct = 2-5 based on response time vs target time
- **Ease factor**: Increases for fast correct answers, decreases for slow/incorrect answers (min 1.3)
- **Intervals**: 0 days (incorrect) → 1 day → 6 days → interval * easeFactor, capped at `MAX_INTERVAL_DAYS` (180)
- **One advance per mission**: only a card's first answer in a mission (tracked by `mission.problemsInMission`, kept across "Try Again") can lengthen its interval. Correct repeats still earn rescue progress and sparkles but leave the schedule alone; an incorrect repeat still resets the card. Without this, a fact repeated 8 times in one mission was "mastered" for decades
- **Card selection**: Prioritizes overdue cards with low ease factors (struggling facts), then fills remaining slots with new cards. If only a few cards are due, the session is topped up to `cardsPerSession` with `selectBonusCards` picks (soonest due, least recently practiced), so a mission never loops one fact. With nothing due, selection is empty and the player sees All Caught Up

### Fact Charts and Settings

Each operation has a fixed chart (`CHART_MAX = 10` in `src/constants.ts`), laid out by `factChart.ts`:
- Row r, column c holds `r + c` (addition) or `(r + c) − c` (subtraction), so each addition fact shares a cell with its subtraction partner. 121 facts per operation: `0 + 0`…`10 + 10` and `0 − 0`…`20 − 10`
- **Diagonals** (constant r + c, numbered 0–20) group facts with the same sum (addition) or minuend (subtraction)
- `FactChart.tsx` renders the chart for both Settings (editable) and the Progress page (read-only). Wide charts show stacked full facts; narrow charts (phones) show one number per cell (sum, or minuend for subtraction) with row/column headers. The switch is a CSS container query on the chart's own width; there's no horizontal scrolling

Selection lives in settings, separately from card progress:
- `enabledFacts`: card IDs selected per operation (`{ addition: string[]; subtraction: string[] }`), each operation independent
- In Settings: tap = toggle one fact; double tap (same cell within 350 ms) = toggle its diagonal; Enter / Shift+Enter do the same from the keyboard
- Diagonal rule: fully on → all off; fully off or partially on → all on. A double tap applies this to the selection from *before* its first tap
- With nothing selected, Start Practice is disabled (and Game sends the player to Settings if a stored selection is empty)
- `settings.ts` `normalizeSettings()` runs on load: it fills defaults and converts pre-chart settings (`enabledNumbers` + `maxNumber`) to the chart facts they used to practice, then drops those fields. No Dexie schema change was needed
- Changing settings regenerates the card deck but preserves existing progress for matching cards

### Data Persistence

**Storage System**: Migrated from localStorage to IndexedDB using Dexie (v4.2.1)

**Database schema** (`db.ts`):
- `cards` table: Card progress (id, easeFactor, interval, repetition, nextReview, lastReview, totalAttempts)
- `sessions` table: Game session history
- `settings` table: User settings (singleton key, operation, enabledFacts, cardsPerSession, targetTime)
- `missions` table: Completed rescue missions (indexed by completedAt)
- `currentMissionData` table: Active mission state (singleton)
- `unlockStatusData` table: Unlocked animals/locations (singleton)
- `sparklesData` table: Sparkles earned (singleton key, total, lastUpdated)

**Card ID format**: `{operation}-{operand1}-{operand2}` (e.g., `addition-3-5`)

**Important**: When card settings change, cards are merged by ID. Existing progress is preserved for matching cards, new cards start fresh.

### Rescue Game Mechanics

**Mission Flow**:
1. Mission intro with animal name, problem, and Sunshine introducing the mission
2. Player solves math problems
3. Progress tracked: `progress` accumulates based on answer quality (+2 for fast correct, +1 for slow correct)
4. Animal visual state changes: `needs-help` → `improving` (at `MISSION_LIMITS.improvingThreshold`) → `rescued` (at `MISSION_LIMITS.progressTarget`)
5. Mission completes when progress ≥ `MISSION_LIMITS.progressTarget` OR totalAttempts ≥ `MISSION_LIMITS.maxAttempts`

**Mission Limits** (configurable in `src/constants.ts`):
- `progressTarget`: 16 - Progress needed to complete mission successfully (e.g., 8 fast correct at +2 each, or 16 slow correct at +1 each)
- `improvingThreshold`: 4 - Progress at which animal state changes to "improving"
- `maxAttempts`: 20 - Mission ends after this many attempts

**Progress Calculation**:
- Fast correct answer (<= targetTime): +2 progress, +1 sparkle
- Slow correct answer (> targetTime): +1 progress
- Incorrect answer: +0 progress
- Mission success: progress ≥ `MISSION_LIMITS.progressTarget`

**Sparkles System**:
- Awarded 1 sparkle per fast correct answer
- Persists across sessions in IndexedDB
- Currently accumulation-only (no spending system in MVP)

**Mastery & Progress Page** (`mastery.ts`, `ProgressPage.tsx`):
- Each fact gets a color from its review interval (`MASTERY_INTERVAL_DAYS`): grey = never attempted, red < 1 day, yellow 1–5, green 6–13, blue ≥ 14 (mastered). Based on interval, not due date, so blue facts don't fade while waiting for review
- The Progress page shows each operation's chart in these colors (facts not selected in Settings are faded), plus a bar with the % of *selected* facts that are blue
- After a mission, `useNewlyMasteredFacts` compares against a pre-mission snapshot and `MasteredFactsBadge` celebrates facts that turned blue. A fact that loses blue and earns it back in a later mission is celebrated again

**Sunshine Dialogue**:
- Companion character provides context-aware encouragement
- Different dialogue types: intro, fast-correct, slow-correct, incorrect, rescue-complete, facts-mastered
- Multiple phrases per type for variety (randomized selection)

**All Caught Up State**:
- Shown when no cards have `nextReview` dates in the past
- Offers bonus practice (random selection) or settings adjustment
- Displays next review time if available

## TypeScript Configuration

Three tsconfig files for different contexts:
- `tsconfig.json`: Base configuration
- `tsconfig.app.json`: App source code configuration
- `tsconfig.node.json`: Node/build tool configuration (Vite config, etc.)

## Common Patterns

### Handling Date.now() in Components

When ESLint `react-hooks/purity` flags `Date.now()`:
- Add `// eslint-disable-next-line react-hooks/purity` above the line
- This is the idiomatic solution for legitimate time-based calculations
- Wrapping in `useMemo` doesn't satisfy the linter for this rule
