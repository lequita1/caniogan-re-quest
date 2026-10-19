# Caniogan Re:Quest

Responsive React web app for community requests and barangay services in Caniogan, Malolos, Bulacan. Uses native CSS, React Router, Firebase Authentication and Realtime Database. Community help requests now use Firebase records. Document, event, messaging and aggregate screens still use fixture records until their workflows are connected.

## Local setup

1. Install Node.js 22.12+ or 24+ and run `npm ci`.
2. Copy `.env.example` to `.env.local` and fill in the Firebase Web app configuration. Do not commit `.env.local`.
3. Run `npm run dev`. Use `npm run lint` and `npm run build` before requesting review.

## Authentication and residency

Implemented: email/password signup and sign-in, email verification and refresh, reset emails using Firebase's hosted action handler, session-only sign-in by default, optional remembered sign-in, logout, account-creation recovery, residency submission/correction and scoped staff review. Protected routes require an active account, confirmed email and the appropriate role. Residents also need approved residency.

### Configure the real Firebase project before using live accounts

1. In Authentication → Sign-in method, enable **Email/Password**. Add your development/deployed host under Authentication → Settings → Authorized domains if required.
2. Review `database.rules.json`. In Realtime Database → Rules, publish those rules to the intended database. They allow scoped account, verification, private request and public board paths, and deny all other paths. Do not overwrite an existing project's unrelated rules without integrating them first. Local code changes do **not** publish rules automatically.
3. Test with an email you control and fictional residency details. Firebase emails open its hosted confirmation/reset page; return to the app and choose **Nakumpirma ko na** after email verification.
4. Create the first reviewer's account normally and confirm its email. As the Firebase project owner, find its UID in Authentication → Users. In Realtime Database, change `accounts/{uid}/role` to `staff` and add `accounts/{uid}/capabilities/reviewResidents: true`. Preserve its profile and `standing: active`. Staff cannot grant this permission in the browser. Sign in again to check staff access.
5. A Captain is provisioned separately with `role: captain`, `standing: active`, and a confirmed email. Do not give the Captain `reviewResidents`.

Only an explicitly enabled staff reviewer can open the residency queue. The reviewer cannot approve their own case, change the applicant's submitted details, assign roles or change account standing. Approval requires a recorded in-person evidence check and reason. Returned cases can be corrected and submitted again; rejected cases require help from staff. This phase stores the current submission and latest review, not an immutable review history.

### Resident data

Use fictional names and addresses. ID numbers and identity-document uploads are not collected. Optional request photos use authenticated Cloudinary storage through the separate media Worker. Official privacy/retention policy and real-world evidence procedures must be established before collecting real resident data. Unconnected service paths remain denied.

## Isolated emulator testing

Install Java 21+ for the Database emulator. Run `npm run emulators`; it uses the isolated `demo-caniogan-request` project and never deploys to the real project.

For an emulator-only app preview, use a separate local environment file or process variables:

```dotenv
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_PROJECT_ID=demo-caniogan-request
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_DATABASE_URL=https://demo-caniogan-request.firebaseio.com
```

Restart Vite after changing environment values. Emulator accounts/data are disposable and must not contain real credentials. Emulator connection code is enabled only during Vite development; production builds always use the configured real project.

Emulator emails are not delivered to an inbox. Use the confirmation/reset link printed in the emulator terminal. Real Firebase accounts use actual email delivery instead.

Run `npm run test:rules` with emulators stopped, or `npm run test:rules:running` when the Database emulator is already running. The test suite explicitly targets the demo namespace and covers bootstrap, private access, privileged fields, reviewer capability, submission/review transitions, timestamps and suspended accounts.

With the Auth and Database emulators running and Google Chrome installed, use `npm run test:e2e` for browser tests. Playwright starts its own Vite preview on port5180 with explicitly isolated Firebase configuration; it never falls back to the real project. Use `npm run test:e2e:isolated` to start fresh emulators automatically when their ports are free. Do not run the rules tests concurrently with E2E tests because the rules suite resets its local database. The two rule files also share that namespace and the scripts run them with `--test-concurrency=1`.

## Interface language and design

Filipino is the default, with authored English selected from the header. Language choice is saved on the device and switching language preserves form input. Maintain English messages in `src/locales/en.json`, use complete sentences with interpolation, and leave personal input and official document names unchanged. Run `npm run test:copy` to check message coverage and interpolation variables.

Keep visible wording concise and familiar. Project/prototype/sample notices are excluded from the interface, while unavailable actions remain disabled with accurate explanations. Fixture data remains in source until each service is integrated. Native CSS, accessible tab navigation and brief reduced-motion-aware feedback implement the civic design direction. Figma is a reference, not a restriction.

## Team workflow

Use your chosen task branch and a reviewed pull request into `main`. Commit application source, configuration, Firebase rules and lockfile. Tests, test-runner configuration, reports, `docs/`, outputs, dependencies, build files, actual environment values and local AI/memory files remain ignored. Test commands above require the local test files; those files are intentionally not included in a fresh clone. App development and production builds do not require them.

Architecture entry points: `src/app/AppRoutes.jsx`, `src/features/auth/`, `src/features/verification/`, `src/lib/firebase.js`, and `database.rules.json`.

## Known follow-up

The current Firebase dependency has four production audit findings through its pinned Firestore/gRPC dependency. A compatible update did not resolve them; do not force a Firebase downgrade. Review upstream remediation before production deployment. Emulator/CLI dependencies are development-only. Full accessibility/user testing and immutable review histories remain future work. The private media lifecycle is implemented locally; its updated Worker and database rules require separate rollout. Real Cloudinary credential/preset compatibility has not been exercised by the isolated tests.


## Community requests and maps

Residents with approved residency can create and edit a draft, add up to three request photos (JPEG/PNG/WebP, 5 MiB each), review the public/private details and submit for moderation. A staff member with `accounts/{uid}/capabilities/reviewRequests: true` can approve, return with feedback or reject someone else's submission. Grant this capability through the Firebase Console as project owner; `reviewResidents` alone does not grant it. The reviewer account also needs confirmed email, `role: staff` and `standing: active`.

Approved requests appear in the searchable community board. Owners can cancel an open request; its public entry is removed atomically. Drafts can be deleted after their photos are removed. Two-way completion, volunteer selection, messaging and points are subsequent phases and are not simulated by this workflow.

Maps use Leaflet with OpenStreetMap tiles and attribution, following the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Pins are optional; an area or landmark works without a map. Exact coordinates and meeting instructions remain private to the owner and authorized reviewer. The board receives only rounded integer coordinates (thousandths of a degree). Device location is requested only after pressing its button. Keyboard users can pan the map and choose its center. Failed tile loading leaves the text/list controls usable. Do not bulk-fetch, prefetch or offline-cache the standard OpenStreetMap tiles; use a suitable provider if usage grows.

### Activate request photos

1. Review and publish the current `database.rules.json` to the intended Realtime Database. Earlier account-only rules cannot save requests.
2. Update the existing media Worker from `workers/media/worker.js` and add the `MEDIA_LIMITER` binding described in `workers/media/README.md`. Keep existing credentials private and preserve `UPLOAD_LIMITER`. The lifecycle code and extra binding must be released together. The Wrangler configuration contains both binding definitions but does not publish itself.
3. Set `VITE_MEDIA_API_URL` in `.env.local` to your Worker origin and restart Vite. Add the exact frontend origin to the Worker's `ALLOWED_ORIGINS`; ports are part of an origin. Never put a Cloudinary API secret in any `VITE_` variable.

Uploads first reserve a UUID, then send that exact ID with the file; submission stays blocked until attachment or cleanup finishes. Photo deletion first removes its reference and records a private reservation/tombstone, then destroys the Cloudinary asset and clears the pending reservation. Submission and draft deletion stay blocked while cleanup is pending; reopening the draft offers a retry. Previously removed image IDs cannot be reattached. Staff decisions are bound to the viewed record revision, and the decision form resets when that revision changes.

The isolated browser tests mock photo transport and map tiles while exercising actual Firebase Auth/Database emulators and rules. They do not prove live Cloudinary configuration. With a separate Auth emulator on port9098, set `AUTH_EMULATOR_PORT=9098` before running the local browser suite. The default remains9099. The frontend emulator connection can also use `VITE_AUTH_EMULATOR_URL` (loopback only).
