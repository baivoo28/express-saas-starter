# Express SaaS Starter

**Production-ready Express 5 + TypeScript + MongoDB API boilerplate** with JWT authentication, refresh token rotation, role-based access control, validation, logging, Docker and a full test suite.

Stop rewriting auth for every project. Clone, set two env vars, and start building your actual product.

```bash
git clone https://github.com/baivoo28/express-saas-starter.git
cd express-saas-starter
cp .env.example .env     # set JWT_ACCESS_SECRET
docker compose up -d mongo
npm install
npm run dev
```

## Features

- **Express 5 + TypeScript (strict)**, ESM, async errors handled natively
- **JWT access tokens** (short-lived) + **opaque refresh tokens** (stored hashed)
- **Refresh token rotation with reuse detection**: a replayed token revokes the whole session
- **Logout** and **logout from all devices**
- **Role-based access control** (`user`, `admin`) with `requireRole()` middleware
- **Zod validation** for bodies and query strings, with readable error details
- **Consistent JSON errors**: `{ "error": { "code", "message", "details?" } }`
- **Security defaults**: helmet, CORS, rate limiting on auth routes, bcrypt, constant-time-ish login (no email enumeration), body size limit
- **Structured logging** with pino (pretty in dev, JSON in prod, secrets redacted)
- **Repository pattern**: business logic never touches Mongoose directly, so it is testable and swappable
- **17 tests** (Vitest + Supertest) that run in ~1s with no database needed
- **Fail-fast env validation** with clear messages
- **Docker** multi-stage image + `docker compose` with MongoDB
- Graceful shutdown, `/health` endpoint, `make-admin` script

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account, returns tokens |
| POST | `/api/auth/login` | – | Returns `accessToken` + `refreshToken` |
| POST | `/api/auth/refresh` | – | Rotate refresh token, new access token |
| POST | `/api/auth/logout` | – | Revoke a session |
| POST | `/api/auth/logout-all` | Bearer | Revoke every session of the user |
| GET | `/api/users/me` | Bearer | Current user |
| PATCH | `/api/users/me` | Bearer | Update name |
| POST | `/api/users/me/password` | Bearer | Change password |
| GET | `/api/users?page=&limit=` | Admin | Paginated user list |
| GET | `/health` | – | Health check |

Example:

```bash
curl -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@example.com","password":"supersecret123","name":"Ana"}'
```

## Project structure

```
src/
  app.ts                 # builds the Express app from injected dependencies
  server.ts              # connects MongoDB, starts HTTP server
  config/env.ts          # zod-validated environment
  lib/                   # errors, logger, crypto helpers
  middleware/            # authenticate, requireRole, validate, error handler
  modules/
    auth/                # service, routes, schemas, token repos (mongo + memory)
    users/               # user repo interface, mongo + memory implementations, routes
tests/                   # Vitest + Supertest, runs against in-memory repos
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with hot reload |
| `npm test` | Run the test suite |
| `npm run build` / `npm start` | Compile and run production build |
| `npm run typecheck` | Type-check everything |
| `npm run make-admin -- you@example.com` | Promote a user to admin |

## ⭐ Express SaaS Starter Pro

Need the rest of the SaaS plumbing? **Pro** adds everything you would otherwise spend 2–3 weeks building:

- ✉️ **Email verification** and **password reset** flows (SMTP via Nodemailer, console mailer in dev)
- 💳 **Stripe subscriptions**: Checkout, Customer Portal, signed webhooks, `requirePlan('pro')` middleware
- 🔑 **API keys** per user (hashed, prefixed, revocable) for your customers' integrations
- 🛡️ **Admin API**: search users, change roles, disable accounts (kills their sessions)
- 📖 **OpenAPI 3 docs** with Swagger UI at `/docs`
- ⚙️ **GitHub Actions CI** (typecheck + tests + build) and **deploy guides** for Render, Railway and Fly.io
- 48 tests, lifetime updates

👉 **[Get Pro](https://baccino2.gumroad.com/l/express-saas-pro)**

## License

MIT
