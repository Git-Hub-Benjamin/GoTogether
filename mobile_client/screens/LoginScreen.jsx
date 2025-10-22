import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS } from '../utils/api.js';
import statesData from '../assets/us_states.json';

const API_URL = ENDPOINTS.AUTH;
const SERVER_URL = ENDPOINTS.SERVER;

export default function LoginScreen() {
  const router = useRouter();
  const { login, requestNotificationPermissions } = useAuth();
  const [serverOnline, setServerOnline] = useState(null);
  const [stage, setStage] = useState("email");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [schoolPickerVisible, setSchoolPickerVisible] = useState(false);

  // DEBUG SECTION - auto-populate for testing (comment out to disable)
  useEffect(() => {
    setSelectedState("Utah");
    setSelectedSchool("Utah State University");
    setEmail("a@usu.edu");
  }, []);
  // END DEBUG SECTION

  useEffect(() => {
    console.log("\n\n\t--- Run node updateNgrokUrl.js to refresh ngrok URL ---\n\n");

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch schools when state changes
  useEffect(() => {
    if (!selectedState) {
      setSchools([]);
      setSelectedSchool("");
      return;
    }

    const fetchSchools = async () => {
      setSchoolsLoading(true);
      try {
        const res = await fetch(
          `${ENDPOINTS.SCHOOLS}/${encodeURIComponent(selectedState)}`
        );
        const data = await res.json();
        if (res.ok) {
          setSchools(data);
        } else {
          setSchools([]);
        }
      } catch (err) {
        console.error("Error fetching schools:", err);
        setSchools([]);
      } finally {
        setSchoolsLoading(false);
      }
    };

    fetchSchools();
  }, [selectedState]);

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
    if (!selectedSchool || !selectedState) {
      setError("Please select your state and university first.");
      return;
    }
    if (!email) {
      setError("Please enter your email.");
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
      // First, verify the code
      setStatus("Verifying code...");
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
      
      // Check if server is requesting notification permissions (new user)
      let deviceToken = null;
      if (data.requestNotifications) {
        setStatus("Requesting notification permissions...");
        deviceToken = await requestNotificationPermissions();
        
        // If we got a device token, send it to the server
        if (deviceToken) {
          setStatus("Registering device token...");
          try {
            const tokenRes = await fetch(`${API_URL}/check-code`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "x-client-type": "mobile",
                "x-client-platform": Platform.OS
              },
              body: JSON.stringify({ 
                email, 
                code,
                deviceToken 
              }),
            });
            const tokenData = await tokenRes.json();
            if (tokenRes.ok && tokenData.notificationsEnabled) {
              console.log('Device token registered successfully');
            }
          } catch (tokenErr) {
            console.warn('Failed to register device token:', tokenErr);
            // Continue even if token registration fails
          }
        }
      }
      
      setStatus("Login successful!");
      // Save token and user info, then navigate
      await login(data.token, { email, school: selectedSchool, state: selectedState });
      router.replace('dashboard');
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Text style={styles.title}>GoTogether</Text>
              {/* Show bubble next to title when online */}
              {serverOnline === true && (
                <View style={[styles.statusBubble, { backgroundColor: '#2e7d32' }]} />
              )}
            </View>

            <Text style={styles.version}>v1.0</Text>
          </View>

          {/* When offline, show bubble below the version */}
          {serverOnline === null ? (
            <ActivityIndicator size="small" color="#2e7d32" />
          ) : serverOnline === false ? (
            <View style={styles.offlineRow}>
              <View style={[styles.statusBubble, { backgroundColor: '#d32f2f' }]} />
              <Text style={styles.statusText}>⚠️ Server is offline</Text>
            </View>
          ) : null}

          {stage === "email" ? (
            <>
              {/* STATE PICKER */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Select State</Text>
                <TouchableOpacity 
                  style={[
                    styles.pickerButton,
                    serverOnline === false && styles.pickerButtonDisabled
                  ]}
                  onPress={() => serverOnline !== false && setStatePickerVisible(true)}
                  disabled={serverOnline === false}
                >
                  <Text style={[
                    styles.pickerButtonText,
                    !selectedState && styles.placeholderText,
                    serverOnline === false && styles.disabledText
                  ]}>
                    {selectedState || "Choose a state..."}
                  </Text>
                </TouchableOpacity>
              </View>

            {/* STATE PICKER MODAL */}
            {statePickerVisible && (
            <Modal
              visible={true}
              transparent
              animationType="slide"
              onRequestClose={() => setStatePickerVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setStatePickerVisible(false)}>
                      <Text style={styles.modalHeaderButton}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={statesData}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.pickerItem,
                          selectedState === item && styles.pickerItemSelected
                        ]}
                        onPress={() => {
                          setSelectedState(item);
                          setSelectedSchool(""); // Reset school when state changes
                          setStatePickerVisible(false);
                        }}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          selectedState === item && styles.pickerItemTextSelected
                        ]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>
            )}

              {/* SCHOOL PICKER */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Select School</Text>
                <TouchableOpacity 
                  style={[
                    styles.pickerButton,
                    (!selectedState || serverOnline === false) && styles.pickerButtonDisabled
                  ]}
                  onPress={() => selectedState && serverOnline !== false && setSchoolPickerVisible(true)}
                  disabled={!selectedState || serverOnline === false}
                >
                  <Text style={[
                    styles.pickerButtonText,
                    !selectedSchool && styles.placeholderText,
                    (!selectedState || serverOnline === false) && styles.disabledText
                  ]}>
                    {schoolsLoading ? "Loading schools..." : selectedState ? (selectedSchool || "Choose a school...") : "Select state first"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SCHOOL PICKER MODAL */}
              {schoolPickerVisible && (
              <Modal
                visible={true}
                transparent
                animationType="slide"
                onRequestClose={() => setSchoolPickerVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={() => setSchoolPickerVisible(false)}>
                        <Text style={styles.modalHeaderButton}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={schools.map(s => s.name).sort()}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.pickerItem,
                            selectedSchool === item && styles.pickerItemSelected
                          ]}
                          onPress={() => {
                            setSelectedSchool(item);
                            setSchoolPickerVisible(false);
                          }}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            selectedSchool === item && styles.pickerItemTextSelected
                          ]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              </Modal>
              )}

              {/* EMAIL INPUT */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>School Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    (!(selectedState && selectedSchool) || serverOnline === false) && styles.inputDisabled
                  ]}
                  placeholder={selectedState && selectedSchool ? "Enter your email" : "Select state and school first"}
                  placeholderTextColor={selectedState && selectedSchool ? "#999" : "#ccc"}
                  value={email}
                  onChangeText={setEmail}
                  editable={!!(selectedState && selectedSchool && serverOnline !== false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (!selectedState || !selectedSchool || !email || loading || serverOnline === false) && styles.buttonDisabled
                ]}
                onPress={handleEmailSubmit}
                disabled={!selectedState || !selectedSchool || !email || loading || serverOnline === false}
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  statusBubble: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
  },
  pickerButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  disabledText: {
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalHeaderButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    color: '#2e7d32',
    fontWeight: '600',
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
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
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
});