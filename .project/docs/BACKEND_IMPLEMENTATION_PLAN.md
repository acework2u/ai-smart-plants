# Smart Plant AI Backend & API Development Plan

## Document Context
- **Author**: Codex (system design & implementation)
- **Audience**: Backend/API engineering team, QA, DevOps
- **Purpose**: Provide an actionable roadmap that keeps development, infrastructure, and testing aligned with `.project/docs/API_SPEC_Development.md`.
- **Last Updated**: 2025-02-16

## 1. Guiding Objectives
1. Deliver a production-ready REST API (`/v1`) matching the approved specification.
2. Ensure every feature has an accompanying test strategy (unit + integration) before delivery.
3. Maintain developer velocity with Docker-based local environment (API + Postgres + Redis + Analysis service).
4. Preserve flexibility for future microservice extraction (analysis, notifications, etc.).

## 2. Milestone Overview
| Milestone | Scope | Key Outputs | Target | Owner |
| --- | --- | --- | --- | --- |
| M1. Foundation | Project setup, config, logging, error handling, health checks | Running API skeleton with lint/test pipeline | Week 1 | Backend Team |
| M2. Core Domain | Plants, Activities, Preferences, AI Analysis integration (mock) | CRUD endpoints, persistence layer, OpenAPI draft | Week 3 | Backend Team |
| M3. Notifications & Insights | Notification Center, Insights aggregation, async workflow | Pub/Sub mocks, scheduled jobs, endpoints | Week 5 | Backend + Platform |
| M4. Quality & Hardening | Auth, rate limiting, telemetry, CI/CD, load tests | Auth integration, observability dashboards | Week 6 | Backend + DevOps |
| M5. Launch Prep | Final QA, schema freeze, runbooks, deployment | Production-ready build & documentation | Week 7 | All |

## 3. Iteration Breakdown
### Sprint 1 (Foundation)
- **Infrastructure**
  - Finalize `docker-compose` with API, Postgres, Redis, analysis mock, optional test containers.
  - Implement environment loader + validation (`env.ts`).
  - Configure logger, error handler, request tracing ID support.
- **Routing Shell**
  - Establish `/v1/health`, `/v1/docs`, `/v1/versions` endpoints.
  - Setup express middlewares: JSON parsing, CORS, rate limiting (in-memory fallback), error handler.
- **Tooling**
  - ESLint/Prettier, commit hooks (optional), base test command (`vitest`), coverage thresholds placeholder.
  - CI placeholder (GitHub Actions) with lint + test + build steps.
- **Testing**
  - Smoke test for health endpoint.
  - Snapshot test for error formatter.

### Sprint 2 (Core Domain)
- **Data Layer**
  - Introduce Prisma or TypeORM schema for Users, Plants, Activities, Notifications, Preferences, Analyses.
  - Migration scripts + seed data to match mobile seeds.
- **Services/Controllers**
  - Implement Modules:
    - `PlantsService` (`/v1/plants` CRUD, preferences, filters).
    - `ActivitiesService` with per-plant operations + validation for units/NPK.
    - `AnalysesService` (start/list/get) with integration to analysis mock service.
  - Response envelope standardization across controllers.
- **OpenAPI**
  - Generate spec (swagger-jsdoc or tsoa/Nest plugin) from controllers.
- **Testing**
  - Unit tests for services (validation, transformations).
  - Integration tests using Supertest + test Postgres (use docker service or sqlite fallback).

### Sprint 3 (Notifications & Insights)
- **Notifications**
  - Implement `/v1/notifications` endpoints, mark read, subscribe/unsubscribe.
  - Integrate with Redis for queue simulation; plan for Pub/Sub.
- **Insights**
  - Aggregation queries (metrics/trends) using SQL or materialized views.
  - Expose `/v1/insights/summary` and `/v1/insights/trends`.
- **Async Workflow**
  - Add background job processor stub (BullMQ / custom) to simulate event handling.
  - Publish/consume events via in-memory bus (upgrade path to Pub/Sub).
- **Testing**
  - Contract tests for notifications.
  - Data-layer tests for insights calculations.

### Sprint 4 (Security & Observability)
- **Authentication**
  - Integrate JWT verification (JWKS) with middleware + scope checking.
  - Implement RBAC guard per route group.
- **Rate Limiting & Idempotency**
  - Redis-backed rate limiter + idempotency store.
- **Observability**
  - Structured logging (traceId), metrics instrumentation (Prometheus endpoints), tracing hooks (OpenTelemetry SDK).
- **Resilience**
  - Circuit breaker for analysis service, retry policies.
- **Testing**
  - Security tests (JWT validation, scope enforcement).
  - Load-test scripts (k6/Jest-based) in `tests/perf`.

### Sprint 5 (Launch Readiness)
- **Docs & Runbooks**
  - Update README backend, API spec, deployment steps.
  - Create ops runbook (alerts, scaling, rollback).
- **Validation**
  - QA regression, contract approval, manual checklists from spec §18.
- **Deployment**
  - Finalize CI (build/push image, deploy to staging/prod via Cloud Run/ECS).
  - Canary strategy outline.

## 4. Test Strategy Mapping
| Feature | Tests | Tooling |
| --- | --- | --- |
| Health & Diagnostics | Unit + integration (Supertest) | Vitest, Supertest |
| Plants CRUD | Unit (service validation), integration (DB) | Vitest, Prisma test env |
| Activities | Unit + property-based for NPK validation | Vitest, fast-check |
| Analyses Workflow | Integration (API ↔ analysis mock) | Supertest + MSW mock |
| Notifications | Integration (Redis queue), contract tests | Pact | 
| Insights | Snapshot tests for aggregated payloads | Vitest |
| Auth + RBAC | Integration with mocked JWKS | Supertest |
| Error Handling | Unit tests for formatter + e2e verifying envelopes | Vitest |
| Performance | k6 scripts (baseline) + Jenkins/GitHub Actions | k6 |

## 5. Deliverables Checklist
- [ ] Docker environment with seeded DB & analysis service.
- [ ] Configured Prisma/ORM with migrations + seeds.
- [ ] Controllers, services, repositories per domain model.
- [ ] Shared libs: auth middleware, request context, envelope helper.
- [ ] Swagger UI fed by generated OpenAPI 3.1.
- [ ] Unit/integration test suites with coverage report.
- [ ] CI pipeline (lint/test/build) + CD pipeline template.
- [ ] Observability hooks (metrics, structured logs).
- [ ] Deployment guide (Cloud Run/ECS) and runbook.

## 6. Open Dependencies & Decisions
1. Choose ORM (Prisma vs. TypeORM) — default recommendation: **Prisma** for developer productivity.
2. Decide on job processing library (BullMQ vs. custom) for async workflows.
3. Confirm JWT provider details (Auth0/Okta) to configure JWKS URL properly.
4. Select contract testing framework (Pact or Dredd) for integration with mobile clients.

## 7. Immediate Next Actions
1. Prepare ORM setup + migrations aligned with data models (Owners: Backend).
2. Implement shared error handling + response envelope module.
3. Scaffold controllers/services for Plants with DB integration.
4. Stand up basic test harness (Vitest + Supertest + db test env).

---
This plan will be updated at the end of each sprint or when major architectural decisions change.
