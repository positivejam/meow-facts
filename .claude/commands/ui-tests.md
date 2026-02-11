---
description: Run all UI test scenarios for Meow Facts
allowed-tools: [Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_wait_for, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_run_code, mcp__playwright__browser_take_screenshot, Task]
---

# UI Test Suite

Run all Playwright UI tests for the Meow Facts app.

## Setup

1. **Check if dev server is running**: Use Bash to check if port 5173 is already in use (`lsof -i :5173`)
2. **Start dev server if needed**: If nothing is listening, run `npm run dev` in the background using Bash
3. **Wait for server**: Poll `http://localhost:5173/` with `curl -s -o /dev/null -w '%{http_code}'` until it responds 200 (retry every 2 seconds, up to ~15 seconds)

## Tests to Run

Run each test sequentially. Between tests, navigate back to the app root to start fresh.

### Test 1: Fast Correct Path

Test the happy path where all answers are fast and correct.

1. Navigate to http://localhost:5173/
2. Wait for loading, then start the rescue mission
3. Answer every math problem correctly with no delay
4. Use `browser_run_code` to loop: parse each problem, compute the answer, fill the textbox, wait 500ms so the answer is visible, then press Enter, click Continue
5. Stop when "Mission Complete" appears
6. Record: accuracy, correct count, fast & correct count, sparkles earned, total problems

### Test 2: Slow Correct Path

Test the path where all answers are correct but slow.

1. Navigate to http://localhost:5173/
2. Wait for loading, then start the rescue mission
3. For every math problem, wait 6 seconds (using `page.waitForTimeout(6000)` in `browser_run_code`), fill the correct answer, wait 500ms so the answer is visible, then press Enter
4. Click Continue after each answer
5. Stop when "Mission Complete" appears
6. Record: accuracy, correct count, fast & correct count, sparkles earned, total problems

## Combined Report

After both tests complete, present a combined summary table:

| Metric | Fast Correct | Slow Correct |
|--------|-------------|-------------|
| Accuracy | | |
| Correct | | |
| Fast & Correct | | |
| Avg Time | | |
| Sparkles | | |
| Total Problems | | |

Also note any unexpected behavior or failures.
