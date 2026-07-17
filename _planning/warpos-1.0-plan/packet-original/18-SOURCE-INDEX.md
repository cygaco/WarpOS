# Source Index and Verification Notes

This packet was generated from a conversation about finishing WarpOS 1.0, with the following uploaded/source materials considered:

## User-provided source materials

- `warpos.md` — WarpOS source context generated 2026-06-27, including current drift, dispatch frontier, product-foundry definition, source-of-truth order, hooks, provider routing, research state, memory, highest-priority improvements, and product-foundry DoD.
- `finish-warpos.txt` — user's raw finish-WarpOS questions and improvement ideas: agent routing, model spend, AGENTS.md/CLAUDE.md interop, pings/reaping, `_planning`, founder panel, log system, session intent, dispatch isolation, and general audit.
- `warpos-flags-doogle.md` — Doogle upstream gap register: dispatch wrapper gaps, stale worktrees, liveness, tracker drift, founder panel generator, launch credential hygiene, demo data, OAuth guide gaps, Supabase grants, guide enforcer liveness.
- `warpos-flags-nightweaver.md` / Dreamweaver-style gap register — release checksum drift, provider auth labeling, cross-provider registry drift, anti-abuse scaffold gap, deploy/autonomy policy gap.
- `DOOGLE-DEV-REVIEW.txt` — consultant review notes: signout cache, route visibility, API security, JWT/auth checks, RBAC/share controls, environments, uptime, Sentry, PostHog, cookie consent, error screens, key separation, backups, field UX.
- `Vlad - Security Audit Document.pdf` — web application security audit: Supabase/Next.js auth/session security, RLS, RBAC, input validation, CSRF, service_role safety, rate limiting, logging/error handling, privacy/legal, monitoring/incident response, pre-launch checklist.

## External docs to verify live before implementation

- OpenAI Codex AGENTS.md docs
- Claude Code memory / CLAUDE.md docs
- Gemini CLI GEMINI.md docs
- Supabase auth/server-side/docs if implementing exact auth helper behavior
- Next.js file convention docs if implementing error/not-found conventions
- Sentry/PostHog docs if generating adapters

## Important verification cautions

- This packet is not a substitute for scanning the live WarpOS repo.
- Version/release state was known to be drifted in source context.
- README/prose were known stale; prefer registries and live files.
- Downstream gap registers can be stale; use them as evidence and test cases, not unquestioned current truth.
- Provider docs change; verify AGENTS.md/CLAUDE.md/GEMINI.md behavior before final implementation.

## Design decisions preserved from the conversation

- Alpha remains the default human-facing session captain.
- Alpha is persistent as role/state/persona, not an immortal Claude process.
- WorkOrder → ResultEnvelope is the provider-neutral mailroom.
- SprintRoom is the durable sprint context.
- Some agents may stay alive under leases across coherent waves/phases.
- Root AGENTS.md must be provider-neutral and must not Alpha-poison all workers.
- CLAUDE.md should boot Claude Code into Alpha for the top-level session.
- Founder Panel should be an app/store/generator, not hand-authored static HTML.
- Packs are the right abstraction for reusable launch/security/foundry machinery.
- Dispatch/liveness must be fixed before Founder Panel/Master Console polish.
