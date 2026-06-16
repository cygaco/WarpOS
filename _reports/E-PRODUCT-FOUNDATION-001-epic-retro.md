# E-PRODUCT-FOUNDATION-001 — Epic Retrospective

**tl;dr:** We made every newly-scaffolded product *born launch-ready* instead of bolting the launch plumbing on at the last minute. A new product now ships, on day one, with: a metrics seam (so you can see if anyone's using it), a declared tech stack that pre-fills the rest of setup, an in-app founder admin panel, and a durable FOUNDERS_CHECKLIST. Eight sub-sprints (W0→W3 + four tracks), all shipped and tested. The epic is **Complete**.

- **Epic:** E-PRODUCT-FOUNDATION-001 — Product Foundation + Seams
- **State at retro:** Active ~99% → **Completed 100%**
- **Window:** 2026-06-11 (plan) → 2026-06-12 (W0 released, internal-canary) → 2026-06-16 (epic close)
- **Owner:** President Agent · **Executor:** Codex (GPT) on `sprint/S-PF-01`, Claude-audited 2026-06-12

## What shipped (plain language)

| Wave | What it is | Why it matters |
|---|---|---|
| **W0 — telemetry seam** | Every scaffold ships `track(event, props)` over a local buffer + pluggable sink (PostHog default, no-op when unconfigured, fail-open). 6 lifecycle events seeded. | You can't find product-market fit if you can't measure usage. This is the metric skeleton, installed at birth, not at lastmile. |
| **W1 — tech-stack declaration** | Intake captures db/auth/payments/hosting/analytics/framework → a parseable `## Tech Stack` block in DATA_AND_ACCOUNTS.md. Advisory-with-teeth: it pre-fills the lastmile profile + roadmap infra; overrides are allowed but logged as a visible `stack_drift` event. | The stack is *declared once* and trickles down, instead of being re-guessed at every step. |
| **W2 — admin surface** | A founder-allowlist-gated `/admin` route: user list/search, account-state toggle, entitlement grant/revoke, read-only event feed (consumes W0). Signed-session-cookie gate. | Founders need a minimum cockpit on day one. Pre-PMF minimum by design — allowlist not RBAC; Stripe owns refunds; PostHog owns dashboards. |
| **W3 — founders checklist** | Durable, machine-readable `FOUNDERS_CHECKLIST.md` at product root, pre-populated from the declared stack (e.g. "Stripe declared → verify Stripe identity"). Lastmile audit *reads* it instead of re-deriving. | The human-only slow-clock work (dev accounts, DNS, legal, store listings) is captured durably, not re-minted per sprint. |
| **T-G guides** | 3 new launch guides (analytics/telemetry, deployment-infra, admin-tooling), BaaS-leaning as recommendations. | Closes confirmed guide-coverage gaps. |
| **T-K knowledge** | 3 new `_knowledge` domains (tech-stack-selection/BaaS, product-telemetry, admin-tooling). | Grounds the agents that consume these domains. |
| **T-P playbooks** | All 5 designed situational playbooks authored + a `playbook-suite-coverage` enforcer wired into `/scan:full`. | The playbook shelf went from 1 → 6, with an enforcer so it can't silently rot. |
| **S-PF-08 mobile billing** | Mobile in-app digital goods/subs route to Apple StoreKit / Google Play Billing by default; Stripe stays the path for web/desktop/physical. | Avoids an App-Store-policy rejection class at launch. |

## Evidence

- **Release:** RL-20260611-045 approved (AP-20260612-029, operator-instructed) + deployed to internal-canary 2026-06-12; S-PF-01 retrospected.
- **Tests (per-sprint regression, all green):** S-PF-02 25/25+34/34+59/59+3/3 · S-PF-03 14/14 planted + 7/7 scaffold + security-reviewer PASS (OpenAI, conf 0.90) · S-PF-04 6/6 + scaffold 8/8 · S-PF-07 playbook-suite 5/5 + 7/7 · S-PF-08 4/4 + lastmile 61/61.
- **Coverage gates:** guides-coverage PASS, knowledge-coverage PASS, scaffold-coverage PASS, ship-coverage green, both manifests current, tracker validation 20/20.
- **Full trail:** `CODEX-LOG.md` (2026-06-11→12) + the epic tracker § Session log.

## What went well

1. **Telemetry-first sequencing held.** DoP's non-negotiable (the to-PMF metric skeleton precedes everything) meant W2's event feed and W3's checklist both had real upstream data to consume — no rework.
2. **Cross-family review caught real issues.** The OpenAI security-reviewer lane on the admin surface (a genuine security surface) passed at 0.90 after the planted-fixture regression suite — not a rubber stamp.
3. **Enforcers named at plan-time.** Every net-new contract shipped with its enforcer (scaffold-coverage planted fixtures, canon tech-stack gate, playbook-suite-coverage) — the β plan-time constraint paid off; nothing shipped aspirational.
4. **Link-not-absorb discipline.** The epic owned only net-new substance and *linked* E-DISPATCH-SHAPE-001 / E-LIFECYCLE-001 as dependencies rather than swallowing them — the anti-rebuild guard held.

## What to improve (carried forward)

1. **RI-007 sprint-mint discipline gap.** S-PF-02..S-PF-08 were executed as epic work-items on the S-PF-01 branch *without individual `add-sprint.js` mints* — so there are no per-sprint dirs on disk for them (only S-PF-01 and S-PF-09a exist). Held open honestly through the epic; **resolved at close via an explicit RI-007 waiver** (below), not backfilled. The work is fully evidenced in the epic tracker session log + CODEX-LOG.md + per-sprint regression suites; backfilling empty mints would be ceremony, not evidence. **Forward fix:** when a single executor runs a multi-wave epic on one branch, either mint each wave up-front or record the waiver decision at wave 1, not at epic close.
2. **Retro-at-source still leaks.** This epic retro was written at epic close by α, not auto-synthesized by `/sprint:release` (the known skeleton-retro gap). Tracked separately as a learnings item.
3. **Retrofit decision deferred.** Whether the existing 5 portfolio products get these seams retrofitted (vs. only new scaffolds) was left as an open question — correctly a separate decision, not assumed here.

## RI-007 waiver (recorded)

**Decision:** WAIVE individual `add-sprint.js` mints for S-PF-02 through S-PF-08. **Rationale:** all seven ran as evidenced epic work-items on `sprint/S-PF-01` under the Codex executor; each carries a dated epic-tracker session-log entry, CODEX-LOG.md receipts, and a passing per-sprint regression suite. Backfilling seven empty sprint dirs after the fact would create skeleton records with no additional evidence value. **Class:** A/B reversible bookkeeping. **β:** ratified at the release→retro boundary (see epic tracker close entry).

## Disposition

Epic **Completed 100%**. No follow-on sprints required. Open questions (stack binding-vs-advisory, retrofit-vs-new-only) revisit when 3–5 products' evidence accumulates — not blocking.
