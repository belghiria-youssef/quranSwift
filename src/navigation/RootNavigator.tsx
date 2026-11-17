import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/core/theme/colors';
import { fontAssets } from '@/core/theme/fonts';
import { navigationRef } from '@/navigation/navigationRef';
import { AuthStackParamList, RootStackParamList } from '@/navigation/types';
import { TabNavigator } from '@/navigation/TabNavigator';
import { ToastProvider } from '@/presentation/components/Toast';
import { ActiveTeamProvider } from '@/presentation/context/ActiveTeamContext';
import { useAuth } from '@/presentation/hooks/useAuth';
import { AuthScreen } from '@/presentation/screens/AuthScreen';
import { UpdateProgressScreen } from '@/presentation/screens/UpdateProgressScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export function RootNavigator() {
  const { user, initializing } = useAuth();
  const [fontsLoaded] = useFonts(fontAssets);

  if (initializing || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.em} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <ToastProvider>
        {user ? (
          <ActiveTeamProvider>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
              <RootStack.Screen name="Tabs" component={TabNavigator} />
              <RootStack.Screen
                name="Update"
                component={UpdateProgressScreen as never}
                options={{ presentation: 'modal' }}
              />
            </RootStack.Navigator>
          </ActiveTeamProvider>
        ) : (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Auth" component={AuthScreen} />
          </AuthStack.Navigator>
        )}
      </ToastProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
});