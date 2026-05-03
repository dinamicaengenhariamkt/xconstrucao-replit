import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ObrasSalvasStore {
  savedIds: string[];
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
}

const DEFAULT_SAVED_IDS = ['nova-1', 'nova-3', 'nova-5', 'edificio-solar'];

export const useObrasSalvasStore = create<ObrasSalvasStore>()(
  persist(
    (set, get) => ({
      savedIds: DEFAULT_SAVED_IDS,
      toggleSave: (id) =>
        set((state) => ({
          savedIds: state.savedIds.includes(id)
            ? state.savedIds.filter((s) => s !== id)
            : [...state.savedIds, id],
        })),
      isSaved: (id) => get().savedIds.includes(id),
    }),
    { name: 'xconstrucao-obras-salvas' },
  ),
);
