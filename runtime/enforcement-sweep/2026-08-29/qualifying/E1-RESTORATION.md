# E1 restoration and population integrity — verified by the conductor

E1 was a READ-ONLY lane, so a clean checkout proves less than it did for E2 and E3: a
read-only lane satisfies a restoration claim trivially by doing nothing. The stronger check
is on the objects the envelope pointed it at.

## Checkout

```
enf-e1-claimtruth  HEAD  c88aac1df718fc0772c16b6e428130a095549a6c   (== c88aac1d)
                   git status --porcelain --untracked-files=all   ->  0 lines
```

## The pinned objects it graded — byte-identical to what the envelope named

| object | sha256 | state |
|---|---|---|
| ledger snapshot | `e345088ab5277bab6899b6b961ca28327ad73ee9077b19f245cc5f7804d6354e` | unchanged |
| pin-time register | `5673b5c9f70c55d4` (prefix) | unchanged |

**The population E1 graded is provably the population the envelope named, at read time and
now.** That is a different claim from "the lane restored its tree", and it is the one worth
having for a read-only lane.

## All three lane checkouts, re-checked together

| checkout | HEAD | porcelain (--untracked-files=all) |
|---|---|---|
| enf-e1-claimtruth | c88aac1d | 0 |
| enf-e2-adversarial | c88aac1d | 0 |
| enf-e3-teeth | c88aac1d | 0 |

E2 and E3 were each verified when they returned; re-checked after E1 finished, both still
clean — so neither was disturbed by E1's run, which matters because all three sit under the
same parent and E1 was live while the other two were being read.

## Byte-count labels for E1's return

- **extracted file `out-E1-2-RETURN.md` — 19343 B** (includes the one-line extractor header)
- **returned text — 19282 B** (equals the ledger's `stdout_bytes` and the wrapper's `output`)

Same shape as E3's 9670 / 9310. Two objects, one number each; neither travels bare.

## Name pairing, restated

`out-E1-2.raw` is the output of **`assembled-E1-3.md`**, dispatch `d-mtffqf0q-48df5464`.
`assembled-E1-2.md` exists on disk and never fired.
