# Tongston T-Cell — Backend API

Express + Mongoose API for the Tongston T-Cell product: content creation, AI summarization, and a tokenized rewards ledger (mock Web3 economy).

> This is the backend half of the monorepo. For the full picture — architecture, the 5 production considerations, data models, and the React UI — see the [root README](../README.md).

## Stack

Node 20+ · Express 4 · TypeScript (strict) · Mongoose 8 · Zod · Pino · Jest · `multer` · Cloudinary · AWS SDK v3

## Quick start

```bash
# from the repo root
npm install
cp backend/.env.example backend/.env   # then fill in MONGO_URI + JWT_SECRET
npm run seed                            # admin@test.com / admin123, user@test.com / user123
npm run dev --workspace=backend         # http://localhost:3000
```

`MONGO_URI` **must** point at a replica set (MongoDB Atlas M0 is the easiest). A standalone `mongod` cannot run multi-document transactions, and every token mutation depends on them. See *Production Consideration 1* in the root README.

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | ✅ | Atlas connection string — **must** be a replica set |
| `JWT_SECRET` | ✅ | Signs and verifies access tokens (24h expiry) |
| `PORT` | — | Defaults to `3000` |
| `CORS_ORIGIN` | — | Defaults to `*`; set to the frontend origin in production |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | — | Enables real media upload; mock storage is used otherwise |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` | — | Enables real S3 promotion; mock settlement is used otherwise |
| `AI_API_KEY` | — | Real key switches `getProvider()` to `OpenAIProvider`; mock otherwise |

Placeholder values (`your_…`, `optional_…`, `changeme`, …) are detected by `isUsableCredential()` and treated as absent, so a half-configured `.env` degrades to the mock provider instead of failing at request time.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev --workspace=backend` | `tsx watch src/server.ts` — hot reload |
| `npm run build --workspace=backend` | `tsc` → `dist/` |
| `npm start --workspace=backend` | `node dist/server.js` |
| `npm run lint --workspace=backend` | ESLint (flat config shared with the root) |
| `npm test --workspace=backend` | Jest — token ledger guarantees |
| `npm run seed --workspace=backend` | Creates the two demo users (bcrypt-hashed) |

## Module map

```text
src/
├── app.ts                    express app: helmet, cors, json, logger, routes, error handlers
├── server.ts                 entrypoint — connectDB() then listen()
├── config/                   env (validated), db (replica-set warning), logger (pino)
├── routes/                   /auth /content /ai /tokens /media mounted under /api/v1
├── controllers/              request → Zod parse → service → response envelope
├── middleware/               authenticate (JWT) · authorize (RBAC) · validate · rateLimit
│                             idempotency · requestLogger · errorHandler
├── services/
│   ├── ai/ai.service.ts      PENDING → provider (8s timeout) → settlement transaction
│   ├── ai/provider.ts        AIProvider interface · MockAIProvider · OpenAIProvider · getProvider()
│   ├── token.service.ts      balance · history · convert · withdraw (all transactional)
│   ├── storage.service.ts    StorageProvider interface · Cloudinary · S3 · Mock
│   └── idempotency.service.ts  atomic key claim + stored response replay
├── models/                   7 Mongoose schemas, explicit indexes, timestamps
├── schemas/common.schema.ts  shared Zod schemas (bodies, queries, ObjectId params)
└── utils/                    errors · response envelope · crypto · asyncHandler · credentials
```

## API

Base path `/api/v1`. Every response uses one envelope:

```json
{ "success": true, "data": { }, "error": { "code": "CONFLICT", "message": "Insufficient tokens. You have 4, tried 10" } }
```

| Endpoint | Method | Body / Query | Auth | Rate limit |
|---|---|---|---|---|
| `/health` | GET | — | — | general (IP) |
| `/auth/register` | POST | `{email, password}` | — | general (IP) |
| `/auth/login` | POST | `{email, password}` | — | general (IP) |
| `/content` | POST | `{title, body, tags?}` | ✅ | general (IP) |
| `/content` | GET | `?tag&q&page&limit` | ✅ | general (IP) |
| `/content/:id` | GET | — | ✅ | general (IP) |
| `/content/:id/ai/summarize` | POST | `{tone, length, promptVersion?}` | ✅ | **user-id (5/min)** |
| `/ai/runs` | GET | `?page&limit` | ✅ | general (IP) |
| `/tokens/balance` | GET | — | ✅ | general (IP) |
| `/tokens/history` | GET | `?page&limit` | ✅ | general (IP) |
| `/tokens/convert` | POST | `{toAsset, amount}` | ✅ | **user-id (10/min)** |
| `/tokens/withdraw` | POST | `{amount, destination}` | ✅ | idempotency-key aware |
| `/media/upload` | POST | multipart `file` (≤10 MB, image/audio/video/PDF) | ✅ | general (IP) |
| `/media/:id/promote` | POST | — | ✅ | general (IP) |

Auth responses return `{ token, user: { id, email, role, tokenBalance } }`.

### Error semantics

`400` malformed input · `401` missing/invalid JWT · `403` wrong role · `404` not found · `409` conflict (insufficient balance, idempotency in flight or reused with a different payload) · `413` upload over the size limit · `422` Zod validation · `429` rate limited or the 15s AI window is open · `500` server error (internals logged, never returned).

One central handler maps `ZodError → 422`, malformed ids → `400`, upload errors → `400/413`, and rate-limit errors → `429`; unknown routes → `404`. 5xx messages are never echoed to the client — provider and database internals stay in the log. Pino logs every request with a request id and, when authenticated, the user id.

## Guarantees worth knowing

- **Ledger immutability** — `token_transactions` is insert-only; there is no update or delete path anywhere in the codebase, and a test asserts it.
- **No double spend** — balance check, deduction, ledger row and contract record happen inside one MongoDB transaction.
- **No double charge** — the AI endpoint refuses a second run for the same `(contentId, userId)` within 15 seconds, and the optional `Idempotency-Key` header replays the stored response.
- **Audit trail** — every AI attempt is a row in `ai_runs` (`PENDING → SUCCESS | FAILED | TIMEOUT`) with `latencyMs`, `tokensAwarded` and the failure message.

## Testing

```bash
npm test --workspace=backend
```

Covers the three ledger properties (conversion beyond the balance is rejected, a valid conversion is atomic, the ledger stays insert-only) and the HTTP contract in `src/app.test.ts`: missing/invalid token → `401` without taking the process down, malformed id → `400`, invalid body/query → `422`, unknown route → `404`, health → `200`.
