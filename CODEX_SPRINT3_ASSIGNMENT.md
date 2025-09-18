# 📋 CODEX CLI - Sprint 3 Assignment
## Activity NPK & Persistence Implementation

---

## 🎯 ASSIGNMENT DETAILS
**Assigned to:** Codex CLI (GPT-5)
**Controller:** Claude Code PM
**Start Time:** 14:35, September 17, 2025
**End Time:** 17:35, September 17, 2025
**Platform:** Mac OS M4

---

## 📝 EXECUTION INSTRUCTIONS

### IMMEDIATE ACTION REQUIRED - Step 3.1: NPK Form Fields (NOW - 15:35)

**File to modify:** `app/activity/[id].tsx`

**Code to implement:**

```typescript
// 1. Add to imports
import { NPK } from '@/features/activity/types';

// 2. Add state (around line 30-40)
const [npk, setNpk] = useState<NPK>({ n: '', p: '', k: '' });

// 3. Add NPK container (after quantity/unit fields, around line 150)
{kind === 'ใส่ปุ๋ย' && (
  <View style={styles.npkContainer}>
    <Text style={styles.npkLabel}>ค่า NPK (%)</Text>
    <View style={styles.npkRow}>
      <TextInput
        style={styles.npkInput}
        placeholder="N"
        value={npk.n}
        onChangeText={(text) => setNpk(prev => ({...prev, n: text}))}
        keyboardType="numeric"
        maxLength={3}
      />
      <TextInput
        style={styles.npkInput}
        placeholder="P"
        value={npk.p}
        onChangeText={(text) => setNpk(prev => ({...prev, p: text}))}
        keyboardType="numeric"
        maxLength={3}
      />
      <TextInput
        style={styles.npkInput}
        placeholder="K"
        value={npk.k}
        onChangeText={(text) => setNpk(prev => ({...prev, k: text}))}
        keyboardType="numeric"
        maxLength={3}
      />
    </View>
  </View>
)}

// 4. Update handleSave to include NPK
const handleSave = () => {
  const entry: ActivityEntry = {
    id: generateId(),
    plantId,
    kind,
    quantity,
    unit,
    npk: kind === 'ใส่ปุ๋ย' ? npk : undefined, // Add this line
    note,
    dateISO: selectedDate.toISOString().split('T')[0],
    time24: selectedTime,
  };
  // ... rest of save logic
};

// 5. Add styles
npkContainer: {
  marginTop: 16,
  padding: 16,
  backgroundColor: '#f9fafb',
  borderRadius: 12,
},
npkLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#374151',
  marginBottom: 8,
},
npkRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},
npkInput: {
  flex: 1,
  backgroundColor: 'white',
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 8,
  padding: 12,
  marginHorizontal: 4,
  fontSize: 16,
  textAlign: 'center',
},
```

---

### Step 3.2: AsyncStorage Persistence (15:35 - 17:05)

**Create new file:** `stores/prefsStore.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ActivityKind, Unit, NPK } from '@/features/activity/types';

export interface PlantPrefs {
  lastKind?: ActivityKind;
  lastUnit?: Unit;
  lastQty?: string;
  lastNPK?: NPK;
}

interface PrefsStore {
  plantPrefs: Record<string, PlantPrefs>;
  setPlantPrefs: (plantId: string, prefs: PlantPrefs) => void;
  getPlantPrefs: (plantId: string) => PlantPrefs | undefined;
  clearPlantPrefs: (plantId: string) => void;
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

      clearPlantPrefs: (plantId) =>
        set((state) => {
          const newPrefs = { ...state.plantPrefs };
          delete newPrefs[plantId];
          return { plantPrefs: newPrefs };
        }),
    }),
    {
      name: '@spa/plantPrefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**Update:** `core/storage.ts`

```typescript
// Add to STORAGE_KEYS
export const STORAGE_KEYS = {
  PLANTS: '@spa/plants',
  ACTIVITIES: '@spa/activities',
  NOTIFICATIONS: '@spa/noti',
  ONBOARDING: '@spa/onboardingSeen',
  NOTI_FILTER: '@spa/notiFilter',
  PLANT_PREFS: '@spa/plantPrefs', // ADD THIS
} as const;
```

---

### Step 3.3: Form Pre-fill Integration (17:05 - 17:35)

**Update:** `app/activity/[id].tsx`

```typescript
// 1. Add import
import { usePrefsStore } from '@/stores/prefsStore';

// 2. Load preferences on mount (add after useState declarations)
useEffect(() => {
  const prefs = usePrefsStore.getState().getPlantPrefs(plantId);
  if (prefs) {
    if (prefs.lastKind) setKind(prefs.lastKind);
    if (prefs.lastUnit) setUnit(prefs.lastUnit);
    if (prefs.lastQty) setQuantity(prefs.lastQty);
    if (prefs.lastNPK && prefs.lastKind === 'ใส่ปุ๋ย') {
      setNpk(prefs.lastNPK);
    }
  }
}, [plantId]);

// 3. Update handleSave to save preferences
const handleSave = () => {
  // Create entry
  const entry: ActivityEntry = {
    id: generateId(),
    plantId,
    kind,
    quantity,
    unit,
    npk: kind === 'ใส่ปุ๋ย' ? npk : undefined,
    note,
    dateISO: selectedDate.toISOString().split('T')[0],
    time24: selectedTime,
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

  // Navigate back
  router.back();
};
```

---

## ✅ VALIDATION CHECKLIST

After each step, verify:

**Step 3.1 Checks:**
- [ ] NPK fields appear when selecting "ใส่ปุ๋ย"
- [ ] NPK fields hide for other activity types
- [ ] Can enter numeric values in N, P, K fields
- [ ] NPK saves with activity entry

**Step 3.2 Checks:**
- [ ] prefsStore.ts created and no TypeScript errors
- [ ] Storage keys updated in core/storage.ts
- [ ] Store exports working

**Step 3.3 Checks:**
- [ ] Form pre-fills with last used values
- [ ] Different plants have different preferences
- [ ] NPK values restore correctly
- [ ] Preferences persist after app restart

---

## 📊 PROGRESS REPORTING

Update every 30 minutes in `CODEX_STATUS.log`:

```bash
echo "STATUS: [In Progress/Completed/Blocked]" >> CODEX_STATUS.log
echo "CURRENT_TASK: Step 3.X - [Description]" >> CODEX_STATUS.log
echo "COMPLETION: [X%]" >> CODEX_STATUS.log
echo "NEXT_STEP: [What's next]" >> CODEX_STATUS.log
echo "TIME: $(date +'%H:%M')" >> CODEX_STATUS.log
echo "---" >> CODEX_STATUS.log
```

---

## 🚨 IF BLOCKED

Report immediately:
```bash
echo "ERROR: [Description]" >> ERRORS.log
echo "SPRINT: 3" >> ERRORS.log
echo "STEP: [Current step]" >> ERRORS.log
echo "FILE: [File path]" >> ERRORS.log
echo "NEED_HELP: [What assistance needed]" >> ERRORS.log
```

---

**START EXECUTION NOW - Report back at 15:00 with Step 3.1 progress!**