# 🧪 QA Agent Team Assignment - Sprint 3
## Activity NPK & Persistence Testing

---

## 📋 ASSIGNMENT OVERVIEW
**Sprint:** 3 - Activity NPK & Persistence
**QA Lead:** Claude Code PM
**QA Agents:** Agent Team (3 agents)
**Testing Window:** 17:35 - 18:35
**Platform:** Mac OS M4

---

## 👥 AGENT ASSIGNMENTS

### Agent 1: NPK Field Testing Specialist
**Focus:** NPK input fields functionality
**Duration:** 45 minutes

**Tasks:**
1. Test conditional NPK field display
   - Verify fields appear ONLY for "ใส่ปุ๋ย" activity
   - Confirm fields hide for all other activity types
2. Validate NPK input functionality
   - Test numeric-only input
   - Verify 3-digit max length
   - Check decimal handling
3. Test NPK data saving
   - Confirm values save with activity entry
   - Verify NPK displays in history list
4. Test UI/UX elements
   - Field alignment and spacing
   - Keyboard behavior
   - Error states

**Deliverables:**
- Test results in `QA_RESULTS_NPK.log`
- Screenshots of any issues found
- Performance metrics

---

### Agent 2: Persistence Testing Specialist
**Focus:** AsyncStorage and data persistence
**Duration:** 60 minutes

**Tasks:**
1. Test data persistence across app restarts
   - Save preferences, kill app, restart, verify
   - Test with multiple data sets
2. Verify storage key structure
   - Check AsyncStorage keys format
   - Validate data structure in storage
3. Test preference updates
   - Change preferences multiple times
   - Verify only latest values persist
4. Test data migration scenarios
   - Existing data compatibility
   - Storage cleanup

**Test Scenarios:**
```typescript
// Test data set
Plant 1: { lastKind: 'รดน้ำ', lastUnit: 'ml', lastQty: '250' }
Plant 2: { lastKind: 'ใส่ปุ๋ย', lastUnit: 'g', lastQty: '10', lastNPK: {n:'15', p:'15', k:'15'} }
Plant 3: { lastKind: 'พ่นยา', lastUnit: 'ml', lastQty: '50' }
```

**Deliverables:**
- Persistence test report
- AsyncStorage data dumps
- Cross-session verification logs

---

### Agent 3: Integration & Edge Cases Specialist
**Focus:** Form pre-fill and edge cases
**Duration:** 45 minutes

**Tasks:**
1. Test form pre-fill functionality
   - Verify correct values load
   - Test timing of pre-fill
   - Check all field types
2. Test per-plant preference isolation
   - Confirm Plant A preferences don't affect Plant B
   - Test with 5+ different plants
3. Edge case testing
   - First-time plant (no preferences)
   - Empty/null values
   - Activity type switching
   - Invalid data handling
4. Performance testing
   - Form load time < 500ms
   - Save operation < 200ms
   - No UI freezing

**Edge Cases to Test:**
- Switch from "ใส่ปุ๋ย" to "รดน้ำ" (NPK clear)
- Very long quantity values
- Special characters in NPK
- Rapid activity switching
- Concurrent saves

**Deliverables:**
- Edge case test matrix
- Performance benchmarks
- Integration test results

---

## 🔄 TESTING WORKFLOW

### Phase 1: Individual Testing (17:35-18:20)
Each agent executes assigned tests independently

### Phase 2: Cross-validation (18:20-18:30)
Agents verify each other's critical findings

### Phase 3: Final Report (18:30-18:35)
Consolidated QA report submission

---

## 📊 REPORTING FORMAT

Each agent must report using this structure:

```markdown
## Agent [Number] - [Specialty] Report
**Time:** [Timestamp]
**Test Coverage:** [X/Y test cases]
**Pass Rate:** [X%]

### ✅ PASSED Tests
- [Test ID]: [Description]

### ❌ FAILED Tests
- [Test ID]: [Description]
  - Expected: [What should happen]
  - Actual: [What happened]
  - Severity: [Critical/High/Medium/Low]
  - Evidence: [Screenshot/Log reference]

### ⚠️ WARNINGS
- [Issue description and impact]

### 📈 Performance Metrics
- [Metric]: [Value]
```

---

## 🚨 CRITICAL FOCUS AREAS

1. **NPK Field Conditional Logic** - MUST work perfectly
2. **Data Persistence** - No data loss scenarios
3. **Per-plant Isolation** - Zero cross-contamination
4. **Form Pre-fill** - Accurate and fast
5. **TypeScript Compliance** - No type errors

---

## 🎯 SUCCESS CRITERIA

Sprint 3 QA passes if:
- ✅ 100% of critical tests pass
- ✅ 95%+ overall test pass rate
- ✅ Zero data persistence issues
- ✅ Performance within benchmarks
- ✅ No TypeScript errors

---

## 📝 FINAL DELIVERABLES

By 18:35, submit:
1. Individual agent reports
2. Consolidated QA summary
3. Bug list with priorities
4. Performance metrics dashboard
5. Recommendation for production readiness

---

**QA TESTING BEGINS AT 17:35 - Agents standby for execution signal!**