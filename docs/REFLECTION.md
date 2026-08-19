# Part C — Reflection

I chose GitHub Flow: one long-lived `main`, short-lived `feature/*` branches, squash merge.
That choice is not cosmetic — it is what makes the deployment half of this task safe.
Because `main` is the only permanent branch, "merged" and "deployed to staging" mean the
same thing, so the merge button is effectively the deploy button. Every guarantee I want
about staging therefore has to be enforced *before* that button becomes clickable, which is
exactly what branch protection plus a required CI check does: lint, tests and a Docker build
must be green, and a human must have approved the diff, or the merge is blocked.

Review discipline reduces auto-deploy risk in a way CI structurally cannot. CI answers
"does this run?" — it executes assertions somebody already thought to write. Review answers
"is this correct, and are we asserting the right things?" A green pipeline on an
under-tested change is a false sense of safety: the pipeline is only as good as the tests
in the diff, and the diff is written by the same person who chose what to test. The
reviewer is the only step in the chain that can spot a missing test case rather than a
failing one.

A concrete example from this PR. My first commit calculated BMI with no input validation.
`calculateBmi(70, 0)` produced `Infinity` and `calculateBmi(undefined, 175)` produced `NaN`,
and because `NaN < 18.5` is false, both fell through the if/else chain to `"Obese"`. The
endpoint returned `200 OK` with a wrong clinical label and no error signal at all. Every
test I had written passed. Lint passed. The Docker build passed. CI would have shipped that
straight into staging and told me it succeeded, because nothing crashed — the bug was a
wrong answer, not an exception. The reviewer caught it by reading the branch logic and
asking what happens at zero, which turned into typed validation, a 400 response, and eight
new tests. Those tests now protect `main` permanently, so review didn't just fix one bug —
it upgraded the pipeline itself.

That is also why staging and production must never share a trigger. Merge is an automatic,
frequent, low-ceremony event; a production release is a deliberate decision about a commit
that has already proven itself in staging. Sharing a trigger collapses those two risk levels
into one, and a reviewer's Approve click silently becomes a customer-facing release.
