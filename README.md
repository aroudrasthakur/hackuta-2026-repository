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

## Resume upload deployment

Set `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` in the frontend deployment. Set
`REGISTRATION_ALLOWED_ORIGINS` on the Convex deployment to the comma-separated,
exact website origins that may upload resumes. Resume objects stay in private
Convex storage; any future reviewer download endpoint must authenticate the
reviewer and authorize access before returning file bytes.

To let organizers list registrations via `getRegistrationsByHackathon`, set
`REGISTRATION_ADMIN_IDENTITY_KEYS` on the Convex deployment to the comma-separated
Convex Auth `tokenIdentifier` values for those accounts.
