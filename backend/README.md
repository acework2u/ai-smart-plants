# Smart Plant AI Backend (Draft Scaffold)

This directory contains the initial backend scaffold that aligns with `.project/docs/API_SPEC_Development.md`. It is built with TypeScript + Express to accelerate early development and can evolve into a modular microservice architecture.

## Stack Overview
- **Runtime**: Node.js 20 (TypeScript)
- **Framework**: Express + Zod for validation (upgradeable to NestJS or Fastify later)
- **Logging**: Pino (+ pretty transport for development)
- **Infrastructure (local)**: Postgres 15, Redis 7, Analysis FastAPI service via `docker-compose`
- **Documentation**: Swagger UI served via `/v1/docs` (placeholder OpenAPI 3.1 document)

## Getting Started
```bash
cd backend
cp .env.example .env.local
npm install   # install dependencies (requires internet access)
npm run prisma:generate
npm run dev
# Obtain a valid OAuth2 access token (JWT) with required scopes before calling the API.
# Local password auth helpers (development only)
# Register
# curl -X POST http://localhost:4000/v1/auth/register -H 'Content-Type: application/json' \\
#   -d '{"email":"demo@example.com","password":"Password123"}'
# Login
# curl -X POST http://localhost:4000/v1/auth/login -H 'Content-Type: application/json' \\
#   -d '{"email":"demo@example.com","password":"Password123"}'
# Seed database (requires DATABASE_URL)
# DATABASE_URL="postgresql://smartplants:smartplants@postgres:5432/smartplants" npm run prisma:seed
```
The `.env.example` template captures all variables required by `src/config/env.ts`, including `RATE_LIMIT_GENERAL_LIMIT` and `RATE_LIMIT_GENERAL_WINDOW_MS`. Copy it for each environment and adjust throughput limits without code changes.
This runs the API with hot reload on port `4000` (see `src/server.ts`).

### With Docker Compose
```bash
cd backend
docker compose up --build
```
This launches:
- `api` (Node service with live-reload)
- `postgres` (Port 5432)
- `redis` (Port 6379)
- `analysis-api` (FastAPI mock analysis service on port 5000)

Run `npm run prisma:migrate` locally before starting the app to apply database schema changes. After that, run `npm run prisma:seed` to populate a demo account (email/password shown above).
Generate a JWT from your identity provider (matching `AUTH_ISSUER` / `AUTH_AUDIENCE`) and send it via `Authorization: Bearer <token>` when calling endpoints.
For local development only, you may continue using the legacy header `X-User-Id` (a seeded user id). The middleware will grant full scopes automatically when `NODE_ENV=development`. Alternatively, use the `/auth/register` + `/auth/login` endpoints above to mint HS256 JWTs with the configured `AUTH_TOKEN_SECRET`.

Volumes persist database/cache data between runs.

## Project Structure
```
backend/
  docker-compose.yml
  Dockerfile
  package.json
  tsconfig*.json
  src/
    config/      # Environment loading and shared config
    controllers/ # Request handlers (to be implemented)
    routes/      # Route definitions
    docs/        # OpenAPI draft document
    middleware/  # Express middlewares (auth, error handling)
    utils/       # Supporting utilities (logger, etc.)
```

## Next Steps
1. Complete additional domain modules (Activities, Analyses, Notifications, Insights).
2. Replace placeholder OpenAPI document with generated spec (e.g., using `nestjs/swagger` or `express-oas-generator`).
3. Implement shared middleware for authentication (JWT verification with JWKS), idempotency, and error handling per spec.
4. Add tests (`vitest`) and CI pipeline for linting, testing, and contract validation.

## Deployment
- Build production image via `npm run build` then `docker build -f Dockerfile -t smart-plant-api .`.
- Push image to registry before deploying to Google Cloud Run, GKE, AWS ECS, etc.
- External infrastructure templates (Terraform, Helm) can live under `infra/` in this repository or a dedicated repo.

Refer to `.project/docs/API_SPEC_Development.md` for full contract details.
