# Repository Guidelines

## Project Structure & Module Organization
- `ai-smart-plants/app/` – Expo Router routes, layouts, and screens.
- `components/` – Reusable UI (atoms/molecules/organisms, providers, ui).
- `features/` – Feature-specific modules and screens.
- `stores/` – State (Zustand) and selectors; prefer `*Store.ts` naming.
- `services/` – Data/services (API, sensors, notifications).
- `core/` – Cross-cutting utilities (storage, ids, config) used app-wide.
- `hooks/`, `utils/`, `types/`, `contexts/` – Shared logic and types.
- `assets/` – Images, fonts, static files.
- `__tests__/` – Central tests; co-located `*.test.ts(x)` also allowed.
- Path aliases: `@components/*`, `@stores/*`, `@services/*`, `@core/*` (see `jest.config.js`, `tsconfig.json`).

## Build, Test, and Development Commands
- `npm run start` – Start Expo dev server; use `ios`/`android`/`web` variants.
- `npm run build` – Static export; `build:production` for all platforms.
- `npm run build:development` / `build:preview` – EAS build profiles.
- `npm run lint` – ESLint via `eslint-config-expo`.
- `npm test` – Run Jest; `test:watch`, `test:coverage` for modes.
- `npm run reset-project` – Clean dev state (see `scripts/reset-project.js`).

## Coding Style & Naming Conventions
- TypeScript strict mode; no implicit `any`.
- Use 2-space indent; keep lines concise (<100 chars where practical).
- Components export PascalCase symbols; files generally kebab-case (e.g., `themed-view.tsx`).
- Hooks start with `use*`; Zustand files prefer `*Store.ts` with named exports.
- Prefer named exports; default exports only for screens/routes.
- Lint before pushing; fix or justify disables.

## Testing Guidelines
- Frameworks: Jest + Testing Library for React Native.
- Locations: `__tests__/` or co-located `*.test.ts(x)`/`*.spec.ts(x)`.
- Coverage: 70% global thresholds (branches/functions/lines/statements) enforced.
- Write behavior-centric tests; query by role/text; add `testID` only when needed.
- Run `npm run test:coverage` locally for PRs that change logic.

## Commit & Pull Request Guidelines
- Follow Conventional Commits seen in history: `feat(scope): …`, `fix(scope): …`, `chore(scope): …`.
  - Example: `fix(home): simplify loading flow and skeletons`.
- PRs: concise description, linked issue, screenshots for UI changes, and test notes.
- Keep PRs focused and small; include migration notes when touching `stores/` or navigation.
- Do not introduce secrets; respect platform differences (Android/iOS/web) and avoid unstable APIs.
