# Red-Team Plan — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**PRD:** `prd.md`

> Adversarial review. Diff-model review on redteam is declared in
> `paths.sprintRouting`. SP-005 is rated `risk_level: high` because it
> rewrites the update flow and touches release-gates.

## Threat model

The blast radius of SP-005 is "any operator running `/warp:update` against
any project." Any bug here lands in every downstream install on the next
update. The redteam questions below are NOT theoretical — each one maps
to a way the new code could ship a regression worse than the disease.

## Threat classes to cover

- [ ] Authentication / authorization bypass — N/A (update.js runs locally
      under operator credentials only).
- [ ] Input validation / injection — capsule contents are TRUSTED (built
      by canonical), but a poisoned capsule is an attack vector — see
      RT-3 below.
- [ ] Business-logic abuse — RT-1, RT-2.
- [ ] Secrets exposure — N/A (no secrets in capsule contents; framework
      manifest is git-tracked public).
- [ ] External service abuse — N/A (no ESDs).
- [ ] Approval-boundary bypass — RT-6.
- [ ] State-of-the-world bypass — RT-4.
- [ ] Prompt-injection — N/A (no LLM in the update flow).

## Per-sprint adversarial scenarios

### RT-1 — Can a malicious capsule cause rollback to OVERWRITE uncommitted operator work?

**Scenario:** Capsule's `framework-manifest.json` declares an asset at
`<dest>=README.md`. The operator has uncommitted edits to `README.md` (a
file outside the framework asset list normally, but the malicious capsule
includes it). Preflight passes. Transaction begins:
`snapshot.json` records `pre_state_sha256` of `README.md` and copies it to
`backup/README.md`. Apply overwrites `README.md` with capsule content.
Migration throws. Rollback restores `backup/README.md` — but the operator
THINKS their uncommitted work is safe because rollback "worked."

**Result:** Operator's uncommitted README edits ARE preserved (backup was
taken before overwrite). Rollback is correct.

**But:** If apply succeeds and operator THEN reverts via `--rollback
<txId>`, rollback overwrites whatever the operator did AFTER the apply
with the pre-apply backup. Operator may lose post-apply work.

**Mitigation (RT-1):** Before `--rollback <txId>`, re-snapshot every file
the rollback will touch into `<txDir>/rollback-undo/<rel-path>` so the
operator can "undo the undo." Document in COPY C-7 that
`--rollback` is itself transactional. **Adds R-30** (new requirement).

**Severity:** Medium. Operator-driven `--rollback` is opt-in, so this
only fires if operator explicitly asks for rollback. But the existing
ROLLBACK.md text says "to restore everything: cp -r" — that has the same
bug and predates SP-005.

**Linked AC:** AC-RT-1 (added to acceptance criteria via R-30).

### RT-2 — Can a poisoned `snapshot.json` fake a successful rollback?

**Scenario:** Attacker (or filesystem corruption) modifies
`<txDir>/snapshot.json` mid-apply to remove entries for files the apply
already touched. Rollback runs from the truncated snapshot, leaves the
modified files in place, and reports `restoredCount=0 unlinkedCount=0`.
Operator sees "rollback succeeded" but install is half-half.

**Mitigation (RT-2):** Write `snapshot.json` ONCE atomically at
`transaction.begin()` via `fs.writeFileSync` to a tempfile + `fs.rename`,
then make it readonly (`fs.chmodSync(path, 0o400)`). Any subsequent
modification during apply MUST go to `snapshot.delta.jsonl` (append-only
log of decisions taken / files touched), and rollback reads
`snapshot.json + delta` together. Hash the snapshot at begin and verify
the hash at rollback; if it doesn't match, refuse rollback and emit
TR-3 with `outcome="rollback-refused-snapshot-tampered"`. **Adds R-31.**

**Severity:** Low (requires concurrent filesystem write or attacker on
local disk), but the failure mode is silent → mitigation is cheap.

**Linked AC:** AC-RT-2.

### RT-3 — Race: operator runs git operations DURING apply

**Scenario:** Operator's IDE runs `git status` / `git add` / a pre-commit
hook concurrent with `--apply`. Apply is writing files; git sees an
inconsistent state and either errors or commits partial state.

**Mitigation (RT-3):** At `transaction.begin()`, write a lock file at
`<targetRoot>/.warpos/transactions/active.lock` containing the txId. If
the lock already exists, refuse `--apply` and surface "another warpos
update is in progress (or crashed)." Lock is removed on commit or
rollback completion. Document that operator should pause IDE auto-saves
during `--apply`. NOT a hard guard — that would require OS-level
filesystem locks — but the lock file catches the simultaneous-warpos-
update case and warns about concurrent edits. **Adds R-32.**

**Severity:** Medium. Concurrent IDE edits are realistic.

**Linked AC:** AC-RT-3.

### RT-4 — State-of-the-world bypass: stale preflight cache

**Scenario:** Preflight runs, all green, but `--apply` was invoked
seconds later. Between preflight and `transaction.begin()`, the
filesystem state changed (operator edited a file, git pulled, etc.) and
the apply now operates on different content than preflight inspected.

**Mitigation (RT-4):** Re-run a fast subset of preflight gates
(`install-baseline`, `manifest-honesty`, `tracked-transients`) at
`transaction.begin()` — costs ~50ms but catches the race. If the second
pass disagrees with the first, refuse apply and direct operator to re-run.
**Adds R-33.**

**Severity:** Low-medium. Realistic race; mitigation is cheap.

**Linked AC:** AC-RT-4.

### RT-5 — False-positive gates block legitimate updates (Plan Contract overbuild risk)

**Scenario:** A new gate (e.g. `version-quorum`) is too strict —
legitimate operator state triggers red. Operator can't update. False
positives erode trust faster than failures.

**Mitigation (RT-5):** Every NEW gate gets an explicit override flag in
its design:
- `version-quorum` → `--allow-version-drift` (logs a warning, proceeds).
  But default is REFUSE because the historic operator pain (handoff
  2026-05-13-1528 line 21) was version drift.
- `install-baseline` → `--force-fresh` (already in R-2).
- `migration-presence` → no override (refuse to apply a broken capsule;
  the broken capsule is the bug, not the gate).
- `capsule-resolvable` → `--source <path>` (explicit canonical pointer).

All overrides require explicit operator action; no silent bypass. Each
override emits a TR-1 event with `data.overrideUsed=true` so we can mine
for over-aggressive gates post-launch. **Adds R-34.**

**Severity:** High (was specifically called out by Beta in Plan Contract
`overbuild_risks`).

**Linked AC:** AC-RT-5.

### RT-6 — Approval-boundary bypass: someone wires the transactional change without recording the approval

**Scenario:** A future agent (or the human operator) implements R-13..R-18
without the recorded AP-20260513-004 approval. The architecturally
significant change to the update flow ships without explicit consent.

**Mitigation (RT-6):** Tickets T-NNN for S-5 and S-6 carry
`approval_required: true` linking to AP-20260513-004. `sprint:execute`'s
ticket-gate enforces that approval state is `approved` before the
ticket can move to `in_progress`. **Already covered by ticket
metadata; no new requirement.**

**Severity:** Low (process-level mitigation already in place).

**Linked AC:** AC-RT-6.

### RT-7 — Prompt injection via mined failure signatures

**Scenario:** A future operator names a file with shell metacharacters
(`; rm -rf /`) and that name ends up in a TRACE event's
`data.failedAt` field. Later, when `/learn:deep` summarizes recent
failures and a different agent reads that summary back, the shell
metacharacters get re-interpreted.

**Mitigation (RT-7):** All `events.jsonl` field values are JSON-encoded;
shell metacharacters are safe in JSON. Document in TRACE TR-1..TR-6 that
fields are JSON strings, not shell tokens. No bash composition of event
fields. **No new requirement; existing logger.js handles JSON
encoding.**

**Severity:** Very low.

**Linked AC:** N/A.

## Stop-the-bus signals

Halt SP-005 execution and escalate if any of these surface during build:

- [ ] **Rollback restoredCount + unlinkedCount mismatch** with the count
      of intended actions in the snapshot. Indicates rollback is silently
      incomplete.
- [ ] **A NEW preflight gate fires false-positive on the canonical repo
      itself** (`update.js --to 0.5.0 --dry-run` against canonical should
      produce 10/10 green). If canonical's own state can't pass, the
      gates are too strict.
- [ ] **A migration test fixture causes the rollback test to leave files
      behind**. Means rollback is broken — STOP.
- [ ] **`events.jsonl` gets a malformed event** that breaks downstream
      consumers (`/learn:deep`, `/check:patterns`). Means logger contract
      is broken.
- [ ] **Postflight auto-rollbacks something it shouldn't** (postflight is
      diagnostic; auto-rollback is explicit-opt-in only).

## Added requirements from red-team

These get appended to PRD on integration:

- **R-30** (RT-1) — `--rollback <txId>` is itself transactional; snapshot
  before rollback to `<txDir>/rollback-undo/`.
- **R-31** (RT-2) — `snapshot.json` is atomic+hashed; `snapshot.delta.jsonl`
  is append-only; rollback verifies hash before restoring.
- **R-32** (RT-3) — Transaction lock file at `<targetRoot>/.warpos/transactions/active.lock`;
  refuse concurrent `--apply`.
- **R-33** (RT-4) — Re-run fast preflight subset at `transaction.begin()`;
  refuse apply if disagreement.
- **R-34** (RT-5) — Each new gate has an explicit override flag (where
  reasonable); override usage emits TR-1 with `overrideUsed=true`.

## Documentation scaling

Required at scale `m | l | xl`. The 7 RT scenarios above are the
sprint-specific personas; standard threat-class checklist is also covered.
