#!/usr/bin/env node
/**
 * dispatch-route-guard.js — PreToolUse Bash hook.
 *
 * Phase 0 workstream B. Blocks raw cross-provider CLI prompt invocations that
 * bypass the canonical dispatch route (`node scripts/dispatch-agent.js …`).
 *
 * Forbidden (cross-provider stdin / -p prompt patterns):
 *   - `codex exec` not preceded by `node scripts/dispatch-agent.js`
 *   - `gemini … -p` (with a prompt arg, not --help / --version)
 *   - `claude -p` *unless* immediately followed by `--agent <role>` (the
 *      documented Claude fallback path Gamma/Delta already use)
 *   - `cat <file> | (codex|gemini|claude)`
 *
 * Allowed (always):
 *   - `<provider> --version` / `--help` / `auth status` / `models list`
 *   - Anything that begins with `node scripts/dispatch-agent.js`
 *   - Commands operating on `.claude/runtime/.provider-tmp/` paths
 *   - When `WARPOS_PROVIDER_PROBE=1` is set in the harness env (one-shot
 *      health probe escape hatch; the bypass is logged.)
 *
 * Why this hook exists: raw provider CLI prompt invocation from Bash has
 * re-triggered known stdin / binding-gap failures multiple times
 * (LRN-2026-04-17 codex Windows stdin; LRN-2026-04-30 binding-gap). The
 * canonical wrapper at `scripts/dispatch-agent.js` is the only path that
 * goes through `runProvider`, which carries the Windows-stdin fix and the
 * concurrency-lock layer.
 *
 * Fail-open on parse errors. Never block on hook bugs.
 */

"use strict";

const path = require("path");

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Kill switch
if (process.env.WARPOS_DISPATCH_ROUTE_GUARD === "off") process.exit(0);

function block(reason) {
  try {
    const { logEvent } = require("./lib/logger");
    logEvent("block", "system", "dispatch-route-guard", "", reason);
  } catch {
    /* logger optional */
  }
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

function probeBypass(cmd) {
  // Honour one-shot bypass for provider-health probes. The probe path sets
  // WARPOS_PROVIDER_PROBE=1 in the harness env before launching the Bash
  // tool call. We log the bypass for audit.
  if (process.env.WARPOS_PROVIDER_PROBE === "1") {
    try {
      const { logEvent } = require("./lib/logger");
      logEvent(
        "bypass",
        "system",
        "dispatch-route-guard-probe",
        "",
        cmd.slice(0, 200),
      );
    } catch {
      /* skip */
    }
    return true;
  }
  return false;
}

// --- Pattern matchers -----------------------------------------------------

// Allow when a `<provider>` token is followed by one of these "harmless" flags
// or subcommands rather than a `-p` prompt invocation.
const SAFE_PROVIDER_TAILS =
  /^\s*(?:--version|--help|-h|-v|models?\b|auth\b|whoami\b|config\b|login\b|logout\b|completion\b)\b/;

function hasCanonicalDispatchPrefix(cmd) {
  // Accept `node scripts/dispatch-agent.js`, `node "…/dispatch-agent.js"`,
  // `node ${CLAUDE_PROJECT_DIR}/scripts/dispatch-agent.js`, and the Claude-role
  // bounded sibling dispatch-claude.js (RI-004/ED-018). The wrapper must be the
  // LEADING command of the segment (after optional `VAR=val` env prefixes) — NOT
  // merely appear somewhere — else `codex exec foo node …/dispatch-agent.js`
  // would exempt the whole segment while `codex` is the real command (reviewer-HIGH).
  return /^\s*(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*node\s+["'`]?\S*dispatch-(?:agent|claude)\.js\b/.test(
    cmd,
  );
}

function isClaudeAgentInvocation(slice) {
  // `claude -p … --agent <role>` is the documented fallback path used by
  // Gamma/Delta. Allow when `--agent` is present *anywhere* after `-p`.
  return /\bclaude\s+-p\b[\s\S]*\B--agent\b/.test(slice);
}

// RI-004 / ED-018: build-chain Claude roles silently reap under raw `claude -p`
// (the harness auto-backgrounds the long call → 0 bytes, no completion record,
// exit code lost). These MUST go through the bounded wrapper
// `scripts/dispatch-claude.js`, which converts a reap into a death record +
// non-zero exit. Non-build Claude roles (test-runner, visual-review) keep the
// raw fallback — reap-detection is less load-bearing there.
const BUILD_CHAIN_ROLES = new Set([
  "builder",
  "backend-builder",
  "frontend-builder",
  "fixer",
  "stub-scaffold",
]);

// Robust detector (reviewer-HIGH hardening): match a RAW `claude` prompt
// invocation that targets a build-chain role, in ANY flag order and with either
// `--agent <role>` or `--agent=<role>`. The bounded wrapper
// (`node scripts/dispatch-claude.js …`) takes the role POSITIONALLY and never
// emits `claude` + `-p` + `--agent`, so this cannot false-match the wrapper —
// which is why it's safe to run even when a `dispatch-claude.js` substring
// appears elsewhere in a compound command (closes the segment-exemption bypass).
// Quote-aware shell-word tokenizer: split on UNQUOTED whitespace, returning each
// word with its surrounding quotes removed. A quoted blob like `"--agent builder"`
// becomes ONE token (`--agent builder`), so it is NOT mistaken for an `--agent`
// flag followed by a role (reviewer round-5 false-RED fix).
function shellWords(s) {
  const words = [];
  let cur = "";
  let inWord = false;
  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      inWord = true;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      inWord = true;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (inWord) {
        words.push(cur);
        cur = "";
        inWord = false;
      }
      continue;
    }
    cur += ch;
    inWord = true;
  }
  if (inWord) words.push(cur);
  return words;
}

// The role of the first REAL `--agent` flag (a standalone `--agent` token whose
// next word is the role, or `--agent=<role>`). Quote-aware via shellWords, so a
// quoted `"--agent builder"` arg to some OTHER flag is skipped.
function roleFromAgentFlag(cmd) {
  const words = shellWords(cmd);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === "--agent" && i + 1 < words.length) return words[i + 1].toLowerCase();
    const m = w.match(/^--agent=(.+)$/);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

function rawBuildChainClaudeRole(cmd, scan) {
  // Confirm a REAL invocation using the quote-stripped skeleton (so a literal
  // inside quotes — e.g. `git commit -m "...claude -p --agent builder..."` — does
  // NOT match). Then extract the role with a QUOTE-AWARE tokenizer over the
  // ORIGINAL cmd, so a quoted role value (`--agent "builder"`) is captured while a
  // quoted `"--agent builder"` arg to a DIFFERENT flag is NOT mis-read (reviewer-MEDIUM).
  if (!/\bclaude\b/.test(scan)) return null; // a claude token (unquoted)
  if (!/(?:^|\s)-p\b/.test(scan)) return null; // a -p prompt flag (any position)
  if (!/--agent\b/.test(scan)) return null; // an --agent flag (unquoted)
  const role = roleFromAgentFlag(cmd);
  if (!role) return null;
  return BUILD_CHAIN_ROLES.has(role) ? role : null;
}

/**
 * Walk the command string and find the first forbidden pattern. Returns null
 * when the command is safe.
 */
// QUOTE-AWARE segment splitter (reviewer-MEDIUM): split on UNQUOTED shell
// sequencing operators `;`, `&&`, `||`, `&` (background), and newline. A `;`
// inside a quoted argument is NOT a separator (so we don't false-RED a benign
// `--arg "foo; codex exec bar"`). Single pipes `|` are kept WITHIN a segment so
// the pipe-into-provider check still sees `cat f | codex`.
function splitSegments(cmd) {
  const segs = [];
  let cur = "";
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    const next = cmd[i + 1];
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === "\\") {
      cur += ch + (next || "");
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r" || ch === ";") {
      segs.push(cur);
      cur = "";
      continue;
    }
    if ((ch === "&" && next === "&") || (ch === "|" && next === "|")) {
      segs.push(cur);
      cur = "";
      i++;
      continue;
    }
    if (ch === "&") {
      // background operator (single &) — split; `&&` already handled above.
      segs.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  segs.push(cur);
  return segs;
}

function findForbidden(rawCmd) {
  if (rawCmd === undefined || rawCmd === null) return null;
  // Segment-aware so the canonical-prefix exemption applies ONLY to the wrapper's
  // OWN segment — not to a piggy-backed raw provider call in the same compound
  // command (`node dispatch-claude.js …; codex exec …` / `… & codex …`).
  for (const seg of splitSegments(String(rawCmd))) {
    const hit = findForbiddenSegment(seg);
    if (hit) return hit;
  }
  return null;
}

// Drop quoted spans ('...', "...", `...`) so a forbidden substring that is just a
// LITERAL STRING ARGUMENT (e.g. a commit message `'fix: codex exec bug'` or
// `--arg "foo; codex exec bar"`) is not mistaken for an actual command. The real
// provider command tokens (`codex exec`, `claude -p --agent builder`) are always
// UNQUOTED, so this removes false-REDs without weakening real detection.
// (Residual: a `$(provider …)` command-substitution INSIDE double quotes does
// execute in bash but is dropped here — an exotic form no orchestrator emits;
// logged as enforcement-debt, out of this guardrail's drift-prevention scope.)
function stripQuoted(s) {
  let out = "";
  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }
    out += ch;
  }
  return out;
}

function findForbiddenSegment(rawSeg) {
  const cmd = rawSeg.replace(/\r?\n/g, " ").trim();
  if (!cmd) return null;
  // Match against the quote-stripped skeleton so literal-string args don't false-RED.
  const scan = stripQuoted(cmd);

  // RI-004 / ED-018 — checked BEFORE the canonical-prefix exemption: a raw
  // build-chain claude dispatch is forbidden even inside a compound command
  // (`node dispatch-claude.js …; claude -p --agent builder …`). The wrapper
  // never emits `claude -p --agent`, so this can't false-block it.
  const rawBuildRole = rawBuildChainClaudeRole(cmd, scan);
  if (rawBuildRole) {
    return {
      pattern: `claude -p --agent ${rawBuildRole}`,
      detail:
        "build-chain Claude roles silently REAP under raw `claude -p` (the harness auto-backgrounds the long call → 0 bytes, no completion record, exit code lost: RI-004/ED-018).",
      use: `node scripts/dispatch-claude.js ${rawBuildRole} <prompt-file> --model <m> -w`,
    };
  }

  // Pipe-into-provider: `cat foo.txt | codex exec …` / `… | gemini -p` etc.
  // Checked BEFORE the canonical exemption so a wrapper invocation that pipes its
  // result INTO a raw provider (`node dispatch-claude.js … | codex exec`) is still
  // caught (reviewer-HIGH). The pipe alone isn't forbidden — piping codex *output*
  // to grep is fine — we forbid piping INTO codex/gemini/claude prompt mode.
  const pipeMatch = scan.match(/\|\s*(codex|gemini|claude)\b([^|]*)$/);
  if (pipeMatch) {
    const [, provider, tail] = pipeMatch;
    if (!SAFE_PROVIDER_TAILS.test(tail)) {
      return {
        pattern: `cat … | ${provider} …`,
        detail:
          "piping into a cross-provider CLI as prompt input bypasses the dispatch wrapper",
      };
    }
  }

  if (hasCanonicalDispatchPrefix(scan)) return null;

  // Bare `codex exec` not in dispatch-agent.
  if (/\bcodex\s+exec\b/.test(scan)) {
    return {
      pattern: "codex exec …",
      detail:
        "codex exec must go through node scripts/dispatch-agent.js so the Windows-stdin + concurrency-lock layer applies",
    };
  }

  // `gemini … -p` (prompt invocation). Allow when next arg after gemini is a
  // safe tail.
  const geminiMatch = scan.match(/\bgemini\b\s*([\s\S]*)$/);
  if (geminiMatch) {
    const tail = geminiMatch[1];
    if (SAFE_PROVIDER_TAILS.test(tail)) {
      // safe form — version/help/etc.
    } else if (/(?:^|\s)-p\b/.test(tail)) {
      return {
        pattern: "gemini … -p …",
        detail:
          "gemini prompt invocations must go through node scripts/dispatch-agent.js",
      };
    }
  }

  // `claude -p` — only forbidden when not the documented `--agent <role>`
  // fallback form.
  const claudeMatch = scan.match(/\bclaude\s+-p\b[\s\S]*$/);
  if (claudeMatch) {
    const slice = claudeMatch[0];
    if (!isClaudeAgentInvocation(slice)) {
      // Allow `claude -p --help` etc.
      if (!SAFE_PROVIDER_TAILS.test(slice.replace(/^\s*claude\s+-p\s*/, ""))) {
        return {
          pattern: "claude -p …",
          detail:
            "raw `claude -p` prompt invocation is forbidden; use `claude -p --agent <role>` (documented fallback) or node scripts/dispatch-agent.js",
        };
      }
    }
    // A `claude -p --agent <role>` for a BUILD-CHAIN role was already caught
    // (and blocked) by rawBuildChainClaudeRole at the top. Non-build claude
    // --agent roles fall through → allowed.
  }

  return null;
}

/**
 * Non-blocking advisory: a `claude -p … --agent <role>` invocation whose prompt
 * is inlined as a command-substitution argv (`"$(cat file)"` / backtick-cat)
 * rather than piped via stdin (`< file`). The inlined form works for small
 * prompts but blows the OS arg-length limit ("Argument list too long", exit
 * 126) for the large diff-bearing reviewer/redteam fallback prompts the
 * orchestrators build (observed twice at 41KB+ in SP-20260525-004). This is
 * NOT forbidden — small prompts are fine — so we WARN, not block, and surface
 * the stdin form. Returns null when no advisory applies.
 */
function findAdvisory(rawCmd) {
  const cmd = rawCmd.replace(/\r?\n/g, " ").trim();
  if (!cmd) return null;
  // Only relevant to the documented claude --agent fallback path.
  if (!isClaudeAgentInvocation(cmd)) return null;
  // Already piping via a stdin redirect somewhere in the command → safe form.
  if (/<\s*\S/.test(cmd)) return null;
  // Prompt supplied via command substitution that inlines a file's contents:
  //   "$(cat file)"  |  $(cat file)  |  `cat file`  (cat/type/Get-Content)
  const inlinesFileSub =
    /\$\(\s*(?:cat|type|Get-Content)\b[^)]*\)/i.test(cmd) ||
    /`\s*(?:cat|type|Get-Content)\b[^`]*`/i.test(cmd);
  if (!inlinesFileSub) return null;
  return {
    advisory: "claude -p --agent with $(cat <file>) argv",
    detail:
      "large agent prompts (diff-bearing reviewer/redteam fallbacks) overflow the OS arg-length limit when inlined as an argv via $(cat …) — they die with 'Argument list too long' (exit 126). Pipe the prompt via stdin instead: `claude -p --model <m> --agent <role> < <prompt-file>`. Small prompts are unaffected; this is a warning, not a block.",
  };
}

// --- Hook plumbing --------------------------------------------------------

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    if (event.tool_name !== "Bash") process.exit(0);
    if (event.tool_response !== undefined) process.exit(0); // PostToolUse skip
    const cmd = ((event.tool_input || {}).command || "").trim();
    if (!cmd) process.exit(0);

    if (probeBypass(cmd)) process.exit(0);

    const hit = findForbidden(cmd);
    if (!hit) {
      // Non-blocking advisory: inlined-argv prompt that will overflow arg-length
      // for large fallback prompts. Surface the stdin form; do not block.
      const adv = findAdvisory(cmd);
      if (adv) {
        try {
          const { logEvent } = require("./lib/logger");
          logEvent("warn", "system", "dispatch-route-guard", "", adv.advisory);
        } catch {
          /* logger optional */
        }
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              additionalContext: `[dispatch-route-guard] ${adv.detail}`,
            },
          }),
        );
      }
      process.exit(0);
    }

    const guidePathHint = path.posix.join(
      ".claude",
      "project",
      "reference",
      "agent-dispatch-guide.md",
    );
    block(
      [
        "[dispatch-route-guard] Direct cross-provider CLI prompt invocation is forbidden.",
        `Pattern matched: ${hit.pattern}`,
        `Detail: ${hit.detail}`,
        "",
        hit.use
          ? `Use:  ${hit.use}`
          : "Use:  node scripts/dispatch-agent.js <role> <prompt-file>",
        hit.use
          ? "Why:  raw `claude -p --agent` for build-chain roles silently reaps —"
          : "Why:  raw provider prompt calls re-trigger known stdin/binding failures",
        hit.use
          ? "      the wrapper bounds the call + writes a death record + non-zero exit (RI-004/ED-018)."
          : "      (LRN-2026-04-17 Windows-stdin; LRN-2026-04-30 binding-gap).",
        "",
        "One-shot bypass for an approved provider-health probe:",
        "  PowerShell: $env:WARPOS_PROVIDER_PROBE = '1'; <command>; Remove-Item Env:WARPOS_PROVIDER_PROBE",
        "  bash:       WARPOS_PROVIDER_PROBE=1 <command>   (note: bash-inline env",
        "              may not propagate to PreToolUse hooks; prefer harness env)",
        "",
        `Full rules: ${guidePathHint} (paths.agentDispatchGuide).`,
      ].join("\n"),
    );
  } catch {
    // Fail-open on hook bugs / malformed JSON.
    process.exit(0);
  }
});

module.exports = { findForbidden, findAdvisory };
