# Smart Plant AI (React Native / Expo) — Context Specification for Claude Code CLI

> **Purpose:** This document gives Claude Code CLI everything it needs to scaffold and implement a production‑grade **React Native / Expo** app of *Smart Plant AI* based on the mobile web mockup currently in canvas. It defines scope, structure, contracts, and acceptance criteria so the code generator can create runnable code in one pass.

## Project Overview
Smart Plant AI is a mobile application that helps users take care of their plants using AI. Users can capture or upload plant photos, get instant analysis, save plants into their personal garden, track activity logs (watering, fertilizing, etc.), receive notifications, and see insights about plant health.


The application was originally prototyped as a mobile web mockup in React with TailwindCSS, lucide-react icons, and framer-motion animations. We now want to port it into a **full native mobile app** using **React Native / Expo**.

---

## 0) High‑Level Goals

* Build a **native** app with **Expo** (TypeScript) mirroring the UX of the web mockup: Onboarding → Home → Analyzing → Result → Garden → Plant Detail → Activity → Notification Center → Insights → Settings.
* Keep the **design system** (green/white), micro‑interactions, and haptics.
* Provide **AI tips** support (base rules + dynamic hooks), **Activity Log** with units (ml/g/pcs/**ล.**), **NPK** fields for fertilizer, and **persisted** filters, units, amounts, and last actions **per plant**.
* Deliver a clean structure, typed models, storage adapters, and testable logic.

**Non‑Goals:** Back‑end APIs, real ML scanning, live weather API integration (we mock with a provider + injectable interface), full i18n copywriting.

---

## 1) Tech Stack & Dependencies

Use Expo (managed workflow) + TypeScript.

**Core:**

* `expo`, `react`, `react-native`
* Navigation: `expo-router` (preferred) or `@react-navigation/native`, `@react-navigation/native-stack`
* Gestures/animation: `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`
* Icons: `lucide-react-native`
* State: `zustand` (lightweight) or `jotai`
* Storage: `@react-native-async-storage/async-storage`
* Haptics: `expo-haptics`
* Camera / Media: `expo-camera`, `expo-image-picker`
* Notifications: `expo-notifications`
* Optional: `expo-location` (for weather context), `react-native-svg`
* Dev: ESLint + Prettier

**Install (example):**

```bash
npx create-expo-app smart-plant-ai --template expo-template-blank-typescript
cd smart-plant-ai
npm i expo-router react-native-gesture-handler react-native-reanimated react-native-safe-area-context @react-native-async-storage/async-storage zustand lucide-react-native expo-haptics expo-camera expo-image-picker expo-notifications expo-location react-native-svg
```

> Ensure to configure reanimated (babel plugin) and gesture-handler (entry file). Enable router in `app/_layout.tsx`.

---

## 2) App Architecture

Use **expo-router** with file‑based routes. Keep screens small; push logic into hooks/stores/services.

```
smart-plant-ai/
  app/
    _layout.tsx
    index.tsx                      # Home
    onboarding.tsx
    analyzing.tsx
    result.tsx
    garden/
      index.tsx
    plant/
      [id].tsx                     # Plant detail
    activity/
      [id].tsx                     # Activity log for plant
    notifications.tsx
    insights.tsx
    settings.tsx
  components/
    atoms/                         # Button, Chip, Section, Toast
    molecules/                     # Cards, Tiles, Rows
    organisms/                     # Headers, BottomNav, EmptyState
  core/
    theme.ts                       # tokens & DS
    haptics.ts                     # adapter
    storage.ts                     # AsyncStorage helpers
    navigation.ts                  # route helpers/constants
  features/
    garden/
      store.ts                     # zustand store (plants)
      types.ts
    activity/
      store.ts                     # per-plant activities
      types.ts
    notifications/
      store.ts
      types.ts
    ai/
      tips.ts                      # rule-based tips + dynamic merge
      scan.ts                      # ScanService interface + mock
      weather.ts                   # WeatherService interface + mock
  lib/
    date.ts                        # formatThaiDate, etc.
  assets/
    images/
  App.tsx                          # expo-router entry (re-export)
  tsconfig.json, babel.config.js, eslint, prettier
```

---

## 3) Design System (Tokens & Components)

**Colors**

```ts
export const colors = {
  primary: '#16a34a', // green-600
  primarySoft: '#dcfce7', // green-100/50
  white: '#ffffff',
  gray900: '#111827', gray700: '#374151', gray600: '#4b5563', gray500: '#6b7280', gray200: '#e5e7eb',
  red500: '#ef4444', orange500: '#f97316',
};
```

**Typography & Radius**

```ts
export const radii = { xl: 16, lg: 12, md: 10, full: 999 };
export const spacing = (n: number) => n * 4; // dp
```

**Atoms**

* `ButtonPrimary`, `ButtonSecondary`
* `Chip` (status)
* `Section` (title/right)
* `EmptyState` (icon/title/desc/cta)
* `Toast` (success/info)

**Organisms**

* `AppHeader(title, back?, onBack?, right?)`
* `BottomNav(tab, onChange)`

**Micro‑interactions**: reanimated + haptics mapping (see §7).

---

## 4) Navigation Map (Router)

* `/onboarding` (initial unless `seenOnboarding=true` in storage)
* `/` (home)
* `/analyzing` → auto navigate to `/result` (mock delay)
* `/result` → save to garden
* `/garden`
* `/plant/[id]`
* `/activity/[id]`
* `/notifications`
* `/insights`
* `/settings`

`BottomNav` shows on: `/`, `/garden`, `/insights`, `/settings`.

---

## 5) Data Models (TypeScript)

```ts
// features/garden/types.ts
export type PlantStatus = 'Healthy' | 'Warning' | 'Critical';
export interface Plant {
  id: string;
  name: string;
  scientificName?: string;
  status: PlantStatus;
  imageUrl?: string;
  statusColor?: string; // derived or DS
}

// features/activity/types.ts
export type ActivityKind = 'รดน้ำ' | 'ใส่ปุ๋ย' | 'พ่นยา' | 'ย้ายกระถาง' | 'ตรวจใบ';
export type Unit = 'ml' | 'g' | 'pcs' | 'ล.'; // ลิตร
export interface NPK { n: string; p: string; k: string }
export interface ActivityEntry {
  id: string;
  plantId: string;
  kind: ActivityKind;
  quantity?: string; // numeric string
  unit?: Unit;
  npk?: NPK;        // only for fertilizer
  note?: string;
  dateISO: string;  // 2025-09-06
  time24?: string;  // 18:30
}

// features/notifications/types.ts
export type NotiType = 'reminder' | 'ai' | 'alert';
export interface NotiItem { id: string; type: NotiType; title: string; detail?: string; timeLabel: string; read: boolean }
```

**Per‑plant Preferences (persisted):**

```ts
export interface PlantPrefs { lastKind?: ActivityKind; lastUnit?: Unit; lastQty?: string; lastNPK?: NPK }
```

Storage keys (AsyncStorage):

```
@spa/plants
@spa/activities
@spa/noti
@spa/onboardingSeen
@spa/notiFilter
@spa/plantPrefs:{plantId}
```

---

## 6) State Stores (zustand)

* `useGardenStore`: plants array, CRUD, selectActivePlant(id?)
* `useActivityStore`: by `plantId`, addEntry(entry), list(plantId)
* `useNotiStore`: list/filter, markAllRead()
* `usePrefsStore`: get/set per‑plant `PlantPrefs`

Each store persists to AsyncStorage (use `zustand/middleware` `persist`).

---

## 7) Haptics Mapping (Expo)

Use `expo-haptics` adapter:

```ts
import * as Haptics from 'expo-haptics';
export type HapticType = 'light'|'medium'|'success'|'warning'|'error'|'selection';
export async function haptic(t: HapticType='light'){
  switch(t){
    case 'light': return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'medium': return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'success': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'warning': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    case 'error': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    case 'selection': return Haptics.selectionAsync();
  }
}
```

Bind to: primary buttons (medium/success), secondary (light), tab switch (selection), warnings/errors accordingly.

---

## 8) AI Tips (Rule‑based + Dynamic Hooks)

Provide deterministic base tips per plant name (Monstera/Fiddle/Snake/Generic). Then **merge** with **dynamic context** from mock services:

```ts
// features/ai/tips.ts
export function baseTips(plantName?: string): {id:string; title:string; desc:string}[] { /* same mapping as web */ }

export interface Weather { tempC: number; humidity: number; condition: 'sunny'|'rain'|'hot' }
export interface ScanIssue { code: 'yellow_leaf'|'fungus' }

export function dynamicTips({plantName, weather, issues}:{plantName?:string; weather?:Weather; issues?:ScanIssue[]}){ /* merge rules, like web */ }
```

**Services (mock + interface):**

```ts
// features/ai/weather.ts
export interface WeatherService { getCurrent(): Promise<Weather> }
export const MockWeatherService: WeatherService = { async getCurrent(){
  const pool = [ {tempC:33,humidity:70,condition:'sunny'}, {tempC:28,humidity:85,condition:'rain'}, {tempC:37,humidity:55,condition:'hot'} ];
  return pool[Math.floor(Math.random()*pool.length)];
}};

// features/ai/scan.ts
export interface ScanService { analyzeImage(localUri: string): Promise<{ plantName?: string; issues: ScanIssue[] }> }
export const MockScanService: ScanService = { async analyzeImage(uri){ return { plantName: 'Monstera Deliciosa', issues: [{code:'yellow_leaf'}] } } };
```

Screens consume via hooks:

```ts
// app/result.tsx
const weather = useWeather(); // calls WeatherService
const { tips } = useAITips({ plantName, weather, issues });
```

---

## 9) Screens — UX Specs

### Onboarding

* 3 slides (Scan, AI, Notify), dots indicator, Skip and Next/Start. Persist `@spa/onboardingSeen=true` then route to `/`.
* Haptics: selection on dot change, success on Start.

### Home (`/`)

* Hero scanner card with CTA: `ถ่ายรูปพืช` (camera) and `อัปโหลดจากแกลเลอรี` (image picker).
* **Quick tips** list (static for baseline in RN; horizontal swiper optional as enhancement).
* **Recent scans** grid from garden.
* **AI suggestions** (base tips for featured plant; dynamic when scan/weather available).

### Analyzing (`/analyzing`)

* Spinner + text. After timeout (mock 1.2s), navigate to `/result`.

### Result (`/result`)

* Show detected plant image/name/status, base tips text.
* Buttons: Save to garden (success haptic), Open shop (placeholder).

### Garden (`/garden`)

* Grid of plants → tap to `/plant/[id]`.

### Plant Detail (`/plant/[id]`)

* Status chip, care schedule tiles, recent logs, AI tips section.
* “ดูทั้งหมด” → `/activity/[id]`.

### Activity (`/activity/[id]`)

* Form: **kind**, **quantity + unit (ml/g/pcs/ล.)**, **NPK** trio only when `kind === 'ใส่ปุ๋ย'`, **date**, **time**, **note**.
* **Persist last** kind/unit/qty/NPK **per plant** (`@spa/plantPrefs:{id}`) and **pre‑fill** on re‑open.
* List history below.

### Notifications (`/notifications`)

* Segmented filters: `ทั้งหมด` / `เตือน` / `คำแนะนำ AI` / `แจ้งเหตุ` with **persisted selection** in `@spa/notiFilter`.
* Button: `ทำเครื่องหมายว่าอ่านแล้ว`.

### Insights (`/insights`)

* Simple stats tiles + upcoming alerts list.

### Settings (`/settings`)

* Language (Thai default), Theme (light), About, Reset/Seed garden.

---

## 10) Permissions

* Camera (scan), Media library (upload), Notifications (scheduling), Location (optional for weather).
* Handle denied permissions gracefully with EmptyState + CTA to open settings.

---

## 11) Notifications (Expo)

* Request permission at first need (on Home or Settings).
* Schedule local reminders (mock APIs). Store items in `useNotiStore` with `read` state.
* Render Notification Center from store; filters persisted.

---

## 12) Storage & Persistence

* Use `AsyncStorage` via small `Storage` helper: `get<T>(key)`, `set(key, value)`, `merge(key, patch)`.
* Stores wrap with `persist` so app state restores on cold start.

---

## 13) Accessibility & UX

* Hit slop on tappables; minimum 44dp touch size.
* Dynamic type friendly: avoid absolute font sizes where possible.
* Contrast >= 4.5 for text.

---

## 14) Performance

* Use `FlatList` for notifications and activities (keyExtractor, getItemLayout optional).
* Lazy load screens (router). Memoize lists.

---

## 15) Testing & QA

* Unit tests for tips merge logic and stores (optional if time‑boxed).
* Manual acceptance checklist (see §18).

---

## 16) CI / EAS (Optional)

* EAS build profiles: `development`, `preview`, `production`.
* App icons/splash in `app.json`.

---

## 17) Coding Conventions

* TypeScript strict. ESLint (airbnb-ish) + Prettier.
* File‑scoped styles via StyleSheet or tailwind‑in‑RN optional; prefer StyleSheet for perf.

---

## 18) Acceptance Criteria (Must Pass)

1. App runs with `npx expo start` and navigates between all screens listed in §4.
2. **Activity** screen supports unit **ml/g/pcs/ล.** and shows **NPK** inputs when kind = ใส่ปุ๋ย.
3. Per‑plant **last preferences** persist and pre‑fill on revisit.
4. Notification Center filters work and **persist** across app restarts; `ทำเครื่องหมายว่าอ่านแล้ว` updates UI.
5. Haptics fire according to mapping in §7; no crashes if device setting disables haptics.
6. Onboarding `Start` sets `@spa/onboardingSeen` and routes to Home automatically on next launch.
7. **AI tips** show base tips; dynamic hook functions exist and are easily wire‑able to Mock services.
8. No TypeScript errors; lint passes; basic Android/iOS runs.

---

## 19) Claude Code CLI — Tasks

Claude should:

1. **Scaffold** the directory tree in §2 using Expo Router + TS.
2. **Generate** components & screens with minimal UI (use React Native primitives) that match the spec.
3. **Implement**: stores in §6 with `persist`; storage helper; haptics adapter in §7.
4. **Wire** Activity screen form with conditional NPK and per‑plant preference persistence.
5. **Implement** Notification Center with persisted segmented filters.
6. **Provide** Mock services for weather and scan; expose hooks `useWeather`, `useAITips`.
7. **Seed** garden, activity, notifications with sample data matching the web mockup.
8. **Add** simple theming tokens and reusable atoms (Button, Chip, Section, EmptyState, Toast, Header, BottomNav).
9. **Include** README snippet in `CLAUDE.md` footer with run commands.

**Constraints:**

* Use TypeScript throughout. Avoid any native custom modules beyond Expo libs listed. Keep code deterministic and runnable without external APIs.

---

## 20) Implementation Notes (per file)

* `app/_layout.tsx`: SafeAreaView, BottomNav visibility based on route segment.
* `app/index.tsx`: Home screen with camera & picker buttons (hooks stub), quick tips list, recent scans, base AI tips.
* `app/analyzing.tsx`: spinner + setTimeout → `/result`.
* `app/result.tsx`: read last scan result from a temp store (or from mock); buttons.
* `app/garden/index.tsx`: grid cards, navigate to `/plant/[id]`.
* `app/plant/[id].tsx`: detail with care tiles, recent logs, AI tips section, CTA to activity.
* `app/activity/[id].tsx`: form + list; uses `usePrefsStore` for defaults and updates on submit.
* `app/notifications.tsx`: segmented controls with counter chips; list NotiItem.
* `app/insights.tsx`: stat tiles.
* `app/settings.tsx`: toggles + seed/reset buttons.

---

## 21) Sample Seed Data

```ts
export const SEED_PLANTS: Plant[] = [
  { id:'p1', name:'Monstera Deliciosa', status:'Healthy', imageUrl:'https://images.unsplash.com/photo-1614594857263-4a3b8d54915f?q=80&w=800&auto=format&fit=crop' },
  { id:'p2', name:'Fiddle Leaf Fig',   status:'Warning', imageUrl:'https://images.unsplash.com/photo-1598899134739-24b9f615c6b9?q=80&w=800&auto=format&fit=crop' },
  { id:'p3', name:'Snake Plant',        status:'Critical', imageUrl:'https://images.unsplash.com/photo-1545241047-6083a8d2ecf6?q=80&w=800&auto=format&fit=crop' },
];
```

---

## 22) Run & Dev Commands

```bash
# start
npx expo start
# iOS Simulator
npx expo run:ios -d
# Android Emulator
npx expo run:android -d
```

---

## 23) Future Enhancements (out of scope)

* Real camera scan pipeline (on‑device model or cloud).
* Weather API integration (Open‑Meteo/Apple WeatherKit) with caching.
* Deep links for shareable plant detail.
* Localization (TH/EN) with `i18n-js` or `react-intl`.

---

### Footer — Quick Start for Claude

> **Instruction to Claude:** Generate the project exactly as specified above. Ensure all screens compile, navigation works, stores persist, and acceptance criteria in §18 pass with seed data.

### Basic Usage
```bash
# Direct execution with custom settings
codex exec -s danger-full-access -c model_reasoning_effort="low" "Your task here"

# Examples
codex exec -s danger-full-access -c model_reasoning_effort="high" "Refactor the API to use TypeScript interfaces"
codex exec -s danger-full-access -c model_reasoning_effort="low" "List all files in src/"

### Helper Script Usage
A helper script `codex-exec.sh` simplifies common operations:
```bash
# Usage: ./codex-exec.sh [reasoning_level] "task"
./codex-exec.sh low "Quick file listing"
./codex-exec.sh high "Complex refactoring task"
./codex-exec.sh "Default task" # defaults to low reasoning
```

### Background Execution with Monitoring
For long-running tasks, use background execution:
```bash
# In Claude, use run_in_background parameter:
# Bash tool with run_in_background: true
# Then monitor with BashOutput tool using the returned bash_id
```

### Parallel Execution
Multiple Codex instances can run simultaneously:
```bash
# Start multiple background tasks
codex exec -s danger-full-access "Task 1" &
codex exec -s danger-full-access "Task 2" &
wait # Wait for all to complete
```
### Key Advantages Over TMux Approach
1. **No timing issues** - No sleep/wait commands needed
2. **Clean output** - Direct JSON/text without UI elements
3. **Exit codes** - Proper error handling with return codes
4. **Parallel execution** - Run multiple instances simultaneously
5. **Scriptable** - Easy integration with CI/CD pipelines

### Reasoning Levels
- `minimal` - Fastest, limited reasoning (~5-10s for simple tasks)
- `low` - Balanced speed with some reasoning (~10-15s)
- `medium` - Default, solid reasoning (~15-25s)
- `high` - Maximum reasoning depth (~30-60s+)

### Safety Considerations
- Using `danger-full-access` grants full system access
- Auto-approval with `--ask-for-approval never` bypasses confirmations
- Consider permission models for production use

### Common Patterns
```bash
# Add new API endpoint
codex exec -s danger-full-access -c model_reasoning_effort="high" \
"Add a new REST endpoint /api/users that returns user data"

# Refactor code
codex exec -s danger-full-access -c model_reasoning_effort="high" \
"Refactor the authentication module to use JWT tokens"

# Generate tests
codex exec -s danger-full-access -c model_reasoning_effort="medium" \
"Write unit tests for the user service module"

# Quick fixes
codex exec -s danger-full-access -c model_reasoning_effort="low" \
"Fix the typo in README.md"
```

### Integration with Claude
When Claude needs to use Codex:
1. Use direct `codex exec` commands instead of tmux
2. For long tasks, use `run_in_background: true`
3. Monitor progress with `BashOutput` tool
4. Check exit codes for success/failure
5. Parse clean output without UI filtering

### Discovered Capabilities
- ✅ Non-interactive execution with `codex exec`
- ✅ Parallel task execution
- ✅ Background monitoring
- ✅ Custom reasoning levels
- ✅ Direct file modifications
- ✅ Automatic git patches
- ✅ TypeScript/JavaScript understanding
- ✅ API endpoint creation
- ✅ Code refactoring

codex-exec.sh
-------------
#!/bin/bash
# Codex Direct Execution Helper Script
# Usage: ./codex-exec.sh [reasoning_level] "Your task description"
# Examples:
# ./codex-exec.sh low "List all files"
# ./codex-exec.sh high "Refactor the API endpoints"
# ./codex-exec.sh "Quick task" (defaults to low reasoning)

# Default reasoning level
REASONING="${1:-low}"

# If only one argument, it's the prompt with default reasoning
if [ $# -eq 1 ]; then
PROMPT="$1"
REASONING="low"
else
PROMPT="$2"
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 Codex Direct Execution${NC}"
echo -e "${YELLOW}Reasoning: ${REASONING}${NC}"
echo -e "${GREEN}Task: ${PROMPT}${NC}"
echo "----------------------------------------"

# Execute Codex with full access and no approval needed
codex exec \
-s danger-full-access \
-c model_reasoning_effort="${REASONING}" \
"$PROMPT"

# Capture exit code
EXIT_CODE=$?

echo "----------------------------------------"
if [ $EXIT_CODE -eq 0 ]; then
echo -e "${GREEN}✅ Task completed successfully${NC}"
else
echo -e "${RED}❌ Task failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE

# Claude-Codex Orchestrator/Worker Architecture (2025-09-01)

## Paradigm: Claude as Orchestrator, Codex as Workers

### Division of Responsibilities

#### Claude (Orchestrator - Opus/Sonnet)
**Primary Role**: High-level thinking, planning, and GitHub operations
- 🧠 **Thinking & Analysis**: Strategic planning, decision making, result interpretation
- 📋 **GitHub Operations**: All `gh` CLI operations (issues, PRs, comments, merges)
- 🎛️ **Worker Management**: Spawn, monitor, and coordinate multiple Codex instances
- 📊 **Progress Monitoring**: Track worker status using `BashOutput`
- 🔄 **Result Aggregation**: Combine outputs from multiple workers
- 📝 **Documentation**: Write retrospectives, update AGENTS.md
- 🔍 **Quality Control**: Review worker outputs before GitHub operations

#### Codex (Workers)
**Primary Role**: Execution, implementation, and file operations
- ⚙️ **Code Execution**: Run commands, analyze code, implement features
- 📁 **File Operations**: Read, write, edit, search through codebases
- 🔧 **Implementation**: Make code changes, refactor, fix bugs
- 🚀 **Parallel Processing**: Multiple instances for concurrent tasks
- 📈 **Analysis Tasks**: Deep code analysis, pattern detection
- 🧪 **Testing**: Run tests, validate changes

### Implementation Patterns

#### Single Worker Pattern
```bash
# Claude delegates a single task to Codex
codex exec -s danger-full-access -c model_reasoning_effort="low" "Task description"
```

#### Multiple Worker Pattern
```bash
# Claude spawns multiple Codex workers for parallel execution
# Worker 1: Frontend analysis
codex exec -s danger-full-access "Analyze all React components" & # Returns bash_1

# Worker 2: Backend analysis
codex exec -s danger-full-access "Review API endpoints" & # Returns bash_2

# Worker 3: Test coverage
codex exec -s danger-full-access "Check test coverage" & # Returns bash_3

# Claude monitors all workers
BashOutput bash_1 # Monitor frontend analysis
BashOutput bash_2 # Monitor backend analysis
BashOutput bash_3 # Monitor test coverage

# Claude aggregates results and creates GitHub issue/PR
```

#### Background Worker Pattern
```bash
# For long-running tasks, use background execution
codex exec -s danger-full-access -c model_reasoning_effort="high" \
"Complex refactoring task" \
run_in_background: true # Returns bash_id

# Claude continues other work while monitoring
BashOutput bash_id # Check progress periodically
```

### Workflow Examples

#### Example 1: Multi-File Refactoring
```
1. Claude analyzes requirements
2. Claude spawns 3 Codex workers:
- Worker A: Refactor components
- Worker B: Update tests
- Worker C: Update documentation
3. Claude monitors all three in parallel
4. Claude aggregates changes
5. Claude creates PR with gh CLI
```

#### Example 2: Codebase Analysis
```
1. Claude plans analysis strategy
2. Claude delegates to Codex:
- "Analyze security vulnerabilities"
- "Check code quality metrics"
- "Review dependency updates"
3. Codex executes and returns findings
4. Claude creates comprehensive GitHub issue
```

#### Example 3: Bug Fix Workflow
```
1. Claude reads GitHub issue
2. Claude delegates investigation to Codex
3. Codex finds root cause and implements fix
4. Claude reviews the fix
5. Claude creates PR and updates issue
```

### Best Practices

#### For Claude (Orchestrator)
1. **Always think first**: Plan before delegating to workers
2. **Use TodoWrite**: Track worker tasks and progress
3. **Batch operations**: Spawn multiple workers when tasks are independent
4. **Handle GitHub**: All `gh` operations should be done by Claude
5. **Aggregate intelligently**: Combine worker outputs meaningfully
6. **Monitor actively**: Use `BashOutput` to track worker progress
7. **Kill stuck workers**: Use `KillBash` if workers hang

#### For Codex (Workers)
1. **Focused tasks**: Give Codex specific, well-defined tasks
2. **Appropriate reasoning**: Use `low` for simple, `high` for complex
3. **Parallel when possible**: Independent tasks should run concurrently
4. **Clear output**: Request structured output for easy aggregation
5. **Error handling**: Expect and handle worker failures gracefully
6. **CRITICAL - Planning vs Implementation**:
- For `nnn` (planning): ALWAYS include "DO NOT modify/implement/write files"
- For `gogogo` (implementation): Allow file modifications
- Use explicit instructions: "Analyze and DESIGN ONLY" vs "Implement the following"

### Communication Patterns

#### Claude → Codex
```bash
# Direct execution with results
result=$(codex exec -s danger-full-access "task")

# Background with monitoring
codex exec -s danger-full-access "task" & # run_in_background: true
BashOutput bash_id
```

#### Codex → Claude
- Returns via stdout/stderr
- Exit codes indicate success/failure
- Structured output (JSON, markdown) for easy parsing

#### Claude → GitHub
```bash
# All GitHub operations handled by Claude
gh issue create --title "Title" --body "Body"
gh pr create --title "Title" --body "Body"
gh issue comment 123 --body "Comment"
```

### Anti-Patterns to Avoid

1. ❌ **Codex doing GitHub operations** - Only Claude should interact with GitHub
2. ❌ **Claude doing file operations** - Delegate file work to Codex
3. ❌ **Serial execution of independent tasks** - Use parallel workers
4. ❌ **Not monitoring workers** - Always track progress with BashOutput
5. ❌ **Over-reasoning for simple tasks** - Use appropriate reasoning levels
6. ❌ **Under-utilizing parallelism** - Spawn multiple workers when possible

### Performance Guidelines

#### Reasoning Levels by Task Type
- **minimal**: File listing, simple searches (~5-10s)
- **low**: Code formatting, simple refactoring (~10-15s)
- **medium**: Feature implementation, bug fixes (~15-25s)
- **high**: Complex analysis, architecture changes (~30-60s+)

#### Parallel Execution Limits
- Maximum recommended concurrent workers: 5-10
- Monitor system resources when spawning many workers
- Use `ps aux | grep codex` to check running instances

### Example: Complete Feature Implementation

```bash
# Claude's workflow for implementing a new feature

# 1. Claude analyzes requirements and creates plan
TodoWrite "Plan feature implementation"

# 2. Claude spawns multiple Codex workers
worker1=$(codex exec -s danger-full-access "Implement backend API endpoint" &)
worker2=$(codex exec -s danger-full-access "Create frontend components" &)
worker3=$(codex exec -s danger-full-access "Write unit tests" &)
worker4=$(codex exec -s danger-full-access "Update documentation" &)

# 3. Claude monitors all workers
BashOutput $worker1
BashOutput $worker2
BashOutput $worker3
BashOutput $worker4

# 4. Claude aggregates results
# (Combine outputs, resolve conflicts, ensure consistency)

# 5. Claude handles GitHub
gh issue comment $issue_number --body "Feature implemented"
gh pr create --title "feat: New feature" --body "Details..."
```

### Metrics & Monitoring

Track these metrics for optimization:
- Worker completion times by reasoning level
- Parallel vs serial execution time savings
- Worker failure rates by task type
- GitHub operation success rates
- Overall workflow completion times

### Migration Path

For existing workflows:
1. Identify file-heavy operations → Delegate to Codex
2. Identify GitHub operations → Keep with Claude
3. Identify independent tasks → Parallelize with multiple workers
4. Identify complex analysis → Use high-reasoning Codex
5. Test and optimize reasoning levels

**Last Updated**: 2025-09-02
**Architecture Version**: 2.0
**Key Innovation**: Orchestrator/Worker pattern with Claude/Codex

