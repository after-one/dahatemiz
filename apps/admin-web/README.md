# Admin Dashboard (Moderasyon ve Yönetim Paneli)

This dependency-light TypeScript app uses Firebase authentication; moderation endpoints enforce moderator and platform
administrator roles. The tab-scoped session token is cleared on sign-out.

Build and run locally:

```bash
pnpm --filter @dahamiz/admin-web build
pnpm --filter @dahamiz/admin-web start
```

The panel listens on `http://127.0.0.1:4173`. Configure the API URL and Firebase Web API key on the sign-in screen. For
local auth, use the Firebase Auth Emulator address and `demo-dahamiz` project. Set the API's `CORS_ORIGINS` to include
`http://localhost:4173` and `http://127.0.0.1:4173` (the browser origin must exactly match).

The panel provides report and community-content review queues, safe status decisions, city-matched institutional
forwarding and report unpublishing. The API audits review actions. Real institutional use still requires legal review
and approved account provisioning.
