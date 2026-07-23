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
const PASSTHROUGH = "tail|head|tee|cat|less|more";
// A passthrough stage ANYWHERE in the pipeline (not just the last stage — security r2 #5: `gate | tail |
// grep x && next` masks too), followed EVENTUALLY by a && or ; chain. `.*?` (not `[^|]`) so a filter after
// the passthrough (grep) doesn't hide it. grep-as-gate stays exempt: a pipeline with NO passthrough token
// never matches. `(?:\S*/)?` canonicalizes a PATH-qualified basename (backend r3 7G-006: `| /usr/bin/tail
// && next`). NAMED CEILING (β-residual): a WRAPPER-invoked passthrough (`| command tail`, `| env tail`,
// `| xargs tail`) still evades — a full shell tokenizer/exec-canonicalizer is out of scope for a doc-lint.
const MASK_RE = new RegExp("\\|\\s*(?:\\S*/)?(?:" + PASSTHROUGH + ")\\b.*?(?:&&|;)\\s*\\S");

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
 * stripQuotedAndComments(s) — blank out single/double-quoted spans + a trailing `#` comment so a `;` or
 * `&&` INSIDE a string/comment is not counted as a shell separator (backend r2 #8: `| tee "a;b"` false-
 * positive — the quoted `;` matched as a chain). Quotes are stripped FIRST (a `#` inside a quote goes with
 * it), then the trailing comment. The PRAGMA is checked on the RAW line before this, so stripping is safe.
 */
function stripQuotedAndComments(s) {
  const noQuotes = String(s)
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return stripComment(noQuotes);
}

/**
 * stripComment(s) — cut a SHELL comment: a `#` is a comment marker only at line-start OR after UNESCAPED
 * token-separating whitespace (backend r3 7G-003). A backslash escapes the FOLLOWING char, so `\#` is a
 * literal `#` AND `out\ #tag` is an escaped SPACE (the `#` is mid-token, part of the filename) — neither
 * starts a comment. A regex `(^|\s)#` mis-read the escaped space as a boundary; this walks the string
 * tracking backslash-escape (quotes are already blanked upstream) so backslash-parity is exact.
 */
function stripComment(s) {
  let prevBoundary = true; // start-of-line is a token boundary
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\") { i++; prevBoundary = false; continue; } // skip the escaped char; it is NOT a boundary
    if (c === "#" && prevBoundary) return s.slice(0, i);
    prevBoundary = /\s/.test(c);
  }
  return s;
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
    if (!logical.includes(PRAGMA) && MASK_RE.test(stripQuotedAndComments(logical))) {
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

module.exports = { scanText, MASK_RE };
