# Current solo organizer names

Real API/PostgreSQL browser regression: `tests/integration/solo-organizer-name.spec.ts`,
**2 passed (6.7s)**. Existing resources survive two profile names, reloads, desktop/mobile
lists and details. Studio-organized resources keep their studio identity; this teacher
independently uses the same studio as a solo venue. Only synthetic fixtures appear here.

* [Desktop bookings](organizer-1280-bookings.png) and [passes](organizer-1280-passes.png).
* [Mobile bookings after rename](organizer-390-bookings.png),
  [passes](organizer-390-passes.png), [existing notification detail](organizer-390-inbox.png).
* Actual backend fallback HTML: [pass-funded booking](solo-booking_confirmed.html),
  [drop-in](solo-dropin.html), [reschedule](solo-rescheduled.html),
  [cancellation](solo-cancelled.html), [studio control](studio-booking_confirmed.html).
* Browser-rendered fallback [booking](organizer-email-solo-booking_confirmed.png),
  [drop-in](organizer-email-solo-dropin.png) and
  [cancellation](organizer-email-solo-cancelled.png).

The full wy-email renderer is unavailable, as confirmed by the requester. These HTML files
are the application's actual outage fallback, **not** a substitute claiming to verify
wy-email/React output. No real email was sent.

To rerun only these browser checks against localhost:3000 / API localhost:18000:

```sh
SOLO_ORGANIZER_FIXTURES=/tmp/joga-solo-acceptance/organizer-identities.json \
SOLO_ORGANIZER_EMAIL_ARTIFACTS=/tmp/joga-solo-acceptance/organizer-emails \
  yarn playwright test --config=playwright.integration.config.ts \
  tests/integration/solo-organizer-name.spec.ts
```

The fixture file contains test JWTs: keep it outside Git, mode 0600. This test renames
only its dedicated synthetic instructor, then restores that fixture's initial public
name; it does not recreate resources or touch the requester's Maria account.
No seed reset is needed. Backend `docs/SOLO_ORGANIZER_NAME_FIX.md` records the full trace,
245 passing backend checks, scope, revisions and external-rendering limitation.
