# Acceptance Criteria — S-VLADW1-01 (Vlad Wave-1 ENGINE)

**Sprint:** `S-VLADW1-01`
**PRD:** `.claude/project/sprint/requirements/S-VLADW1-01/prd.md`
**Authored_by:** product-lead (`gpt-5.6-terra`, dispatch `d-msds50a8-d78da49c`), with engineering-provability
constraints from director-of-engineering (`claude-fable-5`), folded by Alex ε.

> **`verified_by:` status.** `PC-20260730-0085` carries NO `goal_verification` block, so the
> SP-20260518-007 design-time fixture gate is a **no-op** for this sprint and `verified_by:` is not
> refused-on-absence. The linkages below are nonetheless authored as real test paths so the
> ship-gate has something to run. They name tests that **do not exist yet** — that is the expected
> design-time state, not a claim of coverage.

---

## DESIGN DECISION D-1 — the four-core MCP tool surface (SETTLED HERE)

The sprint tracker recorded this as an open gap: both the epic and the plan artifact say "4-core"
and **enumerate it nowhere**. The circulating reading — `get_status` / `get_readiness` / `run_job` /
`send_message` — was explicitly logged as "an inference, not a record". It was put to product-lead as
a hypothesis to falsify rather than a set to ratify.

**The inference was wrong, and is not adopted.** The Wave-1 four-core surface is:

| Tool | Why it is core |
|---|---|
| `get_status` | Server health plus each job's authoritative lifecycle state. |
| `get_readiness` | Non-mutating prerequisite checks, before any job runs. |
| `run_job` | Starts an explicitly registered, **read-only** job; records lifecycle locally. |
| `cancel_job` | The safety escape hatch for an in-flight job — it is what prevents a start-without-stop surface. |

**Two moves against the inference, both deliberate:**

- **`cancel_job` moves IN.** `run_job` starts work and the job state machine is in scope, so a
  surface that can start but not stop is a design defect, not a scoping choice. Cancellation mutates
  only Vlad's own job-control state; it is a safety control, not an agent-facing write workflow.
- **`send_message` moves OUT.** It has no coherent recipient or consumer until the Wave-2 agent face
  exists. Shipping it in Wave 1 would ship a tool nothing can talk to.

`approve_job` stays Wave 2 (approval is a product-workflow write). `get_roadmap` stays Wave 3.

**Why `run_job` is not the Wave-2 write path arriving early:** its contract is strict — it may read
the target repository and append only to Vlad's own local journal. It must not mutate the target
repository, approve work, message an agent, or cause external product-side effects. It is execution
of a read-only inspection.

The S-VLADW1-02 audit path is then: `get_readiness` → `run_job` → poll `get_status` → journalled
receipt, with `cancel_job` available if the run stalls.

---

## S-1 — Plain-node app on the Agent SDK, reaching a model through an auth-agnostic seam

- AC-1.1: Given default production configuration, when Vlad obtains model access, then it selects the
  subscription/session adapter and does not require, persist, or emit a developer API credential.
  verified_by: tests/regression/S-VLADW1-01/model-seam.test.js::selects-subscription-adapter-by-default
- AC-1.2: Given the API-key fallback adapter is selected in a controlled test, when it is exercised
  through the common interface, then it satisfies the same result and error contract as the
  subscription adapter **without any change to tool contracts or job-state code**.
  verified_by: tests/regression/S-VLADW1-01/model-seam.test.js::fallback-adapter-contract-parity
- AC-1.3: Given the seam module, when the product tree is scanned, then **no auth-mode conditional or
  mode enum literal appears outside the seam module**. Mode-branching in consumers is what turns a
  seam swap into a rework.
  verified_by: tests/regression/S-VLADW1-01/seam-boundary.test.js::no-auth-mode-literal-outside-seam
- AC-1.4: Given the seam, when it is queried, then it exposes `describeAuth()` returning the live
  mode, the secret shapes, the env denylist and a sentinel hook — the single source the custody
  enforcer, artifact scanner and negative fixture all consume, so a seam flip retargets the enforcer
  without editing it.
  verified_by: tests/regression/S-VLADW1-01/seam-boundary.test.js::describeAuth-is-single-source

## S-2 — MCP stdio server answering the four core tools

- AC-2.1: Given the stdio server starts, when MCP tools are listed, then the list contains **exactly**
  `get_status`, `get_readiness`, `run_job`, `cancel_job` — per D-1.
  verified_by: tests/regression/S-VLADW1-01/mcp-surface.test.js::lists-exactly-the-four-core-tools
- AC-2.2: Given a caller invokes `send_message`, `approve_job`, `get_roadmap`, or any undeclared tool,
  when the request is processed, then Vlad returns a stable unsupported-tool error and **creates no
  job and no journal entry**.
  verified_by: tests/regression/S-VLADW1-01/mcp-surface.test.js::refuses-out-of-wave-tools-without-side-effect
- AC-2.3: Given `run_job` receives an unknown or non-read-only job kind, when validation runs, then
  Vlad refuses it **before creating a job**.
  verified_by: tests/regression/S-VLADW1-01/mcp-surface.test.js::refuses-unregistered-job-kind

## S-3 — Job state machine with an enumerated transition table

- AC-3.1: Given a registered read-only fixture job, when `run_job` succeeds, then it returns a job id
  and the lifecycle records `queued`, `running`, and exactly one truthful terminal state.
  verified_by: tests/regression/S-VLADW1-01/lifecycle.test.js::records-full-transition-path
- AC-3.2: Given a running cancellable fixture job, when `cancel_job` is called, then Vlad records
  `cancellation-requested`, signals the worker, and records `cancelled` **only after** worker
  acknowledgement or termination.
  verified_by: tests/regression/S-VLADW1-01/cancel.test.js::cancelled-only-after-acknowledgement
- AC-3.3: Given a cancellation request that cannot yet stop a worker, when `get_status` is called,
  then it reports cancellation as **pending**, never falsely as `cancelled`.
  verified_by: tests/regression/S-VLADW1-01/cancel.test.js::pending-not-false-cancelled
- AC-3.4: Given an already-terminal or previously-cancelled job, when `cancel_job` is repeated, then
  the response is idempotent and no new worker starts and no target-repository write occurs.
  verified_by: tests/regression/S-VLADW1-01/cancel.test.js::cancel-is-idempotent

## S-4 — Crash-survivable on-disk journal

- AC-4.1: Given a job is killed mid-execution, when the process is restarted, then the target
  repository is unchanged and the journal holds the last checkpoint.
  verified_by: tests/regression/S-VLADW1-01/journal.test.js::kill-midjob-leaves-repo-clean
- AC-4.2: Given any core job execution path, when filesystem activity is inspected in the fixture,
  then Vlad writes **only** under its explicit operational-data root, and invokes no approval,
  message, or agent-face capability.
  verified_by: tests/regression/S-VLADW1-01/journal.test.js::writes-confined-to-operational-root

## S-5 — `get_status` surfaces an interrupted job

- AC-5.1: Given an interrupted job in the journal, when `get_status` is called in a new session, then
  it names the interrupted job and offers resume or discard.
  verified_by: tests/regression/S-VLADW1-01/status.test.js::names-interrupted-job-with-options
- AC-5.2: Given a job id, when `get_status` is called during and after execution, then it returns
  lifecycle state, timestamps and terminal outcome **without inferring success from mere completion**.
  verified_by: tests/regression/S-VLADW1-01/status.test.js::never-infers-success-from-completion

## S-6 — Receipt envelope with a deliberately untyped interior (J4)

- AC-6.1: Given a terminal job, when its receipt is returned and journalled, then both representations
  carry `schema_version` and exactly the three named J4 slots.
  verified_by: tests/regression/S-VLADW1-01/receipt.test.js::envelope-shape-is-version-plus-three-slots
- AC-6.2: Given a fixture supplies arbitrary values in each J4 slot, when Vlad records and returns the
  receipt, then those values **round-trip unchanged** and no ENGINE branch, validation error, or
  derived field depends on their interior structure.
  verified_by: tests/regression/S-VLADW1-01/receipt.test.js::interior-is-opaque-and-never-branched-on

## S-7 — Allowlist env passing; ambient credential state never inherited

- AC-7.1: Given any child-process launch site, when the custody enforcer runs, then it requires the
  audited wrapper **and** an explicit allowlist environment excluding the held secret.
  verified_by: tests/regression/S-VLADW1-01/custody-static.test.js::spawn-sites-use-allowlist-env
- AC-7.2: Given the ambient environment is poisoned with a decoy secret, when the shipped fixture
  spawns a child through the audited wrapper, then the child cannot observe the decoy.
  verified_by: tests/regression/S-VLADW1-01/custody-runtime.test.js::child-cannot-see-decoy

## S-8 — Fail-closed credential-custody enforcer (the ADR subject)

> Scope discipline per ADR-0041: report **per-leg named fields**, never a single `custodyProven: true`.
> Legs that are ASSERTED rather than PROVEN are enumerated in the ADR and must not be restated here
> as proven.

- AC-8.1: Given the declared scanned product surface contains a held-secret value or a seam-declared
  secret shape, when the custody enforcer runs, then it fails with the matching file and rule.
  verified_by: tests/regression/S-VLADW1-01/custody-static.test.js::fails-on-secret-in-scanned-surface
- AC-8.2: Given a raw `spawn` / `exec` / `fork` (or equivalent) bypass of the audited wrapper is
  introduced anywhere in the product tree, when the enforcer runs, then it fails. **A scrubbing
  wrapper alone is insufficient** — it re-opens the defect the moment one caller goes around it.
  verified_by: tests/regression/S-VLADW1-01/custody-static.test.js::fails-on-raw-spawn-bypass
- AC-8.3: Given a dynamic `require`/`import` with a computed specifier in the product tree, when the
  enforcer runs, then it fails — without this ban the import-graph rule is bypassable by construction.
  verified_by: tests/regression/S-VLADW1-01/custody-static.test.js::bans-computed-specifier-imports
- AC-8.4: **(Mutation twin — non-negotiable.)** Given the wrapper's scrub or env allowlist is removed
  in a deliberately unscrubbed test-only spawn, when the negative fixture runs against it, then the
  fixture **FAILS**. A fixture that has never been observed to go red is a decoration, not a proof,
  and can rot forever-green.
  verified_by: tests/regression/S-VLADW1-01/custody-runtime.test.js::negative-fixture-goes-red-when-scrub-removed
- AC-8.5: Given the enforcer's own execution errors, times out, or emits malformed output, when the
  build consumes it, then the build goes RED. **Runner error → non-zero; never green on crash.**
  verified_by: tests/regression/S-VLADW1-01/custody-static.test.js::fails-closed-on-runner-error
- AC-8.6: Given the packaged product runs on a user machine, when the server or job runner starts,
  then the product-layer custody self-check is invoked. An enforcer that runs only in our CI proves
  something about our source and **nothing about their runtime**.
  verified_by: tests/regression/S-VLADW1-01/custody-runtime.test.js::selfcheck-runs-on-user-machine
- AC-8.7: Given the product's outbound clients, when a model operation carries the held secret, then
  the secret attaches only at the seam's single transport choke point, pinned to Anthropic's
  endpoint; raw HTTP-client use outside the seam module is refused by the enforcer.
  verified_by: tests/regression/S-VLADW1-01/custody-static.test.js::egress-pinned-to-seam-chokepoint
- AC-8.8: Given a parse error in any scanned file, when the enforcer runs, then it goes RED rather
  than skipping the file.
  verified_by: tests/regression/S-VLADW1-01/custody-static.test.js::parse-error-is-red-not-skip

## S-9 — Quota-exhaustion detection, three buckets

- AC-9.1: Given a recognized successful provider result, when normalized, then the outcome is success.
  verified_by: tests/regression/S-VLADW1-01/quota.test.js::recognized-success
- AC-9.2: Given a recognized quota-exhaustion signal, when normalized, then the outcome is
  quota-exhaustion and is never reported as success.
  verified_by: tests/regression/S-VLADW1-01/quota.test.js::recognized-quota-exhaustion
- AC-9.3: Given an **unrecognized** signal, when normalized, then the outcome is `could-not-run`, the
  raw signal is surfaced, and it is **not silently classified as quota** — telling a founder to buy
  credits when the fault is elsewhere is the failure this bucket exists to prevent.
  verified_by: tests/regression/S-VLADW1-01/quota.test.js::unrecognized-is-could-not-run-with-raw-signal
- AC-9.4: Given the signal `Server is temporarily limiting requests (not your usage limit)`, when
  normalized, then it does **not** classify as quota-exhaustion — that is capacity, and auto-retried.
  verified_by: tests/regression/S-VLADW1-01/quota.test.js::capacity-limit-is-not-quota
- AC-9.5: Given the three buckets, when the seam flips subscription↔API-key, then bucket
  normalization happens **inside the seam** and the state machine consumes only the enum.
  verified_by: tests/regression/S-VLADW1-01/quota.test.js::normalization-lives-in-seam

## S-10 — Permission-level config port

- AC-10.1: Given a permission-level value outside the ported vocabulary, when Vlad starts, then
  configuration validation fails **before** serving MCP requests.
  verified_by: tests/regression/S-VLADW1-01/permission.test.js::invalid-level-refuses-at-startup

## S-11 — Exactly ONE genuinely enforced refusal

**The refusal is named here** (it was an open question): under the ported **planning/read-only**
level, `run_job` is refused before a job is created. Query tools and `cancel_job` stay available.
This enforces a real safety boundary without inventing a future action taxonomy.

- AC-11.1: Given the planning/read-only permission level, when `run_job` is requested, then Vlad
  returns `permission-denied`, creates neither job nor journal record, and starts no worker.
  verified_by: tests/regression/S-VLADW1-01/permission.test.js::readonly-level-refuses-run-job
- AC-11.2: Given that same level, when `get_status`, `get_readiness` or `cancel_job` is requested,
  then query and safety-control operations remain available.
  verified_by: tests/regression/S-VLADW1-01/permission.test.js::readonly-level-keeps-query-and-cancel

## S-12 — Branding guard

- AC-12.1: Given a release or packaging check, when `branding-identity-enforcer` scans user-facing
  Wave-1 artifacts, then it fails on "Claude Code", on omission of "Vlad, powered by Claude", or on
  an unapproved visual/UI artifact.
  verified_by: tests/regression/S-VLADW1-01/branding.test.js::fails-on-claude-code-or-missing-attribution
- AC-12.2: Given the shipped MCP/server-facing text, when the branding check passes, then the product
  identifies as "Vlad, powered by Claude" with no Claude-Code-mimicking presentation.
  verified_by: tests/regression/S-VLADW1-01/branding.test.js::identifies-as-vlad-powered-by-claude

## S-13 — Host-free driver

- AC-13.1: Given a clean local checkout with no MCP host, agent face, installer or credentials, when
  the host-free driver runs, then it starts the real stdio server and invokes all four core tools
  over stdin/stdout.
  verified_by: tests/regression/S-VLADW1-01/driver.test.js::exercises-four-tools-without-host
- AC-13.2: Given the driver fixture job runs, when the repository fixture is compared before and
  after, then target-repository contents are unchanged and only Vlad's journal directory has new
  records.
  verified_by: tests/regression/S-VLADW1-01/driver.test.js::target-repo-unchanged-after-run

## S-14 — Port-reference verification, made re-runnable

> Every port source in the plan contract is `inferred_from_repo` — cited but never read. A one-time
> "a builder checked them" claim has no honest `verified_by`. This AC converts it into an artifact.

- AC-14.1: Given each ported file, when it is ported, then it records
  `{source_path, source_line, source_content_hash}`, and a shipped script re-verifies every record.
  verified_by: tests/regression/S-VLADW1-01/port-refs.test.js::every-port-reference-reverifies
- AC-14.2: Given a cited reference that does not resolve, when the verification script runs, then it
  exits non-zero and names the citation.
  verified_by: tests/regression/S-VLADW1-01/port-refs.test.js::unresolvable-citation-is-red

---

## Criteria explicitly NOT claimed

Recorded so nobody later reads an absence as an oversight:

- **Calibration.** Nothing here asserts that a readiness number is *accurate* or *meaningful*. That
  is out of scope for ENGINE and, per quality-lead, is not verifiable in Wave 1 at all — there is no
  ground-truth readiness label to validate against. Acceptance is scoped to *honestly computed and
  honestly disclosed*, never to *correct*.
- **SDK-internal credential handling.** The Agent SDK is the credential's legitimate custodian; its
  own store and logs are outside our scanned surface. See ADR-0041 for the full residual list.
- **Third-party/transitive dependency spawn behaviour** beyond the direct-dependency classification.
