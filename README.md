# HackUTA 2026

The official landing page for **HackUTA** — a 24-hour hackathon at the University of Texas at Arlington.

**November 14–15, 2026** · UT Arlington, Texas  
Open to college students 18+. All experience levels welcome.

## What’s on the site

- Event overview and how to get involved
- Weekend schedule (Day I & Day II)
- FAQ
- Sponsors
- Links to Discord and registration (when live)

Applications are opening soon. Check the site for the latest updates.

## Questions?

Email [hello@hackuta.org](mailto:hello@hackuta.org).

## Run locally

For organizers and contributors:

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Database design

The initial [Convex schema](convex/schema.ts) covers accounts, registrations,
staff permissions, and points history. See the [schema design](docs/database-schema.md)
for relationships, tradeoffs, and rules required in future backend functions.
This is a local schema only; no Convex deployment or authentication is configured.
Run `npm run typecheck` to check the schema alongside the frontend.
