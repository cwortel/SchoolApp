import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme';

interface AuthGateProps {
  children: React.ReactNode;
  loginScreen: React.ReactNode;
}

/**
 * Shows a loading spinner until the session check is complete,
 * then shows either the login screen or the main app.
 */
export function AuthGate({ children, loginScreen }: AuthGateProps) {
  const { isLoggedIn, sessionChecked } = useAuthStore();

  if (!sessionChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{isLoggedIn ? children : loginScreen}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
