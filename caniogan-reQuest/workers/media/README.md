# Caniogan media Worker

Standalone Cloudflare Worker; not part of the Vite browser bundle. Source: `worker.js`. Signed image uploads are proxied so the server can enforce file size and never expose Cloudinary credentials or reusable signatures.

Setup status (2026-10-19): the initial upload-only version was deployed; the request-bound upload/read/delete lifecycle and additional MEDIA_LIMITER below are local changes awaiting rollout. Initial setup: allowed local origins and `UPLOAD_LIMITER` binding saved and verified in the dashboard. User supplied the three credential settings; the Cloudinary API secret was converted from Text to Secret without changing its value. Live health, preflight, origin rejection, missing-auth rejection and invalid-token rejection were checked. Actual image upload and Cloudinary credential/preset compatibility have not been exercised.

## Cloudflare configuration

Photo visibility update: optional private-record reads handle RTDB REST401 and403 denials, then perform a separate authorized board lookup. Private/unknown photo visibility on the board never permits delivery, even if stale image metadata is present. Legacy missing visibility retains community delivery; accepted volunteers still require a current inProgress assignment to access canonical task details. Release with the new database photoVisibility/projection rules. No credentials or public Cloudinary delivery modes are added.

### Diagnosing a Cloudinary rejection

`image_delete_failed` means the authenticated cleanup reached Cloudinary but deletion was not accepted. The Worker now emits `cloudinary_request_failed` with only operation, HTTP status and a fixed reason (`invalid_api_key`, `invalid_signature`, `stale_request`, or `unclassified`). Raw provider messages, API keys, signatures and private asset paths are never logged. This diagnostic is prepared locally; it requires deployment before a live retry produces the new log.

After deploying with `npx wrangler deploy --config workers/media/wrangler.jsonc --keep-vars`, start `npx wrangler tail caniogan-request-media --format pretty`, then retry removal from the resident app. Inspect only the structured diagnostic. An invalid key requires checking the API key for cloud `b2n0ms1f`; an invalid signature requires checking that the secret belongs to that same enabled key and has no extra quotes or spaces, then investigating signing if the pair matches. Enter credentials directly in the Worker settings; never paste the secret into chat. Do not clear the database cleanup reservation to bypass provider failure. Cloudinary's `not found` result already counts as successful idempotent cleanup.

Development origin fix (2026-10-19): the resident app runs at localhost:5173, while the deployed Worker allowed only port5174. Live DELETE preflight confirmed403 for localhost:5173 and204 for127.0.0.1:5174. The prepared configuration now supports both loopback hosts on ports5173 and5174. Run `npx wrangler deploy --config workers/media/wrangler.jsonc --keep-vars` from the app folder to apply it while preserving dashboard variables and secrets. Paths such as /resident/requests/... are not part of an origin. Successful deployment and private media operation still require verification.

Use the Workers Free plan. The existing Worker is named `caniogan-request-media`. Its deployment and configuration are separate from Firebase Hosting.

In the Worker **Settings → Variables and Secrets**, configure:

| Name | Type | Value |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | Text | Exact comma-separated app origins; locally `http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174` |
| `FIREBASE_WEB_API_KEY` | Secret | Firebase project's Web API key, same value as local `VITE_FIREBASE_API_KEY` |
| `CLOUDINARY_API_KEY` | Secret | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Secret | Cloudinary API secret; never enter in the React environment or share in chat |

Configure these native Cloudflare Rate Limiting bindings:

| Binding | Namespace | Limit | Period | Methods |
| --- | --- | --- | --- | --- |
| `UPLOAD_LIMITER` | `1001` | 10 | 60 seconds | POST uploads |
| `MEDIA_LIMITER` | `1002` | 100 | 60 seconds | GET reads and DELETE cleanup, in separate method buckets |

Each method uses an IP attempt bucket before Google authentication and a user bucket after current account authorization: `attempt:{METHOD}:{IP}` and `resident:{METHOD}:{uid}`. Reads cannot consume upload or deletion quota; failed/unauthorized requests still consume the method IP attempt quota. Cleanup keeps all owner, editable-parent and reservation checks even after the read quota is exhausted. Missing required credentials or the relevant method binding returns 503 (`uploads_not_configured` for POST; `media_not_configured` for GET/DELETE). A missing media binding does not disable correctly configured uploads.

The existing upload binding is recorded in `wrangler.jsonc`; the added media binding must be configured there or in the dashboard before deploying this revision. Verify namespaces are not used by unrelated services before reusing them. This source change does not deploy or configure bindings. Native limits apply per Cloudflare location, are approximate rather than globally strict, and are not a global billing quota. Separate buckets preserve cleanup availability without adding a new coordination service; users behind a shared IP still share its per-method attempt allowance.

Public, fixed configuration in source: cloud `b2n0ms1f`, signed preset `caniogan_request_images`, Firebase project `caniogan-request`, its Asia Southeast RTDB URL. No Admin SDK or service-account credential is required. Firebase API key restrictions must allow the server-side Auth REST lookup; review restrictions if lookup rejects legitimate tokens.

For local Worker tooling, copy `.dev.vars.example` to `.dev.vars`. Actual values and `.wrangler/` are ignored. Wrangler is installed as a development dependency for testing/deploying this backend; it is not shipped in the React bundle. Run `npx wrangler dev --config workers/media/wrangler.jsonc` from the app folder.

## API

- `GET /health`: minimal liveness only; does not establish upstream configuration.
- All image routes require an exact configured Origin and `Authorization: Bearer <Firebase ID token>`. Google validates the token; project/session claims and current verified email are checked. RTDB reads use that same user token under published rules, with no Admin credential.
- `POST /v1/request-images`: multipart with exactly `requestId`, reserved UUID `imageId`, and one `file`. Current active approved residents may upload to their own existing `draft` or `needsChanges` parent, with fewer than three attached photos. Before POST, `beginRequestImageUpload` must persist a client-generated UUID v4 as `pendingImageUpload`; rules block submission until attachment or reserved cleanup resolves it. The Worker requires that valid pending UUID to exactly match the submitted `imageId`, no pending deletion, and no attached image or tombstone at that UUID. A delayed POST for an earlier reservation cannot consume a later reservation. Missing or malformed multipart reservation IDs return 400; missing, mismatched or used persisted reservations return 403 `image_upload_not_reserved` before Cloudinary access. JPEG/PNG/WebP only; actual streamed body cap 5 MiB + 64 KiB, file cap 5 MiB. Cloudinary must decode the file successfully.
- The server derives `requests/{ownerUid}/{requestId}/{reservedUUID}` from the authorized parent and fixed owner, fixes `type=authenticated`, `overwrite=false`, allowed formats and `transformation=fl_force_strip`. The incoming transform removes Exif/IPTC/XMP before storage (Cloudinary preserves DigitalSourceType). Filename and arbitrary client transformation/path parameters are discarded or rejected. Response: `{imageId,publicId,format,bytes,width,height,version}` only, where `imageId` matches the reservation. The submitted UUID selects only the matching persisted reservation; arbitrary owner/request paths or transformation fields are rejected.
- `GET /v1/request-images/{requestId}/{imageId}`: returns image bytes with `Cache-Control: no-store`. Owner or active staff with explicit `reviewRequests` can read their authorized private record. Other authorized readers fall back to that one `requestBoard/{requestId}` open projection under its scoped rules; no private fields are used in this fallback. Captain and staff with only `reviewResidents` cannot read. Exact metadata path/format validation precedes Cloudinary access.
- Private downloads implement the official SDK's `private_download_url` algorithm: SHA-256 of sorted download parameters plus API secret, signed `/image/download` with `type=authenticated`, timestamp and 60-second expiry. The Worker fetches bytes itself; the signed URL is never returned to the browser. All upstream redirects are rejected.
- `DELETE` on the same item route: only the active approved owner of an editable parent can destroy the exact derived owner asset path. Before calling the Worker, the request service must atomically detach metadata, set the permanent `removedImages/{imageId}=true` tombstone, and set `pendingImageDeletion=imageId`. All three conditions are checked by the Worker; missing/mismatched reservation or still-attached metadata returns 403 `image_deletion_not_reserved`. Published rules must block submission, draft deletion and reattachment while cleanup is pending. This reservation also applies to unattached cleanup after attachment failure. Both `ok` and `not found` are idempotent success. After successful destruction, call `completeRequestImageDeletion` to clear only the pending marker; retain the tombstone. Review staff cannot delete.
- Client `uploadRequestImage(requestId, file, {signal, imageId})` validates and sends the exact reserved UUID. `src/features/requests/mediaService.js` uses `VITE_MEDIA_API_URL`, current Firebase bearer tokens and abort signals; it stores no token/blob. When Firebase emulators are enabled it permits only a loopback media URL, preventing accidental real uploads in tests. Configure a local URL and mock requests in E2E. `PrivateImage` creates temporary object URLs and revokes them when unmounted or its session/record changes.

The browser caller attaches returned metadata through request rules, completing the pending-upload reservation. If HTTP delivery fails or the page reloads, its known `pendingImageUpload` UUID remains recoverable from the private parent and can enter the same reserved-deletion cleanup flow. It must visibly retry failed cleanup and must not claim guaranteed orphan removal after an upstream timeout. Three attached photos are enforced by rules; simultaneous or abandoned uploads can create unattached assets and are additionally rate limited. This endpoint is for request photos, not identity documents. Local tests mock every external service. Source changes for this lifecycle are prepared locally; live Cloudinary credential/preset compatibility and real-image delivery remain unverified until an authorized live check.

The local-only tests are in ignored `tests/media-worker.test.mjs`; run `node --test tests/media-worker.test.mjs tests/media-client.test.mjs tests/media-runtime.test.mjs` from the app folder. They use stubbed upstream requests, not real accounts or uploads.

The additional ignored `tests/media-runtime.test.mjs` exercises the real local workerd engine through Miniflare. Quota isolation uses a test-only media limit of two and three reads to stay within one window under concurrent browser load; a separate assertion verifies production configuration remains 100 per 60 seconds. Run it alongside the service tests. Workers does not implement `redirect: 'error'`; upstream requests use `manual` and explicitly reject 3xx responses so credentials are never forwarded through a redirect.

References: [Firebase Auth REST](https://firebase.google.com/docs/reference/rest/auth#section-get-account-info), [Database REST authentication](https://firebase.google.com/docs/database/rest/auth), [Cloudinary signatures](https://cloudinary.com/documentation/authentication_signatures), [media access control](https://cloudinary.com/documentation/control_access_to_media), [Worker rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

Cloudinary references for incoming transformation and API download signing: [force_strip](https://cloudinary.com/documentation/transformation_reference#fl_force_strip), [private download API](https://cloudinary.com/documentation/image_upload_api_reference#private_download_url), [official SDK algorithm](https://github.com/cloudinary/cloudinary_npm/blob/master/lib/utils/index.js).
