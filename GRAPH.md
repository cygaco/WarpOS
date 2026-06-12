# GRAPH.md — Agent Model Spread (default routing)

> Snapshot of the resolved role→provider→model→effort routing, taken from the
> Dispatch Console on **2026-06-12**. This is a point-in-time view — regenerate
> with `node scripts/dispatch.js show` (sources: manifest overrides → role
> frontmatter → catalog defaults in `scripts/dispatch/catalog.js`).

## The spread at a glance

| Provider | Model | Carries |
|---|---|---|
| **Anthropic** | Claude Opus 4.8 | The company itself — all faces (α/β/γ/δ/ε) and the entire build chain (builders, fixers, design-quality, visual-review) |
| **Anthropic** | Claude Sonnet 4.6 | Cheap mechanical roles — skeleton-builder, test-runner |
| **OpenAI** | GPT-5.5 (xhigh) | The independent review layer — code reviewers, QA, compliance, ops-analyst, design-lead, cabinet (second opinion) |
| **Google** | Gemini 3.1 Pro (preview) | The adversarial layer — redteam, security-reviewer |
| **OpenAI** | gpt-5.5-pro (Responses API only) | Ad-hoc extended-reasoning consults via `scripts/research/gpt-pro-consult.js` (not CLI-routable, so not in the console table) |

**The design rule:** whoever *builds* is Claude; whoever *judges* the build is a
different provider (GPT for quality/review, Gemini for attack). Cross-provider
review exists so the grader never shares the builder's blind spots.

## Full routing table

| Role | Provider | Model | Effort | Fallback |
|---|---|---|---|---|
| alpha | claude | claude-opus-4-8 | **max** | — |
| beta | claude | claude-opus-4-8 | high | — |
| gamma | claude | claude-opus-4-8 | xhigh | — |
| delta | claude | claude-opus-4-8 | xhigh | — |
| epsilon | claude | claude-opus-4-8 | high | — |
| builder | claude | claude-opus-4-8 | high | — |
| frontend-builder | claude | claude-opus-4-8 | high | — |
| backend-builder | claude | claude-opus-4-8 | high | — |
| security-builder | claude | claude-opus-4-8 | high | — |
| skeleton-builder | claude | claude-sonnet-4-6 | medium | — |
| fixer | claude | claude-opus-4-8 | high | — |
| frontend-fixer | claude | claude-opus-4-8 | high | — |
| backend-fixer | claude | claude-opus-4-8 | high | — |
| security-fixer | claude | claude-opus-4-8 | high | — |
| design-quality | claude | claude-opus-4-8 | high | — |
| visual-review | claude | claude-opus-4-8 | high | — |
| test-runner | claude | claude-sonnet-4-6 | medium | — |
| reviewer | openai | gpt-5.5 | xhigh | — |
| frontend-reviewer | openai | gpt-5.5 | xhigh | claude |
| backend-reviewer | openai | gpt-5.5 | xhigh | claude |
| qa-reviewer | openai | gpt-5.5 | xhigh | claude |
| qa | openai | gpt-5.5 | medium | — |
| compliance | openai | gpt-5.5 | xhigh | — |
| ops-analyst | openai | gpt-5.5 | xhigh | claude |
| design-lead | openai | gpt-5.5 | xhigh | claude |
| cabinet | openai | gpt-5.5 | xhigh | claude |
| redteam | gemini | gemini-3.1-pro-preview | high | — |
| security-reviewer | gemini | gemini-3.1-pro-preview | high | claude |

## Effort philosophy

- **`max` is reserved for α alone** (top face, big-project exception — see
  `scripts/dispatch/catalog.js`).
- Orchestrating faces (γ/δ) and the GPT review layer run **xhigh** (their ceiling).
- Builders/fixers/β/ε run **high** — strong but bounded.
- Mechanical roles (skeleton-builder, test-runner, qa smoke) run **medium** on
  the cheaper Sonnet/GPT tiers.

## Notes

- **Fallback `claude`** means: if the cross-provider CLI is unavailable, the role
  re-dispatches on Claude via the documented stdin fallback (never raw argv —
  see `feedback_claude_fallback_stdin_not_argv`).
- **In-process roster** (managers/leads spawned via the harness Agent tool —
  product-lead, quality-lead, directors, β-as-teammate, etc.) inherits the
  session model unless its agent definition pins one; the table above covers the
  CLI-routable dispatch roles.
- Deliberately excluded models: `gpt-5.5-pro`/`gpt-5.4-pro` from the codex CLI
  catalog (Responses-API-only — reachable via the consult wrapper above);
  `gemini-2.5-pro` per project policy.
