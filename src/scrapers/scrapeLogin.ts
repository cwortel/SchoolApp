/**
 * MijnCalderAcademie – Login detection.
 *
 * The login page is the portal root. After the user authenticates (including
 * any MFA), Angular redirects to the student dashboard. We detect success by
 * watching for the <app-student-dashboard> element appearing in the DOM.
 */

/** URL shown to the user for manual login */
export const LOGIN_URL = 'https://mijn.calderacademie.nl';

/**
 * URL loaded by the hidden session-check WebView on app startup.
 * Any portal page works — we just need the WebView's cookie store
 * to be seeded so the injected fetch can use the session cookie.
 */
export const SESSION_CHECK_URL = 'https://mijn.calderacademie.nl';

/**
 * Injected into the VISIBLE login WebView on every full-page navigation.
 *
 * Detection strategy: watch for BOTH conditions to be true simultaneously:
 *   1. <app-student-dashboard> is present  — the Angular dashboard component
 *   2. input#_auth_code is ABSENT          — the 2FA code input field
 *
 * Why this combination is exact:
 *   - Login page:        no app-student-dashboard, no _auth_code → nothing
 *   - 2FA page:         app-student-dashboard present (Angular shell wraps it),
 *                        _auth_code present (the code input)  → nothing
 *   - Real dashboard:   app-student-dashboard present, _auth_code absent → FIRE
 *
 * Uses only a MutationObserver (no immediate check) so we always wait for
 * Angular to fully render before evaluating — avoiding race conditions.
 */
export const loginDetectionJS = `
(function() {
  var done = false;
  var obs;

  function check() {
    if (done) return;
    if (!document.querySelector('app-student-dashboard')) return;
    if (document.querySelector('input[id="_auth_code"]')) return;
    done = true;
    if (obs) obs.disconnect();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGIN_SUCCESS' }));
  }

  // Define obs first, then do immediate check so obs.disconnect() is always safe
  obs = new MutationObserver(check);
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // Immediate check — covers the case where Angular has already rendered
  // by the time this script runs (fast devices / cached JS bundle)
  check();
})();
`;

/**
 * Injected into the HIDDEN session-check WebView on app startup.
 * Makes a lightweight API call inside the WebView so the session cookie
 * is automatically included — returns SESSION_VALID on HTTP 200, SESSION_INVALID
 * for any auth failure or network error. Resolves in ~200 ms instead of up to 6 s.
 */
export const sessionCheckJS = `
  (function() {
    fetch('/api/v1/student/personal-attendance-overview?_locale=nl', { credentials: 'include' })
      .then(function(r) {
        // When not logged in the server redirects to the HTML login page,
        // which returns HTTP 200 with Content-Type: text/html — not JSON.
        // Only treat the session as valid when we actually got JSON back.
        var ct = r.headers.get('content-type') || '';
        var isJson = ct.indexOf('json') !== -1;
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: (r.ok && isJson) ? 'SESSION_VALID' : 'SESSION_INVALID' })
        );
      })
      .catch(function() {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'SESSION_INVALID' })
        );
      });
  })();
  true;
`;
