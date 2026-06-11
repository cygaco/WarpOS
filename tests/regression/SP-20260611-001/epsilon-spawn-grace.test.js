#!/usr/bin/env node
"use strict";

/**
 * epsilon-spawn-grace.test.js — regression for SP-20260611-001 (T-310/R-1 + T-322).
 *
 * Two findings, two layers — both about the parent SIGTERM bound STRICTLY exceeding
 * EVERY child timeout layer so a graceful child death-record wins the race:
 *
 *  T-310/R-1 (parent side): spawnAgent passed foregroundAwareTimeout(...) — the child
 *  wrapper's OWN bound — as spawnSync's parent `timeout`, so the parent's hard SIGTERM
 *  fired the instant the child began its graceful death-record write. Fix: parent bound
 *  = childBaseMs + PARENT_GRACE_MS (45s) at BOTH spawn sites (epsilon-agent, epsilon-claude),
 *  PROPAGATING childBaseMs to the child via env DISPATCH_BUILDER_TIMEOUT_MS.
 *
 *  T-322 (child side — the binding FAIL the GPT backend lane proved): propagation alone
 *  is DEAD at the epsilon-AGENT site — dispatch-agent.js NEVER read DISPATCH_BUILDER_TIMEOUT_MS.
 *  Its REAL child bounds were INDEPENDENT of the propagated value: slot-acquire defaulted to
 *  DISPATCH_SLOT_TIMEOUT_MS (600s) and runProvider used its own run-provider default (540s).
 *  Quantified: epsilon-agent parent = 540 (fg-clamp) + 45 grace = 585s; child slot = 600s →
 *  parent (585) < child slot (600), so a saturated slot is parent-killed BEFORE the child
 *  writes its record. Fix (β shape #1): dispatch-agent.js, when the propagated bound is set,
 *  derives BOTH the slot bound AND runProvider's opts.timeoutMs from it, so all child layers
 *  single-source from childBaseMs and parent > every child layer BY CONSTRUCTION.
 *
 * Section (5) asserts the CHILD's REAL bounds (slot + runProvider) by running the ACTUAL
 * dispatch-agent.js with a preload shim that captures the bounds the child computed — NOT
 * env-var presence. A mutation that reverts the dispatch-agent.js read REDs section (5)
 * (mutation check, AC-322.4).
 *
 * Exploit-shaped (BC-16): asserts the OLD races (parent ≤ child, child ignores propagation)
 * are now closed at the cross-provider site — the missed second site / dead propagation link
 * is the rename-hygiene / fix-all-callers bug class.
 *
 *   node tests/regression/SP-20260611-001/epsilon-spawn-grace.test.js
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../../..");
const RT = path.join(ROOT, "scripts/sprint/epsilon-runtime");
const TP = path.join(ROOT, "scripts/dispatch/timeout-policy");
const DISPATCH_AGENT = path.join(ROOT, "scripts/dispatch-agent.js");
const rt = require(RT);
const { foregroundAwareTimeout, WRAPPER_DEFAULTS } = require(TP);

let passed = 0;
let failed = 0;
function ok(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// Inject a runner that captures the spawnSync options (so we read the parent `timeout`
// AND the child env the runtime actually computed) and returns a benign ok outcome so
// spawnAgent completes. We need the FULL options object — FIX-A1's propagation link is the
// child env DISPATCH_BUILDER_TIMEOUT_MS, which the old test never inspected.
function captureSpawn(route, role, opts = {}) {
  let captured = null;
  const run = (_bin, _args, options) => {
    captured = options;
    return { status: 0, stdout: "ok" };
  };
  rt.spawnAgent(
    { role, step: "gauntlet", route, provider: route === rt.ROUTE.DISPATCH_CLAUDE ? "claude" : "gemini", model: "x" },
    "SP-T",
    { run, promptFile: __filename, ...opts }
  );
  return captured;
}
function captureTimeout(route, role, opts = {}) {
  const captured = captureSpawn(route, role, opts);
  return captured ? captured.timeout : null;
}

const GRACE = rt.PARENT_GRACE_MS;

console.log("(1) PARENT_GRACE_MS is a named constant in the β window (30–60s):");
{
  ok("PARENT_GRACE_MS is exported as a number", typeof GRACE === "number");
  ok("PARENT_GRACE_MS within 30000–60000ms", GRACE >= 30000 && GRACE <= 60000, `got ${GRACE}`);
}

console.log("\n(2) parent-bound-exceeds-child-bound-at-both-sites:");
{
  // Site 1 — epsilon-agent (DISPATCH_AGENT route, ~line 476).
  const childAgent = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-agent"], {});
  const parentAgent = captureTimeout(rt.ROUTE.DISPATCH_AGENT, "security-reviewer");
  ok(
    "epsilon-agent site: parent timeout = child bound + PARENT_GRACE_MS",
    parentAgent === childAgent + GRACE,
    `parent=${parentAgent} child=${childAgent} grace=${GRACE}`
  );
  ok("epsilon-agent site: parent STRICTLY exceeds child (not backstop-only)", parentAgent > childAgent);

  // Site 2 — epsilon-claude (DISPATCH_CLAUDE route, ~line 500).
  const childClaude = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-claude"], {});
  const parentClaude = captureTimeout(rt.ROUTE.DISPATCH_CLAUDE, "frontend-builder", { worktree: __dirname });
  ok(
    "epsilon-claude site: parent timeout = child bound + PARENT_GRACE_MS",
    parentClaude === childClaude + GRACE,
    `parent=${parentClaude} child=${childClaude} grace=${GRACE}`
  );
  ok("epsilon-claude site: parent STRICTLY exceeds child (not backstop-only)", parentClaude > childClaude);

  // The OLD bug: parent == child (the race). Assert that exact equality no longer holds.
  ok("epsilon-agent: OLD race (parent == child) is closed", parentAgent !== childAgent);
  ok("epsilon-claude: OLD race (parent == child) is closed", parentClaude !== childClaude);
}

console.log("\n(3) graceful-death-record-wins-race-both-sites:");
{
  // A child exiting at exactly its own bound is comfortably within the parent bound, with
  // at least 30s of margin for its graceful death-record write — at BOTH sites.
  const MIN_MARGIN = 30000;

  const childAgent = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-agent"], {});
  const parentAgent = captureTimeout(rt.ROUTE.DISPATCH_AGENT, "security-reviewer");
  ok(
    "epsilon-agent: child bound < parent bound with ≥30s margin",
    childAgent < parentAgent && parentAgent - childAgent >= MIN_MARGIN,
    `margin=${parentAgent - childAgent}`
  );

  const childClaude = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-claude"], {});
  const parentClaude = captureTimeout(rt.ROUTE.DISPATCH_CLAUDE, "frontend-builder", { worktree: __dirname });
  ok(
    "epsilon-claude: child bound < parent bound with ≥30s margin",
    childClaude < parentClaude && parentClaude - childClaude >= MIN_MARGIN,
    `margin=${parentClaude - childClaude}`
  );

  // Background dispatches (full bound) still get the grace, not parent ≤ child.
  const childBg = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-claude"], { background: true });
  const parentBg = captureTimeout(rt.ROUTE.DISPATCH_CLAUDE, "frontend-builder", { background: true, worktree: __dirname });
  ok(
    "background dispatch: parent still = child bound + grace (race closed at full bound too)",
    parentBg === childBg + GRACE,
    `parent=${parentBg} child=${childBg}`
  );
}

console.log("\n(4) parent-strictly-exceeds-child-under-opts-override-both-sites (FIX-A1 propagation link):");
{
  // The blocker the old test missed: when opts.timeoutMs is SET, the parent was computed from
  // opts.timeoutMs but the value was NEVER propagated to the child — the child read its own
  // env/default bound, so parent and child DIVERGED and the parent could end up ≤ child,
  // re-opening the death-record race. FIX-A1 single-sources the child bound BY CONSTRUCTION:
  // childBaseMs = foregroundAwareTimeout(opts.timeoutMs || default, opts); the child env
  // DISPATCH_BUILDER_TIMEOUT_MS == childBaseMs AND parent == childBaseMs + grace, for EVERY
  // opts.timeoutMs value, at BOTH sites.
  const cases = [
    { label: "small (1000)", timeoutMs: 1000 },
    { label: "huge (9_000_000)", timeoutMs: 9000000 },
    { label: "unset", timeoutMs: undefined },
  ];
  const sites = [
    { name: "epsilon-agent", route: rt.ROUTE.DISPATCH_AGENT, role: "security-reviewer", def: WRAPPER_DEFAULTS["epsilon-agent"], extra: {} },
    { name: "epsilon-claude", route: rt.ROUTE.DISPATCH_CLAUDE, role: "frontend-builder", def: WRAPPER_DEFAULTS["epsilon-claude"], extra: { worktree: __dirname } },
  ];
  for (const site of sites) {
    for (const c of cases) {
      // childBaseMs is what the runtime SHOULD compute for this opts.timeoutMs (idempotent clamp).
      const childBaseMs = foregroundAwareTimeout(c.timeoutMs || site.def, {});
      const opts = c.timeoutMs === undefined ? { ...site.extra } : { timeoutMs: c.timeoutMs, ...site.extra };
      const cap = captureSpawn(site.route, site.role, opts);
      const propagated = cap && cap.env ? Number(cap.env.DISPATCH_BUILDER_TIMEOUT_MS) : NaN;
      const parent = cap ? cap.timeout : null;

      ok(
        `${site.name} / ${c.label}: child env DISPATCH_BUILDER_TIMEOUT_MS == childBaseMs (propagation link present)`,
        propagated === childBaseMs,
        `propagated=${propagated} childBaseMs=${childBaseMs}`,
      );
      ok(
        `${site.name} / ${c.label}: parent timeout == childBaseMs + PARENT_GRACE_MS (by construction)`,
        parent === childBaseMs + GRACE,
        `parent=${parent} childBaseMs=${childBaseMs} grace=${GRACE}`,
      );
      ok(
        `${site.name} / ${c.label}: parent STRICTLY exceeds child (race closed for this opts override)`,
        parent > childBaseMs,
        `parent=${parent} childBaseMs=${childBaseMs}`,
      );
    }
  }
}

// ── (5) THE T-322 FIX: the CHILD (dispatch-agent.js) actually CONSUMES the propagated bound ──
//
// Sections (2)-(4) prove the PARENT propagates DISPATCH_BUILDER_TIMEOUT_MS and sizes its own
// SIGTERM bound. They do NOT prove the CHILD reads it. The binding GPT-backend FAIL was exactly
// that gap: dispatch-agent.js ignored the env, so its REAL slot bound (600s) and runProvider
// bound (540s) were independent of the parent (585s) — parent < child slot, race OPEN.
//
// We assert the child's REAL bounds by RUNNING the actual dispatch-agent.js with a preload shim
// that intercepts acquireSlotSync (captures the slot timeoutMs) and runProvider (captures
// opts.timeoutMs), prints both, and exits before any real provider call. This exercises the
// REAL env read — reverting it changes the captured bounds (the mutation check, AC-322.4).

const SHIM = `
"use strict";
const path = require("path");
const Module = require("module");
const ROOT = ${JSON.stringify(ROOT)};
const lockPath = require.resolve(path.join(ROOT, "scripts/hooks/lib/concurrency-lock"));
const provPath = require.resolve(path.join(ROOT, "scripts/hooks/lib/providers"));
const out = { slotTimeoutMs: null, runProviderTimeoutMs: null };
function emit() { process.stdout.write("__PROBE__" + JSON.stringify(out) + "\\n"); }
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const resolved = (() => { try { return require.resolve(request, { paths: parent ? [path.dirname(parent.filename)] : undefined }); } catch { return null; } })();
  if (resolved === lockPath) {
    return {
      acquireSlotSync: (provider, opts) => { out.slotTimeoutMs = opts && opts.timeoutMs; return { provider, fake: true }; },
      releaseSlot: () => {},
    };
  }
  if (resolved === provPath) {
    const real = origLoad.apply(this, arguments);
    return Object.assign({}, real, {
      // Force the cross-provider lane reachable regardless of whether the gemini
      // CLI is installed in this environment — the probe is about the BOUND the
      // child computes, not a real provider call.
      providerAvailable: () => true,
      getProviderForRole: () => "gemini",
      runProvider: (role, prompt, opts) => {
        out.runProviderTimeoutMs = opts && opts.timeoutMs;
        emit();
        process.exit(0); // stop before any real provider work
      },
    });
  }
  return origLoad.apply(this, arguments);
};
`;

function runChildAndCaptureBounds(setEnv = {}, deleteEnv = [], background = false) {
  const tmpShim = path.join(os.tmpdir(), `t322-shim-${process.pid}-${Math.random().toString(36).slice(2)}.js`);
  const tmpPrompt = path.join(os.tmpdir(), `t322-prompt-${process.pid}-${Math.random().toString(36).slice(2)}.txt`);
  fs.writeFileSync(tmpShim, SHIM);
  fs.writeFileSync(tmpPrompt, "probe prompt for T-322 bound capture\n");
  try {
    const env = {
      ...process.env,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + " " : ""}--require ${tmpShim}`,
      ...setEnv,
    };
    for (const k of deleteEnv) delete env[k];
    // Default: FOREGROUND so the child clamps like the live ε-agent site (clear any
    // inherited background signal — the harness may set it for long subprocesses).
    // background=true: keep the explicit signal so the child's foregroundAwareTimeout
    // does NOT clamp (exercises the long-lane no-shrink case).
    if (background) env.WARPOS_DISPATCH_BACKGROUND = "1";
    else delete env.WARPOS_DISPATCH_BACKGROUND;
    const r = spawnSync(
      process.execPath,
      [DISPATCH_AGENT, "security-reviewer", tmpPrompt, "--provider", "gemini"],
      { encoding: "utf8", env, timeout: 60000 }
    );
    const line = String(r.stdout || "").split(/\r?\n/).find((l) => l.startsWith("__PROBE__"));
    if (!line) return { error: `no probe line; stdout=${(r.stdout || "").slice(0, 200)} stderr=${(r.stderr || "").slice(0, 200)}` };
    return JSON.parse(line.slice("__PROBE__".length));
  } finally {
    try { fs.unlinkSync(tmpShim); } catch {}
    try { fs.unlinkSync(tmpPrompt); } catch {}
  }
}

console.log("\n(5) epsilon-agent-parent-strictly-exceeds-child-REAL-bounds (T-322 — child CONSUMES the propagated bound):");
{
  // For each opts.timeoutMs the parent might pass, compute what the parent would do
  // (childBaseMs = clamp; parent = childBaseMs + grace) and assert the REAL child bounds
  // (slot + runProvider), captured from the actual dispatch-agent.js, are both ≤ childBaseMs
  // and STRICTLY below the parent — closing the cross-provider death-record race.
  const cases = [
    { label: "small (1000)", childBaseMs: foregroundAwareTimeout(1000, {}) },
    { label: "huge (9_000_000)", childBaseMs: foregroundAwareTimeout(9000000, {}) },
    { label: "unset (epsilon-agent default)", childBaseMs: foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-agent"], {}) },
  ];
  for (const c of cases) {
    const parent = c.childBaseMs + GRACE; // what epsilon-runtime sizes its SIGTERM bound to
    const bounds = runChildAndCaptureBounds(
      { DISPATCH_BUILDER_TIMEOUT_MS: String(c.childBaseMs) },
      ["DISPATCH_SLOT_TIMEOUT_MS"], // the propagated bound must be the ONLY slot source
    );
    if (bounds.error) {
      ok(`epsilon-agent / ${c.label}: child probe ran`, false, bounds.error);
      continue;
    }
    // (a) propagation present (sanity — same as section 4 but proven via the real child).
    ok(
      `epsilon-agent / ${c.label}: child slot bound is set (consumed, not defaulted)`,
      bounds.slotTimeoutMs != null,
      `slot=${bounds.slotTimeoutMs}`,
    );
    // (b) the child's EFFECTIVE slot bound (derived from the propagated value) <= childBaseMs.
    ok(
      `epsilon-agent / ${c.label}: child slot bound <= childBaseMs (single-sourced, not 600s default)`,
      bounds.slotTimeoutMs <= c.childBaseMs,
      `slot=${bounds.slotTimeoutMs} childBaseMs=${c.childBaseMs}`,
    );
    // (c) the child's EFFECTIVE runProvider timeoutMs (derived) <= childBaseMs.
    ok(
      `epsilon-agent / ${c.label}: child runProvider timeoutMs <= childBaseMs (single-sourced, not run-provider default)`,
      bounds.runProviderTimeoutMs != null && bounds.runProviderTimeoutMs <= c.childBaseMs,
      `runProvider=${bounds.runProviderTimeoutMs} childBaseMs=${c.childBaseMs}`,
    );
    // (d) parent (childBaseMs + grace) STRICTLY exceeds BOTH child bounds.
    ok(
      `epsilon-agent / ${c.label}: parent (childBaseMs+grace) STRICTLY exceeds child slot bound`,
      parent > bounds.slotTimeoutMs,
      `parent=${parent} slot=${bounds.slotTimeoutMs}`,
    );
    ok(
      `epsilon-agent / ${c.label}: parent (childBaseMs+grace) STRICTLY exceeds child runProvider bound`,
      parent > bounds.runProviderTimeoutMs,
      `parent=${parent} runProvider=${bounds.runProviderTimeoutMs}`,
    );
  }

  // Non-ε caller (env ABSENT): behaviour unchanged — the slot keeps the 600s default and
  // runProvider gets NO opts.timeoutMs (its own default applies). This guards the
  // default-preservation clause: only ε's propagation single-sources the child.
  const noEnv = runChildAndCaptureBounds({}, ["DISPATCH_BUILDER_TIMEOUT_MS", "DISPATCH_SLOT_TIMEOUT_MS"]);
  if (noEnv.error) {
    ok("non-ε caller: child probe ran", false, noEnv.error);
  } else {
    ok(
      "non-ε caller (no DISPATCH_BUILDER_TIMEOUT_MS): slot keeps 600s default (no regression)",
      noEnv.slotTimeoutMs === 10 * 60 * 1000,
      `slot=${noEnv.slotTimeoutMs}`,
    );
    ok(
      "non-ε caller: runProvider gets no opts.timeoutMs (its own default applies)",
      noEnv.runProviderTimeoutMs === undefined,
      `runProvider=${noEnv.runProviderTimeoutMs}`,
    );
  }
}

// ── (6) β BUILD-CONSTRAINT (DECIDE 0.90): the accepted foreground slot-wait shrink ──
//
// CHOICE (b): when childBaseMs is FOREGROUND-clamped (540s), the derived slot wait is
// intentionally BELOW the old 600s DISPATCH_SLOT_TIMEOUT_MS default — accepted as correct
// fallback (a foreground dispatch can't run long, so failing over to claude sooner beats
// burning the budget on a slot it could never use). A 600s FLOOR was rejected because it
// would make slot > childBaseMs and re-open the race. This section PINS that decision so a
// future "restore the 600s floor" change (which would silently re-open the race) REDs here.
const FG_CEILING = foregroundAwareTimeout(9000000, {}); // 540000
console.log("\n(6) β build-constraint — foreground slot-wait shrink ACCEPTED, background unaffected:");
{
  // Foreground ε dispatch: slot wait == childBaseMs (540s) < old 600s default — the accepted
  // shrink — AND parent (585s) still strictly exceeds it.
  const fg = runChildAndCaptureBounds(
    { DISPATCH_BUILDER_TIMEOUT_MS: String(FG_CEILING) },
    ["DISPATCH_SLOT_TIMEOUT_MS"],
  );
  if (fg.error) {
    ok("foreground ε: child probe ran", false, fg.error);
  } else {
    ok(
      "foreground ε: slot wait is the accepted shrink (== 540s clamp, < old 600s default)",
      fg.slotTimeoutMs === FG_CEILING && fg.slotTimeoutMs < 10 * 60 * 1000,
      `slot=${fg.slotTimeoutMs} ceiling=${FG_CEILING}`,
    );
    ok(
      "foreground ε: parent (childBaseMs+grace) STILL strictly exceeds the shrunk slot wait",
      FG_CEILING + GRACE > fg.slotTimeoutMs,
      `parent=${FG_CEILING + GRACE} slot=${fg.slotTimeoutMs}`,
    );
  }

  // BACKGROUND ε dispatch: childBaseMs = full 900s (> 600s) → NO shrink. A saturated provider
  // that genuinely needs ~600s to free a slot is unaffected. Drive the child with the explicit
  // background signal so its own foregroundAwareTimeout does NOT clamp.
  const bgBase = WRAPPER_DEFAULTS["epsilon-agent"]; // 900000 raw
  const bg = runChildAndCaptureBounds(
    { DISPATCH_BUILDER_TIMEOUT_MS: String(bgBase) },
    ["DISPATCH_SLOT_TIMEOUT_MS"],
    /*background=*/ true,
  );
  if (bg.error) {
    ok("background ε: child probe ran", false, bg.error);
  } else {
    ok(
      "background ε: slot wait keeps the full bound (>= old 600s — no shrink for the long lane)",
      bg.slotTimeoutMs === bgBase && bg.slotTimeoutMs >= 10 * 60 * 1000,
      `slot=${bg.slotTimeoutMs} bgBase=${bgBase}`,
    );
  }
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — epsilon-spawn-grace: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
