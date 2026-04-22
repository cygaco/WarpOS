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

Delegate to `/check:requirements static`.

This runs all spec checks: consistency (S1-S8), coverage (S9-S17), and quality (S18-S23). See check/specs.md for the full check list.

---

## Pass 3: Agent Buildability

Delegate to `/check:architecture internal` — runs buildability checks A1-A12 only.

---

## Pass 4: Environment Readiness

Delegate to `/check:environment ready` — runs environment checks E1-E14.

---

## Pass 5: Run Transition

**Agent type:** Explore

**Prompt for agent:**

You are a run transition auditor for the current project. Your job is to verify that the previous run was properly closed out and the system is ready for a new run. Be exhaustive.

Resolve the project name from `.claude/manifest.json` → `project.name` and use it in output messages.

### Files to Read

- `.claude/agents/store.json` (the build system state — resolve via `paths.store`)
- Retro directory (resolve via `manifest.projectPaths.retro`; fall back to `.claude/project/retros/` or skip if neither exists)
- For the LATEST retro folder: `RETRO.md`, `BUGS.md`, `LEARNINGS.md`, `HYGIENE.md`, and any other `.md` files
- `.claude/agents/02-oneshot/.system/protocol.md` (verify it references the latest HYGIENE)
- `.claude/manifest.json` (canonical `fileOwnership.foundation`) and `.claude/agents/02-oneshot/.system/store.json` (canonical per-feature `features[<name>].files`) — oneshot uses these to enforce ownership. The old `file-ownership.md` / `task-manifest.md` templates have been removed.

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

Delegate to `/check:architecture internal` — runs architecture completeness checks A13-A26 (including the agentic flow audit).

Note: When running all passes, Pass 3 delegates to `check:architecture internal` for A1-A12, and Pass 6 delegates for A13-A26. The `check:architecture` skill handles both sets. If running just Pass 6, specify that only A13-A26 checks should run.

---

## Pass 7: Skeleton State Verification & Gutting

**Agent type:** General-purpose (runs commands)

**Prompt for agent:**

You are a skeleton state auditor for the Jobzooka project. Verify that ALL feature-owned files are proper skeleton stubs, and that ALL foundation files are intact. If invoked with --gut mode, also gut any non-stub feature files.

### Canonical ownership sources

Read these for the canonical list of foundation + feature-owned files (old FILE-OWNERSHIP.md template has been removed):

- `.claude/manifest.json` → `fileOwnership.foundation` — canonical foundation list (must be INTACT).
- `.claude/agents/02-oneshot/.system/store.json` → `features[<name>].files` — canonical per-feature file scope (must be STUBS).

### Checks

- **7.1 Feature Components Are Stubs** — Each feature-owned component: <30 lines, SKELETON marker, correct export name, compiles.
- **7.2 Feature API Routes Are Stubs** — Each feature-owned route: <15 lines, returns 501 or SKELETON marker, correct HTTP exports.
- **7.3 Feature Lib Files Are Stubs** — Functions throw "SKELETON: not implemented" or return minimal defaults. Type/interface exports preserved (NOT stubbed).
- **7.4 Foundation Files Are Intact** — >50 lines, no SKELETON markers, real implementations.
- **7.5 Build Verification** — `npm run build` passes clean.
- **7.6 store.json knownStubs Alignment** — Every knownStubs file is actually a stub. Every stub file is in knownStubs.
- **7.7 Foundation-guard heartbeat** — if this run will edit any file in `manifest.fileOwnership.foundation`, verify `.claude/agents/store.json` exists and contains `heartbeat.agent` in {alpha, gamma, boss, lead}. If absent or wrong agent, create with `{"heartbeat": {"agent": "alpha", "status": "preflight", "timestamp": "<ISO>"}}` or abort if the current agent is not authorized. Severity: WARN.
- **7.8 Store ↔ PRD file-list coherence** — For each feature, read `docs/05-features/<feature-dir>/PRD.md` Section 13 (Implementation Map) and diff the listed files against `store.features[<feature>].files`. Report any files present in PRD but missing from store (MISSING) or vice versa (ORPHAN). Severity: WARN in read-only mode. In `--gut` mode, auto-patch `store.features[<feature>].files` to match PRD Section 13.
- **7.9 Stub signature drift** — For each stubbed file, extract exported type signatures (request body types, function signatures, route export shapes) and diff against the types referenced in the current `docs/05-features/<feature-dir>/PRD.md` + `INPUTS.md` + foundation types in `src/lib/types.ts`. Flag mismatches as INFO/WARN: "Stub at `<path>` has signature `<X>`, spec says `<Y>` — drift detected." Report-only; `--gut` mode triggers Part C (scaffold) to remediate.

### GUT MODE (--gut flag)

Run in this order:

1. **Identify non-stubs** (Pass 7.1–7.3) and **regenerate** them as standard skeleton stubs (<25 lines components, 501 routes, throwing libs with preserved type exports). Update `store.knownStubs`.
2. **Auto-sync Pass 7.8** — for each feature with a store↔PRD file-list mismatch, patch `store.features[<feature>].files` to match PRD Section 13. Emit a log entry listing adds + removes.
3. **Auto-scaffold Pass 7.9 drift** — for each stub file flagged by Pass 7.9 as signature-drifted, dispatch the `stub-scaffold` sub-agent via Bash:
   ```bash
   # Per-feature, per-file that drifted:
   PROMPT=$(mktemp)
   cat > "$PROMPT" <<'EOF'
   feature: <feature-name>
   file: <stub-path>
   drift-report: <Pass 7.9 diff for this file>

   You are the stub-scaffold sub-agent. Follow `.claude/agents/02-oneshot/stub-scaffold/stub-scaffold.md`. Regenerate the stub file at the given path using the CURRENT spec signatures from the feature's PRD + INPUTS.md + src/lib/types.ts. Output ONLY the new file content.
   EOF
   RESULT=$(claude -p --model sonnet --agent stub-scaffold "$(cat "$PROMPT")")
   # Write result to the file path (atomic swap — don't overwrite on non-empty output only).
   ```
4. **Reset oneshot feature statuses** — this is a new skeleton run, so all non-foundation features in `.claude/agents/02-oneshot/.system/store.json` MUST be reset to `status: "not_started"`. Run:
   ```bash
   node scripts/oneshot-store-reset.js <target-branch-name>
   ```
   This resets `status`, `owner`, `fixAttempts`, `note`, `finalScore` for every non-foundation feature; resets `cycle=0`, clears `consecutiveFailures` + `totalFailures`, sets `circuitBreaker="CLOSED"`; refreshes `heartbeat` to `{ agent: "delta", status: "initializing", timestamp: now }`; updates `runLog.branch` + `runLog.startedAt`. Backs up the prior store to `store.json.prev-run-backup.json`.
5. **Final build** — run `npm run build`, confirm clean.
6. **Report** — emit the full `--gut` run summary including: files regenerated (7.1–7.3 stubs), file-list patches (7.8), stubs rescaffolded (7.9 via stub-scaffold), store reset summary (features reset count), build status.

### Output Format

Same JSON array format. For --gut mode, mark fixed items as FIXED.

---

## After All Passes

1. **Summary table** — Pass number, name, error count, warning count, info count.
2. **Blocking errors** — List all ERROR-severity findings.
3. **Pass 7 with --gut** — Creates skeleton branch (`skeleton-testN`).
4. **Decision** — "PREFLIGHT PASSED — ready for agent run" (0 errors) or "PREFLIGHT BLOCKED — N errors must be fixed".
