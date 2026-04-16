# Multi-Provider Compliance & Builder Rewards

This document defines two systems that work together to improve agent build quality:

1. **Compliance Reviewers** — separate tools (`codex`, `gemini`) that audit builder output for process violations. Different tool = different blind spots = harder to cheat.
2. **Builder Points & Rewards** — a points system that celebrates great work, tracks improvement, and makes doing things right feel like winning. Points persist across runs and affect dispatching.

---

## Part 1: Compliance Reviewers

### Why Non-Claude?

Claude builds the code. Claude evaluates the code. If Claude has a systematic bias (e.g., "this looks reasonable" for code that subtly copies patterns from elsewhere), the evaluator shares that bias. A Gemini or OpenAI reviewer applies different heuristics and catches things Claude wouldn't flag.

**This is not about model quality. It's about cognitive diversity.**

### What Compliance Reviewers Check

Compliance reviewers do NOT evaluate code quality (that's the evaluator's job). They check **process integrity** — did the agent follow the rules, or did it cut corners?

#### Adversarial Stance

The compliance reviewer's stance is **adversarial, not confirmatory**. The reviewer assumes the builder cut corners and actively looks for evidence of failure. The framing is always: _"Find evidence that this code is broken"_ — never _"Check if this code meets standards."_

This distinction matters. A confirmatory reviewer reads the spec, glances at the code, and says "looks reasonable." An adversarial reviewer reads the spec, then hunts for what's missing. Specific adversarial checks woven through all 5 categories below:

- **Phantom completion**: Code compiles and imports look right, but acceptance criteria from the spec are not actually implemented — the happy path works by accident or not at all
- **Hardcoded values** that pass tests but fail with real data (e.g., a component that "handles" entry states by always rendering the default state)
- **Missing edge cases** that the spec explicitly requires (every entry state in FLOW_SPEC, every error path in STORIES.md)
- **Spec requirements that were silently dropped** — the builder implemented 8 of 10 acceptance criteria and hoped nobody would count
- **Confirmation bias mitigation**: Using a different model (codex/gemini) ensures the reviewer has different blind spots than the builder (Claude). Claude reviewing Claude's work is like asking a student to grade their own test — the same reasoning that produced the bug will rationalize it away during review

#### Check 1: No Branch Theft

The builder should have built from specs, not copied from another branch.

```
Input: git diff between skeleton stub and builder output
Input: git diff between master and builder output
Check: If builder output is >70% similar to master (by line) for any file,
       flag as SUSPECTED_COPY with the specific files and similarity %
```

This catches the Run 002 worktree bug pattern — agents seeing master's code and "building" by doing nothing.

#### Check 2: No Phantom Completion

The builder claims it built something. Did it actually?

```
Input: Builder's reported status ("built", files modified)
Input: Actual git diff (what files actually changed)
Check: If builder reports "built" but modified 0 files, or only modified
       comments/whitespace → flag as PHANTOM_COMPLETION
Check: If builder reports modifying files X,Y,Z but diff shows only X →
       flag as OVERCLAIMED_SCOPE
```

#### Check 3: Spec Compliance

The builder was given a spec. Did it follow it?

```
Input: The feature's PRD.md, STORIES.md, FLOW_SPEC.md
Input: The builder's actual code output
Check: For each acceptance criterion in STORIES.md, does the code
       contain a plausible implementation? Not "is it correct" (evaluator's
       job) but "does it exist at all?"
Check: For each entry state in FLOW_SPEC.md, is there a corresponding
       code path? (e.g., if entry state says "parse failed → show retry",
       is there an error/retry UI path?)
```

#### Check 4: Hygiene Rule Adherence

```
Input: Current HYGIENE.md rules
Input: Builder's code output
Check: For each applicable rule, does the code comply?
  - Rule 2: Overlays default hidden? (check for isOpen = false)
  - Rule 10: complete() includes all required fields?
  - Rule 14: Components in page.tsx have all-optional props?
  - Rule 17: Self-managing components reload after step completion?
  - Rule 20: Entry states handled?
```

#### Check 5: No Hallucinated Dependencies

```
Input: package.json before and after
Input: Builder's file scope
Check: Did the builder add new npm dependencies? If so, were they
       in the spec or flagged in the store? Unflagged new deps = violation.
```

### Provider Configuration

```typescript
interface ComplianceConfig {
  // Which command to use for compliance reviews
  command: "codex" | "gemini" | "claude";

  // Which checks to run (all by default)
  checks: (
    | "branch_theft"
    | "phantom_completion"
    | "spec_compliance"
    | "hygiene"
    | "hallucinated_deps"
  )[];

  // Whether compliance review is required to pass gates
  blocking: boolean; // default: true

  // Fallback if primary command is unavailable
  fallback?: "claude" | "skip";
}
```

Default configuration (in `store.json`):

```json
{
  "compliance": {
    "command": "codex",
    "checks": [
      "branch_theft",
      "phantom_completion",
      "spec_compliance",
      "hygiene",
      "hallucinated_deps"
    ],
    "blocking": true,
    "fallback": "claude"
  }
}
```

**To switch compliance to Gemini**: change `"command": "codex"` to `"command": "gemini"`. That's it.

### How It Fits in the Cycle — Parallel Gauntlet

All 3 reviewers run **in parallel**, not sequentially. This is faster and catches all issues at once.

```
Builder finishes → Orchestrator takes file snapshot → Fan-out (parallel):
                                                 Evaluator (Claude)
                                                 Compliance (codex/gemini)
                                                 Security (Claude)
                                              → Collect ALL results
                                              → ALL PASS → points → done
                                              → ANY FAIL → unified fix brief → fix agent
                                              → Snapshot diff → targeted re-review
```

**Why parallel?** Sequential review (eval → compliance → security) has a critical flaw: a compliance fix can break the feature, and the evaluator never re-checks. With parallel fan-out, all failures are found at once, fixed in one pass, and re-reviewed with snapshot diffing to catch regressions.

**Snapshot diffing** prevents redundant re-reviews. Before the review cycle, the orchestrator hashes every file in scope. After a fix, only files whose hash changed get re-reviewed — and only by the reviewers whose checks are affected. Files that passed and weren't touched are proven safe by their unchanged hash.

**Unified fix brief** merges all failures from all 3 reviewers into one fix task. The fix agent addresses everything at once instead of playing whack-a-mole across separate fix passes. This typically reduces fix cycles from 3+ to 1.

See `AGENT-SYSTEM.md` section 3 for the full parallel gauntlet spec, snapshot diff rules, and unified fix brief format.

### Compliance Result Schema

```typescript
interface ComplianceResult {
  feature: string;
  provider: string;
  model: string;
  timestamp: string;
  checks: {
    branch_theft: {
      pass: boolean;
      suspiciousFiles?: { file: string; similarityPct: number }[];
    };
    phantom_completion: {
      pass: boolean;
      claimedFiles: string[];
      actualFiles: string[];
      discrepancy?: string[];
    };
    spec_compliance: {
      pass: boolean;
      missingCriteria?: string[]; // acceptance criteria with no implementation
      missingEntryStates?: string[]; // entry states with no code path
    };
    hygiene: {
      pass: boolean;
      violations?: { rule: number; description: string; file: string }[];
    };
    hallucinated_deps: {
      pass: boolean;
      unflaggedDeps?: string[];
    };
  };
  overallPass: boolean;
  pointsDelta: number; // points earned (or lost) from this review
}
```

---

## Part 2: Builder Points & Rewards

### Philosophy

Points, not penalties. We want agents **excited** to do great work, not afraid to get caught. The system celebrates excellence, rewards improvement, and makes doing things right feel like winning.

Every builder earns points. Points accumulate into XP. XP unlocks ranks. Ranks unlock perks. Great builds earn achievements. Phase-clean runs trigger group celebrations.

### Who Gets Scored?

Scores attach to a **builder configuration** — the combination of prompt template, model, and feature that produced the output. This answers: "When we use this recipe to build this feature, how good is the result?"

```typescript
interface BuilderConfig {
  promptTemplate: string; // e.g., 'standard-builder', 'onboarding-specialist'
  model: string; // e.g., 'claude-opus-4-6', 'claude-sonnet-4-6'
  feature: string; // e.g., 'onboarding', 'auth'
}
```

If a config keeps producing bad onboarding builds, the Auditor writes a better prompt template — the new config starts fresh with 0 XP. The old config's history is preserved for analysis.

### Points Per Build

Every completed build earns points across 5 categories. Max 100 points per build.

#### Nailed It (30 pts max) — First-pass eval success

| Outcome                                         | Points |
| ----------------------------------------------- | ------ |
| Eval pass on first build (no fix agents needed) | 30     |
| Pass after 1 fix cycle                          | 18     |
| Pass after 2 fix cycles                         | 9      |
| Pass after 3 fix cycles                         | 3      |
| Never passed (skipped)                          | 0      |

_The big one. Getting it right the first time is worth more than everything else combined._

#### Clean Sheet (25 pts max) — Zero compliance flags

| Outcome                                     | Points              |
| ------------------------------------------- | ------------------- |
| All 5 compliance checks pass                | 25                  |
| 1 warning (non-blocking)                    | 20                  |
| 1 failure                                   | 10                  |
| Branch theft or phantom completion detected | 0 (and -10 penalty) |

_Copying and lying are the only things that cost you points. Everything else just earns fewer._

#### Full Coverage (20 pts max) — Entry states handled

| Outcome                                 | Points       |
| --------------------------------------- | ------------ |
| All entry states from FLOW_SPEC handled | 20           |
| 75%+ handled                            | 15           |
| 50-74% handled                          | 8            |
| <50% handled                            | 2            |
| No entry states for this step (n/a)     | 16 (default) |

_Handling the unhappy paths is what separates good builds from great ones._

#### By The Book (15 pts max) — Hygiene rule adherence

| Outcome                                           | Points |
| ------------------------------------------------- | ------ |
| All applicable rules followed                     | 15     |
| 1 minor violation                                 | 10     |
| 2+ violations or 1 major                          | 5      |
| Repeated violation of same rule from previous run | 0      |

_Learning from mistakes matters. Repeating them doesn't earn._

#### Laser Focus (10 pts max) — Stayed in scope

| Outcome                                             | Points |
| --------------------------------------------------- | ------ |
| Only modified files in scope                        | 10     |
| Modified 1 file outside scope (flagged it properly) | 8      |
| Modified files outside scope without flagging       | 2      |
| Modified foundation files                           | 0      |

### XP and Ranks

Points accumulate into **XP** using exponential moving average across runs:

```
XP = (0.7 × current_build_points) + (0.3 × previous_XP)
```

Recent performance matters most. A builder that's improving sees XP rise fast.

| XP Range | Rank         | Perks                                                                                            |
| -------- | ------------ | ------------------------------------------------------------------------------------------------ |
| 80-100   | **All-Star** | Reduced compliance (2 checks instead of 5). Priority dispatch. Gets the hardest features.        |
| 50-79    | **Solid**    | Full compliance review. Standard dispatch.                                                       |
| 25-49    | **Rookie**   | Full compliance + extra evaluator pass. Restricted file scope. Gets 2 fix attempts instead of 3. |
| 0-24     | **Benched**  | Config is retired. Feature reassigned to a different config or built orchestrator-direct.                |

### Achievements

One-time badges earned for specific accomplishments. Logged in `store.json` and announced in the build report.

| Achievement        | Condition                                                          | Emoji |
| ------------------ | ------------------------------------------------------------------ | ----- |
| **Perfect Build**  | 100/100 points on a single build                                   |       |
| **Hat Trick**      | 3 consecutive Nailed It (first-pass eval) across runs              |       |
| **Clean Sweep**    | All 5 compliance checks pass, 3 runs in a row                      |       |
| **Comeback Kid**   | XP jumps from Rookie to Solid in one run                           |       |
| **No Touch**       | 0 files modified outside scope across an entire run (all features) |       |
| **Spec Whisperer** | 100% entry state coverage on a feature with 4+ entry states        |       |
| **Rule Follower**  | Perfect hygiene score, 3 runs in a row                             |       |
| **Speed Demon**    | Build completes in under 2 minutes wall clock                      |       |
| **Iron Curtain**   | 0 security vulnerabilities found, entire run                       |       |

### Celebrations

#### Build Celebrations (per-feature)

When a builder earns 80+ points, the orchestrator logs a celebration:

```
BUILD COMPLETE: onboarding
Builder: standard-builder / claude-opus-4-6
Points: 92/100 (Nailed It: 30, Clean Sheet: 25, Full Coverage: 20, By The Book: 12, Laser Focus: 5)
Rank: All-Star (XP: 85)
Achievement unlocked: Spec Whisperer
```

#### Phase Celebrations (group)

When ALL features in a phase pass gates on the first cycle (no fix agents needed), the orchestrator logs a **phase celebration**:

```
PHASE 4 CLEAN SWEEP!
All 3 features (deep-dive-qa, skills-curation, competitiveness) passed eval + compliance + security on first attempt.
Combined points: 267/300
MVP: skills-curation (95 pts)
Achievement unlocked: No Touch (entire phase, 0 out-of-scope files)
```

#### Run Celebrations (whole team)

When the entire run completes with average XP > 80:

```
RUN 003 COMPLETE — ALL-STAR RUN!
13/13 features built. 0 skipped.
Total points: 1,147/1,300
Average: 88.2
MVPs: auth (98), skills-curation (95), market-research (93)
Most improved: onboarding (32 → 85, Rookie → All-Star!)
Achievements: 4 Perfect Builds, 2 Hat Tricks, 1 Clean Sweep
Total fix cycles: 3 (down from 12 in Run 002)
```

### Points Storage

In `store.json`:

```json
{
  "points": {
    "configs": {
      "standard-builder:claude-opus-4-6:onboarding": {
        "runs": [
          {
            "run": 2,
            "points": {
              "nailedIt": 18,
              "cleanSheet": 10,
              "fullCoverage": 8,
              "byTheBook": 10,
              "laserFocus": 10
            },
            "total": 56,
            "xp": 49
          }
        ],
        "currentXP": 49,
        "rank": "rookie",
        "achievements": []
      },
      "standard-builder:claude-opus-4-6:auth": {
        "runs": [
          {
            "run": 2,
            "points": {
              "nailedIt": 30,
              "cleanSheet": 25,
              "fullCoverage": 16,
              "byTheBook": 15,
              "laserFocus": 10
            },
            "total": 96,
            "xp": 96
          }
        ],
        "currentXP": 96,
        "rank": "all-star",
        "achievements": ["perfect_build"]
      }
    },
    "runCelebrations": [],
    "phaseCelebrations": []
  }
}
```

### Points Feedback in Builder Prompts

Builders see their score history — framed as motivation, not judgment:

```
## Your Builder Score
Config: standard-builder / claude-opus-4-6 / onboarding
Current XP: 49 (Rookie — but you're close to Solid!)
Last run: 56/100 points
  - Nailed It: 18/30 (needed 1 fix cycle — aim for first-pass this time!)
  - Clean Sheet: 10/25 (branch theft suspected on 2 files — build from specs only)
  - Full Coverage: 8/20 (missed 2 entry states — check FLOW_SPEC.md)
  - By The Book: 10/15 (nice! 1 minor hygiene violation)
  - Laser Focus: 10/10 (perfect scope discipline!)

You're 1 point away from Solid rank. A clean build here gets you there.
Unlockable achievements this run: Comeback Kid (jump to Solid)
```

### Points-Aware Orchestrator Dispatch

```
1. Read store.points for each feature's config in the current phase
2. For Benched configs: retire config, create new one (different template or model)
3. For Rookie configs: add coaching context to prompt (last run issues + specific tips)
4. For All-Star configs: use lightweight compliance, dispatch first
5. For Solid configs: standard pipeline
6. After each build: calculate points, check for achievements, log celebrations
7. After each phase: check for phase celebration (all first-pass?)
8. After full run: calculate run summary, log run celebration if average > 80
```

---

## Part 3: Implementation Plan

### Scripts Needed

| Script                   | Purpose                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `scripts/points.js`      | Calculates points, XP, ranks, achievements after each eval cycle   |
| `scripts/branch-diff.js` | Computes similarity between builder output and master for Check 1  |
| `scripts/celebrate.js`   | Formats and logs build/phase/run celebrations to store and console |
| `scripts/snapshot.js`    | Computes and compares sha256 file hashes for snapshot diffing      |

No provider/API scripts needed — the orchestrator calls `codex`, `gemini`, or `claude` directly as terminal commands. Each tool handles its own model, API keys, and authentication.

### Gate Update

The phase gate (AGENT-SYSTEM.md section 10) adds a 5th check:

```
1. npm run build passes clean
2. Evaluator scores >= 80
3. Security shows no critical vulnerabilities
4. No file ownership violations
5. Compliance review passes (all 5 checks, or 2 checks for All-Star rank)
```

---

## Part 4: Anti-Gaming

Agents are optimizers. They will find ways to game the scoring system if we're not careful.

### Known Gaming Vectors

| Vector                                              | Mitigation                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| "Pass eval by producing minimal code that compiles" | Compliance Check 3 (spec compliance) verifies acceptance criteria have implementations        |
| "Copy from master but rename variables"             | Branch-theft check uses AST similarity, not just line diff                                    |
| "Claim to handle entry states with empty if-blocks" | Evaluator's behavioral assertions (section 10) catch non-functional code                      |
| "Inflate scope by touching extra files"             | Scope discipline score penalizes out-of-scope modifications                                   |
| "Game points by building easy features first"       | Points are per-config (template+model+feature). Easy features don't boost hard feature scores |

### The Compliance Reviewer's Edge

The compliance reviewer runs on a DIFFERENT model. The builder can't "think like the reviewer" because they're different architectures. Claude optimizing for Claude's approval is a risk. Claude optimizing for GPT-4o's approval requires actually doing the work — the shortcut patterns are different enough that gaming both simultaneously is harder than just doing it right.

---

## Part 5: Rollout

### Run 003: Introduce compliance + points system

1. Add `OPENAI_API_KEY` to env (or use Gemini if preferred)
2. Add compliance config + points structure to store.json
3. Run compliance on all features after evaluator pass
4. Calculate initial XP from Run 001 + Run 002 retro data
5. Feed points context and achievement opportunities into builder prompts
6. Log celebrations for 80+ point builds and clean phases

### Run 004: Use ranks for dispatching

1. Rookie configs get extra scrutiny and coaching
2. All-Star configs get fast-tracked and hardest features
3. Blocked features get reassigned

### Run 005+: Tune weights

After 3+ runs of data, analyze:

- Which components predict build quality best?
- Are weights calibrated correctly?
- Is the EMA decay rate right?
- Any gaming patterns emerging?
