# Registration backend

Convex is the selected backend. The retired Vercel API, file-based storage,
Redis adapter, and email adapter have been removed.

The registration UI is not yet connected to a working production flow:

- `registerApi.ts` calls `sendCode`, `verifyCode`, and `register`; the current
  Convex modules do not implement these functions.
- The form payload needs mapping to the registration schema.
- User identity, ownership checks, and admin authorization must be implemented
  before exposing registration queries or mutations.
- Production and preview CSP must allow the selected Convex deployment.
- The frontend build currently excludes Convex. A passing frontend build does
  not validate the backend; generate its bindings and check it during integration.

For a local UI preview, copy `.env.example` to `.env.local`, set
`VITE_USE_MOCK_API=true`, and run `npm run dev`. Visit `/register` and read the
verification code in the browser console. This mode sends no email and saves
no data. Keep it disabled in production.

Set `VITE_CONVEX_URL` to the team's deployment when completing the integration.
Do not deploy the current backend as a finished registration system.
