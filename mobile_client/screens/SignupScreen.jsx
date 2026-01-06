import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS } from '../utils/api.js';

const API_URL = ENDPOINTS.AUTH;

export default function SignupScreen() {
  const router = useRouter();
  const { login, requestNotificationPermissions } = useAuth();
  const { email, school, state } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const validatePasswordStrength = (pwd) => {
    const strength = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    setPasswordStrength(strength);
    return Object.values(strength).every(Boolean);
  };

  const handlePasswordChange = (pwd) => {
    setPassword(pwd);
    if (passwordEnabled) {
      validatePasswordStrength(pwd);
    }
  };

  const handleSignup = async () => {
    setError("");
    setStatus("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (passwordEnabled) {
      if (!password) {
        setError("Please enter a password.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!validatePasswordStrength(password)) {
        setError("Password does not meet strength requirements.");
        return;
      }
    }

    setLoading(true);
    setStatus("Creating account...");

    try {
      let deviceToken = null;

      // Request notification permissions if enabled
      if (notificationsEnabled) {
        setStatus("Requesting notification permissions...");
        deviceToken = await requestNotificationPermissions();
      }

      // Create account
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          school,
          state,
          name: name.trim(),
          passwordEnabled,
          password: passwordEnabled ? password : null,
          notificationsEnabled: notificationsEnabled,
          deviceToken: deviceToken || null,
          platform: Platform.OS,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Login successful
      await login(data.token, {
        email: data.user.email,
        school: data.user.school,
        state: data.user.state,
        name: data.user.name,
      });

      router.replace('dashboard');
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
    setLoading(false);
  };

  const allRequirementsMet = Object.values(passwordStrength).every(Boolean);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* BACK BUTTON */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <MaterialIcons name="arrow-back" size={24} color="#2e7d32" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>{school}</Text>

          {/* EMAIL DISPLAY */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>

          {/* NAME INPUT */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#ccc"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          {/* PASSWORD TOGGLE */}
          <View style={styles.formGroup}>
            <View style={styles.toggleContainer}>
              <Text style={styles.label}>Enable Password Login</Text>
              <Switch
                value={passwordEnabled}
                onValueChange={setPasswordEnabled}
                trackColor={{ false: '#767577', true: '#81c784' }}
                thumbColor={passwordEnabled ? '#2e7d32' : '#f4f3f4'}
                disabled={loading}
              />
            </View>
            <Text style={styles.toggleHint}>
              {passwordEnabled 
                ? "You can log in with your password" 
                : "You will log in with verification codes"}
            </Text>
          </View>

          {/* PASSWORD INPUTS */}
          {passwordEnabled && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#ccc"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry
                  editable={!loading}
                />
              </View>

              {/* PASSWORD STRENGTH INDICATOR */}
              <View style={styles.strengthContainer}>
                <Text style={styles.strengthTitle}>Password Requirements:</Text>
                <StrengthRequirement 
                  met={passwordStrength.length} 
                  text="At least 8 characters" 
                />
                <StrengthRequirement 
                  met={passwordStrength.uppercase} 
                  text="One uppercase letter (A-Z)" 
                />
                <StrengthRequirement 
                  met={passwordStrength.lowercase} 
                  text="One lowercase letter (a-z)" 
                />
                <StrengthRequirement 
                  met={passwordStrength.number} 
                  text="One number (0-9)" 
                />
                <StrengthRequirement 
                  met={passwordStrength.special} 
                  text="One special character (!@#$%^&*)" 
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#ccc"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </>
          )}

          {/* NOTIFICATIONS TOGGLE */}
          <View style={styles.formGroup}>
            <View style={styles.toggleContainer}>
              <Text style={styles.label}>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: '#81c784' }}
                thumbColor={notificationsEnabled ? '#2e7d32' : '#f4f3f4'}
                disabled={loading}
              />
            </View>
            <Text style={styles.toggleHint}>
              Get notified about ride updates and nearby rides
            </Text>
          </View>

          {/* ERROR MESSAGE */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* SIGNUP BUTTON */}
          <TouchableOpacity
            style={[
              styles.button,
              (loading || !name.trim() || (passwordEnabled && !allRequirementsMet)) && styles.buttonDisabled
            ]}
            onPress={handleSignup}
            disabled={loading || !name.trim() || (passwordEnabled && !allRequirementsMet)}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating Account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StrengthRequirement({ met, text }) {
  return (
    <View style={styles.requirementRow}>
      <Text style={[styles.requirementIcon, { color: met ? '#2e7d32' : '#ccc' }]}>
        {met ? '✓' : '○'}
      </Text>
      <Text style={[styles.requirementText, { color: met ? '#2e7d32' : '#ccc' }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8e6c9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: '#558b2f',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  strengthContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  strengthTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    width: 14,
  },
  requirementText: {
    fontSize: 12,
    flex: 1,
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  status: {
    color: '#2e7d32',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
});