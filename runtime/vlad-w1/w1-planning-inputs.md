# E-VLAD-001 Wave-1 — banked planning inputs (2026-07-29)

Status: **PARKED mid-authoring** when RELEASE-1.2.0-CONDUCT superseded the lane.
Both expensive sub-agent passes COMPLETED and are banked here so the lane resumes without re-spending.
Nothing below has been written into a Plan Contract, the sprint registry, or the epic tracker yet.

Minted-but-not-yet-registered sprint ids (see "Sprint-id blocker" below):
`S-VLADW1-01` (epic label SP-VLAD-W1-ENGINE) · `S-VLADW1-02` (epic label SP-VLAD-W1-AUDIT)

---

## 1. THE TOS GATE — verdict NO-GO (this is the load-bearing finding)

The epic's ratified model-access seam — a distributed Vlad shelling out to the end user's installed
`claude` CLI so inference bills to that user's Pro/Max subscription — is **not permitted**.
Researched once, then the decisive quotes independently re-fetched and confirmed **VERBATIM** by a
second agent (both passes this session).

### Confirmed primary-source quotes

**code.claude.com/docs/en/legal-and-compliance** (§ Authentication and credential use):
> "OAuth authentication is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and
> Enterprise subscription plans and is designed to support ordinary use of Claude Code and other
> native Anthropic applications."
> "Developers building products or services that interact with Claude's capabilities, including those
> using the Agent SDK, should use API key authentication through Claude Console or a supported cloud
> provider. **Anthropic does not permit third-party developers to offer Claude.ai login or to route
> requests through Free, Pro, or Max plan credentials on behalf of their users.**"
> "Anthropic reserves the right to take measures to enforce these restrictions and may do so without
> prior notice."

Same page (§ Acceptable use): "Advertised usage limits for Pro and Max plans assume ordinary,
individual usage of Claude Code and the Agent SDK."

**code.claude.com/docs/en/agent-sdk/overview** (Note callout under Get started):
> "**Unless previously approved**, Anthropic does not allow third party developers to offer claude.ai
> login or rate limits for their products, including agents built on the Claude Agent SDK. Use the API
> key authentication methods described in the Quickstart instead."

**code.claude.com/docs/en/headless**:
> "Bare mode skips OAuth and keychain reads."
> "`--bare` is the recommended mode for scripted and SDK calls, and will become the default for `-p`
> in a future release."

Plus: `claude -p` IS the Agent SDK's CLI surface, so shelling out does **not** escape the SDK
restriction. And `claude setup-token` (long-lived OAuth for CI) is the same prohibited shape, not a
workaround — bare mode does not read `CLAUDE_CODE_OAUTH_TOKEN` either.

### The scope difference the verification pass caught (do not lose this)
The **legal page** states the prohibition **flatly, with no carve-out**, and is the page carrying the
enforce-without-notice reservation. The **SDK page** states it with an explicit **"unless previously
approved"** carve-out. Both readings are textually supported; they are not the same rule as written.
A prior-approval door exists in the SDK framing only — it is a sales conversation with **no published
criteria, form, or timeline**.

### Disclosed counter-evidence (not suppressed)
support.claude.com article 15036540 (dated 2026-06-16) carries: "**Update June 15:** We're pausing the
changes to Claude Agent SDK usage described below. For now, nothing has changed: Claude Agent SDK,
`claude -p`, and third-party app usage still draw from your subscription's usage limits."
Read: that is a statement about **metering**, not a grant of **permission**, describing a plan Anthropic
paused. It confirms the seam currently *functions*; it does not contradict the legal page. Policy is
explicitly in flux with promised notice before changes take effect → watch item, not a basis to build.

### Forced consequence
Model access is the user's **own Anthropic API key** via the **TypeScript Agent SDK**
(`@anthropic-ai/claude-agent-sdk`), which bundles its own Claude Code binary and therefore removes the
user's Claude Code install from the dependency graph. There is **no "fallback"** — the subscription
path was never permitted, so API-key is primary and only.

Constraints that fall out:
- **Never inherit ambient `ANTHROPIC_API_KEY` into a child process.** In `-p` "the key is always used
  when present" → a stray env key silently bills the wrong Console org. Env passing must be allowlist-based.
- **The user's key must never leave their machine** (no transmit/log/proxy/telemetry). Consumer Terms
  forbid credential sharing, so this is a **compliance obligation**, not hygiene → needs a fail-closed
  enforcer, not a report-only check. The epic's 10-item DoD currently has no line for this.
- **Branding:** ship as "Vlad, powered by Claude". Never "Claude Code", never Claude-Code-mimicking visuals.
- **Usage-limit exhaustion has documented STRING + structured-error-code signals but NO documented exit
  code.** Detector must be empirically characterized before ship; an unrecognized termination classifies
  `could-not-run`, never success.

Usable detectors (all primary-source backed): result strings
`You've hit your (session|weekly|Opus) limit · resets <time>`; structured error codes
`authentication_failed`, `oauth_org_not_allowed`, `rate_limit`, `billing_error`; `system`/`api_retry`
events. Explicitly do NOT trip on `Server is temporarily limiting requests (not your usage limit)` —
capacity, auto-retried.

### Open to Anthropic sales (no public answer exists)
Exact scope of "route requests … on behalf of their users" for the local-CLI topology · approval criteria
behind "unless previously approved" · which document controls given the June-15 pause · `--bare` default
timeline · exit-code/JSON contract on quota exhaustion · current numeric Pro/Max limits.

---

## 2. PRODUCT-LEAD AUTHORED CONTRACTS — outcome summary

Full authored substance (both contracts, ~88KB, every schema field) is the product-lead return in this
session's tool-results; the decision-relevant content is summarized here.

**Both contracts: `plan_quality = needs_user_clarification`, confidence `medium`, `design_required: true`,
`execution_allowed_without_design: false`, `beta_review.required: true`, no executable tickets,
recommended variant = `recommended` for both.**

### S-VLADW1-01 (ENGINE) — blocking questions
1. Sibling repo name + slug + operator creation sign-off (first approval point of the epic).
2. **Does the operator ratify API-key-only model access, and does the product survive the reinstated
   onboarding cliff?** This reverses a decision the operator personally made in grill round 3 to solve
   the drop-off they themselves named as the biggest one. Not product-lead altitude.
3. **The epic states the dead seam as fact in FOUR places** — epic tracker § Scope and § Open questions
   item 2; plan artifact § 3 Scope, § 6 Dependency map, § 7 Risk map (first entry), § 10 Gate W1.
   Executing now = building to a contradicted contract.
4. Anthropic API spend envelope for dev/test (trips two autonomy rows: signup/purchase not allowed; ≥$5 ask-first).

Recommended next command: **`/epic:fold E-VLAD-001`** (amend the four stale locations, restate Gate W1,
add the credential invariant to the DoD, reprice AC #1's five-minute claim) — *before* `/sprint:design`.

### S-VLADW1-02 (AUDIT) — blocking questions
1. Sibling repo (inherited). 2. **Which ≥3 portfolio repos + explicit read-only authorization** against
the standing WarpOS-only rule (dogfood was accepted in round 3 but never reconciled in writing with
"open these three directories"). 3. Ratification of the convergence reframe (J3 below).
Better-evidenced than ENGINE; its blockers are **inputs, not unknowns** — clears to `pass` without re-authoring.

### The four judgments worth carrying forward
- **J1 — plannable, not blocked.** "Blocked" should mean *cannot author an honest plan*, not *execution
  cannot start*. ~4/5 of ENGINE (MCP surface, state machine, journal, memory, permission config, ledger
  discipline, branding guard, host-free driver) is unaffected by both gates. The gate that bites is the
  stale epic, not the repo name. Would flip to `blocked` only if the operator judges the API-key wall
  unacceptable for v1.
- **J2 — nine further epic assumptions are damaged, two bigger than the tested one.** (1) the *user-side*
  cost story inverts (cost-to-us still ≈0; founder now needs a Console account + card, metered per token);
  (2) AC #1's "install-to-first-visible-act under 5 minutes" is **false as written** — the path now
  contains an external account + billing cliff; (3) the operator's own named biggest funnel risk is now
  **unmitigated and unowned** (the CLI seam was its sole solve); (4) "no cost estimates in proposals" was
  ruled in a subscription world and is now a churn hazard; (5) same-provider adversarial review roughly
  doubles per-job spend on the founder's card; (6) **"opportunistic use of other CLIs when detected" is
  the identical prohibited shape for codex/gemini and nobody has read OpenAI's or Google's terms** — the
  undermined assumption no one noticed, because only the Anthropic instance was tested; (7) the whole
  "reach the user's ambient credential state" class is being actively closed; (8) `safe-spawn`'s
  transfers-as-is classification needs an env-allowlist amendment (billing-correctness defect, not
  hygiene); (9) the SDK bundling its own binary makes the engine *more* host-portable — bank it, don't
  spend it. Survives intact: "your code never touches our servers" (now stronger) and the BYOK
  prompt-visibility trade.
- **J3 — "converge the two readiness scores" is correctly sized ONLY after reframing.** It is not a
  convergence; it is **adopt `score.js` and never port the checklist proxy** (which concedes in its own
  code that it is an MVP stand-in), plus re-source the one `FOUNDERS_CHECKLIST.md`-dependent dimension.
  New repo, no legacy consumer, nothing to migrate. The word "converge" is the trap: it invites porting
  both and reconciling them, which IS a hidden second sprint. Recommended restatement of the DoD item:
  *"exactly one readiness number exists in the product repo: score.js adopted, checklist proxy not
  ported, FOUNDERS_CHECKLIST-dependent dimension re-sourced or honestly NOT SCORED."* Needs an enforcer
  (a check failing the build if a second readiness number appears) or it regrows.
- **J4 — most likely throwaway work: the receipt schema, via a circularity already designed in.** The
  epic says receipt schema stays open until dogfood data exists (W1-AUDIT), while W1-AUDIT depends on
  W1-ENGINE *only for the receipt/journal seam* — so ENGINE must build the receipt seam before the data
  defining it exists. ENGINE types a receipt v0; it propagates into the journal writer, `get_status`,
  MCP signatures, driver assertions and ledger records; then real data demands structural changes.
  **Fix (cheap only if decided now): ENGINE emits a versioned envelope with an UNTYPED interior**
  (`schema_version` + three named slots), journals/returns/logs it opaquely, never validates or branches
  on it; AUDIT fills the interior and mints v1.

Runners-up: permission-level port built against an action taxonomy that doesn't exist yet (ship
vocabulary + config + in-code check + exactly ONE genuinely enforced refusal); a four-tool MCP surface
with no way to exercise it end-to-end (host-free driver is non-negotiable, hence in `minimal_safe`).

Product-lead's own flagged reading decisions: (a) "no product code in this sprint pair" was read as
scoping the *planning activity*, not the sprints — if the other reading is intended, both contracts
collapse to research/design-only and need re-authoring; (b) every port source is `inferred_from_repo`,
never `verified_from_repo` — the transferability inventory was read but the cited files
(`score.js:134`, `phases/preflight.js`, `permission-profile.js`, `transaction.js`, `registry.js`) were
NOT, and that inventory flags its own maps as trailing live values. **A builder must verify each path
and line reference before porting.**

---

## 3. SPRINT-ID BLOCKER (resolved, needs confirming at resume)

`SP-VLAD-W1-ENGINE` / `SP-VLAD-W1-AUDIT` as literally named in the epic are **schema-invalid**. The
registry pattern is `^(SP-[0-9]{8}-[0-9]{3,4}|S-[A-Z0-9]+-[0-9]{2,3})$` (schemas/sprint/active-sprints.
schema.json:13,32; same pattern in current-sprint, regression-fixture, routing-trace,
sprint-retrospective, and retrospective.js:722). "SP-VLAD-W1-ENGINE" matches neither alternative.

Chosen resolution: **`S-VLADW1-01` / `S-VLADW1-02`** — the semantic alternative, which has live
precedent (`S-LC-01` … `S-LC-12`, status `planning`, in active-sprints.yaml). Epic labels are preserved
as titles. On resume, the epic's § Related sprints must be repointed to the real ids so the linkage
round-trips.

Also note for resume: `scripts/sprint/add-sprint.js` **sets `reg.primary = <new id>` unconditionally**,
so minting will move `primary` off SP-20260725-002. Mint AUDIT first, ENGINE last, so primary lands on
the gating sprint. And per standing discipline the mint must be committed as its own small commit before
anything else runs — add-sprint leaves the tracker/ROADMAP mint uncommitted and a later lane merge trips
on the dirty tree.

---

## 4. RESUME CHECKLIST

1. Confirm sprint-id resolution (§3), mint AUDIT then ENGINE via `add-sprint.js`, commit the mint alone.
2. Marshal the product-lead substance into two schema-valid plan-contract payloads → `scripts/sprint/plan.js --payload <tmp>`.
   Schema gotchas already resolved: `current_behavior` is an OBJECT `{evidence_level, notes}` (not an
   array); `desired_behavior` is a STRING; `scope` is `{size, risk_level, complexity_drivers[]}`;
   `open_questions` is `{blocking[], non_blocking[]}`; `assumptions` requires `needs_user_or_beta_review`;
   `external_service_dependencies` requires `status`; `preliminary_ticket_candidates` is
   `{allowed, notes, candidates[]}`; `scopeVariant` is `{summary, tradeoffs[]}`;
   `mode_invocation_required_by_user` is `const: true`.
3. Route the epic amendment (`/epic:fold`) to α — **not** ε: it reverses an operator-ratified decision.
4. β at the plan→design boundary, specifically on the credential-custody enforcer and the
   honest-degradation ("NOT verified") language — both claims-boundary surfaces.
5. Escalate to operator: repo name+slug, API-key-only ratification + the onboarding-cliff judgment,
   API spend envelope, named portfolio corpus with read-only authorization.
