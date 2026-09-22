# Contributing

Guidelines for changes to the marketing site.

## Prerequisites

- Node.js 22+
- Read [ARCHITECTURE.md](ARCHITECTURE.md) and [README.md](../README.md)

## Workflow

1. Branch from `main`
2. Keep changes focused — match existing component and CSS patterns
3. Run locally before PR:

```bash
npm run lint
npm run typecheck
npm run test:unit:coverage
npm run build
```

4. Open PR to `main`; CI must pass

## Conventions

| Area | Convention |
| --- | --- |
| Styling | Tailwind v4 + existing CSS variables; see [palette.md](palette.md) |
| Apply links | Use `REGISTER_URL` from `src/constants/site.ts` — never hardcode register URL in components |
| External URLs | Hardcode in constants/components; review for trustworthiness |
| CSP | Edit `security/csp.ts` + `vercel.json` together |
| Assets | Run `npm run assets` after image/font changes |
| Accessibility | Preserve skip link, focus styles, reduced-motion support |

## Do not

- Add backend APIs, forms with server submission, or database clients to this repo — use [hackuta-2026-registration](https://github.com/aroudrasthakur/hackuta-2026-registration)
- Use `dangerouslySetInnerHTML` for dynamic/untrusted content
- Commit secrets or `.env.local`
- Break CSP without updating both `csp.ts` and `vercel.json`

## Documentation

| Change | Update |
| --- | --- |
| Routes or external links | [API.md](API.md) |
| Security headers | [SECURITY.md](SECURITY.md) |
| Deploy/env | [OPERATIONS.md](OPERATIONS.md), [README.md](../README.md) |
| Design tokens | [palette.md](palette.md) |

## Related docs

- [TESTING.md](TESTING.md)
- [HACKUTA_DESIGN_CONTEXT.md](../HACKUTA_DESIGN_CONTEXT.md)
