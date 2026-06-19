# AcmeLaunch — Product Evolution Spec

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
| Press-kit generation | FUTURE | Not in current feature backlog |
| Multi-source research | FUTURE | Single Launch Research adapter today |
| Launch tracking | FUTURE | No tracking beyond launch-run history |

---

## Near-Term Improvements (Enhance What Exists)

### Multi-Source Landscape Research

- Add directories, communities, and marketplaces alongside the default research sources
- Normalize data across sources
- Richer landscape intelligence from a broader signal set

### Launch Tracking

- Track which launch actions were executed (from launch-run logs)
- Status tracking: planned → published → responded → converted
- Follow-up reminders

### Plan Format Options

- Multiple plan templates (lean, detailed, investor-ready)
- PDF export alongside DOCX
- Custom formatting controls (font, spacing, sections)

### Improved Landscape Re-Runs

- Show diff between old and new landscape analysis
- Track how the landscape has changed over time
- Alert when new high-fit segments appear

### Mobile Responsive

- Full mobile support for the wizard
- Touch-optimized interactions
- Mobile-first onboarding flow

---

## Medium-Term Features (Expand Scope)

### Press-Kit Generation

- Context-aware press kits per segment or per outlet
- Templated sections with personalized content
- Tone control (formal, conversational, technical)

### Launch-Day Prep

- Generated launch-day checklists based on audience segments
- Suggested response frameworks using the founder's positioning
- Channel research summaries

### Outreach Recommendations

- Identify communities and creators where the audience gathers
- Generate outreach message templates
- Partner and influencer intro copy

### Multi-Language Support

- Plan generation in multiple languages
- Landscape analysis for non-US markets
- Localized follow-up templates

---

## Long-Term Vision (Transform the Product)

### Continuous Landscape Intelligence

- Ongoing landscape monitoring (not just one-time analysis)
- Alerts when new matching segments or channels appear
- Landscape trend reports over time

### Team / Agency Features

- Agency-side view for launch consultants managing multiple products
- Batch plan processing
- Team analytics and reporting

### API / Integration Layer

- AcmeLaunch as a service (API access to plan generation, landscape analysis)
- Integration with launch and marketing tools
- Webhook notifications for landscape alerts

### AI Agent Improvements

- Smarter launch runs with learning from founder feedback
- A/B testing of plan variants (track which drives more conversion)
- Autonomous launch execution with founder-defined criteria

---

## Technical Debt to Address

### Architecture

- Replace prop-drilling with proper state management (Zustand or Context)
- Fix component naming inconsistencies (PrepPage ↔ PlanPage mismatch)
- Standardize styling approach (one system: CSS custom properties OR Tailwind, not both)
- Add proper error boundaries at the step level

### Performance

- Upgrade from Vercel Hobby to Pro (longer function timeouts)
- Implement proper caching for landscape data
- Optimize large component re-renders (Step10Plans is very large)

### Quality

- Add proper TypeScript strict mode enforcement
- Comprehensive test coverage (unit + integration)
- Accessibility audit and remediation
- Performance monitoring and alerting

---

## Ideas Explicitly NOT Pursuing

For clarity, these ideas have been considered and rejected:

1. **Social features** — AcmeLaunch is a launch-planning tool, not a social platform
2. **Gamification beyond launch-readiness score** — No achievements, streaks, or leaderboards
3. **Plan templates / visual editor** — Content-first, not design-first
4. **Free unlimited access** — Credit economy is fundamental to sustainability
5. **Full agency platform** — Focus on individual founders first
