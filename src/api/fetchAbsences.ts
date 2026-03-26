import { AttendanceRecord } from '../types';

const BASE_URL = 'https://mijn.calderacademie.nl';

interface RawAttendanceRecord {
  LessonDate: string;
  DagdeelAfk: string;
  moduleName: string;
  hours_missed: number;
  hours_present: number;
  yr: number;
  pe: number;
  kvmrId: number;
  all_day_valid: null | 0 | 1;
  too_late_valid: null | 0 | 1;
  too_early_valid: null | 0 | 1;
  came_too_late: string | null;
  left_too_early: string | null;
}

export async function fetchAbsences(): Promise<AttendanceRecord[]> {
  const response = await fetch(
    `${BASE_URL}/api/v1/student/personal-attendance-overview?_locale=nl`,
    { credentials: 'include' },
  );
  if (!response.ok) {
    throw new Error(`Ophalen verzuim mislukt: HTTP ${response.status}`);
  }
  const raw: RawAttendanceRecord[] = await response.json();
  return raw.map((r) => ({
// (WebView fetcher is the primary path — see absencesFetcherJS below)
    lessonDate: r.LessonDate,
    dagdeelAfk: r.DagdeelAfk as 'O' | 'M',
    moduleName: r.moduleName.trim(),
    hoursMissed: r.hours_missed,
    hoursPresent: r.hours_present,
    yr: r.yr,
    pe: r.pe,
    kvmrId: r.kvmrId,
    allDayValid: r.all_day_valid,
    tooLateValid: r.too_late_valid,
    tooEarlyValid: r.too_early_valid,
    cameTooLate: r.came_too_late,
    leftTooEarly: r.left_too_early,
  }));
}

/** Base URL and direct API endpoint for absences — loaded in ScraperWebView. */
export const PORTAL_BASE_URL = 'https://mijn.calderacademie.nl';
export const ABSENCES_API_URL = `${PORTAL_BASE_URL}/api/v1/student/personal-attendance-overview?_locale=nl`;

/**
 * Injected into ScraperWebView after it navigates directly to ABSENCES_API_URL.
 * The server returns JSON which WKWebView/WebView renders as plain text.
 * We parse document.body.innerText instead of doing a nested fetch(), so
 * the Angular SPA is never loaded and never visible to the user.
 */
export const absencesFetcherJS = `
(function() {
  function extract() {
    try {
      var text = (document.body.innerText || document.body.textContent || '').trim();
      var data = JSON.parse(text);
      var mapped = (Array.isArray(data) ? data : []).map(function(r) {
        return {
          lessonDate: r.LessonDate,
          dagdeelAfk: r.DagdeelAfk,
          moduleName: (r.moduleName || '').replace(/\\s+/g, ' ').trim(),
          hoursMissed: r.hours_missed,
          hoursPresent: r.hours_present,
          yr: r.yr,
          pe: r.pe,
          kvmrId: r.kvmrId,
          allDayValid: r.all_day_valid,
          tooLateValid: r.too_late_valid,
          tooEarlyValid: r.too_early_valid,
          cameTooLate: r.came_too_late,
          leftTooEarly: r.left_too_early,
        };
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ABSENCES_DATA', payload: mapped }));
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCRAPE_ERROR', source: 'absences', message: String(e && e.message ? e.message : e) }));
    }
  }
  if (document.readyState === 'complete') { extract(); }
  else { window.addEventListener('load', extract); }
})();
`;
