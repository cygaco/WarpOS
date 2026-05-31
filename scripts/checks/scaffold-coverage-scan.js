#!/usr/bin/env node
"use strict";

/**
 * /scan:scaffold-coverage (S0.3) — the standing fail-closed enforcer that keeps
 * the WarpOS app scaffold COMPLETE and COHERENT, so every scaffolded product
 * ships a real component library instead of vibe-coded raw elements.
 *
 * REJECTS (exit 1), never lints, when ANY of:
 *   - a required scaffold file is missing;
 *   - package.json.tmpl lacks a required stack dependency;
 *   - IMPORT↔DEP DRIFT: a .ts/.tsx template imports an external package that is
 *     NOT declared in package.json.tmpl deps/devDeps (the #1 "half-wired" failure —
 *     a component that imports a lib nobody installs is broken-on-arrival);
 *   - tsconfig is missing the `@/*` path alias;
 *   - next.config is missing the security-header baseline;
 *   - globals.css is missing the Tailwind-v4 token bridge;
 *   - lib/utils is missing the `cn` export.
 * Internal error => exit 2 (fail-closed: a scan that errors must never read green).
 *
 *   node scripts/checks/scaffold-coverage-scan.js [--json]
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

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
  "src/lib/utils.ts.tmpl",
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

// External imports that are Node/Next builtins or local — never need a dep entry.
function isLocalOrBuiltin(spec) {
  return (
    spec.startsWith("@/") ||
    spec.startsWith(".") ||
    spec.startsWith("/") ||
    spec.startsWith("node:")
  );
}

// Normalize an import specifier to its package name: `@scope/pkg/sub` => `@scope/pkg`;
// `pkg/sub` => `pkg`. `next/link` => `next`.
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
  // import ... from "x"  |  import "x"  |  export ... from "x"
  const re = /(?:import|export)\s+(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(text)) !== null) specs.add(m[1]);
  return [...specs];
}

function main(argv) {
  const json = argv.includes("--json");
  const errors = [];
  try {
    const dir = scaffoldDir();
    if (!fs.existsSync(dir)) {
      errors.push(`scaffold dir missing: ${path.relative(REPO_ROOT, dir)}`);
      return emit(json, errors);
    }

    // 1. required files present
    for (const rel of REQUIRED_FILES) {
      if (!fs.existsSync(path.join(dir, rel))) errors.push(`missing required file: ${rel}`);
    }

    // 2. package.json.tmpl parses + has required deps
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

    // 3. import↔dep coherence — every external import resolves to a declared dep
    const declared = new Set(Object.keys(allDeps));
    for (const file of walkTemplates(dir)) {
      const rel = path.relative(dir, file);
      const text = fs.readFileSync(file, "utf8");
      for (const spec of collectImports(text)) {
        if (isLocalOrBuiltin(spec)) continue;
        const name = pkgName(spec);
        if (!declared.has(name)) {
          errors.push(`import↔dep drift: ${rel} imports "${spec}" but "${name}" is not in package.json`);
        }
      }
    }

    // 4. tsconfig @/* alias
    const tsconfig = readIf(path.join(dir, "tsconfig.json.tmpl"));
    if (tsconfig !== null && !/"@\/\*"\s*:/.test(tsconfig)) {
      errors.push("tsconfig.json missing the `@/*` path alias");
    }

    // 5. next.config security-header baseline
    const nextcfg = readIf(path.join(dir, "next.config.ts.tmpl"));
    if (nextcfg !== null) {
      for (const h of ["X-Frame-Options", "X-Content-Type-Options", "Strict-Transport-Security"]) {
        if (!nextcfg.includes(h)) errors.push(`next.config.ts missing security header: ${h}`);
      }
    }

    // 6. globals.css Tailwind-v4 token bridge
    const css = readIf(path.join(dir, "src/app/globals.css.tmpl"));
    if (css !== null) {
      if (!/@import\s+["']tailwindcss["']/.test(css)) errors.push("globals.css missing `@import \"tailwindcss\"`");
      if (!/@theme\s+inline/.test(css)) errors.push("globals.css missing `@theme inline` token bridge");
      if (!/--color-primary\s*:/.test(css)) errors.push("globals.css missing the --color-primary token");
    }

    // 7. lib/utils cn export
    const utils = readIf(path.join(dir, "src/lib/utils.ts.tmpl"));
    if (utils !== null && !/export\s+function\s+cn\b/.test(utils)) {
      errors.push("src/lib/utils.ts missing the `cn` export");
    }
  } catch (e) {
    process.stderr.write(`scaffold-coverage-scan error: ${e.message}\n`);
    return 2; // fail-closed
  }
  return emit(json, errors);
}

function readIf(p) {
  try {
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  } catch {
    return null;
  }
}

function emit(json, errors) {
  if (json) {
    process.stdout.write(JSON.stringify({ ok: errors.length === 0, errors }, null, 2) + "\n");
    return errors.length ? 1 : 0;
  }
  if (errors.length === 0) {
    process.stdout.write("OK scaffold-coverage: app scaffold complete + coherent (deps↔imports aligned)\n");
    return 0;
  }
  process.stderr.write(`FAIL scaffold-coverage (${errors.length}):\n${errors.map((e) => `  - ${e}`).join("\n")}\n`);
  return 1;
}

process.exit(main(process.argv));
