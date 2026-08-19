# Record-Trust Gate — S-VLADW1-03, applied at DESIGN, before build

Doctrine: `.claude/project/reference/record-trust-gate.md`. Applied by ε at the design phase, per the
sprint's own DoD task and my r1 consult to β (Q2). This is the artifact the gate produces; it is
**pre-build by construction** — nothing in this sprint dispatches a builder until β pre-commits the
release rule at design→build.

## Does the gate apply here? YES — three records gate irreversible or trust-bearing conclusions.

| Record | What a reader concludes from it | Why that is trust-bearing |
|---|---|---|
| **The graph-reachability walker's classification** (`canSpawn` / `reachesScrub` per entry point) | "every spawn-capable shipped entry point reaches the credential scrub" | This is R3's whole claim. The predecessor shipped a walker that classified `server-entry.js` as non-spawn-capable, so **deleting the scrub call would have left the suite green.** A reader trusted a record that could not fail. |
| **`verified_by` pointer resolution** (`check:pointers`) | "this acceptance criterion is covered by a test that exists" | 15 of 48 do not resolve. **One of them is missing WORK, not a missing name** — and it stayed camouflaged among clerical drift through two corrections. |
| **`custody-claim-lint`'s verbatim bind** | "CUSTODY.md's A5 still matches the code it quotes" | The bind deliberately covers `slice(0,2)`, so **the one sentence that is factually wrong sits outside it** and drifts undetected. |

## 1. The SINGLE choke-point + a STRUCTURAL guard that fails an un-routed reader

- **Walker:** one classification function, and **every** consumer reads its output — no second inline
  "does this file spawn" heuristic anywhere. Structural guard: the classifier is the only place that
  names a spawn specifier; a new reader that re-derives spawn-capability locally is the defect, and the
  bundle brief forbids minting one. **Fail-closed rule: an unresolvable or bare specifier classifies as
  spawn-capable-unless-proven-otherwise** — the predecessor's exemption direction is inverted.
- **Pointers:** `verified-by-resolver.js` is the single resolver; nothing else parses `verified_by`.
- **Claim bind:** `CARRIER_NOTE_BOUND_SENTENCES` becomes **the whole note**, not a prefix slice. A
  carve-out *is* the un-routed reader in this family — that is precisely how C2 survived.

## 2. Partition the surface — SAME-session vs CROSS-session

- **SAME-process / same-session:** the scrub, `initCredentialCustody`'s idempotence, the walker's
  in-process classification. These are decidable by execution in one run and must be asserted that way.
- **CROSS-session / cross-machine:** `check:pointers` reads an acceptance-criteria file that **does not
  exist in the vlad repo** — it resolves out to a sibling WarpOS path. So its RED state is
  **machine-local**, and the test that pins the count `t.skip()`s when the file is absent. **This is the
  sharpest partition finding and it is currently undisclosed:** the enforcer is real on this machine and
  absent everywhere else. Any claim that the pointer index is enforced must say "on a checkout that has
  the AC file", or the enforcement must move in-repo.
- **Cross-process:** the scrub's guarantee is per-process. A worker thread gets a fresh module registry
  and its own `process.env`, so the capture is invisible there — undocumented today.

## 3. Adversarial fail-open FALSIFIER fixtures — REQUIRED-PRESENT, written before the fix

Each must be a standing test that **fails if the control stops working**, not a one-time observation:

- **F-1 (walker, the predecessor's exact hole):** an entry point that spawns via **bare
  `child_process`**, one via **`createRequire`**, and one reaching spawn **only through an npm
  dependency**. Each must classify **spawn-capable**. Today all three classify safe.
- **F-2 (walker, non-vacuity):** **delete the scrub call from `server-entry.js` → the standing test must
  go RED.** The predecessor's "non-vacuity control" was `assert.ok(… c.canSpawn || true)` — a literal
  tautology whose own message said "always true". The replacement must assert **both directions**: at
  least one entry point spawn-capable AND at least one not.
- **F-3 (idempotence):** provision a credential into `process.env` **after** the first
  `initCredentialCustody()` call, then call it again. Today it is a complete no-op and the credential
  survives. Whatever semantics are chosen, the fixture pins them.
- **F-4 (claim bind):** reword the previously-carved-out sentence → the lint goes RED.
- **F-5 (pointer resolver):** a `verified_by` naming a real file but a non-existent test node → RED, and
  it must stay distinguishable from a missing file, because that distinction is what AC-8.6 hid behind.

## 4. NAMED ENFORCER for the gate itself — else this is a hollow ladder rung

| Item | Enforcer | Wired into |
|---|---|---|
| Walker correctness + non-vacuity | F-1, F-2 in `test/env-scrub.test.js` | `npm test` |
| Idempotence semantics | F-3 | `npm test` |
| Claim/code divergence | extended `CARRIER_NOTE_BOUND_SENTENCES` + F-4 | `check:custody` → `check:ship` |
| Pointer resolution | `check:pointers` | its own entry point — **NOT `check:ship`**, and the reason must be recorded in-file: composing a machine-local resolver into the product's ship gate would redden it on every machine but this one. |

**Residual I am naming rather than closing:** `check:pointers` cannot be a true product enforcer while
its input lives outside the repo. Options are to vendor the AC file, to emit a resolved manifest at
sprint close, or to accept it as a WarpOS-side lint and stop implying otherwise. **This is a design
question for β at design→build, not a builder's call.**

## What this gate front-loads

The predecessor spent three gauntlet rounds discovering, one at a time, that a control can pass its own
test while being unwired, unreachable, or unfalsifiable. Every falsifier above is a defect that *already
happened* — F-2 is the exact tautology that shipped. Writing them before the build is the difference
between a fix and a fix that can be shown to work.
