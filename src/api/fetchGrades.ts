import { Grade } from '../types';

const BASE_URL = 'https://mijn.calderacademie.nl';

interface RawModule {
  Jaar: number;
  Periode: number;
  moduleOpdracht: string;
  cijfer: string | null;
  ec: number | null;
  passed: 1 | 0 | null;
  kvmr_id: number | null;
}

interface RawExam {
  Jaar: number;
  Periode: number;
  moduleName: string;
  kvmrKind: string | null;
  moduleOpdracht: string;
  cijfer: string | null;
  passed: 1 | 0 | null;
  kvmrIdEx: number;
  resultDate: string | null;
}

interface GradesPayload {
  modules: Grade[];
  exams: Grade[];
}

function toStatus(passed: 1 | 0 | null): 'passed' | 'failed' | 'pending' {
  if (passed === 1) return 'passed';
  if (passed === 0) return 'failed';
  return 'pending';
}

function parseCijfer(cijfer: string | null): { value: number; valueText?: string } {
  if (!cijfer) return { value: 0 };
  const n = parseFloat(cijfer);
  if (!Number.isNaN(n)) return { value: n };
  return { value: 0, valueText: cijfer.trim() };
}

export async function fetchGrades(): Promise<GradesPayload> {
  const response = await fetch(
    `${BASE_URL}/api/v1/examsapi/student_assessments_overview?_locale=nl`,
    { credentials: 'include' },
  );
  if (!response.ok) {
    throw new Error(`Ophalen cijfers mislukt: HTTP ${response.status}`);
  }

  const data: { allModules: RawModule[]; allExams: RawExam[] } = await response.json();

  const modules: Grade[] = data.allModules
    // Skip EC summary rows (Periode 100 / Jaar 100)
    .filter((r) => r.Periode !== 100 && r.Jaar !== 100 && r.kvmr_id !== null)
    .map((r) => ({
      id: String(r.kvmr_id),
      subject: r.moduleOpdracht.replace(/\s+/g, ' ').trim(),
      value: parseFloat(r.cijfer ?? '0') || 0,
      date: `Jaar ${r.Jaar} - Periode ${r.Periode}`,
      year: r.Jaar,
      period: String(r.Periode),
      ec: r.ec ?? undefined,
      status: toStatus(r.passed),
      gradeType: 'module',
    }));

  const exams: Grade[] = data.allExams.map((item) => {
    const { value, valueText } = parseCijfer(item.cijfer);
    return {
      id: String(item.kvmrIdEx),
      subject: item.moduleName.replace(/\s+/g, ' ').trim(),
      value,
      valueText,
      date: item.resultDate ?? `Jaar ${item.Jaar} - Periode ${item.Periode}`,
      year: item.Jaar,
      period: String(item.Periode),
      description: item.moduleOpdracht.replace(/\s+/g, ' ').trim(),
      examType: item.kvmrKind ?? undefined,
      status: toStatus(item.passed),
      gradeType: 'exam',
    };
  });

  return { modules, exams };
}

export const GRADES_API_URL = 'https://mijn.calderacademie.nl/api/v1/examsapi/student_assessments_overview?_locale=nl';

/**
 * Injected into ScraperWebView after it navigates directly to GRADES_API_URL.
 * Parses document.body.innerText as JSON — no Angular SPA involved.
 */
export const gradesFetcherJS = `
(function() {
  function toStatus(p) { return p === 1 ? 'passed' : p === 0 ? 'failed' : 'pending'; }
  function parseCijfer(c) {
    if (!c) return { value: 0 };
    var n = parseFloat(c);
    return isNaN(n) ? { value: 0, valueText: c.trim() } : { value: n };
  }
  function extract() {
    try {
      var text = (document.body.innerText || document.body.textContent || '').trim();
      var data = JSON.parse(text);
      var modules = (data.allModules || [])
        .filter(function(r) { return r.Periode !== 100 && r.Jaar !== 100 && r.kvmr_id !== null; })
        .map(function(r) {
          return {
            id: String(r.kvmr_id),
            subject: (r.moduleOpdracht || '').replace(/\\s+/g, ' ').trim(),
            value: parseFloat(r.cijfer || '0') || 0,
            date: 'Jaar ' + r.Jaar + ' - Periode ' + r.Periode,
            year: r.Jaar,
            period: String(r.Periode),
            ec: r.ec !== null && r.ec !== undefined ? r.ec : undefined,
            status: toStatus(r.passed),
            gradeType: 'module',
          };
        });
      var exams = (data.allExams || []).map(function(item) {
        var p = parseCijfer(item.cijfer);
        return {
          id: String(item.kvmrIdEx),
          subject: (item.moduleName || '').replace(/\\s+/g, ' ').trim(),
          value: p.value,
          valueText: p.valueText,
          date: item.resultDate || ('Jaar ' + item.Jaar + ' - Periode ' + item.Periode),
          year: item.Jaar,
          period: String(item.Periode),
          status: toStatus(item.passed),
          gradeType: 'exam',
          description: item.moduleOpdracht || undefined,
          examType: item.kvmrKind || undefined,
        };
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GRADES_DATA', payload: { modules: modules, exams: exams } }));
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCRAPE_ERROR', source: 'grades', message: String(e && e.message ? e.message : e) }));
    }
  }
  if (document.readyState === 'complete') { extract(); }
  else { window.addEventListener('load', extract); }
})();
`;
