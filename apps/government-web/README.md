# Government Dashboard (Kurum Paneli)

This dependency-light TypeScript web app uses Firebase email/password authentication and organization membership
enforced by the API. Tokens live in tab-scoped session storage and are cleared on sign-out.

Build and run locally:

```bash
pnpm --filter @dahamiz/government-web build
pnpm --filter @dahamiz/government-web start
```

The panel listens on `http://127.0.0.1:4174`. Configure the API URL and Firebase Web API key on the sign-in screen. For
local auth, use the Firebase Auth Emulator address and `demo-dahamiz` project. Set the API's `CORS_ORIGINS` to include
`http://localhost:4174` and `http://127.0.0.1:4174` (the browser origin must exactly match).

The panel provides organization-scoped case lists/details, officer assignment, internal notes, carefully limited
reporter status messages and purpose-required, short-lived private evidence links. Sensitive actions are audited by the
API. Real institutional use still requires approved identity configuration, legal agreements and institutional approval.
