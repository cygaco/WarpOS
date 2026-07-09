# SP-20260619-001 — Plan-Phase Synthesis (E-DISPATCH-PERFECT-001 W4 jobzooka genericization)

**Plan consults (real GPT-5.5, gauntlet-verify PASS):** director-of-product (ok), product-lead (ok).
**β plan→design:** consult sent (teammate β), awaiting verdict.

## Composition (locked)
1 unit (docs/copy genericization), LOW-MED risk (shipped-baseline COHERENCE, not system breakage).
One coordinated build pass over PAIRED canonical+BASELINE files; verify both roots independently.

## THE EXAMPLE PRODUCT (DoP) — `AcmeLaunch`
A fictional launch-planning SaaS for solo founders/small teams: idea → milestones → tasks → launch
assets → launch → customer follow-up. Neutral, non-regulated, instantly understandable, clearly-fictional
(Acme prefix = no trademark), maps onto the EXISTING doc structure (a substitution, not a rewrite), and
meta-appropriate (launch-planning ≈ what WarpOS founders do). DoP chose the SIMPLER neutral domain over
same-shape rewrite (shipped baseline teaching value > minimal churn).

## ⚠️ SCOPE REFINEMENT (verify-don't-inherit — the real surface is BROADER than the name)
- "jobzooka" literal: 38 canonical + 38 BASELINE = 76 files / 226 hits.
- **jobzooka DOMAIN VOCAB (resume/LinkedIn/Bright Data/Chrome extension): 53 MORE canonical files** —
  the resume/job-search CONCEPTS that must become launch-planning concepts. A name-only find-replace
  would orphan these. So the genericization is a RE-DOMAINING, not a rename.

## BINDING GATE (the SP-002-retro certified-gate-coverage lesson, applied)
1. `grep -ril jobzooka _requirements/ _warpos/BASELINE/_requirements/` = ZERO (NOT framework-purity-green
   — it's ALREADY green with jobzooka present, because jobzooka is advisory domain_vocab, not a counted
   violation; framework-purity.js:351/388/406).
2. RESIDUE grep: `resume|LinkedIn|scrap|Bright Data|Chrome extension|Jobzooka Launcher` = zero or
   justified-only (the re-domained-not-name-swapped check).
3. framework-purity stays GREEN (no NEW hard violation introduced).
4. Cross-provider READABILITY review (GPT+Claude, gemini dead): reads coherently as a shipped example.

## AC SPINE (product-lead) — per cluster
- **00-canonical** (CORE_BRIEF/PRODUCT_MODEL/USER_COHORTS/GLOSSARY/GOLDEN_PATHS/EVOLUTION/FAILURE_STATES):
  AcmeLaunch defined as launch-planning SaaS; shared spine consistent (idea→plan→milestones→tasks→assets→
  launch→follow-up); no resume/job/recruiter/scraping residue.
- **02-copy** (COPY_STRATEGY 18-hit + SURFACE_MAP): copy voice reads as AcmeLaunch (launch-focused founder
  voice); labels/empty-states/errors/CTAs replace recruiter/job-search framing; no orphaned Jobzooka markers.
- **03-architecture** (~15 files): API/auth/data/contracts describe AcmeLaunch ENTITIES (launch plans,
  milestones, tasks, assets, customers, follow-ups); pipelines/prompts/validation use launch-planning flows,
  NOT resume-parsing/job-scraping/extension automation; 3rd-party/env/security remove Bright Data/LinkedIn/
  Chrome specifics (or replace with coherent AcmeLaunch integrations).
- **GLOBAL:** grep-zero (both roots); residue-grep zero; the 38 canonical ≡ 38 BASELINE (equivalent edits,
  paired relative paths compare cleanly); framework-purity green; no doc reads like a partial find-replace.

## THE RE-DOMAINED CHECK (product-lead — the coherence proof)
A domain-entity TRACE MATRIX across API_SURFACE / DATA_FLOW / DATA-CONTRACTS / FLOW_SPEC / PIPELINES /
PROMPT_TEMPLATES / contracts: every endpoint, persisted field, prompt input/output, step, component, and
long-running job maps to an AcmeLaunch entity/flow; ZERO rows map to old jobzooka entities. Proves the
architecture was genuinely re-domained, not name-swapped.

## READS-WELL BAR (DoP)
A new founder reads any file ALONE + understands AcmeLaunch without knowing jobzooka; name/persona/value-
prop/cohorts/glossary/architecture all describe the SAME product; zero orphaned resume/job/scrape/LinkedIn/
Chrome/Bright-Data references; copy reads like a real shipped example (not placeholder); specific enough to
teach good requirements, generic enough no founder confuses it with WarpOS direction.

## Next: DESIGN
- product-lead (always, block) — author the AcmeLaunch build_spec (the product's full identity + the
  per-cluster re-domaining map) from the AC spine (CLI, I dispatch).
- design-lead (claude, in-process → RELAY to α) — does AcmeLaunch read well as a shipped example? (the
  craft/coherence judgment).
- Then β design→build.
