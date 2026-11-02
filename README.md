# The Wellbourne Clinic — monthly SEO report

Interactive October 2026 report, with separate Work completed, Enquiries, Search performance, Keywords & local search, Backlinks, AI search, Technical health, Next month and Grace pages. The repository contains the presentation snapshot and application only; it does not connect to Google, WordPress or DataForSEO at runtime.

## Deploy on Vercel

1. Import `jameswilliamgriffin-spec/wellbourneseo` into Vercel.
2. Root directory: repository root. Framework preset: **Other**. Node.js: **24.x**. The tracked `vercel.json` supplies `npm ci` and `npm run build:vercel`.
3. Add the private environment variable **REPORT_ACCESS_CONFIG** for Production and Preview before deploying. Its value is a JSON object containing `salt`, `hash` and `sessionSecret`. Use the locally prepared value provided to the project owner; never commit it or add a `VITE_` prefix.
4. Deploy. Check an anonymous browser: a report deep link, a JavaScript asset and a download must all show the password page. Enter the agreed report password, check the report, then use **Log out**.

The build uses Vercel's [Build Output API](https://vercel.com/docs/build-output-api). Every route goes through one Node function; report files are bundled privately inside it. There is no public static copy to bypass the password gate. Missing or invalid access configuration returns 503 without report content.

Sessions are signed, valid for eight hours and shared across serverless instances. Cookies are HttpOnly, SameSite=Strict and Secure on Vercel. Logout clears the browser cookie; there is no central session database, so a copied cookie remains valid until expiry. Rotate `sessionSecret` and redeploy to invalidate all sessions. Failed-password throttling is per warm instance; it is not a distributed firewall. This is a basic shared-password report, not individual user accounts.

Do not replace this with a plain static deployment of `dist/`; that would omit the server gate. Never put the access configuration, Google tokens, API keys or raw clinic records into this repository.

## Development

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5183/reports/2026-10/overview. Local development and `npm run preview` require an ignored `.report-access.json` containing a salted scrypt password hash. The local project owner already has this file. Local sessions clear on restart.

```sh
npm test              # self-contained access, deployment and report checks
npm run typecheck
npm run build:vercel  # checks, Vite build, protected Vercel package
```

No credentials are needed to build. Access is configured at runtime in Vercel.

## Monthly updates and evidence

`src/data/report.json` is a saved aggregate reporting snapshot. Refreshes are prepared in the separate local SEO working folder, where source extracts, approval records and activity logs remain. Copy the reviewed snapshot and approved downloads into this app, run the checks and commit the update. The local-only `npm run data` and `npm run test:audit` scripts require that working folder and are not deployment steps.

Keep periods, source dates, unavailable values and limitations intact. October enquiries are unavailable; Business Profile October coverage is partial. Keyword, backlink and AI baselines do not have invented historical movement. AI answers are retained as sampled evidence, with clinical claims flagged for review.
