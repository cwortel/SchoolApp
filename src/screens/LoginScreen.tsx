import React, { useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Dimensions, Pressable } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { LOGIN_URL } from '../scrapers/scrapeLogin';
import { ScraperMessage } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card starts exactly 1/3 of the way down the screen
const CARD_TOP = Math.round(SCREEN_HEIGHT * 0.33);
// Fixed height — keyboard overlays but the card never moves
const CARD_HEIGHT = SCREEN_HEIGHT - CARD_TOP;

// Injected on page load: enlarge all form inputs, prevent page from scrolling
// visually (WKWebView can still scroll internally to keep focused inputs visible).
const loginStyleJS = `
(function() {
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

  var style = document.createElement('style');
  style.textContent = [
    'html, body { overflow: hidden !important; }',
    'input[type="text"], input[type="email"], input[type="password"], input:not([type]) {',
    '  font-size: 20px !important;',
    '  padding: 14px 16px !important;',
    '  height: auto !important;',
    '  min-height: 54px !important;',
    '  border-radius: 8px !important;',
    '  box-sizing: border-box !important;',
    '}',
    'input[type="tel"], input[type="number"] {',
    '  font-size: 32px !important;',
    '  letter-spacing: 10px !important;',
    '  text-align: center !important;',
    '  padding: 14px 16px !important;',
    '  min-height: 62px !important;',
    '  border-radius: 8px !important;',
    '  box-sizing: border-box !important;',
    '}',
    'button[type="submit"], input[type="submit"], button:not([type]) {',
    '  font-size: 18px !important;',
    '  padding: 16px !important;',
    '  min-height: 54px !important;',
    '}',
    'label { font-size: 16px !important; }',
  ].join('\\n');
  document.head.appendChild(style);
  true;
})();
`;

const NAVB_BLACK = '#1A1A1A';
const NAVB_GREEN = '#9DC419';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);
  const handledRef = useRef(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [pageLoaded, setPageLoaded] = useState(false);

  function handleContinue() {
    if (handledRef.current) return;
    handledRef.current = true;
    setLoggedIn(true);
  }

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
    <View style={styles.root}>
      {/* NAVB branding — occupies the top third, content centered vertically */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>NAVB</Text>
        </View>
        <Text style={styles.logoFull}>Nederlandse Academie voor Beeldcreatie</Text>
        <Text style={styles.subtitle}>Mijn schoolportaal</Text>
      </View>

      {/* Card — absolutely positioned so keyboard never moves it */}
      <View style={styles.card}>
        {!pageLoaded && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.round(loadProgress * 100)}%` }]} />
          </View>
        )}
        <WebView
          source={{ uri: LOGIN_URL }}
          injectedJavaScript={`${loginStyleJS}\ntrue;`}
          onMessage={handleMessage}
          onLoadProgress={({ nativeEvent }) => setLoadProgress(nativeEvent.progress)}
          onLoadEnd={() => setPageLoaded(true)}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={NAVB_GREEN} />
              <Text style={styles.loadingText}>Verbinden…</Text>
            </View>
          )}
          style={styles.webview}
          sharedCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          limitsNavigationsToAppBoundDomains
        />
      </View>

      {/* Always-visible button — tap after completing login (password + 2FA) */}
      <Pressable
        style={[styles.continueButton, { bottom: insets.bottom + 20 }]}
        onPress={handleContinue}
      >
        <Text style={styles.continueText}>Al ingelogd? Open app →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NAVB_BLACK,
  },
  header: {
    height: CARD_TOP,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: NAVB_GREEN,
    marginRight: 13,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  logoFull: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.70)',
    letterSpacing: 0.2,
  },
  card: {
    position: 'absolute',
    top: CARD_TOP,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  progressBar: {
    height: 3,
    backgroundColor: NAVB_GREEN,
  },
  webview: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#718096',
  },
  continueButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: NAVB_GREEN,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
