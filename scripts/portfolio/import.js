#!/usr/bin/env node

/**
 * scripts/portfolio/import.js
 *
 * Orchestrator for the /portfolio:import skill.
 *
 * Generates a paste-friendly Markdown questionnaire from the current project's
 * bounded context (PROJECT.md, README.md, package.json, last 10 commits), then
 * — on a second invocation with --parse — converts an operator-pasted-back
 * Markdown reply into a JSON map shaped exactly like what
 * `/portfolio:bootstrap --answers-file` expects.
 *
 * Inputs (CLI):
 *   --slug <name>                       Project slug (default: derived from cwd basename)
 *   --section-set minimal|extended      (default: minimal — 8 sections; extended = 12)
 *   --output-dir <path>                 Override default _docs/imports/<slug>/
 *   --no-introspect                     Skip the bounded read-only project scan
 *   --parse <pasted-answers.md>         Switch to parse-mode: read this file,
 *                                       split on section anchors, emit answers.json
 *   --for <surface-hint>                Reserved (claude-code|codex|claude-web|
 *                                       chatgpt-web|gemini-web|universal). v1 no-op.
 *   --help                              Print help and exit 0.
 *   --probe                             Read-only env probe; emit JSON; no writes.
 *
 * Outputs (emit mode):
 *   _docs/imports/<slug>/<slug>.questionnaire.md
 *
 * Outputs (parse mode):
 *   _docs/imports/<slug>/<slug>.answers.json
 *
 * Side effects:
 *   On first successful emit: adds paths.imports + paths.importsCurrent to
 *   .claude/paths.json (idempotent, atomic write via tmp + rename).
 *   Emits import_started, context_introspected, questionnaire_emitted,
 *   parse_started, parse_completed, parse_failed_section_mismatch events to
 *   paths.eventsFile (fail-open per CLAUDE.md learning L-2026-04-17-n).
 *
 * Exit codes:
 *   0  success
 *   2  invalid input (slug, section-set, --for, --output-dir, parse failure)
 *   3  introspection produced nothing AND --no-introspect was not set (warning,
 *      not fatal — emit continues; reserved for future strict mode)
 *   4  output directory not writable
 *   5  parse-mode section-mismatch (also signalled via exit 2 for CLI symmetry
 *      with bootstrap — see AC-8.2)
 *
 * Sprint: SP-20260520-002 · Plan Contract: PC-20260521-0018
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

// ── Resolve project root (matches scripts/portfolio/bootstrap.js precedent) ──
const PROJECT = resolveProjectRoot();

function resolveProjectRoot() {
  if (process.env.CLAUDE_PROJECT_DIR) {
    return path.resolve(process.env.CLAUDE_PROJECT_DIR);
  }
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, ".claude", "paths.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

// ── Constants ─────────────────────────────────────────────────────
const TEMPLATE_DIR = path.join(
  PROJECT,
  "framework",
  "templates",
  "product-import",
);
const BOOTSTRAP_TEMPLATE_DIR = path.join(
  PROJECT,
  "framework",
  "templates",
  "product-bootstrap",
);
const PATHS_JSON = path.join(PROJECT, ".claude", "paths.json");
const EVENTS_FILE = path.join(
  PROJECT,
  ".claude",
  "project",
  "events",
  "events.jsonl",
);
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const INTROSPECT_CAP_BYTES = 64 * 1024;
const MAX_PARSE_FILE_BYTES = 512 * 1024;
const GIT_LOG_TIMEOUT_MS = 5000;
const VALID_SURFACE_HINTS = [
  "claude-code",
  "codex",
  "claude-web",
  "chatgpt-web",
  "gemini-web",
  "universal",
];
const SKIPPED_LITERAL =
  "_skipped — operator declined to answer this section._";

// ── CLI parsing ──────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    slug: null,
    sectionSet: "minimal",
    outputDir: null,
    noIntrospect: false,
    parse: null,
    surfaceHint: "universal",
    help: false,
    probe: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--slug":
        args.slug = next();
        break;
      case "--section-set":
        args.sectionSet = next();
        break;
      case "--output-dir":
        args.outputDir = next();
        break;
      case "--no-introspect":
        args.noIntrospect = true;
        break;
      case "--parse":
        args.parse = next();
        break;
      case "--for":
        args.surfaceHint = next();
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--probe":
        args.probe = true;
        break;
      default:
        if (a.startsWith("--")) die(2, `unknown flag: ${a}`);
        // Positional args ignored — skill driver may pass arbitrary $ARGUMENTS
        break;
    }
  }
  return args;
}

function die(code, msg) {
  process.stderr.write(`product:import: ${msg}\n`);
  process.exit(code);
}

// ── Slug derivation + validation (IN-1) ──────────────────────────
function deriveSlugFromCwd(cwd) {
  const base = path.basename(path.resolve(cwd || PROJECT));
  return base
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizeSlug(input) {
  if (!input) return "";
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function validateSlug(slug, raw) {
  if (!slug || !SLUG_RE.test(slug)) {
    const suggestion = normalizeSlug(raw || slug) || "<empty>";
    const msg = [
      `Slug \`${raw ?? slug}\` is not valid.`,
      "Slugs must start with a lowercase letter or digit, contain only",
      "lowercase letters, digits, and hyphens, and be 1-64 characters.",
      `Suggested: \`${suggestion}\``,
    ].join("\n");
    process.stderr.write(msg + "\n");
    process.exit(2);
  }
}

// ── Output dir resolution (IN-3, redteam SCENARIO-1) ─────────────
function resolveOutputDir(args, slug) {
  let dir;
  if (args.outputDir) {
    dir = path.resolve(PROJECT, args.outputDir);
  } else {
    dir = path.join(PROJECT, "_docs", "imports", slug);
  }
  const projectAbs = path.resolve(PROJECT);
  const dirAbs = path.resolve(dir);
  const rel = path.relative(projectAbs, dirAbs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    die(2, "--output-dir must stay inside the project root.");
  }
  return dir;
}

function toForwardSlash(p) {
  return String(p).replace(/\\/g, "/");
}

// ── Section loading + parity (R-4, R-10) ─────────────────────────
function loadImportSections(sectionSet) {
  const file = path.join(TEMPLATE_DIR, "sections.json");
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    die(
      2,
      `Section template at framework/templates/product-import/sections.json is invalid: ${e.message}`,
    );
  }
  if (sectionSet === "minimal") return { sections: data.minimal.slice(), data };
  if (sectionSet === "extended") {
    return {
      sections: data.minimal.concat(data.extended_additions),
      data,
    };
  }
  die(2, `Unknown section set '${sectionSet}'. Use minimal or extended.`);
  return null; // unreachable
}

function loadBootstrapSections() {
  const file = path.join(BOOTSTRAP_TEMPLATE_DIR, "sections.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function computeSectionParity() {
  let bootstrap, importData;
  try {
    bootstrap = loadBootstrapSections();
  } catch (e) {
    return {
      section_parity: false,
      parity_report: {
        minimal_ids: [],
        extended_ids: [],
        diffs: [
          {
            section_id: null,
            field: "bootstrap_sections_load",
            reason: e.message,
          },
        ],
      },
    };
  }
  try {
    importData = JSON.parse(
      fs.readFileSync(path.join(TEMPLATE_DIR, "sections.json"), "utf8"),
    );
  } catch (e) {
    return {
      section_parity: false,
      parity_report: {
        minimal_ids: bootstrap.minimal.map((s) => s.id),
        extended_ids: bootstrap.minimal
          .concat(bootstrap.extended_additions)
          .map((s) => s.id),
        diffs: [
          {
            section_id: null,
            field: "import_sections_load",
            reason: e.message,
          },
        ],
      },
    };
  }

  const diffs = [];
  diffOneList("minimal", bootstrap.minimal, importData.minimal, diffs);
  diffOneList(
    "extended_additions",
    bootstrap.extended_additions,
    importData.extended_additions,
    diffs,
  );

  // Non-ASCII / regex sanity on import side (RT SCENARIO-7)
  const idRe = /^[a-z][a-z0-9_]*$/;
  const allImport = importData.minimal.concat(importData.extended_additions);
  for (const s of allImport) {
    if (!idRe.test(s.id)) {
      diffs.push({
        section_id: s.id,
        field: "id_format",
        reason: "non-ascii or invalid section id",
      });
    }
  }

  return {
    section_parity: diffs.length === 0,
    parity_report: {
      minimal_ids: bootstrap.minimal.map((s) => s.id),
      extended_ids: bootstrap.minimal
        .concat(bootstrap.extended_additions)
        .map((s) => s.id),
      diffs,
    },
  };
}

function diffOneList(label, expected, actual, diffs) {
  if (!Array.isArray(expected) || !Array.isArray(actual)) {
    diffs.push({
      section_id: null,
      field: label,
      reason: "non-array section list",
    });
    return;
  }
  if (expected.length !== actual.length) {
    diffs.push({
      section_id: null,
      field: `${label}.length`,
      reason: `expected ${expected.length}, got ${actual.length}`,
    });
  }
  const n = Math.min(expected.length, actual.length);
  for (let i = 0; i < n; i++) {
    const e = expected[i];
    const a = actual[i];
    if (e.id !== a.id) {
      diffs.push({
        section_id: a.id || e.id,
        field: `${label}[${i}].id`,
        reason: `expected '${e.id}', got '${a.id}'`,
      });
    }
    if (e.title !== a.title) {
      diffs.push({
        section_id: a.id,
        field: `${label}[${i}].title`,
        reason: `bootstrap='${e.title}' vs import='${a.title}'`,
      });
    }
    if (e.prompt !== a.prompt) {
      diffs.push({
        section_id: a.id,
        field: `${label}[${i}].prompt`,
        reason: "prompt text differs from bootstrap (must be verbatim)",
      });
    }
  }
}

// ── Project introspection (R-3, IN-7, RT SCENARIO-3) ─────────────
function readBoundedFile(absPath) {
  try {
    const st = fs.statSync(absPath);
    if (!st.isFile()) return { present: false };
    const fd = fs.openSync(absPath, "r");
    try {
      const len = Math.min(st.size, INTROSPECT_CAP_BYTES);
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, 0);
      const truncated = st.size > INTROSPECT_CAP_BYTES;
      return {
        present: true,
        body: buf.toString("utf8"),
        bytes: st.size,
        truncated,
      };
    } finally {
      fs.closeSync(fd);
    }
  } catch (e) {
    if (e.code === "ENOENT") return { present: false };
    return { present: false, error: e.message };
  }
}

function readPackageJsonMeta(absPath) {
  const r = readBoundedFile(absPath);
  if (!r.present) return r;
  let parsed = null;
  try {
    parsed = JSON.parse(r.body);
  } catch (e) {
    return {
      present: true,
      bytes: r.bytes,
      truncated: r.truncated,
      parse_error: e.message,
    };
  }
  const depCount =
    (parsed && parsed.dependencies
      ? Object.keys(parsed.dependencies).length
      : 0) +
    (parsed && parsed.devDependencies
      ? Object.keys(parsed.devDependencies).length
      : 0);
  return {
    present: true,
    bytes: r.bytes,
    truncated: r.truncated,
    name: (parsed && parsed.name) || null,
    description: (parsed && parsed.description) || null,
    dep_count: depCount,
  };
}

function readGitLog(projectRoot) {
  // RT-3 / IN-7: 5s timeout, %s only, no body/author/sig.
  try {
    const out = execFileSync(
      "git",
      ["log", "-n", "10", "--pretty=%s"],
      {
        cwd: projectRoot,
        timeout: GIT_LOG_TIMEOUT_MS,
        windowsHide: true,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const subjects = out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 10);
    return { present: true, subjects };
  } catch (e) {
    return { present: false, error: e.message || "git unavailable" };
  }
}

function runIntrospection(noIntrospect) {
  if (noIntrospect) {
    return { skipped: true };
  }
  const projectMd = readBoundedFile(path.join(PROJECT, "PROJECT.md"));
  const readmeMd = readBoundedFile(path.join(PROJECT, "README.md"));
  const pkg = readPackageJsonMeta(path.join(PROJECT, "package.json"));
  const gitLog = readGitLog(PROJECT);
  return {
    skipped: false,
    project_md: projectMd,
    readme: readmeMd,
    package_json: pkg,
    git_log: gitLog,
  };
}

function summarizeIntrospection(introspect) {
  // Returns the strings used in C-4 output AND the truncated-name list used in TR-2.
  const lines = ["Introspection complete:"];
  const truncated = [];
  if (introspect.skipped) {
    return { lines: ["Introspection skipped (--no-introspect)."], truncated };
  }
  const pm = introspect.project_md;
  if (pm.present) {
    lines.push(`  • PROJECT.md: present (${kb(pm.bytes)})`);
    if (pm.truncated) truncated.push("PROJECT.md");
  } else {
    lines.push("  • PROJECT.md: absent");
  }
  const rm = introspect.readme;
  if (rm.present) {
    lines.push(`  • README.md: present (${kb(rm.bytes)})`);
    if (rm.truncated) truncated.push("README.md");
  } else {
    lines.push("  • README.md: absent");
  }
  const pkg = introspect.package_json;
  if (pkg.present) {
    const nameSeg = pkg.name ? `, name=\`${pkg.name}\`` : "";
    const depSeg = pkg.dep_count != null ? `, ${pkg.dep_count} deps` : "";
    lines.push(`  • package.json: present${nameSeg}${depSeg}`);
    if (pkg.truncated) truncated.push("package.json");
  } else {
    lines.push("  • package.json: absent");
  }
  const gl = introspect.git_log;
  if (gl.present) {
    lines.push(`  • git log -n 10: ${gl.subjects.length} subjects collected`);
  } else {
    lines.push("  • git log -n 10: git unavailable");
  }
  return { lines, truncated };
}

function kb(n) {
  if (n == null) return "?KB";
  return (n / 1024).toFixed(1) + "KB";
}

// ── Preamble rendering (R-5, RT SCENARIO-2 escape package_name) ──
function htmlEscapeInline(s) {
  // Used for the preamble's package_name slot — keeps prompt-injection from
  // package.json#name from landing as runnable instructions.
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`/g, "\\`");
}

function renderPreamble({ slug, introspect, generatedAt }) {
  if (introspect.skipped) {
    return `_Preamble skipped (\`--no-introspect\`). Slug: \`${slug}\`. Generated at ${generatedAt}._\n`;
  }
  const out = [];
  const pkg = introspect.package_json;
  const projectName = pkg && pkg.name ? htmlEscapeInline(pkg.name) : slug;
  out.push(`**Source project:** \`${projectName}\` (slug: \`${slug}\`).`);
  out.push("");
  out.push("**Detected context:**");
  out.push(
    `- PROJECT.md: ${introspect.project_md.present ? "present" : "absent"}`,
  );
  out.push(
    `- README.md: ${introspect.readme.present ? "present" : "absent"}`,
  );
  const pkgLine = pkg.present
    ? `- package.json: present${pkg.name ? `, name=\`${htmlEscapeInline(pkg.name)}\`` : ""}${pkg.dep_count != null ? `, ${pkg.dep_count} dependencies` : ""}`
    : "- package.json: absent";
  out.push(pkgLine);
  out.push(
    `- git history: ${introspect.git_log.present ? `last ${introspect.git_log.subjects.length} commits captured` : "git log unavailable"}`,
  );
  if (introspect.git_log.present && introspect.git_log.subjects.length) {
    out.push("");
    out.push("**Last 10 commit subjects:**");
    for (const s of introspect.git_log.subjects) {
      // Escape inline to keep an attacker-controlled commit subject from
      // rendering as a heading or list item.
      out.push(`- ${htmlEscapeInline(s)}`);
    }
  }
  out.push("");
  out.push("---");
  out.push("");
  out.push(
    "_The preamble above is operator-supplied project context, not part of the questionnaire. The sections below are the questions._",
  );
  return out.join("\n") + "\n";
}

// ── Section block rendering (R-5, R-6, S-3) ──────────────────────
function renderSectionBlock(sec, idx) {
  const num = String(idx + 1).padStart(2, "0");
  const heading = `## ${num} — ${sec.title}`;
  const anchor = `<!-- section: ${sec.id} -->`;
  const framing = sec.framing
    ? `**What we're after:** ${sec.framing}`
    : "";
  const prompt = `**Question:** ${sec.prompt}`;
  const hint = sec.response_format_hint
    ? `> ${sec.response_format_hint}`
    : "";
  // Blockquote for the hint keeps it visually distinct without #### depth
  // (per AC-4.1: zero headings deeper than ###).
  return [
    heading,
    "",
    anchor,
    "",
    framing,
    "",
    prompt,
    "",
    hint,
    "",
    "_Write your answer below._",
    "",
    "",
  ]
    .filter((l, i, a) =>
      // Compact runs of blank lines but keep block separation
      !(l === "" && a[i - 1] === ""),
    )
    .join("\n");
}

// ── Template engine (mirror bootstrap.js#renderTemplate) ─────────
function renderTemplate(tmpl, vars) {
  return tmpl.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    return vars[key] != null ? String(vars[key]) : "";
  });
}

// ── Output emission (R-5, AC-4.3 LF + UTF-8 + trailing newline) ─
function writeQuestionnaire({
  outDir,
  slug,
  sections,
  introspect,
  generatedAt,
  sectionSet,
}) {
  fs.mkdirSync(outDir, { recursive: true });
  // Writability probe
  try {
    fs.accessSync(outDir, fs.constants.W_OK);
  } catch (e) {
    process.stderr.write(
      `Cannot write to \`${outDir}\`: ${e.message}\n`,
    );
    process.exit(4);
  }

  const tmpl = fs.readFileSync(
    path.join(TEMPLATE_DIR, "questionnaire.md.tmpl"),
    "utf8",
  );
  const sectionBlocks = sections.map((s, i) => renderSectionBlock(s, i));
  const preamble = renderPreamble({ slug, introspect, generatedAt });
  const projectRootLabel = toForwardSlash(
    path.relative(path.dirname(PROJECT), PROJECT) || path.basename(PROJECT),
  );

  const out = renderTemplate(tmpl, {
    slug,
    generated_at: generatedAt,
    section_set: sectionSet,
    project_root_label: projectRootLabel,
    preamble,
    sections: sectionBlocks.join("\n"),
  });

  // AC-4.3: no CRLF; AC-5.1: exactly one trailing newline.
  let normalized = out.replace(/\r\n/g, "\n");
  normalized = normalized.replace(/\n+$/g, "") + "\n";
  // Strip any BOM that might have crept in via the template.
  if (normalized.charCodeAt(0) === 0xfeff) {
    normalized = normalized.slice(1);
  }
  const file = path.join(outDir, `${slug}.questionnaire.md`);
  fs.writeFileSync(file, normalized, { encoding: "utf8" });
  return { file, bytes: Buffer.byteLength(normalized, "utf8") };
}

// ── Paths registration (R-8, atomic write per RT SCENARIO-5) ─────
function registerPaths(slug, outDirRel) {
  let registered = { imports: false, importsCurrent: false };
  let json;
  try {
    const raw = fs.readFileSync(PATHS_JSON, "utf8");
    json = JSON.parse(raw);
  } catch (e) {
    return { registered, error: `paths.json read failed: ${e.message}` };
  }
  if (!json || typeof json !== "object") {
    return { registered, error: "paths.json is not a JSON object" };
  }
  const desiredImports = "_docs/imports";
  const desiredCurrent = toForwardSlash(outDirRel);

  let mutated = false;
  if (json.imports !== desiredImports) {
    json.imports = desiredImports;
    registered.imports = true;
    mutated = true;
  }
  if (json.importsCurrent !== desiredCurrent) {
    json.importsCurrent = desiredCurrent;
    registered.importsCurrent = true;
    mutated = true;
  }
  if (!mutated) return { registered, error: null };

  const tmp = PATHS_JSON + ".tmp";
  try {
    fs.writeFileSync(tmp, JSON.stringify(json, null, 2) + "\n", "utf8");
    fs.renameSync(tmp, PATHS_JSON);
  } catch (e) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
    return { registered: { imports: false, importsCurrent: false }, error: e.message };
  }
  return { registered, error: null };
}

// ── Telemetry (R-9, fail-open per CLAUDE.md L-2026-04-17-n) ─────
function emitEvent(type, payload) {
  try {
    const dir = path.dirname(EVENTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const line =
      JSON.stringify({
        ts: new Date().toISOString(),
        type,
        ...payload,
      }) + "\n";
    fs.appendFileSync(EVENTS_FILE, line, "utf8");
  } catch {
    // swallow — fail-open
  }
}

// ── Help (C-1) ───────────────────────────────────────────────────
function printHelp() {
  process.stdout.write(
    [
      "/portfolio:import — Generate a paste-friendly questionnaire from this project's context,",
      "suitable for handing to another AI session (Claude Code, Codex, Claude web, ChatGPT,",
      "or Gemini). Answers come back as Markdown and parse cleanly into",
      "`/portfolio:bootstrap --answers-file`.",
      "",
      "Usage: /portfolio:import [--slug <name>] [--section-set minimal|extended]",
      "                        [--output-dir <path>] [--no-introspect]",
      "                        [--parse <pasted-answers.md>] [--for <surface-hint>]",
      "",
      "Intended as a pre-step to /portfolio:bootstrap when the product's source-of-truth",
      "lives in another session or tool.",
      "",
    ].join("\n"),
  );
}

// ── Pre-introspection notice (C-2) ───────────────────────────────
function printPreIntrospectNotice(slug) {
  process.stdout.write(
    `Building a questionnaire for \`${slug}\`. Reading PROJECT.md, README.md, package.json, and the last 10 commit subjects to seed the preamble. Pass \`--no-introspect\` to skip this step.\n`,
  );
}

// ── No-PROJECT.md notice (C-3) ───────────────────────────────────
function printNoProjectMdNotice() {
  process.stdout.write(
    [
      "No PROJECT.md found at the project root. That's expected for a fresh import — the questionnaire will lean on README.md, package.json, and recent commits instead.",
      "If you want richer grounding, write a one-paragraph PROJECT.md and re-run.",
      "",
    ].join("\n"),
  );
}

// ── Parse mode (R-7, S-8, RT SCENARIO-4/6/8) ─────────────────────
/**
 * Anchor-only parser: splits the input by lines whose entire line (after
 * trimming surrounding whitespace) matches `<!-- section: <id> -->`. Heading
 * text is ignored on purpose — ChatGPT/Gemini frequently rewrites it.
 *
 * Returns: { entries: [{ id, body, status }], orderedIds: [...] }
 * where status is "drafted" or "skipped_declined".
 */
function parseAnswersFile(absPath, allowedIds) {
  const stat = fs.statSync(absPath);
  if (stat.size > MAX_PARSE_FILE_BYTES) {
    die(
      2,
      `--parse file is too large (${stat.size} bytes > ${MAX_PARSE_FILE_BYTES} byte cap).`,
    );
  }
  const raw = fs.readFileSync(absPath, "utf8");
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  // Line-anchored: trim only whitespace, then match anchor with allowed id-set.
  const anchorRe = /^\s*<!--\s*section\s*:\s*([a-z][a-z0-9_]*)\s*-->\s*$/;
  const allowed = new Set(allowedIds);

  let currentId = null;
  let bodyBuf = [];
  const entries = [];

  function flush() {
    if (!currentId) return;
    // Strip trailing lines that belong to the NEXT section: blank lines plus
    // any markdown heading (e.g. "## 02 — Jobs to be Done") that introduces
    // the next section's anchor. This keeps headings out of the previous
    // section's body when the answering session puts heading+anchor pairs
    // back into the reply (the common case).
    let buf = bodyBuf.slice();
    while (buf.length > 0) {
      const last = buf[buf.length - 1];
      const trimmed = last.trim();
      if (trimmed === "" || /^#{1,6}\s/.test(trimmed)) {
        buf.pop();
        continue;
      }
      break;
    }
    const bodyText = buf.join("\n").trim();
    const isSkippedLiteral =
      bodyText.replace(/\s+/g, " ").trim() === SKIPPED_LITERAL;
    const isEmpty = bodyText.length === 0;
    let status, content;
    if (isSkippedLiteral || isEmpty) {
      status = "skipped_declined";
      content = "";
    } else {
      status = "drafted";
      content = bodyText;
    }
    entries.push({ id: currentId, body: content, status });
    currentId = null;
    bodyBuf = [];
  }

  for (const line of lines) {
    const m = line.match(anchorRe);
    if (m && allowed.has(m[1])) {
      flush();
      currentId = m[1];
      continue;
    }
    if (currentId) {
      bodyBuf.push(line);
    }
  }
  flush();

  return { entries, parseSize: stat.size };
}

function runParseMode(args) {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const slug = args.slug || deriveSlugFromCwd(process.cwd());
  validateSlug(slug, args.slug);

  // Section set validated already by caller; just load again for the id list.
  const { sections } = loadImportSections(args.sectionSet);
  const allowedIds = sections.map((s) => s.id);

  const inputAbs = path.isAbsolute(args.parse)
    ? args.parse
    : path.resolve(PROJECT, args.parse);
  if (!fs.existsSync(inputAbs)) {
    die(2, `--parse file not found: ${args.parse}`);
  }

  const parseRel = toForwardSlash(path.relative(PROJECT, inputAbs));

  // TR-1: import_started (mode=parse)
  emitEvent("import_started", {
    slug,
    section_set: args.sectionSet,
    mode: "parse",
    output_dir: null,
    surface_hint: args.surfaceHint,
    no_introspect: !!args.noIntrospect,
    started_at: startedAt,
  });

  const parseSize = fs.statSync(inputAbs).size;
  // TR-4: parse_started
  emitEvent("parse_started", {
    slug,
    parse_input_path: parseRel,
    parse_input_bytes: parseSize,
    section_set: args.sectionSet,
    started_at: startedAt,
  });

  const { entries } = parseAnswersFile(inputAbs, allowedIds);
  const seen = new Map();
  for (const e of entries) {
    // Last anchor wins if duplicates — but record only one entry.
    seen.set(e.id, e);
  }

  const missing = [];
  for (const id of allowedIds) {
    if (!seen.has(id)) missing.push(id);
  }

  if (missing.length > 0) {
    // TR-6: parse_failed_section_mismatch
    emitEvent("parse_failed_section_mismatch", {
      slug,
      missing_section_ids: missing,
      parse_input_path: parseRel,
      parse_input_bytes: parseSize,
      section_set: args.sectionSet,
      total_elapsed_ms: Date.now() - t0,
      outcome: "failure",
      failure_reason: "missing_required_sections",
    });
    const msg = [
      `Parse failed: \`${parseRel}\` is missing required sections:`,
      ...missing.map((id) => `  - ${id}`),
      "",
      "Each section must be present with its `<!-- section: <id> -->` anchor and non-empty body.",
      "Either re-paste the missing sections into the file (keep the anchors verbatim) and re-run,",
      `or drop them explicitly with the literal text \`${SKIPPED_LITERAL}\` under the anchor.`,
      "",
      "No `answers.json` was written.",
    ].join("\n");
    process.stderr.write(msg + "\n");
    process.exit(2);
  }

  // Build answers.json in sanitizeAnswer-compatible shape.
  const answers = {};
  let drafted = 0;
  let skipped = 0;
  for (const id of allowedIds) {
    const e = seen.get(id);
    if (e.status === "drafted") drafted++;
    else skipped++;
    answers[id] = {
      content: e.body,
      status: e.status,
      source_turns: [],
    };
  }

  const outDir = resolveOutputDir(args, slug);
  fs.mkdirSync(outDir, { recursive: true });
  try {
    fs.accessSync(outDir, fs.constants.W_OK);
  } catch (e) {
    process.stderr.write(`Cannot write to \`${outDir}\`: ${e.message}\n`);
    process.exit(4);
  }
  const outFile = path.join(outDir, `${slug}.answers.json`);
  const out = JSON.stringify(answers, null, 2) + "\n";
  fs.writeFileSync(outFile, out, "utf8");

  // Also register paths so downstream skills see the right importsCurrent.
  const outDirRel = toForwardSlash(path.relative(PROJECT, outDir));
  const pathsReg = registerPaths(slug, outDirRel);

  // TR-5: parse_completed
  emitEvent("parse_completed", {
    slug,
    sections_matched: allowedIds.length,
    sections_required: allowedIds.length,
    sections_drafted: drafted,
    sections_skipped_declined: skipped,
    answers_json_path: toForwardSlash(path.relative(PROJECT, outFile)),
    answers_json_bytes: Buffer.byteLength(out, "utf8"),
    total_elapsed_ms: Date.now() - t0,
    outcome: "success",
  });

  // C-5
  const label =
    args.sectionSet === "extended"
      ? `${drafted + skipped} / ${drafted + skipped} (extended)`
      : `${drafted + skipped} / ${drafted + skipped} (minimal)`;
  const banner = pathsReg.registered.imports
    ? [
        "",
        "Registered new paths keys:",
        "  • `paths.imports` → `_docs/imports`",
        `  • \`paths.importsCurrent\` → \`${outDirRel}\``,
        "",
        "Downstream skills that consume the questionnaire (or its answers) can now resolve these via `paths.json`.",
      ].join("\n")
    : "";
  process.stdout.write(
    [
      `Parsed \`${parseRel}\`:`,
      `  • Sections matched: ${label}`,
      `  • Status: ${drafted} drafted, ${skipped} skipped_declined`,
      `  • Wrote: \`${toForwardSlash(path.relative(PROJECT, outFile))}\``,
      "",
      `Next: \`/portfolio:bootstrap --answers-file ${toForwardSlash(path.relative(PROJECT, outFile))}\``,
      banner,
      "",
    ]
      .filter((l) => l !== undefined)
      .join("\n"),
  );
  process.exit(0);
}

// ── Probe mode (S-7, R-10) ───────────────────────────────────────
function runProbe(args) {
  const parity = computeSectionParity();
  process.stdout.write(
    JSON.stringify(
      {
        slug: args.slug || deriveSlugFromCwd(process.cwd()),
        section_set: args.sectionSet,
        ...parity,
      },
      null,
      2,
    ) + "\n",
  );
  process.exit(0);
}

// ── Main ─────────────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Validate enums up-front.
  if (!["minimal", "extended"].includes(args.sectionSet)) {
    die(2, `Unknown section set '${args.sectionSet}'. Use minimal or extended.`);
  }
  if (!VALID_SURFACE_HINTS.includes(args.surfaceHint)) {
    die(
      2,
      `Unknown --for value '${args.surfaceHint}'. Use one of: ${VALID_SURFACE_HINTS.join(", ")}.`,
    );
  }

  // Section-set membership in import templates is validated by loader.
  if (args.probe) {
    runProbe(args);
    return;
  }

  // Parity guard at runtime — refuse to run emit/parse if templates have drifted.
  const parity = computeSectionParity();
  if (!parity.section_parity) {
    process.stderr.write(
      [
        "Section parity check failed — `framework/templates/product-import/sections.json`",
        "diverges from `framework/templates/product-bootstrap/sections.json`. Fix the templates",
        "(or run `node scripts/product/import.js --probe` for details) before emitting or parsing.",
        "",
        "Diffs:",
        ...parity.parity_report.diffs.map(
          (d) => `  - ${d.section_id || "(global)"} :: ${d.field} :: ${d.reason}`,
        ),
        "",
      ].join("\n"),
    );
    process.exit(5);
  }

  if (args.parse) {
    runParseMode(args);
    return;
  }

  // ── Emit mode ────────────────────────────────────────────────
  const slug = args.slug || deriveSlugFromCwd(process.cwd());
  validateSlug(slug, args.slug);

  const outDir = resolveOutputDir(args, slug);
  const outDirRel = toForwardSlash(
    path.relative(PROJECT, outDir) || `_docs/imports/${slug}`,
  );
  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  // TR-1: import_started (mode=emit)
  emitEvent("import_started", {
    slug,
    section_set: args.sectionSet,
    mode: "emit",
    output_dir: outDirRel,
    surface_hint: args.surfaceHint,
    no_introspect: !!args.noIntrospect,
    started_at: startedAt,
  });

  if (!args.noIntrospect) {
    printPreIntrospectNotice(slug);
  }

  const introspect = runIntrospection(args.noIntrospect);

  // C-3: warn if PROJECT.md missing in introspect mode.
  if (
    !args.noIntrospect &&
    introspect.project_md &&
    !introspect.project_md.present
  ) {
    printNoProjectMdNotice();
  }

  // C-4: print introspection summary (suppressed when skipped).
  const summary = summarizeIntrospection(introspect);
  process.stdout.write(summary.lines.join("\n") + "\n\n");

  // TR-2: context_introspected
  if (introspect.skipped) {
    emitEvent("context_introspected", {
      slug,
      project_md_present: false,
      readme_present: false,
      package_json_present: false,
      package_name: null,
      git_log_present: false,
      commits_collected: 0,
      truncated: [],
      skipped: true,
    });
  } else {
    emitEvent("context_introspected", {
      slug,
      project_md_present: !!introspect.project_md.present,
      readme_present: !!introspect.readme.present,
      package_json_present: !!introspect.package_json.present,
      package_name:
        (introspect.package_json && introspect.package_json.name) || null,
      git_log_present: !!introspect.git_log.present,
      commits_collected:
        (introspect.git_log.present &&
          introspect.git_log.subjects &&
          introspect.git_log.subjects.length) ||
        0,
      truncated: summary.truncated,
      skipped: false,
    });
  }

  // Render + write.
  const { sections } = loadImportSections(args.sectionSet);
  const generatedAt = new Date().toISOString();
  const { file, bytes } = writeQuestionnaire({
    outDir,
    slug,
    sections,
    introspect,
    generatedAt,
    sectionSet: args.sectionSet,
  });

  const pathsReg = registerPaths(slug, outDirRel);

  // C-8: post-emit summary
  const relFile = toForwardSlash(path.relative(PROJECT, file));
  process.stdout.write(
    [
      `Questionnaire ready at \`${outDirRel}/\`:`,
      `  • Markdown: \`${path.basename(file)}\` (${sections.length} sections, ~${kb(bytes)})`,
      "",
      "`paths.importsCurrent` now points here.",
      "",
      "Next steps:",
      "  1. Paste the contents into your other session (Claude Code, Codex, Claude web, ChatGPT web, Gemini web).",
      "  2. Bring the reply back into this project.",
      `  3. Run \`node scripts/portfolio/import.js --parse <reply.md> --slug ${slug}\` to convert it to \`answers.json\`.`,
      `  4. Run \`/portfolio:bootstrap --answers-file ${outDirRel}/${slug}.answers.json\`.`,
      "",
    ].join("\n"),
  );

  // C-9: only on FIRST registration of either key.
  if (pathsReg.registered.imports) {
    process.stdout.write(
      [
        "Registered new paths keys:",
        "  • `paths.imports` → `_docs/imports`",
        `  • \`paths.importsCurrent\` → \`${outDirRel}\``,
        "",
        "Downstream skills that consume the questionnaire (or its answers) can now resolve these via `paths.json`.",
        "",
      ].join("\n"),
    );
  } else if (pathsReg.error) {
    process.stderr.write(
      `Note: paths.json registration was skipped (${pathsReg.error}). The questionnaire was still written.\n`,
    );
  }

  // TR-3: questionnaire_emitted
  emitEvent("questionnaire_emitted", {
    slug,
    output_dir: outDirRel,
    section_count: sections.length,
    bytes,
    paths_registered: pathsReg.registered,
    paths_register_error: pathsReg.error,
    total_elapsed_ms: Date.now() - t0,
    outcome: pathsReg.error ? "partial" : "success",
  });

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  // Exported for tests / other tooling.
  parseArgs,
  normalizeSlug,
  deriveSlugFromCwd,
  resolveOutputDir,
  loadImportSections,
  loadBootstrapSections,
  computeSectionParity,
  runIntrospection,
  renderPreamble,
  renderSectionBlock,
  parseAnswersFile,
  registerPaths,
  SLUG_RE,
  INTROSPECT_CAP_BYTES,
  MAX_PARSE_FILE_BYTES,
  SKIPPED_LITERAL,
  VALID_SURFACE_HINTS,
};
