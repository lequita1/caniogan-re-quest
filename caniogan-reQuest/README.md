# Caniogan Re:Quest

Responsive React/Vite web app using native CSS, React Router, Firebase Authentication/Realtime Database, Leaflet/OpenStreetMap and Cloudinary through a Cloudflare Worker.

## Run locally

Install Git and Node.js 22.12+ (or Node.js 24). From a new terminal:

```powershell
git clone https://github.com/lequita1/caniogan-re-quest.git
cd caniogan-re-quest/caniogan-reQuest
npm ci
Copy-Item .env.example .env.local
```

In `.env.local`, fill in the Firebase Web API key and app ID using the same project settings as the team. Keep the supplied project/database/media URLs and `VITE_USE_FIREBASE_EMULATORS=false`. Ask Luigi for the Firebase web configuration. Never place Cloudinary API secrets, Firebase admin credentials or Cloudflare tokens here.

```powershell
npm run dev
```

Open http://localhost:5174. The port is fixed because the media Worker permits specific origins. If that port is occupied, stop the previous development server. Use the same hostname consistently when signing in. Restart the server after changing environment values.

Cloning code does not copy accounts or assign staff permissions. Use your own Firebase account; Luigi provisions the required reviewer permissions. Firebase rules and the deployed media Worker remain shared services, so teammates do not need to deploy or create separate projects just to run the frontend.

## Shared commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact lockfile dependencies. |
| `npm run dev` | Start development on port 5174. |
| `npm run lint` | Check source code. |
| `npm run build` | Build the application into ignored `dist/`. |
| `npm run preview` | Preview the build; use `npm run preview -- --port 5174 --strictPort` for the existing media origin. |

Tests, local test tools, planning files and generated outputs are intentionally excluded from Git. They are not needed to run or build the app. Vite/ESLint remain development dependencies, and Wrangler remains for maintaining the media backend.

## Team branches

Run Git commands from the repository root or this app folder. Finish or commit current work before switching branches. Choose your own branch name; replace `YOUR-BRANCH-NAME` below.

```powershell
git switch main
git pull --ff-only origin main
git switch -c YOUR-BRANCH-NAME
```

Develop and check your work, then publish your branch:

```powershell
npm run lint
npm run build
git add .
git status
git commit -m "Describe your change"
git push -u origin YOUR-BRANCH-NAME
```

Open a GitHub pull request with **base: main** and **compare: your branch**. Have another member review it before merging. To bring newer main changes into an existing task branch, commit your current work first, then use `git fetch origin` and `git merge origin/main` while on that task branch. Resolve conflicts and rerun lint/build before pushing. Do not force-push main or copy one branch over another.

## Backend configuration

Keep `database.rules.json`, `firebase.json` and `workers/media/` in Git: they define the app's security and media service. Running the frontend does not publish them.

- Luigi publishes database rules in the existing Firebase project's Realtime Database console.
- Residency reviewers need `role: staff`, `standing: active`, verified email and `capabilities/reviewResidents: true` under `accounts/{uid}`. Request moderation uses the separate `reviewRequests: true` capability. Residents cannot grant themselves these permissions.
- Only the responsible maintainer deploys media changes: `npx wrangler deploy --config workers/media/wrangler.jsonc --keep-vars`. See [media setup](workers/media/README.md). Credentials remain in Cloudflare variables/secrets.
- Request photos stay authenticated. Visibility is selected in drafts: verified community residents, or private until the selected volunteer accepts. Exact meeting/location details stay restricted to requester, authorized staff and the accepted volunteer.

## Repository contents

Keep source, used assets, package manifests/lockfile, Vite/ESLint configuration, `.env.example`, database rules, Worker source/config and these setup guides. `.env.local`, dependencies, builds, tests, logs, `docs/`, `outputs/`, progress notes and local AI/memory files remain local.
