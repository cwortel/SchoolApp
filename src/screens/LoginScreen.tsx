import React, { useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useAuthStore } from '../store/authStore';
import { LOGIN_URL, loginDetectionJS } from '../scrapers/scrapeLogin';
import { ScraperMessage } from '../types';
import { Colors, Spacing } from '../theme';

export function LoginScreen() {
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);
  const handledRef = useRef(false);

  function handleMessage(event: WebViewMessageEvent) {
    if (handledRef.current) return;
    try {
      const msg: ScraperMessage = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'LOGIN_SUCCESS') {
        handledRef.current = true;
        setLoggedIn(true);
      }
    } catch {
      // ignore malformed messages
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: LOGIN_URL }}
        injectedJavaScript={loginDetectionJS}
        onMessage={handleMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
        style={styles.webview}
        // Allow cookies to persist automatically
        sharedCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  webview: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
