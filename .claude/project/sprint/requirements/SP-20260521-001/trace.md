# TRACE — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`

> `TR-N` ids. Events go to `paths.eventsFile` via `scripts/hooks/lib/logger.js`. Fail-open.

## TR-1 — `portfolio_paths_added`
Fires once at install / `/warp:update` apply when the 4 new paths keys land in `.claude/paths.json`.
Payload: `{added_keys: [...], schema_version: "v5"}`.

## TR-2 — `portfolio_registry_initialized`
Fires the first time `~/.warpos/portfolio.json` is created (lazy init on first `/portfolio:list`, `/portfolio:register`, etc.).
Payload: `{registry_path, created_at, schema: "warpos/portfolio-registry/v1"}`.

## TR-3 — `portfolio_list`
Fires on every `/portfolio:list` invocation.
Payload: `{product_count, slugs: [...]}`.

## TR-4 — `portfolio_register`
Fires on `/portfolio:register` success or rejection.
Payload: `{slug, repo_path, github_url, status: "registered" | "rejected", rejection_reason?}`.

## TR-5 — `portfolio_open`
Fires on `/portfolio:open` (without `--spawn`).
Payload: `{slug, repo_path}`.

## TR-6 — `portfolio_spawn`
Fires on `/portfolio:open --spawn`.
Payload: `{slug, repo_path, terminal_used: "wt"|"cmd"|"powershell"|"iterm"|"terminal.app"|"gnome-terminal"|"xterm"|"fallback_copyable", active_cwd_warning_emitted: boolean, spawn_status: "ok"|"binary_missing"|"failed"}`.

## TR-7 — `portfolio_new`
Fires on `/portfolio:new` completion.
Payload: `{slug, repo_path, from_brief?: <existing-slug>, warp_setup_status, gh_repo_create_surfaced: true}`.

## TR-8 — `portfolio_adopt`
Fires on `/portfolio:adopt` completion.
Payload: `{slug, source_brief_path, target_repo_path, files_moved_count}`.

## TR-9 — `portfolio_status`
Fires on `/portfolio:status`.
Payload: `{product_count, dirty_count, stale_count, remote_unreachable_count}`.

## TR-10 — `portfolio_dispatch`
Fires per dispatch invocation.
Payload: `{slug, skill, args_hash, target_claude_project_dir, exit_code, duration_ms}`.

## TR-11 — `portfolio_sync`
Fires once at start + once per product + once at end.
Payload: `{phase: "start"|"per_product"|"end", slug?, from_version?, to_version?, status?}`.

## TR-12 — `portfolio_namespace_alias_invoked`
Fires when a deprecated `/product:*` alias is called.
Payload: `{deprecated_skill: "/product:<name>", redirected_to: "/portfolio:<name>", session_first_invocation: boolean}`.

## TR-13 — `portfolio_script_migration_complete`
Fires once at sprint execute completion when `scripts/product/{bootstrap,clone}.js` are re-exports and `scripts/portfolio/` holds the canonical implementations.
Payload: `{migrated_scripts: [...], re_exports_in_place: [...]}`.

## TR-14 — `portfolio_dogfood_migration`
Fires twice during execute — once for dreamteams adoption, once for companycam adoption.
Payload: `{slug, source_path, target_path, files_moved, status: "ok"|"partial"|"failed"}`.
