# β CONSULT ADDENDUM 1 — SP-20260829-001 — [ENF β-r1 addendum]

**Sent while the r1 ruling is in flight, because r1's premise is now false.** ε self-reported;
nobody caught this but the probe I ran against my own stated unsafe assumption.

Parent consult: `runtime/beta-consult/SP-20260829-001-plan-to-design.md`, msg `36c89485-59f4-44c5-a3c9-e7c11634e197`.

---

## What changed

My r1 consult said "four gates". My plan contract listed as `assumptions.unsafe`: *"That the four
ED-369 sites EXHAUST the fail-open class. They do not … I have not swept scripts/checks/** or the
remaining scripts/hooks/**."*

I then swept. **Probe:** `runtime/sprint/SP-20260829-001/probe-failopen.js` (committed, re-runnable,
exits 2 on a zero enumeration rather than reporting clean — the ED-366 blind-scanner guard applied
to my own probe).

**Measured at `8d15c162`**, over 307 non-test files in `scripts/{hooks,checks,enforcement,sprint,dispatch}`:

- **65 terminal-decision fail-open sites** (a `catch` whose body reaches `process.exit(0)` or
  `return { ok: true }`) across **47 files**.
- **64 distinct scripts are wired as hooks in `.claude/settings.json`. 45 of them carry at least one
  such site.**
- Directory split: `scripts/hooks` 64, `scripts/sprint` 1.

The sweep found 4. The same terminal shape appears 65 times, 45 of them in live-wired hooks —
including `authorization-gate.js`, `dispatch-route-guard.js`, `foundation-guard.js`,
`secret-guard.js`, `untrusted-content-firewall.js`, `scope-contract-guard.js`, `team-guard.js`,
`settings-edit-guard.js`, `self-mod-governance.js`.

## What this does NOT mean — the number is a POPULATION, not a defect count

I read four of them closely before writing this, precisely so I would not hand you "65 defects".
They fall into at least three genuinely different categories:

1. **Real defect — the check's failure to run ALLOWS the guarded action.**
   `scripts/hooks/secret-guard.js:94`: the outer `catch { process.exit(0) }` wraps the entire scan
   *including* the file read and the pattern loop. If reading the target file throws, the
   credential scan silently permits the write. No comment justifies it. This is a new, unfiled
   instance on a security control, and it is the same shape as ED-369 — found in the sprint
   scoped to fix ED-369.
2. **Documented and defensible.** `untrusted-content-firewall.js:44` fails open on a hook-payload
   parse error with the stated reason "infra, not a content threat". `format.js:70` — "formatting
   failure shouldn't block work". These are choices with reasons on the page, not oversights.
3. **Fail-open IS fail-safe here.** `authorization-gate.js:390` fails open around a decision that
   *grants* elevated permission (turbo). Failing open means NOT granting it and falling through to
   normal permissions. Treating this as a defect would make the system LESS safe.

**So the deliverable cannot be "repair N sites", and it cannot be a lint.** A write-time lint over
the raw shape has 364 matches across 111 files once test files and per-item skips are included — it
would be noise, and category 3 means it would sometimes push in the wrong direction. The ED-369 row's
third candidate enforcer ("write-time lint banning a bare `catch { return null }`") is, I think,
the wrong mechanism, and I would rather tell you that than quietly not build it.

## How this bears on the questions already in front of you

- **Q1 (scope).** Strengthened, and now on ground independent of my self-interest. Both consults said
  "enumerate the population, do not hardcode the four repaired paths" *without knowing the population
  was 65/45-live*. Adding ED-374/356/363 to a sprint that has just discovered its own core class is
  ~15× larger than briefed looks worse than it did an hour ago. But note my stake is unchanged and
  points the same way, so please discount accordingly.
- **Q3 (blocking vs report-only) is now the load-bearing question, not a detail.** A blocking audit
  over the live population turns `/scan:full` RED on up to 45 live-wired hook files this sprint did
  not create and cannot triage in one session. A report-only audit instantiates ED-374. I can see a
  third path — the audit ships BLOCKING over an explicitly-declared registry that initially contains
  only the triaged sites, with the untriaged population reported as a named, counted residual — but
  that is a criteria decision and I am not going to make it myself.
- **Q4 (close language).** Now clearly right to pre-commit, and the numbers must be in it: N
  enumerated, M triaged, K repaired, and the rest named as unassessed with the count stated.

## Two things I want to be explicit about

**This addendum makes my sprint harder, not easier.** It converts a four-site repair into a triage of
a 65-site population, and it hands you a stronger argument that the scope I asked to shrink should
instead shrink *further* than the two consults proposed.

**I have not triaged the other 61.** I read 4 of 65. Any statement I make about the ratio of real
defects to defensible choices is an extrapolation from a sample of four, and a sample can show a
class is open but never that it is closed. If you rule on Q1/Q3 partly on the strength of "most are
probably benign", note that I have not earned that sentence.
