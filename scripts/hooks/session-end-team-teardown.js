#!/usr/bin/env node
// SessionEnd hook BACKSTOP (E-LIFECYCLE-001 / S-LC-05).
//
// Requests BEST-EFFORT, project-slug-scoped teardown of THIS project's
// persistent team when a session ends WITHOUT a clean `/session:end` (the rich
// teardown path). It is a backstop, not the primary teardown:
//
//   • REQUEST-ONLY by default — calls lifecycle.teardown({ apply:false }): it
//     records the shutdown request + marks residual state, it does NOT remove
//     any team handle and NEVER force-kills a live in-process teammate (the
//     harness can't, and neither can a hook). The honest ceiling is preserved.
//   • PROJECT-SLUG-SCOPED — a foreign team (different slug, e.g. another
//     project's `doogle-sprint`) is NEVER touched. The slug filter lives in
//     lifecycle.js and the request record carries `foreignProtected` as proof.
//   • FAIL-OPEN — wrapped end-to-end in try/catch; a teardown-request failure
//     must never throw or block session end.
//   • ANCHORED — projectDir (the require() base) is derived from this hook file's
//     OWN location, NEVER from hook input (event.cwd) or an env var. See the
//     anchoredProjectDir() note below (T-20260611-324 / W1 BLOCKER).

"use strict";

const fs = require("fs");
const path = require("path");

// ── projectDir ANCHORING (T-20260611-324 / W1 BLOCKER) ───────────────────────
// SECURITY: this hook MUST NOT trust hook-input (`event.cwd`) — nor an
// attacker-controllable env var — as the base it `require()`s its manager from.
// The prior code used `process.env.CLAUDE_PROJECT_DIR || event.cwd || cwd()`,
// so an absent CLAUDE_PROJECT_DIR + an attacker-supplied `event.cwd` could
// redirect module loading + the teardown request to a FOREIGN project
// (require-redirection). The ONLY trustworthy anchor is the hook file's OWN
// location: this file lives at <repo>/scripts/hooks/session-end-team-teardown.js,
// so the repo root is two levels up from __dirname. We canonicalize it (realpath)
// so a symlinked/relative path resolves to its true on-disk location, and that
// canonical repo root is the require() base — full stop. `event.cwd` / the env
// var are CORROBORATING context only (recorded, never load-bearing). Fail-open:
// if realpath fails (it should not for our own dir), fall back to the lexical
// __dirname-anchored path — still hook-derived, never hook-input-derived.
function anchoredProjectDir() {
  const lexical = path.resolve(__dirname, "..", "..");
  try {
    return fs.realpathSync(lexical);
  } catch {
    return lexical; // realpath unavailable — still the hook-own anchor, not input
  }
}

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    let event = {};
    try {
      event = JSON.parse(input || "{}");
    } catch {
      /* malformed payload — proceed with env defaults (fail-open) */
    }
    // ANCHORED to the hook's own repo root — NEVER event.cwd / env (see above).
    const projectDir = anchoredProjectDir();
    // event.cwd + CLAUDE_PROJECT_DIR are CORROBORATING context only: recorded so
    // a mismatch is visible in the audit trail, but they NEVER drive require().
    const corroboratingCwd =
      (event && typeof event.cwd === "string" && event.cwd) ||
      process.env.CLAUDE_PROJECT_DIR ||
      null;
    const cwdMatchesAnchor = (() => {
      try {
        if (!corroboratingCwd) return null; // nothing to corroborate
        return fs.realpathSync(corroboratingCwd) === projectDir;
      } catch {
        return false; // unresolvable corroborating path → does not corroborate
      }
    })();

    let lifecycle;
    try {
      lifecycle = require(path.join(
        projectDir,
        "scripts",
        "teams",
        "lifecycle.js",
      ));
    } catch {
      // Manager unavailable (partial checkout / moved file) — fail-open silent.
      process.exit(0);
    }

    // REQUEST-ONLY backstop teardown (no handle removal, never a guaranteed kill).
    const result = lifecycle.teardown({ projectDir, apply: false });

    // Log the result (best-effort). Never claim a guaranteed kill.
    try {
      const { log } = require(path.join(
        projectDir,
        "scripts",
        "hooks",
        "lib",
        "logger.js",
      ));
      log(
        "team-lifecycle",
        {
          event: "session:end:team-kill",
          slug: result.slug,
          requested: (result.requested || []).map((r) => r.team),
          foreignProtected: result.foreignProtected || [],
          killedGuaranteed: false,
          residual: result.residual,
          // Corroborating context only — proves the anchor was hook-derived and
          // surfaces a hook-input/env cwd that disagrees with the real anchor.
          anchoredProjectDir: projectDir,
          corroboratingCwdMatches: cwdMatchesAnchor,
        },
        { actor: "session-end-team-teardown" },
      );
    } catch {
      /* logging is best-effort */
    }
    process.exit(0);
  } catch {
    // Absolute fail-open: a SessionEnd backstop must NEVER throw or block exit.
    process.exit(0);
  }
});
