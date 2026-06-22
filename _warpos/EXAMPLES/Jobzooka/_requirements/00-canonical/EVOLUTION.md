# Jobzooka — Product Evolution Spec

Future ideas and post-MVP vision. Nothing in this document is canonical — these are possibilities, not commitments.

---

## Status: Non-Canonical

This document captures ideas that have been discussed or considered. They are NOT approved, planned, or prioritized. They exist to prevent good ideas from being forgotten and to provide context for future planning sessions.

### Implementation Status

Some items listed below have already been implemented. This table distinguishes DONE from FUTURE:

| Item | Status | Evidence |
|---|---|---|
| PDF export | DONE | `src/lib/pdf-generator.ts` |
| DOCX export | DONE | `src/lib/docx-generator.ts` |
| Mobile responsive | FUTURE | Desktop-first per FLOW_SPEC |
| Cover letter generation | FUTURE | Not in current feature backlog |
| Multi-platform scraping | FUTURE | Only LinkedIn via Bright Data |
| Application tracking | FUTURE | No tracking beyond apply history |

---

## Near-Term Improvements (Enhance What Exists)

### Multi-Platform Job Scraping

- Add Indeed, Glassdoor, and other job boards alongside LinkedIn
- Normalize data across sources
- Richer market intelligence from broader data set

### Application Tracking

- Track which jobs were applied to (from auto-apply logs)
- Status tracking: applied → interview → offer → rejected
- Follow-up reminders

### Resume Format Options

- Multiple DOCX templates (modern, traditional, ATS-optimized)
- PDF export alongside DOCX
- Custom formatting controls (font, spacing, sections)

### Improved Market Re-Runs

- Show diff between old and new market analysis
- Track how the market has changed over time
- Alert when new high-match categories appear

### Mobile Responsive

- Full mobile support for the wizard
- Touch-optimized interactions
- Mobile-first onboarding flow

---

## Medium-Term Features (Expand Scope)

### Cover Letter Generation

- Context-aware cover letters per category or per company
- Templated sections with personalized content
- Tone control (formal, conversational, technical)

### Interview Prep

- Generated interview questions based on job categories
- Suggested answer frameworks using user's experience
- Company research summaries

### Networking Recommendations

- Identify companies where user's connections work
- Generate outreach message templates
- LinkedIn connection request copy

### Multi-Language Support

- Resume generation in multiple languages
- Market analysis for non-US markets
- Localized form answers

---

## Long-Term Vision (Transform the Product)

### Continuous Market Intelligence

- Ongoing market monitoring (not just one-time analysis)
- Alerts when new matching jobs appear
- Market trend reports over time

### Team / Enterprise Features

- Recruiter-side view for staffing agencies
- Batch resume processing
- Team analytics and reporting

### API / Integration Layer

- Jobzooka as a service (API access to resume generation, market analysis)
- Integration with ATS systems
- Webhook notifications for job alerts

### AI Agent Improvements

- Smarter auto-apply with learning from user feedback
- A/B testing of resume variants (track which gets more responses)
- Autonomous job search with user-defined criteria

---

## Technical Debt to Address

### Architecture

- Replace prop-drilling with proper state management (Zustand or Context)
- Fix component naming inconsistencies (AimPage ↔ ReadyPage mismatch)
- Standardize styling approach (one system: CSS custom properties OR Tailwind, not both)
- Add proper error boundaries at the step level

### Performance

- Upgrade from Vercel Hobby to Pro (longer function timeouts)
- Implement proper caching for market data
- Optimize large component re-renders (Step10Resumes is very large)

### Quality

- Add proper TypeScript strict mode enforcement
- Comprehensive test coverage (unit + integration)
- Accessibility audit and remediation
- Performance monitoring and alerting

---

## Ideas Explicitly NOT Pursuing

For clarity, these ideas have been considered and rejected:

1. **Social features** — Jobzooka is a personal tool, not a social platform
2. **Gamification beyond competitiveness score** — No achievements, streaks, or leaderboards
3. **Resume templates / visual editor** — Content-first, not design-first
4. **Free unlimited access** — Rocket economy is fundamental to sustainability
5. **B2B enterprise play** — Focus on individual job seekers first
