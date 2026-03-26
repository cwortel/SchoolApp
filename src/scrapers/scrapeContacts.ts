/**
 * MijnCalderAcademie – Contacts / SLB scraper.
 *
 * The page at /edu_pages/contactinfo is a static rich-text page (not Angular).
 * It contains a .left-block-inner div with <p> elements listing
 * studieloopbaanbegeleiders per programme (FAM, TFB), leerjaar, and location.
 *
 * Format of each contact paragraph:
 *   "Leerjaar 1 en 2   Amsterdam   Bram Verhees (bram.verhees@navb.nl)"
 * Section headers are short bold-only paragraphs (e.g. "FAM", "TFB").
 */

// Contacts are now fetched directly via src/api/fetchContacts.ts
// This file is kept as a placeholder and no longer used.

export const contactsScraperJS = `
(function() {
  function scrapeContacts() {
    var container = document.querySelector('.left-block-inner');
    if (!container) return [];

    var contacts = [];
    var section = '';

    var paras = container.querySelectorAll('p');
    paras.forEach(function(p) {
      // Normalise NBSP and multi-whitespace
      var rawText = (p.innerText || '').replace(/\\u00a0/g, ' ');
      var text = rawText.replace(/\\s+/g, ' ').trim();
      if (!text) return;

      // Detect section header: short paragraph whose visible text equals its bold child
      var boldEl = p.querySelector('b');
      if (boldEl) {
        var boldText = boldEl.innerText.trim();
        if (boldText === text && text.length <= 8) {
          section = boldText;
          return;
        }
      }

      // Only process paragraphs that contain a mailto link
      var anchor = p.querySelector('a[href^="mailto:"]');
      if (!anchor) return;

      var email = (anchor.getAttribute('href') || '').replace('mailto:', '').trim();

      // Split raw line on runs of 2+ spaces to get leerjaar | location | "Name (email)"
      var parts = rawText.split(/  +/).map(function(s) {
        return s.replace(/\\s+/g, ' ').trim();
      }).filter(Boolean);

      var year = '';
      var location = '';
      var name = '';

      if (parts.length >= 3) {
        year = parts[0];
        location = parts[1];
        var tail = parts[2];
        var pi = tail.indexOf('(');
        name = pi > 0 ? tail.substring(0, pi).trim() : tail;
      } else if (parts.length === 2) {
        year = parts[0];
        var tail2 = parts[1];
        var pi2 = tail2.indexOf('(');
        name = pi2 > 0 ? tail2.substring(0, pi2).trim() : tail2;
      } else {
        // Fallback: name from text before "("
        var pi3 = text.indexOf('(');
        name = pi3 > 0 ? text.substring(0, pi3).trim() : text;
      }

      if (name) {
        contacts.push({ name: name, role: section, year: year, location: location, email: email });
      }
    });

    return contacts;
  }

  function tryPost() {
    var result = scrapeContacts();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONTACTS_DATA', payload: result }));
  }

  try {
    if (document.querySelector('.left-block-inner')) {
      tryPost();
    } else {
      // Static page – retry once after short delay in case of slow CDN
      setTimeout(tryPost, 2000);
    }
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCRAPE_ERROR', source: 'contacts', message: e.message }));
  }
})();
`;
