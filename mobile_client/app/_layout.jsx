import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '../hooks/use-color-scheme';
import { AuthProvider } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack>
            <Stack.Screen 
              name="index" 
              options={{
                headerShown: false,
                title: 'Login'
              }}
            />
            <Stack.Screen 
              name="dashboard" 
              options={{
                headerShown: false,
                title: 'Dashboard'
              }}
            />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
