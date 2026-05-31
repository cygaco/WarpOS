# GPT-5.5 Consult — Summary (2026-05-30)

Raw output: `runtime/notes/gpt55-consult-out.json`. Consulted on the reconciled architecture + draft parallel sprint plan.

## Headline (pushback)
> "Directionally right, but your sequencing is wrong — adding roles faster than enforceable interfaces = multi-agent theater."

Build **artifact contracts + a routing enforcer + the component-library scaffold BEFORE expanding agents.** Wave 1 as drafted is NOT parallel-safe (A1 depends on F0/contracts; F1 depends on contracts; W2/W3 both depend on the scaffold).

## Top recommendations
- **Add F2 — Artifact Contracts** (audience_dossier, design_brief, conversion_brief, build_spec; each = owner + consumers + required fields) ahead of W2/W3.
- **Decision model as policy-as-code with FAILING TESTS:** domain owners decide in-domain; β owns arbitration + risk-taxonomy + release-gate; Alpha/Gamma orchestrate, don't judge. Tests: product decision w/o Director-Product fails; multi-domain needs all owners + β; β can't override without an arbitration record; reject stale dossiers. Classifier routes to multi-owner + β when confidence <0.75 or domains >1. Immutable append-only decision log + telemetry.
- **Builder roles:** FE/BE split necessary but NOT sufficient → add **foundation_builder + integration_builder** (4 roles) OR make Gamma explicitly own integration. Enforce contract-first, else FE fakes APIs / BE ignores UX states / shared files fall between owners.
- **Design/Marketing org:** conversion website under **Marketing** (owns offer/segment/funnel/copy/CTA/proof/analytics); **Design Lead = required approver** (quality/brand/a11y/handoff); **Product = claims/positioning approver**; Web/Conversion designer reports to Design Lead but Marketing owns the page decision; joint approval only at release.
- **OpenAI×Anthropic web-gen:** Claude → long-context product synthesis, audience-dossier drafting, UX flows, component impl, rationale. OpenAI/Codex → adversarial review, codebase-grounded refactors, test-gen, regression, final gate. Use Anthropic prompt-caching for stable front-of-prompt context. NEVER ask either to "make it beautiful" — feed contracts + screenshots + examples + design tokens + conversion hypothesis + acceptance tests.
- **Anti-generic guardrails:** wire shadcn/Radix/Tailwind-v4 into the scaffold BEFORE creating design agents; tokens before screens; require 3 competitor teardowns + 3 anti-examples + a page-specific conversion hypothesis + desktop/mobile screenshot QA; ban the default "hero / logo-cloud / 3-cards / testimonial" SaaS layout.
- **Audience schema:** segment-level, source-attributed, confidence-scored; NO PII / no individual profiling. Every deep psychographic claim needs source + segment + confidence + implication or it's "horoscope text." Mine reviews / search-intent / competitors; label synthetic interviews and only after real-source mining. Do NOT "mine everything" (→ noisy surveillance).
- **/etc:** do NOT make it a chain-of-thought warehouse ("wrong abstraction" — don't build a system whose correctness depends on preserving hidden reasoning traces). Make it a prompt/skill **authoring + EVAL harness** storing procedures, rubrics, examples, counterexamples, decision records.

## Re-sequenced plan (consult's proposal)
- **Wave 0 "Contracts Spike"** (artifact contracts + decision-routing schema) BEFORE Wave 1.
- Then F0/F1/A1 (parallel) → routing-enforcer EARLY (with failing tests) + design/marketing + component-scaffold (parallel) → builder specialization DEFERRED until design/build/spec contracts stabilize → **ONE pilot product end-to-end (Wave 4)**, use its defects to revise contracts before scaling.

## Top risks (framed as do-nots)
1. Decision theater (consulted but unenforced).
2. Generic design output (no inventory / visual-QA / evidence).
3. FE/BE integration failures on shared / full-stack files.
4. Hallucinated audience psychographics.
5. "Mine everything" → noisy surveillance.

_β concurred on the org/ingestion calls separately (see `.claude/agents/00-alex/.system/beta/events.jsonl` — EVT pending log). This consult is advisory input to the masterplan; not yet folded into a committed plan (operator pivoted to ingest the source corpus first)._
