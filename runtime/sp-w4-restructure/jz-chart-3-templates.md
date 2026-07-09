# JOBZOOKA Mention Chart: Templates + Provider-Config Cluster

Per-mention analysis of 10 files bearing JOBZOOKA references. Analysis validates whether jobzooka is a LEGITIMATE FRAMEWORK TEMPLATE EXAMPLE or CONCRETE PRODUCT-INSTANCE CONTENT requiring relocation.

---

## Full Chart (10 rows)

| File | jz# | Mention type | Consumer(s) | Valid template example? | Disposition |
|---|---|---|---|---|---|
| _standards/PRD_TEMPLATE.md | 1 | framework-header (product-name label for template itself) | scripts/lint-prds.js, _warpos/MANIFEST.json (framework owner), .claude/agents (referenced via PRD structure) | YES | KEEP-FRAMEWORK |
| _standards/HIGH_LEVEL_STORIES.md | 2 | framework-header (product-name label) | scripts/lint-hl-stories.js, _warpos/MANIFEST.json (framework owner), project bootstrap | YES | KEEP-FRAMEWORK |
| _standards/GRANULAR_STORIES.md | 2 | framework-header (product-name label) | scripts/lint-stories.js, _warpos/MANIFEST.json (framework owner) | YES | KEEP-FRAMEWORK |
| _standards/STORIES-COMMON.md | 1 | framework-header (product-name label) | scripts/lint-stories.js (COMMON_PATH constant, line 29-31), _warpos/MANIFEST.json (framework owner) | YES | KEEP-FRAMEWORK |
| 01-design-system/COLOR_SEMANTICS.md | 2 | framework-header (line 1) + prose-instance product description (line 9: "Jobzooka uses a dark theme") | scripts/checks/design-system.js (hardcoded doc list, line 20), .claude/agents/engineering/frontend/builder.md, .claude/commands/ui/review.md, design-quality judgment lane | MIXED: header=YES, prose=NO | NEUTRALIZE (replace line 9 product desc with "[Product]") |
| 01-design-system/UX_PRINCIPLES.md | 1 | framework-header only | .claude/agents/engineering/frontend/builder.md, .claude/commands/ui/review.md, design-quality judgment lane | YES | KEEP-FRAMEWORK |
| 09-integrations/PROVIDER/06-playwright.md | 1 | prose-instance (testing directive "for jobzooka work", line 58) | README/docs references only (soft pointer); not a hard linter consumer | NO | GENERICIZE ("for [product] work") |
| 09-integrations/PROVIDER/08-nextjs.md | 1 | domain/url config value (api.jobzooka.app as BACKEND_URL production target, line 58) | _warpos/MANIFEST.json (seeded_from), env-var documentation only | NO | GENERICIZE ("api.[domain].app") |
| 09-integrations/PROVIDER/11-fly-io.md | 6 | config-value + code-identifier (app names: jobzooka-backend, jobzooka-backend-staging, jobzooka-backend-pr-<N> on lines 12, 29-31; WEBAUTHN RP config line 76: WEBAUTHN_RP_ID=jobzooka.app, WEBAUTHN_RP_NAME=Jobzooka) | _warpos/MANIFEST.json (seeded_from), scripts/check-fly-toml.js (linter, line 48 validates fly.toml keys), .github/workflows/backend.yml (CI/deploy reference) | NO | RELOCATE (move app names to .env.example or fly.toml secrets section; RP config to env-based defaults) |
| 09-integrations/PROVIDER/12-vercel.md | 5 | domain/url + config-value (jobzooka.app production URL line 29, jobzooka-<hash>-vercel.app preview pattern line 30, api.jobzooka.app backend URLs lines 39, 82-84) | _warpos/MANIFEST.json (seeded_from), Vercel dashboard env-var documentation only | PARTIAL: URLs are product-instance content | RELOCATE (move to deployment guide or .env.example; replace pattern references with [PROJECT_SLUG] placeholder) |

---

## Cluster Summary

### _standards/* (PRD_TEMPLATE, HIGH_LEVEL_STORIES, GRANULAR_STORIES, STORIES-COMMON)

All four are framework-level HEADERS naming the product in template titles and descriptions. Consumed by lint scripts (`scripts/lint-prds.js`, `scripts/lint-stories.js`, `scripts/lint-hl-stories.js`) as validation metadata. **Disposition: KEEP-AS-FRAMEWORK.** These are legitimate templates whose jobzooka reference is the product name in a header context (e.g., "Jobzooka — High-Level Story Standards"), not product-instance configuration.

### Design-system/* (COLOR_SEMANTICS, UX_PRINCIPLES)

Both are framework templates for design documentation consumed by design-quality agents (`design-quality.md`, `frontend-builder.md`, `frontend-reviewer.md`) and the `/ui:review` command. **COLOR_SEMANTICS**: Line 1 is a framework-header (**KEEP**); line 9 contains product-instance prose ("Jobzooka uses a dark theme...") — **NEUTRALIZE** to "[Product] uses a dark theme...". **UX_PRINCIPLES**: Framework-header only; **KEEP-FRAMEWORK.**

### PROVIDER/* (06-playwright, 08-nextjs, 11-fly-io, 12-vercel)

Mixed product-instance content (app names, URLs, domain references); all seeded in `_warpos/MANIFEST.json` as framework templates. However, operator's hypothesis (these are "valid illustrative examples") does NOT hold — all jobzooka references are concrete product-instance configuration values, not placeholder examples:
- **06-playwright.md** (line 58): "for jobzooka work" is a product operation directive — **GENERICIZE**.
- **08-nextjs.md** (line 58): `api.jobzooka.app` is a hard-coded backend URL — **GENERICIZE** to `api.[domain].app`.
- **11-fly-io.md** (lines 12, 29-31, 76): App names and WebAuthn RP config are product-instance values — **RELOCATE** to environment variables.
- **12-vercel.md** (lines 29-30, 39, 82-84): Production and preview URLs are hard-coded product URLs — **RELOCATE** to deployment guide or `.env.example`.

**Outcome:** 4 files are framework-safe (KEEP-FRAMEWORK). 1 file requires inline neutralization (COLOR_SEMANTICS). 5 files require refactoring (2 GENERICIZE, 3 RELOCATE).

