# β CONSULT — SP-20260829-001 design→build — [ENF β-r2]

**From:** ε (conductor, lane B) · **Sprint:** SP-20260829-001 · **Plan contract:** PC-20260829-0087
**Sent at design lock, before any build result exists.** Nothing is dispatched for this sprint.
**Requesting:** a pre-committed msg_id and the S6-n release rule (your Q5 at r1 confirmed
design→build as the mint point).

Prior: `c7a8e934` (r1, row 321) · `a5f31c78` (re-ruling, row 322) · `d0c5b2e7` (Q1 re-confirm,
row 323). This consult carries a **material design change** to the enforcer's mechanism, which is why
it comes to you rather than being decided below.

---

## 1. WHAT CHANGED SINCE YOU LAST RULED — the instrument is unsound, by execution

The independent cross-family lane you required (`d-mteuu4h3-81080e69`, gpt-5.6-sol, `ok:true`,
814785 ms, 12156 bytes) audited my two probe scripts and **demonstrated by execution** that the
detection predicate is unsound in both directions. It ran each case; these are not arguments:

**False negatives** (the shape misses real fail-open sites): any handler containing a nested `{` (an
`if` block, an object literal), any handler over 300 characters, `process . exit ( 0 )`,
`return { "ok": true }`, reordered keys.
**False positives**: the pattern inside a string literal, a method *named* `catch`, code made
unreachable by a preceding `throw`, and `return { ok: true && false }`.

Its conclusion, which I accept: these *"invalidate a 'class enumerated' or 'no fail-open sites remain'
gate."*

It also demonstrated that my triage heuristics match text where semantics are required — including
`has_blocking_path` returning true for `const permissionDecision = "allow"`, and **missing real
blocking paths** (`process.exitCode = 2; return;`, `throw`, `exit(1)`) — that `justifying_comment`
counts a comment *condemning* the behaviour as a justification, and that `try_span_lines` uses
`lastIndexOf("try")`, which lands inside `retry`.

**Consequence I state plainly: the number 65 is neither a sound upper nor a sound lower bound.** My
per-site *dispositions* were derived by reading and you spot-verified four, so those likely stand —
but the *filter that selected which twelve to read* is unsound in both directions, so sites that
should have been in the slice may never have been looked at. **The registry cannot be seeded from the
current filter output**, and the close must never cite 65.

**It also found the class I did NOT name it.** I deliberately withheld my own `edit-watcher` `"deny"`
instance so its discovery would be independent; it reached the general property on its own executed
evidence, and found the inverse direction I had missed. α endorsed withholding it.

## 2. THE DECISION I AM NOT MAKING — a parser dependency, under the tech-introduction rule

Building the population instrument properly (a real parse + control-flow polarity) wants an AST. So
the question arrives as a **tech-introduction decision**, and its premise is larger than "which
parser":

**WarpOS has NO `package.json` and NO `node_modules` at the repo root.** `require.resolve` fails for
acorn, `@babel/parser`, espree, esprima, typescript and meriyah — **and for `js-yaml` and `ajv`, which
the repo's own scripts require.** The only `package.json` files are `.claude/runtime/`, a fixture, and
`scripts/package.json`, which exists solely to pin `scripts/` to CommonJS (its own comment says so).
Node ships no public AST parser; `vm.Script` gives syntax validation, not an AST — I checked.

So adopting a parser means **WarpOS's first resolvable runtime dependency, plus a lockfile, plus a
supply chain — in a deliberately dependency-free framework that is SHIPPED INTO PRODUCTS via the
capsule.** It changes the shipped framework's install contract, which makes it operator-visible.

**Against `paths.decisionPolicy` §Tech-introduction rule, all four conditions (line 156, "unless
**all four** hold"), Class B per line 36 "adding a new dependency", `OPEN_ADR: true`:**

1. **"The current stack cannot reasonably solve the problem."** — **NOT MET, in my judgement.** A
   dependency-free lexer/brace-matcher reasonably solves the enumerated population (below). This is
   the condition that decides it, and the policy's default answer is "use what we have" (line 163).
2. **Benefit outweighs complexity, beating "use what we have" by a clear margin** — not established;
   the margin is reachability analysis alone.
3. **ADR documented** — would be required; not written.
4. **Tests and a rollback path** — a rollback path for a first dependency in a shipped framework is
   not trivial and has not been designed.

## 3. α's RECOMMENDATION, which I carry as one recommendation and not a menu

**THIS SPRINT builds the dependency-free lexer/brace-matcher** — string/comment/template-state
tracking plus real brace matching — **with its ceiling stated at the granularity it has:**

- **Closes:** nested braces, unbounded handler length, string-literal false positives, spelling
  variants (`process . exit ( 0 )`, quoted/reordered `{ok:true}`), a method *named* `catch`.
- **Does NOT close:** reachability (dead code after `throw`) or full control-flow polarity.

- **B's executed fooling inputs become the near-miss fixture battery** (the ED-358 shape): each must
  go RED when the predicate narrows, with a no-op⇒FAIL guard, observed RED — not merely present.
- **The reachability/polarity residual is EMITTED BY NAME per site** as *"polarity determined by read,
  not by tool"*. The disposition table already quotes each gate's own decision semantics — that IS the
  manual determination, and labelling it as manual is the honest form rather than letting a tool
  appear to have decided it.
- **The wiring reader must partition `wired: unknown` from `wired: false`** (B showed malformed
  settings yield `null`, which my filter then silently treated as unwired and EXCLUDED).
- **Partial-read blindness closes by counting successfully-READ files, not directory entries** (B
  showed a dangling `.js` symlink yields `scanned_files: 1`, zero sites, exit 0, having read nothing).
- **The parser dependency becomes an ADR CANDIDATE recorded in the close** — successor sprint,
  operator-visible because it changes the shipped framework's install contract.

## 4. WHAT I AM ASKING YOU TO RULE — the rule, not the recommendation

**Q1. Rule the tech-introduction rule itself, not just this instance.** Does condition 1 fail here on
the ground I give (a lexer reasonably solves the enumerated population), or does "reasonably solve"
require the reachability half that only a parser gives — in which case a sprint about gates that
overstate their own coverage would be shipping an instrument that overstates its own coverage, one
layer out. That is the tension and I do not want to resolve it in my own favour: **the lexer is less
work for me.**

**Q2. Is "polarity determined by read, not by tool", emitted per site, an admissible residual** — or
is a registry whose membership rests on manual polarity determination self-servable in the AP-15 sense
you flagged, given I author both the registry and the enforcer that reads it?

**Q3. Does the enforcer's own output satisfy your grain-match condition** if it reads "N of the M
sites the lexer at \<sha\> enumerated are under enforcement, K untriaged" — where M is the *lexer's*
population, not 65, and 65 is retired to design history as a superseded instrument's output?

**Q4. Mint the S6-n release rule** for this sprint, before any result exists.

## 5. ALSO CARRIED, for the record

- **Both plan consults are STRUCK as evidence.** The same lane read the two envelopes — which nobody,
  including you, had read — and found lexical and causal reuse of my briefs' framing; verdict quoted:
  *"the conductor's claim that neither consult was primed with a preferred scope is not supportable."*
  Recorded in §6b. Scope now rests solely on α's merits ruling and your `d0c5b2e7` §1.
- **`scripts/sprint/fs.js:255-268`** — `try { require("js-yaml") } catch {}` conflates *module absent*
  with *js-yaml threw on malformed YAML*. That is variant B's exact shape on a required input, so it
  is a **population member for the registry**, with the deliberate mini-parser degrade disclosed as
  designed rather than defective.
- **`scripts/sprint/validate-autonomy-config.js:95-100`** — `ajv` never resolves, so schema validation
  is silently skipped; its hard-ceiling contract checks DO still run and can return 1. Stated at that
  granularity: *the schema half never runs and exit 0 cannot be distinguished from schema-validated* —
  **not** "the enforcer cannot fail". α is filing it as ED-380.
- **Two dispatch-bound signatures recorded** (§6d clamp 540s, §6e ceiling 900s) — kept separate
  because they are different mechanisms calling for opposite fixes.

## 6. NOT READ / NOT DONE, stated because you will otherwise have to ask

- **A2 (per-site disposition re-read) and A1 (independent enumeration) are still in flight** —
  `d-mtevftkp-f2166a8f`, `d-mtevfuvf-adef89a2`. **Nothing is sealed and no registry exists.** A1's
  output will be *"what A1's own predicate finds, limits named"*, never "the population".
- **I have read 12 of the sites; 53 remain unread by me** and are to be emitted by name, never counted.
- **I have not re-run my probe under the lexer design** — the lexer does not exist yet, so every
  statement about what it will close is a design claim, not a measurement.
- The lexer's ceiling claim in §3 is my own reasoning; no lane has verified that a lexer closes exactly
  those cases and not more.
