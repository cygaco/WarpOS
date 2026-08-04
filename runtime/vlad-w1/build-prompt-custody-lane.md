# BUILD — S-VLADW1-01 CUSTODY lane (security)

You are the **security-builder** for the Vlad Wave-1 ENGINE sprint. Build ONE unit: the custody lane.

> **SEQUENCING:** this lane runs AFTER the engine lane, because it **hardens seams the engine lane
> creates** — the audited spawn wrapper wraps the engine's spawn sites, and the enforcers walk the
> tree the engine lays down. Read what is already there before adding to it.

---

## CONTRACT LINE — CITE SOURCE, NEVER A SUMMARY

**This is a contract term, not advice.** Every claim you make about a file you port, adopt or scan
must be grounded in the file **as you read it**, and your return must cite `path:line` for each. Do
not rely on a description in this brief, in the acceptance criteria, in a tracker, or in an epic —
including where they agree with each other.

**Why this is binding rather than aspirational:** on this sprint, reading source has corrected the
recorded record **seven times**, and **two** of those would have shipped actively wrong behaviour to
users rather than merely inaccurate documentation. Concretely, one cited "preflight" file turned out
to be a WarpOS install gate whose refusal message would have made the product **reject every stranger
repository it was built to audit** — behind a citation that looked entirely correct. If a citation in
this brief does not match what you find, **stop and report the mismatch** rather than building to
either version.

---

## WHERE YOU WORK

- **Isolation worktree (your ONLY working directory):**
  `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`
- **Your tree:** `<worktree>\engine\`
- **Never touch the canonical checkout** at `C:\Users\Vlad\Desktop\Claude\Projects\vlad`.
- **Never touch the repo root's Next.js/Supabase scaffold** — it is dormant and is not the product.

## SPEC — read in full first

- `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\acceptance-criteria.md`
  — **read S-8 completely**, including the SHIPPED-TREE BOUNDARY block and the seven-identity table.
- `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\agents\president\_system\policy\adr\0041-credential-custody-prove-assert-boundary.md`
  — **ADR-0041 is the governing document.** Read the PROVEN / ASSERTED split and the labeling rule.

---

## THE SHIPPED-TREE BOUNDARY — this defines what your enforcers walk

The **shipped artifact is the engine package** (`engine/` + agent face + installer), **NOT the repo
root**. The repo root holds ~2280 files of a dormant web scaffold. A root walk would report a large
green surface while proving nothing about the code that handles the secret — **weaker than a narrow
scan, and it reads stronger, which is the dangerous combination.** P1's claim is bounded by the
surface it enumerates, so enumerate the right one.

## THE SEVEN ED-340 ENFORCER IDENTITIES — adopt these names, do not mint new ones

Paths are relative to `engine/`. ED-340 closes only when **all seven exist AND both mutants pass**.

| Leg | Identity | Requirement |
|---|---|---|
| P1 | `scripts/checks/no-held-secret-in-surface.js` | Scan the **UNION of every seam secret class unconditionally** — API-key patterns **AND** OAuth/session-state patterns. **NEVER derive the match set from which seam is live** (a stale value would silently narrow the scan and pass GREEN, and both secrets can be present at once since the fallback seam is engineered). An unrecognized seam value **fails closed**. A new seam ADDS a class. |
| P2 | `scripts/checks/spawn-env-allowlist.js` | Two assertions: every audited spawn passes an explicit allowlist env excluding the held secret; **and** any raw `spawn`/`exec`/`fork` outside the audited wrapper is a **REFUSAL, not a warning**. Also ban dynamic `require`/`import` with computed specifiers — without it the import-graph rule is bypassable by construction. |
| P3 | `test/credential-custody-decoy.test.js` | Runtime decoy fixture, **one decoy PER SECRET CLASS** (not one overall — one decoy proves the scrub only for whichever class it represented). Poison ambient env, spawn through the wrapper, assert the child cannot see any decoy. |
| **P4** | `scripts/checks/no-secret-on-outbound.js` | Outbound-request **call-site walk**; the SDK auth call is the **sole permitted carrier**. |
| A5 | (firing point) | P1–P4 wired into the product's **own ship-time check run**, not only CI, with the wiring asserted by a presence check in the release gate. **An enforcer that runs only in our CI proves something about our source and nothing about the user's runtime.** |
| Labeling | (claim lint) | Every custody claim string in shipped copy must map to a P-clause id; a claim mapping to nothing fails the build. |
| A1–A4 | (presence obligation) | The four ceilings must appear **verbatim** in the shipped custody statement. **No in-repo enforcer exists or can exist for A1/A2 — that is the finding, not a gap to close.** |

**THE TWO MUTANTS ARE NON-NEGOTIABLE.** P3's: the decoy fixture must go **RED** when the scrub is
removed. P4's: a planted non-auth outbound call carrying a decoy secret must go **RED**. *An enforcer
with no observed red state is enforcement debt wearing a green badge* — and P4 has no runtime fixture
behind it, so its mutant is the only thing between "P4 exists" and "P4 works".

**Fail-closed everywhere:** runner error, timeout, malformed output or a parse error in any scanned
file → **non-zero**. Never green on crash.

## CLAIM SCOPE — state what each leg proves, and no more

Report **per-leg named fields**, never a single `custodyProven: true`. P4 in particular is PROVEN **at
call-site scope**: it proves the held secret is **not attached to a non-auth outbound call**. It does
**not** prove a destination is safe, and **dependency-initiated egress folds into the existing A1
ceiling**. Do not let "egress is proven" be written as "nothing can leak". If a proven claim must
later narrow, **rename the field** (ADR-0040) rather than redocumenting what the old name means.

**Final user-facing custody wording is Class C — operator territory.** Draft to the proven set and
leave the wording to the operator. Do not finalise it.

## YOUR OTHER SCOPE

- **Model-access seam** — one module that alone knows the live auth mode, touches credential material,
  and builds the SDK client. Exports a session factory (consumers get a handle, **never a token**) and
  **`describeAuth()`** → `{ mode, secret shapes, env denylist, sentinel hook }`, consumed by P2's
  denylist and P3's fixture. **Not by P1** — see P1's row above.
  **No auth-mode conditional or mode literal may appear outside this module**; mode-branching in
  consumers is what turns a seam swap into a rework.
- **Audited spawn wrapper** and **audited output module** (the writer registry P1's surface derives
  from — a writer outside it must be refused).
- **Quota classification, three buckets, normalized INSIDE the seam** so the state machine consumes
  only the enum: recognized success; recognized quota-exhaustion; unrecognized → `could-not-run` with
  the raw signal surfaced. Never success, and never silently "quota" — that tells a founder to buy
  credits when the fault is elsewhere. Do **not** trip on `Server is temporarily limiting requests
  (not your usage limit)`, which is capacity and auto-retried.
- **Branding guard** — fails on "Claude Code", on a missing "Vlad, powered by Claude", or on an
  unapproved visual artifact.

## VERIFIED FINDINGS TO CARRY (each confirmed at source, cite them yourself before relying on them)

1. **`scripts/portfolio/registry.js` already practises path privacy** — `_pathOffset()` logs paths
   **relative to `os.homedir()`**, commented "never log absolute paths". P1 scans telemetry payload
   builders; **preserve this behaviour rather than rediscovering it**.
2. **`scripts/turbo/permission-profile.js` carries a doctrine the product must inherit:** the harness
   **auto-mode classifier sits ABOVE `permissions.allow`**, so declaring `auto` does **not** satisfy
   the classifier. Vlad's permission levels must never promise `auto` for an action a higher gate will
   still refuse — otherwise the level is a claim the system cannot honour.
3. **Do NOT port `scripts/bootstrap/lastmile/phases/preflight.js`.** It is a WarpOS install gate whose
   refusal would make the product reject non-WarpOS repositories. Named here so you don't reach for it.

## FOLDED IN FROM THE ENGINE LANE — one micro-gap, and one obligation that is genuinely yours

**1. AC-14.1 / AC-14.2 have no test (micro-gap, folded here deliberately).** The engine lane shipped
`engine/src/port-refs.js` and `engine/port-references.json` — the code exists — but **no test exercises
them**. This is a missing test, not missing code. Write it:
- **AC-14.1:** each ported file records `{ source_path, source_line, source_content_hash }` and a
  shipped script **re-verifies every record on demand** — the point is that the port claim is
  *re-executable* rather than a one-time assertion someone made once and nobody can recheck.
  `verified_by: engine/test/port-refs.test.js::every-port-reference-reverifies`
- **AC-14.2:** a cited reference that does not resolve makes the script **exit non-zero and name the
  citation**.
  `verified_by: engine/test/port-refs.test.js::unresolvable-citation-is-red`

**Why this one matters more than its size suggests:** on this sprint, verifying cited port sources
caught **two** bad citations, one of which (`phases/preflight.js`) would have made the product refuse
every stranger repository it exists to audit. AC-14 is the mechanism that keeps that class catchable
after we stop looking by hand. A port-reference record that cannot be re-run is decoration.

**2. The SDK dependency is YOUR obligation, not an engine-lane omission.** `engine/package.json` ships
with `dependencies: {}` and that is **correct-by-design** for the engine lane: an MCP stdio server in
plain node is JSON-RPC over stdio and needs no package, which the passing driver test demonstrates.
`@anthropic-ai/claude-agent-sdk` belongs to the **model-access seam — your scope**. Add it **with its
A1 justification in the same commit**, pinned to a version you have **verified is published**. If you
cannot verify one, leave it undeclared and say so; do not invent a version.

## DEPENDENCY POLICY — BINDING

Read `vladDependencyPolicy` in `engine/package.json`. **Every dependency requires a written
justification against ADR-0041's A1 residual in the same commit that adds it.** A1 is the largest
residual and near-zero-dep is its only mitigation, because any package in the tree can read
`process.env` and reach the network. Never invent a version — verify it is published, or leave it
undeclared and say so.

## TESTS

Built-in **`node --test`**, tests under `engine/test/`. Use the exact file and test names in the
acceptance criteria's `verified_by:` lines — they are the ship-gate's contract.

## HOW TO REPORT

Return: what you built; which ACs are satisfied and which are **not**; every dependency added with its
A1 justification; every `path:line` you relied on; and anything you could not verify. **Do not claim
an AC is satisfied unless you ran its test.** An honest "built but untested" is worth far more than a
confident overstatement — I verify against the worktree regardless, and a false claim costs a full
gauntlet round to unwind.
