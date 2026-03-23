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
 * URL loaded by the hidden session-check WebView on app launch to determine
 * whether the previous session cookie is still valid. It redirects to the
 * dashboard if logged in, or back to login if not.
 */
export const SESSION_CHECK_URL =
  'https://mijn.calderacademie.nl/nl/fvs/student/dashboard#/student-dashboard';

/**
 * Injected into the VISIBLE login WebView. Fires window.ReactNativeWebView
 * .postMessage with LOGIN_SUCCESS as soon as the Angular dashboard mounts.
 *
 * Strategy:
 *  1. If <app-student-dashboard> is already present (cached load), fire immediately.
 *  2. Otherwise attach a MutationObserver on <body> so we catch it the moment
 *     Angular inserts the component — regardless of animation or redirect timing.
 */
export const loginDetectionJS = `
  (function() {
    function notifySuccess() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGIN_SUCCESS' }));
    }
    if (document.querySelector('app-student-dashboard')) {
      notifySuccess();
      return;
    }
    var observer = new MutationObserver(function(mutations, obs) {
      if (document.querySelector('app-student-dashboard')) {
        obs.disconnect();
        notifySuccess();
      }
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  })();
`;

/**
 * Injected into the HIDDEN session-check WebView on app startup.
 * Reports SESSION_VALID if the dashboard loaded, SESSION_INVALID otherwise.
 */
export const sessionCheckJS = `
  (function() {
    function check() {
      if (document.querySelector('app-student-dashboard')) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SESSION_VALID' }));
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SESSION_INVALID' }));
      }
    }
    // Wait up to 6 s for Angular to boot
    var waited = 0;
    var interval = setInterval(function() {
      waited += 500;
      if (document.querySelector('app-student-dashboard')) {
        clearInterval(interval);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SESSION_VALID' }));
      } else if (waited >= 6000) {
        clearInterval(interval);
        // If the URL is back on the login page, the session has expired
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SESSION_INVALID' }));
      }
    }, 500);
  })();
`;
