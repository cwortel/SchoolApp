/**
 * MijnCalderAcademie – Absences / Verzuim scraper.
 *
 * TODO: Navigate to the absences section of the portal, inspect the HTML with
 *       DevTools, and update the selectors and URL below.
 *
 * Suggested navigation path: look for "Verzuim", "Absenties", or
 * "Mijn verzuim" in the portal's navigation menu.
 */

// TODO: Replace with the actual absences page URL after inspecting the portal nav
export const ABSENCES_URL = 'https://mijn.calderacademie.nl/nl/fvs/student/absences';

/**
 * JavaScript injected into the hidden WebView to scrape the absences page.
 *
 * ⚠️  All CSS selectors are PLACEHOLDERS — update after inspecting the real
 *     portal HTML with DevTools → Inspect Element.
 *     The portal uses Angular Material tables similar to the schedule page,
 *     so the pattern `tbody.table-body tr.table-row` is a reasonable first guess.
 */
export const absencesScraperJS = `
  (function() {
    function scrapeAbsences() {
      // TODO: update selector — each row in the absences table
      var rows = document.querySelectorAll('tbody.table-body tr.table-row');
      return Array.from(rows).map(function(row) {
        var cells = row.querySelectorAll('td');
        return {
          // TODO: verify column order by inspecting the real HTML table headers
          date:    (cells[0] ? cells[0].innerText : '').trim(),
          subject: (cells[1] ? cells[1].innerText : '').replace(/\\s+/g,' ').trim(),
          type:    (cells[2] ? cells[2].innerText : '').trim(),
          status:  (cells[3] ? cells[3].innerText : '').trim(),
        };
      });
    }
    try {
      var rows = document.querySelectorAll('tbody.table-body tr.table-row');
      if (rows.length > 0) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ABSENCES_DATA', payload: scrapeAbsences() }));
        return;
      }
      var observer = new MutationObserver(function(mutations, obs) {
        var ready = document.querySelectorAll('tbody.table-body tr.table-row');
        if (ready.length > 0) {
          obs.disconnect();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ABSENCES_DATA', payload: scrapeAbsences() }));
        }
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
      setTimeout(function() {
        observer.disconnect();
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ABSENCES_DATA', payload: scrapeAbsences() }));
      }, 10000);
    } catch (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCRAPE_ERROR', source: 'absences', message: e.message }));
    }
  })();
`;
