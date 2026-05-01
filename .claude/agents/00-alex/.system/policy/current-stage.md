# Current Stage

**Stage:** `mvp`

The mutable doc — Beta reads this on every invocation. Flip the values here when the product transitions to a new stage.

---

## What "good" looks like at this stage

A janky end-to-end flow that 5 real people can walk through, where the core value (resume → targeted job apps via Jobzooka's 10-step wizard) actually delivers.

A win at this stage:
- A user uploads a resume and ends up with a list of tailored job applications
- We learned something concrete about what they need next
- The infrastructure to support 5 users is in place; nothing more

Not a win at this stage:
- A 2% latency improvement on a route nobody has hit
- A refactor that makes the code prettier without changing user outcomes
- A new dependency that saves 30 lines of code we already understand

---

## Priorities (ranked)

1. **User value** — does this help someone get a job
2. **Speed-to-ship** — can we launch this feature this cycle
3. **Simplicity** — easy to understand, easy to throw away
4. **Reliability** — works on the happy path; degrades gracefully off it
5. **Reversibility** — can we change our mind without a rewrite
6. **Polish** — only when it changes adoption
7. **Scale** — explicitly deferred; do not optimize

---

## Avoid at this stage

- Premature microservices
- Custom infrastructure (use Vercel + Upstash + the stack in `docs/04-architecture/STACK.md`)
- Scale optimization (premature; revisit at `beta`)
- New vendors (the four-condition rule in `paths.decisionPolicy` applies)
- Complex abstractions for hypothetical future scale
- Performance work without a real user complaint
- Feature breadth — depth on the core flow beats breadth on the surface

---

## When to update

Stage flips on triggers, not vibes:

| Transition | Trigger |
|---|---|
| `0-to-1` → `mvp` | Product hypothesis is settled; you know what you're building |
| `mvp` → `beta` | First real users are in the wild — paying or pilot, not friends |
| `beta` → `production` | Usage and churn are predictable; you're not iterating the core model |

When the trigger fires:

1. Edit the `Stage:` value at the top of this file
2. Edit the priority list and avoid list to match the new stage (definitions below)
3. Update `productStage` in `.claude/manifest.json` to match
4. Commit

Beta picks up the new stage on its next invocation. No agent dispatch, no migration.

---

## Stage definitions (reference)

| Stage | What "good" looks like | Avoid |
|---|---|---|
| `0-to-1` | Learning whether anyone wants this. Throw work away cheaply. | Anything taking >1 day to validate. Infra investment. Polish. |
| `mvp` | Janky end-to-end flow for first real users. | Scale optimization. Feature breadth. Vendor lock-in. Premature abstractions. |
| `beta` | Real users using it; reliability + feedback loops dominate. | Feature breadth that distracts from core flows users actually use. |
| `production` | Stable user base; reliability, performance, cost, security. | Rewrites. Premature scale. Feature velocity that costs reliability. |

The shift between stages is not a feature checklist — it's what changes count as wins.
