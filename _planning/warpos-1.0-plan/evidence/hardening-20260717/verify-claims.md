# Verification report — RATIFIED-PLAN.md claims vs disk/git (2026-07-17)

Verified against repo root `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS` and worktree
`C:\Users\Vlad\Desktop\Claude\Projects\WarpOS-wt\SP-20260717-001-builder`. Tests were located but
NOT run (per instructions).

## 1. Sprint branches at claimed SHAs — CONFIRMED
```
+ sprint/SP-20260717-001-builder               00040620 feat(runtime): write-time log rotation ...
+ sprint/SP-20260717-001-runtime-retention     67d7900b chore(sprint): SP-20260717-001 dispatch artifacts ...
```
`git rev-parse` confirms full SHAs: `0004062039b783af1ca44bfadc982929ed9441ac` and
`67d7900b5ec9efbe2d4133f5c0625097c102ed60` — both prefixes match exactly.

## 2. Worktree exists and is clean — CONFIRMED
`C:\Users\Vlad\Desktop\Claude\Projects\WarpOS-wt\SP-20260717-001-builder` exists on disk (contains
`.git`, `.claude`, `AGENTS.md`, `CLAUDE.md`, etc.). `git status --porcelain` inside it returned
empty output (clean).

## 3. Five evidence files exist, all >2KB — CONFIRMED
All present under `_planning/warpos-1.0-plan/evidence/`:
- packet-analysis.md — 13,164 bytes
- enforcement-audit.md — 13,268 bytes
- runtime-hygiene.md — 7,799 bytes
- cabinet-consult-gpt56sol-ultra.md — 17,604 bytes
- sp-20260717-001-gauntlet-findings.md — 4,332 bytes (smallest, still >2KB)

## 4. runtime/worktree-salvage-20260717/ — CONFIRMED
Exists, untracked (`git status --porcelain` shows `?? runtime/worktree-salvage-20260717/`),
contains `sp001/` and `sp002/` subdirs, `du -sh` reports 6.9M — matches the ~6.9MB claim exactly.

## 5. I-2: security-reviewer provider vs dispatch-contract tool_id allowlist — CONFIRMED
`.claude/agents/_org/role-registry.json` line 57, `security-reviewer` row:
`"provider": "antigravity", "model": "gemini-3.1-pro-high", ...`

`.claude/agents/_org/dispatch-contract.json` line 121:
`"tool_id": ["codex", "gemini", "agy"]`

The registry names the provider `antigravity`; the dispatch-contract allowlist for the matching
shape uses the short code `agy` (not `antigravity`) alongside `codex`/`gemini`. Both literals exist
exactly as the claim states — a real naming mismatch between the two keystone files.

## 6. I-3: beta-consult.js crashes on absolute --out paths — CONFIRMED
`scripts/dispatch/beta-consult.js:255`:
```js
if (outFile) fs.writeFileSync(path.join(ROOT, outFile), JSON.stringify(out, null, 2));
```
Unguarded (no try/catch). Reproduced with a standalone script: `path.join(ROOT, absoluteWindowsPath)`
does NOT special-case an absolute second argument (that's `path.resolve` behavior, not `path.join`) —
it concatenates both, producing a malformed nested path
(`C:\...\WarpOS\C:\Users\Vlad\AppData\Local\Temp\claude\test-out-scratch.json`). Calling
`fs.writeFileSync` on that path throws `ENOENT: no such file or directory` — confirmed live:
```
THREW: ENOENT - ENOENT: no such file or directory, open 'C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\C:\Users\Vlad\AppData\Local\Temp\claude\test-out-scratch.json'
```
Since line 255 has no try/catch and `main()` is invoked via `process.exit(main(process.argv))`
(line 260), an uncaught exception here crashes the process with a stack trace rather than a clean
error — the claim is accurate.

## 7. ED-205 (and ED-203/204/206/207) — REFUTED
`.claude/project/memory/enforcement-debt.jsonl` contains **no** entry with id `ED-205`, `ED-203`,
`ED-204`, `ED-206`, or `ED-207`. A full-file substring search for `"205"` and for
`provider-default`/`provider_model`/"serves the provider" (in case it was logged under a different
id) also returned zero matches — the described issue ("`--provider` override serves the
provider-DEFAULT model instead of spec `provider_model`") is not present anywhere in the ledger
under any id. The highest ED id in the 2xx range that DOES exist is `ED-208`, but its content is
unrelated ("flipped-registry non-Claude pins break Agent-tool spawns" — a harness-spawn model
override, not a `--provider` CLI-flag override). **This claim does not check out — the ED-205
entry does not exist.**

## 8. ED-069, ED-070, ED-071 — CONFIRMED
All three exist in `.claude/project/memory/enforcement-debt.jsonl` (lines 62-64), each dated
`2026-07-17T01:00:00Z`:
- ED-069: "WG-13 write-ahead started-row: a pre-spawn 'started' row ... should be appended to the
  dispatch-completions ledger BEFORE each subprocess spawn ... NOT yet wired ..."
- ED-070: "WG-11(a) additive quota field: completion AND death records ... should carry an
  additive `quota` fragment ... The pure builder quotaField(provider, known) LANDED new-file ..."
- ED-071: "The TEAMMATE STALL RULES (WG-6) rewrite to the verified FIRE-AND-POLL pattern LANDED as
  the new canonical guide .claude/agents/_system/guides/teammate-stall-rules.md ... fold-back into
  the frozen epsilon.md ... is deferred."

## 9. teammate-stall-rules.md — CONFIRMED
Exists at `.claude/agents/_system/guides/teammate-stall-rules.md`.

## 10. Phase-2 evidence claims — CONFIRMED (all three parts)
(a) Worktree `CLAUDE.md` (`WarpOS-wt/SP-20260717-001-builder/CLAUDE.md`) line 5 contains: "You are
**Alex** — the **President** of this autonomous AI company. ..." — present (not the literal first
line of the file, but the Identity section's opening declaration; claim said "begins with or
contains", so this satisfies it).
(b) Root `AGENTS.md`: grep (case-insensitive) for `you are Alpha`, `You are **Alpha**`, `are Alpha —`
returned zero matches — no such declaration exists.
(c) Root `AGENTS.md` size: 14,473 bytes (~14.1 KB) — matches the ~14KB claim.

## 11. "44 session-lifecycle hooks" — PARTIAL
The "44" figure traces directly to the plan's own evidence file,
`_planning/warpos-1.0-plan/evidence/enforcement-audit.md`, which states (line 43): "Fail-OPEN
(advisory/side-effect) — the rest (~44): loggers ..., formatters ..., savers ..., regen ..., and
the untrusted-content firewall" and (line 129): "~44 of the 68 hooks are Claude-session-lifecycle
side-effects". This is a self-consistent citation of the plan's own prior evidence, not a
freestanding fabrication.

However, independently recounting from current disk state does not exactly reproduce 68 or 44:
- `framework/hooks.registry.json` (source): 67 total entries, 63 enabled, 4 disabled.
- `.claude/settings.json` (generated view): 8 event types, 18 matcher blocks, 75 total hook script
  invocations, 64 unique script commands. One additional hook (`smart-context`) sits in a
  `_disabled_hooks` side-table (disabled 2026-07-09, unrelated to this gap).

The discrepancy (67-75 vs. 68) is small and likely reflects hook-count drift between when
enforcement-audit.md was generated and now, or a difference in counting unit (registry entries vs.
wired script invocations vs. unique commands). The "44 of 68" split itself is a categorization
judgment (which hooks count as session-lifecycle side-effects vs. safety-critical gates) that
enforcement-audit.md performs explicitly by name — it is not something a single mechanical count
of settings.json reproduces on its own. Net: grounded in real evidence, internally consistent with
the plan, but not independently exactly reproducible as a raw count today — hence PARTIAL rather
than CONFIRMED.

## 12. Dispatch ledger components — CONFIRMED
- `.claude/runtime/dispatch-completions.jsonl` — exists
- `.claude/runtime/dispatch-deaths.jsonl` — exists
- `scripts/dispatch/gauntlet-verify.js` (+ `.test.js`) — exists
- `scripts/dispatch/dispatch-record-fields.js` (+ `.test.js`) — exists

## 13. sprint-hook-points.json lifecycle steps — CONFIRMED
`.claude/agents/_org/sprint-hook-points.json` exists and its `"lifecycle"` array is exactly:
`["plan", "design", "build", "gauntlet", "release", "retro"]` — 6 steps.

## 14. packet-original/ contents — CONFIRMED
`_planning/warpos-1.0-plan/packet-original/` contains `00-README.md` plus 18 numbered docs
(`01-MASTER-PROMPT-FOR-CLAUDE.md` through `18-SOURCE-INDEX.md`) and a `templates/` subdir with
exactly 5 files: `AGENTS.md.template`, `CLAUDE.md.template`, `GEMINI.md.template`,
`ResultEnvelope.schema.md`, `WorkOrder.schema.md`.

## 15. Pre-existing failing test files exist — CONFIRMED (existence only, not run)
- `scripts/checks/cutover-completeness.test.js` — exists
- `scripts/checks/duplicate-doc-drift.test.js` — exists
- `scripts/checks/assert-warpos-templates-shipped.js` — exists

Per instructions these were located only, not executed, so pass/fail status is not re-verified
here (the plan's claim was only that the files exist as pre-existing failing tests).

---

## Summary

| # | Claim | Verdict |
|---|-------|---------|
| 1 | Sprint branch SHAs | CONFIRMED |
| 2 | Worktree exists + clean | CONFIRMED |
| 3 | 5 evidence files, >2KB | CONFIRMED |
| 4 | worktree-salvage dir, ~6.9MB, untracked | CONFIRMED |
| 5 | I-2 antigravity vs [codex,gemini,agy] | CONFIRMED |
| 6 | I-3 beta-consult.js crash on absolute --out | CONFIRMED |
| 7 | ED-205 (+203/204/206/207) exists | **REFUTED** |
| 8 | ED-069/070/071 exist | CONFIRMED |
| 9 | teammate-stall-rules.md exists | CONFIRMED |
| 10 | Worktree CLAUDE.md / root AGENTS.md checks | CONFIRMED |
| 11 | "44 session-lifecycle hooks" | **PARTIAL** |
| 12 | Dispatch ledger components exist | CONFIRMED |
| 13 | sprint-hook-points.json 6 lifecycle steps | CONFIRMED |
| 14 | packet-original 18 docs + 5 templates | CONFIRMED |
| 15 | Pre-existing failing test files exist | CONFIRMED |

**13 CONFIRMED, 1 REFUTED (#7), 1 PARTIAL (#11).**
