import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useColorScheme } from '../hooks/use-color-scheme';
import { ENDPOINTS } from '../utils/api.js';

const API_URL = ENDPOINTS.AUTH;
const SERVER_URL = ENDPOINTS.SERVER;

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const [serverOnline, setServerOnline] = useState(null);
  const [stage, setStage] = useState("email");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkServerStatus = async () => {
    try {
      const res = await fetch(SERVER_URL);
      setServerOnline(res.ok);
    } catch {
      setServerOnline(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!selectedSchool || !selectedState) {
      setError("Please select your state and university first.");
      return;
    }
    setError("");
    setStatus("Sending email...");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          school: selectedSchool,
          state: selectedState,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStatus(data.existing
        ? "Previous code is still valid. Please enter it below."
        : "New verification code sent!");
      setStage("code");
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
    setLoading(false);
  };

  const handleCodeSubmit = async () => {
    setError("");
    setStatus("Verifying...");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/check-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStatus("Login successful!");
      // Handle successful login here
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>GoTogether</Text>
      <Text style={styles.version}>v1.0</Text>
      
      {serverOnline === null ? (
        <ActivityIndicator size="small" color="#2e7d32" />
      ) : (
        <View style={[
          styles.statusBubble, 
          { backgroundColor: serverOnline ? "#2e7d32" : "#d32f2f" }
        ]} />
      )}

      {serverOnline === false && (
        <Text style={styles.error}>⚠️ Server is offline</Text>
      )}

      {stage === "email" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="State"
            value={selectedState}
            onChangeText={setSelectedState}
          />
          <TextInput
            style={styles.input}
            placeholder="University"
            value={selectedSchool}
            onChangeText={setSelectedSchool}
          />
          <TextInput
            style={styles.input}
            placeholder="School Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleEmailSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Sending..." : "Send Verification Code"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity 
            onPress={() => setStage("email")}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Enter verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCodeSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Verifying..." : "Verify Code"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2e7d32',
  },
  version: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  statusBubble: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
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
  },
  status: {
    color: '#2e7d32',
    textAlign: 'center',
    marginTop: 10,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#2e7d32',
    fontSize: 16,
  },
});