import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ActivityKind, Unit, NPK } from '@/types/activity';
import { STORAGE_KEYS } from '@/types';

export interface PlantPrefs {
  lastKind?: ActivityKind;
  lastUnit?: Unit;
  lastQty?: string;
  lastNPK?: NPK;
}

interface PrefsState {
  plantPrefs: Record<string, PlantPrefs>;
}

interface PrefsActions {
  getPlantPrefs: (plantId: string) => PlantPrefs | undefined;
  setPlantPrefs: (plantId: string, prefs: PlantPrefs) => void;
  updatePlantPrefs: (plantId: string, update: Partial<PlantPrefs>) => void;
  deletePlantPrefs: (plantId: string) => void;
  reset: () => void;
}

const initialState: PrefsState = {
  plantPrefs: {},
};

export const usePrefsStore = create<PrefsState & PrefsActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      getPlantPrefs: (plantId) => get().plantPrefs[plantId],

      setPlantPrefs: (plantId, prefs) => {
        set((state) => ({
          plantPrefs: {
            ...state.plantPrefs,
            [plantId]: prefs,
          },
        }));
      },

      updatePlantPrefs: (plantId, update) => {
        set((state) => ({
          plantPrefs: {
            ...state.plantPrefs,
            [plantId]: {
              ...(state.plantPrefs[plantId] ?? {}),
              ...update,
            },
          },
        }));
      },

      deletePlantPrefs: (plantId) => {
        set((state) => {
          const next = { ...state.plantPrefs };
          delete next[plantId];
          return { plantPrefs: next };
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEYS.PLANT_PREFS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ plantPrefs: state.plantPrefs }),
      version: 1,
    }
  )
);

export const prefsActions = {
  getPlantPrefs: (plantId: string) => usePrefsStore.getState().getPlantPrefs(plantId),
  setPlantPrefs: (plantId: string, prefs: PlantPrefs) =>
    usePrefsStore.getState().setPlantPrefs(plantId, prefs),
  updatePlantPrefs: (plantId: string, update: Partial<PlantPrefs>) =>
    usePrefsStore.getState().updatePlantPrefs(plantId, update),
  deletePlantPrefs: (plantId: string) => usePrefsStore.getState().deletePlantPrefs(plantId),
  reset: () => usePrefsStore.getState().reset(),
};
