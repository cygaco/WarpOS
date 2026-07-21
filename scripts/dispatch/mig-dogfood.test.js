"use strict";
/**
 * mig-dogfood.test.js — the UNIT TEETH for D-4 INC-1 unit MIG (SP-20260721-001):
 * the α-merge dogfood helper (#5), the regen/bookkeeping commit routing (#6), and the BINDING
 * FALLBACK-VISIBILITY rider (β rider-on-the-rider).
 *
 * Every end-to-end test drives a REAL scratch git repo, a REAL promoted pinned bundle and a REAL conductor
 * lease through `makeTransportFixture` (the same fixture SEC-1's falsifiers use). A mock would prove this
 * suite's model of the transport rather than the transport, and the entire point of the dogfood layer is
 * that it really does route through the real broker.
 *
 * THE CENTRAL CLAIM UNDER TEST — a fallback is never silent:
 *   1. an OPERATIONAL miss falls back, and doing so WRITES a ledger record and INCREMENTS the count;
 *   2. a SECURITY refusal never falls back at all, and leaves the ref where it was;
 *   3. an UNRECOGNISED reason is treated as security (default-deny), not as an operational hiccup;
 *   4. a fallback whose record CANNOT be written does not happen (`fallback-unrecordable`).
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const dog = require("./broker-dogfood");
const { brokerMerge, buildMergeCommit } = require("./broker-merge");
const { brokerReleaseCommit } = require("./broker-release-commit");
const { makeTransportFixture, headOf, sh } = require("./falsifiers/_lib/transport-fixtures");

/** A throwaway ledger path, so no test can ever touch the real runtime/d4/inc1 ledger. */
function scratchLedger(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `mig-ledger-${tag}-`));
  return { dir, logPath: path.join(dir, "dogfood-fallbacks.jsonl"), eventsPath: path.join(dir, "events.jsonl") };
}

// ══ 1. CLASSIFICATION — the rule that decides whether a fallback is even legitimate ═══════════════════

test("classifyRefusal — every transport trust-spine refusal classifies as SECURITY (never fallback-eligible)", () => {
  for (const r of [
    "merge-first-parent-not-live-head",
    "release-parent-not-live-head",
    "new-head-not-descendant-of-live-head",
    "result-tree-mutated-mid-run",
    "check-failed",
    "required-check-skipped",
    "missing-required-check",
    "stale-check-result",
    "lease-not-held",
    "ref-update-refused",
    "bundle-pin-mismatch",
    "bundle-lineage-mismatch",
  ]) {
    assert.equal(dog.classifyRefusal(r), "security", `${r} must be security-classified`);
    assert.equal(dog.fallbackAllowed(r), false, `${r} must NOT be fallback-eligible`);
  }
});

test("classifyRefusal — DEFAULT-DENY: an unknown/absent reason is treated as SECURITY, not operational", () => {
  // If BE-1 adds a refusal reason and nobody updates the table, the safe failure is "refuse and surface".
  for (const r of ["some-new-reason-nobody-mapped", "", null, undefined, 42, {}]) {
    assert.equal(dog.classifyRefusal(r), "security");
    assert.equal(dog.fallbackAllowed(r), false);
  }
});

test("classifyRefusal — only the enumerated OPERATIONAL reasons are fallback-eligible", () => {
  const eligible = [...dog.SECURITY_REASONS, ...dog.USAGE_REASONS, ...dog.OPERATIONAL_REASONS].filter((r) => dog.fallbackAllowed(r));
  assert.deepEqual(eligible.slice().sort(), dog.OPERATIONAL_REASONS.slice().sort());
  // The bundle-error family SPLITS across classes on purpose (GF-1, conservative-by-construction): a
  // present-but-corrupt configured bundle (bundle-load-failed) and an un-materializable candidate tree
  // (result-tree-materialize-failed) are ambiguous-toward-attack and are SECURITY — only the honest
  // ABSENCE of a configured bundle (no-pinned-bundle-configured) is a provable operational miss.
  assert.equal(dog.classifyRefusal("bundle-load-failed"), "security"); // present-but-unreadable = suspicious
  assert.equal(dog.classifyRefusal("result-tree-materialize-failed"), "security"); // candidate-dependent
  assert.equal(dog.classifyRefusal("no-pinned-bundle-configured"), "operational"); // true absence = infra miss
  assert.equal(dog.classifyRefusal("bundle-pin-mismatch"), "security");
  assert.equal(dog.classifyRefusal("ref-update-error"), "operational"); // spawn failure
  assert.equal(dog.classifyRefusal("ref-update-refused"), "security"); // the CAS lost — the ref MOVED
});

test("classification classes are disjoint — no reason can be both security and fallback-eligible", () => {
  const sec = new Set(dog.SECURITY_REASONS);
  const use = new Set(dog.USAGE_REASONS);
  for (const r of dog.OPERATIONAL_REASONS) {
    assert.equal(sec.has(r), false, `${r} is in BOTH operational and security`);
    assert.equal(use.has(r), false, `${r} is in BOTH operational and usage`);
  }
});

// ══ 2. THE LEDGER — LOGGED + COUNTED ═════════════════════════════════════════════════════════════════

test("recordFallback — writes a structured record, mirrors to the events log, and increments the count", () => {
  const L = scratchLedger("record");
  assert.equal(dog.fallbackCount(L.logPath), 0);

  const first = dog.recordFallback({ transport: "branch-merge", target_ref: "refs/heads/main", reason: "no-pinned-bundle-configured", classification: "operational", fallback_route: "git merge --no-ff" }, L);
  assert.equal(first.ok, true);
  assert.equal(first.count, 1);
  assert.equal(first.record.seq, 1);
  assert.equal(first.record.schema, dog.FALLBACK_SCHEMA);
  assert.equal(first.event_mirrored, true);

  const second = dog.recordFallback({ transport: "release-commit", target_ref: "refs/heads/main", reason: "no-pinned-bundle-configured", classification: "operational", fallback_route: "git update-ref" }, L);
  assert.equal(second.count, 2);
  assert.equal(second.record.seq, 2);

  const rows = dog.readFallbacks(L.logPath);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].transport, "branch-merge");
  assert.equal(rows[1].transport, "release-commit");

  // The events mirror carries a typed event for anything reading paths.eventsFile.
  const evt = fs.readFileSync(L.eventsPath, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(evt.length, 2);
  assert.equal(evt[0].type, "d4-dogfood-fallback");
});

test("fallbackCount — a MALFORMED ledger line is still COUNTED (under-counting is the one unsafe direction)", () => {
  const L = scratchLedger("malformed");
  fs.writeFileSync(L.logPath, '{"seq":1}\nnot json at all\n{"seq":3}\n', "utf8");
  assert.equal(dog.fallbackCount(L.logPath), 3);
  const r = dog.report(L.logPath);
  assert.equal(r.count, 3);
  assert.match(r.text, /MALFORMED LEDGER LINE/);
});

test("report — ZERO fallbacks reads as a clean claim; a non-zero count demands explanation", () => {
  const L = scratchLedger("report");
  assert.match(dog.report(L.logPath).text, /ZERO fallbacks/);
  dog.recordFallback({ transport: "branch-merge", target_ref: "refs/heads/main", reason: "no-pinned-bundle-configured", classification: "operational", fallback_route: "git update-ref" }, L);
  const t = dog.report(L.logPath).text;
  assert.match(t, /count\s*:\s*1/);
  assert.match(t, /must be individually EXPLAINED/);
});

// ══ 3. attemptFallback — the ONE gate ════════════════════════════════════════════════════════════════

test("attemptFallback — a SECURITY reason is REFUSED: no ledger record, no write, count unchanged", () => {
  const L = scratchLedger("sec-gate");
  const r = dog.attemptFallback({ reason: "check-failed", transport: "branch-merge", targetRef: "refs/heads/main", gitRoot: L.dir, ...L, emit: false });
  assert.equal(r.ok, false);
  assert.equal(r.refused, true);
  assert.equal(r.classification, "security");
  assert.equal(r.route, "none");
  assert.equal(dog.fallbackCount(L.logPath), 0, "a refused fallback is NOT a fallback — it must not be logged as one");
});

test("attemptFallback — an UNRECORDABLE fallback does NOT happen (fallback-unrecordable, classified security)", () => {
  const L = scratchLedger("unrecordable");
  // Make the ledger path unwritable by parking a FILE where its parent directory must be.
  const blocked = path.join(L.dir, "blocker", "ledger.jsonl");
  fs.writeFileSync(path.join(L.dir, "blocker"), "i am a file, not a directory\n", "utf8");

  const r = dog.attemptFallback({
    reason: "no-pinned-bundle-configured", // genuinely operational — would otherwise be allowed
    transport: "branch-merge",
    targetRef: "refs/heads/main",
    gitRoot: L.dir,
    logPath: blocked,
    emit: false,
  });
  assert.equal(r.ok, false);
  assert.equal(r.refused, true);
  assert.equal(r.reason, "fallback-unrecordable");
  assert.equal(r.classification, "security", "an invisible fallback is a silent bypass — it fails CLOSED");
  assert.equal(r.broker_reason, "no-pinned-bundle-configured");
});

test("attemptFallback — --no-fallback refuses even an operational miss, and logs nothing", () => {
  const L = scratchLedger("nofb");
  // Uses a GENUINELY-operational reason (no-pinned-bundle-configured): the --no-fallback flag is what
  // refuses it, not the classification. (bundle-load-failed is now SECURITY — GF-1 — so it would refuse
  // on classification alone and never reach the flag check.)
  const r = dog.attemptFallback({ reason: "no-pinned-bundle-configured", transport: "release-commit", targetRef: "refs/heads/main", gitRoot: L.dir, allowFallback: false, ...L, emit: false });
  assert.equal(r.refused, true);
  assert.equal(r.reason, "fallback-disabled-by-flag");
  assert.equal(dog.fallbackCount(L.logPath), 0);
});

test("attemptFallback — a DRY RUN does NOT move the count (it PROJECTS), and writes neither ledger nor ref", () => {
  // Caught in CLI smoke-testing: the first cut recorded before checking dryRun, so a rehearsal inflated
  // the very number the flip decision is argued from — and "explain fallback #1" is unanswerable when #1
  // never happened. A dry run reports `projected_count` and writes nothing.
  const L = scratchLedger("dry");
  const r = dog.attemptFallback({ reason: "no-pinned-bundle-configured", transport: "branch-merge", targetRef: "refs/heads/main", gitRoot: L.dir, dryRun: true, ...L, emit: false });
  assert.equal(r.ok, true);
  assert.equal(r.route, "dry-run");
  assert.equal(r.performed, false);
  assert.equal(r.recorded, false);
  assert.equal(r.count, 0, "the REAL count is untouched");
  assert.equal(r.projected_count, 1, "the projection says what it WOULD become");
  assert.equal(r.record.dry_run, true);
  assert.equal(fs.existsSync(L.logPath), false, "a dry run must not even create the ledger");
  assert.equal(fs.existsSync(L.eventsPath), false);
});

// ══ 4. #5 — THE α-MERGE HELPER, END TO END ═══════════════════════════════════════════════════════════

test("#5 brokerMerge — a clean branch LANDS THROUGH THE BROKER: real receipt, ref moves, ZERO fallbacks", () => {
  const fx = makeTransportFixture("mig-land");
  const L = scratchLedger("mig-land");
  try {
    const before = fx.head("refs/heads/main");
    const res = brokerMerge({ branch: "candidate", target_ref: "refs/heads/main" }, { ...fx.opts(), emit: false }, { logPath: L.logPath, eventsPath: L.eventsPath });

    assert.equal(res.ok, true, `expected a brokered land, got: ${res.reason} ${res.detail || ""}`);
    assert.equal(res.route, "brokered", "the whole point: the write went THROUGH the transport");
    assert.equal(res.decision, "LANDED");
    assert.equal(res.receipt.transport, "branch-merge");
    assert.equal(res.receipt.previous_head, before);
    assert.equal(res.receipt.committed_head, res.merge_commit);
    // β R6: the source tip is recorded as provenance, never as a guard.
    assert.equal(res.receipt.provenance.source_branch_tip, fx.candidate);

    // The ref really moved, to a real 2-parent merge whose FIRST parent is the old head.
    const after = fx.head("refs/heads/main");
    assert.equal(after, res.merge_commit);
    assert.notEqual(after, before);
    const parents = sh(["rev-list", "--parents", "-n", "1", after], fx.dir).split(/\s+/).slice(1);
    assert.equal(parents.length, 2);
    assert.equal(parents[0].toLowerCase(), before);
    assert.equal(parents[1].toLowerCase(), fx.candidate);

    assert.equal(dog.fallbackCount(L.logPath), 0, "a brokered land must not touch the fallback ledger");
    assert.equal(res.fallback_count, 0);
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("#5 buildMergeCommit — builds a real 2-parent merge object and moves NO ref", () => {
  const fx = makeTransportFixture("mig-build");
  try {
    const before = fx.head("refs/heads/main");
    const built = buildMergeCommit({ gitRoot: fx.dir, head: before, tip: fx.candidate, message: "probe" });
    assert.equal(built.ok, true);
    assert.match(built.sha, /^[0-9a-f]{40}$/);
    assert.equal(fx.head("refs/heads/main"), before, "building the merge object must not move main");
    assert.equal(sh(["cat-file", "-t", built.sha], fx.dir), "commit");
  } finally {
    fx.cleanup();
  }
});

test("#5 brokerMerge — a SECURITY refusal (poisoned tree fails the pinned suite) NEVER falls back", () => {
  const fx = makeTransportFixture("mig-poison");
  const L = scratchLedger("mig-poison");
  try {
    const poisoned = fx.poisonedBranch("poison");
    const before = fx.head("refs/heads/main");

    const res = brokerMerge({ branch: "poison", target_ref: "refs/heads/main" }, { ...fx.opts(), emit: false }, { logPath: L.logPath, eventsPath: L.eventsPath });

    assert.equal(res.ok, false);
    assert.equal(res.route, "none", "a failed suite must NOT reach the ordinary route");
    assert.equal(res.classification, "security");
    assert.equal(fx.head("refs/heads/main"), before, "main must be exactly where it was");
    assert.notEqual(fx.head("refs/heads/main"), poisoned);
    assert.equal(dog.fallbackCount(L.logPath), 0, "a security refusal is not a fallback and must not be logged as one");
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("#5 brokerMerge — an OPERATIONAL miss FALLS BACK, and the fallback is LOGGED, COUNTED and SURFACED", () => {
  // THE RIDER'S OWN TEST. No promoted bundle is configured, so the broker never renders a judgement —
  // the ordinary route is legitimate here, but it may not be silent.
  const fx = makeTransportFixture("mig-fallback", { skipHookInstall: true });
  const L = scratchLedger("mig-fallback");
  try {
    const before = fx.head("refs/heads/main");
    assert.equal(dog.fallbackCount(L.logPath), 0);

    const res = brokerMerge(
      { branch: "candidate", target_ref: "refs/heads/main" },
      { gitRoot: fx.dir, spId: fx.spId, leaseRoot: fx.leaseRoot, emit: false }, // NO bundleManifestPath
      { logPath: L.logPath, eventsPath: L.eventsPath },
    );

    // (a) it landed, but by the ORDINARY route — and it says so.
    assert.equal(res.ok, true, `fallback should land: ${res.reason} ${res.detail || ""}`);
    assert.equal(res.decision, "LANDED-BY-FALLBACK");
    assert.equal(res.broker_reason, "no-pinned-bundle-configured");
    assert.equal(res.classification, "operational");
    assert.notEqual(res.route, "brokered", "a fallback must never be reported as brokered mileage");
    assert.notEqual(fx.head("refs/heads/main"), before);

    // (b) LOGGED — a structured, visible record in the ledger.
    assert.equal(dog.fallbackCount(L.logPath), 1);
    const rows = dog.readFallbacks(L.logPath);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].schema, dog.FALLBACK_SCHEMA);
    assert.equal(rows[0].transport, "branch-merge");
    assert.equal(rows[0].reason, "no-pinned-bundle-configured");
    assert.equal(rows[0].classification, "operational");
    assert.equal(rows[0].target_ref, "refs/heads/main");
    assert.equal(rows[0].previous_head, before);
    assert.equal(rows[0].source_branch, "candidate");
    assert.ok(rows[0].ts && rows[0].fallback_route, "a record must carry a timestamp and the route taken");

    // (c) COUNTED — the running count is on the result and in the record's seq.
    assert.equal(res.fallback_count, 1);
    assert.equal(res.fallback_record.seq, 1);

    // (d) SURFACED — the banner names the count, names the reason, and cannot read like a success.
    const banner = dog.fallbackBanner(res.fallback_record, res.fallback_count, L.logPath);
    assert.match(banner, /DOGFOOD FALLBACK #1/);
    assert.match(banner, /WAS \*\*NOT\*\* EXERCISED/);
    assert.match(banner, /running count\s*:\s*1/);
    assert.match(banner, /no-pinned-bundle-configured \(operational\)/);
    assert.match(banner, /ZERO fallbacks/, "the banner must state the honest bar, not just the fact");
    assert.equal(/✔|success|LANDED\b/.test(banner), false, "a fallback banner must not contain success language");

    // (e) and the mirror reached the events sink.
    assert.match(fs.readFileSync(L.eventsPath, "utf8"), /"type":"d4-dogfood-fallback"/);
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("#5 brokerMerge — the SECOND fallback increments the count to 2 (the count is derived from the ledger)", () => {
  const fx = makeTransportFixture("mig-fallback2", { skipHookInstall: true });
  const L = scratchLedger("mig-fallback2");
  try {
    const opts = { gitRoot: fx.dir, spId: fx.spId, leaseRoot: fx.leaseRoot, emit: false };
    const seams = { logPath: L.logPath, eventsPath: L.eventsPath };
    const a = brokerMerge({ branch: "candidate", target_ref: "refs/heads/main" }, opts, seams);
    assert.equal(a.fallback_count, 1);

    const second = fx.releaseCommit(fx.head("refs/heads/main"), "more-work");
    const b = brokerMerge({ branch: "more-work", target_ref: "refs/heads/main" }, opts, seams);
    assert.equal(b.ok, true, `${b.reason} ${b.detail || ""}`);
    assert.equal(b.fallback_count, 2, "the running count must accumulate across invocations");
    assert.equal(b.fallback_record.seq, 2);
    assert.equal(dog.readFallbacks(L.logPath).length, 2);
    assert.ok(second);
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("#5 brokerMerge — --no-fallback makes the dogfood STRICT: an operational miss refuses and writes nothing", () => {
  const fx = makeTransportFixture("mig-strict", { skipHookInstall: true });
  const L = scratchLedger("mig-strict");
  try {
    const before = fx.head("refs/heads/main");
    const res = brokerMerge(
      { branch: "candidate", target_ref: "refs/heads/main" },
      { gitRoot: fx.dir, spId: fx.spId, leaseRoot: fx.leaseRoot, allowFallback: false, emit: false },
      { logPath: L.logPath, eventsPath: L.eventsPath },
    );
    assert.equal(res.ok, false);
    assert.equal(res.route, "none");
    assert.equal(fx.head("refs/heads/main"), before);
    assert.equal(dog.fallbackCount(L.logPath), 0);
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("#5 brokerMerge — an already-merged branch is a USAGE refusal, never a fallback", () => {
  const fx = makeTransportFixture("mig-noop");
  const L = scratchLedger("mig-noop");
  try {
    const res = brokerMerge({ branch: "main", target_ref: "refs/heads/main" }, { ...fx.opts(), emit: false }, { logPath: L.logPath, eventsPath: L.eventsPath });
    assert.equal(res.ok, false);
    assert.equal(res.reason, "already-merged");
    assert.equal(res.classification, "usage");
    assert.equal(dog.fallbackCount(L.logPath), 0);
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("#5 brokerMerge — the FLIP FORCING FUNCTION: with the Seam E hook live, the ordinary fallback route FAILS", () => {
  // Pre-flip the fallback works; post-flip the hook refuses it. This test pins that the escape hatch is
  // self-closing — the dogfood period cannot quietly outlive the fence.
  const fx = makeTransportFixture("mig-flip"); // hook INSTALLED
  const L = scratchLedger("mig-flip");
  try {
    const before = fx.head("refs/heads/main");
    const res = brokerMerge(
      { branch: "candidate", target_ref: "refs/heads/main" },
      { gitRoot: fx.dir, spId: fx.spId, leaseRoot: fx.leaseRoot, emit: false }, // no bundle -> operational
      { logPath: L.logPath, eventsPath: L.eventsPath },
    );
    assert.equal(res.ok, false, "the armed fence must refuse the un-brokered fallback write");
    assert.equal(res.decision, "FALLBACK-FAILED");
    assert.equal(fx.head("refs/heads/main"), before, "and main must not move");
    // The attempt is STILL in the ledger — an attempted bypass is exactly as interesting as a successful one.
    assert.equal(dog.fallbackCount(L.logPath), 1);
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

// ══ 5. #6 — REGEN / BOOKKEEPING COMMIT ROUTING ═══════════════════════════════════════════════════════

test("#6 brokerReleaseCommit — a staged bookkeeping change LANDS THROUGH THE BROKER as a single-parent commit", () => {
  const fx = makeTransportFixture("mig-release");
  const L = scratchLedger("mig-release");
  try {
    const before = fx.head("refs/heads/main");
    fs.writeFileSync(path.join(fx.dir, "MANIFEST.generated.json"), JSON.stringify({ regenerated: true }, null, 2));

    const res = brokerReleaseCommit(
      { message: "chore(SP-20260721-001): manifest regen", add: ["MANIFEST.generated.json"], target_ref: "refs/heads/main" },
      { ...fx.opts(), emit: false },
      { logPath: L.logPath, eventsPath: L.eventsPath },
    );

    assert.equal(res.ok, true, `expected a brokered release commit, got: ${res.reason} ${res.detail || ""}`);
    assert.equal(res.route, "brokered");
    assert.equal(res.receipt.transport, "release-commit");
    assert.equal(res.receipt.previous_head, before);

    const after = fx.head("refs/heads/main");
    assert.equal(after, res.release_commit);
    const parents = sh(["rev-list", "--parents", "-n", "1", after], fx.dir).split(/\s+/).slice(1);
    assert.equal(parents.length, 1, "a bookkeeping commit is single-parent by construction");
    assert.equal(parents[0].toLowerCase(), before);
    assert.equal(dog.fallbackCount(L.logPath), 0);
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("#6 brokerReleaseCommit — an empty index is refused as USAGE (no empty bookkeeping commits, no fallback)", () => {
  const fx = makeTransportFixture("mig-empty");
  const L = scratchLedger("mig-empty");
  try {
    const before = fx.head("refs/heads/main");
    const res = brokerReleaseCommit({ message: "chore: nothing", target_ref: "refs/heads/main" }, { ...fx.opts(), emit: false }, { logPath: L.logPath, eventsPath: L.eventsPath });
    assert.equal(res.ok, false);
    assert.equal(res.reason, "nothing-to-commit");
    assert.equal(res.classification, "usage");
    assert.equal(fx.head("refs/heads/main"), before);
    assert.equal(dog.fallbackCount(L.logPath), 0);
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("#6 brokerReleaseCommit — an OPERATIONAL miss falls back, LOGGED + COUNTED, and is not reported as brokered", () => {
  const fx = makeTransportFixture("mig-release-fb", { skipHookInstall: true });
  const L = scratchLedger("mig-release-fb");
  try {
    fs.writeFileSync(path.join(fx.dir, "LEDGER.md"), "# ledger\n");
    const res = brokerReleaseCommit(
      { message: "chore: ledger hygiene", add: ["LEDGER.md"], target_ref: "refs/heads/main" },
      { gitRoot: fx.dir, spId: fx.spId, leaseRoot: fx.leaseRoot, emit: false }, // NO bundle
      { logPath: L.logPath, eventsPath: L.eventsPath },
    );
    assert.equal(res.ok, true, `${res.reason} ${res.detail || ""}`);
    assert.equal(res.decision, "LANDED-BY-FALLBACK");
    assert.notEqual(res.route, "brokered");
    assert.equal(res.fallback_count, 1);
    assert.equal(dog.readFallbacks(L.logPath)[0].transport, "release-commit");
  } finally {
    fx.cleanup();
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

// ══ 6. THE HELPERS ARE THEMSELVES ACCOUNTED FOR ══════════════════════════════════════════════════════

test("MIG helpers are ALLOWLISTED in the main-write-broker-completeness enforcer as self-brokering", () => {
  // These three files legitimately name `refs/heads/main` and contain the ordinary-route idioms, so the
  // conservative recognizer flags them. They are self-brokering (they CALL the transport) plus the audited
  // fallback — so they belong in the in-code ALLOWLIST with a reason, never suppressed by a pragma.
  const { ALLOWLIST } = require("../checks/main-write-broker-completeness");
  for (const rel of ["scripts/dispatch/broker-merge.js", "scripts/dispatch/broker-release-commit.js", "scripts/dispatch/broker-dogfood.js"]) {
    assert.ok(ALLOWLIST[rel], `${rel} must be allowlisted`);
    assert.match(ALLOWLIST[rel].reason, /self-brokering/i, `${rel}'s allowlist reason must name self-brokering`);
  }
});

test("#7 turbo census — scripts/turbo/apply.js performs NO git write at all (push-only surface, recorded)", () => {
  // β R6 census close. `turbo/apply.js` GRANTS the `push-to-main` permission scope in settings.json; it
  // never spawns git itself, so it is not a local main-writer and the ref-transaction fence (a LOCAL ref
  // surface) does not gate it. Pinned here so a future edit that adds a git write to it REDs this test.
  const src = fs.readFileSync(path.join(dog.ROOT, "scripts", "turbo", "apply.js"), "utf8");
  assert.equal(/\bspawnSync\b|\bexecSync\b|\bexecFileSync\b|require\(["']child_process["']\)/.test(src), false, "turbo/apply.js must not spawn any process (it would be an unaudited write surface)");
  const census = fs.readFileSync(path.join(dog.ROOT, "runtime", "d4", "inc1", "turbo-census.md"), "utf8");
  assert.match(census, /push-only/i);
  assert.match(census, /no local main-write/i);
});

// ══ 7. GF-1..GF-4 — the gauntlet-round hardening, each with its own teeth ═════════════════════════════
// backend-reviewer (gpt-5.6-sol) FAIL on the MIG fallback-visibility/helper layer; these lock the fixes.

test("GF-1 — a present-but-corrupt bundle / un-materializable candidate is SECURITY and NEVER falls back", () => {
  // Conservative-by-construction: a CONFIGURED-and-PRESENT pinned bundle that fails to read/parse, and a
  // specific candidate SHA whose tree will not materialize, are ambiguous-toward-attack (a poisoned bundle
  // and a hostile candidate arrive the same way as an I/O blip). Only the honest ABSENCE of a bundle
  // (no-pinned-bundle-configured) is a provable operational miss.
  for (const r of ["bundle-load-failed", "result-tree-materialize-failed"]) {
    assert.equal(dog.classifyRefusal(r), "security", `${r} must be security-classified`);
    assert.equal(dog.fallbackAllowed(r), false, `${r} must NOT be fallback-eligible`);
    assert.equal(dog.OPERATIONAL_REASONS.includes(r), false, `${r} must be OUT of OPERATIONAL_REASONS`);
    assert.equal(dog.SECURITY_REASONS.includes(r), true, `${r} must be listed in SECURITY_REASONS`);
  }
  assert.equal(dog.fallbackAllowed("no-pinned-bundle-configured"), true, "true absence stays operational");
  // through attemptFallback: a bundle-load-failed refusal writes NO ledger record and lands nothing.
  const L = scratchLedger("gf1");
  const res = dog.attemptFallback({ reason: "bundle-load-failed", transport: "release-commit", targetRef: "refs/heads/main", gitRoot: L.dir, ...L, emit: false });
  assert.equal(res.ok, false);
  assert.equal(res.refused, true);
  assert.equal(res.classification, "security");
  assert.equal(dog.fallbackCount(L.logPath), 0, "a security refusal is not a fallback — nothing is logged");
  fs.rmSync(L.dir, { recursive: true, force: true });
});

test("GF-2 — a release commit built while a FEATURE branch is checked out cannot smuggle the feature snapshot onto main", () => {
  // The vector: run brokerReleaseCommit while a DIFFERENT branch (with foreign content) is checked out. The
  // built commit must be head(main)'s tree + ONLY the named pathspec — the feature branch's other files must
  // NOT appear on the landed main commit. Pre-fix, `write-tree` over the ambient index would carry them.
  const fx = makeTransportFixture("mig-gf2");
  const Lg = scratchLedger("gf2");
  try {
    const mainHead = fx.head("refs/heads/main");
    sh(["checkout", "-b", "feature/evil"], fx.dir);
    fs.writeFileSync(path.join(fx.dir, "FEATURE_SECRET.txt"), "should never land on main\n");
    sh(["add", "FEATURE_SECRET.txt"], fx.dir);
    sh(["commit", "-m", "feature work"], fx.dir);
    // While ON feature/evil, write a legitimate bookkeeping file and broker a release-commit to main.
    fs.writeFileSync(path.join(fx.dir, "MANIFEST.generated.json"), JSON.stringify({ regenerated: true }));
    const res = brokerReleaseCommit(
      { message: "chore: manifest regen", add: ["MANIFEST.generated.json"], target_ref: "refs/heads/main" },
      { ...fx.opts(), emit: false },
      { logPath: Lg.logPath, eventsPath: Lg.eventsPath },
    );
    assert.equal(res.ok, true, `${res.reason} ${res.detail || ""}`);
    const landed = res.release_commit;
    const parents = sh(["rev-list", "--parents", "-n", "1", landed], fx.dir).split(/\s+/).slice(1);
    assert.equal(parents.length, 1, "a bookkeeping commit is single-parent");
    assert.equal(parents[0].toLowerCase(), mainHead, "parented to live main, not the feature branch");
    const treeFiles = sh(["ls-tree", "-r", "--name-only", landed], fx.dir).split(/\s+/).filter(Boolean);
    assert.ok(treeFiles.includes("MANIFEST.generated.json"), "the named bookkeeping path must be present");
    assert.equal(treeFiles.includes("FEATURE_SECRET.txt"), false, "the feature-branch snapshot must NOT leak onto main");
  } finally {
    fx.cleanup();
    fs.rmSync(Lg.dir, { recursive: true, force: true });
  }
});

test("GF-3 — an unreadable-but-present ledger REFUSES the fallback (fallback-unrecordable), never a count-0 bypass", () => {
  const L = scratchLedger("gf3");
  // Make the ledger PRESENT-BUT-UNREADABLE by putting a DIRECTORY where the ledger file must be (readFileSync
  // on a directory throws a non-ENOENT error — distinct from ENOENT, which is a legitimately-empty ledger).
  fs.mkdirSync(L.logPath, { recursive: true });
  const rec = dog.recordFallback({ transport: "branch-merge", target_ref: "refs/heads/main", reason: "no-pinned-bundle-configured" }, { logPath: L.logPath });
  assert.equal(rec.ok, false, "an unreadable ledger cannot be counted — recordFallback must fail");
  assert.match(String(rec.error), /ledger-unreadable/);
  // through attemptFallback: an operational miss on an unreadable ledger is REFUSED as fallback-unrecordable.
  const res = dog.attemptFallback({ reason: "no-pinned-bundle-configured", transport: "branch-merge", targetRef: "refs/heads/main", gitRoot: L.dir, logPath: L.logPath, emit: false });
  assert.equal(res.ok, false);
  assert.equal(res.reason, "fallback-unrecordable");
  assert.equal(res.classification, "security");
  // report() must NOT certify ZERO on an unreadable ledger — that is the flip-time false-green this guards.
  const rep = dog.report(L.logPath);
  assert.equal(rep.unreadable, true);
  assert.match(rep.text, /UNREADABLE/);
  assert.equal(/ZERO fallbacks/.test(rep.text), false, "an unreadable ledger must never read as a clean ZERO");
  fs.rmSync(L.dir, { recursive: true, force: true });
});

test("GF-4 — a dogfood-ACQUIRED lease whose release FAILS surfaces the orphan, never swallows it", () => {
  let released = false;
  const fakeApi = {
    acquire: () => ({ ok: true, token: "tok-123" }),
    release: () => { released = true; throw new Error("store write denied"); },
  };
  const held = dog.ensureLease("SP-TEST", os.tmpdir(), fakeApi);
  assert.equal(held.ok, true);
  assert.equal(held.state, "acquired");
  const orig = process.stderr.write;
  let captured = "";
  process.stderr.write = (s) => { captured += s; return true; };
  let rel;
  try {
    rel = held.release();
  } finally {
    process.stderr.write = orig;
  }
  assert.equal(released, true, "the underlying release WAS attempted");
  assert.equal(rel.ok, false, "a failed release must be REPORTED, not swallowed");
  assert.match(String(rel.error), /release threw|store write denied/);
  assert.match(captured, /LEASE RELEASE FAILED/);
  assert.match(captured, /ORPHAN/i);
});

test("GF-4 positive — a clean release reports released:true; a pre-existing lease is a no-op", () => {
  const okApi = { acquire: () => ({ ok: true, token: "t" }), release: () => ({ ok: true }) };
  const held = dog.ensureLease("SP-OK", os.tmpdir(), okApi);
  assert.deepEqual(held.release(), { ok: true, released: true });
  const heldApi = { acquire: () => ({ ok: false, reason: "held" }) };
  const pre = dog.ensureLease("SP-HELD", os.tmpdir(), heldApi);
  assert.equal(pre.state, "pre-existing");
  assert.deepEqual(pre.release(), { ok: true, released: false });
});
