/**
 * SessionCheckWebView
 *
 * Invisible WebView loaded on app startup to check whether the previous
 * session cookie is still valid. Reports SESSION_VALID or SESSION_INVALID
 * and then unmounts itself.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { useAuthStore } from '../store/authStore';
import { SESSION_CHECK_URL, sessionCheckJS } from '../scrapers/scrapeLogin';
import { ScraperMessage } from '../types';

// Hard timeout — if the fetch never resolves (e.g. no network), bail to login
const SESSION_CHECK_TIMEOUT_MS = 5000;

export function SessionCheckWebView() {
  const setLoggedIn       = useAuthStore((s) => s.setLoggedIn);
  const setSessionChecked = useAuthStore((s) => s.setSessionChecked);
  const sessionChecked    = useAuthStore((s) => s.sessionChecked);
  const resolvedRef       = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!resolvedRef.current) {
        resolvedRef.current = true;
        setLoggedIn(false);
        setSessionChecked(true);
      }
    }, SESSION_CHECK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Already resolved — no need to keep the WebView alive
  if (sessionChecked) return null;

  function resolve(valid: boolean) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setLoggedIn(valid);
    setSessionChecked(true);
  }

  function handleMessage(event: WebViewMessageEvent) {
    let msg: ScraperMessage;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'SESSION_VALID') {
      resolve(true);
    } else if (msg.type === 'SESSION_INVALID') {
      resolve(false);
    }
  }

  function handleError() {
    // Network error / can't reach server — go straight to login
    resolve(false);
  }

  return (
    <View style={styles.offscreen}>
      <WebView
        source={{ uri: SESSION_CHECK_URL }}
        injectedJavaScript={sessionCheckJS}
        onMessage={handleMessage}
        onError={handleError}
        onHttpError={handleError}
        sharedCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        limitsNavigationsToAppBoundDomains
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: -2000,
    left: -2000,
    width: 375,
    height: 812,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});
