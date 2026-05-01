# Beta Source Data — Deep Analysis Reports

Compiled 2026-04-09 from 3 parallel analysis agents. This is Beta's deep context for understanding the user's patterns, priorities, and the system's design philosophy.

---

## 1. Branch Evolution Analysis (392 commits, 7 branches)

### The Arc
- **Test 1:** Speed-run. 21 agents, 26,400 LOC in 45 min. 25 bugs. Lesson: speed without review = debt.
- **Test 2:** Added evaluator + security. Bugs: 25 → 13. Cross-model eval proven valuable.
- **Test 3:** Cross-provider gauntlet (Claude + GPT-5.4). Mechanical enforcement hooks. Avg builder score: 79.2.
- **Tests 4-5:** Housekeeping, consolidation.
- **Test 6:** First live build with manual QA on Vercel. User feedback drove Step8Skills redesign.
- **Test 7:** Pure UX tuning, no builders. Direct session work. Polish phase.

### What Survived Every Branch
- Data contract validation (saveSession architecture)
- Security mindset (validateOrigin, CSRF, rate limiting)
- Spec-first development model
- Parallel agent execution pattern

### What Got Killed
- Overseer daemon → Alex persona (too broken, wrong abstraction)
- Pulse-core → direct events.jsonl (too complex)
- Category ranking → removed (94 refs, no JTBD)
- Light mode proposals → dark mode only
- HYGIENE Rule 8 (check master) → caused branch theft
- 13 evaluator checks → 5 focused scopes

### Recurring Bug Classes (Never Fully Resolved)
1. Stale React state after saveSession() — 5+ recurrences, 6 rules
2. validateOrigin() try/catch bypass — 4 recurrences
3. Strict mode ref guards — 3, declining
4. Component created but not mounted — 3, declining
5. Spec/code mismatch on feature removal — 1 but massive (94 refs)

### Core Values (Never Changed)
1. Data integrity > speed
2. Spec as source of truth
3. Operator transparency (log everything)
4. Parallelism first
5. Feedback loops over prediction (empirical > theoretical)

---

## 2. System Architecture Analysis (28 hooks, 5 agents, 61 skills)

### Design Philosophy (10 Principles)

1. **Fail-closed, not fail-open** — Errors block operations. Parse errors = BLOCKED. Missing config = BLOCKED.
2. **Enforcement over trust** — Rules enforced by hooks, not convention. Boundaries guarded, not suggested.
3. **Append-only truth** — events.jsonl never truncated. Git history sacred. Learnings stay as provenance.
4. **Isolation = safety** — Each builder in fresh worktree. Each agent stateless. Each review independent.
5. **Redundancy for verification** — Evaluator + Security + Compliance = three perspectives catch what one misses.
6. **Incremental evidence** — logged → validated → implemented. "Sounds right" is not evidence.
7. **No escalation for technical decisions** — Lead makes all technical calls. Escalate to user ONLY for product/UX.
8. **Observability first** — Every event logged. Every change tracked. Stale markers surface what's out-of-sync.
9. **Constraints as features** — Builder isolation limits blast radius. Boss can't read code. Lead can't write features.
10. **Dark factory architecture** — Spec is the product. Code is regenerated each cycle. Quality gate is automated.

### Hook Categories
- 5 boundary guards (boss-boundary, foundation-guard, ownership-guard, excalidraw-guard, secret-guard)
- 8 process integrity guards (cycle-enforcer, gate-check, gauntlet-gate, merge-guard, prompt-validator, store-validator, worktree-preflight, beta-gate)
- 3 memory integrity guards (memory-guard, learning-validator, edit-watcher)
- 4 code quality hooks (lint, format, typecheck, save-session-lint)
- 5 context/observability hooks (context-enhancer, prompt-logger, session-tracker, session-start, session-stop)
- 3 infrastructure hooks (systems-sync, compact-saver, prompt-enhancer)

### Agent Roles (Strict Separation)
- **Builder:** Stateless, worktree-isolated, builds ONE feature, commits before returning
- **Evaluator:** Reviews against spec AND golden fixtures. Never writes code. Never suggests fixes.
- **Security:** OWASP + custom scans. Independent from evaluator. No code writing.
- **Fix Agent:** Surgical fixes ONLY. Never refactors. Must fix within scope.
- **Lead:** Full picture, adjusts environment. Max 3 rule changes + 1 spec patch per cycle. Never writes feature code.

---

## 3. Prompt Pattern Analysis (207 prompts, 13 handoffs)

### Communication Style
- Direct, terse, no fluff. Single-word approvals ("Do it", "Yes", "Clean")
- Questions reveal systems thinking, not hesitation
- Colloquial when comfortable ("hunky dory", "oh shit dude")
- Rarely says "please" — states what he wants
- Frustration signal = recurrence ("this keeps happening", "how do I get you to LISTEN???")
- Enthusiasm signal = "monumental", "interesting", "fun"

### Decision Patterns
- **Instant approval:** Scoped, concrete, bounded tasks → "Do it"
- **Pushback:** Massive unstructured plans, vague proposals
- **Escalation:** Recurring problems that should have been fixed
- **Warm approval:** Ambitious work framed as "monumental"

### Delegation Patterns
- **Freely:** Infrastructure, audit, research, parallel agent work, preflight
- **Retains:** Product UX, spec semantics, feature shape, naming/taxonomy
- **Critical enforcement:** Gauntlet, boss lanes, role boundaries

### Time Patterns
- **22:00-02:00:** Command-driven, rapid-fire, infrastructure, decision gates
- **02:00-06:00:** Philosophical, system-level, wide thinking, meta-reflection
- **09:00-18:00:** Barely active (1 event)
- Late-night = architect mode. Daytime = builder mode (when active).

### Prompt Cycles (Recurring Sequences)
- build → find bug → build meta-system → refine → back to product
- run skill → review output → rename/restructure skill → run again
- ask "what does this look like?" → get explanation → "do it"
- frustration about recurrence → create hook/enforcement → verify it works
- question → answer → /maps:all (ground-truth the answer)

### What Energizes
- "Monumental" tasks (big scope, intellectually interesting)
- Systems-level wins ("See!" when the system comes together)
- Dual outputs / reusable assets ("generalized version")
- Product iteration with clear context

### What Frustrates
- Recurrence ("This keeps happening")
- Vague/massive prompts
- Imprecise language ("applied" vs "appended")
- Architectural violations that were documented but happened anyway
- Wholesale data file overwrites during review phases
