/**
 * MijnCalderAcademie - Schedule via JSON API.
 * URL: https://mijn.calderacademie.nl/nl/fvs/student/dashboard#/student-dashboard
 *
 * The WebView loads the dashboard to establish the session, then the injected
 * JS calls the internal REST API directly - no DOM scraping needed.
 *
 * API: /api/v1/student/get_rooster/{startDate}/{endDate}/all/.../all?_locale=nl
 * Response fields used:
 *   dutchDate      - "dd-MM-yyyy"
 *   dagdeelOmschr  - "Ochtend" | "Middag"
 *   lokaal         - room, e.g. "3.05" or "nog in te roosteren"
 *   lokaal_locatie - location branch, e.g. "AM" or "---"
 *   moduleNaam     - subject/module name (may have trailing spaces)
 *   omschrijving   - lesson content, e.g. "Les 7", "Toetsing"
 *   afkorting      - teacher abbreviation, e.g. "MLI"
 *   cursuscode     - course code prefix, e.g. "AVV-voltijd"
 *   evenementcode  - course code suffix, e.g. "2408A-AM"
 */
export const SCHEDULE_URL =
  'https://mijn.calderacademie.nl/nl/fvs/student/dashboard#/student-dashboard';

export const scheduleScraperJS = `
  (function() {
    try {
      var today = new Date();
      var end = new Date(today);
      end.setDate(today.getDate() + 31);

      function pad(n) { return String(n).padStart(2, '0'); }
      function fmt(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      }

      var url = '/api/v1/student/get_rooster/'
        + fmt(today) + '/' + fmt(end)
        + '/all/all/all/all/all/all/all/all/all?_locale=nl';

      fetch(url, { credentials: 'include' })
        .then(function(r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function(data) {
          var lessons = Array.isArray(data) ? data.map(function(item) {
            var room = (item.lokaal || '').trim();
            var lesinhoud = (item.omschrijving || '').replace(/\\s+/g, ' ').trim();
            var courseCode = [(item.cursuscode || '').trim(), (item.evenementcode || '').trim()]
              .filter(Boolean).join(' ');
            return {
              date:       item.dutchDate || '',
              dagdeel:    item.dagdeelOmschr || '',
              room:       room,
              location:   item.lokaal_locatie || '',
              module:     (item.moduleNaam || '').trim(),
              lesinhoud:  lesinhoud,
              teacher:    item.afkorting || '',
              courseCode: courseCode,
              status:     room.toLowerCase().includes('nog in te roosteren') ? 'unscheduled' : 'scheduled',
            };
          }) : [];
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SCHEDULE_DATA',
            payload: lessons,
          }));
        })
        .catch(function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SCRAPE_ERROR',
            source: 'schedule',
            message: e.message,
          }));
        });
    } catch (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'SCRAPE_ERROR',
        source: 'schedule',
        message: e.message,
      }));
    }
  })();
`;
