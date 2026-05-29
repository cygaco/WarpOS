---
description: "Prototype → monetizable product. Drives the 'last mile': readiness audit → launch plan → roadmap/sprint injection → guided execution → launch-ready handoff. Picks practical defaults for vibe coders, asks only high-leverage questions, gates risky production actions behind human approval. The spinup sequel — spinup gets you on screen, lastmile gets you paid."
user-invocable: true
---

# /bootstrap:lastmile — Prototype → monetizable product

The sequel to `bootstrap:spinup`. Spinup takes an idea to **on screen**; lastmile
takes a working prototype/MVP to a **real, monetizable, launch-ready product** —
database, accounts, payments, conversion funnel, deployment, security/privacy,
analytics — and injects the work into the roadmap/sprint system so it actually
ships, not just gets advised.

Built for **vibe coders**: you describe the product, WarpOS infers the technical
implementation, chooses practical defaults, asks only the high-leverage
questions, and **gates every risky production action behind explicit human
approval**. The shortest *safe* path to a paid launch wins — this skill refuses
to overbuild.

> **Framework skill, product-side outputs.** Like spinup, this skill is shipped
> by WarpOS but *runs inside a product repo*. Its engine + templates + reference
> playbooks live in canonical WarpOS; the **reports it produces** (gap report,
> launch plan, etc.) are written into the **consumer product's own tree**
> (`paths.docsRoot`/last-mile/, `paths.requirementsRoot`/last-mile/,
> `last-mile-handoff.md`). Canonical never commits a product's filled-in
> last-mile docs — that would be a framework/product boundary leak
> (`framework-purity-guard`).

## Input

`/bootstrap:lastmile [--profile <name>] [--phase <audit|plan|inject|execute|handoff>] [--resume] [--module <name>] [--research off|deep] [--dry-run]`

- **default (no flags)** — run the full pipeline: intake → audit → plan → inject → (guided) execute → handoff.
- **`--profile <name>`** — skip profile inference (see Profiles below). Omit to let the audit infer it from the repo + a minimal intake.
- **`--phase <name>`** — run/re-run a single phase (e.g. regenerate the gap report: `--phase audit`).
- **`--module <name>`** — scope a phase to one module (`database|auth|payments|crm|website|deployment|security|analytics`), e.g. `--phase plan --module payments`.
- **`--resume`** — continue a partially-completed last-mile run from its last phase (durable state in `.warpos/lastmile-state.json`).
- **`--research deep`** — opt into `/research:deep` for the funnel/monetization/security modules (real API spend — see Research below; default `off` uses the baked-in v1 playbooks).

## Pipeline (prototype → paid launch)

```
lastmile
  → 0. preflight   /scan:install gate + detect repo state (deterministic)
  → 1. audit       Product Readiness Audit → Last-Mile Gap Report + Launch-Readiness Score (0–100)
  → 2. plan        choose profile defaults → per-module plans → Launch Plan (shortest SAFE path; "do not overbuild")
  → 3. inject      mint last-mile epics/stories/AC/QA + launch checklist → ROADMAP + sprint system  (needs_orchestration)
  → 4. execute     dispatch/recommend implementation sprints per module, with approval gates       (needs_orchestration)
  → 5. handoff     last-mile-handoff.md + final report (files, behavior, tests, risks, follow-ups)
```

Deterministic phases (`preflight`, `audit`, and the detection half of `plan`)
run in-process via the driver `scripts/bootstrap/lastmile/orchestrate.js`
(mirrors `spinup-orchestrate.js`). LLM-orchestrated steps — the minimal intake
discussion, roadmap/sprint synthesis, real sprint execution — cannot run from a
node process, so the phase returns status **`needs_orchestration`** with an
`orchestration_prompt`; the skill body (Alpha) fulfills it (asks the question,
calls `/sprint:plan` / `/roadmap:add` / dispatches the sprint), then re-invokes
with `--resume`. This mirrors spinup's research bridge and respects the
dispatch-route-guard.

## Phase 0 — Preflight

Run `/scan:install` (incl. the sprint-subsystem probe). Refuse a gappy install —
last-mile work injects sprints, so the sprint subsystem must be present. Then
**detect repo state** (`scripts/bootstrap/lastmile/lib/detect.js`): framework
(Next/Expo/Electron/plain), persistence (Prisma/Drizzle/Supabase/Firebase/SQLite),
auth (Clerk/NextAuth/Supabase/Firebase), payments (Stripe/others), analytics,
deploy config (vercel.json/netlify.toml/fly.toml/etc.), env-var inventory, and
sensitive-data signals. Detection is **evidence-based** — read `package.json`,
config files, and source; never assume.

## Phase 1 — Product Readiness Audit

Produce the **Last-Mile Gap Report** (`paths.docsRoot`/last-mile/gap-report.md)
answering, with evidence:

- What exists now? What is prototype-only (mocked/stubbed/local-only)?
- What blocks **monetization**? **deployment**? **user trust**? **support/operations**?
- What is the **shortest safe path** to a paid/public launch?

And the **Launch-Readiness Score (0–100)** across **9 dimensions** — product,
technical, security, privacy, monetization, funnel, deployment, analytics,
support (`scripts/bootstrap/lastmile/lib/score.js`). Each dimension scores 0–100
with named gaps; the composite is the headline number. The score is **honest
scaffold**: low is fine, it just names the work.

## Phase 2 — Last-Mile Plan

Choose the **profile** and its **easy-default stack** (below), then run each
relevant **module** to produce its plan. Modules are adapters under
`scripts/bootstrap/lastmile/modules/` — each `detect()`s current state and emits
a plan + the template to render. Output: the **Launch Plan**
(`paths.docsRoot`/last-mile/launch-plan.md) + per-module plan docs.

**The "do not overbuild" rule.** The shortest *safe* path to a paid launch wins.
Recommend the minimum that is monetizable + trustworthy + supportable. Heavy
infra (microservices, k8s, custom auth, heavy CRM, multi-region) is **refused
unless justified** by a named, evidence-backed need.

### Profiles

| Profile | Easy-default stack (vibe-coder bias) |
|---|---|
| `web-saas` | Next.js + Supabase **or** Neon/Postgres + Clerk/Supabase Auth + Stripe + Vercel + PostHog/Plausible + Resend/Loops |
| `mobile-app` | Expo / React Native + Supabase (db/auth) + Stripe where supported (else IAP) + EAS build/submit |
| `desktop-app` | existing stack + Stripe/license keys + auto-update + signed builds |
| `ai-tool` | Next.js + Supabase + Clerk/Supabase Auth + Stripe (usage/credit-based) + PostHog + Resend |
| `marketplace` | Next.js + Postgres + Stripe Connect + Clerk/Supabase Auth + Vercel + PostHog |
| `content-community` | Next.js + Supabase + Auth + Stripe (subscription) + email lifecycle |
| `internal-external` | harden existing stack; add auth boundary, billing, public funnel, analytics |
| `unknown` | infer from repo (or omit `--profile` to auto-infer); if truly unknown, default to the **Simpler MVP** stack: Supabase (db+auth) + Stripe Checkout + Vercel |

### Modules (adapters)

Each module: **detect → recommend (default) → plan (shortest safe path)**.

1. **Database** — detect persistence; recommend Supabase / Neon-Postgres / SQLite-Turso / Firebase / existing (easy setup, strong docs, low ops, compatible). Plan: schema, migrations, seed strategy, backup/export, env-var checklist, **data ownership & portability** notes.
2. **Auth / Accounts** — detect auth; recommend Clerk / Supabase Auth / Auth.js / Firebase Auth (custom only when justified). Cover: email/password, OAuth, magic links, password reset, session handling, **account deletion**, profile, admin access; role/permission model **only if needed**. Account-lifecycle tests.
3. **Payments / Monetization** — **Stripe by default**. Models: one-time, subscription, freemium, trial, usage-based, credit-based, waitlist/preorder. Build the **funnel, not just checkout**: pricing page → upgrade prompts → checkout → success/cancel → billing portal → **entitlement checks** → **webhook handling (signature-verified)** → refund/cancellation policy copy. Produce a **pricing hypothesis + test plan**. **Test-mode verification required before any live-mode instructions.**
4. **CRM / Support / Lifecycle** — decide relevance first. Lightweight defaults: Resend / Loops / Buttondown / Customer.io / HubSpot / Airtable / Notion by maturity. Capture: leads, waitlist, onboarding emails, payment events, support route, feedback route, churn signals. **No heavy CRM unless justified.**
5. **Website + Conversion Funnel** — homepage/landing, hero, proof/trust, features/benefits, pricing, FAQ, privacy/terms links, onboarding CTA, waitlist/checkout CTA. **Clear conversion over trendy aesthetics.** Analytics event per funnel step. Optionally enriched by `/research:deep` + `/learn:ingest` (see Research).
6. **Platform / Deployment** — detect target (web / iOS / Android / desktop / API-only / extension). Web → Vercel/Netlify/Cloudflare/Render/Railway/Fly/existing. Mobile → Expo/native/EAS (wrapper only if appropriate). Include env vars, build commands, CI checks, deploy previews, **rollback plan**, domain setup, **production smoke test**. **Boring + reliable over clever infra.**
7. **Security + Privacy** — practical baseline for **U.S. 13+ consumer apps** (NOT an absolute "compliant with all laws" claim). Secrets scan, env hygiene, auth/session checks, rate limiting, input validation, dependency audit, **webhook signature verification**, access-control tests, **data deletion/export path**, privacy policy + terms requirements, cookie/tracking disclosure, age-gate/no-under-13, **state privacy-law applicability checklist**, COPPA avoidance/escalation. Reuses `/redteam:full` + `/qa:audit` where present. **See Escalation below.**
8. **Analytics / Instrumentation** — **required event plan**: visit landing → click CTA → sign up → complete onboarding → hit activation moment → start checkout → complete payment → upgrade/downgrade/cancel → core product action (invite/share/export/save). Recommend PostHog/Plausible/Vercel Analytics/GA4/existing. Include **success metrics + kill/continue criteria**.

## Launch-Readiness Score

`0–100`, the headline number, composed from the 9 dimensions above. Re-computed
each `audit` run so progress is visible. A dimension at 0 with a named gap is
honest; a fabricated high score is not. The score never *claims* launch
readiness — it reports it.

## Human-approval gates (hard)

The skill **stops and requires explicit human approval** before any of these.
Enforced by `scripts/bootstrap/lastmile/lib/approval-gates.js` + the sprint
approval system; never self-authorized, never bypassed by `--turbo`:

- switching Stripe (or any payment provider) to **live mode**
- running a **production database migration**
- **domain / DNS** changes
- **app store** submission
- **sending emails to real users**
- **collecting sensitive data**
- **publishing privacy/terms as final legal documents**

## Security / privacy escalation (hard stop)

If the product handles **health, finance, children (under-13), education,
location, biometrics, employment, regulated content, or otherwise sensitive
data**, the security module **stops and escalates for legal/security review**
before any launch-readiness claim. The gap report flags it; the score caps the
privacy/security dimensions until review is recorded. WarpOS produces a
*compliance-by-default implementation plan*, never a legal guarantee.

## Phase 3 — Roadmap injection + sprint minting

Last-mile is not advice — it produces **sprint-ready** artifacts and injects them
into the existing WarpOS sprint system:

- Mint **last-mile epics + stories + acceptance criteria** (each AC carries a
  `verified_by:` line per the SP-20260518-007 convention) + **QA plan** + **launch checklist**.
- Add ROADMAP entries via `/roadmap:add` convention (Sprints ledger row + a
  milestone the work feeds; respects `/scan:roadmap-trace`).
- Use `/sprint:plan` → `/sprint:design` for each module's implementation sprint.
- Use **diff-model review** (`/redteam:full`, `/research:*`, or the configured
  reviewers) for product strategy, monetization, security, launch-readiness, and
  compliance review.

## Phase 4 — Execute (guided)

Dispatch implementation sprints when **safe** (reversible, no approval gate), or
**recommend + halt** at any gate. Per module, prefer the existing sprint
workflow (`/sprint:execute`). **Repair loops:** if a readiness check fails,
mint a targeted fix sprint rather than papering over it.

## Phase 5 — Handoff

Produce `last-mile-handoff.md` (product root) + a final report: files changed,
skill behavior exercised, tests run, **risks**, **follow-up sprints**, the
**Launch-Readiness Score** with per-dimension breakdown, and how to use the skill
next. List every pending **human-approval gate** the operator must clear.

## Research (funnel / monetization / security enrichment)

The funnel, monetization, and security modules ship **baked-in v1 playbooks**
(`paths.reference`/lastmile/*.md) — practical, current, refreshable. With
`--research deep`, the skill **invokes `/research:deep`** (real API spend; >$5
needs operator OK per `## Autonomy`) and `/learn:ingest` (free; needs `yt-dlp`
for YouTube transcript extraction) to refresh those playbooks with cited signal,
then merges findings the way spinup's canon research bridge does. Default `off`
uses v1 — no spend, no blocking.

## Required artifacts (written product-side)

- `paths.docsRoot`/last-mile/gap-report.md
- `paths.docsRoot`/last-mile/launch-plan.md
- `paths.docsRoot`/last-mile/monetization-plan.md
- `paths.docsRoot`/last-mile/conversion-funnel.md
- `paths.docsRoot`/last-mile/security-privacy-checklist.md
- `paths.docsRoot`/last-mile/platform-deployment-plan.md
- `paths.docsRoot`/last-mile/analytics-event-plan.md
- `paths.requirementsRoot`/last-mile/*.md (or the repo's canonical requirement location)
- ROADMAP/sprint entries via the current WarpOS sprint workflow
- `last-mile-handoff.md` (product root)

## Execution — the orchestrator driver

```bash
node scripts/bootstrap/lastmile/orchestrate.js \
  [--profile <name>] [--phase preflight|audit|plan|inject|execute|handoff] \
  [--module <name>] [--resume] [--research off|deep] [--out <docs-dir>] \
  [--repo-root <dir>] [--state <file>] [--json] [--dry-run]
```

- Always runs `preflight` first (hard gate — refuses a gappy install via `/scan:install`).
- Deterministic phases run in-process; LLM steps exit **3 (`needs_orchestration`)** with an `orchestration_prompt` for the skill body to fulfill, then `--resume`.
- Phase-state persists to `.warpos/lastmile-state.json`.
- Fixture e2e: `node scripts/bootstrap/lastmile/test-orchestrate.js` proves the chain + the readiness detectors + the holdout cases WITHOUT standing up a real product (canonical proves the chain; real launch is product-side).

## Holdout fixtures (completeness, fixture-backed)

The 7 holdout cases live in `scripts/bootstrap/lastmile/fixtures.js`, defined as
code and materialized to temp dirs at test time (a committed fake `package.json`
would trip `dependency-admission-guard`). The e2e audits each, asserting the
audit catches the gap:

- `no-auth` — prototype with no auth
- `auth-no-payments` — auth present, no payments
- `stripe-no-webhook-verify` — Stripe present, webhook signature **not** verified
- `db-no-deletion-path` — database present, no deletion/export path
- `no-funnel` — web app with no conversion funnel
- `mobile-appstore` — mobile app needing app-store readiness
- `sensitive-data-redflag` — sensitive-data signals → **must trigger escalation**

## Learning capture

Repeated last-mile gaps (e.g. "Stripe without webhook verification" recurring
across products) graduate into reusable checklist items, hooks, or future
WarpOS defaults via `/learn:integrate`. The reference playbooks are the durable
home for these.

## Relationship

- `bootstrap:spinup` — the prequel (idea → on screen). lastmile picks up at "it runs."
- `portfolio:run` — dispatch lastmile into another product from WarpOS.
- `/sprint:plan` / `/sprint:design` / `/sprint:execute` — the engines Phase 3–4 inject into.
- `/redteam:full`, `/qa:audit` — reused by the security module.

## Notes

- Reference paths via `paths.*` keys, not literals (path-lint enforces).
- Reversible per phase: audit/plan write to `paths.docsRoot`/last-mile/; inject/execute run in sprint branches.
- **Never** auto-clears a human-approval gate. **Never** claims legal compliance. **Never** flips Stripe live or runs a prod migration without explicit approval.
- The shortest *safe* path to a paid launch wins.
