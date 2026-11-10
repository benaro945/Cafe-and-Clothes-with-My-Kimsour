# Cloudflare deployment

## Deploy again from Windows PowerShell

Deployed successfully on October 16, 2026:
<https://cafe-and-clothes-with-my-kimsour.benaro945.workers.dev>.
Worker version: `91d4f78b-daa1-4d55-8957-c50d2eca704e`.
TypeScript checks, production build and deployment dry run passed. Live checks
confirmed the shop and owner pages, the catalog API (25 products), a browser
JavaScript asset, anonymous account handling and owner API access protection.
The existing D1 binding and owner-password secret were retained. Authenticated
owner login and a complete purchase were not exercised during this deployment.

Open a terminal in this project's root folder (the folder containing
`package.json` and `wrangler.jsonc`). On a new computer, install Node.js
24.18.0 and run `npm.cmd ci --include=dev --include=optional` first.

Check your Cloudflare login:

```powershell
npx.cmd wrangler whoami
```

If you are not signed in, run `npx.cmd wrangler login` and approve the login
in your browser. Use the account that owns the D1 database in `wrangler.jsonc`.

For each update, run these commands one at a time. Continue only when the
previous command succeeds:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run deploy:check
npm.cmd run deploy
```

`typecheck` checks TypeScript, `build` generates the Worker and browser assets,
and `deploy:check` previews the upload without publishing. `deploy` publishes
the build and prints the live URL. Open that URL and check the shop and `/owner`.
Always build after changing application code; deployment uses the existing
`dist/server/wrangler.json` build output.

The `.cmd` suffix works with this computer's PowerShell script restrictions;
you do not need to change the execution policy. This direct deployment does
not require GitHub. Keep the existing Worker name and D1 database identifiers
to update the same site with its existing data. Database migrations and owner
password setup are separate tasks described below; routine deployments do
not require resetting either.

## Telegram order notifications

Create a bot with Telegram's `@BotFather`, start a chat with that bot (or add it
to the private group where alerts should go), and obtain the target chat ID.
Configure both values as Cloudflare Worker secrets:

```powershell
npx.cmd wrangler secret put TELEGRAM_BOT_TOKEN
npx.cmd wrangler secret put TELEGRAM_CHAT_ID
```

Wrangler prompts for each value. For local development, edit the ignored
`.dev.vars` file in the project root and replace the example values:

```dotenv
TELEGRAM_BOT_TOKEN=your_bot_token_from_BotFather
TELEGRAM_CHAT_ID=your_numeric_chat_id
```

Never put the bot token in browser code or commit `.dev.vars`. Local values do
not configure the hosted Worker; set the two Cloudflare secrets above for the
live site. After deployment, new orders send the customer, items, pickup or
delivery details, payment method and total to Telegram. Delivery alerts include
the phone, address, map link and delivery notes. When a customer submits a
KHQR payment proof, Telegram receives a follow-up order summary and the receipt
image; bank payments remain subject to the owner's manual review.

This root project uses React 19, TypeScript, Tailwind CSS 4 and Vinext, which
implements Next.js-style App Router APIs on Vite. The Cloudflare Vite plugin
builds the server for Workers. `next.config.ts` is framework configuration;
its presence does not mean this project should run `next build`. The separate
`python/` directory contains a Flask course version and is not the Worker entry.

## Fix "Failed: error occurred while installing tools or dependencies"

The supplied Workers build log confirms a package-manager mismatch:

```text
Installing project dependencies: pnpm install --frozen-lockfile
This project is configured to use npm because /opt/buildhome/repo/package.json has a "packageManager" field
```

Cloudflare selected pnpm for automatic installation, while `package.json`
declares `"packageManager": "npm@11.16.0"`. pnpm refuses to install an npm project
and exits before the build command runs. Node 24.18.0 was detected successfully;
the reported failure is not a Node version error.

This source includes both `package-lock.json` and the original `pnpm-lock.yaml`.
Use the explicit npm installation below so the deployment uses the npm lockfile
and does not depend on automatic package-manager selection or the Sites-specific
pnpm workspace settings. Keep the npm declaration and npm lockfile together.

For a **Workers** project, open **Settings > Build > Build Variables and Secrets**
and add these build variables (runtime variables do not control installation):

```text
SKIP_DEPENDENCY_INSTALL=true
NODE_VERSION=24.18.0
```

Save the build command as:

```sh
npm ci --include=dev --include=optional && npm run typecheck && npm run build
```

Save the deploy command as `npm run deploy`. Confirm the selected root directory
contains `package.json`, `package-lock.json`, `vite.config.ts`, `scripts/` and
`build/`, then retry the deployment from the updated commit. The skip variable
must be set in the dashboard: putting an install command in the build command
alone cannot fix an automatic install that fails before the build command runs.
The next log should skip `pnpm install --frozen-lockfile` and proceed to the
custom build command. If that pnpm line still appears, the skip variable is not
active for the Worker/build being retried; check the saved build variables.

Cloudflare documents these build variables in its
[Workers build image guide](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/).
This application builds a Worker with server routes and D1, so use Workers rather
than a static Pages upload.

If installation still fails, retain the first `npm error`, `ERR_PNPM_*`, or
tool-download error and its surrounding lines. Do not regenerate lockfiles or
use `--force` based only on the final summary.

Local npm lockfile validation on October 14, 2026 passed with Node 24.18.0 and
npm 11.16.0 using `npm ci --dry-run --ignore-scripts --include=dev --include=optional`.
This checks npm's installation plan; it does not verify fresh package downloads,
dependency install scripts, or Cloudflare's Linux build environment.

## Earlier missing build-runner failure

The previous `build` command ran `node scripts/run-framework.mjs build`.
Cloudflare's checkout did not have that file at the expected path. The file
exists in this local source folder, and `.gitignore` does not exclude `scripts/`.
This folder has no `.git` directory, so the failing commit, Git tracking and
Cloudflare's selected repository/root cannot be verified locally. Check those
settings before redeploying; a partial upload can also omit the build's other
source dependencies.

`npm run build` now invokes `vite build` directly, using the existing Vinext and
Cloudflare plugins. The custom runner remains available for local development
and the original Sites tooling. No framework migration or UI redesign is needed.
Leaflet CSS is imported through the layout so Vite can resolve its image assets
before Tailwind processes the site's styles. Deployment commands reuse the
existing environment helper to keep tool logs/state in the project directory.

## Build and deployment settings

Use a **Cloudflare Worker with static assets**, connected to the complete Git
repository. This application needs API routes, D1 and server-side owner checks;
uploading `dist/client` to a static Pages project does not deploy those features.

| Setting | Value |
| --- | --- |
| Worker name | `cafe-and-clothes-with-my-kimsour` |
| Root directory | Directory containing this `package.json` and `vite.config.ts` |
| Node | `24.18.0` (also recorded in `.nvmrc`) |
| Build variable | `SKIP_DEPENDENCY_INSTALL=true` |
| Build command | `npm ci --include=dev --include=optional && npm run typecheck && npm run build` |
| Production deploy command | `npm run deploy` |
| Configuration for deployment | Generated `dist/server/wrangler.json` |
| Client assets | `dist/client`, attached automatically by the Vite plugin |
| Pages output directory | Not applicable to this Worker deployment |

The explicit npm install command makes the committed `package-lock.json`
authoritative, even though the original pnpm lock and helper scripts are retained.
Do not omit dev dependencies: Vite, Vinext and the Cloudflare adapter live there.
For preview branches, use the version/preview upload command supported by your
Cloudflare dashboard with `--config dist/server/wrangler.json`; do not use the
production deploy command for previews.

`wrangler.jsonc` is the source configuration. Vite generates the deployment
configuration, including the bundled Worker entry and asset directory. Do not
edit or commit `dist/` or `.wrangler/`.

## Required production bindings and authentication

1. `wrangler.jsonc` binds `DB` to the existing D1 database supplied by the owner:
   `be_naro_and_kimsour168` (`61a038c8-7d75-45c7-932b-5ac0ddcdb804`).
   These are identifiers, not passwords. Keep the binding name `DB`.
   Reusing the existing database preserves shop data. Confirm that the target
   Worker is in the Cloudflare account that owns this database.
2. For a new, empty D1 database, apply the schema before serving customers:

   ```sh
   npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc
   ```

   For an existing database, inspect its migration history/schema first. The
   original Sites platform may already have created `shop_state`; do not apply
   its initial CREATE TABLE migration blindly to an existing populated database.
   Uploads and location-cache tables are created by their existing API code.
3. Apply `0001_shop_accounts.sql` to add customer, session, chat and inbox tables.
   It adds tables and indexes without changing existing products or orders:

   ```powershell
   npx.cmd wrangler d1 migrations apply DB --remote --config wrangler.jsonc
   ```

   Chat photo and voice attachments also require migration `0002_chat_attachments.sql`.
   The command above applies any pending migration, including this one.

4. Owner Studio now uses a normal password login. After publishing, set the
   owner password in an interactive terminal from this project's root:

   ```powershell
   npm.cmd run owner:setup
   ```

   Enter and confirm your password; 12 or more characters are recommended. Input is hidden. The
   helper hashes the password and sends only its salted hash through stdin to
   Wrangler's `OWNER_PASSWORD_HASH` secret. No password is put in source code,
   a shell command, or a file. Changing the password invalidates existing owner
   sessions. Open `/owner` or choose Owner studio, then use this password.
   `OWNER_EMAIL` and ChatGPT identity headers no longer grant owner access.
   There is no required R2 binding; uploads still use D1.

Customers use email/phone and password registration at `/api/account/register`.
Their accounts, private chats and notifications are persistent in D1; orders and
birthday gift reservations commit together through the existing shop revision
check. Customers can see only their own orders and conversations. Owner sessions
last 12 hours, customer sessions 14 days, and logout revokes the session. Password
changes invalidate other customer sessions. All owner reads, mutations and private
upload access validate the server session; headers supplied by visitors cannot
grant owner privileges. Login and registration are rate limited.

The Flask and hosted versions keep separate accounts and data. Existing local
Python accounts are not automatically copied to D1. For local Worker development,
apply the migrations with `--local`. An ignored `.dev.vars` file may contain an
`OWNER_PASSWORD_HASH` generated by the same password helper; never use a production
password in a test fixture or commit runtime credentials.

## Local verification

```sh
npm install
npm run typecheck
npm run build
npm run deploy:check
```

On Windows PowerShell with restricted script execution, use `npm.cmd` and
`npx.cmd` instead of the `.ps1` wrappers. No execution-policy change is needed.
`deploy:check` is a dry run; it does not publish the site or validate a real D1
database or the production identity proxy.

Verified locally on October 14, 2026 with Node 24.18.0 and npm 11.16.0:
dependency installation, strict TypeScript checking, all five production build
stages, and Wrangler's deployment dry run completed with exit code 0. The dry
run included 52 asset files and approximately 409 KiB of gzipped Worker modules.
Leaflet image URLs now resolve to embedded PNG assets. Remaining Vinext warnings
concern dynamic imports/chunk splitting and do not prevent the build. Live
deployment, production D1 and owner login are not verified.

The later account update was deployed and verified live on October 14, 2026:
customer registration, login, account lookup and logout; owner password login,
customer directory and logout; rejection of spoofed identity headers; and the
24-product catalog. The temporary validation account and its sessions were
removed. Headless Edge checks passed at 1366×900 and 390×844 for customer forms,
owner login/logout, product images and page overflow, with no browser errors.
The isolated hosted account, COD and bank-receipt suites and TypeScript checks
also passed. The owner's password is configured as a Cloudflare secret; its
value is not recorded here.

## Commit, push and redeploy

This supplied source folder is not a Git checkout. Use the GitHub repository
connected to Cloudflare (clone it first if necessary), copy these changes and
the complete source into its correct root, and run:

```sh
git status --short
git check-ignore scripts/run-framework.mjs scripts/execution-profile.mjs build/sites-worker.ts .openai/hosting.json wrangler.jsonc
git add .
git diff --cached --stat
git ls-files --error-unmatch package.json package-lock.json vite.config.ts wrangler.jsonc scripts/run-framework.mjs scripts/execution-profile.mjs scripts/sites-env.mjs scripts/install-ci.mjs scripts/npm-install.mjs build/sites-worker.ts build/sites-vite-plugin.ts build/connector-preview-plugin.mjs .openai/hosting.json vendor/shadcn-tailwind-4.13.0.css
git commit -m "Fix Vinext Cloudflare build and deployment configuration"
git push
```

`git check-ignore` should print nothing for required source files (exit code 1
means none matched); `git ls-files --error-unmatch` must succeed after staging.
Review staged files before committing; `.env*`, `.dev.vars*`, local databases,
dependencies and build output are ignored. The entire `app/`, `components/`,
`hooks/`, `lib/`, `build/`, `scripts/`, `public/`, `vendor/`, `drizzle/` and
`.openai/hosting.json` source must be present, along with root configuration.
An empty GitHub repository additionally needs a remote and first push; do not
replace an existing repository's history merely to publish this exported folder.

Update the Worker build settings above and trigger a new deployment from the
pushed commit. Confirm the log runs `vite build`, bundles the server and client,
then deploys the generated Worker configuration. Finally check browsing,
checkout, uploads and Owner Studio against the production bindings/proxy.
