# ED-009 Cross-Provider Review - Backend

Binding verdict: FAIL

Blockers: 1
Notes: 4

## Blockers

### 1. Blocking enforcer is already false-green because the manifest directory allowlist masks live inline role detection

`scripts/checks/repo-role-single-source.js` is being wired as a blocking ED-009 invariant, but its allowlist excludes the entire `scripts/warpos/manifest/` tree from scanning:

- `scripts/checks/repo-role-single-source.js:40-45` says the directory allowlist is for legitimate manifest content readers.
- `scripts/checks/repo-role-single-source.js:80-87` defines `_warpos/MANIFEST.json` existence checks as role-derivation violations outside that allowlist.

That allowlist is too broad. `scripts/warpos/manifest/bootstrap.js` is not just a content reader; it has a live mode/role detector and uses that detector to refuse canonical roots:

- `scripts/warpos/manifest/bootstrap.js:103-121` computes `hasWarposManifest`, `hasFramework`, and returns `mode: "canonical"` from `_warpos/MANIFEST.json + framework/`.
- `scripts/warpos/manifest/bootstrap.js:123-139` separately classifies product modes from `_warpos`, `.claude`, `scripts/hooks`, and `framework-installed.json`.
- `scripts/warpos/manifest/bootstrap.js:481-486` calls `detectMode()` and refuses canonical mode.
- `scripts/warpos/manifest/test-bootstrap.js:35-40` imports `detectMode`, and `test-bootstrap.js:535-551` tests its canonical/product decisions directly.

This is current inline canonical-vs-product derivation, not a hypothetical future bypass. The new enforcer reports green anyway:

```text
node scripts/checks/repo-role-single-source.js
repo-role-single-source: OK - no inline role derivation found outside scripts/warpos/repo-role.js
```

That contradicts the `/scan:full` claim at `.claude/commands/scan/full.md:110` that ALL canonical-vs-consumer role derivation flows through `scripts/warpos/repo-role.js`. It also means the "live-clean at wire-time" premise is false under the stated policy.

Required fix before PASS: either narrow the allowlist to specific manifest content-reader files and refactor `bootstrap.js`'s role/mode decision to consume `resolveRepoRole()` / `isCanonicalDir()` for canonical refusal, or explicitly carve out `bootstrap.js` in policy as a separate allowed mode detector with tests proving why it cannot use the resolver. If the invariant remains "all derivation flows through repo-role.js", this must not be allowlisted.

Also add planted-violation tests for the enforcer. The current regex suite covers only same-line literal forms; it misses ordinary JS shapes such as:

```js
const marker = path.join(root, "_warpos", "MANIFEST.json");
if (fs.existsSync(marker)) return true;

if (manifest.warpos?.source === "self") return true;
const source = manifest.warpos && manifest.warpos.source;
if (source === "self") return true;
```

Those misses compound the blocker: even outside the broad allowlist, the blocking enforcer is line-local and literal-shape dependent.

## Notes

### 1. Admin guard env-immunity checks out

`isCanonicalDir()` does not call `resolveRepoRole()` and has no override parameter. It resolves the directory and calls the filesystem-only signal detector directly:

- `scripts/warpos/repo-role.js:92-145` implements `detectCanonicalSignal(root)` with only filesystem/manifest reads.
- `scripts/warpos/repo-role.js:167-205` keeps `resolveRepoRole()` precedence as override -> env -> signals -> consumer -> unknown.
- `scripts/warpos/repo-role.js:233-235` implements `isCanonicalDir(dir)` as `detectCanonicalSignal(path.resolve(dir)) !== null`.
- `scripts/admin/preview.js:87-95` and `scripts/admin/seed.js:113-121` call `isCanonicalDir()`, not `resolveRepoRole()`.

Required repro passes on this canonical repo:

```text
WARPOS_REPO_ROLE=consumer node -e "console.log(require('./scripts/warpos/repo-role').isCanonicalDir(process.cwd()))"
true
```

The stronger check also shows the intended divergence:

```json
{"isCanonicalDir":true,"resolveRole":"consumer","resolveSource":"env:WARPOS_REPO_ROLE"}
```

No env/override leak found in the admin guard path.

### 2. Safety-floor behavior change is justified and still refuses real WarpOS

The old bare `warpos:` presence rule really was over-broad for scaffolded consumers. `scripts/warpos/scaffold-core.js:542-546` writes a top-level `warpos` install record with `source: interview.warposSource`, and `scripts/warp-setup.js:345-369` defaults that source to the GitHub provenance, not `"self"`.

The real canonical repo remains refused by multiple belts:

- Path belt in `preview.js:87-90` and `seed.js:113-116`.
- `_warpos/MANIFEST.json` signal in `repo-role.js:96-98`.
- `.claude/manifest.json` has `repoRole: "canonical"`, `warpos.source: "self"`, and `project.slug: "warpos"`.
- `version.json` has `name: "warpos"`.

The beta-named edge case remains true: a different canonical tree that has shed every signal and is not this checkout path will not be detected. I do not count that as a blocker for this patch because the new contract is explicitly signals-only plus path-belt, and no local detector can distinguish an all-signals-removed canonical tree from an unknown product directory without adding a new durable marker requirement.

### 3. The new preview regression test asserts the corrected behavior honestly

`tests/regression/SP-20260614-002/preview-failclear.test.js:59-75` asserts that a consumer install record with `source != "self"` is not refused. `preview-failclear.test.js:77-90` asserts that `warpos.source === "self"` is refused, and `preview-failclear.test.js:92-103` keeps `project.slug === "warpos"` refusal.

That is the right behavioral split. It does not merely paper over the old behavior; it locks the intended distinction between consumer install provenance and canonical self-identity.

### 4. Stale command doc still describes the removed bare-presence rule

`.claude/commands/admin/preview.md:19-23` still says the guard refuses when `.claude/manifest.json` carries a top-level `warpos:` block. That is no longer true and conflicts with the corrected AC at `.claude/project/sprint/requirements/SP-20260614-002/acceptance-criteria.md:16`.

This is not a runtime safety blocker, but it should be cleaned up so operator-facing docs do not re-teach the over-refusal rule this patch intentionally removed.

## Verification Run

```text
node scripts/warpos/test-repo-role.js
Tests: 78  PASS: 78  FAIL: 0

node tests/regression/SP-20260614-002/preview-failclear.test.js
preview-failclear: 9/9 pass

node tests/regression/SP-20260614-002/seed-idempotent.test.js
seed-idempotent: 2/2 pass

node scripts/checks/repo-role-single-source.js --json
ok: true, violationCount: 0

git diff --check -- changed files
clean
```

