# W4 RESTRUCTURE: Canonical _requirements/ Partition Plan

Date: 2026-06-19
Analysis scope: WarpOS _requirements/ (99 total files)

---

## Disposition Summary

### Counts
- **Total files analyzed:** 99
- **KEEP (framework template/scaffold):** 51
- **GENERICIZE (template + product example):** 10  
- **RELOCATE (filled product instance):** 32
- **ARCHIVE/DELETE:** 0

### 03-architecture Product Saturation
- **Total files:** 33
- **Product-saturated:** 18 (54.5%)
- **Framework-only:** 15
- **Confirms DUMP claim:** YES - 18/33 verified

### Bootstrap:Spinup Dependency Analysis

**Risk:** NONE

- Canon generator reads FROM _warpos/templates/canonical/*.tmpl ONLY
- Canon generator writes TO product-side _requirements/00-canonical/ (correct)
- canon-no-unfilled-tokens.js reads product OUTPUT, not framework input
- Framework gutting is SAFE; WI-38 degrade is structural in generate.js

### Residual Product Terms
- **Jobzooka:** 12 occurrences (GENERICIZE templates only)
- **AcmeLaunch:** 0 (placeholder transition pending)

---

## GENERICIZE Files (_standards/ et al.)

Framework templates embedding Jobzooka examples inline:

| File | Scrub Target |
|------|-------------|
| _standards/PRD_TEMPLATE.md | Preamble: s/Jobzooka/[product]/g |
| _standards/HIGH_LEVEL_STORIES.md | Title + examples |
| _standards/GRANULAR_STORIES.md | Preamble + examples |
| _standards/STORIES-COMMON.md | Terminology examples |
| 01-design-system/COLOR_SEMANTICS.md | AcmeLaunch palette examples |
| 01-design-system/UX_PRINCIPLES.md | AcmeLaunch workflow examples |
| 09-integrations/PROVIDER/{01-anthropic,02-openai,03-google-gemini,04-stripe}.md | Product-specific config |

---

## RELOCATE (32 files)

### Destination: _warpos/EXAMPLES/AcmeLaunch/_requirements/

**00-canonical/ (7):**
CORE_BRIEF.md, EVOLUTION.md, FAILURE_STATES.md, GLOSSARY.md, GOLDEN_PATHS.md, PRODUCT_MODEL.md, USER_COHORTS.md

**02-copy-system/ (2):**
COPY_STRATEGY.md, SURFACE_MAP.md

**03-architecture/ (18):**
API_SURFACE.md, AUTH_SCHEMAS.md, COMPONENT_HIERARCHY.md, DATA_FLOW.md, DESIGN_TOKENS.md, ENV_VARS.md, ERROR_RECOVERY.md, EXTENSION_SPEC.md, FLOW_SPEC.md, PERSISTENCE.md, PIPELINES.md, PROMPT_TEMPLATES.md, QA-SYSTEM-PROMPT.md, SECURITY.md, STACK.md, THIRD_PARTY.md, VALIDATION_RULES.md, contracts/ROUTING.md

**09-integrations/PROVIDER/ (4):**
06-playwright.md, 08-nextjs.md, 11-fly-io.md, 12-vercel.md

**_audits/ (1):**
01-requirements-audit.md

---

## KEEP (57 files)

No action required. Already project-agnostic framework templates:
- 00-canonical templates (GLOSSARY_TEMPLATE.md, *.json structures)
- 03-architecture framework specs (ACCESSIBILITY_BASELINE, DATA-CONTRACTS, PATH_KEYS, contracts/PAYMENT, etc.)
- 04-features/_example-onboarding (all 5 example template files)
- 05-operations, 06-security, 07-testing, 08-automation frameworks
- 09-integrations/PROVIDER provider integration templates
- 10-contracts, _audits (except 01), _index, _shared, _standards (except 4 GENERICIZE)
- Root README.md

---

## Summary Stats

| Metric | Value |
|--------|-------|
| Total files | 99 |
| KEEP | 51 |
| GENERICIZE | 10 |
| RELOCATE | 32 |
| 03-arch product-saturated | 18/33 |
| Spinup dependency risk | NONE |
| Canon-gen breakage risk | NONE |

---

## Technical Assurances

1. Canon generator reads ONLY _warpos/templates/canonical/*.tmpl (safe)
2. canon-no-unfilled-tokens.js reads product output, not framework (safe)
3. WI-38 degrade is structural in generate.js (safe)
4. Bootstrap:spinup provides own intent input (safe)
