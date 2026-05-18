# Red-Team Plan — Sprint Goal Verification

**Sprint:** `SP-20260518-007`
**PRD:** `prd.md`

> Adversarial review for Sprint A. The gates Sprint A introduces (design refusal, release ship-gate) are themselves security-relevant control surfaces — they enforce an audit-trail invariant. The red-team brief focuses on *bypasses* of those gates.

## Threat classes to cover

- [ ] **Gate-bypass via empty `justification`** — operator sets `reproduction: not_applicable` with `justification: ""` (or whitespace), expecting the gate to pass. Beta directive: empty = missing. Verified by `AC-1.1.2` and `AC-1.2.2`.
- [ ] **Gate-bypass via malformed `verified_by:` link** — AC carries `verified_by: foo` (no `::`), parser must NOT mark it as linked. Per `AC-2.1.2`.
- [ ] **Gate-bypass via missing-test-name file** — `verified_by:` cites a file that exists but the test-name string isn't found anywhere in the file's stdout. Per `AC-2.3.3` → inconclusive, gate blocks.
- [ ] **Override-trail injection** — operator crafts a fake decision-ledger row to bypass an inconclusive test. Mitigation: ledger rows must include `operator` field; CI re-validates against the schema. Threat surface is the manual-edit path; document but accept the threat — the operator has filesystem write.
- [ ] **Cited-test file outside corpus** — `verified_by: <other-path>::<test-name>` cites a test outside `paths.sprintRegressionCorpus`. Should the ship-gate accept it? Decision: yes — Sprint A doesn't restrict path; the corpus is the *recommended* home but `verified_by:` accepts any path. Threat: a non-corpus cited test could be silently changed; mitigation: ship-gate logs the full path per `TR-2`.
- [ ] **Path-rotation drift** — `paths.sprintRegressionCorpus` rotates in `.claude/paths.json` but `scripts/hooks/lib/paths.js` lags. Class is exactly LRN-2026-04-29 (stale-anthropic-checks). Mitigation: `AC-1.3.2` asserts lockstep.
- [ ] **Backwards-compat bypass** — operator removes `goal_verification` from an in-flight Plan Contract to bypass the design gate. Mitigation: per `AC-2.2.1` the gate is fully gated on the field's presence (legitimate use case is pre-Sprint-A sprints). Acceptable — the operator's tampering shows up in `git diff`.
- [ ] **Discovery-rule over-broadening** — `/linters:run` discoverer extension picks up `tests/regression/<SP-id>/*.test.js` files as if they were lint targets. Mitigation: `AC-4.1.2` asserts the corpus subtree is excluded.
- [ ] **Inconclusive-default DoS** — adversary crafts a cited-test script that always returns unparseable output, forcing operator overrides on every release. Mitigation: the override is the audit trail; pattern of repeated overrides becomes visible in retro (`TR-3` + `TR-6`).
- [ ] **Replay-on-rename (ENOENT bypass)** — adversary (or careless operator) renames or deletes a cited failing test file. The ship-gate reads the now-missing path, the executor hits `ENOENT`, and if the missing-file branch is silently bucketed as `inconclusive`, the operator gets a decision-ledger override path that converts a real failure into a pass. **Mitigation: `release.js` MUST treat ENOENT on a cited test path as `status: fail`, not `inconclusive`.** This is a stop-the-bus invariant (Beta directive 2026-05-18 design-review, agent `a6eadba65750a3d06`). The implementation in T-20260518-108 must distinguish three branches: (1) test ran + parseable + non-zero → `fail`; (2) test ran + unparseable → `inconclusive`; (3) test path missing or unreadable → `fail`. A new AC is added to S-2.3 (`AC-2.3.5`) to cover this case.
- [ ] **Prompt-injection via Plan Contract `goal_verification.origin_evidence`** — origin_evidence is a free-text string. If `/sprint:design` or `/sprint:release` LLM-summarize the field, injection is possible. Mitigation: helpers do NOT LLM-summarize the field; it's treated as opaque text. Verified by code inspection at execution time.

## Per-sprint additions

- **Hook chain order** — `scripts/hooks/sprint-routing-guard.js` runs on `Edit|Write` to sprint artifacts; a new design-gate hook must run AFTER routing-guard but BEFORE destructive hooks. Verify order in `.claude/settings.json`.
- **Conflict-check overlap** — Sprint A's affected-surface list overlaps with retro'd sprints by design (it edits the same plan.js, design.js, release.js, retrospective.js). Conflict-check is warn-only in this case (verified at /sprint:plan run earlier this session); ensure no `--allow-overlap` flag is needed at execute-time.

## Stop-the-bus signals

If any of these surface during red-team, halt `/sprint:execute` and escalate:

- A code path that lets a Plan Contract advance to `designed` while `goal_verification.reproduction = executable` and the cited tests don't exist.
- A code path that lets `/sprint:release` ship a release with any `status: fail` cited test (i.e. a missing fail-closed branch).
- A code path that accepts `justification = ""` (or all-whitespace) and treats it as a present justification.
- A code path that auto-creates a decision-ledger override on the operator's behalf (no automation here; override is manual by design).
- A code path that bypasses the lockstep check between `.claude/paths.json` and `scripts/hooks/lib/paths.js`.
- A code path that buckets ENOENT-on-cited-test as `inconclusive` (must be `fail`) — Beta-flagged stop-the-bus.
- A `/sprint:full` autonomy-preset escalation path that allows `moderate` to silently approve the fixture gate (it must halt and ask).

## Documentation scaling

Mandatory at `documentation_scale: m | l | xl`. Sprint A is `m`. The threat surface here is the framework's own gating logic — not user-facing product — so the redteam is focused on control-bypass classes, not classic OWASP categories.
