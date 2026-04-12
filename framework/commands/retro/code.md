---
description: Scan git diff for code-level retro signals — bug fixes, new patterns, hygiene rules
user-invocable: true
---

# /retro:code — Code Change Scanner

Scan git diffs for bug fixes, new patterns, and hygiene rules that weren't logged.

## What It Catches

Things visible in code diffs:

1. **Bug fixes** — guard clauses, null checks, state fixes, error handling
2. **New code patterns** — exclusion tracking, auto-advance, filtering
3. **Type changes** — new fields, interface extensions
4. **Removed code** — dead code cleanup, feature removal
5. **Payload/API changes** — contract modifications

## Diff Pattern Detection

### Bug Fix Signals → BUGS.md + maybe HYGIENE.md
| Diff Pattern | Bug Class | Severity Hint |
|---|---|---|
| Added guard clause / early return | Missing validation | P2 |
| Added `mountedRef` / ref reset | React strict mode | P2 |
| `onComplete` → `saveSession` swap | Stale state | P1 |
| Added try/catch | Missing error handling | P2 |
| Added loading/disabled state | UX feedback gap | P3 |
| Changed `===`/`!==` | Logic inversion | P1 |
| Added `?? []` / nullish coalescing | Null reference | P2 |
| Changed `.filter()` / `.map()` logic | Data transformation | P2 |
| CSS opacity/display/visibility | Visual state bug | P3 |
| Prompt template change | AI output quality | P2 |
| API payload restructure | Integration contract | P1 |

### Skip Signals (not bugs)
| Diff Pattern | What It Is |
|---|---|
| Removed dead code / unused vars | Cleanup |
| Added comments only | Documentation |
| Import reordering | Formatting |
| New file in `.claude/commands/` | Skill change (→ /retro:git) |

## Procedure

### Step 0: Check for uncommitted changes

Run `git status --porcelain -- 'src/' 'scripts/'`. If there are uncommitted changes:

1. Show the user what's uncommitted
2. Ask: "Commit these changes before scanning? (yes / no / skip retro:code)"
3. If yes: stage and commit with a descriptive message, then continue
4. If no: warn that uncommitted changes won't appear in the diff scan

This matters because retro:code scans `git diff` — uncommitted work is invisible to it.

### Step 1: Find baseline and scan diffs

```bash
# Last retro commit
git log --oneline -1 -- 'docs/09-agentic-system/retro/'

# What files changed
git diff {baseline}..HEAD --stat -- 'src/' 'scripts/'

# Read the diffs (first 500 lines)
git diff {baseline}..HEAD -- 'src/' | head -500
```

If no retro commit exists, use `git log --oneline -20` and pick the last substantial commit.

### Step 2: Get next IDs

Grep BUGS.md for last bug number. Grep HYGIENE.md for last rule number.

### Step 3: Classify each hunk against the pattern table

For each meaningful change, ask:
1. Is this a bug fix? → BUGS.md
2. Would an agent repeat it? → HYGIENE.md
3. Is this a new reusable pattern? → HYGIENE.md

### Step 4: Present candidates (do NOT auto-write)

```
Found {N} code changes since {baseline}:

1. [BUG] Step4Profile.tsx — exclusion tracking for domain pills
   Pattern: .filter() logic change (data transformation fix)
   Suggested: BUG-NNN, P2 + HYGIENE Rule NN

2. [BUG] StepCollect.tsx — auto-advance after saveSession
   Pattern: onComplete added after saveSession (stale state fix)
   Suggested: BUG-NNN, P1 + HYGIENE Rule NN

3. [CLEANUP] StepCollect.tsx — removed manual URL section
   Not a bug — skip.

Log which? (all / pick numbers / skip)
```

### Step 5: Write confirmed entries

#### BUGS.md entry
```markdown
## BUG-NNN: {short description}

- **Severity:** {P0|P1|P2|P3} — {why}
- **Found by:** {Manual testing | Evaluator | User report} ({date})
- **Status:** FIXED (verified) | FIXED (pending verification)

### Symptoms
{1-3 bullets}

### Root Cause
{file:line ref. 1-2 sentences.}

### Fix
{What changed. Files modified.}
```

#### HYGIENE.md rule
````markdown
## Rule NN — {Title}

**Source:** BUG-NNN

```tsx
// BAD
{bad code}

// GOOD
{good code}
```

1. **{Actionable instruction}**
2. **{Actionable instruction}**
````

## Token Budget

- Git diff scan: ~2K tokens
- ID lookup: ~200 tokens
- Write entries: ~1K tokens
- **Total: ~3-4K tokens**
