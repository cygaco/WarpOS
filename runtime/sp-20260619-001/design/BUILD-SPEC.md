# SP-20260619-001 build_spec (product-lead, GPT-5.5) — AcmeLaunch genericization (E-DISPATCH-PERFECT-001 W4)

Approach: (b) PARALLEL paired edits — edit each canonical `_requirements/` file AND its
`_warpos/BASELINE/_requirements/` mirror in the SAME packet; no copy step; leave PATH_KEYS.md (out of
scope, the lone non-jobzooka divergence). Both roots → grep-zero independently.

## 1. ACMELAUNCH IDENTITY
- Value prop: AcmeLaunch turns a rough product idea into a launch-ready operating plan: milestones, tasks, launch assets, customer follow-up, and a controlled launch run.
- Persona: solo founders and small teams preparing a first launch, relaunch, waitlist opening, beta, or paid offer without a full growth/ops team.
- Core entities: LaunchPlan, IdeaBrief, FounderProfile, Milestone, Task, LaunchAsset, AudienceSegment, CustomerLead, FollowUpSequence, LaunchRun, LaunchReadinessScore.
- Core flow: idea brief → constraints → audience/channel research → milestones → tasks → assets → launch run → customer follow-up.
- Not-X: not a project-management clone; not a generic template library; not a social scheduler; not a CRM; not a black-box auto-launcher.
- Copy voice: calm, practical, launch-operator direct. Reduces founder anxiety by naming the next concrete action without hype, hustle language, or fake urgency.

## 2. THE RE-DOMAINING MAP (jobzooka → AcmeLaunch)
- Jobzooka → AcmeLaunch
- job seeker → founder / small-team operator
- recruiter/employer → customer / early adopter / launch audience
- resume → IdeaBrief or LaunchPlan (by source-vs-output context)
- resume upload/parse → idea-brief intake / launch-brief extraction
- profile → FounderProfile / VentureProfile
- preferences → launch constraints (timeline, budget, channels, geography, audience, risk limits)
- job listing / job market → launch opportunity landscape (audience segments, channels, competitors, communities, customer pains)
- LinkedIn job content → launch-channel signals / customer-language signals
- Bright Data scraping → Launch Research adapter using founder-approved sources + public launch signals
- market analysis → launch research brief / audience-channel analysis
- job category → launch track / audience segment / channel segment
- targeted resume variant → segment-specific launch asset pack
- master resume → master launch narrative / source-of-truth positioning brief
- general resume → general launch page / baseline pitch
- LinkedIn package → launch asset kit (landing copy, email, social posts, community post, demo script, FAQ)
- form answers → reusable launch responses (FAQ answers, objections, founder replies, support macros)
- auto-apply → guided launch execution / follow-up queue
- Chrome extension / Jobzooka Launcher → AcmeLaunch Launch Console (no browser-extension dep unless the doc is explicitly about optional future integrations)
- apply heuristics → launch rules (who to contact, what channel, when to follow up, when to skip)
- competitiveness score → LaunchReadinessScore
- rockets economy → credits for billable AI/research ops (keep "credits" if metaphor conflicts)
- READY/AIM/FIRE → PLAN/PREP/LAUNCH (unless a file requires neutral phase names)

## 3. PER-CLUSTER EDIT PLAN
- **00-canonical:** rewrite identity, primitives, cohorts, glossary, golden paths, evolution, failure states around AcmeLaunch's launch-planning lifecycle. Replace job-search risks with launch risks (vague positioning, missing audience, stale tasks, asset drift, over-automation, skipped follow-up). verified_by: canonical docs read as ONE coherent AcmeLaunch product; golden paths include idea intake, readiness planning, asset generation, launch run, follow-up.
- **02-copy-system:** re-author copy principles for anxious founders making launch decisions; replace job-search stress/recruiter language with launch uncertainty/focus/momentum/customer-clarity; rename copy surfaces for launch plans/tasks/assets/console/follow-ups. verified_by: no job-search copy residue; CTAs and loading/error examples use AcmeLaunch concepts, no partial-name-swap tone.
- **03-architecture:** re-domain entities/schemas/APIs/data-flow/prompts/pipelines/contracts/component-hierarchy/env/recovery/extension docs to AcmeLaunch domain objects. ENTITY/FLOW MIGRATION, not string replacement. verified_by: every API, field, prompt variable, pipeline stage, dependency edge, component description maps to AcmeLaunch in the trace matrix.
- **Other in-scope requirement files:** apply the same map where consumer-shipped docs mention design/testing/integrations/audits; do NOT preserve jobzooka examples as history inside shipped baseline. verified_by: independent residue-grep across both roots is zero or explicitly justified non-domain.

## 4. verified_by (GLOBAL — the binding gauntlet)
- grep-zero "jobzooka" INDEPENDENTLY in `_requirements/` and `_warpos/BASELINE/_requirements/`.
- residue-grep zero for `resume|LinkedIn|scrap|Bright Data|Chrome extension|Jobzooka Launcher|auto-apply|targeted-resumes` (except justified non-domain, e.g. "resume" as a verb).
- 38 canonical edits have paired 38 `_warpos/BASELINE/_requirements/` mirror edits in the same packets.
- framework-purity remains green (no NEW hard violation).
- the TRACE MATRIX proves every old API/field/prompt/step/entity maps to AcmeLaunch, zero unmapped jobzooka concepts.
- cross-provider readability review confirms no file reads like a partial find-replace.

## 5. SCOPE GUARD
- ONLY edit `_requirements/**` and `_warpos/BASELINE/_requirements/**`.
- Do NOT edit `.claude/project/sprint/**` (history), framework-purity scripts, `PATH_KEYS.md`, epic/tracker/history docs, or non-requirements runtime code.
- Leave canonical and BASELINE as paired mirrors; no copy-after pass.

## 5b. AUGMENTED 03-ARCHITECTURE RE-DOMAINING MAP (design-lead found the gaps; product-lead closed them)
design-lead (GPT craft authority) ruled the original map product-coherent but NOT complete for
03-architecture — the riskiest cluster left concrete jobzooka machinery (BD scraping, JobListing[],
apply_outcomes, the Chrome extension, LinkedIn OAuth, DOCX/PDF build) with no clean AcmeLaunch home.
product-lead AUGMENTED (the design fix-loop, caught at design not build). The entity set grew 11 → 23:
1. **BD scraping → `LaunchResearchRun` + `ResearchSource`** — sources (web_search/public_url/directory/
   social_public/marketplace/uploaded_file/crm_import), consent (approvedBy/scope/allowedUse/credentialMode/
   provenanceUrl), run (launchPlanId/sources[]/querySet[]/status/queryStats/errors[]/snapshotRefs[]); failure =
   persist partial, mark failed sources, bounded retry, NEVER synthesize missing evidence.
2. **JobListing[]/marketRaw/queryStats/BD snapshots → `LaunchResearchResult[]` + `OpportunitySignal` +
   `ChannelSignal` + `ResearchSnapshot`** (result: type opportunity|channel|competitor|audience|pricing,
   evidence[], confidence, rawSnapshotRef).
3. **apply_outcomes/extension-reporting/skipped|failed|applied → `LaunchActionQueueItem` + `LaunchOutcome`**
   (queue: actionType publish|send|follow_up|export|research_review; outcome: status skipped|attempted|
   succeeded|failed|needs_manual, reason, artifactRefs[], reportedBy console|system|user).
4. **chromePrompt/extension-ZIP/CORS/`/extension` → Launch Console re-home, Chrome artifacts DELETED** —
   `GET /launch-console/queue`, `POST /launch-console/outcomes`, `GET /launch-console/prompts/:queueItemId`;
   chromePrompt → `LaunchConsolePrompt`; origin checks → normal app auth/session/CSRF.
5. **LinkedIn content/OAuth → `LaunchChannel` + `ChannelConnection`** (channel: type email|social|community|
   marketplace|ads|content, provider linkedin|x|reddit|email|producthunt|other; LinkedIn = one provider, NOT a primitive).
6. **DOCX/PDF resume build / resume variants → `LaunchAssetPack` + `AssetVariant`** (pack: packType pitch_kit|
   outreach_kit|landing_copy|press_kit|launch_checklist; variant: format md|html|pdf|docx|csv|png, storageKey, checksum).
KEEP (domain-neutral infra, not jobzooka-specific): the async-ticket pattern, chained-Claude.
**FINAL 23 ENTITIES:** LaunchPlan, IdeaBrief, FounderProfile, Milestone, Task, LaunchAsset, AudienceSegment,
CustomerLead, FollowUpSequence, LaunchRun, LaunchReadinessScore, ResearchSource, LaunchResearchRun,
LaunchResearchResult, OpportunitySignal, ChannelSignal, ResearchSnapshot, LaunchChannel, ChannelConnection,
LaunchAssetPack, AssetVariant, LaunchActionQueueItem, LaunchOutcome.
design-lead craft verdict (recorded ok:true): AcmeLaunch reads well at product level (calm/useful/non-hype)
FOR A FOUNDER; with the augmented spine the architecture is no longer "a name replacement over job-search internals."

## 6. β-RATIFIED COHERENCE GATE (DECIDE B 0.89 — the readability review must ASSERT these, not vibes)
β verified the gate correction in code (framework-purity.js:388-390 — domain_vocab deliberately excluded
from violationCount, comment names "E-DISPATCH-PERFECT-001 W4"; so framework-purity-green proves nothing).
The cross-provider readability review's verified_by MUST positively assert 3 coherence properties
(grep-zero proves ABSENCE of the old name, NOT COHERENCE of the replacement — these are the find-replace
failure modes grep can't catch):
1. **NO ORPHANED DOMAIN DETAILS** (the load-bearing check, bigger than the name): jobzooka's PERSONA +
   DOMAIN DETAILS (resumes, applications, recruiters, job-seekers, scraping) survive a name-only swap,
   leaving AcmeLaunch attached to job-app scenarios that no longer fit. The reviewer FLAGS any surviving
   job-app-domain reference now mismatched to AcmeLaunch. (= the 53-file domain-vocab surface, as a review assertion.)
2. **CANONICAL ↔ BASELINE CO-REFERENCE**: the two shipped copies (`_requirements/**` + `_warpos/BASELINE/
   _requirements/**`) must use the IDENTICAL AcmeLaunch name + persona + details — a parallel edit that
   picks even slightly different replacements makes the mirrors DIVERGE (consumer installs one, dev sees
   the other). ASSERT cross-mirror consistency (the AcmeLaunch name/persona is byte-consistent across both
   trees for the edited files), not just independent grep-zero on each.
3. **GRAMMATICAL/REFERENTIAL INTACTNESS**: article/plurality/possessive ("a Jobzooka"→"an AcmeLaunch",
   "Jobzooka's users") must agree; cross-refs ("as described in the Jobzooka brief") must repoint. Reviewer
   flags broken article agreement + dangling cross-refs.
+ **BRAND-NEGATIVE CHECK** (β risk-flag #1 — the INVERSE leak): the new name must NOT be warpos/masterconsole/
  alex-derived (the shipped baseline IS consumer-facing; the masterconsole-branding-boundary). AcmeLaunch is
  a neutral THIRD example, not a self-reference. Assert: grep the edited files for warpos/masterconsole/alex
  newly-introduced = zero.
β risk-flags #2/#3 (confirmed in the scope guard): framework-purity.js stays (it's the SPEC/regression
tripwire — don't remove just because the corpus is now clean); sprint history stays (rewriting falsifies it).
EXAMPLE-PRODUCT CHOICE: β routed it to the design-lead/DoP substance authority (example-copy taste, NOT
WarpOS positioning — not Class-C). AcmeLaunch (DoP's pick) + the design-lead readability bless = that authority.

## ε note (carried to build)
- design-lead readability/coherence consult relayed to α — its envelope blesses AcmeLaunch's coherence + the
  re-domaining map completeness + whether the entity set covers the architecture refs (β's #1-3 are its lens).
- The 03-architecture re-domaining is the highest coherence risk (entities/flows change, not just names) —
  the trace matrix + β's "no orphaned domain details" assertion are the binding proof there. Awaiting the
  design-lead envelope before the design→build β.
