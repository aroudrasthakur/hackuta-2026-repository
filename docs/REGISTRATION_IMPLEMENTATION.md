# Registration Implementation Handoff

## Overview

The registration flow now supports this sequence:

1. The applicant completes the application form, including their email address.
2. After the applicant clicks submit, Convex requests a six-digit verification code.
3. The code is sent to the applicant from `hello@hackuta.org` through cPanel SMTP.
4. The page routes to a separate verification form.
5. The applicant enters the code and verifies the email.
6. Convex creates or updates the applicant's email-based user profile.
7. Convex saves the complete application and links it to the user profile.
8. A confirmation email is sent to the applicant after the application is saved.
9. The existing application-received screen appears.

The browser cannot submit an application until the email has been verified. The Convex backend enforces this requirement independently, so it cannot be bypassed by changing frontend controls.

## Work Completed

- Added applicant email collection and client-side email validation.
- Added a separate verification form after application submission.
- Added a submission gate that requires successful email verification before Convex persistence.
- Added Convex email verification challenges with:
  - Hashed verification codes.
  - Ten-minute code expiration.
  - One-minute resend cooldown.
  - Maximum failed-attempt protection.
  - Single-use code consumption.
- Added email-based user profile creation and update in Convex.
- Removed the previous `mock-user:*` registration fallback.
- Linked registrations to the actual Convex user document ID.
- Added confirmation email delivery through cPanel SMTP.
- Added Convex and frontend type validation.
- Updated the Convex setup documentation and environment example.
- Updated the Content Security Policy to allow Convex connections.

## Applicant Form Fields

The applicant must complete or select the following fields:

### Contact and education

- Email address
- First name
- Last name
- Phone number
- Age
- School or university
- Level of study
- Major or field of study
- Expected graduation year

### Personal and event information

- Gender
- Race or ethnicity, including multiple selections
- Dietary restrictions, including multiple selections
- Additional dietary information when `Other` is selected
- T-shirt size
- Whether this is the applicant's first hackathon
- How the applicant heard about HackUTA

### Links and accommodations

- Resume link, optional
- LinkedIn link, optional
- GitHub link, optional
- Portfolio link, optional
- Accessibility needs or accommodations, optional

### Emergency contact

- Emergency contact name
- Emergency contact phone number

### Required consent

- Agreement to the MLH Code of Conduct
- Authorization to share registration information with MLH

### Optional consent

- Authorization for MLH communications

## Configuration Fields That Must Be Completed

### Frontend deployment

Set this public variable in the frontend environment, such as Vercel:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Use the URL for the Convex deployment that contains these functions. Do not include a trailing path such as `/api/action`.

### Convex deployment

Set these server-side variables in the Convex dashboard or Convex deployment environment:

```env
SMTP_HOST=mail.hackuta.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@hackuta.org
SMTP_PASSWORD=your-mailbox-password
SMTP_FROM=hello@hackuta.org
```

These values must not be added to Vite variables, committed to Git, or exposed to the browser.

### cPanel SMTP email setup

Complete the following in cPanel:

- Confirm that the `hello@hackuta.org` mailbox exists.
- Confirm the cPanel mail server hostname. It is commonly `mail.hackuta.org`.
- Use port `587` with STARTTLS (`SMTP_SECURE=false`) unless cPanel specifies otherwise.
- Use `hello@hackuta.org` as the SMTP username.
- Add the mailbox password as `SMTP_PASSWORD` in Convex.
- Confirm that the mailbox can send to applicant email addresses.

The implementation currently uses these email messages:

- Verification subject: `Your HackUTA verification code`
- Confirmation subject: `Your HackUTA application was received`

## Deployment Checklist

- [ ] Create or select the production Convex deployment.
- [ ] Run `npx convex codegen` after Convex schema or function changes.
- [ ] Configure the cPanel SMTP variables in the Convex deployment.
- [ ] Confirm the cPanel SMTP hostname and port.
- [ ] Confirm `hello@hackuta.org` is the permitted sender mailbox.
- [ ] Configure `VITE_CONVEX_URL` in the frontend deployment.
- [ ] Confirm the frontend and Convex deployment belong to the intended environment.
- [ ] Deploy the Convex functions.
- [ ] Deploy the frontend.
- [ ] Submit a test application using a real test email address.
- [ ] Confirm the verification code arrives.
- [ ] Confirm an unverified application cannot be submitted.
- [ ] Confirm the application confirmation email arrives after submission.
- [ ] Confirm one user profile and one linked registration appear in Convex.
- [ ] Submit the same verified email again and confirm that the existing registration is updated rather than duplicated.

## Validation Completed During Implementation

The following local checks passed:

- `npm run typecheck`
- `npx tsc -p convex/tsconfig.json --noEmit --pretty false`
- `npx convex codegen`
- `npm run build`
- `git diff --check`

The existing Playwright suite still has landing-page accessibility test timeouts in the current environment. The compact layout tests passed. A dedicated registration smoke test should be added after a controlled Convex deployment or test endpoint is available.

## Important Notes

- `hello@hackuta.org` is the sender address, not an email provider credential.
- Actual email delivery will not work until Resend is configured and the sending domain is verified.
- No API key, SMTP password, or deployment credential should be committed to the repository.
- Organizer notification emails are not included. The current confirmation email is sent only to the applicant.
- The current user profile is email-based. Password login and a full authentication provider are outside this implementation.
