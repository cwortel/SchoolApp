/**
 * MijnCalderAcademie – Grades scraper.
 *
 * The portal's "Mijn examen" section has two Angular-router tabs on the same
 * base URL:
 *   Modules  → #/student-assessment/modules   (one row per module, portal-computed average)
 *   Examens  → #/student-assessment/exams     (one row per individual exam attempt)
 *
 * Strategy:
 *   1. Load the modules URL.
 *   2. Wait for <app-fvs-student-assessment-modules> to render its table rows.
 *   3. Scrape modules table (Jaar, Periode, Module, Gemiddelde, status badge, EC).
 *   4. Click the "Examens" tab (hash-route navigation inside the Angular SPA).
 *   5. Wait for <app-fvs-student-assessment-exams> to render its table rows.
 *   6. Scrape exams table (Jaar, Periode, Module, Toetsvorm, Opdrachtnaam, Cijfer, status badge).
 *   7. Post { modules, exams } as GRADES_DATA payload.
 */

export const GRADES_URL =
  'https://mijn.calderacademie.nl/nl/fvs/v3/legacy_layout/#/student-assessment/modules';

export const gradesScraperJS = `
(function() {
  function clean(text) {
    return (text || '').replace(/\\s+/g, ' ').trim();
  }

  function parseGradeValue(text) {
    var t = (text || '').replace(/\\s+/g, ' ').trim();
    var n = parseFloat(t.replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }

  function badgeStatus(cell) {
    var badge = cell ? cell.querySelector('.label') : null;
    if (!badge) return 'pending';
    if (badge.classList.contains('label-success')) return 'passed';
    if (badge.classList.contains('label-danger'))  return 'failed';
    return 'pending';
  }

  // ── Modules tab ─────────────────────────────────────────────────────────────
  // Table columns (0-based):
  //   0=Jaar  1=Periode  2=Module Opdracht (span[style*=float])  3=Gemiddelde
  //   4=status badge  5=EC
  // Rows with data-kvmr are module entries; rows without are totals (EC summary)
  function scrapeModules() {
    var grades = [];
    var rows = document.querySelectorAll(
      'app-fvs-student-assessment-modules tbody tr[data-kvmr]'
    );
    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      if (cells.length < 6) return;
      var nameSpan = cells[2].querySelector('span[style*="float"]');
      var subject  = clean(nameSpan ? nameSpan.innerText : cells[2].innerText);
      var avgSpan  = cells[3].querySelector('span');
      var avgText  = avgSpan ? avgSpan.innerText.trim() : '';
      var value    = parseGradeValue(avgText);
      var status   = badgeStatus(cells[4]);
      var ecSpan   = cells[5].querySelector('span');
      var ec       = parseInt((ecSpan ? ecSpan.innerText : '0').trim(), 10) || 0;
      var year     = parseInt(cells[0].innerText.trim(), 10) || 0;
      var period   = cells[1].innerText.trim();
      grades.push({
        subject:   subject,
        value:     value,
        date:      'Jaar ' + year + ' - Periode ' + period,
        year:      year,
        period:    period,
        status:    status,
        gradeType: 'module',
        ec:        ec,
      });
    });
    return grades;
  }

  // ── Exams tab ────────────────────────────────────────────────────────────────
  // Table columns (0-based):
  //   0=Jaar  1=Periode  2=Module  3=Toetsvorm  4=Module Opdracht  5=Cijfer
  //   6=Assessor1  7=Assessor2  8=status badge  9=link
  function scrapeExams() {
    var grades = [];
    var rows = document.querySelectorAll(
      'app-fvs-student-assessment-exams tbody tr[data-kvmr]'
    );
    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      if (cells.length < 9) return;
      var subject    = clean(cells[2].innerText);
      var examType   = cells[3].innerText.trim() || undefined;
      var examName   = clean(cells[4].innerText);
      var gradeRaw   = clean(cells[5].innerText);
      var value      = parseGradeValue(gradeRaw);
      var valueText  = (value === 0 && gradeRaw.length > 0) ? gradeRaw : undefined;
      var status     = badgeStatus(cells[8]);
      var year       = parseInt(cells[0].innerText.trim(), 10) || 0;
      var period     = cells[1].innerText.trim();
      grades.push({
        subject:     subject,
        value:       value,
        valueText:   valueText,
        date:        'Jaar ' + year + ' - Periode ' + period,
        year:        year,
        description: examName,
        period:      period,
        status:      status,
        gradeType:   'exam',
        examType:    examType,
      });
    });
    return grades;
  }

  // ── Wait helper ──────────────────────────────────────────────────────────────
  function waitForRows(selector, callback, timeoutMs) {
    if (document.querySelectorAll(selector).length > 0) {
      callback();
      return;
    }
    var timer = setTimeout(function() {
      obs.disconnect();
      callback();
    }, timeoutMs);
    var obs = new MutationObserver(function() {
      if (document.querySelectorAll(selector).length > 0) {
        clearTimeout(timer);
        obs.disconnect();
        callback();
      }
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  // ── Main flow ────────────────────────────────────────────────────────────────
  try {
    var MODULE_ROWS = 'app-fvs-student-assessment-modules tbody tr[data-kvmr]';
    var EXAM_ROWS   = 'app-fvs-student-assessment-exams tbody tr[data-kvmr]';

    waitForRows(MODULE_ROWS, function() {
      var modules = scrapeModules();

      // Click the Examens tab to trigger Angular router navigation
      var tabs = document.querySelectorAll('.tabs-container .tab-item');
      var examsTab = null;
      tabs.forEach(function(tab) {
        if (tab.textContent && tab.textContent.trim() === 'Examens') examsTab = tab;
      });
      if (!examsTab && tabs.length >= 2) examsTab = tabs[1];
      if (examsTab) examsTab.click();

      waitForRows(EXAM_ROWS, function() {
        var exams = scrapeExams();
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'GRADES_DATA', payload: { modules: modules, exams: exams } })
        );
      }, 8000);
    }, 10000);
  } catch (e) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'SCRAPE_ERROR', source: 'grades', message: e.message })
    );
  }
})();
`;
