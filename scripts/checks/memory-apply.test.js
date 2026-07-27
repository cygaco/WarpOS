#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// memory-apply.test.js — planted-case + live sealed-store test for the GATED
// memory mutation executor (scripts/checks/memory-apply.js).
//
// Two layers (modelled on doc-ref-integrity.test.js):
//   • PURE validatePlan() — the safety gate — proved on synthetic plans with NO
//     disk: contradicted+evidence delete is allowed; the load-bearing invariant
//     (an UNVERIFIABLE — or verified — delete/correct is ALWAYS rejected) holds;
//     missing newBody / empty evidence / unknown action|classification are rejected;
//     action:none is always allowed.
//   • LIVE in a sealed fs.mkdtempSync store: a valid contradicted-delete plan
//     DRY-RUN (default) mutates NOTHING + exits 0; --apply removes the file AND its
//     MEMORY.md index line and leaves the store structurally clean (exit 0). An
//     unverifiable-delete plan exits 2 with the file STILL PRESENT (nothing mutated).
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const CHECK = path.join(__dirname, "memory-apply.js");
const mod = require("./memory-apply.js");

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

// ── PURE validatePlan(): the safety gate ─────────────────────────────────────

ok("PLANTED: delete on contradicted WITH evidence is ALLOWED", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "contradicted", action: "delete", evidence: "grep shows the claim is false" }],
  });
  assert.strictEqual(v.ok, true, `expected ok, got ${JSON.stringify(v.violations)}`);
  assert.strictEqual(v.violations.length, 0);
  assert.deepStrictEqual(v.planned, [{ file: "a.md", action: "delete" }]);
});

ok("INVARIANT: delete on UNVERIFIABLE is ALWAYS rejected ('couldn't verify' is not 'delete')", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "unverifiable", action: "delete", evidence: "could not find ground truth" }],
  });
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.violations.length, 1);
  assert.strictEqual(v.violations[0].reason, "only a contradicted memory may be mutated");
});

ok("INVARIANT: delete on VERIFIED is rejected (a true memory is never deleted)", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "verified", action: "delete", evidence: "confirmed true" }],
  });
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.violations[0].reason, "only a contradicted memory may be mutated");
});

ok("PLANTED: correct with NO newBody is rejected", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "contradicted", action: "correct", evidence: "the value drifted" }],
  });
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.violations[0].reason, "correct requires newBody");
});

ok("PLANTED: correct on contradicted WITH evidence + newBody is ALLOWED", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "contradicted", action: "correct", evidence: "drifted", newBody: "---\nname: a\n---\nfixed\n" }],
  });
  assert.strictEqual(v.ok, true, JSON.stringify(v.violations));
  // planned now carries the validated newBody so run() applies exactly what was gated
  // (no plan re-lookup / last-wins divergence).
  assert.deepStrictEqual(v.planned, [{ file: "a.md", action: "correct", newBody: "---\nname: a\n---\nfixed\n" }]);
});

ok("PLANTED: correct/delete with EMPTY (whitespace) evidence is rejected", () => {
  const del = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "contradicted", action: "delete", evidence: "   " }],
  });
  assert.strictEqual(del.violations[0].reason, "mutation requires ground-truth evidence");
  const corr = mod.validatePlan({
    store: "s",
    changes: [{ file: "b.md", classification: "contradicted", action: "correct", evidence: "", newBody: "x" }],
  });
  assert.strictEqual(corr.violations[0].reason, "mutation requires ground-truth evidence");
});

ok("PLANTED: action 'none' is always allowed (even unverifiable, no evidence)", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [
      { file: "a.md", classification: "unverifiable", action: "none" },
      { file: "b.md", classification: "verified", action: "none" },
    ],
  });
  assert.strictEqual(v.ok, true, JSON.stringify(v.violations));
  assert.strictEqual(v.planned.length, 2);
});

ok("PLANTED: unknown action or classification is rejected", () => {
  const badAction = mod.validatePlan({ store: "s", changes: [{ file: "a.md", classification: "contradicted", action: "purge", evidence: "x" }] });
  assert.strictEqual(badAction.violations[0].reason, "invalid action/classification");
  const badClass = mod.validatePlan({ store: "s", changes: [{ file: "b.md", classification: "maybe", action: "delete", evidence: "x" }] });
  assert.strictEqual(badClass.violations[0].reason, "invalid action/classification");
});

ok("PLANTED: all-or-nothing — one bad change fails the whole plan", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [
      { file: "a.md", classification: "contradicted", action: "delete", evidence: "false" },
      { file: "b.md", classification: "unverifiable", action: "delete", evidence: "dunno" },
    ],
  });
  assert.strictEqual(v.ok, false, "a single unsafe change fails the plan");
  assert.strictEqual(v.violations.length, 1);
  assert.strictEqual(v.violations[0].file, "b.md");
});

// ── removeIndexLines: reuses the detector's parseIndex ────────────────────────
ok("removeIndexLines drops only the matching target line", () => {
  const index = "- [Alpha](a.md) — h\n- [Bravo](b.md) — h\n- [Gamma](c.md) — h\n";
  const next = mod.removeIndexLines(index, new Set(["b.md"]));
  assert.ok(/a\.md/.test(next) && /c\.md/.test(next), "kept the others");
  assert.ok(!/b\.md/.test(next), "dropped the deleted target's line");
});

// ── LIVE sealed store ─────────────────────────────────────────────────────────

function seedStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const mk = (slug) => `---\nname: ${slug}\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nBody.\n`;
  fs.writeFileSync(path.join(dir, "keep_one.md"), mk("keep-one"));
  fs.writeFileSync(path.join(dir, "drop_one.md"), mk("drop-one"));
  fs.writeFileSync(
    path.join(dir, "MEMORY.md"),
    "- [Keep One](keep_one.md) — a memory\n- [Drop One](drop_one.md) — a memory\n",
  );
}
function writePlan(dir, plan) {
  const p = path.join(dir, "plan.json");
  fs.writeFileSync(p, JSON.stringify(plan, null, 2));
  return p;
}

ok("LIVE: a valid contradicted-delete plan DRY-RUN (default) mutates NOTHING and exits 0", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "TRACKER shows this fact was reversed" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--json"], { encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  assert.strictEqual(r.status, 0, "clean dry-run exits 0");
  assert.strictEqual(out.dryRun, true);
  assert.strictEqual(out.applied, false);
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "dry-run did NOT delete the file");
  assert.ok(/drop_one\.md/.test(fs.readFileSync(path.join(store, "MEMORY.md"), "utf8")), "index untouched");
});

ok("LIVE: --apply removes the file + its MEMORY.md index line and leaves the store clean (exit 0)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "TRACKER shows this fact was reversed" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  assert.strictEqual(r.status, 0, `apply should exit 0 clean, got ${r.status} :: ${r.stderr}`);
  assert.strictEqual(out.applied, true);
  assert.ok(!fs.existsSync(path.join(store, "drop_one.md")), "the file was deleted");
  const idx = fs.readFileSync(path.join(store, "MEMORY.md"), "utf8");
  assert.ok(!/drop_one\.md/.test(idx), "the index line was removed");
  assert.ok(/keep_one\.md/.test(idx), "the surviving entry is intact");
  assert.strictEqual((out.postFindings || []).length, 0, "post-check clean (bijection intact)");
});

ok("LIVE: an unverifiable-delete plan exits 2 with the file STILL PRESENT (nothing mutated)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "unverifiable", action: "delete", evidence: "could not confirm either way" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "an unverifiable delete is fail-closed exit 2 even under --apply");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "nothing mutated — the file is still present");
  assert.ok(/drop_one\.md/.test(fs.readFileSync(path.join(store, "MEMORY.md"), "utf8")), "index still present");
});

ok("LIVE: a bad store (no MEMORY.md) is fail-closed exit 2", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-"));
  const store = path.join(base, "notastore");
  fs.mkdirSync(store, { recursive: true });
  const plan = writePlan(base, { store, changes: [] });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a store without MEMORY.md is not a valid store");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
});

// ── PURE path-safety gate (security gauntlet r3) ─────────────────────────────

ok("PURE: isSafeStoreFilename accepts a plain *.md name, rejects traversal/absolute/separator/non-md", () => {
  assert.strictEqual(mod.isSafeStoreFilename("feedback_x.md"), true);
  assert.strictEqual(mod.isSafeStoreFilename("../SECRET.md"), false, "parent traversal");
  assert.strictEqual(mod.isSafeStoreFilename("a/b.md"), false, "separator");
  assert.strictEqual(mod.isSafeStoreFilename("a\\b.md"), false, "backslash");
  assert.strictEqual(mod.isSafeStoreFilename(path.resolve("/tmp/x.md")), false, "absolute");
  assert.strictEqual(mod.isSafeStoreFilename(".."), false);
  assert.strictEqual(mod.isSafeStoreFilename("notmd.txt"), false, "non-.md");
  assert.strictEqual(mod.isSafeStoreFilename(""), false);
});

ok("PLANTED: validatePlan REJECTS a delete whose file is a traversal path", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "../../CLAUDE.md", classification: "contradicted", action: "delete", evidence: "x" }],
  });
  assert.strictEqual(v.ok, false);
  assert.ok(/unsafe file path/.test(v.violations[0].reason), v.violations[0] && v.violations[0].reason);
});

ok("PLANTED: validatePlan REJECTS duplicate file entries", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [
      { file: "a.md", classification: "verified", action: "none" },
      { file: "a.md", classification: "contradicted", action: "delete", evidence: "x" },
    ],
  });
  assert.strictEqual(v.ok, false);
  assert.ok(v.violations.some((x) => /duplicate file entry/.test(x.reason)));
});

// ── LIVE security: traversal + symlink cannot escape the store ────────────────

ok("LIVE-SECURITY: a path-traversal delete is fail-closed and CANNOT delete a file OUTSIDE the store", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-trav-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const sentinel = path.join(base, "SECRET.md"); // lives OUTSIDE the store
  fs.writeFileSync(sentinel, "do not delete me\n");
  const plan = writePlan(base, {
    store,
    changes: [{ file: "../SECRET.md", classification: "contradicted", action: "delete", evidence: "attacker-supplied" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a traversal path is rejected fail-closed exit 2");
  assert.ok(fs.existsSync(sentinel), "the out-of-store file MUST survive (no traversal delete)");
  // an ABSOLUTE path is rejected too
  const plan2 = writePlan(base, {
    store,
    changes: [{ file: sentinel, classification: "contradicted", action: "delete", evidence: "x" }],
  });
  const r2 = spawnSync("node", [CHECK, "--plan", plan2, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r2.status, 2, "an absolute path is rejected fail-closed exit 2");
  assert.ok(fs.existsSync(sentinel), "sentinel still present after the absolute-path attempt");
});

ok("LIVE-SECURITY: a symlinked memory file is rejected under --apply (no out-of-store write) [skips if symlink unsupported]", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-sym-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const outside = path.join(base, "OUTSIDE.md");
  fs.writeFileSync(outside, "original outside content\n");
  const linkPath = path.join(store, "drop_one.md");
  fs.unlinkSync(linkPath); // replace the real store file with a symlink to the outside file
  try {
    fs.symlinkSync(outside, linkPath, "file");
  } catch (e) {
    console.log("  (skip: symlink creation not permitted on this platform)");
    return;
  }
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "x", newBody: "MALICIOUS\n" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a symlink target is rejected fail-closed exit 2");
  assert.strictEqual(fs.readFileSync(outside, "utf8"), "original outside content\n", "the symlink target was NOT overwritten");
});

// ── security gauntlet r5 (agy lane): the MEMORY.md index is never a mutation target ──
ok("PURE: isSafeStoreFilename REJECTS the index file MEMORY.md (case-insensitive)", () => {
  assert.strictEqual(mod.isSafeStoreFilename("MEMORY.md"), false);
  assert.strictEqual(mod.isSafeStoreFilename("memory.md"), false);
  assert.strictEqual(mod.isSafeStoreFilename("Memory.MD"), false);
  assert.strictEqual(mod.isSafeStoreFilename("a.md:MEMORY.md"), false, "NTFS alternate-data-stream name rejected");
  assert.strictEqual(mod.isSafeStoreFilename("x.md:stream"), false, "any ':' rejected (honest .md suffix)");
  assert.strictEqual(mod.isSafeStoreFilename("feedback_x.md"), true, "a real per-fact file still passes");
});

ok("PLANTED: validatePlan REJECTS a delete/correct targeting MEMORY.md", () => {
  const del = mod.validatePlan({
    store: "s",
    changes: [{ file: "MEMORY.md", classification: "contradicted", action: "delete", evidence: "x" }],
  });
  assert.strictEqual(del.ok, false);
  assert.ok(/unsafe file path/.test(del.violations[0].reason));
});

ok("LIVE-SECURITY: a plan targeting MEMORY.md for delete is fail-closed and does NOT corrupt the index", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-idx-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "MEMORY.md", classification: "contradicted", action: "delete", evidence: "attacker-supplied" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "targeting the index is rejected fail-closed exit 2");
  assert.ok(fs.existsSync(path.join(store, "MEMORY.md")), "the index file MUST still exist (not deleted)");
  assert.ok(/keep_one\.md/.test(fs.readFileSync(path.join(store, "MEMORY.md"), "utf8")), "index content intact");
});

// ── security gauntlet r7 (agy lane): all-or-nothing hardening ─────────────────
ok("PLANTED: validatePlan REJECTS a CASE-ONLY-distinct duplicate (a.md + A.md)", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [
      { file: "a.md", classification: "contradicted", action: "delete", evidence: "x" },
      { file: "A.md", classification: "contradicted", action: "delete", evidence: "y" },
    ],
  });
  assert.strictEqual(v.ok, false, "a.md + A.md resolve to one file on a case-insensitive FS");
  assert.ok(v.violations.some((x) => /duplicate file entry/.test(x.reason)));
});

ok("LIVE-SECURITY: a DIRECTORY named foo.md is rejected in preflight (not unlinked mid-apply)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-dir-"));
  const store = path.join(base, "agent");
  seedStore(store);
  fs.mkdirSync(path.join(store, "dir_as_file.md")); // a directory masquerading as a memory file
  const plan = writePlan(base, {
    store,
    changes: [{ file: "dir_as_file.md", classification: "contradicted", action: "delete", evidence: "x" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a non-regular target is rejected fail-closed exit 2");
  assert.ok(fs.existsSync(path.join(store, "dir_as_file.md")), "the directory is untouched");
  assert.ok(fs.existsSync(path.join(store, "keep_one.md")), "no partial mutation of siblings");
});

ok("LIVE-SECURITY: an unreadable index (MEMORY.md is a dir) fails BEFORE any delete (FIX-C)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-idx2-"));
  const store = path.join(base, "agent");
  seedStore(store);
  fs.unlinkSync(path.join(store, "MEMORY.md")); // make the index unreadable-as-a-file
  fs.mkdirSync(path.join(store, "MEMORY.md")); // ...by replacing it with a directory
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "x" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "an unreadable index pre-read fails-closed exit 2");
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "the file was NOT deleted (pre-read failed before the mutation loop)");
});

// ── security gauntlet r8 (agy+qa): the case-insensitivity class, one canonicalization ──
ok("PURE: canonicalStoreName resolves a case-variant plan name to the real on-disk entry", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-canon-"));
  const store = path.join(base, "agent");
  seedStore(store); // writes drop_one.md, keep_one.md, MEMORY.md
  assert.strictEqual(mod.canonicalStoreName(store, "DROP_ONE.md"), "drop_one.md", "case-variant resolves to disk name");
  assert.strictEqual(mod.canonicalStoreName(store, "drop_one.md"), "drop_one.md", "exact match");
  assert.strictEqual(mod.canonicalStoreName(store, "nope.md"), null, "no match → null");
});

ok("LIVE-SECURITY: deleting a CASE-VARIANT name (DROP_ONE.md) removes the file AND its index line (no broken pointer)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-case-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "DROP_ONE.md", classification: "contradicted", action: "delete", evidence: "TRACKER reversed it" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 0, `apply should be clean, got ${r.status} :: ${r.stderr}`);
  assert.ok(!fs.existsSync(path.join(store, "drop_one.md")), "the real (lowercase) file was deleted");
  const idx = fs.readFileSync(path.join(store, "MEMORY.md"), "utf8");
  assert.ok(!/drop_one\.md/i.test(idx), "the index line was removed (case-insensitive) — no broken pointer");
  const out = JSON.parse(r.stdout);
  assert.strictEqual((out.postFindings || []).length, 0, "post-check clean (bijection intact)");
});

ok("LIVE-SECURITY: a CORRECT-only apply with an unreadable index (MEMORY.md dir) fails BEFORE the correct (no partial)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-corr-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = fs.readFileSync(path.join(store, "drop_one.md"), "utf8");
  fs.unlinkSync(path.join(store, "MEMORY.md"));
  fs.mkdirSync(path.join(store, "MEMORY.md")); // index is now a dir → not a readable regular file
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "drifted", newBody: "---\nname: drop-one\ndescription: x\nmetadata:\n  type: feedback\n---\nCORRECTED\n" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "index pre-check fails-closed BEFORE any correct (exit 2)");
  assert.strictEqual(fs.readFileSync(path.join(store, "drop_one.md"), "utf8"), before, "the fact file was NOT rewritten (no partial mutation)");
});

// ── security gauntlet r9 (backend): all-or-nothing rollback + malformed-plan ──────
ok("LIVE-SECURITY: a mid-sequence apply fault ROLLS BACK op1's delete — true all-or-nothing (:322)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-rollback-"));
  const store = path.join(base, "agent");
  seedStore(store); // drop_one.md, keep_one.md, MEMORY.md
  // Make keep_one.md read-only so the correct (op2) THROWS after the delete (op1) commits.
  fs.chmodSync(path.join(store, "keep_one.md"), 0o444);
  const plan = writePlan(base, {
    store,
    changes: [
      { file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "reversed" },
      { file: "keep_one.md", classification: "contradicted", action: "correct", evidence: "drifted", newBody: "---\nname: keep-one\ndescription: x\nmetadata:\n  type: feedback\n---\nNEW\n" },
    ],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  try { fs.chmodSync(path.join(store, "keep_one.md"), 0o644); } catch {} // restore for cleanup
  assert.strictEqual(r.status, 2, "a mid-sequence fault fails-closed exit 2");
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "op1's deleted file was RESTORED by rollback — all-or-nothing held");
});

ok("LIVE: a non-array plan.changes is a MALFORMED plan (exit 2), not a silent empty one (:101)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-badplan-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const p = path.join(base, "plan.json");
  fs.writeFileSync(p, JSON.stringify({ store, changes: "not-an-array" }));
  const r = spawnSync("node", [CHECK, "--plan", p, "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "non-array changes → fatal exit 2, not a silent exit 0");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
});

// ── gauntlet r10 (:417): --apply leaves the store CLEAN or BYTE-IDENTICAL, never corrupted ──
// Snapshot every file in a store so "byte-identical to pre-apply" is asserted, not assumed.
function snapshot(dir) {
  const snap = new Map();
  for (const name of fs.readdirSync(dir).sort()) {
    snap.set(name, fs.readFileSync(path.join(dir, name)).toString("base64"));
  }
  return snap;
}
function assertUnchanged(dir, before, why) {
  const after = snapshot(dir);
  assert.deepStrictEqual([...after.keys()], [...before.keys()], `${why}: the file SET changed`);
  for (const [name, bytes] of before) {
    assert.strictEqual(after.get(name), bytes, `${why}: '${name}' is not byte-identical to pre-apply`);
  }
}

ok("r10 PURE: validateNewBody accepts a valid memory file and names every structural defect", () => {
  assert.deepStrictEqual(
    mod.validateNewBody("---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\n---\nbody\n"),
    [],
    "a canonical memory file is valid",
  );
  assert.ok(/no YAML frontmatter/.test(mod.validateNewBody("just prose, no block\n")[0]), "no block is caught");
  const partial = mod.validateNewBody("---\nname: a-slug\n---\nbody\n");
  assert.ok(partial.some((r) => /'description'/.test(r)), "missing description named");
  assert.ok(partial.some((r) => /metadata\.type/.test(r)), "missing metadata.type named");
  const badType = mod.validateNewBody("---\nname: a-slug\ndescription: d\nmetadata:\n  type: nonsense\n---\nb\n");
  assert.strictEqual(badType.length, 1);
  assert.ok(/metadata\.type/.test(badType[0]));
});

// PLANTED RED — proves HALF ONE (pre-validation). Before the fix, validatePlan only required a
// non-empty newBody STRING, so this body was written to disk successfully; nothing threw, so the
// catch-only rollback never fired and a corrupted memory file was left behind.
ok("r10 PLANTED (half a): a correct plan with a STRUCTURALLY INVALID newBody is refused BEFORE any mutation", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r10-prevalid-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "TRACKER reversed it", newBody: "CORRUPTED — no frontmatter at all\n" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, `a structurally invalid newBody is fail-closed exit 2, got ${r.status} :: ${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
  assert.strictEqual(out.applied, false, "nothing was applied");
  assert.ok(
    (out.violations || []).some((x) => /newBody is not a valid memory file/.test(x.reason)),
    `the refusal names the body defect: ${JSON.stringify(out.violations)}`,
  );
  assertUnchanged(store, before, "invalid newBody refused pre-mutation");
});

ok("r10 PLANTED (half a): the SAME invalid newBody is refused in DRY-RUN too (no gate/apply divergence)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r10-dry-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "x", newBody: "---\nname: only-a-name\n---\nb\n" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a dry-run must not promise a correct that --apply would refuse");
  assertUnchanged(store, before, "dry-run never mutates");
});

// PLANTED RED — proves HALF TWO (rollback on a dirty post-check). This body PASSES per-file
// pre-validation (name + description + valid type), so half (a) cannot catch it; it is only
// dirty relative to the REST of the store — its name-slug collides with keep_one.md's. Before the
// fix this returned ok:false/applied:true and left the duplicate slug on disk.
ok("r10 PLANTED (half b): a correct that passes pre-validation but DIRTIES the store (duplicate name-slug) is ROLLED BACK", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r10-rollback-"));
  const store = path.join(base, "agent");
  seedStore(store); // keep_one.md → name: keep-one ; drop_one.md → name: drop-one
  const before = snapshot(store);
  const collide = "---\nname: keep-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nCOLLIDES WITH keep_one.md\n";
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "TRACKER shows the slug was merged", newBody: collide }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, `a dirty post-check must fail closed (exit 2), got ${r.status} :: ${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
  assert.strictEqual(out.rolledBack, true, "the rollback ran");
  assert.strictEqual(out.applied, false, "rolled back cleanly → nothing net-applied");
  assert.ok(
    (out.postFindings || []).some((f) => f.kind === "duplicate-name-slug"),
    `the store-wide finding is reported: ${JSON.stringify(out.postFindings)}`,
  );
  assertUnchanged(store, before, "dirty post-check rolled back");
  // Asserted LAST, on purpose: the rollback above is what this test proves, and it must fail for
  // THAT reason against pre-fix code — not because this newer export is missing. This line is the
  // supporting claim that half (a) alone could never have caught the case.
  assert.deepStrictEqual(mod.validateNewBody(collide), [], "the body is per-file VALID — half (a) cannot catch this");
});

ok("r10 NO-REGRESSION: a correct with a VALID body still applies cleanly and leaves the store clean", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r10-good-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const newBody = "---\nname: drop-one\ndescription: a corrected memory\nmetadata:\n  type: project\n---\n\nCORRECTED BODY.\n";
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "git log shows the value changed", newBody }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 0, `a valid correct applies cleanly, got ${r.status} :: ${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.applied, true);
  assert.strictEqual(out.ok, true);
  assert.strictEqual(fs.readFileSync(path.join(store, "drop_one.md"), "utf8"), newBody, "the corrected body is on disk");
  assert.strictEqual((out.postFindings || []).length, 0, "post-check clean");
  assert.ok(/drop_one\.md/.test(fs.readFileSync(path.join(store, "MEMORY.md"), "utf8")), "correct leaves the index alone");
});

ok("r10: a MIXED plan is all-or-nothing — one dirty-making correct rolls back the sibling DELETE too", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r10-mixed-"));
  const store = path.join(base, "agent");
  seedStore(store);
  fs.writeFileSync(path.join(store, "third.md"), "---\nname: third-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nBody.\n");
  fs.appendFileSync(path.join(store, "MEMORY.md"), "- [Third](third.md) — a memory\n");
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [
      { file: "third.md", classification: "contradicted", action: "delete", evidence: "reversed" },
      { file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "merged", newBody: "---\nname: keep-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nCOLLIDES.\n" },
    ],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "the whole plan fails closed");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.rolledBack, true);
  assert.ok(fs.existsSync(path.join(store, "third.md")), "the sibling delete was undone");
  assertUnchanged(store, before, "mixed plan rolled back whole (index re-sync included)");
});

console.log(`\nmemory-apply: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
