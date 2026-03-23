import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthGate } from './src/navigation/AuthGate';
import { TabNavigator } from './src/navigation/TabNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { ScraperWebView } from './src/components/ScraperWebView';
import { SessionCheckWebView } from './src/components/SessionCheckWebView';
import { Colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Session check runs invisibly on startup */}
      <SessionCheckWebView />

      <NavigationContainer>
        <AuthGate loginScreen={<LoginScreen />}>
          {/* Background scraper WebView — invisible, mounted globally */}
          <ScraperWebView />
          <TabNavigator />
        </AuthGate>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
