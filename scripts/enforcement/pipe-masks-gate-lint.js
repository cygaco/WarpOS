"use strict";
/**
 * pipe-masks-gate-lint.js (SP-20260723-003 / ED-258b) — the CLAUDE.md Tool-Use "pipe masks a gate's exit"
 * enforcer. A gate piped through a PASSTHROUGH filter (tail/head/tee/cat/less/more — all exit 0 regardless
 * of the upstream) and then chained with `&&`/`;` runs the next step even when the gate exited non-zero,
 * because a pipeline's status is its LAST stage. α committed this sin 3× on 2026-07-22 (a stale-manifest
 * commit + ε2's rc-read both slipped past RED gates in one session).
 *
 * Scans FENCED command blocks (```bash / ```sh / ```shell) in `.md` files under the dev-tooling layer
 * (.claude/commands, .claude/agents, repo-root docs) — fenced-only, so the CLAUDE.md rule's own INLINE
 * prose example does not self-trip (the enforcer-embeds-its-trigger class). A line carrying the pragma
 * `pipe-masks-gate-lint:allow` is skipped (a sanctioned illustrative example).
 *
 * Flags the GENERAL shape (β): `<cmd> | <passthrough> [args] (&& | ;) <next>`. Exit 0 clean · 1 finding ·
 * 2 fail-closed (a scan root unreadable — never a silent green).
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");

const SCAN_ROOTS = [".claude/commands", ".claude/agents"];
const ROOT_DOCS = ["CLAUDE.md", "AGENTS.md", "AGENT-STRUCTURE.md", "PROJECT.md", "ROADMAP.md"];
const SKIP_DIRS = new Set(["node_modules", ".git", "runtime", "_reports"]);
const PRAGMA = "pipe-masks-gate-lint:allow";
const FENCE_RE = /^```(bash|sh|shell)\b/i;
// A gate piped to a passthrough filter (exits 0, masking upstream) then chained with && or ;.
// r3e — TOKENIZED (was a single MASK_RE): security R3D-PIPE-001 found the regex UNDER-matched (a quoted
// command token `| "tail"` was blanked before matching; a backslash path `| .\tail` / `| C:\..\more.com`
// wasn't canonicalized — the NATIVE path form on this Windows repo), and backend 7G-009 found it OVER-matched
// (`\btail\b` flagged `tail-wrapper`/`head-helper` — distinct execs). ONE tokenizer closes BOTH: split the
// pipeline into stages on UNQUOTED `|`, take each stage's command WORD (leading quote unwrapped, basename
// after the last `/` OR `\`, Windows exec-ext stripped, lowercased), and require it to be EXACTLY a
// passthrough (a real terminator, not a prefix) — then require an unquoted `&&`/`;` chain after it.
const PASSTHROUGH_SET = new Set(["tail", "head", "tee", "cat", "less", "more"]);
const WIN_EXEC_EXT_RE = /\.(?:exe|com|bat|cmd)$/i;

function findMdFiles(absRoot, out, unreadable) {
  let entries;
  try { entries = fs.readdirSync(absRoot, { withFileTypes: true }); }
  catch (e) { unreadable.push(`${absRoot} (${e.code || e.message})`); return; } // qa r2 #3: never silent
  for (const e of entries) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) findMdFiles(path.join(absRoot, e.name), out, unreadable); }
    else if (e.isFile() && e.name.endsWith(".md")) out.push(path.join(absRoot, e.name));
  }
}

/**
 * stripComment(s) — cut a SHELL comment: a `#` is a comment marker only at line-start OR after UNESCAPED
 * token-separating whitespace (backend r3 7G-003), and NEVER inside a quoted span (a `#` in "a # b" is data).
 * A backslash escapes the FOLLOWING char, so `\#` is a literal `#` AND `out\ #tag` is an escaped SPACE (the
 * `#` is mid-token, part of the filename) — neither starts a comment. Walks the string tracking quote-state +
 * backslash-escape (r3e: quotes are no longer pre-blanked — the tokenizer needs them) so parity is exact.
 */
function stripComment(s) {
  let prevBoundary = true; // start-of-line is a token boundary
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; prevBoundary = false; continue; }
    if (c === "\\") { i++; prevBoundary = false; continue; } // skip the escaped char; it is NOT a boundary
    if (c === '"' || c === "'") { q = c; prevBoundary = false; continue; }
    if (c === "#" && prevBoundary) return s.slice(0, i);
    prevBoundary = /\s/.test(c);
  }
  return s;
}

/**
 * splitPipeStages(s) — split a logical line into pipeline stages on UNQUOTED single `|`. A `|` inside quotes
 * is data; `||` is logical-or (a control operator, NOT a pipe stage) so a passthrough after it isn't masked
 * (prevents a `cat x || tail y && next` false-positive).
 */
function splitPipeStages(s) {
  const stages = [];
  let cur = "", q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === "|") {
      if (s[i + 1] === "|") { cur += "||"; i++; continue; } // || is logical-or, not a pipe split
      stages.push(cur); cur = "";
      continue;
    }
    cur += c;
  }
  stages.push(cur);
  return stages;
}

/**
 * stageCommandBasename(stage) — the stage's command WORD reduced to a canonical basename: the first
 * whitespace/pipe-delimited token (a LEADING quoted token is unwrapped so `"tail"` -> tail), basename after
 * the last `/` OR `\` (both separators — backslash is native on Windows), a Windows exec ext stripped,
 * lowercased. `C:\..\more.com` -> "more" (security under-match closed); `tail-wrapper` -> "tail-wrapper"
 * (backend 7G-009 over-match closed by the EXACT set membership at the call site — a prefix is not a match).
 */
function stageCommandBasename(stage) {
  const s = stage.replace(/^\s+/, "");
  let tok = "", q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; else tok += c; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (/\s/.test(c) || c === "|") break;
    tok += c;
  }
  const base = (tok.match(/[^/\\]+$/) || [tok])[0];
  return base.replace(WIN_EXEC_EXT_RE, "").toLowerCase();
}

/**
 * hasUnquotedChain(s) — is there an UNQUOTED `&&` or `;` followed by a non-empty command? A `;`/`&&` inside
 * quotes (`| tee "a;b"`) is data, not a chain (backend r2 #8). `s` is already comment-stripped by the caller.
 */
function hasUnquotedChain(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === "\\") { i++; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if ((c === ";" || (c === "&" && s[i + 1] === "&")) && /\S/.test(s.slice(c === ";" ? i + 1 : i + 2))) return true;
  }
  return false;
}

/**
 * hasPipeMask(logical) — the GENERAL masked-gate shape: a PASSTHROUGH command at some pipe stage (>=1, i.e.
 * after a `|`), followed EVENTUALLY by an unquoted `&&`/`;` chain (the passthrough need NOT be last —
 * security r2 #5). Comment stripped first; grep-as-gate stays exempt (its basename isn't in the set).
 */
function hasPipeMask(logical) {
  const line = stripComment(logical);
  const stages = splitPipeStages(line);
  for (let si = 1; si < stages.length; si++) {
    if (!PASSTHROUGH_SET.has(stageCommandBasename(stages[si]))) continue;
    if (hasUnquotedChain(stages.slice(si).join("|"))) return true;
  }
  return false;
}

/**
 * scanText(text) -> [{ line, code }] — offending lines inside fenced bash/sh/shell blocks. Shell
 * line-continuations (`\` at end of line) are JOINED into one logical line first (security r2 #5: a
 * passthrough split from its `&&` across a continuation), reported at the FIRST physical line. Quoted/
 * comment spans are stripped before matching (backend r2 #8).
 */
function scanText(text) {
  const findings = [];
  const lines = String(text || "").split("\n");
  let inFence = false;
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    if (FENCE_RE.test(raw.trim())) { inFence = true; i++; continue; }
    if (inFence && raw.trim().startsWith("```")) { inFence = false; i++; continue; }
    if (!inFence) { i++; continue; }
    const startLine = i;
    let logical = raw;
    while (/\\\s*$/.test(logical) && i + 1 < lines.length) { logical = logical.replace(/\\\s*$/, " ") + lines[i + 1]; i++; }
    if (!logical.includes(PRAGMA) && hasPipeMask(logical)) {
      findings.push({ line: startLine + 1, code: logical.trim().slice(0, 200) });
    }
    i++;
  }
  return findings;
}

function collectFiles(unreadable) {
  const files = [];
  for (const r of SCAN_ROOTS) findMdFiles(path.join(ROOT, r), files, unreadable);
  for (const d of ROOT_DOCS) { const p = path.join(ROOT, d); if (fs.existsSync(p)) files.push(p); }
  return files;
}

if (require.main === module) {
  const unreadable = [];
  const files = collectFiles(unreadable);
  const hits = [];
  for (const f of files) {
    let text;
    try { text = fs.readFileSync(f, "utf8"); } catch (e) { unreadable.push(`${path.relative(ROOT, f)} (${e.code || e.message})`); continue; }
    for (const h of scanText(text)) hits.push({ file: path.relative(ROOT, f), ...h });
  }
  // qa r2 #3: an unreadable mandated scan surface is FAIL-CLOSED (exit 2) — never a silent OK.
  if (unreadable.length) {
    process.stderr.write(`pipe-masks-gate-lint: FAIL-CLOSED — ${unreadable.length} scan root/file unreadable (mandated surface not scanned):\n`);
    for (const u of unreadable) process.stderr.write(`  ${u}\n`);
    process.exit(2);
  }
  if (hits.length === 0) {
    process.stdout.write(`pipe-masks-gate-lint: OK — no pipe-masks-gate patterns in ${files.length} scanned command doc(s).\n`);
    process.exit(0);
  }
  process.stderr.write("pipe-masks-gate-lint: FAIL — a gate piped through a passthrough filter then chained (&&/;) — the pipe masks the gate's exit:\n");
  for (const h of hits) process.stderr.write(`  ${h.file}:${h.line}  ${h.code}\n`);
  process.stderr.write("Fix: run the gate as its OWN command and read its real exit code; truncate output separately if needed (CLAUDE.md Tool-Use). Add `# pipe-masks-gate-lint:allow` to a sanctioned illustrative line.\n");
  process.exit(1);
}

module.exports = { scanText, hasPipeMask, stageCommandBasename };
