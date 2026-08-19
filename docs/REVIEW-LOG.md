# Review log — PR #1 `feature/bmi-endpoint` → `main`

## 1. Self-review (posted by the author on their own diff, before requesting review)

**SR-1 — `src/utils/bmi.js`, line ~5: no input validation.**
`calculateBmi(undefined, 175)` returns `NaN` and `calculateBmi(70, 0)` returns `Infinity`.
Both are silently classified as `"Obese"` because `NaN < 18.5` is false and every other
branch falls through to the `else`. A junk request would therefore get a `200 OK` with a
clinically meaningless label. If I were the reviewer I would block on this.

**SR-2 — `src/utils/bmi.js`: category thresholds are magic numbers inside an if/else chain.**
`18.5 / 25 / 30` are hard-coded in control flow, so the WHO boundaries are not testable
in isolation and the boundary behaviour (is exactly `25` "Normal" or "Overweight"?) is
implicit. Should be a named, frozen table with a separate `categorize()` function.

**SR-3 (minor) — the route has no unit hint.** `heightCm` vs `heightM` is the classic
mix-up in this kind of endpoint; the JSDoc must state the unit explicitly.

## 2. Reviewer comments (Changes requested)

> **Reviewer — `src/utils/bmi.js`**
> Changes requested. Confirming your SR-1: this endpoint is on the auto-deploy-to-staging
> path, so a `200 OK` on garbage input is not a cosmetic issue — any client that trusts the
> `category` field gets a wrong answer with no error signal. Please:
> 1. reject non-finite / non-numeric input with a typed error;
> 2. reject physiologically impossible ranges (a 900 cm height should never reach the maths);
> 3. map that error to HTTP **400** in the route, not 500 — this is a client input problem;
> 4. add tests covering `0` height, missing weight, string input and the `18.5` / `25`
>    boundaries, since those are exactly the cases that silently pass today.
>
> Nit: also pull the thresholds out of the if/else chain while you're in here (your SR-2).

> **Reviewer — `src/routes/bmi.js`**
> `req.body` will be `undefined` if the `Content-Type` header is missing. Destructuring off
> it throws and you'll return a 500 for what is really a malformed request. Guard it.

## 3. Author response + follow-up commit

Commit `fix(bmi): validate input and return 400 on bad measurements` addresses all four
points:

- added `InvalidMeasurementError`, `assertFiniteNumber()`, `assertInRange()` with a frozen
  `LIMITS` table (weight 1–500 kg, height 30–300 cm);
- extracted `BMI_CATEGORIES` + `categorize()` so boundaries are data, not control flow;
- route now catches `InvalidMeasurementError` → `400`, anything else → `500`, and uses
  `req.body ?? {}` so a missing body is a 400 rather than a crash;
- test count 3 → 11, including `0` height, missing weight, string input, out-of-range
  height, and the `18.5` / `25` boundaries.

Reviewer approved. Merged with **squash and merge**.
