import { create } from 'zustand';
import { AttendanceRecord } from '../types';

interface AbsencesState {
  absences: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  setAbsences: (absences: AttendanceRecord[]) => void;
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
