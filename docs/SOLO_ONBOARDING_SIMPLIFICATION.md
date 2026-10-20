# Solo onboarding simplification — 2026-10-19

Implemented on `feature/solo-instructor-booking-tools` (base `00668ea`). Backend inspected on `feature/solo-instructor-booking-tools-backend` (`2c879bb`); no backend files changed for this task. Existing unrelated working-tree changes were preserved.

The solo menu entry now opens the existing `InstructorFullProfileForm` directly, with account-name defaults and no email lookup or “To ja” decision. Studio-scoped and general instructor-addition entries retain their existing flows. The solo header and close destination follow the solo context.

Meaningful decisions:

- Opening or abandoning the editor creates nothing. Explicit “Zapisz profil” uses the existing self-create/claim endpoint and profile-update endpoint. A retry after a failed update reuses the already created/claimed ID. Unedited content on a claimed stub is preserved.
- An existing canonical `self_instructor_id` is reused. Normal re-entry with a self profile continues to the existing booking settings; an old solo editor URL opens that same profile.
- Successful profile save refreshes capabilities and returns to booking settings. Business mode still commits only through the existing confirmation and successful business-setup save.

Verification used `http://localhost:3000`, the real API at `http://localhost:8000`, and the existing `mydb` database. Only two dedicated test accounts and their small test resources were added; no reset, seed, migration or service restart was performed.

- Two focused Playwright cases in `tests/integration/solo-onboarding.spec.ts` passed: solo onboarding at 390px and ordinary studio addition at desktop width. These group direct entry, account identity, empty-name validation, cancellation without profile creation, explicit save, canonical profile reuse, mode-confirmation cancellation and successful commitment, plus the unchanged studio email/self/other roster paths.
- `yarn typecheck`, focused ESLint without autofix, and `git diff --check` passed.
- Read-only database verification confirmed exactly one self profile per test account, the expected solo/studio modes, zero notifications/invitations from these accounts, and an unchanged global notification count.
- Frontend returned HTTP 200 and backend `/healthz` returned HTTP 200 afterward. Development servers remain running.

Screenshots were visually inspected: [solo profile, mobile](evidence/solo-onboarding-2026-10-19/solo-profile-mobile.png), [studio addition](evidence/solo-onboarding-2026-10-19/studio-add-instructor.png). The Next.js development indicator was hidden only in the solo test browser because it overlapped the mobile save button.

Test identities are held in a private temporary file, never in Git. Re-running these stateful journeys requires fresh local test-account preconditions and `SOLO_ONBOARDING_IDENTITIES`; the existing integration configuration is reused. No testing infrastructure was added.

The full regression/backend suites, actual invitation delivery, email/SMS verification and payments were not run for this bounded frontend change. The notification worker remained stopped; no external delivery or payment was performed.
