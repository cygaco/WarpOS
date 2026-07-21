"use strict";
/**
 * pinned-checker-bundle.js — content-addressed pin + out-of-tree integrity-fenced runner (SP-20260720-002
 * Phase 4, unit BUNDLE, Seam B / β riders 3+4).
 *
 * WHAT PROBLEM THIS CLOSES: R-3 (candidate-domain separation) — the checker that gates integration into
 * `main` must resolve and execute from an absolute, hash-verified location OUTSIDE the candidate
 * worktree's writable domain, with candidate edits to its own enforcers/CLAUDE.md/AGENTS.md/shims/PATH/
 * symlinks having ZERO influence on what actually runs. `buildBundle` performs the controlled, one-time
 * PROMOTION (trusted verifier snapshots `check-lib`'s source + declared external deps into a content-hashed
 * out-of-tree location); `runPinnedSuite` is the per-run CHOKE-POINT: verify -> resolve-outside-candidate ->
 * require-the-pinned-copy -> execute -> re-verify, fail-closed at every step.
 *
 * ZONES (the "outside candidateRoot/repo/temp" language in build_spec §1.1): every resolution this module
 * performs is checked against TWO exclusion zones — `candidateRoot` (the untrusted worktree under
 * evaluation; ANY path there is refused) and the LIVE in-tree `check-lib` source directory (refusing this
 * closes a subtler bypass: even the trusted repo's *own current* check-lib source must not be require()'d
 * directly by a run — only the PROMOTED, frozen snapshot is legitimate, so that live edits since the last
 * promotion cannot retroactively change an already-pinned verdict). `bundleRoot` (the promoted snapshot)
 * is expected to live in neither zone — `buildBundle` requires an explicit `outRoot` from the caller (the
 * trusted promotion authority decides where "outside" is; this module does not itself locate storage).
 *
 * No external deps. Windows + POSIX safe (no shell, no PATH-dependent spawning — resolution is by absolute
 * realpath and require(), never a spawned lookup).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_LIB_SRC = path.join(PROJECT_ROOT, "scripts", "dispatch", "check-lib");
const DEFAULT_EXTERNAL_DEPS_REL = ["scripts/checks/no-nul-bytes.js"]; // declared external deps check-lib's checks require from outside check-lib/ (Seam B: "every checker, helper, dependency" hashed)

// ── small pure primitives ───────────────────────────────────────────────────────────────────────────────

function sha256File(absPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonicalize(value[k]);
    return out;
  }
  return value === undefined ? null : value;
}
function sha256Of(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(canonicalize(obj))).digest("hex");
}
function sortObj(o) {
  const out = {};
  for (const k of Object.keys(o || {}).sort()) out[k] = o[k];
  return out;
}

function collectDirFiles(dir) {
  const out = [];
  (function walk(d) {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.name === "node_modules" || ent.name === ".git") continue;
      const abs = path.join(d, ent.name);
      if (ent.isDirectory()) walk(abs);
      else if (ent.isFile()) out.push(abs);
    }
  })(dir);
  return out;
}

/** Copy every file under srcRoot into destRoot (preserving relative structure); returns {relPath: sha256}
 *  keyed relative to srcRoot (posix-separated for a stable, platform-independent manifest). */
function copyTreeInto(srcRoot, destRoot) {
  const map = {};
  for (const f of collectDirFiles(srcRoot)) {
    const rel = path.relative(srcRoot, f).split(path.sep).join("/");
    const dest = path.join(destRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(f, dest);
    map[rel] = sha256File(f);
  }
  return map;
}

/**
 * sourceDigestOf(srcRoot) -> string. A fresh, deterministic content-address of "the check-lib source" —
 * recomputed by WALKING srcRoot directly (never by trusting a pre-recorded map). `buildBundle` stamps this
 * as `promotion.from_src_digest` at promotion time; `check-lib-single-source.js` (β R2, the lineage guard)
 * calls this SAME function against the LIVE check-lib directory later and compares — a fork shipped in the
 * snapshot without matching the live source at promotion time is caught by that comparison, not by this
 * function alone.
 */
function sourceDigestOf(srcRoot) {
  const map = {};
  for (const f of collectDirFiles(srcRoot)) {
    const rel = path.relative(srcRoot, f).split(path.sep).join("/");
    map[rel] = sha256File(f);
  }
  return sha256Of(sortObj(map));
}

// ── zone exclusion ──────────────────────────────────────────────────────────────────────────────────────

function realpathOrResolve(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/** isInside(childAbs, rootAbs) -> boolean. True when childAbs IS rootAbs or nested under it. */
function isInside(childAbs, rootAbs) {
  const rel = path.relative(rootAbs, childAbs);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * assertOutsideZones(absPath, {candidateRoot, repoCheckLibRoot}, code) -> realpath (string). THROWS
 * (Object with `.code === code`) when the realpath-resolved `absPath` falls inside either exclusion zone.
 * realpath resolution (not the raw string) is what's compared — a symlink whose TARGET lands inside a
 * zone is caught the same as a direct path (AC-15).
 */
function assertOutsideZones(absPath, zones = {}, code = "resolution-outside-candidate") {
  const real = realpathOrResolve(absPath);
  if (zones.candidateRoot) {
    const cr = realpathOrResolve(zones.candidateRoot);
    if (isInside(real, cr)) {
      throw Object.assign(new Error(`resolution '${real}' is inside candidateRoot '${cr}' — refused (${code})`), { code });
    }
  }
  if (zones.repoCheckLibRoot) {
    const rc = realpathOrResolve(zones.repoCheckLibRoot);
    if (isInside(real, rc)) {
      throw Object.assign(
        new Error(`resolution '${real}' is inside the LIVE in-tree check-lib source '${rc}' — the pinned snapshot must be used instead (${code})`),
        { code },
      );
    }
  }
  return real;
}

// ── promotion (buildBundle) ─────────────────────────────────────────────────────────────────────────────

/**
 * buildBundle({srcRoot, outRoot, suiteVersion, promotedBy, repoRoot, externalDeps, prevManifest,
 *   prevManifestPath}) -> {manifest, bundleRoot, manifestPath}. Controlled, one-time promotion: snapshots
 * `srcRoot` (default: the live check-lib source) plus every declared external dependency into `outRoot`
 * (the caller-supplied, out-of-tree destination — see module doc), computing a content-addressed manifest
 * per build_spec §4.2.
 */
function buildBundle(opts = {}) {
  const srcRoot = path.resolve(opts.srcRoot || DEFAULT_LIB_SRC);
  if (!fs.existsSync(srcRoot) || !fs.statSync(srcRoot).isDirectory()) {
    throw new Error(`buildBundle: srcRoot does not exist or is not a directory: ${srcRoot}`);
  }
  if (!opts.outRoot) {
    throw new Error("buildBundle: opts.outRoot is required (the promoted, out-of-tree destination)");
  }
  const bundleRoot = path.resolve(opts.outRoot);
  const libDir = path.join(bundleRoot, "lib");
  const externalDir = path.join(bundleRoot, "external");
  fs.mkdirSync(libDir, { recursive: true });
  fs.mkdirSync(externalDir, { recursive: true });

  const files = {};
  const libMap = copyTreeInto(srcRoot, libDir);
  for (const [rel, hash] of Object.entries(libMap)) files[`lib/${rel}`] = hash;

  const repoRoot = path.resolve(opts.repoRoot || PROJECT_ROOT);
  const externalDepsAbs = Array.isArray(opts.externalDeps)
    ? opts.externalDeps
    : DEFAULT_EXTERNAL_DEPS_REL.map((p) => path.join(repoRoot, ...p.split("/")));

  const deps = { fs: "builtin", path: "builtin", crypto: "builtin" };
  for (const depAbs of externalDepsAbs) {
    if (!fs.existsSync(depAbs)) continue; // an optional/absent declared dep is a config note, not a hard build failure
    const relToRepo = path.relative(repoRoot, depAbs).split(path.sep).join("/");
    const destAbs = path.join(externalDir, relToRepo);
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    fs.copyFileSync(depAbs, destAbs);
    const hash = sha256File(depAbs);
    files[`external/${relToRepo}`] = hash;
    deps[relToRepo] = hash;
  }

  const config = {
    scanRoots: ["scripts", ".claude"],
    textExt: [".js", ".json", ".md", ".ts", ".mjs", ".cjs"],
    skipDirs: ["node_modules", ".git", "runtime", ".provider-tmp"],
  };
  const executables = { node: fs.realpathSync(process.execPath) };

  const bundle_digest = sha256Of({ files: sortObj(files), executables, config });
  const prevManifest = opts.prevManifest || null;
  const promotion = {
    promoted_at: Date.now(),
    promoted_by: opts.promotedBy || "unknown",
    from_src_digest: sourceDigestOf(srcRoot),
    prev_bundle_digest: prevManifest ? prevManifest.bundle_digest : null,
  };
  const rollback = {
    prev_bundle_digest: prevManifest ? prevManifest.bundle_digest : null,
    prev_manifest_path: opts.prevManifestPath || null,
  };

  const manifest = {
    schema_version: "checker-bundle/v1",
    suite_version: opts.suiteVersion || require("./check-lib/registry").SUITE_VERSION,
    bundle_digest,
    files,
    deps,
    config,
    executables,
    promotion,
    rollback,
  };

  const manifestPath = path.join(bundleRoot, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return { manifest, bundleRoot, manifestPath };
}

/** loadBundleManifest(manifestPath) -> manifest. THROWS on missing/unparseable/invalid (fail-closed). */
function loadBundleManifest(manifestPath) {
  if (typeof manifestPath !== "string" || !manifestPath) {
    throw new Error("loadBundleManifest: manifestPath is required");
  }
  let raw;
  try {
    raw = fs.readFileSync(manifestPath, "utf8");
  } catch (e) {
    throw new Error(`loadBundleManifest: cannot read manifest at ${manifestPath}: ${e.message}`);
  }
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (e) {
    throw new Error(`loadBundleManifest: manifest at ${manifestPath} is not valid JSON: ${e.message}`);
  }
  if (
    !manifest ||
    typeof manifest !== "object" ||
    manifest.schema_version !== "checker-bundle/v1" ||
    typeof manifest.bundle_digest !== "string" ||
    !manifest.bundle_digest ||
    !manifest.files ||
    typeof manifest.files !== "object" ||
    Array.isArray(manifest.files) ||
    !manifest.executables ||
    typeof manifest.executables !== "object"
  ) {
    throw new Error(`loadBundleManifest: manifest at ${manifestPath} is missing required fields (fail-closed)`);
  }
  // FIX-4a (QA-004/RT-602): a manifest that is otherwise self-consistent but carries an EMPTY (or
  // index-less) `files` map is a vacuous pin — `verifyBundle` would trivially report ok:true (zero
  // mismatches over zero entries) and let the controller execute NOTHING under the appearance of a
  // verified bundle. Require `files` to be non-empty AND to include the check-lib entrypoint itself.
  if (Object.keys(manifest.files).length === 0) {
    throw new Error(`loadBundleManifest: manifest at ${manifestPath} has an EMPTY 'files' map (fail-closed — a vacuous pin proves nothing)`);
  }
  if (!Object.prototype.hasOwnProperty.call(manifest.files, "lib/index.js")) {
    throw new Error(`loadBundleManifest: manifest at ${manifestPath} 'files' does not include 'lib/index.js' (fail-closed — incomplete pin)`);
  }
  return manifest;
}

/**
 * assertBundleCompleteness(manifest, {bundleRoot}) -> {ok, missing:[]}. FIX-4a (QA-004): the DEEPER
 * completeness check — beyond the loader's cheap "files is non-empty and names lib/index.js" floor.
 *
 * (1) UNCONDITIONAL floor: `manifest.files` must be non-empty AND include `lib/index.js` — this alone
 *     closes the "empty/self-authored external-bundle falsifier" (files:{}) attack for ANY check-lib-
 *     shaped bundle, generic or real.
 * (2) UNCONDITIONAL deep cross-check (S3(2), R2 — BE-CQ-P4-R2-002 + SR-R2-001): the pinned bundle MUST
 *     declare `lib/registry.js`, and that registry's `CHECK_NAMES` is cross-checked against
 *     `manifest.files`, requiring `lib/checks/<name>.js` to be pinned for EVERY registered name (never a
 *     manifest that pins the index but silently omits one checker module — R-2's "every checker, helper,
 *     dependency" promise).
 *
 *     R1 made (2) CONDITIONAL: a bundle with no `lib/registry.js` on disk was WAIVED as "generic/synthetic".
 *     That was a false-green escape hatch — a self-authored bundle simply omits `registry.js`, and the whole
 *     every-checker-present cross-check is skipped (security's confirmed end-to-end repro: a hand-written
 *     `lib/index.js` exporting `CHECK_NAMES:['totally-fine']` + an all-pass `runSuite`, no registry, was
 *     ACCEPTED and minted `expected_checks:['totally-fine']` with ZERO real checks executed). The waiver is
 *     REMOVED. Synthetic test fixtures now ship COMPLETE bundles (index + registry + the check modules they
 *     declare) — the fixtures conform to the strict production rule, never the reverse.
 */
function assertBundleCompleteness(manifest, opts = {}) {
  const files = (manifest && manifest.files) || {};
  if (Object.keys(files).length === 0 || !("lib/index.js" in files)) {
    return { ok: false, missing: ["lib/index.js"] };
  }
  const bundleRoot = path.resolve(opts.bundleRoot || "");
  const registryPath = path.join(bundleRoot, "lib", "registry.js");
  if (!("lib/registry.js" in files)) {
    // UNCONDITIONAL (S3(2)): a bundle that does not pin its own frozen CHECK_NAMES source cannot be
    // cross-checked for completeness at all — REFUSED, never waived.
    return { ok: false, missing: ["lib/registry.js"] };
  }
  const missing = [];
  try {
    if (fs.existsSync(registryPath)) {
      delete require.cache[registryPath];
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const pinnedRegistry = require(registryPath);
      for (const name of (pinnedRegistry && pinnedRegistry.CHECK_NAMES) || []) {
        const rel = `lib/checks/${name}.js`;
        if (!(rel in files)) missing.push(rel);
      }
    } else {
      missing.push("lib/registry.js (pinned copy unreadable on disk)");
    }
  } catch (e) {
    missing.push(`lib/registry.js (unreadable: ${e && e.message ? e.message : e})`);
  }
  return { ok: missing.length === 0, missing };
}

/**
 * verifyBundle(manifest, {bundleRoot}) -> {ok, mismatches:[], recomputedDigest, observedDigest}.
 *   - Re-hashes every pinned file ON DISK, right now, against `manifest.files` (catches supply-chain / mid-
 *     run / on-disk tampering — including a checker that mutates its own pinned file).
 *   - `recomputedDigest`: recomputed from the MANIFEST's own recorded files/executables/config — catches
 *     manifest-OBJECT tampering (e.g. `bundle_digest` edited without updating `files`). This is invariant
 *     across a run unless the manifest object itself changes — it is NOT sensitive to on-disk file drift.
 *   - `observedDigest`: computed the SAME way, but over the FRESH per-file hashes actually read from disk
 *     just now (falling back to a `"MISSING"`/`"UNREADABLE"` sentinel per-path on a read failure, so a
 *     vanished/corrupted file still changes the aggregate). THIS is the value that changes when a file is
 *     tampered mid-run — it is what callers (runPinnedSuite's G4.6 pre/post fence) must compare, never
 *     `recomputedDigest` (which would silently agree with itself before and after any on-disk-only tamper).
 * Either a per-file mismatch OR a manifest self-inconsistency is a mismatch — hash != pin BLOCKS.
 */
function verifyBundle(manifest, opts = {}) {
  if (!manifest || typeof manifest !== "object") {
    return { ok: false, mismatches: [{ path: "__manifest__", reason: "invalid-manifest" }], recomputedDigest: null, observedDigest: null };
  }
  const bundleRoot = path.resolve(opts.bundleRoot || "");
  const mismatches = [];
  const observedFiles = {};
  for (const [rel, expected] of Object.entries(manifest.files || {})) {
    const abs = path.join(bundleRoot, rel);
    if (!fs.existsSync(abs)) {
      mismatches.push({ path: rel, reason: "missing", expected });
      observedFiles[rel] = "MISSING";
      continue;
    }
    let actual;
    try {
      actual = sha256File(abs);
    } catch (e) {
      mismatches.push({ path: rel, reason: "unreadable", expected, error: e.message });
      observedFiles[rel] = "UNREADABLE";
      continue;
    }
    observedFiles[rel] = actual;
    if (actual !== expected) mismatches.push({ path: rel, reason: "hash-mismatch", expected, actual });
  }
  const recomputedDigest = sha256Of({ files: sortObj(manifest.files || {}), executables: manifest.executables, config: manifest.config });
  if (recomputedDigest !== manifest.bundle_digest) {
    mismatches.push({ path: "__bundle_digest__", reason: "bundle-digest-mismatch", expected: manifest.bundle_digest, actual: recomputedDigest });
  }
  const observedDigest = sha256Of({ files: sortObj(observedFiles), executables: manifest.executables, config: manifest.config });
  return { ok: mismatches.length === 0, mismatches, recomputedDigest, observedDigest };
}

/**
 * resolveExecutable(manifest, toolId, opts) -> absPath. Resolves the pinned executable's realpath and
 * REFUSES (throws, `.code==='resolution-outside-candidate'`) any resolution landing inside
 * `opts.candidateRoot` or `opts.repoCheckLibRoot` (symlink targets included — realpath, not the raw string).
 */
function resolveExecutable(manifest, toolId, opts = {}) {
  if (toolId !== "node") {
    throw new Error(`resolveExecutable: unknown toolId '${toolId}' (only 'node' is pinned in the bundle manifest)`);
  }
  const raw = manifest && manifest.executables && manifest.executables[toolId];
  if (typeof raw !== "string" || !raw) {
    throw new Error(`resolveExecutable: no pinned executable recorded for '${toolId}'`);
  }
  return assertOutsideZones(raw, { candidateRoot: opts.candidateRoot, repoCheckLibRoot: opts.repoCheckLibRoot }, "resolution-outside-candidate");
}

const REQUIRED_INDEX_EXPORTS = Object.freeze(["SUITE_VERSION", "CHECK_NAMES", "REQUIRED_CHECKS", "listChecks", "getCheck", "runCheck", "runSuite"]);
const REQUIRED_INDEX_FUNCTIONS = new Set(["listChecks", "getCheck", "runCheck", "runSuite"]);

/** assertCheckLibExports(mod) -> {ok, missing:[]}. The rider-4/AC-18 export-contract gate: a renamed or
 *  missing required export is a `missing` entry, never a silent pass. */
function assertCheckLibExports(mod) {
  const missing = REQUIRED_INDEX_EXPORTS.filter((k) => {
    if (!mod || !(k in mod)) return true;
    const v = mod[k];
    if (REQUIRED_INDEX_FUNCTIONS.has(k)) return typeof v !== "function";
    return v === undefined || v === null;
  });
  return { ok: missing.length === 0, missing };
}

/**
 * bundleContentDigest(manifest) -> string. The single content-address (the pin).
 */
function bundleContentDigest(manifest) {
  return manifest && manifest.bundle_digest;
}

/**
 * runPinnedSuite(manifest, ctx, {bundleRoot, candidateRoot, nonce, resolveExecutableFn, requireFn}) ->
 *   {ok, verified, reason?, version, results:[], missing:[], preDigest, postDigest}.
 *
 * Order (fail-closed at every step, BLOCKING before the next step runs):
 *   0. bundleRoot itself must not resolve inside candidateRoot (the cheapest possible check; a poisoned or
 *      misdirected invocation is caught before any hashing happens) -> `checker-not-from-pinned-bundle`.
 *   1. verifyBundle BEFORE execute -> `bundle-pin-mismatch` (G4.1 / AC-13).
 *   2. resolveExecutable OUTSIDE candidateRoot / the live check-lib source -> `resolution-outside-candidate`
 *      (AC-15) or `checker-not-from-pinned-bundle`.
 *   3. require the PINNED index.js from bundleRoot (never candidateRoot, never the live in-tree copy) ->
 *      `checker-not-from-pinned-bundle`.
 *   4. export-contract check on the required pinned module -> `check-export-missing` (AC-18).
 *   5. execute the FULL frozen CHECK_NAMES from the PINNED copy (β R1 — never a caller-supplied subset),
 *      stamping `ctx.nonce` onto every result.
 *   6. verifyBundle AFTER execute; preDigest !== postDigest -> `checker-mutated-mid-run` (G4.6 / AC-16).
 */
function runPinnedSuite(manifest, ctx = {}, opts = {}) {
  const bundleRoot = path.resolve(opts.bundleRoot || "");
  const candidateRoot = opts.candidateRoot;
  const nonce = opts.nonce;
  const empty = { version: manifest && manifest.suite_version, results: [], missing: [] };

  // (0) belt-and-suspenders: refuse a bundleRoot that itself resolves inside candidateRoot, BEFORE any hashing.
  if (candidateRoot) {
    let bundleRootReal;
    try {
      bundleRootReal = realpathOrResolve(bundleRoot);
    } catch (e) {
      return { ok: false, verified: false, reason: "checker-not-from-pinned-bundle", error: e.message, ...empty, preDigest: null, postDigest: null };
    }
    const candidateRootReal = realpathOrResolve(candidateRoot);
    if (isInside(bundleRootReal, candidateRootReal)) {
      return {
        ok: false,
        verified: false,
        reason: "checker-not-from-pinned-bundle",
        error: `bundleRoot '${bundleRootReal}' resolves inside candidateRoot '${candidateRootReal}'`,
        ...empty,
        preDigest: null,
        postDigest: null,
      };
    }
  }

  // (0.5) FIX-4a (QA-004/RT-602): the manifest must be a NON-EMPTY, COMPLETE pin — every registered check
  // module present, never a vacuous/self-authored manifest that would let `verifyBundle` trivially report
  // ok:true over zero (or a hand-picked subset of) entries.
  const completeness = assertBundleCompleteness(manifest, { bundleRoot });
  if (!completeness.ok) {
    return {
      ok: false,
      verified: false,
      reason: "incomplete-bundle-manifest",
      ...empty,
      missing: completeness.missing,
      preDigest: null,
      postDigest: null,
    };
  }

  // (1) verify BEFORE execute.
  const pre = verifyBundle(manifest, { bundleRoot });
  if (!pre.ok) {
    return { ok: false, verified: false, reason: "bundle-pin-mismatch", mismatches: pre.mismatches, ...empty, preDigest: pre.observedDigest, postDigest: null };
  }

  // (2) resolve the pinned executable OUTSIDE candidateRoot / the live in-tree source.
  const resolveFn = typeof opts.resolveExecutableFn === "function" ? opts.resolveExecutableFn : resolveExecutable;
  try {
    resolveFn(manifest, "node", { candidateRoot, repoCheckLibRoot: DEFAULT_LIB_SRC });
  } catch (e) {
    return { ok: false, verified: false, reason: e.code || "resolution-outside-candidate", error: e.message, ...empty, preDigest: pre.observedDigest, postDigest: null };
  }

  // (3) require the PINNED index.js from bundleRoot.
  const pinnedIndexPath = path.join(bundleRoot, "lib", "index.js");
  let pinnedIndexReal;
  try {
    pinnedIndexReal = assertOutsideZones(pinnedIndexPath, { candidateRoot, repoCheckLibRoot: DEFAULT_LIB_SRC }, "checker-not-from-pinned-bundle");
  } catch (e) {
    return { ok: false, verified: false, reason: e.code || "checker-not-from-pinned-bundle", error: e.message, ...empty, preDigest: pre.observedDigest, postDigest: null };
  }

  let pinnedIndex;
  const requireFn = typeof opts.requireFn === "function" ? opts.requireFn : (p) => require(p);
  try {
    delete require.cache[pinnedIndexReal];
    pinnedIndex = requireFn(pinnedIndexReal);
  } catch (e) {
    return { ok: false, verified: false, reason: "pinned-index-require-failed", error: e.message, ...empty, preDigest: pre.observedDigest, postDigest: null };
  }

  // (4) export-contract check (rider-4 / AC-18): a renamed/missing export is CAUGHT, not silently skipped.
  const contract = assertCheckLibExports(pinnedIndex);
  if (!contract.ok) {
    return { ok: false, verified: false, reason: "check-export-missing", missingExports: contract.missing, ...empty, preDigest: pre.observedDigest, postDigest: null };
  }

  // (5) execute the FULL frozen CHECK_NAMES from the PINNED copy (β R1 — never a caller-supplied subset).
  const execCtx = { ...ctx, nonce };
  let raw;
  try {
    raw = pinnedIndex.runSuite(pinnedIndex.CHECK_NAMES.slice(), execCtx);
  } catch (e) {
    return {
      ok: false,
      verified: false,
      reason: "pinned-suite-execution-error",
      error: e.message,
      version: pinnedIndex.SUITE_VERSION,
      results: [],
      missing: [],
      preDigest: pre.observedDigest,
      postDigest: null,
    };
  }
  const results = (raw.results || []).map((r) => ({ ...r, nonce }));

  // (6) re-verify AFTER execute — preDigest === postDigest is the fence.
  const post = verifyBundle(manifest, { bundleRoot });
  const preDigest = pre.observedDigest;
  const postDigest = post.observedDigest;
  if (!post.ok || preDigest !== postDigest) {
    return {
      ok: false,
      verified: false,
      reason: "checker-mutated-mid-run",
      mismatches: post.mismatches,
      version: raw.version,
      results,
      missing: raw.missing,
      preDigest,
      postDigest,
    };
  }

  return { ok: true, verified: true, version: raw.version, results, missing: raw.missing, preDigest, postDigest };
}

module.exports = {
  buildBundle,
  loadBundleManifest,
  verifyBundle,
  assertBundleCompleteness,
  resolveExecutable,
  runPinnedSuite,
  bundleContentDigest,
  sourceDigestOf,
  assertCheckLibExports,
  assertOutsideZones,
  isInside,
  sha256File,
  sha256Of,
  DEFAULT_LIB_SRC,
  PROJECT_ROOT,
};
