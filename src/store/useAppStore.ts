import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'dashboard',
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: 'kiora-app-storage',
      partialize: (state) => ({ activeTab: state.activeTab }),
    }
  )
);
