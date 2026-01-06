import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS } from '../utils/api.js';

const API_URL = ENDPOINTS.AUTH;
const SERVER_URL = ENDPOINTS.SERVER;

const SCHOOL_NAME = "Utah State University";
const SCHOOL_STATE = "Utah";

export default function LoginScreen() {
  const router = useRouter();
  const { login, requestNotificationPermissions } = useAuth();
  const [serverOnline, setServerOnline] = useState(null);
  const [stage, setStage] = useState("email"); // "email", "code", "password"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // DEBUG SECTION - auto-populate for testing (comment out to disable)
  useEffect(() => {
    setEmail("a@usu.edu");
  }, []);
  // END DEBUG SECTION

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkServerStatus = async () => {
    try {
      const res = await fetch(SERVER_URL, { method: "GET" });
      if (!res.ok) throw new Error("Not OK");
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setStatus("Verifying email...");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          school: SCHOOL_NAME,
          state: SCHOOL_STATE,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Determine next stage based on authentication method
      if (data.authMethod === "password") {
        // Account has password - move to password entry stage
        setStatus("");
        setStage("password");
      } else {
        // Account uses verification code
        if (data.codeExisting) {
          setStatus("Previous code is still valid. Please enter it below.");
        } else {
          setStatus("Verification code sent to your email!");
        }
        setStage("code");
      }
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    setStatus("Logging in...");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/enter-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Login successful
      await login(data.token, { 
        email: data.user.email, 
        school: data.user.school, 
        state: data.user.state,
        name: data.user.name
      });
      router.replace('dashboard');
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
    setLoading(false);
  };

  const handleCodeSubmit = async () => {
    if (!code) {
      setError("Please enter the verification code.");
      return;
    }
    setError("");
    setStatus("Verifying...");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/check-code`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-client-type": "mobile",
          "x-client-platform": Platform.OS
        },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // Check if user is new or existing
      if (data.isNewUser && data.requiresSignup) {
        // Navigate to signup screen with user data
        router.push({
          pathname: '/signup',
          params: {
            email: data.email,
            school: data.school,
            state: data.state,
          }
        });
      } else {
        // Existing user - login directly
        await login(data.token, { 
          email: data.user.email, 
          school: data.user.school, 
          state: data.user.state,
          name: data.user.name
        });
        router.replace('dashboard');
      }
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
    setLoading(false);
  };

  const handleBackPress = () => {
    setStage("email");
    setCode("");
    setPassword("");
    setError("");
    setStatus("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.titleRow}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Text style={styles.title}>GoTogether</Text>
              {serverOnline === true && (
                <View style={[styles.statusBubble, { backgroundColor: '#2e7d32' }]} />
              )}
            </View>
            <Text style={styles.version}>v1.0</Text>
          </View>

          {serverOnline === null ? (
            <ActivityIndicator size="small" color="#2e7d32" />
          ) : serverOnline === false ? (
            <View style={styles.offlineRow}>
              <View style={[styles.statusBubble, { backgroundColor: '#d32f2f' }]} />
              <Text style={styles.statusText}>⚠️ Server is offline</Text>
            </View>
          ) : null}

          {/* SCHOOL INFO BOX */}
          <View style={styles.schoolInfoBox}>
            <Text style={styles.schoolInfoTitle}>{SCHOOL_NAME}</Text>
            <Text style={styles.schoolInfoSubtitle}>Enter your {SCHOOL_NAME.split(' ').pop()} email</Text>
          </View>

          {/* EMAIL STAGE */}
          {stage === "email" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter your school email"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={setEmail}
                editable={serverOnline !== false}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  (!email || loading || serverOnline === false) && styles.buttonDisabled
                ]}
                onPress={handleEmailSubmit}
                disabled={!email || loading || serverOnline === false}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Sending..." : "Send Verification Code"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* CODE STAGE */}
          {stage === "code" && (
            <>
              <TouchableOpacity 
                onPress={handleBackPress}
                style={styles.backButton}
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>

              <Text style={styles.stageTitle}>Enter the 6-digit Verification Code</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter verification code"
                placeholderTextColor="#ccc"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCodeSubmit}
                disabled={loading || !code}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Verifying..." : "Verify Code"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleEmailSubmit}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}

          {/* PASSWORD STAGE */}
          {stage === "password" && (
            <>
              <TouchableOpacity 
                onPress={handleBackPress}
                style={styles.backButton}
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>

              <Text style={styles.stageTitle}>Enter Your Password</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#ccc"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handlePasswordSubmit}
                disabled={loading || !password}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Logging in..." : "Login"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ERROR AND STATUS MESSAGES */}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    justifyContent: 'center',
    minHeight: '100%',
  },
  titleRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBubble: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  offlineRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  statusText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  schoolInfoBox: {
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#4caf50',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  schoolInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  schoolInfoSubtitle: {
    fontSize: 13,
    color: '#558b2f',
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  status: {
    color: '#2e7d32',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
  resendText: {
    color: '#2e7d32',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
  },
});