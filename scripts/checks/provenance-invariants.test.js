#!/usr/bin/env node
"use strict";
/**
 * Self-verifying teeth for the STRUCTURAL choke-point guard (SP-20260718-003, α round-6 + β teeth-4). The
 * guard flags a consumer that decides lane/hunter identity by catching the identity VALUE
 * ("security_claude_hunter" / "in-process-agent") named in any form, OR the record's `.role` read in a
 * decision context — NOT a hardcoded label-field list (which recreated the SR-017 blind spot). It is NOT a
 * completeness claim: a fully-computed runtime obfuscator that names neither is not statically decidable; the
 * runtime evidence layer is ORIGIN-PROOF signed (ED-231 RESOLVED via ADR-0025) and is the real protection
 * WITHIN the named same-user boundary — see the HONEST CEILING in provenance-invariants.js. Proven against β's
 * evasion probes (aliased var, renamed/new field, label-only,
 * reversed operands, .role member/computed/destructure/alias/Object.is/switch) AND green on the consumers.
 *
 *   node scripts/checks/provenance-invariants.test.js
 */
const assert = require("assert");
const g = require("./provenance-invariants");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// ── β evasion probes: a re-implementation that decides identity by NAMING the value or reading .role must be caught. ──
test("catches the SR-017 label-only vector — sanctioned_lane_id, NO .shape in sight", () => {
  assert.equal(g.hasLocalIdentityDecision(`m = recs.find(r => r.sanctioned_lane_id === "security_claude_hunter");`), true);
});
test("catches a NEW/renamed label field (blocklist would miss it)", () => {
  assert.equal(g.hasLocalIdentityDecision(`if (r.record_source === "security_claude_hunter") ok = true;`), true);
  assert.equal(g.hasLocalIdentityDecision(`if (rec.lane_marker === "in-process-agent") ...`), true);
});
test("catches an ALIASED var (const s = r.field; s === value)", () => {
  const code = `const s = r.sanctioned_lane_id;\nif (s === "security_claude_hunter") accept();`;
  assert.equal(g.hasLocalIdentityDecision(code), true);
});
test("catches a local const holding the identity value (to compare via the const)", () => {
  assert.equal(g.hasLocalIdentityDecision(`const HUNTER = "security_claude_hunter";`), true);
});
test("catches REVERSED operands", () => {
  assert.equal(g.hasLocalIdentityDecision(`if ("in-process-agent" === rec.shape) ...`), true);
  assert.equal(g.hasLocalIdentityDecision(`if ("security_claude_hunter" === r.role) ...`), true);
});
test("clean: a pv delegate has no local identity decision", () => {
  assert.equal(g.hasLocalIdentityDecision(`m = recs.find(r => pv.isHunterRecord(r) && r.output_digest);`), false);
});
test("clean: the identity value inside a DIAGNOSTIC message string is NOT a decision", () => {
  assert.equal(g.hasLocalIdentityDecision(`reason: "no same-run in-process HUNTER record (shape in-process-agent + role security_claude_hunter, with evidence)"`), false);
});

// ── R6-BE-002 (ADR-0022): the HARDENED detector catches the constant-ref / Object.is / destructuring
//    role-evasions the string-literal regex missed. The hunter ROLE value is flagged in its common naming forms. ──
test("R6-BE-002: a constant-ref to the role (=== pv.HUNTER_ROLE) is flagged (regex-evasion closed)", () => {
  assert.equal(g.hasLocalIdentityDecision(`if (rec.role === pv.HUNTER_ROLE) accept();`), true);
});
test("R6-BE-002: Object.is with the role constant is flagged", () => {
  assert.equal(g.hasLocalIdentityDecision(`if (Object.is(rec.role, HUNTER_ROLE)) accept();`), true);
});
test("R6-BE-002: a destructured role constant (const {HUNTER_ROLE}=pv) is flagged", () => {
  assert.equal(g.hasLocalIdentityDecision(`const { HUNTER_ROLE } = pv;\nif (r.role === HUNTER_ROLE) ok();`), true);
});
test("R6-BE-002: a renamed destructure whose line still names HUNTER_ROLE is flagged", () => {
  assert.equal(g.hasLocalIdentityDecision(`const { HUNTER_ROLE: R } = require("./provenance-verifier");\nif (r.role === R) ok();`), true);
});
// ── R6-BE-002 carve-out (SR-020 compatibility): a SHAPE-constant ref for manifest/lane validation is NOT a
//    hunter-identity decision (a shape-only check needs no role) — it must stay CLEAN so panel-lanes delegates. ──
test("R6-BE-002 carve-out: a shape-constant ref (lane.shape === IN_PROCESS_SHAPE) is CLEAN (manifest validation)", () => {
  assert.equal(g.hasLocalIdentityDecision(`if (lane.shape === IN_PROCESS_SHAPE) violations.push(...);`), false);
  assert.equal(g.hasLocalIdentityDecision(`const expectShape = provider === "claude" ? pv.IN_PROCESS_SHAPE : pv.CROSS_PROVIDER_SHAPE;`), false);
});

// ── DELEGATE: a consumer must import the verifier. ──
test("importsVerifier: detects the require (relative + path.join)", () => {
  assert.equal(g.importsVerifier(`const pv = require("../dispatch/provenance-verifier");`), true);
  assert.equal(g.importsVerifier(`const pv = require(path.join(x, "dispatch", "provenance-verifier"));`), true);
  assert.equal(g.importsVerifier(`const x = require("./something-else");`), false);
});

// ── INV-3 (git-head): every ref-read path SHA-validates (kept SEPARATE from the identity invariant). ──
test("INV-3: flags a readPackedRef that does NOT SHA-validate", () => {
  const leak = ["function readGitHead(root) {", "  if (/^[0-9a-f]{7,40}$/i.test(x)) return x;", "  if (/^[0-9a-f]{7,40}$/i.test(y)) return y;", "}", "function readPackedRef(p, ref) {", "  return t.slice(0, sp);", "}"].join("\n");
  assert.equal(g.gitHeadTokenValidated(leak), false);
});
test("INV-3: a fully SHA-validating git-head is clean", () => {
  const clean = ["function readGitHead(root) {", "  if (/^[0-9a-f]{7,40}$/i.test(x)) return x;", "  if (/^[0-9a-f]{7,40}$/i.test(y)) return y;", "}", "function readPackedRef(p, ref) {", "  const s = t.slice(0, sp);", "  return /^[0-9a-f]{7,40}$/i.test(s) ? s : '';", "}"].join("\n");
  assert.equal(g.gitHeadTokenValidated(clean), true);
});

// ── the LIVE guard: the refactored consumers delegate → ZERO violations (its own falsifiability: seeded
//    re-implementations above FAIL the detector; the live run is GREEN). ──
test("live: cert-attest + dispatch-review delegate identity to the verifier (0 violations)", () => {
  const v = g.run();
  assert.equal(v.length, 0, `guard must be green on the delegated consumers: ${v.map((x) => `[${x.inv}] ${x.file}: ${x.msg}`).join(" | ")}`);
});

// ── R6-BE-002 (β DECIDE B/0.88): the .role-ACCESS detector catches the runtime-value-reconstruction
//    evasion the VALUE-detector misses. TEETH-3: a negative fixture per obfuscation FORM must FLAG. ──
test("R6-BE-002: member-compare with a RECONSTRUCTED role value (gpt evasion) is FLAGGED", () => {
  assert.equal(g.readsRecordRoleForDecision(`if (rec.role === ["security","claude","hunter"].join("_")) accept();`), true);
});
test("R6-BE-002: concat-built value in a .role compare is FLAGGED (value-detector would miss it)", () => {
  assert.equal(g.readsRecordRoleForDecision(`if (r.role === "security_claude_" + "hunter") ok();`), true);
});
test("R6-BE-002: reversed member-compare is FLAGGED", () => {
  assert.equal(g.readsRecordRoleForDecision(`if (HUNTER === record.role) {}`), true);
});
test("R6-BE-002: computed access r[\"role\"] compare is FLAGGED", () => {
  assert.equal(g.readsRecordRoleForDecision(`if (rec["role"] === recon) {}`), true);
});
test("R6-BE-002: destructure {role} from a record is FLAGGED", () => {
  assert.equal(g.readsRecordRoleForDecision(`const { role } = rec; if (role === recon) {}`), true);
});
test("R6-BE-002: alias assign (const x = rec.role) is FLAGGED", () => {
  assert.equal(g.readsRecordRoleForDecision(`const rr = record.role; if (rr === recon) {}`), true);
});
// TEETH-2: the legitimate sites (contract.role in a MESSAGE, opts-param destructure, role var/field) PASS.
test("R6-BE-002 no over-block: contract.role in a message string is NOT flagged", () => {
  assert.equal(g.readsRecordRoleForDecision("return `no record (contract ${contract.shape}/${contract.role}, panel_run_id)`;"), false);
});
test("R6-BE-002 no over-block: an opts-param destructure ({...role...} = {}) is NOT flagged", () => {
  assert.equal(g.readsRecordRoleForDecision(`function f({ runId, role = "security-reviewer" } = {}) {}`), false);
});
test("R6-BE-002 no over-block: object-literal role field + bare role var in a string are NOT flagged", () => {
  assert.equal(g.readsRecordRoleForDecision(`const out = { agent: role, verdict: v }; const dir = \`reviews/${"$"}{role}-${"$"}{ts}\`;`), false);
});
// The RUNTIME GUARANTEE (β's load-bearing tooth) — the honest-ceiling residual is defended by the live
// binding layer, NOT this static guard: proven in cert-attest-panel.test.js (a bypass without a real
// same-run writer-stamped hunter record with matching evidence-digest + code_sha never attests).
test("live: consumers still delegate after the .role-access hardening (0 violations)", () => {
  assert.equal(g.run().length, 0, "the hardened guard must stay green on the delegated consumers");
});

// ── INV-4 (R5-MEDIUM-01): the SERVED-MODEL choke-point enforcer. The R3-CRITICAL-02 recurrence is a THIRD
//    ledger reader that inlines `record/lane.provider === "antigravity"` instead of the choke-point. ──
test("INV-4b: a SYNTHETIC third reader inlining rec.provider === 'antigravity' is CAUGHT (regression fixture)", () => {
  const thirdReader = `function attestSomethingNew(rec) {\n  if (rec.provider === "antigravity") return { attested: false };\n  return liveness(rec);\n}`;
  assert.equal(g.hasInlineAgyRecordProviderCheck(thirdReader), true, "a new reader inlining the agy record check must be caught");
});
test("INV-4b: the reversed and lane-object forms are also caught", () => {
  assert.equal(g.hasInlineAgyRecordProviderCheck(`if ("antigravity" === r.provider) block();`), true);
  assert.equal(g.hasInlineAgyRecordProviderCheck(`if (l.provider === "antigravity") { hasEvidence = false; }`), true);
});
test("INV-4b: the raw-CLI §7 evaluator (providerId PARAM) is EXEMPT — a different evidence class, permitted", () => {
  assert.equal(g.hasInlineAgyRecordProviderCheck(`if (providerId === "antigravity") return { honestCeiling: true };`), false, "the §7 log evaluator's providerId param must NOT be flagged (no .provider member access)");
});
test("INV-4a: the choke-point INVOCATION detector (call, not a bare mention)", () => {
  assert.equal(g.invokesServedModelChokePoint(`if (pv.servedModelUnverifiableFromRecord(l.provider)) return blocked();`), true);
  assert.equal(g.invokesServedModelChokePoint(`// mentions servedModelUnverifiableFromRecord in a comment only`), false, "stripped comments must not count as an invocation");
  assert.equal(g.invokesServedModelChokePoint(`return r.ok === true && r.fallback === false;`), false, "an inline liveness computation is not the choke-point");
});
test("INV-4 live: the served-model ledger readers route through the choke-point (0 served-model violations)", () => {
  const v = g.run().filter((x) => x.inv === "SERVED-MODEL-CHOKEPOINT" || x.inv === "NO-INLINE-AGY-SERVED-MODEL");
  assert.equal(v.length, 0, `attestLane + buildObserved must invoke the choke-point with no inline agy check: ${JSON.stringify(v)}`);
});

if (failures.length) {
  process.stderr.write(`FAIL [provenance-invariants.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [provenance-invariants.test] ${passed} passed (value-detector + .role-ACCESS hardening; INV-4 served-model choke-point enforcer; message/opts-param safe; honest-ceiling; live consumers delegate)\n`);
