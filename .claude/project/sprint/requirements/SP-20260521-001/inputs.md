# INPUTS — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`

> `IN-N` ids enforced by `requirement-format-guard.js`.

## IN-1 — `slug`

Per-product identifier used as registry key, scaffold dir name, GitHub repo name, deprecation-banner reference.

- **Regex:** `^[a-z0-9][a-z0-9-]{0,63}$`
- **Length:** 1-64 chars
- **Required:** yes
- **Failure modes:**
  - Empty → exit 2 with C-16 + suggested normalized form.
  - Uppercase/punctuation → exit 2 with normalized suggestion (lowercase + hyphenated).
  - Already registered → exit 2 with "<slug> already registered at <path>".
  - Collides with an existing canonical skill name (`/portfolio:list`, `/portfolio:open`, etc.) → exit 2 with "<slug> collides with a reserved skill name".

## IN-2 — `registry_path`

The HOME-dir registry file location.

- **Default:** `~/.warpos/portfolio.json` (resolved per OS: `%USERPROFILE%\.warpos\portfolio.json` on Windows).
- **Override:** `WARPOS_PORTFOLIO_REGISTRY` env var.
- **Failure modes:**
  - HOME unresolvable → exit 2 with "cannot resolve HOME dir; set WARPOS_PORTFOLIO_REGISTRY to override".
  - Parent dir not writable → exit 4 with target path.
  - Corrupt JSON on read → exit 2; prompt user to repair or reinit.

## IN-3 — `repo_path`

Absolute path to a product's working directory (sibling on disk).

- **Type:** absolute filesystem path.
- **Must exist:** yes (at register/adopt time).
- **Must be inside a configured workspace root:** no — siblings can live anywhere the user puts them.
- **Failure modes:**
  - Relative path → resolve to absolute relative to CWD, then validate.
  - Non-existent → exit 4 with "directory does not exist".
  - Not a git repo → warn but allow register; `/portfolio:status` will surface "not a git repo".
  - Path traversal attempt (`..` after resolve) escaping the operator's home tree → exit 2.

## IN-4 — `github_url`

Optional GitHub remote for a registered product.

- **Schemes:** `https://`, `git@github.com:` (SSH), or `git://`.
- **Hostname:** `github.com` only in v1 (per Plan Contract assumption; future `remote_type` enum reserved).
- **Optional:** yes. Many products may exist locally before any remote is created.
- **Failure modes:**
  - Non-github hostname → reject in v1 with "remote_type=github only for now".
  - Malformed URL → exit 2 with parse-error context.

## IN-5 — `from_brief_slug`

When `/portfolio:new <slug> --from-brief <existing-slug>` is invoked, the source brief slug to consume.

- **Regex:** same as IN-1.
- **Must resolve to:** `_docs/briefs/<slug>/` OR `_docs/clones/<slug>/` under the WarpOS canonical repo (or via `paths.briefsRoot` / `paths.clonesRoot`).
- **Failure modes:**
  - Brief dir not found at either location → exit 2 with both attempted paths.
  - Brief dir exists but is empty → exit 2 with hint to run `/portfolio:bootstrap <slug>` first.

## IN-6 — `dispatch_skill_and_args`

The skill name + args passed through to a target product via `/portfolio:dispatch`.

- **Format:** `/portfolio:dispatch <slug> /<namespace>:<skill> [args...]`
- **Validation:** skill must exist in the target product's `.claude/commands/` (best-effort check; absence → warn-but-proceed since the target may have skills the home base lacks).
- **Failure modes:**
  - Skill name not prefixed with `/` → reject with usage hint.
  - Target product missing the skill → warn, proceed (let target's own dispatch handle the not-found).
