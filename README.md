# envguard

<img width="960" height="540" alt="demo" src="https://github.com/user-attachments/assets/331f0520-7906-46e8-8f6e-0a1aa03e5502" />

> Stop shipping code that reads environment variables you never documented.

`envguard` scans your project for every environment variable your code reads, compares them with your `.env.example`, and tells you what's missing, what's unused, and what's undocumented. Run it locally or in CI to catch config drift before it reaches production.

![envguard demo](./docs/demo.gif)

## The problem

```
Error: STRIPE_WEBHOOK_SECRET is not defined
```

Someone added `process.env.STRIPE_WEBHOOK_SECRET` three months ago. The `.env.example` was never updated. The deploy went out, and the service crashed at 2am.

## Features

- **Multi-language**: JavaScript/TypeScript, Python, Go, and Rust
- **Drift detection**: finds variables used in code but missing from `.env.example`
- **Dead config**: finds variables documented but never read (with `--strict`)
- **CI-ready**: exit code 1 on drift, plus JSON and GitHub annotation output
- **No runtime changes**: static analysis only, your code is never executed
- **Zero dependencies**: just Node.js 18+

## Install

```bash
npx envguard
```

Or install globally:

```bash
npm install -g envguard
```

## Usage

```bash
# Check the current project against .env.example
envguard

# Check another directory with a different template
envguard ./services/api --template .env.sample

# Also fail on variables documented but never read
envguard --strict

# Ignore specific variables
envguard --ignore FEATURE_FLAG_X,LEGACY_TOKEN

# Output GitHub annotations in Actions
envguard --format github
```

## Example output

```
envguard: 2 issues found

  ✖ STRIPE_WEBHOOK_SECRET
    used in src/payments.ts:6
    missing from .env.example

  ⚠ LEGACY_API_URL
    documented in .env.example:6
    never read in the codebase
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0`  | No drift |
| `1`  | Drift found (missing variables, or unused ones with `--strict`) |
| `2`  | Usage or runtime error |

## GitHub Action

```yaml
- uses: your-user/envguard@v1
  with:
    strict: true
```

## How it works

1. Walks the source tree (skipping `node_modules`, `dist`, `.git`, and other build folders)
2. Matches language-specific env access patterns line by line
3. Ignores comments and common system variables such as `PATH` or `CI`
4. Diffs the result against your template file
5. Reports drift with file and line references

## Roadmap

- [ ] Detect env vars in Dockerfiles and docker-compose files
- [ ] Generate `.env.example` automatically from code
- [ ] Support for Kubernetes manifests
- [ ] VS Code extension with inline warnings

## Contributing

Issues and PRs are welcome. Run `npm test` before opening one.

## License

MIT
