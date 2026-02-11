---
description: Run the fast-correct rescue mission UI test
allowed-tools: [Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_wait_for, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_run_code, mcp__playwright__browser_take_screenshot]
---

# Fast Correct Rescue Mission UI Test

Test the happy path where all answers are fast and correct.

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
6. **Loop** through math problems:
   - Read the problem text (format: `X + Y = ?`)
   - Parse the two numbers and compute the correct answer
   - Type the answer into the textbox, wait 500ms so it's visible, then press Enter
   - Take a snapshot to verify the feedback shown
   - Click "Continue" to proceed to the next problem
   - If "Mission Complete!" appears, stop the loop
7. **Verify mission complete screen** shows:
   - 100% accuracy (or close to it)
   - Sparkles earned
   - "Help Another Animal" and "Settings" buttons

Use `browser_run_code` with a loop for efficiency after the first 1-2 manual problems to confirm the flow. In the run_code loop:
- Use `page.getByText(/^\d+\s*[+\-x]\s*\d+\s*=\s*\?$/)` to find the problem
- Parse with regex `match(/(\d+)\s*[+\-x]\s*(\d+)/)`
- Compute the answer based on the operator
- Fill the textbox, then `await page.waitForTimeout(500)` so the answer is visible, then press Enter
- Wait for Continue button and click it
- Check for "Mission Complete" text to break

## Expected Results

- Mission should complete before reaching the max problem count (fast correct gives +2 progress each)
- All answers should be marked correct
- Most/all answers should be marked "Fast & Correct"
- Sparkles should be earned (roughly equal to the number of fast correct answers)

## Report

At the end, report a summary table with: Accuracy, Correct count, Fast & Correct count, Avg Time, Sparkles earned, and total problems presented.
