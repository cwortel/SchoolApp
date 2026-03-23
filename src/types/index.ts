// ─── Lesson / Schedule ───────────────────────────────────────────────────────

/** 'scheduled' = has a room assigned; 'unscheduled' = "nog in te roosteren" */
export type LessonStatus = 'scheduled' | 'unscheduled';

export interface Lesson {
  /** Date string as returned by the portal: "dd-MM-yyyy" */
  date: string;
  /** Half-day indicator from the portal: "Ochtend" or "Middag" */
  dagdeel: string;
  /** Room / lokaal, e.g. "3.05", "4.16 TV-studio", "nog in te roosteren" */
  room: string;
  /** Location / locatie, e.g. "AM" or "---" when unscheduled */
  location: string;
  /** Module / subject name */
  module: string;
  /** Lesson content description, e.g. "Les 7", "Toetsing" */
  lesinhoud: string;
  /** Teacher abbreviation, e.g. "MLI", "ABR" */
  teacher: string;
  /** Course code, e.g. "AVV-voltijd 2408A-AM" */
  courseCode: string;
  status: LessonStatus;
}

// ─── Grades ───────────────────────────────────────────────────────────────────

export interface Grade {
  id?: string;
  /** Module name, e.g. "Camera en Licht" */
  subject: string;
  /** Numeric grade (0 when not yet graded or non-numeric result) */
  value: number;
  /** Raw grade text when the value is non-numeric, e.g. "Niet voldaan aan de voorwaarden" */
  valueText?: string;
  /** Display date string derived from year + period: "Jaar 1 - Periode 2" */
  date: string;
  /** Specific exam/assignment name (exams only) */
  description?: string;
  weight?: number;
  /** Period number as string */
  period?: string;
  /** School year number */
  year?: number;
  /** Pass/fail/pending derived from portal badge colour */
  status?: 'passed' | 'pending' | 'failed';
  /** Whether this row came from the Modules or Exams tab */
  gradeType?: 'module' | 'exam';
  /** Exam type string, e.g. "Beroepsproduct", "Kennistoets", "Examen extern" */
  examType?: string;
  /** EC (ECTS credits) awarded – modules tab only */
  ec?: number;
}

export interface SubjectAverage {
  subject: string;
  /** Portal-computed module average (from the Modules tab) */
  average: number;
  /** Individual exam results for this module */
  grades: Grade[];
  status?: 'passed' | 'pending' | 'failed';
  ec?: number;
}

// ─── Absences ─────────────────────────────────────────────────────────────────

export interface Absence {
  id?: string;
  date: string;
  subject: string;
  type: string;
  status: string;
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export interface Contact {
  id?: string;
  name: string;
  /** Section / programme abbreviation, e.g. "FAM", "TFB" */
  role: string;
  /** Leerjaar label, e.g. "Leerjaar 1 en 2", "Ná leerjaar 4" */
  year?: string;
  /** Location / campus, e.g. "Amsterdam", "Eindhoven", "Alle vestigingen" */
  location?: string;
  email?: string;
  phone?: string;
}

// ─── Scraper messaging ────────────────────────────────────────────────────────

export type ScraperMessageType =
  | 'SCHEDULE_DATA'
  | 'GRADES_DATA'
  | 'ABSENCES_DATA'
  | 'CONTACTS_DATA'
  | 'LOGIN_SUCCESS'
  | 'SESSION_VALID'
  | 'SESSION_INVALID'
  | 'SCRAPE_ERROR';

export interface ScraperMessage {
  type: ScraperMessageType;
  payload?: unknown;
  source?: string;
  message?: string;
}

export interface ScrapeRequest {
  id: string;
  url: string;
  scraperJs: string;
  expectedType: ScraperMessageType;
}
