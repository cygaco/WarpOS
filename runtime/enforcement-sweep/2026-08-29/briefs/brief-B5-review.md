# SP-20260829-001 — bundle B5 — CROSS-PROVIDER REVIEW

You are reviewing a bundle whose entire purpose is to make a gate green. That is the reason to read it hard.

## THE INVARIANT YOU ARE ASKED TO ATTACK

> **A seal records a tree's current state as expected. It is the one operation in this sprint that can turn a defect into policy — because after it, the gate goes green *because* the defect is now expected.**

Your job is not to confirm the bundle. Your job is to find out whether anything became expected that should have been repaired, disclosed or contested. **Assume the bundle is competent and still wrong**, and go looking for where.

Specifically, try to build a case for each of these, and report honestly if you cannot:

1. **A site was absorbed rather than triaged.** Something appears in the emitted baseline that no human read and no row explains, and its presence alone now silences the gate.
2. **A disposition was assigned from something other than a read of the site.** A quote that is a paraphrase; a quote lifted from a header that does not describe the branch in question; a disposition that follows from what would make the gate green rather than from what the code does.
3. **A number is true of nothing.** A count, a coverage figure or a phrasing string that does not derive from an emitted set present in the artifacts, or that was true before the bundle and is not true after it.
4. **A green was obtained by moving the thing being measured** rather than by fixing the thing being measured.
5. **A "could not check" was resolved into a pass** anywhere — in the code, in a row, in the envelope, or by silence.

## THE RULE THE BUNDLE IS BOUND BY — verbatim

- **S6-1 TRUTH** — never satisfiable by mechanism evidence or an approval chain. No sentence this sprint ships is false read against the code it describes — enforcer output, registry, close report, AND ED ROWS (the secret-guard mechanism error is the live example: a true finding with a false mechanism is a defect here).
- **S6-2 GRANULARITY (keystone)** — every coverage claim names its unit and emits its set; no bare count without the per-item table it derives from; the count-form family reviewed by reading, not lint; closure only by a named property or an emitted exhaustive extension over a stated finite domain.
- **S6-3 INSTRUMENT CEILING** — every claim resting on the lexer carries its ceiling at the point of claim; the enumeration is "what this instrument at <sha> finds, limits named", never "the population"; 65 explicitly withdrawn. *Pre-committed: the lexer HAVING a ceiling is NOT a defect; S6-3 governs the claim, never the capability.*
- **S6-4 POLARITY PROVENANCE** — per-site `manual-by-read` or `tool-derived`, never blended; manual dispositions quote the site's decision semantics; contested → fails closed.
- **S6-5 FALSIFIERS OBSERVED AT THE CLOSE** — each executed fooling input becomes a near-miss fixture, observed RED against the built lexer, no-op⇒FAIL guard, re-run at the qualifying close against the predicate AS BUILT (P-118).
- **S6-6 THE ENFORCER CAN FAIL** — demonstrated BY EXECUTION to fail on a registry member regressing and on a new untriaged site; asserted-not-demonstrated fails (ED-374 turned on this sprint's own output).
- **S6-7 RESIDUALS TRAVEL** — emitted by name with ledger ids. A residual named in a spec does not satisfy a criterion requiring it recorded or shipped.

**S6-3 cuts both ways and you must apply it correctly: the instrument HAVING a ceiling is NOT a defect.** A finding that amounts to "the scanner cannot see everything" is not a finding. A finding that the bundle *claimed* more than the instrument can support is.

## HOW TO WORK

Everything you need is inlined below this section — the bundle's commits, its diff, its envelope, and the enforcer's committed output from BEFORE the bundle existed. **Read the pre-state first**, then the diff, then the envelope, in that order. The envelope is the bundle's own account of itself; treat it as a claim to be checked against the diff, never as a description of the diff.

Where the bundle reports having executed something, check whether the artifact of that execution is present. **An exit code stated in prose is a claim; an exit code beside the command that produced it is evidence.** If a demonstration is asserted and not shown, that is a finding under S6-6, and the rule says asserted-not-demonstrated fails.

## VERDICT

Return strict JSON, nothing before or after it:

```json
{
  "verdict": "pass" | "warn" | "fail",
  "findings": [
    {
      "id": "F-1",
      "severity": "high" | "medium" | "low",
      "rule": "S6-1 | S6-2 | S6-3 | S6-4 | S6-6 | S6-7 | other",
      "claim": "the sentence, value or line you are contesting, quoted",
      "why_wrong": "what you read that makes it wrong, with the quote you read it from",
      "confidence": "certain | probable | possible"
    }
  ],
  "attacks_attempted": [
    { "attack": "one of the five above, or your own", "outcome": "found | not found", "what_i_checked": "..." }
  ],
  "could_not_check": ["by name — files, sites, or claims you were unable to verify, and why"]
}
```

`could_not_check` being empty is itself a claim, and this sprint exists because gates swallow "could not check" into "pass". If you could not verify something, name it there rather than omitting it or grading it generously.

**Your verdict is binding. Do not soften a finding because the bundle is otherwise good work, and do not manufacture one because a reviewer is expected to find something.** If the five attacks all come back "not found" and you can say what you checked, `pass` is the honest answer and you should give it.
