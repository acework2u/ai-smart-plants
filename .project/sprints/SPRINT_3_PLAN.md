# Sprint 3: Activity NPK & Persistence
## Date: Wednesday, September 17, 2025
## Duration: 3 hours
## Priority: Critical

---

## 🎯 Sprint Objectives
1. **NPK Form Fields** - Add nitrogen, phosphorus, potassium input fields for fertilizer activities
2. **AsyncStorage Persistence** - Implement data persistence for plant preferences and activity logs
3. **Per-Plant Preferences** - Store and restore last used values (kind, unit, quantity, NPK)
4. **Form State Management** - Pre-fill forms with saved preferences

---

## 📋 Execution Plan

### Step 3.1: NPK Form Fields Implementation (1 hour)
**Target File:** `app/activity/[id].tsx`

#### Tasks:
1. Add NPK state management
```typescript
const [npk, setNpk] = useState<NPK>({ n: '', p: '', k: '' });
```

2. Conditional NPK rendering when kind === 'ใส่ปุ๋ย'
```typescript
{kind === 'ใส่ปุ๋ย' && (
  <View style={styles.npkContainer}>
    <Text style={styles.npkTitle}>ค่า NPK</Text>
    <View style={styles.npkRow}>
      <TextInput
        placeholder="N (%)"
        value={npk.n}
        onChangeText={(text) => setNpk(prev => ({...prev, n: text}))}
        keyboardType="numeric"
        style={styles.npkInput}
      />
      <TextInput
        placeholder="P (%)"
        value={npk.p}
        onChangeText={(text) => setNpk(prev => ({...prev, p: text}))}
        keyboardType="numeric"
        style={styles.npkInput}
      />
      <TextInput
        placeholder="K (%)"
        value={npk.k}
        onChangeText={(text) => setNpk(prev => ({...prev, k: text}))}
        keyboardType="numeric"
        style={styles.npkInput}
      />
    </View>
  </View>
)}
```

3. Include NPK in activity entry save
4. Display NPK values in activity history list

**Validation:**
- NPK fields appear only for fertilizer
- Values save correctly to activity log
- Historical NPK values display in list

---

### Step 3.2: AsyncStorage Persistence Layer (1.5 hours)
**Target Files:**
- `stores/prefsStore.ts` (new)
- `core/storage.ts` (update)

#### Tasks:
1. Create PrefsStore for plant preferences
```typescript
// stores/prefsStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlantPrefs {
  lastKind?: ActivityKind;
  lastUnit?: Unit;
  lastQty?: string;
  lastNPK?: NPK;
}

interface PrefsStore {
  plantPrefs: Record<string, PlantPrefs>;
  setPlantPrefs: (plantId: string, prefs: PlantPrefs) => void;
  getPlantPrefs: (plantId: string) => PlantPrefs | undefined;
}

export const usePrefsStore = create<PrefsStore>()(
  persist(
    (set, get) => ({
      plantPrefs: {},
      setPlantPrefs: (plantId, prefs) =>
        set((state) => ({
          plantPrefs: {
            ...state.plantPrefs,
            [plantId]: prefs,
          },
        })),
      getPlantPrefs: (plantId) => get().plantPrefs[plantId],
    }),
    {
      name: '@spa/plantPrefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

2. Update storage helper for key management
```typescript
// core/storage.ts
export const STORAGE_KEYS = {
  PLANTS: '@spa/plants',
  ACTIVITIES: '@spa/activities',
  NOTIFICATIONS: '@spa/noti',
  ONBOARDING: '@spa/onboardingSeen',
  NOTI_FILTER: '@spa/notiFilter',
  PLANT_PREFS: '@spa/plantPrefs',
} as const;
```

**Validation:**
- PrefsStore saves to AsyncStorage
- Data persists across app restarts
- Keys follow naming convention

---

### Step 3.3: Form Pre-fill Integration (30 minutes)
**Target File:** `app/activity/[id].tsx`

#### Tasks:
1. Load preferences on mount
```typescript
useEffect(() => {
  const prefs = usePrefsStore.getState().getPlantPrefs(plantId);
  if (prefs) {
    setKind(prefs.lastKind || 'รดน้ำ');
    setUnit(prefs.lastUnit || 'ml');
    setQuantity(prefs.lastQty || '');
    if (prefs.lastNPK) {
      setNpk(prefs.lastNPK);
    }
  }
}, [plantId]);
```

2. Save preferences on form submit
```typescript
const handleSave = () => {
  // Save activity entry
  const entry: ActivityEntry = {
    id: generateId(),
    plantId,
    kind,
    quantity,
    unit,
    npk: kind === 'ใส่ปุ๋ย' ? npk : undefined,
    note,
    dateISO: date.toISOString().split('T')[0],
    time24: time,
  };

  // Save preferences
  usePrefsStore.getState().setPlantPrefs(plantId, {
    lastKind: kind,
    lastUnit: unit,
    lastQty: quantity,
    lastNPK: kind === 'ใส่ปุ๋ย' ? npk : undefined,
  });

  // Add to activity store
  useActivityStore.getState().addEntry(entry);
};
```

**Validation:**
- Form pre-fills with last used values
- Different plants maintain separate preferences
- NPK values restore for fertilizer activities

---

## 🔍 Testing Checklist

### Functional Tests:
- [ ] NPK fields show/hide based on activity kind
- [ ] NPK values save with activity entry
- [ ] Plant preferences persist to AsyncStorage
- [ ] Form pre-fills on return visits
- [ ] Different plants have independent preferences
- [ ] App restart maintains all saved data

### Edge Cases:
- [ ] Empty NPK fields handle gracefully
- [ ] First-time plant has no pre-fill errors
- [ ] Switching activity kinds clears/shows NPK
- [ ] Large quantity values display correctly

### Performance:
- [ ] Form loads quickly with preferences
- [ ] AsyncStorage operations are async
- [ ] No UI blocking during saves

---

## 📊 Success Metrics
1. **NPK Implementation** - Fields functional, conditional display working
2. **Data Persistence** - All preferences save to AsyncStorage
3. **User Experience** - Form remembers last inputs per plant
4. **Code Quality** - TypeScript types, no errors, clean structure

---

## 🚀 Execution Timeline

| Time | Task | Status |
|------|------|--------|
| 14:35-15:35 | Step 3.1: NPK Form Fields | 🔄 Starting |
| 15:35-17:05 | Step 3.2: AsyncStorage Setup | ⏳ Pending |
| 17:05-17:35 | Step 3.3: Form Integration | ⏳ Pending |
| 17:35-17:45 | Testing & Validation | ⏳ Pending |

---

## 💡 Implementation Notes
- Use Mac M4 optimized AsyncStorage operations
- Ensure TypeScript strict mode compliance
- Follow existing code patterns in activity screen
- Test on both iOS and Android simulators
- Consider migration path for existing data

---

## 🎯 Deliverables
1. Working NPK input fields for fertilizer
2. Complete AsyncStorage persistence layer
3. Form pre-fill with saved preferences
4. All tests passing
5. Updated SPRINT_STATUS.log with completion

---

**Ready to execute Sprint 3! 🚀**