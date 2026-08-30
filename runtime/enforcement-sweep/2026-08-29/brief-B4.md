# BUNDLE B4 — three fail-open / fail-silent repairs — SP-20260829-001

You are a backend-builder. **Three sites, each small.** Right-sized deliberately: a prior bundle on
this sprint tripped the >12000B right-sizing warning, so this brief is scoped to three named defects
with their evidence attached, not to a survey.

## ENVIRONMENT

Your process cwd is not necessarily the repo root; this brief asserts no cwd. Use absolute paths and
plain single `git -C "<abs>"` commands. Commit with `-F <abs msgfile>` — never inline, never a heredoc.
**Never `--no-verify`. Never add an allowlist entry to make your own change pass. Never hand-edit a
registry or progress file to make a gate pass.**

**Repo:** the WarpOS project root (absolute path in the dispatch envelope above).

**Gates, each as its OWN command, real exit code read, never piped through `tail`/`head`** (a pipeline
returns the tail's status, so a red gate reads as green):
- `node scripts/testsuite/enforce.js`
- `node --test` over any test files you add
- **Manifests LAST, after your final code edit:** `node scripts/generate-framework-manifest.js` then
  `node scripts/warpos/manifest/build.js`. `scripts/**` is hash-tracked; skipping this reds BC-02/BC-05.

## THE SHARED DEFECT CLASS

All three are the same shape: **a failure to CHECK is silently resolved into a definite answer, and the
answer is the permissive one.** The discriminator to apply at each site: *does the failure land on the
permissive or the restrictive side of the decision THIS code makes?* Permissive-on-failure is the
defect. "Could not determine" must be **visible** — never rendered as a pass.

---

## TASK 1 — `scripts/sprint/design.js:193` — an explicitly self-labelled fail-open

Verified at source, verbatim:

```js
    return { ok: true };
  } catch {
    return { ok: true }; // fail-open for unexpected errors
  }
```

This is the tail of the **R-id trace-integrity** check. On any unexpected error the gate returns
`ok: true` — an *unchecked* sprint is reported identically to a *verified* one. The comment states the
intent, which makes it a known choice rather than an oversight; the sprint's finding is that the choice
is wrong for a gate whose whole job is integrity.

**Repair:** an unexpected error must NOT return `ok: true`. Return a distinguishable non-pass carrying
the underlying error, so the caller can tell "trace-integrity failed to run" from "trace-integrity
passed". **Read the caller before choosing the shape** — if the caller treats any non-`ok` as a hard
block, decide deliberately whether an infrastructure failure should block, and say which you chose and
why. Do not guess: the correct answer depends on what the caller does, and that is a read, not an
opinion.

## TASK 2 — `scripts/sprint/fs.js:255-268` — three stacked silent catches

Verified at source: `readYamlMaybe` tries `require("js-yaml")` → on throw falls through; tries
`JSON.parse` → on throw falls through; ends at `parseMiniYaml(text)`.

**The defect is not the fallback chain — it is that a CORRUPT file is indistinguishable from a file
that merely needs the next parser.** A genuinely malformed tracker/sprint file silently becomes
whatever `parseMiniYaml` returns, and every downstream reader treats that as the file's content.

**Repair:** make "no parser could read this" distinguishable from "parsed". Note the two catches are
NOT the same: a `require` failure means *the library is absent* (an environment fact), while a
`yaml.load`/`JSON.parse` throw means *the text is malformed* (a content fact). **Do not collapse
them** — the first is a legitimate fall-through, the second is the signal. `parseMiniYaml` returning
something for unparseable text is the fail-open; decide what it should do and make the failure visible
to the caller.

## TASK 3 — `scripts/sprint/validate-autonomy-config.js:95-100` — ED-380

Verified at source:

```js
  let ajvAvailable = false;
  try {
    require.resolve("ajv");
    ajvAvailable = true;
  } catch {
    /* ajv not installed — skip schema validation, keep contract checks */
  }
```

**ED-380's policy:** *a validator that cannot run one of its checks must say so (UNKNOWN / SKIPPED,
visibly) — exit 0 must never be indistinguishable from "schema-validated" when the schema half never
ran.*

**The aggravating fact, and verify it yourself rather than taking it from me:** ED-380 records that
WarpOS has no root `package.json` / `node_modules`, so `require.resolve("ajv")` is expected to fail
**always** here — meaning the schema half has likely never run, while the validator exits 0. Check
whether that is true now; if it is not, say so and the finding narrows.

**Repair:** the skip must be visible in the output AND distinguishable in the exit contract. A caller
reading only the exit code must not conclude the schema validated. Whether that means a distinct exit
code, a `--strict` mode, or a structured status field is yours — but a message printed on the happy
path is **not sufficient on its own**: the consumer of a check is a gate, and gates read exit codes,
so text on a passing check is the one channel structurally ignored exactly when it has something to
say. If you choose a report-only ramp, it must carry a **self-pulling trigger stated as an observation**
(not "until ED-380 closes"), because a report-only ramp with no deadline and no owner is permanently
report-only.

---

## DISCIPLINE

1. **Every fix ships its own teeth** — a test that FAILS without the fix. Observe it fail: inject the
   fault, watch the assertion fail against the unrepaired code, then repair and watch it pass. **A
   no-op guard is required**: a fixture that did not actually inject its fault must fail, not pass.
2. **Report behaviour, not colour words.** Give exit codes and observed output.
3. **Emit the list, never a count.** A sister bundle shipped "all 8 registry site_ids" against a
   registry holding 11 and had to be amended. Name the sites; let the reader derive any number.
4. **You may refuse any premise here with evidence** — including my three source quotes. A refusal with
   a read attached is a CORRECT return, not a failed bundle. Two builders refuted "verified" figures on
   this project today and both were right.
5. **Do not widen scope.** If you find a fourth site of this class, **report it** — do not repair it.
   Name it with file:line so it becomes a registry row.
6. **FENCE:** commit in your worktree. Do **not** merge, do **not** push.

## ENVELOPE — required fields

Per task: the site, what you changed, the fault you injected, and **what you observed** (exit codes,
raw output). Plus:

- `what_i_could_not_assess`
- `files_i_could_not_see` — every file or region sampled rather than read end to end
- `execution_proven` — which claims you RAN vs reasoned about, separated plainly. For each task
  specifically: did you OBSERVE the test fail without the fix, or only write it?
- `what_would_confirm_or_refute`
- `read_outside_the_quoted_region` — for each task, what you read OUTSIDE the lines I quoted. **This
  matters here**: Task 1's correct repair depends on the CALLER, which is outside my quote, and a
  conductor on this project shipped a wrong remedy today by reasoning from an excerpt he chose himself.

An omitted field reads as UNKNOWN, never "nothing to report"; an empty `files_i_could_not_see` must be
an explicit, deliberate empty rather than an absent key.
