---
description: Run the slow-correct rescue mission UI test
allowed-tools: [Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_wait_for, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_run_code, mcp__playwright__browser_take_screenshot]
---

# Slow Correct Rescue Mission UI Test

Test the path where all answers are correct but slow (over the 5-second target time).

## Setup

1. **Check if dev server is running**: Use Bash to check if port 5173 is already in use (`lsof -i :5173`)
2. **Start dev server if needed**: If nothing is listening, run `npm run dev` in the background using Bash
3. **Wait for server**: Poll `http://localhost:5173/` with `curl -s -o /dev/null -w '%{http_code}'` until it responds 200 (retry every 2 seconds, up to ~15 seconds)

## Test Steps

1. **Navigate** to http://localhost:5173/
2. **Wait** for loading to finish (wait for "Loading..." to disappear)
3. **Take a snapshot** to see the mission intro screen
4. **Verify** the mission intro is shown with an animal name and a "Help [name]!" button
5. **Click** the "Help [name]!" button to start the mission
6. **Answer the first problem manually** to verify the flow:
   - Read the problem text
   - Wait 6 seconds using `browser_wait_for` with `time: 6`
   - Type the correct answer, wait 500ms so it's visible, then submit
   - Verify feedback does NOT show sparkle animations (slow correct = no sparkles)
   - Click Continue
7. **Use `browser_run_code` to loop through remaining problems**:
   - For each problem: parse the math, wait 6 seconds with `page.waitForTimeout(6000)`, compute and fill the answer, then `await page.waitForTimeout(500)` so the answer is visible, then press Enter
   - Click Continue after each
   - Break when "Mission Complete" is detected
   - Track the total number of problems answered

## Expected Results

- Mission should require more problems than the fast-correct path (slow correct gives +1 progress, needs 16 total)
- All answers should be correct
- Zero answers should be "Fast & Correct"
- Zero sparkles should be earned this session
- The mission should still complete successfully

## Report

At the end, report a summary table with: Accuracy, Correct count, Fast & Correct count, Avg Time, Sparkles earned, and total problems presented. Also note whether the problem count matches expectations (16 problems for slow correct path with progressTarget=16).
