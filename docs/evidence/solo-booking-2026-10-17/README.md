# Solo booking browser evidence

Tested frontend HEAD `00668ea5337f902ff8322ebb0d3372557c185bb0` and backend HEAD
`2c879bbd64a53d6a5e82f464a9176d1f54dd09fd`, plus local acceptance changes.
The required feature branches were verified separately; no push/deploy occurred.

`tests/integration/solo-booking.spec.ts` with `playwright.integration.config.ts`:
**6 passed (15.5s)** against the production Next build, real FastAPI localhost:18000
and disposable PostgreSQL. All identities, addresses and bookings are synthetic.
No notification worker, real notification or payment gateway was used.

* Initial solo save: cancel/close/Escape, retained inputs, keyboard focus,
  injected transport failure and explicit retry, exactly one successful save.
* Shared template and once schedule: explicit venue selection, self-only lead,
  price 45 PLN, capacity 2, organizer separate from venue.
* Public venue-payment booking: no cash-only text; booking highlight survives
  reload and appears beside independently studio-organized teaching sessions.
* Ordinary studio name-only save: shared confirmation, cancellation retains input,
  unpublished saved studio commits studio mode and hides solo activation.
* Daily menu: own clients, shared optional PassModal save, payment settings;
  no fake studio profile/team controls or sport cards.
* New eligible solo account at 390×844: contained keyboard focus, no horizontal
  overflow, successful setup, no repeated confirmation on payment settings.

[Public registered state and mixed organizers](solo-public-booked.png)
and [mobile initial confirmation](solo-mobile-confirmation.png) contain no credentials.

Seed only the isolated backend `solo_browser` database using
`tests/fixtures/solo_browser.py`. Keep its test JWT fixture outside Git, mode 0600.
Then run:

```sh
SOLO_ACCEPTANCE_FIXTURES=/tmp/joga-solo-acceptance/browser-identities.json \
  yarn playwright test --config=playwright.integration.config.ts
```

The serial suite needs freshly migrated/reseeded disposable browser data for each
full run. Build/start Next with `API_ENDPOINT` and `NEXT_PUBLIC_API_ENDPOINT` set
to `http://localhost:18000`, `NEXT_PUBLIC_API_USE_SAME_HOST=0`.
Mock API tests are separate and do not prove backend integration.

External provider sandbox, external address autocomplete and remote wy-email HTML
remain unverified. See backend `docs/SOLO_BOOKING_IMPLEMENTATION.md` for full
verification results, baseline regression findings and remaining acceptance.
