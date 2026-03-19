# consumer product — Product Card

## One-liner
Job search wizard that takes a resume and generates targeted resumes, LinkedIn content, and auto-applies to jobs.

## Problem
Job searching is manual, repetitive, and demoralizing. Tailoring a resume per application takes 30-60 minutes. Most applicants spray generic resumes and get ignored. The people who could benefit most from AI assistance (career transitioners, contractors) are least served by existing tools.

## ICP
Senior PM looking for contract/fractional work.
- Role: Director-level Product Manager
- Context: AI/gaming/consumer background, exploring contract and fractional roles
- Current workaround: Manual resume tailoring, LinkedIn browsing, spreadsheet tracking
- Why the workaround is painful: 30+ min per application, no market intelligence, generic output

## Hypothesis
We believe senior professionals will pay for an AI assistant that turns their resume into a targeted job search arsenal because the alternative is hours of manual work per application. We'll know this is true when users complete the full wizard flow and use generated materials to apply.

## Stage
- [ ] Discovery
- [ ] Validation
- [x] Building MVP
- [ ] Live / Iterating
- [ ] Scaling
- [ ] Killed

## Riskiest Assumption
That AI-generated resumes and LinkedIn content are good enough to get interviews — not just "pretty good" but actually better than what the user would write manually.

## Stack (delta from Warp defaults)

| Addition | Why |
|----------|-----|
| Bright Data LinkedIn Jobs Scraper | Real-time job market data (no other legal LinkedIn API) |
| Upstash Redis | Rate limiting (serverless, no DB needed) |
| Chrome Extension (Manifest V3) | LinkedIn Easy Apply automation |
| Encrypted localStorage (AES-GCM) | Client-side session persistence without server DB |

## What This Product Contributes Back to Warp

- **Deus Mechanicus** — product-agnostic dev tools framework (manifest pattern)
- **Warp Profiles** — cross-product test identity system
- **Encrypted client storage** — AES-GCM pattern for PII at rest
- **Two-phase AI pipeline** — raw data → intelligence report → decision output
- **Pipeline tracing** — structured `[PIPELINE]` logging at stage boundaries
- **Prompt injection defense** — `<untrusted_*>` tag wrapping for external data

## Product Decisions Log

| Date | Decision | Chosen | Why |
|------|----------|--------|-----|
| 2026-03-18 | Market analysis | Two-phase pipeline (MARKET_PREP → MARKET) | Single-pass produced wrong categories for non-FT roles |
| 2026-03-18 | Auto-apply strategy | LinkedIn Easy Apply first (extension), then external ATS | LinkedIn is where the jobs are; extension = no server infra |
| 2026-03-19 | Dev tools | Deus Mechanicus (product manifest pattern) | Product-agnostic, reusable across all Warp products |
| 2026-03-19 | Test data | Warp Profiles (agnostic identity + product extensions) | Shared test identities across products |
| 2026-03-19 | UX structure | 3 composite pages (Onboarding/AIM/READY) + FIRE | 11 internal steps mapped to 3+1 user-facing screens |

## KPIs

| Metric | Target | Current |
|--------|--------|---------|
| Full wizard completion rate | >50% | Not yet measured |
| Time to complete wizard | <15 min | Not yet measured |
| Resume quality (user rating) | >4/5 | Not yet measured |
| Auto-apply success rate | >30% | Not yet built |

## Current Sprint
- Merge `pm-improvements` branch (DM, Warp Profiles, QA, polish)
- Extension testing with real LinkedIn Easy Apply
- WarpOS repo setup (this doc)

---

*Last updated: 2026-03-19*
