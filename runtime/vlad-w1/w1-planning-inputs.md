# E-VLAD-001 Wave-1 — banked planning inputs (2026-07-29)

Status: **PARKED mid-authoring** when RELEASE-1.2.0-CONDUCT superseded the lane.
Both expensive sub-agent passes COMPLETED and are banked here so the lane resumes without re-spending.
Nothing below has been written into a Plan Contract, the sprint registry, or the epic tracker yet.

Minted-but-not-yet-registered sprint ids (see "Sprint-id blocker" below):
`S-VLADW1-01` (epic label SP-VLAD-W1-ENGINE) · `S-VLADW1-02` (epic label SP-VLAD-W1-AUDIT)

---

## 1. THE TOS GATE — verdict NO-GO (this is the load-bearing finding)

> ## ⚠ SUPERSEDED-2026-08-01 — THE NO-GO READING NO LONGER GOVERNS
>
> **The whole of §1 below is preserved as the EVIDENCE RECORD, not as the live posture.** The
> primary-source quotes, the scope-difference finding, the disclosed counter-evidence and the
> detector signals all remain accurate and load-bearing. What is superseded is the *verdict* and
> its **forced consequence** ("API-key is primary and only").
>
> **OPERATOR RULING 2026-08-01 — model access is SUBSCRIPTION-PRIMARY.** Verbatim: *"We are in the
> clear. It's literally their subscription using an AGENT. And in most cases local MCP. Like, we are
> good. codify this, update the plan."* The operator's parse: the prohibition clause quoted below
> bars **the DEVELOPER's credentials proxying users' requests** — not a user running an agent/MCP
> locally on their OWN subscription. Supported practically by the support-page counter-evidence
> already disclosed in this section (third-party SDK usage currently draws from subscriptions;
> metering change PAUSED June 2026).
>
> **THE NEW POSTURE:** subscription-primary — the user's own subscription powering an agent *they
> themselves invoke*, local MCP topology, **no developer credentials anywhere in the path**. The
> API-key seam (TypeScript Agent SDK) stays **ENGINEERED AND READY as the fallback** per β
> `7c4e2b96`'s auth-agnostic design, so the flip is a seam swap rather than a rework.
>
> **RESIDUAL RISK — recorded, not softened:** the clause is ambiguous under the alternative parse
> ("offer Claude.ai login" is per-user by nature; OAuth "exclusively for ordinary use of native
> Anthropic applications"); policy is explicitly in flux; Anthropic reserves enforce-without-notice.
> **MITIGATIONS:** (1) the engineered API-key fallback seam; (2) the Anthropic clarification/approval
> request, now a **parallel work item** rather than a blocker (see §1's "Open to Anthropic sales").
> **TRIGGER:** if Anthropic closes or meters the seam, flip to API-key **without rework**.
>
> **Authoritative source for the ruling text, reasoning, residual and mitigations:**
> `trackers/epics/E-VLAD-001-vlad-v1-agent-mcp-cofounder.md` § Decisions (first entry) and the
> 2026-08-01 Change-log fold `5b022ea9`. This banked file does not outrank the epic.

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

### Forced consequence — ~~live~~ **SUPERSEDED-2026-08-01** (see the header block above)
~~Model access is the user's **own Anthropic API key** via the **TypeScript Agent SDK**
(`@anthropic-ai/claude-agent-sdk`), which bundles its own Claude Code binary and therefore removes the
user's Claude Code install from the dependency graph. There is **no "fallback"** — the subscription
path was never permitted, so API-key is primary and only.~~

> **SUPERSEDED-2026-08-01 by the operator's subscription-primary ruling.** Struck in place so the
> derivation stays auditable. **Live posture:** model access is the user's OWN Claude subscription,
> powering an agent they themselves invoke, local MCP topology, no developer credentials in the path.
> The API-key/TypeScript-Agent-SDK route above is now the **ENGINEERED FALLBACK seam**, not the only
> path — so "there is no fallback" is exactly the sentence that inverted. The SDK's own-binary
> portability gain survives intact on the fallback seam and is still worth banking.

Constraints that fall out (each **survives the supersession** — they are seam-agnostic unless noted):
- **Never inherit ambient credential state into a child process.** In `-p` "the key is always used
  when present" → a stray ambient `ANTHROPIC_API_KEY` silently bills the wrong Console org. Env passing
  must be allowlist-based. **Unchanged by the 2026-08-01 supersession, and if anything wider under it:**
  under subscription-primary the ambient state to keep out of children is the user's OAuth/subscription
  state as well as any API key — the rule is "inherit no credential", not "inherit no API key".
- ~~**The user's key must never leave their machine** (no transmit/log/proxy/telemetry). Consumer Terms
  forbid credential sharing, so this is a **compliance obligation**, not hygiene~~ → needs a fail-closed
  enforcer, not a report-only check.

  > **CORRECTED 2026-07-30 — β verdict `7c4e2b96-5d81-4a37-b0f2-91e6c58a3d74` (A1 + A2). Do not reuse the
  > struck wording above; it is preserved only so the correction is auditable.**
  >
  > **A1 — "must never leave their machine" is UNACHIEVABLE AS WORDED.** The Agent SDK authenticates to
  > Anthropic's API *with* that key, so transmitting it is the **mechanism, not a leak**. As written, the
  > constraint is contradicted by the architecture on the happy path, and a fail-closed enforcer asserting
  > it would either have to lie to pass or red-flag correct behaviour forever. β classed this as ADR-0039
  > §A2.1 condition 2 (a claim consumed as a guarantee that is silently false), arriving **pre-build**.
  >
  > **The achievable and provable form, which is what to build against:** the product **never becomes a
  > credential intermediary** — the **HELD SECRET** is used solely as the SDK/agent's own auth to
  > Anthropic's endpoint and reaches **no other destination**: no log, no telemetry, no proxy, no third
  > party, no child process (env passing allowlist-only). This version is provable precisely because it
  > names destinations an enforcer can enumerate, where "never transmits" names none.
  >
  > **EXTENDED 2026-08-01 (supersession-proofing, per the epic's credential-custody DoD item):** the
  > obligation is stated over **whichever secret the seam carries** — the user's OAuth/subscription
  > ambient state under the live subscription-primary posture, the user's API key on the fallback seam.
  > This is not a softening; it is precisely β `7c4e2b96`'s generic-held-secret design, which is why the
  > 2026-08-01 ruling changes *which* secret the control guards rather than *whether* it works. Read
  > every "the key" in this block as "the held secret".
  >
  > **A2 — the compliance citation is NOT in this document's verified set.** "Consumer Terms forbid
  > credential sharing" cites a **different document** from the one quoted verbatim in §1
  > (`code.claude.com/docs/en/legal-and-compliance`), and the Consumer Terms were never fetched or quoted
  > — not in either of the two verification passes. **Treat it as UNVERIFIED.** For a hygiene item that
  > would be a nit; for an obligation deliberately elevated to *compliance*, the citation is load-bearing.
  >
  > The obligation **survives on better footing**: §1's already-verified page bars credential
  > intermediation directly — *"Anthropic does not permit third-party developers to offer Claude.ai login
  > or to route requests through Free, Pro, or Max plan credentials on behalf of their users."* Re-base
  > onto that quote, or fetch and quote the Consumer Terms before calling it compliance.
  >
  > **Stale sub-claim, also corrected:** this bullet previously ended "The epic's 10-item DoD currently
  > has no line for this." That is no longer true — the `/epic:fold` amendment landed a credential-custody
  > item in the epic's Definition of Done. What the epic's item *does* still carry is the A1 wording above,
  > which is an **α item via `/epic:fold`**, tracked on S-VLADW1-01's Blockers (ε must not edit an epic's DoD).
- **Branding:** ship as "Vlad, powered by Claude". Never "Claude Code", never Claude-Code-mimicking visuals.
- **Usage-limit exhaustion has documented STRING + structured-error-code signals but NO documented exit
  code.** Detector must be empirically characterized before ship; an unrecognized termination classifies
  `could-not-run`, never success.

  > **REFINED 2026-07-30 — β verdict `7c4e2b96` (B3): the rule above is right but INCOMPLETE.** Classify
  > into **three** buckets, not two: recognized success, recognized quota-exhaustion, and unrecognized →
  > `could-not-run` **with the raw signal surfaced**. "Unrecognized never means success" covers one failure
  > direction; the other is classifying an unrecognized termination **as quota**, which tells a founder to
  > buy credits when the real fault is elsewhere. `could-not-run` must not become a euphemism that resolves
  > to the most likely cause — fail closed to "we could not tell", and show what was seen.

Usable detectors (all primary-source backed): result strings
`You've hit your (session|weekly|Opus) limit · resets <time>`; structured error codes
`authentication_failed`, `oauth_org_not_allowed`, `rate_limit`, `billing_error`; `system`/`api_retry`
events. Explicitly do NOT trip on `Server is temporarily limiting requests (not your usage limit)` —
capacity, auto-retried.

### Open to Anthropic sales (no public answer exists)
Exact scope of "route requests … on behalf of their users" for the local-CLI topology · approval criteria
behind "unless previously approved" · which document controls given the June-15 pause · `--bare` default
timeline · exit-code/JSON contract on quota exhaustion · current numeric Pro/Max limits.

> **RE-SCOPED 2026-08-01:** these are no longer a **blocker** on the seam — the operator ruled
> subscription-primary and the questions became the **parallel clarification/approval work item**
> named in the ruling's mitigations. The strongest case to put to Anthropic is exactly the topology
> the ruling describes: a **local tool, user-invoked, on the user's own subscription**, through the
> SDK page's "unless previously approved" door. The quota exit-code/JSON question is the one item
> here that is *engineering* rather than policy, and it still gates a DoD item on S-VLADW1-01
> regardless of which seam is live.

---

## 2. PRODUCT-LEAD AUTHORED CONTRACTS — outcome summary

Full authored substance (both contracts, ~88KB, every schema field) is the product-lead return in this
session's tool-results; the decision-relevant content is summarized here.

**Both contracts: `plan_quality = needs_user_clarification`, confidence `medium`, `design_required: true`,
`execution_allowed_without_design: false`, `beta_review.required: true`, no executable tickets,
recommended variant = `recommended` for both.**

### S-VLADW1-01 (ENGINE) — blocking questions
1. ~~Sibling repo name + slug + operator creation sign-off (first approval point of the epic).~~
   **RESOLVED-2026-08-01:** repo created — `vlad`, sibling to WarpOS, scaffolded via `/portfolio:new`.
2. ~~**Does the operator ratify API-key-only model access, and does the product survive the reinstated
   onboarding cliff?** This reverses a decision the operator personally made in grill round 3 to solve
   the drop-off they themselves named as the biggest one. Not product-lead altitude.~~
   **RESOLVED-SUPERSEDED-2026-08-01:** the question is moot — the operator did not ratify API-key-only,
   they ruled **subscription-primary**, which restores the grill-r3 frictionless onboarding this question
   was worried about. API-key becomes the engineered fallback. See the §1 header block and the epic's
   § Decisions first entry.
3. ~~**The epic states the dead seam as fact in FOUR places** — epic tracker § Scope and § Open questions
   item 2; plan artifact § 3 Scope, § 6 Dependency map, § 7 Risk map (first entry), § 10 Gate W1.
   Executing now = building to a contradicted contract.~~ **CLOSED 2026-07-30** by the `/epic:fold`
   amendment (verified across all six locations). Note for readers: the "dead seam" of this item is the
   **live primary seam** as of the 2026-08-01 ruling, and the same six locations were swept again on
   2026-08-01 to carry the supersession — the drift risk this item names is real and recurring, so
   re-verify the locations rather than trusting either amendment report.
4. ~~Anthropic API spend envelope for dev/test (trips two autonomy rows: signup/purchase not allowed; ≥$5 ask-first).~~
   **RESOLVED-2026-08-01:** operator granted **$50** dev/test, vlad lane only.

Recommended next command: ~~**`/epic:fold E-VLAD-001`** (amend the four stale locations, restate Gate W1,
add the credential invariant to the DoD, reprice AC #1's five-minute claim) — *before* `/sprint:design`.~~
**DONE** (`3a8fd442`, plus the 2026-08-01 subscription-primary fold `5b022ea9`). Next is `/sprint:design`
on fresh operator authorization.

### S-VLADW1-02 (AUDIT) — blocking questions
1. ~~Sibling repo (inherited).~~ **RESOLVED-2026-08-01** — `vlad` created. 2. **Which ≥3 portfolio repos
+ explicit read-only authorization** against the standing WarpOS-only rule (dogfood was accepted in round 3
but never reconciled in writing with "open these three directories"). **2026-08-01 — DELEGATED to α, who
proposes `dreamteam` / `companycam` / `almanac`; a standing operator veto window is open.** This is the
ONLY remaining external input on the Wave-1 pair. 3. Ratification of the convergence reframe (J3 below).
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

  > **PARTLY SUPERSEDED-2026-08-01 by the subscription-primary ruling.** J2's damage list was derived
  > from the API-key-only forced consequence, so the items that were *consequences of that consequence*
  > fall away with it. **Withdrawn as live damage:** (1) the inverted user-side cost story, (2) AC #1's
  > five-minute claim being false as written, (3) the unmitigated/unowned funnel risk, (4) "no cost
  > estimates" as a churn hazard, (5) adversarial review doubling spend on the founder's card — all five
  > were the onboarding cliff, and the ruling removes the cliff from the primary path. **They return
  > verbatim if the fallback seam is ever triggered**, which is why they are struck-in-place rather than
  > deleted: this list IS the fallback's impact assessment, already written.
  > **Survives untouched:** (6) the codex/gemini other-CLI exposure — the ruling is an **Anthropic-specific
  > parse** and clears nothing about OpenAI's or Google's terms, which nobody has read; (7) the
  > ambient-credential-reach class is still being actively closed and is arguably *more* load-bearing now;
  > (8) the `safe-spawn` env-allowlist amendment (still unowned, WarpOS-side); (9) the SDK portability gain.
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
3. ~~Route the epic amendment (`/epic:fold`) to α — **not** ε: it reverses an operator-ratified decision.~~
   **DONE** — `3a8fd442`, plus the 2026-08-01 subscription-primary fold `5b022ea9`.
4. ~~β at the plan→design boundary, specifically on the credential-custody enforcer and the
   honest-degradation ("NOT verified") language — both claims-boundary surfaces.~~ **DONE** — β verdict
   `7c4e2b96` (DECIDE, Class B, 0.88, OPEN_ADR narrow). Its auth-agnostic held-secret design is what
   makes the 2026-08-01 seam change a swap rather than a rework.
5. ~~Escalate to operator: repo name+slug, API-key-only ratification + the onboarding-cliff judgment,
   API spend envelope, named portfolio corpus with read-only authorization.~~ **2026-08-01 — three of
   four CLOSED:** repo created (`vlad`); ratification **superseded** by the subscription-primary ruling
   (with it, the onboarding-cliff judgment); spend granted (**$50**, vlad lane only). **STILL OPEN:** the
   named portfolio corpus — α proposes `dreamteam`/`companycam`/`almanac`, standing operator veto window.
6. **NEW parallel work item (not a blocker):** send Anthropic the clarification/approval request — local
   tool, user-invoked, user's own subscription, through the SDK page's "unless previously approved" door.
