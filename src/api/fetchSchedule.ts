import { Lesson } from '../types';

const BASE_URL = 'https://mijn.calderacademie.nl';

interface RawLesson {
  dutchDate: string;
  dagdeelOmschr: string;
  lokaal: string;
  lokaal_locatie: string;
  moduleNaam: string;
  omschrijving: string;
  afkorting: string;
  cursuscode: string;
  evenementcode: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function fetchSchedule(daysAhead = 31): Promise<Lesson[]> {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + daysAhead);

  const url =
    `${BASE_URL}/api/v1/student/get_rooster/` +
    `${fmt(today)}/${fmt(end)}/all/all/all/all/all/all/all/all/all?_locale=nl`;

  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Ophalen rooster mislukt: HTTP ${response.status}`);
  }

  const raw: RawLesson[] = await response.json();
  return raw.map((item) => {
    const room = (item.lokaal || '').trim();
    const courseCode = [
      (item.cursuscode || '').trim(),
      (item.evenementcode || '').trim(),
    ]
      .filter(Boolean)
      .join(' ');

    return {
      date: item.dutchDate,
      dagdeel: item.dagdeelOmschr,
      room,
      location: item.lokaal_locatie || '',
      module: (item.moduleNaam || '').trim(),
      lesinhoud: (item.omschrijving || '').replace(/\s+/g, ' ').trim(),
      teacher: item.afkorting || '',
      courseCode,
      status: room.toLowerCase().includes('nog in te roosteren')
        ? 'unscheduled'
        : 'scheduled',
    };
  });
}

/**
 * Returns the schedule API URL for the next `daysAhead` days from today.
 * Called from useSchedule so the computed URL can be passed directly as
 * the ScraperWebView's source URI (avoids loading the Angular SPA).
 */
export function getScheduleApiUrl(daysBack = 90, daysAhead = 180): string {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - daysBack);
  const end = new Date(today);
  end.setDate(today.getDate() + daysAhead);
  return (
    `https://mijn.calderacademie.nl/api/v1/student/get_rooster/` +
    `${fmt(start)}/${fmt(end)}/all/all/all/all/all/all/all/all/all?_locale=nl`
  );
}

/**
 * Injected into ScraperWebView after it navigates directly to getScheduleApiUrl().
 * Parses document.body.innerText as JSON — no Angular SPA involved.
 */
export const scheduleFetcherJS = `
(function() {
  function extract() {
    try {
      var text = (document.body.innerText || document.body.textContent || '').trim();
      if (text.charAt(0) !== '[' && text.charAt(0) !== '{') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SESSION_EXPIRED' }));
        return;
      }
      var data = JSON.parse(text);
      var mapped = (Array.isArray(data) ? data : []).map(function(item) {
        var room = (item.lokaal || '').trim();
        var cc = [(item.cursuscode || '').trim(), (item.evenementcode || '').trim()].filter(Boolean).join(' ');
        return {
          date: item.dutchDate,
          dagdeel: item.dagdeelOmschr,
          room: room,
          location: item.lokaal_locatie || '',
          module: (item.moduleNaam || '').trim(),
          lesinhoud: (item.omschrijving || '').replace(/\\s+/g, ' ').trim(),
          teacher: item.afkorting || '',
          courseCode: cc,
          status: room.toLowerCase().indexOf('nog in te roosteren') !== -1 ? 'unscheduled' : 'scheduled',
        };
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCHEDULE_DATA', payload: mapped }));
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCRAPE_ERROR', source: 'schedule', message: String(e && e.message ? e.message : e) }));
    }
  }
  if (document.readyState === 'complete') { extract(); }
  else { window.addEventListener('load', extract); }
})();
`;
