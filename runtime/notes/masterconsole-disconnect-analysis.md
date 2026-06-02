# Master Console ↔ WarpOS Canonical — Disconnect Analysis

_Read-only analyst pass. Date: 2026-06-02. masterconsole @ `feat/m2-followups`; WarpOS canonical @ `june-2`. No masterconsole files were modified._

> **Headline reframe (corrects the task brief):** masterconsole is **NOT on warpos 0.10.0**. Its
> `.claude/manifest.json`, `version.json`, and `.warpos` all read **warpos 0.13.1** — the **same
> version canonical currently ships** (canonical `version.json` = 0.13.1, releasedAt 2026-06-01,
> `previousVersions` ends at 0.13.0). There is **no 0.18.x release**; the "0.16.0 / 0.17.0 / 0.18.x"
> seen in commit messages and roadmaps are **spec/milestone identifiers, not shipped versions**. So
> the engine-version gap the brief assumed (8 minor versions behind) **does not exist** — masterconsole
> is current. The real disconnects are about *shape and contract*, not version lag (see §3).

---

## 1. What masterconsole IS today

A productized WarpOS: a **closed local engine + a cockpit + a commercial front door**, built as a real
multi-surface repo. Architecture in the working tree:

- **Cockpit (`src/`)** — Vite + React + TypeScript SPA. Components: `PortfolioOverview`, `ProductCard`,
  `ProductDetail`, `ActivityTimeline`, `HealthSummary`/`HealthDot`, `Brain`/`BrainRows`/`BrainSync`,
  `ApprovalQueue`, `StartSprintModal`, `LiveView`, `EngineSystems`, `DevServers`, `NewProject`,
  `RemoveProjectModal`, `ArchivedProjects`, `EmptyState`. This is the "product the customer buys."
- **Read/control layer (`server/`)** — Node-only Vite dev-middleware (never bundled to browser):
  `portfolio-source.ts` (reads `~/.warpos/portfolio.json` + per-product `.claude/manifest.json` /
  `current-sprint.yaml` / `events.jsonl`), `engine-systems-source.ts` + `engine-catalog.ts`
  (codename-safe overlay), `actions.ts` + `bootstrap-actions.ts` + `approve.*` (two-way control),
  `brain-sync.ts`, `dev-servers-source.ts`, `events.ts`, plus `auth/` (device-flow, license,
  secure-store, transport, local-paywall) and `keys/` (BYO-key route + redaction). Heavy test coverage
  (`*.test.ts` for engine + http paths).
- **Commercial front door (`site/`)** — Astro static-first marketing site + SSR API routes:
  `/api/waitlist`, `/api/license/validate`, `/api/stripe/{checkout,webhook}`, `/api/premium/lastmile`;
  libs for rate-limit, turnstile, http-security, license-store, entitlement, analytics; privacy/terms
  pages. Built `dist/` present.
- **Engine layer** — full WarpOS install: `.claude/`, `_warpos/`, `scripts/`, `framework/`, `_requirements/`,
  `cli/`, `install.ps1`. Plus product docs: `WARPOS.md` (gap register, 86 KB), `ROADMAP.md` (43 KB),
  `GO_LIVE_CHECKLIST.md`, `SEAMLESS.md`, `DUMP.md`.

### Per-milestone

| Milestone | Status | What it built |
|---|---|---|
| **M1 — "The cockpit is real"** | ✅ shipped | S1 read-only cockpit on real local data; S2 Portfolio Overview (cards: name/install/sprint/activity/health); S3 Product Detail + Activity Timeline + Health + read-only cross-repo Brain + honest empty/stale states; S4 **brand-boundary enforcer** (authored-copy guard `check-brand-boundary.mjs` + runtime data-flow check `check-brand-boundary.runtime.mjs`, both release-blocking). |
| **M2 — "The commercial front door"** | 🟡 largely built, dormant | S1 marketing site + waitlist; S2 ✅ license-key-only accounts (key IS the credential, SHA-256 at rest, ADR-0003); S3 ✅ Stripe test-mode subscription + fail-closed `requirePro` paywall gating one premium skill (idea→paid / `bootstrap:lastmile`, ADR-0004); S4 privacy/terms + funnel analytics + pre-deploy security gate. **Still ahead:** S5 launch-blocking security torture test, S6 npx FTUE + secure key route (ADR-0008/0009), operator deploy. All monetization fail-closed behind placeholder keys. |
| **M3 — "The bridge"** | 🔵 in progress (current branch) | Two-way control: start sprints from panel, clear approval gates (incl. mobile), live gauntlet views, cross-repo brain sync; plus a large operator-driven backlog S5–S18 (long-running progress, stack visibility, dev-servers, objectives, **two-phase bootstrap setup→paint**, clickable Product Detail, and the **S18 keystone "Project Master Console" — ELI5 roadmap + click-to-run + talk-to-it** per-project cockpit). The branch `feat/m2-followups` carries M2 cleanup + M3 work. |

**Current TOP priority (operator directive 2026-06-02):** "Kill the dumbness" — sits ABOVE the milestone
sequence. Trigger: a real cockpit bootstrap (`doogle`) produced canon with 16 raw `{{placeholder}}` tokens.
Work: smart canon (LLM-expand the intent brief, never emit a raw token), a real enforcer (rendered canon has
ZERO unfilled tokens — presence-of-intelligence not absence-of-flag), wire the parked managers
(Research/Insight Lead + Product Designer), no dead-ends (bootstrap runs to completion, zero command-running).

---

## 2. WarpOS's intended Master Console shape

Two distinct intent sources — keep them separate:

**(a) The productization shape (the operator's locked design + masterconsole's own canon).**
Master Console = productized WarpOS, locked as **closed local engine + hosted cockpit + cloud brain**, mantra
**cockpit-is-product / engine-is-moat / cloud-is-plumbing**:
- **Engine = moat** (proprietary, hidden, runs locally on the user's BYO key, ~$0 COGS).
- **Cockpit = product** (the surface customers buy; makes the invisible agent-OS visible).
- **Cloud = plumbing** (accounts/license/billing + later hosted brain-sync + hosted execution).
- **Monetization ladder:** Free (local + BYO-key) → Local premium (license-gated but *soft*/crackable:
  skills, themes) → **Defensible premium anchored to server-only capability** (sync/cloud/hosted/seats =
  uncrackable moat). Rule: monetization rides on persistence/sync/premium-skills, **never core capability**.
- **Hard brand boundary:** "WarpOS" (the engine codename) must **NEVER** appear product-facing. Master Console
  is the only public brand.
- **Scope:** WarpOS + Master Console are scoped to get products **TO PMF, not to scale** (pre-MVP / Early Dev;
  canonical `current-stage.md` declares `pre-mvp` and carves out engine-reliability work needed for the
  "imminent Master Console launch" as core-loop, not gold-plating — DP-gap #30).

**(b) The productization *contract* WarpOS canonical expects every downstream product to use.**
This is the engine↔product seam, from operator memory + canonical skills:
- **`/warp:flag`** (downstream) → appends a structured entry to the product's `WARPOS.md` gap register →
  **`/warp:reconcile`** (canonical) verifies + fixes upstream. Root cause of the historic "downstream always
  missing" pain = *contractless productization*; fix = **artifact-first, contract-tested releases** with a
  **sealed capsule / consumer contract** and a **keystone sealed-capsule gate** (roadmapped as the 0.16.0
  deepening). `/warp:release` drives the canonical release (promote→bump→regen→capsule→gates→ff-merge).

> **Note on the runtime/notes MASTERPLAN files** the brief pointed at
> (`MASTERPLAN-system-update.md`, `masterplan-recon.md`, `masterplan-reconciliation.md`,
> `models-sprint-plan.md`, and `_planning/plans/MASTERPLAN.md` / `PONDER-real-shape.md`): these are the
> **WarpOS *internal engine* evolution masterplan** (manager hierarchy + Director of Marketing, F2 artifact
> contracts, audience/insight layer, design+marketing function, FE/BE builder split, `/etc` authoring
> accelerator). They are **NOT** the Master Console productization roadmap — but they ARE the upstream
> capabilities masterconsole is *waiting on* (see disconnect D5/D8). They matter here because masterconsole's
> own "Kill the dumbness" + "wire the parked managers" work is the downstream pull for exactly those
> upstream foundations.

---

## 3. DISCONNECTS

| # | Area | WarpOS intended shape | masterconsole actual | Severity |
|---|---|---|---|---|
| **D1** | **Version drift** | Stay current with canonical (latest = **0.13.1**). | **warpos 0.13.1 — fully current.** Brief's "0.10.0 / behind 0.18.x" is inaccurate. | ✅ none (brief was wrong) |
| **D2** | **engine / cockpit / cloud split** | closed engine + hosted cockpit + cloud brain. | Engine (full install) ✅; cockpit (`src/`) ✅; cloud (`site/` accounts+license+Stripe) built but **dormant/undeployed**; hosted-cockpit + cloud brain-sync = M3, not done. | 🟡 on-track; cloud half unshipped |
| **D3** | **cockpit-is-product / engine-is-moat / cloud-is-plumbing** | Faithfully encoded. | CORE_BRIEF, PRODUCT_MODEL, WARPOS.md all state it verbatim; `engine-catalog.ts` overlay hides engine internals behind product-safe names; monetization rides on sync/persistence not core capability (EVOLUTION + FIELD_REGISTRY tier rule). | ✅ strong alignment |
| **D4** | **Brand boundary (WarpOS never product-facing)** | Codename never appears in any product surface. | **NO leak found** in product-facing code: `src/` (client) = 0 hits; `site/src/` = 0 hits; built `site/dist/client/` = 0 hits; `index.html` clean. "warpos" appears only in **non-product-facing** places: `~/.warpos/` path strings, internal docs (WARPOS.md/PROJECT.md self-label as internal), and `package.json`/manifest engine metadata. Enforced by `check-brand-boundary.{mjs,runtime.mjs,fixture.mjs}` (release-blocking, allowlist overlay = leak-proof-by-default). | ✅ no leak; well-enforced |
| **D5** | **Productization contract (warp:flag/reconcile, capsule, keystone gate)** | flag→reconcile loop + sealed-capsule/consumer contract + keystone sealed-capsule gate. | **flag/reconcile loop = actively used and healthy**: `WARPOS.md` carries **60 WI- entries** (WI-2026-05-29-01 … WI-2026-06-02-42), ~23 marked FIXED / upstream-pending / LOCAL-FIX. This is the contract working as designed. **BUT** the deeper half — **sealed capsule / consumer contract / keystone sealed-capsule gate** (the 0.16.0 deepening) — is **not yet shipped in canonical**, so masterconsole can't consume it. The contract is *flag-based reactive*, not yet *capsule-based proactive*. | 🟡 reactive half works; proactive capsule half absent upstream |
| **D6** | **"Dumb output" / smart-by-default** | Engine never ships half-rendered output; "anywhere it can expand input, it MUST." | **Live violation:** cockpit bootstrap of `doogle` shipped canon with **16 raw `{{placeholder}}` tokens** (WI-2026-06-02-38, JM-2026-06-02-01). The `no-dumb-default` test only checks a flag is absent (hollow gate) — exactly the CLAUDE.md "aspirational-vs-enforced" disease. Root cause is **upstream** (`scripts/canon/generate.js` placeholders instead of LLM-expanding). | 🔴 active product defect, upstream root cause |
| **D7** | **No dead-ends for vibe coders** | Bootstrap runs to completion; never tells a non-technical user to run a command. | Cockpit's "✦ Alex is continuing" surface still **prints an un-runnable command** at `needs_orchestration` seams (M3·S16 two-phase bootstrap is the fix, not yet built). Design law "if we tell them to run a command, it's over" is stated but **unenforced**. | 🔴 known gap, fix planned (S16) |
| **D8** | **Parked managers / design function (smart canon depth)** | Manager hierarchy (DoP, DoM, DoQA, Design Lead, designers), audience/insight layer, F2 artifact contracts — the engine masterplan. | masterconsole needs Research/Insight Lead (audience dossier → intent/canon) + Product Designer (first-screen) to make canon "deep, not merely non-empty" (ROADMAP "Now" item #3, WI-2026-06-01-25 follow-on). These are **canonical's unbuilt masterplan foundations** (F0/F1/F2/W2) — masterconsole is blocked on upstream. | 🟡 cross-repo dependency on unbuilt canonical work |
| **D9** | **PMF-scope alignment (to-PMF, not scale)** | Get products TO PMF; defer scale. | Mostly aligned (pre-MVP stage declared; Team/Studio/SSO/marketplace/mobile all correctly gated to "Later"). **Watch-out:** the M3 backlog has ballooned to S1–S18 with several "scale-flavored" candidates (Terminal 2.0 multiplexer, themes marketplace, autonomous operator agent, multi-goal command center) — most are trigger-gated, but the *volume* of M3 surface risks breadth-over-depth, the exact tension flagged in `PONDER-real-shape.md` ("prove vs position"). | 🟡 mostly aligned; backlog-creep watch |
| **D10** | **Lastmile / GTM maturity** | idea → on screen → paid, with the last mile baked in. | `bootstrap:lastmile` exists and is the gated premium skill, but per WARPOS.md WI-2026-05-29-03 the M2 last-mile push **did NOT actually use `/bootstrap:lastmile`** — the GTM rung is the thinnest (matches the canonical PONDER finding that lastmile is the thin rung the engine masterplan should fatten). | 🟡 GTM path declared > exercised |

---

## 4. Suggestions (concrete actions to close each disconnect)

**Engine-side (canonical WarpOS) — the upstream root causes:**
1. **D6 (highest leverage):** Fix `scripts/canon/generate.js` to **LLM-expand the intent brief into thin
   canonical fields** (grounded, no invented facts — the way `roadmap:create` synthesizes and the clone
   engine expands a competitor), so a finished canonical doc can never contain a raw `{{token}}`. Replace
   the hollow `no-dumb-default` flag-check with an enforcer that asserts **rendered canon has zero unfilled
   tokens** (presence-of-intelligence). This re-fixes `doogle` AND every future downstream bootstrap. Already
   flagged upstream as WI-2026-06-02-38 — pull it into a canonical sprint and `/warp:reconcile`.
2. **D5:** Ship the **sealed-capsule / consumer-contract + keystone sealed-capsule gate** (the roadmapped
   0.16.0 deepening). This converts the productization contract from *reactive flag→reconcile* to
   *proactive artifact-first contract-tested releases* — the structural fix for "downstream always missing."
3. **D8:** Sequence the engine masterplan's **F2 artifact-contracts spike → F0 manager base / F1 audience
   layer → W2 design function** (per `_planning/plans/MASTERPLAN.md` / `SPRINT-PLAN.md`), since masterconsole's
   "wire the parked managers" + "smart canon depth" work is the live downstream pull. Prove with ONE pilot
   product end-to-end (the PONDER "prove, don't position" verdict) before broad rollout.

**Product-side (masterconsole):**
4. **D7:** Build M3·S16 **two-phase bootstrap (`setup` → "setup complete" → `paint`)** with explicit
   user-pressed gates, fulfilling every `needs_orchestration` seam in-session so the cockpit never prints an
   un-runnable command. Add an enforcer (test/guard) for the "never tell a vibe coder to run a command" law
   so it stops being prose.
5. **D9:** Run `/roadmap:cleanup` + `/roadmap:prioritize` (Director-of-Product lens) on the M3 S1–S18
   backlog; consolidate the Terminal 2.0 / themes / autonomous-operator cluster firmly under "Later
   (trigger-gated)" and keep M3's committed scope to the bridge keystone (S18 Project Master Console) +
   its precursors. Protect depth over breadth to stay on the to-PMF mandate.
6. **D10:** Actually exercise `/bootstrap:lastmile` for the M2 launch push (close WI-2026-05-29-03) so the
   idea→paid spine is *run*, not just *declared* — the GTM rung is the product's weakest axis.
7. **D2 / cloud half:** Finish M2·S5 (launch-blocking security torture test, cross-vendor) + M2·S6 (npx FTUE
   + secure BYO-key route per ADR-0008/0009), then the operator deploy to `masterconsole.ai`. This lights up
   the "cloud-is-plumbing" tier that's built-but-dormant.

**Keep doing (no action — these are working):**
- Brand boundary (D4): the allowlist-overlay + release-blocking runtime check is the right pattern; keep the
  deferred pure-visual Playwright render check on the enforcement-debt ledger until an MCP browser is available.
- flag→reconcile loop (D5 reactive half): the 60-entry `WARPOS.md` register is the contract working — keep
  flagging every engine gap from the product so canonical fixes it at the source.

---

## Appendix — version reality check (evidence)

- masterconsole `.claude/manifest.json` → `"warpos.version": "0.13.1"`; `version.json` → `0.13.1`.
- canonical `version.json` → `0.13.1`, releasedAt 2026-06-01, `previousVersions` ends `0.13.0` (no 0.14+).
- ∴ masterconsole is on the **latest** engine release. The brief's "0.10.0" and "~0.18.x canonical" are both
  incorrect; "0.16.0/0.17.0/0.18.x" are spec-milestone labels, not shipped versions.
