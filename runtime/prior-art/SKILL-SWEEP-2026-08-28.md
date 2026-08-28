# WarpOS Skill Sweep — prior art, per skill and per capability family

**Compiled:** 2026-08-28 · **Repo:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS`
**Companion to:** `runtime/prior-art/PRIOR-ART-EVIDENCE-2026-08-28.md` (read that first — this document
inherits its frame, its dates, and its honesty standard, and reuses its verdicts verbatim wherever a
family maps onto a pair it already established).
**Machine-readable:** `runtime/prior-art/skill-sweep.json`

---

## 0. What this is, and the frame it inherits

The operator asked to "look at every use of every skill" as part of the prior-art effort. This sweep
inventories **all 237 skill files** under `.claude/commands/**/*.md` (230 live + 7 deprecated
aliases), dates each one from git, clusters them into **35 capability families**, and asks the only
question that matters per family: *did the **procedure** have a public analog earlier?*

Four constraints from the companion document apply unchanged, and stating them is what makes the
three surviving claims credible:

1. **This repo's history begins 2026-03-02.** Anything shipped before that is not ours.
2. **The substrate is vendor-first, by construction.** A WarpOS skill *is* a Claude Code slash
   command / Agent Skill (2025-10-16, custom slash commands earlier). A WarpOS hook *is* a Claude
   Code hook (2025-06-30, v1.0.38). A WarpOS agent spec *is* a Claude Code subagent (2025-07-24).
   No priority is claimed on any of that, and every family that merely wraps a primitive is marked
   THEY-WERE-FIRST without argument.
3. **45 of the 237 skills first land at `cd37d410` (2026-04-12)** — the "full framework extraction
   from Jobzooka" commit. They arrived fully formed, which means they were built *earlier*, in a
   private repo. Those earlier dates **are not provable here** and are treated as unproven
   throughout. Their honest label is *"≤2026-04-12, built earlier in Jobzooka, unprovable in this
   repo."*
4. **Git dates are author-supplied and the commits are unsigned.** The dates below are the best
   available evidence, not adversarially-defensible proof. PRIOR-ART §5 lists what would harden them.

The two oldest skill files in the repo are `/warp:check` (`c7db0a2b`, 2026-03-19) and `/warp:sync`
(`afd31592`, 2026-03-19). The newest in this sweep is `/memory:verify` (`d6e158d2`, 2026-07-25).

## 1. Headline

| | Families | Skills |
|---|---|---|
| **THEY-WERE-FIRST** | 30 | 204 |
| **WARPOS-FIRST** | 3 | 13 |
| **INCONCLUSIVE** | 1 | 2 |
| **N/A-COMPOSITE** | 1 | 18 |
| **Total** | **35** | **237** |

**86% of skills inherit a THEY-WERE-FIRST verdict.** That is the correct outcome and it matches the
companion document's finding: WarpOS's originality is *compositional*, not atomic. The three
WarpOS-first families are:

- **sleep-dream** (2 skills) — the flagship, and **vendor-scoped only**: 24 days ahead of Anthropic's
  Dreaming announcement, 356 days *behind* Letta's sleep-time compute. Lead with this only if you
  pre-empt the Letta comparison yourself.
- **enforcement-debt** (5 skills) — a ledger of *policies that have no enforcer*. Uncontested: no
  product tracks the enforcement gap itself.
- **paths-registry** (6 skills) — source→generated path registry with a write-time literal guard.
  Uncontested, and deflated by its own authors as "config hygiene, not a product category."

Plus two skills that are WarpOS-first inside a family that is not: **`/guides:integrate`** and
**`/knowledge:integrate`** — deterministic, idempotent, ledgered placement of a doc at a *declared
anchor inside named consumer agent specs*. Every vendor and industry analog found (Cursor `@Docs`,
Devin Knowledge, Backstage TechDocs) **indexes** docs for retrieval instead. That is a different
mechanism, and no analog was found for it.

---

## 2. Family summary

Sorted by WarpOS first-landing. "Their date" is vendor / industry.

| Family | # | WarpOS first-landed | Closest vendor analog | Closest industry analog | Their date | Verdict | Margin |
|---|---|---|---|---|---|---|---|
| **warp-distribution** — Framework distribution: setup/update/release/uninstall/doctor/flag/reconcile | 20 | `c7db0a2b` · 2026-03-19 | Claude Code **plugins & marketplaces** | **Cookiecutter** · **Yeoman** · **Copier** / **cruft** (update an already-generated project from its template) | 2025-10-31 / 2013 · 2012 · 2020 | **THEY-WERE-FIRST** | −168 d vs plugins; ~−6 yr vs scaffolders |
| **sleep-dream** — Sleep / dream memory consolidation | 2 | `cd37d410` · 2026-04-12 | Anthropic **Dreaming** (Managed Agents) — agent memory consolidation, announced at Code with Claude SF | **Letta — sleep-time compute** (background agent reorganizes another agent's memory during idle) | 2026-05-06 / 2025-04-21 | **WARPOS-FIRST** | +24 d vs Anthropic (+4 d on the public tag warpos@0.1.4, 2026-05-02) · −356 d vs Letta |
| **memory-learning** — Memory stores + scored learnings lifecycle | 7 | `cd37d410` · 2026-04-12 | Claude Code **Auto Memory / MEMORY.md** (v2.1.59); Claude **memory tool + context editing** (API) | **MemGPT** (tiered agent memory) · **Cursor Memories** 1.0 · **Windsurf Wave 1 memories** | 2026-02 / 2025-09-29 / 2023-10 · 2025-06-04 · 2025-01 | **THEY-WERE-FIRST** | ~−2.5 yr |
| **beta-judgment** — Independent second-opinion judge (β) + mining its precedent | 3 | `cd37d410` · 2026-04-12 | Claude Code `/code-review`, `security-review` skills (review, not decision arbitration) | **LLM-as-a-judge** (MT-Bench et al.) · **Aider architect/editor** two-model split | 2025-10-16 / 2023 · 2024 | **THEY-WERE-FIRST** | ~−2 yr |
| **reasoning-frameworks** — Classify-then-solve reasoning + graded fix quality | 6 | `cd37d410` · 2026-04-12 | Claude **extended thinking** (configurable thinking budget) · Claude Code plan mode | Cynefin (1999) · 5 Whys / TRIZ · Gemini thinking budgets (2025-04-17) · GPT-5 reasoning_effort (2025-08-07) | 2025-02-24 / 1999 onward | **THEY-WERE-FIRST** | ~−15 mo (model layer); decades (the frameworks themselves) |
| **session-state-handoff** — Session checkpoint, resume, handoff, prescriptive DUMP | 8 | `cd37d410` · 2026-04-12 | Claude Code `/resume`, **checkpoints/rewind** (v2.0) | **Cline Memory Bank** · **Gemini CLI checkpointing** · Roo Code | 2025-09-29 / 2025-early · 2025-06 | **THEY-WERE-FIRST** | ~−10 mo |
| **cross-session-inbox** — Cross-session broadcast inbox between sessions of the same assistant | 2 | `cd37d410` · 2026-04-12 | Claude Code **Agent Teams** SendMessage (in-session, session-scoped teams) | **LangChain Agent Inbox** (human-in-the-loop UX for ambient agents) · **A2A protocol** (cross-vendor agent discovery) | 2026-02-05 / 2025-01-14 · 2025-04 | **INCONCLUSIVE** | — |
| **modes-teams** — Build modes + named agent faces / teams | 6 | `cd37d410` · 2026-04-12 | Claude Code **Agent Teams** (with Opus 4.6) | **MetaGPT** ("first AI software company": PM/architect/engineer/QA roles) · AutoGen · CrewAI · LangGraph | 2026-02-05 / 2023-08 · 2023-09-25 · 2023-10 · 2024-01-08 | **THEY-WERE-FIRST** | ~−2.7 yr |
| **oneshot-build** — Standalone autonomous skeleton build (preflight→run→retro) | 4 | `cd37d410` · 2026-04-12 | Claude Code background / headless agents | **Devin** · **Cursor Background Agent** (0.50→GA 1.0) · GitHub Copilot coding agent | 2025 / 2024-03-12 · 2025-05-15 · 2025-05 | **THEY-WERE-FIRST** | ~−2 yr |
| **enforcement-debt** — Enforcement-debt ledger — every policy names its enforcer or logs the gap | 5 | `cd37d410` · 2026-04-12 | `claude plugin eval` (evaluates plugins, not unenforced policy) | SonarQube tech-debt register · ADR logs · architecture fitness functions — none tracks POLICY WITHOUT AN ENFORCER | 2026 / 2007 · 2017 | **WARPOS-FIRST** | uncontested — no analog found in any product |
| **issue-register** — Recurring system-issue register + cross-run pattern intelligence | 6 | `cd37d410` · 2026-04-12 | — | **Sentry** issue grouping + automatic regression state · AI Issue Grouping GA | — / 2008 onward · 2025-02 | **THEY-WERE-FIRST** | ~−17 yr on the concept |
| **hooks-mgmt** — Hook authoring, disable/enable, test, friction measurement | 5 | `cd37d410` · 2026-04-12 | Claude Code **hooks** (v1.0.38) | git hooks (1990s) · Husky/lint-staged · **Codex hooks** (near-copy of the Claude hook vocabulary; docs carry no date) | 2025-06-30 / decades | **THEY-WERE-FIRST** | −262 d |
| **skills-meta** — Skills about skills — create/edit/delete/cleanup, author-with-eval-pack, coverage self-inventory | 9 | `cd37d410` · 2026-04-12 | **Agent Skills** (SKILL.md) · `/skill-doctor` · `claude plugin eval` | **Cursor Rules** · **promptfoo** · **DSPy** · **LangSmith evals** · Anthropic **prompt improver** | 2025-10-16 · 2026 / 2024 · 2023 · 2023-late · 2023 · 2024-11 | **THEY-WERE-FIRST** | ~−1 to −3 yr |
| **research** — Deep research — multi-round, multi-provider | 2 | `cd37d410` · 2026-04-12 | OpenAI **deep research** | **Gemini Deep Research** · **Perplexity Deep Research** | 2025-02-02 / 2024-12-11 · 2025-02-14 | **THEY-WERE-FIRST** | ~−16 mo |
| **qa-redteam-security** — QA persona audits, red-team personas, privacy/secrets/ingest-firewall scans | 8 | `cd37d410` · 2026-04-12 | Anthropic **security-review** skill · code-vulnerability scanner | **garak** (NVIDIA) · **PyRIT** (Microsoft) · **promptfoo redteam** | 2025-10 · 2026-05-06 / 2023-06-13 · 2024-02-22 · 2023 | **THEY-WERE-FIRST** | ~−2.8 yr |
| **commit-land** — Commit / push / land (merge to default branch) | 4 | `cd37d410` · 2026-04-12 | Claude Code git integration; GitHub Copilot commit messages | **aider** auto-commits with AI-generated messages · **aicommits** | 2025 / 2023-04 · 2023 | **THEY-WERE-FIRST** | ~−1 yr |
| **docs-maps-discovery-reporting** — System discovery, relationship maps, reference integrity, ELI5 reports | 18 | `cd37d410` · 2026-04-12 | — | **dependency-cruiser** · **ArchUnit** · **Structurizr/C4** · **SonarQube** · **Backstage** catalog | — / 2016 · 2017 · 2016 · 2007 · 2020 | **THEY-WERE-FIRST** | ~−9 yr |
| **ui-design-review** — Design-system compliance review of rendered UI | 2 | `655775f2` · 2026-04-15 | Claude Code + Playwright MCP visual review patterns | **Applitools Eyes** · **Percy** · **Chromatic** (purpose-built for design-system consumer impact); Percy AI Visual Review Agent | 2025 / 2013 · 2016 · 2017 · 2025-late | **THEY-WERE-FIRST** | ~−9 yr |
| **sprint-lifecycle** — Registry-driven sprint lifecycle (plan→design→build→gauntlet→release→retro) | 13 | `bf438de7` · 2026-04-16 | **Claude Code Dynamic Workflows** — agent()/parallel()/pipeline() deterministic JS orchestration | **Google ADK workflow agents** (Sequential/Parallel/Loop) · **CrewAI Flows** · LangGraph | 2026-05-28 / 2025-04 · 2024-mid · 2024 | **THEY-WERE-FIRST** | ~−14 mo |
| **system-health-scans** — Aggregate system health — run every scan, linters, environment readiness | 4 | `d39661a8` · 2026-04-16 | Claude Code `/doctor` | **SonarQube** · **ESLint** · architecture **fitness functions** (Building Evolutionary Architectures) · **Danger.js** | 2025 / 2007 · 2013 · 2017 · 2016 | **THEY-WERE-FIRST** | ~−9 to −19 yr |
| **karpathy-autoresearch** — Closed-loop optimization of the agent's own artifacts | 3 | `38d771bf` · 2026-04-18 | Anthropic **Outcomes** / capability curves for Managed Agents | **Sakana AI Scientist** · **DeepMind AlphaEvolve** · **ShinkaEvolve** · DSPy optimizers | 2026-05-06 / 2024-08 · 2025-05 · 2025-09 · 2023-late | **THEY-WERE-FIRST** | ~−20 mo (but +18 d vs Anthropic only) |
| **paths-registry** — Centralized path registry — source→generated, guard hook, rename/convert tooling | 6 | `6779f6e6` · 2026-05-01 | — | none found in any product (nearest genre: tsconfig path aliases, Bazel labels — neither is a generated single-source registry with a write-time literal guard) | — / — | **WARPOS-FIRST** | uncontested — no analog found |
| **growth-marketing** — Growth + marketing content: angles, message brief, advertorial, landing page, ad images/video, LinkedIn/Contra posts | 10 | `6779f6e6` · 2026-05-01 | — | **Copy.ai** · **Jasper** (as Conversion.ai) · **AdCreative.ai** (ad images, later product video) | — / 2020-07 · 2021-01 · 2021-11 | **THEY-WERE-FIRST** | ~−4.5 yr |
| **agent-roster** — Agent-spec roster, smoke-dispatch, role-parity enforcement | 5 | `38adbda2` · 2026-05-04 | Claude Code **Subagents** (`/agents`) | CrewAI agent definitions · AutoGen agent configs | 2025-07-24 / 2023-10 | **THEY-WERE-FIRST** | ~−9 mo |
| **warpos-distribution-integrity** — WarpOS ship/install/capsule/migration integrity scans | 18 | `38adbda2` · 2026-05-04 | — | **cruft** / **Copier** template-drift detection · Terraform drift detection · Backstage catalog validation | — / 2020 · 2016 | **N/A-COMPOSITE** | — |
| **events-telemetry** — Append-only event ledger + query/tail | 2 | `38adbda2` · 2026-05-04 | OpenAI Agents SDK built-in tracing | **LangSmith** · **Langfuse** agent tracing | 2025-03-11 / 2023 · 2024-07 | **THEY-WERE-FIRST** | ~−3 yr |
| **permissions-turbo** — Session-scoped permission pre-authorization + spend ceiling | 4 | `4c3bc3f9` · 2026-05-13 | Claude Code **auto mode** (permission classifier) | **OpenAI Agents SDK guardrails** · usage limits | 2026-03-24 / 2025-03-11 | **THEY-WERE-FIRST** | −50 d vs auto mode; ~−14 mo vs guardrails |
| **model-routing-dispatch** — Role→provider→model→effort routing + dispatch console | 8 | `7be21c64` · 2026-05-18 | Claude Code **fallback model chains** (within-provider) | **OpenRouter** · **LiteLLM proxy** · Portkey | ~2026-06 / 2023 | **THEY-WERE-FIRST** | ~−3 yr |
| **roadmap** — Roadmap create/prioritize/predict-next with a product-persona lens | 8 | `91d38d39` · 2026-05-19 | — | **Productboard** · **Jira Product Discovery** (GA) · Aha! | — / 2014 · 2023-02-09 | **THEY-WERE-FIRST** | ~−3 yr |
| **portfolio-multiproduct** — Operating N product repos from one framework (register/list/open/run/sync/status/spinup) | 8 | `0b043681` · 2026-05-22 | — | **Backstage** software templates + golden paths · **Nx** generators · **cruft**/**Copier** propagation | — / 2020-03 · 2020 · 2020 | **THEY-WERE-FIRST** | ~−6 yr on scaffolding + propagation |
| **bootstrap-onramp** — Idea → on-screen → monetizable (spinup, lastmile) | 3 | `0e79641a` · 2026-05-25 | — | **v0** (Vercel) · **Lovable** · **Replit Agent** · **Bolt.new** | — / 2023 · 2023 · 2024-09 · 2024-10 | **THEY-WERE-FIRST** | ~−1.5 yr |
| **guides-knowledge** — Author guides / knowledge domains and WIRE them into named consumers | 6 | `6ad63316` · 2026-05-31 | Claude Code **Agent Skills** / plugin skills as the delivery shape | **Cursor @Docs** indexing · **Devin Knowledge** · **Backstage TechDocs** | 2025-10-16 / 2024-late · 2024–25 · 2020 | **THEY-WERE-FIRST** | ~−1.5 yr on doc-into-agent-context |
| **enforced-trackers** — Validator-enforced tracker system (34 sections, 20 checks, hook-gated) | 2 | `e386d70a` · 2026-06-05 | Agent-teams shared task list; Claude Code TodoWrite | **Linear** · **Jira** · **Danger.js** (PR-time policy assertions) | 2026-02-05 / 2020-06 · 2002 · 2016 | **THEY-WERE-FIRST** | ~−6 yr |
| **epic-tracking** — Epic lifecycle — plan/start/fold/split/link/review/acceptance/close | 10 | `b4f26ab8` · 2026-06-09 | Agent-teams **shared task list** | **Linear** (exited private beta) · **Jira** · Shortcut | 2026-02-05 / 2020-06 · 2002 · 2014 | **THEY-WERE-FIRST** | ~−6 yr |
| **admin-panels-cockpit** — Founder admin-panel dev-harness + GUI cockpit panels | 10 | `fa36772f` · 2026-06-13 | — | **Retool** · **Appsmith** (internal admin-panel builders) | — / 2017 · 2019-07-01 | **THEY-WERE-FIRST** | ~−7 yr |

---

## 3. Family detail — analog, date, margin, and the honest caveat

Grouped by verdict, then by WarpOS first-landing.

### WARPOS-FIRST

**`sleep-dream`** — Sleep / dream memory consolidation · 2 skills · first landed `cd37d410` **2026-04-12** (via `/sleep:deep`)

- Closest vendor analog: Anthropic **Dreaming** (Managed Agents) — agent memory consolidation, announced at Code with Claude SF — **2026-05-06** ([src](https://www.infoq.com/news/2026/05/code-with-claude/))
- Closest industry analog: **Letta — sleep-time compute** (background agent reorganizes another agent's memory during idle) — **2025-04-21** ([src](https://www.letta.com/blog/sleep-time-compute/))
- Margin: +24 d vs Anthropic (+4 d on the public tag warpos@0.1.4, 2026-05-02) · −356 d vs Letta
- Vendor-scoped only. Reused verbatim from PRIOR-ART-EVIDENCE §2 / §6.1. Corroborated by executed-run artifacts scripts/sleep-20260422-*.js and one-off-sleep-2026-04-25.js — the cycle RAN before the Anthropic announcement.

**`enforcement-debt`** — Enforcement-debt ledger — every policy names its enforcer or logs the gap · 5 skills · first landed `cd37d410` **2026-04-12** (via `/maps:enforcements`)

- Closest vendor analog: `claude plugin eval` (evaluates plugins, not unenforced policy) — **2026** ([src](https://code.claude.com/docs/en/changelog))
- Closest industry analog: SonarQube tech-debt register · ADR logs · architecture fitness functions — none tracks POLICY WITHOUT AN ENFORCER — **2007 · 2017** ([src](https://www.sonarsource.com/))
- Margin: uncontested — no analog found in any product
- Reused from PRIOR-ART §3.1 / §6.17. Strongest non-dreaming case, and narrow: the artifact is a ledger of rules that exist WITHOUT a mechanism that detects violation, surfaced at /enforcement:list and folded into /scan:full. Tech-debt registers track code; ADR logs track decisions; neither tracks the enforcement gap itself.

**`paths-registry`** — Centralized path registry — source→generated, guard hook, rename/convert tooling · 6 skills · first landed `6779f6e6` **2026-05-01** (via `/paths:add`)

- Closest vendor analog: — — **—**
- Closest industry analog: none found in any product (nearest genre: tsconfig path aliases, Bazel labels — neither is a generated single-source registry with a write-time literal guard) — **—**
- Margin: uncontested — no analog found
- Reused verbatim from PRIOR-ART §6.16, including its own deflation: this is config hygiene, not a product category. Six skills (add/convert/coverage/doctor/explain/rename) wrap it.

### INCONCLUSIVE

**`cross-session-inbox`** — Cross-session broadcast inbox between sessions of the same assistant · 2 skills · first landed `cd37d410` **2026-04-12** (via `/session:read`)

- Closest vendor analog: Claude Code **Agent Teams** SendMessage (in-session, session-scoped teams) — **2026-02-05** ([src](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/))
- Closest industry analog: **LangChain Agent Inbox** (human-in-the-loop UX for ambient agents) · **A2A protocol** (cross-vendor agent discovery) — **2025-01-14 · 2025-04** ([src](https://www.langchain.com/blog/introducing-ambient-agents))
- Margin: —
- Different job in every direction. Agent Inbox is a HUMAN inbox for approving agent actions; A2A is inter-vendor RPC; Agent Teams messaging dies with the session. WarpOS /session:write → /session:read is a durable, file-backed board that the same assistant's LATER sessions read. Landed 2026-04-12 — after Agent Inbox, before Agent Teams messaging. No exact analog found; no priority claimed.

### N/A-COMPOSITE

**`warpos-distribution-integrity`** — WarpOS ship/install/capsule/migration integrity scans · 18 skills · first landed `38adbda2` **2026-05-04** (via `/scan:warpos-applied-migrations`)

- Closest vendor analog: — — **—**
- Closest industry analog: **cruft** / **Copier** template-drift detection · Terraform drift detection · Backstage catalog validation — **2020 · 2016** ([src](https://github.com/cruft/cruft))
- Margin: —
- These 18 skills assert properties of WarpOS's OWN layered distribution (framework source → generated views → installed capsule → downstream product): manifest honesty, migration presence, capsule resolvability, version quorum, tracked transients, layer diff. No external analog exists because no external product has this layer topology. The generic pattern they instantiate — detect drift between a template and its instantiations — is cruft/Copier (2020) and Terraform drift (2016).

### THEY-WERE-FIRST

**`warp-distribution`** — Framework distribution: setup/update/release/uninstall/doctor/flag/reconcile · 20 skills · first landed `c7db0a2b` **2026-03-19** (via `/warp:check`)

- Closest vendor analog: Claude Code **plugins & marketplaces** — **2025-10-31** ([src](https://www.scriptbyai.com/claude-code-timeline/))
- Closest industry analog: **Cookiecutter** · **Yeoman** · **Copier** / **cruft** (update an already-generated project from its template) — **2013 · 2012 · 2020** ([src](https://www.cookiecutter.io/article-post/compare-cookiecutter-to-yeoman))
- Margin: −168 d vs plugins; ~−6 yr vs scaffolders
- Reused from PRIOR-ART §1 #17. Sub-note: /warp:flag → /warp:reconcile (a DOWNSTREAM product files a structured gap against the framework, which the framework then verifies and fixes upstream) is a bidirectional template↔instance feedback channel; Copier/cruft push updates downstream but have no upstream gap channel. That pair is INCONCLUSIVE, not obviously taken.

**`memory-learning`** — Memory stores + scored learnings lifecycle · 7 skills · first landed `cd37d410` **2026-04-12** (via `/fav:list`)

- Closest vendor analog: Claude Code **Auto Memory / MEMORY.md** (v2.1.59); Claude **memory tool + context editing** (API) — **2026-02 / 2025-09-29** ([src](https://www.scriptbyai.com/claude-code-timeline/))
- Closest industry analog: **MemGPT** (tiered agent memory) · **Cursor Memories** 1.0 · **Windsurf Wave 1 memories** — **2023-10 · 2025-06-04 · 2025-01** ([src](https://research.contrary.com/company/letta))
- Margin: ~−2.5 yr
- Reused from PRIOR-ART §6.2/6.3. Sub-note: /memory:verify (2026-07-25) — verifying auto-memory entries against code/disk/git ground truth and deleting contradicted ones — had NO analog found; but it is a consequence of vendor auto-memory existing, so it cannot predate it.

**`beta-judgment`** — Independent second-opinion judge (β) + mining its precedent · 3 skills · first landed `cd37d410` **2026-04-12** (via `/beta:mine`)

- Closest vendor analog: Claude Code `/code-review`, `security-review` skills (review, not decision arbitration) — **2025-10-16** ([src](https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard))
- Closest industry analog: **LLM-as-a-judge** (MT-Bench et al.) · **Aider architect/editor** two-model split — **2023 · 2024** ([src](https://arxiv.org/abs/2306.05685))
- Margin: ~−2 yr
- Reused from PRIOR-ART §6.14. Sub-note: /beta:mine + /beta:integrate (mine the operator's own decision history, then write it back into the judge's model) is closer to preference learning than to LLM-as-judge; no dated product analog found — INCONCLUSIVE at skill level.

**`reasoning-frameworks`** — Classify-then-solve reasoning + graded fix quality · 6 skills · first landed `cd37d410` **2026-04-12** (via `/fix:deep`)

- Closest vendor analog: Claude **extended thinking** (configurable thinking budget) · Claude Code plan mode — **2025-02-24** ([src](https://www.anthropic.com/news/claude-3-7-sonnet))
- Closest industry analog: Cynefin (1999) · 5 Whys / TRIZ · Gemini thinking budgets (2025-04-17) · GPT-5 reasoning_effort (2025-08-07) — **1999 onward** ([src](https://hbr.org/2007/11/a-leaders-framework-for-decision-making))
- Margin: ~−15 mo (model layer); decades (the frameworks themselves)
- The frameworks are borrowed by design. What is unusual is pairing a router (problem class → framework) with a 0–4 fix-quality score logged per episode to paths.tracesFile — no dated analog found for the pairing, but every part is older.

**`session-state-handoff`** — Session checkpoint, resume, handoff, prescriptive DUMP · 8 skills · first landed `cd37d410` **2026-04-12** (via `/session:checkpoint`)

- Closest vendor analog: Claude Code `/resume`, **checkpoints/rewind** (v2.0) — **2025-09-29** ([src](https://www.scriptbyai.com/claude-code-timeline/))
- Closest industry analog: **Cline Memory Bank** · **Gemini CLI checkpointing** · Roo Code — **2025-early · 2025-06** ([src](https://docs.cline.bot/prompting/cline-memory-bank))
- Margin: ~−10 mo
- Reused from PRIOR-ART §6.15 / 7l. Sub-note: /session:dump (2026-05-18) writes a handoff carrying explicit ANTI-instructions and past session progression fenced as context-not-command — a guard against a fresh session re-executing the log. No analog found for the anti-instruction contract; the handoff-file genre itself is older.

**`modes-teams`** — Build modes + named agent faces / teams · 6 skills · first landed `cd37d410` **2026-04-12** (via `/mode:adhoc`)

- Closest vendor analog: Claude Code **Agent Teams** (with Opus 4.6) — **2026-02-05** ([src](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/))
- Closest industry analog: **MetaGPT** ("first AI software company": PM/architect/engineer/QA roles) · AutoGen · CrewAI · LangGraph — **2023-08 · 2023-09-25 · 2023-10 · 2024-01-08** ([src](https://arxiv.org/abs/2308.00352))
- Margin: ~−2.7 yr
- Reused from PRIOR-ART §6.6/6.7.

**`oneshot-build`** — Standalone autonomous skeleton build (preflight→run→retro) · 4 skills · first landed `cd37d410` **2026-04-12** (via `/oneshot:improve`)

- Closest vendor analog: Claude Code background / headless agents — **2025** ([src](https://www.scriptbyai.com/claude-code-timeline/))
- Closest industry analog: **Devin** · **Cursor Background Agent** (0.50→GA 1.0) · GitHub Copilot coding agent — **2024-03-12 · 2025-05-15 · 2025-05** ([src](https://www.cognition.ai/blog/introducing-devin))
- Margin: ~−2 yr
- Reused from PRIOR-ART §6.13. Sub-note: /oneshot:improve — the preflight suite editing ITS OWN check skills from gaps found during runs — is a self-modification loop; its nearest analog is the karpathy family, itself THEY-WERE-FIRST.

**`issue-register`** — Recurring system-issue register + cross-run pattern intelligence · 6 skills · first landed `cd37d410` **2026-04-12** (via `/scan:patterns`)

- Closest vendor analog: — — **—**
- Closest industry analog: **Sentry** issue grouping + automatic regression state · AI Issue Grouping GA — **2008 onward · 2025-02** ([src](https://www.apmdigest.com/sentry-adds-new-features-issue-grouping-issue-summary-and-anomaly-detection))
- Margin: ~−17 yr on the concept
- Sentry's regression state (a resolved issue reappearing in a later release is auto-reopened and marked a regression) is exactly /issues:resolve + /scan:regressions, years earlier. Sub-note: /scan:patterns (diagnose a recurring pattern, then PROPOSE the automation that would prevent it) is closer to the enforcement-debt family — INCONCLUSIVE at skill level.

**`hooks-mgmt`** — Hook authoring, disable/enable, test, friction measurement · 5 skills · first landed `cd37d410` **2026-04-12** (via `/hooks:add`)

- Closest vendor analog: Claude Code **hooks** (v1.0.38) — **2025-06-30** ([src](https://www.scriptbyai.com/claude-code-timeline/))
- Closest industry analog: git hooks (1990s) · Husky/lint-staged · **Codex hooks** (near-copy of the Claude hook vocabulary; docs carry no date) — **decades** ([src](https://learn.chatgpt.com/docs/hooks))
- Margin: −262 d
- WarpOS hooks ARE Claude Code hooks — vendor-first by construction, stated plainly in PRIOR-ART §0. Sub-note: /hooks:friction (measure what a hook costs the operator in interruptions, then act on it) had no analog found.

**`skills-meta`** — Skills about skills — create/edit/delete/cleanup, author-with-eval-pack, coverage self-inventory · 9 skills · first landed `cd37d410` **2026-04-12** (via `/maps:skills`)

- Closest vendor analog: **Agent Skills** (SKILL.md) · `/skill-doctor` · `claude plugin eval` — **2025-10-16 · 2026** ([src](https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard))
- Closest industry analog: **Cursor Rules** · **promptfoo** · **DSPy** · **LangSmith evals** · Anthropic **prompt improver** — **2024 · 2023 · 2023-late · 2023 · 2024-11** ([src](https://www.promptfoo.dev/))
- Margin: ~−1 to −3 yr
- /etc:author + /etc:eval (2026-05-30) author a prompt artifact TOGETHER WITH a sibling eval-pack and emit a validated decision_record — promptfoo (2023) and DSPy (2023) own the author-then-evaluate loop earlier. Sub-note: /scan:scan-coverage (an aggregator asserting every member skill is either delegated or explicitly excluded WITH A REASON) is N/A-COMPOSITE — it kills the dir↔aggregator drift class and has no external analog.

**`research`** — Deep research — multi-round, multi-provider · 2 skills · first landed `cd37d410` **2026-04-12** (via `/research:deep`)

- Closest vendor analog: OpenAI **deep research** — **2025-02-02** ([src](https://openai.com/index/introducing-deep-research/))
- Closest industry analog: **Gemini Deep Research** · **Perplexity Deep Research** — **2024-12-11 · 2025-02-14** ([src](https://blog.google/products/gemini/google-gemini-deep-research/))
- Margin: ~−16 mo
- Reused from PRIOR-ART §6.5; the operator's own framing ("we came after; our deep research pipeline is like Perplexity") sets this. Sub-note: running OpenAI DR + Gemini DR + Claude multi-round search IN PARALLEL and merging is a fan-out no single vendor ships — that composition is N/A-COMPOSITE, the capability is not.

**`qa-redteam-security`** — QA persona audits, red-team personas, privacy/secrets/ingest-firewall scans · 8 skills · first landed `cd37d410` **2026-04-12** (via `/qa:audit`)

- Closest vendor analog: Anthropic **security-review** skill · code-vulnerability scanner — **2025-10 · 2026-05-06** ([src](https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard))
- Closest industry analog: **garak** (NVIDIA) · **PyRIT** (Microsoft) · **promptfoo redteam** — **2023-06-13 · 2024-02-22 · 2023** ([src](https://github.com/NVIDIA/garak))
- Margin: ~−2.8 yr
- Reused from PRIOR-ART §6.10. Sub-note: /scan:security-binding-lane (assert the security reviewer's FAIL verdict is structurally un-overridable by the lead that dispatched it) is a governance property, not a scanner — no analog found.

**`commit-land`** — Commit / push / land (merge to default branch) · 4 skills · first landed `cd37d410` **2026-04-12** (via `/commit:both`)

- Closest vendor analog: Claude Code git integration; GitHub Copilot commit messages — **2025** ([src](https://code.claude.com/docs/en/changelog))
- Closest industry analog: **aider** auto-commits with AI-generated messages · **aicommits** — **2023-04 · 2023** ([src](https://github.com/aider-ai/aider))
- Margin: ~−1 yr
- aider has auto-committed every AI edit with a generated message since April 2023.

**`docs-maps-discovery-reporting`** — System discovery, relationship maps, reference integrity, ELI5 reports · 18 skills · first landed `cd37d410` **2026-04-12** (via `/maps:all`)

- Closest vendor analog: — — **—**
- Closest industry analog: **dependency-cruiser** · **ArchUnit** · **Structurizr/C4** · **SonarQube** · **Backstage** catalog — **2016 · 2017 · 2016 · 2007 · 2020** ([src](https://github.com/sverweij/dependency-cruiser))
- Margin: ~−9 yr
- Generating architecture/dependency/coverage maps from a live source of truth and failing on broken references is dependency-cruiser + ArchUnit + Backstage territory, all years earlier. Sub-notes with no analog found: /discover:orphaned (sweep NEXT.md, runtime notes, branches, untracked files, TODOs for ABANDONED work) and /report (ELI5, tl;dr-first, watch-outs-always reporting for a non-technical operator).

**`ui-design-review`** — Design-system compliance review of rendered UI · 2 skills · first landed `655775f2` **2026-04-15** (via `/ui:review`)

- Closest vendor analog: Claude Code + Playwright MCP visual review patterns — **2025** ([src](https://code.claude.com/docs/en/changelog))
- Closest industry analog: **Applitools Eyes** · **Percy** · **Chromatic** (purpose-built for design-system consumer impact); Percy AI Visual Review Agent — **2013 · 2016 · 2017 · 2025-late** ([src](https://percy.io/blog/visual-regression-testing-tools))
- Margin: ~−9 yr
- WarpOS's is LLM reasoning against the project's design-system DOCS rather than pixel-diffing a baseline — a real methodological difference — but Chromatic has been the design-system compliance tool since 2017 and Percy shipped an AI review agent in late 2025, before WarpOS's 2026-04-15.

**`sprint-lifecycle`** — Registry-driven sprint lifecycle (plan→design→build→gauntlet→release→retro) · 13 skills · first landed `bf438de7` **2026-04-16** (via `/scan:requirements`)

- Closest vendor analog: **Claude Code Dynamic Workflows** — agent()/parallel()/pipeline() deterministic JS orchestration — **2026-05-28** ([src](https://code.claude.com/docs/en/changelog))
- Closest industry analog: **Google ADK workflow agents** (Sequential/Parallel/Loop) · **CrewAI Flows** · LangGraph — **2025-04 · 2024-mid · 2024** ([src](https://google.github.io/adk-docs/agents/workflow-agents/))
- Margin: ~−14 mo
- Reused from PRIOR-ART §7.2 rows 7a–7c. Sub-note: the pre-committed release rule minted by an in-team judge BEFORE results exist is preregistration (arXiv:2606.11217 ports it to agents explicitly), and the mutant/falsifier gauntlet is mutation testing (concept 1971, mainstream via pitest) — both already named in PRIOR-ART §7.4 as taken.

**`system-health-scans`** — Aggregate system health — run every scan, linters, environment readiness · 4 skills · first landed `d39661a8` **2026-04-16** (via `/check:all`)

- Closest vendor analog: Claude Code `/doctor` — **2025** ([src](https://code.claude.com/docs/en/changelog))
- Closest industry analog: **SonarQube** · **ESLint** · architecture **fitness functions** (Building Evolutionary Architectures) · **Danger.js** — **2007 · 2013 · 2017 · 2016** ([src](https://www.thoughtworks.com/insights/books/building-evolutionary-architectures))
- Margin: ~−9 to −19 yr
- /scan:full is a fitness-function suite by another name. The concept — automated, continuously-run assertions that protect architectural characteristics — is Ford/Parsons/Kua, 2017.

**`karpathy-autoresearch`** — Closed-loop optimization of the agent's own artifacts · 3 skills · first landed `38d771bf` **2026-04-18** (via `/karpathy:integrate`)

- Closest vendor analog: Anthropic **Outcomes** / capability curves for Managed Agents — **2026-05-06** ([src](https://www.infoq.com/news/2026/05/code-with-claude/))
- Closest industry analog: **Sakana AI Scientist** · **DeepMind AlphaEvolve** · **ShinkaEvolve** · DSPy optimizers — **2024-08 · 2025-05 · 2025-09 · 2023-late** ([src](https://arxiv.org/abs/2408.06292))
- Margin: ~−20 mo (but +18 d vs Anthropic only)
- Reused from PRIOR-ART §3.1 / §6.11. Vendor-scoped it is WarpOS-first by 18 days; industry-scoped Sakana beats it by ~20 months.

**`growth-marketing`** — Growth + marketing content: angles, message brief, advertorial, landing page, ad images/video, LinkedIn/Contra posts · 10 skills · first landed `6779f6e6` **2026-05-01** (via `/content:contra`)

- Closest vendor analog: — — **—**
- Closest industry analog: **Copy.ai** · **Jasper** (as Conversion.ai) · **AdCreative.ai** (ad images, later product video) — **2020-07 · 2021-01 · 2021-11** ([src](https://research.contrary.com/company/jasper))
- Margin: ~−4.5 yr
- Jasper's ORIGINAL product was literally Facebook/Google ad copy from templates (Jan 2021). AdCreative.ai shipped conversion-scored ad images from a URL scan in Nov 2021 and product-video generation in Dec 2024. The WarpOS versions (2026-05-01 → 2026-05-30) land 4–5 years later. Nothing here is close.

**`agent-roster`** — Agent-spec roster, smoke-dispatch, role-parity enforcement · 5 skills · first landed `38adbda2` **2026-05-04** (via `/agents:list`)

- Closest vendor analog: Claude Code **Subagents** (`/agents`) — **2025-07-24** ([src](https://www.scriptbyai.com/claude-code-timeline/))
- Closest industry analog: CrewAI agent definitions · AutoGen agent configs — **2023-10** ([src](https://github.com/crewAIInc/crewAI))
- Margin: ~−9 mo
- Sub-note: /scan:role-parity and /scan:greek-office-parity are fail-closed BIJECTION enforcers (a role exists in the org map IFF it exists in the dispatch catalog IFF team-guard knows it; a Greek call-sign IFF President's-office membership). No analog found — those two are N/A-COMPOSITE over vendor subagent primitives.

**`events-telemetry`** — Append-only event ledger + query/tail · 2 skills · first landed `38adbda2` **2026-05-04** (via `/events:query`)

- Closest vendor analog: OpenAI Agents SDK built-in tracing — **2025-03-11** ([src](https://openai.com/index/new-tools-for-building-agents/))
- Closest industry analog: **LangSmith** · **Langfuse** agent tracing — **2023 · 2024-07** ([src](https://www.langchain.com/langsmith))
- Margin: ~−3 yr
- Reused from PRIOR-ART §7.2 row 7m.

**`permissions-turbo`** — Session-scoped permission pre-authorization + spend ceiling · 4 skills · first landed `4c3bc3f9` **2026-05-13** (via `/turbo`)

- Closest vendor analog: Claude Code **auto mode** (permission classifier) — **2026-03-24** ([src](https://www.anthropic.com/engineering/claude-code-auto-mode))
- Closest industry analog: **OpenAI Agents SDK guardrails** · usage limits — **2025-03-11** ([src](https://openai.com/index/new-tools-for-building-agents/))
- Margin: −50 d vs auto mode; ~−14 mo vs guardrails
- Reused from PRIOR-ART §1 #12 / §7.2 row 7o.

**`model-routing-dispatch`** — Role→provider→model→effort routing + dispatch console · 8 skills · first landed `7be21c64` **2026-05-18** (via `/scan:node-procs`)

- Closest vendor analog: Claude Code **fallback model chains** (within-provider) — **~2026-06** ([src](https://www.sitepoint.com/claude-code-june-2026-10-new-features-devs-need-to-know/))
- Closest industry analog: **OpenRouter** · **LiteLLM proxy** · Portkey — **2023** ([src](https://openrouter.ai/))
- Margin: ~−3 yr
- Reused from PRIOR-ART §6.9 / §7.2 row 7p. The one uncontested piece — cross-VENDOR CLI dispatch (scripts/dispatch-agent.js, 2026-04-16) — is a script, not a skill, so it sits outside this sweep's inventory.

**`roadmap`** — Roadmap create/prioritize/predict-next with a product-persona lens · 8 skills · first landed `91d38d39` **2026-05-19** (via `/roadmap:add`)

- Closest vendor analog: — — **—**
- Closest industry analog: **Productboard** · **Jira Product Discovery** (GA) · Aha! — **2014 · 2023-02-09** ([src](https://techcrunch.com/2023/02/09/atlassians-jira-product-discovery-is-now-generally-available))
- Margin: ~−3 yr
- /roadmap:ideas (12 predictions across 4 evidence lenses) and /roadmap:next (the single highest-leverage entry) are AI opportunity suggestion — Productboard's Spark AI and Jira Product Discovery both do this earlier, though not with a role-registry-selected persona.

**`portfolio-multiproduct`** — Operating N product repos from one framework (register/list/open/run/sync/status/spinup) · 8 skills · first landed `0b043681` **2026-05-22** (via `/portfolio:list`)

- Closest vendor analog: — — **—**
- Closest industry analog: **Backstage** software templates + golden paths · **Nx** generators · **cruft**/**Copier** propagation — **2020-03 · 2020 · 2020** ([src](https://backstage.io/docs/features/software-templates/))
- Margin: ~−6 yr on scaffolding + propagation
- Backstage has owned "scaffold a new service from a golden-path template and keep a registry of them" since 2020. Sub-note: /portfolio:run (execute a skill against ANOTHER product's repo in a fresh Claude subprocess, never retargeting the current session) is a session-isolation contract with no analog found — INCONCLUSIVE at skill level.

**`bootstrap-onramp`** — Idea → on-screen → monetizable (spinup, lastmile) · 3 skills · first landed `0e79641a` **2026-05-25** (via `/bootstrap:lastmile`)

- Closest vendor analog: — — **—**
- Closest industry analog: **v0** (Vercel) · **Lovable** · **Replit Agent** · **Bolt.new** — **2023 · 2023 · 2024-09 · 2024-10** ([src](https://altar.io/lovable-vs-bolt-vs-v0-vs-replit-vs-base44/))
- Margin: ~−1.5 yr
- prompt→running app is exactly Lovable/Bolt/v0/Replit, all earlier. Sub-note: /bootstrap:lastmile (prototype → MONETIZABLE: readiness audit, launch plan, store/SSO day-zero prerequisites, human-gated production actions) is the half those tools skip — no dated analog found for the last-mile-to-revenue procedure specifically.

**`guides-knowledge`** — Author guides / knowledge domains and WIRE them into named consumers · 6 skills · first landed `6ad63316` **2026-05-31** (via `/guides:coverage`)

- Closest vendor analog: Claude Code **Agent Skills** / plugin skills as the delivery shape — **2025-10-16** ([src](https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard))
- Closest industry analog: **Cursor @Docs** indexing · **Devin Knowledge** · **Backstage TechDocs** — **2024-late · 2024–25 · 2020** ([src](https://cursor.com/docs/agent/tools/search))
- Margin: ~−1.5 yr on doc-into-agent-context
- IMPORTANT SUB-CASE: every analog INDEXES docs for retrieval. /guides:integrate and /knowledge:integrate do something else — place a doc at a DECLARED ANCHOR inside specific consumer agent specs in a declared SHAPE, idempotently, with read-before-write conflict detection, recording every placement in a JSONL ledger (guide-integration.jsonl / knowledge-integration.jsonl). No analog found for deterministic, ledgered doc→consumer-spec wiring. Those two skills are WARPOS-FIRST (uncontested, niche); the family is not.

**`enforced-trackers`** — Validator-enforced tracker system (34 sections, 20 checks, hook-gated) · 2 skills · first landed `e386d70a` **2026-06-05** (via `/trackers:validate`)

- Closest vendor analog: Agent-teams shared task list; Claude Code TodoWrite — **2026-02-05** ([src](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/))
- Closest industry analog: **Linear** · **Jira** · **Danger.js** (PR-time policy assertions) — **2020-06 · 2002 · 2016** ([src](https://danger.systems/js/))
- Margin: ~−6 yr
- The tracker CONTENT is Linear/Jira territory. The distinct part — a MARKDOWN tracker fail-closed validated (no blank section, no broken link, every §8 term defined) by a pre-commit hook — is Danger.js's genre applied to a doc, and Danger.js is 2016.

**`epic-tracking`** — Epic lifecycle — plan/start/fold/split/link/review/acceptance/close · 10 skills · first landed `b4f26ab8` **2026-06-09** (via `/epic:acceptance`)

- Closest vendor analog: Agent-teams **shared task list** — **2026-02-05** ([src](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/))
- Closest industry analog: **Linear** (exited private beta) · **Jira** · Shortcut — **2020-06 · 2002 · 2014** ([src](https://linear.app/))
- Margin: ~−6 yr
- Reused from PRIOR-ART §6.4; the operator's own framing ("our ticket system is like Linear") sets this verdict. Sub-note: /epic:fold — classify an incoming item against a 14-class taxonomy and REFUSE to silently overwrite a stable commitment (flag + provenance change-log instead) — is a conflict-detection contract with no product analog found.

**`admin-panels-cockpit`** — Founder admin-panel dev-harness + GUI cockpit panels · 10 skills · first landed `fa36772f` **2026-06-13** (via `/cockpit:readiness`)

- Closest vendor analog: — — **—**
- Closest industry analog: **Retool** · **Appsmith** (internal admin-panel builders) — **2017 · 2019-07-01** ([src](https://research.contrary.com/company/retool))
- Margin: ~−7 yr
- Caveat on the analogy: Retool/Appsmith BUILD admin panels; /admin:preview BOOTS the product's own already-built /admin route in a throwaway Next instance and seeds warm-start data into it. Different job, same territory. The /panel:* GUI boards (roadmap, models, readiness) are Retool's genre outright.

---

## 4. Skills with no external analog found

These are the skills whose procedure did not match anything found in a real search. Read this table
with §7 limit 4 in hand: a single-pass search is weak evidence of absence. Nineteen skills out of 237.

| Skill | First landed | What was searched | Outcome |
|---|---|---|---|
| `/beta:integrate` | `e0f25200` · 2026-04-16 | judgment-model update from mined precedent, constitutional feedback loops | INCONCLUSIVE at skill level — writes mined precedent back into the judgment model; no dated product analog found. |
| `/beta:mine` | `cd37d410` · 2026-04-12 | LLM-as-a-judge, preference learning from user decisions, agent decision mining | INCONCLUSIVE at skill level — mining the operator's own decision history to update a judge; closer to preference learning than LLM-as-judge, no dated product analog found. |
| `/discover:orphaned` | `6779f6e6` · 2026-05-01 | abandoned work detection, stale branch/TODO sweep, forgotten task discovery | No analog found — sweeps NEXT.md, runtime notes, branches, untracked files, TODOs, plans for ABANDONED work. |
| `/guides:integrate` | `6ad63316` · 2026-05-31 | docs into agent context (Cursor @Docs, Devin Knowledge, Windsurf), Backstage TechDocs, prompt-fragment injection, idempotent doc placement ledgers | WARPOS-FIRST (uncontested, niche) — deterministic, idempotent, ledgered doc→consumer-agent-spec placement at a declared anchor. Every vendor analog INDEXES docs instead. |
| `/hooks:friction` | `cd37d410` · 2026-04-12 | developer-friction measurement, hook interruption cost, pre-commit friction telemetry | No analog found — measures what a hook costs the operator in interruptions and acts on it. |
| `/knowledge:integrate` | `af1fe400` · 2026-06-05 | knowledge-domain wiring into agent specs, RAG-vs-placement, consumer-spec injection ledgers | WARPOS-FIRST (uncontested, niche) — same placement-ledger contract for LIBRARY/STORE knowledge domains. |
| `/memory:verify` | `d6e158d2` · 2026-07-25 | auto-memory verification, memory ground-truth checking, stale agent memory correction | No analog found for verifying an agent's own auto-memory against code/disk/git ground truth — but it presupposes vendor auto-memory (2026-02), so no priority. |
| `/portfolio:run` | `0b043681` · 2026-05-22 | cross-repo agent invocation, multi-repo agent session isolation, Backstage/Nx multi-project ops | INCONCLUSIVE — run a skill against another product repo in a fresh subprocess, never retargeting the current session. No analog found. |
| `/report` | `dda80fec` · 2026-05-31 | ELI5 engineering reports, non-technical stakeholder status generation | No analog found — ELI5, tl;dr-first, watch-outs-always reporting aimed at a non-technical operator. |
| `/scan:greek-office-parity` | `a2ee350c` · 2026-07-16 | naming-convention bijection enforcers, identity-scheme validators | N/A-COMPOSITE — naming bijection enforcer (Greek call-sign IFF President's-office membership). No external analog. |
| `/scan:patterns` | `cd37d410` · 2026-04-12 | cross-run failure pattern mining, automation proposal from incident history | INCONCLUSIVE at skill level — diagnoses a recurring pattern then PROPOSES the preventing automation; behaves like the enforcement-debt family. |
| `/scan:role-parity` | `c3219d6d` · 2026-05-30 | role registry parity, agent catalog drift detection, org-map bijection enforcement | N/A-COMPOSITE — fail-closed role bijection across org map, dispatch catalog, and team-guard. No external analog. |
| `/scan:scan-coverage` | `ada42901` · 2026-05-31 | aggregator/member drift, check-suite self-inventory, lint-rule coverage assertions | N/A-COMPOSITE — aggregator self-inventory; every member skill delegated or excluded WITH A REASON. No external analog. |
| `/scan:security-binding-lane` | `7f14911b` · 2026-07-20 | binding reviewer verdicts, un-overridable security gates, approval-authority governance | No analog found — asserts a reviewer FAIL is structurally un-overridable by the dispatching lead (governance, not scanning). |
| `/session:dump` | `c305b555` · 2026-05-18 | AI session handoff format, Cline Memory Bank, anti-instruction / context-not-command handoff contracts | Distinct: carries explicit ANTI-instructions and fences past session progression as context-not-command. No analog found for the anti-instruction contract. |
| `/session:read` | `cd37d410` · 2026-04-12 | cross-session agent messaging, agent inbox, A2A, Agent Teams messaging, durable agent message board | Core of the INCONCLUSIVE cross-session-inbox case. |
| `/session:write` | `cd37d410` · 2026-04-12 | cross-session agent messaging, agent inbox, A2A, Agent Teams messaging, durable agent message board | Core of the INCONCLUSIVE cross-session-inbox case. |
| `/warp:flag` | `b3a5ab06` · 2026-05-11 | template drift feedback, cruft/Copier upstream channels, downstream-to-upstream gap reporting | INCONCLUSIVE — upstream gap channel from a downstream product back to the framework; cruft/Copier propagate downstream only. |
| `/warp:reconcile` | `03cf48cd` · 2026-05-26 | template drift feedback, cruft/Copier upstream channels, downstream-to-upstream gap reporting | INCONCLUSIVE — consumer side of the same upstream gap channel. |

---

## 5. Full per-skill table

237 rows, alphabetical. Verdict is inherited from the family; the last column fires only where the
skill is materially different from its family.

| Skill | Purpose | First landed | Family | Inherited verdict | Skill-level note |
|---|---|---|---|---|---|
| `/admin:guides` | Open the in-app founder admin panel's guides sub-route in a browser, against a PRODUCT's running Next app (never WarpOS itself). A | `f273f672` · 2026-06-14 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/admin:preview` | Open/preview a PRODUCT's in-app founder admin panel in the browser. Scaffolds (or reuses) a fixed throwaway Next instance, boots ` | `f273f672` · 2026-06-14 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/admin:readiness` | Open the in-app founder admin panel's launch-readiness sub-route in a browser, against a PRODUCT's running Next app (never WarpOS  | `f273f672` · 2026-06-14 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/admin:seed` | Seed warm-start data (founder-allowlist session, sample events, FOUNDERS_CHECKLIST.md) into the live admin-preview instance so the | `f273f672` · 2026-06-14 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/agents:list` | Enumerate every agent spec by mode and role. | `38adbda2` · 2026-05-04 | agent-roster | THEY-WERE-FIRST |  |
| `/agents:test` | Smoke-dispatch one agent role (or all non-claude roles) with a tiny ping prompt. | `38adbda2` · 2026-05-04 | agent-roster | THEY-WERE-FIRST |  |
| `/beta:integrate` | Apply validated recommendations from beta mining into the judgment model | `e0f25200` · 2026-04-16 | beta-judgment | THEY-WERE-FIRST | INCONCLUSIVE at skill level — writes mined precedent back into the judgment model; no dated product analog found. |
| `/beta:mine` | Mine patterns from user behavior — prompts, decisions, skill chains, evolution cycles | `cd37d410` · 2026-04-12 | beta-judgment | THEY-WERE-FIRST | INCONCLUSIVE at skill level — mining the operator's own decision history to update a judge; closer to preference learning than LLM-as-judge, no dated product analog found. |
| `/bootstrap:lastmile` | Prototype → monetizable product. Drives the 'last mile': readiness audit → launch plan → roadmap/sprint injection → guided executi | `0e79641a` · 2026-05-25 | bootstrap-onramp | THEY-WERE-FIRST | No dated analog found for the prototype→monetizable last-mile procedure; the prompt→app half is Lovable/Bolt/v0/Replit territory. |
| `/bootstrap:ponder` | Exploratory pondering of a project — surface tensions, patterns, JTBD drift, and one forcing question | `91d38d39` · 2026-05-19 | reasoning-frameworks | THEY-WERE-FIRST |  |
| `/bootstrap:spinup` | From 'just WarpOS' to something on screen — one in-project command: setup (deterministic create+scaffold+intake) → canon (degrade- | `fbdb523d` · 2026-05-25 | bootstrap-onramp | THEY-WERE-FIRST |  |
| `/check:all` **[deprecated alias → /scan:full]** | [deprecated alias → /scan:full] Run every scan in parallel — a full system scan. Superseded by /scan:full in the check:→scan: name | `d39661a8` · 2026-04-16 | system-health-scans | THEY-WERE-FIRST |  |
| `/check:framework-purity` **[deprecated alias → /scan:framework-purity]** | [deprecated alias → /scan:framework-purity] Refuse product-content leaks in canonical. Superseded by /scan:framework-purity in the | `74f26fa2` · 2026-05-22 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/check:framework-views-fresh` **[deprecated alias → /scan:framework-views-fresh]** | [deprecated alias → /scan:framework-views-fresh] Verify .claude views are byte-identical regenerations of _warpos sources. Superse | `74f26fa2` · 2026-05-22 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/check:install` **[deprecated alias → /scan:install]** | [deprecated alias → /scan:install] Verify a fresh WarpOS install. Superseded by /scan:install in the check:→scan: namespace rename | `38adbda2` · 2026-05-04 | warp-distribution | THEY-WERE-FIRST |  |
| `/cockpit:readiness` | The launch-readiness cockpit — show how close every registered product is to launch (composite %, blocked items, owner-action work | `fa36772f` · 2026-06-13 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/commit:both` **[deprecated alias → /commit:land]** | [deprecated alias → /commit:land] Commit locally then push — superseded by /commit:land, which also merges the branch into the def | `cd37d410` · 2026-04-12 | commit-land | THEY-WERE-FIRST |  |
| `/commit:land` | Land the working branch — commit locally, push the branch, then merge it into the repo's default branch and push that too. The ful | `03cf48cd` · 2026-05-26 | commit-land | THEY-WERE-FIRST |  |
| `/commit:local` | Stage and commit changes locally — smart message, no push | `cd37d410` · 2026-04-12 | commit-land | THEY-WERE-FIRST |  |
| `/commit:remote` | Push current branch to remote — with safety checks | `cd37d410` · 2026-04-12 | commit-land | THEY-WERE-FIRST |  |
| `/content:contra` | Create a Contra portfolio post with carousel images — write copy, design slides, render PNGs | `6779f6e6` · 2026-05-01 | growth-marketing | THEY-WERE-FIRST |  |
| `/content:linkedin` | Create a LinkedIn post with carousel images — write copy, design slides, render PNGs | `6779f6e6` · 2026-05-01 | growth-marketing | THEY-WERE-FIRST |  |
| `/discover:orphaned` | Discover orphaned work — find every deferred, forgotten, or abandoned task across NEXT.md, runtime notes, branches, untracked file | `6779f6e6` · 2026-05-01 | docs-maps-discovery-reporting | THEY-WERE-FIRST | No analog found — sweeps NEXT.md, runtime notes, branches, untracked files, TODOs, plans for ABANDONED work. |
| `/discover:systems` | Multi-angle system discovery — find every system in a project by intersecting 6 discovery lenses, surface what's declared vs what  | `7544061f` · 2026-04-17 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/docs:catalog` | Enumerate reference docs under _docs/ and paths.reference, with title/size/mtime. | `38adbda2` · 2026-05-04 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/enforcement:list` | List open enforcement-debt entries — policies/conventions without an automated enforcer | `91d38d39` · 2026-05-19 | enforcement-debt | WARPOS-FIRST |  |
| `/enforcement:log` | Record a policy/convention that has no automated enforcer — appends to paths.enforcementDebt | `91d38d39` · 2026-05-19 | enforcement-debt | WARPOS-FIRST |  |
| `/enforcement:sweep` | Find UNFILED debt — deferral comments, prompt suppressions, skipped tests, unenforced-policy claims, review residuals — and reconc | `4a3a3c59` · 2026-07-28 | enforcement-debt | WARPOS-FIRST |  |
| `/epic:acceptance` | Manage an epic's acceptance criteria — ensure all 20 AC categories are present, each names its proof, and report AC coverage. Wrap | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST |  |
| `/epic:close` | Close a completed epic — verify every DoD item is satisfied + evidenced, fill the Completion record, set state to Completed at 100 | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST |  |
| `/epic:fold` | Fold new information, constraints, bugs, or scope into an EXISTING epic intelligently — classify the item against the 14-class tax | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST | No product analog found for the 14-class taxonomy + refuse-to-silently-overwrite-a-stable-commitment contract. |
| `/epic:link` | Establish and verify an epic's linkages — its companion plan artifact, ROADMAP § Epics entry, TRACKER header, child sprints, and d | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST |  |
| `/epic:plan` | Turn a messy plain-language epic request into a durable, validate-shape epic tracker file plus a companion plan artifact (AC, spri | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST |  |
| `/epic:repair` | Detect and repair a drifted or malformed epic file — missing §-sections, blank required sections, broken links, percent/state inco | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST |  |
| `/epic:review` | Run an independent, cross-provider review of an epic plan — feasibility, overclaims, missing enforcers, blast-radius gaps, sequenc | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST |  |
| `/epic:split` | Split an over-large epic into two or more coherent epics — partition scope/sprints/DoD/AC, preserve provenance and dependencies, a | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST |  |
| `/epic:start` | Transition a planned epic into active execution — mint its first wave of sprints, set state to Active, and stand up the required m | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST |  |
| `/epic:status` | Report an epic's true, evidence-based status — percent completion, sprint roll-up, DoD progress, blockers, and tracker/roadmap rec | `b4f26ab8` · 2026-06-09 | epic-tracking | THEY-WERE-FIRST |  |
| `/etc:author` | Author or refine a skill/prompt in standard format, producing a sibling eval-pack for evaluation | `a5f7a824` · 2026-05-30 | skills-meta | THEY-WERE-FIRST | Authors a prompt artifact together with a sibling eval-pack; promptfoo (2023) / DSPy (2023) own the author-then-evaluate loop earlier. |
| `/etc:eval` | Evaluate a skill or prompt artifact against its eval-pack, emitting a validated decision_record | `a5f7a824` · 2026-05-30 | skills-meta | THEY-WERE-FIRST | Emits a validated decision_record against the eval-pack; promptfoo/DSPy earlier. |
| `/events:query` | Query the events log by type, time range, or regex match. | `38adbda2` · 2026-05-04 | events-telemetry | THEY-WERE-FIRST |  |
| `/events:tail` | Tail the events log — last N events with timestamp, type, and message. | `38adbda2` · 2026-05-04 | events-telemetry | THEY-WERE-FIRST |  |
| `/fav:list` | Browse all saved favorite moments, grouped by category | `cd37d410` · 2026-04-12 | memory-learning | THEY-WERE-FIRST |  |
| `/fav:search` | Search saved favorite moments by keyword across category, title, and notes — find one specific moment you remember saving but cann | `cd37d410` · 2026-04-12 | memory-learning | THEY-WERE-FIRST |  |
| `/fix:deep` | Deep fix — Full diagnostic with automatic framework selection, 5 solutions, root cause analysis, and prevention | `cd37d410` · 2026-04-12 | reasoning-frameworks | THEY-WERE-FIRST |  |
| `/fix:fast` | Quick fix — Direct Investigation, no formal framework. Read error, find cause, fix it, verify. | `cd37d410` · 2026-04-12 | reasoning-frameworks | THEY-WERE-FIRST |  |
| `/growth:ad-images` | Turn an angle into native-ad image prompts (scene-first, no text/logo/product, --ar) and render them via Higgsfield (headless API; | `70e9d273` · 2026-05-30 | growth-marketing | THEY-WERE-FIRST |  |
| `/growth:ad-video` | Turn an angle into a video ad (swipe→script→storyboard→image-to-video) and generate it via Higgsfield (headless API; gated by higg | `70e9d273` · 2026-05-30 | growth-marketing | THEY-WERE-FIRST |  |
| `/growth:advertorial` | Write a long-form advertorial (pre-sell editorial) from a message brief — research → foundational docs → swipe → write → Chief coh | `70e9d273` · 2026-05-30 | growth-marketing | THEY-WERE-FIRST |  |
| `/growth:angles` | Mine untapped marketing angles from real customer voice (Amazon/Reddit/forums) — ≥3 evidence-backed alternates. Reuses research:de | `70e9d273` · 2026-05-30 | growth-marketing | THEY-WERE-FIRST |  |
| `/growth:iterate` | Iterate a winning creative/message against a conversion/engagement scalar — thin wrapper over karpathy:run + parallel variation fa | `70e9d273` · 2026-05-30 | growth-marketing | THEY-WERE-FIRST |  |
| `/growth:landing-page` | Build a converting landing page from a conversion brief — conversion-hierarchy, scaffold component library, mobile-first. Reuses t | `70e9d273` · 2026-05-30 | growth-marketing | THEY-WERE-FIRST |  |
| `/growth:message-brief` | Distill the single winning message (the spine artifact) from an audience dossier + angles — contrast + depth, market promise insid | `70e9d273` · 2026-05-30 | growth-marketing | THEY-WERE-FIRST |  |
| `/growth:product-finder` | Find validated high-margin products for paid traffic — EQ-scored (Product×Ads×Funnel×LTV), SCALE/TEST/SKIP, with margin math. Reus | `70e9d273` · 2026-05-30 | growth-marketing | THEY-WERE-FIRST |  |
| `/guides:coverage` | Fail-closed enforcer for the _guides/ library — asserts every guide is anchored, the registry is fresh, every anchor is wired live | `6ad63316` · 2026-05-31 | guides-knowledge | THEY-WERE-FIRST |  |
| `/guides:integrate` | Wire each _guides/ guide into the bootstrap pipeline (spinup/lastmile) at its declared anchor in its declared shape, and record ev | `6ad63316` · 2026-05-31 | guides-knowledge | THEY-WERE-FIRST | WARPOS-FIRST (uncontested, niche) — deterministic, idempotent, ledgered doc→consumer-agent-spec placement at a declared anchor. Every vendor analog INDEXES docs instead. |
| `/guides:organize` | Audit and restructure the _guides/ launch-guide library — backfill the guide-anchor contract onto every guide, (re)generate _guide | `6ad63316` · 2026-05-31 | guides-knowledge | THEY-WERE-FIRST |  |
| `/guides:write` | Author a launch guide into _guides/ — grounded in the Mark Builds Brands methodology + the existing guides, in the right shape (wa | `67b32c57` · 2026-05-31 | guides-knowledge | THEY-WERE-FIRST |  |
| `/hooks:add` | Design and create a new hook from a description | `cd37d410` · 2026-04-12 | hooks-mgmt | THEY-WERE-FIRST |  |
| `/hooks:disable` | Temporarily disable a hook by moving it from settings.json into a `_disabled_hooks` section, with a one-step path to re-enable lat | `cd37d410` · 2026-04-12 | hooks-mgmt | THEY-WERE-FIRST |  |
| `/hooks:friction` | Analyze friction points — find patterns that suggest missing hooks | `cd37d410` · 2026-04-12 | hooks-mgmt | THEY-WERE-FIRST | No analog found — measures what a hook costs the operator in interruptions and acts on it. |
| `/hooks:test` | Test all hooks with synthetic payloads and measure execution time | `cd37d410` · 2026-04-12 | hooks-mgmt | THEY-WERE-FIRST |  |
| `/issues:list` | List recurring system issues — bugs/regressions in the agent framework, hooks, skills, .claude/, scripts/ | `6779f6e6` · 2026-05-01 | issue-register | THEY-WERE-FIRST |  |
| `/issues:log` | Record a new instance of a recurring system issue — appends to recurring-issues.jsonl, dedupes by title overlap | `6779f6e6` · 2026-05-01 | issue-register | THEY-WERE-FIRST |  |
| `/issues:resolve` | Mark a recurring system issue resolved with a permanent fix summary | `6779f6e6` · 2026-05-01 | issue-register | THEY-WERE-FIRST |  |
| `/karpathy:integrate` | Review a completed /karpathy:run and merge its winning artifact(s) into main — only command that touches the live codebase from a  | `38d771bf` · 2026-04-18 | karpathy-autoresearch | THEY-WERE-FIRST |  |
| `/karpathy:run` | Karpathy autoresearch loop — plan a closed-loop experiment, review, then run autonomously in an isolated worktree. Optimize any ed | `38d771bf` · 2026-04-18 | karpathy-autoresearch | THEY-WERE-FIRST |  |
| `/karpathy:status` | Read-only status dashboard for an active or completed /karpathy:run. Shows score curve, flag counts, cost burn, and stop-condition | `38d771bf` · 2026-04-18 | karpathy-autoresearch | THEY-WERE-FIRST |  |
| `/knowledge:coverage` | Fail-closed enforcer for the _knowledge/ layer (the company "brain", ADR-0007) — asserts the domain registry is fresh, every LIBRA | `af1fe400` · 2026-06-05 | guides-knowledge | THEY-WERE-FIRST |  |
| `/knowledge:integrate` | Wire each _knowledge/ domain into its consumers in its declared shape — LIBRARY domains via a knowledge-marker block in every cons | `af1fe400` · 2026-06-05 | guides-knowledge | THEY-WERE-FIRST | WARPOS-FIRST (uncontested, niche) — same placement-ledger contract for LIBRARY/STORE knowledge domains. |
| `/learn:deep` | Deep learning — extracts from conversation + event log + retro/report files (oneshot retros, sprint retros, _reports) in parallel, | `6779f6e6` · 2026-05-01 | memory-learning | THEY-WERE-FIRST |  |
| `/learn:ingest` | Ingest external knowledge from files, links, or YouTube videos and apply learnings to the system | `cd37d410` · 2026-04-12 | memory-learning | THEY-WERE-FIRST |  |
| `/learn:integrate` | Learning integrator — promote validated high-score learnings into actual system enforcement (hooks, rules, skills, agent specs, re | `6779f6e6` · 2026-05-01 | memory-learning | THEY-WERE-FIRST |  |
| `/linters:run` | Run every project linter (path-lint, lint-*, npm lint:*) and aggregate pass/fail. | `38adbda2` · 2026-05-04 | system-health-scans | THEY-WERE-FIRST |  |
| `/manifest:migrate` | Migrate the manifest to a target WarpOS version. Dry-run by default; --apply to write. | `38adbda2` · 2026-05-04 | warp-distribution | THEY-WERE-FIRST |  |
| `/manifest:show` | Print .claude/manifest.json (pretty by default, --json for compact). | `38adbda2` · 2026-05-04 | warp-distribution | THEY-WERE-FIRST |  |
| `/manifest:validate` | Validate the current .claude/manifest.json against the v1 manifest schema and report any drift, missing fields, or schema violatio | `38adbda2` · 2026-05-04 | warp-distribution | THEY-WERE-FIRST |  |
| `/maps:all` | Registry of all maps — shows every map, its source, last updated, and staleness | `cd37d410` · 2026-04-12 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/maps:architecture` | App structure — routes, components, libs, how they connect | `cd37d410` · 2026-04-12 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/maps:coverage` | Maps-suite self-inventory — asserts every /maps:* skill is registered in /maps:all, no dangling registry refs, no orphan map files | `16cab8cb` · 2026-05-31 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/maps:enforcements` | Enforcement coverage — hooks, gates, gap analysis, open/closed gaps | `cd37d410` · 2026-04-12 | enforcement-debt | WARPOS-FIRST |  |
| `/maps:hooks` | Hook wiring diagram — events, matchers, scripts, execution order | `cd37d410` · 2026-04-12 | hooks-mgmt | THEY-WERE-FIRST |  |
| `/maps:memory` | Memory store relationships — who reads/writes each store, entry counts | `cd37d410` · 2026-04-12 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/maps:skills` | Skill dependency graph — namespaces, cross-references, data flow | `cd37d410` · 2026-04-12 | skills-meta | THEY-WERE-FIRST |  |
| `/maps:steps` | Regenerate step tables in canonical docs from _requirements/00-canonical/STEPS.json — closes the last loop in the step-registry in | `b7a63fc5` · 2026-04-20 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/maps:systems` | Render the systems manifest as a dependency graph — visualize which systems depend on which, their status, and their categories so | `cd37d410` · 2026-04-12 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/maps:tools` | Tool registry — skills, hooks, external CLIs, API services, npm scripts, platform tools | `cd37d410` · 2026-04-12 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/memory:verify` | Verify & correct auto-memory against ground truth (code/disk/git/TRACKER) — flags stale/wrong/contradicted entries, corrects or de | `d6e158d2` · 2026-07-25 | memory-learning | THEY-WERE-FIRST | No analog found for verifying an agent's own auto-memory against code/disk/git ground truth — but it presupposes vendor auto-memory (2026-02), so no priority. |
| `/mode:adhoc` | Enter adhoc team mode — Alpha + Beta + Gamma for collaborative feature development | `cd37d410` · 2026-04-12 | modes-teams | THEY-WERE-FIRST |  |
| `/mode:oneshot` | Initiate a oneshot build — launch Delta as standalone orchestrator for full skeleton runs | `cd37d410` · 2026-04-12 | modes-teams | THEY-WERE-FIRST |  |
| `/mode:solo` | Enter solo mode — just Alpha and the user, no agent team | `cd37d410` · 2026-04-12 | modes-teams | THEY-WERE-FIRST |  |
| `/mode:sprint` | Enter sprint mode — ε (Alex Epsilon) conducts the full sprint lifecycle (plan→design→build→gauntlet→release→retro) via the registr | `4bfb3c44` · 2026-06-05 | modes-teams | THEY-WERE-FIRST |  |
| `/models:check` | Audit configured dispatch models against the latest vendor catalogs — flag drift, deprecations, and dead ("ghost") ids. --refresh  | `fcaaa242` · 2026-06-01 | model-routing-dispatch | THEY-WERE-FIRST |  |
| `/models:route` | Route a specific command/role to a specific model — thin, validated wrapper over the Dispatch Console (provider/model/effort/fallb | `fcaaa242` · 2026-06-01 | model-routing-dispatch | THEY-WERE-FIRST |  |
| `/models:router` | Open the model router panel — ensure the catalog carries all the latest model options, then launch the Dispatch Console GUI (brows | `fcaaa242` · 2026-06-01 | model-routing-dispatch | THEY-WERE-FIRST |  |
| `/models:update` | Update the dispatch catalog to the latest models — re-ingest vendor docs, migrate deprecated/shut-down ids, add new options, sync  | `fcaaa242` · 2026-06-01 | model-routing-dispatch | THEY-WERE-FIRST |  |
| `/oneshot:improve` | Update preflight passes based on gaps discovered during runs. Modifies the check skills themselves. | `cd37d410` · 2026-04-12 | oneshot-build | THEY-WERE-FIRST | Self-modification loop: the preflight suite edits its own check skills from gaps found during runs. |
| `/oneshot:preflight` | Pre-run preflight — branch creation + skeleton gut + 7-pass verification audit. Default = full setup+gut+audit. Args control surgi | `6779f6e6` · 2026-05-01 | oneshot-build | THEY-WERE-FIRST |  |
| `/oneshot:retro` | Post-run retrospective — context + git log + code diffs + cross-run analysis, all 9 categories. Default = full. Args control surgi | `6779f6e6` · 2026-05-01 | oneshot-build | THEY-WERE-FIRST |  |
| `/oneshot:start` | Lightweight kickoff — verify ready-state and hand off to Delta. Does NOT run setup or destructive work; that's /oneshot:preflight' | `6779f6e6` · 2026-05-01 | oneshot-build | THEY-WERE-FIRST |  |
| `/panel:admin` | Open a product's in-app founder admin panel in the browser (run-in-product, never WarpOS itself). A thin /panel:* forwarder to the | `e319c405` · 2026-06-14 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/panel:list` | List every registered panel — the one discoverable entry for "show me a panel". Enumerates framework/panel-registry.json (name, de | `e319c405` · 2026-06-14 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/panel:models` | Open the model router — the Dispatch Console GUI (role → provider → model → effort). A thin /panel:* forwarder to the canonical /m | `e319c405` · 2026-06-14 | model-routing-dispatch | THEY-WERE-FIRST |  |
| `/panel:readiness` | Open the cross-product launch-readiness board. A thin /panel:* forwarder to the canonical /cockpit:readiness opener — carries ZERO | `e319c405` · 2026-06-14 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/panel:roadmap` | Open the roadmap "what's next" panel in your BROWSER — an interactive visual board of active sprints, the prioritized roadmap, epi | `e319c405` · 2026-06-14 | roadmap | THEY-WERE-FIRST |  |
| `/paths:add` | Guided flow for adding a paths registry key. | `6779f6e6` · 2026-05-01 | paths-registry | WARPOS-FIRST |  |
| `/paths:convert` | Guided flow for converting hardcoded literals to paths.* tokens. | `6779f6e6` · 2026-05-01 | paths-registry | WARPOS-FIRST |  |
| `/paths:coverage` | Report on documentation coverage for the paths registry — which path keys are documented in PATH_KEYS.md and which are missing pro | `6779f6e6` · 2026-05-01 | paths-registry | WARPOS-FIRST |  |
| `/paths:doctor` | Validate path registry, generated artifacts, and path lint rules. | `6779f6e6` · 2026-05-01 | paths-registry | WARPOS-FIRST |  |
| `/paths:explain` | Explain one paths registry key — show its resolved on-disk path, owner, kind, deprecation status, and human-readable docs so calle | `6779f6e6` · 2026-05-01 | paths-registry | WARPOS-FIRST |  |
| `/paths:rename` | Guided flow for renaming a paths registry key. | `6779f6e6` · 2026-05-01 | paths-registry | WARPOS-FIRST |  |
| `/permissions:authorized` | Operator authorization — durably allow a blocked action by adding a scoped permissions.allow rule from a growing catalog of cases, | `1f6c9501` · 2026-05-24 | permissions-turbo | THEY-WERE-FIRST |  |
| `/playbook:add` | Append a play to the Playbook (.claude/project/reference/playbook.md) — a named, example-anchored operating principle. Picks the r | `9eeb23fe` · 2026-05-29 | memory-learning | THEY-WERE-FIRST |  |
| `/portfolio:list` | List all registered portfolio products — slug, path, WarpOS version, last commit, dirty count, current sprint. | `0b043681` · 2026-05-22 | portfolio-multiproduct | THEY-WERE-FIRST |  |
| `/portfolio:new` | Scaffold a new product repo (sibling to WarpOS) with the framework installed and committed, then register it — local-only by defau | `0b043681` · 2026-05-22 | portfolio-multiproduct | THEY-WERE-FIRST |  |
| `/portfolio:open` | Open a registered portfolio product — print its path and a cd hint, or spawn a new terminal window with --spawn. | `0b043681` · 2026-05-22 | portfolio-multiproduct | THEY-WERE-FIRST |  |
| `/portfolio:register` | Register an existing local repo as a portfolio product in ~/.warpos/portfolio.json. | `0b043681` · 2026-05-22 | portfolio-multiproduct | THEY-WERE-FIRST |  |
| `/portfolio:run` | Run a skill against another portfolio product in a fresh Claude subprocess — never retargets the current session. | `0b043681` · 2026-05-22 | portfolio-multiproduct | THEY-WERE-FIRST | INCONCLUSIVE — run a skill against another product repo in a fresh subprocess, never retargeting the current session. No analog found. |
| `/portfolio:spinup` | From WarpOS, run the idea→on-screen on-ramp against a registered product: dispatches /bootstrap:spinup into the product's repo. Th | `0e90018e` · 2026-05-25 | portfolio-multiproduct | THEY-WERE-FIRST |  |
| `/portfolio:status` | Portfolio dashboard — per-product WarpOS version, last commit, dirty count, current sprint, GitHub remote (parallel, 5s per-produc | `0b043681` · 2026-05-22 | portfolio-multiproduct | THEY-WERE-FIRST |  |
| `/portfolio:sync` | Run /warp:update across every registered portfolio product sequentially. No fail-fast — failures captured in the final summary. | `0b043681` · 2026-05-22 | portfolio-multiproduct | THEY-WERE-FIRST |  |
| `/qa:audit` | Active full-codebase QA audit — systematically walks all 7 failure-mode personas | `cd37d410` · 2026-04-12 | qa-redteam-security | THEY-WERE-FIRST |  |
| `/qa:check` | Passive QA scan on recent git diff changes — checks for 7 failure-mode signatures | `cd37d410` · 2026-04-12 | qa-redteam-security | THEY-WERE-FIRST |  |
| `/reasoning:log` | Log a reasoning episode — record what framework was used, why, and what happened | `cd37d410` · 2026-04-12 | reasoning-frameworks | THEY-WERE-FIRST |  |
| `/reasoning:run` | Reason through a problem or decision — auto-detects quick triage vs deep deliberation | `cd37d410` · 2026-04-12 | reasoning-frameworks | THEY-WERE-FIRST |  |
| `/reasoning:score` | Score fix quality (0-4) and retroactively reclassify old fixes when new evidence appears | `cd37d410` · 2026-04-12 | reasoning-frameworks | THEY-WERE-FIRST |  |
| `/redteam:full` | Full red team audit — 11 personas across deterministic scanning + LLM reasoning. Finds auth bypasses, prompt injection, business l | `655775f2` · 2026-04-15 | qa-redteam-security | THEY-WERE-FIRST |  |
| `/redteam:scan` | Quick red team scan — deterministic tools only (deps, routes, CVEs, secrets, config). Fast, no LLM reasoning. | `655775f2` · 2026-04-15 | qa-redteam-security | THEY-WERE-FIRST |  |
| `/report` | File an ELI5 report (sprint  | `dda80fec` · 2026-05-31 | docs-maps-discovery-reporting | THEY-WERE-FIRST | No analog found — ELI5, tl;dr-first, watch-outs-always reporting aimed at a non-technical operator. |
| `/research:deep` | Real deep research — Gemini Thinking writes the brief, then OpenAI Deep Research API + Gemini Deep Research API + Claude multi-rou | `cd37d410` · 2026-04-12 | research | THEY-WERE-FIRST |  |
| `/research:simple` | Deep research pipeline — queries Claude, ChatGPT (Codex), and Gemini in parallel, saves reports, synthesizes, and applies learning | `cd37d410` · 2026-04-12 | research | THEY-WERE-FIRST |  |
| `/roadmap:add` | Append a new entry to ROADMAP.md — picks section, formats consistently, preserves existing content | `91d38d39` · 2026-05-19 | roadmap | THEY-WERE-FIRST |  |
| `/roadmap:cleanup` | Audit ROADMAP.md — detect completed items, stale entries, duplicates, hidden urgencies; propose a cleanup plan | `91d38d39` · 2026-05-19 | roadmap | THEY-WERE-FIRST |  |
| `/roadmap:create` | Bootstrap a product ROADMAP.md from the inputs a project actually has — prefers _requirements/00-canonical/* + a Director-of-PM le | `0e90018e` · 2026-05-25 | roadmap | THEY-WERE-FIRST |  |
| `/roadmap:ideas` | Predict candidate roadmap entries across four evidence lenses (3 each = 12 ideas) — whole-roadmap, last-3-shipped, last-3-active,  | `7b13ae97` · 2026-05-29 | roadmap | THEY-WERE-FIRST |  |
| `/roadmap:next` | The 1-idea alternative to /roadmap:ideas — the single highest-leverage next roadmap entry (the role-appropriate product persona's  | `7b13ae97` · 2026-05-29 | roadmap | THEY-WERE-FIRST |  |
| `/roadmap:prioritize` | Role-aware roadmap prioritization — runs /roadmap:cleanup first, then consults the Product Lead (single-product) or Director of Pr | `dad1aed6` · 2026-05-29 | roadmap | THEY-WERE-FIRST |  |
| `/scan:ac-coverage` | Read-only audit of acceptance-criteria.md verified_by:- linkage across active sprints. | `2ecb4603` · 2026-05-18 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/scan:adhoc-fail-override` | Reject an adhoc dispatcher that overrode a binding reviewer FAIL — verdict-content check (the blind spot gauntlet-verify's presenc | `855318eb` · 2026-06-04 | modes-teams | THEY-WERE-FIRST |  |
| `/scan:adhoc-team-hygiene` | Read-only probe for adhoc-team accretion — flags teams whose members carry a -N de-dup suffix or a stale leadSessionId (the W-21 c | `03cf48cd` · 2026-05-26 | modes-teams | THEY-WERE-FIRST |  |
| `/scan:admin-suite-coverage` | Coverage + freshness enforcer for the admin:* dev-tooling suite — each admin skill resolves, every admin-panel registry row's open | `f273f672` · 2026-06-14 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/scan:architecture` | Architecture integrity — do the layers connect? agent system, cross-layer seams, documentation health | `bf438de7` · 2026-04-16 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/scan:coherence` | Run the WarpOS system coherence graph across 15 drift types. | `6779f6e6` · 2026-05-01 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/scan:cutover-completeness` | ED-026 cutover gate — greps the IMPERATIVE layer + keystone registries for RAW deleted-old-tree literals (00-alex/01-adhoc/02-ones | `146108f1` · 2026-06-05 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/scan:design-system` | Design system compliance check - scans UI code for raw colors, raw primitives, missing design docs, and component-library drift | `6779f6e6` · 2026-05-01 | ui-design-review | THEY-WERE-FIRST |  |
| `/scan:dispatch-routing-parity` | Assert the role→provider routing tables agree across providers.js, catalog.js, and the dispatch guide — fails if any role is route | `03cf48cd` · 2026-05-26 | model-routing-dispatch | THEY-WERE-FIRST |  |
| `/scan:docker-secrets` | Dockerfile → .dockerignore secret-exposure check — flags secret files (.env, *.pem, credentials) that a broad COPY . / ADD . would | `ac566028` · 2026-06-02 | qa-redteam-security | THEY-WERE-FIRST |  |
| `/scan:environment` | Environment readiness and tooling quality — fast go/no-go or deep audit | `bf438de7` · 2026-04-16 | system-health-scans | THEY-WERE-FIRST |  |
| `/scan:etc-harness` | Audit the /etc authoring+eval harness — fail-closed enforcer that rejects an invented authoring format (root etc.md, non-standard  | `e53550ad` · 2026-05-30 | skills-meta | THEY-WERE-FIRST |  |
| `/scan:framework-purity` | Refuse product-content leaks in canonical — scans for client slugs, maintainer abs paths, root-level _requirements/_docs/ (gated u | `74f26fa2` · 2026-05-22 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:framework-views-fresh` | Verify .claude/commands and .claude/agents are byte-identical regenerations of their _warpos/ sources — fails if any view is stale | `74f26fa2` · 2026-05-22 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:full` | Run every scan in parallel — a full system scan across project health, governance, and WarpOS distribution integrity — merged into | `d39661a8` · 2026-04-16 | system-health-scans | THEY-WERE-FIRST |  |
| `/scan:greek-office-parity` | The naming bijection enforcer (operator directive 2026-07-16; ADR-0016) — a role carries a Greek call-sign IFF it is a President's | `a2ee350c` · 2026-07-16 | agent-roster | THEY-WERE-FIRST | N/A-COMPOSITE — naming bijection enforcer (Greek call-sign IFF President's-office membership). No external analog. |
| `/scan:ingest-firewall` | Audit the ingest stores (_docs/research, _docs/imports, _docs/briefs, _docs/clones) for un-firewalled prompt-injection — the persi | `7e2834d8` · 2026-05-30 | qa-redteam-security | THEY-WERE-FIRST |  |
| `/scan:install` | Verify a fresh WarpOS install — manifest, paths, agents, hooks, version, settings. | `38adbda2` · 2026-05-04 | warp-distribution | THEY-WERE-FIRST |  |
| `/scan:issues` | Pattern-mine events.jsonl for repeat audit-block signatures — surface candidates for /issues:log | `6779f6e6` · 2026-05-01 | issue-register | THEY-WERE-FIRST |  |
| `/scan:meta-lockstep` | The meta-lockstep enforcer (SP-20260720-003 D1) — couples a scan's cross-provider SCOPE FILTER to the class_derivation rule-table, | `7f14911b` · 2026-07-20 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/scan:model-chain` | The named enforcer (ED-058) for the role-registry model/effort CHAIN. Since DISPATCH.md (2026-07-12, ADR-0016) it enforces the old | `21848be5` · 2026-06-16 | model-routing-dispatch | THEY-WERE-FIRST |  |
| `/scan:node-procs` | Read-only diagnostic — list Node processes on the host with PID, start-time, working-set KB, and command. | `7be21c64` · 2026-05-18 | model-routing-dispatch | THEY-WERE-FIRST |  |
| `/scan:panel-registry-coverage` | Coverage enforcer for the panel-registry (the /panel:* suite) — every `panels` row is well-shaped ({name, opener, description, run | `e319c405` · 2026-06-14 | admin-panels-cockpit | THEY-WERE-FIRST |  |
| `/scan:patterns` | Cross-run intelligence and automation proposals — diagnose recurring patterns or propose prevention | `cd37d410` · 2026-04-12 | issue-register | THEY-WERE-FIRST | INCONCLUSIVE at skill level — diagnoses a recurring pattern then PROPOSES the preventing automation; behaves like the enforcement-debt family. |
| `/scan:planning-principles` | Report-only plan-lint — flags any plan artifact under _planning/epics/** (optionally _planning/plans/**) that omits a principle-re | `ba7bea81` · 2026-06-09 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/scan:privacy` | Pre-publish scan for personal data — credentials, emails, homedir paths, runtime files tracked by git. | `38adbda2` · 2026-05-04 | qa-redteam-security | THEY-WERE-FIRST |  |
| `/scan:provider-agent-tool-parity` | The DISPATCH.md §9 carve-out enforcer — a `provider != claude` role must NOT carry Agent-tool reachability (tools:["Agent"] in the | `98da5df3` · 2026-07-16 | agent-roster | THEY-WERE-FIRST |  |
| `/scan:references` | Cross-file reference integrity — broken links, orphans, stale SPEC_GRAPH edges | `bf438de7` · 2026-04-16 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/scan:regressions` | Run the regression-seed suite — the 26 recurring bug classes from the 0.17.0 spec, made runnable. Reports per-class pass/fail/gap  | `cfc9264b` · 2026-05-29 | issue-register | THEY-WERE-FIRST |  |
| `/scan:requirements` | Specification consistency, coverage, and drift — static audit, change-driven propagation check, or pending-drift review | `bf438de7` · 2026-04-16 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/scan:roadmap-trace` | Assert every done/retrospected/released sprint has BOTH a Sprints-table ledger row AND a Shipped narrative entry in ROADMAP.md — c | `74aa59f0` · 2026-05-25 | roadmap | THEY-WERE-FIRST |  |
| `/scan:role-parity` | The one check that owns role parity across the org map, the dispatch catalog, and team-guard — fail-closed enforcer (S1.1) so repa | `c3219d6d` · 2026-05-30 | agent-roster | THEY-WERE-FIRST | N/A-COMPOSITE — fail-closed role bijection across org map, dispatch catalog, and team-guard. No external analog. |
| `/scan:scaffold-coverage` | Verify the WarpOS app scaffold (Next+Tailwind v4+shadcn/ui+Radix+Lucide) is complete and coherent — fail-closed enforcer for S0.3, | `d5e2ce6a` · 2026-05-30 | bootstrap-onramp | THEY-WERE-FIRST |  |
| `/scan:scan-coverage` | Scan-suite self-inventory — asserts every /scan:* skill is delegated by /scan:full or explicitly excluded (with a reason). Kills t | `ada42901` · 2026-05-31 | skills-meta | THEY-WERE-FIRST | N/A-COMPOSITE — aggregator self-inventory; every member skill delegated or excluded WITH A REASON. No external analog. |
| `/scan:security-binding-lane` | The security-binding-lane enforcer (SP-20260720-003 D2) — closes ED-244 (the security BINDING verdict must resolve to a verifiable | `7f14911b` · 2026-07-20 | qa-redteam-security | THEY-WERE-FIRST | No analog found — asserts a reviewer FAIL is structurally un-overridable by the dispatching lead (governance, not scanning). |
| `/scan:skill-hook-coverage` | Bidirectional coverage of the skill hook-point registry — REVERSE (registry coherent vs role-registry) + FORWARD (every registered | `f574a7e6` · 2026-06-05 | enforcement-debt | WARPOS-FIRST |  |
| `/scan:sprint-beta-honesty` | Audits Beta consultation honesty across post-cutoff /sprint:full runs (missing consults, placeholder verdicts, ESCALATE-without-ha | `e888eceb` · 2026-05-24 | beta-judgment | THEY-WERE-FIRST |  |
| `/scan:sprint-hook-coverage` | Bidirectional coverage of the sprint hook-point registry — FORWARD (every matched block-row has a manager_consult record per /spri | `2e859d76` · 2026-06-04 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/scan:sprint-manager-consult` | Audits manager-consult coverage across post-cutoff /sprint:full runs — asserts the design-quality authority was consulted on every | `855318eb` · 2026-06-04 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/scan:system` | System inventory — enumerate every active WarpOS system, diff against manifest, report drift and gaps | `bdaf4031` · 2026-04-16 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/scan:timeline` | Reconstruct a build timeline from transaction, event, and provider logs. | `6779f6e6` · 2026-05-01 | docs-maps-discovery-reporting | THEY-WERE-FIRST |  |
| `/scan:turbo-spend` | Report the turbo session's REAL cross-provider API spend against the operator-set ceiling (framework default $100, runtime-raisabl | `97c0be44` · 2026-06-09 | permissions-turbo | THEY-WERE-FIRST |  |
| `/scan:version-coherence` | Verify version + schema-label coherence — product version agrees across ALL manifests (incl. the ones version-quorum misses) and e | `ed866510` · 2026-05-30 | warp-distribution | THEY-WERE-FIRST |  |
| `/scan:warpos-applied-migrations` | Detect already-applied WarpOS migration scripts left on disk in consumer projects | `38adbda2` · 2026-05-04 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-capsule-resolvable` | Verify the capsule for /warp:update --to <v> is resolvable from REPO_ROOT, sibling clones, manifest.warpos.source, or framework-in | `40f4e818` · 2026-05-13 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-install-baseline` | Verify a WarpOS install baseline exists (.claude/framework-installed.json present, installedVersion ≠ 0.0.0) before /warp:update m | `40f4e818` · 2026-05-13 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-layer-diff` | Read-only product-vs-dev-tooling layer diff — lists which framework-owned paths SHIP to consumer products (product layer) vs which | `caaf7707` · 2026-05-31 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-manifest-coverage` | Verify every on-disk path is enumerated in _warpos/MANIFEST.json — catches "added framework content, forgot to register" before do | `3f8e58b0` · 2026-05-22 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-manifest-honesty` | Verify framework-installed.json reflects actual disk state (no missing files, no hash drift) | `38adbda2` · 2026-05-04 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-migration-coverage` | Verify every breaking change in a WarpOS release ships with a corresponding migration script under framework/migrations — stub imp | `38adbda2` · 2026-05-04 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-migration-presence` | Verify every migration listed in capsule release.json#migrations[] exists in the source tree before /warp:update may apply. | `40f4e818` · 2026-05-13 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-path-resolution` | Verify every paths.json key points to an existing path (skip generated/ephemeral keys) | `38adbda2` · 2026-05-04 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-ship-coverage` | Verify every framework-owned path under the consumer-essential roots is actually shipped (enumerated in framework-manifest.json) — | `a812f2e6` · 2026-05-30 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-staleness` | Detect drift between the installed WarpOS version on disk and the latest canonical version, flagging installs that have been stale | `38adbda2` · 2026-05-04 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-structure-parity` | Verify installed framework has the structural skeleton dirs canonical declares | `38adbda2` · 2026-05-04 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-tracked-transients` | Catch transient state accidentally committed (.warpos/, qa-*.png, runtime/qa-*/, etc.) | `38adbda2` · 2026-05-04 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/scan:warpos-version-quorum` | Verify version.json, .claude/framework-manifest.json, .claude/framework-installed.json, and install.ps1 header agree on the instal | `40f4e818` · 2026-05-13 | warpos-distribution-integrity | N/A-COMPOSITE |  |
| `/session:checkpoint` | Force an immediate session checkpoint save — captures conversation context and tool activity that git alone cannot recover, so the | `cd37d410` · 2026-04-12 | session-state-handoff | THEY-WERE-FIRST |  |
| `/session:dump` | Write a prescriptive handoff to DUMP.md at project root — context, session progression (as fenced context, not instructions), verb | `c305b555` · 2026-05-18 | session-state-handoff | THEY-WERE-FIRST | Distinct: carries explicit ANTI-instructions and fences past session progression as context-not-command. No analog found for the anti-instruction contract. |
| `/session:end` | Full session wrap-up — cognitive maintenance (learn/mine/sleep → integrate learnings + β recs) → reconcile + validate TRACKER.md ( | `bf894984` · 2026-06-01 | session-state-handoff | THEY-WERE-FIRST |  |
| `/session:handoff` | Generate a rich AI-analyzed handoff document (replaces /handoff) | `cd37d410` · 2026-04-12 | session-state-handoff | THEY-WERE-FIRST |  |
| `/session:history` | Browse past session handoff summaries from the handoffs directory — useful for tracking what happened in a prior session, picking  | `cd37d410` · 2026-04-12 | session-state-handoff | THEY-WERE-FIRST |  |
| `/session:read` | Read the cross-session inbox — see what other Alex sessions have been doing | `cd37d410` · 2026-04-12 | cross-session-inbox | INCONCLUSIVE | Core of the INCONCLUSIVE cross-session-inbox case. |
| `/session:recap` | Catch up on the last N turns of this session — what you asked, what I did, what's still pending | `6779f6e6` · 2026-05-01 | session-state-handoff | THEY-WERE-FIRST |  |
| `/session:resume` | Pick up the previous session and KEEP GOING — load the handoff, re-establish mode + team + turbo, and start executing the next act | `cd37d410` · 2026-04-12 | session-state-handoff | THEY-WERE-FIRST |  |
| `/session:takenotes` | Append a timestamped note to a per-topic file under runtime/notes/ | `8faa4d26` · 2026-04-21 | session-state-handoff | THEY-WERE-FIRST |  |
| `/session:turbo` | Session speed mode — pre-authorize a batch of high-impact actions (permissions.allow) AND switch the build cadence to fast levers  | `56c71f63` · 2026-05-25 | permissions-turbo | THEY-WERE-FIRST |  |
| `/session:write` | Post a message to the cross-session inbox so other Alex sessions can see it. Default is fully automatic — no arguments needed. Use | `cd37d410` · 2026-04-12 | cross-session-inbox | INCONCLUSIVE | Core of the INCONCLUSIVE cross-session-inbox case. |
| `/skills:cleanup` | Audit all skills for dead weight, duplicates, broken references, and namespace issues — then clean up | `cd37d410` · 2026-04-12 | skills-meta | THEY-WERE-FIRST |  |
| `/skills:create` | Create a new skill from a description — supports simple, multi-phase, and parallel workflows | `cd37d410` · 2026-04-12 | skills-meta | THEY-WERE-FIRST |  |
| `/skills:delete` | Remove a skill from .claude/commands with a backup, so it can be restored if the deletion turns out to be premature. | `cd37d410` · 2026-04-12 | skills-meta | THEY-WERE-FIRST |  |
| `/skills:edit` | Edit the body or frontmatter of an existing skill under .claude/commands — guided flow that preserves frontmatter contract and re- | `cd37d410` · 2026-04-12 | skills-meta | THEY-WERE-FIRST |  |
| `/sleep:deep` | Full sleep cycle — all 6 phases: NREM consolidation, cleanup, replay, REM dreaming, repair, growth (~15-30 min) | `cd37d410` · 2026-04-12 | sleep-dream | WARPOS-FIRST | The flagship case. Ran in production 2026-04-22 and 2026-04-25, both before the 2026-05-06 Anthropic announcement. |
| `/sleep:quick` | Light nap — NREM consolidation + glymphatic cleanup only (~5 min) | `cd37d410` · 2026-04-12 | sleep-dream | WARPOS-FIRST | Same lineage as /sleep:deep (NREM consolidation + glymphatic cleanup only). |
| `/sprint:cost-gate` | Toggle the /sprint:full cost-estimate halt on or off — turn off the heuristic spend gate when an operator spend posture is authori | `7c7b4950` · 2026-05-30 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/sprint:design` | Turn an approved Plan Contract into PRD, stories, COPY, INPUTS, TRACE, acceptance criteria, QA, red-team, release plan — then mint | `d460de4b` · 2026-05-11 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/sprint:execute` | Execute the sprint via Ralph-style plan/act/test/review/record/checkpoint loops per ticket, with crash-safe progress, issue tracki | `d460de4b` · 2026-05-11 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/sprint:full` | Single-invocation execution of the full sprint pipeline (plan→design→execute→release-prep→retro) under a bounded autonomy preset.  | `dc6b3c73` · 2026-05-18 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/sprint:plan` | Turn a brief plain-language request into a structured sprint plan and durable Plan Contract. Evidence-labeled, approval-aware, cra | `d460de4b` · 2026-05-11 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/sprint:release` | Prepare and execute a sprint release — final checks, approval, deploy gate, release notes, rollback prep, retrospective trigger. | `d460de4b` · 2026-05-11 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/sprint:retrospective` | Synthesize a post-sprint retrospective from tracker artifacts — outcomes, friction, action items. Idempotent, fail-open, schema-va | `40f4e818` · 2026-05-13 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/sprint:status` | Read-only status view of every live sprint — shows id, lane, status, phase, last checkpoint, and the resume command for each in-fl | `92c0cece` · 2026-05-12 | sprint-lifecycle | THEY-WERE-FIRST |  |
| `/trackers:init` | Initialize the enforced tracker system in a repo — scaffold a validator-GREEN tracker structure. Creates the /trackers/ dirs (epic | `50683a29` · 2026-06-06 | enforced-trackers | THEY-WERE-FIRST |  |
| `/trackers:validate` | Fail-closed validator for the enforced tracker system (agentic_os_tracker_system_improvements.md §28.7). Asserts TRACKER.md carrie | `e386d70a` · 2026-06-05 | enforced-trackers | THEY-WERE-FIRST |  |
| `/turbo` **[deprecated alias → /session:turbo]** | [alias → /session:turbo] Pre-authorize a session batch of high-impact actions via permissions.allow entries. Removes the keyboard  | `4c3bc3f9` · 2026-05-13 | permissions-turbo | THEY-WERE-FIRST |  |
| `/ui:review` | Design system compliance audit — read-only check of components against the project's design-system docs | `655775f2` · 2026-04-15 | ui-design-review | THEY-WERE-FIRST |  |
| `/warp:check` | Compare your WarpOS installation against the latest version — find stale, new, and missing items | `c7db0a2b` · 2026-03-19 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:deprecate` | Create a guarded WarpOS deprecation proposal for an agent, skill, hook, path, requirement, pattern, or generated file. | `6779f6e6` · 2026-05-01 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:diff` | Diff canonical WarpOS against an installed product — version/staleness, framework-file drift (stale vs locally-modified), coverage | `d5d653c6` · 2026-05-29 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:doctor` | Unified WarpOS diagnostic — runs every health check in one place. Like /warp:health but full-coverage. | `6779f6e6` · 2026-05-01 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:flag` | Flag a WarpOS framework/tooling gap from a downstream product — append a structured, canonical-consumable entry to this repo's WAR | `b3a5ab06` · 2026-05-11 | warp-distribution | THEY-WERE-FIRST | INCONCLUSIVE — upstream gap channel from a downstream product back to the framework; cruft/Copier propagate downstream only. |
| `/warp:health` | Verify WarpOS installation — checks every system, reports green/yellow/red with plain-English fixes | `655775f2` · 2026-04-15 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:md` | Tune CLAUDE.md with project-specific context — refresh the auto-generated project block from PROJECT.md, _requirements, manifest,  | `0e90018e` · 2026-05-25 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:reconcile` | Reconcile downstream-flagged WarpOS gaps into canonical — discover every product's WARPOS.md, verify each gap @current, get a cros | `03cf48cd` · 2026-05-26 | warp-distribution | THEY-WERE-FIRST | INCONCLUSIVE — consumer side of the same upstream gap channel. |
| `/warp:release` | Drive a full WarpOS release of the canonical clone from this product repo — promote, bump, regen, build capsule, run gates, commit | `6779f6e6` · 2026-05-01 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:setup` | Set up WarpOS end-to-end — clone, install, merge CLAUDE.md, restart, verify. Safe to re-run; auto-detects and completes missing st | `e44b78ad` · 2026-04-17 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:sync` **[deprecated alias → /warp:update]** | Legacy alias for /warp:update that forwards to the canonical update flow so older references and muscle memory keep working until  | `afd31592` · 2026-03-19 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:tour` | Guided introduction to WarpOS — explains everything in simple language, no jargon | `655775f2` · 2026-04-15 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:uninstall` | Completely remove WarpOS from a project — restores pre-install state from backup | `e44b78ad` · 2026-04-17 | warp-distribution | THEY-WERE-FIRST |  |
| `/warp:update` | Update WarpOS in this project to a target release. Default = latest. Default mode = dry-run; pass --apply to execute. | `6779f6e6` · 2026-05-01 | warp-distribution | THEY-WERE-FIRST |  |

---

## 6. Methodology

**Inventory.** `find .claude/commands -name '*.md'` → 237 files. Skill key = path with `/` → `:`.
Purpose = the frontmatter `description` field (truncated to 130 chars in the per-skill table; full
text is in `skill-sweep.json`). 7 files carry a deprecated-alias description and are labelled as such
in the table; they still count toward the 237 because they are still resolvable commands.

**Dating.** Per file:

```bash
git log --diff-filter=A --follow --format='%h %ad' --date=short -- <path> | tail -1
```

`--follow` matters: a 2026-04-15 refactor moved `framework/commands/**` → `.claude/commands/**`, and
the 2026-05-28 `check:` → `scan:` namespace rename (SP-20260528-001) moved 40+ scan skills. Without
`--follow`, `/scan:patterns` would date to the rename rather than to `cd37d410`. The dates in this
document are **first landing of the procedure**, not first landing at the current path.

**Clustering.** 35 families assigned by a deterministic rule list (`_fam.js`), first-match-wins, with
an assertion that every one of the 237 skills lands in exactly one family and none is unassigned.
Families are capability-shaped, not namespace-shaped: the 46 `/scan:*` skills are distributed across
9 families by what they actually check, and `/panel:models` sits with `models:*` rather than with the
other panels.

**Research.** Family-level, not skill-level — 13 web actions total (well under the 50 budgeted),
because the majority of families map onto pairs the companion document had already established with
sources. New research this pass covered: growth/marketing content tools, admin-panel builders,
idea→app builders, visual-regression/design-system tools, AI commit tooling, roadmap-prioritization
products, architecture-governance tooling, docs-into-agent-context features, prompt-eval frameworks,
issue-regression detection, scaffolding/template-propagation tools, and cross-session agent
messaging. Every new date carries a URL in §2/§3.

**Verdicts.** Assigned per family, then **inherited** by every skill in it. Where a skill is
materially different from its family, a skill-level note says so and §4 lists it. Four values:

- **WARPOS-FIRST** — WarpOS landed the procedure before the closest analog found (margin stated, and
  scope stated: "vs Anthropic" is not "vs the industry").
- **THEY-WERE-FIRST** — an earlier public analog exists.
- **INCONCLUSIVE** — no analog is close enough to settle it, in either direction.
- **N/A-COMPOSITE** — a WarpOS-internal composition of vendor primitives with no external analog
  because no external system has the structure being checked. Not a priority claim.

---

## 7. Limits — read before quoting any number here

1. **The 45 extraction-commit skills are undated in the way that matters.** They landed complete on
   2026-04-12 from a private repo. Every date for them is a *ceiling*, not the real date. Establishing
   the Jobzooka pre-history would move several margins, and PRIOR-ART §5 item 5 flags that it needs an
   explicit operator decision (memory rule `feedback_warpos_only_no_cross_project` puts other repos
   off-limits).
2. **Author-supplied, unsigned git dates.** Anyone can set `GIT_AUTHOR_DATE`. The GitHub-side
   repo-creation timestamp (2026-03-02T19:53:12Z) and the public tag `warpos@0.1.4` (2026-05-02) are
   the only non-author-supplied anchors, and they only bound the sleep case.
3. **Verdicts are inherited, so they are coarse.** A family verdict of THEY-WERE-FIRST does not mean
   every skill in it has an earlier analog — it means the *capability* does. §4 is where the
   exceptions live, and it is the more interesting table.
4. **"No analog found" ≠ "no analog exists."** §4 lists what was searched for each. A single-pass web
   search by one agent is weak evidence of absence, especially for internal tooling that companies
   never publish. Treat every uncontested WarpOS-first claim as *provisionally* uncontested.
5. **Two vendor dates remain soft**, inherited from the companion document: Claude Code fallback
   model chains (~2026-06, exact day unconfirmed) and the first-party Anthropic Dreaming
   announcement page (`anthropic.com/news/code-with-claude-2026` 404s, and `anthropic.com` is blocked
   by the browser extension's domain permissions). The Dreaming date rests on InfoQ plus secondary
   outlets.
6. **This sweep covers skills only.** Several of the strongest WarpOS-first candidates in the
   companion document are *scripts*, not skills — cross-provider CLI dispatch
   (`scripts/dispatch-agent.js`, 2026-04-16), the dispatch-route guard, the completion ledger, the
   orphan reaper, the brokered protected-ref land. They are out of scope here by construction, and
   PRIOR-ART §7 already found earlier analogs for all of them.
7. **The honest headline is unchanged by this sweep.** 204 of 237 skills inherit THEY-WERE-FIRST.
   The defensible claim is the composition and the speed of integration — a single-operator framework
   that wraps 35 capability families over vendor primitives — plus exactly one timing datapoint
   (dreaming, vs Anthropic, 24 days) and two or three uncontested-but-niche procedures. Claiming more
   than that is falsifiable in one search.
