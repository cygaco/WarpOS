# WarpOS Prior-Art Evidence — vs Anthropic & OpenAI
**Compiled:** 2026-08-28 · **Repo:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS` · **Public mirror:** https://github.com/cygaco/WarpOS (public, created 2026-03-02T19:53:12Z)

---

## 0. Read this first — the honest frame

Three facts constrain every claim below, and stating them up front is what makes the one real
prior-art case credible:

1. **This repo's history begins 2026-03-02.** Anything Anthropic shipped before that date is
   vendor-first, full stop. Claude Code hooks (2025-06-30), subagents (2025-07), Agent Skills
   (2025-10-16), plugins (2025-10-31) all predate WarpOS's first commit.
2. **WarpOS is built *on* Claude Code primitives, not in parallel with them.** WarpOS hooks are
   Claude Code hooks. WarpOS skills are Claude Code slash commands / Agent Skills. Claiming
   priority on those would be false. They are listed as VENDOR-FIRST deliberately.
3. **The framework was extracted from an earlier private project ("Jobzooka"/"jobhunter") on
   2026-04-12** (`cd37d410 feat: WarpOS v0.1.0 — full framework extraction from Jobzooka`). The
   sleep/dreaming system arrived *fully formed* in that extraction commit, which means it was
   built earlier, in Jobzooka. **Those earlier dates are not provable from this repo** and are
   treated as unproven throughout. See §5.

The result: **one strong prior-art case (dreaming), three uncontested-but-niche cases, and a
majority of features where Anthropic was first.**

> ### ⚠️ Scope correction (added 2026-08-28, §6)
> §1–§3 compare WarpOS **against Anthropic and OpenAI only**. Widening the field to *any company*
> (§6) changes the headline materially: **Letta shipped "sleep-time compute" — a dedicated
> background agent that consolidates and reorganizes another agent's memory during idle time — on
> 2025-04-21, ~356 days before WarpOS's sleep cycle.** MemGPT, its predecessor, dates to Oct 2023.
>
> So the defensible claim is precisely: **WarpOS shipped dreaming before *Anthropic* did — not
> before the industry did.** Every other WarpOS feature has an earlier analog somewhere too. Read
> §6 before making any public claim; leading with "we invented dreaming" is falsifiable in one
> search.

---

## 1. Summary table

| # | WarpOS feature | WarpOS first-landed (hash · date) | Nearest vendor feature | Vendor launch | Verdict | Margin |
|---|---|---|---|---|---|---|
| 1 | **Sleep cycle w/ REM "dreaming"** (`/sleep:deep`) | `cd37d410` · **2026-04-12** | Anthropic **Dreaming** (agent memory consolidation) | **2026-05-06** (Code with Claude, SF) | **WARPOS-FIRST** | **+24 d** (commit) / **+4 d** (public tag `warpos@0.1.4`, 2026-05-02) |
| 2 | **Cross-provider CLI dispatch** (`dispatch-agent.js` — GPT + Gemini + Claude as peer agents) | `29908188` · **2026-04-16** | *No vendor equivalent.* Closest: Claude Code **fallback model chains** (within-provider only) | ~2026-06 | **WARPOS-FIRST** (uncontested; loose analogy) | n/a — vendors do not ship cross-vendor dispatch |
| 3 | **Centralized paths registry** (source→generated, path-guard hook) | `bb06646d` · **2026-04-16** (registry source `318971ff` · 2026-05-03) | *No vendor equivalent* | — | **WARPOS-FIRST** (uncontested) | n/a |
| 4 | **Enforcement-debt ledger** (`/enforcement:log`, "every policy needs a named enforcer") | `cd37d410` · **2026-04-12** (skill `91d38d39` · 2026-05-19) | *No vendor equivalent.* Closest: `claude plugin eval` (2026) | 2026 | **WARPOS-FIRST** (uncontested) | n/a |
| 5 | **Karpathy autoresearch loop** (closed-loop optimization of agent specs against a scalar metric, isolated worktree) | `38d771bf` · **2026-04-18** | Anthropic **"Outcomes"** / capability-curve for Managed Agents | **2026-05-06** | **WARPOS-FIRST** (loose analogy) | +18 d |
| 6 | **Model router / dispatch console** (role→provider→model→effort GUI) | `fcaaa242` · **2026-06-01** | Claude Code **fallback model chains + per-agent cost attribution** | **~2026-06** (exact day unconfirmed) | **INCONCLUSIVE** | needs exact vendor date |
| 7 | **β independent-judgment consult** (DECIDE / DIRECTIVE / ESCALATE second opinion) | `cd37d410` · **2026-04-12** | Claude Code `/code-review`, `security-review` skills (review, not decision arbitration) | 2025-10-16 (Skills) | **INCONCLUSIVE** (different job) | — |
| 8 | **smart-context prompt enrichment** (Haiku rewrites the prompt + selects memory as `additionalContext`) | `cd37d410` · **2026-04-12** | `UserPromptSubmit` hook (the substrate); auto-memory context injection | 2025 / 2026-02 | **INCONCLUSIVE** (built on vendor substrate) | — |
| 9 | **Enforced TRACKER system** (20-check validator, hook-enforced) | `e386d70a` · **2026-06-05** | Agent-teams **shared task list** | **2026-02-05** | **VENDOR-FIRST** | −120 d |
| 10 | **Memory stores + learnings lifecycle** (scored, promoted, decayed) | `cd37d410` · **2026-04-12** | Claude Code **Auto Memory / MEMORY.md** (v2.1.59) | **2026-02** | **VENDOR-FIRST** | −~45 d |
| 11 | **Named agent faces / adhoc team** (α+β+γ) | `cd37d410` · **2026-04-12** | Claude Code **Agent Teams** (w/ Opus 4.6) | **2026-02-05** | **VENDOR-FIRST** | −66 d |
| 12 | **`/session:turbo` permission pre-authorization** | `4c3bc3f9` · **2026-05-13** | Claude Code **auto mode** (classifier) | **2026-03-24** preview → 2026-07-10 GA | **VENDOR-FIRST** | −50 d |
| 13 | **Hooks system** | `c7db0a2b` · **2026-03-19** | Claude Code **hooks** (v1.0.38) | **2025-06-30** | **VENDOR-FIRST** | −262 d |
| 14 | **Skills library** (`.claude/commands`, namespaced) | `afd31592` · **2026-03-19** | Claude Code custom slash commands (2025) → **Agent Skills** | **2025-10-16** | **VENDOR-FIRST** | −154 d |
| 15 | **Subagent roster / role specs** | `cd37d410` · **2026-04-12** | Claude Code **Subagents** (`/agents`) | **2025-07-24** | **VENDOR-FIRST** | −262 d |
| 16 | **Session handoff / DUMP.md / `/session:*`** | `afd31592` · **2026-03-19** (`handoff.md`) | Claude Code `/resume`, **checkpoints/rewind** (v2.0) | 2025-09-29 *(date needs verification)* | **VENDOR-FIRST** (likely) | — |
| 17 | **Framework distribution capsule** (`/warp:update`, versioned install) | 2026-04-17 (`e44b78ad`) | Claude Code **plugins & marketplaces** | **2025-10-31** | **VENDOR-FIRST** | −168 d |
| 18 | **Red-team / security gauntlet lanes** | `f504decf` · 2026-04-15 (path), origin ≤2026-04-12 | Anthropic **security-review** skill / code-vulnerability scanner | 2025-10 / 2026-05-06 | **INCONCLUSIVE** | — |

**Tally:** 18 features compared · **5 WARPOS-FIRST** (1 strong + 4 uncontested/loose) · **9 VENDOR-FIRST** · **4 INCONCLUSIVE**.

---

## 2. The flagship case — dreaming

### 2.1 What WarpOS shipped

`/sleep:deep` — a six-phase, biologically-modelled memory-consolidation cycle. From the spec as
it existed on **2026-04-12** (`git show cd37d410:framework/commands/sleep/deep.md`):

> `description: "Full sleep cycle — all 6 phases: NREM consolidation, cleanup, replay, REM dreaming, repair, growth (~15-30 min)"`
>
> | Brain Mechanism | System Implementation | Phase |
> | Hippocampal → neocortical transfer | `pending_validation` → `effective` promotion | 1 (NREM) |
> | Sharp-wave ripple replay (compressed, selective) | Replay important learnings, skip noise | 1 (NREM) |
> | Synaptic homeostasis (downscaling weak synapses) | Decay unreferenced learnings, prune vague entries | 1 (NREM) |
> | Prefrontal memory tagging (salience, novelty, reward) | Importance signals on learnings | 1 (NREM) |
> | REM abstraction & schema formation | Cross-pollination, pattern detection, dream solutions | 4 (REM) |

Concrete consolidation mechanics in the same file: entries with `score: 0` and
`pending_validation: true` older than 14 days are removed; `effective: null` older than 21 days
removed; entries contradicting newer validated entries removed.

### 2.2 WarpOS date evidence (strongest → weakest)

| Artifact | Date | Strength |
|---|---|---|
| Public repo `cygaco/WarpOS` created — API confirms `"visibility":"public"`, `"private":false` | 2026-03-02T19:53:12Z (GitHub-side, not author-supplied) | **Strong** — GitHub's own clock |
| Tag `warpos@0.1.4` → commit `de9ba8eb`, with `.claude/commands/sleep/deep.md` (19,921 bytes) **confirmed present at that ref server-side** via `GET /repos/cygaco/WarpOS/contents/...?ref=warpos@0.1.4` | **2026-05-02T03:07:12Z** | **Strong-ish** — public and pre-announcement, but the tag's commit date is still author-supplied |
| Executed-run artifacts `scripts/sleep-20260422-consolidate.js`, `-analyze.js`, `-prune.js`, `-log-events.js`; `scripts/one-off-sleep-2026-04-25.js` — *dated in the filenames, i.e. the cycle was actually run* | **2026-04-22**, **2026-04-25** | **Strong corroboration** — the feature was in production use, not just specced |
| Commit `cd37d410` (`author_date`/`committer_date` = 2026-04-12T18:35:49Z, confirmed present on GitHub) | **2026-04-12** | **Medium** — git dates are author-supplied and the commit is unsigned (`verification.verified: false`) |
| `.claude/dreams/` output journal (`journal.md`, `coaching.md`, `2026-05-13.md`) landed `e37620d3` | 2026-05-12 | Supporting — proves dream *outputs*, post-dates the announcement |

### 2.3 Anthropic's date

- **Announced 2026-05-06**, at **Code with Claude 2026, San Francisco** (the SF leg; London 2026-05-19, Tokyo 2026-06-10). "Claude Managed Agents with Dreaming, Outcomes, and multi-agent orchestration" was part of a 15+ update slate.
  - https://www.infoq.com/news/2026/05/code-with-claude/
  - https://pasqualepillitteri.it/en/news/1727/code-with-claude-2026-anthropic-developer-conference
  - https://gadgetbond.com/code-with-claude-2026-anthropic-developer-conference/
  - https://apito.ai/en/blog/news/code-with-claude-conference/
- Third-party confirmation of the framing: "Earlier this month at its annual Code with Claude developer conference in San Francisco, Anthropic shipped a feature it has chosen to call Dreaming." — https://www.softpagecms.com/2026/05/23/anthropic-claude-dreaming-agent-memory-consolidation/ (2026-05-23)
- News coverage: https://letsdatascience.com/news/anthropic-introduces-dreaming-for-claude-agent-memory-consol-32a279c9 (2026-05-06) · https://thenewstack.io/anthropic-agent-memory-dreaming/ · https://www.mindstudio.ai/blog/what-is-claude-dreaming-anthropic-managed-agents
- The `/dream` slash command in Claude Code rolled out **later and quietly** — it is **not in the official Claude Code changelog** as of 2026-08-28 (verified: fetched https://code.claude.com/docs/en/changelog and searched for "dream" — no match). Third parties describe it as "quietly shipped… haven't officially announced yet", triggering after 24h + 5 sessions, or manually via `/dream`.
  - https://claudefa.st/blog/guide/mechanics/auto-dream
  - https://decodethefuture.org/en/claude-code-auto-dream-explained/
  - Leaked system prompt: https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/system-prompts/agent-prompt-dream-memory-consolidation.md
  - Community reimplementations that post-date WarpOS: https://github.com/jl-cmd/claude-dream · https://github.com/grandamenium/dream-skill

### 2.3b Browser-verified negatives (2026-08-28)

Three checks run in a live browser session, all of which **support** the WarpOS-first framing by
showing how thinly Anthropic publicized Dreaming:

0. **`/dream` has never appeared in the official Claude Code CHANGELOG.md.** Fetched the file
   server-side — `GET /repos/anthropics/claude-code/contents/CHANGELOG.md`, base64-decoded (head
   reads `# Changelog` / `## 2.1.250`, so the fetch succeeded) — and grepped case-insensitively for
   `dream`: **zero matches across the entire file.** There is therefore **no "first CHANGELOG
   version + date" for `/dream` to cite** — Anthropic never changelogged it. This is a clean,
   reproducible negative, not a failure to find one.
1. **`/dream` is not in the official Claude Code memory docs.** Navigated to
   https://code.claude.com/docs/en/memory and searched the rendered page: no occurrence of "dream",
   "dreaming", or "memory consolidation". The page documents `CLAUDE.md` and auto-memory only. This
   corroborates the changelog check in §2.3 — **`/dream` remains publicly undocumented**.
2. **Neither official X account ever posted about Dreaming.** X search
   `(from:AnthropicAI OR from:claudeai) dreaming` (Latest) returned **zero results**. Dreaming was a
   conference/Managed-Agents announcement, not an X-promoted product launch.
3. **@AnthropicAI does post about Code with Claude** — the search
   `(from:AnthropicAI) "Code with Claude"` surfaced the **2025-05-22** keynote post, confirming the
   account is the right place to look and that the absence of a Dreaming post is real, not a search
   artifact.

*Caveat:* X search without a query-specific date filter can under-return; treat #2 as strong but not
absolute. The date anchor for Dreaming still rests on InfoQ + several secondary outlets (§2.3), not
on a first-party Anthropic page — the canonical `anthropic.com/news/code-with-claude-2026` URL 404s.
**Pinning that first-party URL remains the top open item on the vendor side.**

### 2.4 Verdict

**WARPOS-FIRST *vs Anthropic*. THEY-WERE-FIRST vs the industry** — see §6.1 (Letta, 2025-04-21).

WarpOS shipped a REM-"dreaming" memory-consolidation phase **24 days** before
Anthropic announced Dreaming, and had **executed it twice in production** (2026-04-22, 2026-04-25)
before the announcement. A public, pre-announcement artifact exists: tag `warpos@0.1.4`
(**2026-05-02T03:07:12Z**), four days ahead, in a repo GitHub's API confirms is public.

**Honesty notes.** (a) The two systems solve the same problem — offline consolidation of an agent's
persistent memory: prune stale, merge duplicates, resolve contradictions, promote recurring
patterns — and both explicitly borrow the sleep metaphor. That is a *close* analogy, not a stretched
one. (b) WarpOS's is richer (6 phases incl. glymphatic cleanup, repair, growth) and operates over a
scored `learnings.jsonl` rather than markdown memory files; Anthropic's is more automatic
(background trigger, reviewable diff). (c) Independent invention, not access: nothing here suggests
Anthropic saw this repo, and the claim should be framed as *convergent prior art*, not influence.

---

## 3. Per-feature detail — the rest

### 3.1 WARPOS-FIRST (uncontested — no vendor equivalent exists)

**Cross-provider CLI dispatch** — `scripts/dispatch-agent.js`, `29908188` **2026-04-16**
(*"feat: cross-provider agent dispatch — GPT-5.4 for review, Gemini 2.5 Pro for security"*).
Routes named agent roles to *rival vendors'* CLIs as peer reviewers. Neither Anthropic nor OpenAI
ships this and structurally won't. Closest vendor motion is Claude Code's **fallback model chains**
(~June 2026, https://www.sitepoint.com/claude-code-june-2026-10-new-features-devs-need-to-know/),
which is within-provider failover. **WarpOS-first, but the comparison is loose by construction.**

**Paths registry** — `.claude/paths.json` `bb06646d` **2026-04-16**; registry *source*
`framework/paths.registry.json` `318971ff` **2026-05-03**. Source→generated path indirection with a
write-time guard hook. No vendor analogue.

**Enforcement-debt ledger** — present at extraction `cd37d410` **2026-04-12**; `/enforcement:*`
skills `91d38d39` **2026-05-19**. The doctrine ("every policy needs a named enforcer, or log the
debt") has no vendor equivalent; `claude plugin eval` (2026) is the nearest, and it evaluates
plugins rather than tracking unenforced policy.

**Karpathy autoresearch loop** — `38d771bf` **2026-04-18**. Closed-loop experiment: optimize an
editable artifact (agent spec, skill, hook policy) against a scalar metric in an isolated worktree,
then merge the winner. Anthropic's **"Outcomes"** for Managed Agents (2026-05-06) is the nearest
public analogue — 18 days later — but the analogy is loose: Outcomes is goal-definition for managed
agents, not self-modifying artifact optimization.

### 3.2 VENDOR-FIRST (stated plainly)

| Feature | Vendor date + source |
|---|---|
| Hooks | **2025-06-30**, Claude Code v1.0.38 — https://www.scriptbyai.com/claude-code-timeline/ |
| Subagents (`/agents`) | **2025-07-24** — https://www.scriptbyai.com/claude-code-timeline/ |
| Agent Skills (`SKILL.md`) | **2025-10-16**; open-standard release **2025-12-18** — https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard · https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/ · https://siliconangle.com/2025/12/18/anthropic-makes-agent-skills-open-standard/ |
| Plugins & marketplaces | **2025-10-31** — https://www.scriptbyai.com/claude-code-timeline/ |
| Agent Teams | **2026-02-05** (shipped alongside Opus 4.6; `TeammateTool` spotted feature-flagged **2026-01-26**; `TeamCreate`/`TeamDelete` removed **2026-06-15**) — https://blog.imseankim.com/claude-code-team-mode-multi-agent-orchestration-march-2026/ · https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/ |
| Auto Memory / `MEMORY.md` | **Claude Code v2.1.59, February 2026** (timeline puts it at 2026-02-26) — https://medium.com/@joe.njenga/anthropic-just-added-auto-memory-to-claude-code-memory-md-i-tested-it-0ab8422754d2 · https://blog.memoryplugin.com/claude-code-memory/ · https://www.scriptbyai.com/claude-code-timeline/ |
| Auto mode | **2026-03-24** preview → **2026-07-10** GA — https://www.scriptbyai.com/claude-code-timeline/ · https://www.anthropic.com/engineering/claude-code-auto-mode |

Note on #10/#11: WarpOS's learnings lifecycle (scored, `pending_validation`→`effective` promotion,
time-based decay) and its named-face org model are *materially different designs* from Auto Memory
and Agent Teams respectively — but they landed later, so no priority claim is available.

### 3.3 OpenAI / Codex side

Codex CLI shipped **April 2025**; Codex Cloud research preview **2025-05-16**
(https://en.wikipedia.org/wiki/OpenAI_Codex_(AI_agent)). `AGENTS.md` is Codex's static instruction
layer (32 KiB cap, silent truncation past it) — the analogue of `CLAUDE.md`, and it predates WarpOS.

**Codex hooks** (https://learn.chatgpt.com/docs/hooks — `developers.openai.com/codex/hooks` 308s
here) expose `PreToolUse, PermissionRequest, PostToolUse, PreCompact, PostCompact, UserPromptSubmit,
SubagentStop, Stop, SessionStart, SubagentStart, SessionEnd` — a near-copy of Claude Code's hook
vocabulary, and therefore *later than Anthropic's*. **The docs carry no version or release date**;
this is the main open gap on the OpenAI side. Multi-agent orchestration on Codex is delivered via
the **Agents SDK** wrapping the CLI as an MCP server
(https://developers.openai.com/codex/guides/agents-sdk) rather than as a first-class teams feature.

No OpenAI feature was found that predates a WarpOS feature in a way that changes any verdict above,
and no OpenAI equivalent of dreaming/memory-consolidation was found at all.

---

## 4. Official profiles & channels

**Verification legend:** ✅ = URL appeared directly in search results or was fetched successfully ·
⚠️ = referenced but URL not independently confirmed · ❌ = suspected impostor / do not use.

### Anthropic / Claude / Claude Code

| Platform | Handle / URL | Status |
|---|---|---|
| X — company | **@AnthropicAI** — https://x.com/AnthropicAI | ✅ |
| X — product | **@claudeai** — https://x.com/claudeai (launch announced by @AnthropicAI, https://x.com/AnthropicAI/status/1950676892937597127, ~2025-07-30). Active: most recent post checked 2026-08-26 (Claude Cowork built-in browser), 135K views. | ✅✅ browser-verified 2026-08-28 |
| X — Claude Code specific | **@ClaudeCode** — https://x.com/ClaudeCode — **DO NOT USE.** Handle exists (joined July 2025) but has **0 posts, 75 followers, no verification badge**. Dormant or squatted, **not an official channel**. Claude Code news goes out via @AnthropicAI / @claudeai. | ❌ browser-verified 2026-08-28 |
| Discord | https://discord.com/invite/anthropic — official Anthropic/Claude server, 123k+ members | ✅ |
| Reddit | r/ClaudeAI — https://reddit.com/r/ClaudeAI — **1.6M members** (corrects the "~500k" figure a secondary source gave); carries an "Official Claude Resources" section but is itself community-run | ✅ browser-verified 2026-08-28 |
| Reddit | r/Anthropic — https://reddit.com/r/Anthropic | ⚠️ community-run, not confirmed this pass |
| Reddit | r/ClaudeCode — https://reddit.com/r/ClaudeCode — **754K members**, public, **not marked official** | ✅ browser-verified 2026-08-28 (community-run) |
| GitHub | https://github.com/anthropics (incl. `anthropics/claude-code`) | ⚠️ well-known; not re-fetched this pass |
| Newsroom / blog | https://www.anthropic.com/news | ✅ (referenced as the official source by third parties) |
| Engineering blog | https://www.anthropic.com/engineering (e.g. `/claude-code-auto-mode`) | ✅ |
| Claude Code docs | https://code.claude.com/docs/en/ | ✅ fetched |
| Claude Code changelog | https://code.claude.com/docs/en/changelog | ✅ fetched |
| Claude Code "What's new" (weekly) | https://code.claude.com/docs/en/whats-new/2026-w27 | ✅ |
| API docs | https://docs.anthropic.com | ✅ |
| Agent Skills standard | https://agentskills.io | ⚠️ cited by third party, not fetched |
| LinkedIn | **https://www.linkedin.com/company/anthropicresearch/** — "Anthropic", Research Services, **~4.66M followers**, 501-1K employees | ✅ browser-verified 2026-08-28 (slug confirmed) |
| LinkedIn — showcase | **"Claude"** and **"Claude for Business"** — official showcase pages listed under the Anthropic company page | ✅ browser-verified 2026-08-28 |
| YouTube | Anthropic channel | ⛔ **could not verify — youtube.com is blocked by the browser extension's domain permissions** |
| Bluesky / Mastodon / Threads | none found | ⚠️ |

### OpenAI / Codex

| Platform | Handle / URL | Status |
|---|---|---|
| X — company | **@OpenAI** — https://x.com/OpenAI | ✅ |
| X — developers/Codex | **@OpenAIDevs** — https://x.com/OpenAIDevs ("official updates for developers building with Codex & the OpenAI Platform") | ✅ |
| X — newsroom | **@OpenAINewsroom** — https://x.com/OpenAINewsroom | ✅ |
| X — Codex specific | *none found* — Codex news via @OpenAIDevs | ⚠️ |
| X | **@open_ai** — https://x.com/open_ai | ❌ not the official account; note OpenAI's X account has been hijacked by crypto scammers before (https://www.heise.de/en/news/Again-OpenAI-s-official-Twitter-account-taken-over-by-crypto-fraudsters-9953293.html) — verify handles before citing |
| Codex docs | https://learn.chatgpt.com/docs/ (formerly developers.openai.com/codex/*, now 308-redirects) | ✅ fetched |
| Developer platform | https://developers.openai.com | ✅ |
| Blog / newsroom | https://openai.com/blog · https://openai.com/news | ⚠️ not fetched this pass |
| GitHub | https://github.com/openai (incl. `openai/codex`) | ⚠️ not re-fetched this pass |
| Reddit | r/codex — https://reddit.com/r/codex — **378K members**, public, titled "Codex coding tools by OpenAI — Codex CLI and IDE Extension"; no official designation shown | ✅ browser-verified 2026-08-28 (community-run) |
| Reddit | r/OpenAI | ⚠️ community-run, not confirmed this pass |
| Discord | OpenAI Developer Community Discord — tried `discord.com/invite/openai`; page returned no readable text (canvas/JS-only render) | ⛔ **unresolved** |
| LinkedIn | **https://www.linkedin.com/company/openai/** — "OpenAI", **~12M followers** | ✅ browser-verified 2026-08-28 (slug confirmed) |
| YouTube | OpenAI channel | ⛔ **could not verify — youtube.com is blocked by the browser extension's domain permissions** |

**Still unresolved after the 2026-08-28 browser pass:**

- **`anthropic.com/news/code-with-claude-2026`** — HTTP 404 via fetch, and **`anthropic.com` is
  blocked by the browser extension's domain permissions**, so the first-party Dreaming announcement
  page could not be reached by either route. *This is the single biggest remaining gap:* the
  vendor's own date rests on InfoQ + secondary outlets while the WarpOS side is GitHub-confirmed.
  Fixing it needs either an allowlist entry for `anthropic.com` or an operator-run fetch.
- **youtube.com** — blocked by the same domain-permission mechanism; neither vendor's channel
  verified.
- **OpenAI Discord** — `discord.com/invite/openai` rendered no extractable text.
- `blog.imseankim.com` (HTTP 403) · `pasqualepillitteri.it/en/news/3633/...` (socket hang up) —
  secondary sources only, not load-bearing.

---

## 5. How to strengthen the evidence

The dreaming claim currently rests on **author-supplied git timestamps in an unsigned commit**.
Anyone can set `GIT_AUTHOR_DATE`. Here is what would convert it into something adversarially
defensible, ordered by leverage:

1. **Recover the GitHub push timestamp for `cd37d410` / tag `warpos@0.1.4`.** GitHub's Events API
   only retains ~90 days, so this window has closed for the April commits — but **GH Archive**
   (https://gharchive.org) retains every public `PushEvent` and `CreateEvent` forever, queryable
   via BigQuery. A `PushEvent` for `cygaco/WarpOS` dated 2026-04-12 or a `CreateEvent` for tag
   `warpos@0.1.4` dated 2026-05-02, recorded by *GitHub's* clock in a third-party archive, is the
   single strongest artifact available and it is almost certainly already sitting there.
   **This is the highest-value next action.**
2. **The repo-creation timestamp is already GitHub-side and immutable**: `created_at =
   2026-03-02T19:53:12Z` from the API. It bounds the whole history from below and is not
   author-supplied.
3. **Sign future commits and tags** (GPG/SSH, `commit.gpgsign=true`). Every commit checked so far
   returns `verification.verified: false`. Signing does not fix history, but it makes every claim
   from today forward verifiable, and demonstrating the practice raises the credibility of the
   unsigned record too.
4. **Timestamp the current tree externally, now** — an OpenTimestamps (Bitcoin) attestation over
   the repo's tree hash, or a `git tag -s` plus an archived Software Heritage snapshot
   (https://archive.softwareheritage.org, which ingests public GitHub repos and records *its own*
   ingest date). Software Heritage may already hold snapshots dated well before 2026-05-06.
5. **Establish the Jobzooka pre-history.** The sleep system arrived complete in the extraction
   commit, so it was built earlier. If that repo is also on GitHub, its commit history + GH Archive
   push events would push the margin from 24 days out to something much larger. *Not done here —
   memory rule `feedback_warpos_only_no_cross_project` puts other projects off-limits without
   operator sign-off. This needs an explicit operator decision.*
6. **Find the run evidence.** `scripts/sleep-20260422-*.js` and `one-off-sleep-2026-04-25.js` prove
   the cycle *ran*, in filenames independent of git metadata. Pair them with the corresponding
   `events.jsonl` entries and `.claude/dreams/` outputs if any survive from April — an execution log
   dated before 2026-05-06 is stronger than a spec file.
7. **Pin the vendor date harder.** The canonical Anthropic URL (`anthropic.com/news/code-with-claude-2026`)
   404s. Find the real announcement page, archive it to web.archive.org, and capture the
   @AnthropicAI / @claudeai post announcing Dreaming with its timestamp. A vendor date that rests on
   InfoQ + three blogs is weaker than the WarpOS side of the same comparison.
8. **Frame it as convergent prior art, never as influence.** There is no evidence Anthropic saw this
   repo, and the claim is strictly: *WarpOS independently shipped and ran an equivalent capability
   first.* Overreaching past that is what would get the whole document dismissed.

---

## 6. Comparable products beyond Anthropic / OpenAI

Same evidence standard, wider field. **This section is where most WarpOS priority claims die**, and
that is the correct outcome — the operator's own framing ("I don't think we were first here — our
ticket system is like Linear"; "while we came after, our deep research pipeline is like Perplexity")
sets the honesty level, and applied consistently it produces **14 THEY-WERE-FIRST, 1 WARPOS-FIRST,
2 INCONCLUSIVE** out of 17 pairs.

| # | WarpOS feature | WarpOS date | Closest analog (any company) | Their launch | Verdict | Margin |
|---|---|---|---|---|---|---|
| 6.1 | Sleep cycle / REM dreaming | 2026-04-12 | **Letta — sleep-time compute** (background agent reorganizes another agent's memory in idle time; Letta 0.7.0) | **2025-04-21** | **THEY-WERE-FIRST** | **−356 d** |
| 6.2 | Memory stores + learnings lifecycle | 2026-04-12 | **MemGPT** (Letta's predecessor, tiered agent memory) | **2023-10** | **THEY-WERE-FIRST** | ~−2.5 yr |
| 6.3 | " | " | **Cursor Memories** (1.0) · **Windsurf Wave 1 memories** | 2025-06-04 · 2025-01 | **THEY-WERE-FIRST** | −~11 mo |
| 6.4 | Enforced TRACKER — epics + sprints + tickets | 2026-06-05 | **Linear** (exited private beta) · Jira (2002) · Shortcut (2014) | **2020-06** | **THEY-WERE-FIRST** | ~−6 yr |
| 6.5 | `/research:deep` multi-provider deep research | 2026-04-12 | **Gemini Deep Research** · **OpenAI deep research** · **Perplexity Deep Research** | **2024-12-11** · 2025-02-02 · **2025-02-14** | **THEY-WERE-FIRST** | **−~16 mo** |
| 6.6 | Agent faces + department org chart (PM/eng/QA roles) | 2026-04-12 | **MetaGPT** — "the multi-agent framework: first AI software company", PM/architect/engineer/QA roles | **2023-08** (arXiv 2308.00352) | **THEY-WERE-FIRST** | ~−2.7 yr |
| 6.7 | " | " | **AutoGen** (Microsoft) · **CrewAI** · **LangGraph** | 2023-09-25 · 2023-10/11 · **2024-01-08** | **THEY-WERE-FIRST** | ~−2.3 yr |
| 6.8 | Cross-provider CLI dispatch | 2026-04-16 | **OpenRouter** · **LiteLLM** (unified multi-provider routing) | **2023** | **THEY-WERE-FIRST** *(on the concept)* | ~−3 yr |
| 6.9 | Model router / dispatch console | 2026-06-01 | **OpenRouter** · **LiteLLM proxy** · Portkey | **2023** | **THEY-WERE-FIRST** | ~−3 yr |
| 6.10 | Red-team / security gauntlet lanes | 2026-04-15 | **garak** (NVIDIA) · **PyRIT** (Microsoft) · **promptfoo redteam** | **2023-06-13** · **2024-02-22** · 2023 | **THEY-WERE-FIRST** | ~−2.8 yr |
| 6.11 | `/karpathy:run` autoresearch loop | 2026-04-18 | **Sakana AI Scientist** · **DeepMind AlphaEvolve** · **ShinkaEvolve** | **2024-08** · **2025-05** · 2025-09 | **THEY-WERE-FIRST** | ~−20 mo |
| 6.12 | Skills library (encoded procedures) | 2026-03-19 | **Cursor Rules** (`.cursorrules`) · **Devin Playbooks/Knowledge** · **Windsurf rules** (Wave 1) | 2024 · 2024–25 · 2025-01 | **THEY-WERE-FIRST** | ~−1 yr |
| 6.13 | Parallel/background builders in worktrees | 2026-04-12 | **Devin** · **Cursor Background Agent** (0.50→GA 1.0) · GitHub Copilot coding agent | 2024-03 · **2025-05-15** · 2025-05 | **THEY-WERE-FIRST** | ~−11 mo |
| 6.14 | β independent second-opinion judge | 2026-04-12 | **LLM-as-a-judge** (MT-Bench et al.) · **Aider architect/editor** two-model split | 2023 · 2024 | **THEY-WERE-FIRST** *(on the concept)* | ~−2 yr |
| 6.15 | Session handoff / `DUMP.md` | 2026-03-19 (`handoff.md`) / 2026-05-18 (`session/dump`) | **Cline Memory Bank** · Roo Code | 2025 (early) | **INCONCLUSIVE** | needs exact Memory Bank date |
| 6.16 | Centralized paths registry (source→generated + guard hook) | 2026-04-16 | *none found in any product* | — | **WARPOS-FIRST** | uncontested, but this is config hygiene, not a product category |
| 6.17 | Enforcement-debt ledger | 2026-04-12 | closest: SonarQube tech-debt registers, ADR logs — none tracks *policy without an enforcer* | — | **INCONCLUSIVE** | nothing exactly comparable found |

### 6.1 detail — the one that matters

**Primary sources — cite these two, both checkable:**

| Source | URL | Date | How the date was established |
|---|---|---|---|
| Letta engineering blog, "Sleep-time Compute" (the announcement) | **https://www.letta.com/blog/sleep-time-compute/** | **2025-04-21** | Publication date read off the fetched page itself (first-party) |
| Paper, "Sleep-time Compute: Beyond Inference Scaling at Test-time" | **https://arxiv.org/abs/2504.13171** | **2025-04** | arXiv ID encodes the month: `2504` = April 2025 (first-party, immutable) |

**Letta, "Sleep-time Compute"** — published **2025-04-21**, shipped in **Letta 0.7.0**. Architecture: a dual-agent model
where a *sleep agent* activates during downtime to analyze past conversations, parse documents, and
**reorganize memory** — because "memory formation is incremental, so memories may become messy and
disorganized over time." Letta was spun out of UC Berkeley's Sky Computing Lab (Packer, Wooders);
originally released as **MemGPT in October 2023**, renamed Letta September 2024.
Corroboration: https://www.fastcompany.com/91368307/why-sleep-time-compute-is-the-next-big-leap-in-ai ·
https://forum.letta.com/t/sleeptime-agents-for-memory-consolidation-best-practices-guide/154

This is a **close** analog, not a stretched one: same problem (offline consolidation of an agent's
persistent memory), same solution shape (a separate process runs during idle time and rewrites the
memory), same biological metaphor. WarpOS's version is more elaborate (6 named phases modelled on
NREM/REM/glymphatic/SHY, operating over a scored `learnings.jsonl`) and Anthropic's is the more
automatic productization — but Letta got there first, by roughly a year.

### 6.2 Name collision — Warp (warp.dev)

**Warp** is an existing, well-funded terminal company: founded 2020, public launch April 2022,
**Warp AI April 2023**, **Warp 2.0 "the first Agentic Development Environment" 2025-06-24**
(https://en.wikipedia.org/wiki/Warp_(terminal) · https://www.warp.dev/blog/2025-in-review ·
https://www.producthunt.com/products/warp). It occupies *adjacent* territory — AI agents in a
developer terminal. "WarpOS" as a public-facing name carries a real confusion and trademark risk.
This reinforces the existing branding boundary (WarpOS is internal-only; Master Console is the
public brand) — treat it as a reason to keep that boundary, not to relax it.

### 6.3 What this section is actually good for

The honest read is not "WarpOS invented nothing." It is:

- **Almost every individual WarpOS primitive has an earlier analog somewhere.** Priority claims on
  memory, multi-agent teams, deep research, trackers, model routing, red-teaming, and autoresearch
  are all unavailable, by margins of 1–6 years.
- **The one genuine, defensible timing claim is narrow and specific:** WarpOS shipped and *ran*
  agent memory-consolidation 24 days before Anthropic announced Dreaming — while being a
  single-operator project, not a lab.
- **The defensible *originality* claim is compositional, not atomic.** No competitor combines a
  department org-chart of named agent faces + cross-provider dispatch + a sleep/dreaming
  consolidation cycle + an enforcement-debt ledger + a paths registry + validator-enforced trackers
  in one self-modifying framework. Composition and speed-of-integration are the real story; feature
  priority is not. **Claim the composition, cite the dreaming case as the single timing datapoint,
  and pre-empt the Letta comparison yourself** — an audience that finds it first discounts
  everything else.

---

## 7. Reproduction commands

```bash
# First-landed date of any path (note: the 2026-04-15 refactor moved framework/ -> .claude/,
# so query by filename pattern across all history, not by current path)
git log --diff-filter=A --format='%h %ad|%s' --date=short --reverse --name-only -- '*sleep*'

# The sleep spec as it stood on 2026-04-12
git show cd37d410:framework/commands/sleep/deep.md

# Proof the spec shipped in a public pre-announcement tag
git ls-tree -r --name-only warpos@0.1.4 | grep -i sleep
git for-each-ref --sort=creatordate --format='%(refname:short) %(creatordate:short)' refs/tags

# GitHub-side (non-author-supplied) repo creation timestamp
gh api repos/cygaco/WarpOS --jq '{private,created:.created_at}'
gh api repos/cygaco/WarpOS/commits/cd37d410 \
  --jq '{author_date:.commit.author.date,verified:.commit.verification.verified}'
```
