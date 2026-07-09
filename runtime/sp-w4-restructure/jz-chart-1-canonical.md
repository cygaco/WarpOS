# Jobzooka-Bearing Files: Per-Mention Consumer Chart

Generated: 2026-06-19

## Chart

| File | jz# | Mention Type | Consumer(s) | Valid Template Example? | Disposition |
|------|-----|--------------|-------------|------------------------|------------|
| 00-canonical/CORE_BRIEF.md | 8 | prose-instance (filled-in product description) | HARD: generate-steps-maps.js (mapping reads); SOFT: director-of-product.md, product-lead.md | NO | RELOCATE |
| 00-canonical/EVOLUTION.md | 3 | prose-instance (future feature ideas + product context) | SOFT: director-of-product.md, product-lead.md (referenced for vision grounding) | NO | RELOCATE |
| 00-canonical/FAILURE_STATES.md | 1 | title-heading only | SOFT: quality-lead.md (references for QA discipline); MANIFEST-only (framework template exists in _warpos/templates) | YES (heading is structural, not instance data) | KEEP-FRAMEWORK |
| 00-canonical/GLOSSARY.md | 3 | glossary-entry (table definitions of Jobzooka and Jobzooka Launcher) | HARD: generate-steps-maps.js:154 (reads for Dashboard Activities table); MANIFEST-only (framework template) | NO | RELOCATE |
| 00-canonical/GOLDEN_PATHS.md | 1 | title-heading only | HARD: generate-steps-maps.js:161 (reads for flow diagram); SOFT: design-lead.md, quality-lead.md (golden flows reference) | YES (heading is structural, not instance data) | KEEP-FRAMEWORK |
| 00-canonical/PRODUCT_MODEL.md | 2 | prose-instance + title-heading (product primitives, phase vocabulary, market intelligence) | HARD: generate-steps-maps.js:147 (reads for 10-Step Model); SOFT: director-of-product.md, decision-policy.md (referenced for canonical intent) | NO | RELOCATE |
| 00-canonical/USER_COHORTS.md | 2 | prose-instance + title-heading (user segment descriptions) | SOFT: director-of-growth.md, research-lead.md, design-lead.md, quality-lead.md (cohort-specific guidance) | NO | RELOCATE |
| _audits/01-requirements-audit.md | 1 | audit-finding (platform terminology inconsistency: "Jobzooka Launcher" vs "Chrome extension") | HARD: None (audit record, not actively consumed by code); SOFT: None (no agent spec references this specific audit line) | NO (finding, not template) | KEEP-AS-RECORD |
| 02-copy-system/COPY_STRATEGY.md | 18 | copy-string (framework copy rules; guidelines governing in-app copy with example brand name) | SOFT: None (agent specs do not reference COPY_STRATEGY directly); MANIFEST-only (framework baseline in _warpos/BASELINE) | PARTIAL (some examples like "Jobzooka copy must never add to stress" are illustrative principles; others like "Jobzooka has a direct, competent personality" embed the brand) | GENERICIZE |
| 02-copy-system/SURFACE_MAP.md | 2 | copy-string (framework copy surface rules; references Jobzooka as subject of product rules) | SOFT: None (agent specs do not reference SURFACE_MAP directly); MANIFEST-only (framework baseline in _warpos/BASELINE) | PARTIAL (surface categories and intent/stakes are generic; mentions of "Jobzooka copy" are illustrative of product-specific guidance) | GENERICIZE |

## Cluster Summary

**Filled Product Instance Cluster (00-canonical/* + 02-copy-system/*):** The 10 files contain 41 case-insensitive "Jobzooka" mentions spanning three categories: (1) **Prose instances** (CORE_BRIEF, EVOLUTION, PRODUCT_MODEL, USER_COHORTS)—concrete product descriptions and market-driven feature narratives that should move to the examples/ subdirectory as reference implementations; (2) **Glossary & audit entries** (GLOSSARY, 01-requirements-audit)—product-specific terminology and findings that need extraction to a Jobzooka-scoped audit; (3) **Copy framework** (COPY_STRATEGY, SURFACE_MAP)—guidelines using the brand name in copy principles (e.g., "Jobzooka copy is a product interface") that require genericization to template language (e.g., "The product's in-app copy is a product interface"). HARD consumers: generate-steps-maps.js:147,154,161 and pre-commit-steps-check.js read PRODUCT_MODEL, GLOSSARY, GOLDEN_PATHS for step registry validation (3 files are framework-canonical, not product-instance). SOFT consumers: 9 agent specs reference USER_COHORTS, PRODUCT_MODEL, GOLDEN_PATHS for cohort/intent grounding (governance pointers, not code reads).

