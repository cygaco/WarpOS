---
description: Pre-run workflow — 7 verification passes + branch creation with skeleton stubs
---

# /preflight:run — Pre-Run Verification

Run all 7 preflight verification passes before an agent run. Accepts an optional pass number to run just one.

**Usage:** `/preflight:run` (all 7) or `/preflight:run 3` (just Pass 3)

**$ARGUMENTS**: optional pass number (1-7)

---

If `$ARGUMENTS` is a number 1-7, run ONLY that pass. Otherwise run all 7 in order.

For each pass, collect all findings as a JSON array. After all requested passes complete, present a summary table: pass, total errors, total warnings, total info.

---

## Pass 1-2: Spec Consistency & Coverage

Delegate to `/check:specs static`.

This runs all spec checks: consistency (S1-S8), coverage (S9-S17), and quality (S18-S23). See check/specs.md for the full check list.

---

## Pass 3: Agent Buildability

Delegate to `/check:arch internal` — runs buildability checks A1-A12 only.

---

## Pass 4: Environment Readiness

Delegate to `/check:env ready` — runs environment checks E1-E14.

---

## Pass 5: Run Transition

**Agent type:** Explore

**Prompt for agent:**

You are a run transition auditor for the consumer product project. Your job is to verify that the previous run was properly closed out and the system is ready for a new run. Be exhaustive.

### Files to Read

- .claude/agents/.system/oneshot/store.json
- docs/09-agentic-system/retro/ (list all run folders)
- For the LATEST retro folder, read ALL files: RETRO.md, BUGS.md, LEARNINGS.md, HYGIENE.md, and any other .md files
- .claude/agents/.system/oneshot/protocol.md (verify it references the latest HYGIENE)
- .claude/agents/.system/agent-system.md (verify schema matches store.json)

### Checks

- **5.1 Previous Run Closure** — store.json runLog.finalStatus is "completed" or "halted" (not null). If halted: haltReason populated. startedAt populated. Flag null finalStatus as ERROR.
- **5.2 Retro Completeness** — Latest retro folder has: RETRO.md, BUGS.md, LEARNINGS.md, HYGIENE.md (all non-empty or explicitly "no bugs found").
- **5.3 Bug Dataset Populated** — Every BUGS.md bug has a store.bugDataset entry with populated prevention. Flag missing bugs or empty prevention.
- **5.4 HYGIENE Rule Numbering** — Sequential across all retro folders, no gaps or duplicates.
- **5.5 BOSS-PROMPT References Latest HYGIENE** — Points to latest retro folder's HYGIENE.md.
- **5.6 Store.json Schema Alignment** — AGENT-SYSTEM §6 Store interface matches actual store.json field-by-field (evolution[], heartbeat, compliance, snapshots, knownStubs, feature entries).
- **5.7 Feature Status Reset** — If new run: all features at "not_started". WARN if still showing previous run state.
- **5.8 Skeleton State** — If branch contains "skeleton": sample 5 feature files, verify SKELETON markers.
- **5.9 [planning-only] Section Stripping** — Sample 3 PRDs for `[planning-only]` markers. Flag if found.
- **5.10 Action Items from Previous Retro** — Check latest RETRO.md "Action Items" section. Flag unresolved items as WARN.

### Output Format

Same JSON array format as other passes.

---

## Pass 6: Agent Architecture Completeness

Delegate to `/check:arch internal` — runs architecture completeness checks A13-A26 (including the agentic flow audit).

Note: When running all passes, Pass 3 delegates to check:arch for A1-A12, and Pass 6 delegates for A13-A26. The check:arch skill handles both sets. If running just Pass 6, specify that only A13-A26 checks should run.

---

## Pass 7: Skeleton State Verification & Gutting

**Agent type:** General-purpose (runs commands)

**Prompt for agent:**

You are a skeleton state auditor for the consumer product project. Verify that ALL feature-owned files are proper skeleton stubs, and that ALL foundation files are intact. If invoked with --gut mode, also gut any non-stub feature files.

### Reference: FILE-OWNERSHIP.md

Read .claude/agents/FILE-OWNERSHIP.md for the canonical list of foundation files (must be INTACT) and feature-owned files (must be STUBS).

### Checks

- **7.1 Feature Components Are Stubs** — Each feature-owned component: <30 lines, SKELETON marker, correct export name, compiles.
- **7.2 Feature API Routes Are Stubs** — Each feature-owned route: <15 lines, returns 501 or SKELETON marker, correct HTTP exports.
- **7.3 Feature Lib Files Are Stubs** — Functions throw "SKELETON: not implemented" or return minimal defaults. Type/interface exports preserved (NOT stubbed).
- **7.4 Foundation Files Are Intact** — >50 lines, no SKELETON markers, real implementations.
- **7.5 Build Verification** — `npm run build` passes clean.
- **7.6 store.json knownStubs Alignment** — Every knownStubs file is actually a stub. Every stub file is in knownStubs.

### GUT MODE (--gut flag)

After identifying non-stubs: replace components with skeleton stubs (<25 lines), routes with 501 returns, libs with throwing functions (keep type exports). Run build. Update knownStubs.

### Output Format

Same JSON array format. For --gut mode, mark fixed items as FIXED.

---

## After All Passes

1. **Summary table** — Pass number, name, error count, warning count, info count.
2. **Blocking errors** — List all ERROR-severity findings.
3. **Pass 7 with --gut** — Creates skeleton branch (`skeleton-testN`).
4. **Decision** — "PREFLIGHT PASSED — ready for agent run" (0 errors) or "PREFLIGHT BLOCKED — N errors must be fixed".
