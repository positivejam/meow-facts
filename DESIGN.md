# Design Goals

## High-Level Goal

This is a **gamified math-facts practice app** for a child that builds **automaticity** (fast recall) rather than procedural strategies (e.g., counting), while remaining **emotionally safe, cozy, and motivating**.

The app should feel like *helping and caring*, not testing or drilling.

## Core Design Philosophy

1. **Math is fuel, not the challenge**
   Math problems power progress in the game world. They are never framed as obstacles, tests, or gates.

2. **Speed matters, but failure does not**
   Fast answers are encouraged and rewarded, but slow correct answers are still successful. Nothing bad ever happens for being slow.

3. **Positive-only reinforcement**
   There are no punishments, lives, resets, or visible failure states. The only difference between fast and slow answers is *how much celebration you get*.

4. **Emotional safety first**
   The game avoids timers, countdowns, red indicators, or comparative scores. Urgency exists, but it is environmental and subtle.

5. **Choice without risk**
   Players choose how to help animals or decorate spaces, but all choices are good. There are no wrong decisions.

## Game Fantasy / Setting

* The player helps care for **rescued animals** (kitten, puppy, snail, etc.).
* The setting is a **home and yard**—safe, familiar, and cozy.
* The player has a companion: a **black cat named Sunshine**.

Sunshine:

* Narrates the experience
* Encourages gently
* Normalizes mistakes
* Models calm thinking
* Acts as the emotional guide, not a judge

## Core Game Loop

1. Sunshine introduces a need
   (“The kitten is a little cold. Want to help?”)

2. Player answers a set of math fact questions

3. On every correct answer:

   * The animal’s need improves
   * The environment visibly gets better

4. If the answer is **fast**:

   * The player earns **bonus sparkles**
   * Sparkles trigger extra celebration and cosmetic rewards

5. Player spends earned progress:

   * Improving animal comfort
   * Decorating the house or yard
   * Triggering fun Sunshine reactions

6. Repeat with gentle variation

## Sparkles System (Speed Without Pressure)

* **Sparkles are bonus-only rewards** for fast correct answers.
* Sparkles are never required to:

  * Feed animals
  * Heal animals
  * Unlock new rescues

Sparkles unlock:

* Decorations
* Fun animations
* Cosmetic variations
* Delight, not progress

Effect:

* Fast recall feels better
* Counting strategies become inefficient
* Automaticity is naturally reinforced

## Handling Mistakes and Slow Answers

* Incorrect answers:

  * No penalty
  * Calm encouragement
  * Immediate retry or gentle reframing

* Slow but correct answers:

  * Reduced celebration (no sparkles)
  * Supportive language (“Nice thinking”)

## Progression Model

* Progress is visible and cumulative:

  * Animals move through emotional states (e.g., cold → cozy)
  * The environment fills in and becomes more lively

* New animals or areas unlock only after existing ones are cared for

* This is a **fluency engine disguised as a nurturing game**.

## MVP Scope (Conceptual)

* Small set of rescue animals
* One or two locations
* One set of math operations at a time
* Immediate visual feedback
* Sparkles as the only speed-based differentiator

## Design North Star

> “Fast answers feel magical. Slow answers still feel good.”

If the child wants to keep playing, the system is working.
