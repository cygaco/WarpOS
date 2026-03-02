# WARP — Backbone Overview

> The internal operating system of the studio. This is the core asset.
> Every product builds on it. Every product contributes back to it.

---

## What Warp Is

Warp is not a product. It is the machine that builds products.

It consists of:
- **Shared infrastructure** — auth, database, billing, APIs shared across all products
- **Automation layer** — workflow automations that eliminate repetitive human effort
- **AI orchestration** — prompt systems, agent pipelines, Claude integrations
- **Data warehouse** — single source of truth, every product feeds it
- **Playbook library** — validated patterns and decisions, reusable across products
- **Studio OS** — how we hire, decide, experiment, and operate

---

## Current Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Frontend | [e.g. Next.js] | |
| Backend | [e.g. Supabase / Node] | |
| Database | [e.g. Postgres via Supabase] | |
| Automation | [e.g. n8n] | Self-hosted or cloud |
| AI | Claude API (Anthropic) | Primary model layer |
| Hosting | [e.g. Vercel / Railway] | |
| Data Warehouse | [e.g. BigQuery / Supabase] | |
| Auth | [e.g. Supabase Auth] | |
| Payments | [e.g. Stripe] | |
| Monitoring | [TBD] | |

---

## Automation Inventory

| Automation | Trigger | Tool | Status |
|-----------|---------|------|--------|
| [e.g. New lead → Slack notify] | [ e.g. Webhook] | [e.g. n8n] | [e.g. Active] |
| | | | |

---

## AI Orchestration Patterns

| Pattern | Description | Status |
|---------|-------------|--------|
| [e.g. Validation researcher] | Given ICP + problem, returns evidence summary | In design |
| | | |

---

## Products Using Warp

| Product | Stage | What it contributes back |
|---------|-------|--------------------------|
| [Product A] | [Discovery/Build/Live] | [e.g. User auth flow, billing integration] |

---

## Decisions Log

Key architectural decisions and why.

| Decision | Chosen | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| | | | |

---

## Status

Last updated: [DATE]
Current sprint focus: [ADD]
