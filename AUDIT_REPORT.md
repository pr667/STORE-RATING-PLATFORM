# Store Rating Platform Audit Report

**Date:** 2026-10-29
**Project:** `Store-Rating-Platform`

## Step 2: Build and run results

### Backend dependency install

Command: `npm.cmd install` (PowerShell blocks the `npm` shim under the current execution policy.)

```text
up to date, audited 135 packages in 1s
19 packages are looking for funding
found 0 vulnerabilities
```

### Backend start

Command: `npm.cmd start` on the requested port 5001.

```text
> store-rating-app@1.0.0 start
> node server.js

Connected to PostgreSQL database
Error: listen EADDRINUSE: address already in use :::5001
```

Port 5001 was already occupied by a running server, so I did not stop an unknown process. The edited backend was started with `PORT=5002 npm start`:

```text
> store-rating-app@1.0.0 start
> node server.js

Connected to PostgreSQL database
Server is running on port 5002
```

The smoke suite below exercised this edited server on port 5002.

### Database initialization

`node scripts/init-db.js` was run twice. First run:

```text
Starting database initialization...
Connected to PostgreSQL database
Database tables created successfully
Admin user already exists
Sample data already exists
Database initialization completed successfully!

Database setup complete! You can now start the server.
```

Second run:

```text
Starting database initialization...
Connected to PostgreSQL database
Database tables created successfully
Admin user already exists
Sample data already exists
Database initialization completed successfully!

Database setup complete! You can now start the server.
```

The second run created no sample rows. It also reported the existing admin account.

### Frontend type check

Command: `npx.cmd tsc --noEmit` from `client/`.

```text
(no output; exit code 0)
```

### Frontend production build

Command: `npm.cmd run build` from `client/`.

```text
> client@0.0.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 999 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                              0.45 kB │ gzip:   0.29 kB
dist/assets/roboto-vietnamese-400-normal-Bf76hAzZ.woff       6.08 kB
dist/assets/roboto-vietnamese-700-normal-kpkdMgbf.woff       6.10 kB
dist/assets/roboto-vietnamese-300-normal-CYjuQheQ.woff       6.12 kB
dist/assets/roboto-vietnamese-500-normal-BgoYVz-9.woff       6.13 kB
dist/assets/roboto-greek-400-normal-D904r64h.woff            7.42 kB
dist/assets/roboto-greek-300-normal-xS8CB6LN.woff             7.44 kB
dist/assets/roboto-greek-700-normal-xQsEWSIA.woff             7.45 kB
dist/assets/roboto-greek-500-normal-XBIQOowA.woff             7.47 kB
dist/assets/roboto-vietnamese-400-normal-D2PTxGxD.woff2       8.36 kB
dist/assets/roboto-vietnamese-300-normal-BPvXm_f1.woff2       8.37 kB
dist/assets/roboto-vietnamese-700-normal-BEVeWqJt.woff2       8.41 kB
dist/assets/roboto-vietnamese-500-normal-B3ncpOoB.woff2       8.54 kB
dist/assets/roboto-symbols-500-normal-DFnofPUt.woff          8.73 kB
dist/assets/roboto-symbols-400-normal-C7tGlxgb.woff           8.75 kB
dist/assets/roboto-symbols-700-normal-C59U6HqI.woff           8.77 kB
dist/assets/roboto-symbols-300-normal-CBIeSvs3.woff           8.83 kB
dist/assets/roboto-greek-300-normal-DJEM9B4Z.woff2           9.50 kB
dist/assets/roboto-greek-400-normal-ai2Z1K3C.woff2           9.55 kB
dist/assets/roboto-greek-500-normal-C9AnhcmC.woff2           9.61 kB
dist/assets/roboto-greek-700-normal-0aHWxGLu.woff2           9.63 kB
dist/assets/roboto-cyrillic-400-normal-BepgbcUK.woff         10.20 kB
dist/assets/roboto-cyrillic-300-normal-D0x1uCa7.woff         10.26 kB
dist/assets/roboto-cyrillic-500-normal-C8ZOEKN4.woff         10.39 kB
dist/assets/roboto-cyrillic-700-normal-D8g9KsRf.woff         10.39 kB
dist/assets/roboto-symbols-300-normal-DDU7avhj.woff2         10.70 kB
dist/assets/roboto-symbols-400-normal-CB1Ce4Gk.woff2         10.73 kB
dist/assets/roboto-symbols-500-normal-B_CZKVJS.woff2         10.83 kB
dist/assets/roboto-symbols-700-normal-BiFDindJ.woff2         10.86 kB
dist/assets/roboto-cyrillic-400-normal-CBPI_iaY.woff2        12.10 kB
dist/assets/roboto-cyrillic-300-normal-DzUz0kzv.woff2        12.26 kB
dist/assets/roboto-cyrillic-500-normal-CLao9AfR.woff2        12.35 kB
dist/assets/roboto-cyrillic-700-normal-C2o7G-SM.woff2        12.41 kB
dist/assets/roboto-latin-ext-400-normal-CIveymTr.woff        13.83 kB
dist/assets/roboto-latin-ext-700-normal-BDePAh3g.woff        13.83 kB
dist/assets/roboto-latin-ext-500-normal-C1cK9xmS.woff        13.91 kB
dist/assets/roboto-latin-ext-300-normal-B0-sTZUp.woff        13.95 kB
dist/assets/roboto-latin-ext-300-normal-B90pq-BC.woff2       15.01 kB
dist/assets/roboto-latin-ext-400-normal-C3tdtHj3.woff2       15.04 kB
dist/assets/roboto-latin-ext-500-normal-pMCM9Ixg.woff2       15.16 kB
dist/assets/roboto-latin-ext-700-normal-DSBUz0N1.woff2       15.19 kB
dist/assets/roboto-cyrillic-ext-300-normal-C0UYUNTV.woff    15.95 kB
dist/assets/roboto-cyrillic-ext-400-normal-DhDk0Xwi.woff    15.95 kB
dist/assets/roboto-cyrillic-ext-500-normal-SCgicl0l.woff    16.09 kB
dist/assets/roboto-cyrillic-ext-700-normal-BWOtdzfy.woff    16.09 kB
dist/assets/roboto-cyrillic-ext-400-normal-qHufge6k.woff2    17.37 kB
dist/assets/roboto-cyrillic-ext-300-normal-DIxttMbC.woff2    17.49 kB
dist/assets/roboto-cyrillic-ext-500-normal-BWC_xYeb.woff2    17.59 kB
dist/assets/roboto-cyrillic-ext-700-normal-DmFxo5wj.woff2    17.62 kB
dist/assets/roboto-math-400-normal-D6sS4O5l.woff             18.76 kB
dist/assets/roboto-math-500-normal-BNGXE_xU.woff             18.84 kB
dist/assets/roboto-math-700-normal-DbhUef31.woff             18.89 kB
dist/assets/roboto-math-300-normal-CkwMvXpj.woff             18.94 kB
dist/assets/roboto-math-400-normal-BEFej5gc.woff2            20.08 kB
dist/assets/roboto-math-300-normal-5dF_7mZP.woff2            20.09 kB
dist/assets/roboto-math-500-normal-C4NU9gLX.woff2            20.30 kB
dist/assets/roboto-math-700-normal-B8YqGHVc.woff2            20.39 kB
dist/assets/roboto-latin-400-normal-D27F5sTu.woff             21.06 kB
dist/assets/roboto-latin-500-normal-fsTFPL3E.woff             21.16 kB
dist/assets/roboto-latin-700-normal-YuyVweIx.woff             21.21 kB
dist/assets/roboto-latin-300-normal-Dqn3NW0Y.woff             21.35 kB
dist/assets/roboto-latin-400-normal-BqEyEoaF.woff2            21.88 kB
dist/assets/roboto-latin-300-normal-CCzlftfr.woff2            22.07 kB
dist/assets/roboto-latin-500-normal-7RbcRiD8.woff2            22.20 kB
dist/assets/roboto-latin-700-normal-BZpUvMxY.woff2            22.24 kB
dist/assets/index-BsxGTdsB.css                               46.53 kB │ gzip:  21.94 kB
dist/assets/index-a8ARQqxs.js                               744.64 kB │ gzip: 232.76 kB

[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Using build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.24s
```

The build passes. Vite reports one large JavaScript chunk warning (744.64 kB before gzip).

### Lint

Command: `npm.cmd run lint` from `client/`.

```text
> client@0.0.0 lint
> eslint .

(no errors; exit code 0)
```

## Step 3: Smoke tests

Command: `node scripts/smoke-test.js` with the edited backend on port 5002. Every check creates temporary data and cleans it up.

| Case | Result |
|---|---|
| Auth: register rejects names under 20 characters | PASS |
| Auth: register rejects a weak password | PASS |
| Auth: register creates a user with a valid name | PASS |
| Auth: duplicate email is rejected | PASS |
| Auth: valid login returns token and user; bad password is 401 | PASS |
| Auth: profile accepts a token and rejects no token | PASS |
| Auth: token verification succeeds | PASS |
| Auth: wrong and correct current password handling | PASS |
| Users: admin list succeeds; normal, owner, and anonymous access are denied | PASS |
| Users: admin can read any user; normal user can read only self | PASS |
| Users: admin update accepts uppercase role and rejects lowercase role | PASS |
| Users: delete self returns 400 and another user can be deleted | PASS |
| Users: dashboard stats are admin-only | PASS |
| Admin: dashboard and create-user validation | PASS |
| Admin: filters and ascending/descending sort work | PASS |
| Stores: list is available to all roles and owners see only their store | PASS |
| Stores: owner store route and no-store 404 | PASS |
| Stores: create validation, wrong owner role, and admin create | PASS |
| Stores: owner ratings route paginates and sorts | PASS |
| Stores: details return 200 and missing ids return 404 | PASS |
| Stores: admin and owner update; other owner and normal user are denied | PASS |
| Stores: store ratings are limited to admin and owning owner | PASS |
| Ratings: insert, duplicate, bounds, and missing store | PASS |
| Ratings: update, missing update, and delete | PASS |
| Ratings: my ratings, store ratings, user ratings, and stats authorization | PASS |
| Ratings: trigger keeps aggregate values correct on insert, update, and delete | PASS |
| Database: owner_id is unique and owner deletion sets owner_id NULL | PASS |
| Stores: only admin can delete stores; store deletion cascades ratings | PASS |
| Authorization: protected route matrix rejects requests without a token | PASS |
| Admin dashboard totals match database counts | PASS |
| Database: deleting store cascades its ratings | PASS |
| Database: owner_id has a unique index | PASS |
| Database: all existing user names meet the 20-character minimum | PASS |

**Result: 33 PASS, 0 FAIL.**

## Step 4: Functional walkthrough

No browser automation or interactive browser tool was available in this session. The following are API-tested where stated; browser-only interactions remain unverified.

### System administrator

- [x] Dashboard endpoint returns total users, stores, and ratings matching direct database counts.
- [x] User/store list filters and ascending/descending API sorting work.
- [x] Create, edit, and delete API paths and role validation work.
- [x] Read-only details endpoint returns name, email, address, role, created date, and owner store/rating; the dialog compiles.
- [ ] Browser rendering, edit/delete confirmation flows, and logout interaction not manually walked through.

### Store owner

- [x] Owner sees only their own store; no-store owner receives 404.
- [x] Owner ratings pagination and rating sort tested; ownership gates tested.
- [ ] Browser password-change form and logout interaction not manually walked through.

### Normal user

- [x] Registration, login, password change, store search API, rating create/edit/delete, and aggregate updates tested.
- [x] My Ratings sort API and frontend controls compile.
- [ ] Browser signup redirect, search controls, apostrophe display, and logout interaction not manually walked through.

### Access control

- [x] API rejects wrong-role requests in the smoke suite. Frontend `ProtectedRoute` contains role redirects and compiles.
- [ ] Direct URL redirects and visual display of apostrophe names not manually confirmed in a browser.

## Step 5: Bugs found and fixes

| File(s) and line(s) | Cause | Fix |
|---|---|---|
| `middleware/validation.js:16–20, 128–134`; `config/database.js:31, 71–76`; `client/src/pages/Register.tsx:17`; `client/src/components/admin/UserDialog.tsx:19` | User names accepted at 3 characters in user validation, database constraint, and forms. | Set minimum to 20, trim before checking, and migrate existing databases to the same constraint. |
| `config/database.js:71–76` | Two existing database names were 8 characters and would fail the new constraint. | Migration appends ` (legacy account)` (truncating only if needed) before adding the check. No user name defined in `scripts/init-db.js` is below 20; `.env` admin name length is 20. |
| `routes/users.js:120–143`; `client/src/pages/admin/AdminUsers.tsx:130–139, 284–305` | Admin user management had no read-only details view. | Added details fields to the protected endpoint and a read-only dialog including owner store name and average rating. |
| `config/database.js:89–111` | Existing database used owner deletion cascade and lacked a migrated unique owner index. | Migration changes owner deletion to `SET NULL` and ensures `owner_id` has a unique index. |
| `routes/ratings.js:316–334` | `/api/ratings/stats` aggregate query omitted its `FROM ratings` clause and returned 500. | Added the missing relation; stats route is covered by smoke tests. |
| `server.js:15, 60–72` | Default backend port was 5000 instead of 5001. | Changed the default to 5001 and made startup verify the database connection before listening. |
| `server.js:18–19, 25–28, 54–57` | Development error responses included stack traces; production accepted the placeholder JWT secret. | Return a generic client error, validate production JWT secret length/content, and use a tighter production request limit. |
| `scripts/init-db.js:49, 187–192` | Seed credentials were printed to console, and demo users could be inserted into production. | Removed password output and disabled sample-data creation in production. |
| `client/src/pages/Stores.tsx:128–136`; `client/src/pages/MyRatings.tsx:57–92`; `client/src/pages/admin/AdminUsers.tsx:106–111, 201–204`; `client/src/pages/admin/AdminStores.tsx:86–91, 148–152` | Address columns and My Ratings lacked sorting controls. | Added sort controls aligned with existing whitelisted API fields. |
| `client/src/pages/Stores.tsx:47–48`; `client/src/pages/MyRatings.tsx:32–33`; `client/src/pages/admin/AdminUsers.tsx:71–72`; `client/src/pages/admin/AdminStores.tsx:51–52`; `client/src/pages/owner/OwnerStore.tsx:61–62` | ESLint flagged fetch loading-state updates as synchronous effect state updates. | Kept these fetch lifecycle updates and documented narrow rule suppressions. Lint now passes. |

## Remaining items and security recommendations

- The interactive browser walkthrough could not be performed because no browser tool was available. A user should run the UI at `localhost:3000` for visual confirmation.
- `npm start` could not bind the configured 5001 port because another process already owns it. The modified backend connected to PostgreSQL and ran on port 5002 for smoke testing.
- Vite's production output has a 744.64 kB JavaScript chunk warning. Consider route-level lazy loading if bundle size matters.
- `.env` is listed in `.gitignore`, and `node_modules/` is also ignored; however, `.env` is already tracked by Git. Ignore rules do not remove tracked files. Rotate the database credential and any other secrets stored there, untrack the file, and remove it from repository history before sharing the repository.
- The current development JWT secret is a placeholder. Production startup now rejects placeholders and secrets shorter than 32 characters; set a fresh secret before deployment.
- The database migration updated two pre-existing short user names by appending a neutral suffix so the required constraint could be enforced. Names declared in the seed script and the configured admin name already meet the requirement.
