import { create } from 'zustand';
import { Grade, SubjectAverage } from '../types';

interface GradesPayload {
  modules: Grade[];
  exams: Grade[];
}

interface GradesState {
  moduleGrades: Grade[];
  examGrades: Grade[];
  subjectAverages: SubjectAverage[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  setGradesData: (data: GradesPayload) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Build SubjectAverage list from portal data:
 *  - Average comes from the Modules tab (pre-computed by the portal).
 *  - Each subject's .grades contains the individual exam rows for that module.
 * Matching: same subject name + same school year.
 */
function buildSubjectAverages(modules: Grade[], exams: Grade[]): SubjectAverage[] {
  return modules.map((mod) => ({
    subject: mod.subject,
    average: mod.value,
    status: mod.status,
    ec: mod.ec,
    grades: exams.filter(
      (e) => e.subject.trim() === mod.subject.trim() && e.year === mod.year,
    ),
  }));
}

export const useGradesStore = create<GradesState>((set) => ({
  moduleGrades: [],
  examGrades: [],
  subjectAverages: [],
  loading: false,
  error: null,
  lastFetched: null,
  setGradesData: ({ modules, exams }) =>
    set({
      moduleGrades: modules,
      examGrades: exams,
      subjectAverages: buildSubjectAverages(modules, exams),
      loading: false,
      error: null,
      lastFetched: Date.now(),
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
