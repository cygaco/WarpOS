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

## 7. Dispatch, workflows, state, and the model layer

Scope addition 2. Same evidence standard. This pass went deeper into the machinery — how work is
dispatched, how lifecycles are driven, how state survives a crash — and also below the harness into
model-level features. **The result is the most one-sided section in this document: 0 of 16 pairs
come out WarpOS-first.**

### 7.1 WarpOS side — dated from git

**Dispatch**

| Capability | First landed | Path |
|---|---|---|
| Cross-provider CLI dispatch (GPT + Gemini as peer roles) | `29908188` · **2026-04-16** | `scripts/dispatch-agent.js` |
| Dispatch-route-guard hook (blocks raw CLI / API-when-CLI) | `b3a5ab06` · **2026-05-11** | `scripts/hooks/dispatch-route-guard.js` |
| Model router / dispatch console (role→provider→model→effort) | `fcaaa242` · **2026-06-01** | `.claude/commands/models/router.md` |
| Bounded Claude-dispatch wrapper (makes silent builder reap loud) | `d86eee75` · **2026-06-02** | `scripts/dispatch-claude.js` |
| `recordAgentDispatch` — fake-green guard, `ok` derived from real bytes | `392ed50b` · **2026-06-05** | `scripts/sprint/epsilon-runtime.js` |
| Evidence-bound `record-inprocess` for the Agent-tool roster | `b57aa406` · **2026-06-05** | ε runtime, Increment B |
| Completion ledger — PENDING / started / final rows | `c13e0e9c` · **2026-06-06** | `.claude/runtime/dispatch-completions.jsonl` |
| Provider breaker | `b91e1285` · **2026-06-10** | `scripts/dispatch/` |
| Foreground-aware 540 s timeout clamp + death-record-on-bound | `ad8147e5` · **2026-06-10** | dispatch wrapper (T-304) |
| Orphan reaper | `615e718d` · **2026-06-19** | `scripts/dispatch/reap-orphans.js` |
| Envelope-not-content doctrine (≤8-line envelopes) | doctrine in `CLAUDE.md` | — |

**Workflows**

| Capability | First landed | Path |
|---|---|---|
| Karpathy closed-loop autoresearch | `38d771bf` · **2026-04-18** | `.claude/commands/karpathy/run.md` |
| Sprint workflow v0.1 | `d460de4b` · **2026-05-11** | sprint skills |
| Declarative sprint hook-point registry | `ac566028` · **2026-06-02** | `.claude/agents/_org/sprint-hook-points.json` |
| Registry-driven ε lifecycle runtime (ADR-0009) | `392ed50b` · **2026-06-05** | `scripts/sprint/epsilon-runtime.js` |
| Brokered protected-ref land — controller fence + conductor lease | `9f0c6d90` · **2026-07-20** | `scripts/dispatch/trusted-controller.js`, `scripts/hooks/protected-ref-transaction.js` |
| Broker merge | `fd2fb7c2` · **2026-07-21** | `scripts/dispatch/broker-merge.js` |
| Phase-boundary judge (β) with pre-committed release rules; mutant/falsifier gauntlet evidence; fix-attempt budgets | 2026-07 (P-094 era) | `runtime/beta-consult/`, gauntlet lanes |

**State management**

| Capability | First landed | Path |
|---|---|---|
| Session handoff | `cd37d410` · **2026-04-12** | `.claude/commands/session/handoff.md` |
| Append-only events ledger + β events with `msg_id` citations | `bb06646d` · **2026-04-16** | `paths.eventsFile`, `paths.betaEvents` |
| Paths registry, source → generated | `bb06646d` · **2026-04-16** | `framework/paths.registry.json` |
| Turbo TTL grants with snapshot/restore | `684e37d2` · **2026-05-13** | `scripts/turbo/apply.js` |
| `DUMP.md` prescriptive handoff | `c305b555` · **2026-05-18** | `.claude/commands/session/dump.md` |
| Enforced TRACKER + 20-check validator, hook-enforced | `e386d70a` · **2026-06-05** | `scripts/trackers/validate.js` |
| Enforcement-debt ledger (genesis/update rows) | `cd37d410` · **2026-04-12** | `paths.enforcementDebt` |
| Learnings lifecycle (`pending_validation`→`effective`, decay) | `cd37d410` · **2026-04-12** | `paths.learningsFile` |

### 7.2 Verdict table

| # | WarpOS capability | Landed | Closest public analog | Their date | Verdict | Margin |
|---|---|---|---|---|---|---|
| 7a | Registry-driven lifecycle runtime; declarative hook-points | 2026-06-05 | **Google ADK workflow agents** — Sequential / Parallel / Loop, graph runtime with routing, fan-out/fan-in, retry, state, HITL, nested workflows | **2025-04** | **THEY-WERE-FIRST** | ~−14 mo |
| 7b | " | " | **Claude Code Dynamic Workflows** — `agent()` / `parallel()` / `pipeline()`, deterministic JS orchestration, up to 1,000 agents | **2026-05-28** | **THEY-WERE-FIRST** | −8 d |
| 7c | " | " | **CrewAI Flows** — event-driven structured workflows | **mid-2024** | **THEY-WERE-FIRST** | ~−2 yr |
| 7d | Envelope-not-content doctrine (orchestrator holds envelopes) | 2026 doctrine | **Anthropic's own orchestrator-worker pattern** — subagent context isolation; "the orchestrator receives only the result, not the intermediate reasoning trace" | **2025-04** (Research) / **2025-06** (engineering post) | **THEY-WERE-FIRST** | ~−1 yr |
| 7e | In-process roster dispatch with evidence-bound completion | 2026-06-05 | Claude Code **Subagents**; **Codex Subagents GA**; **Codex Multi-Agent v2** (CLI v0.137) | 2025-07-24 · 2026-03 · **2026-06-04** | **THEY-WERE-FIRST** | ~−11 mo |
| 7f | Cross-provider CLI routing via role registry | 2026-04-16 | **A2A protocol** — cross-vendor agent discovery + coordination (→ Linux Foundation 2025-06) | **2025-04** | **THEY-WERE-FIRST** *(on the concept)* | ~−12 mo |
| 7g | Completion ledger — PENDING vs started vs final; death records | 2026-06-06 | **Job-queue heartbeat + reaper** — `resque_worker_heartbeat`, `delayed_job_heartbeat_plugin`, Solid Queue; stale-claim detection is standard practice | ~2012 onward | **THEY-WERE-FIRST** | ~−10 yr |
| 7h | Orphan reaper | 2026-06-19 | Same lineage — supervisor prunes expired heartbeats, marks claimed jobs failed | ~2012 onward | **THEY-WERE-FIRST** | ~−10 yr |
| 7i | Controller fence + conductor lease on protected refs | 2026-07-20 | **Fencing tokens + leases** — Kleppmann, "How to do distributed locking"; leases from Gray & Cheriton (1989) | **2016-02** | **THEY-WERE-FIRST** | ~−10 yr |
| 7j | Durable, resumable lifecycle across crashes | 2026-06-05 | **LangGraph checkpointers** — per-superstep state, threads, time travel, HITL, durable execution | **2024** | **THEY-WERE-FIRST** | ~−2 yr |
| 7k | " | " | **Temporal** durable execution (OpenAI Agents SDK integration GA 2026-03-23) | 2019 → 2026-03 | **THEY-WERE-FIRST** | — |
| 7l | Session checkpoint / resume | 2026-04-12 | **Gemini CLI checkpointing** (snapshot before tool edits, instant revert); Claude Code rewind | **2025-06** | **THEY-WERE-FIRST** | ~−10 mo |
| 7m | Events ledger with citable ids (agent tracing) | 2026-04-16 | **LangSmith** (2023) · **Langfuse** agent tracing (2024-07) · OpenAI Agents SDK built-in tracing (2025-03-11) | **2023** | **THEY-WERE-FIRST** | ~−3 yr |
| 7n | Learnings lifecycle / memory promotion | 2026-04-12 | **Claude memory tool + context editing** (API, beta) | **2025-09-29** | **THEY-WERE-FIRST** | ~−6 mo |
| 7o | Turbo TTL grants; permission pre-authorization | 2026-05-13 | **OpenAI Agents SDK guardrails**; Claude Code auto mode | 2025-03-11 · 2026-03-24 | **THEY-WERE-FIRST** | ~−14 mo |
| 7p | Per-role effort/model selection | 2026-06-01 | **Extended thinking** (2025-02-24) · **Gemini thinking budgets** (2025-04-17) · **GPT-5 `reasoning_effort`** (2025-08-07) | **2025-02-24** | **THEY-WERE-FIRST** | ~−15 mo |

**Tally: 16 pairs — 0 WARPOS-FIRST, 16 THEY-WERE-FIRST.**

### 7.3 The model layer

The operator asked to look at how the models work, not just the harness. Three things are worth
recording because they change what a "WarpOS invented this" claim can even mean:

- **Dreaming is not purely a harness feature.** Anthropic announced it as a capability of **Managed
  Agents** (2026-05-06) — server-side, scheduled, emitting a reviewable diff — with the Claude Code
  `/dream` command as the surfaced end of it. WarpOS's `/sleep:deep` is a *prompt-and-script*
  procedure the model executes; Anthropic's runs as managed infrastructure. Same problem, different
  layer. That difference doesn't weaken the timing claim, but it does mean the two are not the same
  artifact.
- **Persistent agent memory moved into the API, not just the CLI.** The **memory tool + context
  editing** shipped 2025-09-29 on the Claude Developer Platform (also Bedrock and Vertex), which
  predates WarpOS's learnings lifecycle and makes memory a model-platform primitive rather than a
  framework invention.
- **Effort/thinking control was a model-level knob before WarpOS routed on it.** Extended thinking
  with a configurable thinking budget shipped 2025-02-24; Gemini's thinking budgets 2025-04-17;
  GPT-5's `reasoning_effort` 2025-08-07. WarpOS's dispatch console *routes* across those knobs — it
  did not invent them.

### 7.4 Where WarpOS is genuinely distinctive — the honest answer is: not at the mechanism level

The brief asked for a distinctiveness paragraph **only if no earlier analog turned up after a real
search**. I searched for all five candidates. **Every one has a well-established earlier analog, so
no claim survives.** What I searched and what came back:

| Candidate | What I searched | Earlier analog found |
|---|---|---|
| Pre-committed release rules minted by an in-team judge before results exist | preregistration + AI-agent evaluation + post-hoc threshold tuning | **Preregistration** — decades old in clinical trials and psychology, and now explicitly ported to agents: *Preregistration for Experiments with AI Agents*, [arXiv:2606.11217](https://arxiv.org/abs/2606.11217), which names the exact failure mode (outcome-contingent redesign, specification search) and prescribes ex-ante success criteria |
| Mutant/falsifier gauntlet evidence ("observed RED on mutation") | mutation testing + false-green / perpetually-green test suites | **Mutation testing** — concept from 1971, mainstream via [pitest](https://github.com/hcoles/pitest) and [Thoughtworks Radar](https://www.thoughtworks.com/radar/techniques/mutation-testing); catching "perpetually green" tests that pass regardless of logic changes is its textbook purpose |
| Fenced protected-ref broker with conductor lease | fencing token + lease + distributed lock safety | **Fencing tokens** — [Kleppmann, 2016-02](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html): monotonically increasing token, resource rejects any lower token. Leases go back to Gray & Cheriton (1989) |
| PENDING-vs-death ledger discrimination | job queue heartbeat + dead worker + stale claim reaper | **Heartbeat + reaper** — `resque_worker_heartbeat`, `delayed_job_heartbeat_plugin`, Rails Solid Queue; "no heartbeat for N seconds = worker is dead, mark claimed jobs failed" is standard job-queue practice |
| Envelope doctrine (orchestrator holds envelopes, not content) | subagent context isolation + orchestrator receives only the result | **Anthropic's own** [multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — the orchestrator receives the result, not the intermediate reasoning trace; shipped in Research, April 2025 |

**What this actually says.** WarpOS's dispatch, workflow and state layers are a competent import of
mature distributed-systems and software-engineering patterns — fencing tokens, leases, heartbeat
reapers, mutation testing, preregistration, durable checkpointing — into an agent-orchestration
context. That is good engineering and a real reason to trust the system. It is **not** prior art,
and it should never be pitched as invention. The composition argument from §6.3 remains the only
defensible originality claim, and this section narrows even that: the *parts* are all borrowed, and
knowingly so.

---

## 8. Thought · work · self-assessment loops — WarpOS vs the research lineage

The operator's theory, verbatim: *"ai models basically improve through thought, work, and
self-assessment loops. some of which i built into warpos."* Per the priority rule, each row leads
with the **Anthropic/OpenAI** comparison; the research lineage follows as context.

### 8.1 Loop inventory and verdicts

| Loop | WarpOS (hash · date) | Anthropic / OpenAI closest | Their date | Verdict | Also (research lineage) |
|---|---|---|---|---|---|
| Reasoning frameworks + fix-quality scoring (0–4) + reasoning traces | `cd37d410` · **2026-04-12** | **Claude extended thinking** w/ budget · **OpenAI o1** test-time reasoning | 2025-02-24 · 2024-09 | **VENDOR-FIRST** | Chain-of-thought (Wei et al., [2201.11903](https://arxiv.org/abs/2201.11903), 2022-01); self-consistency (2022-03); Tree of Thoughts (2023-05) |
| Learnings lifecycle — `pending_validation`→`effective`→decay | `cd37d410` · **2026-04-12** | **Claude memory tool + context editing** · Claude Code auto memory | **2025-09-29** · 2026-02 | **VENDOR-FIRST** | MemGPT (2023-10); Voyager skill library ([2305.16291](https://arxiv.org/abs/2305.16291), 2023-05) |
| Sleep / dream consolidation (`/sleep:*`) | `cd37d410` · **2026-04-12** | **Anthropic Dreaming** (Managed Agents) | **2026-05-06** | **WARPOS-FIRST** · +24 d | Letta sleep-time compute 2025-04-21 → they-were-first industry-wide (§6.1) |
| β independent judge + β self-correction (`beta:mine` / `beta:integrate`) | `cd37d410` · **2026-04-12**; integrate `e0f25200` · 2026-04-16 | **Constitutional AI** critique/revision model · Claude Code `/code-review`, `security-review` | **2022-12** · 2025-10 | **VENDOR-FIRST** | LLM-as-a-judge / MT-Bench (2023-06); Self-Rewarding LMs ([2401.10020](https://arxiv.org/abs/2401.10020), 2024-01) |
| Retro → `/learn:integrate` → promotion into enforcers | `6779f6e6` · **2026-05-01** | Claude Code **auto memory** (captures learnings automatically) | **2026-02** | **VENDOR-FIRST** | Reflexion ([2303.11366](https://arxiv.org/abs/2303.11366), 2023-03); Self-Refine ([2303.17651](https://arxiv.org/abs/2303.17651), 2023-03); Generative Agents reflection (2023-04) |
| ops-analyst ("learner") — cycle-level environment adjustment | `a071e801` · **2026-06-07** (as `learner` `6779f6e6` · 2026-05-01) | **Anthropic "Outcomes"** for Managed Agents | **2026-05-06** | **VENDOR-FIRST** | STaR self-taught reasoner ([2203.14465](https://arxiv.org/abs/2203.14465), 2022-03) |
| Karpathy autoresearch loop — metric-driven self-optimization of agent specs | `38d771bf` · **2026-04-18** | **Anthropic "Outcomes"** | **2026-05-06** | **WARPOS-FIRST** · +18 d | Sakana AI Scientist (2024-08); AlphaEvolve (2025-05) → they-were-first (§6) |
| Gauntlet fix-cycles with mutant/falsifier evidence + fix-attempt budgets | 2026-07 | Claude Code `/code-review`; OpenAI evals graders | 2025-10 · 2024 | **VENDOR-FIRST** | Mutation testing (1971; pitest) — §7.4 |
| Enforcement-debt ledger — "every policy names its enforcer" | `cd37d410` · **2026-04-12** | *No vendor equivalent* | — | **WARPOS-FIRST** (uncontested) | Nothing exactly comparable found |
| Oneshot state machine with cycles + points | `cd37d410` · **2026-04-12** | **Claude Code Dynamic Workflows** | 2026-05-28 | **WARPOS-FIRST** · +46 d | LangGraph (2024) → they-were-first |

**Tally: 10 loops — 3 WARPOS-FIRST vs Anthropic/OpenAI, 7 VENDOR-FIRST.** Against the research
lineage, essentially all of them are decades or years late; the loop *ideas* are the most
thoroughly prior-arted material in this entire document.

### 8.2 Assessing the theory against the literature

**Where the theory is well supported.** The strongest form is training-time: **RL on verifiable
rewards** demonstrably improves models — OpenAI's o1 (2024-09) and DeepSeek-R1
([2501.12948](https://arxiv.org/abs/2501.12948), 2025-01) show large reasoning gains from
optimizing against checkable outcomes, and **STaR** (2022-03) showed a model bootstrapping its own
reasoning traces years earlier. **Constitutional AI / RLAIF** (2022-12) is the canonical
self-assessment loop that actually changed weights. And **memory consolidation** as a mechanism is
now shipped product on both sides (Letta 2025-04, Anthropic Dreaming 2026-05).

**Where it is contested.** *Intrinsic* self-correction — a model improving its own answer with no
external signal — is the weak link. Huang et al., **"Large Language Models Cannot Self-Correct
Reasoning Yet"** ([2310.01798](https://arxiv.org/abs/2310.01798), ICLR 2024), found LLMs struggle
to self-correct without external feedback, and specifically critiques Reflexion and Self-Refine on
that basis. Gains from those methods are real but bounded, and they depend heavily on having a
*verifier* — which is exactly why WarpOS's gauntlets, mutant evidence and enforcers matter more
than its reflection prompts.

**The load-bearing caveat.** *Harness loops do not update model weights.* Nothing in WarpOS
improves Claude. The improvement lives entirely in the **scaffold and the memory** — better
context, better procedures, accumulated learnings, enforcers that catch regressions. That is a real
and valuable kind of improvement, but it is a *system* getting better, not a *model* getting
better. Stating the theory as "AI models improve through these loops" overclaims; "an AI **system**
improves through these loops, and models improve through the training-time versions of them" is
both defensible and still interesting.

**What WarpOS's own telemetry could measure to test it.** The framework already emits enough to
falsify or support the claim, and nobody has run the numbers:

1. **Learnings validated ratio over time** — of learnings reaching `effective`, what share survive
   90 days without being contradicted? A rising ratio is evidence the consolidation loop works; a
   flat one says the loop is bookkeeping.
2. **β self-correction rate** — how often does `beta:mine` → `beta:integrate` change a later β
   verdict in the direction the operator actually chose? That is the proxy-accuracy curve.
3. **Gauntlet pass-rate per fix attempt** — if attempt 1 → 2 → 3 pass rates aren't improving across
   sprints, the fix loop isn't learning, it's just retrying.
4. **Enforcement-debt burn-down vs recurrence** — do closed debts stay closed? Recurrence means the
   enforcer, not the policy, was the gap.

**Honest bottom line:** the theory is directionally right about the *mechanism class* and wrong
about the *locus*. WarpOS did not invent any of these loops — the vendor and the literature got to
all of them first, with the two 18–24-day exceptions above — but it does instrument them unusually
well, and it is one of the few setups that could actually measure whether they pay off.

---

## 9. Cross-session messaging, session management & crash recovery

The operator's claim, verbatim: *"recently Anthropic published that you can run two sessions
together. they use a shared inbox. I built that a long time ago!"* **This claim checks out, and it
is the largest verified margin in this document.**

### 9.1 The cross-session inbox — WarpOS by 117 days

| | WarpOS | Anthropic |
|---|---|---|
| Feature | `/session:write` — "post a message to the cross-session inbox so other Alex sessions can see it"; `/session:read` — "read the cross-session inbox" | Cross-session `SendMessage` + `ListAgents` — "Claude Code sessions can now message each other, on any of your machines, with `ListAgents` to discover them (macOS and Linux)" |
| First landed | `cd37d410` · **2026-04-12** (`.claude/commands/session/write.md`, `read.md` — present in the framework-extraction commit, so built earlier still) | **v2.1.224** · **2026-08-07** |
| Evidence | git `--diff-filter=A`; the string `cross-session` first appears in the same commit | Official `anthropics/claude-code` **CHANGELOG.md**, fetched server-side and scanned in version order — earliest occurrence of both `cross-session` and `ListAgents` is v2.1.224 |

**Verdict: WARPOS-FIRST · +117 days.** Method note: I pulled the complete CHANGELOG (587,814 bytes,
covering v0.2.21 → v2.1.251) via the GitHub contents API and walked it in version order, so "first
appearance" is a mechanical result rather than a recollection. Related vendor milestones, all of
which are *within-session* team mailboxes rather than cross-session:

- **v2.1.32** — agent teams research preview, multi-agent collaboration (2026-02-05). Teammates
  share a task list and message each other, but only inside one session's team.
- **v2.1.178** — `TeamCreate`/`TeamDelete` removed; every session gets one implicit team (2026-06-15).
- **v2.1.207** — first `mailbox` mention (a crash-loop fix on malformed teammate mailbox messages).
- **v2.1.224** — cross-session `SendMessage` + `ListAgents`, plus `crossSessionInbound` /
  `dialogExpiry` settings holding messages for approval (**2026-08-07**).
- **v2.1.236** — `notify_when_idle` added to cross-session `SendMessage`.

**Caveats, stated plainly.** The two designs are not identical: WarpOS's is a *file-backed broadcast
board* — a session posts, other sessions read when they choose. Anthropic's is *addressed,
discoverable, cross-machine peer messaging* with delivery, approval gating and idle notifications.
WarpOS built the simpler thing first; Anthropic built the harder thing later. The priority claim is
sound, and overstating it as "we built SendMessage" is not.

**Industry (secondary):** no earlier analog found in the coding-agent space — Devin, Cursor
background agents and Codex multi-agent all coordinate *within* a session or task tree, not between
independent user sessions. tmux-style multi-session buses exist as user-built glue, but nothing
productized that I could date earlier.

### 9.2 Session management commands — vendor-first, decisively

Every core session primitive predates WarpOS's entire history, most by more than a year. All dates
from the official CHANGELOG scan.

| Capability | WarpOS | Anthropic (Claude Code) | Verdict |
|---|---|---|---|
| Resume / continue a conversation | `/session:resume` `cd37d410` · 2026-04-12 | **`claude --continue` / `--resume`** — **v0.2.93** (2025) | **VENDOR-FIRST** |
| Resume picker | " | **`/resume`** — **v1.0.27** (2025) | **VENDOR-FIRST** |
| Undo / rewind conversation + code | — | **`/rewind`** — **v2.0.0** (2025-09-29) | **VENDOR-FIRST** |
| Context compaction | — | **auto-compact** — **v0.2.98** (2025) | **VENDOR-FIRST** |
| Session-start hook | `mode-set.js` posture banner `6779f6e6` · 2026-05-01 | **`SessionStart` hook** — **v1.0.62** (2025) | **VENDOR-FIRST** |
| Session-end hook | `/session:end` `bf894984` · 2026-06-01 | **`SessionEnd` hook** — **v1.0.85** (2025) | **VENDOR-FIRST** |
| Export / share a conversation | `/session:recap` `6779f6e6` · 2026-05-01 | **`/export`** — **v1.0.44** (2025) | **VENDOR-FIRST** |
| Fork a session | — | **`--fork-session`** — **v2.0.73** | **VENDOR-FIRST** |
| Background tasks | — | **`&` background tasks** — **v2.0.45** | **VENDOR-FIRST** |
| **Prescriptive handoff document** | **`/session:dump` → `DUMP.md`** `c305b555` · **2026-05-18** — context, verbatim payloads, dispatch instructions *and anti-instructions*, for a fresh session to read once and execute | No vendor equivalent. `/export` shares a transcript; auto-memory accumulates facts; neither produces an executable next-session brief | **INCONCLUSIVE — narrowly WarpOS-distinct** |
| **Cognitive-chain session wrap** | **`/session:end`** `bf894984` · **2026-06-01** — learn/mine/sleep → integrate → validate TRACKER → handoff → land → fresh branch | No vendor equivalent | **INCONCLUSIVE — narrowly WarpOS-distinct** |

**Other vendors (secondary):** OpenAI Codex `resume` and session logs; Gemini CLI `/chat save|resume`
plus checkpointing (2025-06). Both also predate or match the WarpOS equivalents.

### 9.3 Crash recovery — vendor-first on primitives, no claim available

| Class | WarpOS | Anthropic / OpenAI | Their date | Verdict |
|---|---|---|---|---|
| Session checkpoint | `/session:checkpoint` + `.session-checkpoint.json` `cd37d410` · 2026-04-12 — "captures conversation context and tool activity that git alone cannot recover" | Claude Code **auto-checkpoints + `/rewind`** (v2.0.0) | **2025-09-29** | **VENDOR-FIRST** |
| " | " | **Gemini CLI checkpointing** — snapshot before tool edits, instant revert *(industry)* | 2025-06 | **THEY-WERE-FIRST** |
| Resume after crash | `/session:resume` priority load: DUMP → handoff → checkpoint → TRACKER | **`--continue` / `--resume`**; `SessionStart` hook resume context | **v0.2.93** (2025) | **VENDOR-FIRST** |
| Live git-ground-truth handoff | `handoff-live.js` `6f5b7f07` · 2026-06-08 | No direct equivalent; auto-memory is the nearest | 2026-02 | **INCONCLUSIVE** |
| Crash-safe loop state | `/sprint:execute` crash-safe progress `d460de4b` · 2026-05-11 | **Claude Code Dynamic Workflows** (resumable runs) | 2026-05-28 | **WARPOS-FIRST** · +17 d |
| " | " | **LangGraph checkpointers** / Temporal durable execution *(industry)* | 2024 | **THEY-WERE-FIRST** |
| Dead-dispatch detection | Completion ledger PENDING-vs-final, `shape`, 540 s clamp `c13e0e9c`/`ad8147e5` · 2026-06 | No vendor equivalent at this layer | — | **THEY-WERE-FIRST** vs job-queue heartbeat/reaper (~2012) — §7.4 |
| Orphan reaping | `reap-orphans.js` `615e718d` · 2026-06-19 | — | — | **THEY-WERE-FIRST** (same lineage) |
| Verify-don't-inherit drift check | `tracker-reality-drift.js` `a74ed329` · 2026-06-16 | No vendor equivalent | — | **INCONCLUSIVE** |
| Team reconciliation on resume | `adhoc-team-hygiene.js` `03cf48cd` · 2026-05-26 | Agent teams (v2.1.32, 2026-02-05) predate it; implicit teams v2.1.178 | 2026-02-05 | **VENDOR-FIRST** |

---

## 10. β — the operator's proxy judgment, and digital-twin agents

**β** (`.claude/agents/president/beta.md`, in the extraction commit `cd37d410` · **2026-04-12**;
judgement model `25ce1750` · 2026-04-15; `beta:mine` **2026-04-12**; `beta:integrate` `e0f25200` ·
**2026-04-16**; decision policy `6779f6e6` · 2026-05-01) "simulates user judgment for autonomous
decision-making… read-only, fast, precedent-aware", returning DECIDE / DIRECTIVE / ESCALATE.

### 10.1 Verdicts — vendor first, then industry

| Aspect of β | Anthropic / OpenAI closest | Their date | Verdict | Also (industry / research) |
|---|---|---|---|---|
| A model that critiques and judges another model's output against written principles | **Constitutional AI** — critique-and-revision against a written constitution; RLAIF | **2022-12** | **VENDOR-FIRST** · ~3.3 yr | LLM-as-a-judge / MT-Bench (2023-06) |
| A read-only reviewer agent gating work | Claude Code **`/code-review`**, **`security-review`** skills | 2025-10 | **VENDOR-FIRST** | — |
| Goal/criterion arbitration for an autonomous agent | Anthropic **Managed Agents "Outcomes"**; OpenAI evals graders | 2026-05-06 · 2024 | **VENDOR-FIRST** | — |
| An agent that stands in for the human user | *No first-party vendor equivalent* | — | **THEY-WERE-FIRST (industry)** | **AutoGen `UserProxyAgent`** — "conceptually a proxy agent for humans", **2023-09**; **CAMEL** role-play AI-user agent ([2303.17760](https://arxiv.org/abs/2303.17760), **2023-03**); LLM user simulators for dialogue eval ([2402.13374](https://arxiv.org/abs/2402.13374), 2024-02) |
| A digital clone trained on one person's corpus | — | — | **THEY-WERE-FIRST (industry)** | **Delphi** (founded 2022-12, launched **2023**) — clone from your emails, transcripts, podcasts; **Personal AI** (founded **2020**) personal language models; **Reid AI** (**2024**) — GPT-4 trained on 20 years of Hoffman's content |
| Precedent-aware judgment (P-nnn ledger) | — | — | **THEY-WERE-FIRST** · decades | **Case-based reasoning** in legal AI — Ashley et al., *stare decisis* modelling, **1980s–90s** |
| One identity in several modes (α/β/γ/δ/ε "faces") | Claude Code **`--agent` roles / subagents** | 2025-07-24 | **VENDOR-FIRST** | Cursor modes; Devin persona |

### 10.2 Is anything about β distinctive? What I searched, and the honest answer

I searched: *AutoGen UserProxyAgent / human proxy agent*, *CAMEL role-playing agents*, *LLM user
simulator for dialogue evaluation*, *digital clone / digital twin products (Delphi, Personal AI,
Reid AI)*, *Constitutional AI critique model*, *LLM-as-judge*, *case-based reasoning and precedent*,
and (from §7.4) *preregistration for AI-agent experiments*.

**Every individual component is prior art:**

- *Simulating the user* → AutoGen's `UserProxyAgent` (2023-09) is literally a proxy for the human.
- *Learning a specific person's judgment from their corpus* → Delphi and Personal AI productized
  this in 2023 and earlier; Reid AI in 2024.
- *Judging against written principles* → Constitutional AI, 2022-12.
- *Precedent-based reasoning* → case-based reasoning, 1980s.
- *Pre-committed criteria* → preregistration; see §7.4.

**What I could not find an exact analog for** — stated as an observation, not a claim: a read-only
proxy of one *named principal* that (a) arbitrates live decisions for an autonomous system rather
than impersonating the principal for an audience, (b) refines itself by mining that principal's own
recorded decisions (`beta:mine` → `beta:integrate`), (c) is bound to cite a `msg_id`-backed ledger
row so a claimed verdict is auditable, and (d) must pre-commit release criteria before results
exist. The digital-clone products do (b) but aim at *presence and impersonation*, not decision
arbitration; the reviewer/judge agents do (a) but are generic, not a model of a specific person and
not self-refining from that person's history.

**Verdict: INCONCLUSIVE, leaning they-were-first.** The *combination* looks unusual and I found
nothing doing exactly it — but "I searched and didn't find it" is weak evidence in a field this
crowded, and every part is demonstrably older. This should be described as an unusual composition,
never as an invention. The one β property I'd flag as genuinely load-bearing is the **auditability
rule** (a β verdict only counts if it cites a persistent-teammate ledger row) — that is an enforcer,
and per §7.4 enforcers are where this framework's real, if unpatentable, value sits.

---

## 11. Skill sweep — 237 skills in 35 families

A companion pass (SkillSweep) walked **every** skill in `.claude/commands` rather than the ~50
capabilities sampled above, and graded each family against its closest Anthropic/OpenAI analog.
Full detail: **`runtime/prior-art/SKILL-SWEEP-2026-08-28.md`** (108 KB) and
**`runtime/prior-art/skill-sweep.json`** (137 KB, schema `warpos.skill-sweep/1`).

**Totals.** 237 skills = **230 live + 7 deprecated aliases**, in **35 families**.

| Level | THEY-WERE-FIRST | WARPOS-FIRST | INCONCLUSIVE | N/A-COMPOSITE |
|---|---|---|---|---|
| **Families** (35) | **30** | 3 | 1 | 1 |
| **Skills** (237) | **204** | 13 | 2 | 18 |

The exhaustive pass confirms the sampled one: **~86% of families and ~86% of skills have an earlier
analog.** Widening the aperture from 50 capabilities to 237 skills did not surface new priority
claims — it surfaced one new *uncontested* pair (guides/knowledge integration) and otherwise
reinforced the same conclusion.

### 11.1 Family table

Sorted by verdict, then name. Anthropic/OpenAI analog leads per the priority rule; industry analogs
live in the sweep files.

| Family | Skills | First landed | Primary Anthropic/OpenAI analog | Their date | Verdict | Margin |
|---|---|---|---|---|---|---|
| `enforcement-debt` | 5 | 2026-04-12 | `claude plugin eval` (evaluates plugins, not unenforced policy) | 2026 | **WARPOS-FIRST** | uncontested — no analog found in any product |
| `paths-registry` | 6 | 2026-05-01 | — | — | **WARPOS-FIRST** | uncontested — no analog found |
| `sleep-dream` | 2 | 2026-04-12 | Anthropic Dreaming (Managed Agents) | 2026-05-06 | **WARPOS-FIRST** | +24 d vs Anthropic (+4 d on the public tag) · −356 d vs Letta |
| `cross-session-inbox` | 2 | 2026-04-12 | Claude Code Agent Teams SendMessage (in-session, session-scoped) | 2026-02-05 | **INCONCLUSIVE** *(superseded — see §11.3)* | — |
| `warpos-distribution-integrity` | 18 | 2026-05-04 | — | — | **N/A-COMPOSITE** | — |
| `admin-panels-cockpit` | 10 | 2026-06-13 | — | — | THEY-WERE-FIRST | ~−7 yr |
| `agent-roster` | 5 | 2026-05-04 | Claude Code Subagents (`/agents`) | 2025-07-24 | THEY-WERE-FIRST | ~−9 mo |
| `beta-judgment` | 3 | 2026-04-12 | Claude Code `/code-review`, `security-review` | 2025-10-16 | THEY-WERE-FIRST | ~−2 yr |
| `bootstrap-onramp` | 3 | 2026-05-25 | — | — | THEY-WERE-FIRST | ~−1.5 yr |
| `commit-land` | 4 | 2026-04-12 | Claude Code git integration; Copilot commit messages | 2025 | THEY-WERE-FIRST | ~−1 yr |
| `docs-maps-discovery-reporting` | 18 | 2026-04-12 | — | — | THEY-WERE-FIRST | ~−9 yr |
| `enforced-trackers` | 2 | 2026-06-05 | Agent-teams shared task list; TodoWrite | 2026-02-05 | THEY-WERE-FIRST | ~−6 yr |
| `epic-tracking` | 10 | 2026-06-09 | Agent-teams shared task list | 2026-02-05 | THEY-WERE-FIRST | ~−6 yr |
| `events-telemetry` | 2 | 2026-05-04 | OpenAI Agents SDK built-in tracing | 2025-03-11 | THEY-WERE-FIRST | ~−3 yr |
| `growth-marketing` | 10 | 2026-05-01 | — | — | THEY-WERE-FIRST | ~−4.5 yr |
| `guides-knowledge` | 6 | 2026-05-31 | Agent Skills / plugin skills as the delivery shape | 2025-10-16 | THEY-WERE-FIRST | ~−1.5 yr on doc-into-agent-context |
| `hooks-mgmt` | 5 | 2026-04-12 | Claude Code hooks (v1.0.38) | 2025-06-30 | THEY-WERE-FIRST | −262 d |
| `issue-register` | 6 | 2026-04-12 | — | — | THEY-WERE-FIRST | ~−17 yr on the concept |
| `karpathy-autoresearch` | 3 | 2026-04-18 | Anthropic Outcomes / capability curves | 2026-05-06 | THEY-WERE-FIRST | ~−20 mo industry-wide (but **+18 d vs Anthropic alone**) |
| `memory-learning` | 7 | 2026-04-12 | Auto Memory / `MEMORY.md`; memory tool + context editing | 2026-02 / 2025-09-29 | THEY-WERE-FIRST | ~−2.5 yr |
| `model-routing-dispatch` | 8 | 2026-05-18 | Claude Code fallback model chains (within-provider) | ~2026-06 | THEY-WERE-FIRST | ~−3 yr |
| `modes-teams` | 6 | 2026-04-12 | Claude Code Agent Teams (with Opus 4.6) | 2026-02-05 | THEY-WERE-FIRST | ~−2.7 yr |
| `oneshot-build` | 4 | 2026-04-12 | Claude Code background / headless agents | 2025 | THEY-WERE-FIRST | ~−2 yr |
| `permissions-turbo` | 4 | 2026-05-13 | Claude Code auto mode (permission classifier) | 2026-03-24 | THEY-WERE-FIRST | −50 d vs auto mode |
| `portfolio-multiproduct` | 8 | 2026-05-22 | — | — | THEY-WERE-FIRST | ~−6 yr |
| `qa-redteam-security` | 8 | 2026-04-12 | `security-review` skill · code-vulnerability scanner | 2025-10 · 2026-05-06 | THEY-WERE-FIRST | ~−2.8 yr |
| `reasoning-frameworks` | 6 | 2026-04-12 | Claude extended thinking · plan mode | 2025-02-24 | THEY-WERE-FIRST | ~−15 mo (model layer); decades (the frameworks) |
| `research` | 2 | 2026-04-12 | OpenAI deep research | 2025-02-02 | THEY-WERE-FIRST | ~−16 mo |
| `roadmap` | 8 | 2026-05-19 | — | — | THEY-WERE-FIRST | ~−3 yr |
| `session-state-handoff` | 8 | 2026-04-12 | `/resume`, checkpoints/rewind (v2.0) | 2025-09-29 | THEY-WERE-FIRST | ~−10 mo |
| `skills-meta` | 9 | 2026-04-12 | Agent Skills (`SKILL.md`) · `/skill-doctor` · `claude plugin eval` | 2025-10-16 · 2026 | THEY-WERE-FIRST | ~−1 to −3 yr |
| `sprint-lifecycle` | 13 | 2026-04-16 | Claude Code Dynamic Workflows | 2026-05-28 | THEY-WERE-FIRST | ~−14 mo |
| `system-health-scans` | 4 | 2026-04-16 | Claude Code `/doctor` | 2025 | THEY-WERE-FIRST | ~−9 to −19 yr |
| `ui-design-review` | 2 | 2026-04-15 | Claude Code + Playwright MCP visual review | 2025 | THEY-WERE-FIRST | ~−9 yr |
| `warp-distribution` | 20 | 2026-03-19 | Claude Code plugins & marketplaces | 2025-10-31 | THEY-WERE-FIRST | −168 d vs plugins; ~−6 yr vs scaffolders |

### 11.2 The five strongest cases from the sweep

1. **`sleep-dream`** — the flagship, reused from §2. +24 d vs Anthropic, −356 d vs Letta.
2. **`enforcement-debt`** (5 skills) — uncontested; no analog found in any product. Consistent with
   §7.4, where it was the only candidate that survived the distinctiveness search.
3. **`paths-registry`** (6 skills) — uncontested but **self-deflating**, and the sweep says so: it is
   configuration hygiene, not a product category, and a weak thing to claim publicly.
4. **`/guides:integrate` + `/knowledge:integrate`** (2026-05-31 / 2026-06-05) — **the one genuinely
   new finding.** The obvious analogs (Cursor `@Docs`, Devin Knowledge, Backstage TechDocs) all
   *index* documentation for retrieval. These instead **place** a document at a *declared anchor
   inside named consumer agent specs* and record every placement in a JSONL ledger. No analog found.
   Note the shape: it is another **enforcer** — a placement ledger makes a missing wiring
   self-detecting — which is the same pattern §7.4 identified as this framework's real value.
5. **`cross-session-inbox`** — see the reconciliation immediately below.

### 11.3 Reconciliation — the cross-session verdict

**The two passes disagree, and §9 wins.** SkillSweep graded `cross-session-inbox` **INCONCLUSIVE**
by comparing it against **Agent Teams `SendMessage` (2026-02-05)**, which predates WarpOS. But that
feature is *in-session*: teammates inside one session's team, and the mailbox dies with the session.
The correct comparand is Claude Code's **cross-session `SendMessage` + `ListAgents`, first shipped
in v2.1.224 on 2026-08-07** — established in §9.1 by walking the complete official CHANGELOG in
version order.

**Against the right feature the verdict is WARPOS-FIRST by 117 days.** SkillSweep's secondary
industry findings still stand and are worth keeping: LangChain's **Agent Inbox** (2025-01-14) is a
*human* inbox for reviewing agent output, and **A2A** is inter-vendor RPC — neither is a
session-to-session broadcast board. Treat §9.1 as the authoritative verdict for this family; the
sweep's row is superseded, not wrong about its own (narrower) comparison.

### 11.4 The N/A-COMPOSITE note

**`warpos-distribution-integrity`** (18 skills — the `scan:warpos-*` family) is graded
**N/A-COMPOSITE** rather than given a verdict, and that is the honest call: these skills verify
*WarpOS's own* distribution invariants — capsule resolvability, manifest honesty, layer diffs,
migration coverage, version quorum. There is no external analog because there is no external
artifact to compare against; they are self-referential integrity checks for one specific framework.
Counting them as "WarpOS-first" would be meaningless, and counting them as "they-were-first" would
be false. They are excluded from both totals, which is why 18 skills sit outside the verdict split.

---

## 12. Reproduction commands

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
