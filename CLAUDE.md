# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meow Facts is a spaced repetition math practice app built with React, TypeScript, and Vite. It helps users practice math facts (addition, subtraction, multiplication, division) using a spaced repetition algorithm based on SM-2.

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
```

## Architecture

### Core System Flow

1. **Card Generation** (`cardGenerator.ts`): Generates all possible math facts based on operation, max number, and enabled numbers filter
2. **Spaced Repetition** (`spacedRepetition.ts`): Implements SM-2 algorithm to:
   - Update card difficulty (easeFactor) based on correctness and response time
   - Select which cards to show (prioritizes struggling cards and overdue reviews)
   - Track intervals, repetitions, and next review times
3. **Storage** (`storage.ts`): Persists card progress and settings to localStorage
4. **Game State** (`Game.tsx`): Orchestrates the session flow and manages all card state

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

Two localStorage keys:
- `meow-facts-progress`: Card progress (easeFactor, intervals, attempts, etc.)
- `meow-facts-settings`: User settings (operation, enabledNumbers, targetTime, etc.)

Progress persists across sessions; changing settings filters the existing progress rather than clearing it.

## TypeScript Configuration

Three tsconfig files for different contexts:
- `tsconfig.json`: Base configuration
- `tsconfig.app.json`: App source code configuration
- `tsconfig.node.json`: Node/build tool configuration (Vite config, etc.)
