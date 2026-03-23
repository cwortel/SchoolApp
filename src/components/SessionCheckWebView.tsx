/**
 * SessionCheckWebView
 *
 * Invisible WebView loaded on app startup to check whether the previous
 * session cookie is still valid. Reports SESSION_VALID or SESSION_INVALID
 * and then unmounts itself.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { useAuthStore } from '../store/authStore';
import { SESSION_CHECK_URL, sessionCheckJS } from '../scrapers/scrapeLogin';
import { ScraperMessage } from '../types';

export function SessionCheckWebView() {
  const setLoggedIn      = useAuthStore((s) => s.setLoggedIn);
  const setSessionChecked = useAuthStore((s) => s.setSessionChecked);
  const sessionChecked   = useAuthStore((s) => s.sessionChecked);

  // Already resolved — no need to keep the WebView alive
  if (sessionChecked) return null;

  function handleLoad() {
    // Inject the session-check script once the page has navigated
  }

  function handleMessage(event: WebViewMessageEvent) {
    let msg: ScraperMessage;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'SESSION_VALID') {
      setLoggedIn(true);
      setSessionChecked(true);
    } else if (msg.type === 'SESSION_INVALID') {
      setLoggedIn(false);
      setSessionChecked(true);
    }
  }

  return (
    <View style={styles.offscreen}>
      <WebView
        source={{ uri: SESSION_CHECK_URL }}
        injectedJavaScript={sessionCheckJS}
        onMessage={handleMessage}
        onLoadEnd={handleLoad}
        sharedCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
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
