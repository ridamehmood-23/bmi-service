## What
<!-- One paragraph: what this PR does. -->

## Why
<!-- The problem or ticket this solves. -->

## How to test
```bash
npm ci && npm run lint && npm test
npm start
curl -X POST http://localhost:3000/api/bmi -H 'Content-Type: application/json' \
  -d '{"weightKg":70,"heightCm":175}'
```

## Self-review notes
<!-- Things I flagged on my own diff before asking for review. -->

## Checklist
- [ ] Lint passes locally
- [ ] Tests added/updated and passing
- [ ] No secrets or debug logs in the diff
- [ ] Safe to auto-deploy to staging on merge
