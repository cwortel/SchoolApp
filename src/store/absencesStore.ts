import { create } from 'zustand';
import { Absence } from '../types';

interface AbsencesState {
  absences: Absence[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  setAbsences: (absences: Absence[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAbsencesStore = create<AbsencesState>((set) => ({
  absences: [],
  loading: false,
  error: null,
  lastFetched: null,
  setAbsences: (absences) => set({ absences, loading: false, error: null, lastFetched: Date.now() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
