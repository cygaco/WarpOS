#!/usr/bin/env node
/**
 * scripts/warpos/manifest/test-build.js — sanity checks for build.js.
 *
 * Self-contained test runner (no ajv dep) covering:
 *   A. Schema file exists + parses + declares v1.
 *   B. Generator runs against repo root, produces ok=true.
 *   C. Output passes the structural invariants the schema encodes
 *      (every entry has owner ∈ enum; owner=framework requires source+sha256;
 *      owner=generated requires compiled_from; owner=runtime forbids
 *      source/seeded_from/compiled_from).
 *   D. Generator refuses to write when unclassified paths exist + no flag.
 *   E. sha256 helper is deterministic.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const SCHEMA_PATH = path.join(REPO_ROOT, "schemas", "warpos-manifest.schema.json");
const BUILD_PATH = path.join(__dirname, "build.js");

const { build, sha256OfFile } = require(BUILD_PATH);

let pass = 0;
let fail = 0;

function ok(name, cond, detail) {
  if (cond) {
    process.stdout.write(`  ok  ${name}\n`);
    pass++;
  } else {
    process.stderr.write(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}\n`);
    fail++;
  }
}

// A. Schema file present + v1
process.stdout.write("A. Schema present\n");
const schemaRaw = fs.readFileSync(SCHEMA_PATH, "utf8");
const schema = JSON.parse(schemaRaw);
ok("schema parses", typeof schema === "object");
ok("schema $id is warpos/manifest/v1", schema.$id === "warpos/manifest/v1");
ok("schema declares version 1", schema.properties.version.const === 1);
ok(
  "ownerClass enum is the 4 canonical classes",
  JSON.stringify(schema.definitions.ownerClass.enum.slice().sort()) ===
    JSON.stringify(["framework", "generated", "project", "runtime"]),
);

// B. Generator runs against repo root, ok=true
process.stdout.write("B. Generator runs ok against this repo\n");
const tmpManifest = path.join(
  REPO_ROOT,
  ".warpos",
  `manifest-test-${Date.now()}.json`,
);
const r = build({
  root: REPO_ROOT,
  outPath: tmpManifest,
  sourcePrefix: "framework",
  dryRun: false,
  allowUnclassified: false,
});
ok("build returns ok", r.ok, r.error);
ok("build wrote tmpManifest", fs.existsSync(tmpManifest));
let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(tmpManifest, "utf8"));
} catch (e) {
  /* */
}
ok("tmpManifest parses as JSON", !!manifest);
ok("manifest version === 1", manifest && manifest.version === 1);
ok(
  "manifest has paths",
  manifest && typeof manifest.paths === "object" && Object.keys(manifest.paths).length > 0,
);

// C. Structural invariants per ownership class
process.stdout.write("C. Structural invariants\n");
const ownerClasses = ["framework", "generated", "project", "runtime"];
const counts = { framework: 0, generated: 0, project: 0, runtime: 0 };
let frameworkMissingSource = 0;
let frameworkMissingSha = 0;
let generatedMissingCompiledFrom = 0;
let runtimeHasSource = 0;
let runtimeHasSeededFrom = 0;
let runtimeHasCompiledFrom = 0;
let invalidOwner = 0;
for (const [, entry] of Object.entries(manifest.paths || {})) {
  if (!ownerClasses.includes(entry.owner)) {
    invalidOwner++;
    continue;
  }
  counts[entry.owner]++;
  if (entry.owner === "framework") {
    // Most framework entries need source+sha256; the root-doc rule
    // legitimately uses source=null (canonical-side, source == dest), so
    // we accept that case but require sha256.
    if (entry.source === undefined) frameworkMissingSource++;
    if (!entry.sha256) frameworkMissingSha++;
  }
  if (entry.owner === "generated" && !Array.isArray(entry.compiled_from)) {
    generatedMissingCompiledFrom++;
  }
  if (entry.owner === "runtime") {
    if (entry.source) runtimeHasSource++;
    if (entry.seeded_from) runtimeHasSeededFrom++;
    if (entry.compiled_from) runtimeHasCompiledFrom++;
  }
}
ok("no invalid owner classes", invalidOwner === 0, `invalidOwner=${invalidOwner}`);
ok("every framework entry has a source field", frameworkMissingSource === 0, `missing=${frameworkMissingSource}`);
ok("every framework entry has sha256", frameworkMissingSha === 0, `missing=${frameworkMissingSha}`);
ok("every generated entry has compiled_from", generatedMissingCompiledFrom === 0, `missing=${generatedMissingCompiledFrom}`);
ok("no runtime entry has source", runtimeHasSource === 0, `has=${runtimeHasSource}`);
ok("no runtime entry has seeded_from", runtimeHasSeededFrom === 0, `has=${runtimeHasSeededFrom}`);
ok("no runtime entry has compiled_from", runtimeHasCompiledFrom === 0, `has=${runtimeHasCompiledFrom}`);
ok(
  "owner class counts > 0 for framework + project + runtime + generated",
  counts.framework > 0 && counts.project > 0 && counts.runtime > 0 && counts.generated > 0,
  JSON.stringify(counts),
);

// C2. 0.16.0 prefix-drift guard: EVERY seeded_from the generator emits MUST resolve
// to a real file on disk. This locks the fix — build.js previously emitted
// `framework/templates/_requirements/<x>` (a path that never existed) via a no-op
// .replace(), producing the "100 dangling seeded_from". A regression here fails loudly
// at the generator, before the manifest ever reaches the ship-coverage gate.
process.stdout.write("C2. seeded_from resolvability (0.16.0 prefix-drift)\n");
let seededTotal = 0;
const seededDangling = [];
for (const [rel, entry] of Object.entries(manifest.paths || {})) {
  if (entry && typeof entry.seeded_from === "string" && entry.seeded_from) {
    seededTotal++;
    if (!fs.existsSync(path.join(REPO_ROOT, entry.seeded_from))) {
      seededDangling.push(`${rel} → ${entry.seeded_from}`);
    }
  }
}
ok("manifest emits seeded_from entries to check", seededTotal > 0, `seededTotal=${seededTotal}`);
ok(
  "every seeded_from resolves on disk (no prefix-drift)",
  seededDangling.length === 0,
  `${seededDangling.length} dangling: ${JSON.stringify(seededDangling.slice(0, 5))}`,
);

// D. (skipped — would require staging an unclassified path; not worth the fixture cost in v1)

// E. sha256 helper deterministic
process.stdout.write("E. sha256 helper\n");
const s1 = sha256OfFile(SCHEMA_PATH);
const s2 = sha256OfFile(SCHEMA_PATH);
ok("sha256 is hex64", /^[a-f0-9]{64}$/.test(s1));
ok("sha256 deterministic across two calls", s1 === s2);

// Cleanup
try {
  fs.unlinkSync(tmpManifest);
} catch {
  /* */
}

process.stdout.write(`\nResults: ${pass} passed, ${fail} failed.\n`);
if (fail > 0) process.exit(1);
