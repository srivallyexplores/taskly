# Taskly: Comprehensive Fix Spec

## Goal

Make Taskly's existing functionality actually work end to end for local/session-based usage, set up Cloudinary image upload and the email service, fix the onboarding flow (including "add user" and "view previous onboards"), repair profile/settings updates, wire up the already-built Teams/Projects frontend to the backend, and fix CI/CD. Scope is **fixes to current behavior, not new complex features.**

This spec is grounded in the actual code as of the audit. It is authoritative for the coder subagents.

---

## Root-cause diagnosis (why "every functionality is not working")

### 1. Auth model mismatch (the primary "nothing works" bug)
- `backend/controllers/authController.js` `login`/`register` use **Passport sessions** (`req.logIn`) and return **no token**.
- `frontend/src/services/api.js` is **session-cookie based** (`withCredentials: true`) and never sends a `Bearer` token.
- But `backend/middleware/auth.js` `authenticateToken` **requires** an `Authorization: Bearer <token>` header (local JWT or Cognito). It is used by `routes/auth.js` (`GET /api/auth/me`), all of `routes/users.js` (profile, tasks-by-user), and `routes/upload.js`.
- Result: after login the session cookie is set, but `GET /api/auth/me` and every `/api/users/*` call returns **401**, so the app appears fully broken (profile, settings, user tasks, avatar).
- Meanwhile `routes/teams.js` and `routes/projects.js` use `auth` (Passport session `req.isAuthenticated()`), so they would work once a session exists, creating an inconsistent split.

**Fix (single unifying change):** make `authenticateToken` accept the Passport session as a fallback. When there is no `Bearer` token but `req.isAuthenticated()` is true and `req.user` is set (Passport), authenticate via the session. Keep local-JWT and Cognito paths intact and unchanged in behavior when a Bearer token IS present or when Cognito is enabled. This aligns all authenticated routes with the session-cookie frontend without breaking JWT/Cognito production paths.

### 2. Profile / Settings updates not persisted
- `frontend/src/context/AuthContext.jsx` `updateUser(userData)` only dispatches a local reducer action; it **never calls the backend**. Onboarding `ProfileStep` calls `updateUser(formData)` so nothing is saved.
- The backend endpoint `PUT /api/users/profile` (`userController.updateProfile`) is correct and supports `fullname, username, email, avatar, bio, timezone, jobTitle, company, onboarding`.
- `OnboardingFlow` `ProfileStep` uses camelCase `user?.fullName` while the model/API use `fullname`, so values do not map.

**Fix:** Add an async profile-persisting path in `AuthContext` (e.g. `updateProfile`) that calls `userService.updateProfile` and updates state from the server response, and use it in Settings/Profile/Onboarding. Correct the field name mapping (`fullname`, not `fullName`).

### 3. Frontend calls several nonexistent backend endpoints
- `authService`: `PUT /auth/profile`, `GET /auth/teams`, `GET /auth/projects`, `GET /auth/teams/:id/permissions`, `GET /auth/invites/:code/validate`, `POST /auth/invites/:code/join`, `POST /auth/teams/:id/leave`, `POST /auth/projects/:id/leave` — none exist in `routes/auth.js`.
- `AuthContext.refreshUserTeamsAndProjects` calls `authService.getUserTeams()`/`getUserProjects()` which hit the missing `/auth/teams` and `/auth/projects`.

**Fix (keep it simple):** repoint these frontend calls to endpoints that already exist:
  - `updateUserProfile` → `PUT /users/profile` (already in `userService.updateProfile`).
  - user teams/projects → use existing `GET /teams` and `GET /projects` (both return the caller's teams/projects) via `teamService`/`projectService`, or make `refreshUserTeamsAndProjects` a no-op-safe function that tolerates absence.
  Do NOT invent new backend routes unless an existing one cannot satisfy the frontend; prefer repointing the client. Any remaining unused authService methods that reference `/auth/*` should be repointed or removed so they never 404 at runtime.

### 4. Image upload broken (user wants Cloudinary)
- `frontend/src/services/userService.uploadAvatarFile` does `POST /upload/avatar` with `multipart/form-data` and expects `response.data.avatar` / `response.data.publicId`.
- `backend/routes/upload.js` only defines S3 pre-signed endpoints (`POST /upload/avatar/presign`, `/upload/avatar/confirm`, `/upload/attachment/presign`, `DELETE /upload/avatar`). There is **no** `POST /upload/avatar` multipart route, so avatar upload always fails.
- `backend/config/cloudinary.js` already exports a configured multer `upload` middleware (`CloudinaryStorage`, folder `taskly/avatars`) and `validateCloudinaryConfig()`.

**Fix (per user: use Cloudinary, keep simple):** add `POST /api/upload/avatar` to `routes/upload.js` using the exported Cloudinary `upload.single('avatar')` middleware. On success, set `req.user.avatar` and `req.user.avatarPublicId` from the Cloudinary result, save the user, and return `{ success:true, data:{ avatar, publicId } }` matching the frontend's expected shape. Guard behavior when Cloudinary is not configured: return a clear `503`/`{success:false,error:{code:'CLOUDINARY_NOT_CONFIGURED'}}` instead of crashing. Keep the S3 presign endpoints in place for the AWS path (do not delete them). Use `authenticateToken` so it honors the session fix from item 1.

### 5. Email service not set up
- `backend/config/resend.js` `sendEmail` already degrades gracefully when `RESEND_API_KEY` is unset (returns `{success:false, code:'EMAIL_SERVICE_NOT_CONFIGURED'}`), and registration already calls it non-blocking.
- The "setup" gap is: documented env vars, `.env.example` entries, a small verifiable email config module/health signal, and tests that confirm graceful behavior when unconfigured and correct call shape when configured (mocked).

**Fix (keep simple):** ensure `RESEND_API_KEY` and `EMAIL_FROM` are documented in `backend/.env.example` and the root env docs; confirm `welcomeEmail`/`passwordResetEmail` templates exist in `utils/emailTemplates.js` and are wired (they are, in authController/userController). Add/repair unit tests around `config/resend.js` (mock the Resend SDK) verifying: unconfigured → graceful failure; configured → `resend.emails.send` called with `{from,to,subject,html,text}`. Do NOT hardcode any real key.

### 6. Onboarding flow issues ("step 4 empty", persistence, add user, view previous onboards)
- `OnboardingFlow` gates entirely on a `localStorage` flag `hasCompletedOnboarding` and never reads/writes `user.onboarding` from the backend, so progress is not persisted and cannot be reviewed.
- `ProfileStep` field mapping bug (`fullName` vs `fullname`) and `updateUser` not persisting (item 2) means step data is lost.
- Step 4 (`FirstTaskStep`, index 3) renders content in code; the reported "empty" is a symptom of the modal step rendering when auth/user state is missing (user is null after the 401 cascade) and/or the step relying on data that never loaded. Fixing items 1–2 restores user context. Additionally, harden `renderStepContent`/step components against a null `user`.
- "add user and view the previous onboards": expose a simple management view. The `Users.jsx` page + `GET /api/users` (paginated) already return users including their `onboarding` object. Provide: (a) ability to **add a user** (admin-style create via existing `POST /api/auth/register`), and (b) a **view of previous onboardings** (list users with `onboarding.completed`, `completedAt`, `currentStep`). Keep this simple: a table/section on the existing Users page or a dedicated lightweight page, using existing endpoints. No new complex feature surface.

**Fix:** Persist onboarding progress to `user.onboarding` via `PUT /users/profile` at each step/completion; drive the "already completed" check from `user.onboarding.completed` (fall back to localStorage). Fix the `fullname` mapping. Guard against null user. Add the simple "add user" + "view previous onboards" UI backed by existing endpoints.

### 7. CI/CD issues
- Backend has **no ESLint config**; ESLint v9 requires `eslint.config.js` (flat). `npm run lint` hard-fails. CI steps use `|| echo "Lint not configured"` so they do not fail the job, but the intent ("fix cicd issues") is that lint should actually run and pass.
- Backend route/integration tests are **stale and broken** (see item 8) and would fail `npm test`. CI runs only the `unit` project for backend (`npm test -- --project=unit`), which mostly passes, but the `--project` flag form is non-standard for this Jest version (correct is `--selectProjects unit`). Frontend CI runs `npm test -- --run` but many frontend tests fail.
- Workflows reference OIDC role + buckets via GitHub `vars`; those are deployment-time secrets/vars, not fixable in-repo. Flag, do not fabricate.

**Fix:** Add a working backend `eslint.config.js` (flat config, Node + ESM, jest globals for tests) so `npm run lint` runs clean (fix or disable rules as needed to pass without churn). Normalize CI test invocation to `--selectProjects unit` (or keep `npm run test:unit` script) and keep the tolerant `|| echo`. Ensure `npm run lint` and the backend `unit` test project pass locally. Do NOT alter OIDC/vars/secrets or Terraform apply behavior.

### 8. Backend test suite is stale/broken (largest count of failures)
- `tests/setup.js` never defines the globals the route tests use (`app`, `User`, `Team`, `Project`) and never imports the Express app.
- `tests/routes/auth.test.js` / `tests/routes/tasks.test.js` use `name` (model uses `fullname/username`), `user.generateAuthToken()` (not defined on the model), and `POST /api/tasks` (route is `POST /api/users/:userId/tasks`), and Bearer tokens (session model). They test an app that never matched this code.
- Some unit tests (`s3-presign`, `lambda-handler`, `auth-middleware`, `documentdb-connectivity`, `aws-integration`, `full-integration`, `email`) fail due to missing globals/env or requiring live AWS/DB.

**Fix (pragmatic, keep green + meaningful):**
  - Update `tests/setup.js` to import the Express app and expose the globals the DB tests expect, or convert the tests to import `app` and models directly (ESM import). Provide a real auth helper that logs in via the session (supertest agent) OR issues a local JWT, matching the chosen auth model, so authenticated route tests exercise real code paths.
  - Rewrite/repair `tests/routes/auth.test.js` and `tests/routes/tasks.test.js` to match the actual API: register with `{fullname,username,email,password}`, login with `{username,password}`, create tasks via `POST /api/users/:userId/tasks`, and authenticate with the session agent (or Bearer JWT if that path is chosen). Tests MUST fail if the implementation is reverted.
  - For tests that require live AWS/DocumentDB (`integration/aws-integration`, `documentdb-connectivity`, `integration/full-integration`), gate them behind an env flag (e.g. skip when `RUN_AWS_INTEGRATION!=='true'`) so the default suite is green without external services. Do not delete meaningful coverage; skip only what genuinely needs live infra.
  - Ensure `npm test` (both projects) is green by default, and add a focused test for the new Cloudinary avatar route (mock cloudinary) and the session-fallback auth behavior.

### 9. Frontend test suite failures
- Many frontend component tests fail (e.g. `Input.test.jsx` expects a `<label>` the component doesn't render). These are pre-existing and broad.

**Fix (scoped):** Do NOT attempt to fix all 233 failing frontend tests. Focus on: (a) tests covering the code you change (auth context profile persistence, onboarding, userService/uploadService, users page), making those pass and meaningful; (b) ensuring the frontend build (`npm run build`) succeeds. Record remaining unrelated failures as a known-issue baseline in the final report rather than churning unrelated components.

---

## Non-goals / guardrails
- No new complex features. Teams/Projects: wire existing frontend to existing backend; do not expand scope.
- Do not run `terraform apply`. Do not provision AWS resources.
- Do not hardcode secrets. Use env vars and `.env.example` documentation.
- Do not switch to TypeScript, do not add DynamoDB, keep AWS SDK v3, keep ESM (per steering).
- Keep the S3 presign upload path intact for production; Cloudinary is the local/default image path.

## Verification strategy
- Backend: `npm test` green (both projects) with meaningful, revert-sensitive tests; `npm run lint` clean.
- New/changed API behaviors covered by tests exercising real handlers via supertest (session agent).
- Frontend: `npm run build` succeeds; targeted tests for changed modules pass.
- Manual/scripted endpoint reconciliation: every method in frontend `services/*.js` maps to an existing backend route (documented in the final report).
- Cloudinary/email: verified via mocked unit tests plus graceful-degradation behavior when unconfigured (no real credentials available in this environment).
