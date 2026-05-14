# Red-Team Plan — Harden WarpOS update pipeline

**Sprint:** `SP-20260514-001`
**PRD:** `prd.md`

## Threat classes to cover

- [ ] **Authentication / authorization bypass** — N/A (no auth surface; `--operator-override` is the override; no impersonation).
- [ ] **Input validation / injection** — `--override-reason` is logged verbatim in audit log. Confirm a malicious reason string can't break JSONL parsing (newline escaping).
- [ ] **Business-logic abuse (multi-step exploits)** — Can a sequence of overrides + ownership transitions lead to a consumer being silently re-classified into a state that bypasses future preflight? Specifically: chained `operator-override applied-migrations` + ownership transition combo.
- [ ] **Secrets exposure** — Audit log writes `operator` field. Confirm no `paths.eventsFile` write includes env values, just operator label.
- [ ] **External service abuse** — N/A.
- [ ] **Approval-boundary bypass** — Confirm `--operator-override` does NOT bypass push/tag approval (those are out of preflight scope per Plan Contract approval_boundaries).
- [ ] **State-of-the-world bypass** — Acting on stale `framework-installed.json` after a partial apply failure. Verify transaction wrapper still rolls back on any failure.
- [ ] **Prompt-injection of the agent loop** — N/A (CLI tools, not agent dispatched).

## Per-sprint additions

- **Hash-collision / preimage on truncated prefix.** Verify that during the 0.6.x → 0.7.0 transition, an attacker who crafts a file matching a 12-char prefix cannot pass `hashMatches` against a full 64-char canonical. (`hashMatches` MUST compare prefix vs prefix-of-long, and reject when long-vs-long differ.)
- **Ownership transition spoofing.** Confirm a consumer can't trick the classifier into transitioning a `framework_owned` (not `framework_template`) path to `project_owned` by hand-editing. Only `framework_template` is eligible for transition; `framework_owned` MUST stay `framework_owned`.
- **Override flag confusion attack.** Verify `--operator-override <typo>` doesn't silently match the closest gate name. Exact match only.
- **Empty-reason whitespace bypass.** `--override-reason "    "` MUST be rejected as empty (post-trim).
- **Audit-log tampering surface.** `paths.eventsFile` is append-only by convention. Confirm the override audit doesn't open a writable handle the rest of the apply pipeline could clobber.

## Stop-the-bus signals

If any of these surface during redteam, halt `/sprint:execute` and escalate:

- Any path to bypassing the `--override-reason` requirement.
- Any path to a `framework_owned` file being transitioned to `project_owned`.
- Any path to overrides being applied without an audit event being written.
- Any path to a `hashMatches` accept on a real-drift (non-LF) mismatch.
- Any path where the transaction wrapper fails to roll back after an override-accepted gate's actual side effect goes wrong.

## Documentation scaling

Required at `documentation_scale: l`.
