#!/usr/bin/env node
/**
 * memory-guard.js — PreToolUse hook for Bash + Edit|Write.
 *
 * Protects critical data files from unauthorized overwrites:
 * - events.jsonl: append-only (must go through logger.js)
 * - learnings.jsonl: append-only (must go through assess-session.js)
 * - systems.jsonl: protected from truncation
 *
 * Closes: event log append-only (GAP), memory file integrity, learning count bounds.
 * Fail-closed: parse errors → BLOCK.
 */

const fs = require("fs");
const path = require("path");
const { PROJECT, relPath, PATHS } = require("./lib/paths");
const { logEvent } = require("./lib/logger");

const PROTECTED_FILES = [
  "events.jsonl",
  "learnings.jsonl",
  "systems.jsonl",
  "traces.jsonl",
];

// Build protected paths dynamically from paths.json (never hardcode)
const eventsDir =
  PATHS.events || path.join(PROJECT, ".claude", "project", "events");
const memoryDir =
  PATHS.memory || path.join(PROJECT, ".claude", "project", "memory");
const PROTECTED_PATHS = [
  relPath(path.join(eventsDir, "events.jsonl")),
  relPath(path.join(memoryDir, "learnings.jsonl")),
  relPath(path.join(memoryDir, "systems.jsonl")),
  relPath(path.join(memoryDir, "traces.jsonl")),
];

function block(reason) {
  logEvent("block", "system", "memory-guard-blocked", "", reason);
  console.log(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

function isProtectedPath(filePath) {
  const rel = relPath(filePath);
  return PROTECTED_PATHS.some((p) => rel === p || rel.endsWith("/" + p));
}

function isProtectedFile(str) {
  return PROTECTED_FILES.some((f) => str.includes(f));
}

// Strip the parts of a Bash command where a protected filename can appear as
// PROSE rather than as a write target: heredoc bodies and commit-message args.
// A `git commit -m "restored events.jsonl"` or a heredoc body mentioning a
// protected file must not be read as a write to that file. Source: G3.2.
function stripNonTargetText(cmd) {
  let s = cmd;
  // Shell comments: a `#` that starts a word (preceded by start/whitespace)
  // runs to end of line. A protected filename inside a trailing comment is
  // prose, never a write target. (Approximate: ignores `#` inside quotes, which
  // is acceptable here — we only need to stop false positives.)
  s = s.replace(/(^|\s)#[^\n]*/g, "$1");
  // Heredoc bodies: <<EOF ... EOF and <<'EOF' ... EOF and <<-EOF ... EOF.
  // Capture the (quoted-or-bare) tag, then drop everything up to a line that
  // is exactly that tag (optionally indented for <<-).
  s = s.replace(
    /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[\s\S]*?^\s*\2\s*$/gm,
    " ",
  );
  // Same heredocs when the command arrives as a single line with literal \n.
  s = s.replace(
    /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[\s\S]*?\\n\s*\2(?=\\n|$|\s)/g,
    " ",
  );
  // Commit-message arguments: -m "..."/'...' and --message=... — the body is
  // prose, not a path. Drop the quoted value (or the bare token after =).
  s = s.replace(/(^|\s)(-m|--message)(\s+|=)(".*?"|'.*?'|\S+)/g, "$1");
  // -F/--file <msgfile>: the message FILE is read, not written. Drop the arg so
  // a message file named to mention a protected path isn't treated as a target.
  s = s.replace(/(^|\s)(-F|--file)(\s+|=)(".*?"|'.*?'|\S+)/g, "$1");
  return s;
}

// Extract the REAL write targets from a (already message/heredoc-stripped)
// command: redirect targets (`>`/`>>`/`tee`), and cp/mv/rm operands. Returns a
// single string we can substring-test for protected filenames — but only over
// tokens that are genuinely write destinations, never the whole command.
function writeTargetsText(strippedCmd) {
  // `git rm`/`git mv`/`git cp` are version-controlled, recoverable mutations —
  // NOT raw filesystem destruction. `git rm --cached <file>` only unstages
  // (index-only, file untouched on disk). Neutralize the leading `git ` so the
  // cp/mv/rm operand scanner below doesn't treat the verb inside `git rm` as a
  // bare `rm`. Mirrors merge-guard.js's `if (/\bgit\s+rm\b/.test(s)) continue;`.
  // Without this, `git rm --cached events.jsonl && echo done` false-positives
  // (the `echo` taints the allSafe early-exit, then `\b(rm)\b` matches inside
  // `git rm`). Source: 2026-06-04 memory-guard git-rm-cached false-positive.
  const s = strippedCmd.replace(/\bgit\s+(rm|mv|cp)\b/g, "git __vcs_$1__");
  const targets = [];
  // 1. Redirect targets: `>file`, `> file`, `>>file` (but not fd dups `>&2`,
  //    and not the `2>`/`1>` fd prefix — the path is what follows `>`).
  const redir = /(?<!=)>>?\s*([^\s>&|;]+)/g;
  let m;
  while ((m = redir.exec(s)) !== null) {
    targets.push(m[1]);
  }
  // 2. tee targets: `tee file`, `tee -a file ...` (every non-flag operand).
  const tee = /\btee\b((?:\s+(?:-\S+|[^\s|;&]+))*)/g;
  while ((m = tee.exec(s)) !== null) {
    for (const tok of m[1].split(/\s+/).filter(Boolean)) {
      if (!tok.startsWith("-")) targets.push(tok);
    }
  }
  // 3. cp/mv/rm operands. For cp/mv the destination is the last operand; for rm
  //    every non-flag operand is a delete target. Collect all operands — a
  //    protected file appearing as ANY operand of these is a real mutation.
  //    (The `git __vcs_rm__` rewrite above means git-tracked removals no longer
  //    match here — they're recoverable and intentionally allowed.)
  const fileops = /\b(cp|mv|rm)\b((?:\s+(?:-\S+|[^\s|;&]+))*)/g;
  while ((m = fileops.exec(s)) !== null) {
    for (const tok of m[2].split(/\s+/).filter(Boolean)) {
      if (!tok.startsWith("-")) targets.push(tok);
    }
  }
  return targets.join(" ");
}

// `truncate [-s N] file...` operands — the file(s) it truncates. Kept separate
// from writeTargetsText because truncate's operands aren't redirect/cp/mv/rm.
function truncateTargets(strippedCmd) {
  const out = [];
  const re = /\btruncate\b((?:\s+(?:-\S+|[^\s|;&]+))*)/g;
  let m;
  while ((m = re.exec(strippedCmd)) !== null) {
    for (const tok of m[1].split(/\s+/).filter(Boolean)) {
      // skip flags and the `-s N` size value
      if (tok.startsWith("-")) continue;
      out.push(tok);
    }
  }
  return out.join(" ");
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    const toolName = event.tool_name || "";

    // PostToolUse — advisory learning count check
    if (event.tool_response !== undefined) {
      if (toolName === "Write" || toolName === "Edit") {
        const filePath = (event.tool_input || {}).file_path || "";
        if (filePath.includes("learnings.jsonl")) {
          try {
            const absPath = path.join(memoryDir, "learnings.jsonl");
            if (fs.existsSync(absPath)) {
              const content = fs.readFileSync(absPath, "utf8").trim();
              const lines = content ? content.split("\n") : [];
              let activeCount = 0;
              for (const line of lines) {
                try {
                  const entry = JSON.parse(line);
                  if (
                    entry.status !== "implemented" &&
                    entry.effective !== false
                  ) {
                    activeCount++;
                  }
                } catch {
                  /* skip malformed lines */
                }
              }
              if (activeCount > 100) {
                process.stderr.write(
                  `\x1b[33m[memory-guard] WARN: ${activeCount} active learnings (target: 60-100). Consider pruning with /learn:conversation.\x1b[0m\n`,
                );
                logEvent(
                  "warn",
                  "system",
                  "learning-count-high",
                  "",
                  `${activeCount} active learnings exceeds 100 target`,
                );
              }
            }
          } catch {
            /* count check is advisory — don't block */
          }
        }
      }
      process.exit(0);
    }

    // === PreToolUse mode ===

    // Handle Bash commands
    if (toolName === "Bash") {
      const command = (event.tool_input || {}).command || "";
      const cmd = command.trim();

      if (!cmd || !isProtectedFile(cmd)) {
        process.exit(0);
      }

      // Allow appendFileSync — that's the legitimate append path
      if (/appendFileSync/.test(cmd) && !/writeFileSync/.test(cmd)) {
        process.exit(0);
      }

      // Allow setup-system.js (first-time initialization)
      if (cmd.includes("setup-system")) {
        process.exit(0);
      }

      // Allow read-only and safe operations
      // Check all commands in && chains (e.g., "cd /path && git add ...")
      const subCmds = cmd.split(/\s*&&\s*/);
      const allSafe = subCmds.every(
        (c) =>
          /^\s*(cd|cat|head|tail|less|more|wc|grep|rg|find|ls|git)\s/.test(c) ||
          /^\s*node\s.*query/.test(c) ||
          /^\s*$/.test(c),
      );
      if (allSafe) {
        process.exit(0);
      }

      // Drop prose where a protected filename can appear harmlessly (heredoc
      // bodies, -m/-F commit-message args), then strip fd-to-fd redirects
      // (2>&1, 1>&2) and 2>/dev/null — none of these are file overwrites and
      // must not trigger the guard. G3.2: a commit MESSAGE that merely mentions
      // events.jsonl must not be read as a write to it.
      const cmdNoProse = stripNonTargetText(cmd);
      const cmdForRedirectCheck = cmdNoProse
        .replace(/\d?>&\d+/g, "")
        .replace(/\d?>\s*\/dev\/(null|stderr|stdout)/g, "");

      // Build the set of REAL write targets (redirect/tee/cp/mv/rm operands).
      // Every block below tests against THIS, never the whole command — so a
      // protected filename in a comment, message, or heredoc body is ignored.
      const targets = writeTargetsText(cmdForRedirectCheck);
      const targetsProtected = (f) => targets.includes(f);

      // Allow append redirects (>>) — append is the legitimate path for these
      // append-only files (logger.js / appendFileSync). Only `>` overwrite is a
      // truncation. If the only redirect is an append, let it through.
      if (
        />>/.test(cmdForRedirectCheck) &&
        !/(?<![>])>\s*[^>]/.test(cmdForRedirectCheck.replace(/>>/g, ""))
      ) {
        process.exit(0);
      }

      // Block truncation/overwrite patterns. Each checks a REAL write target.
      // 1. Redirect OVERWRITE: `> file` (not `>>`, not a fd dup) to a protected
      //    file. The append `>>` form was already allowed above.
      if (
        /(?<!=)>\s*[^>&]/.test(cmdForRedirectCheck) &&
        !/>>/.test(cmdForRedirectCheck.split(">")[0] + ">")
      ) {
        for (const f of PROTECTED_FILES) {
          const overwriteTarget = /(?<!=)(?<!>)>\s*([^\s>&|;]+)/.exec(
            cmdForRedirectCheck,
          );
          if (overwriteTarget && overwriteTarget[1].includes(f)) {
            block(
              `Overwrite redirect to ${f} blocked. Use logger.js for events or appendFileSync for memory files.`,
            );
          }
        }
      }

      // 2. writeFileSync targeting a protected file (the path is the call's
      //    first arg, not anywhere in the command).
      if (/writeFileSync/.test(cmdNoProse)) {
        for (const f of PROTECTED_FILES) {
          const wfsArg = new RegExp(
            "writeFileSync\\s*\\(\\s*[`'\"][^`'\"]*" +
              f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          );
          if (wfsArg.test(cmdNoProse)) {
            block(
              `writeFileSync on ${f} blocked. These files are append-only. Use logger.js or appendFileSync.`,
            );
          }
        }
      }

      // 3. truncate — the protected file must be an actual operand.
      if (/\btruncate\b/.test(cmdNoProse)) {
        for (const f of PROTECTED_FILES) {
          if (targetsProtected(f) || truncateTargets(cmdNoProse).includes(f)) {
            block(`truncate on ${f} blocked. These files are append-only.`);
          }
        }
      }

      // 4. rm — the protected file must be an actual rm operand, not text in a
      //    comment or message (G3.2 false-positive class).
      if (/\brm\b/.test(cmdNoProse)) {
        for (const f of PROTECTED_FILES) {
          if (targetsProtected(f)) {
            block(`rm on ${f} blocked. These files are append-only.`);
          }
        }
      }

      // 5. echo/printf OVERWRITE (echo "" > file) — exclude >> (append) and fd
      //    redirects. Only fires when a protected file is the redirect TARGET.
      if (
        /\b(echo|printf)\b/.test(cmdNoProse) &&
        /(?<!=)(?<!>)>\s*[^>&]/.test(cmdForRedirectCheck)
      ) {
        for (const f of PROTECTED_FILES) {
          const overwriteTarget = /(?<!=)(?<!>)>\s*([^\s>&|;]+)/.exec(
            cmdForRedirectCheck,
          );
          if (overwriteTarget && overwriteTarget[1].includes(f)) {
            block(
              `echo/printf redirect to ${f} blocked. These files are append-only.`,
            );
          }
        }
      }

      process.exit(0);
    }

    // Handle Edit|Write tool calls
    if (toolName === "Edit" || toolName === "Write") {
      const filePath = (event.tool_input || {}).file_path || "";

      if (!filePath) {
        process.exit(0);
      }

      // Block direct Edit/Write to events.jsonl — must go through logger.js
      if (filePath.includes("events.jsonl") && isProtectedPath(filePath)) {
        block(
          "Direct Edit/Write to events.jsonl blocked. Use logger.js (appendFileSync) for event logging.",
        );
      }

      // Block Write (full overwrite) to learnings/traces/systems
      // Edit is allowed (surgical changes), Write would truncate
      if (toolName === "Write" && isProtectedPath(filePath)) {
        block(
          `Write (full overwrite) to ${path.basename(filePath)} blocked. Use Edit for surgical changes or appendFileSync for appending.`,
        );
      }

      process.exit(0);
    }

    // Not a tool we handle
    process.exit(0);
  } catch (e) {
    // Fail-closed on parse error
    logEvent(
      "block",
      "system",
      "memory-guard-parse-error",
      "",
      String(e).slice(0, 200),
    );
    console.log(
      JSON.stringify({
        decision: "block",
        reason:
          "memory-guard: parse error (fail-closed) — " +
          String(e).slice(0, 100),
      }),
    );
    process.exit(0);
  }
});
