# Repository Guidelines

## Project Structure & Module Organization
The Expo mobile client lives in `app/` (route-based screens via Expo Router). Shared UI sits in `components/`, domain logic in `features/` and `core/`, and data helpers in `services/`, `stores/`, and `utils/`. Global constants belong in `constants/`, types in `types/`, localization in `locales/`, and static assets in `assets/`. Expo configuration is tracked by `app.json`, `expo-env.d.ts`, and `metro.config.js`. The API server resides in `backend/` (`src/`, Prisma schema, and `tests/`), while the ML analysis service is under `analysis-service/`. Treat `dist/` and `dist-final/` as generated artifacts—do not edit directly.

## Build, Test, and Development Commands
Use `npm start` for the Expo dev menu (press `i`/`a` to launch iOS/Android simulators). Platform-specific builds rely on `npm run android`, `npm run ios`, and `npm run web`. Ship a static bundle with `npm run build` or `npm run build:production`. Quality gates include `npm run lint`, `npm run test`, `npm run test:watch`, and `npm run test:coverage`. For the backend, install dependencies then run `npm run dev`, `npm run build`, or `npm run test` inside `backend/`; manage schema changes with `npm run prisma:migrate`. Each service also provides Dockerfiles for container workflows.

## Coding Style & Naming Conventions
TypeScript is mandatory with strict checks, so keep interfaces and types close to their modules. Follow the Expo ESLint ruleset (`eslint.config.js`), using 2-space indentation and single quotes to match existing files. Components and hooks use PascalCase (`PlantStatusCard.tsx`, `useSoilData.ts`), Zustand stores live in `stores/*` and export `useXStore`. Keep utility functions pure, centralizing side effects inside services or hooks.

## Testing Guidelines
UI behavior tests belong in `__tests__/` and should use `*.test.tsx` with `@testing-library/react-native`. Leverage the shared setup in `jest.setup.js`, mocking native modules via `shims/` when necessary. Collect coverage with `npm run test:coverage` before major merges. Backend HTTP and data tests live in `backend/tests`, powered by Vitest and Supertest; run the Prisma seed (`npm run prisma:seed`) when integration fixtures are needed.

## Commit & Pull Request Guidelines
Write present-tense, descriptive commits (`optimize garden hydration chart`) that bundle related code and tests. Reference issues or tasks in the body when relevant. Pull requests should outline the change, call out environment or schema updates, include screenshots or screen recordings for UI edits, and document manual verification steps (device, platform). Always confirm lint and test commands succeed locally before requesting review.
