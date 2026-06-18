# DreamTeams Multi-Runtime Agent Compiler — Claude Deep Research Report

_Engine: Claude (contrarian / verification). Research dates: 21 May 2026. Three rounds, ~25 WebSearches, ~10 WebFetches._

## Executive Summary

The DreamTeams thesis is **plausible but structurally squeezed**. The 2026 evidence shows real demand (the "vibe coder" segment is large and growing fast), real pain (multi-agent failure modes are well-documented and unsolved), and a real seam neither Anthropic, OpenAI nor Cursor currently fills (cross-session, cross-vendor team composition — see Claim C-3, Flocker/Cogent). However, **three of the four claims under pressure-test fail or weaken** when contacted with primary evidence: (1) the "structural moat" of multi-runtime neutrality is contradicted by enterprise procurement data showing vendor-native marketplaces winning (Microsoft, Salesforce, Google) — Kubernetes is the only clean precedent for neutrality beating vendor-native, and its analog requires DreamTeams to become a de facto standard not a product; (2) the "Lean / Pro / God" tier vocabulary already exists in adjacent form (`agent-teams-lite`, "God-mode agent" anti-pattern, lean-agentic) but is not industry vocabulary — there is no observable adoption signal; (3) the "OS + Quality Gates" differentiator is the strongest claim — it maps directly to the documented gap in mainstream frameworks (CrewAI/LangGraph/AutoGen all "stop short of checking whether one agent's content is factually correct before the next agent consumes it" — Augment Code). The viable wedge is **not** "compiler vs marketplace" — it is "validation layer + cross-session governance for the 63% of vibe coders who are non-developers and can't debug propagation failures themselves."

## Phase 1: Landscape

### F1.1 — Cursor's multi-agent path is parallel-not-coordinated
**Claim:** Cursor 2.0/3.0 ships parallel agents but explicitly avoids team semantics. The launch language is "having multiple models attempt the same problem and picking the best result" — competition, not crew.
**Evidence:** Cursor's own blog ([cursor.com/blog/2-0](https://cursor.com/blog/2-0)) says Cursor 2.0 runs "many agents in parallel without them interfering with one another, powered by git worktrees or remote machines." Up to 8 agents at once in Cursor 2.0; Cursor 3 (April 2, 2026) added the Agents Window for multi-repo orchestration. **No pre-assembled crews, no role specialization in product copy.**
**Confidence:** HIGH. Direct primary source.
**Implication for DreamTeams:** The "Cursor Crews" threat the thesis fears does not exist as of May 2026 — Cursor's bet is parallel-best-of-N, not staffed teams. That widens the window, but not indefinitely.

### F1.2 — Anthropic ships Agent Teams natively in Claude Code, but at the session level
**Claim:** Claude Code has three agent primitives — Agent View (parallel sessions), Subagents (YAML configs, inherit context), Agent Teams (orchestrator + worker pattern with peer messaging).
**Evidence:** [cloudzero.com/blog/claude-code-agents](https://www.cloudzero.com/blog/claude-code-agents/): "Agent Teams represent the orchestration model where an orchestrator dispatches worker agents that message each other, share results, and converge on a solution." Costs scale linearly with concurrency (~$13/day solo → $50–$130/day with 5 concurrent agents). Code with Claude 2026 conference ratified this roadmap, plus "doubled" rate limits for Pro/Max/Team/Enterprise.
**Confidence:** HIGH. Two independent sources concur.
**Implication:** Anthropic's "team" primitive is **in-runtime, in-session, Claude-only**. A multi-runtime compiler that outputs Claude subagent files + Cursor rules + Codex configs from one spec is not in Anthropic's roadmap. This is the actual seam.

### F1.3 — OpenAI Swarm is dead; Agents SDK has won
**Claim:** Swarm officially deprecated as of mid-2025; OpenAI Agents SDK is production successor (v0.17.1 as of May 2026). "Agents as tools/handoffs" model — closer to function calling than crews.
**Evidence:** [openai/swarm](https://github.com/openai/swarm) README now points users to Agents SDK; [openai.github.io/openai-agents-python](https://openai.github.io/openai-agents-python/).
**Confidence:** HIGH.
**Implication:** No OpenAI-native "crew" product exists. Risk that ChatKit/AgentKit ships one is non-zero but signal is currently absent.

### F1.4 — Framework adoption is fragmenting, not consolidating
**Claim (with numerical disagreement flagged):** GitHub stars in 2026 reported as **AutoGen 42k / CrewAI 31.2k / LangGraph 12.8k**. CrewAI growth +1,014% from January 2024 (2.8k → 31.2k by April 2026). LangGraph captures 34% of "agent-framework citations in production architecture documents at companies with 1,000+ employees" per Q1 2026 figure. Gartner survey: 61% of large enterprises run at least one production AI agent system in 2026 (up from 18% in 2024).
**Evidence sources:** [pooya.blog comparison](https://pooya.blog/blog/crewai-vs-langgraph-autogen-comparison-2026/), [medium/data-science-collective comparison](https://medium.com/data-science-collective/langgraph-vs-crewai-vs-autogen-which-agent-framework-should-you-actually-use-in-2026-b8b2c84f1229).
**Confidence:** MEDIUM. Two secondary sources concur on direction; Gartner number not directly verified at primary source.
**Implication:** AutoGen is in maintenance mode (Microsoft pivoted to broader Agent Framework). LangGraph wins enterprise, CrewAI wins ease-of-use, Smolagents owns the HF research tier. **No framework owns the "describe project → get full team" compiler use case.**

### F1.5 — Anthropic Agent Skills is positioned as an open standard, not a marketplace lockin
**Claim:** Anthropic launched Agent Skills as an open standard in March 2026 (analog to MCP). Marketplace directory ships in Claude Cowork and Claude Code with curated partners: Atlassian, Canva, Cloudflare, Figma, Notion, Ramp, Sentry. Microsoft has adopted Agent Skills within VS Code/GitHub. Cursor, Goose, Amp, OpenCode implementing the pattern.
**Evidence:** [thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards](https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/), [aibusiness.com](https://aibusiness.com/foundation-models/anthropic-launches-skills-open-standard-claude).
**Confidence:** MEDIUM-HIGH. Multiple credible sources; primary article body was not retrievable via WebFetch but headline + multiple corroborating analyses align.
**Implication:** Skills are about **what an agent knows how to do**, not **which agents are on the team**. DreamTeams as a "team compiler" sits one abstraction level above Skills — assembling teams of Skill-enabled agents. The standardization helps DreamTeams (skills are portable across vendors) more than it threatens it.

### F1.6 — Vibe coder population is real and large
**Claim:** Vibe coding market estimated $4.7B in 2026 with 38% CAGR. 92% of US developers use AI coding tools daily. **63% of vibe coding users are non-developers.** r/vibecoding ~153,000 members. 25% of Y Combinator W25 batch had 95%+ AI-generated code. "Vibe coding" was Collins Dictionary's Word of the Year 2025.
**Evidence:** [taskade.com/blog/state-of-vibe-coding](https://www.taskade.com/blog/state-of-vibe-coding), [hostinger.com/blog/vibe-coding-statistics](https://www.hostinger.com/blog/vibe-coding-statistics).
**Confidence:** MEDIUM. Stack Overflow + GitHub primary data is solid. Gartner forecasts ("60% AI-generated code by end 2026") are projections, not measured facts. $4.7B market sizing has unclear methodology. The 63% non-developer figure is platform-aggregated and not independently verified.
**Note:** The taskade article itself flags "estimates are marked where exact figures are unavailable" and uses triangulation without confidence intervals. **Treat magnitude as directional, exact numbers as soft.**

## Phase 2: Mechanics

### F2.1 — npm won via default-bundle network effect (not curation quality)
**Claim:** npm wins because every Node.js download includes it. Bundling created the network effect. 1.3M+ packages, 16B+ weekly downloads. "Most opinionated project scaffolders now either default to pnpm or ask which package manager you want" — meaning npm's win is structural, not loved.
**Evidence:** [theserverside.com on npm history](https://www.theserverside.com/blog/Coffee-Talk-Java-News-Stories-and-Opinions/The-secret-history-behind-the-success-of-npm-and-Node).
**Implication:** DreamTeams has no analog distribution channel. There is no "Claude install brings DreamTeams." This is a real structural disadvantage vs Anthropic Skills (which ships inside Claude Code).

### F2.2 — VSCode marketplace = 100k extensions / 50M monthly devs / 75.9% of Stack Overflow respondents
**Claim:** The marketplace depth IS the moat. Categories: 36k language extensions, 19k snippets, 13k formatters, 13k linters, 9.4k debuggers, 8.7k themes.
**Evidence:** Microsoft milestone post May 2025 referenced in [getpanto.ai/blog/vscode-statistics](https://www.getpanto.ai/blog/vscode-statistics).
**Implication:** VSCode beat Atom (which GitHub itself owned) because of marketplace gravity and Microsoft's bundling/investment. **A meta-layer needs either depth OR a structural reason to exist that vendors can't replicate. Just "neutral aggregation" lost the Atom→VSCode war.**

### F2.3 — HuggingFace community curation works via trending APIs + per-asset Git repos
**Claim:** HF Hub hosts 2M models / 1.5M datasets / 1.5M Spaces. Each asset is a Git repo. Trending API surfaces top 20 of each type daily.
**Evidence:** [huggingface.co/docs](https://huggingface.co/docs/hub/en/index), [trending dataset](https://huggingface.co/datasets/severo/trending-repos).
**Implication:** HF's mechanic is **objective metrics (downloads, likes, recency) + per-asset versioning**. If DreamTeams imitates this, "team templates" need versioned repos + measurable adoption surfaces. Stars-on-a-list does not scale (see F2.5).

### F2.4 — Helm + Artifact Hub: 75% adoption among Kubernetes orgs (CNCF survey, second-hand)
**Claim:** Helm dominates K8s package distribution; Artifact Hub is the federated registry. Major vendors ship Helm charts as primary K8s distribution.
**Confidence:** MEDIUM (CNCF survey number is cited but not directly verified).
**Implication:** Helm + Artifact Hub model = open spec + neutral registry + vendor-shipped charts. The key is the **spec was open from day one** and CNCF held neutrality. DreamTeams' equivalent would be: a "team spec" file format that LLM vendors ship example teams in. Hard, but a real precedent.

### F2.5 — Awesome lists structurally rot
**Claim:** ~11% of awesome-list projects were classified as unmaintained (academic study, 6,785 projects, Coelho et al 2017–2018 cohort). 16% of an active 2,927-project cohort became unmaintained over one year. The pattern: lists start with enthusiasm, pick up 100–200 stars, plateau as creators get busy.
**Evidence:** [arxiv.org/pdf/1809.04041](https://arxiv.org/pdf/1809.04041), [dev.to/jtorchia on self-regulating curation](https://dev.to/jtorchia/stale-awesome-lists-how-i-built-a-self-regulating-curation-system-18lc).
**Implication for DreamTeams' "weekly Sunday leaderboard publish" forcing function:** A leaderboard is only a forcing function if **(a) someone external compares week-over-week numbers, (b) there is a penalty for not publishing, and (c) the numbers are measurable**. Open-source contribution leaderboards work when tied to engagement metrics ([opensource.com/article/21/9/community-leaderboard](https://opensource.com/article/21/9/community-leaderboard)). A self-imposed Sunday publish without a competitive comparison is a habit, not a forcing function. **Tighten: publish against a comparable benchmark (e.g., Cursor Crews adoption, Anthropic Skill installs) so the leaderboard has a counterparty.**

### F2.6 — Patterns that correlate with sustained meta-layer adoption (synthesis)
- **Open spec from day one** (LSP, MCP, Helm). Closed specs get absorbed.
- **Default bundling or structural distribution** (npm, VSCode). Without it, growth ceiling is low.
- **Per-asset versioning + Git-native** (HF, npm registry). Awesome lists rot because they're flat.
- **Objective trending metric** (downloads, stars, installs). Not editorial curation.
- **Vendor participation** (Helm/CNCF model). Anthropic publishes Skills spec but "deliberately does not operate a canonical registry" ([digitalapplied.com](https://www.digitalapplied.com/blog/ai-agent-marketplaces-2026-discovery-distribution)) — this is the exact opening DreamTeams could occupy for teams.

## Phase 3: Failure Modes

### F3.1 — GPT Store retrospective: launched empty, monetization broken, search broken
**Claim:** GPT Store launched January 2024 with no revenue sharing. Promised Q1 2024 revenue program. As of mid-2026, US-only payments based on engagement, formula undisclosed, most creators earn nothing because they don't meet the "25 conversation minimum per week to qualify."
**Numerical disagreement flagged:** OpenAI claims "3 million custom GPTs" created. [thegptshop.online](https://www.thegptshop.online/blog/openai-gpt-store-revenue-sharing) reports "more than 159k GPTs in the store" (suggesting <6% of created GPTs made it to the store, or the 3M figure is from a much earlier point). Another source ([originality.ai](https://originality.ai/blog/gpts-statistics)) cites "500,000 custom GPTs" on the store. **These three numbers (3M created, 500k in store, 159k visible) do not reconcile cleanly** — likely measuring different things (private GPTs vs public listings vs ranked listings).
**Bloomberg corroborating signal:** Bloomberg's March 2026 piece "OpenAI's ChatGPT App Store Took Aim at Apple, But Results Lag So Far" (URL: [bloomberg.com](https://www.bloomberg.com/news/articles/2026-03-30/openai-s-chatgpt-app-store-took-aim-at-apple-but-results-lag-so-far) — full body could not be fetched due to paywall) is itself the signal that mainstream financial press perceives the GPT Store as underperforming.
**Critic synthesis:** Lacks essential functionality (search, browsing, buying, selling). Tedious app-approval. Buggy coding. Lack of usage data for developers. Partner companies hesitant to hand off customer relationships.
**Sources:** [venturebeat.com](https://venturebeat.com/ai/openai-launches-gpt-store-but-revenue-sharing-is-still-to-come), [youreverydayai.com Ep 186](https://www.youreverydayai.com/what-openai-got-wrong-with-the-gpt-store/), [community.openai.com](https://community.openai.com/t/is-revenue-sharing-dead-q1-2024-long-over-no-revenue-sharing-news/804196).
**Confidence:** HIGH on direction (underperformed expectations). MEDIUM on specific numbers (sources disagree).
**Implication for DreamTeams:** A marketplace without monetization, without quality bar, without working search is a graveyard. DreamTeams as **compiler** (single output) sidesteps this — but if DreamTeams pivots to "browse teams" later, GPT Store is the cautionary tale: **monetization must ship at v1 or never**.

### F3.2 — Multi-agent systems break in three specific, expensive ways
**Claim:** Production multi-agent systems exhibit three documented failure modes:
1. **Infinite loop / "Mirror Mirror"** — conflicting instructions cause recursive handoff cycles. "Token budgets are consumed at exponential rates, sometimes translating to thousands of dollars lost in minutes" (Cogent).
2. **Hallucinated consensus** — multiple agents reinforce the same false premise; system reports high confidence on wrong answer.
3. **Resource deadlock** — circular dependencies on shared resources.
**Quantitative:** "68% of production systems execute at most 10 steps before human intervention" ([augmentcode.com](https://www.augmentcode.com/guides/multi-agent-ai-systems)). Tool-call fidelity below 80% is a "definitive sign of prompt-tool mismatch."
**Augment Code's killer quote:** Mainstream frameworks (CrewAI, LangGraph, AutoGen, OpenAI Agents SDK) all "stop short of checking whether one agent's content is factually correct before the next agent consumes it" — leaving inter-agent monitoring to developers.
**Sources:** [cogentinfo.com](https://cogentinfo.com/resources/when-ai-agents-collide-multi-agent-orchestration-failure-playbook-for-2026), [augmentcode.com](https://www.augmentcode.com/guides/multi-agent-ai-systems), [arize.com](https://arize.com/blog/common-ai-agent-failures/).
**Confidence:** HIGH.
**Implication:** **This is DreamTeams' strongest wedge.** "Operating System + Quality Gates" is not marketing — it maps to a measurable, expensive, unsolved problem that **no framework currently fixes**. If DreamTeams ships inter-agent validation as a first-class primitive, it has structural value the underlying frameworks don't.

### F3.3 — Atom marketplace lesson: ownership conflict killed it, not technology
**Claim:** Atom was killed because Microsoft acquired GitHub and didn't want two competing editors. 172 packages were left with deprecations that wouldn't load. Marketplace itself developed "rendering issues."
**Source:** [adamsdesk.com](https://www.adamsdesk.com/posts/atom-text-editor-project-ends/), [github.com/atom/atom discussions](https://github.com/atom/atom/discussions/22847).
**Implication:** A neutral marketplace owned by a vendor with conflicting incentives is fragile. **DreamTeams as a third-party multi-runtime layer is structurally protected from this specific risk** (no LLM vendor owns it). This is a small but real point in favor of the thesis.

### F3.4 — Prompt rot + template drift kill agent definitions over time
**Claim:** "Transformers suffer from attention decay — as a conversation grows, the weight of the initial system prompt diminishes relative to the most recent tokens." Tool-call hallucinations increase with tool count. When a harness is built against a schema and the schema is updated, calls silently fail or return malformed data.
**Source:** [dev.to/askpatrick prompt rot](https://dev.to/askpatrick/the-prompt-rot-problem-why-your-ai-agent-gets-worse-over-time-1fgj), [atlan.com agent harness failures](https://atlan.com/know/agent-harness-failures-anti-patterns/).
**Implication for DreamTeams' team-spec output:** A DreamTeams spec generated today decays as Claude Code / Cursor / Codex change their YAML schemas, tool schemas, MCP versions. **DreamTeams must commit to schema-tracking + automated migration**, or every team it generates becomes a maintenance liability for its user within 90 days. This is the "lib-only fixes don't protect against bypassing callers" pattern from the CLAUDE.md hygiene rules — applied to product surface.

## Phase 4: Contrarian

### F4.1 — The "structural moat" of multi-runtime neutrality is contradicted by 2026 enterprise data
**Counter-claim:** Enterprise procurement is consolidating onto vendor-native marketplaces. Salesforce AgentExchange (200+ launch partners). Microsoft Marketplace (11,000+ prepackaged models, 4,000+ AI agents). Google folded Agentspace into Gemini Enterprise. The argument: "the 2026 marketplace winners are the ones attached to existing enterprise procurement plumbing" — SSO, BAAs, audit mandates already in place.
**Source:** [digitalapplied.com](https://www.digitalapplied.com/blog/ai-agent-marketplaces-2026-discovery-distribution).
**Counter-counter:** Same source argues against winner-takes-all and explicitly endorses multi-venue publishing: "The agencies getting traction in 2026 publish the same capability as a Skill, a GPT, an MCP server, and a Hugging Face Space with platform-specific tuning." This is the **DreamTeams operating mode** — and the same source flags Anthropic "deliberately does not operate a canonical registry" for MCP, leaving room for third-party hubs.
**Net:** Multi-runtime neutrality is a real opening **for non-enterprise / individual developer (vibe coder) audiences**, but **not a structural moat for enterprise**. Position carefully.

### F4.2 — Historical precedent: vendor-native wins more often than neutrality
Pressure-tested cases from the brief:

| Case | Outcome | Why |
|------|---------|-----|
| Docker vs Pivotal CF | Docker won (open) | Open standard, cross-platform from day one |
| Kubernetes vs ECS | K8s won, with caveats | "35% of Fortune 500 use K8s multi-cloud" but "perfect multi-cloud portability remains elusive" — orgs still use ECS for AWS-native ([qovery, sysdig sources](https://www.qovery.com/blog/kubernetes-vs-docker-what-are-the-differences)) |
| LSP vs editor-specific | LSP won | Microsoft authored it but kept it open; OmniSharp + TypeScript adopted it across editors immediately |
| npm vs platform package managers | npm won | Default bundled with Node — see F2.1 |
| VSCode vs Atom | VSCode won (Microsoft owned both, killed Atom) | Vendor-native depth + marketplace gravity (F2.2) |
| Terraform vs CloudFormation | Mixed — Terraform wins multi-cloud, CloudFormation wins AWS-native | Coexistence not displacement |

**Synthesis:** Multi-vendor neutrality wins when **(a) the open spec is published before vendor-native lock-in is established, (b) at least one large vendor adopts the open spec, (c) the abstraction adds genuine portability value, not just an extra layer**. Currently for AI agents: MCP is the analog of LSP — Anthropic published it, multiple vendors adopted it, it works. **There is no LSP-equivalent for "team composition" — DreamTeams could be that spec, but it would have to be the spec, not a product wrapping a private spec.**

### F4.3 — Cursor + Anthropic are absorbing what they choose to absorb, in patterns that hint at the boundary
**Evidence:** Anthropic's Agent Skills + Claude Code's Agent Teams cover **in-session multi-agent**. Cursor 3's Agents Window covers **multi-repo parallel agents**. Both stop short of:
- Cross-session orchestration
- Cross-vendor team specs
- Inter-agent validation (per Augment Code F3.2)
**Flocker source quote:** "Both companies are solving agent-to-agent coordination within their ecosystems. But there's a gap neither fully addresses: orchestrating multiple independent agent sessions at scale."
**Source:** [flocker.md](https://flocker.md/blog/anthropic-openai-agent-orchestration/).
**Counter-evidence:** Vertical integration thesis ([everestgrp.com](https://www.everestgrp.com/blogs/spacex-cursor-deal-amid-the-vertical-integration-wars-go-full-stack-or-fall-behind/)) argues standalone vendor-neutral tools "face structural pressure once integrated into vertically-controlled stacks" — Cursor faces this from its own model dependency on Anthropic/OpenAI.
**Net:** The seam exists today. The window to occupy it before vendors absorb is **estimated 12–18 months** based on Cursor's quarterly release cadence + Anthropic's roadmap pace (Code with Claude 2026 conference ratified existing features rather than launching new ones — suggesting the team primitive is currently feature-complete in Anthropic's view).

### F4.4 — The "Lean / Pro / God" tier vocabulary claim is unsubstantiated
**Direct test:** Searched "Lean Pro God tier AI agent preset team mode" — no industry usage. Adjacent usage exists: "God-mode agent" as an anti-pattern ([leanpivot.ai](https://leanpivot.ai/blog/the-solopreneurs-ai-agent-build-challenge/)), "lean-agentic" as a framework name, [agent-teams-lite](https://github.com/Gentleman-Programming/agent-teams-lite) as a project.
**Confidence:** HIGH that this is not industry vocabulary as of May 2026.
**Implication:** "Lean/Pro/God" is at best a DreamTeams-internal vocabulary that **could become category-defining if DreamTeams achieves category leadership**. It is not currently a moat or signal. Treat as a marketing bet, not a defensible claim.

### F4.5 — What would have to be true for the DreamTeams thesis to fail?
1. **Anthropic Skills + Claude Code's `agents/` directory becomes the de facto team spec.** If a Claude subagent YAML can encode all the role/quality-gate semantics DreamTeams emits, the multi-runtime layer becomes a transcompiler not a primary surface. Probability: MEDIUM (Anthropic ships agent-related features at every conference).
2. **Cursor 4 ships pre-assembled crews with role specialization.** This is exactly the "Cursor Crews" risk the brief names. Current Cursor language (best-of-N parallel) is far from this, but Cursor 3 already added cloud agent environments — one product cycle from "crew templates." Probability: MEDIUM-HIGH in 12–24 months.
3. **Multi-agent failure modes (F3.2) are solved at the framework layer.** If LangGraph or CrewAI ships inter-agent validation, the "Quality Gates" wedge collapses. Probability: LOW within 12 months (no framework currently roadmaps this per F3.2 sources), but cannot be ruled out.
4. **Vibe coder population is smaller / less monetizable than claimed.** 63% non-developer figure is the most fragile number in the brief. If the real ratio is 20–30% and the remaining "vibe coders" are developers who'd rather write their own configs, TAM shrinks 2–3x. Probability: MEDIUM (the number is platform-aggregated, not surveyed).
5. **Vendor-native marketplaces capture the long tail.** Anthropic Skills marketplace, plus Microsoft VS Code, plus Salesforce AgentExchange, plus Google Gemini Enterprise — if these become "good enough" for non-enterprise vibe coders, neutrality stops being valued. Probability: MEDIUM-HIGH within 24 months.

**If 2 of 5 happen, the thesis is materially weakened. If 3+, it fails.**

### F4.6 — The strongest single argument FOR the thesis
The Augment Code observation (F3.2): **no mainstream framework validates inter-agent message correctness**. This is a real, expensive, named, unsolved gap. Combined with Flocker's observation (F4.3) that **no vendor solves cross-session orchestration**, and the digitalapplied.com observation that **multi-venue publishing is what's working in 2026**, DreamTeams has a coherent product story: "describe project once → output validated, governed, cross-runtime team — with quality gates that detect hallucination propagation before it ships."

The thesis is strongest when reframed: **DreamTeams is not a marketplace alternative — it is the missing inter-agent validation + multi-venue compilation layer.** "Compiler not marketplace" is correct phrasing but undersells the wedge.

## Source Registry

| URL | Title | Credibility 1–5 | Recency | Type |
|---|---|---|---|---|
| [cursor.com/blog/2-0](https://cursor.com/blog/2-0) | Introducing Cursor 2.0 and Composer | 5 | 2025/26 | Primary (vendor) |
| [cursor.com/blog/cursor-3](https://cursor.com/blog/cursor-3) | Meet the new Cursor | 5 | Apr 2026 | Primary (vendor) |
| [cloudzero.com/blog/claude-code-agents](https://www.cloudzero.com/blog/claude-code-agents/) | Claude Code Agents in 2026 | 4 | 2026 | Secondary analysis |
| [openai/swarm GitHub](https://github.com/openai/swarm) | Swarm README (deprecated) | 5 | 2025 | Primary (vendor) |
| [openai.github.io/openai-agents-python](https://openai.github.io/openai-agents-python/) | OpenAI Agents SDK docs | 5 | May 2026 | Primary (vendor) |
| [pooya.blog comparison](https://pooya.blog/blog/crewai-vs-langgraph-autogen-comparison-2026/) | CrewAI vs LangGraph vs AutoGen 2026 | 3 | 2026 | Opinion/secondary |
| [thenewstack.io agent skills](https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/) | Anthropic Agent Skills | 4 | 2026 | Secondary journalism |
| [aibusiness.com](https://aibusiness.com/foundation-models/anthropic-launches-skills-open-standard-claude) | Anthropic Skills Open Standard | 4 | 2026 | Secondary journalism |
| [taskade.com state of vibe coding](https://www.taskade.com/blog/state-of-vibe-coding) | State of Vibe Coding 2026 | 3 | 2026 | Marketing-tinted analysis |
| [hostinger.com vibe coding stats](https://www.hostinger.com/blog/vibe-coding-statistics) | Vibe Coding Statistics 2026 | 2 | 2026 | Marketing |
| [huggingface.co/docs](https://huggingface.co/docs/hub/en/index) | HF Hub Documentation | 5 | Current | Primary (vendor) |
| [theserverside.com on npm history](https://www.theserverside.com/blog/Coffee-Talk-Java-News-Stories-and-Opinions/The-secret-history-behind-the-success-of-npm-and-Node) | History of npm/Node | 4 | Historical | Secondary journalism |
| [getpanto.ai/blog/vscode-statistics](https://www.getpanto.ai/blog/vscode-statistics) | VS Code Statistics 2026 | 3 | 2026 | Marketing/secondary |
| [arxiv.org/pdf/1809.04041](https://arxiv.org/pdf/1809.04041) | Identifying Unmaintained Projects in GitHub (Coelho et al) | 5 | 2018 (still cited) | Primary academic |
| [dev.to/jtorchia on awesome lists](https://dev.to/jtorchia/stale-awesome-lists-how-i-built-a-self-regulating-curation-system-18lc) | Stale Awesome Lists | 3 | Recent | Opinion |
| [hackernoon awesome list history](https://hackernoon.com/the-history-of-github-awesome-lists) | History of Awesome Lists | 3 | — | Secondary |
| [venturebeat GPT Store revenue sharing](https://venturebeat.com/ai/openai-launches-gpt-store-but-revenue-sharing-is-still-to-come) | OpenAI launches GPT Store but revenue sharing still to come | 4 | 2024 | Journalism |
| [thegptshop.online revenue sharing](https://www.thegptshop.online/blog/openai-gpt-store-revenue-sharing) | GPT Store Revenue Sharing Explained | 3 | 2025 | Opinion/marketing |
| [community.openai.com revenue sharing thread](https://community.openai.com/t/is-revenue-sharing-dead-q1-2024-long-over-no-revenue-sharing-news/804196) | Is revenue sharing dead? | 4 | 2025 | Primary community |
| [bloomberg gpt store](https://www.bloomberg.com/news/articles/2026-03-30/openai-s-chatgpt-app-store-took-aim-at-apple-but-results-lag-so-far) | OpenAI's ChatGPT App Store Lags | 5 | Mar 2026 | Primary journalism (paywalled, not fully retrieved) |
| [youreverydayai.com Ep 186](https://www.youreverydayai.com/what-openai-got-wrong-with-the-gpt-store/) | What OpenAI Got Wrong with GPT Store | 3 | 2024 | Opinion |
| [cogentinfo multi-agent playbook](https://cogentinfo.com/resources/when-ai-agents-collide-multi-agent-orchestration-failure-playbook-for-2026) | Multi-Agent Orchestration Failure Playbook 2026 | 3 | 2026 | Consulting/opinion |
| [augmentcode.com multi-agent](https://www.augmentcode.com/guides/multi-agent-ai-systems) | Multi-Agent AI Systems | 4 | 2026 | Vendor analysis |
| [arize.com agent failures](https://arize.com/blog/common-ai-agent-failures/) | Why AI Agents Break | 4 | 2026 | Vendor analysis |
| [dev.to prompt rot](https://dev.to/askpatrick/the-prompt-rot-problem-why-your-ai-agent-gets-worse-over-time-1fgj) | The Prompt Rot Problem | 3 | Recent | Opinion |
| [atlan.com agent harness failures](https://atlan.com/know/agent-harness-failures-anti-patterns/) | AI Agent Harness Failures | 4 | 2026 | Vendor analysis |
| [adamsdesk.com atom](https://www.adamsdesk.com/posts/atom-text-editor-project-ends/) | Atom Text Editor Project Ends | 4 | 2022 | Secondary |
| [github.com/atom discussions 22847](https://github.com/atom/atom/discussions/22847) | Is Atom dead? | 5 | 2022 | Primary community |
| [digitalapplied.com ai agent marketplaces](https://www.digitalapplied.com/blog/ai-agent-marketplaces-2026-discovery-distribution) | AI Agent Marketplaces 2026 | 4 | 2026 | Analysis |
| [flocker.md anthropic openai orchestration](https://flocker.md/blog/anthropic-openai-agent-orchestration/) | Anthropic vs OpenAI Agent Orchestration | 3 | 2026 | Vendor analysis |
| [everestgrp.com vertical integration](https://www.everestgrp.com/blogs/spacex-cursor-deal-amid-the-vertical-integration-wars-go-full-stack-or-fall-behind/) | SpaceX-Cursor deal & vertical integration | 4 | 2026 | Analyst |
| [en.wikipedia.org/wiki/Language_Server_Protocol](https://en.wikipedia.org/wiki/Language_Server_Protocol) | LSP Wikipedia | 4 | Current | Reference |
| [medium codetodeploy clauding](https://medium.com/codetodeploy/clauding-268c6521497a) | Clauding (Gary Angel) | 3 | Apr 2026 | Opinion |
| [helm.sh + artifacthub.io](https://artifacthub.io/) | Artifact Hub | 5 | Current | Primary (CNCF) |
| [medium AI agents stack 2026](https://medium.com/data-science-collective/the-ai-agents-stack-2026-edition-37fa32db7a56) | The AI Agents Stack 2026 Edition | 4 | Mar 2026 | Analysis |
| [thenextweb google cloud next 2026](https://thenextweb.com/news/google-cloud-next-ai-agents-agentic-era) | Google Cloud Next 2026: A2A | 4 | 2026 | Journalism |
| [thenewstack SAP AI agent hub](https://thenewstack.io/sap-ai-agent-hub/) | SAP launches AI Agent Hub | 4 | May 2026 | Journalism |

## Confidence Matrix

| # | Claim | Confidence | Supporting Evidence | Counter-Evidence |
|---|---|---|---|---|
| C-1 | Vendor-native LLM crews (Cursor, Anthropic, OpenAI) do NOT yet target multi-runtime team composition as of May 2026 | HIGH | F1.1, F1.2, F1.3, F4.3 (Flocker quote on the gap) | None contradicting; small risk in 12–24 months (F4.5 item 2) |
| C-2 | The "vibe coder" segment is real and large enough to support a category | MEDIUM | F1.6 (taskade, hostinger), Stack Overflow primary, YC W25 cohort | Exact 63% non-developer + $4.7B market sizing not independently verified |
| C-3 | The seam DreamTeams targets (cross-session, cross-vendor team composition + inter-agent validation) is documented and unsolved | HIGH | F3.2 (Augment Code: no framework validates inter-agent messages), F4.3 (Flocker: no vendor solves cross-session orchestration) | None directly contradicting |
| C-4 | Multi-runtime neutrality is a "structural moat" against vendor-native crews | LOW-MEDIUM | F4.6 (analogous to LSP/MCP), F2.4 (Helm/CNCF model) | F4.1 (enterprise procurement going vendor-native), F4.2 (vendor-native wins more historical cases than neutrality) |
| C-5 | "Lean / Pro / God" preset modes will become industry vocabulary | LOW | None — only adjacent uses found | F4.4 — no industry adoption signal as of May 2026 |
| C-6 | OS + Quality Gates is the real differentiator | HIGH (if executed) | F3.2 Augment Code direct quote | Frameworks could ship validation primitives in 12 months (F4.5 item 3) |
| C-7 | Weekly Sunday leaderboard publish is a forcing function | MEDIUM | F2.5 — works when external benchmark exists | Works only if measurable comparison exists; self-publishing without counterparty = habit not forcing function |
| C-8 | GPT Store underperformed and the lessons apply to any "browse and pick" agent marketplace | HIGH on direction, MEDIUM on numbers | F3.1, Bloomberg signal, OpenAI community threads | 3M / 500k / 159k numerical disagreement unresolved |
| C-9 | Inter-agent hallucination propagation is the killer failure mode for current multi-agent systems | HIGH | F3.2 across three independent sources (Cogent, Augment Code, Arize) | None |
| C-10 | Open spec + neutral registry + vendor adoption pattern (LSP, MCP, Helm) is the only reliable path for a multi-runtime layer to win | HIGH | F4.2 historical table, F2.6 synthesis | None directly; risk that DreamTeams' "team spec" doesn't get vendor uptake |

## Gaps Remaining

### Phase 1 gaps
- **Primary Anthropic roadmap document** (Code with Claude 2026 keynote video + 2026 Agentic Coding Trends Report PDF) — the PDF was retrieved as binary; full agentic coding trends report contents not text-extractable in this session.
- **Cursor 3 internal docs on whether "Agents Window" supports user-defined crew configurations** — likely public but not surfaced in this search.
- **OpenAI Agents SDK roadmap on multi-vendor / multi-runtime** — primary docs were not searched in depth.

### Phase 2 gaps
- **Quantitative HuggingFace adoption mechanics** (how many models become "trending" per week, average plateau time) — not in surfaced sources.
- **Helm/Artifact Hub: actual chart count + update frequency distribution** — CNCF survey number is cited but not verified at source.
- **VSCode marketplace: time-to-adoption-curve for typical extensions** — not found.

### Phase 3 gaps
- **GPT Store reconciliation** — 3M vs 500k vs 159k numerical disagreement remains. Bloomberg primary article is paywalled.
- **Production multi-agent system field studies with N > 100 systems** — currently the "68% under 10 steps" stat is from one Augment Code analysis; no academic-grade replication found.
- **Heroku Add-ons marketplace specific decline numbers** — none surfaced; only broader Heroku decline narrative.

### Phase 4 gaps
- **Direct critique of the "AI agent meta-layer" thesis** by named industry analysts — only adjacent critiques (vertical integration, enterprise procurement) surfaced. There is **no dedicated "DreamTeams thesis is wrong because…" piece** in the public record yet, which is itself a signal: the category is too new to have a developed counter-narrative.
- **Vibe coder behavioral survey with rigorous methodology** — the cited surveys are platform aggregates without disclosed methodology. A real survey instrument (n > 1000, validated by SO or similar) would change confidence on C-2 materially.
- **Concrete vendor signal on absorbing the staffing layer** — Cursor 3 announcements imply this direction but contain no explicit roadmap statement. Worth monitoring Cursor 4, Code with Claude 2027, OpenAI Dev Day.

### Cross-cutting note
The biggest unresolved question for the thesis: **does multi-runtime portability actually matter to vibe coders, or only to enterprise buyers?** If 63% are non-developers, they likely don't have a "next runtime" in mind — they pick one tool and stay. Multi-runtime might be a developer-narrative more than a user-need. **This is the single highest-leverage validation experiment DreamTeams should run before committing.**
