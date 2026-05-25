"use strict";

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");

const { save, load, findBySlug, validate, registryPath } = require("./registry");

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const RESERVED = new Set([
  "list", "register", "open", "new", "adopt", "status",
  "dispatch", "sync", "bootstrap", "clone", "ponder", "import",
]);

const TEMPLATES_DIR = path.resolve(__dirname, "../../framework/templates/portfolio");
const WARPOS_ROOT = path.resolve(__dirname, "../..");

// ── argv parsing ───────────────────────────────────────────
const args = process.argv.slice(2);
const fromBriefIdx = args.indexOf("--from-brief");
const fromBrief = fromBriefIdx !== -1 ? args[fromBriefIdx + 1] : null;
// GitHub remote creation is OPT-IN. Default = local-only scaffold (the
// operator opens the product in its own session and creates/pushes the
// remote when they want). This keeps new-product creation fully within
// agent autonomy — no push means no data-exfiltration permission gate.
const wantGithub = args.includes("--github");
// First positional arg (not a flag, and not the value-slot of --from-brief) is the slug.
const slug = args.filter((a, i) => {
  if (a.startsWith("--")) return false;
  if (fromBriefIdx !== -1 && i === fromBriefIdx + 1) return false;
  return true;
})[0];

// ── validation (AC-5.4: reserved guard before any filesystem ops) ──
if (!slug) {
  console.error("Usage: /portfolio:new <slug> [--from-brief <brief-slug>]");
  process.exit(2);
}
if (!SLUG_RE.test(slug)) {
  console.error(`slug must match ^[a-z0-9][a-z0-9-]{0,63}$ (got: ${JSON.stringify(slug)})`);
  process.exit(2);
}
if (RESERVED.has(slug)) {
  console.error(`'${slug}' collides with a reserved skill name. Choose a different slug.`);
  process.exit(2);
}
if (findBySlug(slug)) {
  const existing = findBySlug(slug);
  console.error(`'${slug}' already registered at ${existing.repo_path}`);
  process.exit(2);
}

// ── resolve sibling path ───────────────────────────────────
const repoPath = path.resolve(WARPOS_ROOT, "..", slug);

if (fs.existsSync(repoPath)) {
  // Detect a prior-failed-scaffold leftover (only files we ourselves create)
  // so the error message tells the operator exactly what to do, instead of
  // generic "directory exists".
  const allowedLeftovers = new Set([".git", ".gitignore", "README.md", ".claude"]);
  let partialScaffold = false;
  try {
    const existing = fs.readdirSync(repoPath);
    partialScaffold = existing.length > 0 && existing.every((e) => allowedLeftovers.has(e));
  } catch { /* ignore */ }
  if (partialScaffold) {
    console.error(
      `Directory ${repoPath} exists with only partial-scaffold contents from a prior failed run. ` +
      `Remove it (rm -rf "${repoPath}") and re-run, or use /portfolio:register to register it as-is.`
    );
  } else {
    console.error(`Directory already exists: ${repoPath}. Remove it first or use /portfolio:register.`);
  }
  process.exit(4);
}

// ── scaffold ───────────────────────────────────────────────
console.log(`scaffolding ${slug} at ${repoPath}... running /warp:setup... done.`);

fs.mkdirSync(repoPath, { recursive: true });

// git init
const gitInit = spawnSync("git", ["init"], { cwd: repoPath, encoding: "utf8" });
if (gitInit.status !== 0) {
  console.error(`git init failed: ${gitInit.stderr}`);
  fs.rmSync(repoPath, { recursive: true, force: true });
  process.exit(4);
}

// Seed git identity from WarpOS's effective identity (local first, then global)
// so the initial commit never fails on a fresh sibling that has no global
// user.email/user.name configured. Local-only — never touches global config.
_seedGitIdentity(repoPath);

// copy templates
_copyTemplates(TEMPLATES_DIR, repoPath, slug);

// initial commit so gh repo create --push has something to push
const gitAdd = spawnSync("git", ["add", "-A"], { cwd: repoPath, encoding: "utf8" });
if (gitAdd.status !== 0) {
  console.error(`git add failed: ${gitAdd.stderr}`);
  process.exit(4);
}
const gitCommit = spawnSync(
  "git", ["commit", "-m", `init: scaffold ${slug} via /portfolio:new`],
  { cwd: repoPath, encoding: "utf8" }
);
if (gitCommit.status !== 0) {
  console.error(`git commit failed: ${gitCommit.stderr}`);
  process.exit(4);
}

// warp:setup — invoke installer
const setupScript = path.resolve(WARPOS_ROOT, "scripts/warp-setup.js");
if (fs.existsSync(setupScript)) {
  const setup = spawnSync(
    "node", [setupScript, repoPath, "--yes", "--skip-backup"],
    { cwd: WARPOS_ROOT, encoding: "utf8", timeout: 60_000 }
  );
  if (setup.status !== 0) {
    console.error(`/warp:setup failed:\n${setup.stderr || setup.stdout}`);
    process.exit(4);
  }
}

// ── register ───────────────────────────────────────────────
const doc = load();
doc.products = doc.products || {};
const entry = {
  slug,
  repo_path: repoPath,
  github_url: null,
  warpos_version: _readInstalledVersion(repoPath),
  last_synced: new Date().toISOString(),
  role: "product",
  remote_type: null,
  kind: null,
};
const { valid, errors } = validate(entry);
if (!valid) {
  console.error(`registry validation failed: ${errors.join("; ")}`);
  process.exit(2);
}
doc.products[slug] = entry;
save(doc);

// ── --from-brief (move brief into the new repo) ─────────────
if (fromBrief) {
  const adoptScript = path.resolve(__dirname, "adopt.js");
  const adopt = spawnSync(
    "node", [adoptScript, fromBrief, "--target-path", repoPath, "--skip-new"],
    { cwd: WARPOS_ROOT, encoding: "utf8", timeout: 30_000 }
  );
  if (adopt.stdout) process.stdout.write(adopt.stdout);
  if (adopt.stderr) process.stderr.write(adopt.stderr);
}

// ── commit the full scaffold (warp install + brief) so the repo
//    opens clean and ready ──────────────────────────────────
spawnSync("git", ["add", "-A"], { cwd: repoPath, encoding: "utf8" });
spawnSync(
  "git",
  ["commit", "-m", "chore(scaffold): warpos install" + (fromBrief ? " + brief" : "")],
  { cwd: repoPath, encoding: "utf8" }
);
// Non-fatal: a "nothing to commit" exit just means warp:setup produced no
// tracked changes beyond the initial commit. Local repo is ready regardless.

// ── GitHub remote: OPT-IN only (--github) ───────────────────
// Default path is local-only. With --github (operator-run via `!` or a
// permissive permission mode, since the agent is gated from pushing to a
// brand-new remote), create the private repo (DEC-008) and push.
let githubUrl = null;
if (wantGithub) {
  const ghResult = _ghRepoCreate(slug, repoPath);
  if (ghResult.url) {
    githubUrl = ghResult.url;
    // persist github_url back to registry
    const doc2 = load();
    if (doc2.products[slug]) {
      doc2.products[slug].github_url = githubUrl;
      doc2.products[slug].remote_type = "github";
      doc2.products[slug].last_synced = new Date().toISOString();
      save(doc2);
    }
  }
} else {
  _printLocalOnlyNextSteps(slug, repoPath);
}

// ── telemetry (TR-7) ───────────────────────────────────────
_emit("portfolio_new", {
  slug,
  repo_path_offset: _pathOffset(repoPath),
  from_brief: fromBrief || null,
  warp_setup_status: "ok",
  github: wantGithub,
  gh_repo_create_surfaced: wantGithub,
});

// ── helpers ───────────────────────────────────────────────

function _copyTemplates(srcDir, destDir, slugVal) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    // strip .tmpl suffix for dest name
    const destName = entry.name.endsWith(".tmpl")
      ? entry.name.slice(0, -5)
      : entry.name;
    const destPath = path.join(destDir, destName);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      _copyTemplates(srcPath, destPath, slugVal);
    } else {
      let content = fs.readFileSync(srcPath, "utf8");
      content = content.replace(/\{\{SLUG\}\}/g, slugVal);
      fs.writeFileSync(destPath, content, "utf8");
    }
  }
}

function _seedGitIdentity(repoPathVal) {
  // Read WarpOS's effective identity (git resolves local-then-global).
  const nameRes = spawnSync("git", ["config", "user.name"], {
    cwd: WARPOS_ROOT, encoding: "utf8",
  });
  const emailRes = spawnSync("git", ["config", "user.email"], {
    cwd: WARPOS_ROOT, encoding: "utf8",
  });
  const name = (nameRes.stdout || "").trim();
  const email = (emailRes.stdout || "").trim();
  if (name) {
    spawnSync("git", ["config", "user.name", name], {
      cwd: repoPathVal, encoding: "utf8",
    });
  }
  if (email) {
    spawnSync("git", ["config", "user.email", email], {
      cwd: repoPathVal, encoding: "utf8",
    });
  }
}

function _ghRepoCreate(slugVal, cwd) {
  // pre-check: does the name already exist on GitHub?
  const viewResult = spawnSync(
    "gh", ["repo", "view", slugVal, "--json", "isPrivate,owner"],
    { cwd, encoding: "utf8", timeout: 15_000 }
  );

  if (viewResult.status === 0) {
    try {
      const info = JSON.parse(viewResult.stdout);
      const isPrivate = info.isPrivate;
      const ownerLogin = info.owner && info.owner.login;
      // determine current gh user
      const whoami = spawnSync("gh", ["api", "user", "--jq", ".login"], {
        cwd, encoding: "utf8", timeout: 10_000
      });
      const currentUser = whoami.status === 0 ? whoami.stdout.trim() : null;

      if (isPrivate && ownerLogin && ownerLogin === currentUser) {
        // C-9b: reuse
        console.log(`note: ${currentUser}/${slugVal} already exists on GitHub (private). Reusing it as origin remote. Pushing local commits...`);
        spawnSync("git", ["remote", "add", "origin", `https://github.com/${currentUser}/${slugVal}.git`], { cwd, encoding: "utf8" });
        spawnSync("git", ["push", "-u", "origin", "HEAD"], { cwd, encoding: "utf8", timeout: 30_000 });
        return { url: `https://github.com/${currentUser}/${slugVal}` };
      } else {
        // C-9c: public or foreign-owned
        const visibility = isPrivate ? "private" : "public";
        const owner = ownerLogin || "another user";
        console.error(`⚠  cannot reuse name: github.com/${owner}/${slugVal} exists and is ${visibility === "private" ? `owned by ${owner}` : "public"}. Choose a different slug or run \`gh repo delete ${owner}/${slugVal}\` first if you own it. Local repo at ${cwd} remains intact and registered.`);
        return { url: null };
      }
    } catch {
      // parse error — fall through to create
    }
  } else if (_isAuthError(viewResult.stderr + viewResult.stdout)) {
    // C-9a: auth failure
    console.error(`⚠  gh CLI not authenticated. Local repo at ${cwd} is intact and registered. Run \`gh auth login\` then \`gh repo create ${slugVal} --private --source=. --remote=origin --push\` to finish.`);
    return { url: null };
  }
  // name is available — create
  console.log(`creating private GitHub repo: ${slugVal} (--private --source=. --remote=origin --push)...`);
  const create = spawnSync(
    "gh", ["repo", "create", slugVal, "--private", "--source=.", "--remote=origin", "--push"],
    { cwd, encoding: "utf8", timeout: 60_000 }
  );
  if (create.status !== 0) {
    if (_isAuthError(create.stderr + create.stdout)) {
      console.error(`⚠  gh CLI not authenticated. Local repo at ${cwd} is intact and registered. Run \`gh auth login\` then \`gh repo create ${slugVal} --private --source=. --remote=origin --push\` to finish.`);
      return { url: null };
    }
    console.error(`gh repo create failed: ${create.stderr || create.stdout}`);
    return { url: null };
  }

  // extract url from output
  const urlMatch = (create.stdout || "").match(/https:\/\/github\.com\/[^\s]+/);
  const url = urlMatch ? urlMatch[0] : null;

  console.log(`  ✓ remote created: ${url || `https://github.com/<owner>/${slugVal}`} (private)`);
  console.log(`  ✓ initial commit pushed`);
  console.log(`  ✓ origin set, branch ${_defaultBranch(cwd)} tracked`);
  console.log(`Next: invite collaborators with \`gh repo edit ${slugVal} --add-collaborator <username>\`.`);
  return { url };
}

function _isAuthError(output) {
  return /not logged in|auth|authentication|401|403|token/.test(output || "");
}

function _defaultBranch(cwd) {
  try {
    const r = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd, encoding: "utf8" });
    return (r.stdout || "main").trim();
  } catch {
    return "main";
  }
}

function _printLocalOnlyNextSteps(slugVal, repoPathVal) {
  console.log(`\nLocal repo ready — WarpOS installed, committed, no remote:`);
  console.log(`  ${repoPathVal}`);
  console.log(`Next — open it in its own session and work there:`);
  console.log(`  /portfolio:open ${slugVal} --spawn`);
  console.log(`Create a private GitHub remote when you want one (run from inside the repo):`);
  console.log(`  gh repo create ${slugVal} --private --source=. --remote=origin --push`);
  console.log(`Or re-run /portfolio:new with --github to do that automatically (operator-run — the agent is gated from pushing to a brand-new remote in auto mode).`);
}

function _readInstalledVersion(repoPathVal) {
  try {
    const p = path.join(repoPathVal, ".claude", "framework-installed.json");
    if (fs.existsSync(p)) {
      const d = JSON.parse(fs.readFileSync(p, "utf8"));
      return d.installedVersion || null;
    }
  } catch { /* ignore */ }
  return null;
}

function _pathOffset(absPath) {
  const os = require("os");
  try { return path.relative(os.homedir(), absPath); } catch { return "<path>"; }
}

function _emit(type, payload) {
  try {
    const loggerPath = path.resolve(__dirname, "../hooks/lib/logger.js");
    const { log } = require(loggerPath);
    log("portfolio", { type, ...payload });
  } catch { /* fail-open */ }
}
