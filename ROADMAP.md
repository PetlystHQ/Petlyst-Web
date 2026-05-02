# Engineering Roadmap

This document tracks five focused improvements planned for the codebase after
the initial public release. Each effort is broken into GitHub issues and a
commit-by-commit plan so progress is visible end-to-end and any one chunk can
be paused and resumed without losing context.

## Summary

| #   | Effort                                  | Time          | Issues | Commits | Risk          |
| --- | --------------------------------------- | ------------- | ------ | ------- | ------------- |
| 1   | Continuous Integration (lint + build)   | 2–4 h         | 1      | 2–5     | Low           |
| 2   | Decompose oversized components          | 40–80 h       | 9      | 60–100  | High          |
| 3   | Consolidate API client (`axiosInstance`) | 3–6 h         | 1      | 5–15    | Medium        |
| 4   | Logging discipline                      | 8–15 h        | 2      | 10–20   | Low / Medium  |
| 5   | Smoke-test baseline                     | 10–20 h       | 2–3    | 15–30   | Low           |
|     | **Total**                               | **63–125 h**  | **15–16** | **92–170** |             |

## Recommended order

1. **Effort 1 — CI** first. It guards every later change against regressions,
   so the rest of the work lands on a known-green baseline.
2. **Effort 3 — axios consolidation** next. It is mechanical, removes noise
   the next two efforts would otherwise have to navigate around, and gives
   tests (Effort 5) a single seam to mock.
3. **Effort 4 — logging** before tests, so removed `console.log` calls don't
   accidentally get asserted on later.
4. **Effort 5 — tests**. With the API client unified and noise gone, smoke
   tests are simpler to write and less brittle.
5. **Effort 2 — decomposition** last and incrementally. The hardest, riskiest
   work, best done with CI + tests already in place.

---

## Effort 1 — Continuous Integration

### Goal

Every push to `main` and every pull request runs ESLint and a production
build for the frontend. Surface regressions immediately instead of at deploy
time.

### Why

There is currently no automated check on incoming changes. A senior reviewer
opening the repo today has no signal that the code even type-checks on any
machine other than the author's. Adding CI is the single highest-leverage
change in this roadmap relative to the time it costs.

### Scope

**In:**
- `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, `npm run build`
  for `frontend/petlyst-webapp-frontend`.
- A status badge in [README.md](README.md).

**Out (deferred):**
- Backend lint — backend has no ESLint config. A separate effort would add
  one. Out of scope here to keep the first CI commit small.
- Test runs — covered by [Effort 5](#effort-5--smoke-test-baseline).
- Deployment automation.

### Issues

- [ ] **GH-001** — Add GitHub Actions workflow for frontend lint + build

### Commit plan

| Order | Subject                                                                    | Notes |
| ----- | -------------------------------------------------------------------------- | ----- |
| 1     | `chore(ci): add GitHub Actions workflow for frontend lint + build`         | New `.github/workflows/ci.yml`. Runs on `push` to `main` and on `pull_request`. Uses `actions/setup-node@v4` with `cache: npm`. |
| 2     | `fix(lint): resolve ESLint errors surfaced by CI (batch 1)`                | Likely `@typescript-eslint/no-unused-vars`, `no-explicit-any` in the larger components. Split into batches if the count is large. |
| 3     | `fix(lint): resolve ESLint errors surfaced by CI (batch 2)`                | `react-hooks/exhaustive-deps` and similar. Optional — only if batch 1 is too large to review in one PR. |
| 4     | `fix(types): resolve TypeScript build errors`                              | If `tsc -b` surfaces errors that lint did not. Often type-only fixes (missing return types, narrowed unions). |
| 5     | `docs(readme): add CI status badge`                                        | Tiny commit at the end so it does not block lint fixes from merging. |

### Acceptance criteria

- A green CI run exists on `main` for the most recent commit.
- A pull request with an introduced lint error shows a red CI status before
  it can be merged.
- The badge in the README shows a passing state.

### Risks and mitigations

- **Risk:** Lint produces hundreds of errors and blocks the workflow from
  ever going green.
  **Mitigation:** If the count is overwhelming, land the workflow with
  `continue-on-error: true` on the lint step first, then drop that flag in a
  follow-up commit once errors are cleared. Avoid disabling rules wholesale —
  fix or `eslint-disable` per-line with a reason.
- **Risk:** `npm ci` is slow on every run.
  **Mitigation:** Use `actions/setup-node@v4` with `cache: 'npm'` and a
  `cache-dependency-path` pointing to the frontend `package-lock.json`.

---

## Effort 2 — Decompose oversized components

### Goal

No source file in `frontend/petlyst-webapp-frontend/src/` exceeds ~600 lines.
Pages and large modal components are decomposed into focused subcomponents
with clear single responsibilities.

### Why

Nine files currently exceed 800 lines, three of them exceed 1500. They mix
data fetching, state, layout, and dozens of unrelated UI states in a single
function body. This is the largest readability and reviewability problem in
the codebase.

| File                                                                                                                          | Lines |
| ----------------------------------------------------------------------------------------------------------------------------- | ----- |
| [VeterinarianProfile.tsx](frontend/petlyst-webapp-frontend/src/components/veterinarian/VeterinarianProfile.tsx)               | 2868  |
| [SingleClinicPage.tsx](frontend/petlyst-webapp-frontend/src/pages/SingleClinicPage.tsx)                                       | 1816  |
| [ManagementDashboard.tsx](frontend/petlyst-webapp-frontend/src/pages/ManagementDashboard.tsx)                                 | 1531  |
| [AddClinicPage.tsx](frontend/petlyst-webapp-frontend/src/pages/AddClinicPage.tsx)                                             | 1508  |
| [PetOwnerDashboard.tsx](frontend/petlyst-webapp-frontend/src/pages/PetOwnerDashboard.tsx)                                     | 1300  |
| [EditClinicPage.tsx](frontend/petlyst-webapp-frontend/src/pages/EditClinicPage.tsx)                                           | 1221  |
| [ClinicPreviewPage.tsx](frontend/petlyst-webapp-frontend/src/pages/ClinicPreviewPage.tsx)                                     | 1154  |
| [EditPetModal.tsx](frontend/petlyst-webapp-frontend/src/components/petowner/petownermodals/EditPetModal.tsx)                  | 1075  |
| [AdminDashboard.tsx](frontend/petlyst-webapp-frontend/src/components/admin/AdminDashboard.tsx)                                | 895   |

### Scope

**In:** Per-file decomposition; extract subcomponents, hooks for data
fetching, and pure helper functions. Preserve external behaviour.

**Out:** Visual redesign, feature additions, prop API changes that ripple to
callers.

### Strategy per file

For each oversized file, follow the same loop:

1. **Map sections.** Read the file top-to-bottom and annotate logical
   regions (header, gallery, hours, reviews, etc.).
2. **Extract data fetching** into `use<Feature>` hooks under a
   `hooks/` neighbour directory.
3. **Extract pure presentational subcomponents** one at a time. Keep the
   parent file as the orchestrator until the end.
4. **Extract orchestrator state** (form state, modal toggles) into a single
   reducer or context if it survives the extraction pass.
5. **Run the app manually** through every flow the file owned. CI lint +
   build (Effort 1) is necessary but not sufficient — UI regressions slip
   past the type system.

### Issues

One issue per file. The first three are the high-impact ones; the bottom six
can be folded into a single "long-tail" issue if time runs short.

- [ ] **GH-002** — Decompose `VeterinarianProfile.tsx` (2868 lines)
- [ ] **GH-003** — Decompose `SingleClinicPage.tsx` (1816 lines)
- [ ] **GH-004** — Decompose `ManagementDashboard.tsx` (1531 lines)
- [ ] **GH-005** — Decompose `AddClinicPage.tsx` (1508 lines)
- [ ] **GH-006** — Decompose `PetOwnerDashboard.tsx` (1300 lines)
- [ ] **GH-007** — Decompose `EditClinicPage.tsx` (1221 lines)
- [ ] **GH-008** — Decompose `ClinicPreviewPage.tsx` (1154 lines)
- [ ] **GH-009** — Decompose `EditPetModal.tsx` (1075 lines)
- [ ] **GH-010** — Decompose `AdminDashboard.tsx` (895 lines)

### Commit plan (template per file)

Roughly six to eight commits per file. Example for `VeterinarianProfile.tsx`:

| Order | Subject                                                                    |
| ----- | -------------------------------------------------------------------------- |
| 1     | `refactor(vet-profile): extract useVeterinarianProfile data hook`          |
| 2     | `refactor(vet-profile): extract <ProfileHeader> subcomponent`              |
| 3     | `refactor(vet-profile): extract <BiographySection> subcomponent`           |
| 4     | `refactor(vet-profile): extract <ClinicAffiliationCard> subcomponent`     |
| 5     | `refactor(vet-profile): extract <PendingRequestsBanner> subcomponent`     |
| 6     | `refactor(vet-profile): extract <ProfileVisibilityToggle> subcomponent`   |
| 7     | `refactor(vet-profile): collapse remaining state into useReducer`          |
| 8     | `refactor(vet-profile): final pass — file under 600 lines`                 |

Multiply across the nine files, with the smaller files (under ~1100 lines)
typically needing 4–6 commits instead of 7–8.

### Acceptance criteria

- Every file in the table above is under 600 lines.
- No subcomponent extracted is larger than 300 lines.
- All flows that the original page owned still pass a manual smoke test.
- CI is green for every commit in the chain (Effort 1 in place).

### Risks and mitigations

- **Risk:** Subtle regressions in flows that lack tests (Effort 5 ideally
  lands first, but the timeline forces this last).
  **Mitigation:** Open each file's PR small. Manually walk every interactive
  state. Use the "QA checklist" PR template (see [Tracking](#tracking)).
- **Risk:** Refactor scope creep (rewriting redux state, swapping form libs).
  **Mitigation:** Extraction commits only — no behaviour change. Anything
  else gets its own follow-up issue.

---

## Effort 3 — Consolidate API client

### Goal

Every HTTP call from the frontend goes through the configured `axiosInstance`
in [src/utils/axiosConfig.ts](frontend/petlyst-webapp-frontend/src/utils/axiosConfig.ts).
No file imports `axios` directly to make ad-hoc calls with hand-built
`Authorization` headers.

### Why

Today the codebase mixes two patterns:

1. The configured `axiosInstance`, which has request and response
   interceptors that inject the token from local storage and handle 401
   redirects centrally.
2. Direct `axios.get(`${API_URL}/api/...`, { headers: { Authorization: ... } })`
   calls, scattered across dozens of files.

The second pattern duplicates the auth header in every call site, makes the
interceptor logic unreliable (it only fires on path #1), and means a future
401-handling change has to be repeated in ~60 places. A senior reviewer will
flag this on first read.

### Scope

**In:**
- Migrate every direct `axios.<method>(...)` call site under `src/` to
  `axiosInstance.<method>(...)`.
- Drop now-redundant `Authorization` header builders at call sites.
- Remove `axios` direct imports left without callers.

**Out:**
- Changing the interceptor behaviour itself (retry, refresh tokens, etc.).
- Backend auth flow.

### Issues

- [ ] **GH-011** — Migrate all frontend HTTP calls to `axiosInstance`

### Commit plan

Group by feature directory to keep diffs reviewable. Each commit should keep
the app runnable.

| Order | Subject                                                                  |
| ----- | ------------------------------------------------------------------------ |
| 1     | `refactor(api): align axiosInstance to baseURL from src/config/api`      |
| 2     | `refactor(api): migrate src/components/admin to axiosInstance`           |
| 3     | `refactor(api): migrate src/components/modals to axiosInstance`          |
| 4     | `refactor(api): migrate src/components/clinic/management to axiosInstance` |
| 5     | `refactor(api): migrate src/components/clinic/forms to axiosInstance`    |
| 6     | `refactor(api): migrate src/components/veterinarian to axiosInstance`    |
| 7     | `refactor(api): migrate src/components/dashboard to axiosInstance`       |
| 8     | `refactor(api): migrate src/pages to axiosInstance`                      |
| 9     | `chore(api): drop direct axios imports left without callers`             |
| 10    | `refactor(api): centralize 401-redirect path through interceptor`        |

### Acceptance criteria

- `git grep "axios\\.\\(get\\|post\\|put\\|delete\\|patch\\)"` returns only
  matches inside `axiosConfig.ts`.
- The `Authorization: Bearer …` string appears in exactly one place
  (`axiosConfig.ts` request interceptor).
- All flows still authenticate correctly and redirect to login on 401.

### Risks and mitigations

- **Risk:** A handful of call sites send `multipart/form-data` (image upload)
  with custom headers. Replacing the call wholesale could clobber the
  `Content-Type: multipart/form-data` boundary that axios sets automatically.
  **Mitigation:** When moving an upload call, pass `headers` explicitly only
  if the original did. Test image upload flows after each migration commit.
- **Risk:** `axiosInstance` baseURL is `${API_URL}/api`, so call sites that
  used `${API_URL}/something-not-under-api/...` need their path rewritten,
  not just the import.
  **Mitigation:** Inventory non-`/api` paths up front; there should be very
  few. Where they exist, keep using the absolute URL through `axiosInstance`
  with a leading `/` removed.

---

## Effort 4 — Logging discipline

### Goal

Frontend has zero `console.log` calls in shipped code. Backend uses a
structured logger (`pino`) so logs are filterable by level and parseable by
tooling.

### Why

There are roughly 90 `console.log` statements in the frontend and 445 in the
backend. Many were added as debugging aids during development and never
removed. They:

- Leak implementation detail to anyone with the browser devtools open
  (request bodies, token previews, internal state).
- Add cost on every render or request.
- Make legitimate signal hard to find.

### Scope

**In:**
- Frontend: delete debug `console.log` calls. Replace genuinely useful
  diagnostics with `console.warn` or `console.error` only when they reflect
  a real failure mode.
- Backend: introduce `pino` (small, fast, JSON-by-default). Replace
  `console.log` with `logger.info`, `console.error` with `logger.error`.
  Keep startup banners but route them through the logger.

**Out:**
- A full observability story (transports to Datadog/Loki, request IDs,
  trace propagation).

### Issues

- [ ] **GH-012** — Remove debug `console.log` calls from frontend
- [ ] **GH-013** — Adopt `pino` logger in backend and replace `console.log`

### Commit plan — frontend

| Order | Subject                                                                  |
| ----- | ------------------------------------------------------------------------ |
| 1     | `chore(logging): remove [DEBUG] console logs from MapComponent`          |
| 2     | `chore(logging): clean console.log noise from axiosConfig interceptors`  |
| 3     | `chore(logging): clean console.log noise from auth + reset modals`       |
| 4     | `chore(logging): final sweep — frontend console.log under 5 (errors only)` |

### Commit plan — backend

| Order | Subject                                                                  |
| ----- | ------------------------------------------------------------------------ |
| 1     | `feat(logging): add pino logger and request middleware`                  |
| 2     | `refactor(logging): migrate userRoutes from console to pino`             |
| 3     | `refactor(logging): migrate veterinarianRoutes from console to pino`     |
| 4     | `refactor(logging): migrate clinicRoutes + adminRoutes to pino`          |
| 5     | `refactor(logging): migrate appointmentRoutes + medical routes to pino`  |
| 6     | `refactor(logging): migrate inventory + hospitalization to pino`         |
| 7     | `refactor(logging): migrate aws/s3Service and utils to pino`             |
| 8     | `chore(logging): remove startup auto-migration logs from server.js`      |
| 9     | `chore(logging): final sweep — no console.log anywhere in src`           |

### Acceptance criteria

- `git grep "console\\.log" frontend/petlyst-webapp-frontend/src` returns at
  most 5 results, all on legitimate error paths.
- `git grep "console\\.log" backend/petlyst-webapp-backend` returns zero
  results outside `node_modules` and `scripts/`.
- Backend boot prints a structured JSON line, not a freeform banner.

### Risks and mitigations

- **Risk:** Removing logs can mask a class of bugs that were only diagnosed
  by reading them.
  **Mitigation:** When in doubt, convert (`console.log` → `logger.debug`)
  rather than delete. `logger.debug` is silent at default level but available
  when needed.
- **Risk:** `pino` pretty-printing in dev pulls in a transport package.
  **Mitigation:** Use `pino-pretty` as a dev dependency only; production
  logs stay JSON.

---

## Effort 5 — Smoke-test baseline

### Goal

A small, sustainable test suite that runs in CI, covers the riskiest flows,
and gives any future contributor confidence that "lint passes" is a real
signal.

### Why

There are zero tests today. A senior reviewer reading the repo cold has no
way to verify what works. Even a thin layer of smoke tests — render the app,
walk through login, hit one happy-path API call — moves the project from
"untested" to "tested but coverage is low," which is a category change in
how the codebase reads.

### Scope

**In:**
- Vitest + React Testing Library on the frontend, with `jsdom`.
- Five to ten smoke tests covering: auth modal renders, login submits to the
  expected endpoint, dashboard renders post-login, axios interceptor injects
  token, 401 response triggers redirect.
- Wire the suite into the CI workflow added in Effort 1.

**Out:**
- Backend tests (Jest + Supertest is a sensible follow-up but not in this
  effort's budget).
- E2E tests (Playwright). Tracked separately.
- High coverage targets. The point of this effort is the baseline, not the
  number.

### Issues

- [ ] **GH-014** — Set up Vitest + React Testing Library
- [ ] **GH-015** — Add five smoke tests for critical user flows
- [ ] **GH-016** — (Optional) Add backend Jest + Supertest baseline

### Commit plan — frontend

| Order | Subject                                                                  |
| ----- | ------------------------------------------------------------------------ |
| 1     | `test(setup): add vitest config, jsdom env, and test scripts`            |
| 2     | `test(setup): add @testing-library/react and helpers`                    |
| 3     | `test(api): smoke test that axiosInstance injects bearer token`          |
| 4     | `test(auth): smoke test that AuthModal renders and submits to /login`    |
| 5     | `test(auth): smoke test that 401 response redirects to /login`           |
| 6     | `test(dashboard): smoke test that Dashboard renders for an authed user`  |
| 7     | `test(reset): smoke test that reset password flow steps render in order` |
| 8     | `ci(tests): add npm test step to GitHub Actions workflow`                |
| 9     | `docs(readme): add testing section to README`                            |

### Commit plan — backend (optional, GH-016)

| Order | Subject                                                                  |
| ----- | ------------------------------------------------------------------------ |
| 1     | `test(setup): add jest, supertest, and test database scaffolding`        |
| 2     | `test(users): smoke test that POST /api/users/login validates input`     |
| 3     | `test(clinics): smoke test that GET /api/clinics requires auth`          |
| 4     | `ci(tests): run backend tests in GitHub Actions`                         |

### Acceptance criteria

- `npm run test` in `frontend/petlyst-webapp-frontend` runs cleanly and
  reports the suite green.
- The CI workflow runs the test step on every PR.
- Each smoke test fails predictably when its target behaviour breaks (verify
  by intentionally regressing one and watching the test fail).

### Risks and mitigations

- **Risk:** Tests get coupled to Redux internals or specific markup, so
  refactors (Effort 2) break them.
  **Mitigation:** Use RTL queries by role/text, not by class. Avoid
  `container.querySelector`. Mock at the network layer (MSW) rather than at
  the axios import.
- **Risk:** Test setup gets stuck on jsdom + vite-plugin compatibility.
  **Mitigation:** Use the `@vitest/browser` or plain jsdom environment from
  the official Vite + Vitest docs. Don't roll a custom transformer.

---

## Tracking

- All issues live in the repository's GitHub Issues tab under one of these
  labels: `effort/1-ci`, `effort/2-decompose`, `effort/3-axios`,
  `effort/4-logging`, `effort/5-tests`.
- Each PR references its issue with `Closes #N`.
- A standing milestone called "Engineering Roadmap" groups every PR
  produced by this document so reviewers can see the slice as one body of
  work.

### PR template — recommended fields

```
## What changed
- one bullet per logical change

## Why
- link the issue + this roadmap section

## How to verify
- the exact manual or scripted check the reviewer should run

## Risk
- one line on what could break and how this PR mitigates it
```

---

## Out-of-scope follow-ups

These are real problems but not part of the five tracked efforts. Recorded
here so they don't get lost.

- **Backend startup migrations.** `server.js` runs `ALTER TABLE` and
  bulk-encrypts TC numbers on every boot. Replace with a real migration tool
  (`node-pg-migrate` or `umzug`) and a one-shot encryption script.
- **`ENCRYPTION_KEY` rotation.** The current value matches the previous
  hardcoded fallback so existing ciphertexts decrypt. Generate a fresh
  32-byte key, re-encrypt the `veterinarians.veterinarian_tc_number` column
  with it, then update the env. AWS access required.
- **Plaintext password residue.** At least one user record has a non-bcrypt
  password (`Veteriner123`). DB hygiene task; doesn't block roadmap work.
- **Backend ESLint + format config.** Adding ESLint and Prettier to the
  backend in line with the frontend is a small, isolated effort; could be
  GH-017 once Effort 1 ships.
- **Duplicate `DashboardSidebar.tsx`.** Two files with the same name live
  under `components/dashboard/` and `components/layout/`. Reconcile to one
  during Effort 2.
