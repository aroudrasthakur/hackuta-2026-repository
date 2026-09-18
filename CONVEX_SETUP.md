# Registration backend

Convex is the registration backend. The registration flow uses Convex actions
for email verification and confirmation, and Convex mutations for atomic data
persistence.

## Required configuration

- Set `VITE_CONVEX_URL` in the frontend deployment to the Convex deployment URL.
- Set the cPanel SMTP variables in the Convex deployment environment:
	`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and
	`SMTP_FROM`.
- Use the complete mailbox address `hello@hackuta.org` as `SMTP_USER`.
- Do not put the mailbox password in `.env.local`, Vite variables, or browser code.

## Deployment

Run `npx convex codegen` after schema or function changes, then deploy the
functions with the team's normal Convex deployment command. Set the frontend
`VITE_CONVEX_URL` to the same deployment and ensure the site's CSP allows its
origin in `connect-src`.

The applicant flow is: request code, verify code, submit the application, then
receive a confirmation email. A confirmation is attempted only after the
registration write succeeds.
