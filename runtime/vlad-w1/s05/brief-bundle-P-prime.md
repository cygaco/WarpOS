# BUNDLE P′ — the disclosure's FRAME + the partitioned findings table — S-VLADW1-05

You are a backend-builder on sprint S-VLADW1-05. **Prose-only.** Bundle P has landed (`de1f3f3`);
this is a targeted correction to the block it shipped, not a rewrite of it.

**⏱ HARD BUDGET: your route is killed at 20 minutes.** A partial answer with a written envelope beats
a complete answer killed with none. **Write your envelope BEFORE optional depth.** If you run long,
commit what is green and report the rest as `not-reached`. Do not polish.

---

## ENVIRONMENT (ED-363)

Your process cwd is **NOT** the target repo. Dispatch places you in a WarpOS agent worktree; expected.
This brief asserts no cwd.

- **TARGET REPO:** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`
- **TARGET BRANCH:** `wt/S-VLADW1-01-engine`. Do NOT branch, merge, or push. **Package root:** `engine/`

Plain single `git -C "<abs>"` commands; commit with `-F <abs msgfile>`; absolute paths. Never
`cd X && …`, no heredoc commits, never pipe git through `tail`/`head`. If a plain `git -C` is refused,
STOP and report with the output. **Do not edit what you cannot commit.**

**Gates, each as its OWN command, real exit code read separately:** suite from `engine/` (floor
**393**, 0 fail), `npm run check:ship` (exit 0), and `node scripts/checks/custody-claim-lint.js`
(exit 0). `check:pointers` exits 1 by design, outside `check:ship`.

## SCOPE

**allowedFiles:** `engine/CUSTODY.md` only.
**forbiddenFiles:** all mechanism code and all test files. If a sentence can only be made true by
changing code, **report that and stop** — do not change behaviour to rescue prose.

---

## WHY P′ EXISTS

P's audit-coverage block (≈L164-193) is accurate about **what the lane found**. It is under-specified
about **what the four files are**, and that gap is the sprint's own class one layer out.

**The four files are not "the files carrying custody prose."** They are **the four `src/`/`driver/`
files that every gauntlet-2 lane sampled without reading end to end** — a claim about *what the lanes
did*, not about *which files carry claims*. If the shipped sentence reads as the second, it is false.

**And it IS false as the second reading, positively:** other files carry the same class of prose.
Known members, **as a lower bound, not the complete addition**:
- `engine/src/spawn-shim.js` — L67 *"…secret CLASS whose shape matched — NEVER the value itself"* ·
  L155 *"used ONLY to REFUSE a Proxy `args` container"* · L349/351 *"read exactly ONCE"* ·
  L499 *"does NOT cover: a name that has NEVER been passed to…"* (a coverage-ceiling claim on the
  Proxy/args refusal path)
- `engine/src/bootstrap.js` — L18 *"give both entries exactly ONE static import declaration each"* ·
  L22 *"exactly one thing"*

**These two were found by a capped grep that checked closure-flag prose in only two hits.** They are
**not** the complete set, and you must not present them as one.

---

## TASKS (3)

### 1. State the SELECTION CRITERION, and that completeness is UNTESTED

Rewrite the block's framing so it says, in words, **what makes those four the four**: they are the
`src/`/`driver/` files **every gauntlet-2 lane sampled rather than read end to end**. Do not let it
read as "the files that carry custody prose."

Then state plainly that **the completeness of the claim-bearing set is UNTESTED under any frame** —
nobody has enumerated which files carry this class of prose.

**Run your own grep** over the `engine/` package for closure-flag prose (`EVERY`, `ONLY`, `NEVER`,
`exactly`, `no other`, `all`, and count-shaped phrasing) and **emit by name what you find, as a stated
lower bound with your method described.** Include the two above if your grep finds them; if your grep
finds more, that is the point. **Say what your grep would miss.** An emitted lower bound with its
method named is admissible; "a few other files" is not.

### 2. The PARTITIONED per-item table — no anonymous findings

P's block reports 64/30/28 with a per-file table. **A count of "30" makes thirty non-fungible findings
look fungible.** Partition by **what each false sentence is ABOUT**:

- **false-about-prose** — a wrong count, a wrong frame, an overstated closure. *The document is wrong;
  the system is fine.* **MEDIUM.** These may be **grouped by file**, with each sentence quoted.
- **false-about-a-safety-property** — a claimed guarantee the code does not provide. *The world is
  other than reported.* **Each gets its own id and its own row.**

**Two ids are already assigned. Ship both, verbatim in substance:**

**`S06-F01` — `model-seam.js` L446-452.** Claim: *"An unrecognized mode FAILS CLOSED — it is refused,
never silently defaulted."* Code L455-464: `const mode = explicitMode || process.env[AUTH_MODE_ENV_VAR]
|| DEFAULT_AUTH_MODE;` with L102 `DEFAULT_AUTH_MODE = AUTH_MODES.SUBSCRIPTION`. **False:** an
explicitly-supplied empty string (or empty env var) is falsy, falls through both `||` rungs, and is
silently defaulted. **MEDIUM**, and the reason must be stated as: *the default is a FIXED constant, so
no input silently selects the API-key-bearing mode* — **verifiable from L102 alone.**
**Do NOT write "because subscription is credential-free" — that is false** (L3-5 names the
OAuth/session state as credential material; L167 carries `patternSource: "^sk-ant-oat"`).
**Residual, BOTH directions, both required:**
- *consequence, sharper* — **principal and billing-surface substitution**: an operator who set
  `ANTHROPIC_API_KEY` and intended api-key mode but supplied `""` silently runs against **the
  machine's own Claude subscription login** — different principal, different rate limits, different
  billing surface — with the configured key captured by custody and never used;
- *reach, narrower* — **currently UNREACHABLE in production**: `model-seam.js` **L32-36** records that
  `createModelSession` has **no production caller** in `src/` or `driver/` (test files only).
**Without the second half the row overstates its own finding, which is the class it is filed under.**

**`S06-F02` — `model-seam.js` L12-17.** Claim: *"this module never requires, persists, or emits a
developer API credential in that mode (AC-1.1)."* Graded **FALSE** by the lane: top-level
initialization captures all denylisted values through `initCredentialCustody()` **regardless of mode**.

**GROUP F01 AND F02 UNDER ONE ROOT:** *a mode qualifier attached to behaviour that is not
mode-conditional.* Two sentences, one defect shape, **one remedy** — which is why grouping them is
more useful than listing them.
**Provenance note required on that grouping:** the mode-independence of custody capture rests on
`host-free-driver.js` **L94-95** (a lane record of a neutered-scrub experiment) **and on comment
blocks — NOT on a read of `initCredentialCustody`'s implementation.** Say so.

### 3. The knowledge sentence

The disclosure must say the sprint **ships documents KNOWN to contain false claims, unrepaired by
scope decision** — not merely unreviewed. Before the read, the residual was *"we have not looked."*
It is now *"we looked, we found these, and we are shipping them unrepaired because repair was out of
scope."* **Those are different disclosures and knowledge is what changed.**

**KEEP VERBATIM** P's existing clause: *"The read itself ran nothing — no test, no probe, no mutant —
so every verdict above is static reasoning over source text: the 28 cannot-determines are UNRESOLVED,
not benign."* It is better than anything specified here; do not paraphrase it.

**One more disclosure, at its true strength:** bundle P proved **by execution** that backtick-only and
tilde-only lead-ins evade `resemblesBindableLeadIn`, but the committed test G-3 pins only two classes,
so that finding is **execution-proven and UNPINNED**. Say exactly that — "execution-proven, unpinned".
A later bundle may pin it; until it does, do not write that it is pinned.

---

## STANDING DISCIPLINE

1. Every shipped sentence is drafted **after** the attack that would falsify it. Approval is not a
   truth check.
2. No coverage claim at a coarser granularity than the evidence has. **No bare count without its
   table.**
3. A text matcher cannot distinguish a violation from a description of one — you are writing prose
   about banned patterns inside a linted file. Expect trips; **rephrase, never suppress**, and never
   add an allowlist entry to make your own sentence pass.
4. **You may refuse any premise here with evidence.** Four builders on this sprint have refused
   premises today and all four were right — including two that refuted figures marked "verified".
5. **MEASURE ANYTHING YOU RESTATE.** Every figure above is relayed. If yours differs, **report the
   difference and use yours.**
6. Halt at the bundle boundary, never mid-bundle.

## ENVELOPE — required fields

`falsification_attempts`: one entry per sentence shipped; for prose, `attack_run` is the specific
input you constructed to try to make the sentence false, and what happened.

- **`what_i_could_not_assess`**
- **`files_i_could_not_see`** — every file/region sampled rather than read end to end
- **`execution_proven`** — which claims you RAN vs reasoned about; and for anything cited rather than
  re-derived, **say it is cited**
- **`what_would_confirm_or_refute`**
- **`read_outside_the_quoted_region`** — **REQUIRED.** Whenever you rate a claim or assert a mechanism,
  state **what you read OUTSIDE the lines you quote.** Three ratings in this sprint moved when someone
  finally opened the file — including one where the quotations were **exact** and the rating still
  changed, because the load-bearing fact sat 350 lines above the quoted region. **An excerpt is a
  frame, and a frame chosen by the person making the claim will tend to contain the evidence for it.**
  Usable: *"I read L440-471 and the constants at L97-102, and nothing else in that file."*
  Not usable: *"I read the relevant section."*
