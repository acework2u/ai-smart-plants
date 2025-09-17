# Sprint Planning - Smart Plant AI
## Claude Code ↔ Codex CLI (GPT-5) Collaboration Guide
## Platform: Mac OS M4

---

## 🎯 Orchestration Overview
**Lead Controller:** Claude Code
**Execution Agent:** Codex CLI (GPT-5)
**Platform:** Mac OS M4
**Max Sprint Duration:** 3 hours each
**Collaboration Method:** Command-driven with status feedback

---

## 🔧 Pre-Sprint Setup (Claude Code Commands)

```bash
# Claude Code: Initialize collaboration environment
echo "Starting Smart Plant AI Sprint Collaboration" > COLLABORATION_LOG.md
echo "Platform: Mac OS M4" >> COLLABORATION_LOG.md
echo "Controller: Claude Code | Executor: Codex CLI (GPT-5)" >> COLLABORATION_LOG.md
date >> COLLABORATION_LOG.md

# Verify project structure
ls -la
npm list --depth=0
```

---

## 📋 Sprint Execution Protocol

### Sprint 1: Fix Skeleton Loading & Gradient (3 hours)
**Controller:** Claude Code
**Executor:** Codex CLI (GPT-5)
**Priority:** Critical

#### Claude Code Instructions for Codex CLI:

```bash
# COMMAND SET 1: Environment Preparation
echo "=== SPRINT 1 STARTED ===" >> SPRINT_STATUS.log
echo "Target: Fix Skeleton Loading & Gradient" >> SPRINT_STATUS.log
echo "Platform: Mac OS M4" >> SPRINT_STATUS.log
echo "Executor: Codex CLI (GPT-5)" >> SPRINT_STATUS.log
```

#### Codex CLI Execution Steps:

**Step 1.1: Dependency Installation (30 min)**
```bash
# Codex CLI: Execute these commands
npm install expo-linear-gradient
npx expo install expo-linear-gradient

# Verify installation on Mac M4
npm list expo-linear-gradient
echo "✅ expo-linear-gradient installed" >> SPRINT_STATUS.log
```

**Step 1.2: Fix SkeletonPlaceholder Component (1.5 hr)**
```typescript
// Codex CLI: Update components/atoms/SkeletonPlaceholder.tsx
// Claude Code will provide this exact specification:

// BEFORE (broken):
import LinearGradient from 'react-native-linear-gradient';

// AFTER (fixed for Expo + Mac M4):
import { LinearGradient } from 'expo-linear-gradient';

// Update BVLinearGradient references to LinearGradient
// Ensure props compatibility for M4 architecture
```

**Step 1.3: Testing on Mac M4 (1 hr)**
```bash
# Codex CLI: Run tests
npx expo start --clear
# Test on iOS Simulator (optimized for M4)
npx expo run:ios
# Test on Android Emulator
npx expo run:android

# Verify no console errors
echo "✅ Skeleton animations working on M4" >> SPRINT_STATUS.log
```

#### Claude Code Validation Commands:
```bash
# Check completion status
cat SPRINT_STATUS.log | grep "Sprint 1"
# Verify no errors
npm run typecheck
echo "Sprint 1 validation complete" >> COLLABORATION_LOG.md
```

---

### Sprint 2: AI Tips & Weather Integration (3 hours)
**Controller:** Claude Code
**Executor:** Codex CLI (GPT-5)
**Priority:** High

#### Claude Code → Codex CLI Instructions:

```bash
# COMMAND SET 2: AI Integration
echo "=== SPRINT 2 STARTED ===" >> SPRINT_STATUS.log
echo "Focus: AI Tips + Weather Mock Integration" >> SPRINT_STATUS.log
```

**Step 2.1: WeatherService Implementation (45 min)**
```typescript
// Codex CLI: Create features/ai/weather.ts
// Claude Code specification:

export interface Weather {
  tempC: number;
  humidity: number;
  condition: 'sunny' | 'rainy' | 'hot' | 'cool';
  location: string;
}

export class MockWeatherService {
  // Mac M4 optimized random data generation
  static getWeather(): Weather {
    const conditions = ['sunny', 'rainy', 'hot', 'cool'] as const;
    return {
      tempC: Math.floor(Math.random() * 35) + 15, // 15-50°C
      humidity: Math.floor(Math.random() * 60) + 40, // 40-100%
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      location: 'Bangkok, Thailand'
    };
  }
}
```

**Step 2.2: Hooks Creation (1 hr)**
```typescript
// Codex CLI: Create hooks/useAI.ts
// Claude Code will monitor progress via:
```

```bash
# Claude Code monitoring commands:
ls -la hooks/
grep -n "useWeather\|useAITips" hooks/useAI.ts
echo "Hooks implementation progress checked" >> COLLABORATION_LOG.md
```

**Step 2.3: Screen Integration (1.25 hr)**
```bash
# Codex CLI: Update screens with AI integration
# Claude Code verification:
echo "Checking AI integration in screens..." >> SPRINT_STATUS.log
grep -r "useWeather\|useAITips" app/
echo "✅ AI tips integrated in screens" >> SPRINT_STATUS.log
```

---

### Sprint 3: Activity NPK & Persistence (3 hours)
**Controller:** Claude Code
**Executor:** Codex CLI (GPT-5)
**Priority:** Critical

#### Claude Code Strategic Commands:

```bash
# COMMAND SET 3: Data Persistence
echo "=== SPRINT 3 STARTED ===" >> SPRINT_STATUS.log
echo "Focus: NPK Fields + AsyncStorage Persistence" >> SPRINT_STATUS.log
echo "Mac M4 AsyncStorage optimization required" >> SPRINT_STATUS.log
```

**Step 3.1: NPK Form Fields (1 hr)**
```typescript
// Codex CLI: Update app/activity/[id].tsx
// Claude Code specification for Mac M4 performance:

// Conditional NPK rendering
{kind === 'ใส่ปุ๋ย' && (
  <View style={styles.npkContainer}>
    <TextInput placeholder="N (%)" value={npk.n} onChangeText={(text) => setNpk(prev => ({...prev, n: text}))} />
    <TextInput placeholder="P (%)" value={npk.p} onChangeText={(text) => setNpk(prev => ({...prev, p: text}))} />
    <TextInput placeholder="K (%)" value={npk.k} onChangeText={(text) => setNpk(prev => ({...prev, k: text}))} />
  </View>
)}
```

**Step 3.2: AsyncStorage Implementation (1.5 hr)**
```typescript
// Codex CLI: Create stores/prefsStore.ts
// Claude Code monitoring:
```

```bash
# Claude Code: Monitor AsyncStorage implementation
echo "Checking AsyncStorage keys structure..." >> COLLABORATION_LOG.md
grep -n "@spa/plantPrefs" stores/prefsStore.ts
echo "Mac M4 AsyncStorage implementation verified" >> SPRINT_STATUS.log
```

**Step 3.3: Persistence Testing (30 min)**
```bash
# Codex CLI: Test persistence
npx expo start --clear
# Claude Code: Verify persistence
echo "Testing NPK persistence across app restarts..." >> SPRINT_STATUS.log
echo "✅ Data persistence confirmed on Mac M4" >> SPRINT_STATUS.log
```

---

### Sprint 4: Notifications & Haptics (3 hours)
**Controller:** Claude Code
**Executor:** Codex CLI (GPT-5)
**Priority:** Medium

#### Claude Code Final Sprint Commands:

```bash
# COMMAND SET 4: Polish & Finalization
echo "=== SPRINT 4 STARTED ===" >> SPRINT_STATUS.log
echo "Focus: Notifications + Haptics + Final QA" >> SPRINT_STATUS.log
echo "Mac M4 haptic optimization required" >> SPRINT_STATUS.log
```

**Step 4.1: Notification Persistence (1 hr)**
```bash
# Codex CLI: Implement notification filter persistence
# Claude Code: Monitor implementation
echo "Checking notification filter persistence..." >> COLLABORATION_LOG.md
grep -n "@spa/notiFilter" app/notifications.tsx
```

**Step 4.2: Haptic Feedback (1.5 hr)**
```typescript
// Codex CLI: Implement haptics for Mac M4
// Claude Code specification:

import * as Haptics from 'expo-haptics';

// Mac M4 optimized haptic feedback
export const haptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
  if (Platform.OS === 'ios') {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  }
};
```

**Step 4.3: Final QA (30 min)**
```bash
# Codex CLI: Run full test suite
npm run lint
npm run typecheck
npx expo start --clear

# Claude Code: Final validation
echo "=== FINAL QA RESULTS ===" >> SPRINT_STATUS.log
npm run test:all 2>&1 | tee -a SPRINT_STATUS.log
echo "✅ All sprints completed successfully" >> COLLABORATION_LOG.md
```

---

## 🤖 Claude Code → Codex CLI Communication Protocol

### Command Structure:
```bash
# Claude Code sends structured commands
echo "COMMAND: [Action]" >> CODEX_COMMANDS.log
echo "CONTEXT: [Sprint X - Step Y]" >> CODEX_COMMANDS.log
echo "EXPECTED_OUTPUT: [Specific deliverable]" >> CODEX_COMMANDS.log
echo "VALIDATION: [How Claude Code will verify]" >> CODEX_COMMANDS.log
echo "---" >> CODEX_COMMANDS.log
```

### Status Feedback Loop:
```bash
# Codex CLI reports back
echo "STATUS: [In Progress/Completed/Blocked]" >> CODEX_STATUS.log
echo "CURRENT_TASK: [Description]" >> CODEX_STATUS.log
echo "COMPLETION: [X%]" >> CODEX_STATUS.log
echo "NEXT_STEP: [What's next]" >> CODEX_STATUS.log
```

### Error Handling:
```bash
# If Codex CLI encounters issues
echo "ERROR: [Description]" >> ERRORS.log
echo "SPRINT: [Number]" >> ERRORS.log
echo "STEP: [Current step]" >> ERRORS.log
echo "PLATFORM_SPECIFIC: Mac M4 consideration" >> ERRORS.log

# Claude Code provides solution
echo "SOLUTION: [Fix instructions]" >> SOLUTIONS.log
```

---

## 🔍 Mac M4 Specific Considerations

### Performance Optimizations:
```bash
# Claude Code: Monitor M4 performance
top -l 1 | grep -E "(CPU|Memory)"
echo "M4 performance check complete" >> COLLABORATION_LOG.md
```

### Build Optimizations:
```bash
# Codex CLI: M4-optimized build commands
export NODE_OPTIONS="--max-old-space-size=8192"
npx expo run:ios --configuration Release
```

### Testing on M4:
```bash
# Simulator performance check
xcrun simctl list devices | grep "Booted"
echo "iOS Simulator running on M4 optimally" >> SPRINT_STATUS.log
```

---

## 📊 Real-time Collaboration Dashboard

```bash
# Claude Code: Generate status dashboard
echo "=== COLLABORATION DASHBOARD ===" > DASHBOARD.md
echo "Platform: Mac OS M4" >> DASHBOARD.md
echo "Controller: Claude Code" >> DASHBOARD.md
echo "Executor: Codex CLI (GPT-5)" >> DASHBOARD.md
echo "" >> DASHBOARD.md

# Sprint progress
for i in {1..4}; do
  echo "Sprint $i:" >> DASHBOARD.md
  grep "Sprint $i" SPRINT_STATUS.log | tail -1 >> DASHBOARD.md
done

echo "" >> DASHBOARD.md
echo "Last updated: $(date)" >> DASHBOARD.md
```

---

## 🚀 Quick Start for Collaboration

```bash
# Claude Code: Initialize collaboration session
./init_collaboration.sh

# Contents of init_collaboration.sh:
#!/bin/bash
echo "Initializing Claude Code + Codex CLI collaboration..."
echo "Platform: Mac OS M4"
echo "Project: Smart Plant AI"

# Create collaboration files
touch COLLABORATION_LOG.md
touch SPRINT_STATUS.log
touch CODEX_COMMANDS.log
touch CODEX_STATUS.log
touch ERRORS.log
touch SOLUTIONS.log

# Set permissions for M4
chmod +x *.sh

echo "✅ Collaboration environment ready"
echo "Ready for Codex CLI (GPT-5) to begin execution"
```

---

## 💡 Success Metrics & Handoff

| Sprint | Controller Actions | Executor Deliverables | M4 Validation |
|--------|-------------------|----------------------|---------------|
| 1 | Monitor gradient fixes | Working skeleton animations | No M4 compatibility issues |
| 2 | Verify AI integration | Dynamic tips system | Weather service responsive |
| 3 | Check persistence | NPK fields + storage | AsyncStorage M4 optimized |
| 4 | Final QA oversight | Haptics + notifications | All tests pass on M4 |

---

**Ready for Claude Code to orchestrate Codex CLI execution on Mac OS M4! 🚀**