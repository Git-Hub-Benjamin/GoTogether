import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import usCities from '../assets/us_cities.json';
import universityColors from '../assets/university_colors.json';

const cityList = usCities.map((c) => `${c.city}, ${c.state_name}`);

// Get school colors or default colors
const getSchoolColors = (schoolName) => {
  const school = universityColors.find(s => s.university.toLowerCase() === schoolName.toLowerCase());
  return school ? school.colors : {
    bg_primary: '#2e7d32',
    button_primary_bg: '#2e7d32',
    button_primary_text: '#ffffff',
    text_primary: '#0F172A',
    text_secondary: '#475569',
  };
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Initialize schoolColors based on user
  const [schoolColors, setSchoolColors] = useState(() => 
    getSchoolColors(user?.school || '')
  );
  const [nearbyRidesNotifs, setNearbyRidesNotifs] = useState(false);
  const [rideUpdatesNotifs, setRideUpdatesNotifs] = useState(false);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromDropdownVisible, setFromDropdownVisible] = useState(false);
  const [toDropdownVisible, setToDropdownVisible] = useState(false);
  const [fromOptions, setFromOptions] = useState([]);
  const [toOptions, setToOptions] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');
  const scrollViewRef = useRef(null);
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);

  // Update school colors when user changes
  useEffect(() => {
    setSchoolColors(getSchoolColors(user?.school || ''));
  }, [user?.school]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNearbyRidesNotifs(parsed.nearbyRidesNotifs || false);
        setRideUpdatesNotifs(parsed.rideUpdatesNotifs || false);
        setFromLocation(parsed.fromLocation || '');
        setToLocation(parsed.toLocation || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const filterCities = (input) => {
    if (!input) return cityList.slice(0, 10);
    const lower = input.toLowerCase();
    return cityList
      .filter((item) => item.toLowerCase().includes(lower))
      .slice(0, 10);
  };

  const handleFromChange = (text) => {
    setFromLocation(text);
    setFromOptions(filterCities(text));
  };

  const handleToChange = (text) => {
    setToLocation(text);
    setToOptions(filterCities(text));
  };

  const handleFromFocus = () => {
    setFromDropdownVisible(true);
    scrollViewRef.current?.scrollTo({ y: 300, animated: true });
  };

  const handleToFocus = () => {
    setToDropdownVisible(true);
    scrollViewRef.current?.scrollTo({ y: 350, animated: true });
  };

  const handleFromSelect = (city) => {
    setFromLocation(city);
    setFromDropdownVisible(false);
  };

  const handleToSelect = (city) => {
    setToLocation(city);
    setToDropdownVisible(false);
  };

  const saveSettings = async () => {
    try {
      const settings = {
        nearbyRidesNotifs,
        rideUpdatesNotifs,
        fromLocation,
        toLocation,
      };
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      setSaveMessage('✓ Settings saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('✗ Error saving settings');
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER WITH BACK ARROW */}
      <View style={[styles.header, { backgroundColor: schoolColors.bg_primary }]}>
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => router.back()}
        >
          <Text style={styles.arrowText}>← Dashboard</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Settings</Text>
        
        <View style={styles.spacer} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>School</Text>
            <Text style={styles.settingValue}>{user?.school || 'Not set'}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Email</Text>
            <Text style={styles.settingValue}>{user?.email || 'Not set'}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>State</Text>
            <Text style={styles.settingValue}>{user?.state || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.notificationItem}>
            <View style={styles.notificationToggleContainer}>
              <Text style={styles.notificationLabel}>Ride Updates</Text>
              <Switch
                value={rideUpdatesNotifs}
                onValueChange={setRideUpdatesNotifs}
                trackColor={{ false: '#767577', true: '#81c784' }}
              />
            </View>
            <Text style={styles.notificationDescription}>Notify me about updates to my rides</Text>
          </View>
          <View style={styles.notificationItem}>
            <View style={styles.notificationToggleContainer}>
              <Text style={styles.notificationLabel}>Nearby Rides</Text>
              <Switch
                value={nearbyRidesNotifs}
                onValueChange={setNearbyRidesNotifs}
                trackColor={{ false: '#767577', true: '#81c784' }}
              />
            </View>
            <Text style={styles.notificationDescription}>Notify me when rides are found nearby</Text>
          </View>

        </View>

        {nearbyRidesNotifs && (
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferred Locations</Text>
          
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>From Location</Text>
            <TextInput
              ref={fromInputRef}
              style={styles.locationInput}
              placeholder="Enter departure city"
              value={fromLocation}
              onChangeText={handleFromChange}
              onFocus={handleFromFocus}
            />
            {fromDropdownVisible && fromOptions.length > 0 && (
              <FlatList
                data={fromOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => handleFromSelect(item)}
                  >
                    <Text style={styles.dropdownOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            )}
          </View>

          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>To Location</Text>
            <TextInput
              ref={toInputRef}
              style={styles.locationInput}
              placeholder="Enter destination city"
              value={toLocation}
              onChangeText={handleToChange}
              onFocus={handleToFocus}
            />
            {toDropdownVisible && toOptions.length > 0 && (
              <FlatList
                data={toOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => handleToSelect(item)}
                  >
                    <Text style={styles.dropdownOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            )}
          </View>
        </View>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            nearbyRidesNotifs && styles.saveButtonCompact,
            { backgroundColor: schoolColors.button_primary_bg }
          ]}
          onPress={saveSettings}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>

        {saveMessage ? (
          <Text style={styles.saveMessage}>{saveMessage}</Text>
        ) : null}

        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backArrow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  arrowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 50,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  settingItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  notificationItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  notificationToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  notificationDescription: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  locationContainer: {
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  saveButton: {
    marginTop: 24,
    marginHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonCompact: {
    marginTop: 8,
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveMessage: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    color: '#059669',
  },
  appInfoSection: {
    marginTop: 32,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  appInfoVersion: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '400',
  },
});

