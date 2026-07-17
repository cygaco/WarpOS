# Cabinet consult — gpt-5.6-sol @ ultra — 2026-07-17

## Overall judgment

Do not ratify the recommendations as written. Ratify the kernel thesis and most of the architectural direction, subject to material amendments.

The plan’s central weakness is that it can produce a false-green version of portability: provider-neutral documents, generated shims, and a local Git hook may all exist while:

- `agy` remains unwired;
- model routing still has known defects;
- a non-Claude helm can bypass the wrappers;
- the candidate tree can potentially alter its own enforcers;
- no trusted component controls the final mutation or merge.

That is not provider-independent enforcement. It is provider-independent checking invoked through cooperative entry points.

## Q1. Packet partition

The partition is directionally right, but the labels are too generous. Almost nothing from a three-week-stale packet should be “ADOPT” verbatim. Ratify extracted mechanisms after reconciliation, not packet documents.

| Material | Independent judgment |
|---|---|
| **01 Master Prompt** | Reject it as the control-plane driver. Adapt it into a minimal manual bootstrap for generic chat/API hosts that do not discover repository instructions automatically. Such a host still needs a way to locate the runtime contract, bind a role, and run a capability probe. |
| **04 Interoperability + 16 Top-Level Portability** | Adopt the architecture, but merge these into one normative runtime contract or make 16 its conformance profile. Two overlapping portability contracts will drift. |
| **05 Instruction Compiler** | Adapt, not adopt. Start with a canonical neutral source, provider-specific projections, deterministic generation, drift checks, and binding tests. A full compiler may be warranted later. |
| **06 WorkOrder/ResultEnvelope** | Adopt the versioned interface and adapt implementation onto the existing ledger. Pull its minimum schema forward; it is foundational to routing, enforcement, identity, and resumption. |
| **08 Dispatch/Liveness** | Reject only the greenfield rewrite. Adapt and consolidate the remaining mechanisms. Calling this area “80% done” is dangerously reassuring while `agy`, route resolution, provider-default models, and harness-model leakage remain unresolved. |
| **09 Packs** | Reject a second authoritative manifest or runtime abstraction. Preserve packaging as a generated, versioned distribution view of the existing registry. Interoperability eventually needs installable capability bundles; it does not need another source of truth. |
| **10/11 Product guardrails** | Correctly moved out of the kernel, provided “WarpOS 1.0” is explicitly defined as kernel readiness rather than generated-product production readiness. |
| **13/15 Checklists and gates** | Elevate these into the executable conformance matrix for 04–06. Otherwise the plan adopts policy without proof. |
| **17 Do Not Build** | Adopt as a temporary scope rule, with exception authority and review/sunset criteria. It is governance discipline, not a kernel component. |

Several specific corrections matter:

- The prompt-size floor in 06 is a poor completeness test. It rewards padding. Validate required semantics: objective, authority, immutable base, allowed scope, acceptance checks, evidence requirements, and expected outputs.
- WorkOrder/Envelope should include schema version, correlation ID, effective role/provider/model, base and result tree hashes, allowed capabilities and paths, retry lineage, evidence references, and bounded terminal states such as `success`, `partial`, `blocked`, `failed`, and `cancelled`.
- `ok:true` cannot be treated as proof by itself. It is a claim that must be tied to independently validated evidence.
- “Worktree base = live_head” is not reproducible. Capture an immutable base commit and separately enforce freshness against the intended integration head.
- “No Alpha poison” is too literal. The rule should catch any unconditional role, authority, approval, audience, or provider assignment in an ambient neutral instruction surface.

So: rejecting the master prompt as driver and packs as a second authoritative layer is correct. Rejecting their bootstrap and packaging functions would be a mistake.

## Q2. Security judge swap

Swapping the Fable-5 judge to `claude-opus-4-8@max` is a sound tactical unblocker, but not a complete architectural answer. Excluding WarpOS from its own security review would be indefensible; the framework is the trusted computing base and deserves stricter review, not an exemption.

Conditions I would attach to the swap:

- A judge refusal, malformed verdict, or missing evidence must produce `BLOCKED/INCONCLUSIVE`, never a pass.
- Do not automatically interpret a safeguard refusal as a model defect and retry with a more permissive model. First determine whether the prompt unnecessarily asks the judge to reproduce operational exploit material.
- Hunters should emit structured, bounded findings. Repository prose, code, and hunter reports are untrusted inputs and can contain prompt injection.
- Test the replacement against a fixed canary corpus covering legitimate dual-use findings, malicious repository instructions, unsupported claims, hunter disagreement, and missing evidence.
- Record that the final judge is now the same model and effort as the Claude hunter. Separate invocations give context independence, but not model independence; correlated blind spots remain.
- Put a deterministic completeness and traceability gate before model adjudication.
- Do not silently fallback the judge. Retry only with bounded defensive reframing, then fail closed.

There is also a wider issue: keeping Fable-5 at α means Alpha may later ingest the same raw security material that trips the judge. Structured security envelopes and content isolation are therefore necessary regardless of which model occupies the judge seat.

Finally, `@max` is a cost/reasoning setting, not a security property. Its use should be justified by measured adjudication quality, not assumed to solve refusals.

## Q3. Operator voice

The intended boundary is right; the proposed representation is incomplete.

Keeping operator-facing style out of ambient worker files is sensible. Keeping its semantics entirely out of provider-neutral policy is not. That would give Claude a behavior that Codex or Antigravity helms may never receive, contradicting portability.

The policy should live in the portable runtime contract and be projected only into the relevant host binding. The proper discriminator is not simply “top-level session” but audience and deliverable:

- `audience: operator` — lead with a concise plain-language outcome;
- `audience: agent` — technical operational detail;
- `audience: artifact` — follow the artifact’s own style requirements.

A worker may be drafting operator-facing prose, while a top-level session may be authoring a deeply technical specification. Top-level-versus-worker alone misclassifies both.

I would also replace “short ELI5” with something less destructive:

> Lead with a concise plain-language answer; include technical detail when consequential, safety-relevant, or requested.

Failure modes to test include nested dispatch, compaction/resumption, copied text that merely mentions “the operator,” explicit requests for technical depth, and workers producing user-facing artifacts. A one-line prompt convention is useful guidance, but it should not be described as binding enforcement without behavioral tests.

## Q4. Identity pollution

The three proposed measures are necessary but not sufficient. “Real but mild” is also premature: observed contamination may be mild, but the potential consequence is authority escalation. Its practical severity is unmeasured until role-precedence tests exist.

My preferred model is:

1. The ambient root bootloader is neutral.
2. A validated runtime binding explicitly assigns Alpha to a top-level session.
3. A validated WorkOrder or dispatch binding explicitly assigns every worker.
4. An unbound dispatched worker fails closed as `UNBOUND`; it never defaults to President.

The conditional “you are Alpha unless another role binds you” is acceptable as a transition, but it still asks a model to arbitrate conflicting prose. Explicit trusted binding is stronger.

Additional requirements:

- Define one authoritative precedence graph: validated WorkOrder/CLI binding → explicit top-level runtime binding → unbound. Repository prose must not manufacture a higher-authority binding.
- Scan the effective instruction graph, not only root `CLAUDE.md` and `AGENTS.md`: imports, nested instruction files, provider shims, agent specs, command templates, generated files, stale worktrees, and handoff prompts.
- Scan for authority pollution as well as identity words: unconditional permissions, approval power, canonical-write authority, merge/deploy authority, or operator audience.
- Record `effective_role`, binding source, WorkOrder ID, provider/model, cwd/write roots, and instruction-bundle digest in dispatch evidence.
- Treat candidate modifications to `CLAUDE.md`, `AGENTS.md`, provider shims, and enforcers as untrusted changes. Authoritative bindings and checks should come from a pinned control plane, not whatever version the candidate branch supplies.
- Separate logical role routing from invocation-channel capability. A harness teammate spawn must resolve through a Claude-only execution route even if the logical role’s registry default is GPT.

“Neutral dispatch cwd” should not be adopted globally without provider-specific tests. Changing cwd may change Codex’s sandbox root, prevent access to the intended worktree, stop required project configuration from loading, or accidentally expose the canonical checkout. Reviewers should receive read-only evidence; builders should receive exactly one isolated worktree as their write root. The desired property is neutral, explicit instruction binding—not an arbitrary neutral directory.

## Q5. Universal enforcement adapter

The narrow scope is right, but the claim that Git is the universal choke point is wrong.

A pre-commit hook can be absent, replaced, bypassed with `--no-verify`, bypassed through plumbing operations, or avoided because the provider never commits. It also fires too late to prevent a secret from being written, logged, read, or exfiltrated.

Pre-commit should be fast developer feedback, not the authority boundary.

The enforceable architecture should be:

`untrusted provider/worktree → exact proposed tree + ResultEnvelope → pinned trusted checker → integration of that exact checked tree`

The authoritative gate should:

- validate an exact base and head/tree hash, not a mutable worktree diff;
- bind the verdict to the WorkOrder, check-suite version, and evidence;
- execute checks from a pinned trusted copy outside the candidate tree;
- fail closed on missing, crashed, timed-out, or unknown checks;
- merge precisely the object that was validated, preventing check/merge TOCTOU;
- cover staged, unstaged, untracked, renamed, deleted, binary, symlink, submodule, and generated-file cases;
- be the only permitted route into the protected branch, with CI or server-side enforcement where available.

Shared check libraries are still the right implementation direction. Claude hooks can use them for early prevention, pre-commit can use them for feedback, and the trusted integration controller can use them authoritatively. The authoritative controller must not import the candidate branch’s possibly modified checker.

I would also add:

- WorkOrder scope and protected-path checks;
- dependency-admission and manifest/path-registry consistency;
- store/schema integrity;
- explicit sandbox, network, credential, dispatch, merge, and deploy capability profiles per provider.

Do not mirror all 44 session-lifecycle hooks. That part of Alex’s judgment is correct. But portable runtime invariants—started, completed, died, timed out, exhausted quota, approval state, resume state—must move out of Claude lifecycle hooks and into the provider-neutral dispatch/control plane.

The honest promise is therefore “provider-independent artifact acceptance and integration.” Preventing every unsafe action by an arbitrary helm additionally requires OS sandboxing, credential minimization, restricted network access, and a trusted runtime that retains merge/deploy authority.

## Q6. Sprint queue

The proposed ordering is not right. SP-003 depends on a minimal WorkOrder/Envelope contract, so putting the adapter before SP-004 invites rework. SP-002 is also overloaded with routing hotfixes, identity architecture, cwd behavior, security routing, and operator UX.

More seriously, the queue omits two live blockers identified by its own audits:

- the `agy` lane is down/unwired;
- ED-205, provider override → provider-default-model resolution, is a core routing defect.

Changing the Claude judge cannot restore a three-lab panel while the Google lane is unavailable.

I would sequence it as follows.

### 0. Kernel contract and conformance gate

Define before implementation:

- one merged 04/16 runtime contract;
- the trust boundary and authoritative integration point;
- provider × capability × helm-level support matrix;
- role-binding precedence;
- minimal WorkOrder fields;
- executable conformance fixtures harvested from 13/15;
- log/evidence retention classes.

This is not release ceremony. It prevents building incompatible adapters.

### 1. Routing and security truth

Fix and prove:

- `agy` headless dispatch;
- ED-205 default-model resolution;
- consolidated capability-aware route resolution;
- Claude-only harness-spawn model selection;
- actual effective provider/model recording;
- the security-judge mitigation.

Exit only when the entire three-lab panel runs end to end and missing lanes or judge failure block correctly.

### 2. Identity and host portability

Implement:

- explicit role bindings;
- neutral canonical instruction source and provider projections;
- conditional Claude behavior only as a transition;
- expanded authority/identity pollution checks;
- generic bootstrap harvested from 01;
- provider-specific cwd/sandbox tests.

Treat operator voice as a small follow-on; it should not share the kernel ratification boundary.

### 3. Full WorkOrder/ResultEnvelope integration

Add immutable base/head identity, allowed scope and capabilities, evidence, terminal-state taxonomy, retry lineage, started-before-spawn, quota/death states, and ED-069/070/071 wiring.

### 4. Trusted enforcement adapter

Land the pinned integration controller, shared checks, provider-specific early triggers, and optional pre-commit feedback. Test bypasses and checker self-modification explicitly.

Shared-check extraction and fixture development can begin earlier, but the authoritative gate should wait for the minimum execution contract.

### Runtime retention parallelism

Runtime-hygiene analysis and non-destructive fixtures can run in parallel. Rotation, pruning, or shared hook/registry changes should not run concurrently without an explicit merge order.

The supplied retention proposal is not ready for ratification:

- Gitignored does not mean disposable; handoffs, events, and dispatch records may be the only reconstruction evidence.
- One `.1` generation is too destructive.
- A uniform 20,000-line threshold is arbitrary across diagnostics, operational evidence, security records, and semantic memory.
- Rename-on-write can race across processes and behave badly with Windows open handles.
- Readers may silently stop seeing history after rotation.
- SessionStart is a poor pruning host because many sessions can start concurrently.
- “Keep last 10/14 days” must preserve items that are recent **or** among the newest N, plus anything referenced by an active/resumable sprint.
- The audit itself notes that ordinary `git check-ignore` excludes tracked paths, so its zero-result intersection does not establish zero tracked-ignore drift.
- The supposedly exact cleanup commands are POSIX-shaped despite the declared PowerShell environment, and the worktree table does not establish the branch names used later.

Use retention classes, timestamped immutable segments, locks or a single writer, an archive index/checksums, reader tests, and a restore drill. An 18 MB event file is an unbounded-growth warning, not an emergency that warrants evidence loss.

There is also a chronology inconsistency to reconcile: Audit C says it was read-only and merely proposed pruning, while the consolidated recommendation says worktrees were pruned and evidence salvaged and SP-001 is already running. That does not prove wrongdoing, but the ratification baseline must state exactly what has already changed.

## Q7. Biggest risk

The single biggest risk is **false-green portability caused by an undefined trust boundary**.

If the model-controlled candidate can edit its instructions, checker, hooks, or merge path—or simply bypass them—then provider-neutral enforcement is only prompt compliance. This plan could declare WarpOS interoperable while `agy` is still down and a non-Claude helm remains unconstrained.

The 1.0 boundary should therefore be blunt:

> Any provider may propose and orchestrate work, but a provider-independent trusted runtime owns capability grants, protected mutation, verification, and integration.

Until that is true and demonstrated by black-box provider conformance tests, WarpOS has a strong portability design—not portable enforcement.