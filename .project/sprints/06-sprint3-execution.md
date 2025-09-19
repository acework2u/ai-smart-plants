# Sprint 3 Specialist Agent Roster

## Objective
Deliver Sprint 3 (Activity NPK & Persistence) with clear responsibility boundaries, consistent TypeScript standards, and QA-ready outputs within a 3-hour execution window.

---

## Lead Coordinator – **Project Atlas**
- **Role**: Sprint steward for planning, progress tracking, and risk management
- **Focus**: Ensure each specialist hands off atomic, tested work; maintain single source of truth in `SPRINT_STATUS.log`
- **Key Deliverables**:
  - Baseline execution schedule (checkpoints every 45 min)
  - Consolidated status updates for Claude PM review
  - Approval gateway before code merges

---

## Sub-Agent 1 – **NPK Form Engineer (Agent Delta)**
- **Scope**: Step 3.1 UI/UX implementation in `app/activity/[id].tsx`
- **Responsibilities**:
  - Introduce `NPK` state model with strict typing
  - Render conditional NPK inputs (N/P/K) with validation hooks
  - Wire `handleSave` to persist fertilizer-specific data
  - Update styles to align with design tokens (spacing, typography)
- **Acceptance Criteria**:
  - RN component free of warnings (`npm run lint` passes for touched files)
  - No regressions on non-fertilizer activity types
  - Document usage (prop/state map) in code comments where logic is non-trivial

---

## Sub-Agent 2 – **Persistence & Storage Specialist (Agent Echo)**
- **Scope**: Step 3.2 data layer integration
- **Responsibilities**:
  - Create `stores/prefsStore.ts` backed by AsyncStorage with Zustand persist
  - Expose selector/action helpers (`usePrefsStore`, `prefsActions`)
  - Update `STORAGE_KEYS` constants (`types/index.ts`) and document naming conventions
  - Provide hydration and migration guardrails (versioning placeholder, error handling)
- **Acceptance Criteria**:
  - Preferences survive app reload (`AsyncStorage` verified via console/test)
  - Minimal bundle size impact (lazy imports where necessary)
  - Unit test or Jest mock updates covering preferences store behavior

---

## Sub-Agent 3 – **Form Prefill Integrator (Agent Nova)**
- **Scope**: Step 3.3 cross-layer glue work
- **Responsibilities**:
  - Hydrate activity form with last-used values per plant
  - Persist preferences after save operations (kind, unit, qty, NPK)
  - Ensure differentiation by plantId and safe defaults for new plants
  - Update recent activity feed to display NPK metadata
- **Acceptance Criteria**:
  - Manual test plan executed (documented in `SPRINT3_QA_TEST_PLAN.md`)
  - Jest store tests updated for preferences interaction
  - Zero runtime warnings in Expo Go/dev build during navigation

---

## QA & Automation – **Agent Vega**
- **Scope**: Regression plus new behavior validation
- **Responsibilities**:
  - Expand coverage in `__tests__/stores/*.test.ts` to include persistence
  - Run `npm run lint` and `USE_WATCHMAN=0 RNTL_SKIP_DEPS_CHECK=1 npm test -- --runInBand`
  - Log results in `SPRINT_STATUS.log` and deliver QA sign-off report
- **Acceptance Criteria**:
  - All suites green; no skipped tests
  - Logged manual verification (simulator screenshots optional)

---

## Communication & Workflow Standards
- **Checkpoints**: 0:45 / 1:30 / 2:30 hours – each agent posts update + next steps
- **Handoff Protocol**:
  1. Agent completes task → updates `CODEX_STATUS.log` with timestamp
  2. Commit using Conventional Commit (`feat(activity): ...`, `chore(prefs): ...`)
  3. Notify Project Atlas for review before merge/release
- **Tech Stack Guardrails**:
  - TypeScript strict, no `any`
  - No direct `console.log` except temporary QA assertions (remove before handoff)
  - AsyncStorage keys prefixed `@spa/`
  - Expo Router routes must remain default-export components only

---

## Timeline Overview (3-hour window)
1. **00:00 – 00:45**: Agent Delta → NPK UI complete, lint clean
2. **00:45 – 01:45**: Agent Echo → prefs store + STORAGE_KEYS
3. **01:45 – 02:30**: Agent Nova → form prefill, activity log updates
4. **02:30 – 03:00**: Agent Vega → tests, simulator pass, final report
5. **03:00**: Project Atlas consolidates artifacts, brief PM

---

## Deliverable Checklist
- [ ] Updated activity UI with NPK inputs
- [ ] `stores/prefsStore.ts` + storage key registration
- [ ] Form prefill logic + NPK in history feed
- [ ] Jest + lint runs documented
- [ ] `SPRINT_STATUS.log` and `CODEX_STATUS.log` reflect completion
- [ ] QA summary attached (pass/fail, follow-ups)

---

*This roster is the authoritative guide for Sprint 3 execution. Any scope changes should be approved by Project Atlas and logged before implementation.*
