# ADR-0041 — Credential custody for the Vlad engine: the PROVE / ASSERT boundary

- **Status:** ACCEPTED (2026-08-03) — α-reviewed and accepted same day (drafted by a delegated lane; the
  drafting lane did not commit). Satisfies β's OPEN_ADR from `7c4e2b96` (narrow scope, see Deciders).
- **Deciders:** β verdict `7c4e2b96-5d81-4a37-b0f2-91e6c58a3d74` (DECIDE, class B, 0.88, **OPEN_ADR narrow** — β
  scoped the ADR to "the credential-custody control's prove-versus-assert boundary, not the sprint as a whole");
  operator ruling 2026-08-01 (model access is SUBSCRIPTION-PRIMARY), which changed *which secret* the control
  guards and nothing else about it.
- **Sprint of origin:** S-VLADW1-01 (`trackers/sprints/S-VLADW1-01-vlad-engine-skeleton.md`), epic E-VLAD-001
  Wave-1 ENGINE. The boundary governs beyond it — see Scope.
- **Adjacent doctrine:** ADR-0039 §A2.1 condition 2 (a claim consumed as a safety guarantee must never be
  silently false) — β classed the original DoD wording as exactly this defect, arriving **pre-build**;
  ADR-0040 (no-relabelling: weaken the reported CLAIM, never the invariant; RENAME a field whose meaning
  narrows); ADR-0025 (attestation origin-proof — the precedent for **naming** a same-user trust ceiling and
  accepting it rather than engineering around it); the CLAUDE.md lib-only-fix rule (a fix living only inside a
  helper re-opens its bug the moment one caller goes around the helper).

## Context

The Vlad engine holds a secret belonging to the user and authenticates to Anthropic's endpoint with it. The
epic's Definition of Done originally obliged the product to prove *"the user's Anthropic API key never leaves
their machine — no transmit, no log, no proxy, no telemetry."* β's A1 established that this is **unachievable
as written**: the Agent SDK authenticates *with* the secret, so transmitting it is the mechanism, not a leak. A
fail-closed enforcer over that wording must either lie to pass or red-flag correct behaviour forever. The
obligation was reworded to the achievable **credential-intermediary** form and landed in all three artifacts
(sprint DoD `33024f46`, epic DoD via α's `/epic:fold` `3a8fd442`, banked planning inputs `88abeb8b`).

What was *not* settled by that rewording, and is what β flagged OPEN_ADR, is the boundary itself: which
obligations a mechanical enforcer can **PROVE**, which remain **ASSERTED** posture, and how an assertion is
labeled so it is never consumed as a proof. That boundary currently lives only in sprint-contract prose. Two
things make prose an inadequate home, and they are the ADR-0040 argument in a second instance:

1. **The control ships to a different repository.** It is a product-layer control that must run on the user's
   machine, inside the sibling `vlad` product repo (registered in `paths.portfolioRegistry`) — a repo that will
   never contain WarpOS's sprint trackers. A boundary defined only in `trackers/sprints/` does not resolve
   where the control runs.
2. **Its two strongest citations are machine-local.** β's verdict is canonical at `paths.betaEvents` line 293,
   which is gitignored (ADR-0026's class); the enforcement ledger at `paths.enforcementDebt` is likewise
   machine-local. A control whose scope is defined in unclonable artifacts has no scope — so this ADR carries
   the enforcer names in its own text rather than only citing ledger ids.

**Model-access history, referenced as struck-in-place history and NOT re-litigated here.** The 2026-07-29 ToS
NO-GO chain (claude-CLI subscription shell-out barred; API-key therefore "primary and ONLY, never a fallback")
was **superseded 2026-08-01** by the operator's SUBSCRIPTION-PRIMARY ruling: the prohibition clause bars the
DEVELOPER's credentials proxying users' requests, not a user running an agent locally on their OWN
subscription. The prior wording is preserved in place — struck, never deleted — in the epic tracker
§ Decisions, the epic plan artifact `_planning/epics/E-VLAD-001.md` (§3, §4, §6, §7, §10), and the sprint
tracker; the 2026-07-29 primary-source quotes remain accurate and are the fallback seam's justification. **This
ADR takes no position on that parse and does not reopen it.** It matters here for exactly one reason: β
required the control be designed to protect a **held secret generically** rather than "the API key", so a seam
reversal changes *which* secret is guarded, not *whether* the control works — and the 2026-08-01 ruling is the
first live exercise of that property (the guarded secret moved from the user's API key to the user's
OAuth/subscription ambient state, with the control unchanged).

## Decision — the obligation, stated once

**The product never becomes a credential intermediary.** The **HELD SECRET** — whichever the live seam carries:
the user's OAuth/subscription ambient state under the subscription-primary posture, the user's API key on the
engineered fallback seam — is used **solely** as the agent/SDK's own authentication to Anthropic's endpoint and
reaches **no other destination**: no log, no telemetry, no proxy, no third party, and no child process (env
passing is allowlist-based; ambient credential state is never inherited).

## Decision — where the PROVE / ASSERT boundary sits

The boundary is **destination enumerability**, and it is stated as a rule rather than a list so future claims
classify themselves:

> A custody claim is **PROVABLE** iff its falsifier is a finite, enumerable set of destinations or call sites
> inside the shipped artifact — something an enforcer can walk. A claim whose falsifier lives outside that
> artifact's control is **ASSERTED**, however confident we are in it. Confidence never promotes an assertion.

This is why the original wording failed: "never leaves the machine" quantifies over *every* egress including
the intended one, which is not an enumerable in-artifact set. "Reaches no destination other than the SDK's own
auth call" names a set an enforcer can walk.

### PROVEN — mechanically, fail-closed, each with its proof scope stated

Report-only does not satisfy any of these. Each is stated with the precision it actually achieves, because a
proof described more broadly than it runs is itself an ADR-0039 §A2.1 defect.

- **P1 — No key-shaped secret in the scanned surface.** Committed files, log-writing call sites, telemetry
  payload builders. *Proof scope: absence at the scan's precision over the surface enumerated — not absence in
  general.*
- **P2 — Every child-spawn passes an explicit allowlist env excluding the held secret, AND raw
  `spawn`/`exec`/`fork` that bypasses the audited wrapper is REFUSED.** Both halves are required. A scrubbing
  wrapper alone is a convention, not a control: it re-opens the defect the moment one caller goes around it —
  the CLAUDE.md lib-only-fix class, which has already cost this project the codex-stdin re-hit 13 days after
  the fix. *Proof scope: spawn sites reachable by the enforcer's walk of the shipped tree.*
- **P3 — A runtime negative fixture: poison the ambient env with a decoy key, spawn a child, assert the child
  cannot see it — and it goes RED when the scrub is removed.** The mutant proof is the point. Without it, P1
  and P2 have proven only that the code *looks* right. *Proof scope: the paths the fixture actually exercises.*

**Firing point (β A5, binding).** The leak would happen on the user's machine, so P1–P3 are **product-layer
controls that ship with the product and run in the user's install.** An enforcer that runs only in WarpOS CI
proves something about our source and nothing about their runtime, and does not satisfy the DoD item. If any
part can only run in our CI, the design must say **which** part and record the gap explicitly.

### ASSERTED — attested posture, not verified, and stated in strong form

β required these be stated in strong form because a weak form invites a remedy that closes one instance while
the leak steps one over. None of them shrink with effort.

- **A1 — Dependency surface.** Any package in the tree can read `process.env` and reach the network. **No
  in-repo enforcer can bound this.** The mitigations are minimizing and reviewing the dependency surface — not
  a scanner. This is the largest residual.
- **A2 — Same-user OS access.** Another process running as the user can read the environment or a key file.
  Control and attacker share privileges, so there is **no layer-level fix** — this is not "our scanner misses
  it." Same shape as the ceiling ADR-0025 named and accepted for the attestation surface.
- **A3 — Unexercised paths.** A static scan proves shapes; a runtime probe proves the paths it runs. Neither
  proves a path nothing exercised.
- **A4 — Off-repo human leaks.** A secret pasted into a support ticket or left in shell history is out of
  scope. It warrants one line of user-facing guidance, not an enforcer.

### The labeling rule — how an assertion is marked attested-not-verified

1. **Never the same class as a proof.** An asserted item is rendered as *attested, not verified*, with its
   ceiling named in the same breath (A1–A4 above are the wording, not a summary of it). It may never share a
   status token, badge, colour, or aggregate with a proven item — collapsing them is how an assertion gets
   consumed downstream as a proof.
2. **The user-facing claim may not exceed the proven set.** No "your key never leaves your machine" in a README
   while the SDK transmits it; no implied guarantee about dependencies. β marked final user-facing wording
   **Class C — operator territory** (it is a user-trust claim); this ADR governs only what the enforcer proves.
   Draft to the proven set and route the wording to the operator.
3. **Narrowing renames (ADR-0040).** If a proven claim must later narrow, **rename the field or check** rather
   than re-documenting what the old name means. A narrowed meaning lives in a doc while the old name reaches
   every caller who already read the old one.
4. **A promotion requires a mechanism, not a judgement.** Moving an item from ASSERTED to PROVEN requires a
   named enforcer with a mutant proof, recorded as an amendment to this ADR. Increased confidence is not a
   promotion path.

## Decision — enforcer roster (per the Policy & Enforcement Hygiene rule)

Every clause above names its enforcer or files debt. **None of these exist yet** — the sibling `vlad` repo is a
fresh scaffold and no seam code may be written before the design→build gate clears — so each is named with its
planned identity and marked OWED. The names are carried here rather than only as ledger ids because
`paths.enforcementDebt` is machine-local.

| Clause | Enforcer (planned identity, product repo) | Status |
|---|---|---|
| P1 | `scripts/checks/no-held-secret-in-surface.js` — scan of committed files, log call sites, telemetry builders; non-zero exit on hit | **OWED** — ED-340 |
| P2 | `scripts/checks/spawn-env-allowlist.js` — two assertions: every audited spawn passes an explicit allowlist env; any raw `spawn`/`exec`/`fork` outside the wrapper is a REFUSAL, not a warning | **OWED** — ED-340 |
| P3 | `test/credential-custody-decoy.test.js` — runtime decoy-key fixture + a mutant run that must go RED with the scrub removed | **OWED** — ED-340 |
| Firing point (A5) | The three above wired into the product's own ship-time check run, not only WarpOS CI; the wiring itself asserted by a presence check in the product's release gate | **OWED** — ED-340 |
| Labeling rule (1–3) | A receipt/README claim lint over the shipped copy: any custody claim string must map to a P-clause id | **OWED** — ED-340 |
| A1–A4 | **No enforcer exists or can exist in-repo for A1/A2** (that is the finding, not a gap to close). Enforced instead as a *presence* obligation: the four ceilings must appear verbatim in the shipped custody statement, checked by the same claim lint | **OWED** — ED-340 |

Filed as **ED-340** (one consolidated row covering the six planned enforcers; closes only when ALL six exist in
the product repo and the P3 mutant run has gone RED at least once — partial shipment amends the row, never
closes it).

## Scope

Binding on the Vlad product's model-access seam under **either** seam, and on any future WarpOS-family product
that holds a user's credential. It governs the prove/assert boundary and the labeling rule **only** — the
sprint's other design surfaces (the four-core MCP tool set, the quota detector's three buckets, the honest-
degradation language) are the sprint's, per β's explicitly narrow OPEN_ADR. The full obligation text remains
stated in the epic and sprint Definitions of Done; this ADR is the durable, clone-surviving home of the
boundary and the rule.

## Consequences

- **The seam ruling changes which secret is guarded, not whether the control works.** That property is now
  load-bearing rather than incidental: it is what let the 2026-08-01 subscription-primary ruling land without
  reopening the control, and it is what makes a forced flip back to the API-key fallback a seam swap.
- **Residual risks carried forward from the 2026-08-01 ruling, recorded and not softened:** the prohibition
  clause is ambiguous under the alternative parse; Anthropic's policy is explicitly in flux (the June 2026
  metering change is paused, not withdrawn); and Anthropic reserves **enforce-without-notice**. Mitigations:
  the engineered API-key fallback seam; the Anthropic clarification/approval request, which runs as **parallel
  work and not a gate**. Trigger for the flip: Anthropic closes or meters the subscription path.
- **A user-facing claim exceeding P1–P3 is a defect of this ADR's class**, regardless of how confident the
  claim's author is — including a claim about A1 (dependencies), which is the one most likely to be written
  optimistically because it feels like hygiene.
- **An enforcer that runs only in WarpOS CI does not satisfy the DoD item**, and a design that ships one is
  incomplete rather than partially credited.
- **A1 and A2 will not be closed by future effort.** A later change claiming to have closed either in-repo
  should be read as suspect by construction and re-derived against the destination-enumerability rule before
  it is believed.
- **Report-only does not satisfy any proven clause** — the DoD says fail-closed and this ADR does not soften it.

## Provenance / resolvers

- β verdict full text (git-tracked, clone-surviving): `runtime/vlad-w1/betaevents-staged-W1-plan-to-design.md`
  — carries the CONSUMED marker; canonical row at `paths.betaEvents` line 293, msg_id
  `7c4e2b96-5d81-4a37-b0f2-91e6c58a3d74`, consult `063c75dd-36e4-4c2f-8c00-78de716a4ab0`. The ledger is
  machine-local; the tracked file is the resolver.
- Operator ruling (authoritative wording): epic tracker
  `trackers/epics/E-VLAD-001-vlad-v1-agent-mcp-cofounder.md` § Decisions first entry + Change-log fold
  `5b022ea9`. The epic outranks the sprint tracker on the ruling's wording.
- Reworded DoD: same epic § Definition of Done item 10 (α's fold `3a8fd442`); sprint
  `trackers/sprints/S-VLADW1-01-vlad-engine-skeleton.md` DoD (`33024f46`); banked inputs
  `runtime/vlad-w1/w1-planning-inputs.md` (`88abeb8b`, §1 primary-source block, corrected in place).
- Superseded model-access history, struck in place: epic plan `_planning/epics/E-VLAD-001.md` §3/§4/§6/§7/§10.
- Index row added at `paths.adrIndex` on acceptance (2026-08-03).
