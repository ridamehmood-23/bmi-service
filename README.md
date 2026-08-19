# bmi-service — Session 7 + 8 combined task

A tiny Express service exposing `POST /api/bmi`, used to demonstrate one continuous
workflow: branch → code → review → fix → merge → CI → staging → manual gate → production.

- **Branching strategy:** GitHub Flow (`main` + short-lived `feature/*`, squash merge)
- **Merge strategy:** Squash and merge
- **CI:** GitHub Actions — lint + unit tests + Docker build, required on every PR into `main`
- **Staging:** Docker container built and smoke-tested on every push to `main`
- **Production:** separate `workflow_dispatch` workflow + protected `production` environment

---

## Why GitHub Flow (and not Git Flow)

| | |
|---|---|
| Team size | 1 engineer, 1 small feature |
| Release cadence | Continuous — every merge goes to staging |
| Long-lived branches | Only `main` |

Git Flow's `develop` + `release/*` + `hotfix/*` branches exist to batch work into versioned
releases. This service has no versioned releases; it deploys on merge. Adding `develop`
would only create a second branch to deploy from and force a decision — deploy staging from
`develop` or from `main`? — that has no good answer at this size. GitHub Flow keeps exactly
one deployable branch, so "merged into `main`" and "live on staging" are the same event.

**Why squash merge fits:** a feature branch's intermediate commits (`wip`, `fix lint`,
`address review`) are review scaffolding, not history. Squashing makes `main` a list of
one-commit-per-feature, which means (a) every commit on `main` is independently deployable,
(b) `git revert <sha>` cleanly rolls back a whole feature out of staging, and (c) the SHA
that staging reports maps 1:1 to a PR. A merge commit would preserve the broken
intermediate commit that had no validation — a commit I never want to be able to deploy.
Rebase-merge would put those same broken commits directly on `main`. Squash is the only
option that keeps every point on `main` green, which matters *because* `main` auto-deploys.

---

## Local development

```bash
npm ci
npm run lint
npm test
npm start
```

```bash
curl -X POST http://localhost:3000/api/bmi \
  -H 'Content-Type: application/json' \
  -d '{"weightKg":70,"heightCm":175}'
# {"ok":true,"bmi":22.9,"category":"Normal"}

curl -i -X POST http://localhost:3000/api/bmi \
  -H 'Content-Type: application/json' \
  -d '{"weightKg":70,"heightCm":0}'
# HTTP/1.1 400 Bad Request
# {"ok":false,"error":"heightCm must be between 30 and 300"}
```

Run staging locally:

```bash
docker compose -f docker-compose.staging.yml up --build -d
curl http://localhost:3001/health
```

---

## The full runbook (reproduce every step)

### Part A — Branching & review

**Step 0 — repo setup**

```bash
git init
git add .
git commit -m "chore: bootstrap express service, eslint, tests, docker"
git branch -M main
git remote add origin https://github.com/<you>/bmi-service.git
git push -u origin main
```

**Step 1 — feature branch (GitHub Flow naming)**

```bash
git checkout main && git pull
git checkout -b feature/bmi-endpoint
```

**Step 2 — first commit (deliberately un-validated version)**

Copy `docs/v1-bmi-snapshot.js` over `src/utils/bmi.js`, keep only the first three tests,
then:

```bash
git add src tests
git commit -m "feat(bmi): add POST /api/bmi endpoint with BMI calculation"
git push -u origin feature/bmi-endpoint
```

**Step 3 — open the PR and self-review.** Open the PR against `main`, then post the
self-review comments **on your own diff** before requesting review. Both blocking items are
written out in `docs/REVIEW-LOG.md` (SR-1 missing validation, SR-2 magic-number thresholds).

**Step 4 — review cycle.** Reviewer submits *Request changes* with the comments in
`docs/REVIEW-LOG.md` §2. Address the non-trivial one (validation + 400 mapping + boundary
tests — not the typo-level nit) and push a follow-up commit:

```bash
git add src tests
git commit -m "fix(bmi): validate input, return 400 on bad measurements, extract thresholds"
git push
```

**Step 5 — resolve and merge.** Reviewer resolves the threads and approves. Merge with
**Squash and merge** (rationale above). Delete the branch.

### Part B — CI/CD & staging

**Step 6 — CI gating the PR.** `.github/workflows/ci.yml` runs on `pull_request` into
`main`: `npm run lint`, `npm test`, then a Docker build. Make it blocking:

> Settings → Branches → Add branch protection rule → `main`
> - ✅ Require a pull request before merging (1 approval)
> - ✅ Require status checks to pass before merging → select **Lint & Test** and **Docker build**
> - ✅ Require branches to be up to date before merging
> - ✅ Do not allow bypassing the above settings

**Step 7 — staging on merge.** `.github/workflows/deploy-staging.yml` runs on `push` to
`main` only. It rebuilds the image, starts the container on port 3001, polls `/health`,
then smoke-tests the real feature (valid → `200` with `bmi: 22.9`, invalid → `400`). If the
smoke test fails, the deploy job goes red.

**Step 8 — manual gate to production.** `.github/workflows/deploy-production.yml` has **no
push trigger** — it is `workflow_dispatch` only, requires you to type `RELEASE`, requires
the staging-verified SHA as an input, and targets the protected `production` environment.
Create the environment:

> Settings → Environments → New environment → `production`
> - ✅ Required reviewers → add yourself
> - ✅ Deployment branches → Selected branches → `main`

The job then pauses in the Actions UI until a human clicks *Approve and deploy*.

**Step 9 — prove the gate is real.**

```bash
git checkout main && git pull
git checkout -b bugfix/bmi-rounding
```

Add `tests/bmi.rounding.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBmi } = require('../src/utils/bmi');

// Deliberately wrong expectation: real value is 22.9.
test('DELIBERATE FAILURE: proves CI blocks the merge', () => {
  assert.equal(calculateBmi(70, 175).bmi, 23.9);
});
```

```bash
git add tests/bmi.rounding.test.js
git commit -m "test: deliberately failing test to prove CI blocks merge"
git push -u origin bugfix/bmi-rounding
```

Open a PR into `main`. **Lint & Test** goes red, **Docker build** is skipped (it `needs:
quality`), and the merge button shows *Merging is blocked — required status checks must
pass*. Screenshot that. Then close the PR without merging and delete the branch.

---

## Screenshots to capture

| # | What | Where |
|---|---|---|
| 1 | Merged PR with review comments + commit history | PR #1 → Conversation / Commits |
| 2 | Green CI run on PR #1 | Actions → CI |
| 3 | Green **Deploy to Staging** run incl. smoke-test step output | Actions → Deploy to Staging |
| 4 | Production run paused *Waiting for review* | Actions → Deploy to Production |
| 5 | Blocked merge on `bugfix/bmi-rounding` (red checks + greyed merge button) | PR #2 |

Save them in `docs/screenshots/`.
