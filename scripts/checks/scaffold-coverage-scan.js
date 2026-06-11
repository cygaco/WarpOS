#!/usr/bin/env node
"use strict";

/**
 * /scan:scaffold-coverage (S0.3) - fail-closed enforcer for the WarpOS app
 * scaffold. It keeps the scaffold complete, coherent, and wired with the
 * day-zero telemetry seam required by S-PF-01.
 *
 *   node scripts/checks/scaffold-coverage-scan.js [--json]
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

const CANONICAL_EVENTS = [
  "signup",
  "onboarding_complete",
  "activation",
  "core_action",
  "retention_return",
  "checkout",
];

const CANONICAL_STAGES = [
  "intent",
  "executed",
  "committed",
  "delivered",
  "observed",
];

function scaffoldDir() {
  const fallback = path.join(REPO_ROOT, "framework", "templates", "app-scaffold");
  try {
    const reg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, ".claude", "paths.json"), "utf8"));
    return reg.appScaffoldTemplates ? path.join(REPO_ROOT, reg.appScaffoldTemplates) : fallback;
  } catch {
    return fallback;
  }
}

// Files the scaffold MUST ship (relative to the scaffold dir, .tmpl form).
const REQUIRED_FILES = [
  "package.json.tmpl",
  "tsconfig.json.tmpl",
  "next.config.ts.tmpl",
  "postcss.config.mjs.tmpl",
  "components.json.tmpl",
  "DESIGN_SYSTEM.md.tmpl",
  ".env.local.example.tmpl",
  "src/lib/utils.ts.tmpl",
  "src/lib/telemetry/events.ts.tmpl",
  "src/lib/telemetry/sink.ts.tmpl",
  "src/lib/telemetry/track.ts.tmpl",
  "src/lib/telemetry/chain.ts.tmpl",
  "src/app/layout.tsx.tmpl",
  "src/app/page.tsx.tmpl",
  "src/app/globals.css.tmpl",
  "src/components/ui/button.tsx.tmpl",
  "src/components/ui/card.tsx.tmpl",
  "src/components/ui/input.tsx.tmpl",
  "src/components/ui/label.tsx.tmpl",
  "src/components/ui/dialog.tsx.tmpl",
];

// Dependencies the scaffold MUST pin (in dependencies or devDependencies).
const REQUIRED_DEPS = [
  "next",
  "react",
  "react-dom",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
  "lucide-react",
  "@radix-ui/react-slot",
  "@radix-ui/react-dialog",
  "@radix-ui/react-label",
  "tailwindcss",
  "@tailwindcss/postcss",
  "typescript",
  "@playwright/test",
];

function isLocalOrBuiltin(spec) {
  return (
    spec.startsWith("@/") ||
    spec.startsWith(".") ||
    spec.startsWith("/") ||
    spec.startsWith("node:")
  );
}

function pkgName(spec) {
  if (spec.startsWith("@")) {
    const parts = spec.split("/");
    return parts.slice(0, 2).join("/");
  }
  return spec.split("/")[0];
}

function* walkTemplates(dir) {
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkTemplates(full);
    else if (e.isFile() && /\.(ts|tsx)\.tmpl$/.test(e.name)) yield full;
  }
}

function collectImports(text) {
  const specs = new Set();
  const scanText = stripTsComments(text);
  const re = /(?:import|export)\s+(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(scanText)) !== null) specs.add(m[1]);
  const dynamicImportRe = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynamicImportRe.exec(scanText)) !== null) specs.add(m[1]);
  const requireRe = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = requireRe.exec(scanText)) !== null) specs.add(m[1]);
  return [...specs];
}

function readIf(p) {
  try {
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  } catch {
    return null;
  }
}

function countMatches(text, re) {
  return (text.match(re) || []).length;
}

function stripTsComments(text) {
  let out = "";
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n" || ch === "\r") {
        lineComment = false;
        out += ch;
      } else {
        out += " ";
      }
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        out += "  ";
        i++;
      } else {
        out += ch === "\n" || ch === "\r" ? ch : " ";
      }
      continue;
    }

    if (quote) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      out += "  ";
      i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      out += "  ";
      i++;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
    }
    out += ch;
  }

  return out;
}

function parseConstStringArray(text, constName) {
  const re = new RegExp(`export\\s+const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as\\s+const`);
  const m = stripTsComments(text).match(re);
  if (!m) return null;
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
}

function sameArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, idx) => value === expected[idx])
  );
}

function activationFields(text) {
  const body = stripTsComments(text).match(/export\s+const\s+ACTIVATION_DEFINITION(?:\s*:\s*[A-Za-z0-9_]+)?\s*=\s*\{([\s\S]*?)\}\s*;?/);
  if (!body) return null;
  const fields = {};
  for (const key of ["predicate", "provenance", "confidence", "derivedFrom"]) {
    const m = body[1].match(new RegExp(`${key}\\s*:\\s*([^,\\n]+)`));
    if (m) fields[key] = m[1].trim();
  }
  return fields;
}

function hasNamedExport(text, name) {
  const scanText = stripTsComments(text);
  return (
    new RegExp(`export\\s+(?:async\\s+)?(?:const|let|var|function|type|interface)\\s+${name}\\b`).test(scanText) ||
    new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(scanText)
  );
}

function requireNamedExport(errors, text, rel, name) {
  if (text !== null && !hasNamedExport(text, name)) {
    errors.push(`${rel} missing named export: ${name}`);
  }
}

function stringLiteralValue(raw) {
  const m = typeof raw === "string" ? raw.match(/^["']([\s\S]*)["']$/) : null;
  return m ? m[1] : null;
}

function isUndefinedActivationPredicate(value) {
  if (!value || !value.trim()) return true;
  return /\{\{[^}]+\}\}|TODO|TBD|PLACEHOLDER|DEFINE|UNDEFINED|REPLACE_ME|SENTINEL/i.test(value);
}

function isUnresolvedTemplateValue(value) {
  if (!value || !value.trim()) return true;
  return /\{\{[^}]+\}\}|TODO|TBD|PLACEHOLDER|DEFINE|UNDEFINED|REPLACE_ME|SENTINEL/i.test(value);
}

function evaluateScaffold(dir = scaffoldDir()) {
  const errors = [];
  if (!fs.existsSync(dir)) {
    return {
      ok: false,
      errors: [`scaffold dir missing: ${path.relative(REPO_ROOT, dir)}`],
      dir,
    };
  }

  for (const rel of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(dir, rel))) errors.push(`missing required file: ${rel}`);
  }

  let allDeps = {};
  const pkgPath = path.join(dir, "package.json.tmpl");
  if (fs.existsSync(pkgPath)) {
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    } catch (e) {
      errors.push(`package.json.tmpl is not valid JSON: ${e.message}`);
    }
    if (pkg) {
      allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const d of REQUIRED_DEPS) {
        if (!(d in allDeps)) errors.push(`package.json missing required dep: ${d}`);
      }
    }
  }

  const declared = new Set(Object.keys(allDeps));
  for (const file of walkTemplates(dir)) {
    const rel = path.relative(dir, file).replace(/\\/g, "/");
    const text = fs.readFileSync(file, "utf8");
    for (const spec of collectImports(text)) {
      if (isLocalOrBuiltin(spec)) continue;
      const name = pkgName(spec);
      if (!declared.has(name)) {
        errors.push(`import->dep drift: ${rel} imports "${spec}" but "${name}" is not in package.json`);
      }
    }
  }

  const tsconfig = readIf(path.join(dir, "tsconfig.json.tmpl"));
  if (tsconfig !== null && !/"@\/\*"\s*:/.test(tsconfig)) {
    errors.push("tsconfig.json missing the `@/*` path alias");
  }

  const nextcfg = readIf(path.join(dir, "next.config.ts.tmpl"));
  if (nextcfg !== null) {
    for (const h of ["X-Frame-Options", "X-Content-Type-Options", "Strict-Transport-Security"]) {
      if (!nextcfg.includes(h)) errors.push(`next.config.ts missing security header: ${h}`);
    }
  }

  const css = readIf(path.join(dir, "src/app/globals.css.tmpl"));
  if (css !== null) {
    if (!/@import\s+["']tailwindcss["']/.test(css)) errors.push("globals.css missing `@import \"tailwindcss\"`");
    if (!/@theme\s+inline/.test(css)) errors.push("globals.css missing `@theme inline` token bridge");
    if (!/--color-primary\s*:/.test(css)) errors.push("globals.css missing the --color-primary token");
  }

  const utils = readIf(path.join(dir, "src/lib/utils.ts.tmpl"));
  if (utils !== null && !/export\s+function\s+cn\b/.test(utils)) {
    errors.push("src/lib/utils.ts missing the `cn` export");
  }

  addTelemetryChecks(dir, errors);

  return { ok: errors.length === 0, errors, dir };
}

function addTelemetryChecks(dir, errors) {
  const env = readIf(path.join(dir, ".env.local.example.tmpl"));
  if (env !== null) {
    for (const name of ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"]) {
      if (!new RegExp(`^${name}=`, "m").test(env)) {
        errors.push(`env example missing telemetry name: ${name}`);
      }
    }
  }

  const events = readIf(path.join(dir, "src/lib/telemetry/events.ts.tmpl"));
  const sink = readIf(path.join(dir, "src/lib/telemetry/sink.ts.tmpl"));
  const track = readIf(path.join(dir, "src/lib/telemetry/track.ts.tmpl"));
  const chain = readIf(path.join(dir, "src/lib/telemetry/chain.ts.tmpl"));
  const page = readIf(path.join(dir, "src/app/page.tsx.tmpl"));
  const layout = readIf(path.join(dir, "src/app/layout.tsx.tmpl"));

  if (events !== null) {
    requireNamedExport(errors, events, "src/lib/telemetry/events.ts", "LIFECYCLE_EVENTS");
    requireNamedExport(errors, events, "src/lib/telemetry/events.ts", "SUPPLY_CHAIN_STAGES");
    requireNamedExport(errors, events, "src/lib/telemetry/events.ts", "ACTIVATION_DEFINITION");
    requireNamedExport(errors, events, "src/lib/telemetry/events.ts", "deriveActivationDefinition");

    const lifecycleEvents = parseConstStringArray(events, "LIFECYCLE_EVENTS");
    if (!sameArray(lifecycleEvents, CANONICAL_EVENTS)) {
      errors.push(`event vocabulary drift: LIFECYCLE_EVENTS must be exactly ${CANONICAL_EVENTS.join(", ")}`);
    }

    const stages = parseConstStringArray(events, "SUPPLY_CHAIN_STAGES");
    if (!sameArray(stages, CANONICAL_STAGES)) {
      errors.push(`chain stage vocabulary drift: SUPPLY_CHAIN_STAGES must be exactly ${CANONICAL_STAGES.join(", ")}`);
    }

    const activation = activationFields(events);
    if (!activation) {
      errors.push("activation definition missing");
    } else {
      for (const field of ["predicate", "provenance", "confidence", "derivedFrom"]) {
        if (!(field in activation)) errors.push(`activation definition missing field: ${field}`);
      }
      const predicate = stringLiteralValue(activation.predicate);
      if (isUndefinedActivationPredicate(predicate)) {
        errors.push("activation definition present but undefined");
      }
      const provenance = stringLiteralValue(activation.provenance);
      if (isUnresolvedTemplateValue(provenance)) {
        errors.push("activation definition provenance present but undefined");
      }
      if (!["derived-at-canon", "founder-named-at-intake", "revised-at-lastmile"].includes(provenance)) {
        errors.push("activation definition provenance must be derived-at-canon, founder-named-at-intake, or revised-at-lastmile");
      }
      const derivedFrom = stringLiteralValue(activation.derivedFrom);
      if (isUnresolvedTemplateValue(derivedFrom)) {
        errors.push("activation definition derivedFrom present but undefined");
      }
      const confidence = Number(activation.confidence);
      if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        errors.push("activation definition confidence must be numeric between 0 and 1");
      }
    }
    if (!/function\s+deriveActivationDefinition\b/.test(events) || !/requires core-loop action, subject, and source/.test(events)) {
      errors.push("activation derivation must fail closed on thin core-loop input");
    }
  }

  if (sink !== null) {
    requireNamedExport(errors, sink, "src/lib/telemetry/sink.ts", "resolveTelemetrySink");
    if (countMatches(sink, /function\s+resolveTelemetrySink\b/g) !== 1) {
      errors.push("telemetry sink must expose exactly one resolveTelemetrySink function");
    }
    if (!/noopTelemetrySink/.test(sink)) errors.push("telemetry sink missing no-op fallback");
    if (!/NEXT_PUBLIC_POSTHOG_KEY/.test(sink)) errors.push("telemetry sink missing NEXT_PUBLIC_POSTHOG_KEY env gate");
  }

  if (track !== null) {
    requireNamedExport(errors, track, "src/lib/telemetry/track.ts", "track");
    if (!/event\s*:\s*LifecycleEvent/.test(track)) {
      errors.push("track.ts event parameter must derive from LifecycleEvent");
    }
    if (!/resolveTelemetrySink\(\)/.test(track)) {
      errors.push("track.ts must call the single sink resolver");
    }
    if (!/catch\s*\(/.test(track) || !/catch\s*\{/.test(track)) {
      errors.push("track.ts must catch sink failures at the telemetry boundary");
    }
  }

  if (chain !== null) {
    requireNamedExport(errors, chain, "src/lib/telemetry/chain.ts", "evaluateTelemetryChain");
    if (!/SUPPLY_CHAIN_STAGES/.test(chain) || !/brokenAtStage/.test(chain) || !/failureEvent/.test(chain)) {
      errors.push("chain helper missing broken-chain failure event");
    }
  }

  if (page !== null) {
    if (countMatches(page, /const\s+CORE_LOOP_EXAMPLE_ID\b/g) !== 1) {
      errors.push("page must contain exactly one core-loop telemetry example");
    }
    if (!/handleCoreLoopExample/.test(page) || !/track\("core_action"/.test(page) || !/track\("activation"/.test(page)) {
      errors.push("page core-loop example must emit core_action and activation through track()");
    }
    if (/document\.addEventListener\s*\(\s*["']click["']|window\.addEventListener\s*\(\s*["']click["']/.test(page)) {
      errors.push("page must not install a global click telemetry wrapper");
    }
  }

  if (layout !== null && !/ACTIVATION_DEFINITION/.test(layout)) {
    errors.push("layout must carry activation definition provenance wiring");
  }

  for (const file of walkTemplates(dir)) {
    const rel = path.relative(dir, file).replace(/\\/g, "/");
    if (rel === "src/lib/telemetry/sink.ts.tmpl") continue;
    const text = fs.readFileSync(file, "utf8");
    if (/\b(posthog|gtag|plausible|mixpanel)\b|\.capture\s*\(|\banalytics\s*\.\s*track\s*\(|\btracker\s*\.\s*track\s*\(|\bnavigator\s*\.\s*sendBeacon\s*\(|\bXMLHttpRequest\s*\(|\bfetch\s*\(/i.test(text)) {
      errors.push(`duplicate telemetry sink/raw emit outside sink.ts: ${rel}`);
    }
  }
}

function main(argv) {
  const json = argv.includes("--json");
  try {
    return emit(json, evaluateScaffold().errors);
  } catch (e) {
    process.stderr.write(`scaffold-coverage-scan error: ${e.message}\n`);
    return 2;
  }
}

function emit(json, errors) {
  if (json) {
    process.stdout.write(JSON.stringify({ ok: errors.length === 0, errors }, null, 2) + "\n");
    return errors.length ? 1 : 0;
  }
  if (errors.length === 0) {
    process.stdout.write("OK scaffold-coverage: app scaffold complete + coherent (deps->imports aligned, telemetry seam wired)\n");
    return 0;
  }
  process.stderr.write(`FAIL scaffold-coverage (${errors.length}):\n${errors.map((e) => `  - ${e}`).join("\n")}\n`);
  return 1;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = {
  CANONICAL_EVENTS,
  CANONICAL_STAGES,
  REQUIRED_FILES,
  evaluateScaffold,
  parseConstStringArray,
};
