# Caniogan Re:Quest — Progress

## Implemented so far

- Responsive resident and staff layouts with Filipino/English language switching.
- Sign-up, sign-in, email verification, password reset and protected routes.
- Residency applications, corrections and staff approval, return or rejection.
- Community requests: create, save draft, review, submit, edit, cancel and delete eligible drafts.
- Staff request moderation and a searchable community board for approved requests.
- Optional map pins and device location; exact pins and meeting instructions stay private to the owner and authorized reviewer.
- Up to three request photos, with authorized upload/view/delete and retry handling for interrupted operations.
- Photo visibility choice: verified community residents or private until the selected volunteer accepts, with clear explanations. Fixed community photo access before acceptance.
- Database rules for ownership, roles and separate account/request reviewer permissions.
- Volunteer applications with private introductions and availability, requester selection, volunteer acceptance/decline, withdrawal and application history.
- One selected volunteer per request and one active assignment per resident; cancellation releases the assignment. Private meeting details unlock only after acceptance.

## What we use and how

| Tool | Current use |
| --- | --- |
| React + Vite | Application screens and local development/builds. |
| Native CSS + Public Sans | Responsive styling and typography; no Tailwind. |
| React Router | Page navigation and protected resident/staff routes. |
| Firebase Authentication | Accounts, sessions, verification emails and password resets. |
| Firebase Realtime Database | Account records, residency applications, requests and the public board. |
| Cloudinary | Authenticated storage and processing of request photos. |
| Cloudflare Worker + Wrangler | Checks photo access and handles signed Cloudinary operations without exposing the API secret. |
| Leaflet + React Leaflet + OpenStreetMap | Interactive maps, location selection and community request pins. |
| i18next + react-i18next | Filipino-first interface with authored English translations. |
| ESLint, Playwright and Firebase emulators | Local code checks, browser tests and permission tests. |
| GitHub, Figma, Excel and Google Docs | Version control, design reference, task tracking and shared project information. |

## Current checks and remaining work

- Latest verification: 43 database security checks, 55 model/localization/media checks and 6 request/volunteer browser scenarios passed. Earlier account browser checks also passed. Lint and production build passed; Filipino/English layouts inspected.
- User confirmed live request submission, staff approval, board/photo viewing, volunteer acceptance, private meeting access and single-volunteer selection. The latest photo visibility option/fix needs updated rules and Worker deployment before live testing.
- Messaging, two-way completion, points/leaderboards, document processing, events, notifications and reporting are upcoming workflows. Some related screens currently use fixture data.
