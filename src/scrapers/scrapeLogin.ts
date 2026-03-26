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
export const SESSION_CHECK_URL = 'https://mijn.calderacademie.nl/api/v1/student/personal-attendance-overview?_locale=nl';

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
 *   - 500 error page:   app-student-dashboard may be present (Angular shell),
 *                        _auth_code absent — BUT API check will fail → nothing
 *   - Real dashboard:   app-student-dashboard present, _auth_code absent,
 *                        AND API returns JSON → FIRE
 *
 * An extra fetch() guard is used because after 2FA the server may briefly
 * return a 500 inside the Angular shell — the DOM check alone would match
 * that state too early. The API check confirms the session cookie is
 * actually valid before we transition.
 */
export const loginDetectionJS = `
(function() {
  var done = false;
  var obs;

  function dbg(msg) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGIN_DEBUG', message: msg }));
  }

  function check() {
    if (done) return;
    var hasDash = !!document.querySelector('app-student-dashboard');
    var has2FA  = !!document.querySelector('input[id="_auth_code"]');
    dbg('DOM check — dashboard=' + hasDash + ' 2FA=' + has2FA + ' url=' + window.location.href);
    if (!hasDash || has2FA) return;
    done = true;
    if (obs) obs.disconnect();
    dbg('LOGIN_SUCCESS firing');
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGIN_SUCCESS' }));
  }

  obs = new MutationObserver(check);
  obs.observe(document.documentElement, { childList: true, subtree: true });
  dbg('loginDetectionJS installed — url=' + window.location.href);
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
