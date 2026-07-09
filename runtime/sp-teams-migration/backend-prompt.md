You are a backend/code-quality reviewer. Review a set of HOOK changes that migrate WarpOS off the removed Claude Code TeamCreate/TeamDelete tools (v2.1.178). These hooks run on EVERY session — a fail-open regression would silently break dispatch gating for every session. Render a BINDING verdict: PASS or FAIL.

CONTEXT: Claude Code v2.1.178 removed TeamCreate/TeamDelete; teams are now implicit + session-scoped (spawn via Agent(name, run_in_background:true)). CRUCIALLY: the harness STILL writes ~/.claude/teams/<session>/config.json with a members[] array, BUT now names the team `session-<uuid>` instead of the old `<slug>-<mode>`. So the migration is mostly a directive-string swap, EXCEPT one real logic fix.

THE LOAD-BEARING LOGIC FIX (review this hardest — scripts/teams/lifecycle.js): teamBelongsToProject() previously matched a team to a project by NAME slug only (name===slug || name.startsWith(slug+'-')). With the session-<uuid> rename that ALWAYS returns false for our own team, so projectTeams() goes empty, verify() falsely reports "no team live", AND teardown mistakes the real team for foreign (never tears it down). The fix adds a member-CWD arm: a team is ours iff its NAME carries our slug (legacy back-compat) OR a member cwd === project root or strictly under it. The safety invariant that MUST be preserved: a FOREIGN team (different project, no matching member cwd) must STILL be "not ours" and never kill-eligible (the wrong-project-survives invariant).

EVALUATE:
- Is fail-open PRESERVED in every hook (no new throw path that could crash/block a session)? The team-guard, session-start, lifecycle hooks must never crash on malformed input.
- Is the teamBelongsToProject cwd-arm CORRECT and SAFE? Could it now match a FOREIGN team (e.g. a sibling project rooted elsewhere)? Is the strict-containment (=== root or startsWith root+'/') right, or could a sibling like /proj/warpos-other match /proj/warpos? (Check the trailing-separator logic.)
- The back-compat: teamBelongsToProject is called as both teamBelongsToProject(teamObj, slug, dir) [internal] and teamBelongsToProject(bareName, slug) [external/tests]. Does the bare-string form still work (arm (a) only, arm (b) safely returns false without a projectDir)?
- Are the directive-string edits (team-guard block message, session-start teamInitDirective, lifecycle verify() directive) consistent + correct (point at Agent-spawn, not the dead tools)?
- Any logic the directive edits accidentally changed?

Output VERDICT: PASS or VERDICT: FAIL, then findings tagged [CRITICAL]/[HIGH]/[MEDIUM]/[LOW] with file:line/mechanism/fix.

=== DIFF: hooks (team-guard.js, session-start.js, lifecycle.js, install.js) vs main ===
diff --git a/scripts/check/install.js b/scripts/check/install.js
index 10a02680..3704c03d 100644
--- a/scripts/check/install.js
+++ b/scripts/check/install.js
@@ -108,7 +108,14 @@ function main() {
       if (!fs.existsSync(dir)) return false;
       return fs.readdirSync(dir).some((f) => f.endsWith(".md"));
     }),
-    check("settings.json sets CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1", () => {
+    // E-TEAMS-MIGRATION-001: as of Claude Code v2.1.178 (2026-06-15) the
+    // experimental agent-teams tools (TeamCreate/TeamDelete) were REMOVED and teams
+    // became IMPLICIT + session-scoped (teammates spawn via Agent(run_in_background));
+    // CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS is phasing out and is NO LONGER REQUIRED.
+    // So this is now an INFORMATIONAL presence check, NOT an install-completeness
+    // gate: present OR absent both PASS (an unparseable settings.json is still a real
+    // failure, caught here and by the dedicated settings.json check above).
+    check("agent-teams flag (legacy — informational, no longer required)", () => {
       const f = path.join(REPO_ROOT, ".claude", "settings.json");
       if (!fs.existsSync(f))
         return { ok: false, detail: "settings.json missing" };
@@ -119,11 +126,12 @@ function main() {
         return { ok: false, detail: `unparseable: ${e.message}` };
       }
       const v = s && s.env && s.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
-      if (v === "1" || v === 1 || v === true) return true;
+      const present = v === "1" || v === 1 || v === true;
       return {
-        ok: false,
-        detail:
-          'missing — /mode:adhoc persistent teams (TeamCreate/SendMessage) require this. Add settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS="1" then restart Claude Code.',
+        ok: true,
+        detail: present
+          ? "present (legacy flag — harmless; v2.1.178 made teams implicit, safe to remove)"
+          : "absent (fine — v2.1.178 removed TeamCreate/TeamDelete; teams are implicit + session-scoped, spawn via Agent)",
       };
     }),
     // WG-4: sprint-subsystem readiness. WG-1/2/3/10 all survived /warp:setup and
diff --git a/scripts/hooks/session-start.js b/scripts/hooks/session-start.js
index b8699c0c..5818d08d 100644
--- a/scripts/hooks/session-start.js
+++ b/scripts/hooks/session-start.js
@@ -400,6 +400,25 @@ process.stdin.on("end", () => {
         /* prune is non-blocking */
       }
 
+      // E-TEAMS-MIGRATION-001: detect ORPHANED dispatch subprocesses (the reap /
+      // bg-drop class — a provider CLI whose wrapper was reaped, still running with
+      // no completion record). pruneDeadLocks above clears the dead lock FILE; this
+      // surfaces the orphaned PROCESS. REPORT-ONLY here (dry-run, never auto-kills on
+      // session start — the kill is a deliberate /warp:health --apply or manual
+      // action). Conservative-by-construction + fail-open (reaps nothing on any
+      // ambiguity); wrapped so a slow/failed enumeration never blocks session start.
+      try {
+        const { run: reapOrphans } = require("../dispatch/reap-orphans");
+        const r = reapOrphans({ apply: false });
+        if (r && r.orphanCount > 0) {
+          checks.push(
+            `Dispatch orphans: ${r.orphanCount} orphaned subprocess(es) detected — run \`node scripts/dispatch/reap-orphans.js --apply\` to reap`,
+          );
+        }
+      } catch {
+        /* orphan detection is non-blocking, fail-open */
+      }
+
       // Prune old session/instance log directories (keep last 5)
       // Dirs are named "s-{sid}_{iid}" (new) or "s-{sid}" (legacy)
       try {
@@ -627,19 +646,28 @@ process.stdin.on("end", () => {
           }
           if (!live) {
             const team = `${slug}-${curMode}`;
-            const calls = [
-              `  TeamCreate(team_name:"${team}", agent_type:"alpha", description:"${curMode} persistent team — ${spec.desc}")`,
-              ...spec.spawns.map(
+            // Claude Code v2.1.178 (2026-06-15) REMOVED TeamCreate/TeamDelete. The
+            // team is now IMPLICIT + session-scoped: the FIRST named background
+            // subagent the harness spawns creates the session team (and the harness
+            // still writes ~/.claude/teams/<session>/config.json with members[]).
+            // So there is no separate TeamCreate call — the directive is just the
+            // named Agent spawns. team_name is still ACCEPTED by the harness (kept
+            // for a stable, sibling-project-distinct handle), but is no longer the
+            // thing that creates the team. (E-TEAMS-MIGRATION-001.)
+            const calls = spec.spawns
+              .map(
                 ([t, nm, load]) =>
-                  `  Agent(subagent_type:"${t}", team_name:"${team}", name:"${nm}", run_in_background:true, prompt:"STARTUP DIRECTIVE — SendMessage readiness to team-lead, then go idle (do NOT auto-claim tasks). Load: ${load}.")`,
-              ),
-            ].join("\n");
+                  `  Agent(subagent_type:"${t}", name:"${nm}", run_in_background:true, team_name:"${team}", prompt:"STARTUP DIRECTIVE — SendMessage readiness to team-lead, then go idle (do NOT auto-claim tasks). Load: ${load}.")`,
+              )
+              .join("\n");
             teamInitDirective =
               `⛔ ${curMode.toUpperCase()} MODE IS ACTIVE (mode.json) but the persistent team is NOT up. ` +
-              `Per /mode:${curMode} Step 1.75, your FIRST action MUST be to stand up the company faces — ` +
-              `the SYSTEM's procedure with the RIGHT agents, NOT improvised general-purpose workers, NOT a memory summary:\n${calls}\n` +
+              `Per /mode:${curMode} Step 1.75, your FIRST action MUST be to stand up the company faces by spawning them ` +
+              `as NAMED BACKGROUND SUBAGENTS — the SYSTEM's procedure with the RIGHT agents, NOT improvised ` +
+              `general-purpose workers, NOT a memory summary. The first spawn implicitly creates the session-scoped team ` +
+              `(TeamCreate/TeamDelete were removed in Claude Code v2.1.178):\n${calls}\n` +
               `Then WAIT for both readiness pings (SendMessage to team-lead) before any boundary consult or work; do NOT proceed with the task until the team acks. ` +
-              `(E-SYSTEM-ORG-001 S-12 / ED-035; this team-skip recurred 2026-06-06 & 2026-06-08 — "where's the team?" / "where's epsilon?".)`;
+              `(E-SYSTEM-ORG-001 S-12 / ED-035 / E-TEAMS-MIGRATION-001; this team-skip recurred 2026-06-06 & 2026-06-08 — "where's the team?" / "where's epsilon?".)`;
           }
         }
       } catch {
diff --git a/scripts/hooks/team-guard.js b/scripts/hooks/team-guard.js
index 053ce8f5..d35499b5 100644
--- a/scripts/hooks/team-guard.js
+++ b/scripts/hooks/team-guard.js
@@ -491,8 +491,11 @@ process.stdin.on("end", () => {
 
     // ── Sprint-context persistent-team advisory (ED-035) ──────────────────
     // In sprint mode the operator expects work to flow through a PERSISTENT team
-    // (TeamCreate + named members, reusable + DM-able), NOT fire-and-forget one-off
-    // agents. The team-spawn step lives inside /mode:sprint's body — bypassed when a
+    // (named background subagents — reusable + DM-able via SendMessage), NOT
+    // fire-and-forget one-off agents. (As of Claude Code v2.1.178 the team is the
+    // IMPLICIT session-scoped team the harness creates on the first named spawn;
+    // TeamCreate/TeamDelete were removed — E-TEAMS-MIGRATION-001.)
+    // The team-spawn step lives inside /mode:sprint's body — bypassed when a
     // session kicks off from a /clear'd handoff with "/mode:sprint" as embedded text
     // (treated as context, the Skill never invoked) — so it skips SILENTLY and recurs
     // (RT-2026-06-06-sprint-team-orphaned-by-node-seam + the 2026-06-08 recurrence).
@@ -667,12 +670,14 @@ process.stdin.on("end", () => {
             decision: "block",
             reason:
               `⛔ SPRINT MODE + no correct team live (${why}). Stand up the company ` +
-              `faces FIRST — TeamCreate {name:"warpos-sprint"}, then ` +
-              `Agent(subagent_type:epsilon …) + Agent(subagent_type:beta …) — then ` +
-              `dispatch workers through the team (pass team_name). Bootstrap calls ` +
-              `(faces / explore / plan / any team_name) are allowed. Kill-switch: ` +
+              `faces FIRST by spawning them as named background subagents — ` +
+              `Agent(subagent_type:"epsilon", name:"Epsilon", run_in_background:true) + ` +
+              `Agent(subagent_type:"beta", name:"Beta", run_in_background:true) (the first ` +
+              `spawn implicitly creates the session-scoped team — TeamCreate/TeamDelete were ` +
+              `REMOVED in Claude Code v2.1.178). Then dispatch workers as named subagents. ` +
+              `Bootstrap calls (faces / explore / plan) are allowed. Kill-switch: ` +
               `WARPOS_DISABLE_TEAM_GATE=1 or touch .claude/runtime/.team-gate-off. ` +
-              `(E-SYSTEM-ORG-001 S-12c)`,
+              `(E-SYSTEM-ORG-001 S-12c; E-TEAMS-MIGRATION-001)`,
           }),
         );
         process.exit(0);
@@ -694,8 +699,10 @@ process.stdin.on("end", () => {
       }
       if (!teamReady && n >= 2) {
         const advice = !teamActive
-          ? `no active persistent team — stand up the company faces (TeamCreate + ` +
-            `subagent_type epsilon + beta; α leads, ε conducts) before fanning out`
+          ? `no active persistent team — stand up the company faces by spawning named ` +
+            `background subagents (Agent subagent_type:epsilon + subagent_type:beta, ` +
+            `run_in_background:true; α leads, ε conducts; the first spawn implicitly creates ` +
+            `the session team — TeamCreate was removed in v2.1.178) before fanning out`
           : `a team is active but it is MISSING ε (Epsilon — the sprint conductor / ` +
             `quality-gate). The persistent SPRINT team is the named faces α+ε+β, not ` +
             `generic general-purpose workers — spawn subagent_type:epsilon into the team`;
diff --git a/scripts/teams/lifecycle.js b/scripts/teams/lifecycle.js
index 5de08501..66952f06 100644
--- a/scripts/teams/lifecycle.js
+++ b/scripts/teams/lifecycle.js
@@ -8,9 +8,13 @@
 // ─────────────────────────────────────────────────────────────────────────
 // THE HONEST CEILING (feasibility-corrected 2026-06-08; plan §8.4 / §20)
 // ─────────────────────────────────────────────────────────────────────────
-//   • Teams are a HARNESS primitive (TeamCreate / TeamDelete / SendMessage /
-//     Agent). A Node script CANNOT spawn a teammate, CANNOT call TeamDelete,
-//     and CANNOT force-kill a live in-process teammate. So:
+//   • Teams are a HARNESS primitive. As of Claude Code v2.1.178 (2026-06-15) they
+//     are IMPLICIT + session-scoped: a teammate is spawned via Agent(name,
+//     run_in_background:true) — the first such spawn creates the session team
+//     (TeamCreate / TeamDelete were REMOVED; SendMessage is unchanged). A Node
+//     script CANNOT spawn a teammate, CANNOT delete a team (no TeamDelete; and the
+//     session team is reaped with the session), and CANNOT force-kill a live
+//     in-process teammate. So: (E-TEAMS-MIGRATION-001)
 //       - verify()   REPORTS liveness + returns the EXACT spawn directive for
 //                    the model to execute — it does not itself spawn.
 //       - teardown() is BEST-EFFORT: it RECORDS the shutdown request, (only in
@@ -176,36 +180,63 @@ function listTeams(opts = {}) {
   return out;
 }
 
-// ── THE LOAD-BEARING SLUG FILTER ────────────────────────────────────────────
-/** Does `teamName` belong to the project identified by `slug`?
- *  TRUE  iff name === slug  OR  name startsWith `${slug}-`.
- *  The trailing "-" is load-bearing: it stops prefix bleed (slug "warp" must
- *  NOT match "warpos-sprint"; slug "warpos" must NOT match "warposx-sprint").
- *  A team that cannot be attributed (UUID name, foreign slug) is NOT ours and
- *  is therefore NEVER eligible for a kill — the conservative, safe default. */
-function teamBelongsToProject(teamName, slug) {
-  const t = String(teamName || "").toLowerCase();
+// ── THE LOAD-BEARING PROJECT-SCOPE FILTER (name-slug OR member-cwd) ───────────
+// E-TEAMS-MIGRATION-001: Claude Code v2.1.178 (2026-06-15) made teams IMPLICIT +
+// session-scoped — the harness now names a team `session-<uuid>` (NOT the
+// `<slug>-<mode>` handle session-start mints). So the name-slug arm ALONE silently
+// stops matching our own team: every WarpOS team reads as FOREIGN, projectTeams()
+// goes empty, verify() falsely reports "no team live", AND teardown never reaps the
+// real team (it's mistaken for another project's). The harness STILL writes
+// members[] with each member's `cwd`, so we add a member-CWD arm (mirrors
+// team-guard.js isProjectScopedTeam arm (b), the existing project-scope authority).
+// SAFETY IS PRESERVED: a team matches ONLY if its NAME carries our slug OR a MEMBER
+// CWD is our project root exactly / strictly under it. A team with neither (foreign
+// slug + foreign/empty member cwd) is STILL not ours → never kill-eligible (the
+// conservative default the wrong-project-survives invariant depends on). The
+// member-cwd arm is STRICT containment (=== root or startsWith root + "/"), never
+// parent-containment — a team rooted ABOVE the project is not ours.
+/** Does `team` belong to the project identified by `slug` + `projectDir`?
+ *  TRUE iff (a) name === slug OR name startsWith `${slug}-`  [legacy handle], OR
+ *          (b) any member cwd is the project root exactly, or strictly under it
+ *              [v2.1.178 implicit session-team].
+ *  `team` may be the team object ({name, members}) OR a bare name string (back-
+ *  compat — bare string has no members, so only arm (a) can match). */
+function teamBelongsToProject(team, slug, projectDir) {
+  const isObj = team && typeof team === "object";
+  const name = String((isObj ? team.name || team.team_name : team) || "")
+    .toLowerCase();
   const s = String(slug || "").toLowerCase();
-  if (!t || !s) return false;
-  return t === s || t.startsWith(s + "-");
+  // (a) legacy name-slug arm. The trailing "-" stops prefix bleed (slug "warp"
+  // must NOT match "warpos-sprint"; "warpos" must NOT match "warposx-sprint").
+  if (s && name && (name === s || name.startsWith(s + "-"))) return true;
+  // (b) member-cwd arm (v2.1.178 session-<uuid> teams). STRICT containment only.
+  const normProject = String(projectDir || "").replace(/\\/g, "/").toLowerCase();
+  if (!normProject) return false; // no project anchor → cannot attribute by cwd
+  const members = isObj && Array.isArray(team.members) ? team.members : [];
+  return members.some((mem) => {
+    const c = String((mem && mem.cwd) || "").replace(/\\/g, "/").toLowerCase();
+    return c && (c === normProject || c.startsWith(normProject + "/"));
+  });
 }
 
-/** Project-scoped teams (kill-eligible) for the resolved slug. */
+/** Project-scoped teams (kill-eligible) for the resolved slug + project dir. */
 function projectTeams(opts = {}) {
   const slug = projectSlug(opts);
-  return listTeams(opts).filter((t) => teamBelongsToProject(t.name, slug));
+  const dir = projectDir(opts);
+  return listTeams(opts).filter((t) => teamBelongsToProject(t, slug, dir));
 }
 
 /** FOREIGN teams — every team that does NOT belong to this project. These MUST
  *  survive every teardown (the wrong-project-survives invariant). */
 function foreignTeams(opts = {}) {
   const slug = projectSlug(opts);
-  return listTeams(opts).filter((t) => !teamBelongsToProject(t.name, slug));
+  const dir = projectDir(opts);
+  return listTeams(opts).filter((t) => !teamBelongsToProject(t, slug, dir));
 }
 
 // ── Verify (REPORT + spawn directive; never spawns) ─────────────────────────
 /** Is the correct team live for this mode? Returns a status + (when not live)
- *  the EXACT TeamCreate/Agent directive the model must run. Never spawns. */
+ *  the EXACT named-Agent spawn directive the model must run. Never spawns. */
 function verify(opts = {}) {
   const slug = projectSlug(opts);
   const mode = currentMode(opts);
@@ -229,15 +260,16 @@ function verify(opts = {}) {
   let directive = null;
   if (!live && faces.length) {
     const team = `${slug}-${mode}`;
+    // E-TEAMS-MIGRATION-001: no TeamCreate call — v2.1.178 removed it. The first
+    // named background subagent implicitly creates the session-scoped team; the
+    // harness still accepts team_name + writes the members[] config. The directive
+    // is therefore just the named Agent spawns (run_in_background:true).
     directive = {
       team_name: team,
-      calls: [
-        `TeamCreate(team_name:"${team}", agent_type:"alpha")`,
-        ...faces.map(
-          (f) =>
-            `Agent(subagent_type:"${f}", team_name:"${team}", name:"${f}", run_in_background:true)`,
-        ),
-      ],
+      calls: faces.map(
+        (f) =>
+          `Agent(subagent_type:"${f}", name:"${f}", run_in_background:true, team_name:"${team}")`,
+      ),
     };
   }
 

=== END DIFF ===
