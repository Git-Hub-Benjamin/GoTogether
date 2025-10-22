import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [deviceToken, setDeviceToken] = useState(null);

  useEffect(() => {
    // Load token from storage on app start
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
  };

  // Request notification permissions and get device token
  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        // Get the push token with projectId
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'gotogether-mobile',
        });
        console.log('Expo Push Token:', token.data);
        setDeviceToken(token.data);
        return token.data;
      } else {
        console.log('Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return null;
    }
  };

  const login = async (token, user) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setDeviceToken(null);
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      deviceToken,
      login, 
      logout,
      requestNotificationPermissions 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};