# SP-20260717-001 runtime-retention — gauntlet findings (2026-07-17, ε envelope)

Status: HELD unmerged, gauntlet RED (all 3 lanes BINDING FAIL; gauntlet-verify liveness PASS — real verdicts, not reaps). Branches parked clean: build → `sprint/SP-20260717-001-builder` @ `00040620` (worktree `../WarpOS-wt/SP-20260717-001-builder`); spec/artifacts → `sprint/SP-20260717-001-runtime-retention` @ `67d7900b`. Both off `c3dab137`. Own tests green but UNDER-covering. Lanes: backend-reviewer gpt-5.6-sol FAIL · qa-reviewer gpt-5.6-terra FAIL · security-reviewer gpt-5.5 FAIL. β boundary consult crashed on tooling bug I-3 (moot — held + RED).

## Fix-brief (stable IDs; ★ = overlaps a cabinet-consult amendment)

### Rotation (scripts/hooks/lib/rotate.js + dispatch-record-fields.js)
- **F-ROT-2 [CRIT]** 50B byte pre-gate is an unsound lower bound — tiny JSONL records (3B/line) keep a 20k+ line file under the byte gate so the line cap never fires. Redesign the pre-gate.
- **F-ROT-1 [HIGH] ★** cross-process rotation race — stale rotator renames the recreated active file over `.1`, losing a generation/concurrent appends. (→ cabinet: ≥2 generations + single-writer/lock.)
- **F-ROT-4 [HIGH]** unknown-sink fallback `rotateIfNeeded(file)` can rotate ANY caller path — bypasses the SINK_CAPS allowlist. Close rotate over SINK_CAPS.
- F-ROT-3 [LOW] exact-cap off-by-one (`>` should be `>=`). F-ROT-5 test gap: no exact-cap / low-byte-high-line fixtures.

### Retention (scripts/hooks/lib/retention.js + session-start.js)
- **F-RET-1 [CRIT] ★** TOCTOU ancestor-swap between safeResolve and unlink — auto-apply not safe-by-construction. Fix: no-follow/atomic unlink, or keep SessionStart report-only (no `apply:true`). (→ cabinet: non-racy pruning host.)
- **F-RET-2 [CRIT]** untrusted deletion root: `applyRetention(cwd={CLAUDE_PROJECT_DIR||event.cwd},{apply:true})` — destructive root from hook input when env absent. Require trusted canonical root for apply.
- **F-RET-4 [HIGH] ★** can delete the CURRENTLY-LOADED handoff (newest-10 by mtime; the loaded live file, if 11th-oldest, dies same invocation). Add protected-exclusion for the loaded path + integration test. (→ cabinet: keep recent-OR-newest-N + referenced items.)
- F-RET-3 [HIGH] handoff-live regex too loose (`^handoff-live-.+\.md$` matches `handoff-live-..md`) — harden to basename allowlist (defense-in-depth; ε analysis: no live escape).
- F-RET-5 [MED] per-run cap enforced in plan but not self-capping in the apply loop. F-RET-6 [MED] audit event logs absolute plan.root (path leakage).
- Design point: dry-run vs main checkout → 143 candidates, cap 25 fills entirely with handoff-live, so `handoffs/*` + the stray err log are never reached in one run — multi-run self-heal needs an explicit design (per-class caps).

### Enforcer / wiring
- **F-ENF-1 [CRIT]** AC6 not wired — the `/scan:full` log-sink-caps invocation (build_spec item 9) was skipped (builder hit the 540s clamp before it). Real miss.
- F-ENF-2 [MED] not fully fail-closed (`kind:"elephants"`→ok:true; existsSync fault silently skipped; non-finite actual passes). F-ENF-3 [HIGH] "known sinks" counts existing files, not the SINK_CAPS inventory.
- F-BETA-1 [HIGH] betaEvents is in SINK_CAPS but its writer isn't wired to rotate (AC1 gap).

## Tooling findings (infra — recur across sprints; Phase-1 scope)
- **I-1** `gpt-5.6-terra` WORKS via codex CLI (qa-reviewer ran on it) but FAILS via the harness Agent-tool/API route ("may not exist / no access"). CORRECTS the earlier "phantom id" hypothesis: it's an Agent-tool/API model-availability gap, i.e. the same harness-spawn class as the β `gpt-5.6-sol` failure.
- **I-2** security-reviewer registry resolves provider `antigravity` but dispatch-contract tool_id allowlist = `[codex,gemini,agy]` → dispatch_contract_violation; recovered via `--provider openai`. Provider-id("antigravity") vs tool-id("agy") mismatch in the flipped security panel.
- **I-3** `beta-consult.js --out <absolute path>` crashes (`path.join(ROOT,outArg)` → ENOENT). Fix the join or document relative-only.

Tested dry-run (read-only, deletes nothing):
`node "C:\Users\Vlad\Desktop\Claude\Projects\WarpOS-wt\SP-20260717-001-builder\scripts\hooks\lib\retention.js" --root "C:\Users\Vlad\Desktop\Claude\Projects\WarpOS"`
