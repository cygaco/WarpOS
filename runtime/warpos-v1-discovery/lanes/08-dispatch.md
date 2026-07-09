# Dispatch Kernel — Discovery Report (disc-dispatch, 2026-07-09)

## Component map
- `scripts/dispatch-claude.js` — build-chain Claude wrapper (`claude -p --agent <role>`); reap-safe; writes ok:true/false completion + death records; owns the `-w`/`--worktree` isolation gate (`:281`) + `--review-fallback` lane (`:209`).
- `scripts/dispatch-agent.js` — **the canonical telemetry module** + cross-provider wrapper (codex/gemini). Exports `recordCompletion/recordDeath/makeDispatchId/cmdlineChecksum/runContext/promptDigest/outputDigest/argvSchemaVersion`; every other wrapper `require`s it (dispatch-claude.js:58). runProvider does fallback + zero-byte death (`:878`).
- `scripts/dispatch-review.js` — FIRES a role's `passesOf()` (primary+second_pass+third_pass) in PARALLEL, one child per provider; merges any-FAIL-holds (`mergeLanes:133`). Makes multi-pass a real consumer, not prose.
- `scripts/dispatch-skill.js` — heavy-skill subprocess wrapper (same ledger).
- `scripts/dispatch/dispatch-contract.js` — reader+validator of the SHAPE keystone: `validateDispatch` (`:132`), `validateContractFile` (`:394`), `contractEnforceMode` (`:562`), `sanctionedLane`, mode-narrowing.
- `.claude/agents/_org/dispatch-contract.json` — shapes, class_derivation, role_classes, role_overrides, mode_profiles, sanctioned_lanes, skills. `role-registry.json` — role IDENTITY (provider/model/build_chain/second_pass/third_pass).
- `scripts/dispatch/coverage-gate.js` — N-1 sprint-theater killer (`evaluate:129`); `gauntlet-verify.js` — absence-is-death, well-formed-record enforcer.
- Support: `catalog.js` (provider/model SoT), `state.js` (env-shadowed config), `registry-roles.js` (`passesOf`), `org-roles.js`, `hooks/lib/providers.js` (CLI/auth registry), `safe-spawn.js` (safety kernel), `timeout-policy.js`, `provider-breaker.js`, `auth-resolver.js`, `reap-orphans.js`, `checks/security-pass-count.js`, `legacy-cutoff.js`.
- **Compose:** orchestrator → `dispatch-{claude,agent,review}` → contract-consult → shape-door → `safe-spawn` → provider CLI → completion/death record → `coverage-gate`/`gauntlet-verify`/`security-pass-count` read the ledger.

## Enforcement map
| Enforcement | Where | Trigger | Class |
|---|---|---|---|
| Contract gate `validateDispatch` | dispatch-contract.js:132; call dispatch-claude.js:382 | every dispatch | MECH-NEUTRAL, **ENFORCE default** |
| build_chain→NOT in-process hard invariant | dispatch-contract.js:151 (+validate :430) | build_chain role w/ in-process shape | MECH-NEUTRAL |
| api-when-CLI refusal | dispatch-contract.js:159 | 'api' shape not in allowed | MECH-NEUTRAL |
| worktree-required cwd gate | dispatch-contract.js:181 + dispatch-claude.js:281 | build-chain w/o valid `-w`/worktree | MECH-NEUTRAL |
| Shape-door (canonical PICK) | dispatch-shape.js (dispatch-claude.js:526) | shape mismatch, exit 2 | MECH-NEUTRAL |
| Coverage gate (unbacked/stale/blind/diversity) | coverage-gate.js:129 | expected role w/o backed+proven record | MECH-NEUTRAL, **BLOCKING default** |
| gauntlet-verify (typed-success) | gauntlet-verify.js | missing/malformed ok:true record | MECH-NEUTRAL |
| Zero-byte reap detection | dispatch-claude.js:597; dispatch-agent.js:878 | exit0 0-bytes / non-ok 0/0 | MECH-NEUTRAL |
| Timeout + fg clamp (540s) | timeout-policy.js | fg dispatch >540s | MECH-NEUTRAL |
| Reaper (orphan grandchildren) | reap-orphans.js | session start report-only; `--apply` | MECH-NEUTRAL |
| Provider quota breaker (TTL, fail-open) | provider-breaker.js | quota_exhausted | MECH-NEUTRAL |
| safe-spawn tool-id + arg allowlist + tree-kill | safe-spawn.js:58,100,188 | every spawn | MECH-NEUTRAL |
| security multi-pass firing + any-fail merge | dispatch-review.js | security-reviewer dispatch | MECH-NEUTRAL |
| security-pass-count | checks/security-pass-count.js | config HARD; runtime report-only | config MECH-NEUTRAL / runtime SCAN |
| Keystone integrity `validateContractFile` | dispatch-contract.js:394 | scan:dispatch-contract | SCAN-ONLY |
| mode_profiles narrow-only invariant | dispatch-contract.js:479 | validate + opt-in runtime | MECH-NEUTRAL (validate) / report-only (runtime) |
| Raw provider-CLI block | hooks/dispatch-route-guard.js | Bash `codex exec`/`gemini -p`/`claude -p` w/o wrapper | **MECH-CLAUDE** (PreToolUse hook) |
| W3 review-lane-min policy | coverage-gate.js:299 | phase risk-class | MECH-NEUTRAL, report-only |

## Ramp state (actual, from code)
- `WARPOS_DISPATCH_CONTRACT_ENFORCE` → **default ENFORCE** (`contractEnforceMode` returns `true`, dispatch-contract.js:586; ADR-0013 amended SP-20260627-001). Kill-switches: `WARPOS_DISABLE_SHAPE_DOOR=1` (master), `=report|off|0` (fleet), `_<WRAPPER>=report` (per-wrapper). Callers fail-**OPEN** on module-load error.
- Coverage gate → **default BLOCKING** (coverage-gate.js:331-332); opt out `--report-only` / `WARPOS_COVERAGE_GATE_ENFORCE=report`.
- security-pass-count → config-coherence **HARD/exit1**; runtime stamps **REPORT-ONLY** unless `--strict`.
- mode_profiles narrowing → **REPORT-ONLY** (runtime only fires when caller passes `mode`; defense-in-depth).
- Skills routing → seeded; unverified `subprocess`→treated `inline` (report-only).

## Ledger integrity
- Files: `.claude/runtime/dispatch-completions.jsonl` + `dispatch-deaths.jsonl` (PATHS keys `dispatchCompletionsFile`/`dispatchDeathsFile`; test seam `DISPATCH_LEDGER_DIR`, dispatch-agent.js:206). Append-only JSONL, fail-open writes.
- Anti-fake layers: **backed** = `dispatch_id` + `cmdline_checksum` present (`isBackedRecord`, coverage-gate.js:44); phantom ok:true rows rejected (`:231`). **schema version** `argv_schema_version="1"` current; stale/backfilled rejected. **proof-of-artifact** = non-empty `output_digest` OR `artifacts[].sha256`; `--verify-artifacts` re-hashes on disk. Waivers need who/when/why/trail (`waiverProvenance:63`).
- **Missing:** `cmdline_checksum` is a plain sha256 of `role|provider|promptBytes|argv` (dispatch-agent.js:114) — reproducible, **not** an HMAC/signature, so a hand-authored row can be made "backed" if the author knows the formula. No `evidence_sha`. **No git-commit ↔ completion-record cross-check exists** — nothing links a commit SHA to a `dispatch_id`/`run_id`; a rebuild needs a record→commit binding (stamp the produced worktree/commit SHA into the record + a gate reconciling git log ↔ ledger).

## New-provider (Antigravity/agy) integration checklist
Confirmed: **zero `agy`/antigravity touchpoints in the kernel today** (only `manifest/build.js:496` names an ANTIGRAVITY.md doc). gemini is the current 3rd lane and is HARD-DEPRECATED (ED-060). A new provider must integrate at ALL of:
1. `providers.js` `DEFAULT_PROVIDERS` block (`:361`) — `cli`, `default_model`, `fallback`, `syntax` template + stdin convention.
2. `providers.js` auth-posture detection (`authPosture` gemini branch `:96`) + key/oauth loader (mirror `loadGeminiKey`).
3. `catalog.js` provider entry (id/label/cli/`cliEffortFlagTemplate`/`syntaxTemplate`/`models[]`) + model-chain + role-parity catalog membership.
4. `dispatch-contract.json` `class_derivation` rules (`:70`) — add `{provider:"antigravity"}`→reviewer/tool/lead/director classes (else roles fall to fallback_class).
5. `role-registry.json` — set `provider`/`model`/`fallback` (+ `second_pass`/`third_pass` if it joins the security chain).
6. `safe-spawn.js` — add to `TOOL_IDS` (`:58`) AND author `ARG_POLICY.agy` (`:100`): subcommands/boolFlags/valueFlags validators/positionals — else every spawn is refused "no arg-policy".
7. `dispatch-agent.js` `tool_id` stamp map (`:865`) — add agy→cli.
8. `dispatch-agent.js` runProvider — syntax builder, reasoning-flag template, quota-failure classification (for the breaker).
9. `dispatch-route-guard.js` — add raw-`agy` prompt pattern to the forbidden set.
10. `auth-resolver.js` — precedence entry for agy key-file/oauth.
11. `state.js` provider role-set maps; `timeout-policy.js` `WRAPPER_DEFAULTS` (generic, likely OK). `provider-breaker.js` is provider-name-generic (no change).

## Rebuild needs
- **KEEP as-is:** `safe-spawn.js`, `auth-resolver.js`, `provider-breaker.js`, `timeout-policy.js`, `reap-orphans.js`, `coverage-gate.js`, `gauntlet-verify.js` — all MECH-NEUTRAL, helm-portable.
- **EVOLVE:** dispatch-contract is already the WorkOrder→shape resolver — formalize real `WorkOrder`/`ResultEnvelope` types at the wrapper boundary (today ad-hoc argv + a JSON stdout line). Collapse `DEFAULT_PROVIDERS`+`catalog.js`+`class_derivation` into ONE provider-adapter registry (three sources duplicate provider facts). Flip mode_profiles + security runtime stamps report-only→blocking (both ship with fixtures).
- **REPLACE/ADD:** (a) **ledger authenticity** — HMAC/signed `evidence_sha` so `isBackedRecord` isn't hand-forgeable; (b) **commit↔record cross-check** gate (record stamps produced SHA; helm-neutral validator reconciles git log ↔ ledger) — the biggest missing enforcer; (c) **lease/heartbeat** primitive — none exists in the kernel (only `active-run.js` oneshot-heartbeat + concurrency locks); reaper is signature-based, not lease-based. Base worktree policy lives only inside `dispatch-claude.js:281` — lift it into the contract as a first-class `cwd_policy` executor shared by all adapters.
