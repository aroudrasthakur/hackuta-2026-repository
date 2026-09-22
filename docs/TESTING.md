# Testing

Quality gates for the marketing site.

## Overview

| Layer | Tool | Location |
| --- | --- | --- |
| Unit | Vitest | `tests/unit/` |
| Browser + a11y | Playwright + axe | `tests/site.spec.ts`, etc. |
| Coverage | Istanbul | 80% thresholds (`scripts/check-coverage.mjs`) |
| Design QA | Playwright MCP | `scripts/qa-mcp.mjs` — see [QA.md](QA.md) |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

## Commands

```bash
npm run test:unit              # Vitest
npm run test:unit:coverage     # with coverage
npm run test:coverage:check    # enforce thresholds
npm run test:e2e               # Playwright (dev server)
PLAYWRIGHT_USE_BUILD=true npm run test:e2e   # production build (CI path)
npm run qa:mcp                 # design verification harness
```

## Unit tests

| Area | Files |
| --- | --- |
| CSP / header sync | `security.test.ts`, `utils.test.ts` |
| Utilities, hooks | `utils.test.ts`, component tests |

CSP test ensures `security/csp.ts` matches `vercel.json`.

## E2E tests (Playwright)

Cover event content, schedule tabs, navigation, mobile menu, ship animation, storm layers, reduced motion, responsive layouts, and axe WCAG 2.1 A/AA checks.

CI builds production `dist/` and runs Playwright against the artifact — same path as:

```bash
npm run build
PLAYWRIGHT_USE_BUILD=true npm run test:e2e
```

## Design QA harness

`npm run qa:mcp` runs automated visual and layout checks via Microsoft Playwright MCP. See [QA.md](QA.md) for dimensions, screenshots, and artifact output.

## CI pipeline

| Job | Steps |
| --- | --- |
| **quality** | lint → typecheck → unit tests + coverage → build |
| **e2e** | Playwright on uploaded `dist/` |
| **dependency-audit** | `npm audit --omit=dev --audit-level=high` |
| **secrets** | Gitleaks |

Triggers on push/PR to `main`.

## Adding tests

| Change | Add test |
| --- | --- |
| New route | Playwright navigation test |
| CSP/header change | Update `security.test.ts` + `vercel.json` |
| New section content | `site.spec.ts` content assertion |
| Register URL logic | Unit test in `utils.test.ts` |

## Related docs

- [QA.md](QA.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
