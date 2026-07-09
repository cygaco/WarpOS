# Jobzooka Mention Chart — 03-Architecture Cluster

Per-file JOBZOOKA occurrence analysis with mention types, consumer mapping, and disposition recommendations.

| File | jz# | Mention type | Consumer(s) | Valid template example? | Disposition |
|------|-----|--------------|-------------|-------------------------|-------------|
| API_SURFACE.md | 1 | prose-heading (title) | SOFT: `.claude/agents/engineering/backend/builder.md` (spec reference) | YES | KEEP-FRAMEWORK |
| AUTH_SCHEMAS.md | 2 | prose-heading (title) + env-var-name (`JZ_COOKIE_DOMAIN`) | SOFT: `.claude/agents/engineering/backend/builder.md`, HARD: scripts/delta-dispatch-builder.js:166 (agent handoff) | YES | KEEP-FRAMEWORK |
| COMPONENT_HIERARCHY.md | 1 | prose-heading (title) | SOFT: agent memory + builder specs | YES | KEEP-FRAMEWORK |
| DATA_FLOW.md | 2 | prose-heading (title) + prose-instance (session state overview) | SOFT: builder.md, HARD: scripts/delta-dispatch-builder.js (flow reference) + SOFT: qa-reviewer.md | YES | KEEP-FRAMEWORK |
| DESIGN_TOKENS.md | 2 | prose-heading (title) + prose-instance (token documentation) | SOFT: frontend builder specs (implied component guidance) | YES | KEEP-FRAMEWORK |
| ENV_VARS.md | 6 | env-var-names (NEXT_PUBLIC_API_BASE_URL, JZ_COOKIE_DOMAIN, WEBAUTHN_ORIGIN, jobzooka-pg, jobzooka-results, jobzooka.app), domain/url | SOFT: builder.md reference; MANIFEST-only (shipped in specs but not fs.read by automation) | YES (all legit examples) | KEEP-FRAMEWORK |
| ERROR_RECOVERY.md | 1 | prose-heading (title) | SOFT: product/quality specs; MANIFEST-only | YES | KEEP-FRAMEWORK |
| EXTENSION_SPEC.md | 10 | prose-heading (title) + storage-key-identifier (jobzooka_session, jobzooka_status) + domain/url (jobzooka.io, www.jobzooka.io, localhost) + message-type-identifier (jobzooka_status_update) + manifest-value | HARD: extension/ source code (manifest.json, background.js); SOFT: qa-reviewer.md | YES (all illustrative) | KEEP-AS-EXAMPLE |
| FLOW_SPEC.md | 1 | prose-heading (title) | HARD: scripts/delta-dispatch-builder.js:163 (feature flow discovery); SOFT: multiple agent specs (builder.md:137, qa-reviewer.md:185,198,209,347) | YES | KEEP-FRAMEWORK |
| PERSISTENCE.md | 1 | prose-heading (title) | SOFT: data architecture specs; MANIFEST-only | YES | KEEP-FRAMEWORK |
| PIPELINES.md | 1 | prose-heading (title) | SOFT: backend/worker pipeline specs; MANIFEST-only | YES | KEEP-FRAMEWORK |
| PROMPT_TEMPLATES.md | 1 | prose-heading (title) | HARD: scripts/delta-dispatch-builder.js (agent handoff when feature calls Claude); SOFT: builder.md | YES | KEEP-FRAMEWORK |
| QA-SYSTEM-PROMPT.md | 1 | prose-instance (purpose statement: "Reference document for Alex...Jobzooka QA system") | SOFT: qa-reviewer context; MANIFEST-only | YES | KEEP-FRAMEWORK |
| SECURITY.md | 4 | prose-heading (title) + layer-identifier + domain/url (jobzooka.app, hstspreload.org) + prose-instance (defense-in-depth model) | SOFT: backend builder specs, decision-policy.md; HARD: scripts/checks/test-warpos-ship-coverage.js (allowlist validation) | YES (examples are canonical hardening) | KEEP-FRAMEWORK |
| STACK.md | 2 | prose-heading (title) + app-identifier (jobzooka-backend-staging, jobzooka-pg) | SOFT: deployment/ops specs; MANIFEST-only (deployment topology is illustrative) | YES | KEEP-FRAMEWORK |
| THIRD_PARTY.md | 6 | prose-heading (title) + prose-instance (vendor integration: "Jobzooka maps flexibly", "Jobzooka Handling") + service-descriptor | SOFT: builder specs; MANIFEST-only | YES (vendor examples are instructive, not product-instance) | KEEP-FRAMEWORK |
| VALIDATION_RULES.md | 1 | prose-heading (title) | HARD: scripts/delta-dispatch-builder.js:165 (agent handoff when feature has user inputs) | YES | KEEP-FRAMEWORK |
| contracts/ROUTING.md | 3 | prose-heading (title) + version-comment (breaking change citing "Jobzooka routing surface") + endpoint-destination (jobzooka.fly.dev, jobzooka.com, X-Forwarded-Host) | SOFT: routing specs; MANIFEST-only (contract is consumed by builders, not fs-read) | YES (examples are canonical routing shape) | KEEP-FRAMEWORK |

## Cluster Summary

**Breakdown:** 18 files × 45 total JOBZOOKA mentions (mean 2.5/file). EXTENSION_SPEC.md dominates with 10 mentions (storage keys + domains + message types); ENV_VARS.md contributes 6 (example values); SECURITY.md, THIRD_PARTY.md each 6; remainder ≤4.

**Consumer Pattern:** All files are MANIFEST-owned (shipped in canonical _requirements/03-architecture/). Hard fs.read consumers found in only 4 files: FLOW_SPEC.md + AUTH_SCHEMAS.md + VALIDATION_RULES.md + PROMPT_TEMPLATES.md referenced explicitly by scripts/delta-dispatch-builder.js (agent onboarding builder), and FLOW_SPEC.md + SECURITY.md soft-referenced by builder/qa-reviewer agents. Scripts like test-warpos-ship-coverage.js validate allowlists but don't directly consume SECURITY.md content.

**Mention Type Pattern:** 16 files are prose-headings (title/prefix `# Jobzooka —`); EXTENSION_SPEC.md + ENV_VARS.md carry concrete identifiers (storage keys, env-var names, domains, URLs). All 45 mentions are legitimately illustrative examples (no leaked PII, no env credentials, no product-instance-only content). No mentions are product-secret or instance-specific.

**Disposition Recommendation:** ALL 18 → **KEEP-FRAMEWORK** or **KEEP-AS-EXAMPLE**. EXTENSION_SPEC.md alone warrants **KEEP-AS-EXAMPLE** due to its high density of canonical storage key + messaging identifiers that are part of the core protocol contract (jobzooka_session, jobzooka_status). Remaining 17 are **KEEP-FRAMEWORK** — they are agnostic architectural specs with no product-instance data.

