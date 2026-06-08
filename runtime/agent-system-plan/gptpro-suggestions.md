# WarpOS `_guides` and `_knowledge` Review — Suggestions Pack

**Date reviewed:** 2026-06-07  
**Input reviewed:** uploaded `package.zip`, limited to `_guides/` and `_knowledge/`  
**Additional context:** WarpOS repo and uploaded WarpOS product-foundry context  
**Audience:** the AI/system that produced the existing guides, plus WarpOS maintainers  
**Output type:** suggestions only; do not treat this as legal advice, compliance certification, or a security audit attestation

---

## 0. How to use this file

Feed this entire file back to the AI that generated the current `_guides` and `_knowledge` folders. Ask it to update only the relevant guide/knowledge material unless a suggested WarpOS hook, command, test, or registry change requires a supporting file elsewhere.

The update goal is not to make the docs scarier. The goal is to help a non-technical founder launch with a sane minimum standard, while routing high-risk cases to expert help early.

Use this operating principle throughout:

> **Guides should help vibe coders move fast safely. Knowledge files should train agents to enforce the guides. Neither should tell founders “you are compliant.” They should say “these controls reduce obvious risk; stop and get expert review when the risk flags say so.”**

When applying these suggestions, preserve the current approachable tone: the existing “🔴 YOU / 🤖 AI / 🧒 newbie note” pattern is one of the strongest parts of the package.

---

## 1. Executive verdict

The current material is a strong first draft. It is unusually founder-friendly and covers many real launch blockers that zero-technical founders miss: developer-account delays, Apple/Google review friction, auth setup, privacy-policy and data-safety mismatches, Stripe verification, transactional email, RLS, secrets, rate limits, prompt injection, backups, and incident response.

However, it is **not yet production-grade** because too much of the guidance is still educational rather than enforceable. WarpOS should not merely explain security and compliance risks; it should convert them into agent checks, hooks, evidence packs, hidden tests, launch gates, and “stop/go/escalate” decisions.

The highest-value improvements are:

1. Add a missing `_guides/README.md` and fix all broken links.
2. Add source freshness metadata and a validator for volatile claims.
3. Reframe legal/compliance content as **risk routing**, not legal determination.
4. Add machine-readable rules in `_knowledge` that agents can apply during build/review.
5. Add a launch evidence pack template that founders can actually complete.
6. Add missing coverage for AI governance, accessibility, supply-chain security, UGC/trust & safety, privacy operations, advertising claims, age/children/sensitive data, and vendor/SDK risk.
7. Map every guide to WarpOS commands, hooks, review agents, and hidden fixtures.

---

## 2. What I found in the uploaded package

### 2.1 Inventory

The package contains:

- 10 Markdown guides under `_guides/`:
  - `API_LIMITS_GUIDE.md`
  - `APP_STORE_GUIDE.md`
  - `AUTH_GUIDE.md`
  - `DATABASE_GUIDE.md`
  - `DEV_SETUP_GUIDE.md`
  - `EMAIL_GUIDE.md`
  - `LEGAL_GUIDE.md`
  - `PAYMENTS_GUIDE.md`
  - `PRIVACY_GDPR_GUIDE.md`
  - `SECURITY_GUIDE.md`
- 15 Markdown knowledge files under `_knowledge/`:
  - `_knowledge/compliance/APP_STORE_AND_PLATFORM_POLICY.md`
  - `_knowledge/compliance/CONSUMER_PROTECTION_AND_SUBSCRIPTIONS.md`
  - `_knowledge/compliance/IP_AND_TRADEMARK.md`
  - `_knowledge/compliance/PRIVACY_AND_DATA_COMPLIANCE.md`
  - `_knowledge/compliance/README.md`
  - `_knowledge/security/AUTHENTICATION_AND_SESSION.md`
  - `_knowledge/security/AUTHZ_AND_TENANT_ISOLATION.md`
  - `_knowledge/security/INPUT_VALIDATION_AND_INJECTION.md`
  - `_knowledge/security/LOGGING_BACKUP_IR.md`
  - `_knowledge/security/MOBILE_CLIENT_SECURITY.md`
  - `_knowledge/security/PROMPT_INJECTION_AND_LLM.md`
  - `_knowledge/security/RATE_LIMITING_AND_ABUSE.md`
  - `_knowledge/security/README.md`
  - `_knowledge/security/SECRETS_AND_CONFIG.md`
  - `_knowledge/security/WEB_SECURITY_HEADERS_CSRF_CORS.md`
- 2 registry files and 2 domain descriptor files.

Approximate content size: ~75,000 words. The material is substantial enough that future updates should use validators and source-freshness gates, not manual review alone.

### 2.2 Strong parts to preserve

Preserve these patterns:

- **Plain-English founder education.** The tone makes scary infrastructure and compliance concepts understandable.
- **The 🔴 YOU / 🤖 AI split.** This is exactly right for non-technical founders: founders must own accounts, secrets, legal claims, payment identity, tax/banking, final disclosures, and business-risk decisions; agents can draft, wire, test, and remind.
- **Lead-time framing.** The guides correctly emphasize day-zero tasks: app-store enrollment, Play closed testing, DNS propagation, Stripe verification, OAuth consent, API tier warm-up, support inboxes, and business identity checks.
- **Security defaults.** RLS, least privilege, managed auth, secret hygiene, rate limiting, webhook signatures, backups, and incident response are covered more strongly than most founder-facing guides.
- **Knowledge-library intent.** The `_knowledge` files are clearly designed to train agents rather than duplicate founder-facing text. Keep that separation.

### 2.3 Key weaknesses

The current package needs these systemic fixes:

- The `_guides` folder references a shared `README.md`, but `_guides/README.md` is missing.
- A few internal links resolve incorrectly.
- Some volatile claims are presented too confidently without a source freshness protocol.
- Some compliance guidance reads like “here is the rule” rather than “here are the risk flags, evidence, and when to escalate.”
- The knowledge files include good prose but not enough machine-readable rule structure for agents.
- Registries are manually maintained and already show drift.
- There is no single launch evidence pack that consolidates what a founder must collect before shipping.
- There are not enough automated acceptance criteria connecting the guides to WarpOS hooks, scans, red-team prompts, and release gates.

---

## 3. Priority 0 fixes — do these before content expansion

### P0.1 Add `_guides/README.md`

Current guide files repeatedly reference `_guides/README.md` or `README.md`, but no such file exists in `_guides/`. Add it.

Purpose of `_guides/README.md`:

- Explain the guide library.
- Define the 🔴 YOU / 🤖 AI / 🧒 convention.
- Explain “day-zero slow clocks.”
- Define “legal/compliance/security guidance is not certification.”
- Give the risk-tier routing table.
- Tell founders which accounts to create immediately.
- Link every guide in the recommended order.
- Explain evidence packs and launch gates.

Suggested skeleton:

```md
# WarpOS Launch Guides — Start Here

These guides help non-technical founders launch safer apps with AI assistance.
They do not replace lawyers, accountants, security professionals, app-store reviewers, payment providers, or platform policies.

## Symbols

- 🔴 YOU: a human founder must do this or make this decision.
- 🤖 AI: your WarpOS agent can draft, implement, test, or remind.
- 🧒 Newbie note: plain-English explanation.
- 🛑 Stop gate: do not ship until resolved.
- 📦 Evidence: save proof in the launch evidence pack.

## The day-zero rule

Start slow human/bureaucratic tasks immediately: app-store accounts, Stripe verification, domain/DNS, OAuth consent, API-provider limits, business identity, privacy/legal review, and closed testing.

## The golden rule on compliance

WarpOS can reduce obvious risk. WarpOS cannot certify that you are compliant. When a guide says “stop and get expert help,” do that before launch.

## Recommended path

1. DEV_SETUP_GUIDE
2. AUTH_GUIDE
3. DATABASE_GUIDE
4. SECURITY_GUIDE
5. PRIVACY_GDPR_GUIDE
6. LEGAL_GUIDE
7. PAYMENTS_GUIDE
8. EMAIL_GUIDE
9. API_LIMITS_GUIDE
10. APP_STORE_GUIDE
11. LAUNCH_READINESS_CHECKLIST
```

### P0.2 Fix broken internal links

Detected broken Markdown links:

| File | Link target | Suggested fix |
|---|---|---|
| `_guides/EMAIL_GUIDE.md` | `./README.md` | Add `_guides/README.md`; keep relative link valid. |
| `_guides/PAYMENTS_GUIDE.md` | `./README.md` | Add `_guides/README.md`; keep relative link valid. |

Additional non-Markdown references that should be resolved or clarified:

| File | Reference | Suggested fix |
|---|---|---|
| `_guides/SECURITY_GUIDE.md` | `_guides/INPUT_VALIDATION_AND_INJECTION.md` | Either create a founder-facing guide at that path or change the reference to `_knowledge/security/INPUT_VALIDATION_AND_INJECTION.md`. |
| `_knowledge/security/LOGGING_BACKUP_IR.md` | `RUNBOOK.md` | Add an incident-response runbook template or point to a new `_guides/INCIDENT_RESPONSE_RUNBOOK.md`. |
| `_knowledge/security/registry.json` | “keep in sync with the 6 refs” | Update count or make count generated; current security library has more than 6 references. |

Add a WarpOS validator:

```bash
/scan:references --scope _guides,_knowledge --fail-on-missing
```

It should fail if:

- A Markdown link points to a missing local file.
- A registry path does not exist.
- A guide references `_guides/README.md` and that file is missing.
- A knowledge README table omits a registered file.
- A registry mentions a stale count.

### P0.3 Add source freshness metadata to every volatile file

The guides contain claims about Apple review, Google Play testing, FTC click-to-cancel, OpenAI tiers, privacy laws, app-store payments, platform AI disclosure rules, email deliverability, and OAuth/security best practices. These can change.

Add frontmatter fields to all guide and knowledge files:

```yaml
last_reviewed: "2026-06-07"
next_review_due: "2026-09-07"
volatility: low|medium|high|critical
source_freshness_required: true|false
owner_agent: compliance-reviewer|security-reviewer|launch-planner|platform-policy-reviewer
source_authority: primary|secondary|mixed
```

Recommended volatility levels:

| Area | Volatility | Reason |
|---|---:|---|
| Apple/Google store policy | critical | Active legal/platform flux and regional differences. |
| Payments/subscriptions/cancel flows | critical | FTC/state/app-store rules shift; enforcement risk is high. |
| Privacy/AI laws | critical | New U.S. state privacy laws and EU AI Act obligations are rolling out. |
| API limits/provider tiers | high | Provider limits and tier mechanics change constantly. |
| OAuth/security best practices | medium | Standards evolve, but less frequently than platform policy. |
| Core security principles | low/medium | Stable, but mappings should update to current OWASP/NIST versions. |

Add a required freshness gate:

```bash
/source:freshness --scope _guides,_knowledge --fail-if-overdue --fail-if-critical-unverified
```

Behavior:

- Critical volatile files cannot pass launch if `last_reviewed` is older than 30 days.
- High volatile files cannot pass if older than 60 days.
- Medium volatile files cannot pass if older than 120 days.
- Low volatile files cannot pass if older than 180 days.
- Any file with `source_freshness_required: true` must include primary-source URLs.

### P0.4 Separate “legal fact,” “platform policy,” “best practice,” and “risk advice”

Every compliance guide should label each assertion as one of:

- `[LAW / REGULATION]` — legal requirement or regulatory obligation. Must cite primary source when feasible.
- `[PLATFORM RULE]` — Apple, Google, Stripe, OpenAI, app marketplace, domain/DNS/email provider requirement.
- `[CONTRACT / TERMS]` — terms imposed by vendors or app stores.
- `[SECURITY CONTROL]` — engineering control.
- `[BEST PRACTICE]` — strong recommendation, not itself a rule.
- `[RISK ROUTING]` — a trigger to get legal/security/privacy expert review.
- `[FLUX]` — rule is changing, disputed, jurisdiction-specific, or recently updated.

The current APP_STORE guide already starts this pattern. Expand it across all legal, privacy, payment, email, app-store, and AI-governance material.

### P0.5 Add an “evidence pack” requirement

Before launch, founders need proof, not just checkboxes. Create `_guides/LAUNCH_EVIDENCE_PACK.md` or include this in `LAUNCH_READINESS_CHECKLIST.md`.

Minimum evidence folders:

```txt
_launch_evidence/
  00_overview/
    product_summary.md
    launch_decision.md
    risk_routing.md
  01_accounts/
    apple_developer_status.md
    google_play_status.md
    stripe_verification.md
    domain_dns.md
    api_provider_limits.md
  02_security/
    security_checklist.md
    rls_tests.md
    secret_scan.md
    dependency_scan.md
    backup_restore_test.md
    incident_runbook.md
  03_privacy/
    data_inventory.md
    vendor_register.md
    privacy_policy_snapshot.md
    cookie_tracking_decision.md
    dsar_delete_flow.md
    app_store_privacy_labels.md
    google_data_safety.md
  04_legal_commercial/
    terms_snapshot.md
    subscription_disclosures.md
    refund_cancel_flow.md
    trademark_name_check.md
    ai_disclosures.md
  05_platform/
    app_review_notes.md
    test_accounts.md
    screenshots.md
    store_listing_copy.md
    content_rating.md
  06_release/
    qa_report.md
    redteam_report.md
    launch_metrics_plan.md
    rollback_plan.md
```

Add this release gate:

```bash
/launch:preflight --require-evidence-pack
```

A launch should be blocked if critical evidence is missing for the product’s risk tier.

---

## 4. Recommended risk-tier model for founders

Add this to `_guides/README.md`, `LEGAL_GUIDE.md`, `PRIVACY_GDPR_GUIDE.md`, and the launch checklist.

### Green — self-serve launch path

A founder can usually proceed with the full WarpOS checklist and no special expert review when all are true:

- Adult general-audience users only.
- No children under 13/16 targeted or likely.
- No health, finance, legal, housing, employment, education-admission, insurance, credit, gambling, crypto exchange, cannabis, biometric, precise-location, or regulated advice use case.
- No sensitive personal data.
- No user-generated content visible to other users.
- No subscriptions, free trials, or recurring billing, or recurring billing is handled entirely through a mature provider flow and still reviewed for clear disclosures.
- No AI system making consequential decisions about users.
- No scraping of third-party sites, copyrighted corpora, private communities, or social graphs.
- Minimal analytics; no sale/share of personal information; no ad retargeting.

### Yellow — enhanced checklist + explicit human review

Proceed only after a higher-friction review if any are true:

- Subscriptions, free trials, negative-option offers, coupons, discount timers, or renewal flows.
- AI-generated outputs shown to users or relied on by users.
- User-generated content, profiles, comments, messages, uploads, or social features.
- OAuth scopes beyond basic profile/email.
- App-store distribution.
- Users in the EU, California, or multiple U.S. states with privacy rights.
- Marketing emails, lead magnets, affiliate offers, testimonials, performance claims, “AI can do X” claims, or comparative advertising.
- Third-party SDKs for analytics, attribution, crash reporting, ads, payments, or AI.
- Any B2B product that stores customer business data.

Yellow does not mean “don’t ship.” It means: collect evidence, run the enhanced checklists, and require founder sign-off.

### Red — stop and get expert review before launch

Do not launch without legal/security/privacy expert review if any are true:

- Children, students, minors, or age-gated communities.
- Health, mental health, medical, wellness claims that could be interpreted as treatment, diagnosis, or emergency support.
- Finance, credit, loans, insurance, taxes, investment, employment, housing, immigration, legal services, or education-access decisions.
- Biometric data, precise geolocation, government IDs, background checks, criminal records, or sensitive demographic data.
- AI systems that rank, score, recommend, approve, deny, monitor, or profile people in consequential contexts.
- Gambling, sweepstakes, contests, crypto exchange, cannabis, alcohol, adult content, regulated goods, or regulated marketplaces.
- Large-scale scraping, copyrighted training data, competitor cloning, celebrity/personality imitation, or trademark-risk product names.
- Security-critical apps, VPNs, parental control, surveillance, employee monitoring, or dual-use cyber tooling.
- HIPAA/BAA claims, SOC 2 claims, GDPR adequacy claims, “fully compliant” claims, or security certifications that have not actually been completed.

Add this as a machine-readable product-risk gate:

```yaml
risk_tier: green|yellow|red
risk_flags:
  - subscriptions
  - ai_outputs
  - user_generated_content
  - eu_users
  - california_users
  - sensitive_data
  - minors
  - regulated_domain
required_reviews:
  - founder
  - security-reviewer
  - compliance-reviewer
  - legal-expert-if-red
```

---

## 5. File-by-file suggestions for `_guides`

### 5.1 `API_LIMITS_GUIDE.md`

**Keep:** The guide does a good job explaining rate limits in human terms and correctly says provider dashboards are the source of truth.

**Fix/expand:**

1. Avoid hard-coding provider tier mechanics except as dated examples.
   - Keep “RPM/TPM/RPD/TPD exist” as stable.
   - Mark exact tier ladders, account-age requirements, dollar thresholds, and specific model caps as volatile.
   - Make the founder collect screenshots or pasted dashboard values in the evidence pack.

2. Add an “API budget worksheet”:

```md
## API Capacity Worksheet

- Provider:
- Account/org/project:
- Current tier:
- Current RPM:
- Current TPM:
- Current RPD/TPD:
- Current dollar hard cap:
- Expected launch-day users:
- Calls per user per session:
- Average input tokens:
- Average output tokens:
- Worst-case busy-minute calls:
- Worst-case busy-minute tokens:
- Safety factor: 3x minimum
- Result: pass / needs queue / needs rate-limit increase / needs fallback / do not launch
```

3. Add load-test acceptance criteria:

- Simulated launch traffic stays under 50–70% of provider RPM/TPM after safety factor.
- 429 responses trigger exponential backoff with jitter.
- Queue drains safely.
- User receives graceful “try again shortly” message.
- Abuse or cost spike can be stopped with a kill switch.
- Per-user quotas prevent one user from consuming the whole provider quota.

4. Add a cost safety section:

- Daily spend cap.
- Monthly budget alert.
- Per-user usage cap.
- Expensive model routing rules.
- Admin kill switch.
- Alert on unusual usage.

5. Add multi-provider caution:

Fallback providers reduce outage risk but add privacy, terms, output quality, and cost risk. The fallback path must have its own privacy disclosure and evaluation tests.

**WarpOS hook/gate:**

```bash
/api:capacity-check --evidence _launch_evidence/01_accounts/api_provider_limits.md
```

Block launch if no provider capacity evidence exists for any production AI/email/SMS/payment API.

---

### 5.2 `APP_STORE_GUIDE.md`

**Keep:** The Apple/Google split, review-cycle framing, and account-signup lead-time guidance are useful.

**Fix/expand:**

1. Treat all review-time estimates as non-guaranteed.
   - Keep “budget for rejection/resubmission.”
   - Avoid universal claims like “1 in 6 rejected” unless tied to a dated primary source.

2. Add explicit source-freshness gates for:
   - Apple App Review Guidelines.
   - Apple privacy manifests and required-reason APIs.
   - Apple Sign in with Apple / login services requirements.
   - Apple account deletion requirements.
   - Apple IAP vs external payment rules by region.
   - EU alternative distribution and external purchase link entitlement.
   - Google Play Data Safety form.
   - Google Play closed-test requirements for new personal accounts.
   - Google content ratings, target audience, ads, families, subscriptions, and data deletion.

3. Add a “store listing truthfulness” checklist:

- Screenshots match actual app behavior.
- AI capabilities are not exaggerated.
- Privacy claims match code and SDKs.
- Subscription copy is clear before purchase.
- Support contact works.
- Account deletion path is in-app where required.
- Demo account works for reviewers.
- Reviewer notes explain gated features and paid flows.
- “Sign in with Apple” or equivalent login requirement is satisfied where applicable.

4. Add a regional payment decision matrix:

| Region/storefront | Digital goods? | Physical goods/services? | IAP required? | External link allowed? | Entitlement needed? | Evidence |
|---|---|---:|---:|---:|---:|---|
| U.S. iOS | | | | | | |
| EU iOS | | | | | | |
| Android / Play | | | | | | |
| Web | | | | | | |

5. Add UGC/trust & safety if the app has profiles, comments, uploads, chat, shared AI content, or public listings:

- Reporting mechanism.
- Blocking/muting.
- Moderation queue.
- Abuse/contact email.
- Terms prohibiting harmful content.
- Takedown workflow.
- Evidence of moderation test.

6. Add privacy-manifest/SDK inventory:

```md
| SDK | Purpose | Data collected | Privacy manifest present? | Required reason APIs? | Apple/Google declaration updated? | Remove? |
|---|---|---|---|---|---|---|
```

**WarpOS hook/gate:**

```bash
/stores:prepare --ios --android --privacy-diff --sdk-inventory
```

Block mobile launch if app-store privacy declarations do not match code dependencies, SDKs, permissions, and actual data flows.

---

### 5.3 `AUTH_GUIDE.md`

**Keep:** Managed auth, basic OAuth setup, and social-login practicality are appropriate for novice founders.

**Fix/expand:**

1. Update OAuth guidance against current RFC 9700 security best current practice.

Add plain-English rules:

- Use authorization code flow with PKCE for public clients.
- Never use implicit flow for new apps.
- Exact redirect URI matching.
- No open redirectors.
- Use `state` for CSRF protection.
- Keep tokens server-side where possible.
- Request the smallest scopes possible.
- Rotate/revoke tokens on account deletion or disconnect.

2. Add auth evidence requirements:

- Provider used.
- Enabled login methods.
- OAuth scopes.
- Redirect URIs.
- Session expiration rules.
- MFA/admin access rules.
- Test account credentials for reviewers.
- Account deletion path.
- Password reset/magic-link abuse limits.

3. Add account lifecycle flows:

- Signup.
- Login.
- Logout.
- Password reset/magic link.
- Email change.
- Account deletion.
- Session revocation.
- Social login disconnect.
- Admin impersonation disabled or audited.

4. Add role/tenant testing:

- User A cannot see User B data.
- Org member cannot access another org.
- Removed member loses access immediately.
- Free user cannot access paid feature through API call.
- Admin endpoints reject non-admins server-side.

5. Add native-app auth guidance:

- Use platform-secure browser flows, not embedded webviews for OAuth.
- Store tokens in Keychain/Keystore/Secure Enclave equivalents.
- Never ship client secrets in mobile apps.

**WarpOS hook/gate:**

```bash
/auth:review --oauth --sessions --tenant-isolation --account-deletion
```

Block launch if auth flows exist without object-level authorization tests.

---

### 5.4 `DATABASE_GUIDE.md`

**Keep:** The RLS emphasis is excellent and especially important for Supabase/vibe-coded apps.

**Fix/expand:**

1. Add “database launch invariants”:

- RLS enabled on every user-data table.
- No app path uses service-role keys from client/browser/mobile code.
- Every user-data query is scoped by `user_id`, `org_id`, or membership table.
- Migrations are version-controlled.
- Backups are enabled.
- Restore test completed.
- Data retention and deletion strategy defined.
- Audit fields exist where needed.

2. Add founder-friendly data classification:

| Data type | Examples | Store? | Encrypt? | Delete? | Red flag? |
|---|---|---:|---:|---:|---:|
| Account data | email, name | yes | normal | on request | medium |
| Payment data | card numbers | no; use Stripe | n/a | n/a | high |
| Sensitive data | health, biometric, precise location | avoid | expert review | expert review | red |
| Uploaded files | images, PDFs | maybe | access control | delete flow | medium/high |
| Logs | IPs, user actions | minimal | retention | rotate | medium |

3. Add deletion and retention operations:

- Soft delete vs hard delete rules.
- Backup retention expectations.
- How deletion requests interact with logs, invoices, fraud records, and backups.
- What data cannot be deleted immediately for legal/accounting/security reasons.
- User-facing copy that avoids overpromising instant deletion from all backups.

4. Add migration safety:

- No destructive production migration without backup.
- Backfill plan.
- Rollback plan.
- Migration tested on staging copy.
- RLS policies tested after schema changes.

5. Add common AI-generated database mistakes:

- Missing RLS on newly created tables.
- Policies that only check authenticated users, not ownership.
- Public buckets for private files.
- Server actions that trust client-supplied `user_id`.
- Service-role key leaked to frontend.
- No unique constraints for idempotency.
- No transaction around payment/subscription updates.

**WarpOS hook/gate:**

```bash
/db:rls-audit --fail-open-policies --test-cross-tenant
/db:backup-restore-test --evidence _launch_evidence/02_security/backup_restore_test.md
```

---

### 5.5 `DEV_SETUP_GUIDE.md`

**Keep:** Day-zero developer account guidance is one of the most valuable founder-facing pieces.

**Fix/expand:**

1. Add a single “slow clocks” matrix:

| Setup item | Typical blocker | Founder action | Evidence |
|---|---|---|---|
| Apple Developer | ID, 2FA, D-U-N-S, payment, agreements | enroll early | screenshot/status note |
| Google Play | identity, org/personal choice, closed test | create early | status note |
| Stripe | identity, bank, business verification | verify early | verification status |
| Domain/DNS | domain purchase, DNS propagation | buy early | DNS records |
| Email provider | SPF/DKIM/DMARC, warm-up | configure early | verified domain |
| OAuth consent | branding/scopes/review | configure early | consent screen status |
| API providers | rate limits and spend caps | create early | dashboard screenshot |
| Business entity | name, tax, bank, D-U-N-S | decide early | status note |

2. Clarify account-type tradeoffs:

- Individual vs organization developer accounts.
- Public contact details and trader status.
- Business name consistency across Apple, Google, Stripe, domain, email, privacy policy, and terms.
- Why changing names later can be painful.

3. Add “founder cannot delegate” tasks:

- Identity verification.
- Tax/banking.
- Legal agreements.
- Payment account ownership.
- Secrets entry.
- Final policy truth claims.
- Production-release approval.

4. Add “account recovery” basics:

- Use a durable email address, not a throwaway.
- Enable 2FA and recovery options.
- Store recovery codes in a password manager.
- Avoid one contractor controlling the only admin account.
- Add at least two admins for business-critical accounts.

**WarpOS hook/gate:**

```bash
/setup:slow-clocks --check-evidence
```

Warn at project start if slow-clock accounts are missing.

---

### 5.6 `EMAIL_GUIDE.md`

**Keep:** The transactional vs marketing distinction, DNS explanation, and deliverability warnings are strong.

**Fix/expand:**

1. Add email classification:

| Email type | Examples | Consent needed? | Unsubscribe? | Provider setup |
|---|---|---:|---:|---|
| Transactional | login, receipt, password reset | no marketing consent | usually no | transactional provider |
| Product lifecycle | onboarding, usage reminders | depends | recommended | careful segmentation |
| Marketing | newsletters, promotions | yes/legitimate basis | yes | marketing provider |
| Legal/security | terms update, breach notice | usually necessary | no marketing opt-out | careful copy |

2. Add anti-spam/compliance basics:

- Sender identity must be accurate.
- Physical mailing address may be required for marketing emails in some jurisdictions.
- Unsubscribe must be honored quickly.
- Do not mix marketing into transactional emails.
- Keep consent/source records for subscribed users.
- Suppression list must not be accidentally deleted.

3. Add DNS checklist:

- SPF.
- DKIM.
- DMARC.
- Return-path/bounce handling.
- Custom tracking domain if used.
- Domain alignment.

4. Add deliverability operations:

- Bounce handling.
- Complaint monitoring.
- Warm-up for new sending domains.
- Rate limits.
- Retry/backoff.
- Idempotency for transactional emails.
- Monitoring for password reset/login email failures.

5. Add privacy tie-in:

- Email provider is a vendor/subprocessor.
- Add provider to vendor register.
- Update privacy policy.
- Ensure deletion/export workflows account for email provider data.

**WarpOS hook/gate:**

```bash
/email:preflight --dns --unsubscribe --classification --vendor-register
```

---

### 5.7 `LEGAL_GUIDE.md`

**Keep:** Founder education around terms, privacy policy, acceptance evidence, subscriptions, IP, and business shields is useful.

**Critical fix:** Reframe as legal-risk routing. Do not imply that template terms or AI-drafted policies equal legal compliance.

Suggested top warning:

```md
This guide helps you avoid obvious launch mistakes and collect evidence for review. It is not legal advice. WarpOS can draft and check consistency; a qualified lawyer must review red-flag products and material legal commitments.
```

**Fix/expand:**

1. Add the Green/Yellow/Red risk model from Section 4.

2. Add “legal promises inventory”:

Every user-facing claim should be captured:

| Claim | Where shown | Evidence | Owner approved? | Risk |
|---|---|---|---:|---:|
| “Secure” | landing page | security controls | | medium |
| “GDPR compliant” | footer | legal review needed | | red |
| “Cancel anytime” | pricing | cancellation flow screenshot | | high |
| “AI detects X” | hero | eval results | | high |

3. Add “do not say unless proven” list:

- “GDPR compliant.”
- “HIPAA compliant.”
- “SOC 2 compliant.”
- “Bank-level security.”
- “Military-grade encryption.”
- “Anonymous” when re-identification may be possible.
- “We never share data” if any vendor receives data.
- “Cancel anytime” if cancellation is not immediate and easy.
- “No tracking” if analytics, attribution, session replay, or ad SDKs exist.
- “Your data is deleted” if backups/logs retain it beyond the user-facing delete action.

4. Update subscriptions/click-to-cancel language:

- Do not present the FTC 2024 click-to-cancel amendments as current binding U.S. federal law without context.
- State that the U.S. subscription/negative-option landscape is volatile, with federal, state, app-store, card-network, and platform requirements overlapping.
- Still recommend easy same-channel cancellation because it is safer, user-friendly, and often required by platforms or state laws.
- Add a source-freshness gate before any launch with recurring billing.

5. Add “terms acceptance evidence”:

- Terms version.
- Privacy version.
- Timestamp.
- User ID/email.
- IP/user agent if appropriate.
- Checkout/session ID.
- Checkbox or clickwrap UI screenshot.
- Version-change notice history.

6. Add IP/trademark safety:

- Search app name in app stores, USPTO/TESS, domain, GitHub/npm, major search engines.
- Avoid confusingly similar names/logos.
- Track fonts, icons, images, templates, music, and datasets licenses.
- Record AI-generated asset provenance.
- Flag GPL/AGPL/copyleft dependencies for review.

7. Add “regulated domain stop gates”:

- Medical/health.
- Mental health.
- Financial/tax/investment/credit.
- Legal.
- Employment/housing/education decisions.
- Children.
- Biometric/identity verification.
- Gambling/sweepstakes/crypto/cannabis/alcohol/adult.

**WarpOS hook/gate:**

```bash
/legal:flags --claims --subscriptions --ip --regulated-domain --evidence-pack
```

Output should be “no red flags detected,” “yellow flags require founder approval,” or “red flags require expert review.” It should never say “legally compliant.”

---

### 5.8 `PAYMENTS_GUIDE.md`

**Keep:** Stripe-focused practical setup and webhook discussion are valuable.

**Fix/expand:**

1. Add payment-model matrix:

| Model | Examples | Key risks | Required controls |
|---|---|---|---|
| One-time digital | lifetime access | refund/dispute, app-store IAP | receipt, refund policy |
| Subscription | monthly SaaS | renewal/cancel disclosure | clear pricing, portal, cancel flow |
| Free trial | trial-to-paid | negative option risk | reminder/disclosure/consent |
| Usage-based | tokens/credits/API calls | surprise billing | caps, usage dashboard, alerts |
| Marketplace | creators/service providers | money transmission/tax/KYC | expert review |
| Physical goods/services | merchandise, bookings | shipping/tax/refunds | commerce policy |

2. Add subscription acceptance criteria:

- Price, billing period, renewal terms, trial length, and cancellation method visible before checkout.
- User receives receipt/confirmation.
- User can cancel without contacting support unless business model truly requires support.
- Cancellation flow tested on web and mobile.
- Webhook updates entitlement quickly and idempotently.
- Failed payment, grace period, and downgrade behavior defined.
- Refund and dispute workflows defined.

3. Add webhook security checklist:

- Verify signature.
- Use idempotency keys/event IDs.
- Do not trust client-side payment success alone.
- Store event audit log.
- Reconcile subscription state periodically from provider.
- Test replayed events.
- Test out-of-order events.
- Test failed payments and cancellations.

4. Add “Stripe is not your legal shield” note:

Stripe handles card data and many PCI burdens when used correctly, but it does not make pricing, subscriptions, refunds, taxes, app-store policy, consumer law, or marketing claims automatically compliant.

5. Add app-store payment interaction:

- Digital goods in iOS apps may require Apple IAP unless an exception/entitlement applies.
- Physical goods/services usually use external payment.
- Web subscriptions accessed in app have special rules.
- Rules differ by region and are in flux.

**WarpOS hook/gate:**

```bash
/payments:preflight --webhooks --entitlements --subscriptions --store-policy
/payments:reconcile --provider stripe --fail-on-drift
```

---

### 5.9 `PRIVACY_GDPR_GUIDE.md`

**Keep:** The guide appropriately pushes data mapping, deletion requests, cookies, vendors, and privacy-policy truthfulness.

**Fix/expand:**

1. Rename or broaden title if not exclusively GDPR.

Suggested name: `PRIVACY_AND_DATA_RIGHTS_GUIDE.md` or keep existing name but add subtitle “GDPR, U.S. state privacy, platform data-safety forms, and practical privacy ops.”

2. Add data inventory template:

```md
| Data element | Example | Required? | Source | Purpose | Legal basis/justification | Stored where | Vendor/shared with | Retention | Delete/export support | Store disclosure? |
|---|---|---:|---|---|---|---|---|---|---|---|
```

3. Add vendor/subprocessor register:

```md
| Vendor | Purpose | Data shared | Region | DPA/terms reviewed? | Privacy policy updated? | Deletion supported? | Risk |
|---|---|---|---|---:|---:|---:|---:|
```

4. Add DSAR operations for novices:

- Where requests arrive.
- Who reviews them.
- How identity is verified.
- How export is generated.
- How deletion is performed.
- What exceptions apply.
- How to record completion.
- Target response timeline by jurisdiction.

5. Add platform declaration diff:

The privacy policy, Apple privacy labels, Google Data Safety, cookie banner, SDK inventory, and actual code must match.

```bash
/privacy:declaration-diff --code --sdks --policy --apple --google --cookies
```

6. Add sensitive-data stop gates:

- Children/minors.
- Health/mental health.
- Biometric/face/voice/fingerprint.
- Precise location.
- Financial account data.
- Government ID.
- Race, religion, sexuality, political views, union membership.
- Criminal history.
- Employee monitoring.

7. Add AI privacy section:

- Does user data go to an AI provider?
- Is data retained by provider?
- Is data used for training?
- Are prompts/outputs logged?
- Can users delete AI conversation history?
- Are sensitive data and secrets filtered before model calls?
- Is third-party AI sharing disclosed where required by platform rules?

8. Add retention defaults:

Novice-friendly defaults:

- Keep account data while account active.
- Delete inactive unauthenticated drafts quickly.
- Keep security logs for a limited, defined period.
- Keep invoices/transaction records as required for tax/accounting.
- Do not retain raw prompts/files forever unless product truly requires it.
- Set lifecycle rules for uploaded files.

**WarpOS hook/gate:**

```bash
/privacy:inventory --require-purpose --require-vendor-register
/privacy:declaration-diff --fail-on-mismatch
```

---

### 5.10 `SECURITY_GUIDE.md`

**Keep:** This is the strongest guide. The novice tone combined with concrete controls is useful. Keep RLS, secrets, rate limiting, prompt injection, webhooks, backups, and incident response.

**Fix/expand:**

1. Add “minimum viable security baseline” at the top:

```md
You may launch a low-risk app only if all are true:
- Managed auth is enabled.
- User data is protected server-side and/or with RLS.
- No secrets in client/browser/mobile code.
- Production environment variables are set in the host secret store.
- Basic rate limits exist on auth, AI, upload, payment, and expensive endpoints.
- Webhook signatures are verified.
- Backups are enabled and one restore was tested.
- Logs/alerts exist for auth failures, payment failures, API spikes, and server errors.
- Dependency and secret scans pass.
- Account deletion and privacy flows do not expose other users' data.
```

2. Map to current OWASP/NIST references:

- OWASP Top 10 2025 for web risks.
- OWASP ASVS 5.0 for verification requirements.
- OWASP API Security Top 10 for APIs.
- OWASP Mobile ASVS/MASTG for mobile apps.
- OWASP LLM/GenAI guidance for AI features.
- NIST SSDF for secure development practices.
- NIST CSF 2.0 for governance, identify/protect/detect/respond/recover.

3. Add supply-chain security section:

- Lockfiles committed.
- Dependency update cadence.
- `npm audit`/equivalent and false-positive triage.
- Secret scanning in git history.
- License scan for copyleft/AGPL/commercial restrictions.
- SBOM generated for serious/B2B launches.
- Pin GitHub Actions versions or use trusted actions.
- Protect main branch.
- Require review for production secrets and deploy workflows.
- Do not install random packages suggested by AI without checking maintenance, license, downloads, repo activity, and security advisories.

4. Add CI/CD and deployment controls:

- Preview deployments separate from production.
- Staging database separate from production.
- Production deploy requires clean checks.
- Rollback instructions exist.
- Environment variables differ by environment.
- No production database exposed to local dev.
- Admin scripts require explicit confirmation.

5. Add file-upload security:

- Size limits.
- MIME sniffing/magic number checks.
- Extension allowlist.
- Virus scanning for higher-risk apps.
- Private buckets by default.
- Signed URLs with expiration.
- Image transformation safety.
- No direct execution of uploaded files.

6. Add observability and alert thresholds:

- Error rate.
- 401/403 spikes.
- 429 spikes.
- Payment webhook failures.
- AI cost spike.
- Queue backlog.
- Unusual data export volume.
- Admin actions.

7. Add incident severity table:

| Severity | Example | Founder action | AI action | External help? |
|---|---|---|---|---|
| SEV0 | secret leaked, DB public, payment exploit | pause/revoke/notify | rotate, patch, logs | likely yes |
| SEV1 | auth bypass, cross-tenant leak | disable feature | patch/test | yes |
| SEV2 | rate-limit abuse/cost spike | throttle | add controls | maybe |
| SEV3 | bug without data risk | normal fix | patch | no |

8. Add “security evidence” requirements:

- Secret scan result.
- RLS/tenant isolation tests.
- Auth/session tests.
- Dependency scan.
- Backup restore test.
- Rate-limit tests.
- Webhook tests.
- Prompt-injection tests if AI tools exist.
- Red-team report.

**WarpOS hook/gate:**

```bash
/security:baseline --owasp --asvs-l1 --secrets --deps --rls --rate-limits --backup-restore
/redteam:launch --ai --authz --payments --privacy
```

---

## 6. Suggestions for `_knowledge`

The `_knowledge` folder should not just educate agents. It should give them enforceable rules, severity, evidence requirements, review prompts, test fixtures, and source freshness metadata.

### 6.1 Add a common rule schema

Each knowledge file should include structured rules that agents can ingest.

Suggested YAML block format:

```yaml
rules:
  - id: AUTHZ-001
    title: Server-side object authorization is required
    severity: blocking
    applies_to:
      - api_route
      - server_action
      - database_query
      - storage_object
    founder_explanation: "Users must not be able to ask for another user's records by changing an ID."
    agent_check: "Trace every user-data read/write to ownership, org membership, or policy enforcement."
    evidence_required:
      - cross_tenant_test
      - policy_or_middleware_reference
      - negative_test_result
    test_fixture: authz_cross_tenant_access
    human_escalation: false
    source_refs:
      - owasp_asvs_5_access_control
      - owasp_top10_2025_broken_access_control
```

This lets agents produce consistent output:

```md
Rule: AUTHZ-001
Status: pass / fail / not applicable / needs human review
Evidence: path/to/test, path/to/code
Reasoning: short explanation
Fix: exact patch plan
```

### 6.2 Add severity levels

Use consistent severity:

| Severity | Meaning | Launch behavior |
|---|---|---|
| `blocking` | Can expose data, money, secrets, account access, or violate clear platform/legal rule | Cannot launch. |
| `high` | Likely serious harm or rejection risk | Founder approval + fix plan required. |
| `medium` | Important but may ship with explicit deferral for low-risk MVP | Track issue. |
| `low` | Quality/hardening | Backlog acceptable. |
| `info` | Education/context | No gate. |

### 6.3 Add `applies_when` triggers

Agents need to know when to load each knowledge file. Add explicit triggers.

Example:

```yaml
applies_when:
  - project_has_auth
  - project_has_user_data
  - project_has_multi_tenant_data
  - project_has_payments
  - project_has_ai_model_calls
  - project_has_mobile_app
  - project_has_user_uploads
  - project_has_subscriptions
  - project_targets_eu_users
  - project_targets_children
```

### 6.4 Update registries to be generated, not hand-maintained

The current registry drift is a warning sign. Add a generator:

```bash
/knowledge:registry-generate --scope _knowledge/security,_knowledge/compliance
/knowledge:validate --fail-on-registry-drift
```

Registry should include:

```json
{
  "schema": "warpos/knowledge-registry/v0.2",
  "generated_at": "2026-06-07T00:00:00Z",
  "domain": "security",
  "source_files": [],
  "rule_count": 0,
  "blocking_rule_count": 0,
  "review_axes": [],
  "applies_when_vocab": [],
  "sources": [],
  "freshness_failures": []
}
```

Validation should fail if:

- A registered file is missing.
- A Markdown file is not registered.
- A file has no `last_reviewed`.
- A volatile file has no primary source.
- A rule ID prefix differs from frontmatter.
- A rule references a missing source ID.
- A README table omits a file.

### 6.5 Add source hierarchy

Knowledge files should prefer sources in this order:

1. Primary law/regulator/platform/standards body/vendor documentation.
2. Official enforcement guidance, developer documentation, RFCs, NIST, OWASP, IETF, W3C, ISO summaries if accessible.
3. Reputable legal/security analysis as commentary, never as the only source for a rule.
4. Blog posts, incident writeups, vendor guides, and news only as examples or implementation context.

Frontmatter example:

```yaml
sources:
  primary:
    - id: owasp_asvs_5
      title: OWASP ASVS 5.0
      url: https://owasp.org/www-project-application-security-verification-standard/
      last_checked: "2026-06-07"
    - id: ietf_rfc_9700
      title: RFC 9700 OAuth 2.0 Security Best Current Practice
      url: https://datatracker.ietf.org/doc/rfc9700/
      last_checked: "2026-06-07"
  secondary: []
source_notes:
  - "Use law-firm/client alerts only as interpretation; verify rules against primary authority before gating."
```

### 6.6 Add test prompts and fixtures

Every knowledge file should include a “review fixture seed” section for hidden tests. Example:

```md
## Hidden fixture ideas

- App has RLS enabled but policy only checks `auth.uid() IS NOT NULL`.
- API route reads `/api/users/:id` and trusts the URL id.
- Stripe webhook updates subscription based on client-provided email.
- App privacy label says no data collected but code imports analytics SDK.
- AI agent tool can call `send_email` with untrusted prompt content.
```

WarpOS should use these for holdout testing so agents cannot pass by merely reciting the checklist.

---

## 7. New guide files to add

### 7.1 `_guides/LAUNCH_READINESS_CHECKLIST.md`

A single founder-facing go/no-go checklist should consolidate all guide gates.

Sections:

- Product summary.
- Risk tier and red flags.
- Accounts and slow clocks.
- Auth and database.
- Security baseline.
- Privacy and data inventory.
- Legal/commercial claims.
- Payments/subscriptions.
- Email/notifications.
- API limits/cost controls.
- App-store/platform readiness.
- AI governance if applicable.
- Accessibility/usability.
- Support/incident readiness.
- Launch metrics and rollback.
- Founder sign-off.

Add final sign-off:

```md
## Founder launch decision

I understand WarpOS checks reduce risk but do not guarantee legal compliance or security.

- Launch decision: go / no-go / staged beta only
- Known accepted risks:
- Red flags resolved:
- Yellow flags accepted by:
- Date:
- Founder signature/name:
```

### 7.2 `_guides/DATA_INVENTORY_TEMPLATE.md`

Non-technical founders need one obvious place to list data. Include examples and “ask your AI to fill this from code” instructions.

### 7.3 `_guides/INCIDENT_RESPONSE_RUNBOOK.md`

This resolves the missing `RUNBOOK.md` reference.

Minimum runbook:

- Who can pause production.
- How to revoke/rotate secrets.
- How to disable AI endpoints.
- How to disable payments/subscriptions temporarily.
- How to revoke sessions.
- How to restore backup.
- How to preserve logs.
- How to contact users if required.
- How to write a post-incident review.

### 7.4 `_guides/AI_APP_GOVERNANCE_GUIDE.md`

AI apps need their own founder-facing guide.

Include:

- What data goes into models.
- Model/provider terms and data retention.
- Prompt/output logging.
- Moderation and safety filters.
- Human escalation.
- AI-generated content disclosure.
- Evaluation sets.
- Bias/fairness risk flags.
- Hallucination risk disclaimers.
- High-risk AI stop gates.
- EU AI Act awareness.
- NIST AI RMF mapping.
- OWASP GenAI / LLM prompt-injection basics.

### 7.5 `_guides/ACCESSIBILITY_GUIDE.md`

Accessibility is both a quality and compliance issue. Vibe-coded apps often ship inaccessible UIs by default.

Include:

- Semantic HTML.
- Keyboard navigation.
- Focus states.
- Labels for inputs.
- Color contrast.
- Alt text.
- Error messages.
- Captions/transcripts for media.
- Reduced motion.
- Mobile screen-reader checks.
- WCAG 2.2 AA as the practical target.

### 7.6 `_guides/TRUST_AND_SAFETY_UGC_GUIDE.md`

Add if WarpOS users build social/community/marketplace/AI-sharing apps.

Include:

- UGC risk routing.
- Reporting.
- Blocking/muting.
- Moderation queue.
- Takedown process.
- Illegal/harmful content escalation.
- User bans and appeals.
- App-store UGC expectations.
- Child-safety red flags.

---

## 8. New knowledge files to add

### 8.1 `_knowledge/security/SUPPLY_CHAIN_AND_CI_CD.md`

Train agents on:

- Dependency review.
- Lockfiles.
- License risk.
- SBOM.
- SLSA/provenance concepts.
- GitHub Actions security.
- Branch protection.
- Secret scanning.
- Build/deploy environment separation.
- AI package hallucination risks.

### 8.2 `_knowledge/security/API_AND_WEBHOOK_SECURITY.md`

Some content exists in other docs, but API/webhook security deserves a dedicated reference.

Train agents on:

- Authn/authz on all APIs.
- Method/path/body validation.
- Schema validation.
- Idempotency.
- Replay protection.
- Webhook signature verification.
- Rate limits.
- Pagination limits.
- Error handling.
- Audit logs.

### 8.3 `_knowledge/security/AI_AGENT_TOOL_PERMISSIONS.md`

WarpOS is agentic. It needs a security reference for AI tools and permissions.

Train agents on:

- Tool allowlists.
- Human confirmation for destructive actions.
- Prompt injection through tool outputs.
- Indirect prompt injection from web/email/docs.
- Data exfiltration via tools.
- Least-privilege tool scopes.
- Secrets redaction before model calls.
- Audit logging for tool calls.
- Agent sandboxing.
- Escalation rules.

### 8.4 `_knowledge/compliance/AI_GOVERNANCE_AND_MODEL_RISK.md`

Train compliance/product agents on:

- EU AI Act risk tiers and timeline awareness.
- NIST AI RMF concepts.
- Disclosures for AI-generated content.
- High-risk AI stop gates.
- Human oversight.
- Model/provider data use.
- Evaluation evidence.
- Bias, hallucination, and safety risk routing.
- App-store AI/user-data sharing disclosures.

### 8.5 `_knowledge/compliance/ACCESSIBILITY_AND_INCLUSIVE_DESIGN.md`

Train agents to identify inaccessible UI before launch.

Rules should include:

- Inputs need accessible labels.
- Buttons must have accessible names.
- Keyboard navigation required.
- Color contrast minimums.
- Focus visible.
- Errors announced and actionable.
- Do not rely only on color.
- Mobile touch targets large enough.

### 8.6 `_knowledge/compliance/ADVERTISING_CLAIMS_AND_DARK_PATTERNS.md`

Train agents to catch risky growth/monetization copy.

Rules should include:

- No false scarcity.
- No hidden recurring billing.
- No misleading “free.”
- Claims require substantiation.
- Testimonials/endorsements need disclosure where applicable.
- AI capability claims must match evidence.
- Cancellation must not be obstructive.
- Pricing must be clear before payment.

### 8.7 `_knowledge/compliance/AGE_CHILDREN_AND_SENSITIVE_DATA.md`

Train agents on red-flag routing for minors and sensitive data.

Rules should include:

- Ask whether children are target users or likely users.
- Avoid collecting age unless necessary; if necessary, handle carefully.
- Flag Kids Category, family policies, COPPA/GDPR-K style issues.
- Flag sensitive data and regulated domains.
- Require expert review for child-directed apps.

### 8.8 `_knowledge/compliance/VENDOR_DPA_AND_DATA_TRANSFERS.md`

Train agents on vendor/subprocessor risk.

Rules should include:

- Every third-party service receiving personal data goes in vendor register.
- Privacy policy must match vendor list.
- DPAs/terms must be reviewed for serious launches.
- AI providers, analytics, email, payments, crash reporting, and support tools are vendors.
- Cross-border data transfer issues are legal-review triggers.

### 8.9 `_knowledge/compliance/PRIVACY_OPERATIONS_DSR_RETENTION.md`

Train agents on operational privacy rather than policy drafting.

Rules should include:

- Data subject request intake.
- Identity verification.
- Export/delete flows.
- Retention schedule.
- Backup/log exceptions.
- Vendor deletion propagation.
- Evidence of completion.

---

## 9. WarpOS integration suggestions

The uploaded context and current repo position WarpOS as a hook-driven, observable, multi-agent system. The guides should become operational protocols inside that system.

### 9.1 Add or formalize commands

Suggested commands:

```txt
/launch:preflight        Full founder launch-readiness gate.
/launch:evidence         Generate or audit _launch_evidence folder.
/legal:flags             Identify legal/compliance red/yellow flags; never certify.
/privacy:inventory       Build data inventory from code, vendors, forms, and founder answers.
/privacy:declaration-diff Compare code/SDKs/policy/Apple/Google/cookie disclosures.
/security:baseline       Run minimum viable security baseline.
/security:asvs-l1        Map app to OWASP ASVS Level 1-style checks.
/db:rls-audit            Check RLS/policies/tenant isolation tests.
/auth:review             Review OAuth/session/account lifecycle.
/payments:preflight      Review Stripe/payment/subscription/webhook flows.
/payments:reconcile      Reconcile app subscription state with payment provider.
/email:preflight         Check DNS, transactional/marketing split, unsubscribe, vendor register.
/stores:prepare          Prepare Apple/Google submission evidence.
/api:capacity-check      Validate API rate/cost capacity against expected launch.
/ai:governance           Review AI data, safety, evaluation, disclosure, and high-risk flags.
/accessibility:check     Run accessibility baseline.
/ugc:safety-check        Run UGC/trust-and-safety baseline.
/source:freshness        Check volatile claims and source dates.
/knowledge:validate      Validate registries, rule schema, source freshness, links.
```

### 9.2 Add hooks

Suggested hooks:

| Hook | Trigger | Action |
|---|---|---|
| `guide-link-validator` | Markdown changed in `_guides`/`_knowledge` | Fail on missing local links. |
| `knowledge-registry-drift` | Knowledge file changed | Regenerate/compare registry. |
| `source-freshness-check` | Launch/compliance docs changed or launch preflight | Fail stale critical sources. |
| `risk-tier-required` | New product/PRD created | Require green/yellow/red risk tier. |
| `secret-exposure-guard` | Code/config diff | Fail secrets in repo/client/mobile. |
| `rls-policy-guard` | DB migration/table added | Require RLS or explicit non-user-data exemption. |
| `tenant-isolation-test-guard` | Auth/user-data code changed | Require cross-user negative tests. |
| `payment-webhook-guard` | Payment code changed | Require signature + idempotency + tests. |
| `subscription-disclosure-guard` | Pricing/checkout changed | Require clear price/term/cancel evidence. |
| `privacy-declaration-diff` | SDK/permissions/data code changed | Flag privacy policy/store-label mismatch. |
| `ai-provider-data-disclosure` | AI provider call added | Require data-use disclosure and logging decision. |
| `api-cost-kill-switch` | Expensive API call added | Require quota/cost controls. |
| `dependency-license-scan` | Dependency changed | Flag risky licenses, abandoned packages, known vulnerabilities. |
| `app-store-ugc-guard` | UGC feature detected | Require report/block/moderation evidence. |
| `accessibility-baseline` | UI components changed | Require labels, keyboard, contrast checks. |

### 9.3 Add hidden fixtures

Add holdout tests for guide/agent quality. Examples:

- A privacy policy says “we do not share data,” but the app sends prompts to an AI provider and uses analytics.
- Google Data Safety says no data collected, but app imports auth, crash reporting, and email provider SDKs.
- Stripe checkout succeeds client-side, but webhook signature is not verified.
- RLS is enabled but policy allows any authenticated user to read all rows.
- AI tool can send email based on untrusted prompt content.
- App has account creation but no account deletion path.
- Subscription landing page hides renewal price until after checkout.
- User-uploaded files go to a public bucket.
- App name is confusingly similar to an existing competitor.
- UI has unlabeled inputs and no keyboard navigation.

### 9.4 Add diff-model review requirements

For high-risk launch gates, do not let the builder agent be the sole reviewer. Use independent review for:

- Payment/subscription flows.
- Privacy declarations.
- RLS/tenant isolation.
- OAuth/session security.
- Prompt-injection/tool-use security.
- Legal-risk flags.
- Store submission readiness.
- Kill/continue launch decision.

Output should include:

```md
Builder result:
Independent reviewer result:
Disagreements:
Blocking issues:
Founder decision required:
```

---

## 10. Current authority snapshot checked for this review

Use these as the initial source baseline, but require the producing AI to re-check before embedding volatile claims.

### Security and software development

- OWASP Top Ten Web Application Security Risks: https://owasp.org/www-project-top-ten/  
  Current released version is OWASP Top 10:2025.
- OWASP Top 10:2025: https://owasp.org/Top10/2025/en/
- OWASP Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/  
  ASVS 5.0.0 is the current stable release as of this review.
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- OWASP Web Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- OWASP GenAI Security Project / LLM Top 10: https://genai.owasp.org/llm-top-10/
- OWASP AI Agent Security Cheat Sheet: https://genai.owasp.org/resource/owasp-ai-agent-security-cheat-sheet/
- NIST Secure Software Development Framework SP 800-218 v1.1: https://csrc.nist.gov/pubs/sp/800/218/final
- NIST Cybersecurity Framework 2.0: https://www.nist.gov/cyberframework
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- NIST SP 800-218A for generative AI/foundation model development: https://csrc.nist.gov/pubs/sp/800/218/a/final
- IETF RFC 9700, OAuth 2.0 Security Best Current Practice: https://datatracker.ietf.org/doc/rfc9700/

### Platforms and app stores

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple privacy manifest / required reason API submission requirements: https://developer.apple.com/news/?id=pvszzano
- Apple privacy updates for App Store submissions: https://developer.apple.com/news/?id=3d8a9yyh
- Apple Developer Program enrollment: https://developer.apple.com/programs/enroll/
- Apple StoreKit External Purchase Link Entitlement: https://developer.apple.com/support/storekit-external-entitlement/
- Google Play testing requirements for new personal developer accounts: https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play Data Safety form: https://support.google.com/googleplay/android-developer/answer/10787469

### Payments, consumer protection, and subscriptions

- FTC Negative Option Rule page: https://www.ftc.gov/legal-library/browse/rules/negative-option-rule
- Federal Register 2026 ANPRM on Negative Option Rule: https://www.federalregister.gov/documents/2026/03/13/2026-04952/rule-concerning-the-use-of-prenotification-negative-option-plans
- Stripe documentation home: https://docs.stripe.com/
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe Checkout: https://docs.stripe.com/payments/checkout
- Stripe Customer Portal: https://docs.stripe.com/customer-management

### Privacy and AI regulation

- European Commission AI Act page: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
- EU AI Act implementation timeline: https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act
- IAPP U.S. State Privacy Legislation Tracker: https://iapp.org/resources/article/us-state-privacy-legislation-tracker
- California Privacy Protection Agency CCPA regulations updates: https://cppa.ca.gov/regulations/ccpa_updates.html
- CPPA 2025 announcement on final regulations: https://cppa.ca.gov/announcements/2025/20250923.html

### API limits and provider capacity

- OpenAI rate limits: https://developers.openai.com/api/docs/guides/rate-limits
- Google Gemini API rate limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Anthropic rate limits: https://docs.anthropic.com/en/api/rate-limits

### Supply-chain and secure-by-design references

- OpenSSF SLSA: https://slsa.dev/
- OWASP Software Component Verification Standard: https://owasp.org/www-project-software-component-verification-standard/
- OWASP Dependency-Track: https://owasp.org/www-project-dependency-track/
- CISA Secure by Design: https://www.cisa.gov/securebydesign

### Incident/advisory example to handle carefully

- NVD CVE-2025-48757: https://nvd.nist.gov/vuln/detail/CVE-2025-48757

If the knowledge files discuss this advisory or a Lovable/RLS incident, phrase it carefully as a public/disputed advisory that illustrates a common class of failure. Do not overstate it as an undisputed vendor defect.

---

## 11. Current-facts notes to update in the guides

These are not exhaustive; they are examples of the kind of freshness corrections the producing AI should make.

### 11.1 OpenAI/API tiers

Existing API-limit guidance correctly says dashboards are the source of truth. Strengthen that rule. Do not hard-code exact tier thresholds or model limits unless dated and explicitly marked as an example. The guide may safely say rate limits use dimensions like RPM, RPD, TPM, TPD, and that limits vary by org/project/model and can change.

### 11.2 Google Play closed testing

The official Google Play support article currently says newly created personal developer accounts must run a closed test with a minimum of 12 opted-in testers for at least the last 14 days continuously before applying for production access. Keep “verify in Play Console” because requirements can differ by account type and can change.

### 11.3 Apple privacy manifests

Apple’s May 1, 2024 privacy manifest / required reason API submission requirement is real, but the guide should say exactly what Apple says: new or updated apps using listed APIs and/or newly added commonly used third-party SDKs need the required reasons, privacy manifests, and signatures as applicable. Do not simplify into “all apps always need X” without nuance.

### 11.4 FTC click-to-cancel / negative option

Do not say the 2024 FTC click-to-cancel amendments are currently binding without context. The current FTC/Federal Register materials show the 2024 amended rule was vacated in 2025 and the FTC reopened/continued negative-option rulemaking in 2026. The product guidance should still recommend easy, same-channel cancellation and clear renewal disclosure because it is user-protective and safer across state/platform/card-network regimes, but label the federal rule status as `[FLUX]`.

### 11.5 EU AI Act

Add a current AI governance note: the EU AI Act entered into force in 2024 and applies progressively. Some provisions such as prohibited practices/AI literacy and GPAI obligations apply earlier than full application. Use this as a risk-routing trigger, especially for AI systems in consequential domains, not as a full legal guide.

### 11.6 California and U.S. state privacy

The U.S. privacy landscape is a growing state-by-state patchwork. Add a freshness gate and avoid claiming one universal U.S. privacy rule. California’s CPPA regulations with risk assessment, cybersecurity audit, and automated decision-making technology provisions are an example of why privacy guidance must be dated and reviewed.

### 11.7 OAuth

Update auth guidance to cite RFC 9700 as the current OAuth 2.0 security best current practice. Add PKCE, exact redirect URI matching, no implicit flow for new apps, no open redirects, `state`/CSRF protections, and least-scope rules.

---

## 12. Suggested “patch prompt” for the producing AI

Use this as the instruction to the AI that created the package:

```md
You are updating WarpOS `_guides` and `_knowledge` to production-grade founder launch guidance and agent training material.

Constraints:
- Preserve the friendly beginner tone.
- Preserve and expand the 🔴 YOU / 🤖 AI / 🧒 convention.
- Do not turn guides into legal advice or compliance certification.
- Use primary sources for volatile claims.
- Add source freshness metadata.
- Convert guidance into WarpOS gates, hooks, commands, evidence, tests, and review outputs.
- Fix all broken links and registry drift.
- Add missing `_guides/README.md`.
- Add launch evidence pack and launch readiness checklist.
- Add machine-readable rule schema to `_knowledge` files.
- Add red/yellow/green risk routing and stop gates.
- Add missing coverage for AI governance, accessibility, supply chain, UGC/trust & safety, privacy operations, advertising/dark patterns, children/sensitive data, and vendors/DPAs.

Definition of done:
1. All internal links pass.
2. All registries are generated from frontmatter and rule blocks.
3. Every volatile file has last_reviewed, next_review_due, volatility, and sources.
4. Every guide includes: what YOU do, what AI can do, evidence to save, stop gates, and acceptance criteria.
5. Every knowledge file includes: rule IDs, severity, applies_when, evidence_required, test_fixture ideas, source_refs, and human_escalation flags.
6. Launch preflight can produce: pass, fail, or human-review-required; never “compliant.”
7. Hidden fixtures cover privacy mismatch, RLS bypass, payment webhook errors, subscription dark patterns, UGC missing moderation, AI prompt injection, and stale source claims.
```

---

## 13. Acceptance criteria for the updated package

The updated package should not be considered complete until these pass.

### 13.1 Structural validators

- [ ] `_guides/README.md` exists.
- [ ] Every local Markdown link resolves.
- [ ] Every registry path exists.
- [ ] Every Markdown file under `_knowledge` appears in exactly one registry.
- [ ] Every README table matches the registry.
- [ ] No registry contains stale manual counts.

### 13.2 Source validators

- [ ] Every file has `last_reviewed` and `next_review_due`.
- [ ] Every high/critical volatility file has primary-source URLs.
- [ ] Stale critical files fail `/source:freshness`.
- [ ] Secondary commentary sources are labeled as commentary.
- [ ] Legal/platform/API claims include `[FLUX]` when rules vary by jurisdiction/account/storefront/provider.

### 13.3 Founder usability validators

- [ ] Every guide has a 5-minute starter version.
- [ ] Every guide has “what only YOU can do.”
- [ ] Every guide has “ask your AI to do this” prompts.
- [ ] Every guide has evidence to save.
- [ ] Every guide has stop gates.
- [ ] Every guide has a novice glossary.
- [ ] Every guide avoids unexplained acronyms.

### 13.4 Agent enforceability validators

- [ ] Every knowledge file has machine-readable rules.
- [ ] Every blocking rule maps to a command, hook, test, or evidence requirement.
- [ ] Every guide maps to at least one WarpOS command.
- [ ] Red/yellow/green risk routing is available in machine-readable form.
- [ ] Hidden fixtures exist for every major guide.
- [ ] Diff-model review is required for high-risk launch decisions.

### 13.5 Launch gate validators

- [ ] Launch preflight produces a single report.
- [ ] Report includes pass/fail/human-review-required.
- [ ] Report identifies missing evidence.
- [ ] Report identifies stale sources.
- [ ] Report identifies unresolved red/yellow risk flags.
- [ ] Report never claims legal compliance or perfect security.
- [ ] Founder sign-off is required for yellow-risk launch.
- [ ] Red-risk launch is blocked until expert-review evidence is attached.

---

## 14. Suggested final launch report format

WarpOS should eventually produce a report like this for every app:

```md
# Launch Preflight Report

Product:
Date:
Risk tier: green / yellow / red
Decision: pass / fail / human-review-required / staged-beta-only

## Blocking issues
- [ ] ...

## Yellow flags accepted by founder
- [ ] ...

## Evidence pack status
- Accounts: pass/fail
- Security: pass/fail
- Privacy: pass/fail
- Legal/commercial: pass/fail
- Payments: pass/fail/not applicable
- App stores: pass/fail/not applicable
- AI governance: pass/fail/not applicable
- Accessibility: pass/fail
- Support/incident: pass/fail

## Security results
- Secret scan:
- RLS/tenant isolation:
- Auth/session:
- Rate limits:
- Webhooks:
- Dependencies:
- Backup restore:
- Red-team:

## Privacy results
- Data inventory:
- Vendor register:
- Privacy policy/code diff:
- Apple/Google declarations:
- DSR/delete flow:

## Commercial/legal-risk results
- Terms acceptance evidence:
- Subscription disclosures:
- Cancellation flow:
- Claims inventory:
- IP/trademark check:

## Source freshness
- Critical sources checked:
- Stale sources:
- Flux areas:

## Founder sign-off
I understand these checks reduce risk but do not guarantee legal compliance or security.

Name:
Date:
Decision:
Known accepted risks:
```

---

## 15. Final recommendation

Do not rewrite the package into dense professional/legal prose. That would defeat the purpose. Instead, keep the current founder-friendly voice and add professional-grade structure underneath it:

- A shared guide README.
- Risk tiers.
- Source freshness.
- Evidence packs.
- Machine-readable rules.
- Hooks and commands.
- Hidden tests.
- Diff-model reviews.
- Launch reports.
- Explicit “not legal/security certification” language.

The result should feel simple to a vibe coder on the surface, but behave like a serious product-foundry control system underneath.
