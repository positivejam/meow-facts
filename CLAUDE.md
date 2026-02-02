# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meow Facts is a spaced repetition math practice app built with React, TypeScript, and Vite. It wraps an SM-2 spaced repetition algorithm in a rescue game narrative where players help animals (kittens, puppies) by solving math problems. The companion character "Sunshine" (a black cat) provides encouraging dialogue throughout.

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

1. **Card Generation** (`cardGenerator.ts`): Generates all possible math facts based on operation, max number, and enabled numbers filter
2. **Spaced Repetition** (`spacedRepetition.ts`): Implements SM-2 algorithm to:
   - Update card difficulty (easeFactor) based on correctness and response time
   - Select which cards to show (prioritizes struggling cards and overdue reviews)
   - Track intervals, repetitions, and next review times
3. **Storage** (`storage-dexie.ts`): Persists card progress, settings, rescue missions, and sparkles to IndexedDB using Dexie
4. **Rescue Game** (`rescue.ts`, `sunshine.ts`, `sparkles.ts`): Wraps spaced repetition in narrative layer
5. **Game State** (`Game.tsx`): Orchestrates the session flow, manages card state, and coordinates rescue missions

### Spaced Repetition Logic

The app uses a modified SM-2 algorithm that considers both correctness and speed:

- **Quality scoring (0-5)**: Incorrect = 0, Correct = 2-5 based on response time vs target time
- **Ease factor**: Increases for fast correct answers, decreases for slow/incorrect answers (min 1.3)
- **Intervals**: 0 days (incorrect) → 1 day → 6 days → interval * easeFactor
- **Card selection**: Prioritizes overdue cards with low ease factors (struggling facts), then fills remaining slots with new cards

### Settings and Filtering

Settings are stored separately from card progress:
- `enabledNumbers`: Array of numbers to practice (e.g., `[0, 1, 2]` for learning 0s, 1s, 2s tables)
- Cards are filtered to include facts where **at least one operand** is in the enabled set
- Changing settings regenerates the card deck but preserves existing progress for matching cards

### Data Persistence

**Storage System**: Migrated from localStorage to IndexedDB using Dexie (v4.2.1)

**Database schema** (`db.ts`):
- `cards` table: Card progress (id, easeFactor, interval, repetition, nextReview, lastReview, totalAttempts)
- `sessions` table: Game session history
- `settings` table: User settings (singleton key, operation, enabledNumbers, maxNumber, targetTime)
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
- `progressTarget`: 10 - Progress needed to complete mission successfully
- `improvingThreshold`: 4 - Progress at which animal state changes to "improving"
- `maxAttempts`: 15 - Mission ends after this many attempts

**Progress Calculation**:
- Fast correct answer (<= targetTime): +2 progress, +1 sparkle
- Slow correct answer (> targetTime): +1 progress
- Incorrect answer: +0 progress
- Mission success: progress ≥ `MISSION_LIMITS.progressTarget`

**Sparkles System**:
- Awarded 1 sparkle per fast correct answer
- Persists across sessions in IndexedDB
- Currently accumulation-only (no spending system in MVP)

**Sunshine Dialogue**:
- Companion character provides context-aware encouragement
- Different dialogue types: intro, fast-correct, slow-correct, incorrect, rescue-complete
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

### Fact Count Calculation

Settings uses `symmetricCartesianProduct()` to calculate total facts:
- Takes two sets: `zeroToMaxNumArray` (0 to maxNumber) and `currentChecked` (selected checkboxes)
- Creates all unique pairs including reverse order (e.g., both 3+5 and 5+3)
- Removes duplicates (e.g., 5+5 appears once)
- Example: checkboxes [0,5] with maxNumber=5 → 20 unique facts

### Handling Date.now() in Components

When ESLint `react-hooks/purity` flags `Date.now()`:
- Add `// eslint-disable-next-line react-hooks/purity` above the line
- This is the idiomatic solution for legitimate time-based calculations
- Wrapping in `useMemo` doesn't satisfy the linter for this rule
