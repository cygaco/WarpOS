#!/usr/bin/env node
// Stop hook (HYGIENE Rule 64 — retro-completeness). If a session is ending on
// a skeleton-test<N> branch AND retros/<N>/RETRO.md does not exist, surface
// the gap.
//
// Two modes:
//   - default (advisory): exits 0 with a stderr warning. 26% historical
//     miss rate (run-9 cross-session inbox: moc2ua2s, mocaecxt, mocd8rff).
//   - enforced: pass `--enforce` argv OR set RETRO_ENFORCE=1 in env. Exits 2
//     and blocks session close until /oneshot:retro is run. Flip the default
//     to enforce after one clean session passes through it.
//
// Runs as a Stop hook BEFORE session-stop.js so the warning is visible in
// the same shutdown emit.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  // Computed before the try so both catches below can apply the governance
  // ruling: under an explicit enforce flag, a runner failure must block;
  // the absent-input path (not on a skeleton branch, or advisory mode's
  // by-design non-blocking nature) stays a legitimate SKIP.
  const enforce =
    process.argv.includes("--enforce") ||
    process.env.RETRO_ENFORCE === "1" ||
    process.env.RETRO_ENFORCE === "true";
  try {
    const PROJECT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

    // Resolve retros dir via paths.json (oneshotRetros key added run-9 fix pass)
    let retrosDir;
    try {
      const paths = JSON.parse(
        fs.readFileSync(path.join(PROJECT, ".claude", "paths.json"), "utf8"),
      );
      retrosDir = path.join(PROJECT, paths.oneshotRetros);
    } catch {
      retrosDir = path.join(
        PROJECT,
        ".claude",
        "agents",
        "president",
        ".system",
        "oneshot",
        "retros",
      );
    }

    let branch = "";
    try {
      branch = execSync("git branch --show-current", {
        cwd: PROJECT,
        encoding: "utf8",
      }).trim();
    } catch (e) {
      // ED-379-class: this is a RUNNER failure (git unavailable/errored), not
      // an absent-input case. Under an explicit enforce flag, a runner
      // failure must block (we cannot rule out being on a skeleton branch
      // with a missing retro); under default advisory mode this hook never
      // blocks by design, so skip is the mode-consistent behavior.
      if (enforce) {
        process.stderr.write(
          `\n[retro-presence-check] BLOCKED (Rule 64 enforced): could not determine the current branch (${e && e.message ? e.message.split("\n")[0] : "runner failure"}) — failing closed; cannot verify retro obligation.\n\n`,
        );
        process.exit(2);
      }
      process.exit(0);
    }
    const m = branch.match(/^skeleton-test(\d+)$/);
    if (!m) {
      // Not on a skeleton branch — no retro obligation (legitimate skip,
      // true regardless of enforce mode)
      process.exit(0);
    }
    const runN = m[1];
    const retroDir = path.join(retrosDir, runN);
    const retroFile = path.join(retroDir, "RETRO.md");

    if (!fs.existsSync(retroFile)) {
      const header = enforce
        ? `[retro-presence-check] BLOCKED (Rule 64 enforced): session ending on ${branch} but ${retroDir}/RETRO.md does not exist.`
        : `[retro-presence-check] WARNING (Rule 64 advisory): session ending on ${branch} but ${retroDir}/RETRO.md does not exist.`;

      process.stderr.write(
        `\n${header}\n` +
          `  Run /oneshot:retro to capture this session's learnings before the branch is gutted.\n` +
          `  26% retro-miss rate historically (run-9 cross-session inbox); ${enforce ? "enforce mode prevents the gap" : "this warning is the mitigation"}.\n\n`,
      );

      if (enforce) process.exit(2);
    }
    process.exit(0);
  } catch (e) {
    // Same governance ruling as the branch-detection catch above: enforce
    // mode fails closed on a runner failure (paths.json read is already its
    // own inner try with a safe fallback, so what reaches here is a real
    // unexpected error); advisory mode's by-design non-blocking nature makes
    // skip the mode-consistent behavior.
    if (enforce) {
      process.stderr.write(
        `\n[retro-presence-check] BLOCKED (Rule 64 enforced): unexpected error while checking retro presence (${e && e.message ? e.message.split("\n")[0] : "unknown error"}) — failing closed.\n\n`,
      );
      process.exit(2);
    }
    process.exit(0);
  }
});
