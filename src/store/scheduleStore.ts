import { create } from 'zustand';
import { Lesson } from '../types';

interface ScheduleState {
  lessons: Lesson[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  setLessons: (lessons: Lesson[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  lessons: [],
  loading: false,
  error: null,
  lastFetched: null,
  setLessons: (lessons) => set({ lessons, loading: false, error: null, lastFetched: Date.now() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
