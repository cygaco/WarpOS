# Playbooks

> Validated patterns. Copy, adapt, deploy. Don't reinvent.
> Every pattern here has been tested in a real product context.

## Product Playbooks

### Rapid Validation Loop
**Use when:** Testing a new product idea before building anything.

1. Define the problem hypothesis in one sentence
2. Define the ICP (1 person, not a segment)
3. Identify the riskiest assumption
4. Design the cheapest test that would invalidate it
5. Run the test (target: under 1 week, under $500)
6. Document result in product card
7. Decision: kill, pivot, or proceed to build

**Kill criteria:** Less than 3 out of 10 target users say they'd pay for this today.

### MVP Scoping
**Use when:** Greenlit to build.

1. Write the "one job" — what does this product do, for whom, in one sentence?
2. List every feature you think it needs
3. Cross off everything that isn't required to deliver the one job
4. What remains is the MVP
5. Time-box: 2 weeks max for first deployable version

### New Product Onboarding to Warp
**Use when:** Starting a new product inside the studio.

1. Create `products/[name].md` from `products/TEMPLATE.md`
2. Add product-specific extension interface to `schemas/warp-profile.ts`
3. Export a `ProductManifest` for Deus Mechanicus
4. Wire to shared auth (when available)
5. Add encrypted client storage via Warp pattern
6. Add to Products table in `WARP.md`

## Technical Playbooks

### Adding a Claude Integration
1. Define the prompt job in one sentence
2. Write the system prompt (use Tokenizer rules)
3. Define input/output contract (typed interfaces)
4. Wrap external data in `<untrusted_*>` tags
5. Test with 10 real examples before shipping
6. Add to AI Orchestration Patterns in `WARP.md`
7. Set up rate limiting (per-IP + global + daily budget)

### Two-Phase AI Pipeline
**Use when:** Single-pass analysis produces poor results due to data complexity.

1. Phase 1: Raw data → structured intelligence report (extraction + classification)
2. Phase 2: Intelligence report → decision output (analysis + recommendations)
3. Build fallback: if Phase 1 fails, Phase 2 runs on raw data (degraded but functional)
4. Log both phases via pipeline tracer

### Setting Up Deus Mechanicus in a New Product
1. Copy `schemas/deus-mechanicus.ts` interfaces into product
2. Create product manifest factory (see `deus-mechanicus-consumer-product.ts` as reference)
3. Define steps, fields, test suites, buildSession/getState/setState
4. Wrap app tree with `<DeusMechanicus manifest={manifest}>` as outermost provider
5. Access via `/?deusmechanicus` URL param

### Pipeline Tracing
1. Import/create tracer: `trace(stage, data)` → logs `[PIPELINE] STAGE { data }`
2. Define product-specific stages (e.g., `USER_INPUT → QUERY_GEN → API_CALL → ANALYSIS`)
3. Add tracer calls at each stage boundary
4. View in Deus Mechanicus Pipeline Tracer module

## Ops Playbooks

### Hiring a Co-Founder
1. Write the role spec (see Company doc)
2. Define: commitment level, equity tier, responsibilities
3. 2-week paid trial project before any equity conversation
4. Decision criteria: do they raise the average?

---

*Last updated: 2026-03-19*
