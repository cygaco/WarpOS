# Decision Policy

The single source of truth for who decides what, what triggers escalation, how to score competing options, and when a new dependency is allowed.

Read on every Beta invocation (after `judgement-model.md`). In solo mode, Alpha consults this directly via `CLAUDE.md`.

This doc replaces three drifting copies of escalation rules previously scattered across `CLAUDE.md`, `beta.md`, and `judgement-model.md`. Those files now point here.

---

## Decision classes

Every decision falls into one of three classes. Identify the class first; the rest of this doc is conditional on it.

### Class A — Decide automatically

Implementation-level, reversible, low blast radius. Beta DECIDEs without scoring. Alpha (solo) decides directly.

Examples:
- Component structure and file naming
- Local state shape, helper extraction, refactoring within a file
- Test file organization
- Whether to add loading or error states when the spec says "handle gracefully"
- Minor UI choices within the existing design system
- Which equivalent library API to use (e.g. `Array.from` vs spread)
- Comment density, log verbosity
- Internal naming and identifier choices

If a Class A decision turns out wrong, the cost is one PR to redo it. No ADR. No user surface.

### Class B — Decide, score, document if architectural

Meaningful technical. May affect the system beyond the file being edited. Beta scores options against the rubric, picks the winner, returns DECIDE with one recommendation. Alpha (solo) does the same.

Examples:
- Adding a new dependency (npm package, MCP server, third-party API client)
- Database schema change
- Introducing a background job or new pipeline stage
- API surface (route shape, params, response contract)
- Auth flow modifications within the existing auth model
- Deployment configuration
- Refactoring across files
- Choosing among third-party integrations when the category is settled

When a Class B decision affects **architecture, dependencies, data model, security, or deployment**, also flag `OPEN_ADR: true` so Alpha drops a new ADR file in `paths.policy/adr/` in the next cycle.

### Class C — Escalate to user

Strategic, irreversible, business-sensitive, or user-trust-affecting. Beta returns ESCALATE with **one recommended answer**, not a menu. Alpha asks the user only after this verdict.

Examples:
- Pricing model
- Product positioning and messaging
- Sensitive user data handling
- Compliance posture (privacy, GDPR, CCPA, accessibility minimums)
- Major vendor lock-in
- Payment architecture
- Public launch readiness gates
- Data deletion and retention policy
- Anything that could materially damage user trust if wrong

---

## Escalation red lines (Class C triggers)

Always escalate, even if a decision otherwise reads as Class A or B. These exist because the cost of being wrong is large or irreversible.

- Irreversible operations — deleting data, dropping features, force-pushing, removing branches
- Spec semantics changes — anything that changes what users see, feel, or are promised
- Spend ≥ $5 — API costs, service signups, paid plan upgrades
- External-facing actions — push to remote, deploy, publish, send email, post to social
- Credentials or secrets — anything involving keys, tokens, passwords
- Contradicts an established `CLAUDE.md` rule
- Pricing, positioning, or compliance questions
- Sensitive user data (PII, resume contents at boundaries)
- Payment architecture
- Public launch readiness
- Anything that could materially damage user trust

When in doubt about whether a decision crosses one of these lines, **escalate**. The cost of an unnecessary ESCALATE is seconds. The cost of a wrong DECIDE on a red line is hours or worse.

---

## Scoring rubric (Class B)

When a Class B decision has multiple viable options, score each option on these criteria. Weights reflect the current product stage (`paths.currentStage`).

| Criterion | Weight at MVP | What to look for |
|---|---|---|
| Product fit | high | Does this serve a user value identified in `docs/00-canonical/PRODUCT_MODEL.md`? |
| Simplicity | high | Easy to understand on first read, easy to maintain, fits the existing mental model |
| Reliability | high | Likely to work in production without surprise failures on the happy path |
| Reversibility | high | Can we change our mind in a week without rewriting half the system? |
| Security | mandatory pass | If serious security concern, reject regardless of score |
| Speed-to-ship | medium | Helps us launch the feature this cycle |
| Cognitive cost | medium | New mental load for the user — skill names, UI patterns, system surface |
| Operational burden | medium | Ongoing maintenance work created |
| Cost | low (mvp) | Infra, API, vendor cost (small at mvp scale; flips to medium at beta) |
| Ecosystem maturity | medium | Boring, well-supported choice vs novelty |

**Tiebreaker.** When scores are close (within ~10%), choose the simpler and more reversible option.

**Output rule.** When returning DECIDE on a multi-option question, present **one recommendation**, not a menu. State why it won and what got rejected (one line each). Do not bounce a list of options back to Alpha or the user.

**Stage shifts the weights.** When `paths.currentStage` flips from `mvp` to `beta`, Reliability becomes mandatory-pass and Speed-to-ship drops. When it flips from `beta` to `production`, Cost rises to high and Performance enters the rubric. The criteria stay; the weights move. See `paths.currentStage` for the current stage's emphasis.

---

## Tech-introduction rule

Do not introduce a new service, framework, database, queue, vendor, or major dependency unless **all four** conditions hold:

1. The current stack (`docs/04-architecture/STACK.md`) cannot reasonably solve the problem.
2. The benefit outweighs the added complexity (score it on the rubric — must beat "use what we have" by a clear margin).
3. The decision is documented as an ADR in `paths.policy/adr/`.
4. Implementation includes tests and a rollback path.

Default answer for any "should we add X?" question is **use what we have**. The bar to clear is the four conditions above, not just "X is nice."

---

## Fallback rule

If uncertain, make the simplest reversible decision and proceed. Do not produce a menu of options. Do not bounce to the user for a tiebreaker.

Pick the option with the lowest blast radius and lowest cognitive cost, document the reasoning in one line, move forward. If it turns out wrong, the cost is one PR to redo.

This rule exists because asking the user for routine technical choices is the bottleneck this whole policy is designed to remove.

---

## References

- **User value grounding:** `docs/00-canonical/PRODUCT_MODEL.md`, `CORE_BRIEF.md`, `USER_COHORTS.md`, `GOLDEN_PATHS.md`
- **Current stack:** `docs/04-architecture/STACK.md`
- **Reasoning frameworks:** `paths.reference/reasoning-frameworks.md`
- **Beta judgment mechanics:** `paths.judgmentModel`
- **Current product stage:** `paths.currentStage`
- **Settled architecture decisions:** `docs/04-architecture/` (these ARE our ADR archive, just not numbered)
- **New ADRs:** `paths.policy/adr/` — one file per decision, `NNNN-slug.md`
