---
name: qa
description: Run QA tests on the consumer product app
---

Run the consumer product QA suite. This includes:

1. **Server health check** — hit `/api/test?check=all` and report results
2. **Visual QA** — load dummy plug at key steps and take screenshots
3. **Console/server error check** — verify zero errors

Steps:
1. Use `preview_eval` to call `/api/test?check=all` and display the summary
2. Fast-forward to step 8 via `/?deusmechanicus&step=8` and take a screenshot
3. Check `preview_console_logs` for errors
4. Check `preview_logs` for server errors
5. Report a summary table of all results

If the user specifies a step number (e.g., `/qa 5`), fast-forward to that step and screenshot it.
If the user says `/qa full`, run the complete test suite including all 11 steps.
