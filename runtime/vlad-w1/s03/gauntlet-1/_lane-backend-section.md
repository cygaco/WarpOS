
---

## YOUR LANE — `backend-reviewer` (code quality, BINDING)

**Working tree — read and run from here:**
`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine`

You have Read/Grep/Glob/Bash. **Use them.** Read the diff `git diff e4c75c7 a9e6708` and judge the code
as code.

### Check-7 (7A–7G), applied to this diff

Correctness · error handling · resource handling · concurrency · API/contract shape · readability and
comment truthfulness · test quality. Two of those matter unusually much here:

**7F — comment truthfulness is a first-class defect in this codebase.** The headers in `src/env-scrub.js`,
`src/bootstrap.js`, `src/model-seam.js` and `src/spawn-shim.js` are extremely long and make precise
technical claims about ESM evaluation order, module-registry realms, and absorption semantics. The
predecessor sprint shipped a header claim ("FIRST STATEMENT, before every other import below") that was
**false by ESM semantics** and it survived multiple reviews. **Read every new/changed header claim and
test it.** A header that is 60 lines of correct reasoning and one false sentence is a finding, and the
false sentence is the whole finding.

**7G — test quality.** This sprint's central lesson is that a test can be green and prove nothing. Look
for:
- Assertions that cannot fail (the `|| true` class — and note `scripts/checks/no-tautological-assertions.js`
  now lints for a *named syntactic family*; check its **stated semantic-vacuity ceiling** is honest, i.e.
  it does not imply it catches semantic vacuity).
- Sanity controls that are themselves vacuous. The predecessor shipped a "sanity control proving the
  walker is not vacuously true" that was itself vacuous. **Check the current one actually discriminates.**
- Tests whose fixture is constructed from the same source as the thing under test (a tautology one layer
  out).
- `test/entry-bootstrap.test.js`'s `extractStaticImportSpecifiers`: does it handle every static form?
  Re-exports, `export * from`, `import type`, side-effect-only `import "x"`, string-concatenated
  specifiers, `import()` inside a template? A specifier extractor with a blind spot makes the A2/A3
  closure assertion silently weaker than it reads.

### Specific code surfaces to weigh

- `src/bootstrap.js` — a re-export-only module. Does the "exactly one static import" invariant hold
  transitively, and is the re-export shape (`export { x } from "./y"`) actually a static import for the
  purposes of every tool that inspects it?
- `src/env-scrub.js` — the absorption logic. Read it for correctness: is there any input under which a
  captured value is lost, or a real value is overwritten with `undefined`? Is the `names`-argument guard
  fix correct, or does it now over-scrub?
- `src/spawn-shim.js` — the re-scrub call in `auditedSpawn`. Cost per spawn? Any reentrancy hazard? Does
  it run before or after the arg/env freeze, and is that ordering correct?
- `src/model-seam.js` — `buildSecretSearchPattern` and `SANCTIONED_CARRIER_NOTE`. The note's sentence 3
  was corrected and the bind extended to the whole note. Verify the correction is itself **true** (P2
  exempts `spawn-shim.js`, not `model-seam.js`) — the predecessor got this exact sentence wrong twice.
- `src/job-manager.js`, `src/quota.js` (bundle 8d) — ordinary backend review. State machine integrity,
  error paths, resource cleanup.
- `scripts/checks/lib/ac-manifest.js` and `no-tautological-assertions.js` — new enforcers. Do they
  fail-closed on runner error and on parse error? An enforcer that exits 0 when it crashes is a
  false-green machine, which is the highest-value defect class in this repo.

### Scope discipline

- Findings only. Do not propose refactors and do not write code.
- Map each finding to an S-criterion where one applies; use `"none"` for ordinary code-quality MEDIUMs —
  those are real and wanted, they just do not gate the release.
- `execution_proven: true` only for something you ran.
- Leave the worktree clean; verify with `git status --porcelain`.
