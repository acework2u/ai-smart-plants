# Sprint 3 QA Test Plan: Activity NPK & Persistence
## Smart Plant AI App

**Version:** 1.0
**Date:** September 17, 2025
**Sprint:** 3 (Activity NPK & Persistence)
**Platform:** Mac OS M4
**Testing Environment:** iOS Simulator & Android Emulator
**Build Type:** Expo Development Build

---

## 📋 **Test Scope Overview**

This test plan covers the comprehensive testing of Sprint 3 features focusing on:
- NPK form field conditional display and validation
- AsyncStorage persistence functionality
- Form pre-fill capabilities with plant-specific preferences
- Activity logging with enhanced data capture
- Edge case handling and error management

---

## 🎯 **Test Objectives**

1. **Validate NPK Implementation** - Verify NPK fields appear only for fertilizer activities with proper validation
2. **Confirm Data Persistence** - Ensure all user data persists across app restarts and sessions
3. **Test Form Pre-fill** - Validate accurate restoration of previous user inputs per plant
4. **Verify Isolation** - Confirm each plant maintains independent preferences
5. **Test Edge Cases** - Cover empty states, first-time usage, and error scenarios
6. **Performance Validation** - Ensure responsive UI and smooth data operations

---

## 🛠 **Test Environment Setup**

### **Hardware Requirements**
- Mac OS M4 (Primary testing platform)
- iOS Simulator (iOS 16.0+)
- Android Emulator (API 33+)
- Minimum 8GB RAM for smooth testing

### **Software Setup**
```bash
# Start Expo development server
npx expo start

# Launch iOS Simulator
npx expo run:ios -d

# Launch Android Emulator
npx expo run:android -d
```

### **Pre-test Data Setup**
1. Install fresh app build
2. Complete onboarding flow
3. Add at least 3 test plants to garden
4. Ensure clean AsyncStorage (no previous test data)

---

## 📝 **Test Data Requirements**

### **Test Plants**
- **Plant A:** "Monstera Deliciosa" (Healthy status)
- **Plant B:** "Fiddle Leaf Fig" (Warning status)
- **Plant C:** "Snake Plant" (Critical status)

### **NPK Test Values**
- **Set 1:** N:10, P:15, K:20 (balanced)
- **Set 2:** N:20, P:5, K:10 (nitrogen-rich)
- **Set 3:** N:0, P:0, K:0 (empty/zero values)
- **Set 4:** N:999, P:999, K:999 (maximum values)

### **Quantity Test Values**
- Standard: 200ml, 500ml, 1L, 10g, 25g
- Edge cases: 0.1ml, 9999ml, empty, non-numeric

### **Activity Types**
- รดน้ำ (Watering) - Expected units: ml, ล.
- ใส่ปุ๋ย (Fertilizing) - Expected units: g, ml + NPK fields
- พ่นยา (Spraying) - Expected units: ml, g
- ย้ายกระถาง (Repotting) - Expected units: pcs
- ตรวจใบ (Leaf inspection) - No quantity/units

---

## 🧪 **Detailed Test Cases**

### **TC-NPK-01: NPK Field Conditional Display**
**Test ID:** TC-NPK-01
**Priority:** Critical
**Description:** Verify NPK fields show only for fertilizer activities

**Prerequisites:**
- App launched and navigated to any plant detail page
- Activity form opened

**Test Steps:**
1. Open activity form for any plant
2. Select each activity type in sequence:
   - รดน้ำ (Watering)
   - ใส่ปุ๋ย (Fertilizing)
   - พ่นยา (Spraying)
   - ย้ายกระถาง (Repotting)
   - ตรวจใบ (Leaf inspection)
3. For each selection, observe NPK section visibility

**Expected Results:**
- NPK fields visible ONLY when "ใส่ปุ๋ย" (Fertilizing) is selected
- NPK section completely hidden for all other activity types
- Three input fields labeled N, P, K with placeholder "0"
- Section title shows "ค่า NPK (ไม่บังคับ)"

**Pass Criteria:** ✅ NPK fields appear exclusively for fertilizer activity
**Fail Criteria:** ❌ NPK fields visible for non-fertilizer activities OR missing for fertilizer

---

### **TC-NPK-02: NPK Data Validation**
**Test ID:** TC-NPK-02
**Priority:** High
**Description:** Validate NPK input field data validation rules

**Prerequisites:**
- Activity form open with "ใส่ปุ๋ย" selected
- NPK fields visible

**Test Steps:**
1. Test valid numeric inputs:
   - Enter "10" in N field
   - Enter "15.5" in P field
   - Enter "20" in K field
2. Test invalid inputs:
   - Enter "abc" in N field
   - Enter "-5" in P field
   - Enter "10.5.5" in K field
3. Test boundary values:
   - Enter "0" in all fields
   - Enter "999" in all fields
   - Leave fields empty
4. Attempt to submit form with each input scenario

**Expected Results:**
- Valid numeric values accepted without error
- Invalid characters rejected or show validation error
- Negative numbers handled appropriately
- Empty fields accepted (optional nature)
- Form submission proceeds with valid data only

**Pass Criteria:** ✅ All validation rules enforced correctly
**Fail Criteria:** ❌ Invalid data accepted OR valid data rejected

---

### **TC-PERSIST-01: Basic Persistence Functionality**
**Test ID:** TC-PERSIST-01
**Priority:** Critical
**Description:** Verify activity data persists across app sessions

**Prerequisites:**
- Fresh app installation with sample plants added

**Test Steps:**
1. Navigate to Plant A activity form
2. Create activity with full data:
   - Type: "ใส่ปุ๋ย"
   - Quantity: "25"
   - Unit: "g"
   - NPK: N:10, P:15, K:20
   - Note: "Test fertilizer application"
3. Submit and confirm activity saved
4. Force close app completely
5. Relaunch app and navigate to Plant A
6. Check activity history for saved entry

**Expected Results:**
- Activity appears in history with all data intact
- NPK values correctly displayed as "N:10 P:15 K:20"
- All metadata preserved (date, time, note)

**Pass Criteria:** ✅ Complete activity data persists after app restart
**Fail Criteria:** ❌ Data loss OR corruption after restart

---

### **TC-PERSIST-02: Cross-Session Form Pre-fill**
**Test ID:** TC-PERSIST-02
**Priority:** High
**Description:** Verify form pre-fills with last used values per plant

**Prerequisites:**
- Multiple plants in garden with no previous activity history

**Test Steps:**
1. **Plant A Setup:**
   - Open activity form for Plant A
   - Select "รดน้ำ", enter "500ml"
   - Submit activity
2. **Plant B Setup:**
   - Open activity form for Plant B
   - Select "ใส่ปุ๋ย", enter "10g", NPK: N:5, P:10, K:15
   - Submit activity
3. **Plant C Setup:**
   - Open activity form for Plant C
   - Select "ตรวจใบ", add note "Weekly inspection"
   - Submit activity
4. **Force restart app**
5. **Verification Phase:**
   - Open Plant A activity form → Check pre-filled values
   - Open Plant B activity form → Check pre-filled values
   - Open Plant C activity form → Check pre-filled values

**Expected Results:**
- Plant A: Pre-fills with "รดน้ำ", quantity "500", unit "ml"
- Plant B: Pre-fills with "ใส่ปุ๋ย", quantity "10", unit "g", NPK values restored
- Plant C: Pre-fills with "ตรวจใบ", note field restored

**Pass Criteria:** ✅ Each plant correctly restores its last activity preferences
**Fail Criteria:** ❌ Wrong values OR missing pre-fill data

---

### **TC-ISOLATE-01: Per-Plant Preference Isolation**
**Test ID:** TC-ISOLATE-01
**Priority:** High
**Description:** Confirm plants maintain independent preference isolation

**Prerequisites:**
- At least 3 plants available in garden

**Test Steps:**
1. **Configure Plant A preferences:**
   - Activity: "รดน้ำ"
   - Preferred unit: "ml"
   - Quantity: "200"
2. **Configure Plant B preferences:**
   - Activity: "ใส่ปุ๋ย"
   - Preferred unit: "g"
   - Quantity: "15"
   - NPK: N:8, P:12, K:16
3. **Configure Plant C preferences:**
   - Activity: "พ่นยา"
   - Preferred unit: "ml"
   - Quantity: "50"
4. **Cross-verification:**
   - Return to Plant A → Verify only Plant A preferences shown
   - Return to Plant B → Verify only Plant B preferences shown
   - Return to Plant C → Verify only Plant C preferences shown
5. **Modify Plant B preferences and verify others unchanged**

**Expected Results:**
- Each plant shows only its own stored preferences
- Modifying one plant's preferences doesn't affect others
- No cross-contamination of data between plants

**Pass Criteria:** ✅ Complete isolation maintained between all plants
**Fail Criteria:** ❌ Any cross-contamination of preferences detected

---

### **TC-EDGE-01: Empty Field Handling**
**Test ID:** TC-EDGE-01
**Priority:** Medium
**Description:** Test graceful handling of empty/null field scenarios

**Prerequisites:**
- Activity form open for any plant

**Test Steps:**
1. **Empty quantity scenarios:**
   - Select "รดน้ำ" but leave quantity empty
   - Attempt submission
2. **Empty NPK scenarios:**
   - Select "ใส่ปุ๋ย"
   - Leave all NPK fields empty
   - Attempt submission
3. **Partial NPK data:**
   - Enter only N value, leave P and K empty
   - Attempt submission
4. **Empty note field:**
   - Submit activity with empty note
5. **Complete empty form:**
   - Leave all optional fields empty
   - Submit with only activity type selected

**Expected Results:**
- Required fields prevent submission with clear error message
- Optional empty fields accepted gracefully
- Partial NPK data saved correctly
- No app crashes with empty inputs

**Pass Criteria:** ✅ All empty field scenarios handled gracefully
**Fail Criteria:** ❌ App crashes OR unclear error states

---

### **TC-EDGE-02: First-Time Plant Usage**
**Test ID:** TC-EDGE-02
**Priority:** Medium
**Description:** Verify clean behavior for plants with no activity history

**Prerequisites:**
- Fresh plant added to garden with zero activity history

**Test Steps:**
1. Navigate to new plant detail page
2. Open activity form
3. Verify default state:
   - Check default activity type
   - Check default units
   - Check empty quantity fields
   - Check empty NPK fields
4. Submit first activity for this plant
5. Immediately reopen form
6. Verify new preferences now pre-filled

**Expected Results:**
- Form opens with sensible defaults (รดน้ำ, ml unit)
- No errors with empty preference state
- After first submission, preferences immediately available
- Smooth transition from empty to populated state

**Pass Criteria:** ✅ Clean first-time experience with immediate preference learning
**Fail Criteria:** ❌ Errors on first use OR preferences not saved after first activity

---

### **TC-EDGE-03: Activity Type Switching**
**Test ID:** TC-EDGE-03
**Priority:** Medium
**Description:** Test behavior when switching between activity types during form entry

**Prerequisites:**
- Activity form open with existing data entered

**Test Steps:**
1. **Start with Watering:**
   - Select "รดน้ำ"
   - Enter quantity "300ml"
2. **Switch to Fertilizing:**
   - Change to "ใส่ปุ๋ย"
   - Observe quantity and unit behavior
   - Enter NPK values: N:10, P:15, K:20
3. **Switch to Inspection:**
   - Change to "ตรวจใบ"
   - Observe all field behavior
4. **Switch back to Fertilizing:**
   - Change back to "ใส่ปุ๋ย"
   - Check if NPK values preserved
5. **Submit final activity and verify data integrity**

**Expected Results:**
- Appropriate fields show/hide when switching types
- Previously entered data preserved when returning to activity type
- No data corruption during type switches
- Final submission contains correct data for selected type

**Pass Criteria:** ✅ Smooth activity type transitions with data preservation
**Fail Criteria:** ❌ Data loss during switching OR incorrect field visibility

---

### **TC-PERFORM-01: Performance Benchmarks**
**Test ID:** TC-PERFORM-01
**Priority:** Medium
**Description:** Validate app performance meets acceptable standards

**Prerequisites:**
- Multiple plants with extensive activity history (20+ activities per plant)

**Test Steps:**
1. **Form Loading Speed:**
   - Time activity form opening from plant detail
   - Record pre-fill load time
   - Target: < 500ms
2. **Data Persistence Speed:**
   - Time activity submission and storage
   - Target: < 200ms
3. **Memory Usage:**
   - Monitor memory consumption during extended form usage
   - Check for memory leaks after multiple submissions
4. **Background/Foreground Handling:**
   - Submit activity, background app, foreground app
   - Verify no data loss or corruption
5. **Large Dataset Handling:**
   - Test with plant having 100+ activity records
   - Verify form performance remains acceptable

**Expected Results:**
- Form opens within 500ms even with large datasets
- Data operations complete within 200ms
- No memory leaks during extended usage
- Stable performance with large activity histories

**Pass Criteria:** ✅ All performance targets met consistently
**Fail Criteria:** ❌ Performance degrades below acceptable thresholds

---

## 🚨 **Edge Case Test Scenarios**

### **Scenario 1: Network Interruption During Save**
**Setup:** Enable airplane mode during activity submission
**Expected:** Graceful offline handling, data queued for sync when online

### **Scenario 2: App Force-Kill During Data Entry**
**Setup:** Force terminate app while typing in form
**Expected:** Partial data recovery on restart OR clean slate with no corruption

### **Scenario 3: Storage Permission Revoked**
**Setup:** Manually revoke storage permissions
**Expected:** Clear error message with guidance to re-enable permissions

### **Scenario 4: Maximum Storage Limit**
**Setup:** Fill device storage to near capacity
**Expected:** Graceful degradation with user notification

### **Scenario 5: Rapid Consecutive Submissions**
**Setup:** Submit multiple activities rapidly
**Expected:** All submissions processed correctly without race conditions

---

## ✅ **Acceptance Criteria Verification**

### **Primary Criteria**
- [ ] NPK fields conditionally display only for fertilizer activities
- [ ] NPK data validation enforces numeric input with max 3 digits
- [ ] All activity data persists across app restarts
- [ ] Form pre-fills accurately with last used values per plant
- [ ] Each plant maintains isolated preferences
- [ ] No TypeScript compilation errors
- [ ] Performance benchmarks met on target platform

### **Secondary Criteria**
- [ ] Graceful handling of all edge cases
- [ ] Clear error messages for validation failures
- [ ] Smooth animations and transitions
- [ ] Accessibility support maintained
- [ ] Memory usage remains optimal

---

## 📊 **Test Execution Checklist**

### **Pre-Test Setup** ⏰ (15 minutes)
- [ ] Fresh app build installed on test devices
- [ ] iOS Simulator configured and running
- [ ] Android Emulator configured and running
- [ ] Test data spreadsheet prepared
- [ ] Screen recording tools ready

### **Core NPK Testing** ⏰ (45 minutes)
- [ ] TC-NPK-01: Conditional display verification
- [ ] TC-NPK-02: Data validation testing
- [ ] NPK field behavior documentation
- [ ] Screenshot evidence captured

### **Persistence Testing** ⏰ (60 minutes)
- [ ] TC-PERSIST-01: Basic persistence verification
- [ ] TC-PERSIST-02: Cross-session pre-fill testing
- [ ] Multiple app restart cycles tested
- [ ] Data integrity verified

### **Isolation Testing** ⏰ (45 minutes)
- [ ] TC-ISOLATE-01: Per-plant preference isolation
- [ ] Cross-contamination testing
- [ ] Multi-plant workflow verification

### **Edge Case Testing** ⏰ (90 minutes)
- [ ] TC-EDGE-01: Empty field handling
- [ ] TC-EDGE-02: First-time plant usage
- [ ] TC-EDGE-03: Activity type switching
- [ ] Error scenario documentation

### **Performance Testing** ⏰ (30 minutes)
- [ ] TC-PERFORM-01: Performance benchmarks
- [ ] Memory usage monitoring
- [ ] Load time measurements
- [ ] Performance report generation

### **Final Verification** ⏰ (15 minutes)
- [ ] All test cases executed
- [ ] Results documented
- [ ] Critical bugs identified and reported
- [ ] Test summary completed

**Total Estimated Time:** 5 hours

---

## 🐛 **Issue Reporting Template**

### **Bug Report Format**
```
**Bug ID:** BUG-NPK-001
**Severity:** Critical/High/Medium/Low
**Priority:** P1/P2/P3/P4

**Summary:** [Brief description]

**Environment:**
- Device: [iOS Simulator/Android Emulator/Physical Device]
- OS Version: [iOS 16.4/Android 13]
- App Build: [Development Build v1.0]

**Prerequisites:**
- [Setup conditions]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Evidence:**
- Screenshots: [Attached]
- Video: [Link if available]
- Logs: [Console output if relevant]

**Impact:**
[User impact description]

**Workaround:**
[Temporary solution if available]
```

### **Test Result Categories**
- **🟢 PASS** - Test case executed successfully, meets all criteria
- **🟡 PASS WITH NOTES** - Test passes but has minor observations
- **🔴 FAIL** - Test case fails to meet acceptance criteria
- **⚪ BLOCKED** - Cannot execute due to dependency or environment issue
- **🔵 SKIP** - Intentionally skipped (with justification)

---

## 📈 **Success Metrics**

### **Quality Gates**
- **Zero Critical Bugs** - No P1 severity issues in core functionality
- **95% Test Pass Rate** - Maximum 5% acceptable failure rate for edge cases
- **Performance Targets Met** - All timing benchmarks achieved
- **Data Integrity Maintained** - Zero data corruption incidents

### **Feature Completion Metrics**
- NPK Implementation: 100% functional
- Persistence Layer: 100% reliable
- Form Pre-fill: 100% accurate
- Plant Isolation: 100% verified

### **User Experience Metrics**
- Form load time: < 500ms average
- Data save time: < 200ms average
- Zero crashes during normal usage
- Intuitive error messaging

---

## 🎯 **Test Completion Report Template**

```markdown
# Sprint 3 QA Test Execution Report

**Date:** [Execution Date]
**Tester:** [QA Engineer Name]
**Build Version:** [App Build Number]
**Total Test Cases:** 8 Core + 5 Edge Cases
**Execution Time:** [Actual Time Taken]

## Summary Results
- ✅ Passed: X/13 test cases
- 🔴 Failed: X/13 test cases
- ⚪ Blocked: X/13 test cases
- **Overall Pass Rate:** XX%

## Critical Issues Found
[List any P1/P2 severity issues]

## Recommendations
[QA recommendations for release readiness]

## Appendix
- Screenshots: [Link to evidence folder]
- Performance Data: [Benchmark results]
- Test Data Used: [Reference to test datasets]
```

---

**Document Version:** 1.0
**Last Updated:** September 17, 2025
**Next Review:** Post Sprint 3 completion
**Approved By:** Claude Code PM

---

*This comprehensive test plan ensures Sprint 3 deliverables meet production quality standards while maintaining the excellent user experience established in previous sprints.*