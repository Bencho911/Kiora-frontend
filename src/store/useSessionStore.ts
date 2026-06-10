import { create } from 'zustand';
import { SessionData, sessionService } from '@/services/sessionService';

interface SessionState {
  currentSession: SessionData | null;
  isLoading: boolean;
  isSessionModalOpen: boolean;
  modalMode: 'OPEN' | 'CLOSE';
  
  checkSession: () => Promise<void>;
  setCurrentSession: (session: SessionData | null) => void;
  openSessionModal: (mode: 'OPEN' | 'CLOSE') => void;
  closeSessionModal: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  isLoading: true,
  isSessionModalOpen: false,
  modalMode: 'OPEN',

  checkSession: async () => {
    try {
      set({ isLoading: true });
      const session = await sessionService.getCurrentSession();
      set({ currentSession: session });
    } catch (error) {
      console.error('Error checking session:', error);
      set({ currentSession: null });
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentSession: (session) => set({ currentSession: session }),
  
  openSessionModal: (mode) => set({ isSessionModalOpen: true, modalMode: mode }),
  closeSessionModal: () => set({ isSessionModalOpen: false })
}));
