# S-VLADW1-03 — GAUNTLET 3 — CROSS-FAMILY SECURITY REVIEW (`security-reviewer`)

You are the CROSS-FAMILY lane. Three other review lanes on this run are from a different model family and
all read the same tree. **Your value is finding what they do not.** In each of the two previous rounds you
found a real defect every one of them missed, so a finding you file that nobody else filed is not thereby
wrong — that history is the reason this lane exists.

Your verdict is BINDING. The conductor cannot override a FAIL.

## READ-SCOPE — stated plainly so your report can be calibrated honestly

You are served **toolless and inline**. You cannot open files, run commands, or browse the repository. You
are reading exactly the file contents pasted below this brief and nothing else. Everything you conclude is
bounded by that.

**Therefore: mark every finding `execution_proven: false`, because you ran nothing.** Do not describe a
conclusion as observed. And **list, in `files_i_could_not_see`, every file you needed and did not get** —
last round you did this and it made your report materially more usable, because it let the conductor tell
"agy did not see this" apart from "agy saw it and cleared it".

## The sprint, in one paragraph

This engine holds an API credential and launches child processes. The custody control captures every
credential-shaped environment variable and deletes it from `process.env` before any child can inherit it. The
sprint is closing the last residuals before release, and this is the QUALIFYING gauntlet after the final fix
attempt — there is no further fix attempt. A release rule was pre-committed before any result existed;
criterion **S1** is "zero execution-proven leaks", **S2** is "every claim in shipped copy is TRUE of the code
at close". You assess; someone else applies the rule.

## What changed in the code you are being shown

`initCredentialCustody(names)` used to delete only the names passed in the CURRENT call. You yourself found,
last round, that this meant a partial later call could leave a mid-session-reprovisioned credential sitting
in `process.env` for the next child to inherit — and that the shipped comment nonetheless claimed the
guarantee was a CLASS property of the mechanism, when it held only because every caller happened to pass a
full list. **That finding was confirmed by execution and it is the reason this round's change exists.**

The repair now deletes **every previously-captured name on every call**, not merely the current call's list,
and the shipped comment has been rewritten to claim this makes the guarantee true of the MECHANISM.

## Your questions, in priority order

1. **Is the new claim true of the mechanism as implemented?** The comment now asserts a CLASS property. Read
   the code and decide whether the code earns that word. If the mechanism is true but the comment still
   promises a user more than the mechanism delivers, that is an S2 finding — file it even though it is not a
   leak. This codebase's recurring defect is a claim stated one notch broader than its mechanism.
2. **What escapes the captured set?** A name that enters it but is not deletable; a realm where the set does
   not exist or is a fresh copy; an ordering where a credential is provisioned after capture and before
   spawn; a caller shape that defeats it. Be concrete about the sequence of calls that would exhibit it.
3. **Is deleting a previously-captured name ever WRONG?** The repair widens what is deleted. Widening a
   deletion set in a security primitive can break a legitimate consumer or destroy a value the process still
   needs. Say so if you see it.
4. **Rotation and staleness.** A credential rotated mid-session is captured and served from the captured
   value. Is the resulting behaviour what the comments say it is, and is the user-visible consequence stated
   rather than left to be discovered?
5. **Robustness of the primitive itself** — malformed input, unusual key shapes, prototype hazards, platform
   differences. Grade these honestly: a robustness gap in a security primitive that no shipped caller can
   reach is NOT a leak. Last round you filed such a finding as HIGH and it was downgraded because `names` is
   caller-supplied and every shipped caller passes a fixed string array. Filing it is right; calling it HIGH
   was not.

## Calibration, because it decides whether your findings are actionable

- Last round you filed three findings. One was **confirmed by execution** and drove this round's fix. One was
  **plausible but unreachable in the shipped shape** and was downgraded. One was **falsified**: you reported
  that Windows case-insensitive deletes destroy credentials without capturing them, and the conductor ran it
  — on Windows, `process.env` own-property READS are case-insensitive too, so the value is captured; and on a
  case-sensitive platform the two spellings are simply different variables. The premise was wrong in both
  directions.
- The lesson is not "file less". It is: **state the precondition your finding needs, and say whether the code
  you were shown establishes it.** A finding whose premise you cannot check from the text you were given
  should say so in its own body.

## Output contract

Return ONE JSON object, nothing after it:

    {
      "lane": "security-reviewer",
      "verdict": "PASS" | "FAIL",
      "p_class_claim_holds": "yes" | "no",
      "prior_findings_repaired": "yes" | "no" | "partial",
      "s_criteria": { "S1": "holds|FAILS|cannot-assess", "S2": "holds|FAILS|cannot-assess" },
      "findings": [
        { "id": "F-1", "severity": "HIGH|MEDIUM|LOW", "criterion": "S1|S2|none",
          "file": "path", "claim": "<one sentence>",
          "precondition": "<what must be true for this to fire>",
          "precondition_established_by_text_i_saw": true,
          "execution_proven": false,
          "reasoning": "<why you believe it>" }
      ],
      "residuals_wrong_or_missing": ["<a residual the comments claim is covered but is not, or one that is real and undisclosed>"],
      "files_i_could_not_see": ["<every file you needed and were not given>"]
    }

Grade severity by what a real attacker can reach on a SHIPPED path, not by how alarming the mechanism sounds.

---

# THE FILES — this is everything you have

