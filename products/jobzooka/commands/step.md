---
name: step
description: Fast-forward to a specific step and screenshot it for visual inspection
---

Fast-forward to a specific wizard step and visually verify it.

Usage: `/step 8` or `/step 5`

Steps:
1. Load `/?deusmechanicus&step={N}` where N is the argument (default: 8)
2. Wait for the page to render
3. Take a screenshot
4. Check `preview_console_logs` for errors
5. Report what's visible and any issues

If no step number given, show all 11 steps as a quick reference:
- Steps 1-3: Onboarding (Resume → Preferences → Profile)
- Steps 4-5: AIM (Search → Market Analysis)
- Steps 6-7: READY Prep (Mining Q&A → Skills)
- Steps 8-10: READY Arsenal (Resumes → LinkedIn → Download)
- Step 11: FIRE (Auto-apply)
