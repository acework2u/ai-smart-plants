# 🚀 Codex CLI - Sprint 3 Full Execution Command
## Activity NPK & Persistence Implementation

---

## 📋 EXECUTION PARAMETERS
**Assigned to:** Codex CLI (GPT-5)
**Controller:** Claude Code PM
**Start Time:** NOW (15:00)
**End Time:** 18:00 (3 hours)
**Platform:** Mac OS M4
**Priority:** CRITICAL

---

## 🎯 MISSION OBJECTIVE
Implement complete NPK form fields and AsyncStorage persistence system for Smart Plant AI activity tracking. This sprint is essential for user data persistence and fertilizer activity support.

---

## 📝 DETAILED EXECUTION STEPS

### STEP 3.1: NPK Form Fields Implementation (15:00-16:00)
**Target File:** `app/activity/[id].tsx`
**Duration:** 60 minutes

#### Code Implementation:

```typescript
// 1. ADD IMPORTS (top of file)
import { NPK } from '@/features/activity/types';

// 2. ADD STATE (after existing useState declarations, around line 35)
const [npk, setNpk] = useState<NPK>({ n: '', p: '', k: '' });

// 3. RESET NPK WHEN ACTIVITY CHANGES (add useEffect)
useEffect(() => {
  if (kind !== 'ใส่ปุ๋ย') {
    setNpk({ n: '', p: '', k: '' });
  }
}, [kind]);

// 4. ADD NPK UI SECTION (after quantity/unit section, around line 180)
{kind === 'ใส่ปุ๋ย' && (
  <View style={styles.npkContainer}>
    <Text style={styles.sectionTitle}>ค่า NPK (%)</Text>
    <View style={styles.npkRow}>
      <View style={styles.npkInputContainer}>
        <Text style={styles.npkLabel}>N</Text>
        <TextInput
          style={styles.npkInput}
          placeholder="0"
          value={npk.n}
          onChangeText={(text) => setNpk(prev => ({...prev, n: text}))}
          keyboardType="numeric"
          maxLength={3}
        />
      </View>
      <View style={styles.npkInputContainer}>
        <Text style={styles.npkLabel}>P</Text>
        <TextInput
          style={styles.npkInput}
          placeholder="0"
          value={npk.p}
          onChangeText={(text) => setNpk(prev => ({...prev, p: text}))}
          keyboardType="numeric"
          maxLength={3}
        />
      </View>
      <View style={styles.npkInputContainer}>
        <Text style={styles.npkLabel}>K</Text>
        <TextInput
          style={styles.npkInput}
          placeholder="0"
          value={npk.k}
          onChangeText={(text) => setNpk(prev => ({...prev, k: text}))}
          keyboardType="numeric"
          maxLength={3}
        />
      </View>
    </View>
    <Text style={styles.npkHint}>
      ระบุเปอร์เซ็นต์ธาตุอาหาร (ตัวอย่าง: 15-15-15)
    </Text>
  </View>
)}

// 5. UPDATE STYLES (add to StyleSheet)
npkContainer: {
  marginTop: 16,
  padding: 16,
  backgroundColor: '#f9fafb',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},
npkRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 8,
},
npkInputContainer: {
  flex: 1,
  marginHorizontal: 4,
  alignItems: 'center',
},
npkLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#374151',
  marginBottom: 4,
},
npkInput: {
  backgroundColor: 'white',
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
  textAlign: 'center',
  width: '100%',
  minHeight: 48,
},
npkHint: {
  fontSize: 12,
  color: '#6b7280',
  fontStyle: 'italic',
  marginTop: 8,
  textAlign: 'center',
},

// 6. UPDATE SAVE FUNCTION (modify handleSave)
const handleSave = () => {
  const entry: ActivityEntry = {
    id: generateId(),
    plantId,
    kind,
    quantity,
    unit,
    npk: kind === 'ใส่ปุ๋ย' ? npk : undefined, // ADD THIS LINE
    note,
    dateISO: selectedDate.toISOString().split('T')[0],
    time24: selectedTime,
  };

  // ... rest of existing save logic
};
```

#### Validation Checklist:
- [ ] NPK fields appear ONLY for "ใส่ปุ๋ย"
- [ ] Fields accept numeric input (0-999)
- [ ] NPK clears when switching away from fertilizer
- [ ] UI looks polished and aligned
- [ ] Save includes NPK data

---

### STEP 3.2: AsyncStorage Persistence Store (16:00-17:30)
**Target:** Create `stores/prefsStore.ts`
**Duration:** 90 minutes

#### Create New File: `stores/prefsStore.ts`

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
  lastNote?: string;
}

interface PrefsStore {
  plantPrefs: Record<string, PlantPrefs>;
  setPlantPrefs: (plantId: string, prefs: PlantPrefs) => void;
  getPlantPrefs: (plantId: string) => PlantPrefs | undefined;
  updatePlantPrefs: (plantId: string, prefs: Partial<PlantPrefs>) => void;
  clearPlantPrefs: (plantId: string) => void;
  clearAllPrefs: () => void;
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

      updatePlantPrefs: (plantId, prefs) =>
        set((state) => ({
          plantPrefs: {
            ...state.plantPrefs,
            [plantId]: {
              ...state.plantPrefs[plantId],
              ...prefs,
            },
          },
        })),

      clearPlantPrefs: (plantId) =>
        set((state) => {
          const newPrefs = { ...state.plantPrefs };
          delete newPrefs[plantId];
          return { plantPrefs: newPrefs };
        }),

      clearAllPrefs: () => set({ plantPrefs: {} }),
    }),
    {
      name: '@spa/plantPrefs',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from old format if needed
          return persistedState;
        }
        return persistedState;
      },
    }
  )
);

// Selector hooks for performance
export const usePlantPrefs = (plantId: string) =>
  usePrefsStore((state) => state.getPlantPrefs(plantId));

export const useSetPlantPrefs = () =>
  usePrefsStore((state) => state.setPlantPrefs);
```

#### Update: `core/storage.ts`

```typescript
// ADD to existing STORAGE_KEYS
export const STORAGE_KEYS = {
  PLANTS: '@spa/plants',
  ACTIVITIES: '@spa/activities',
  NOTIFICATIONS: '@spa/noti',
  ONBOARDING: '@spa/onboardingSeen',
  NOTI_FILTER: '@spa/notiFilter',
  PLANT_PREFS: '@spa/plantPrefs', // ADD THIS
} as const;

// ADD helper function
export const clearPlantData = async (plantId: string) => {
  try {
    await AsyncStorage.removeItem(`${STORAGE_KEYS.PLANT_PREFS}:${plantId}`);
  } catch (error) {
    console.error('Failed to clear plant data:', error);
  }
};
```

#### Validation Checklist:
- [ ] Store creates without errors
- [ ] Data persists to AsyncStorage
- [ ] Selectors work properly
- [ ] Migration system in place

---

### STEP 3.3: Form Pre-fill Integration (17:30-18:00)
**Target File:** `app/activity/[id].tsx`
**Duration:** 30 minutes

#### Integration Code:

```typescript
// 1. ADD IMPORT
import { usePrefsStore, usePlantPrefs } from '@/stores/prefsStore';

// 2. ADD HOOKS (after existing hooks)
const plantPrefs = usePlantPrefs(plantId);
const setPlantPrefs = useSetPlantPrefs();

// 3. LOAD PREFERENCES ON MOUNT (add after other useEffects)
useEffect(() => {
  if (plantPrefs) {
    if (plantPrefs.lastKind) setKind(plantPrefs.lastKind);
    if (plantPrefs.lastUnit) setUnit(plantPrefs.lastUnit);
    if (plantPrefs.lastQty) setQuantity(plantPrefs.lastQty);
    if (plantPrefs.lastNote) setNote(plantPrefs.lastNote);
    if (plantPrefs.lastNPK && plantPrefs.lastKind === 'ใส่ปุ๋ย') {
      setNpk(plantPrefs.lastNPK);
    }
  }
}, [plantId, plantPrefs]);

// 4. UPDATE SAVE FUNCTION (modify handleSave)
const handleSave = () => {
  // Create activity entry
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

  // Save to activity store
  useActivityStore.getState().addEntry(entry);

  // Save preferences for this plant
  setPlantPrefs(plantId, {
    lastKind: kind,
    lastUnit: unit,
    lastQty: quantity,
    lastNote: note,
    lastNPK: kind === 'ใส่ปุ๋ย' ? npk : undefined,
  });

  // Show success feedback
  // haptic('success');

  // Navigate back
  router.back();
};

// 5. ADD CLEAR PREFERENCES BUTTON (optional enhancement)
const handleClearPrefs = () => {
  usePrefsStore.getState().clearPlantPrefs(plantId);
  // Reset form to defaults
  setKind('รดน้ำ');
  setUnit('ml');
  setQuantity('');
  setNote('');
  setNpk({ n: '', p: '', k: '' });
};
```

#### Validation Checklist:
- [ ] Form pre-fills with saved values
- [ ] Different plants have isolated preferences
- [ ] NPK values restore for fertilizer only
- [ ] Preferences save on form submit
- [ ] App restart maintains preferences

---

## 📊 PROGRESS REPORTING

Update every 30 minutes in `CODEX_STATUS.log`:

```bash
echo "=== CODEX SPRINT 3 PROGRESS ===" >> CODEX_STATUS.log
echo "Time: $(date +'%H:%M:%S')" >> CODEX_STATUS.log
echo "Current Step: [3.1/3.2/3.3]" >> CODEX_STATUS.log
echo "Progress: [X%]" >> CODEX_STATUS.log
echo "Status: [In Progress/Completed/Blocked]" >> CODEX_STATUS.log
echo "Next Action: [Description]" >> CODEX_STATUS.log
echo "Issues: [Any blockers]" >> CODEX_STATUS.log
echo "---" >> CODEX_STATUS.log
```

---

## 🧪 TESTING PROTOCOL

After each step:

```bash
# Type checking
npm run typecheck

# Build test
npx expo start --no-dev --minify

# Visual test scenarios:
# 1. Select "ใส่ปุ๋ย" → NPK fields appear
# 2. Switch to "รดน้ำ" → NPK fields hide
# 3. Enter NPK values → Save → Check activity list
# 4. Exit form → Re-enter → Values pre-filled
# 5. Test different plants → Separate preferences
```

---

## 🚨 ESCALATION PROTOCOL

**If Blocked:**
```bash
echo "BLOCKED: [Issue description]" >> ERRORS.log
echo "STEP: [3.1/3.2/3.3]" >> ERRORS.log
echo "FILE: [File being worked on]" >> ERRORS.log
echo "ERROR: [Specific error message]" >> ERRORS.log
echo "HELP_NEEDED: [What assistance required]" >> ERRORS.log
```

---

## ✅ COMPLETION CRITERIA

Sprint 3 is complete when:
- ✅ NPK fields conditional display works
- ✅ AsyncStorage persistence functional
- ✅ Form pre-fill working per plant
- ✅ Zero TypeScript errors
- ✅ All manual tests pass
- ✅ Performance acceptable (< 500ms loads)

---

**BEGIN EXECUTION IMMEDIATELY - Sprint 3 success is critical for user data functionality! 🚀**