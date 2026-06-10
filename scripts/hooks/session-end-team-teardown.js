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
//
// NOT wired into settings.json by this build (settings wiring is deferred to
// Alpha — see the build envelope for the exact SessionEnd entry to add).

"use strict";

const path = require("path");

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
    const projectDir =
      process.env.CLAUDE_PROJECT_DIR || event.cwd || process.cwd();

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
